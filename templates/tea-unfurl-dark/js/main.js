/* UNFURL. — everything around the stage (which is js/stage.js):
     1. Lenis on GSAP's ticker, so scroll and scrub share one clock;
     2. reveals — line-by-line for display headings (SplitType), blocks and rows;
     3. the garden film: plays only while on screen, never under reduced motion;
     4. the order panel on tin.html, priced by js/steep-model.js.
   No script, no GSAP, reduced motion: every page still reads, fully, at rest. */

(function () {
  'use strict';

  var S = window.STEEP;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var root = document.documentElement;
  root.classList.add('js');
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  /* 1 — Lenis ------------------------------------------------------------ */

  if (!reduced && hasGsap && typeof window.Lenis !== 'undefined') {
    var lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    window.lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href*="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var url = new URL(a.href, location.href);
        if (url.pathname !== location.pathname || !url.hash) return;
        var el = document.querySelector(url.hash);
        if (!el) return;
        e.preventDefault();
        lenis.scrollTo(el, { offset: 0 });
        if (el.tabIndex < 0) el.setAttribute('tabindex', '-1');
        el.focus({ preventScroll: true });
      });
    });
  }

  var top = document.querySelector('.top');
  function onScroll() { if (top) top.classList.toggle('is-scrolled', window.scrollY > 24); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var y = document.querySelector('[data-year]');
  if (y) y.textContent = String(new Date().getFullYear());

  /* 2 — reveals ------------------------------------------------------------ */

  if (!reduced && hasGsap) {
    var hasSplit = typeof window.SplitType !== 'undefined';
    document.querySelectorAll('[data-reveal="lines"]').forEach(function (el) {
      if (hasSplit) {
        var s = new SplitType(el, { types: 'lines', lineClass: 'line-inner' });
        s.lines.forEach(function (line) {
          var mask = document.createElement('span');
          mask.className = 'line-mask';
          line.parentNode.insertBefore(mask, line);
          mask.appendChild(line);
        });
        gsap.from(el.querySelectorAll('.line-inner'), {
          yPercent: 108, duration: 1.05, ease: 'power3.out', stagger: 0.08,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true }
        });
      } else {
        gsap.from(el, { y: 24, opacity: 0, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
      }
    });
    document.querySelectorAll('[data-reveal="block"]').forEach(function (el) {
      gsap.from(el, { y: 40, opacity: 0, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
    });
    document.querySelectorAll('[data-reveal="rows"]').forEach(function (group) {
      gsap.from(group.children, {
        y: 18, opacity: 0, duration: .75, ease: 'power2.out', stagger: .06,
        scrollTrigger: { trigger: group, start: 'top 88%', once: true }
      });
    });
    // the display face lands late and moves line breaks; recompute trigger points
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }

  /* 3 — the garden film ----------------------------------------------------- */

  document.querySelectorAll('video[data-loop]').forEach(function (v) {
    v.muted = true;
    if (reduced) { v.removeAttribute('autoplay'); v.pause(); return; }
    var play = function () { var p = v.play(); if (p && p.catch) p.catch(function () {}); };
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { if (es[0].isIntersecting) play(); else v.pause(); }, { threshold: 0.05 }).observe(v);
    } else play();
  });

  /* 4 — the order panel -------------------------------------------------------- */

  var form = document.querySelector('[data-order]');
  if (!form || !S) return;

  var qty = form.querySelector('#qty');
  var minus = form.querySelector('[data-step="-1"]');
  var plus = form.querySelector('[data-step="1"]');
  var outp = function (k) { return form.querySelector('[data-t="' + k + '"]'); };
  var confirmBox = document.querySelector('[data-confirm]');
  var KEY = 'unfurl.hold.v1';
  var MAX = S.TIN.maxQty;

  function method() {
    var m = form.querySelector('input[name="method"]:checked');
    return m ? m.value : 'courier';
  }

  function recalc() {
    var n = Math.max(1, Math.min(MAX, parseInt(qty.value, 10) || 1));
    qty.value = String(n);
    var collect = method() === 'collect';
    var tot = S.orderTotal(n, collect);
    outp('goods').textContent = n + ' × ' + S.money(S.TIN.priceSgd) + ' = ' + S.money(tot.goods);
    outp('post').textContent = collect ? 'Collect in Joo Chiat, free' :
      tot.post ? S.money(tot.post) + ' (free from ' + S.TIN.freeFrom + ' tins)' : 'Free';
    outp('total').textContent = S.money(tot.total);
    outp('pots').textContent = S.num(n * S.D.potsPerTin) + ' pots of tea';
    minus.disabled = n <= 1;
    plus.disabled = n >= MAX;
  }

  minus.addEventListener('click', function () { qty.value = String(+qty.value - 1); recalc(); });
  plus.addEventListener('click', function () { qty.value = String(+qty.value + 1); recalc(); });
  qty.addEventListener('change', recalc);
  form.querySelectorAll('input[name="method"]').forEach(function (r) { r.addEventListener('change', recalc); });

  function showHold(h) {
    if (!confirmBox) return;
    confirmBox.hidden = false;
    confirmBox.querySelector('[data-t="held"]').textContent =
      h.qty + (h.qty > 1 ? ' tins' : ' tin') + ' held for you, ' +
      (h.collect ? 'to collect in Joo Chiat' : 'for courier delivery') + '. Reference ' + h.ref + '.';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    // a reference the customer quotes by email; no personal data is kept here
    var hold = { qty: +qty.value, collect: method() === 'collect',
      ref: 'UNF-' + Date.now().toString(36).toUpperCase().slice(-6) };
    try { localStorage.setItem(KEY, JSON.stringify(hold)); } catch (err) { /* private mode */ }
    showHold(hold);
    confirmBox.focus();
  });

  var undo = document.querySelector('[data-undo]');
  if (undo) undo.addEventListener('click', function () {
    try { localStorage.removeItem(KEY); } catch (err) { /* ignore */ }
    confirmBox.hidden = true;
    qty.focus();
  });

  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved && saved.qty && saved.ref) {
      qty.value = String(saved.qty);
      var r = form.querySelector('input[name="method"][value="' + (saved.collect ? 'collect' : 'courier') + '"]');
      if (r) r.checked = true;
      showHold(saved);
    }
  } catch (err) { /* ignore */ }

  recalc();
})();
