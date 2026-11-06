/* Hujan Panas: the weather model. One file, used by the page and by tools/bake.mjs.
   Reads NEA real-time readings when it can; otherwise falls back to a typical Singapore
   afternoon for the month and hour, and says so. No network is needed for the page to be right. */
(function (root) {
  'use strict';

  /* the shop (invented): used only to pick the nearest NEA stations */
  var SHOP = { lat: 1.3121, lon: 103.9035 };

  /* warmth: -1 = only good cold, +1 = only good hot. base: how well it sells on an average day (0-1). */
  var MENU = [
    { id: 'tangyuan', name: 'Tang yuan in ginger syrup', zh: '汤圆', price: 3.80, warmth: 1.0, base: 0.62, temp: 'hot',
      desc: 'Plain and pandan glutinous rice balls in old-ginger syrup boiled for three hours, crushed peanuts on top.', img: 'tangyuan' },
    { id: 'pulut', name: 'Pulut hitam', zh: '', price: 3.60, warmth: 0.9, base: 0.58, temp: 'hot',
      desc: 'Black glutinous rice cooked down with pandan, a spoon of salted coconut milk on top.', img: 'pulut' },
    { id: 'tausuan', name: 'Tau suan', zh: '豆糊', sw: '#8a6420', price: 3.20, warmth: 0.85, base: 0.55, temp: 'hot',
      desc: 'Split mung beans thickened with sweet potato starch, with cut you char kway on the side.', img: '' },
    { id: 'redbean', name: 'Red bean soup', zh: '红豆汤', sw: '#6e2a22', price: 3.20, warmth: 0.75, base: 0.52, temp: 'hot',
      desc: 'Red beans and dried tangerine peel, cooked until a third of the beans have given up.', img: '' },
    { id: 'orhnee', name: 'Orh nee', zh: '芋泥', sw: '#6a5582', price: 4.80, warmth: 0.6, base: 0.5, temp: 'hot',
      desc: 'Yam paste, ginkgo nuts and pumpkin. Served warm. Heavier than it looks.', img: '' },
    { id: 'greenbean', name: 'Green bean soup, coconut milk', zh: '绿豆汤', price: 3.20, warmth: 0.25, base: 0.5, temp: 'warm or cold',
      desc: 'Whole mung beans and a pour of coconut milk. Warm at night, cold after lunch.', img: 'greenbean' },
    { id: 'bubur', name: 'Bubur cha cha', zh: '', sw: '#8a6436', price: 3.60, warmth: 0.1, base: 0.54, temp: 'warm or cold',
      desc: 'Sweet potato, yam and sago in coconut milk. The one people order for their mother.', img: '' },
    { id: 'chengtng', name: 'Cheng tng, iced', zh: '清汤', price: 3.80, warmth: -0.8, base: 0.56, temp: 'cold',
      desc: 'Longan, red dates, white fungus, lotus seeds and barley in a light syrup, over ice.', img: 'chengtng' },
    { id: 'tauhuay', name: 'Tau huay, chilled', zh: '豆花', price: 2.80, warmth: -0.9, base: 0.6, temp: 'cold',
      desc: 'Silken beancurd set this morning, with barley and a thin rock-sugar syrup.', img: 'tauhuay' },
    { id: 'ondeh', name: 'Ondeh-ondeh, six', zh: '', price: 3.00, warmth: -0.2, base: 0.5, temp: 'room',
      desc: 'Pandan dough round a pocket of palm sugar, rolled in fresh grated coconut.', img: 'ondeh' },
    { id: 'akk', name: 'Ang ku kueh', zh: '红龟粿', price: 1.40, warmth: 0.0, base: 0.46, temp: 'room',
      desc: 'Red tortoise kueh with peanut or mung bean filling, pressed in the old wooden mould.', img: 'akk' },
    { id: 'lapis', name: 'Kueh lapis, per slice', zh: '', price: 1.60, warmth: -0.1, base: 0.44, temp: 'room',
      desc: 'Nine steamed layers. Peel them one at a time; nobody is watching.', img: 'kueh-plate' }
  ];

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  /* Singapore climatology, rounded from long-run NEA monthly normals:
     mean daily temperature per month, and how often an afternoon brings rain (0-1). */
  var MEAN_T = [26.5, 27.1, 27.6, 28.0, 28.3, 28.3, 27.9, 27.9, 27.7, 27.6, 26.9, 26.5];
  var WET = [0.55, 0.35, 0.45, 0.55, 0.5, 0.4, 0.4, 0.45, 0.45, 0.55, 0.8, 0.75];

  /* a typical reading for this month and hour in Singapore (UTC+8), no network */
  function typical(date) {
    var d = date || new Date();
    var sg = new Date(d.getTime() + (d.getTimezoneOffset() + 480) * 60000);
    var m = sg.getMonth(), h = sg.getHours() + sg.getMinutes() / 60;
    var t = MEAN_T[m] + 3.1 * Math.cos((h - 14.5) / 24 * 2 * Math.PI);
    var p = WET[m] * (h >= 13 && h < 20 ? 1.25 : h >= 20 || h < 6 ? 0.6 : 0.85);
    /* the same three steps as the Dry / Drizzle / Downpour switch on the board */
    var rain = p >= 1.05 ? 2.4 : p >= 0.5 ? 0.6 : 0;
    return { temp: Math.round(t * 10) / 10, rain: rain, station: '', source: 'typical', month: m, hour: Math.floor(h), when: sg };
  }

  /* how strongly the day pushes toward the cold end: 0 = all warm soups, 1 = all ice */
  function coolness(temp, rain) {
    var heat = clamp((temp - 25) / 8, 0, 1);
    var wet = clamp(rain / 1.5, 0, 1);
    return clamp(heat * (1 - 0.85 * wet), 0, 1);
  }

  function state(temp, rain) {
    if (rain >= 0.2 && temp >= 29.5) return 'hujan-panas';
    if (rain >= 0.2) return 'hujan';
    if (temp >= 30.5) return 'panas';
    return 'redup';
  }

  var WORDS = {
    'panas': { word: 'Panas', gloss: 'hot', line: 'The cold end of the pot is winning.' },
    'hujan': { word: 'Hujan', gloss: 'rain', line: 'Ginger-soup weather. The warm end moves up.' },
    'hujan-panas': { word: 'Hujan panas', gloss: 'rain on a hot day', line: 'Rain on a hot afternoon. The board splits the difference.' },
    'redup': { word: 'Redup', gloss: 'grey, between showers', line: 'Grey, and between showers. A warm bowl and a cold one both make sense.' }
  };

  function rank(temp, rain) {
    var c = coolness(temp, rain);
    return MENU.map(function (it) {
      return { item: it, score: it.base + it.warmth * (0.5 - c) * 1.6 };
    }).sort(function (a, b) { return b.score - a.score || (a.item.id < b.item.id ? -1 : 1); });
  }

  /* a usual day: the board sorted by how each dish sells on average, weather ignored */
  var USUAL = MENU.slice().sort(function (a, b) { return b.base - a.base || (a.id < b.id ? -1 : 1); }).map(function (it) { return it.id; });
  function moves(ranked) {
    var out = {};
    ranked.forEach(function (r, i) { out[r.item.id] = USUAL.indexOf(r.item.id) - i; });
    return out;
  }
  function moveText(n) { return n > 0 ? '\u25b2 ' + n : n < 0 ? '\u25bc ' + (-n) : '\u2013'; }
  function moveSr(n) { return n > 0 ? 'up ' + n + (n === 1 ? ' place' : ' places') + ' on a usual day' : n < 0 ? 'down ' + (-n) + (n === -1 ? ' place' : ' places') + ' on a usual day' : 'where it sits on a usual day'; }

  /* NEA real-time readings via data.gov.sg (no key; CORS open). Resolves null on any failure. */
  function km(a, b) {
    var r = Math.PI / 180, x = (b.longitude - a.lon) * r * Math.cos((a.lat + b.latitude) / 2 * r), y = (b.latitude - a.lat) * r;
    return Math.sqrt(x * x + y * y) * 6371;
  }
  function nearest(json) {
    var d = json && json.data; if (!d || !d.readings || !d.readings[0]) return null;
    var vals = {}; d.readings[0].data.forEach(function (r) { vals[r.stationId] = r.value; });
    var best = null;
    d.stations.forEach(function (s) {
      if (!(s.id in vals) || !s.location) return;
      var k = km(SHOP, s.location);
      if (!best || k < best.k) best = { k: k, name: s.name, value: vals[s.id] };
    });
    if (best) best.time = d.readings[0].timestamp;
    return best;
  }
  function live(timeoutMs) {
    if (!root.fetch) return Promise.resolve(null);
    var ctl = root.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, timeoutMs || 4000);
    var opt = ctl ? { signal: ctl.signal, cache: 'no-store' } : { cache: 'no-store' };
    var base = 'https://api-open.data.gov.sg/v2/real-time/api/';
    function get(p) { return fetch(base + p, opt).then(function (r) { if (!r.ok) throw 0; return r.json(); }); }
    return Promise.all([get('air-temperature'), get('rainfall')]).then(function (j) {
      clearTimeout(timer);
      var t = nearest(j[0]), r = nearest(j[1]);
      if (!t || typeof t.value !== 'number') return null;
      return { temp: t.value, rain: r && typeof r.value === 'number' ? r.value : 0, station: t.name, rainStation: r ? r.name : '',
        source: 'live', time: t.time };
    }).catch(function () { clearTimeout(timer); return null; });
  }

  root.HP = { SHOP: SHOP, MENU: MENU, USUAL: USUAL, moves: moves, moveText: moveText, moveSr: moveSr, typical: typical, coolness: coolness, state: state, WORDS: WORDS, rank: rank, live: live, clamp: clamp };
})(typeof window !== 'undefined' ? window : globalThis);
