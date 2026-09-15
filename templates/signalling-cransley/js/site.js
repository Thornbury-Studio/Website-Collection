/* Cransley Signal Works — page furniture: drawer, reveals, docket form. */
(function () {
  'use strict';

  /* ---- mobile drawer ---- */
  var burger = document.getElementById('burger');
  var drawer = document.getElementById('drawer');
  if (burger && drawer) {
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', open ? 'false' : 'true');
      drawer.dataset.open = open ? 'false' : 'true';
    });
    drawer.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        burger.setAttribute('aria-expanded', 'false');
        drawer.dataset.open = 'false';
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.dataset.open === 'true') {
        burger.setAttribute('aria-expanded', 'false');
        drawer.dataset.open = 'false';
        burger.focus();
      }
    });
  }

  /* ---- hero entrance: the headline rises out of its own slots ---- */
  var hero = document.getElementById('hero');
  if (hero) {
    if (document.readyState === 'complete') {
      requestAnimationFrame(function () { hero.classList.add('ready'); });
    } else {
      window.addEventListener('load', function () {
        requestAnimationFrame(function () { hero.classList.add('ready'); });
      });
      /* never let a slow font keep the headline off the page */
      window.setTimeout(function () { hero.classList.add('ready'); }, 1200);
    }
  }

  /* ---- section reveals, staggered within each group ----------------
     Driven by a measured sweep rather than IntersectionObserver. An
     element that starts at opacity 0 and waits on an observer callback
     is one dropped callback away from being invisible for good — which
     does happen (background tabs, some embedded views). Geometry never
     lies, so we read rects on scroll and on a short rAF tick after load,
     and a failsafe reveals anything still hidden after three seconds.
  ------------------------------------------------------------------ */
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var pending = [];

  document.querySelectorAll('.sec-head, .rule blockquote, .docket-grid, .foot-grid, .book-stats')
    .forEach(function (t) { t.classList.add('reveal'); pending.push(t); });

  ['.sched-row', '.jobs tbody tr', '.task'].forEach(function (sel) {
    document.querySelectorAll(sel).forEach(function (el, i) {
      el.style.setProperty('--i', i);
      pending.push(el);
    });
  });

  function show(el) {
    el.classList.add('in');
    if (el.classList.contains('book-stats')) {
      if (reduce) return;
      el.querySelectorAll('.stat-n[data-count]').forEach(function (s) {
        countUp(s, parseInt(s.dataset.count, 10));
      });
    }
  }

  function sweep() {
    var h = window.innerHeight || document.documentElement.clientHeight || 800;
    for (var k = pending.length - 1; k >= 0; k--) {
      /* no lower bound: anything already scrolled past is shown, not skipped */
      if (pending[k].getBoundingClientRect().top < h * 0.92) { show(pending.splice(k, 1)[0]); }
    }
  }

  var ticking = false;
  function onScroll() {
    if (ticking || !pending.length) return;
    ticking = true;
    requestAnimationFrame(function () { ticking = false; sweep(); });
  }

  sweep();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  window.addEventListener('load', sweep);
  /* fonts and late layout can move things under the fold */
  var ticks = 0;
  (function settle() {
    sweep();
    if (++ticks < 40 && pending.length) setTimeout(settle, 50);
  }());
  /* nothing stays invisible, whatever happens */
  window.setTimeout(function () { while (pending.length) show(pending.pop()); }, 3000);

  /* The true figure is already in the markup. We only ever count up FROM
     inside the first animation frame, so if rAF never runs — background
     tab, embedded view — the correct number is what stays on screen. */
  function countUp(el, target) {
    if (!target) return;
    var dur = 1100, t0 = null;
    function step(t) {
      if (t0 === null) t0 = t;
      var p = Math.min(1, (t - t0) / dur);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---- docket form ---- */
  var form = document.getElementById('docketForm');
  var note = document.getElementById('formNote');
  if (form && note) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var required = form.querySelectorAll('[required]');
      var bad = null;
      required.forEach(function (f) {
        var ok = f.value.trim() !== '' && (f.type !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value));
        f.setAttribute('aria-invalid', ok ? 'false' : 'true');
        if (!ok && !bad) bad = f;
      });
      if (bad) {
        note.dataset.state = 'error';
        note.textContent = 'We need the box name, the railway and an email before we can raise a docket.';
        bad.focus();
        return;
      }
      var box = form.querySelector('#f-box').value.trim();
      var num = 'CSW-' + String(1180 + Math.floor(Math.random() * 90));
      note.dataset.state = 'sent';
      note.textContent = 'Docket ' + num + ' raised for ' + box + '. Someone from the shop will call within two working days.';
      form.reset();
      required.forEach(function (f) { f.setAttribute('aria-invalid', 'false'); });
    });
  }
}());
