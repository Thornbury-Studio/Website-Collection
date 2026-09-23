// Targeted checks the screenshot pass can't make (same CDP setup as shot.mjs):
//   node tools/probe.mjs reduced   — the slider steps still frames with no scroll pin
//   node tools/probe.mjs context   — lose and restore the canvas context; it must redraw
//   node tools/probe.mjs file      — open index.html over file:// (no server)
import { writeFile, mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const CDP = process.env.CDP || '9241';
const SITE = process.env.SITE || 'http://127.0.0.1:8141';
const what = process.argv[2];
await mkdir('tools/shots', { recursive: true });
const target = await (await fetch(`http://127.0.0.1:${CDP}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map(); let loaded; const logs = [];
ws.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
  if (d.method === 'Page.loadEventFired') loaded?.();
  if (d.method === 'Runtime.exceptionThrown') logs.push(String(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text));
  if (d.method === 'Log.entryAdded' && d.params.entry.level === 'error') logs.push(d.params.entry.text);
};
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (expression) => { const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  return r.result?.exceptionDetails ? { error: r.result.exceptionDetails.exception?.description } : r.result?.result?.value; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const shot = async (name) => { const { result } = await send('Page.captureScreenshot', { format: 'png' });
  await writeFile(`tools/shots/probe-${name}.png`, Buffer.from(result.data, 'base64')); };
await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
const go = async (url) => { const p = new Promise((r) => (loaded = r)); await send('Page.navigate', { url }); await p; await sleep(2500); };
const out = { what };

if (what === 'reduced') {
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await go(SITE + '/templates/tea-unfurl-dark/index.html');
  out.before = await evaluate(`({ mode: __stage.mode, pinned: !!document.querySelector('.pin-spacer'), src: document.querySelector('[data-still]').getAttribute('src'),
    clock: document.querySelector('[data-clock]').textContent, lenis: !!window.lenis })`);
  out.steps = [];
  for (const v of [0, 50, 90, 140]) {
    await evaluate(`(() => { const i = document.querySelector('#steep-t'); i.value = ${v}; i.dispatchEvent(new Event('input', { bubbles: true })); })()`);
    await sleep(700);
    out.steps.push(await evaluate(`({ v: ${v}, src: document.querySelector('[data-still]').getAttribute('src'), ok: document.querySelector('[data-still]').complete && document.querySelector('[data-still]').naturalWidth > 0,
      clock: document.querySelector('[data-clock]').textContent, head: document.querySelector('[data-head]').textContent, live: document.querySelector('[data-summary]').textContent.slice(0, 40) })`));
  }
  await shot('reduced-140');
}

if (what === 'context') {
  await go(SITE + '/templates/tea-unfurl-dark/index.html');
  await sleep(2000);
  const px = `(() => { const c = document.querySelector('[data-film]'); const x = document.createElement('canvas'); x.width = c.width; x.height = c.height;
    const g = x.getContext('2d'); g.drawImage(c, 0, 0); const d = g.getImageData(c.width >> 1, c.height >> 1, 1, 1).data; return [d[0], d[1], d[2]]; })()`;
  out.before = { film: await evaluate(`document.querySelector('[data-stage]').classList.contains('is-film')`), px: await evaluate(px) };
  // Chrome's hook for this: lose, then restore the 2D context
  out.lose = await evaluate(`(() => { const c = document.querySelector('[data-film]'); const x = c.getContext('2d');
    if (!x.isContextLost) return 'no isContextLost';
    c.dispatchEvent(new Event('contextlost', { cancelable: true })); return document.querySelector('[data-stage]').classList.contains('is-film'); })()`);
  // a real restore hands back a cleared backing store: clear it the way the GPU would
  await evaluate(`(() => { const c = document.querySelector('[data-film]'); c.getContext('2d').clearRect(0, 0, c.width, c.height);
    c.dispatchEvent(new Event('contextrestored')); return true; })()`);
  await sleep(600);
  out.after = { film: await evaluate(`document.querySelector('[data-stage]').classList.contains('is-film')`), px: await evaluate(px) };
}

if (what === 'file') {
  await go(pathToFileURL(resolve('index.html')).href);
  out.state = await evaluate(`({ mode: window.__stage && __stage.mode, loaded: window.__stage && __stage.loaded && __stage.loaded(),
    film: document.querySelector('[data-stage]').classList.contains('is-film'), clock: document.querySelector('[data-clock]').textContent,
    fonts: [...document.fonts].filter(f => f.status === 'loaded').length })`);
  await shot('file');
}

out.errors = logs;
console.log(JSON.stringify(out, null, 2));
ws.close();
