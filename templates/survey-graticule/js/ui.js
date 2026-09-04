/* GRATICULE — shared chrome. Loaded on every page: the Office/Field switch,
   the mobile drawer, scroll reveals and the footer year. */

(function (root, doc) {
  'use strict';

  function $(sel, ctx) { return (ctx || doc).querySelector(sel); }
  function $$(sel, ctx) {
    return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel));
  }

  /* ---- Office / Field ----------------------------------------------------- */

  function initMode() {
    var btn = $('#modeBtn');
    if (!btn) return;
    var el = doc.documentElement;

    function paint() {
      var field = el.getAttribute('data-mode') === 'field';
      btn.setAttribute('aria-pressed', field ? 'true' : 'false');
      btn.setAttribute('aria-label', field
        ? 'Switch to Office, the drafting-sheet display'
        : 'Switch to Field, the dark instrument display used on site');
      var meta = $('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', field ? '#0b0e12' : '#ece7dc');
    }

    btn.addEventListener('click', function () {
      var field = el.getAttribute('data-mode') === 'field';
      if (field) el.removeAttribute('data-mode');
      else el.setAttribute('data-mode', 'field');
      try {
        localStorage.setItem('graticule.mode', field ? 'office' : 'field');
      } catch (e) { /* private mode */ }
      paint();
      /* The map holds its own palette, so it has to be told to redraw. */
      root.dispatchEvent(new CustomEvent('graticule:mode', { detail: { field: !field } }));
    });

    paint();
  }

  /* ---- Mobile drawer ------------------------------------------------------ */

  function initDrawer() {
    var btn = $('#burger'), drawer = $('#drawer');
    if (!btn || !drawer) return;

    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', open ? 'false' : 'true');
      drawer.hidden = open;
    });

    /* A resize past the desktop breakpoint must not leave the drawer stuck
       open behind the horizontal nav. */
    var mq = root.matchMedia('(min-width: 64rem)');
    var close = function (e) {
      if (e.matches) { drawer.hidden = true; btn.setAttribute('aria-expanded', 'false'); }
    };
    if (mq.addEventListener) mq.addEventListener('change', close);
    else if (mq.addListener) mq.addListener(close);

    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !drawer.hidden) {
        drawer.hidden = true;
        btn.setAttribute('aria-expanded', 'false');
        btn.focus();
      }
    });
  }

  /* ---- Reveals ------------------------------------------------------------ */

  function initReveals() {
    var items = $$('.reveal');
    if (!items.length) return;
    if (!root.IntersectionObserver ||
        root.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      items.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    items.forEach(function (el) { io.observe(el); });

    /* IntersectionObserver only runs as part of the browser's rendering
       steps. A tab that is throttled, backgrounded or never composited can
       leave an element observed but never notified — and a reveal that never
       fires is content permanently stuck at opacity zero, which is a far
       worse failure than no animation at all. This sweep runs off the scroll
       input instead, and reveals anything already in view. */
    function sweep() {
      for (var i = 0; i < items.length; i++) {
        var el = items[i];
        if (el.classList.contains('in')) continue;
        if (el.getBoundingClientRect().top < root.innerHeight * 0.92) {
          el.classList.add('in');
          io.unobserve(el);
        }
      }
    }
    root.addEventListener('scroll', sweep, { passive: true });
    root.addEventListener('resize', sweep);
  }

  /* ---- Year --------------------------------------------------------------- */

  function initYear() {
    $$('[data-year]').forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  function start() { initMode(); initDrawer(); initReveals(); initYear(); }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start);
  else start();

})(window, document);
