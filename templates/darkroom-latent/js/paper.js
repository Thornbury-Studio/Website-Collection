/* LATENT. — the paper model.
   One source of truth for every number the bench, the curve chart and the
   static page print. The shader in bench.js mirrors density() and
   negOffset() line for line; tools/bake.mjs reads this file to bake the
   grade table and the house settings into index.html.

   Units: exposure E in lamp-seconds (seconds of unfiltered lamp at the
   easel), log exposure logH = log10(E) - Dn where Dn is the negative's
   density at that point. Print density D runs from paper white (DMIN) to
   the deepest black the paper gives (DMAX). */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LatentPaper = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var DMIN = 0.06;   // glossy RC paper white, base + fog
  var DMAX = 2.05;   // glossy RC maximum black
  var SPAN = 6.1;    // logistic units between toe (DMIN+0.04) and shoulder (90 % of DMAX)
  var PIVOT = 0;     // log exposure every grade pivots about (equal-speed grades)

  // Modelled ISO range R (log units of exposure the grade spans), the
  // filter factor, and the colour the filtered lamp throws on the easel.
  // Low grades filter yellow, high grades magenta; 4 and 5 take twice the time.
  var GRADES = [
    { id: '00', R: 1.70, factor: 1, lamp: [1.00, 0.86, 0.30] },
    { id: '0',  R: 1.50, factor: 1, lamp: [1.00, 0.82, 0.38] },
    { id: '1',  R: 1.30, factor: 1, lamp: [1.00, 0.80, 0.52] },
    { id: '2',  R: 1.10, factor: 1, lamp: [1.00, 0.84, 0.72] },
    { id: '3',  R: 0.90, factor: 1, lamp: [1.00, 0.66, 0.74] },
    { id: '4',  R: 0.70, factor: 2, lamp: [1.00, 0.46, 0.72] },
    { id: '5',  R: 0.55, factor: 2, lamp: [0.98, 0.32, 0.70] }
  ];

  // The three frames in the carrier, with the settings the house printer
  // uses for each. The negative's densities are defined as the ones that
  // make the house print come out as the photographer's own print.
  var NEGS = [
    { id: 'cobbler', frame: '14', title: 'Cobbler, under the awning', grade: '3', stops: 3.5,
      note: 'A flat negative. Needs grade 3 to separate the shirt from the shelves.' },
    { id: 'street',  frame: '22', title: 'Six lanes, after rain', grade: '2', stops: 3,
      note: 'A normal negative. The wet road is the brightest thing in it: print for that.' },
    { id: 'alley',   frame: '31', title: 'Supper, one table lit', grade: '1', stops: 4,
      note: 'Dense and hard. Soft grade, long time, and burn the sign in.' }
  ];

  var TIMER = { minStops: 1, maxStops: 6, step: 1 / 3 };   // 2 s to 64 s in thirds

  function grade(id) {
    for (var i = 0; i < GRADES.length; i++) if (GRADES[i].id === id) return GRADES[i];
    return GRADES[3];
  }
  function slope(g) { return SPAN / g.R; }

  function logistic(x) { return 1 / (1 + Math.exp(-x)); }

  // print density for a log exposure on a grade (fully developed)
  function density(logH, g) {
    return DMIN + (DMAX - DMIN) * logistic(slope(g) * (logH - PIVOT));
  }

  // the log exposure a grade needs to reach density D
  function logHFor(D, g) {
    var s = (D - DMIN) / (DMAX - DMIN);
    s = Math.min(0.996, Math.max(0.004, s));
    return PIVOT + Math.log(s / (1 - s)) / slope(g);
  }

  // development: nothing for the first ~7 s (induction), then density
  // builds toward full by 60 s; past 60 s it creeps on and fog begins.
  var DEV = { full: 60, induction: 0.12, rate: 4.2 };
  function devFactor(sec) {
    var p = sec / DEV.full;
    if (p <= DEV.induction) return 0;
    if (p <= 1) {
      var f = (p - DEV.induction) / (1 - DEV.induction);
      return (1 - Math.exp(-DEV.rate * f)) / (1 - Math.exp(-DEV.rate));
    }
    return 1 + 0.04 * Math.min(2, p - 1);
  }
  function devFog(sec) { return sec > DEV.full ? 0.03 * Math.min(2, sec / DEV.full - 1) : 0; }

  function seconds(stops) { return Math.pow(2, stops); }
  function stopsOf(sec) { return Math.log(sec) / Math.LN2; }
  function snap(stops) {
    var s = Math.round(stops / TIMER.step) * TIMER.step;
    return Math.min(TIMER.maxStops, Math.max(TIMER.minStops, s));
  }
  function fmtSec(sec) { return sec < 10 ? sec.toFixed(1) : sec < 100 ? sec.toFixed(1) : String(Math.round(sec)); }

  // an f-stop test strip: five bands, −1 to +1 stop around the timer in half stops
  function stripStops(stops) { return [-1, -0.5, 0, 0.5, 1].map(function (d) { return stops + d; }); }

  // For a negative printed at the house settings, the pixel whose own
  // photograph shows reflectance-luminance L (0..1, linear) has this
  // negative log exposure offset: logH = log10(E) + neg(L).
  function negOffset(L, neg) {
    var g = grade(neg.grade);
    var target = DMIN - Math.log(Math.max(L, 1e-4)) / Math.LN10;
    return logHFor(target, g) - Math.log(seconds(neg.stops) / g.factor) / Math.LN10;
  }

  // where a negative's highlights and shadows land on a grade at a time
  function landing(neg, stops, g) {
    var lg = Math.log(seconds(stops) / g.factor) / Math.LN10;
    var hi = negOffset(0.84, neg) + lg;     // brightest detail worth keeping
    var lo = negOffset(0.02, neg) + lg;     // deepest shadow with texture
    return { hiLogH: hi, loLogH: lo, hiD: density(hi, g), loD: density(lo, g) };
  }

  return {
    DMIN: DMIN, DMAX: DMAX, SPAN: SPAN, PIVOT: PIVOT, GRADES: GRADES, NEGS: NEGS,
    TIMER: TIMER, DEV: DEV,
    grade: grade, slope: slope, density: density, logHFor: logHFor,
    devFactor: devFactor, devFog: devFog, seconds: seconds, stopsOf: stopsOf,
    snap: snap, fmtSec: fmtSec, stripStops: stripStops, negOffset: negOffset, landing: landing
  };
});
