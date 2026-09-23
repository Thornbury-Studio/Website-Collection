/* UNFURL. — the one source for every number and steep note on the site.
   Loaded as a classic script in the browser (globalThis.STEEP) and by
   tools/bake.mjs in node, which bakes the same values into the static HTML —
   visible text, the aria-live summary and the reduced-motion log alike. Change
   a value here, then run `node tools/bake.mjs`. */

(function (g) {
  'use strict';

  // The tin, and the lot it comes from.
  var TIN = {
    grams: 100,
    priceSgd: 42,
    courierSgd: 6,
    freeFrom: 2,          // tins; courier is free from here
    maxQty: 6
  };
  var LOT = {
    madeKg: 60,           // made tea we bought from the spring roast
    freshPerMade: 4.5,    // kg of fresh leaf per kg of finished oolong
    rolls: 36,            // cloth-ball rolling cycles, over two days
    roasts: 2,            // passes over longan charcoal
    roastHours: 12,       // each
    altitudeM: 1300,
    picked: '21 April 2026',
    roasted: '28 August and 4 September 2026'
  };

  // The pot: what the stage steeps, and what the tin's label says.
  var POT = { doseG: 5, waterMl: 300, tempC: 95, steeps: [180, 120, 180, 300] };
  // A gaiwan, for people who have one.
  var GAIWAN = { doseG: 6, waterMl: 100, tempC: 100, rinse: 5, steeps: [45, 25, 35, 50, 80, 120, 180] };
  // Overnight in the fridge.
  var COLD = { doseG: 10, waterMl: 1000, hours: 8 };

  // The stage: one first steep in the pot, 0:00 to 3:00, with our cupping notes
  // at the moments they change. The film is the pot through its glass wall.
  var STAGE = { seconds: POT.steeps[0] };
  var WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  var MARKS = [
    { t: 0,   head: 'Water in',              liquor: 'clear',
      note: POT.tempC + ' °C onto ' + POT.doseG + ' g of rolled leaf. Every knot in the pot is a whole leaf, folded on itself.' },
    { t: 20,  head: 'The knots crack',       liquor: 'pale straw',
      note: 'They give at the stem first. The steam carries the roast: toasted rice, cocoa husk.' },
    { t: 50,  head: 'Not yet',               liquor: 'pale gold',
      note: 'The aroma is out; the body is not. Pour now and you get a scented, thin cup.' },
    { t: 90,  head: 'Half open',             liquor: 'gold',
      note: 'Broad leaves press against the glass. Honey, then baked loquat.' },
    { t: 140, head: 'The roast turns sweet', liquor: 'amber',
      note: 'Brown sugar and dried longan, and a mineral edge that is the mountain.' },
    { t: 180, head: 'Pour it all',           liquor: 'deep amber',
      note: 'Every drop, out of the pot. Leaf left in water keeps steeping. The next pot takes ' + WORDS[POT.steeps[1] / 60] + ' minutes, because the leaf is already open.' }
  ];

  // What the same leaf does in the next three pots (POT.steeps[1..3]).
  var RESTEEPS = [
    { head: 'The fullest cup of the ' + WORDS[POT.steeps.length], liquor: 'amber',
      note: 'The leaf is already open, so it gives quickly: honey and roast together, and the thickest body of the day.' },
    { head: 'The roast steps back', liquor: 'gold',
      note: 'Orchid comes up from under the charcoal, and the finish runs long and mineral.' },
    { head: 'Sweet water', liquor: 'pale gold',
      note: 'Thin, clean and sweet. Leave this one to cool; it is better cold.' }
  ];

  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  // 0:00 style
  function clock(s) { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + pad2(s % 60); }
  // "3 min", "45 s", "2 min 30 s"
  function dur(s) {
    var m = Math.floor(s / 60), r = s % 60;
    if (!m) return r + ' s';
    return m + ' min' + (r ? ' ' + r + ' s' : '');
  }
  function money(n) { return 'S$' + (n % 1 ? n.toFixed(2) : String(n)); }
  function num(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function sum(a) { return a.reduce(function (x, y) { return x + y; }, 0); }

  // index of the note in force at time t
  function markAt(t) {
    var i = 0;
    for (var k = 0; k < MARKS.length; k++) if (t >= MARKS[k].t) i = k;
    return i;
  }
  // what a screen reader hears — the same words the stage shows
  function summary(t) {
    var m = MARKS[markAt(t)];
    return 'Steep time ' + clock(t) + '. Poured now, the liquor would be ' + m.liquor + '. ' + m.head + ': ' + m.note;
  }

  var derived = {
    dosesPerTin: Math.floor(TIN.grams / POT.doseG),
    potsPerTin: Math.floor(TIN.grams / POT.doseG) * POT.steeps.length,
    litresPerTin: Math.floor(TIN.grams / POT.doseG) * POT.steeps.length * POT.waterMl / 1000,
    gaiwanSessions: Math.floor(TIN.grams / GAIWAN.doseG),
    gaiwanWater: GAIWAN.rinse + sum(GAIWAN.steeps),
    coldLitres: Math.floor(TIN.grams / COLD.doseG) * COLD.waterMl / 1000,
    freshKg: LOT.madeKg * LOT.freshPerMade,
    tins: LOT.madeKg * 1000 / TIN.grams,
    charcoalHours: LOT.roasts * LOT.roastHours
  };
  derived.costPerPot = Math.round(TIN.priceSgd / derived.potsPerTin * 100) / 100;
  derived.costPerDose = Math.round(TIN.priceSgd / derived.dosesPerTin * 100) / 100;

  function orderTotal(qty, collect) {
    var goods = qty * TIN.priceSgd;
    var post = collect || qty >= TIN.freeFrom ? 0 : TIN.courierSgd;
    return { goods: goods, post: post, total: goods + post };
  }

  g.STEEP = {
    TIN: TIN, LOT: LOT, POT: POT, GAIWAN: GAIWAN, COLD: COLD, STAGE: STAGE, MARKS: MARKS, RESTEEPS: RESTEEPS,
    D: derived,
    clock: clock, dur: dur, money: money, num: num, sum: sum,
    markAt: markAt, summary: summary, orderTotal: orderTotal
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
