/* THORNBURY DIGITAL v6 — the sun over Singapore.

   Solar position for 01°17′N 103°51′E from any Date, using the NOAA
   solar-calculator equations (Meeus, Astronomical Algorithms, simplified
   to the ±0.01° accuracy that lighting a page needs). No dependencies.

   Exposed as window.TBSun:
     TBSun.position(date)  -> { altitude, azimuth, hour, decl, eqt }
        altitude: degrees above the horizon (negative = below)
        azimuth:  degrees clockwise from north (0 N, 90 E, 180 S, 270 W)
        hour:     local solar-ish clock hour in Singapore (SGT, UTC+8), 0–24
     TBSun.sgt(date)       -> the same instant expressed as SGT clock parts
     TBSun.day(date)       -> { rise, set } as SGT decimal hours for that date
     TBSun.at(date, hour)  -> a Date on the same SGT calendar day at `hour`
*/
(function () {
  "use strict";

  var LAT = 1.2833;      // 01°17′N
  var LON = 103.85;      // 103°51′E
  var TZ  = 8;           // SGT, no daylight saving
  var RAD = Math.PI / 180;

  // Julian day from a UTC instant.
  function julianDay(date) {
    return date.getTime() / 86400000 + 2440587.5;
  }

  // Everything NOAA needs from the Julian century.
  function solarBasics(jd) {
    var t = (jd - 2451545) / 36525;
    var L0 = (280.46646 + t * (36000.76983 + t * 0.0003032)) % 360;
    var M = 357.52911 + t * (35999.05029 - 0.0001537 * t);
    var e = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
    var Mr = M * RAD;
    var C = Math.sin(Mr) * (1.914602 - t * (0.004817 + 0.000014 * t))
          + Math.sin(2 * Mr) * (0.019993 - 0.000101 * t)
          + Math.sin(3 * Mr) * 0.000289;
    var trueLong = L0 + C;
    var omega = 125.04 - 1934.136 * t;
    var lambda = trueLong - 0.00569 - 0.00478 * Math.sin(omega * RAD);
    var eps0 = 23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60;
    var eps = eps0 + 0.00256 * Math.cos(omega * RAD);
    var decl = Math.asin(Math.sin(eps * RAD) * Math.sin(lambda * RAD)) / RAD;
    var y = Math.tan(eps * RAD / 2); y *= y;
    var L0r = L0 * RAD;
    var eqt = 4 / RAD * (y * Math.sin(2 * L0r) - 2 * e * Math.sin(Mr)
            + 4 * e * y * Math.sin(Mr) * Math.cos(2 * L0r)
            - 0.5 * y * y * Math.sin(4 * L0r) - 1.25 * e * e * Math.sin(2 * Mr));
    return { decl: decl, eqt: eqt };   // eqt in minutes
  }

  // SGT clock parts for an instant.
  function sgt(date) {
    var ms = date.getTime() + TZ * 3600000;
    var d = new Date(ms);
    return {
      year: d.getUTCFullYear(), month: d.getUTCMonth(), date: d.getUTCDate(),
      hour: d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600,
      h: d.getUTCHours(), m: d.getUTCMinutes(), s: d.getUTCSeconds()
    };
  }

  function position(date) {
    date = date || new Date();
    var jd = julianDay(date);
    var b = solarBasics(jd);
    var clock = sgt(date);
    // True solar time in minutes, from local clock minutes.
    var tst = (clock.hour * 60 + b.eqt + 4 * LON - 60 * TZ + 1440) % 1440;
    var ha = tst / 4 - 180;                       // hour angle, degrees
    if (ha < -180) ha += 360;
    var latr = LAT * RAD, dr = b.decl * RAD, har = ha * RAD;
    var cosZen = Math.sin(latr) * Math.sin(dr) + Math.cos(latr) * Math.cos(dr) * Math.cos(har);
    cosZen = Math.max(-1, Math.min(1, cosZen));
    var zen = Math.acos(cosZen) / RAD;
    var az;
    var denom = Math.cos(latr) * Math.sin(zen * RAD);
    if (Math.abs(denom) < 1e-9) {
      az = 180;
    } else {
      var cosAz = (Math.sin(latr) * cosZen - Math.sin(dr)) / denom;
      cosAz = Math.max(-1, Math.min(1, cosAz));
      az = Math.acos(cosAz) / RAD;
      az = ha > 0 ? (az + 180) % 360 : (540 - az) % 360;
    }
    // Atmospheric refraction lifts the sun a little near the horizon.
    var alt = 90 - zen;
    if (alt > -0.575 && alt < 85) {
      var te = Math.tan(alt * RAD), refr;
      if (alt > 5) refr = 58.1 / te - 0.07 / (te * te * te) + 0.000086 / Math.pow(te, 5);
      else refr = 1735 + alt * (-518.2 + alt * (103.4 + alt * (-12.79 + alt * 0.711)));
      alt += refr / 3600;
    }
    return { altitude: alt, azimuth: az, hour: clock.hour, decl: b.decl, eqt: b.eqt };
  }

  // Sunrise/sunset (SGT decimal hours) for the SGT calendar day containing `date`.
  function day(date) {
    date = date || new Date();
    var c = sgt(date);
    var noonUTC = Date.UTC(c.year, c.month, c.date, 12 - TZ);
    var b = solarBasics(julianDay(new Date(noonUTC)));
    var latr = LAT * RAD, dr = b.decl * RAD;
    var cosHa = (Math.cos(90.833 * RAD) / (Math.cos(latr) * Math.cos(dr))) - Math.tan(latr) * Math.tan(dr);
    cosHa = Math.max(-1, Math.min(1, cosHa));
    var ha = Math.acos(cosHa) / RAD;
    var solarNoon = (720 - 4 * LON - b.eqt + TZ * 60) / 60;   // SGT hours
    return { rise: solarNoon - ha / 15, set: solarNoon + ha / 15, noon: solarNoon };
  }

  // A Date on the same SGT day as `date`, at decimal SGT hour `hour`.
  function at(date, hour) {
    var c = sgt(date || new Date());
    return new Date(Date.UTC(c.year, c.month, c.date, 0, 0, 0) - TZ * 3600000 + hour * 3600000);
  }

  var api = { position: position, sgt: sgt, day: day, at: at, LAT: LAT, LON: LON, TZ: TZ };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof window !== "undefined") window.TBSun = api;
})();
