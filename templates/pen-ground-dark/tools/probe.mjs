// Ad-hoc probe: node tools/probe.mjs <page> <width> "<expression>"
// Evaluates the expression in a fresh headless-Chrome target at the given width and prints the JSON result.
const page = process.argv[2] || 'index.html';
const width = Number(process.argv[3] || 1440);
const expression = process.argv[4] || 'document.title';
const port = process.env.PORT || '8151';
const mobile = width < 700;
const target = await (await fetch('http://127.0.0.1:9222/json/new?about:blank', { method: 'PUT' })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map(); let loaded;
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } if (d.method === 'Page.loadEventFired') loaded?.(); };
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width, height: mobile ? 844 : 900, mobile, deviceScaleFactor: mobile ? 2 : 1 });
if (mobile) await send('Emulation.setEmulatedMedia', { features: [{ name: 'pointer', value: 'coarse' }, { name: 'hover', value: 'none' }] });
const loadP = new Promise((r) => (loaded = r));
await send('Page.navigate', { url: `http://127.0.0.1:${port}/templates/pen-ground-dark/${page}?v=${Date.now()}` });
await loadP;
await send('Runtime.evaluate', { expression: 'document.fonts.ready', awaitPromise: true });
await new Promise((r) => setTimeout(r, 1500));
const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
console.log(JSON.stringify(r.result?.result?.value ?? r.result, null, 2));
await send('Target.closeTarget', { targetId: target.id }).catch(() => {});
ws.close();
