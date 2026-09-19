// Interaction checks over CDP: the six-pack builder, the map ↔ list link, the contact form,
// and the phone nav. Prints one JSON object; anything false or unexpected is a bug.
//   node tools/interact.mjs [base=http://127.0.0.1:4180]
import { spawn } from 'node:child_process';
import { writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const base = process.argv[2] || 'http://127.0.0.1:4180';
const port = 9800 + Math.floor(Math.random() * 100);
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', '--hide-scrollbars', '--no-first-run', '--remote-debugging-port=' + port,
  '--user-data-dir=' + join(tmpdir(), 'kiam-int-' + port), 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 40 && !target; i++) { try { target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json(); } catch { await sleep(250); } }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map(); const log = []; let loaded;
ws.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
  if (d.method === 'Page.loadEventFired') loaded?.();
  if (d.method === 'Runtime.exceptionThrown') log.push('EXCEPTION ' + (d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text));
  if (d.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(d.params.type)) log.push(d.params.type + ' ' + d.params.args.map((a) => a.value ?? a.description).join(' '));
};
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expression) => { const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (r.result?.exceptionDetails) return 'EVAL ERROR: ' + r.result.exceptionDetails.text; return r.result?.result?.value; };
const go = async (url) => { const p = new Promise((r) => (loaded = r)); await send('Page.navigate', { url }); await p; await ev('document.fonts.ready.then(() => true)'); await sleep(300); };
const viewport = (w, h, mobile) => send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile });
const key = async (k, code, vk) => { await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: k, code, windowsVirtualKeyCode: vk }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: vk }); };
const clickEl = async (sel) => {
  const r = JSON.parse(await ev(`(() => { const b = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); return JSON.stringify({x: b.x + b.width/2, y: b.y + b.height/2}); })()`));
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: r.x, y: r.y, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: r.x, y: r.y, button: 'left', clickCount: 1 });
};
const hoverEl = async (sel) => {
  const r = JSON.parse(await ev(`(() => { const b = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); return JSON.stringify({x: b.x + b.width/2, y: b.y + b.height/2}); })()`));
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: r.x, y: r.y });
};
await send('Page.enable'); await send('Runtime.enable');
await mkdir('tools/shots', { recursive: true });
const shot = async (name) => { const { result } = await send('Page.captureScreenshot', { format: 'png' }); await writeFile(`tools/shots/${name}.png`, Buffer.from(result.data, 'base64')); };
const out = {};

// ---- six-pack builder
await viewport(1440, 900, false);
await go(base + '/sodas.html#t-pack');
await ev(`document.querySelector('.pack').scrollIntoView({block:'start', behavior:'instant'}); true`);
await sleep(200);
const inc = (soda, n) => Array.from({ length: n }).reduce((p) => p.then(() => clickEl(`.pack-row[data-soda="${soda}"] .inc`)), Promise.resolve());
await inc('calamansi', 2); await inc('grapefruit', 1); await inc('roselle', 3);
await sleep(100);
out.pack = await ev(`(() => { const o = document.querySelector('.pack-order'); return {
  total: document.querySelector('.pack-total .big').textContent, price: document.querySelector('.pack-price b').textContent,
  note: document.querySelector('.pack-price .note-line').textContent, incDisabled: [...document.querySelectorAll('.pack-row .inc')].every(b => b.disabled),
  orderHref: o.getAttribute('href'), ariaDisabled: o.getAttribute('aria-disabled'), msg: decodeURIComponent((o.getAttribute('href')||'').split('text=')[1]||'') }; })()`);
await shot('int-pack-six');
// try a 7th: must not add
await clickEl('.pack-row[data-soda="pineapple"] .inc'); await sleep(50);
out.packSeventh = await ev(`document.querySelector('.pack-total .big').textContent`);
// remove one → button disabled again
await clickEl('.pack-row[data-soda="roselle"] .dec'); await sleep(50);
out.packFive = await ev(`(() => ({ total: document.querySelector('.pack-total .big').textContent, price: document.querySelector('.pack-price b').textContent, href: document.querySelector('.pack-order').getAttribute('href'), note: document.querySelector('.pack-price .note-line').textContent }))()`);
out.figures = await ev(`(() => [...document.querySelectorAll('[data-fig]')].slice(0, 6).map(e => e.getAttribute('data-fig') + '=' + e.textContent))()`);

