// Real-browser verification over CDP. Start headless Chrome first:
//   chrome.exe --headless=new --hide-scrollbars --remote-debugging-port=9224 --user-data-dir=<scratch> about:blank
// then, with a static server serving the Website-Collection root (BASE):
//   node tools/shot.mjs desktop | wide | mobile [reduced]
// Writes viewport screenshots to $SHOTS (keep it outside the repo: full-size PNGs
// run to 150+ MB) and prints measurements as JSON.

import { writeFile, mkdir } from 'node:fs/promises';

const mode = process.argv[2] || 'desktop';
const reduced = process.argv[3] === 'reduced';
const base = process.env.BASE || 'http://localhost:8126/templates/wedding-onetake/';
const port = process.env.CDP || '9224';
const tag = mode + (reduced ? '-rm' : '');
const vp = mode === 'mobile' ? { width: 390, height: 844, mobile: true, deviceScaleFactor: 2 }
  : mode === 'wide' ? { width: 2560, height: 1440, mobile: false, deviceScaleFactor: 1.5 }
  : { width: 1440, height: 900, mobile: false, deviceScaleFactor: 1 };

const dir = process.env.SHOTS;
if (!dir) throw new Error('set SHOTS to a folder outside the repo');
await mkdir(dir, { recursive: true });

const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map(); let loaded;
const errors = [];
ws.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
  if (d.method === 'Page.loadEventFired') loaded?.();
  if (d.method === 'Log.entryAdded' && d.params.entry.level === 'error') errors.push(d.params.entry.text + ' ' + (d.params.entry.url || ''));
  if (d.method === 'Runtime.exceptionThrown') errors.push(String(d.params.exceptionDetails.text + ' ' + (d.params.exceptionDetails.exception?.description || '')));
};
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result?.result?.value;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable'); await send('Network.enable');
await send('Network.setCacheDisabled', { cacheDisabled: true });
await send('Emulation.setDeviceMetricsOverride', vp);
if (vp.mobile) await send('Emulation.setTouchEmulationEnabled', { enabled: true });
if (reduced) await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });

