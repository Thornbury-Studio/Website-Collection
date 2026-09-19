// Real-browser verification over CDP. Spawns its own headless Chrome, so nothing else needs to run
// except the static server (node tools/serve.mjs).
//
//   node tools/shot.mjs <url> <desktop|mobile> <name> [full]
//
// Writes tools/shots/<name>-<mode>-*.png, prints console errors/exceptions, page overflow,
// focus-ring state after Tab, and the results of the checks in tools/checks.js as JSON.
import { spawn } from 'node:child_process';
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [url, mode = 'desktop', name = 'page', full] = process.argv.slice(2);
if (!url) { console.error('usage: node tools/shot.mjs <url> <desktop|mobile> <name> [full]'); process.exit(1); }
const vp = mode === 'mobile'
  ? { width: 390, height: 844, mobile: true, deviceScaleFactor: 2 }
  : { width: 1440, height: 900, mobile: false, deviceScaleFactor: 1 };
const port = 9300 + Math.floor(Math.random() * 500);
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
  '--remote-debugging-port=' + port, '--user-data-dir=' + join(tmpdir(), 'kiam-shot-' + port),
  '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', 'about:blank'
], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 40; i++) {
  try { target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json(); break; }
  catch { await sleep(250); }
}
if (!target) { chrome.kill(); throw new Error('chrome did not start'); }
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map(); const log = []; let loaded;
ws.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
  if (d.method === 'Page.loadEventFired') loaded?.();
  if (d.method === 'Runtime.exceptionThrown') log.push('EXCEPTION ' + (d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text));
  if (d.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(d.params.type)) log.push(d.params.type.toUpperCase() + ' ' + d.params.args.map((a) => a.value ?? a.description).join(' '));
  if (d.method === 'Log.entryAdded' && ['error', 'warning'].includes(d.params.entry.level)) log.push('LOG ' + d.params.entry.level + ' ' + d.params.entry.text + ' ' + (d.params.entry.url || ''));
};
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result?.result?.value;

await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');
await send('Emulation.setDeviceMetricsOverride', { width: vp.width, height: vp.height, deviceScaleFactor: vp.deviceScaleFactor, mobile: vp.mobile });
if (vp.mobile) {
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'pointer', value: 'coarse' }, { name: 'hover', value: 'none' }, { name: 'any-pointer', value: 'coarse' }, { name: 'any-hover', value: 'none' }] });
}
const loadP = new Promise((r) => (loaded = r));
await send('Page.navigate', { url });
await loadP;
await evaluate('document.fonts.ready.then(() => true)');
await sleep(2600); // the hero fill animation runs 1.1 s + stagger

await mkdir('tools/shots', { recursive: true });
const shot = async (suffix, clip) => {
  const params = { format: 'png', captureBeyondViewport: !!clip };
  if (clip) params.clip = clip;
  const { result } = await send('Page.captureScreenshot', params);
  await writeFile(`tools/shots/${name}-${mode}-${suffix}.png`, Buffer.from(result.data, 'base64'));
};

const out = { url, mode, innerWidth: await evaluate('innerWidth'), dpr: await evaluate('devicePixelRatio') };
out.overflow = await evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth');
out.docHeight = await evaluate('document.documentElement.scrollHeight');
out.fonts = await evaluate(`[...document.fonts].filter(f => f.status === 'loaded').map(f => f.family + ' ' + f.style).join(', ')`);

// shared checks
try {
  const checks = await readFile('tools/checks.js', 'utf8');
  out.checks = await evaluate(`(() => { ${checks} })()`);
} catch (e) { out.checks = 'no checks.js: ' + e.message; }

await shot('00');
if (full) {
  const h = Math.min(out.docHeight, 16000);
  await shot('full', { x: 0, y: 0, width: vp.width, height: h, scale: 1 });
} else {
  let y = vp.height, n = 1;
  while (y < out.docHeight - 40 && n < 14) {
    await evaluate(`window.scrollTo({top:${y}, behavior:'instant'}); true`);
    await sleep(350);
    await shot(String(n).padStart(2, '0'));
    y += vp.height; n++;
  }
}

// keyboard: reset the focus start point with a real click on empty ground, Tab twice, read the ring
await evaluate(`window.scrollTo({top:0, behavior:'instant'}); document.activeElement && document.activeElement.blur(); true`);
await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 4, y: Math.round(vp.height * 0.5), button: 'left', clickCount: 1 });
await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 4, y: Math.round(vp.height * 0.5), button: 'left', clickCount: 1 });
for (let i = 0; i < 2; i++) {
  await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
}
out.focus = await evaluate(`(() => { const a = document.activeElement; const cs = getComputedStyle(a); return { el: a.tagName + '.' + a.className, text: (a.textContent || '').trim().slice(0, 40), focusVisible: a.matches(':focus-visible'), outline: cs.outlineStyle + ' ' + cs.outlineWidth + ' ' + cs.outlineColor }; })()`);
out.console = log;
console.log(JSON.stringify(out, null, 1));
await send('Page.close');
ws.close();
chrome.kill();
