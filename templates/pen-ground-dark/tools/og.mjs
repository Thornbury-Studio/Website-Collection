// OpenGraph card: a 1200x630 capture of the live hero, written to img/og.png
// (converted to img/og.jpg by tools/og.py). Needs headless Chrome on :9222
// and the static server on :8151 (see shot.mjs).
import { writeFile } from 'node:fs/promises';

const port = process.env.PORT || '8151';
const target = await (await fetch('http://127.0.0.1:9222/json/new?about:blank', { method: 'PUT' })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map(); let loaded;
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } if (d.method === 'Page.loadEventFired') loaded?.(); };
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1200, height: 630, mobile: false, deviceScaleFactor: 1 });
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
const loadP = new Promise((r) => (loaded = r));
await send('Page.navigate', { url: `http://127.0.0.1:${port}/templates/pen-ground-dark/index.html?og=${Date.now()}` });
await loadP;
await send('Runtime.evaluate', { expression: 'document.fonts.ready', awaitPromise: true });
// the card is the hero alone: hide the chrome, let the headline sit on the nib
await send('Runtime.evaluate', { expression: `(() => {
  document.querySelector('.top').style.display = 'none';
  document.querySelector('.hero').style.paddingTop = '0';
  document.querySelector('.hero').style.minHeight = '630px';
  document.querySelector('.hero__head').style.paddingTop = '48px';
  document.querySelector('.hero__foot').style.paddingBottom = '36px';
  return true; })()` });
await new Promise((r) => setTimeout(r, 1500));
const { result } = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 1200, height: 630, scale: 1 } });
await writeFile('img/og.png', Buffer.from(result.data, 'base64'));
console.log('wrote img/og.png');
await send('Target.closeTarget', { targetId: target.id }).catch(() => {});
ws.close();
