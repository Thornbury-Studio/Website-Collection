/* NEAP — lunar arithmetic.
   Everything the site says about the moon and the tides is computed
   here from the date; nothing is typed by hand. */
(function () {
  "use strict";

  var SYNODIC = 29.530588853;               // mean synodic month, days
  var EPOCH = Date.UTC(2000, 0, 6, 18, 14); // a known new moon
  var DAY = 86400000;

  // Age of the moon in days [0, SYNODIC) at a given date.
  function age(date) {
    var d = ((date.getTime() - EPOCH) / DAY) % SYNODIC;
    return d < 0 ? d + SYNODIC : d;
  }

  // Fraction of the disc illuminated, 0..1.
  function illumination(a) {
    return (1 - Math.cos((2 * Math.PI * a) / SYNODIC)) / 2;
  }

  function phaseName(a) {
    var f = a / SYNODIC;
    if (f < 0.033 || f >= 0.967) return "new moon";
    if (f < 0.217) return "waxing crescent";
    if (f < 0.283) return "first quarter";
    if (f < 0.467) return "waxing gibbous";
    if (f < 0.533) return "full moon";
    if (f < 0.717) return "waning gibbous";
    if (f < 0.783) return "last quarter";
    return "waning crescent";
  }

  // Distance in days to the nearest syzygy (new or full moon).
  function distSyzygy(a) {
    var toNew = Math.min(a, SYNODIC - a);
    var toFull = Math.abs(a - SYNODIC / 2);
    return Math.min(toNew, toFull);
  }

  // Distance in days to the nearest quadrature (either quarter).
  function distQuadrature(a) {
    return Math.min(Math.abs(a - SYNODIC / 4), Math.abs(a - (3 * SYNODIC) / 4));
  }

  // Spring tides run around syzygy, neap tides around quadrature.
  function regime(a) {
    return distSyzygy(a) <= distQuadrature(a) ? "spring" : "neap";
  }

  // Whether a syzygy falls between local noon this date and noon next date.
  function syzygyOn(date) {
    var noon = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12);
    var a1 = age(noon);
    var a2 = a1 + 1; // one day later
    if (a1 < SYNODIC / 2 && a2 >= SYNODIC / 2) return "full";
    if (a2 >= SYNODIC) return "new";
    return null;
  }

  function ordinal(n) {
    var s = ["th", "st", "nd", "rd"];
    var v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  function nightWord(n) {
    var words = ["zero", "one", "two", "three", "four", "five", "six", "seven",
      "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen",
      "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty",
      "twenty-one", "twenty-two", "twenty-three", "twenty-four", "twenty-five",
      "twenty-six", "twenty-seven", "twenty-eight", "twenty-nine"];
    return words[n] || String(n);
  }

  // Everything a page needs to speak about tonight.
  function tonight(date) {
    var d = date || new Date();
    var a = age(d);
    var r = regime(a);
    return {
      age: a,
      nights: Math.round(a),
      nightsWord: nightWord(Math.round(a)),
      phase: phaseName(a),
      illumination: illumination(a),
      waxing: a < SYNODIC / 2,
      regime: r,
      menu: r === "spring" ? "flood" : "still"
    };
  }

  // The next n nights, for the tide calendar.
  function calendar(days, from) {
    var start = from || new Date();
    var out = [];
    for (var i = 0; i < days; i++) {
      var d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i, 21); // 9pm, service
      var a = age(d);
      out.push({
        date: d,
        day: d.getDate(),
        month: d.toLocaleDateString("en-GB", { month: "short" }),
        age: a,
        illumination: illumination(a),
        waxing: a < SYNODIC / 2,
        regime: regime(a),
        syzygy: syzygyOn(d),
        today: i === 0
      });
    }
    return out;
  }

  // An SVG moon disc for a given illumination and direction.
  // Returns inner markup for a viewBox="0 0 100 100" svg.
  // The terminator is a half-ellipse whose x-radius runs from
  // +48 (new: fully dark) through 0 (quarter) to -48 (full: fully lit).
  function moonMarkup(illum, waxing) {
    var r = 48;
    var k = (1 - 2 * illum) * r; // +r..-r
    // Build the lit region as a path: outer semicircle on the bright limb
    // plus the terminator ellipse edge.
    // Bright limb: right side while waxing, left while waning.
    var sweepOuter = waxing ? 1 : 0;
    var sweepTerm = (k >= 0) === waxing ? 0 : 1;
    var kk = Math.abs(k);
    var lit = "M50,2 A" + r + "," + r + " 0 0," + sweepOuter + " 50,98" +
              " A" + kk + "," + r + " 0 0," + sweepTerm + " 50,2 Z";
    return '<path d="' + lit + '" fill="currentColor"/>' +
           '<circle cx="50" cy="50" r="' + r + '" fill="none" stroke="currentColor" stroke-width="1.5"/>';
  }

  // Paint every .moon-glyph[data-moon] on the page, synchronously.
  function paintGlyphs(root) {
    var scope = root || document;
    var nodes = scope.querySelectorAll("[data-moon]");
    var t = tonight();
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].innerHTML = moonMarkup(t.illumination, t.waxing);
    }
  }

  window.NEAP_TIDE = {
    SYNODIC: SYNODIC,
    age: age,
    tonight: tonight,
    calendar: calendar,
    moonMarkup: moonMarkup,
    paintGlyphs: paintGlyphs,
    ordinal: ordinal
  };
})();
