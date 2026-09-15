/* PELAGIA — home page: the plan strip, the deck, today's timetable, halls, experiences, reviews. */
(function () {
  'use strict';
  var P = window.PELAGIA;
  var now = new Date();
  var $ = function (id) { return document.getElementById(id); };

  /* ---- plan strip: today's hours, open/closed, the next feed ---- */
  var closeAt = P.closeFor(now);
  $('planHours').innerHTML = P.hours.open + ' &ndash; ' + closeAt + (P.isLate(now) ? ' <small>After Dark</small>' : '');
  var m = now.getHours() * 60 + now.getMinutes();
  var open = m >= P.mins(P.hours.open) && m < P.mins(closeAt);
  var lastEntry = m >= P.mins(closeAt) - P.hours.lastEntry && open;
  $('planStatus').innerHTML = open
    ? '<i class="pulse"></i>' + (lastEntry ? 'Open · last entry has passed' : 'Open now')
    : '<i class="pulse pulse--off"></i>' + (m < P.mins(P.hours.open) ? 'Opens at ' + P.hours.open : 'Closed · opens 10:00 tomorrow');
  var nx = P.nextOn(now);
  if (nx) {
    $('planNext').innerHTML = nx[0] + ' <small>' + P.esc(nx[1]) + '</small>';
    $('planNextWhere').textContent = nx[3];
  } else {
    var first = P.todaySchedule(new Date(now.getTime() + 864e5))[0];
    $('planNext').innerHTML = first[0] + ' <small>' + P.esc(first[1]) + '</small>';
    $('planNextWhere').textContent = 'Tomorrow · ' + first[3];
  }

  /* ---- deck rings ---- */
  $('hallRings').innerHTML = P.halls.map(function (h) { return P.ring(h.icon, h.name, h.tag, 'halls.html#' + h.slug); }).join('');
  var XICON = { 'shark-dive': 'mask', 'sleepover': 'moon', 'backstage': 'key', 'ray-feed': 'hand' };
  $('xRings').innerHTML = P.experiences.map(function (x) { return P.ring(XICON[x.slug], x.name, P.money(x.price) + ' ' + x.unit, 'whats-on.html#' + x.slug); }).join('');
  $('deckStars').innerHTML = P.icons.star + P.icons.star + P.icons.star + P.icons.star + P.icons.star;

  /* ---- today's timetable with a hall filter ---- */
  $('todayName').textContent = P.dayName(now);
  var chips = $('todayChips');
  P.halls.forEach(function (h) {
    var b = document.createElement('button');
    b.className = 'chip'; b.type = 'button'; b.setAttribute('data-hall', h.slug); b.setAttribute('aria-pressed', 'false'); b.textContent = h.name;
    chips.appendChild(b);
  });
  function renderToday(hall) {
    var list = P.todaySchedule(now).filter(function (s) { return !hall || s[2] === hall; });
    var nextFound = false;
    $('todayList').innerHTML = list.map(function (s) {
      var past = P.mins(s[0]) + s[4] < m;
      var isNext = !past && !nextFound && P.mins(s[0]) >= m;
      if (isNext) nextFound = true;
      return '<div class="slot' + (past ? ' slot--past' : '') + (isNext ? ' slot--next' : '') + '">' +
        '<span class="slot__time num">' + s[0] + '</span>' +
        '<span class="slot__what"><b>' + P.esc(s[1]) + (isNext ? ' · next' : '') + '</b><span>' + P.esc(s[3]) + '</span></span>' +
        '<span class="slot__hall">' + P.esc(P.hall(s[2]).name) + '</span>' +
        '<span class="slot__dur">' + s[4] + ' min</span>' +
      '</div>';
    }).join('') || '<div class="slot"><span class="slot__what"><b>Nothing scheduled in this hall today.</b></span></div>';
  }
  renderToday('');
  chips.addEventListener('click', function (e) {
    var c = e.target.closest('.chip'); if (!c) return;
    chips.querySelectorAll('.chip').forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
    c.setAttribute('aria-pressed', 'true');
    renderToday(c.getAttribute('data-hall'));
  });

  /* ---- hall cards ---- */
  $('hallCards').innerHTML = P.halls.map(function (h) {
    return '<a class="hall reveal is-in" href="halls.html#' + h.slug + '">' +
      '<span class="hall__o">' + P.icons[h.icon] + '</span>' +
      '<img src="' + h.img + '" alt="' + P.esc(h.alt) + '" width="1600" height="1067" loading="lazy">' +
      '<span class="hall__body"><b>' + P.esc(h.name) + '</b><span>' + P.esc(h.tag) + '</span></span>' +
    '</a>';
  }).join('');

  /* ---- experiences ---- */
  $('xGrid').innerHTML = P.experiences.map(function (x) {
    return '<article class="glass glass--soft xcard reveal is-in">' +
      '<a class="xcard__media" href="whats-on.html#' + x.slug + '" tabindex="-1" aria-hidden="true">' +
        '<img src="' + x.img + '" alt="" width="720" height="960" loading="lazy"><span class="xcard__price">' + P.money(x.price) + '</span></a>' +
      '<div class="xcard__body"><span class="xcard__meta">' + P.esc(x.when) + '</span><h3>' + P.esc(x.name) + '</h3><p>' + P.esc(x.blurb) + '</p>' +
      '<a class="more" href="whats-on.html#' + x.slug + '">Details and dates ' + P.icons.arrow + '</a></div>' +
    '</article>';
  }).join('');

  /* ---- reviews ---- */
  $('reviewGrid').innerHTML = P.reviews.map(function (r) {
    return '<article class="glass glass--soft review reveal is-in"><span class="stars" aria-label="Five stars">' + P.icons.star + P.icons.star + P.icons.star + P.icons.star + P.icons.star + '</span>' +
      '<blockquote>' + P.esc(r[2]) + '</blockquote><cite><strong>' + P.esc(r[0]) + '</strong>' + P.esc(r[1]) + '</cite></article>';
  }).join('');

  /* ---- hours list ---- */
  var names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  $('hoursList').innerHTML = [1, 2, 3, 4, 5, 6, 0].map(function (d) {
    var late = P.hours.lateDays.indexOf(d) > -1;
    return '<li' + (d === now.getDay() ? ' class="is-today"' : '') + '><span>' + names[d] + '</span><span>' + P.hours.open + ' – ' + (late ? P.hours.lateClose + ' · After Dark' : P.hours.close) + '</span></li>';
  }).join('');
})();
