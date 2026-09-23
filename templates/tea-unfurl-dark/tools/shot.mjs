// Real-browser verification over CDP (no dependencies). Start the repo's
// static server and a headless Chrome first:
//   PORT=8141 node templates/foundry-harlowe/src/serve.mjs
//   chrome --headless=new --hide-scrollbars --remote-debugging-port=9241 --user-data-dir=<scratch> about:blank
// then, from this folder:
//   node tools/shot.mjs [desktop|mobile] [reduced]      screenshots + audit JSON
//   node tools/shot.mjs sweep                           overflow at 320..1440 on every page
// Screenshots land in tools/shots/ (gitignored). The stage is shot at each
// cupping note by scrolling to where the page's own scrub puts that second.

import { writeFile, mkdir } from 'node:fs/promises';

const CDP = process.env.CDP || '9241';
const SITE = process.env.SITE || 'http://127.0.0.1:8141';
const mode = process.argv[2] || 'desktop';
const reduced = process.argv.includes('reduced');
const base = SITE + '/templates/tea-unfurl-dark/';
const tag = mode + (reduced ? '-rm' : '');
const PAGES = ['index.html', 'garden.html', 'brew.html', 'tin.html'];

await mkdir('tools/shots', { recursive: true });

const target = await (await fetch(`http://127.0.0.1:${CDP}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map(); let loaded;
const logs = [];
ws.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
  if (d.method === 'Page.loadEventFired') loaded?.();
  if (d.method === 'Log.entryAdded' && d.params.entry.level === 'error') logs.push(d.params.entry.text + ' ' + (d.params.entry.url || ''));
  if (d.method === 'Runtime.exceptionThrown') logs.push(String(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text));
  if (d.method === 'Runtime.consoleAPICalled' && (d.params.type === 'error' || d.params.type === 'warning'))
    logs.push(d.params.args.map((a) => a.value ?? a.description).join(' '));
};
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.result?.exceptionDetails) return { error: r.result.exceptionDetails.exception?.description };
  return r.result?.result?.value;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');
await send('Network.enable');
await send('Network.setCacheDisabled', { cacheDisabled: true });

const setViewport = async (width, height, mobile) => {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: mobile ? 2 : 1, mobile });
  await send('Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: mobile ? 5 : 0 });
  const features = [];
  if (mobile) features.push({ name: 'pointer', value: 'coarse' }, { name: 'hover', value: 'none' },
    { name: 'any-pointer', value: 'coarse' }, { name: 'any-hover', value: 'none' });
  features.push({ name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference' });
  await send('Emulation.setEmulatedMedia', { features });
};

const goto = async (page, wait = 1800) => {
  const loadP = new Promise((r) => (loaded = r));
  await send('Page.navigate', { url: base + page });
  await loadP;
  await evaluate('document.fonts.ready');
  await sleep(wait);
};
const shot = async (name) => {
  const { result } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await writeFile(`tools/shots/${tag}-${name}.png`, Buffer.from(result.data, 'base64'));
};
const scrollTo = async (y, wait = 900) => {
  await evaluate(`(() => { if (window.lenis) window.lenis.scrollTo(${y}, { immediate: true });
    else window.scrollTo({ top: ${y}, behavior: 'instant' }); window.dispatchEvent(new Event('scroll')); return true; })()`);
  await sleep(wait);
};
const topOf = async (sel) => evaluate(`(() => { const e = document.querySelector('${sel}'); if (!e) return null;
  const r = e.getBoundingClientRect(); return Math.round(r.top + scrollY); })()`);

const audit = () => evaluate(`(() => {
  const de = document.documentElement;
  const heads = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => +h.tagName[1]);
  let jump = null;
  for (let i = 1; i < heads.length; i++) if (heads[i] - heads[i-1] > 1) jump = heads[i-1] + '->' + heads[i];
  const imgs = [...document.images];
  const small = [...document.querySelectorAll('a, button, input, summary, select')].filter(e => {
    const r = e.getBoundingClientRect(); if (!r.width || !r.height) return false;
    if (e.closest('.u-vh') || e.classList.contains('skip')) return false;
    if (e.tagName === 'A' && getComputedStyle(e).display === 'inline') return false;
    return r.height < 43.5 || (r.width < 43.5 && e.type !== 'range');
  }).map(e => (e.getAttribute('aria-label') || e.textContent || e.id || e.type).trim().slice(0, 30) + ' ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height));
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
    smallTargets: small.slice(0, 12)
  };
})()`);

const out = { mode, reduced, pages: {} };

if (mode === 'sweep') {
  const res = {};
  for (const w of (process.argv[3] ? process.argv[3].split(',').map(Number) : [320, 375, 414, 768, 1024, 1440])) {
    await setViewport(w, 900, w < 768);
    for (const p of PAGES) {
      await goto(p, 900);
      const h = await evaluate('document.documentElement.scrollHeight');
      let worst = 0, who = null;
      for (const f of [0, 0.25, 0.5, 0.75, 1]) {
        await scrollTo(Math.round(h * f), 350);
        const o = await evaluate(`(() => { const de = document.documentElement; const ov = de.scrollWidth - de.clientWidth;
          if (ov <= 0) return [0, null];
          const bad = [...document.querySelectorAll('body *')].filter(e => e.getBoundingClientRect().right > de.clientWidth + 1).slice(0, 3)
            .map(e => e.tagName + '.' + e.className); return [ov, bad]; })()`);
        if (o[0] > worst) { worst = o[0]; who = o[1]; }
      }
      res[`${w}/${p}`] = worst ? [worst, who] : 0;
    }
  }
  console.log(JSON.stringify({ sweep: res, consoleErrors: logs }, null, 2));
  ws.close();
  process.exit(0);
}

const vp = mode === 'mobile' ? [390, 844, true] : [1440, 900, false];
await setViewport(...vp);

// ── index: the stage at each note ────────────────────────────────────────
await goto('index.html', 2500);
out.pages.index = await audit();
await shot('00-first');
out.pages.index.stage = {};
const marks = await evaluate('STEEP.MARKS.map(m => m.t)');
const st = await evaluate('window.__stage && window.__stage.st ? window.__stage.st() : null');
const T = await evaluate('STEEP.STAGE.seconds');
for (const t of reduced ? [180] : [...marks.map(x => Math.min(180, x + 3)), 115]) {
  if (st) {
    const p = 0.035 + (t / T) * (1 - 0.07);
    await scrollTo(Math.round(st.start + p * (st.end - st.start)), 1600);
  } else await scrollTo(0, 800);
  const name = `01-stage-${String(t).padStart(3, '0')}`;
  out.pages.index.stage[name] = await evaluate(`(() => ({
    t: window.__stage && Math.round(window.__stage.t()),
    loaded: window.__stage && window.__stage.loaded ? window.__stage.loaded() : null,
    set: window.__stage && window.__stage.set ? window.__stage.set() : null,
    backing: window.__stage && window.__stage.backing ? window.__stage.backing() : null,
    clock: document.querySelector('[data-clock]').textContent,
    head: document.querySelector('[data-head]').textContent,
    liquor: document.querySelector('[data-liquor]').textContent,
    live: document.querySelector('[data-summary]').textContent.slice(0, 60),
    wdth: document.querySelector('[data-stage]').style.getPropertyValue('--wdth'),
    film: document.querySelector('[data-stage]').classList.contains('is-film')
  }))()`);
  await shot(name);
}
const after = await evaluate(`(() => { const s = document.querySelector('[data-stage]'); return Math.round(s.getBoundingClientRect().bottom + scrollY); })()`);
const docH = await evaluate('document.documentElement.scrollHeight');
let k = 0;
for (let y = after; y < docH; y += vp[1] * 0.9) {
  await scrollTo(Math.round(y), 1100);
  await shot(`02-after-${k++}`);
}

// ── the other pages ─────────────────────────────────────────────────────
for (const page of PAGES.slice(1)) {
  await goto(page);
  const key = page.replace('.html', '');
  out.pages[key] = await audit();
  const h = await evaluate('document.documentElement.scrollHeight');
  let i = 0;
  for (let y = 0; y < h; y += vp[1] * 0.9) {
    await scrollTo(Math.round(y), 1000);
    await shot(`10-${key}-${String(i++).padStart(2, '0')}`);
  }
  if (key === 'tin') {
    out.pages.tin.order = await evaluate(`(() => {
      const f = document.querySelector('[data-order]'); if (!f) return null;
      f.querySelector('[data-step="1"]').click();
      const t = [...f.querySelectorAll('[data-t]')].map(e => e.dataset.t + '=' + e.textContent.trim());
      return t;
    })()`);
  }
}

out.consoleErrors = logs;
console.log(JSON.stringify(out, null, 2));
ws.close();
