/* WICK — chrome, reveals, flame cone, wishlist form.
   Zero inline scripts: CSP is script-src 'self'. */

(function (root, doc) {
  'use strict';

  function $(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }

  function initDrawer() {
    var btn = $('#burger');
    var drawer = $('#drawer');
    if (!btn || !drawer) return;

    function set(open) {
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      drawer.hidden = !open;
      doc.body.classList.toggle('is-nav', open);
    }

    btn.addEventListener('click', function () {
      set(btn.getAttribute('aria-expanded') !== 'true');
    });

    var mq = root.matchMedia('(min-width: 64rem)');
    var onChange = function (e) { if (e.matches) set(false); };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange);

    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !drawer.hidden) { set(false); btn.focus(); }
    });
  }

  var items = [];
  var io = null;

  function revealAll() { items.forEach(function (el) { el.classList.add('in'); }); }

  function sweep() {
    for (var i = 0; i < items.length; i++) {
      var el = items[i];
      if (el.classList.contains('in')) continue;
      if (el.getBoundingClientRect().top < root.innerHeight * 0.94) {
        el.classList.add('in');
        if (io) io.unobserve(el);
      }
    }
  }

  function observe(el) {
    if (items.indexOf(el) === -1) items.push(el);
    if (io) io.observe(el); else el.classList.add('in');
  }

  function initReveals() {
    var found = $$('.reveal');
    if (!found.length) return;
    if (!root.IntersectionObserver || root.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      items = found;
      revealAll();
      return;
    }
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -7% 0px', threshold: 0.04 });
    found.forEach(observe);
    root.addEventListener('scroll', sweep, { passive: true });
    root.addEventListener('resize', sweep);
    setTimeout(sweep, 400);
    setTimeout(revealAll, 6000);
  }

  function initYear() {
    $$('[data-year]').forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  /* The cone lives on photographs only. Type stays lit. Velocity spends
     the flame — rushing shrinks the pool of light. Reduced motion parks
     a wide still cone. Keyboard users never need it. */
  function initFlame() {
    var plates = $$('[data-flame]');
    if (!plates.length) return;
    var reduce = root.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var coarse = root.matchMedia('(pointer: coarse)').matches;

    plates.forEach(function (el) {
      if (reduce) {
        el.classList.add('is-still');
        return;
      }

      var mx = 0.38;
      var my = 0.42;
      var speed = 0;
      var lastX = 0;
      var lastY = 0;
      var lastT = 0;
      var lit = false;

      function paint() {
        var inner = (coarse ? 14 : 11) + Math.max(0, 8 - speed * 5);
        var outer = (coarse ? 44 : 38) + Math.max(0, 16 - speed * 14);
        el.style.setProperty('--mx', (mx * 100).toFixed(2) + '%');
        el.style.setProperty('--my', (my * 100).toFixed(2) + '%');
        el.style.setProperty('--inner-size', inner.toFixed(2) + 'vmax');
        el.style.setProperty('--outer-size', outer.toFixed(2) + 'vmax');
        speed *= 0.88;
      }

      function onPtr(e) {
        var r = el.getBoundingClientRect();
        if (r.width < 1 || r.height < 1) return;
        var x = (e.clientX - r.left) / r.width;
        var y = (e.clientY - r.top) / r.height;
        var t = root.performance ? root.performance.now() : Date.now();
        if (lastT) {
          var dt = Math.max(10, t - lastT);
          var dist = Math.hypot(e.clientX - lastX, e.clientY - lastY);
          speed = Math.min(2.6, dist / dt * 16);
        }
        lastX = e.clientX;
        lastY = e.clientY;
        lastT = t;
        mx = Math.min(1, Math.max(0, x));
        my = Math.min(1, Math.max(0, y));
        if (!lit) {
          lit = true;
          el.classList.add('is-lit');
        }
      }

      el.addEventListener('pointermove', onPtr, { passive: true });
      el.addEventListener('pointerdown', onPtr, { passive: true });
      doc.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        if (e.clientY < r.top || e.clientY > r.bottom || e.clientX < r.left || e.clientX > r.right) return;
        onPtr(e);
      }, { passive: true });
      paint();
      var looping = true;
      function loop() {
        if (!looping) return;
        paint();
        root.requestAnimationFrame(loop);
      }
      root.requestAnimationFrame(loop);
      root.addEventListener('pagehide', function () { looping = false; });
    });
  }

  function initForm() {
    var form = $('#box-form');
    var done = $('#box-done');
    if (!form || !done) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) return;
      form.hidden = true;
      done.hidden = false;
      done.focus();
    });
  }

  function start() {
    initDrawer();
    initReveals();
    initYear();
    initFlame();
    initForm();
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start);
  else start();

})(window, document);
