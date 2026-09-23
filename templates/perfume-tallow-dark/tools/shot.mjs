// Real-browser verification over CDP. Start headless Chrome first:
//   "/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new \
//     --hide-scrollbars --enable-unsafe-swiftshader \
//     --remote-debugging-port=9222 --user-data-dir=<scratch> about:blank
// then: node tools/shot.mjs [desktop|mobile] [reduced]
// Writes viewport screenshots to tools/shots/ and prints measurements as JSON.
//
// The Browser pane does not run rAF here, so the WebGL render pass only draws
// under a real headless Chrome. Everything below is therefore the only real
// evidence the mechanic works.

import { writeFile, mkdir } from 'node:fs/promises';

const mode = process.argv[2] || 'desktop';
const reduced = process.argv[3] === 'reduced';
const base = 'http://localhost:8123/templates/perfume-tallow-dark/';
const tag = mode + (reduced ? '-rm' : '');
const vp = mode === 'mobile'
  ? { width: 390, height: 844, mobile: true, deviceScaleFactor: 2 }
  : { width: 1440, height: 900, mobile: false, deviceScaleFactor: 1 };

await mkdir('tools/shots', { recursive: true });

const target = await (await fetch('http://127.0.0.1:9222/json/new?about:blank', { method: 'PUT' })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map(); let loaded;
const logs = [];
ws.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
  if (d.method === 'Page.loadEventFired') loaded?.();
  if (d.method === 'Log.entryAdded' && d.params.entry.level === 'error') logs.push(d.params.entry.text);
  if (d.method === 'Runtime.exceptionThrown') logs.push(String(d.params.exceptionDetails.text));
};
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result?.result?.value;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');
await send('Emulation.setDeviceMetricsOverride', vp);
if (vp.mobile) await send('Emulation.setTouchEmulationEnabled', { enabled: true });
if (reduced) await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });

const out = { mode, reduced, vp, pages: {} };

const shot = async (name) => {
  const { result } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await writeFile(`tools/shots/${tag}-${name}.png`, Buffer.from(result.data, 'base64'));
};

const goto = async (page) => {
  const loadP = new Promise((r) => (loaded = r));
  await send('Page.navigate', { url: base + page });
  await loadP;
  await evaluate('document.fonts.ready');
  await sleep(1600);
};

// Lenis owns the scroll position when it is running, so ask it; otherwise
// fall back to the native call.
const scrollTo = async (y) => {
  await evaluate(`(() => { if (window.lenis) window.lenis.scrollTo(${y}, { immediate: true });
    else window.scrollTo({ top: ${y}, behavior: 'instant' }); return true; })()`);
  await sleep(700);
};
const topOf = async (sel) => evaluate(`(() => { const e = document.querySelector('${sel}'); if (!e) return null;
  const r = e.getBoundingClientRect(); return Math.round(r.top + scrollY); })()`);

// ── audits that run on every page ───────────────────────────────────────
const audit = async () => evaluate(`(() => {
  const de = document.documentElement;
  const heads = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => +h.tagName[1]);
  let jump = null;
  for (let i = 1; i < heads.length; i++) if (heads[i] - heads[i-1] > 1) jump = heads[i-1] + '->' + heads[i];
  // PATTERNS.md: a grid that places any child must place all of them
  const gridMix = [];
  document.querySelectorAll('*').forEach(g => {
    if (getComputedStyle(g).display !== 'grid') return;
    const kids = [...g.children].filter(c => { const s = getComputedStyle(c); return s.position !== 'absolute' && s.display !== 'contents'; });
    const placed = kids.filter(c => getComputedStyle(c).gridColumnStart !== 'auto');
    if (placed.length && placed.length !== kids.length) gridMix.push((g.className || g.tagName) + ' ' + placed.length + '/' + kids.length);
  });
  return {
    title: document.title,
    h1: document.querySelectorAll('h1').length,
    headingJump: jump,
    overflow: de.scrollWidth > de.clientWidth + 1 ? de.scrollWidth : 0,
    height: de.scrollHeight,
    noAlt: [...document.images].filter(i => !i.hasAttribute('alt')).length,
    brokenImg: [...document.images].filter(i => i.complete && i.naturalWidth === 0).map(i => i.getAttribute('src')),
    fonts: [...new Set([...document.fonts].filter(f => f.status === 'loaded').map(f => f.family))],
    og: !!document.querySelector('meta[property="og:image"]'),
    favicon: !!document.querySelector('link[rel="icon"]'),
    year: (document.querySelector('[data-year]') || {}).textContent,
    gridMix
  };
})()`);

// ── index ───────────────────────────────────────────────────────────────
await goto('index.html');
out.pages.index = await audit();
out.pages.index.webgl = await evaluate(`(() => { const s = document.querySelector('.render-stage');
  return { live: s.classList.contains('live'), w: s.querySelector('canvas').width, h: s.querySelector('canvas').height }; })()`);
await shot('00-hero');

const rTop = await topOf('.render');
const rH = await evaluate(`document.querySelector('.render').offsetHeight`);
const span = rH - vp.height;
out.pages.index.render = {};
for (const [name, f] of [['01-render-00', 0.01], ['02-render-35', 0.35], ['03-render-68', 0.68], ['04-render-99', 0.99]]) {
  await scrollTo(rTop + span * f);
  await sleep(500);
  out.pages.index.render[name] = await evaluate(`(() => ({
    v: getComputedStyle(document.documentElement).getPropertyValue('--render').trim(),
    chipTop: document.querySelector('.meniscus-chip').style.top,
    chip: document.querySelector('.meniscus-chip').textContent.replace(/\\s+/g,' ').trim(),
    live: document.getElementById('render-state').textContent,
    ground: getComputedStyle(document.body).backgroundColor
  }))()`);
  await shot(name);
}
for (const [name, sel] of [['05-ledger', '.ledger'], ['06-works', '.stagger'], ['07-frame', '.frame'], ['08-note', '.rendered']]) {
  const t = await topOf(sel);
  if (t === null) continue;
  await scrollTo(Math.max(0, t - 90));
  await shot(name);
}
await scrollTo(await evaluate('document.documentElement.scrollHeight'));
await shot('09-foot');

// keyboard reachability: tab through and confirm every stop is visible
out.keyboard = await evaluate(`(() => {
  const els = [...document.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])')];
  return { stops: els.length, hidden: els.filter(e => { const r = e.getBoundingClientRect();
    return r.width === 0 && r.height === 0 && !e.classList.contains('skip'); }).length };
})()`);

// ── the other pages ─────────────────────────────────────────────────────
for (const page of ['rendering.html', 'note.html', 'acquire.html']) {
  await goto(page);
  const key = page.replace('.html', '');
  out.pages[key] = await audit();
  await shot(`10-${key}-top`);
  await scrollTo(Math.round((await evaluate('document.documentElement.scrollHeight')) * 0.42));
  await shot(`11-${key}-mid`);
  await scrollTo(await evaluate('document.documentElement.scrollHeight'));
  await shot(`12-${key}-end`);
}

out.consoleErrors = logs;
console.log(JSON.stringify(out, null, 2));
ws.close();