const out = { mode, reduced, vp, pages: {} };
const shot = async (name) => {
  const { result } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await writeFile(`${dir}/${tag}-${name}.png`, Buffer.from(result.data, 'base64'));
};
const goto = async (page) => {
  const loadP = new Promise((r) => (loaded = r));
  await send('Page.navigate', { url: base + page + (page === 'index.html' ? (process.env.Q || '') : '') });
  await loadP;
  await evaluate('document.fonts.ready.then(() => true)');
  await sleep(1200);
};
const scrollTo = async (y, settle = 700) => {
  await evaluate(`(() => { window.scrollTo({ top: ${y}, behavior: 'instant' }); return true; })()`);
  await sleep(settle);
};

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
  const small = [...document.querySelectorAll('a,button,input,select,textarea')].filter(e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && s.visibility !== 'hidden' && (r.width < 24 || r.height < 24); }).map(e => (e.textContent || e.name || '').trim().slice(0, 30));
  return {
    title: document.title, h1: document.querySelectorAll('h1').length, headingJump: jump,
    overflow: de.scrollWidth > de.clientWidth + 1 ? de.scrollWidth : 0, height: de.scrollHeight,
    noAlt: [...document.images].filter(i => !i.hasAttribute('alt')).length,
    brokenImg: [...document.images].filter(i => i.complete && i.currentSrc && i.naturalWidth === 0).map(i => i.getAttribute('src')),
    fonts: [...new Set([...document.fonts].filter(f => f.status === 'loaded').map(f => f.family))],
    og: !!document.querySelector('meta[property="og:image"]'), canonical: document.querySelector('link[rel=canonical]')?.href,
    favicon: !!document.querySelector('link[rel="icon"]'),
    smallTargets: small, gridMix,
    demoWords: /\\b(demo|fictional|placeholder|lorem|stock|generated)\\b/i.test(document.body.innerText)
  };
})()`);

// ── the edit ────────────────────────────────────────────────────────────
await goto('index.html');
out.pages.index = await audit();
// first view = everything requested before the load event (the film is fetched after it)
out.pages.index.firstView = await evaluate(`(() => { const n = performance.getEntriesByType('navigation')[0]; const e = performance.getEntriesByType('resource').filter(r => r.startTime < n.loadEventEnd);
  return { kb: Math.round((e.reduce((a, r) => a + (r.transferSize || 0), 0) + (n ? n.transferSize : 0)) / 1024), n: e.length, list: e.map(r => r.name.split('/').slice(-2).join('/') + ' ' + Math.round(r.transferSize / 1024)) }; })()`);
await shot('00-hero');

if (!reduced) {
  // roll the film and wait until it is decoded and showing
  await evaluate('window.CIRCLETAKE && window.CIRCLETAKE.start()');
  const t0 = Date.now();
  let st;
  for (let k = 0; k < 120; k++) { st = await evaluate('window.CIRCLETAKE.state()'); if (st.rolling) break; await sleep(250); }
  out.pages.index.film = { src: st.src, rolling: st.rolling, readyMs: Date.now() - t0 };

  // scrub test: 90 small scroll steps at ~60 Hz through shots 1-2, recording how long each seek takes
  await evaluate(`(() => { const v = document.querySelector('[data-film]'); window.__seek = []; let t; v.addEventListener('seeking', () => t = performance.now()); v.addEventListener('seeked', () => window.__seek.push(performance.now() - t)); return true; })()`);
  const a = st.anchors;
  for (let k = 0; k <= 90; k++) {
    await evaluate(`window.scrollTo({ top: ${Math.round(a[1] + (a[3] - a[1]) * k / 90)}, behavior: 'instant' })`);
    await sleep(16);
  }
  await sleep(600);
  out.pages.index.scrub = await evaluate(`(() => { const s = window.__seek.slice().sort((x, y) => x - y); const q = p => Math.round(s[Math.min(s.length - 1, Math.floor(p * s.length))] || 0);
    return { seeks: s.length, median: q(0.5), p90: q(0.9), max: Math.round(s[s.length - 1] || 0) }; })()`);

  // one frame from the middle of every shot
  out.pages.index.shots = [];
  for (let i = 0; i < 7; i++) {
    const y = i === 0 ? 0 : Math.round(st.anchors[i] + (st.anchors[i + 1] - st.anchors[i]) * 0.55);
    await scrollTo(y, 1100);
    out.pages.index.shots.push(await evaluate(`(() => { const s = window.CIRCLETAKE.state(); return { y: scrollY, shot: s.shot, t: +s.shown.toFixed(2), ct: +s.currentTime.toFixed(2), tc: document.querySelector('[data-tc]').textContent, on: document.querySelector('.reel a.is-on')?.textContent.trim() }; })()`));
    await shot(`0${i + 1}-shot-${i}`);
  }
  // panels at reading position
  for (const id of ['films', 'coverage', 'twice', 'packages', 'delivery', 'enquire']) {
    const y = await evaluate(`Math.round(document.querySelector('#${id} .panel').getBoundingClientRect().top + scrollY - innerHeight * 0.16)`);
    await scrollTo(y, 1300);
    await shot(`10-read-${id}`);
  }
} else {
  for (const id of ['films', 'coverage', 'packages', 'enquire']) {
    const y = await evaluate(`Math.round(document.querySelector('#${id}').getBoundingClientRect().top + scrollY)`);
    await scrollTo(y); await shot(`10-read-${id}`);
  }
  out.pages.index.filmRequested = await evaluate(`performance.getEntriesByType('resource').some(r => /edit-.*\\.mp4/.test(r.name))`);
}

// enquiry composes a WhatsApp link; data-hold stops it opening during the test
out.pages.index.form = await evaluate(`(() => { const f = document.querySelector('[data-ask]'); f.setAttribute('data-hold', '');
  f.requestSubmit(); const firstErr = f.querySelector('[data-err]').textContent;
  f.elements.names.value = 'Mei Ling and Daniel'; f.elements.date.value = '2027-03-13'; f.elements.where.value = 'Tea ceremony in Bishan, banquet in town';
  f.requestSubmit(); return { firstErr, ready: decodeURIComponent(f.getAttribute('data-ready') || ''), out: f.querySelector('[data-out]').textContent }; })()`);
await scrollTo(99999, 1200); await shot('20-end');
out.pages.index.errors = [...errors]; errors.length = 0;

// ── keyboard pass ───────────────────────────────────────────────────────
if (mode === 'desktop' && !reduced) {
  await goto('index.html');
  const order = [];
  for (let i = 0; i < 16; i++) {
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    await sleep(80);
    order.push(await evaluate(`(() => { const e = document.activeElement; const cs = getComputedStyle(e); return (e.tagName + ' ' + (e.textContent || e.getAttribute('aria-label') || '').trim().replace(/\\s+/g,' ').slice(0, 28) + ' | ' + cs.outlineStyle + ' ' + cs.outlineWidth); })()`));
    if (i === 5) await shot('30-focus-cta');
    if (i === 10) await shot('31-focus-reel');
  }
  out.pages.index.tabOrder = order;
  // Enter on a reel link: lands on that section with the film at its cut
  await evaluate(`document.querySelector('[data-cut="4"]').focus()`);
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
  await sleep(3500);
  out.pages.index.reelJump = await evaluate(`(() => ({ hash: location.hash, focus: document.activeElement.textContent.slice(0, 30), shot: window.CIRCLETAKE.state().shot }))()`);
  await shot('32-reel-jump');
  out.pages.index.errors2 = [...errors]; errors.length = 0;
}

// ── films page ──────────────────────────────────────────────────────────
await goto('films.html');
out.pages.films = await audit();
await shot('40-films-top');
out.pages.films.preview = await evaluate(`(() => new Promise(r => { const b = document.querySelector('.reelrow__play'); b.click(); setTimeout(() => { const v = document.querySelector('[data-preview] video'); r({ playing: !v.paused, t: v.currentTime, pressed: b.getAttribute('aria-pressed') }); }, 1800); }))()`);
await shot('41-films-preview');
await scrollTo(Math.round(out.pages.films.height * 0.5)); await shot('42-films-mid');
out.pages.films.errors = [...errors]; errors.length = 0;

await writeFile(`${dir}/${tag}.json`, JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
await send('Target.closeTarget', { targetId: target.id }).catch(() => {});
ws.close();
