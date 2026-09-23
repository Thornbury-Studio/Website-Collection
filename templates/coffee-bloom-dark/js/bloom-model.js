/* BLOOM. — the model. One file, two readers: the browser (js/bloom.js and
   js/main.js) and node (tools/bake.mjs, which bakes the static numbers into
   the HTML). Every figure the site quotes about freshness, the lot or an
   order is computed here and nowhere else, so the copy and the simulation
   cannot drift apart.

   Plain script, no modules: exported on globalThis.BLOOM. */

(function (root) {
  'use strict';

  /* ------------------------------------------------------------------ *
     Degassing. CO2 left in the whole bean, as a fraction of what it held
     on roast day. A stretched exponential — the shape our Monday test
     brews have followed for three lots — for a light filter roast kept in
     its valve bag at room temperature.
   * ------------------------------------------------------------------ */

  var TAU = 28;      // days
  var BETA = 1.2;

  function co2(day) {
    return Math.exp(-Math.pow(Math.max(0, day) / TAU, BETA));
  }

  /* ------------------------------------------------------------------ *
     The bloom test. 15 g ground medium into a flat-bottomed wave dripper,
     45 g of water at 94 °C poured in a spiral over five seconds, the rise
     read off a steel rule at the centre of the bed. RISE_MAX is the rise
     of a roast-day bag; everything else scales from the gas that is left.
   * ------------------------------------------------------------------ */

  var RISE_MAX = 11;     // mm
  var T_POUR = 2.0;      // s — first water hits the bed
  var POUR_S = 5.0;      // s — length of the bloom pour
  var T_END = 50;        // s — the window the site shows
  var DOSE_G = 15, WATER_G = 45, WATER_C = 94;

  // the state of one bed at brew time t, for a bag roasted `day` days ago
  function state(t, day) {
    var v = co2(day);
    var peak = Math.pow(v, 0.85);                   // 0..1 of RISE_MAX
    var r = t <= 2.4 ? 0 : 1 - Math.exp(-(t - 2.4) / 2.6);
    var tf = 5 + 30 * v;                            // the dome starts to give
    var tauF = 5 + 10 * v;
    var f = t <= tf ? 1 : Math.exp(-Math.pow((t - tf) / tauF, 2));
    var pouring = t >= T_POUR && t <= T_POUR + POUR_S ? 1 : 0;
    var h = peak * r * (0.2 + 0.8 * f);             // wet grounds stay swollen
    var act = Math.min(1, Math.pow(v, 0.9) * r * (0.3 + 0.7 * f) + 0.1 * pouring * (0.4 + 0.6 * v));
    var foam = Math.min(1, Math.pow(v, 0.7) * smooth(3, 9, t) * (0.55 + 0.45 * f));
    var pool = Math.pow(1 - v, 1.5) * smooth(2.5, 5.5, t) * Math.exp(-Math.max(0, t - 7.5) / 10);
    return {
      v: v,
      h: h,                        // 0..1 of RISE_MAX
      mm: h * RISE_MAX,
      act: act,
      foam: foam,
      fall: (1 - f) * r,
      pool: pool,
      pouring: pouring
    };
  }

  function smooth(a, b, x) {
    var t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  }

  // sampled curve for one bag: heights, cumulative gas, running peak and
  // running hold, at 10 samples a second across the window
  var STEP = 0.1;
  var cache = {};

  function curve(day) {
    var key = Math.round(day * 10) / 10;
    if (cache[key]) return cache[key];
    var n = Math.round(T_END / STEP) + 1;
    var mm = new Float32Array(n), gas = new Float32Array(n);
    var g = 0, peak = 0;
    for (var i = 0; i < n; i++) {
      var s = state(i * STEP, day);
      mm[i] = s.mm;
      g += s.act * STEP;
      gas[i] = g;
      if (s.mm > peak) peak = s.mm;
    }
    // hold: seconds the dome spends above half of its own peak
    var held = new Float32Array(n), acc = 0;
    for (var j = 0; j < n; j++) {
      if (peak > 0 && mm[j] >= peak * 0.5) acc += STEP;
      held[j] = acc;
    }
    var c = { day: day, mm: mm, gas: gas, held: held, peak: peak, hold: acc };
    cache[key] = c;
    return c;
  }

  function at(c, t) {
    var i = Math.max(0, Math.min(c.mm.length - 1, Math.round(t / STEP)));
    var peakSoFar = 0;
    for (var k = 0; k <= i; k++) if (c.mm[k] > peakSoFar) peakSoFar = c.mm[k];
    return { mm: c.mm[i], gas: c.gas[i], held: c.held[i], peak: peakSoFar };
  }

  function summary(day) {
    var c = curve(day);
    return {
      day: day,
      co2: co2(day),
      peak: c.peak,
      hold: c.hold
    };
  }

  // SVG path of the rise curve, in a w×h box, on the shared 0..RISE_MAX
  // scale so two bags drawn side by side compare honestly
  function path(day, w, h) {
    var c = curve(day), d = '', n = c.mm.length;
    for (var i = 0; i < n; i += 2) {
      var x = (i / (n - 1)) * w;
      var y = h - (c.mm[i] / RISE_MAX) * h;
      d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
    }
    return d;
  }

  // SVG path of CO2 left against days, 0..maxDay
  function co2Path(maxDay, w, h) {
    var d = '';
    for (var day = 0; day <= maxDay; day += 1) {
      var x = (day / maxDay) * w;
      var y = h - co2(day) * h;
      d += (day ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
    }
    return d;
  }

  /* ------------------------------------------------------------------ *
     The lot and the week. One lot, bought whole, roasted every Monday.
   * ------------------------------------------------------------------ */

  var LOT = {
    sacks: 50,
    sackKg: 70,
    loss: 0.14,          // weight lost in the roast, light filter profile
    bagG: 250,
    batchKg: 12,         // green, per batch
    batches: 6,          // per Monday
    priceAud: 26,
    postAud: 9.5,
    freePostFrom: 3      // bags
  };
  LOT.greenKg = LOT.sacks * LOT.sackKg;
  LOT.roastedKg = LOT.greenKg * (1 - LOT.loss);
  LOT.bags = Math.floor(LOT.roastedKg * 1000 / LOT.bagG);
  LOT.weeklyGreenKg = LOT.batchKg * LOT.batches;
  LOT.weeklyBags = Math.floor(LOT.weeklyGreenKg * (1 - LOT.loss) * 1000 / LOT.bagG);
  LOT.mondays = Math.ceil(LOT.greenKg / LOT.weeklyGreenKg);

  var WINDOW = { from: 4, to: 30 };   // days: where we'd start, where we'd stop

  function orderTotal(qty, collect) {
    var goods = qty * LOT.priceAud;
    var post = collect || qty >= LOT.freePostFrom ? 0 : LOT.postAud;
    return { goods: goods, post: post, total: goods + post };
  }

  /* ------------------------------------------------------------------ *
     The calendar, in Melbourne time, in whole civil days. Monday is roast
     day (day 0). Orders close Sunday at midnight, post goes Tuesday.
   * ------------------------------------------------------------------ */

  var DAY_MS = 86400000;
  var WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December'];

  function melbourneDay(now) {
    var parts = {};
    try {
      new Intl.DateTimeFormat('en-AU', {
        timeZone: 'Australia/Melbourne', year: 'numeric', month: 'numeric', day: 'numeric'
      }).formatToParts(now).forEach(function (p) { parts[p.type] = p.value; });
      return Date.UTC(+parts.year, +parts.month - 1, +parts.day) / DAY_MS;
    } catch (e) {
      return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / DAY_MS;
    }
  }

  function civil(n) { return new Date(n * DAY_MS); }

  function fmt(n, withDay) {
    var d = civil(n);
    var s = d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()];
    return withDay === false ? s : WEEKDAYS[d.getUTCDay()] + ' ' + s;
  }

  function short(n) {
    var d = civil(n);
    return WEEKDAYS[d.getUTCDay()].slice(0, 3) + ' ' + d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()].slice(0, 3);
  }

  function schedule(now) {
    var today = melbourneDay(now || new Date());
    var dow = (civil(today).getUTCDay() + 6) % 7;     // Monday = 0
    var lastRoast = today - dow;
    var nextRoast = lastRoast + 7;
    return {
      today: today,
      dayNow: dow,                       // days since this week's roast
      lastRoast: lastRoast,
      nextRoast: nextRoast,
      cutoff: nextRoast - 1,             // Sunday, midnight
      post: nextRoast + 1,               // Tuesday
      arriveFrom: nextRoast + 2,
      arriveTo: nextRoast + 3,
      windowFrom: nextRoast + WINDOW.from,
      windowTo: nextRoast + WINDOW.to
    };
  }

  function daysSince(isoDate, now) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate || '');
    if (!m) return null;
    var then = Date.UTC(+m[1], +m[2] - 1, +m[3]) / DAY_MS;
    return melbourneDay(now || new Date()) - then;
  }

  function isoFor(n) {
    var d = civil(n);
    return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' +
      String(d.getUTCDate()).padStart(2, '0');
  }

  root.BLOOM = {
    TAU: TAU, BETA: BETA, RISE_MAX: RISE_MAX, T_POUR: T_POUR, POUR_S: POUR_S, T_END: T_END,
    DOSE_G: DOSE_G, WATER_G: WATER_G, WATER_C: WATER_C,
    LOT: LOT, WINDOW: WINDOW,
    co2: co2, state: state, curve: curve, at: at, summary: summary,
    path: path, co2Path: co2Path, orderTotal: orderTotal,
    schedule: schedule, daysSince: daysSince, isoFor: isoFor, fmt: fmt, short: short
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
