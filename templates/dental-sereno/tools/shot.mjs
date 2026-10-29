// Real-browser verification over CDP. Start headless Chrome first:
//   chrome.exe --headless=new --hide-scrollbars --remote-debugging-port=9223 --user-data-dir=<scratch> about:blank
// then, with a static server on 8125 serving the Website-Collection root:
//   node tools/shot.mjs desktop | tablet | mobile [reduced]
// Writes viewport screenshots to tools/shots/ and prints measurements as JSON.

import { writeFile, mkdir } from 'node:fs/promises';

const mode = process.argv[2] || 'desktop';
const reduced = process.argv[3] === 'reduced';
const base = process.env.BASE || 'http://localhost:8125/templates/dental-sereno/';
const port = process.env.CDP || '9223';
const tag = mode + (reduced ? '-rm' : '');
const vp = mode === 'mobile' ? { width: 390, height: 844, mobile: true, deviceScaleFactor: 2 }
  : mode === 'tablet' ? { width: 834, height: 1112, mobile: true, deviceScaleFactor: 2 }
  : { width: 1440, height: 900, mobile: false, deviceScaleFactor: 1 };

await mkdir('tools/shots', { recursive: true });

const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map(); let loaded;
const errors = [];
ws.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
  if (d.method === 'Page.loadEventFired') loaded?.();
  if (d.method === 'Log.entryAdded' && d.params.entry.level === 'error') errors.push(d.params.entry.text);
  if (d.method === 'Runtime.exceptionThrown') errors.push(String(d.params.exceptionDetails.text + ' ' + (d.params.exceptionDetails.exception?.description || '')));
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
  await evaluate('document.fonts.ready.then(() => true)');
  await sleep(1500);
};
const scrollTo = async (y) => {
  await evaluate(`(() => { window.scrollTo({ top: ${y}, behavior: 'instant' }); return true; })()`);
  await sleep(900);
};
const topOf = async (sel) => evaluate(`(() => { const e = document.querySelector('${sel}'); if (!e) return null; const r = e.getBoundingClientRect(); return Math.round(r.top + scrollY); })()`);

const audit = async () => evaluate(`(() => {
  const de = document.documentElement;
  const heads = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => +h.tagName[1]);
  let jump = null;
  for (let i = 1; i < heads.length; i++) if (heads[i] - heads[i-1] > 1) jump = heads[i-1] + '->' + heads[i];
  const gridMix = [];
  document.querySelectorAll('*').forEach(g => {
    if (getComputedStyle(g).display !== 'grid') return;
    const kids = [...g.children].filter(c => { const s = getComputedStyle(c); return s.position !== 'absolute' && s.display !== 'contents'; });
    const placed = kids.filter(c => getComputedStyle(c).gridColumnStart !== 'auto');
    if (placed.length && placed.length !== kids.length) gridMix.push((g.className || g.tagName) + ' ' + placed.length + '/' + kids.length);
  });
  const small = [...document.querySelectorAll('a,button,input,select,textarea')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.width < 24 || r.height < 24); }).map(e => (e.textContent || e.name || '').trim().slice(0, 30));
  return {
    title: document.title, h1: document.querySelectorAll('h1').length, headingJump: jump,
    overflow: de.scrollWidth > de.clientWidth + 1 ? de.scrollWidth : 0, height: de.scrollHeight,
    noAlt: [...document.images].filter(i => !i.hasAttribute('alt')).length,
    brokenImg: [...document.images].filter(i => i.complete && i.naturalWidth === 0).map(i => i.getAttribute('src')),
    lazyAbove: [...document.images].filter(i => i.loading === 'lazy' && i.getBoundingClientRect().top < innerHeight).length,
    fonts: [...new Set([...document.fonts].filter(f => f.status === 'loaded').map(f => f.family))],
    og: !!document.querySelector('meta[property="og:image"]'), canonical: document.querySelector('link[rel=canonical]')?.href,
    favicon: !!document.querySelector('link[rel="icon"]'), jsonld: !!document.querySelector('script[type="application/ld+json"]'),
    smallTargets: small, gridMix,
    demoWords: /\\b(demo|fictional|placeholder|lorem|AI-generated)\\b/i.test(document.body.innerText)
  };
})()`);

