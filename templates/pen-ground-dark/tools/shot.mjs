// Real-browser verification over CDP. Start headless Chrome first:
//   "/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new \
//     --hide-scrollbars --remote-debugging-port=9222 --user-data-dir=<scratch> about:blank
// then: node tools/shot.mjs [desktop|mobile] [reduced] [port]
// Writes viewport screenshots to tools/shots/ and prints measurements as JSON.

import { writeFile, mkdir } from 'node:fs/promises';

const mode = process.argv[2] || 'desktop';
const reduced = process.argv[3] === 'reduced';
const port = process.argv[4] || '8151';
const base = `http://127.0.0.1:${port}/templates/pen-ground-dark/`;
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
  if (d.method === 'Runtime.exceptionThrown') logs.push(String(d.params.exceptionDetails.text + ' ' + (d.params.exceptionDetails.exception?.description || '')));
};
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result?.result?.value;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');
await send('Emulation.setDeviceMetricsOverride', vp);
if (vp.mobile) {
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await send('Emulation.setEmulatedMedia', { features: [
    { name: 'pointer', value: 'coarse' }, { name: 'hover', value: 'none' },
    { name: 'any-pointer', value: 'coarse' }, { name: 'any-hover', value: 'none' },
    ...(reduced ? [{ name: 'prefers-reduced-motion', value: 'reduce' }] : [])
  ] });
} else if (reduced) {
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
}

const out = { mode, reduced, vp, pages: {} };

const shot = async (name) => {
  const { result } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await writeFile(`tools/shots/${tag}-${name}.png`, Buffer.from(result.data, 'base64'));
};

const goto = async (page) => {
  const loadP = new Promise((r) => (loaded = r));
  await send('Page.navigate', { url: base + page + '?v=' + Date.now() });
  await loadP;
  await evaluate('document.fonts.ready');
  await sleep(1800);
};

const scrollTo = async (y) => {
  await evaluate(`(() => { if (window.lenis) window.lenis.scrollTo(${y}, { immediate: true, force: true });
    window.scrollTo({ top: ${y}, behavior: 'instant' }); return true; })()`);
  await sleep(900);
};
const topOf = async (sel) => evaluate(`(() => { const e = document.querySelector('${sel}'); if (!e) return null;
  const r = e.getBoundingClientRect(); return Math.round(r.top + scrollY); })()`);

const audit = async () => evaluate(`(() => {
  const de = document.documentElement;
  const heads = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => +h.tagName[1]);
  let jump = null;
  for (let i = 1; i < heads.length; i++) if (heads[i] - heads[i-1] > 1) jump = heads[i-1] + '->' + heads[i];
  const gridMix = [];
  document.querySelectorAll('*').forEach(g => {
    if (getComputedStyle(g).display !== 'grid') return;
    const kids = [...g.children].filter(c => { const s = getComputedStyle(c); return s.position !== 'absolute' && s.display !== 'contents' && s.display !== 'none'; });
    const placed = kids.filter(c => getComputedStyle(c).gridColumnStart !== 'auto');
    if (placed.length && placed.length !== kids.length) gridMix.push((g.className || g.tagName) + ' ' + placed.length + '/' + kids.length);
  });
  const wr = [...document.querySelectorAll('.wr')].map(w => ({ mm: w.style.getPropertyValue('--mm').trim(), h: w.getBoundingClientRect().height }));
  const badWr = wr.filter(w => Math.abs(w.h - parseFloat(w.mm) * 10) > 0.6);
  const small = [...document.querySelectorAll('a, button, input, select, textarea, label.choice')].filter(e => {
    const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.height < 44 || r.width < 44); }).map(e => (e.tagName + '.' + (e.className || '') + ' ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height)).trim());
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
    gridMix, wr: wr.length, badWr, small,
    lenis: !!window.lenis, js: de.classList.contains('js')
  };
})()`);

