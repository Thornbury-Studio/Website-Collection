/* VELA — the sky engine.

   Everything the site says about tonight is computed here from the date in the
   visitor's browser and the observatory's own coordinates. Nothing is written
   into the copy by hand, so the page cannot go stale or contradict itself.

   The orbital elements and the lunar perturbation terms follow the standard
   low-precision series (Schlyter's formulation of the classical method), which
   holds the Sun to about an arcminute and the Moon to a few arcminutes — far
   finer than a visitor-facing sky map or a twilight table can show.

   No dependencies. Angles are degrees unless a name ends in Rad. */
(function (root) {
  'use strict';

  var D2R = Math.PI / 180, R2D = 180 / Math.PI;
  var sin = function (d) { return Math.sin(d * D2R); };
  var cos = function (d) { return Math.cos(d * D2R); };
  var tan = function (d) { return Math.tan(d * D2R); };
  var asin = function (x) { return Math.asin(Math.max(-1, Math.min(1, x))) * R2D; };
  var atan2 = function (y, x) { return Math.atan2(y, x) * R2D; };

  function norm360(a) { a = a % 360; return a < 0 ? a + 360 : a; }
  function norm180(a) { a = norm360(a); return a > 180 ? a - 360 : a; }

  /* Days since the 1999 Dec 31.0 epoch the element sets are referred to, as a
     real number including the fraction of the day.

     10956 is the count of whole days from the Unix epoch to 1999 Dec 31.0, and
     it has to be exact: the Sun moves about a degree a day, so being a day and
     a half out here quietly throws every declination, sidereal time and
     twilight table on the site off by more than half a degree. */
  var EPOCH_OFFSET_DAYS = 10956;
  function dayNumber(date) {
    return date.getTime() / 86400000 - EPOCH_OFFSET_DAYS;
  }

  function julianDay(date) { return date.getTime() / 86400000 + 2440587.5; }

  /* Solve Kepler's equation. Two iterations are enough below e = 0.06 (every
     body here except Mercury and Pluto); the loop covers the rest. */
  function eccentricAnomaly(M, e) {
    var E = M + R2D * e * sin(M) * (1 + e * cos(M));
    for (var i = 0; i < 12; i++) {
      var dE = (E - R2D * e * sin(E) - M) / (1 - e * cos(E));
      E -= dE;
      if (Math.abs(dE) < 1e-8) break;
    }
    return E;
  }

  /* ---- Sun ------------------------------------------------------------- */

  function sun(d) {
    var w = 282.9404 + 4.70935e-5 * d;
    var e = 0.016709 - 1.151e-9 * d;
    var M = norm360(356.0470 + 0.9856002585 * d);
    var obl = 23.4393 - 3.563e-7 * d;
    var E = M + R2D * e * sin(M) * (1 + e * cos(M));
    var xv = cos(E) - e;
    var yv = Math.sqrt(1 - e * e) * sin(E);
    var v = atan2(yv, xv);
    var r = Math.sqrt(xv * xv + yv * yv);
    var lon = norm360(v + w);
    var xs = r * cos(lon), ys = r * sin(lon);
    var xe = xs;
    var ye = ys * cos(obl);
    var ze = ys * sin(obl);
    return {
      meanAnomaly: M, meanLongitude: norm360(w + M), perihelion: w,
      obliquity: obl, trueLongitude: lon, distance: r,
      ra: norm360(atan2(ye, xe)), dec: atan2(ze, Math.sqrt(xe * xe + ye * ye)),
      xs: xs, ys: ys
    };
  }

  /* Greenwich mean sidereal time, in degrees. The Sun's mean longitude plus
     180 degrees gives sidereal time at Greenwich midnight; the rest is the
     Earth's rotation through the day. */
  function gmst(date) {
    var d = dayNumber(date);
    var utHours = date.getUTCHours() + date.getUTCMinutes() / 60 +
      date.getUTCSeconds() / 3600 + date.getUTCMilliseconds() / 3600000;
    var s = sun(d);
    return norm360(s.meanLongitude + 180 + utHours * 15.04107);
  }

  function lst(date, lonEast) { return norm360(gmst(date) + lonEast); }

  /* ---- Moon ------------------------------------------------------------ */

  function moon(d) {
    var N = norm360(125.1228 - 0.0529538083 * d);
    var i = 5.1454;
    var w = norm360(318.0634 + 0.1643573223 * d);
    var a = 60.2666;
    var e = 0.054900;
    var M = norm360(115.3654 + 13.0649929509 * d);

    var E = eccentricAnomaly(M, e);
    var xv = a * (cos(E) - e);
    var yv = a * (Math.sqrt(1 - e * e) * sin(E));
    var v = atan2(yv, xv);
    var r = Math.sqrt(xv * xv + yv * yv);

    /* orbital plane to ecliptic */
    var xh = r * (cos(N) * cos(v + w) - sin(N) * sin(v + w) * cos(i));
    var yh = r * (sin(N) * cos(v + w) + cos(N) * sin(v + w) * cos(i));
    var zh = r * (sin(v + w) * sin(i));

    var lon = atan2(yh, xh);
    var lat = atan2(zh, Math.sqrt(xh * xh + yh * yh));

    /* The twelve largest periodic terms. Without these the Moon can be a
       degree and a half out — visible as a wrongly placed disc on the map and
       a phase that disagrees with the sky. */
    var s = sun(d);
    var Ms = s.meanAnomaly, Ls = s.meanLongitude;
    var Lm = norm360(N + w + M), Mm = M;
    var Dm = norm360(Lm - Ls);
    var F = norm360(Lm - N);

    lon += -1.274 * sin(Mm - 2 * Dm)
      + 0.658 * sin(2 * Dm)
      - 0.186 * sin(Ms)
      - 0.059 * sin(2 * Mm - 2 * Dm)
      - 0.057 * sin(Mm - 2 * Dm + Ms)
      + 0.053 * sin(Mm + 2 * Dm)
      + 0.046 * sin(2 * Dm - Ms)
      + 0.041 * sin(Mm - Ms)
      - 0.035 * sin(Dm)
      - 0.031 * sin(Mm + Ms)
      - 0.015 * sin(2 * F - 2 * Dm)
      + 0.011 * sin(Mm - 4 * Dm);

    lat += -0.173 * sin(F - 2 * Dm)
      - 0.055 * sin(Mm - F - 2 * Dm)
      - 0.046 * sin(Mm + F - 2 * Dm)
      + 0.033 * sin(F + 2 * Dm)
      + 0.017 * sin(2 * Mm + F);

    r += -0.58 * cos(Mm - 2 * Dm) - 0.46 * cos(2 * Dm);

    lon = norm360(lon);
    var obl = s.obliquity;
    var xg = r * cos(lon) * cos(lat);
    var yg = r * sin(lon) * cos(lat);
    var zg = r * sin(lat);
    var xe = xg;
    var ye = yg * cos(obl) - zg * sin(obl);
    var ze = yg * sin(obl) + zg * cos(obl);

    /* Elongation from the Sun gives the phase angle, and the phase angle gives
       the illuminated fraction of the disc. */
    var elong = acosDeg(cos(s.trueLongitude - lon) * cos(lat));
    var phaseAngle = 180 - elong;
    var illum = (1 + cos(phaseAngle)) / 2;
    /* Sign of the difference in ecliptic longitude says waxing or waning. */
    var waxing = norm360(lon - s.trueLongitude) < 180;

    return {
      ra: norm360(atan2(ye, xe)),
      dec: atan2(ze, Math.sqrt(xe * xe + ye * ye)),
      distanceEarthRadii: r,
      elongation: elong,
      illuminated: illum,
      waxing: waxing,
      /* 0 = new, 0.25 = first quarter, 0.5 = full, 0.75 = last quarter.
         Illumination alone cannot say which side of full the Moon is on — a
         3% crescent and a 3% old moon look identical to it — so the waxing
         flag picks the branch. */
      phase: waxing ? illum / 2 : 1 - illum / 2,
      age: norm360(lon - s.trueLongitude) / 360 * 29.530588
    };
  }

  function acosDeg(x) { return Math.acos(Math.max(-1, Math.min(1, x))) * R2D; }

  function moonPhaseName(phase) {
    if (phase < 0.02 || phase > 0.98) return 'New moon';
    if (phase < 0.23) return 'Waxing crescent';
    if (phase < 0.27) return 'First quarter';
    if (phase < 0.48) return 'Waxing gibbous';
    if (phase < 0.52) return 'Full moon';
    if (phase < 0.73) return 'Waning gibbous';
    if (phase < 0.77) return 'Last quarter';
    return 'Waning crescent';
  }

  /* ---- Planets --------------------------------------------------------- */

  var ELEMENTS = {
    mercury: { N: [48.3313, 3.24587e-5], i: [7.0047, 5.00e-8], w: [29.1241, 1.01444e-5],
      a: [0.387098, 0], e: [0.205635, 5.59e-10], M: [168.6562, 4.0923344368], mag: -0.36 },
    venus: { N: [76.6799, 2.46590e-5], i: [3.3946, 2.75e-8], w: [54.8910, 1.38374e-5],
      a: [0.723330, 0], e: [0.006773, -1.302e-9], M: [48.0052, 1.6021302244], mag: -4.34 },
    mars: { N: [49.5574, 2.11081e-5], i: [1.8497, -1.78e-8], w: [286.5016, 2.92961e-5],
      a: [1.523688, 0], e: [0.093405, 2.516e-9], M: [18.6021, 0.5240207766], mag: -1.51 },
    jupiter: { N: [100.4542, 2.76854e-5], i: [1.3030, -1.557e-7], w: [273.8777, 1.64505e-5],
      a: [5.20256, 0], e: [0.048498, 4.469e-9], M: [19.8950, 0.0830853001], mag: -9.25 },
    saturn: { N: [113.6634, 2.38980e-5], i: [2.4886, -1.081e-7], w: [339.3939, 2.97661e-5],
      a: [9.55475, 0], e: [0.055546, -9.499e-9], M: [316.9670, 0.0334442282], mag: -9.0 },
    uranus: { N: [74.0005, 1.3978e-5], i: [0.7733, 1.9e-8], w: [96.6612, 3.0565e-5],
      a: [19.18171, -1.55e-8], e: [0.047318, 7.45e-9], M: [142.5905, 0.011725806], mag: -7.15 },
    neptune: { N: [131.7806, 3.0173e-5], i: [1.7700, -2.55e-7], w: [272.8461, -6.027e-6],
      a: [30.05826, 3.313e-8], e: [0.008606, 2.15e-9], M: [260.2471, 0.005995147], mag: -6.9 }
  };

  var PLANET_LABEL = {
    mercury: 'Mercury', venus: 'Venus', mars: 'Mars', jupiter: 'Jupiter',
    saturn: 'Saturn', uranus: 'Uranus', neptune: 'Neptune'
  };

  function planet(name, d) {
    var el = ELEMENTS[name];
    if (!el) return null;
    var v = function (p) { return p[0] + p[1] * d; };
    var N = norm360(v(el.N)), i = v(el.i), w = norm360(v(el.w));
    var a = v(el.a), e = v(el.e), M = norm360(v(el.M));

    var E = eccentricAnomaly(M, e);
    var xv = a * (cos(E) - e);
    var yv = a * Math.sqrt(1 - e * e) * sin(E);
    var vAnom = atan2(yv, xv);
    var r = Math.sqrt(xv * xv + yv * yv);

    var xh = r * (cos(N) * cos(vAnom + w) - sin(N) * sin(vAnom + w) * cos(i));
    var yh = r * (sin(N) * cos(vAnom + w) + cos(N) * sin(vAnom + w) * cos(i));
    var zh = r * (sin(vAnom + w) * sin(i));

    var s = sun(d);
    var xg = xh + s.xs, yg = yh + s.ys, zg = zh;
    var obl = s.obliquity;
    var xe = xg;
    var ye = yg * cos(obl) - zg * sin(obl);
    var ze = yg * sin(obl) + zg * cos(obl);
    var dist = Math.sqrt(xg * xg + yg * yg + zg * zg);

    /* Phase-angle brightness, good to a few tenths — enough to size the dot. */
    var phaseAng = acosDeg((r * r + dist * dist - s.distance * s.distance) / (2 * r * dist));
    var mag = el.mag + 5 * Math.log10(r * dist) + 0.013 * phaseAng +
      1.5e-6 * phaseAng * phaseAng * phaseAng;

    return {
      id: name, name: PLANET_LABEL[name],
      ra: norm360(atan2(ye, xe)),
      dec: atan2(ze, Math.sqrt(xe * xe + ye * ye)),
      distance: dist, magnitude: mag
    };
  }

  function planets(date) {
    var d = dayNumber(date), out = [];
    for (var k in ELEMENTS) {
      if (Object.prototype.hasOwnProperty.call(ELEMENTS, k)) out.push(planet(k, d));
    }
    return out;
  }

  /* ---- Coordinate transforms ------------------------------------------- */

  /* Equatorial to the observer's horizon. Altitude is degrees above the
     horizon; azimuth is degrees clockwise from due north, so 90 is due east.
     Check: on the meridian sin(H) is 0, so azimuth resolves to 0 for an object
     north of the zenith and 180 for one south of it. */
  function toHorizon(ra, dec, latitude, localSidereal) {
    var H = norm180(localSidereal - ra);
    var altitude = asin(sin(dec) * sin(latitude) + cos(dec) * cos(latitude) * cos(H));
    var azimuth = norm360(atan2(
      -cos(dec) * sin(H),
      sin(dec) * cos(latitude) - cos(dec) * sin(latitude) * cos(H)
    ));
    return { altitude: altitude, azimuth: azimuth, hourAngle: H };
  }

  /* Galactic to equatorial, used to draw the Milky Way band rather than
     faking it with a gradient. */
  var NGP_RA = 192.85948, NGP_DEC = 27.12825, L_NCP = 122.93192;
  function galacticToEquatorial(l, b) {
    var sinDec = sin(NGP_DEC) * sin(b) + cos(NGP_DEC) * cos(b) * cos(L_NCP - l);
    var dec = asin(sinDec);
    var y = cos(b) * sin(L_NCP - l);
    var x = cos(NGP_DEC) * sin(b) - sin(NGP_DEC) * cos(b) * cos(L_NCP - l);
    return { ra: norm360(NGP_RA + atan2(y, x)), dec: dec };
  }

  /* ---- Rise, set and twilight ------------------------------------------ */

  function norm24(h) { h = h % 24; return h < 0 ? h + 24 : h; }

  /* The instants at which the Sun's centre crosses a given altitude on the
     given calendar day, returned as Date objects so the caller can render them
     in whichever timezone it means — the observatory's, not the visitor's.

     `status` is 'normal' when both crossings exist, 'below' when the Sun stays
     under that altitude all day and 'above' when it never descends to it. At
     54 degrees north the Sun bottoms out near −12 degrees at midsummer, so
     'above' is the correct and expected answer for astronomical darkness
     through June — it is a fact about the site, not a failure. */
  function sunEvents(date, latitude, lonEast, altitude) {
    var midnightMs = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    var d0 = midnightMs / 86400000 - EPOCH_OFFSET_DAYS;
    var at = function (hours) { return new Date(midnightMs + hours * 3600000); };

    function solve(guessHours) {
      var s = sun(d0 + guessHours / 24);
      var transit = norm360(s.ra - (s.meanLongitude + 180) - lonEast) / 15.04107;
      var cosH = (sin(altitude) - sin(latitude) * sin(s.dec)) /
        (cos(latitude) * cos(s.dec));
      if (cosH > 1) return { transit: transit, lha: null, status: 'below' };
      if (cosH < -1) return { transit: transit, lha: null, status: 'above' };
      return { transit: transit, lha: acosDeg(cosH) / 15.04107, status: 'normal' };
    }

    /* Solve once near local noon, then re-solve at each crossing found, since
       the Sun's declination has moved by then. */
    var first = solve(12);
    if (first.lha === null) {
      return { rise: null, set: null, transit: at(first.transit), status: first.status };
    }
    var r = solve(first.transit - first.lha);
    var s2 = solve(first.transit + first.lha);
    return {
      rise: r.lha === null ? null : at(r.transit - r.lha),
      set: s2.lha === null ? null : at(s2.transit + s2.lha),
      transit: at(first.transit),
      status: 'normal'
    };
  }

  /* The observing night: the stretch with the Sun more than 18 degrees down,
     when no sunlight at all reaches the upper atmosphere. */
  function darkWindow(date, latitude, lonEast) {
    var astro = sunEvents(date, latitude, lonEast, -18);
    var nautical = sunEvents(date, latitude, lonEast, -12);
    var civil = sunEvents(date, latitude, lonEast, -6);
    var solar = sunEvents(date, latitude, lonEast, -0.833);

    /* Astronomical dark begins this evening and ends the following morning, so
       measure to tomorrow's end-of-dark rather than today's. */
    var minutes = null;
    if (astro.set && astro.rise) {
      var tomorrow = new Date(date.getTime() + 86400000);
      var next = sunEvents(tomorrow, latitude, lonEast, -18);
      var end = next.rise || astro.rise;
      minutes = Math.round((end - astro.set) / 60000);
      if (minutes < 0) minutes = null;
    }
    return {
      sunrise: solar.rise, sunset: solar.set,
      civilEnd: civil.set, civilStart: civil.rise,
      nauticalEnd: nautical.set, nauticalStart: nautical.rise,
      darkStart: astro.set, darkEnd: astro.rise,
      darkStatus: astro.status,
      darkMinutes: minutes
    };
  }

  /* ---- Formatting ------------------------------------------------------ */

  /* Render an instant as clock time at the observatory. Passing the zone
     explicitly is what keeps a visitor in another country from being told the
     dome opens at their own local time. */
  function clock(date, timeZone) {
    if (!date) return '—';
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit', minute: '2-digit', hour12: false,
      timeZone: timeZone || 'UTC'
    }).format(date);
  }

  function duration(minutes) {
    if (minutes === null || minutes === undefined || isNaN(minutes)) return '—';
    var h = Math.floor(minutes / 60), m = minutes % 60;
    return h + 'h ' + (m < 10 ? '0' : '') + m + 'm';
  }

  function raToHms(ra) {
    var h = ra / 15;
    var hh = Math.floor(h);
    var mm = Math.floor((h - hh) * 60);
    var ss = Math.round(((h - hh) * 60 - mm) * 60);
    if (ss === 60) { ss = 0; mm += 1; }
    if (mm === 60) { mm = 0; hh += 1; }
    return hh + 'h ' + (mm < 10 ? '0' : '') + mm + 'm ' + (ss < 10 ? '0' : '') + ss + 's';
  }

  function decToDms(dec) {
    var sign = dec < 0 ? '−' : '+';
    var a = Math.abs(dec);
    var dd = Math.floor(a);
    var mm = Math.floor((a - dd) * 60);
    var ss = Math.round(((a - dd) * 60 - mm) * 60);
    if (ss === 60) { ss = 0; mm += 1; }
    if (mm === 60) { mm = 0; dd += 1; }
    return sign + dd + '° ' + (mm < 10 ? '0' : '') + mm + '′ ' +
      (ss < 10 ? '0' : '') + ss + '″';
  }

  var COMPASS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S',
    'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  function compass(azimuth) {
    return COMPASS[Math.round(norm360(azimuth) / 22.5) % 16];
  }

  root.Sky = {
    dayNumber: dayNumber, julianDay: julianDay,
    sun: sun, moon: moon, planet: planet, planets: planets,
    gmst: gmst, lst: lst, toHorizon: toHorizon,
    galacticToEquatorial: galacticToEquatorial,
    sunEvents: sunEvents, darkWindow: darkWindow,
    moonPhaseName: moonPhaseName,
    clock: clock, duration: duration,
    raToHms: raToHms, decToDms: decToDms, compass: compass,
    norm360: norm360, norm180: norm180, norm24: norm24
  };
})(window);
