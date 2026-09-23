// Real-browser verification over CDP. Start a headless Chrome first:
//   "/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new \
//     --hide-scrollbars --enable-unsafe-swiftshader \
//     --remote-debugging-port=9223 --user-data-dir=<scratch> about:blank
// and the repo's static server on :8123, then:
//   node tools/shot.mjs [desktop|mobile] [reduced]
// Writes viewport screenshots to tools/shots/ (gitignored) and prints the
// audit as JSON. The bloom stage is shot at five brew times by scrolling to
// the matching position — the page's own scrub does the rest.

import { writeFile, mkdir } from 'node:fs/promises';

const mode = process.argv[2] || 'desktop';
const reduced = process.argv[3] === 'reduced';
const base = 'http://127.0.0.1:8123/templates/coffee-bloom-dark/';
const tag = mode + (reduced ? '-rm' : '');
const vp = mode === 'mobile'
  ? { width: 390, height: 844, mobile: true, deviceScaleFactor: 2 }
  : { width: 1440, height: 900, mobile: false, deviceScaleFactor: 1 };

await mkdir('tools/shots', { recursive: true });

const target = await (await fetch('http://127.0.0.1:9223/json/new?about:blank', { method: 'PUT' })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map(); let loaded;
const logs = [];
ws.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
  if (d.method === 'Page.loadEventFired') loaded?.();
  if (d.method === 'Log.entryAdded' && d.params.entry.level === 'error') logs.push(d.params.entry.text);
  if (d.method === 'Runtime.exceptionThrown') logs.push(String(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text));
  if (d.method === 'Runtime.consoleAPICalled' && (d.params.type === 'error' || d.params.type === 'warning'))
    logs.push(d.params.args.map((a) => a.value ?? a.description).join(' '));
};
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result?.result?.value;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');
await send('Emulation.setDeviceMetricsOverride', vp);
if (vp.mobile) {
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
}
const features = [];
if (vp.mobile) features.push({ name: 'pointer', value: 'coarse' }, { name: 'hover', value: 'none' });
if (reduced) features.push({ name: 'prefers-reduced-motion', value: 'reduce' });
if (features.length) await send('Emulation.setEmulatedMedia', { features });

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
  await sleep(1800);
};

const scrollTo = async (y) => {
  await evaluate(`(() => { if (window.lenis) window.lenis.scrollTo(${y}, { immediate: true });
    else window.scrollTo({ top: ${y}, behavior: 'instant' }); window.dispatchEvent(new Event('scroll')); return true; })()`);
  await sleep(900);
};
const topOf = async (sel) => evaluate(`(() => { const e = document.querySelector('${sel}'); if (!e) return null;
  const r = e.getBoundingClientRect(); return Math.round(r.top + scrollY); })()`);

const audit = async () => evaluate(`(() => {
  const de = document.documentElement;
  const heads = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => +h.tagName[1]);
  let jump = null;
  for (let i = 1; i < heads.length; i++) if (heads[i] - heads[i-1] > 1) jump = heads[i-1] + '->' + heads[i];
  const imgs = [...document.images];
  return {
    title: document.title,
    h1: document.querySelectorAll('h1').length,
    headingJump: jump,
    overflow: de.scrollWidth > de.clientWidth + 1 ? de.scrollWidth : 0,
    height: de.scrollHeight,
    noAlt: imgs.filter(i => !i.hasAttribute('alt')).length,
    brokenImg: imgs.filter(i => i.complete && i.naturalWidth === 0).map(i => i.getAttribute('src')),
    squashed: imgs.filter(i => { const r = i.getBoundingClientRect(); if (!r.width || !i.naturalWidth) return false;
      const cs = getComputedStyle(i); if (cs.objectFit === 'cover') return false;
      return Math.abs(r.width / r.height - i.naturalWidth / i.naturalHeight) > 0.05; }).map(i => i.getAttribute('src')),
    fonts: [...new Set([...document.fonts].filter(f => f.status === 'loaded').map(f => f.family))],
    og: !!document.querySelector('meta[property="og:image"]'),
    favicon: !!document.querySelector('link[rel="icon"]'),
    year: (document.querySelector('[data-year]') || {}).textContent,
    styleAttrsInSource: null
  };
})()`);

// ── index ───────────────────────────────────────────────────────────────
await goto('index.html');
out.pages.index = await audit();
out.pages.index.shelf = await evaluate(`(document.querySelector('[data-shelf]')||{}).textContent`);
await shot('00-hero');

const sTop = await topOf('[data-bloom]');
const sH = await evaluate(`document.querySelector('[data-bloom]').offsetHeight`);
const span = sH - vp.height;
out.pages.index.stage = {};
for (const tt of (reduced ? [null] : [0, 4.5, 12, 30, 46])) {
  if (tt === null) { await scrollTo(sTop); }
  else await scrollTo(sTop + span * ((tt + 4) / 57));
  await sleep(1200);
  const name = tt === null ? '01-stage-still' : `01-stage-${String(tt).replace('.', '_')}`;
  out.pages.index.stage[name] = await evaluate(`(() => ({
    t: window.__bloom && window.__bloom.t, live: window.__bloom && window.__bloom.live,
    ours: [...document.querySelectorAll('[data-bed="ours"] [data-o]')].map(e => e.textContent.trim()).join(' | '),
    yours: [...document.querySelectorAll('[data-bed="yours"] [data-o]')].map(e => e.textContent.trim()).join(' | '),
    canvas: (c => c.width + 'x' + c.height)(document.querySelector('canvas.bloom-gl'))
  }))()`);
  await shot(name);
}
for (const [name, sel] of [['02-watched', '.watched'], ['03-bag', '.bagband'], ['04-lot', '.lotband']]) {
  const t = await topOf(sel);
  if (t === null) continue;
  await scrollTo(Math.max(0, t - 40));
  await shot(name);
}
await scrollTo(await evaluate('document.documentElement.scrollHeight'));
await shot('05-foot');

// ── the other pages ─────────────────────────────────────────────────────
for (const page of ['lot.html', 'monday.html', 'bag.html']) {
  await goto(page);
  const key = page.replace('.html', '');
  out.pages[key] = await audit();
  await shot(`10-${key}-a`);
  const h = await evaluate('document.documentElement.scrollHeight');
  const stops = [0.2, 0.4, 0.6, 0.8];
  for (let i = 0; i < stops.length; i++) {
    await scrollTo(Math.round(h * stops[i]));
    await shot(`10-${key}-${'bcde'[i]}`);
  }
  if (key === 'bag') {
    out.pages.bag.order = await evaluate(`(() => {
      const f = document.querySelector('[data-order]');
      f.querySelector('[data-step="1"]').click(); f.querySelector('[data-step="1"]').click();
      const t = [...f.querySelectorAll('[data-t]')].map(e => e.dataset.t + '=' + e.textContent.trim());
      return t;
    })()`);
  }
}

out.consoleErrors = logs;
console.log(JSON.stringify(out, null, 2));
ws.close();