// ── home ────────────────────────────────────────────────────────────────
await goto('index.html');
out.pages.index = await audit();
await shot('00-hero');
const visitTop = await topOf('#visit');
const stageTop = await topOf('[data-visit]');
out.pages.index.pinned = await evaluate(`document.querySelector('[data-visit]').classList.contains('is-pinned')`);
out.pages.index.scrollTriggers = await evaluate(`typeof ScrollTrigger !== 'undefined' ? ScrollTrigger.getAll().length : -1`);
if (out.pages.index.pinned) {
  const st = await evaluate(`(() => { const t = ScrollTrigger.getAll().find(s => s.pin); return t ? { start: Math.round(t.start), end: Math.round(t.end) } : null; })()`);
  out.pages.index.pin = st;
  const span = st.end - st.start;
  out.pages.index.clock = {};
  for (const [name, f] of [['01-visit-00', 0.0], ['02-visit-30', 0.3], ['03-visit-60', 0.6], ['04-visit-85', 0.85], ['05-visit-100', 1.0]]) {
    await scrollTo(st.start + span * f + 2);
    await sleep(500);
    out.pages.index.clock[name] = await evaluate(`(() => ({ read: document.querySelector('[data-min]').textContent, hand: document.querySelector('.hand').style.transform, on: document.querySelector('.beat.on time')?.textContent, detailOpacity: getComputedStyle(document.querySelector('.beat.on .what')).opacity }))()`);
    await shot(name);
  }
} else {
  await scrollTo(visitTop - 24); await shot('01-visit-top');
  await scrollTo(stageTop + 300); await shot('02-visit-mid');
  await scrollTo(stageTop + 900); await shot('03-visit-end');
  out.pages.index.clock = await evaluate(`(() => ({ read: document.querySelector('[data-min]').textContent, hand: document.querySelector('.hand').style.transform }))()`);
}
for (const [name, sel] of [['06-cost', '#cost'], ['07-people', '#people'], ['08-place', '#place']]) {
  await scrollTo((await topOf(sel)) - 40); await shot(name);
}
await scrollTo(99999); await shot('09-foot');
out.pages.index.errors = [...errors]; errors.length = 0;

// ── inner pages ─────────────────────────────────────────────────────────
for (const page of ['treatments', 'team', 'new-patients', 'contact']) {
  await goto(page + '.html');
  out.pages[page] = await audit();
  await shot(`${page}-top`);
  const h = out.pages[page].height;
  await scrollTo(Math.round(h * 0.35)); await shot(`${page}-mid`);
  await scrollTo(Math.round(h * 0.7)); await shot(`${page}-low`);
  await scrollTo(99999); await shot(`${page}-end`);
  if (page === 'contact') {
    // the enquiry form composes a WhatsApp link; data-hold keeps it from navigating during the test
    out.pages.contact.form = await evaluate(`(() => { const f = document.querySelector('[data-enquiry]'); f.setAttribute('data-hold', '');
      f.elements.name.value = 'Test Name'; f.elements.phone.value = '9123 4567'; f.elements.when.value = 'Saturday morning'; f.elements.message.value = 'A chipped front tooth.';
      f.requestSubmit(); return { ready: f.getAttribute('data-ready'), out: f.querySelector('[data-out]').textContent, href: location.href }; })()`);
    await scrollTo((await topOf('[data-enquiry]')) - 120); await shot('contact-form-filled');
  }
  out.pages[page].errors = [...errors]; errors.length = 0;
}

// ── keyboard pass on the home page ──────────────────────────────────────
if (mode === 'desktop' && !reduced) {
  await goto('index.html');
  const order = [];
  for (let i = 0; i < 14; i++) {
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    await sleep(60);
    order.push(await evaluate(`(() => { const e = document.activeElement; const cs = getComputedStyle(e); return (e.tagName + ' ' + (e.textContent || e.getAttribute('aria-label') || '').trim().replace(/\\s+/g,' ').slice(0, 28) + ' | outline ' + cs.outlineStyle + ' ' + cs.outlineWidth); })()`));
    if (i === 2) await shot('10-focus-nav');
  }
  out.pages.index.tabOrder = order;
}

await writeFile(`tools/shots/${tag}.json`, JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
ws.close();
