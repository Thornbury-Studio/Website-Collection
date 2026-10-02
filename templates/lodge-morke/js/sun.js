/* MØRKE — the sun at the lodge.
   One model, used by the live readout and the season chart. The same formula
   (low-precision solar position, after the US Naval Observatory / NOAA
   approximation, good to ~0.1°) produced the season dates written into the
   page's text: last sunrise 25 Oct, no sunrise for 113 days, back 16 Feb,
   no civil twilight 12 Nov – 30 Jan, −11.9° at noon on 21 Dec.
   tools/check-season.mjs re-derives those from this file and fails if the
   page text and the model ever disagree. */
(function (root) {
  'use strict';

  var LAT = 78.4333;   // 78°26′ N
  var LON = 15.95;     // 15°57′ E
  var RISE = -0.833;   // centre of the sun at the horizon, refraction included
  var CIVIL = -6;
  var rad = Math.PI / 180;

  // Solar altitude in degrees at the lodge for a JS Date (UTC instant).
  function altitude(date) {
    var n = date.getTime() / 864e5 + 2440587.5 - 2451545.0;
    var L = (280.460 + 0.9856474 * n) % 360;
    var g = ((357.528 + 0.9856003 * n) % 360) * rad;
    var lam = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * rad;
    var eps = (23.439 - 0.0000004 * n) * rad;
    var dec = Math.asin(Math.sin(eps) * Math.sin(lam));
    var ra = Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam));
    var gmst = (280.46061837 + 360.98564736629 * n) % 360;
    var ha = ((gmst + LON) % 360) * rad - ra;
    var alt = Math.asin(Math.sin(LAT * rad) * Math.sin(dec) + Math.cos(LAT * rad) * Math.cos(dec) * Math.cos(ha));
    return alt / rad;
  }

  // Highest the sun gets on a calendar day (UTC), sampled every 10 minutes.
  function dayMax(y, m, d) {
    var best = -90, t0 = Date.UTC(y, m, d);
    for (var k = 0; k < 144; k++) {
      var a = altitude(new Date(t0 + k * 6e5));
      if (a > best) best = a;
    }
    return best;
  }

  root.MorkeSun = { LAT: LAT, LON: LON, RISE: RISE, CIVIL: CIVIL, altitude: altitude, dayMax: dayMax };
})(typeof window !== 'undefined' ? window : globalThis);
