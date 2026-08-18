/* Three's A Crowd — shared chrome: reveals, sheet nav, live open pill with
   day-split hours, catalogue-driven price fills. No frameworks, no inline
   scripts, no cookies, no storage. */
(function () {
  'use strict';

  document.documentElement.classList.remove('no-js');
  document.documentElement.classList.add('js-anim');

  /* --- reveals ------------------------------------------------------------ */
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

    setTimeout(function () {
      if (!document.querySelector('.reveal.is-in')) {
        document.querySelectorAll('.reveal').forEach(revealNow);
      }
    }, 1400);

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

  /* --- sheet nav ---------------------------------------------------------- */
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

  /* --- live open pill ------------------------------------------------------
     Verified hours (their Visit Us page, Aug 2026):
     Sun–Thu 11.00am–10.30pm, last order 10.00pm;
     Fri–Sat 11.00am–11.00pm, last order 10.30pm. */
  function sgNowParts() {
    try {
      var parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Singapore',
        weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false
      }).formatToParts(new Date());
      var out = { day: null, min: 0 };
      var h = 0, m = 0;
      parts.forEach(function (p) {
        if (p.type === 'weekday') out.day = p.value.toLowerCase();
        if (p.type === 'hour') h = parseInt(p.value, 10) % 24;
        if (p.type === 'minute') m = parseInt(p.value, 10);
      });
      out.min = h * 60 + m;
      return out;
    } catch (e) { return null; }
  }

  function hoursFor(day) {
    var lateNight = (day === 'fri' || day === 'sat');
    return {
      open: 11 * 60,
      close: lateNight ? 23 * 60 : 22 * 60 + 30,
      lastOrder: lateNight ? 22 * 60 + 30 : 22 * 60,
      closeLabel: lateNight ? '11pm' : '10.30pm',
      loLabel: lateNight ? '10.30pm' : '10pm'
    };
  }

  function paintPill() {
    var pill = document.querySelector('[data-open-pill]');
    var line = document.querySelector('[data-open-line]');
    if (!pill || !line) return;
    var now = sgNowParts();
    if (!now) { line.textContent = 'Open daily from 11am'; return; }
    var h = hoursFor(now.day);
    if (now.min >= h.open && now.min < h.close) {
      pill.dataset.state = 'open';
      if (now.min >= h.lastOrder) {
        line.textContent = 'Last orders passed · till ' + h.closeLabel;
      } else if (h.lastOrder - now.min <= 45) {
        line.textContent = 'Open · last orders ' + h.loLabel;
      } else {
        line.textContent = 'Open now · till ' + h.closeLabel;
      }
    } else {
      pill.dataset.state = 'closed';
      line.textContent = 'Closed · opens 11am daily';
    }
  }
  paintPill();
  setInterval(paintPill, 60000);

  /* --- catalogue-driven price fills ----------------------------------------
     data-price="Item Name"            -> that item's price / min variant
     data-tier="classic" data-kind="scoop|pint|affogato" -> tier price */
  function findItem(name) {
    if (!window.TAC_MENU) return null;
    var groups = window.TAC_MENU.groups;
    for (var g = 0; g < groups.length; g += 1) {
      var items = groups[g].items;
      for (var i = 0; i < items.length; i += 1) {
        if (items[i].name === name) return items[i];
      }
    }
    return null;
  }

  function money(v) {
    return '$' + (v % 1 === 0 ? v.toFixed(0) : v.toFixed(2));
  }

  document.querySelectorAll('[data-price]').forEach(function (el) {
    var item = findItem(el.getAttribute('data-price'));
    if (!item) return;
    if (typeof item.price === 'number') {
      el.textContent = money(item.price);
    } else if (item.variants && item.variants.length) {
      el.textContent = 'from ' + money(Math.min.apply(null, item.variants.map(function (v) { return v.price; })));
    } else {
      el.textContent = 'At the counter';
    }
  });

  document.querySelectorAll('[data-tier]').forEach(function (el) {
    if (!window.TAC_MENU) return;
    var tier = window.TAC_MENU.tiers[el.getAttribute('data-tier')];
    var kind = el.getAttribute('data-kind') || 'scoop';
    if (tier && typeof tier[kind] === 'number') el.textContent = money(tier[kind]);
  });

  /* --- hours table today highlight ---------------------------------------- */
  var rows = document.querySelectorAll('.hours-table tr[data-day]');
  if (rows.length) {
    var now2 = sgNowParts();
    if (now2 && now2.day) {
      rows.forEach(function (row) {
        var days = (row.getAttribute('data-day') || '').split(' ');
        if (days.indexOf(now2.day) !== -1) row.setAttribute('data-today', '');
      });
    }
  }

  /* --- footer year -------------------------------------------------------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
