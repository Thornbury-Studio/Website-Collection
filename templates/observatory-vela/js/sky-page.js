/* VELA — the Sky Tonight page. Drives the map controls and keeps the twilight,
   Moon and planet tables in step with whatever time the slider is showing. */
(function (root, doc) {
  'use strict';

  var Sky = root.Sky, VELA = root.VELA;
  if (!Sky || !VELA) return;
  var site = VELA.site, TZ = site.timeZone;
  var map = null;

  function $(s) { return doc.querySelector(s); }
  function el(id) { return doc.getElementById(id); }

  function shownTime() {
    return new Date(Date.now() + (map ? map.state.offsetMinutes : 0) * 60000);
  }

  /* ---- twilight ladder --------------------------------------------------- */

  var STAGES = [
    ['Sunset and sunrise', '0.83&deg;', -0.833],
    ['Civil twilight', '6&deg;', -6],
    ['Nautical twilight', '12&deg;', -12],
    ['Astronomical darkness', '18&deg;', -18]
  ];

  function twilight() {
    var body = doc.querySelector('#twilight tbody');
    if (!body) return;
    var now = shownTime();
    body.innerHTML = STAGES.map(function (s) {
      var ev = Sky.sunEvents(now, site.latitude, site.longitude, s[2]);
      var evening, morning;
      if (ev.status === 'above') { evening = 'never'; morning = 'never'; }
      else if (ev.status === 'below') { evening = 'all night'; morning = 'all night'; }
      else {
        evening = Sky.clock(ev.set, TZ);
        morning = Sky.clock(ev.rise, TZ);
      }
      var flag = (s[2] === -18 && ev.status === 'above');
      return '<tr><td>' + s[0] + (flag ? ' <span class="u-signal">&mdash; not tonight</span>' : '') +
        '</td><td class="num">' + s[1] + '</td>' +
        '<td class="n">' + evening + '</td><td class="n">' + morning + '</td></tr>';
    }).join('');
  }

  /* ---- moon -------------------------------------------------------------- */

  function moon() {
    var host = el('moonStats');
    if (!host) return;
    var m = Sky.moon(Sky.dayNumber(shownTime()));
    var lst = Sky.lst(shownTime(), site.longitude);
    var h = Sky.toHorizon(m.ra, m.dec, site.latitude, lst);
    /* Four, not three: this block sits in a half-width column that only fits
       two tracks, so an odd count leaves the last one stranded on its own row. */
    host.innerHTML =
      '<div class="stat"><b>' + Math.round(m.illuminated * 100) + '%</b><span>Illuminated</span></div>' +
      '<div class="stat stat--word"><b>' + Sky.moonPhaseName(m.phase) + '</b><span>Phase</span></div>' +
      '<div class="stat"><b>' + m.age.toFixed(1) + '</b><span>Days since new</span></div>' +
      '<div class="stat"><b>' + h.altitude.toFixed(0) + '&deg;</b><span>' +
        (h.altitude > 0 ? 'Above the horizon, ' + Sky.compass(h.azimuth) : 'Below the horizon') +
      '</span></div>';
    var note = el('moonNote');
    if (note) {
      note.innerHTML = h.altitude > 0
        ? 'The Moon is up now, ' + h.altitude.toFixed(0) + '&deg; above the horizon in the ' +
          Sky.compass(h.azimuth) + '. A bright Moon washes out everything faint, so our deep-sky ' +
          'sessions are scheduled around it.'
        : 'The Moon is below the horizon at the moment (' + h.altitude.toFixed(0) + '&deg;), ' +
          'which is the best possible condition for faint objects.';
    }
  }

  /* ---- planets ----------------------------------------------------------- */

  function planets() {
    var body = doc.querySelector('#planets tbody');
    if (!body) return;
    var now = shownTime();
    var lst = Sky.lst(now, site.longitude);
    body.innerHTML = Sky.planets(now).map(function (p) {
      var h = Sky.toHorizon(p.ra, p.dec, site.latitude, lst);
      var up = h.altitude > 0;
      return '<tr' + (up ? '' : ' class="session--gone"') + '>' +
        '<td>' + p.name + '</td>' +
        '<td class="num">' + Sky.raToHms(p.ra) + '</td>' +
        '<td class="num">' + Sky.decToDms(p.dec) + '</td>' +
        '<td>' + (up ? Sky.compass(h.azimuth) : '&mdash;') + '</td>' +
        '<td class="n">' + h.altitude.toFixed(1) + '&deg;</td>' +
        '<td class="n">' + p.magnitude.toFixed(1) + '</td>' +
        '<td class="n">' + p.distance.toFixed(2) + ' au</td></tr>';
    }).join('');
  }

  function refresh() { twilight(); moon(); planets(); }

  /* ---- controls ---------------------------------------------------------- */

  function toggle(btn, key, label) {
    if (!btn) return;
    btn.addEventListener('click', function () {
      var on = btn.getAttribute('aria-pressed') === 'true';
      btn.setAttribute('aria-pressed', on ? 'false' : 'true');
      map.set(key, !on);
    });
  }

  function boot() {
    var canvas = el('skyCanvas');
    if (!canvas || !root.SkyMap) return;

    var announce = el('skyAnnounce');
    map = root.SkyMap.build(canvas, {
      site: site,
      tip: el('skyTip'),
      onFocus: function (o) {
        if (!announce || !o) return;
        announce.textContent = o.name + ', ' + o.alt.toFixed(0) +
          ' degrees above the horizon in the ' + Sky.compass(o.az) +
          (o.mag !== null && o.mag !== undefined ? ', magnitude ' + o.mag.toFixed(1) : '') + '.';
      }
    });

    toggle(el('cFigures'), 'showFigures');
    toggle(el('cLabels'), 'showLabels');

    var scrub = el('timeScrub'), out = el('scrubOut'), nowBtn = el('cNow');

    function paintScrub() {
      var m = map.state.offsetMinutes;
      if (out) {
        out.textContent = m === 0 ? 'now' :
          Sky.clock(shownTime(), TZ) + '  (' + (m > 0 ? '+' : '−') +
          Sky.duration(Math.abs(m)) + ')';
      }
      if (nowBtn) nowBtn.setAttribute('aria-pressed', m === 0 ? 'true' : 'false');
    }

    if (scrub) {
      scrub.addEventListener('input', function () {
        map.set('offsetMinutes', parseInt(scrub.value, 10) || 0);
        paintScrub();
        refresh();
      });
    }
    if (nowBtn) {
      nowBtn.addEventListener('click', function () {
        if (scrub) scrub.value = '0';
        map.set('offsetMinutes', 0);
        paintScrub();
        refresh();
      });
    }

    paintScrub();
    refresh();
    root.setInterval(function () {
      if (map.state.offsetMinutes === 0) refresh();
    }, 60000);
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window, document);
