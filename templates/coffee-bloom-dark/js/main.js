/* BLOOM. — site script. The bloom stage lives in js/bloom.js; this file is
   everything around it:
     1. Lenis, on GSAP's ticker so scroll and scrub share one clock;
     2. the wordmark rising in the hero, centre first, the way a bed domes;
     3. reveals — line-level for display headings, block for the rest;
     4. the calendar: every date on the site is computed from today, in
        Melbourne, by js/bloom-model.js — never typed;
     5. the order panel on bag.html.
   No JS, no GSAP, reduced motion: the page still reads, fully, at rest. */

(function () {
  'use strict';

  var B = window.BLOOM;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var root = document.documentElement;

  root.classList.add('js');
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  /* 1 — Lenis ---------------------------------------------------------- */

  if (!reduced && hasGsap && typeof window.Lenis !== 'undefined') {
    var lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    window.lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        var el = id.length > 1 && document.querySelector(id);
        if (!el) return;
        e.preventDefault();
        lenis.scrollTo(el, { offset: -64 });
        if (el.tabIndex < 0) el.setAttribute('tabindex', '-1');
        el.focus({ preventScroll: true });
      });
    });
  }

  /* header: solid once the page has moved ------------------------------ */

  var top = document.querySelector('.top');
  function onScroll() {
    if (top) top.classList.toggle('is-scrolled', window.scrollY > 24);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* 2 — the wordmark ---------------------------------------------------- */

  var giant = document.querySelector('[data-split]');
  if (giant && !reduced && hasGsap && typeof window.SplitType !== 'undefined') {
    var split = new SplitType(giant, { types: 'chars', charClass: 'ch' });
    gsap.set(giant, { visibility: 'visible' });
    gsap.from(split.chars, {
      yPercent: 104, duration: 1.25, ease: 'expo.out', delay: 0.15,
      stagger: { each: 0.07, from: 'center' }
    });
  }
  if (giant) root.classList.add('split-done');

  /* 3 — reveals --------------------------------------------------------- */

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
        gsap.from(el, {
          y: 26, opacity: 0, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true }
        });
      }
    });
    document.querySelectorAll('[data-reveal="block"]').forEach(function (el) {
      gsap.from(el, {
        y: 36, opacity: 0, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true }
      });
    });
    document.querySelectorAll('[data-reveal="rows"]').forEach(function (group) {
      gsap.from(group.children, {
        y: 16, opacity: 0, duration: 0.7, ease: 'power2.out', stagger: 0.05,
        scrollTrigger: { trigger: group, start: 'top 88%', once: true }
      });
    });
    // fonts shift line breaks; recompute trigger positions once they land
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
    }
  }

  /* 4 — the calendar ---------------------------------------------------- */

  var y = document.querySelector('[data-year]');
  if (y) y.textContent = String(new Date().getFullYear());

  if (!B) return;
  var s = B.schedule(new Date());

  function stamp(text) {
    var el = document.createElement('span');
    el.className = 'stamp stamp--inline';
    el.textContent = text;
    return el;
  }

  function fill(sel, parts) {
    document.querySelectorAll(sel).forEach(function (el) {
      el.textContent = '';
      parts.forEach(function (p) { el.appendChild(typeof p === 'string' ? document.createTextNode(p) : p); });
    });
  }

  fill('[data-shelf]', [
    'On the shelf today: roasted ' + B.fmt(s.lastRoast) + '. ',
    stamp('Day ' + s.dayNow)
  ]);
  fill('[data-next]', [
    'Next roast ', stamp(B.fmt(s.nextRoast)),
    '. Orders for it close ' + B.fmt(s.cutoff) + ' at midnight.'
  ]);
  // the date stamped on the bag: this week's roast on the home page, the
  // next one on the bag page — the bag you would actually be sent
  document.querySelectorAll('[data-bag-date]').forEach(function (el) {
    var n = el.getAttribute('data-bag-date') === 'next' ? s.nextRoast : s.lastRoast;
    el.textContent = B.short(n) + ' ' + String(new Date(n * 86400000).getUTCFullYear()).slice(2);
  });
  fill('[data-foot-week]', ['Roasting ' + B.fmt(s.nextRoast) + ', posting ' + B.fmt(s.post, true) + '.']);
  fill('[data-window]', [
    'Roasted ', stamp(B.fmt(s.nextRoast)), ', posted ' + B.fmt(s.post) +
    ', with you by ' + B.fmt(s.arriveTo) + '. Start drinking it ' + B.fmt(s.windowFrom) +
    '; finish it by ' + B.fmt(s.windowTo) + '.'
  ]);

  /* 5 — the order panel -------------------------------------------------- */

  var form = document.querySelector('[data-order]');
  if (!form) return;

  var qtyInput = form.querySelector('#qty');
  var minus = form.querySelector('[data-step="-1"]');
  var plus = form.querySelector('[data-step="1"]');
  var out = function (k) { return form.querySelector('[data-t="' + k + '"]'); };
  var confirm = document.querySelector('[data-confirm]');
  var KEY = 'bloom.hold.v1';

  function money(n) { return 'A$' + (n % 1 ? n.toFixed(2) : String(n)); }

  function method() {
    var m = form.querySelector('input[name="method"]:checked');
    return m ? m.value : 'post';
  }

  function recalc() {
    var q = Math.max(1, Math.min(6, parseInt(qtyInput.value, 10) || 1));
    qtyInput.value = String(q);
    var collect = method() === 'collect';
    var tot = B.orderTotal(q, collect);
    out('goods').textContent = q + ' × ' + money(B.LOT.priceAud) + ' = ' + money(tot.goods);
    out('post').textContent = collect ? 'Collect from Hope Street, free' :
      tot.post ? money(tot.post) + ' (free from ' + B.LOT.freePostFrom + ' bags)' : 'Free';
    out('total').textContent = money(tot.total);
    out('when').textContent = collect ?
      'Ready at the roastery door from ' + B.fmt(s.post) + ', 8 am.' :
      'Posted ' + B.fmt(s.post) + '; with you ' + B.short(s.arriveFrom) + '–' + B.short(s.arriveTo) +
      ', on day ' + (s.arriveFrom - s.nextRoast) + ' or ' + (s.arriveTo - s.nextRoast) + '.';
    minus.disabled = q <= 1;
    plus.disabled = q >= 6;
  }

  minus.addEventListener('click', function () { qtyInput.value = String(+qtyInput.value - 1); recalc(); });
  plus.addEventListener('click', function () { qtyInput.value = String(+qtyInput.value + 1); recalc(); });
  qtyInput.addEventListener('change', recalc);
  form.querySelectorAll('input[name="method"]').forEach(function (r) { r.addEventListener('change', recalc); });

  function showHold(h) {
    if (!confirm) return;
    confirm.hidden = false;
    confirm.querySelector('[data-t="held"]').textContent =
      h.qty + (h.qty > 1 ? ' bags' : ' bag') + ' held in the roast on ' + B.fmt(h.roast) + ', ' +
      (h.collect ? 'for collection.' : 'for Tuesday’s post.');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var hold = { qty: +qtyInput.value, collect: method() === 'collect', roast: s.nextRoast };
    try { localStorage.setItem(KEY, JSON.stringify(hold)); } catch (err) { /* private mode */ }
    showHold(hold);
    confirm.focus();
  });

  var undo = document.querySelector('[data-undo]');
  if (undo) undo.addEventListener('click', function () {
    try { localStorage.removeItem(KEY); } catch (err) { /* ignore */ }
    confirm.hidden = true;
    qtyInput.focus();
  });

  try {
    var saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved && saved.roast === s.nextRoast) {
      qtyInput.value = String(saved.qty);
      var r = form.querySelector('input[name="method"][value="' + (saved.collect ? 'collect' : 'post') + '"]');
      if (r) r.checked = true;
      showHold(saved);
    }
  } catch (err) { /* ignore */ }

  recalc();
})();