// ── index ───────────────────────────────────────────────────────────
await goto('index.html');
out.pages.index = await audit();
await shot('00-hero');
for (const [name, sel] of [['01-stamped', '#stamped'], ['02-why', '#why'], ['03-hand', '#why .frame--bleed'], ['04-touch', '#touch'], ['05-grinds', '#grinds'], ['06-specimen', '.specimen'], ['07-sheet', '#sheet'], ['08-pen', '#pen']]) {
  const t = await topOf(sel);
  if (t === null) { out.pages.index['missing:' + sel] = true; continue; }
  await scrollTo(Math.max(0, t - 70));
  await shot(name);
}
await scrollTo(await evaluate('document.documentElement.scrollHeight'));
await shot('09-foot');
out.pages.index.keyboard = await evaluate(`(() => {
  const els = [...document.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])')];
  return { stops: els.length, hidden: els.filter(e => { const r = e.getBoundingClientRect();
    return r.width === 0 && r.height === 0 && !e.classList.contains('skip'); }).length };
})()`);
out.pages.index.revealed = await evaluate(`(() => ({ total: document.querySelectorAll('.reveal, .reveal-frame, .split').length, in: document.querySelectorAll('.reveal.in, .reveal-frame.in, .split.in').length }))()`);

// ── grinds ──────────────────────────────────────────────────────────
await goto('grinds.html');
out.pages.grinds = await audit();
await shot('10-grinds-top');
for (const [name, sel] of [['11-round', '#round'], ['12-stub', '#stub'], ['13-italic', '#italic'], ['14-needle', '#needle'], ['15-oblique', '#oblique'], ['16-architect', '#architect'], ['17-not', '#not'], ['18-choose', '#choose']]) {
  const t = await topOf(sel);
  if (t === null) { out.pages.grinds['missing:' + sel] = true; continue; }
  await scrollTo(Math.max(0, t - 70));
  await shot(name);
}
out.pages.grinds.revealed = await evaluate(`(() => ({ total: document.querySelectorAll('.reveal, .reveal-frame, .split').length, in: document.querySelectorAll('.reveal.in, .reveal-frame.in, .split.in').length }))()`);

// ── order ───────────────────────────────────────────────────────────
await goto('order.html');
out.pages.order = await audit();
await shot('20-order-top');
const f = await topOf('.order');
await scrollTo(Math.max(0, f - 70)); await shot('21-order-form');
await scrollTo(Math.max(0, f + 500)); await shot('22-order-form-2');
// drive the form: pick a grind, fill, submit — the receipt must appear
out.pages.order.form = await evaluate(`(async () => {
  const stub = document.querySelector('input[name="grind"][value="stub"]'); stub.click();
  const sel = document.querySelector('#width');
  const opts = [...sel.options].map(o => o.textContent);
  document.querySelector('#name').value = 'Test Name';
  document.querySelector('#email').value = 'not-an-email';
  document.querySelector('[data-order] .btn').click();
  await new Promise(r => setTimeout(r, 200));
  const err = document.querySelector('#email-err').textContent;
  document.querySelector('#email').value = 'someone@example.com';
  document.querySelector('#line').value = 'The quick brown fox';
  document.querySelector('[data-order] .btn').click();
  await new Promise(r => setTimeout(r, 600));
  const rec = document.querySelector('[data-receipt]');
  return { stubOptions: opts, errShown: err, receiptShown: !rec.hidden, ref: rec.querySelector('.ref').textContent,
    grind: rec.querySelector('[data-r-grind]').textContent, mail: rec.querySelector('[data-r-mail]').getAttribute('href').slice(0, 80) };
})()`);
await sleep(600);
await shot('23-order-receipt');
const t3 = await topOf('.trio');
await scrollTo(Math.max(0, t3 - 70)); await shot('24-order-after');
await scrollTo(await evaluate('document.documentElement.scrollHeight')); await shot('25-order-foot');

out.consoleErrors = logs;
console.log(JSON.stringify(out, null, 2));
ws.close();
