/* MABEL SEOW — shared chrome, loaded on every page: the mobile drawer,
   scroll reveals and the footer year. */

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

    var mq = root.matchMedia('(min-width: 60rem)');
    var onChange = function (e) { if (e.matches) set(false); };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange);

    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !drawer.hidden) { set(false); btn.focus(); }
    });
  }

  /* ---- Reveals ------------------------------------------------------------ */

  var items = [], io = null;

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
      items = found; revealAll(); return;
    }
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -7% 0px', threshold: 0.04 });
    found.forEach(observe);

    /* IntersectionObserver only runs as part of rendering, so a throttled or
       never-composited tab can leave elements observed but never notified — and
       a reveal that never fires is content stuck at opacity zero. This sweep
       runs off real scroll input as well, and everything shows regardless at 6s. */
    root.addEventListener('scroll', sweep, { passive: true });
    root.addEventListener('resize', sweep);
    root.addEventListener('hashchange', function () { setTimeout(sweep, 60); });
    setTimeout(sweep, 400);
    setTimeout(revealAll, 6000);
  }

  /* Anything injected later carrying .reveal has to be rescanned. */
  function rescanReveals(ctx) {
    $$('.reveal', ctx).forEach(function (el) {
      if (el.classList.contains('in')) return;
      if (!io) { el.classList.add('in'); return; }
      observe(el);
    });
    setTimeout(sweep, 50);
  }

  /* ---- Year --------------------------------------------------------------- */

  function initYear() {
    $$('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });
  }

  /* ---- Lease remaining ---------------------------------------------------- */

  /* Years left on a 99-year lease are the one number on this site that goes
     stale on its own, so they are computed rather than typed. The markup
     carries this year's value already, so a page without JS is still right. */
  function initLease() {
    var now = new Date().getFullYear();
    $$('[data-lease-from]').forEach(function (el) {
      var from = parseInt(el.getAttribute('data-lease-from'), 10);
      if (!from) return;
      el.textContent = String(Math.max(0, from + 99 - now));
    });
  }

  function start() { initDrawer(); initReveals(); initYear(); initLease(); }

  root.SEOW_UI = { rescanReveals: rescanReveals };

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start);
  else start();

})(window, document);
