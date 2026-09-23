// Renders tools/label.html to a transparent PNG (tools/raw/label.png, 2x)
// and writes where its two boxes sit (tools/raw/label.json), so
// tools/bag.py can print the label onto the pouch and tell the CSS where
// the live date stamp goes. Needs the headless Chrome on :9223 and the
// static server on :8123 (see tools/shot.mjs).
//   node tools/label.mjs

import { writeFile } from 'node:fs/promises';

const url = 'http://127.0.0.1:8123/templates/coffee-bloom-dark/tools/label.html';
const target = await (await fetch('http://127.0.0.1:9223/json/new?about:blank', { method: 'PUT' })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map(); let loaded;
ws.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
  if (d.method === 'Page.loadEventFired') loaded?.();
};
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result?.result?.value;

await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 900, height: 1300, deviceScaleFactor: 2, mobile: false });
await send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
const p = new Promise((r) => (loaded = r));
await send('Page.navigate', { url });
await p;
await evaluate('document.fonts.ready.then(() => new Promise(r => setTimeout(r, 400)))');
const rects = await evaluate(`(() => { const r = (s) => { const b = document.querySelector(s).getBoundingClientRect(); return [b.left, b.top, b.width, b.height]; };
  return { label: r('#label'), roasted: r('#roasted'), batch: r('#batch'), fonts: [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family) }; })()`);
const [x, y, w, h] = rects.label;
const shot = await send('Page.captureScreenshot', { format: 'png', clip: { x, y, width: w, height: h, scale: 1 } });
await writeFile('tools/raw/label.png', Buffer.from(shot.result.data, 'base64'));
await writeFile('tools/raw/label.json', JSON.stringify(rects, null, 2));
console.log(JSON.stringify(rects));
ws.close();
