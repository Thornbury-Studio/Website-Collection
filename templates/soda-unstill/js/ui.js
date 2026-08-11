/* UNSTILL — shared chrome: flavour switcher, drawer, reveals, marquee builder,
   basket badge. Loaded on every page. */
(function (root, doc) {
  'use strict';

  var UNSTILL = root.UNSTILL;

  function $(s, c) { return (c || doc).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); }

  /* ---- flavour switcher --------------------------------------------------- */

  function paintFlavors() {
    var cur = UNSTILL.getFlavor();
    $$('.flavors button').forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-flavor') === cur ? 'true' : 'false');
    });
  }

  function initFlavors() {
    $$('.flavors').forEach(function (group) {
      group.addEventListener('click', function (e) {
        var btn = e.target.closest ? e.target.closest('[data-flavor]') : null;
        if (!btn) return;
        UNSTILL.setFlavor(btn.getAttribute('data-flavor'));
      });
    });
    root.addEventListener('unstill:flavor', paintFlavors);
    paintFlavors();
  }

  /* ---- drawer -------------------------------------------------------------- */

  function initDrawer() {
    var btn = $('#burger'), drawer = $('#drawer');
    if (!btn || !drawer) return;
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      drawer.hidden = open;
    });
    var mq = root.matchMedia('(min-width: 64rem)');
    var close = function (e) {
      if (e.matches) { drawer.hidden = true; btn.setAttribute('aria-expanded', 'false'); }
    };
    if (mq.addEventListener) mq.addEventListener('change', close);
    else if (mq.addListener) mq.addListener(close);
  }

  /* ---- reveals ------------------------------------------------------------- */

  function initReveals() {
    var items = $$('.reveal');
    if (!items.length) return;
    var showAll = function () {
      items.forEach(function (el) { el.classList.add('is-in'); });
    };
    if (!('IntersectionObserver' in root) ||
        root.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      showAll();
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    items.forEach(function (el) { io.observe(el); });
    /* Failsafe: a hidden tab must not serve a blank page. */
    root.setTimeout(function () {
      if (doc.visibilityState !== 'visible') showAll();
    }, 1200);
    doc.addEventListener('visibilitychange', function () {
      if (doc.visibilityState !== 'visible') showAll();
    });
  }

  /* ---- marquee: the true-loop from PATTERNS.md ----------------------------- */

  function trueLoopMarquee(track, secondsPerCopy) {
    if (!track || !track.firstElementChild) return;
    var master = track.firstElementChild.cloneNode(true);
    var timer;

    function build() {
      /* Rule 3: detach the animation before touching duration/children, or
         the browser replays elapsed time against the new duration — a
         visible jump the instant this runs. */
      track.style.animationName = 'none';
      while (track.children.length > 1) track.removeChild(track.lastElementChild);
      var rowW = track.firstElementChild.getBoundingClientRect().width;
      var boxW = (track.parentElement || doc.body).getBoundingClientRect().width;
      if (rowW < 1) { track.style.animationName = ''; return; }
      var perHalf = Math.max(1, Math.ceil(boxW / rowW));
      for (var i = 1; i < perHalf * 2; i++) {
        var copy = master.cloneNode(true);
        copy.setAttribute('aria-hidden', 'true');
        track.appendChild(copy);
      }
      track.style.animationDuration = (secondsPerCopy * perHalf) + 's';
      void track.offsetWidth; /* commit the detach before reattaching */
      track.style.animationName = '';
    }

    build();
    root.addEventListener('resize', function () {
      root.clearTimeout(timer);
      timer = root.setTimeout(build, 200);
    });
  }

  function initMarquees() {
    $$('.marquee').forEach(function (t) {
      trueLoopMarquee(t, parseFloat(t.getAttribute('data-speed')) || 22);
    });
  }

  /* ---- basket badge -------------------------------------------------------- */

  function initBasket() {
    var btn = $('#basketBtn');
    if (!btn || !UNSTILL) return;
    var n = $('#basketCount', btn);
    function paint() {
      var c = UNSTILL.basket.count();
      if (n) n.textContent = c;
      btn.setAttribute('data-empty', c === 0 ? '1' : '0');
      btn.setAttribute('aria-label', c === 0
        ? 'Your crate is empty'
        : 'Your crate, ' + c + (c === 1 ? ' item' : ' items'));
    }
    paint();
    root.addEventListener('unstill:basket', paint);
    root.addEventListener('storage', function (e) {
      if (e.key === 'unstill.basket.v1') paint();
    });
  }

  /* ---- video autoplay vs reduced motion ------------------------------------ */

  function initVideos() {
    var mq = root.matchMedia('(prefers-reduced-motion: reduce)');
    var apply = function () {
      $$('video[autoplay]').forEach(function (v) {
        if (mq.matches) { v.pause(); }
        else { var p = v.play(); if (p && p.catch) p.catch(function () { /* blocked */ }); }
      });
    };
    apply();
    if (mq.addEventListener) mq.addEventListener('change', apply);
  }

  function initYear() {
    $$('[data-year]').forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  function boot() {
    initFlavors();
    initDrawer();
    initReveals();
    initMarquees();
    initBasket();
    initVideos();
    initYear();
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot);
  else boot();

  root.UnstillUI = { $: $, $$: $$ };
})(window, document);
