/* HOYT'S — weekly timetable with today-highlight and type filters. Zero dependencies. */

(function () {
  'use strict';

  var WEEK = window.HOYTS_WEEK;
  var TYPES = window.HOYTS_TYPES;
  var COACHES = window.HOYTS_COACHES;

  var DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* 0=Mon … 6=Sun, from JS getDay() where 0=Sun */
  var todayIdx = (new Date().getDay() + 6) % 7;

  document.getElementById('todayNote').textContent =
    'It’s ' + DAY_NAMES[todayIdx] + ' — today’s column is marked.';

  /* ---------- render type filter chips ---------- */

  var filtersEl = document.getElementById('typeFilters');
  Object.keys(TYPES).forEach(function (t) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.dataset.type = t;
    b.textContent = TYPES[t];
    filtersEl.appendChild(b);
  });

  /* ---------- render the grid ---------- */

  var schedEl = document.getElementById('sched');

  for (var d = 0; d < 7; d++) {
    var col = document.createElement('div');
    col.className = 'day-col' + (d === todayIdx ? ' is-today' : '');

    var head = document.createElement('h3');
    head.className = 'day-head';
    head.innerHTML = esc(DAY_NAMES[d].slice(0, 3)) +
      (d === todayIdx ? '<span class="today-tag">Today</span>' : '');
    col.appendChild(head);

    WEEK.filter(function (c) { return c.day === d; }).forEach(function (c) {
      var s = document.createElement('div');
      s.className = 'slot';
      s.dataset.type = c.type;
      s.innerHTML =
        '<time>' + esc(c.time) + '</time>' +
        '<p class="cname">' + esc(c.name) + '</p>' +
        '<p class="cmeta">' + esc(TYPES[c.type]) + ' · ' + esc(c.coach) + ' · ' + c.mins + ' min</p>' +
        (c.note ? '<p class="cnote">' + esc(c.note) + '</p>' : '');
      col.appendChild(s);
    });

    schedEl.appendChild(col);
  }

  /* ---------- filtering: dim non-matching instead of hiding ---------- */

  filtersEl.addEventListener('click', function (ev) {
    var chip = ev.target.closest('.chip');
    if (!chip) return;
    filtersEl.querySelectorAll('.chip').forEach(function (c) { c.classList.remove('is-on'); });
    chip.classList.add('is-on');
    var t = chip.dataset.type;
    document.querySelectorAll('.slot').forEach(function (s) {
      s.classList.toggle('is-dim', t !== 'all' && s.dataset.type !== t);
    });
  });

  /* ---------- coaches ---------- */

  var coachEl = document.getElementById('coachGrid');
  COACHES.forEach(function (c) {
    var d = document.createElement('article');
    d.className = 'coach reveal';
    d.innerHTML =
      '<img src="' + c.img + '" alt="' + esc(c.name) + ', printed in the gym’s red duotone." width="700" height="840" loading="lazy">' +
      '<div class="coach-body"><h3>' + esc(c.name) + '</h3>' +
      '<p class="coach-role">' + esc(c.role) + '</p>' +
      '<p>' + esc(c.line) + '</p></div>';
    coachEl.appendChild(d);
  });

  /* ---------- reveals ---------- */

  var toReveal = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    toReveal.forEach(function (n) { io.observe(n); });
    setTimeout(function () {
      toReveal.forEach(function (n) { n.classList.add('is-in'); });
    }, 2500);
  } else {
    toReveal.forEach(function (n) { n.classList.add('is-in'); });
  }
})();
