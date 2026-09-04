/* CHALKLINE — shared chrome. Loaded on every page: the mobile drawer,
   scroll reveals, the before/after pairs and the footer year. */

(function (root, doc) {
  'use strict';

  function $(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); }

  /* ---- Mobile drawer ------------------------------------------------------ */

  function initDrawer() {
    var btn = $('#burger'), drawer = $('#drawer');
    if (!btn || !drawer) return;

    function set(open) {
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      drawer.hidden = !open;
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

  /* ---- Reveals ------------------------------------------------------------ */

  var revealItems = [], io = null;

  function revealAll() { revealItems.forEach(function (el) { el.classList.add('in'); }); }

  function sweep() {
    for (var i = 0; i < revealItems.length; i++) {
      var el = revealItems[i];
      if (el.classList.contains('in')) continue;
      if (el.getBoundingClientRect().top < root.innerHeight * 0.92) {
        el.classList.add('in');
        if (io) io.unobserve(el);
      }
    }
  }

  function observe(el) {
    if (revealItems.indexOf(el) === -1) revealItems.push(el);
    if (io) io.observe(el); else el.classList.add('in');
  }

  function initReveals() {
    var items = $$('.reveal');
    if (!items.length) return;
    if (!root.IntersectionObserver || root.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      revealItems = items; revealAll(); return;
    }
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    items.forEach(observe);

    /* IntersectionObserver only runs as part of rendering; a throttled or
       never-composited tab can leave things observed but never notified.
       A reveal that never fires is content stuck at opacity zero, so this
       sweep runs off scroll input as well, and once at load. */
    root.addEventListener('scroll', sweep, { passive: true });
    root.addEventListener('resize', sweep);
    root.addEventListener('hashchange', function () { setTimeout(sweep, 60); });
    setTimeout(sweep, 400);
    setTimeout(revealAll, 6000);
  }

  /* Anything injected later that carries .reveal must be rescanned. */
  function rescanReveals(ctx) {
    $$('.reveal', ctx).forEach(function (el) {
      if (el.classList.contains('in')) return;
      if (!io) { el.classList.add('in'); return; }
      observe(el);
    });
    setTimeout(sweep, 50);
  }

  /* ---- Before / after pairs ---------------------------------------------- */

  function initPair(pair) {
    var frame = $('.pair__frame', pair), range = $('.pair__scrub', pair);
    if (!frame || !range) return;

    function set(pct) {
      pct = Math.max(0, Math.min(100, pct));
      frame.style.setProperty('--x', pct.toFixed(2) + '%');
      if (Math.round(+range.value) !== Math.round(pct)) range.value = Math.round(pct);
      range.setAttribute('aria-valuetext', Math.round(pct) + '% before, ' + Math.round(100 - pct) + '% after');
    }

    function fromEvent(e) {
      var r = frame.getBoundingClientRect();
      if (r.width < 1) return;
      set((e.clientX - r.left) / r.width * 100);
    }

    /* Pointer drives the wipe directly; the range stays for the keyboard. */
    var down = false;
    frame.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      down = true;
      frame.setPointerCapture(e.pointerId);
      fromEvent(e);
    });
    frame.addEventListener('pointermove', function (e) {
      if (down || e.pointerType === 'mouse') fromEvent(e);
    });
    var up = function (e) { down = false; try { frame.releasePointerCapture(e.pointerId); } catch (x) { /* already released */ } };
    frame.addEventListener('pointerup', up);
    frame.addEventListener('pointercancel', up);
    frame.addEventListener('pointerleave', function () { if (!down) set(+range.value); });
    frame.addEventListener('click', function (e) { e.preventDefault(); });

    range.addEventListener('input', function () { set(+range.value); });
    set(+range.value || 50);
  }

  function initPairs() { $$('.pair').forEach(initPair); }

  /* ---- Year --------------------------------------------------------------- */

  function initYear() {
    $$('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
  }

  function start() { initDrawer(); initReveals(); initPairs(); initYear(); }

  root.CHALK_UI = { rescanReveals: rescanReveals, initPair: initPair };

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start);
  else start();

})(window, document);
