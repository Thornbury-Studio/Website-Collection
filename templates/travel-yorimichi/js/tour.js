/* YORIMICHI — tour page: render one tour from the data file and price a booking. */
(function () {
  'use strict';
  var Y = window.YORI;
  var tours = window.YORI_TOURS || [];
  var slug = Y.qs('t') || 'golden-route';
  var t = Y.tour(slug) || tours[0];
  if (!t) return;

  var $ = function (id) { return document.getElementById(id); };
  var tick = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  var cross = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 7l10 10M17 7L7 17"/></svg>';

  /* ---- head + hero ---- */
  document.title = t.name + ' — ' + t.days + ' days from ' + Y.money(t.priceFrom) + ' — YORIMICHI';
  var md = document.querySelector('meta[name="description"]');
  if (md) md.setAttribute('content', t.name + ': ' + t.short + '. ' + t.days + ' days, ' + t.nights + ' nights, from ' + Y.money(t.priceFrom) + ' per person including flights from Singapore. ' + t.tagline);
  $('tHero').src = t.wide;
  $('tHero').alt = t.alt;
  $('tShort').textContent = t.short;
  $('tName').textContent = t.name;
  $('tTagline').textContent = t.tagline;

  var nd = Y.nextDeparture(t);
  $('tFacts').innerHTML =
    '<div><span>Length</span><b>' + t.days + '<small>days / ' + t.nights + ' nights</small></b></div>' +
    '<div><span>Group</span><b>12<small>at most</small></b></div>' +
    '<div><span>From</span><b>' + Y.money(t.priceFrom) + '<small>with flights</small></b></div>' +
    '<div><span>Next departure</span><b>' + Y.fmtDate(nd[0]).replace(/ \d{4}$/, '') + '<small>' + Y.fmtDay(nd[0]) + '</small></b></div>' +
    '<div><span>Pace</span><b style="font-size:16px;font-family:var(--font-body);font-weight:500;letter-spacing:0">' + Y.esc(t.physical) + '</b></div>';

  $('tHighlights').innerHTML = t.highlights.map(function (h) { return '<li>' + Y.esc(h) + '</li>'; }).join('');
  $('tDays').innerHTML = t.itinerary.map(function (d, i) {
    return '<div class="day"><div class="d"><small>Day</small>' + (i + 1) + '</div><div><h3>' + Y.esc(d[0]) + '</h3><p>' + Y.esc(d[1]) + '</p></div></div>';
  }).join('');
  $('tIncluded').innerHTML = t.included.map(function (s) { return '<li>' + tick + '<span>' + Y.esc(s) + '</span></li>'; }).join('');
  $('tExcluded').innerHTML = t.excluded.map(function (s) { return '<li>' + cross + '<span>' + Y.esc(s) + '</span></li>'; }).join('');
  $('tGallery').innerHTML = t.gallery.map(function (g) {
    return '<figure><img src="' + g[0] + '" alt="' + Y.esc(g[1]) + '" width="1600" height="1067" loading="lazy"><figcaption>' + Y.esc(g[1]) + '</figcaption></figure>';
  }).join('');

  /* ---- departures list ---- */
  $('tDeps').innerHTML = t.departures.map(function (d) {
    return '<div class="dep">' +
      '<span class="date">' + Y.fmtDate(d[0]) + '<small>' + Y.fmtDay(d[0]) + ' &middot; returns ' + Y.addDays(d[0], t.days - 1) + (d[3] ? ' &middot; ' + Y.esc(d[3]) : '') + '</small></span>' +
      '<span class="price num">' + Y.money(d[1]) + '</span>' +
      Y.seatsHtml(d[2]) +
    '</div>';
  }).join('');

  /* ---- booking calculator ---- */
  var bDate = $('bDate'), bPax = $('bPax'), bRoom = $('bRoom'), bNight = $('bNight'), bIns = $('bIns');
  var wanted = Y.qs('d');
  bDate.innerHTML = t.departures.map(function (d) {
    var label = Y.fmtDate(d[0]) + ' — ' + Y.money(d[1]) + (d[2] === 0 ? ' — waitlist' : d[2] <= 3 ? ' — ' + d[2] + ' left' : '') + (d[3] ? ' (' + d[3] + ')' : '');
    return '<option value="' + d[0] + '"' + (d[0] === wanted ? ' selected' : '') + '>' + Y.esc(label) + '</option>';
  }).join('');
  if (!wanted) bDate.value = nd[0];
  $('bFrom').textContent = Y.money(t.priceFrom);

  function dep() {
    for (var i = 0; i < t.departures.length; i++) if (t.departures[i][0] === bDate.value) return t.departures[i];
    return t.departures[0];
  }
  function price() {
    var d = dep();
    var pax = +bPax.value;
    var base = d[1] * pax;
    var single = bRoom.value === 'single' ? t.single * pax : 0;
    var extra = (bNight.checked ? 220 : 0) * pax + (bIns.checked ? 68 : 0) * pax;
    var total = base + single + extra;
    $('tlPax').textContent = pax + ' traveller' + (pax > 1 ? 's' : '') + ' × ' + Y.money(d[1]);
    $('tlBase').textContent = Y.money(base);
    $('tlSingleRow').hidden = !single;
    $('tlSingle').textContent = Y.money(single);
    $('tlExtraRow').hidden = !extra;
    $('tlExtra').textContent = Y.money(extra);
    $('tlTotal').textContent = Y.money(total);
    $('tlDeposit').textContent = Y.money(500 * pax);
    $('bSubmit').textContent = d[2] === 0 ? 'Join the waitlist' : 'Reserve these seats';
    return { d: d, pax: pax, total: total };
  }
  [bDate, bPax, bRoom, bNight, bIns].forEach(function (el) { el.addEventListener('change', price); });
  price();

  $('book').addEventListener('submit', function (e) {
    e.preventDefault();
    var form = e.target;
    var name = $('bName'), email = $('bEmail');
    var ok = true;
    [name, email].forEach(function (f) {
      var bad = !f.value.trim() || (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value));
      f.setAttribute('aria-invalid', String(bad));
      f.style.borderColor = bad ? 'var(--shu)' : '';
      if (bad) ok = false;
    });
    if (!ok) { (name.value.trim() ? email : name).focus(); return; }
    var q = price();
    var ref = 'YM-26-' + String(Math.floor(1000 + Math.random() * 9000));
    $('bRef').textContent = ref;
    $('bDoneText').innerHTML = (q.d[2] === 0 ? 'You are on the waitlist for ' : 'Held for 72 hours: ') + '<strong>' + q.pax + ' seat' + (q.pax > 1 ? 's' : '') + '</strong> on <strong>' + Y.esc(t.name) + '</strong>, departing <strong>' + Y.fmtDate(q.d[0]) + '</strong>. Total ' + Y.money(q.total) + '; deposit ' + Y.money(500 * q.pax) + '.';
    form.hidden = true;
    $('bookDone').hidden = false;
    $('bookDone').scrollIntoView({ block: 'nearest' });
  });

  /* ---- similar tours: same region or season first ---- */
  var others = tours.filter(function (o) { return o.slug !== t.slug; });
  others.sort(function (a, b) {
    var sa = (a.region === t.region ? 2 : 0) + (a.seasons.some(function (s) { return t.seasons.indexOf(s) > -1; }) ? 1 : 0);
    var sb = (b.region === t.region ? 2 : 0) + (b.seasons.some(function (s) { return t.seasons.indexOf(s) > -1; }) ? 1 : 0);
    return sb - sa;
  });
  $('tSimilar').innerHTML = others.slice(0, 4).map(function (o) {
    return '<a class="tcard reveal is-in" href="tour.html?t=' + o.slug + '">' +
      '<div class="tcard__media"><span class="tcard__tag">' + o.days + ' days</span><img src="' + o.card + '" alt="' + Y.esc(o.alt) + '" width="720" height="960" loading="lazy"></div>' +
      '<div class="tcard__body"><h3 class="h3">' + Y.esc(o.name) + '</h3><p>' + Y.esc(o.short) + '</p><p><strong>' + o.days + ' days &middot; from ' + Y.money(o.priceFrom) + '</strong></p></div>' +
    '</a>';
  }).join('');
})();
