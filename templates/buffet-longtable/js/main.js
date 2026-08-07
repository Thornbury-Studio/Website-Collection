/* LONG TABLE — day rotation, live open-status, reveals. Zero dependencies. */

(function () {
  'use strict';

  var ROT = window.LT_ROTATION;
  var STATIONS = window.LT_STATIONS;

  var DAYS = [
    ['mon', 'Monday'], ['tue', 'Tuesday'], ['wed', 'Wednesday'],
    ['thu', 'Thursday'], ['fri', 'Friday'], ['sat', 'Saturday'], ['sun', 'Sunday']
  ];

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------- day tabs + rotation ---------- */

  var tabsEl = document.getElementById('dayTabs');
  var gridEl = document.getElementById('lineGrid');
  var dayWord = document.getElementById('dayWord');

  /* getDay(): 0=Sun … 6=Sat → our index 0=Mon … 6=Sun */
  var todayIdx = (new Date().getDay() + 6) % 7;

  DAYS.forEach(function (d, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'day-tab';
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-selected', 'false');
    b.innerHTML = esc(d[1].slice(0, 3)) + (i === todayIdx ? '<span class="today-dot" aria-hidden="true"></span>' : '');
    b.setAttribute('aria-label', d[1] + (i === todayIdx ? ' (today)' : ''));
    b.addEventListener('click', function () { select(i); });
    tabsEl.appendChild(b);
  });

  function select(i) {
    var key = DAYS[i][0];
    var r = ROT[key];
    tabsEl.querySelectorAll('.day-tab').forEach(function (t, ti) {
      t.classList.toggle('is-on', ti === i);
      t.setAttribute('aria-selected', ti === i ? 'true' : 'false');
    });
    dayWord.textContent = (i === todayIdx) ? 'today' : 'on ' + DAYS[i][1];

    gridEl.innerHTML =
      card('The Carvery', '<p class="big">' + esc(r.carvery) + '</p>') +
      card('Soup Kettle', '<p class="big">' + esc(r.soup) + '</p>') +
      card('Dessert Special', '<p class="big">' + esc(r.dessert) + '</p>') +
      card('The Global Station', '<p class="big theme">' + esc(r.global.theme) + '</p><ul>' +
        r.global.dishes.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>', true) +
      card('Hot Line — rotating three', '<ul>' +
        r.hot.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>');
  }

  function card(title, body, wide) {
    return '<div class="line-card' + (wide ? ' is-wide' : '') + '"><h3>' + esc(title) + '</h3>' + body + '</div>';
  }

  select(todayIdx);

  /* ---------- stations ---------- */

  var stEl = document.getElementById('stationGrid');
  STATIONS.forEach(function (s) {
    var d = document.createElement('article');
    d.className = 'station reveal';
    d.innerHTML =
      '<img src="' + s.img + '" alt="" width="900" height="640" loading="lazy">' +
      '<div class="station-body"><h3>' + esc(s.name) + '</h3>' +
      '<p class="blurb">' + esc(s.blurb) + '</p>' +
      '<ul>' + s.always.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>';
    stEl.appendChild(d);
  });

  /* ---------- live open status ----------
     Lunch Mon–Fri 11:00–15:00 · Dinner daily 16:30–21:00 · Brunch Sat–Sun 09:30–15:00 */

  function openStatus(now) {
    var day = now.getDay();               /* 0=Sun */
    var mins = now.getHours() * 60 + now.getMinutes();
    var weekend = (day === 0 || day === 6);

    var windows = weekend
      ? [[570, 900, 'brunch'], [990, 1260, 'dinner']]
      : [[660, 900, 'lunch'], [990, 1260, 'dinner']];

    for (var i = 0; i < windows.length; i++) {
      var w = windows[i];
      if (mins >= w[0] && mins < w[1]) {
        return { open: true, label: 'Open now — ' + w[2] + ' until ' + fmt(w[1]) };
      }
      if (mins < w[0]) {
        return { open: false, label: 'Opens ' + fmt(w[0]) + ' for ' + w[2] };
      }
    }
    return { open: false, label: 'Closed — reopens tomorrow' };
  }

  function fmt(mins) {
    var h = Math.floor(mins / 60), m = mins % 60;
    var ap = h >= 12 ? 'pm' : 'am';
    var hh = h % 12; if (hh === 0) hh = 12;
    return hh + (m ? ':' + (m < 10 ? '0' : '') + m : '') + ap;
  }

  var pill = document.getElementById('openPill');
  function tick() {
    var s = openStatus(new Date());
    pill.textContent = s.label;
    pill.classList.toggle('is-open', s.open);
  }
  tick();
  setInterval(tick, 60000);

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
