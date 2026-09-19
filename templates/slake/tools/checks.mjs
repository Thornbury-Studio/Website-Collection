// Extra live checks over CDP: fallback engine, reduced motion, web vitals, console errors.
// node tools/checks.mjs [url]
const url = process.argv[2] || 'http://localhost:4173/';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function page(setup) {
  const target = await (await fetch('http://127.0.0.1:9222/json/new?about:blank', { method: 'PUT' })).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
  let id = 0; const pending = new Map(); let loaded; const console_ = [];
  ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
    if (d.method === 'Page.loadEventFired') loaded?.();
    if (d.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(d.params.type)) console_.push(d.params.type + ': ' + d.params.args.map((a) => a.value || a.description).join(' '));
    if (d.method === 'Runtime.exceptionThrown') console_.push('exception: ' + d.params.exceptionDetails.text + ' ' + (d.params.exceptionDetails.exception?.description || '')); };
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result?.result?.value;
  await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await setup?.(send);
  const lp = new Promise((r) => (loaded = r)); await send('Page.navigate', { url }); await lp; await sleep(2500);
  return { send, ev, console_, close: async () => { await send('Page.close'); ws.close(); } };
}
const out = {};

// 1. Fallback engine: kill the native animation with !important and make CSS.supports deny it, then read --heat from the JS path
{
  const p = await page(async (send) => {
    await send('Page.addScriptToEvaluateOnNewDocument', { source: `
      const s = CSS.supports.bind(CSS); CSS.supports = (q, v) => /animation-timeline/.test(q) ? false : (v === undefined ? s(q) : s(q, v));
      document.addEventListener('DOMContentLoaded', () => { const st = document.createElement('style'); st.textContent = ':root{animation:none !important}'; document.head.appendChild(st); });` });
  });
  const y = async (f) => p.ev(`(() => { const r = document.querySelector('.stage').getBoundingClientRect(); const top = r.top + scrollY; return Math.round(top + (r.height + innerHeight) * ${f} - innerHeight); })()`);
  const readAt = async (f) => { await p.ev(`window.scrollTo({top:${await y(f)}, behavior:'instant'}); true`); await sleep(400); return p.ev(`getComputedStyle(document.documentElement).getPropertyValue('--heat').trim() + ' | ' + getComputedStyle(document.body).backgroundColor`); };
  out.fallback = { native: await p.ev(`CSS.supports('(animation-timeline: view()) and (animation-range: entry)')`), at30: await readAt(0.30), at50: await readAt(0.50), at70: await readAt(0.70), at90: await readAt(0.90) };
  out.fallbackConsole = p.console_;
  await p.close();
}

// 2. Reduced motion: videos hidden, posters shown, nothing playing
{
  const p = await page(async (send) => { await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] }); });
  out.reducedMotion = await p.ev(`(() => { const c = document.querySelector('.furnace__video'), po = document.querySelector('.pour');
    return { coalsDisplay: getComputedStyle(c).display, coalsPaused: c.paused, pourDisplay: getComputedStyle(po).display, pourPaused: po.paused,
      coalsPoster: getComputedStyle(document.querySelector('.furnace__poster')).display, pourPoster: getComputedStyle(document.querySelector('.pour-poster')).display,
      smooth: getComputedStyle(document.documentElement).scrollBehavior }; })()`);
  await p.close();
}

// 3. Vitals + console on a normal load
{
  const p = await page(async (send) => {
    await send('Page.addScriptToEvaluateOnNewDocument', { source: `
      window.__lcp = []; window.__cls = 0;
      new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__lcp.push({ t: Math.round(e.startTime), el: e.element ? e.element.tagName + '.' + e.element.className : null, url: (e.url||'').split('/').pop() }))).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) window.__cls += e.value; })).observe({ type: 'layout-shift', buffered: true });` });
  });
  await sleep(1000);
  out.vitals = await p.ev(`(() => { const n = performance.getEntriesByType('navigation')[0]; const res = performance.getEntriesByType('resource');
    return { lcp: window.__lcp.at(-1), cls: +window.__cls.toFixed(4), domContentLoaded: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd),
      transferKB: Math.round(res.reduce((a, r) => a + (r.transferSize || 0), 0) / 1024), requests: res.length,
      videoBytesKB: Math.round(res.filter((r) => /\.mp4/.test(r.name)).reduce((a, r) => a + (r.transferSize || 0), 0) / 1024),
      fonts: document.fonts.check('900 20px "Bodoni Moda"') && document.fonts.check('500 14px Archivo') }; })()`);
  out.console = p.console_;
  await p.close();
}
// 4. The footage toggle: a real click on the header button pauses both clips and flips its label; a second click resumes
{
  const p = await page();
  const rect = await p.ev(`(() => { const r = document.querySelector('.top__motion').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height }; })()`);
  const click = async () => { for (const type of ['mousePressed', 'mouseReleased']) await p.send('Input.dispatchMouseEvent', { type, x: rect.x, y: rect.y, button: 'left', clickCount: 1 }); await sleep(300); };
  const read = () => p.ev(`(() => { const b = document.querySelector('.top__motion'); return { label: b.textContent, pressed: b.getAttribute('aria-pressed'), coalsPaused: document.querySelector('.furnace__video').paused, hidden: b.hidden }; })()`);
  const before = await read(); await click(); const after = await read(); await click(); const again = await read();
  out.motionToggle = { hit: { w: Math.round(rect.w), h: Math.round(rect.h) }, before, afterFirstClick: after, afterSecondClick: again };
  await p.close();
}
console.log(JSON.stringify(out, null, 1));
