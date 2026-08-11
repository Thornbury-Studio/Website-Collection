/* VELA — home page. Fills the live readout, the sky map, the "up now" table
   and the next few days of programme. */
(function (root, doc) {
  'use strict';

  var Sky = root.Sky, VELA = root.VELA, R = root.VelaRender;
  if (!Sky || !VELA) return;
  var site = VELA.site;

  function $(s) { return doc.querySelector(s); }
  function set(id, html) { var el = doc.getElementById(id); if (el) el.innerHTML = html; }

  /* ---- readout ----------------------------------------------------------- */

  var map = null;

  function readout() {
    var now = new Date();
    var win = Sky.darkWindow(now, site.latitude, site.longitude);
    var moon = Sky.moon(Sky.dayNumber(now));

    set('readoutDate', now.toLocaleDateString('en-GB',
      { day: 'numeric', month: 'short', timeZone: site.timeZone }));
    set('rSunset', Sky.clock(win.sunset, site.timeZone));

    if (win.darkStatus === 'above') {
      set('rDark', '<b>none tonight</b>');
      set('rDuration', '0h 00m');
      var note = $('#readoutNote');
      if (note) {
        note.innerHTML = 'The Sun does not reach eighteen degrees below this horizon between ' +
          '10 May and 2 August, so there is no astronomical darkness at all tonight. ' +
          'Solar sessions run daily instead.';
      }
    } else {
      set('rDark', Sky.clock(win.darkStart, site.timeZone) + '&ndash;' +
        Sky.clock(win.darkEnd, site.timeZone));
      set('rDuration', '<b>' + Sky.duration(win.darkMinutes) + '</b>');
    }

    set('rMoon', Math.round(moon.illuminated * 100) + '% &middot; ' +
      Sky.moonPhaseName(moon.phase).toLowerCase());

    if (map) {
      var up = map.visible(2.2);
      set('rBrightest', up.length
        ? R.esc(up[0].name) + ' &middot; ' + Sky.compass(up[0].az) + ' ' +
          up[0].alt.toFixed(0) + '&deg;'
        : 'nothing above 10&deg;');
    }
  }

  /* ---- up-now table ------------------------------------------------------ */

  function upNow() {
    var body = doc.querySelector('#upNow tbody');
    if (!body || !map) return;
    var rows = map.visible(2.0).slice(0, 8);
    if (!rows.length) {
      body.innerHTML = '<tr><td colspan="4">Nothing brighter than magnitude 2 is more than ' +
        'ten degrees up from here at the moment.</td></tr>';
      return;
    }
    body.innerHTML = rows.map(function (o) {
      return '<tr><td>' + R.esc(o.name) +
        (o.kind === 'planet' ? ' <span class="u-signal">&bull;</span>' : '') +
        '</td><td>' + Sky.compass(o.az) + '</td>' +
        '<td class="n">' + o.alt.toFixed(0) + '&deg;</td>' +
        '<td class="n">' + o.mag.toFixed(1) + '</td></tr>';
    }).join('');
  }

  /* ---- programme --------------------------------------------------------- */

  function programme() {
    var host = doc.getElementById('homeProgramme');
    if (!host || !R) return;
    var all = VELA.programme(4);
    /* Only what has not already started. */
    var now = Date.now();
    var next = all.filter(function (s) { return s.startsAt.getTime() > now; }).slice(0, 5);
    R.remember(next);
    host.innerHTML = R.listHTML(next);
  }

  /* ---- membership price -------------------------------------------------- */

  function membershipFrom() {
    var cheapest = VELA.membership.reduce(function (a, b) {
      return b.price < a.price ? b : a;
    });
    set('memberFrom', VELA.money(cheapest.price));
  }

  /* ---- hero video -------------------------------------------------------- */

  function heroVideo() {
    var v = doc.getElementById('heroVideo');
    if (!v) return;
    /* Honour the reduced-motion preference: hold the poster frame instead of
       looping. The poster is the same photograph, so nothing is lost. */
    var mq = root.matchMedia('(prefers-reduced-motion: reduce)');
    var apply = function () {
      if (mq.matches) { v.pause(); v.removeAttribute('autoplay'); }
      else { var p = v.play(); if (p && p.catch) p.catch(function () { /* blocked */ }); }
    };
    apply();
    if (mq.addEventListener) mq.addEventListener('change', apply);
    else if (mq.addListener) mq.addListener(apply);
  }

  /* ---- boot -------------------------------------------------------------- */

  function boot() {
    var canvas = doc.getElementById('skyCanvas');
    if (canvas && root.SkyMap) {
      map = root.SkyMap.build(canvas, {
        site: site,
        tip: doc.getElementById('skyTip')
      });
    }
    readout();
    upNow();
    programme();
    membershipFrom();
    heroVideo();
    root.setInterval(function () { readout(); upNow(); }, 60000);
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window, document);
