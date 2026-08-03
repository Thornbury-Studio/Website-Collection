// FORGE — gym template interactivity. GSAP (core, ScrollTrigger, SplitText,
// ScrollSmoother) loaded via CDN in index.html before this file.

document.addEventListener('DOMContentLoaded', () => {
  gsap.registerPlugin(ScrollTrigger, SplitText, ScrollSmoother);

  runPreloader(() => {
    initSmoother();
    initHeroReveal();
    initCursor();
    initNav();
    initMarquee();
    initTestimonialMarquee();
    initPhilosophyPin();
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

/* ---------------- Smooth scroll ---------------- */
function initSmoother() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (typeof ScrollSmoother === 'undefined') return;
  ScrollSmoother.create({
    wrapper: '#smooth-wrapper',
    content: '#smooth-content',
    smooth: 1.1,
    effects: false,
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

/* ---------------- Marquee ---------------- */
function initMarquee() {
  const track = document.getElementById('marqueeTrack');
  if (!track) return;
  gsap.to(track, { xPercent: -50, duration: 22, ease: 'none', repeat: -1 });
}

function initTestimonialMarquee() {
  const track = document.getElementById('testiTrack');
  if (!track) return;
  const tween = gsap.to(track, { xPercent: -50, duration: 34, ease: 'none', repeat: -1 });
  track.addEventListener('mouseenter', () => tween.timeScale(0.15));
  track.addEventListener('mouseleave', () => tween.timeScale(1));
}

/* ---------------- Philosophy pinned scroll ---------------- */
function initPhilosophyPin() {
  const pinEl = document.getElementById('philosophyPin');
  const panels = document.querySelectorAll('.philosophy-panel');
  const dots = document.querySelectorAll('#philosophyProgress span');
  const image = document.querySelector('.philosophy-visual img');
  if (!pinEl || !panels.length) return;

  const setActive = (i) => {
    panels.forEach((p, idx) => p.classList.toggle('active', idx === i));
    dots.forEach((d, idx) => d.classList.toggle('active', idx === i));
  };

  ScrollTrigger.create({
    trigger: pinEl,
    start: 'top top+=90',
    end: '+=140%',
    pin: true,
    scrub: true,
    onUpdate: (self) => {
      const idx = Math.min(panels.length - 1, Math.floor(self.progress * panels.length));
      setActive(idx);
      if (image) {
        gsap.set(image, { yPercent: -8 + self.progress * 16, scale: 1.08 - self.progress * 0.04 });
      }
    },
  });
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
