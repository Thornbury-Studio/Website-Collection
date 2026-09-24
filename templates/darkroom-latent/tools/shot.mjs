// Real-browser verification over CDP. Start a headless Chrome first:
//   "/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new \
//     --hide-scrollbars --enable-unsafe-swiftshader --use-angle=swiftshader \
//     --remote-debugging-port=9224 --user-data-dir=<scratch> about:blank
// and a static server for the repo root on :8124, then:
//   node tools/shot.mjs [desktop|tablet|mobile] [reduced]
// Writes screenshots to tools/shots/ (gitignored) and prints the audit as
// JSON. Walks one sheet through the whole bench: house settings, expose,
// develop, fix, lights, hang — then the rest of the page.

import { writeFile, mkdir } from 'node:fs/promises';

const mode = process.argv[2] || 'desktop';
const reduced = process.argv[3] === 'reduced';
const base = process.env.BASE || 'http://127.0.0.1:8124/templates/darkroom-latent/';
const tag = mode + (reduced ? '-rm' : '');
const VP = {
  desktop: { width: 1400, height: 900, mobile: false, deviceScaleFactor: 1 },
  tablet: { width: 768, height: 1024, mobile: true, deviceScaleFactor: 2 },
  mobile: { width: 375, height: 812, mobile: true, deviceScaleFactor: 2 },
  og: { width: 1200, height: 630, mobile: false, deviceScaleFactor: 1 },
  thumb: { width: 1440, height: 900, mobile: false, deviceScaleFactor: 1 }
};
const vp = VP[mode];

await mkdir('tools/shots', { recursive: true });

const target = await (await fetch('http://127.0.0.1:9224/json/new?about:blank', { method: 'PUT' })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map(); let loaded;
const logs = [];
ws.onmessage = (m) => {
  const d = JSON.parse(m.data);
  if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); }
  if (d.method === 'Page.loadEventFired') loaded?.();
  if (d.method === 'Log.entryAdded' && (d.params.entry.level === 'error' || d.params.entry.level === 'warning')) logs.push(d.params.entry.level + ': ' + d.params.entry.text + ' ' + (d.params.entry.url || ''));
  if (d.method === 'Runtime.exceptionThrown') logs.push('exception: ' + String(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text));
  if (d.method === 'Runtime.consoleAPICalled' && (d.params.type === 'error' || d.params.type === 'warning'))
    logs.push(d.params.type + ': ' + d.params.args.map((a) => a.value ?? a.description).join(' '));
};
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
const evaluate = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (r.result?.exceptionDetails) logs.push('eval: ' + r.result.exceptionDetails.exception?.description);
  return r.result?.result?.value;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');
await send('Emulation.setDeviceMetricsOverride', vp);
if (vp.mobile) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
const features = [];
if (vp.mobile) features.push({ name: 'pointer', value: 'coarse' }, { name: 'hover', value: 'none' });
if (reduced) features.push({ name: 'prefers-reduced-motion', value: 'reduce' });
if (features.length) await send('Emulation.setEmulatedMedia', { features });

const shot = async (name) => {
  const { result } = await send('Page.captureScreenshot', { format: 'png' });
  await writeFile(`tools/shots/${tag}-${name}.png`, Buffer.from(result.data, 'base64'));
};
const loadP = new Promise((r) => (loaded = r));
await send('Page.navigate', { url: base + 'index.html' });
await loadP;
await evaluate('document.fonts.ready');
await sleep(1500);

