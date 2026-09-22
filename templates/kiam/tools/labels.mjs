// Renders the five printed labels from tools/label.html to assets/raw/labels/<soda>.png (1170 x 740)
// with headless Chrome over CDP. Run the static server first: node tools/serve.mjs 4180
import { spawn } from 'node:child_process';
import { writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const base = process.argv[2] || 'http://127.0.0.1:4180';
const port = 9700 + Math.floor(Math.random() * 100);
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--hide-scrollbars', '--no-first-run', '--remote-debugging-port=' + port, '--user-data-dir=' + join(tmpdir(), 'kiam-lbl-' + port), 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target; for (let i = 0; i < 40 && !target; i++) { try { target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json(); } catch { await sleep(250); } }
const ws = new WebSocket(target.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map(); let loaded;
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } if (d.method === 'Page.loadEventFired') loaded?.(); };
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1170, height: 740, deviceScaleFactor: 1, mobile: false });
await mkdir('assets/raw/labels', { recursive: true });
for (const soda of ['calamansi', 'grapefruit', 'pineapple', 'roselle', 'watermelon']) {
  const p = new Promise((r) => (loaded = r));
  await send('Page.navigate', { url: `${base}/tools/label.html?soda=${soda}` });
  await p; await send('Runtime.evaluate', { expression: 'document.fonts.ready.then(() => true)', awaitPromise: true }); await sleep(200);
  const { result } = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 1170, height: 740, scale: 1 } });
  await writeFile(`assets/raw/labels/${soda}.png`, Buffer.from(result.data, 'base64')); console.log('label', soda);
}
ws.close(); chrome.kill();
