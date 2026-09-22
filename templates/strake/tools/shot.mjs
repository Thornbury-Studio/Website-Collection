// Real-browser verification over CDP. Start headless Chrome first:
//   chrome.exe --headless=new --hide-scrollbars --remote-debugging-port=9222 --user-data-dir=<scratch> about:blank
// then:  node tools/shot.mjs [desktop|mobile] [url]
// Writes viewport screenshots to tools/shots/ and prints measurements as JSON.
import { writeFile, mkdir } from 'node:fs/promises';

const mode = process.argv[2] || 'desktop';
const url = process.argv[3] || 'http://localhost:8123/templates/strake/index.html';
const vp = mode === 'mobile' ? { width: 390, height: 844, mobile: true, deviceScaleFactor: 2 } : { width: 1440, height: 900, mobile: false, deviceScaleFactor: 1 };
await mkdir('tools/shots', { recursive: true });

const target = await (await fetch('http://127.0.0.1:9222/json/new?about:blank', { method: 'PUT' })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map(); let loaded;
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } if (d.method === 'Page.loadEventFired') loaded?.(); };
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result?.result?.value;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: vp.width, height: vp.height, deviceScaleFactor: vp.deviceScaleFactor, mobile: vp.mobile });
if (vp.mobile) await send('Emulation.setTouchEmulationEnabled', { enabled: true });
const loadP = new Promise((r) => (loaded = r));
await send('Page.navigate', { url });
await loadP; await sleep(2000);

const shot = async (name) => {
  const { result } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await writeFile(`tools/shots/${mode}-${name}.png`, Buffer.from(result.data, 'base64'));
};
const scrollTo = async (y) => { await evaluate(`window.scrollTo({top:${y}, behavior:'instant'}); true`); await sleep(600); };
const y = async (sel, frac = 0) => evaluate(`(() => { const r = document.querySelector('${sel}').getBoundingClientRect(); return Math.round(r.top + scrollY + r.height * ${frac}); })()`);

