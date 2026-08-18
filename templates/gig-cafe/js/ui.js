/* GIG Cafe — shared chrome: reveals, nav sheet, open/closed pill, price fills.
   No frameworks, no inline scripts. */
(function () {
  'use strict';

  document.documentElement.classList.remove('no-js');
  document.documentElement.classList.add('js-anim');

  /* --- reveal on scroll, with belt and braces ----------------------------- */
  var io = null;

  function revealNow(el) { el.classList.add('is-in'); }

  function inViewport(el) {
    var r = el.getBoundingClientRect();
    return r.top < (window.innerHeight || 0) && r.bottom > 0;
  }

  function sweep() {
    document.querySelectorAll('.reveal:not(.is-in)').forEach(function (el) {
      if (inViewport(el)) revealNow(el);
    });
  }

  function rescanReveals() {
    var els = document.querySelectorAll('.reveal:not(.is-in)');
    if (!io) { els.forEach(revealNow); return; }
    els.forEach(function (el) { io.observe(el); });
    sweep();
  }
  window.rescanReveals = rescanReveals;

  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          revealNow(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

    // Failsafe: if nothing has revealed shortly after load, show everything.
    setTimeout(function () {
      if (!document.querySelector('.reveal.is-in')) {
        document.querySelectorAll('.reveal').forEach(revealNow);
      }
    }, 1400);

    // IO can miss anchor jumps and injected markup; a cheap throttled sweep
    // catches anything already in the viewport that IO never fired for.
    var tick = false;
    function onScroll() {
      if (tick) return;
      tick = true;
      setTimeout(function () { tick = false; sweep(); }, 200);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    window.addEventListener('hashchange', sweep);
  } else {
    document.querySelectorAll('.reveal').forEach(revealNow);
  }

  /* --- mobile sheet nav --------------------------------------------------- */
  var toggle = document.querySelector('.nav-toggle');
  var sheet = document.getElementById('navSheet');
  if (toggle && sheet) {
    var close = sheet.querySelector('.sheet-close');
    function setOpen(open) {
      sheet.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      sheet.setAttribute('aria-hidden', open ? 'false' : 'true');
      if (open) { close.focus(); } else { toggle.focus(); }
    }
    toggle.addEventListener('click', function () { setOpen(true); });
    close.addEventListener('click', function () { setOpen(false); });
    sheet.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });
    sheet.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setOpen(false); });
    });
  }

  /* --- live open/closed pill, computed in the cafe's own timezone --------- */
  // Open daily 10.00am-9.00pm (verified against the cafe's published hours,
  // OpenRice and Chope, Aug 2026). One window, every day.
  var OPEN_MIN = 10 * 60;
  var CLOSE_MIN = 21 * 60;

  function sgNow() {
    try {
      var parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Singapore', hour: 'numeric', minute: 'numeric', hour12: false
      }).formatToParts(new Date());
      var h = 0, m = 0;
      parts.forEach(function (p) {
        if (p.type === 'hour') h = parseInt(p.value, 10) % 24;
        if (p.type === 'minute') m = parseInt(p.value, 10);
      });
      return h * 60 + m;
    } catch (e) { return null; }
  }

  function paintPill() {
    var pill = document.querySelector('[data-open-pill]');
    var line = document.querySelector('[data-open-line]');
    if (!pill || !line) return;
    var now = sgNow();
    if (now === null) { line.textContent = 'Open daily 10am–9pm'; return; }
    if (now >= OPEN_MIN && now < CLOSE_MIN) {
      pill.dataset.state = 'open';
      line.textContent = (CLOSE_MIN - now <= 45)
        ? 'Closing soon · until 9pm'
        : 'Open now · until 9pm';
    } else {
      pill.dataset.state = 'closed';
      line.textContent = 'Closed · opens 10am daily';
    }
  }
  paintPill();
  setInterval(paintPill, 60000);

  /* --- prices in marketing copy come from the catalogue, never typed ------ */
  function findItem(name) {
    if (!window.GIG_MENU) return null;
    var groups = window.GIG_MENU.groups;
    for (var g = 0; g < groups.length; g += 1) {
      var items = groups[g].items;
      for (var i = 0; i < items.length; i += 1) {
        if (items[i].name === name) return items[i];
      }
    }
    return null;
  }

  document.querySelectorAll('[data-price]').forEach(function (el) {
    var item = findItem(el.getAttribute('data-price'));
    if (!item) return;
    if (typeof item.price === 'number') {
      el.textContent = '$' + item.price.toFixed(2);
    } else if (item.variants && item.variants.length) {
      el.textContent = 'from $' + Math.min.apply(null, item.variants.map(function (v) { return v.price; })).toFixed(2);
    } else {
      el.textContent = 'Seasonal';
    }
  });

  /* --- highlight today in the visit-page hours table ---------------------- */
  var rows = document.querySelectorAll('.hours-table tr[data-day]');
  if (rows.length) {
    try {
      var day = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Singapore', weekday: 'short' })
        .format(new Date()).toLowerCase();
      rows.forEach(function (row) {
        if (row.getAttribute('data-day') === day) row.setAttribute('data-today', '');
      });
    } catch (e) { /* leave unhighlighted */ }
  }

  /* --- footer year -------------------------------------------------------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