// ---- stockists: map ↔ list, keyboard focus on a pin, form validation
await go(base + '/stockists.html');
await ev(`document.querySelector('.map').scrollIntoView({block:'center', behavior:'instant'}); true`); await sleep(150);
await hoverEl('.pin[data-id="s5"]'); await sleep(120);
out.mapHover = await ev(`(() => ({ rowOn: document.querySelector('.stockists li[data-id="s5"]').classList.contains('is-on'), pinOn: document.querySelector('.pin[data-id="s5"]').classList.contains('is-on'), r: getComputedStyle(document.querySelector('.pin[data-id="s5"] circle:not(.hit)')).r }))()`);
await shot('int-map-hover');
await ev(`document.querySelector('.pin[data-id="s2"]').focus(); true`); await sleep(120);
out.mapFocus = await ev(`(() => ({ rowOn: document.querySelector('.stockists li[data-id="s2"]').classList.contains('is-on'), active: document.activeElement.getAttribute('aria-label') }))()`);
await ev(`document.querySelector('.contact-form form').scrollIntoView({block:'center', behavior:'instant'}); true`); await sleep(150);
await clickEl('.contact-form button[type="submit"]'); await sleep(100);
out.formEmpty = await ev(`(() => ({ errs: [...document.querySelectorAll('.field .err')].map(e => e.textContent), focused: document.activeElement.id, invalidCount: document.querySelectorAll('.field.is-invalid').length }))()`);
await shot('int-form-errors');
await ev(`(() => { const f = document.querySelector('.contact-form form'); f.elements.name.value = 'Test'; f.elements.email.value = 'not-an-email'; f.elements.message.value = 'Hello'; return true; })()`);
await clickEl('.contact-form button[type="submit"]'); await sleep(100);
out.formBadEmail = await ev(`(() => ({ errs: [...document.querySelectorAll('.field .err')].map(e => e.textContent), focused: document.activeElement.id }))()`);
await ev(`(() => { const f = document.querySelector('.contact-form form'); f.elements.email.value = 'sip@example.com'; return true; })()`);
await clickEl('.contact-form button[type="submit"]'); await sleep(300);
out.formOk = await ev(`(() => ({ doneHidden: document.querySelector('.form-done').hidden, errs: [...document.querySelectorAll('.field .err')].map(e => e.textContent).join('|') }))()`);

// ---- phone nav
await viewport(390, 844, true);
await go(base + '/story.html');
out.navClosed = await ev(`(() => ({ toggleShown: getComputedStyle(document.querySelector('.nav-toggle')).display !== 'none', navShown: getComputedStyle(document.querySelector('.nav')).display !== 'none', expanded: document.querySelector('.nav-toggle').getAttribute('aria-expanded') }))()`);
await clickEl('.nav-toggle'); await sleep(120);
out.navOpen = await ev(`(() => ({ navShown: getComputedStyle(document.querySelector('.nav')).display !== 'none', expanded: document.querySelector('.nav-toggle').getAttribute('aria-expanded'), label: document.querySelector('.nav-toggle').textContent, linkH: Math.round(document.querySelector('.nav a').getBoundingClientRect().height) }))()`);
await shot('int-nav-open');
await key('Escape', 'Escape', 27); await sleep(80);
out.navEscape = await ev(`(() => ({ navShown: getComputedStyle(document.querySelector('.nav')).display !== 'none', focusOnToggle: document.activeElement.classList.contains('nav-toggle') }))()`);

// ---- reduced motion: bottles full immediately
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
await viewport(1440, 900, false);
await go(base + '/index.html');
out.reducedMotion = await ev(`(() => { const r = document.querySelector('.lineup .bottle .level'); return { animation: getComputedStyle(r).animationName, transform: getComputedStyle(r).transform }; })()`);

out.console = log;
console.log(JSON.stringify(out, null, 1));
ws.close(); chrome.kill();
