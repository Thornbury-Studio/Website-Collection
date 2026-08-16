// FORGE — gym template interactivity. GSAP core, ScrollTrigger and SplitText
// are loaded via CDN in index.html before this file.

document.addEventListener('DOMContentLoaded', () => {
  gsap.registerPlugin(ScrollTrigger, SplitText);

  runPreloader(() => {
    initHeroReveal();
    initCursor();
    initNav();
    initPhilosophyStory();
    initReveals();
    initCounters();
    initMagnetic();
    initSound();
    initScrollProgress();
  });

  setYear();
});

function setYear() {
  const el = document.querySelector('#currentYear');
  if (el) el.textContent = new Date().getFullYear();
}

/* ---------------- Preloader ---------------- */
function runPreloader(done) {
  const pre = document.getElementById('preloader');
  const fill = document.getElementById('preBarFill');
  const count = document.getElementById('preCount');
  if (!pre) return done();

  const obj = { v: 0 };
  gsap.to(obj, {
    v: 100,
    duration: 1.4,
    ease: 'power2.inOut',
    onUpdate: () => {
      const val = Math.round(obj.v);
      fill.style.width = val + '%';
      count.textContent = val + '%';
    },
    onComplete: () => {
      gsap.to(pre, {
        yPercent: -100,
        duration: 0.7,
        ease: 'power3.inOut',
        delay: 0.15,
        onComplete: () => {
          pre.style.display = 'none';
          done();
        },
      });
    },
  });
}

/* ---------------- Hero text reveal ---------------- */
function initHeroReveal() {
  const lines = document.querySelectorAll('.hero-title .line-inner');
  if (!lines.length || typeof SplitText === 'undefined') return;

  lines.forEach((line) => {
    const split = new SplitText(line, { type: 'chars,words', wordsClass: 'word' });
    gsap.set(split.chars, { yPercent: 110, display: 'inline-block' });
    gsap.to(split.chars, {
      yPercent: 0,
      duration: 0.9,
      ease: 'power4.out',
      stagger: 0.02,
      delay: 0.15,
    });
  });

  gsap.from('.eyebrow', { opacity: 0, y: 12, duration: 0.6, delay: 0.1 });
  gsap.from('.hero-actions', { opacity: 0, y: 20, duration: 0.7, delay: 0.6 });
  gsap.from('.hero-visual', { opacity: 0, scale: 0.85, duration: 1.1, ease: 'power3.out', delay: 0.3 });
  gsap.from('.scroll-cue', { opacity: 0, duration: 0.6, delay: 1 });
}

/* ---------------- Custom cursor ---------------- */
function initCursor() {
  const isFine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!isFine) return;

  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  const mouse = { x: innerWidth / 2, y: innerHeight / 2 };
  const ringPos = { x: mouse.x, y: mouse.y };

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    dot.style.transform = `translate(${mouse.x - 3}px, ${mouse.y - 3}px)`;
  });

  (function loop() {
    ringPos.x += (mouse.x - ringPos.x) * 0.18;
    ringPos.y += (mouse.y - ringPos.y) * 0.18;
    const w = ring.offsetWidth / 2;
    ring.style.transform = `translate(${ringPos.x - w}px, ${ringPos.y - w}px)`;
    requestAnimationFrame(loop);
  })();

  document.querySelectorAll('a, button').forEach((el) => {
    const big = el.dataset.cursor === 'link';
    el.addEventListener('mouseenter', () => ring.classList.add(big ? 'big' : 'link'));
    el.addEventListener('mouseleave', () => ring.classList.remove('big', 'link'));
  });
}

/* ---------------- Nav ---------------- */
function initNav() {
  const nav = document.getElementById('siteNav');
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');
  let lastY = 0;

  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      const y = self.scroll();
      nav.classList.toggle('scrolled', y > 40);
      if (y > lastY && y > 200) nav.classList.add('nav-hidden');
      else nav.classList.remove('nav-hidden');
      lastY = y;
    },
  });

  if (!toggle || !links) return;
  toggle.addEventListener('click', () => {
    links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', links.classList.contains('open'));
  });
  links.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => links.classList.remove('open')));
}

/* ---------------- Sound FX (Web Audio API, synthesized — no audio files) ---------------- */
function initSound() {
  let ctx;

  function playTone(freq, duration) {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      ctx = new AudioCtx();
    }
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.72, ctx.currentTime + duration);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.09, ctx.currentTime + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration + 0.02);
  }

  document.querySelectorAll('.btn-accent').forEach((btn) => {
    btn.addEventListener('click', () => playTone(340, 0.16));
  });
}

