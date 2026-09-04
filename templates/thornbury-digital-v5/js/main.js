/* Thornbury Digital v5 — js/main.js
   Wires one page: route marking, blueprint labels, marquee, brief form, motion.
   Everything here is re-runnable, because js/bg.js swaps <main> in place and the
   same wiring has to happen again on the new content without a reload. All motion
   lives in a gsap.context so a single revert() takes the tweens *and* their
   ScrollTriggers back out. Nothing here hides content before it runs. */
(function (global) {
  'use strict';

  var html = document.documentElement;
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  html.classList.add('js');
  if (reduced) html.classList.add('rm');

  /* ---------- field ---------- */

  var canvas = document.getElementById('field');
  var field = null;
  var fieldCbs = [];
  /* two independent reasons to run: the hero gate (nothing is visible behind an
     opaque film) and a hold from bg.js (a transition needs it live regardless) */
  var fieldWant = null, fieldHold = false;

  function applyFieldGate() {
    if (!field || !field.setActive) return;
    if (fieldHold) { field.setActive(true); return; }
    if (fieldWant === null) return;
    field.setActive(fieldWant);
  }

  function startField() {
    if (!canvas || !global.TBField) { html.classList.add('no-field'); return; }
    var mode = html.getAttribute('data-field') || 'live';
    var page = html.getAttribute('data-page') || 'home';
    var anchors = { home: [0.5, 0.5], studio: [0.62, 0.48], work: [0.5, 0.45], contact: [0.68, 0.5] };
    var seeds = { home: 0, studio: 11, work: 23, contact: 37 };
    var an = anchors[page] || anchors.home;
    try {
      field = global.TBField.start(canvas, {
        still: mode === 'still' || reduced,
        seed: seeds[page] || 0,
        ax: an[0],
        ay: an[1]
      });
      if (!field) { html.classList.add('no-field'); return; }
      applyFieldGate();
      for (var i = 0; i < fieldCbs.length; i++) fieldCbs[i](field);
      fieldCbs.length = 0;
    } catch (err) {
      html.classList.add('no-field');
    }
  }
  /* Seeding and the first draws cost ~20 ms, and the field is a background — it
     is started off the critical path so it cannot lengthen the load task. */
  if (global.requestIdleCallback) requestIdleCallback(startField, { timeout: 1200 });
  else setTimeout(startField, 200);

  /* ---------- per-page wiring ---------- */

  var offs = [];          /* listeners this page added, undone on teardown */
  var ctxMotion = null;   /* the gsap context for this page */

  function on(target, type, fn, opt) {
    target.addEventListener(type, fn, opt);
    offs.push(function () { target.removeEventListener(type, fn, opt); });
  }

  function markNav(page) {
    document.querySelectorAll('.nav a').forEach(function (a) {
      if ((a.getAttribute('href') || '') === page + '.html' ||
          (page === 'home' && (a.getAttribute('href') || '') === 'index.html')) {
        a.setAttribute('aria-current', 'page');
      } else {
        a.removeAttribute('aria-current');
      }
    });
  }

  /* Blueprint coordinates: every plate reports its own rendered pixel size. */
  function pad(n) { return String(n).padStart(4, '0'); }
  function labels(root) {
    function label() {
      root.querySelectorAll('.plate').forEach(function (p) {
        var w = Math.round(p.clientWidth), h = Math.round(p.clientHeight);
        p.querySelectorAll('[data-w]').forEach(function (el) { el.textContent = pad(w); });
        p.querySelectorAll('[data-h]').forEach(function (el) { el.textContent = pad(h); });
      });
    }
    var lt;
    label();
    on(global, 'resize', function () {
      clearTimeout(lt);
      lt = setTimeout(label, 120);
    });
  }

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
    on(global, 'resize', function () {
      clearTimeout(timer);
      timer = setTimeout(build, 200);
    });
  }

  /* Brief form: validate natively, then swap to the sent note. */
  function briefForm(root) {
    var form = root.querySelector('#brief');
    var note = root.querySelector('#brief-note');
    if (!form) return;
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
  function motion(root, intro) {
    var g = global.gsap;
    if (!g || reduced) return;
    var ST = global.ScrollTrigger;
    if (ST) g.registerPlugin(ST);

    ctxMotion = g.context(function () {
      var hero = root.querySelector('.hero');
      if (hero && intro) {
        var tl = g.timeline({ defaults: { ease: 'power4.out', clearProps: 'all' } });
        var filmLayer = hero.querySelector('.hero-film');
        var rise = function (sel, y, dur, at, stagger) {
          var els = hero.querySelectorAll(sel);
          if (els.length) tl.fromTo(els, { y: y, opacity: 0 },
            { y: 0, opacity: 1, duration: dur, stagger: stagger || 0, clearProps: 'all' }, at);
        };
        if (filmLayer) tl.from(filmLayer, { opacity: 0, duration: 1.8, ease: 'power2.out' }, 0);
        rise('.hero-copy .meta', 14, 0.9, 0.5);
        rise('.wordmark', 64, 1.5, 0.62);
        rise('.hero-line', 20, 1.1, 0.9);
        rise('.hero-act > *', 18, 1, 1.05, 0.08);
        rise('.hero-stats li', 16, 1, 1.2, 0.08);
        rise('.film-note', 0, 0.9, 1.4);
      }

      var head = root.querySelector('.page-head');
      if (head && intro) {
        g.from(head.children, { y: 30, opacity: 0, duration: 1.2, stagger: 0.12, ease: 'power4.out', clearProps: 'all' });
      }

      if (!ST) return;

      /* The handoff: across the pinned hero's own scroll range the film dissolves
         and drifts back, so the moon gives way to the liquid field behind it
         rather than being cut off at the section edge. autoAlpha hides it at the
         end, so a spent hero never sits over the page catching clicks. */
      var stick = root.querySelector('.hero-stick');
      if (stick && hero) {
        var hFilm = hero.querySelector('.hero-film');
        var hRest = hero.querySelectorAll('.hero-copy, .hero-stats, .film-note');
        var gate = function (p) {
          var want = p > 0.04;
          if (want === fieldWant) return;
          fieldWant = want;
          applyFieldGate();
        };
        var handoff = g.timeline({
          scrollTrigger: {
            trigger: stick, start: 'top top', end: 'bottom bottom', scrub: 0.6,
            onUpdate: function (self) { gate(self.progress); },
            onRefresh: function (self) { gate(self.progress); }
          }
        });
        gate(0);
        if (hFilm) handoff.to(hFilm, { autoAlpha: 0, scale: 1.12, ease: 'none', duration: 1 }, 0);
        if (hRest.length) handoff.to(hRest, { autoAlpha: 0, y: -40, ease: 'none', duration: 0.6 }, 0);
      } else {
        /* no hero on this page: the gate has nothing to say, so let the field run */
        fieldWant = true;
        applyFieldGate();
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
    }, root);
  }

  function init(root, opts) {
    opts = opts || {};
    root = root || document.getElementById('main');
    if (!root) return;
    var page = html.getAttribute('data-page') || 'home';
    markNav(page);

    /* Hero film: a stand-in plate. Reduced motion holds the poster frame. */
    var film = root.querySelector('#heroFilm');
    if (film && reduced) {
      film.removeAttribute('autoplay');
      film.pause();
    }
    if (!root.querySelector('.hero-stick')) { fieldWant = true; applyFieldGate(); }

    labels(root);
    trueLoopMarquee(root.querySelector('#mq'), 22);
    briefForm(root);
    motion(root, opts.intro !== false);
  }

  function teardown() {
    if (ctxMotion) { ctxMotion.revert(); ctxMotion = null; }
    for (var i = 0; i < offs.length; i++) offs[i]();
    offs.length = 0;
    fieldWant = null;
  }

  global.TBPage = {
    init: init,
    teardown: teardown,
    reduced: reduced,
    field: function () { return field; },
    onField: function (cb) { if (field) cb(field); else fieldCbs.push(cb); },
    /* bg.js holds the field live across a transition, whatever the hero gate says */
    holdField: function (on) { fieldHold = !!on; applyFieldGate(); }
  };

  init(document.getElementById('main'), { intro: true });
})(window);
