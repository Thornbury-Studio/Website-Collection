/* NOON — shared chrome and the one solar model.
   Every light figure and every rent on this site is computed here at
   runtime: real solar geometry (declination, hour angle, altitude, azimuth)
   at Havnsund, 55.7° N, applied to each building's declared orientation and
   glazing. A typed number is a lie waiting to drift. */
(function () {
  'use strict';
  document.documentElement.classList.remove('no-js');
  document.documentElement.classList.add('js-anim');

  var N = window.NN = {
    reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    clamp: function (v, a, b) { return v < a ? a : v > b ? b : v; }
  };

  var RAD = Math.PI / 180;

  /* ---------- the sun ---------- */

  N.city = { name: 'Havnsund', lat: 55.7 };

  N.sun = {
    // day-of-year for today (or a given Date)
    doy: function (d) {
      d = d || new Date();
      return Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5);
    },
    declination: function (n) {
      return 23.44 * Math.sin(2 * Math.PI * (284 + n) / 365);
    },
    // altitude & azimuth (deg, az 0=N clockwise) at solar hour t (0–24)
    position: function (t, n, lat) {
      lat = (lat == null ? N.city.lat : lat) * RAD;
      var dec = this.declination(n == null ? this.doy() : n) * RAD;
      var H = (t - 12) * 15 * RAD;
      var alt = Math.asin(Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(H));
      var az = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(lat) - Math.tan(dec) * Math.cos(lat));
      return { alt: alt / RAD, az: (az / RAD + 180) % 360 };
    },
    // solar sunrise/sunset (solar hours) for day n
    riseSet: function (n, lat) {
      lat = (lat == null ? N.city.lat : lat) * RAD;
      var dec = this.declination(n == null ? this.doy() : n) * RAD;
      var c = -Math.tan(lat) * Math.tan(dec);
      if (c <= -1) return { rise: 0, set: 24 };   // midnight sun
      if (c >= 1) return { rise: 12, set: 12 };   // polar night
      var H0 = Math.acos(c) / RAD / 15;
      return { rise: 12 - H0, set: 12 + H0 };
    },
    // smallest angular distance between two bearings (deg)
    bearingGap: function (a, b) {
      var d = Math.abs(a - b) % 360;
      return d > 180 ? 360 - d : d;
    },
    // is direct sun on any of these window-wall bearings at solar hour t?
    lightsWalls: function (t, walls, n, lat) {
      var p = this.position(t, n, lat);
      if (p.alt < 6) return false; // below useful altitude
      for (var i = 0; i < walls.length; i++) {
        if (this.bearingGap(p.az, walls[i]) < 78) return true;
      }
      return false;
    },
    // direct-sun hours across the working day (08–18 solar) on the given
    // window-wall bearings. The survey counts working light: a midsummer
    // 05:00 graze on a north wall is real astronomy but not real tenancy.
    directHours: function (walls, n, lat) {
      var rs = this.riseSet(n, lat), h = 0, step = 1 / 12;
      var from = Math.max(rs.rise, 8), to = Math.min(rs.set, 18);
      for (var t = from; t <= to; t += step) {
        if (this.lightsWalls(t, walls, n, lat)) h += step;
      }
      return h;
    }
  };

  /* ---------- the holdings (single registry, used by every page) ---------- */

  N.buildings = {
    lantern: {
      sheet: '01', name: 'The Lantern Works', slug: 'lantern',
      kind: 'Former glassworks · 1911',
      address: 'Teglgade 4, Havnsund N',
      rate: 21,                       // € / m² / month, building base
      walls: [0],                     // sawtooth monitors face true north
      character: 'Steady',
      blurb: 'North light only: the sun never enters, so nothing ever glares.',
      floors: [
        { id: 'L1', name: 'West hall', area: 410, factor: 1.0, glaze: 0.58, state: 'available' },
        { id: 'L2', name: 'East hall', area: 385, factor: 1.0, glaze: 0.58, state: 'let' },
        { id: 'L3', name: 'The gatehouse', area: 96, factor: 0.9, glaze: 0.34, state: 'available' }
      ]
    },
    meridian: {
      sheet: '02', name: 'The Meridian Hall', slug: 'meridian',
      kind: 'Former reading hall · 1904',
      address: 'Biblioteksplads 1, Havnsund C',
      rate: 26,
      walls: [172],                   // one grand clerestory wall, near-south
      character: 'Deep',
      blurb: 'One room, one wall of arched glass, and the sun crossing it all day.',
      floors: [
        { id: 'M1', name: 'The hall', area: 540, factor: 1.15, glaze: 0.71, state: 'reserved' },
        { id: 'M2', name: 'North gallery', area: 150, factor: 0.85, glaze: 0.30, state: 'available' }
      ]
    },
    grain: {
      sheet: '03', name: 'The Grain Store', slug: 'grain',
      kind: 'Former grain warehouse · 1887',
      address: 'Silokaj 12, Havnsund Havn',
      rate: 17,
      walls: [96, 276],               // long walls east / west over the water
      character: 'Long',
      blurb: 'Morning on the water side, evening on the street side; timber all day.',
      floors: [
        { id: 'G2', name: 'Second floor', area: 620, factor: 1.0, glaze: 0.38, state: 'available' },
        { id: 'G3', name: 'Third floor', area: 620, factor: 1.0, glaze: 0.38, state: 'available' },
        { id: 'G4', name: 'Fourth floor', area: 605, factor: 1.05, glaze: 0.41, state: 'let' },
        { id: 'G5', name: 'The gable loft', area: 340, factor: 1.1, glaze: 0.52, state: 'available' }
      ]
    },
    signal: {
      sheet: '04', name: 'The Signal House', slug: 'signal',
      kind: 'Former harbour signal tower · 1931',
      address: 'Fyrbakken 2, Havnsund Havn',
      rate: 29,
      walls: [0, 90, 180, 270],       // the lantern floor is glazed all round
      character: 'Total',
      blurb: 'Six small floors and then the lantern: glass on every side, sky on all four.',
      floors: [
        { id: 'S4', name: 'Fourth floor', area: 74, factor: 0.95, glaze: 0.44, state: 'let' },
        { id: 'S5', name: 'Fifth floor', area: 74, factor: 1.0, glaze: 0.44, state: 'available' },
        { id: 'S6', name: 'The lantern', area: 68, factor: 1.3, glaze: 0.86, state: 'available' }
      ]
    }
  };

  N.rent = function (b, f) { return Math.round(b.rate * f.factor * f.area / 5) * 5; };

  N.fmt = {
    hours: function (h) { return h < 0.05 ? '0 h' : (Math.round(h * 10) / 10).toFixed(1).replace(/\.0$/, '') + ' h'; },
    eur: function (v) { return '€' + v.toLocaleString('en-IE'); },
    deg: function (v) { return Math.round(v) + '°'; },
    clock: function (t) {
      var h = Math.floor(t), m = Math.round((t - h) * 60);
      if (m === 60) { h += 1; m = 0; }
      return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
    },
    compass: function (az) {
      var pts = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
      return pts[Math.round(az / 22.5) % 16];
    }
  };

  /* ---------- live solar clock (topbar) ---------- */

  function paintClock() {
    var el = document.querySelector('[data-solar-clock]');
    if (!el) return;
    var now = new Date();
    var t = now.getHours() + now.getMinutes() / 60;
    var p = N.sun.position(t);
    var rs = N.sun.riseSet();
    var txt;
    if (p.alt > 0) {
      txt = 'Sun ' + N.fmt.deg(p.alt) + ' · ' + N.fmt.compass(p.az) + ' · sets ' + N.fmt.clock(rs.set);
    } else {
      txt = 'Sun below horizon · rises ' + N.fmt.clock(rs.rise);
    }
    el.textContent = txt;
  }
  paintClock();
  setInterval(paintClock, 60000);

  /* ---------- reveals: IO + sweep backstop (see HARLOWE lesson) ---------- */

  var seen = false;
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { seen = true; en.target.classList.add('is-in'); io.unobserve(en.target); }
    });
  }, { rootMargin: '0px 0px -6% 0px', threshold: 0.04 }) : null;

  N.rescanReveals = function (root) {
    var els = (root || document).querySelectorAll('.reveal:not(.is-in)');
    if (!io) { els.forEach(function (el) { el.classList.add('is-in'); }); return; }
    els.forEach(function (el) { io.observe(el); });
  };
  N.rescanReveals();

  function sweep() {
    var els = document.querySelectorAll('.reveal:not(.is-in)');
    if (!els.length) return;
    var vh = window.innerHeight;
    els.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < vh + 80 && r.bottom > -80) el.classList.add('is-in');
    });
  }
  var sweepQueued = false;
  function queueSweep() {
    if (sweepQueued) return;
    sweepQueued = true;
    setTimeout(function () { sweepQueued = false; sweep(); }, 120);
  }
  window.addEventListener('scroll', queueSweep, { passive: true });
  window.addEventListener('resize', queueSweep);
  window.addEventListener('hashchange', queueSweep);
  setTimeout(function () {
    if (!seen) document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-in'); });
    else sweep();
  }, 1500);

  /* ---------- topbar: quiet until scrolled ---------- */

  var bar = document.querySelector('.topbar');
  if (bar) {
    window.addEventListener('scroll', function () {
      bar.classList.toggle('settled', window.scrollY > 24);
    }, { passive: true });
  }

  /* ---------- video: play in view, pause out of view ---------- */

  var vio = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      var v = en.target;
      if (N.reduced) { v.pause(); return; }
      if (en.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
      else v.pause();
    });
  }, { rootMargin: '100px 0px' }) : null;
  document.querySelectorAll('video[data-io]').forEach(function (v) {
    if (vio) vio.observe(v);
    else if (!N.reduced) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  });

  /* ---------- ambient tint: pages may set --ambient from a dial ---------- */

  N.ambient = function (t) {
    // dawn rose -> noon clear -> evening amber, mapped over the day
    var rs = N.sun.riseSet();
    var span = rs.set - rs.rise;
    var x = N.clamp((t - rs.rise) / span, 0, 1);
    var warm = Math.pow(Math.abs(x - 0.5) * 2, 1.6); // 0 at noon, 1 at rise/set
    var hue = x < 0.5 ? 18 : 32;                      // rose vs amber
    document.documentElement.style.setProperty(
      '--ambient', 'hsla(' + hue + ', 78%, 52%, ' + (warm * 0.16).toFixed(3) + ')'
    );
  };
}());
