/* The page: scroll -> timeline, HUD text, score sheet, reveals.
   Works with no WebGL at all; stage.js only reads state.t. */
import { PLIES, NOTES } from './game.js';
import { state } from './state.js';

const root = document.documentElement;
root.classList.remove('no-js');

const $ = (s, r = document) => r.querySelector(s);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const N = PLIES.length;                       // 45
const hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';

const el = {
  bar: $('#bar'), hero: $('#top'), heroCopy: $('.hero-copy'), game: $('#game'), room: $('#room'),
  move: $('#hud-move'), head: $('#hud-head'), text: $('#hud-text'), rail: $('#rail-fill'),
  ledger: $('#ledger'), sheet: $('#sheet'), story: $('#story')
};

/* ---------- score sheet + full story, both built from the one data file ---------- */
const sanOf = i => PLIES[i - 1][5];
const label = ply => ply === 0 ? 'Before move one'
  : (ply % 2 ? Math.ceil(ply / 2) + '. ' : Math.ceil(ply / 2) + '… ') + sanOf(ply);

for (let n = 1; n <= 23; n++) {
  const li = document.createElement('li');
  const num = document.createElement('span'); num.className = 'num'; num.textContent = n + '.';
  li.appendChild(num);
  for (const ply of [2 * n - 1, 2 * n]) {
    if (ply > N) break;
    const b = document.createElement('button');
    b.type = 'button'; b.dataset.ply = ply; b.textContent = sanOf(ply);
    b.setAttribute('aria-label', 'Go to ' + label(ply));
    li.appendChild(b);
  }
  el.ledger.appendChild(li);
}
for (const n of NOTES) {
  const li = document.createElement('li');
  const s = document.createElement('strong'); s.textContent = n.head + '. ';
  li.append(s, n.text);
  el.story.appendChild(li);
}
const cells = [...el.ledger.querySelectorAll('button')];
if (window.innerWidth > 900) el.sheet.open = true;   // wide screens keep the score sheet showing; tall ones fold it

/* ---------- geometry of the scroll ranges (cached, rebuilt on resize) ---------- */
let gameTop = 0, gameLen = 1, endLen = 1;
const LEAD = 0.025, TAIL = 0.025;             // a beat of stillness before move one and after the mate
function measure() {
  gameTop = el.game.offsetTop;
  gameLen = Math.max(1, el.game.offsetHeight - window.innerHeight);
  endLen = Math.max(1, document.documentElement.scrollHeight - window.innerHeight - (gameTop + gameLen));
}
const plyToY = ply => gameTop + (LEAD + (ply / N) * (1 - LEAD - TAIL)) * gameLen;

/* ---------- scroll -> t ---------- */
let lastCur = -1, lastNote = -1;
function onScroll() {
  const y = window.scrollY;
  let t;
  if (y < gameTop) t = -1 + clamp(y / Math.max(1, gameTop), 0, 1);
  else if (y <= gameTop + gameLen) t = clamp(((y - gameTop) / gameLen - LEAD) / (1 - LEAD - TAIL), 0, 1) * N;
  else t = N + 2 * clamp((y - gameTop - gameLen) / endLen, 0, 1);
  state.t = t;

  const f = clamp(t, 0, N);
  el.rail.style.transform = 'scaleX(' + (f / N).toFixed(4) + ')';
  const cur = clamp(Math.ceil(f - 1e-6), 0, N);
  if (cur !== lastCur) {
    lastCur = cur;
    el.move.textContent = cur === 0 ? '0' : Math.ceil(cur / 2);
    el.head.textContent = label(cur);
    let note = NOTES[0], idx = 0;
    NOTES.forEach((n, i) => { if (n.ply <= cur) { note = n; idx = i; } });
    if (idx !== lastNote) { lastNote = idx; el.text.textContent = note.text; }
    for (const b of cells) {
      const p = +b.dataset.ply;
      b.classList.toggle('played', p < cur);
      b.classList.toggle('now', p === cur);
      if (p === cur) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    }
    const now = el.ledger.querySelector('.now');
    if (now && el.sheet.open && !state.reduced) {
      const box = el.ledger;
      if (box.scrollHeight > box.clientHeight) box.scrollTop = now.offsetTop - box.clientHeight / 2;
    }
  }
  // hero copy leaves as the camera leaves
  const hp = clamp(y / (window.innerHeight * 0.7), 0, 1);
  el.heroCopy.style.opacity = String(1 - hp);
  el.heroCopy.style.transform = 'translate3d(0,' + (-hp * 40).toFixed(1) + 'px,0)';
  el.bar.classList.toggle('is-solid', y > 40);
}

/* ---------- smooth scroll (Lenis) ---------- */
let lenis = null;
if (!state.reduced && typeof Lenis !== 'undefined') {
  lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
  lenis.on('scroll', () => { if (hasGsap) ScrollTrigger.update(); onScroll(); });
  if (hasGsap) { gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
  else { const loop = t => { lenis.raf(t); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }
} else {
  window.addEventListener('scroll', onScroll, { passive: true });
}
const goTo = y => lenis ? lenis.scrollTo(y, { duration: 1.6 }) : window.scrollTo({ top: y, behavior: state.reduced ? 'auto' : 'smooth' });

for (const a of document.querySelectorAll('a[href^="#"]')) {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href').slice(1);
    const target = id === 'top' ? document.body : document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    goTo(id === 'game' ? plyToY(0) : id === 'top' ? 0 : target.getBoundingClientRect().top + window.scrollY);
    history.replaceState(null, '', '#' + id);
  });
}
for (const b of cells) b.addEventListener('click', () => goTo(plyToY(+b.dataset.ply) - 2));

window.addEventListener('resize', () => { measure(); onScroll(); });
if ('ResizeObserver' in window) new ResizeObserver(() => { measure(); onScroll(); }).observe(document.body);
window.addEventListener('load', () => { measure(); onScroll(); });
measure(); onScroll();

/* ---------- entrance + reveals (skipped entirely under reduced motion) ---------- */
if (hasGsap && !state.reduced) {
  gsap.registerPlugin(ScrollTrigger);
  gsap.from('.hero .line', { yPercent: 105, opacity: 0, duration: 1.1, ease: 'power4.out', stagger: 0.12, delay: 0.25 });
  gsap.from('.hero-sub, .hero-actions, .eyebrow', { y: 22, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.1, delay: 0.7 });
  gsap.from('.hero-hint', { opacity: 0, duration: 1, delay: 1.4 });
  gsap.set('.reveal', { y: 34, opacity: 0 });
  ScrollTrigger.batch('.reveal', {
    start: 'top 86%', once: true,
    onEnter: els => gsap.to(els, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', stagger: 0.14 })
  });
}