const out = { mode, vp };
out.load = await evaluate(`({ title: document.title, overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth ? document.documentElement.scrollWidth : 0, h: document.documentElement.scrollHeight, native: CSS.supports('animation-timeline: view()'), fonts: [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family), heroCar: (() => { const i = document.querySelector('.hero__car'); return { w: i.clientWidth, src: i.currentSrc.split('/').pop(), complete: i.complete }; })() })`);
await shot('00-hero');
await scrollTo(await y('.facts')); await shot('01-facts');
await scrollTo(await y('#details') - 40); await shot('02-details');
await scrollTo(await y('#materials') - 40); await shot('03-materials');
// heritage: three points through the pinned range
const hTop = await y('#heritage'); const hH = await evaluate(`document.querySelector('#heritage').offsetHeight`);
for (const [n, f] of [['04-heritage-0', 0.02], ['05-heritage-50', 0.5], ['06-heritage-100', 0.98]]) {
  await scrollTo(hTop + (hH - vp.height) * f);
  out[n] = await evaluate(`(() => { const t = document.querySelector('#heritage-track'); const r = t.getBoundingClientRect(); const pin = document.querySelector('.heritage__pin').getBoundingClientRect(); return { trackLeft: Math.round(r.left), trackRight: Math.round(r.right), pinTop: Math.round(pin.top), transform: getComputedStyle(t).transform }; })()`);
  await shot(n);
}
await scrollTo(await y('#press') - 40); await shot('07-press');
await scrollTo(await y('.band')); await shot('08-band');
await scrollTo(await y('#configure') - 40); await shot('09-configure');
// configurator: pick Ebb + bronze, wait for the spring, read the base image
out.cfgBefore = await evaluate(`document.querySelector('#cfg-base').currentSrc.split('/').pop()`);
await evaluate(`(() => { const f = document.querySelector('#cfg-form'); f.elements.paint.value = 'ebb'; f.elements.paint[3].dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
await sleep(180);
out.cfgMid = await evaluate(`(() => { const s = document.querySelector('#cfg-stage'); return { wipe: getComputedStyle(s).getPropertyValue('--wipe').trim(), wiping: s.classList.contains('is-wiping'), next: document.querySelector('#cfg-next').src.split('/').pop() }; })()`);
await shot('10-configure-mid-wipe');
await sleep(1400);
await evaluate(`(() => { const f = document.querySelector('#cfg-form'); f.elements.wheels.value = 'bronze'; f.elements.wheels[1].dispatchEvent(new Event('change', { bubbles: true })); return true; })()`);
await sleep(1800);
out.cfgAfter = await evaluate(`(() => ({ base: document.querySelector('#cfg-base').src.split('/').pop(), wiping: document.querySelector('#cfg-stage').classList.contains('is-wiping'), spec: document.querySelector('#cfg-spec').textContent, price: document.querySelector('#cfg-price').textContent, alt: document.querySelector('#cfg-base').alt }))()`);
await shot('11-configure-ebb-bronze');
await scrollTo(await y('#visit') - 40); await shot('12-visit');
// reserve carries the spec into the form; the form validates
out.form = await evaluate(`(async () => {
  document.querySelector('#cfg-reserve').click(); await new Promise(r => setTimeout(r, 50));
  const f = document.querySelector('#enquiry'); const msg = f.elements.message.value;
  f.requestSubmit(); await new Promise(r => setTimeout(r, 50));
  const invalid = { note: document.querySelector('#enquiry-note').textContent, focused: document.activeElement && document.activeElement.id };
  f.elements.name.value = 'Rowan Hale'; f.elements.email.value = 'rowan@example.com'; f.requestSubmit(); await new Promise(r => setTimeout(r, 50));
  return { msg, invalid, after: document.querySelector('#enquiry-note').textContent, disabled: f.elements.name.disabled };
})()`);
await shot('13-visit-sent');
await scrollTo(await y('.foot')); await shot('14-footer');
// keyboard: Tab from the top, read what has focus and whether it draws an outline
await scrollTo(0);
await evaluate('document.activeElement && document.activeElement.blur(); true');
await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 30, y: 400, button: 'left', clickCount: 1 });
await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 30, y: 400, button: 'left', clickCount: 1 });
const tab = async () => { await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 }); await sleep(60); };
out.tabs = [];
for (let i = 0; i < 4; i++) { await tab(); out.tabs.push(await evaluate(`(() => { const a = document.activeElement; const cs = getComputedStyle(a); return { tag: a.tagName, text: (a.textContent || a.value || '').trim().slice(0, 24), outline: cs.outlineStyle + ' ' + cs.outlineWidth + ' ' + cs.outlineColor }; })()`)); }
await shot('15-focus');
if (vp.mobile) {
  await evaluate(`document.querySelector('.menu').click(); true`); await sleep(400);
  out.menu = await evaluate(`({ expanded: document.querySelector('.menu').getAttribute('aria-expanded'), navVisible: getComputedStyle(document.querySelector('.nav')).display, tap: document.querySelector('.menu').getBoundingClientRect().height })`);
  await shot('16-menu');
  await evaluate(`document.querySelector('.menu').click(); true`);
  out.heritageScroller = await evaluate(`(() => { const p = document.querySelector('.heritage__pin'); return { overflowX: getComputedStyle(p).overflowX, scrollW: p.scrollWidth, clientW: p.clientWidth, position: getComputedStyle(p).position }; })()`);
  out.tapTargets = await evaluate(`[...document.querySelectorAll('a, button, .opt')].map(e => { const r = e.getBoundingClientRect(); return [e.className || e.tagName, Math.round(r.width), Math.round(r.height)]; }).filter(([, w, h]) => h > 0 && (h < 44 || w < 44))`);
}
console.log(JSON.stringify(out, null, 1));
ws.close();
