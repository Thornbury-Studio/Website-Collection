/* HOLLIN — shared behaviour: smooth scroll (Lenis), the mobile menu, the
   split-type reveals (GSAP SplitText + ScrollTrigger), plain reveals, and on
   The Rounds page the page temperature following the room in view.
   GSAP, ScrollTrigger, SplitText and Lenis are vendored (see LICENSES.md). */
(function () {
  var HOLL = window.HOLL || (window.HOLL = {});
  var H = window.HOLLIN;
  var root = document.documentElement;
  var hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  /* ---------- smooth scroll ---------- */
  if (!HOLL.reduced && typeof window.Lenis !== 'undefined') {
    var lenis = new Lenis({ lerp: 0.12, wheelMultiplier: 0.9, anchors: true });
    HOLL.lenis = lenis;
    if (hasGsap) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      (function loop(t) { lenis.raf(t); requestAnimationFrame(loop); })(performance.now());
    }
  }

  /* ---------- mobile menu ---------- */
  var btn = document.querySelector('.nav__menu'), menu = document.getElementById('menu');
  if (btn && menu) {
    var closeBtn = menu.querySelector('.menu__close');
    var open = function () {
      menu.hidden = false; btn.setAttribute('aria-expanded', 'true');
      if (HOLL.lenis) HOLL.lenis.stop();
      document.body.style.overflow = 'hidden';
      (menu.querySelector('a') || closeBtn).focus();
    };
    var close = function (refocus) {
      menu.hidden = true; btn.setAttribute('aria-expanded', 'false');
      if (HOLL.lenis) HOLL.lenis.start();
      document.body.style.overflow = '';
      if (refocus) btn.focus();
    };
    btn.addEventListener('click', open);
    closeBtn.addEventListener('click', function () { close(true); });
    menu.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { close(true); return; }
      if (e.key !== 'Tab') return;
      var f = [].slice.call(menu.querySelectorAll('a, button'));
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    window.addEventListener('pageshow', function () { if (!menu.hidden) close(false); });
  }

  /* ---------- split-type reveals ---------- */
  if (hasGsap && typeof window.SplitText !== 'undefined' && !HOLL.reduced) {
    gsap.registerPlugin(SplitText);
    var run = function () {
      document.querySelectorAll('.split-chars').forEach(function (el) {
        var split = SplitText.create(el, { type: 'chars,lines', mask: 'lines', charsClass: 'ch', linesClass: 'ln' });
        var inHero = !!el.closest('.hero, .page-hero');
        gsap.from(split.chars, {
          yPercent: 112, duration: inHero ? 1.15 : 0.95, ease: 'expo.out', stagger: inHero ? 0.055 : 0.04,
          delay: inHero ? 0.12 : 0,
          scrollTrigger: inHero ? null : { trigger: el, start: 'top bottom', once: true }
        });
      });
    };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(run); else run();
  }

  /* ---------- plain reveals ---------- */
  var rev = [].slice.call(document.querySelectorAll('.reveal'));
  if (rev.length) {
    if (HOLL.reduced || !('IntersectionObserver' in window)) rev.forEach(function (el) { el.classList.add('is-in'); });
    else {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
      }, { rootMargin: '0px 0px -10% 0px' });
      rev.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------- The Rounds: the page takes the temperature of the room in view ---------- */
  var rooms = [].slice.call(document.querySelectorAll('[data-room]'));
  if (rooms.length && H && H.readout && 'IntersectionObserver' in window) {
    var current = null;
    var setRoom = function (el) {
      if (el === current) return;
      current = el;
      var T = Number(el.getAttribute('data-room'));
      root.className = root.className.replace(/\bt-\d+\b/g, '').trim() + ' t-' + T;
      H.readout(T);
      var m = document.querySelector('meta[name="theme-color"]');
      if (m) m.setAttribute('content', H.at(T).ground);
    };
    var vis = new Map();
    var roomIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) { vis.set(e.target, e.isIntersecting); });
      /* the room that crosses the middle of the screen wins */
      var mid = window.innerHeight / 2, best = null;
      rooms.forEach(function (el) {
        if (!vis.get(el)) return;
        var r = el.getBoundingClientRect();
        if (r.top <= mid && r.bottom >= mid) best = el;
      });
      if (best) setRoom(best);
    }, { rootMargin: '-49% 0px -49% 0px' });
    rooms.forEach(function (el) { roomIO.observe(el); });
  }
})();
