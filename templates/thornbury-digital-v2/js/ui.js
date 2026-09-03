/* ══════════════════════════════════════════════════════════════════
   THORNBURY DIGITAL v2 — interface layer.
   Kinetic type (variable-width decompression), magnetic pull, the cursor,
   parallax depths, the true-loop marquee, HUD, work cases, contact form.
   Everything here degrades: no GSAP → text is simply visible, links are
   simply links. Reduced motion → nothing moves that isn't the user.
   ══════════════════════════════════════════════════════════════════ */

const G = () => window.gsap;
const ST = () => window.ScrollTrigger;
const FINE = matchMedia('(hover: hover) and (pointer: fine)');
const RM = () => document.documentElement.classList.contains('rm');
const MOBILE = () => matchMedia('(max-width: 760px)').matches;

/* ── split a heading into .w words / .c chars, keeping nested markup ── */
export function splitK(el) {
  if (el.dataset.split) return el.querySelectorAll('.c');
  el.setAttribute('aria-label', el.textContent.replace(/\s+/g, ' ').trim());
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes = [];
  let t;
  while ((t = walker.nextNode())) nodes.push(t);
  for (const node of nodes) {
    const frag = document.createDocumentFragment();
    for (const part of node.nodeValue.split(/(\s+)/)) {
      if (!part) continue;
      if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); continue; }
      const w = document.createElement('span');
      w.className = 'w';
      w.setAttribute('aria-hidden', 'true');
      for (const ch of part) {
        const c = document.createElement('span');
        c.className = 'c';
        c.textContent = ch;
        w.appendChild(c);
      }
      frag.appendChild(w);
    }
    node.parentNode.replaceChild(frag, node);
  }
  el.dataset.split = '1';
  return el.querySelectorAll('.c');
}

/* ── fit: a split heading's longest word must never exceed its box.
      A word cannot wrap, so an overflowing word widens the page — and on
      mobile Chrome the layout viewport grows with it. Scale the heading
      down instead; re-run on resize. ─────────────────────────────── */
export function fitWords(el) {
  el.style.fontSize = '';
  const parent = el.parentElement;
  if (!parent) return;
  // The heading's own box (a grid track, a block) stretches to its longest
  // word, so it cannot be the measure. Use the parent's content box minus
  // the heading's own margins.
  const pcs = getComputedStyle(parent), ecs = getComputedStyle(el);
  const parentAvail = parent.clientWidth - (parseFloat(pcs.paddingLeft) || 0) - (parseFloat(pcs.paddingRight) || 0);
  const avail = Math.floor(parentAvail - (parseFloat(ecs.marginLeft) || 0) - (parseFloat(ecs.marginRight) || 0));
  if (avail <= 0) return;
  // Measure a clean clone at the heading's final CSS state: the live chars
  // may be mid-tween (wdth 62, hidden) and fonts may still be loading.
  const probe = el.cloneNode(true);
  probe.removeAttribute('id');
  probe.querySelectorAll('[style]').forEach((n) => n.removeAttribute('style'));
  probe.style.cssText = 'position:absolute;left:0;top:0;width:' + avail + 'px;visibility:hidden;pointer-events:none;';
  el.parentNode.appendChild(probe);
  let maxW = 0;
  probe.querySelectorAll('.w').forEach((w) => { maxW = Math.max(maxW, w.getBoundingClientRect().width); });
  const fs = parseFloat(getComputedStyle(probe).fontSize);
  probe.remove();
  if (maxW > avail) el.style.fontSize = Math.floor(fs * (avail / maxW) * 0.97) + 'px';
}
export function refitAll() {
  document.querySelectorAll('.k[data-split]').forEach(fitWords);
  if (ST()) ST().refresh();
}
let fitTimer = 0, fitWired = false;
function wireFit() {
  if (fitWired) return;
  fitWired = true;
  addEventListener('resize', () => {
    clearTimeout(fitTimer);
    fitTimer = setTimeout(refitAll, 150);
  });
}

/* ── kinetic reveal: chars rise out of a mask while the width axis
      decompresses 62 → target. Attached to a ScrollTrigger, once. ── */
export function kinetic(el, { delay = 0 } = {}) {
  const chars = splitK(el);
  fitWords(el);
  wireFit();
  const g = G();
  const wd = el.dataset.wdth || 118;
  el.style.visibility = 'visible';
  if (!g || !ST() || RM()) { el.classList.add('is-in'); return; }
  const tw = g.fromTo(chars,
    { yPercent: 108, opacity: 0, fontVariationSettings: '"wdth" 62, "wght" 900', letterSpacing: '0.02em' },
    {
      yPercent: 0, opacity: 1, fontVariationSettings: `"wdth" ${wd}, "wght" 900`, letterSpacing: '-0.04em',
      duration: 1.15, ease: 'expo.out', delay, stagger: { each: 0.016 }, paused: true,
      onStart: () => el.classList.add('is-in'),
    });
  el._kt = tw;
  ST().create({ trigger: el, start: 'top 88%', once: true, onEnter: () => tw.play() });
}

