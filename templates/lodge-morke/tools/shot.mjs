// Real-browser verification: real wheel scrolling (Lenis and the film see the
// same input a person makes), screenshots at fixed points of the descent, and
// the non-visual checks DARK.md §4 asks for.
//   node templates/lodge-morke/tools/shot.mjs <label> [desktop|mobile|reduced|stills] [cdpPort]
// Needs tools/serve.mjs on :8732 and Chrome with --remote-debugging-port.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { open, sleep } from './cdp.mjs';

const label = process.argv[2] || 'run';
const kind = process.argv[3] || 'desktop';
const port = +(process.argv[4] || 9333);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, 'shots', label, kind);
fs.mkdirSync(OUT, { recursive: true });

const views = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844, mobile: true, dpr: 2 },
  reduced: { width: 1440, height: 900, reducedMotion: true },
  stills: { width: 1440, height: 900 },
};
const v = views[kind];
const page = await open({ port, ...v });
const errors = [];
page.on('Runtime.exceptionThrown', (p) => errors.push('exception: ' + (p.exceptionDetails.exception?.description || p.exceptionDetails.text)));
page.on('Runtime.consoleAPICalled', (p) => { if (p.type === 'error' || p.type === 'warning') errors.push(p.type + ': ' + p.args.map((a) => a.value ?? a.description).join(' ')); });
await page.send('Log.enable');
page.on('Log.entryAdded', (p) => { if (p.entry.level === 'error' || p.entry.level === 'warning') errors.push('log ' + p.entry.level + ': ' + p.entry.text + (p.entry.url ? ' @ ' + p.entry.url : '')); });

const url = 'http://127.0.0.1:8732/templates/lodge-morke/index.html' + (kind === 'stills' ? '?mode=stills' : '');
await page.goto(url, 2500);
await page.eval(`window.__csp = []; document.addEventListener('securitypolicyviolation', e => window.__csp.push(e.violatedDirective + ' ' + e.blockedURI));`);

// wait for the film (or the fallback) to settle
for (let i = 0; i < 40; i++) {
  const s = await page.eval('window.MORKE && MORKE.state()');
  if (s && (s.mode === 'stills' || document_ready(s))) break;
  await sleep(250);
}
function document_ready(s) { return s.ready && s.film === 'scrub'; }

const report = { kind, viewport: v };
report.stateAtLoad = await page.eval('MORKE.state()');

// non-visual checks
report.static = await page.eval(`(() => {
  const m = (sel) => document.querySelector(sel)?.getAttribute('content') || null;
  const heads = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => h.tagName + ' ' + (h.getAttribute('aria-label') || h.textContent).trim().slice(0, 60));
  let jump = null, prev = 0;
  for (const h of document.querySelectorAll('h1,h2,h3,h4,h5,h6')) { const n = +h.tagName[1]; if (prev && n > prev + 1) jump = h.tagName + ' after H' + prev; prev = n; }
  const imgs = [...document.querySelectorAll('img')].map(i => ({ src: i.getAttribute('src'), alt: i.getAttribute('alt'), decorative: !!i.closest('[aria-hidden="true"]') }));
  return {
    title: document.title, lang: document.documentElement.lang,
    og: ['og:title','og:description','og:image','og:url','og:type','og:site_name','og:image:alt'].map(k => k + '=' + (m('meta[property="' + k + '"]') ? 'yes' : 'MISSING')),
    twitter: m('meta[name="twitter:card"]'), description: !!m('meta[name="description"]'),
    favicon: document.querySelector('link[rel="icon"]')?.getAttribute('href'),
    year: document.querySelector('[data-year]')?.textContent,
    headings: heads, headingJump: jump, h1count: document.querySelectorAll('h1').length,
    imgsMissingAlt: imgs.filter(i => i.alt === null).map(i => i.src),
    overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    docHeight: document.documentElement.scrollHeight,
    fonts: [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family + ' ' + f.weight + ' ' + f.style).filter((x, i, a) => a.indexOf(x) === i),
  };
})()`);

// the descent: real wheel input, screenshot at fixed fractions of the scroll
const stops = (process.env.STOPS || '0,0.12,0.3,0.45,0.52,0.58,0.64,0.7,0.76,0.82,0.9,1').split(',').map(Number);
const max = await page.eval('document.documentElement.scrollHeight - innerHeight');
report.stops = [];
for (const f of stops) {
  const goal = Math.round(max * f);
  for (let guard = 0; guard < 400; guard++) {
    const y = await page.eval('scrollY');
    if (y >= goal - 2 || (f === 1 && y >= max - 2)) break;
    await page.wheel(Math.min(260, Math.max(40, goal - y)));
    await sleep(40);
  }
  await sleep(kind === 'reduced' || kind === 'stills' ? 900 : 1400);
  const s = await page.eval('Object.assign(MORKE.state(), { y: Math.round(scrollY), vis: [...document.querySelectorAll(".film__still")].filter(e => getComputedStyle(e).opacity > 0.5).map(e => e.dataset.still), videoOpacity: getComputedStyle(document.querySelector(".film__video")).opacity })');
  const file = `stop-${String(Math.round(f * 100)).padStart(3, '0')}.png`;
  await page.shot(path.join(OUT, file));
  report.stops.push({ f, file, ...s });
}

// interaction states only reachable by doing them (PATTERNS.md: audit post-interaction states)
report.form = await page.eval(`(async () => {
  const f = document.querySelector('[data-enquire]');
  f.addEventListener('morke:enquire', e => { e.preventDefault(); window.__mailto = e.detail.href; }, { once: true });
  f.elements.guests.value = '3'; f.elements.guests.dispatchEvent(new Event('input', { bubbles: true }));
  f.elements.nights.value = '5'; f.elements.nights.dispatchEvent(new Event('change', { bubbles: true }));
  const est = document.querySelector('[data-estimate]').textContent;
  f.requestSubmit();
  await new Promise(r => setTimeout(r, 100));
  const invalid = [...f.querySelectorAll('[aria-invalid="true"]')].map(i => i.name);
  const msg1 = document.querySelector('[data-done]').textContent;
  f.elements.name.value = 'Ingrid Test'; f.elements.email.value = 'ingrid@example.com';
  f.requestSubmit();
  await new Promise(r => setTimeout(r, 100));
  return { est, invalidWhenEmpty: invalid, msgWhenEmpty: msg1, mailto: (window.__mailto || '').slice(0, 120), done: document.querySelector('[data-done]').textContent.slice(0, 80) };
})()`);
await sleep(400);
await page.shot(path.join(OUT, 'form-sent.png'));

report.csp = await page.eval('window.__csp');
report.errors = errors;
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ kind, stateAtLoad: report.stateAtLoad, static: { ...report.static, fonts: report.static.fonts.length }, stops: report.stops.map(s => [s.f, s.y, s.mode, +(+s.time).toFixed(2), s.chapter, s.vis.join('+') || '-', s.videoOpacity]), form: report.form, csp: report.csp, errors }, null, 1));
await page.close();