/* ---------------- Philosophy scroll story ---------------- */
function initPhilosophyStory() {
  const story = document.getElementById('philosophyStory');
  const panels = document.querySelectorAll('[data-protocol-panel]');
  const visuals = document.querySelectorAll('[data-protocol-visual]');
  const triggers = document.querySelectorAll('[data-protocol-trigger]');
  const buttons = document.querySelectorAll('[data-protocol-jump]');
  const counter = document.getElementById('protocolCounter');
  const metricLabel = document.getElementById('protocolMetricLabel');
  const metricValue = document.getElementById('protocolMetricValue');
  if (!story || !panels.length) return;

  const setActive = (i) => {
    panels.forEach((p, idx) => p.classList.toggle('active', idx === i));
    visuals.forEach((visual, idx) => visual.classList.toggle('active', idx === i));
    buttons.forEach((button, idx) => {
      button.classList.toggle('active', idx === i);
      if (idx === i) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    const active = panels[i];
    if (counter) counter.textContent = `${String(i + 1).padStart(2, '0')} / ${String(panels.length).padStart(2, '0')}`;
    if (metricLabel) metricLabel.textContent = active.dataset.metricLabel || '';
    if (metricValue) metricValue.textContent = active.dataset.metricValue || '';
  };

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const idx = Number(button.dataset.protocolJump);
      if (!Number.isFinite(idx)) return;
      setActive(idx);
      if (!window.matchMedia('(max-width: 720px)').matches) {
        triggers[idx]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  });

  if (!('IntersectionObserver' in window) || window.matchMedia('(max-width: 720px)').matches) return;

  const observer = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
    if (!visible.length) return;
    const idx = Number(visible[0].target.dataset.protocolTrigger);
    setActive(Number.isFinite(idx) ? idx : 0);
  }, {
    rootMargin: '-44% 0px -44% 0px',
    threshold: 0,
  });

  triggers.forEach((trigger) => observer.observe(trigger));
  setActive(0);
}

/* ---------------- Scroll reveals ---------------- */
function initReveals() {
  const groups = [
    { sel: '.program-card', stagger: 0.08 },
    { sel: '.trainer-card', stagger: 0.1 },
    { sel: '.price-card', stagger: 0.12 },
  ];

  groups.forEach(({ sel, stagger }) => {
    const items = document.querySelectorAll(sel);
    if (!items.length) return;
    gsap.to(items, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power3.out',
      stagger,
      scrollTrigger: {
        trigger: items[0].closest('.programs-grid, .trainers-grid, .pricing-grid'),
        start: 'top 82%',
      },
    });
  });

  const wipes = document.querySelectorAll('.wipe-reveal');
  if (wipes.length) {
    wipes.forEach((el, i) => {
      const img = el.querySelector('img');
      const tl = gsap.timeline({
        scrollTrigger: { trigger: el, start: 'top 85%' },
        delay: (i % 4) * 0.08,
      });
      tl.to(el, { clipPath: 'inset(0 0 0% 0)', duration: 0.9, ease: 'power4.inOut' }, 0);
      if (img) tl.to(img, { scale: 1, duration: 1.1, ease: 'power3.out' }, 0);
    });
  }
}

/* ---------------- Scroll progress bar ---------------- */
function initScrollProgress() {
  const bar = document.getElementById('scrollProgress');
  if (!bar) return;
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      bar.style.width = (self.progress * 100) + '%';
    },
  });
}

/* ---------------- Stat counters ---------------- */
function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  counters.forEach((el) => {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || '';
    const obj = { v: 0 };

    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        gsap.to(obj, {
          v: target,
          duration: 1.6,
          ease: 'power2.out',
          onUpdate: () => (el.textContent = Math.round(obj.v) + suffix),
        });
      },
    });
  });
}

/* ---------------- Magnetic buttons ---------------- */
function initMagnetic() {
  const isFine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (!isFine) return;

  document.querySelectorAll('.btn').forEach((btn) => {
    btn.addEventListener('mousemove', (e) => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      gsap.to(btn, { x: x * 0.3, y: y * 0.4, duration: 0.3, ease: 'power2.out' });
    });
    btn.addEventListener('mouseleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' });
    });
  });
}

/* True-loop marquee — see PATTERNS.md.
   Clones the first group until half the track covers its container, keeping the
   total even so -50% stays a whole period. Two copies is not enough on a wide
   monitor: the tail ran out mid-screen and you watched it reset. Duration
   scales with the clone count so the speed never changes. */
function trueLoopMarquee(track, secondsPerCopy) {
  if (!track || !track.firstElementChild) return;
  const master = track.firstElementChild.cloneNode(true);
  let timer;

  function build() {
    // Detach the animation before touching the track. The CSS animation
    // starts the instant the browser first paints this element, under
    // whatever duration the stylesheet declares. This page loads GSAP,
    // ScrollTrigger, and SplitText from a CDN before main.js even starts
    // fetching, so real elapsed time builds up on the clock before this runs.
    // Changing animation-duration on that already-running animation makes the
    // browser recompute the played fraction against the NEW duration using
    // that SAME elapsed time — the visible result is a jump/teleport the
    // moment the CDN scripts finish. animation-name:none + a forced reflow +
    // reapplying the name restarts the animation as a clean new instance at
    // 0%, so there is nothing to recompute a jump from.
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

    track.offsetWidth; // force layout so the browser commits animation-name:none first
    track.style.animationName = '';
  }

  build();
  window.addEventListener('resize', () => {
    clearTimeout(timer);
    timer = setTimeout(build, 200);
  });
}
trueLoopMarquee(document.getElementById('marqueeTrack'), 24);