/* ── plain reveal for blocks ─────────────────────────────────── */
export function reveal(el) {
  const g = G();
  if (!g || !ST() || RM()) return;
  const tw = g.fromTo(el, { y: 34, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', paused: true });
  el._kt = tw;
  ST().create({ trigger: el, start: 'top 92%', once: true, onEnter: () => tw.play() });
}

/* Sweep: anything with a paused reveal that is inside the viewport plays.
   Covers the one hole ScrollTrigger cannot — an observer that never ran. */
export function sweep(root) {
  const vh = innerHeight;
  root.querySelectorAll('.k, .rv').forEach((el) => {
    const tw = el._kt;
    if (!tw || tw.progress() > 0 || tw.isActive()) return;
    const r = el.getBoundingClientRect();
    if (r.bottom > 0 && r.top < vh) tw.play();
  });
}

/* ── depth parallax: y through the viewport, scrubbed ────────── */
export function parallax(el) {
  const g = G();
  if (!g || !ST() || RM() || MOBILE()) return;
  const d = parseFloat(el.dataset.depth) || 0.1;
  g.fromTo(el, { y: d * 220 }, {
    y: -d * 220, ease: 'none',
    scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
  });
}

/* ── magnetic pull: a field, not a hover ──────────────────────── */
const mags = new Set();
let magWired = false, magPending = null;
function wireMagnets() {
  if (magWired) return;
  magWired = true;
  document.addEventListener('pointermove', (e) => {
    magPending = e;
    requestAnimationFrame(runMagnets);
  }, { passive: true });
}
function runMagnets() {
  const e = magPending;
  if (!e) return;
  magPending = null;
  for (const m of mags) {
    const r = m.el.getBoundingClientRect();
    if (!r.width) continue;
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    const rad = Math.max(r.width, r.height) / 2 + 56;
    if (Math.hypot(dx, dy) < rad) {
      m.on = true;
      m.x(dx * m.k); m.y(dy * m.k);
      if (m.ix) { m.ix(dx * m.k * 0.5); m.iy(dy * m.k * 0.5); }
    } else if (m.on) {
      m.on = false;
      release(m);
    }
  }
}
function release(m) {
  const g = G();
  g.to(m.el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.45)', overwrite: 'auto' });
  if (m.inner) g.to(m.inner, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.45)', overwrite: 'auto' });
}
export function magnet(el) {
  const g = G();
  if (!g || !FINE.matches || RM()) return null;
  wireMagnets();
  const inner = el.querySelector('.mg-in');
  const m = {
    el, inner, on: false, k: parseFloat(el.dataset.mag) || 0.3,
    x: g.quickTo(el, 'x', { duration: 0.55, ease: 'power3.out' }),
    y: g.quickTo(el, 'y', { duration: 0.55, ease: 'power3.out' }),
    ix: inner ? g.quickTo(inner, 'x', { duration: 0.55, ease: 'power3.out' }) : null,
    iy: inner ? g.quickTo(inner, 'y', { duration: 0.55, ease: 'power3.out' }) : null,
  };
  mags.add(m);
  return () => { mags.delete(m); g.set(el, { clearProps: 'x,y' }); if (inner) g.set(inner, { clearProps: 'x,y' }); };
}

/* ── cursor ────────────────────────────────────────────────────── */
export function cursor(el) {
  const g = G();
  if (!g || !FINE.matches || RM()) { el.hidden = true; return; }
  const ring = el.querySelector('.cur-ring'), dot = el.querySelector('.cur-dot'), lab = el.querySelector('.cur-label');
  const rx = g.quickTo(ring, 'x', { duration: 0.32, ease: 'power3.out' });
  const ry = g.quickTo(ring, 'y', { duration: 0.32, ease: 'power3.out' });
  const dx = g.quickTo(dot, 'x', { duration: 0.1, ease: 'power2.out' });
  const dy = g.quickTo(dot, 'y', { duration: 0.1, ease: 'power2.out' });
  document.addEventListener('pointermove', (e) => {
    rx(e.clientX); ry(e.clientY); dx(e.clientX); dy(e.clientY);
    el.classList.add('is-live');
  }, { passive: true });
  document.addEventListener('pointerover', (e) => {
    const t = e.target.closest && e.target.closest('a, button, [data-cur], input, textarea, select, label, summary');
    if (t) {
      el.classList.add('is-hover');
      const src = t.closest('[data-cur]');
      const l = src ? src.dataset.cur : '';
      lab.textContent = l;
      el.classList.toggle('has-label', !!l);
    } else {
      el.classList.remove('is-hover', 'has-label');
    }
  });
  document.addEventListener('pointerleave', () => el.classList.remove('is-live'));
  document.addEventListener('pointerdown', () => el.classList.add('is-down'));
  document.addEventListener('pointerup', () => el.classList.remove('is-down'));
}

/* ── true-loop marquee — see PATTERNS.md ──────────────────────── */
export function trueLoopMarquee(track, secondsPerCopy) {
  if (!track || !track.firstElementChild) return;
  const master = track.firstElementChild.cloneNode(true);
  let timer;
  function build() {
    track.style.animationName = 'none';
    while (track.children.length > 1) track.removeChild(track.lastElementChild);
    const rowW = track.firstElementChild.getBoundingClientRect().width;
    const boxW = (track.parentElement || document.body).getBoundingClientRect().width;
    if (rowW < 1) { track.style.animationName = ''; return; }
    const perHalf = Math.max(1, Math.ceil(boxW / rowW));
    for (let i = 1; i < perHalf * 2; i++) {
      const copy = master.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      track.appendChild(copy);
    }
    track.style.animationDuration = (secondsPerCopy * perHalf) + 's';
    void track.offsetWidth;
    track.style.animationName = '';
  }
  build();
  addEventListener('resize', () => { clearTimeout(timer); timer = setTimeout(build, 200); });
}

/* ── header chrome ─────────────────────────────────────────────── */
export function markNav() {
  const here = location.pathname.replace(/[^/]*$/, '');
  const file = location.pathname.slice(here.length) || 'index.html';
  document.querySelectorAll('.nav a, .foot-nav a').forEach((a) => {
    const target = a.getAttribute('href').split('#')[0] || 'index.html';
    if (target === file) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
}

/* ── page-specific wiring ──────────────────────────────────────── */
function initWork(root, ctx) {
  const peek = root.querySelector('#peek');
  const peekArt = peek && peek.querySelector('.peek-art');
  const g = G();
  let px = null, py = null;
  if (peek && g && FINE.matches && !RM()) {
    px = g.quickTo(peek, 'x', { duration: 0.6, ease: 'power3.out' });
    py = g.quickTo(peek, 'y', { duration: 0.6, ease: 'power3.out' });
    root.addEventListener('pointermove', (e) => { px(e.clientX); py(e.clientY); }, { passive: true });
  }
  root.querySelectorAll('.row').forEach((row) => {
    const dlg = root.querySelector('#' + row.dataset.case);
    row.addEventListener('click', () => {
      if (!dlg || typeof dlg.showModal !== 'function') return;
      dlg.showModal();
      ctx.engine.burst(0.6);
    });
    if (peek && px) {
      row.addEventListener('pointerenter', () => {
        peekArt.className = 'peek-art ' + row.dataset.art;
        peek.classList.add('is-on');
      });
      row.addEventListener('pointerleave', () => peek.classList.remove('is-on'));
    }
  });
  root.querySelectorAll('dialog.case').forEach((dlg) => {
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  });
}

function initContact(root, ctx) {
  const form = root.querySelector('#tx');
  const done = root.querySelector('#txDone');
  if (!form || !done) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    form.hidden = true;
    done.hidden = false;
    ctx.engine.burst(1);
    done.focus({ preventScroll: true });
  });
}

/* ── the per-page entry point ──────────────────────────────────── */
export function initPage(root, ctx) {
  const kills = [];
  root.querySelectorAll('.k').forEach((el, i) => kinetic(el, { delay: i === 0 ? (ctx.delay || 0) : 0 }));
  root.querySelectorAll('.rv').forEach(reveal);
  root.querySelectorAll('[data-depth]').forEach(parallax);
  root.querySelectorAll('[data-mag]').forEach((el) => kills.push(magnet(el)));
  root.querySelectorAll('[data-burst]').forEach((el) => {
    const v = parseFloat(el.dataset.burst) || 0.3;
    el.addEventListener('pointerenter', () => ctx.engine.burst(v));
  });
  const mq = root.querySelector('.mq');
  if (mq) trueLoopMarquee(mq, 22);

  const page = root.dataset.page;
  if (page === 'work') initWork(root, ctx);
  if (page === 'contact') initContact(root, ctx);

  return function destroy() {
    if (ST()) ST().getAll().forEach((t) => t.kill());
    kills.forEach((k) => k && k());
  };
}
