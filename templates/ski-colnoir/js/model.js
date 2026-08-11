/* COL NOIR — the mountain model.
   Everything the site displays derives from here, deterministically, per
   date: snowfall history, wind, temperatures by elevation, danger ratings
   per elevation band, avalanche problems with loaded aspects, lift states
   and sector access. Same date, same mountain — on every visit and every
   device. No value on any page is invented ad hoc. */
(function () {
  'use strict';

  function fnv(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = (h * 16777619) >>> 0; }
    return h >>> 0;
  }
  function mulberry(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function dstr(d) { return d.toISOString().slice(0, 10); }
  function addDays(d, n) { var x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; }

  var COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

  /* one raw weather day */
  function weather(date) {
    var r = mulberry(fnv('colnoir:' + dstr(date)));
    var storm = r();                                   /* 0 calm … 1 full storm */
    var snow = Math.max(0, Math.round(Math.pow(r(), 2.1) * 46 - 7 + storm * 12));
    var wind = Math.round(6 + Math.pow(r(), 1.3) * 66 + storm * 18);
    var dirI = Math.floor(r() * 8);
    var tBase = Math.round((-8 + r() * 11 - storm * 3) * 10) / 10;  /* °C at 1840 m */
    return { storm: storm, snow: snow, wind: wind, dirI: dirI, dir: COMPASS[dirI], tBase: tBase };
  }

  var LIFTS = [
    { id: 'tc-colnoir', name: 'TC Col Noir',  kind: 'Gondola · 8p',  base: 1840, top: 2450 },
    { id: 'ts-foret',   name: 'TS Forêt',     kind: 'Chair · 4p',    base: 1840, top: 2205 },
    { id: 'ts-combe',   name: 'TS Combe',     kind: 'Chair · 6p',    base: 2210, top: 2760 },
    { id: 'ts-crete',   name: 'TS Crête',     kind: 'Chair · 4p',    base: 2450, top: 3020 },
    { id: 'ts-epaule',  name: 'TS L’Épaule',  kind: 'Chair · 4p',    base: 2450, top: 2980 },
    { id: 'tk-dalles',  name: 'TK Dalles',    kind: 'Draglift',      base: 2600, top: 2840 },
    { id: 'tb-sommet',  name: 'TB Sommet',    kind: 'Cable car',     base: 3020, top: 3260 }
  ];

  var SECTORS = [
    { id: 'face-nord',   name: 'Face Nord',    aspect: 'N',  alt: [2450, 3260], steep: 42, lifts: ['ts-crete', 'tb-sommet'],
      character: 'The cold wall. Shaded, wind-worked, holds the season’s driest snow — and its sharpest consequences.' },
    { id: 'couloir-est', name: 'Couloir Est',  aspect: 'E',  alt: [2760, 3180], steep: 45, lifts: ['tb-sommet'],
      character: 'A hallway of rock four turns wide. Morning sun softens the entry an hour after first light.' },
    { id: 'combe',       name: 'Combe Blanche', aspect: 'NE', alt: [2210, 2760], steep: 30, lifts: ['ts-combe'],
      character: 'The big open bowl. Room for a hundred lines after a storm; none of them stays untracked past ten.' },
    { id: 'epaule',      name: 'L’Épaule',     aspect: 'W',  alt: [2450, 2980], steep: 34, lifts: ['ts-epaule'],
      character: 'The shoulder. Wind decides everything here — chalk one day, sastrugi the next.' },
    { id: 'dalles',      name: 'Les Dalles',   aspect: 'SE', alt: [2600, 2840], steep: 38, lifts: ['tk-dalles'],
      character: 'Slabby sunlit faces that corn up beautifully by March afternoons.' },
    { id: 'foret',       name: 'Forêt Basse',  aspect: 'NW', alt: [1840, 2205], steep: 26, lifts: ['ts-foret', 'tc-colnoir'],
      character: 'Storm-day sanctuary. Old larch, soft light, visibility when the top is a white room.' }
  ];

  function leeAspects(dirI) {
    /* wind loads the three octants centred opposite the wind */
    var o = (dirI + 4) % 8;
    return [COMPASS[(o + 7) % 8], COMPASS[o], COMPASS[(o + 1) % 8]];
  }

  function build(date) {
    var today = weather(date);
    var d1 = weather(addDays(date, -1));
    var d2 = weather(addDays(date, -2));

    /* season depth: accumulate the last 45 seeded days, settle 1.5%/day */
    var acc = 0;
    for (var i = 45; i >= 0; i--) {
      acc = acc * 0.985 + weather(addDays(date, -i)).snow;
    }
    var depth = {
      base: Math.round(45 + acc * 0.55),
      mid: Math.round(70 + acc * 0.85),
      summit: Math.round(95 + acc * 1.15)
    };

    var lapse = 0.65; /* °C per 100 m */
    var temp = {
      base: today.tBase,
      mid: Math.round((today.tBase - (2450 - 1840) / 100 * lapse) * 10) / 10,
      summit: Math.round((today.tBase - (3260 - 1840) / 100 * lapse) * 10) / 10
    };
    var freezing = Math.max(0, Math.round((1840 + today.tBase / lapse * 100) / 50) * 50);

    var snow24 = today.snow, snow48 = today.snow + d1.snow, snow72 = snow48 + d2.snow;

    /* danger: fresh load + wind transport, eased below treeline */
    function rate(score) {
      if (score >= 58) return 5;
      if (score >= 40) return 4;
      if (score >= 22) return 3;
      if (score >= 10) return 2;
      return 1;
    }
    var loadHigh = snow24 * 0.9 + snow48 * 0.25 + (today.wind > 30 ? (today.wind - 30) * 0.55 : 0);
    var dangerHigh = rate(loadHigh);                      /* above 2400 m */
    var dangerTree = Math.max(1, rate(loadHigh * 0.62));  /* 2000–2400 m */
    var dangerLow = Math.max(1, dangerTree - 1);          /* below 2000 m */

    /* problems, with weekly-stable persistent layer */
    var wk = mulberry(fnv('colnoir:wk:' + dstr(date).slice(0, 7) + ':' + Math.floor(date.getDate() / 7)));
    var problems = [];
    if (today.wind > 32 && snow24 > 6) {
      problems.push({
        kind: 'Wind slab', aspects: leeAspects(today.dirI), above: 2400,
        note: 'Fresh slabs on lee features below ridgelines; triggerable by a single rider where the new snow sits on old hard surfaces.'
      });
    }
    if (wk() < 0.4) {
      problems.push({
        kind: 'Persistent weak layer', aspects: ['N', 'NE', 'NW'], above: 2600,
        note: 'A buried faceted layer from the mid-season dry spell survives on shaded high slopes. Full-depth results remain possible.'
      });
    }
    if (temp.base > 1.5) {
      problems.push({
        kind: 'Wet loose', aspects: ['SE', 'S', 'SW'], above: 0,
        note: 'Afternoon warming destabilises sunlit surface snow. Timing matters more than terrain choice.'
      });
    }

    /* lifts */
    var lifts = LIFTS.map(function (L) {
      var windTop = Math.round(today.wind * (0.68 + 0.32 * (L.top - 1840) / 1420));
      var st, why = '';
      if (dangerHigh >= 5 && L.top > 2400) { st = 'closed'; why = 'Avalanche danger'; }
      else if (windTop > 62) { st = 'hold'; why = 'Wind ' + windTop + ' km/h at top'; }
      else if (snow24 > 26 && L.top > 2800) { st = 'delayed'; why = 'Avalanche control until 10:30'; }
      else { st = 'open'; why = '08:30 – 16:00'; }
      return { id: L.id, name: L.name, kind: L.kind, base: L.base, top: L.top, state: st, why: why, windTop: windTop };
    });
    var liftById = {};
    lifts.forEach(function (l) { liftById[l.id] = l; });

    /* sectors */
    var sectors = SECTORS.map(function (S) {
      var served = S.lifts.some(function (id) { return liftById[id].state === 'open' || liftById[id].state === 'delayed'; });
      var shut = (dangerHigh >= 4 && S.alt[1] > 2800) || (dangerHigh >= 5);
      var st = !served ? 'no-access' : (shut ? 'closed' : 'open');
      var loaded = problems.some(function (p) { return p.aspects.indexOf(S.aspect) !== -1 && S.alt[1] >= p.above; });
      return { id: S.id, name: S.name, aspect: S.aspect, alt: S.alt, steep: S.steep,
               character: S.character, lifts: S.lifts, state: st, loaded: loaded };
    });

    /* observation log — every line cites the model's own numbers */
    var obs = [];
    var r = mulberry(fnv('colnoir:obs:' + dstr(date)));
    function t(hh, mm) { return (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm; }
    obs.push({ t: t(5, 45 + Math.floor(r() * 14)), s: 'Patrol', m: 'Summit station reads ' + temp.summit + ' °C, wind ' + today.dir + ' ' + Math.round(today.wind * 1.0) + ' km/h. ' + (snow24 > 0 ? snow24 + ' cm new overnight at the plateau board.' : 'No new snow overnight.') });
    if (snow24 > 20) obs.push({ t: t(6, 30 + Math.floor(r() * 20)), s: 'Patrol', m: 'Control work scheduled on Face Nord and Couloir Est. Expect detonations between 07:30 and 09:00 — this is normal.' });
    if (today.wind > 50) obs.push({ t: t(7, 10 + Math.floor(r() * 30)), s: 'Lifts', m: 'Upper cables on wind watch; ' + lifts.filter(function (l) { return l.state === 'hold'; }).map(function (l) { return l.name; }).join(', ') + ' holding until gusts settle.' });
    if (problems.length) obs.push({ t: t(7, 40 + Math.floor(r() * 15)), s: 'Snow study', m: problems[0].kind + ' confirmed in the ' + problems[0].aspects.join('–') + ' sector' + (problems[0].above ? ' above ' + problems[0].above + ' m' : '') + '. Ratings hold.' });
    obs.push({ t: t(8, 5 + Math.floor(r() * 20)), s: 'Office', m: 'Bulletin issued. Valid to 17:00. ' + (dangerHigh >= 3 ? 'Read the full text before leaving marked terrain.' : 'A generous day — ride it with both eyes open.') });

    return {
      date: date, dateStr: dstr(date),
      issue: Math.floor((date - new Date(date.getFullYear(), 0, 1)) / 864e5) + 1,
      weather: today, snow24: snow24, snow48: snow48, snow72: snow72,
      depth: depth, temp: temp, freezing: freezing,
      danger: { high: dangerHigh, tree: dangerTree, low: dangerLow,
                max: Math.max(dangerHigh, dangerTree, dangerLow) },
      problems: problems, lifts: lifts, sectors: sectors, obs: obs
    };
  }

  var DANGER_WORDS = ['', 'Low', 'Moderate', 'Considerable', 'High', 'Very high'];

  window.CN = {
    build: build,
    today: function () { return build(new Date()); },
    forOffset: function (n) { return build(addDays(new Date(), n)); },
    DANGER_WORDS: DANGER_WORDS,
    COMPASS: COMPASS,
    fnv: fnv,
    mulberry: mulberry
  };
})();
