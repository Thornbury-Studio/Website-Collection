// Minimal Chrome DevTools Protocol client (Node 22+, built-in WebSocket, no deps).
// Start Chrome first:
//   chrome --headless=new --hide-scrollbars --remote-debugging-port=9333 --user-data-dir=<scratch> about:blank
// Never pass --disable-gpu: the scrubbed film and any frame timing are only honest on the GPU path.

export async function open({ port = 9333, width = 1440, height = 900, mobile = false, dpr = 1, reducedMotion = false } = {}) {
  const t = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0;
  const pending = new Map();
  const listeners = new Map();
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) {
      const { r, j } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? j(new Error(msg.error.message)) : r(msg.result);
    } else if (msg.method && listeners.has(msg.method)) {
      for (const f of listeners.get(msg.method)) f(msg.params);
    }
  };
  const send = (method, params = {}) => new Promise((r, j) => { const i = ++id; pending.set(i, { r, j }); ws.send(JSON.stringify({ id: i, method, params })); });
  const once = (method) => new Promise((r) => { const f = (p) => { listeners.get(method).delete(f); r(p); }; if (!listeners.has(method)) listeners.set(method, new Set()); listeners.get(method).add(f); });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: dpr, mobile });
  if (mobile) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: reducedMotion ? 'reduce' : 'no-preference' }] });

  const page = {
    send,
    on(method, fn) { if (!listeners.has(method)) listeners.set(method, new Set()); listeners.get(method).add(fn); },
    async goto(url, settle = 1500) { const l = once('Page.loadEventFired'); await send('Page.navigate', { url }); await l; await sleep(settle); },
    async eval(expr) {
      const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
      return r.result.value;
    },
    async shot(path, { full = false } = {}) {
      const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: full });
      const fs = await import('node:fs');
      fs.writeFileSync(path, Buffer.from(r.data, 'base64'));
    },
    // real wheel input, so Lenis/ScrollTrigger see the same events a person makes
    async wheel(dy, x = width / 2, y = height / 2) {
      await send('Input.dispatchMouseEvent', { type: 'mouseWheel', x, y, deltaX: 0, deltaY: dy });
    },
    async close() { try { await fetch(`http://127.0.0.1:${port}/json/close/${t.id}`); } catch (e) { /* already gone */ } ws.close(); },
  };
  return page;
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
