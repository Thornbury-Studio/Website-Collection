/* YORIMICHI — tours page: filter, search and sort the eight tours. */
(function () {
  'use strict';
  var Y = window.YORI;
  var tours = window.YORI_TOURS || [];
  var form = document.getElementById('filters');
  var rows = document.getElementById('trows');
  var results = document.getElementById('results');
  if (!form || !rows) return;

  var fq = document.getElementById('fq');
  var fseason = document.getElementById('fseason');
  var fregion = document.getElementById('fregion');
  var flength = document.getElementById('flength');
  var fsort = document.getElementById('fsort');

  // the header search lands here with ?q=, and a deep link may carry the rest
  fq.value = Y.qs('q');
  fseason.value = Y.qs('season');
  fregion.value = Y.qs('region');
  flength.value = Y.qs('length');
  if (Y.qs('sort')) fsort.value = Y.qs('sort');

  function haystack(t) {
    return [t.name, t.short, t.tagline, t.regionLabel, t.seasons.join(' '), t.highlights.join(' ')].join(' ').toLowerCase();
  }
  function lengthBand(t) {
    return t.days <= 6 ? 'short' : t.days <= 9 ? 'mid' : 'long';
  }
  function card(t) {
    var nd = Y.nextDeparture(t);
    return '<article class="trow reveal is-in">' +
      '<a class="trow__media" href="tour.html?t=' + t.slug + '" tabindex="-1" aria-hidden="true">' +
        '<img src="' + t.card + '" alt="" width="720" height="960" loading="lazy">' +
      '</a>' +
      '<div class="trow__body">' +
        '<span class="trow__route">' + Y.esc(t.short) + '</span>' +
        '<h2 class="h3"><a href="tour.html?t=' + t.slug + '">' + Y.esc(t.name) + '</a></h2>' +
        '<p class="trow__tag">' + Y.esc(t.tagline) + '</p>' +
        '<div class="facts-inline">' +
          '<span><strong>' + t.days + ' days</strong> / ' + t.nights + ' nights</span>' +
          '<span><strong>' + t.regionLabel + '</strong></span>' +
          '<span>Next: <strong>' + Y.fmtDate(nd[0]) + '</strong></span>' +
          Y.seatsHtml(nd[2]) +
        '</div>' +
        '<div class="trow__foot">' +
          '<span class="price">' + Y.money(t.priceFrom) + '<small>per person, flights in</small></span>' +
          '<a class="btn btn--sm" href="tour.html?t=' + t.slug + '">View tour</a>' +
        '</div>' +
      '</div>' +
    '</article>';
  }

  function apply() {
    var q = fq.value.trim().toLowerCase();
    var list = tours.filter(function (t) {
      if (q && haystack(t).indexOf(q) === -1) return false;
      if (fseason.value && t.seasons.indexOf(fseason.value) === -1) return false;
      if (fregion.value && t.region.indexOf(fregion.value) === -1) return false;
      if (flength.value && lengthBand(t) !== flength.value) return false;
      return true;
    });
    if (fsort.value === 'price') list.sort(function (a, b) { return a.priceFrom - b.priceFrom; });
    else if (fsort.value === 'days') list.sort(function (a, b) { return a.days - b.days; });
    else list.sort(function (a, b) { return Y.nextDeparture(a)[0] < Y.nextDeparture(b)[0] ? -1 : 1; });

    rows.innerHTML = list.length ? list.map(card).join('') :
      '<p class="empty">Nothing matches that. Clear a filter or two &mdash; every tour is listed when none are set.</p>';
    var bits = [];
    if (q) bits.push('matching &ldquo;' + Y.esc(q) + '&rdquo;');
    if (fseason.value) bits.push('in ' + fseason.options[fseason.selectedIndex].text.toLowerCase());
    if (fregion.value) bits.push('in ' + fregion.options[fregion.selectedIndex].text);
    if (flength.value) bits.push(flength.options[flength.selectedIndex].text.toLowerCase());
    results.innerHTML = '<strong>' + list.length + ' of ' + tours.length + ' tours</strong>' + (bits.length ? ' ' + bits.join(', ') : '') + '.';
  }

  form.addEventListener('submit', function (e) { e.preventDefault(); apply(); });
  form.addEventListener('input', apply);
  form.addEventListener('change', apply);
  document.getElementById('fclear').addEventListener('click', function (e) {
    e.preventDefault();
    form.reset();
    fq.value = '';
    fseason.value = fregion.value = flength.value = '';
    fsort.value = 'next';
    apply();
    if (window.history && history.replaceState) history.replaceState(null, '', 'tours.html');
  });
  apply();
})();
