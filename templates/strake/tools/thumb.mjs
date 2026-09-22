// Captures the hub thumbnail from the live page over CDP (headless Chrome on :9222, see shot.mjs).
//   node tools/thumb.mjs [url]  -> tools/shots/thumb-1440.png ; then grade it with tools/thumb.py
import { writeFile, mkdir } from 'node:fs/promises';
const url = process.argv[2] || 'http://localhost:8123/templates/strake/index.html';
await mkdir('tools/shots', { recursive: true });
const target = await (await fetch('http://127.0.0.1:9222/json/new?about:blank', { method: 'PUT' })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map(); let loaded;
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } if (d.method === 'Page.loadEventFired') loaded?.(); };
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
const loadP = new Promise((r) => (loaded = r));
await send('Page.navigate', { url });
await loadP; await new Promise((r) => setTimeout(r, 2500));
const { result } = await send('Page.captureScreenshot', { format: 'png' });
await writeFile('tools/shots/thumb-1440.png', Buffer.from(result.data, 'base64'));
console.log('wrote tools/shots/thumb-1440.png');
ws.close();
