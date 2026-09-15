/* PELAGIA — shared behaviour: header, drawer, reveal, icons, time helpers. */
(function () {
  'use strict';
  var P = window.PELAGIA = window.PELAGIA || {};
  var D = P;

  /* ---- helpers ---- */
  P.money = function (n) { return 'S$' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); };
  P.esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  P.qs = function (name) { var m = new RegExp('[?&]' + name + '=([^&#]*)').exec(window.location.search); return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : ''; };
  P.mins = function (hhmm) { var p = hhmm.split(':'); return +p[0] * 60 + +p[1]; };
  P.hall = function (slug) { for (var i = 0; i < D.halls.length; i++) if (D.halls[i].slug === slug) return D.halls[i]; return null; };
  P.isLate = function (d) { return D.hours.lateDays.indexOf(d.getDay()) > -1; };
  P.closeFor = function (d) { return P.isLate(d) ? D.hours.lateClose : D.hours.close; };
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  P.fmt = function (d) { return DAYS[d.getDay()].slice(0, 3) + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()]; };
  P.fmtLong = function (d) { return DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear(); };
  P.parse = function (iso) { var p = iso.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); };
  P.iso = function (d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  P.dayName = function (d) { return DAYS[d.getDay()]; };

  /* today's timetable, sorted, with the late slots only on late days */
  P.todaySchedule = function (d) {
    var late = P.isLate(d);
    return D.schedule.filter(function (s) { return s[5] === 'daily' || late; })
      .slice().sort(function (a, b) { return P.mins(a[0]) - P.mins(b[0]); });
  };
  /* the next thing on the timetable from a given time, or null if the day is done */
  P.nextOn = function (d) {
    var now = d.getHours() * 60 + d.getMinutes();
    var list = P.todaySchedule(d);
    for (var i = 0; i < list.length; i++) if (P.mins(list[i][0]) >= now) return list[i];
    return null;
  };

  /* ---- line icons for the rings ---- */
  P.icons = {
    wave: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18c3-4 6-4 9 0s6 4 9 0 6-4 8 0"/><path d="M3 24c3-4 6-4 9 0s6 4 9 0 6-4 8 0"/><path d="M20 6c-2 3-2 6 1 8 3-1 5-4 4-8-2-1-4-1-5 0z"/></svg>',
    jelly: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15a10 10 0 0 1 20 0v1H6z"/><path d="M9 16c0 4-1 6 0 10M14 16c0 5 1 7-1 12M19 16c0 5-1 7 1 12M23 16c0 4 1 6 0 10"/></svg>',
    coral: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M16 28V14"/><path d="M16 16c-3-1-5-4-5-8M16 20c-4 0-7-2-8-6M16 18c3-1 5-4 5-9M16 22c4 0 6-3 7-7"/><path d="M8 28h16"/></svg>',
    grass: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 28c0-8 1-14 5-22M13 28c0-6 2-12 6-18M18 28c1-6 3-11 7-15M23 28c1-4 2-8 5-11"/><path d="M5 28h22"/></svg>',
    penguin: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4c-4 0-6 3-6 7v9c0 4 2 7 6 7s6-3 6-7v-9c0-4-2-7-6-7z"/><path d="M13 12c0-2 1-3 3-3s3 1 3 3v9c0 2-1 3-3 3s-3-1-3-3z"/><path d="M10 14c-2 2-3 5-2 9M22 14c2 2 3 5 2 9M13 27l-1 2M19 27l1 2M15 8l1 1 1-1"/></svg>',
    mask: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="10" width="22" height="11" rx="5"/><path d="M5 15H2M27 15h3M12 21c1 3 7 3 8 0"/><path d="M16 21v7"/></svg>',
    moon: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 5a11 11 0 1 0 7 19 9 9 0 0 1-7-19z"/><path d="M8 8h0M25 27h0M27 9h0"/></svg>',
    key: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="12" r="6"/><path d="M15 16l12 12M22 23l3-3M25 26l3-3"/></svg>',
    hand: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17V8a2 2 0 0 1 4 0v8M14 15V6a2 2 0 0 1 4 0v9M18 15V8a2 2 0 0 1 4 0v9M22 17v-3a2 2 0 0 1 4 0v7c0 5-3 8-8 8h-2c-3 0-5-1-7-4l-4-6a2 2 0 0 1 3-2l2 2"/></svg>',
    clock: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="16" cy="16" r="11"/><path d="M16 9v7l5 3"/></svg>',
    ticket: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11a3 3 0 0 0 0 10v3a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2v-3a3 3 0 0 1 0-10V8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2z"/><path d="M13 8v16" stroke-dasharray="2 3"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.8l2.8 6 6.6.7-4.9 4.5 1.4 6.5L12 17.2l-5.9 3.3 1.4-6.5L2.6 9.5l6.6-.7z"/></svg>',
    tick: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>',
  };
  P.ring = function (icon, label, sub, href) {
    var tag = href ? 'a' : 'div';
    return '<' + tag + ' class="ring"' + (href ? ' href="' + href + '"' : '') + '>' +
      '<span class="ring__o">' + (P.icons[icon] || '') + '</span>' +
      '<span><b>' + P.esc(label) + '</b>' + (sub ? '<small>' + P.esc(sub) + '</small>' : '') + '</span></' + tag + '>';
  };

  /* ---- header: drawer ---- */
  var burger = document.getElementById('burger');
  var drawer = document.getElementById('drawer');
  if (burger && drawer) {
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') !== 'true';
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      drawer.setAttribute('data-open', String(open));
      document.body.classList.toggle('is-locked', open);
    });
    drawer.addEventListener('click', function (e) { if (e.target.closest('a')) burger.click(); });
  }

  /* ---- today's hours in the drawer / footer ---- */
  document.querySelectorAll('[data-today-hours]').forEach(function (el) {
    var d = new Date();
    el.textContent = 'Today ' + D.hours.open + '–' + P.closeFor(d) + (P.isLate(d) ? ' · After Dark' : '');
  });

  /* ---- ambient clips play only while on screen ---- */
  var vo = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      var v = en.target;
      if (en.isIntersecting) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); }
      else v.pause();
    });
  }, { threshold: 0.1 }) : null;
  P.watchClips = function () {
    if (!vo) return;
    document.querySelectorAll('video[autoplay]:not([data-watched])').forEach(function (v) { v.setAttribute('data-watched', ''); vo.observe(v); });
  };
  P.watchClips();

  /* ---- reveal on entry ---- */
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && items.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('is-in'); });
  }
})();
