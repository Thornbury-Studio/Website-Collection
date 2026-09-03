/* ══════════════════════════════════════════════════════════════════
   THORNBURY DIGITAL v2 — orchestrator.
   Boots the core, the chrome, the current page, and the router; runs the
   ignition intro once per session; feeds scroll velocity and shock back
   into CSS custom properties so the DOM distorts with the canvas.
   The engine is imported dynamically so a blocked CDN still leaves a
   working, readable, navigable page on the static fallback.
   ══════════════════════════════════════════════════════════════════ */

import { initPage, cursor, magnet, markNav, splitK, sweep, refitAll } from './ui.js';
import { initRouter } from './router.js';

const html = document.documentElement;
const RM = html.classList.contains('rm');
const MOBILE = matchMedia('(max-width: 760px)').matches || (matchMedia('(pointer: coarse)').matches && innerWidth < 900);
const gsap = window.gsap;
if (gsap && window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

/* ── engine (any failure folds to the static fallback) ─────────── */
const stub = { burst() {}, setPage() {}, resetScroll() {}, state: { shock: 0, vel: 0 }, onFrame: null, ready: false };
let engine = stub;
try {
  const { createEngine } = await import('./engine.js');
  engine = createEngine({ stage: document.getElementById('stage'), page: html.dataset.page || 'home', mobile: MOBILE, rm: RM });
  engine.start();
} catch (err) {
  console.warn('[thornbury] core offline:', err && err.message);
  engine = stub;
  if (window.__tbFold) window.__tbFold();
}
window.TB_READY = true;
clearTimeout(window.__tbWatch);
window.__tb = engine;

/* ── CSS feedback: velocity + shock into custom properties, HUD ─── */
const hudShock = document.getElementById('hudShock');
const hudVel = document.getElementById('hudVel');
const hud = document.getElementById('hud');
const foot = document.querySelector('.foot');
const header = document.getElementById('top');
let cssVel = 0, cssShock = 0, lastY = scrollY, hidY = scrollY, tick = 0;
engine.onFrame = (s) => {
  if (hud && foot && (++tick % 12 === 0)) {
    hud.classList.toggle('is-off', foot.getBoundingClientRect().top < innerHeight - 40);
  }
  if (Math.abs(s.vel - cssVel) > 0.003) {
    cssVel = s.vel;
    html.style.setProperty('--vel', cssVel.toFixed(3));
    html.style.setProperty('--vabs', Math.abs(cssVel).toFixed(3));
  }
  if (Math.abs(s.shock - cssShock) > 0.005) {
    cssShock = s.shock;
    html.style.setProperty('--shock', cssShock.toFixed(3));
    if (hudShock) hudShock.style.setProperty('--v', cssShock.toFixed(3));
  }
  if (hudVel) hudVel.style.setProperty('--v', Math.min(1, Math.abs(s.vel) * 1.4).toFixed(3));
  const y = scrollY;
  if (y > lastY + 4 && y > 120) { if (y - hidY > 40) { header.classList.add('is-hid'); hidY = y; } }
  else if (y < lastY - 4 || y < 120) { header.classList.remove('is-hid'); hidY = y; }
  lastY = y;
};

/* ── chrome (once) ─────────────────────────────────────────────── */
cursor(document.getElementById('cur'));
document.querySelectorAll('.top [data-mag], .foot [data-mag]').forEach(magnet);
markNav();

/* ── page lifecycle ────────────────────────────────────────────── */
let destroyPage = null;
function enter(main, delay) {
  destroyPage = initPage(main, { engine, delay });
  markNav();
  if (window.ScrollTrigger) window.ScrollTrigger.refresh();
}
function leave() {
  if (destroyPage) destroyPage();
  destroyPage = null;
}
setInterval(() => sweep(document), 1200);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(refitAll);

/* ── wipe (route transition) ───────────────────────────────────── */
const wipeEl = document.getElementById('wipe');
const wipeLab = document.getElementById('wipeLabel');
const wipe = {
  cover(name) {
    engine.burst(0.7);
    wipeLab.textContent = name === 'home' ? 'Core' : name;
    if (!gsap || RM) { wipeEl.style.clipPath = 'inset(0% 0% 0% 0%)'; return Promise.resolve(); }
    return new Promise((res) => {
      gsap.timeline({ onComplete: res })
        .set(wipeEl, { clipPath: 'inset(0% 100% 0% 0%)' })
        .to(wipeEl, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.55, ease: 'expo.inOut' })
        .fromTo(wipeLab, { opacity: 0, x: -40 }, { opacity: 1, x: 0, duration: 0.4, ease: 'power3.out' }, '-=0.25');
    });
  },
  reveal() {
    engine.resetScroll();
    if (!gsap || RM) { wipeEl.style.clipPath = 'inset(0% 100% 0% 0%)'; return Promise.resolve(); }
    return new Promise((res) => {
      gsap.timeline({ onComplete: res })
        .to(wipeLab, { opacity: 0, x: 40, duration: 0.3, ease: 'power3.in' })
        .to(wipeEl, { clipPath: 'inset(0% 0% 0% 100%)', duration: 0.6, ease: 'expo.inOut' }, '-=0.1')
        .set(wipeEl, { clipPath: 'inset(0% 100% 0% 0%)' });
    });
  },
};

initRouter({
  wipe,
  onLeave(name) { leave(); engine.setPage(name); },
  onEnter(main) { enter(main, 0.05); },
});

/* ── ignition intro (first load per session) ───────────────────── */
async function intro() {
  const el = document.getElementById('intro');
  if (!el) return;
  const play = html.classList.contains('lock') && gsap && !RM && !html.classList.contains('no-3d');
  try { sessionStorage.setItem('tb-intro', '1'); } catch (e) { /* storage blocked */ }
  if (!play) { el.remove(); html.classList.remove('lock'); return; }
  const chars = splitK(el.querySelector('.intro-w'));
  const line = el.querySelector('.intro-line');
  const tag = el.querySelector('.intro-tag');
  await new Promise((res) => {
    gsap.timeline({ onComplete: res })
      .fromTo(chars, { yPercent: 110, fontVariationSettings: '"wdth" 62, "wght" 900' },
        { yPercent: 0, fontVariationSettings: '"wdth" 125, "wght" 900', duration: 0.9, ease: 'expo.out', stagger: 0.045 })
      .fromTo(line, { scaleX: 0 }, { scaleX: 1, duration: 0.7, ease: 'expo.inOut' }, '-=0.55')
      .fromTo(tag, { opacity: 0 }, { opacity: 1, duration: 0.4 }, '-=0.4')
      .to(chars, { fontVariationSettings: '"wdth" 62, "wght" 900', duration: 0.45, ease: 'expo.in', stagger: 0.02 }, '+=0.15')
      .to(el, { yPercent: -100, duration: 0.7, ease: 'expo.inOut', onStart: () => engine.burst(1) }, '-=0.2');
  });
  el.remove();
  html.classList.remove('lock');
}

intro().then(() => enter(document.getElementById('main'), 0.1));
