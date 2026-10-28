/* Everything that is not WebGL: smooth scroll, reveals, the order-status panel. */
import { state } from './state.js';

const hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
const root = document.documentElement;
let lenis = null;

/* ---------- smooth scroll (native when reduced motion is asked for) ---------- */
if (!state.reduced && typeof Lenis !== 'undefined') {
  lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
  if (hasGsap) {
    gsap.registerPlugin(ScrollTrigger);
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  } else {
    const tick = t => { lenis.raf(t); requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  }
}

document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    const el = id.length > 1 ? document.querySelector(id) : document.body;
    if (!el) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(el, { duration: 1.5 });
    else el.scrollIntoView({ behavior: state.reduced ? 'auto' : 'smooth', block: 'start' });
    history.replaceState(null, '', id);
  });
});

/* ---------- reveals ---------- */
if (hasGsap && !state.reduced) {
  document.querySelectorAll('.rv').forEach(el => {
    gsap.fromTo(el, { opacity: 0, y: 20 }, {
      opacity: 1, y: 0, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  });
} else {
  root.classList.add('static');
}

/* ---------- the order-status panel: always being prepared ---------- */
const btnStatus = document.getElementById('btn-status');
const btnCollect = document.getElementById('btn-collect');
const log = document.getElementById('log');
const meter = document.getElementById('meter');
const meterBar = meter && meter.parentElement;
const nowEl = document.getElementById('now');

const LINES = [
  'Your order is being prepared.',
  'Your order is still being prepared.',
  'Your order is being prepared, with care.',
  'Your order is being prepared. Estimated: about ten minutes.',
  'Thank you for your patience. Your order is being prepared.',
  'Your order is being prepared. The estimate has not changed.',
  'Your order is, as before, being prepared.',
];
const WIDTHS = [88, 91, 89, 92, 90, 91, 89];
let n = 0;
const stamp = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

function addLine(text) {
  const li = document.createElement('li');
  const t = document.createElement('time');
  t.textContent = stamp();
  li.append(t, document.createTextNode(text));
  log.prepend(li);
  while (log.children.length > 6) log.lastElementChild.remove();
}

if (log) {
  log.firstElementChild.firstElementChild.textContent = stamp();
  btnStatus.addEventListener('click', () => {
    addLine(LINES[(n + 1) % LINES.length]);
    const w = WIDTHS[n % WIDTHS.length];
    meter.style.width = w + '%';
    meterBar.setAttribute('aria-valuenow', String(w));
    n++;
    btnStatus.textContent = 'Check order status';
  });
  btnCollect.addEventListener('click', () => addLine('Collection is not yet available. Your order is being prepared.'));
}

/* Now serving climbs towards the number on the receipt and stops one short. */
if (nowEl && !state.reduced) {
  let serving = 412;
  const tick = () => {
    if (serving >= 416) return;
    serving++;
    nowEl.textContent = String(serving).padStart(4, '0');
  };
  new IntersectionObserver((es, io) => {
    if (es.some(e => e.isIntersecting)) { setInterval(tick, 5200); io.disconnect(); }
  }).observe(nowEl);
}

export { lenis };