const out = { mode, reduced, vp };
out.audit = await evaluate(`(() => {
  const de = document.documentElement;
  const heads = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => +h.tagName[1]);
  let jump = null;
  for (let i = 1; i < heads.length; i++) if (heads[i] - heads[i-1] > 1) jump = heads[i-1] + '->' + heads[i];
  const wide = [...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); return r.width && r.right > de.clientWidth + 1 && getComputedStyle(e).position !== 'fixed'; })
    .filter(e => !e.closest('.line-list, .u-vh')).slice(0, 8).map(e => e.className || e.tagName);
  const small = [...document.querySelectorAll('button, a')].filter(e => { const r = e.getBoundingClientRect(); return r.width && (r.width < 44 || r.height < 44) && !e.closest('.u-vh') && e.className !== 'skip'; })
    .map(e => (e.className || e.tagName) + ':' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height)).slice(0, 12);
  return {
    title: document.title, h1: document.querySelectorAll('h1').length, headingJump: jump,
    overflow: de.scrollWidth > de.clientWidth + 1 ? de.scrollWidth : 0, wide, small,
    height: de.scrollHeight,
    noAlt: [...document.images].filter(i => !i.hasAttribute('alt')).length,
    brokenImg: [...document.images].filter(i => i.complete && i.naturalWidth === 0 && i.loading !== 'lazy').map(i => i.getAttribute('src')),
    fonts: [...new Set([...document.fonts].filter(f => f.status === 'loaded').map(f => f.family))],
    gl: !document.querySelector('[data-bench]').classList.contains('no-gl'),
    live: document.querySelector('[data-bench]').classList.contains('is-live'),
    canvas: (c => c.width + 'x' + c.height)(document.querySelector('[data-canvas]')),
    // PATTERNS.md: a grid that places any child must place all of them
    gridMix: [...document.querySelectorAll('body *')].filter(g => getComputedStyle(g).display === 'grid').map(g => {
      const kids = [...g.children].filter(c => { const s = getComputedStyle(c); return s.position !== 'absolute' && s.display !== 'contents' && s.display !== 'none'; });
      const fixed = (v) => v !== 'auto' && !/^span/.test(v);
      const placed = kids.filter(c => fixed(getComputedStyle(c).gridColumnStart) || fixed(getComputedStyle(c).gridRowStart));
      return placed.length && placed.length !== kids.length ? (g.className || g.tagName) + ': ' + kids.filter(k => !placed.includes(k)).map(k => k.className || k.tagName).join(',') : null;
    }).filter(Boolean)
  };
})()`);
await shot('00-hero');

const click = (act) => evaluate(`document.querySelector('[data-act="${act}"]').click()`);
const st = () => evaluate(`JSON.stringify((({phase,lampSecs,dev,fix,sheetGrade,lights,fogged,handSecs}) => ({phase,lampSecs:+lampSecs.toFixed(2),dev:+dev.toFixed(1),fix:+fix.toFixed(1),sheetGrade,lights,fogged,handSecs:+handSecs.toFixed(2)}))(window.__latent.state))`);
const until = async (cond, ms = 20000) => { const t = Date.now(); while (Date.now() - t < ms) { if (await evaluate(cond)) return true; await sleep(150); } return false; };
const toBench = () => evaluate(`(() => { const e = document.querySelector('[data-easel]'); const y = e.getBoundingClientRect().top + scrollY - ${mode === 'mobile' ? 70 : 90}; if (window.lenis) window.lenis.scrollTo(y, { immediate: true }); else scrollTo(0, y); return y; })()`);

out.flow = [];
if (mode === 'mobile' || mode === 'tablet') await toBench();
await click('house');
await sleep(500);
await shot('01-focus');   // the red filter is in on load
// dodge the cobbler's face for part of the exposure
await evaluate(`document.querySelector('[data-tool="dodge"]').click()`);
await click('expose');
await sleep(700);
await evaluate(`(() => { const r = document.querySelector('[data-canvas]').getBoundingClientRect();
  document.querySelector('[data-easel]').dispatchEvent(new PointerEvent('pointermove', { clientX: r.left + r.width * 0.36, clientY: r.top + r.height * 0.36, bubbles: true, pointerType: 'mouse' })); })()`);
