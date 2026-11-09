/* HOLLIN: the one source of truth for every number on the site.
   The browser reads it as window.HOLLIN; tools/bake.mjs reads the same file and
   writes these values into every element marked data-bake="path.to.value" across
   the five pages (visible text and the sr-only / aria-live mirrors alike), and
   writes css/temps.css from PALETTE. Change a number here, run
   `node tools/bake.mjs`, and it changes everywhere. `node tools/bake.mjs --check`
   fails if any page has drifted. */
(function (g) {
  var H = {
    /* One round, in the order you walk it. temp in °C, min in minutes. */
    stage: {
      hot:   { name: 'Hot room',    temp: 90, low: 80, min: 12, places: 16 },
      rinse: { name: 'The rinse',   temp: 38, min: 1 },
      plunge:{ name: 'Cold plunge', temp: 4,  min: 2, first: 1, tubs: 2, perTub: 2, depth: 1.2 },
      rest:  { name: 'Rest room',   temp: 21, min: 10, loungers: 14 }
    },
    session: { rounds: 3, total: 90, arrive: 10, leave: 5, guests: 12, every: 30 },
    hours: {
      week: '06:30 to 22:30', weekend: '08:00 to 22:30', last: '21:00', first: '06:30'
    },
    /* Sample prices (S$). Marked as sample content wherever they are shown. */
    price: {
      offpeak: 48, peak: 58, early: 42, late: 52, ten: 440, month: 210, privateRoom: 360, privateGuests: 6
    },
    contact: { email: 'hello@example.com' }
  };

  /* The page temperature runs 90 → 38 → 4 over the ritual. Palette stops are
     keyed by °C; css/temps.css is generated from these, and js/temp.js
     interpolates between them at runtime with the same function. */
  H.PALETTE = [
    /* temp, ground, ground-2, ink, ink-dim, accent, line(alpha base), on-light(0|1) */
    { t: 90, ground: '#170703', ground2: '#241008', ink: '#FBE3C8', dim: '#D9A57C', accent: '#FF9A4A', field: '#FF6A1F', light: 0 },
    { t: 62, ground: '#140A07', ground2: '#21130D', ink: '#F6E2CF', dim: '#CFA98C', accent: '#F6B07A', field: '#C2562A', light: 0 },
    { t: 38, ground: '#0E0D0E', ground2: '#1A1819', ink: '#EEE8E2', dim: '#B6AEA8', accent: '#E6C9A8', field: '#7B6A64', light: 0 },
    { t: 21, ground: '#0A1016', ground2: '#141C24', ink: '#E7EEF3', dim: '#A7B5C1', accent: '#B9D2E6', field: '#3E5A72', light: 0 },
    { t: 12, ground: '#081521', ground2: '#10202E', ink: '#E6F1F8', dim: '#9FB6C8', accent: '#A9D3F2', field: '#3F7EAE', light: 0 },
    { t: 4,  ground: '#E4EEF4', ground2: '#D3E2EC', ink: '#06182A', dim: '#33506A', accent: '#0F5C9E', field: '#FFFFFF', light: 1 }
  ];

  /* Display type: Anybody's width and weight follow the heat. Hot type is
     expanded and heavy; cold type is condensed and light. */
  H.TYPE = { hot: { wdth: 150, wght: 860 }, mid: { wdth: 100, wght: 520 }, cold: { wdth: 56, wght: 230 } };

  /* H.at(T): the whole look of the page at T °C. Used at runtime by
     js/temp.js (every frame on the home page) and at build time by
     tools/bake.mjs (the static classes in css/temps.css), so the two can't
     disagree. Colours interpolate in sRGB between neighbouring stops, except
     the text colours across the dark→light flip (12 → 4 °C): those switch
     sides at the moment the ground's relative luminance passes 0.18, the
     point where light and dark ink have equal contrast, so text never passes
     through a grey that matches its ground. */
  function hex(c) { return [1, 3, 5].map(function (i) { return parseInt(c.slice(i, i + 2), 16); }); }
  function toHex(a) { return '#' + a.map(function (v) { v = Math.round(Math.max(0, Math.min(255, v))); return (v < 16 ? '0' : '') + v.toString(16); }).join('').toUpperCase(); }
  function mixc(a, b, k) { var x = hex(a), y = hex(b); return toHex(x.map(function (v, i) { return v + (y[i] - v) * k; })); }
  function lum(c) { return hex(c).map(function (v) { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }).reduce(function (s, v, i) { return s + v * [0.2126, 0.7152, 0.0722][i]; }, 0); }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function smooth01(v) { v = clamp01(v); return v * v * (3 - 2 * v); }
  function ratio(x, y) { var p = lum(x), q = lum(y); return (Math.max(p, q) + 0.05) / (Math.min(p, q) + 0.05); }
  H.lum = lum; H.ratio = ratio;
  H.at = function (T) {
    var P = H.PALETTE, i = 0;
    T = Math.max(P[P.length - 1].t, Math.min(P[0].t, T));
    while (i < P.length - 2 && T < P[i + 1].t) i++;
    var a = P[i], b = P[i + 1], k = (a.t - T) / (a.t - b.t);
    var out = { T: T };
    var cross = a.light !== b.light;
    /* Across the dark→light flip the ground moves on a steep curve, so it
       spends almost no scroll distance at mid luminance, where no text
       colour can reach 4.5:1. */
    var kg = cross ? smooth01((k - 0.42) / 0.16) : k;
    ['ground', 'ground2', 'field'].forEach(function (key) { out[key] = mixc(a[key], b[key], kg); });
    if (cross) {
      /* each text colour takes whichever side's value contrasts more with the
         ground under it right now; a secondary colour that would fall below
         4.5:1 takes that side's ink instead */
      var lightSide = b.light ? b : a, darkSide = b.light ? a : b;
      var useLight = lum(out.ground) > 0.18;
      var side = useLight ? lightSide : darkSide;
      out.light = side.light;
      out.ink = side.ink;
      ['dim', 'accent'].forEach(function (key) { out[key] = ratio(side[key], out.ground) >= 4.5 ? side[key] : side.ink; });
    } else {
      ['ink', 'dim', 'accent'].forEach(function (key) { out[key] = mixc(a[key], b[key], k); });
      out.light = a.light;
    }
    out.err = out.light ? '#A1221A' : '#FF9F8C';
    out.lightK = clamp01((lum(out.ground) - 0.04) / 0.6);
    var heat = clamp01((T - 38) / 52), cold = clamp01((38 - T) / 34), ty = H.TYPE;
    out.heat = heat; out.cold = cold;
    out.wdth = T >= 38 ? ty.mid.wdth + (ty.hot.wdth - ty.mid.wdth) * heat : ty.mid.wdth + (ty.cold.wdth - ty.mid.wdth) * cold;
    out.wght = T >= 38 ? ty.mid.wght + (ty.hot.wght - ty.mid.wght) * heat : ty.mid.wght + (ty.cold.wght - ty.mid.wght) * cold;
    return out;
  };

  g.HOLLIN = H;
})(typeof window !== 'undefined' ? window : globalThis);
