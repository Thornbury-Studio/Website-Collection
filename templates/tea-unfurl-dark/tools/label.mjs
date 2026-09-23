// Renders tools/label.html to a transparent PNG (tools/raw/label.png, 2x) for
// tools/tin.py to wrap round the tin. Needs a headless Chrome with CDP on
// $CDP (default 9241) and the repo's static server on $SITE (default 8141):
//   PORT=8141 node templates/foundry-harlowe/src/serve.mjs
//   chrome --headless=new --remote-debugging-port=9241 --user-data-dir=<scratch>
//   node tools/label.mjs

import { writeFile } from 'node:fs/promises';

const CDP = process.env.CDP || '9241';
const SITE = process.env.SITE || 'http://127.0.0.1:8141';
const url = SITE + '/templates/tea-unfurl-dark/tools/label.html';
const target = await (await fetch(`http://127.0.0.1:${CDP}/json/new?about:blank`, { method: 'PUT' })).json();
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
await send('Emulation.setDeviceMetricsOverride', { width: 2000, height: 560, deviceScaleFactor: 2, mobile: false });
await send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
const p = new Promise((r) => (loaded = r));
await send('Page.navigate', { url });
await p;
await evaluate('document.fonts.ready.then(() => new Promise(r => setTimeout(r, 400)))');
const info = await evaluate(`(() => { const b = document.querySelector('#label').getBoundingClientRect();
  return { rect: [b.left, b.top, b.width, b.height], fonts: [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family + ' ' + f.style) }; })()`);
const [x, y, w, h] = info.rect;
const shot = await send('Page.captureScreenshot', { format: 'png', clip: { x, y, width: w, height: h, scale: 1 } });
await writeFile('tools/raw/label.png', Buffer.from(shot.result.data, 'base64'));
console.log(JSON.stringify(info));
await fetch(`http://127.0.0.1:${CDP}/json/close/${target.id}`);
ws.close();