await sleep(600);
await shot('02-lamp');
if (mode === 'mobile') {
  // the deck stays pinned while the console scrolls under it
  await evaluate(`(() => { const e = document.querySelector('.acts'); const y = e.getBoundingClientRect().bottom + scrollY - innerHeight + 20; if (window.lenis) window.lenis.scrollTo(y, { immediate: true }); else scrollTo(0, y); })()`);
  await sleep(500);
  out.deck = await evaluate(`(() => { const d = document.querySelector('.easel-deck').getBoundingClientRect(), a = document.querySelector('[data-act="expose"]').getBoundingClientRect(); return { deckTop: Math.round(d.top), deckBottom: Math.round(d.bottom), exposeTop: Math.round(a.top), exposeBottom: Math.round(a.bottom), vh: innerHeight }; })()`);
  await shot('02b-deck');
  await toBench();
}
await evaluate(`document.querySelector('[data-easel]').dispatchEvent(new PointerEvent('pointerleave', { bubbles: false }))`);
await evaluate(`document.querySelector('[data-tool="hand"]').click()`);
await until(`window.__latent.state.phase === 'exposed'`);
out.flow.push(['exposed', await st()]);
await shot('03-latent');
await click('develop');
await until(`window.__latent.state.dev > 22`);
await shot('04-dev-early');
await until(`window.__latent.state.dev > 58`);
out.flow.push(['developed', await st()]);
await shot('05-dev-full');
await click('fix');
await until(`window.__latent.state.phase === 'fixed'`);
await click('lights');
await sleep(700);
out.flow.push(['lights', await st(), await evaluate(`document.querySelector('[data-status]').textContent`)]);
await shot('06-lights');
if (mode === 'og' || mode === 'thumb') {
  // og: developing under safelight reads better than the finished print
  await click('lights'); await click('hang'); await click('house');
  await click('expose'); await until(`window.__latent.state.phase === 'exposed'`);
  await click('develop'); await until(`window.__latent.state.dev > 50`);
  await evaluate(`window.scrollTo(0, 0)`);
  await sleep(300);
  await shot('og');
  ws.close();
  console.log(JSON.stringify({ ...out, logs }, null, 1));
  process.exit(0);
}
await click('hang');
await sleep(300);
out.flow.push(['hung', await evaluate(`document.querySelectorAll('[data-line] li').length`)]);
await click('lights');

// fog a sheet on purpose
await click('expose'); await until(`window.__latent.state.phase === 'exposed'`);
await click('lights'); await click('develop'); await until(`window.__latent.state.dev > 30`);
out.flow.push(['fogged', await st()]);
await shot('07-fogged');
await click('fix'); await until(`window.__latent.state.phase === 'fixed'`);
await click('lights');
await click('sheet');
// test strip
await click('strip');
await until(`window.__latent.state.phase === 'exposed'`, 60000);
await click('develop'); await until(`window.__latent.state.dev > 60`);
await click('fix'); await until(`window.__latent.state.phase === 'fixed'`);
await click('lights');
out.flow.push(['strip', await st(), await evaluate(`[...document.querySelectorAll('[data-strip-labels] button')].map(b => b.textContent).join(' ')`)]);
await shot('08-strip');
await click('lights');

const sections = ['.line', '#paper', '.sheet', '.band', '#hire', '#film', '.contact', '#classes', '#visit', '.foot'];
for (let i = 0; i < sections.length; i++) {
  const y = await evaluate(`(() => { const e = document.querySelector('${sections[i]}'); if (!e) return null; return Math.max(0, Math.round(e.getBoundingClientRect().top + scrollY - 70)); })()`);
  if (y === null) continue;
  await evaluate(`(() => { if (window.lenis) window.lenis.scrollTo(${y}, { immediate: true }); else window.scrollTo(0, ${y}); window.dispatchEvent(new Event('scroll')); })()`);
  await sleep(1300);
  await shot(`1${i}-${sections[i].replace(/[#.]/g, '')}`);
}
out.audit2 = await evaluate(`(() => { const de = document.documentElement; return { overflow: de.scrollWidth > de.clientWidth + 1 ? de.scrollWidth : 0,
  brokenImg: [...document.images].filter(i => i.complete && i.naturalWidth === 0).map(i => i.getAttribute('src')) }; })()`);

ws.close();
console.log(JSON.stringify({ ...out, logs }, null, 1));
process.exit(0);
