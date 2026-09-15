/* PELAGIA — what's on: the full timetable with filters, and the four experiences with dates. */
(function () {
  'use strict';
  var P = window.PELAGIA;
  var $ = function (id) { return document.getElementById(id); };

  /* ---- timetable ---- */
  var dayType = 'daily';
  var hallSel = $('schHall'), whenSel = $('schWhen');
  P.halls.forEach(function (h) { var o = document.createElement('option'); o.value = h.slug; o.textContent = h.name; hallSel.appendChild(o); });
  function render() {
    var list = P.schedule.filter(function (s) {
      if (s[5] === 'late' && dayType !== 'late') return false;
      if (hallSel.value && s[2] !== hallSel.value) return false;
      var m = P.mins(s[0]);
      if (whenSel.value === 'am' && m >= 13 * 60) return false;
      if (whenSel.value === 'pm' && (m < 13 * 60 || m >= 19 * 60)) return false;
      if (whenSel.value === 'eve' && m < 19 * 60) return false;
      return true;
    }).sort(function (a, b) { return P.mins(a[0]) - P.mins(b[0]); });
    $('schList').innerHTML = list.map(function (s) {
      return '<div class="slot"><span class="slot__time num">' + s[0] + '</span>' +
        '<span class="slot__what"><b>' + P.esc(s[1]) + '</b><span>' + P.esc(s[3]) + (s[5] === 'late' ? ' · Fridays and Saturdays only' : '') + '</span></span>' +
        '<span class="slot__hall">' + P.esc(P.hall(s[2]).name) + '</span><span class="slot__dur">' + s[4] + ' min</span></div>';
    }).join('') || '<div class="slot"><span class="slot__what"><b>Nothing matches. Clear a filter.</b></span></div>';
    $('schCount').innerHTML = '<strong>' + list.length + '</strong> on the timetable' + (dayType === 'late' ? ' on a Friday or Saturday' : ' Sunday to Thursday') + (hallSel.value ? ' in ' + P.esc(P.hall(hallSel.value).name) : '') + '.';
  }
  $('dayChips').addEventListener('click', function (e) {
    var c = e.target.closest('.chip'); if (!c) return;
    $('dayChips').querySelectorAll('.chip').forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
    c.setAttribute('aria-pressed', 'true'); dayType = c.getAttribute('data-day'); render();
  });
  hallSel.addEventListener('change', render);
  whenSel.addEventListener('change', render);
  if (P.isLate(new Date())) { $('dayChips').querySelector('[data-day="late"]').click(); } else { render(); }

  /* ---- experiences ---- */
  var today = new Date(); today.setHours(0, 0, 0, 0);
  $('xList').innerHTML = P.experiences.map(function (x) {
    var dates = x.dates[0] === 'daily'
      ? '<span class="date">Every day' + (x.slug === 'ray-feed' ? ', 11:30 & 15:00' : ', 14:00') + '</span>'
      : x.dates.filter(function (d) { return P.parse(d) >= today; }).map(function (d, i) {
          var few = i === 0;
          return '<span class="date' + (few ? ' date--few' : '') + '">' + P.fmt(P.parse(d)) + (few ? ' · ' + Math.max(1, x.capacity - 2) + ' left' : '') + '</span>';
        }).join('');
    var cta = x.addon || x.slug === 'backstage'
      ? '<a class="btn" href="tickets.html">Add to a ticket ' + P.icons.arrow + '</a>'
      : '<a class="btn" href="visit.html?about=' + x.slug + '#enquiry">Ask for a date ' + P.icons.arrow + '</a>';
    return '<article class="glass xdetail reveal is-in" id="' + x.slug + '">' +
      '<div class="xdetail__media"><img src="' + x.img + '" alt="' + P.esc(x.alt) + '" width="720" height="960" loading="lazy"></div>' +
      '<div class="xdetail__body">' +
        '<span class="kicker">' + P.money(x.price) + ' ' + P.esc(x.unit) + '</span>' +
        '<h3 class="h2" style="font-size:clamp(26px,3vw,38px)">' + P.esc(x.name) + '</h3>' +
        '<p class="lede">' + P.esc(x.blurb) + '</p>' +
        '<div class="xdetail__meta"><div><span>When</span>' + P.esc(x.when) + '</div><div><span>How long</span>' + P.esc(x.duration) + '</div><div><span>Who</span>' + P.esc(x.ages) + '</div><div><span>Places</span>' + x.capacity + ' a session</div></div>' +
        '<ul class="incl">' + x.includes.map(function (s) { return '<li>' + P.icons.tick + '<span>' + P.esc(s) + '</span></li>'; }).join('') + '</ul>' +
        '<div><span class="kicker" style="display:block;margin-bottom:8px">Next dates</span><div class="dates">' + dates + '</div></div>' +
        '<div>' + cta + '</div>' +
      '</div></article>';
  }).join('');
})();
