/* REDLINE. — page furniture: smooth scroll, the hero reveal, films, the fan
 * curve's live dot, and the build-slot hold on order.html. The mechanism
 * itself lives in telemetry.js + heat.js. */
(function () {
  'use strict';
  var R = window.REDLINE;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var gsap = window.gsap;

  /* ---------- Lenis on GSAP's ticker (off under reduced motion) ---------- */
  if (!reduce && window.Lenis && gsap) {
    var lenis = new window.Lenis({ lerp: 0.12, wheelMultiplier: 1 });
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    window.REDLINE_LENIS = lenis;
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id.length < 2) return;
        var el = document.querySelector(id);
        if (!el) return;
        e.preventDefault();
        lenis.scrollTo(el, { offset: -72 });
        el.setAttribute('tabindex', '-1');
        el.focus({ preventScroll: true });
      });
    });
  }

  /* ---------- header: see-through over the top of a page, solid below it ---------- */
  var head = document.querySelector('.site-head');
  if (head) {
    var onScroll = function () { head.toggleAttribute('data-scrolled', window.scrollY > 24); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- the one reveal: the hero headline, once ---------- */
  if (!reduce && gsap) {
    var lines = document.querySelectorAll('.hero h1 .line > span');
    if (lines.length) {
      gsap.from(lines, { yPercent: 105, duration: 1.1, ease: 'power4.out', stagger: 0.09, delay: 0.1 });
      gsap.from('.hero .lede, .hero .actions, .hero .hint', { opacity: 0, y: 16, duration: 0.8, ease: 'power2.out', stagger: 0.08, delay: 0.55 });
    }
  }

  /* ---------- films: play only on screen, a pause control on each ---------- */
  document.querySelectorAll('[data-film]').forEach(function (fig) {
    var v = fig.querySelector('video');
    var btn = fig.querySelector('[data-film-toggle]');
    if (!v) return;
    if (reduce) { v.removeAttribute('autoplay'); v.pause(); return; }
    var paused = false, onScreen = false;
    var sync = function () {
      if (onScreen && !paused) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      else v.pause();
      if (btn) {
        btn.setAttribute('aria-pressed', String(paused));
        btn.textContent = paused ? 'Play film' : 'Pause film';
      }
    };
    new IntersectionObserver(function (es) { onScreen = es[0].isIntersecting; sync(); }, { threshold: 0.15 }).observe(fig);
    if (btn) btn.addEventListener('click', function () { paused = !paused; sync(); });
  });

  /* ---------- the fan curve's live dot (airflow.html) ---------- */
  var svgNow = document.querySelector('[data-now]');
  if (svgNow && R) {
    // the same axis mapping tools/bake.mjs used to draw the curve
    var W = 720, H = 400, L = 64, Rm = 20, Tm = 34, Bm = 56, t0 = 30, t1 = 84, r1 = R.SPEC.gpu.fanMaxRPM;
    var w = W - L - Rm, h = H - Tm - Bm;
    window.REDLINE_CURVE = function (el, s) {
      var t = Math.max(t0, Math.min(t1, s.tC));
      el.setAttribute('cx', (L + (t - t0) / (t1 - t0) * w).toFixed(1));
      el.setAttribute('cy', (Tm + h - s.rpm / r1 * h).toFixed(1));
    };
  }

  /* ---------- order.html: hold a build week on this device ---------- */
  var form = document.querySelector('[data-order]');
  if (form && R) {
    var KEY = 'redline:hold';
    var sel = form.querySelector('#week');
    var held = document.querySelector('[data-held]');
    var heldText = held && held.querySelector('[data-held-text]');
    var fmt = function (d) { return d.toLocaleDateString('en-SG', { day: 'numeric', month: 'short' }); };

    // the first build week that can still ship in the lead time, then three more
    var addWorkingDays = function (d, n) {
      var x = new Date(d);
      while (n > 0) { x.setDate(x.getDate() + 1); if (x.getDay() !== 0 && x.getDay() !== 6) n--; }
      return x;
    };
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var first = new Date(today);
    first.setDate(first.getDate() + ((8 - first.getDay()) % 7 || 7));    // next Monday
    for (var i = 0; i < 4; i++) {
      var mon = new Date(first); mon.setDate(first.getDate() + i * 7);
      var ships = addWorkingDays(mon, R.SPEC.leadDays - 1);
      var o = document.createElement('option');
      o.value = mon.getFullYear() + '-' + String(mon.getMonth() + 1).padStart(2, '0') + '-' + String(mon.getDate()).padStart(2, '0');   // local date, not UTC
      o.textContent = 'From ' + fmt(mon) + ', ships ' + fmt(ships);
      sel.appendChild(o);
    }

    var ref = function (hold) {
      var n = 0, s = hold.week + hold.email;
      for (var k = 0; k < s.length; k++) n = (n * 31 + s.charCodeAt(k)) >>> 0;
      return 'RL-' + (n % 90000 + 10000);
    };
    var show = function (hold) {
      var opt = [].slice.call(sel.options).filter(function (x) { return x.value === hold.week; })[0];
      heldText.textContent = 'Held on this device: the build week ' + (opt ? opt.textContent.charAt(0).toLowerCase() + opt.textContent.slice(1) : 'of ' + hold.week) +
        '. Your reference is ' + ref(hold) + ' — email it to build@redline.sg and we reply within one working day with the deposit invoice.';
      held.hidden = false;
      form.setAttribute('data-holding', '');
    };

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = form.querySelector('#email');
      if (!email.checkValidity()) { email.reportValidity(); return; }
      var hold = { week: sel.value, email: email.value.trim() };
      try { localStorage.setItem(KEY, JSON.stringify(hold)); } catch (err) { /* private mode */ }
      show(hold);
      held.focus();
    });
    var undo = document.querySelector('[data-undo]');
    if (undo) undo.addEventListener('click', function () {
      try { localStorage.removeItem(KEY); } catch (err) { /* ignore */ }
      held.hidden = true;
      form.removeAttribute('data-holding');
      sel.focus();
    });
    try {
      var saved = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (saved && [].some.call(sel.options, function (x) { return x.value === saved.week; })) {
        sel.value = saved.week;
        form.querySelector('#email').value = saved.email;
        show(saved);
      }
    } catch (err) { /* ignore */ }
  }

  var y = document.querySelector('[data-year]');
  if (y) y.textContent = String(new Date().getFullYear());
})();
