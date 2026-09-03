/* Thornbury Digital v5 — js/main.js
   Wires the field to the page, marks the route, labels the blueprint plates with
   their real pixel size, runs the marquee, handles the brief, and adds motion only
   once GSAP has arrived from the CDN. Nothing here hides content before it runs. */
(function () {
  'use strict';

  var html = document.documentElement;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  html.classList.add('js');
  if (reduced) html.classList.add('rm');

  var page = html.getAttribute('data-page') || 'home';

  document.querySelectorAll('.nav a').forEach(function (a) {
    if ((a.getAttribute('href') || '') === page + '.html') a.setAttribute('aria-current', 'page');
  });

  /* Field: live on home and studio, still on work and contact (html[data-field]).
     Seeding and the first draws cost ~20 ms, and the field is a background — it
     is started off the critical path so it cannot lengthen the load task. */
  var canvas = document.getElementById('field');
  var anchors = { home: [0.5, 0.5], studio: [0.62, 0.48], work: [0.5, 0.45], contact: [0.68, 0.5] };
  var seeds = { home: 0, studio: 11, work: 23, contact: 37 };
  var fieldWant = null;
  function applyFieldGate() {
    if (fieldWant === null || !window.__tb || !window.__tb.setActive) return;
    window.__tb.setActive(fieldWant);
  }
  function startField() {
    if (!canvas || !window.TBField) { html.classList.add('no-field'); return; }
    var mode = html.getAttribute('data-field') || 'live';
    var an = anchors[page] || anchors.home;
    try {
      window.__tb = window.TBField.start(canvas, {
        still: mode === 'still' || reduced,
        seed: seeds[page] || 0,
        ax: an[0],
        ay: an[1]
      });
      if (!window.__tb) html.classList.add('no-field');
      else applyFieldGate();
    } catch (err) {
      html.classList.add('no-field');
    }
  }
  if (window.requestIdleCallback) requestIdleCallback(startField, { timeout: 1200 });
  else setTimeout(startField, 200);

  /* Hero film: a stand-in plate. Reduced motion holds the poster frame. */
  var film = document.getElementById('heroFilm');
  if (film && reduced) {
    film.removeAttribute('autoplay');
    film.pause();
  }

  /* Blueprint coordinates: every plate reports its own rendered pixel size. */
  function pad(n) { return String(n).padStart(4, '0'); }
  function label() {
      document.querySelectorAll('.plate').forEach(function (p) {
      var w = Math.round(p.clientWidth), h = Math.round(p.clientHeight);
      p.querySelectorAll('[data-w]').forEach(function (el) { el.textContent = pad(w); });
      p.querySelectorAll('[data-h]').forEach(function (el) { el.textContent = pad(h); });
    });
  }
  var lt;
  label();
  window.addEventListener('resize', function () {
    clearTimeout(lt);
    lt = setTimeout(label, 120);
  });

  /* True-loop marquee — see PATTERNS.md. */
  function trueLoopMarquee(track, secondsPerCopy) {
    if (!track || !track.firstElementChild) return;
    var master = track.firstElementChild.cloneNode(true);
    var timer;
    function build() {
      track.style.animationName = 'none';
      while (track.children.length > 1) track.removeChild(track.lastElementChild);
      var rowW = track.firstElementChild.getBoundingClientRect().width;
      var boxW = (track.parentElement || document.body).getBoundingClientRect().width;
      if (rowW < 1) { track.style.animationName = ''; return; }
      var perHalf = Math.max(1, Math.ceil(boxW / rowW));
      for (var i = 1; i < perHalf * 2; i++) {
        var copy = master.cloneNode(true);
        copy.setAttribute('aria-hidden', 'true');
        track.appendChild(copy);
      }
      track.style.animationDuration = (secondsPerCopy * perHalf) + 's';
      void track.offsetWidth;
      track.style.animationName = '';
    }
    build();
    window.addEventListener('resize', function () {
      clearTimeout(timer);
      timer = setTimeout(build, 200);
    });
  }
  trueLoopMarquee(document.getElementById('mq'), 22);

  /* Brief form: validate natively, then swap to the sent note. */
  var form = document.getElementById('brief');
  var note = document.getElementById('brief-note');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      form.querySelectorAll('input, textarea, select').forEach(function (el) { el.setCustomValidity(''); });
      if (!form.reportValidity()) return;
      var btn = form.querySelector('[type=submit]');
      if (btn) btn.disabled = true;
      form.hidden = true;
      if (note) {
        note.hidden = false;
        note.focus();
      }
    });
    form.querySelectorAll('input, textarea, select').forEach(function (el) {
      el.addEventListener('invalid', function () {
        el.setCustomValidity(el.validity.valueMissing ? 'This field is needed.' : '');
      });
      el.addEventListener('input', function () { el.setCustomValidity(''); });
    });
  }

  /* Motion. GSAP stays on the critical path deliberately: moving it after first
     paint meant the hero copy had to be hidden until it arrived, and an
     opacity-0 element does not count as painted — LCP went from 1.28 s to 3.33 s
     on a 4x-throttled phone. Every tween clears its inline styles when done, so
     no transform or opacity is left behind to open a stacking context under the
     glass layers. */
  var g = window.gsap;
  if (!g || reduced) return;
  var ST = window.ScrollTrigger;
  if (ST) g.registerPlugin(ST);

  var hero = document.querySelector('.hero');
  if (hero) {
    var tl = g.timeline({ defaults: { ease: 'power4.out', clearProps: 'all' } });
    var filmLayer = hero.querySelector('.hero-film');
    function rise(sel, y, dur, at, stagger) {
      var els = hero.querySelectorAll(sel);
      if (els.length) tl.fromTo(els, { y: y, opacity: 0 },
        { y: 0, opacity: 1, duration: dur, stagger: stagger || 0, clearProps: 'all' }, at);
    }
    if (filmLayer) tl.from(filmLayer, { opacity: 0, duration: 1.8, ease: 'power2.out' }, 0);
    rise('.hero-copy .meta', 14, 0.9, 0.5);
    rise('.wordmark', 64, 1.5, 0.62);
    rise('.hero-line', 20, 1.1, 0.9);
    rise('.hero-act > *', 18, 1, 1.05, 0.08);
    rise('.hero-stats li', 16, 1, 1.2, 0.08);
    rise('.film-note', 0, 0.9, 1.4);
  }

  var head = document.querySelector('.page-head');
  if (head) {
    g.from(head.children, { y: 30, opacity: 0, duration: 1.2, stagger: 0.12, ease: 'power4.out', clearProps: 'all' });
  }

  if (!ST) return;

  /* The handoff: across the pinned hero's own scroll range the film dissolves
     and drifts back, so the moon gives way to the liquid field behind it rather
     than being cut off at the section edge. autoAlpha hides it at the end, so a
     spent hero never sits over the page catching clicks. */
  var stick = document.querySelector('.hero-stick');
  if (stick && hero) {
    var hFilm = hero.querySelector('.hero-film');
    var hRest = hero.querySelectorAll('.hero-copy, .hero-stats, .film-note');
    /* the field is invisible behind an opaque hero film — do not run it there */
    function gateField(p) {
      var want = p > 0.04;
      if (want === fieldWant) return;
      fieldWant = want;
      applyFieldGate();
    }
    var handoff = g.timeline({
      scrollTrigger: {
        trigger: stick, start: 'top top', end: 'bottom bottom', scrub: 0.6,
        onUpdate: function (self) { gateField(self.progress); },
        onRefresh: function (self) { gateField(self.progress); }
      }
    });
    gateField(0);
    if (hFilm) handoff.to(hFilm, { autoAlpha: 0, scale: 1.12, ease: 'none', duration: 1 }, 0);
    if (hRest.length) handoff.to(hRest, { autoAlpha: 0, y: -40, ease: 'none', duration: 0.6 }, 0);
  }

  g.utils.toArray('.reveal').forEach(function (el) {
    g.from(el, {
      y: 34, opacity: 0, duration: 1.2, ease: 'power4.out', clearProps: 'all',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    });
  });

  g.utils.toArray('.entry').forEach(function (el) {
    var pl = el.querySelector('.fig-plate');
    if (pl) {
      g.fromTo(pl, { clipPath: 'inset(0% 0% 100% 0%)' }, {
        clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'power4.inOut', clearProps: 'all',
        scrollTrigger: { trigger: el, start: 'top 92%', once: true }
      });
    }
    g.from(el.querySelectorAll('.entry-body > *'), {
      y: 22, opacity: 0, duration: 1, stagger: .08, ease: 'power4.out', clearProps: 'all',
      scrollTrigger: { trigger: el, start: 'top 92%', once: true }
    });
  });

  g.utils.toArray('.case').forEach(function (el) {
    var pl = el.querySelector('.plate');
    if (pl) {
      g.fromTo(pl, { clipPath: 'inset(0% 0% 100% 0%)' }, {
        clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'power4.inOut', clearProps: 'all',
        scrollTrigger: { trigger: el, start: 'top 84%', once: true }
      });
    }
    var rest = el.querySelectorAll('.idx, .cap');
    if (rest.length) {
      g.from(rest, {
        y: 20, opacity: 0, duration: 1, stagger: 0.1, ease: 'power4.out', clearProps: 'all',
        scrollTrigger: { trigger: el, start: 'top 78%', once: true }
      });
    }
  });
})();
