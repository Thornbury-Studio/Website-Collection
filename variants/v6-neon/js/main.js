/* Zhang Zhijie — portfolio. v6 "NEON".
   Zero dependencies, no build step. Nothing here blocks first paint and
   nothing plays sound. */

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* -----------------------------------------------------------------------
     Role ticker in the hero eyebrow. The four things the profile section
     spells out, cycling one at a time.
     ----------------------------------------------------------------------- */
  function initRoles() {
    var el = document.getElementById('role');
    if (!el || reduced) return;
    var roles = ['Programmer', 'Game developer', 'Designer', 'Boxer', 'Musician'];
    var i = 0;
    setInterval(function () {
      if (document.hidden) return;
      i = (i + 1) % roles.length;
      el.classList.remove('is-swap');
      void el.offsetWidth;                    /* restart the keyframes cleanly */
      el.classList.add('is-swap');
      setTimeout(function () { el.textContent = roles[i]; }, 160);
    }, 2600);
  }

  /* -----------------------------------------------------------------------
     HUD counters. Real figures, counted up once when the hero is in view.
     ----------------------------------------------------------------------- */
  function initCounters() {
    var nums = document.querySelectorAll('[data-count]');
    if (!nums.length) return;

    function settle(el) {
      el.textContent = Number(el.dataset.count).toLocaleString('en-GB').replace(/,/g, ' ');
    }
    if (reduced) { nums.forEach(settle); return; }

    function run(el) {
      var target = Number(el.dataset.count);
      if (!target) { settle(el); return; }
      var t0 = performance.now(), dur = 1100;
      (function step(now) {
        var p = Math.min(1, (now - t0) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased).toLocaleString('en-GB').replace(/,/g, ' ');
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    }

    if (!('IntersectionObserver' in window)) { nums.forEach(run); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        run(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.4 });
    nums.forEach(function (n) { io.observe(n); });

    /* rAF and observers are both parked in a background tab — never leave
       the HUD reading zero */
    setTimeout(function () {
      nums.forEach(function (n) { if (n.textContent === '0' && n.dataset.count !== '0') settle(n); });
    }, 2600);
  }

  /* -----------------------------------------------------------------------
     Section blocks power up. Content is visible by default; the class is
     only applied when the observer exists.
     ----------------------------------------------------------------------- */
  function initRise() {
    if (reduced || !('IntersectionObserver' in window)) return;

    var blocks = document.querySelectorAll('.sect__head, .ch, .site, .rec, .facet, .bio, .form');
    blocks.forEach(function (b) { b.classList.add('rise'); });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e, n) {
        if (!e.isIntersecting) return;
        var d = Math.min(n, 6) * 55;
        setTimeout(function () { e.target.classList.add('is-up'); }, d);
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.04 });

    blocks.forEach(function (b) { io.observe(b); });
    setTimeout(function () {
      blocks.forEach(function (b) { b.classList.add('is-up'); });
    }, 2600);
  }

  /* -----------------------------------------------------------------------
     Pointer parallax on the box field. Cheap: one transform write, rate
     limited to a frame, and only while the hero is on screen.
     ----------------------------------------------------------------------- */
  function initParallax() {
    var boxes = document.getElementById('boxes');
    var hero = document.querySelector('.hero');
    if (!boxes || !hero || reduced || window.matchMedia('(pointer: coarse)').matches) return;

    var base = 'translate(-50%, -50%) skewX(-48deg) skewY(14deg) scale(.72)';
    var on = true, queued = false, mx = 0, my = 0;

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (e) { on = e[0].isIntersecting; },
        { threshold: 0.02 }).observe(hero);
    }

    hero.addEventListener('pointermove', function (e) {
      if (!on || queued) return;
      var r = hero.getBoundingClientRect();
      mx = ((e.clientX - r.left) / r.width - 0.5) * 26;
      my = ((e.clientY - r.top) / r.height - 0.5) * 18;
      queued = true;
      requestAnimationFrame(function () {
        boxes.style.transform = base + ' translate(' + mx.toFixed(1) + 'px,' + my.toFixed(1) + 'px)';
        queued = false;
      });
    }, { passive: true });
  }

  /* -----------------------------------------------------------------------
     Mark the section the reader is actually in, on both the rail and deck.
     ----------------------------------------------------------------------- */
  function initNav() {
    if (!('IntersectionObserver' in window)) return;
    var links = Array.prototype.slice.call(
      document.querySelectorAll('.rail__nav a, .deck__k'));
    var ids = ['work', 'showroom', 'records', 'about', 'contact'];

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) {
          a.setAttribute('aria-current',
            a.getAttribute('href') === '#' + en.target.id ? 'true' : 'false');
        });
      });
    }, { rootMargin: '-22% 0px -62% 0px' });

    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) io.observe(el);
    });
  }

  /* -----------------------------------------------------------------------
     Number keys drive the deck, the way the deck implies they would.
     ----------------------------------------------------------------------- */
  function initKeys() {
    var map = { '1': 'work', '2': 'showroom', '3': 'records', '4': 'about', '5': 'contact' };
    document.addEventListener('keydown', function (e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      var t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      var id = map[e.key];
      if (!id) return;
      var el = document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    });
  }

  /* -----------------------------------------------------------------------
     Contact. There is no backend here, so it says so rather than faking a
     success state.
     ----------------------------------------------------------------------- */
  function initForm() {
    var form = document.getElementById('contactForm');
    var out = document.getElementById('formOut');
    if (!form || !out) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = form.elements.email, brief = form.elements.brief;
      if (!email.value.trim() || email.validity.typeMismatch) {
        out.dataset.state = 'error';
        out.textContent = 'That address will not reach me. Check it and send again.';
        email.focus(); return;
      }
      if (!brief.value.trim()) {
        out.dataset.state = 'error';
        out.textContent = 'Say what we are building — one line is enough.';
        brief.focus(); return;
      }
      out.dataset.state = 'ok';
    out.textContent = 'Thanks — please contact us directly to continue.';
    });
  }

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();

  initRoles();
  initCounters();
  initRise();
  initParallax();
  initNav();
  initKeys();
  initForm();
})();
