/* SEJUK catalogue — the single source of truth.
   Every price, total, shave time and count on the site is computed from
   this file. Change a number here and the whole site follows. */
(function () {
  "use strict";

  var CURRENCY = "S$";

  /* Sizes: every ice comes solo or berdua (built for two, one bowl). */
  var BERDUA_SURCHARGE = 6.0;

  /* Shave model, in seconds. The counter starts a chit BASE_PREP early,
     then each line adds its own time under the blade or at the pass. */
  var BASE_PREP_S = 180;
  var SHAVE_S = { solo: 90, berdua: 150, warm: 120, drink: 45, bottle: 0 };

  var ICES = [
    {
      id: "gunung-pandan",
      name: "Gunung Pandan",
      tag: "the signature peak",
      desc: "Pandan milk-snow shaved to powder over a molten gula melaka core, toasted coconut on the summit, one spoon of kaya custard down the slope.",
      price: 13.8,
      family: "heritage",
      flags: [],
      swatch: "#2f7d4c",
      meltMin: 15,
      best: true,
    },
    {
      id: "bandung-monsoon",
      name: "Bandung Monsoon",
      tag: "pink, properly",
      desc: "Rose bandung snow, basil-seed rain on the slopes, a stripe of sweet milk at the peak. Pink the way the void deck remembers it.",
      price: 12.8,
      family: "heritage",
      flags: [],
      swatch: "#c8203e",
      meltMin: 14,
    },
    {
      id: "malt-avalanche",
      name: "Malt Avalanche",
      tag: "poured at the counter",
      desc: "Dark malt snow, chocolate rubble, and a wide pour of condensed milk that happens in front of you. You say when.",
      price: 13.8,
      family: "kopi",
      flags: ["gluten"],
      swatch: "#4a2f23",
      meltMin: 16,
      best: true,
    },
    {
      id: "chendol-glacier",
      name: "Chendol Glacier",
      tag: "dairy-free",
      desc: "Coconut snow, pandan chendol cut fresh each morning, red beans cooked slow, gula melaka that actually came from Melaka.",
      price: 12.8,
      family: "heritage",
      flags: ["df", "vg"],
      swatch: "#57a06b",
      meltMin: 15,
    },
    {
      id: "soursop-squall",
      name: "Soursop Squall",
      tag: "the sharpest cold",
      desc: "Soursop crushed with calamansi and frozen into a coarse, sparkling granita. The sourest, coldest thing on the board.",
      price: 11.8,
      family: "fruit",
      flags: ["df", "vg"],
      swatch: "#7ba05b",
      meltMin: 11,
    },
    {
      id: "mango-sticky-peak",
      name: "Mango Sticky Peak",
      tag: "gone by evening",
      desc: "Coconut snow under a stack of ripe mango, toasted-rice crunch, salted coconut caramel running down two slopes.",
      price: 14.8,
      family: "fruit",
      flags: ["df"],
      swatch: "#e39a1d",
      meltMin: 14,
      seasonal: true,
    },
    {
      id: "kopi-tarik-summit",
      name: "Kopi Tarik Summit",
      tag: "breakfast, frozen",
      desc: "Kopi-o snow pulled with condensed milk, butter-sugar toast cubes stacked at the base. The morning routine, at −4°.",
      price: 12.8,
      family: "kopi",
      flags: ["gluten"],
      swatch: "#6b4326",
      meltMin: 15,
    },
    {
      id: "lychee-kacang",
      name: "Lychee Kacang",
      tag: "a polite remembering",
      desc: "Lychee snow over attap chee, dark grass jelly and pearl barley — ice kacang with its elbows off the table.",
      price: 12.8,
      family: "heritage",
      flags: ["df"],
      swatch: "#c04868",
      meltMin: 14,
    },
  ];

  var ADDONS = [
    { id: "extra-gula", name: "Extra gula pour", price: 1.5 },
    { id: "kaya-cloud", name: "Kaya custard cloud", price: 2.0 },
    { id: "coconut-crumble", name: "Toasted coconut crumble", price: 1.5 },
    { id: "mango-cubes", name: "Fresh mango", price: 3.0 },
    { id: "attap-chee", name: "Attap chee", price: 2.0 },
    { id: "condensed-pot", name: "Condensed milk, own pot", price: 1.0 },
  ];

  var WARM = [
    {
      id: "ondeh-mochi",
      name: "Ondeh Trio",
      desc: "Three warm pandan mochi rolled in fresh coconut. The gula melaka floods out; this is the point.",
      price: 6.8,
      flags: ["df", "vg"],
      swatch: "#2f7d4c",
    },
    {
      id: "gula-waffle",
      name: "Gula Butter Waffle",
      desc: "A crisp waffle strip under dark gula-butter glaze. Order it beside something cold and alternate.",
      price: 7.8,
      flags: ["gluten"],
      swatch: "#9a5b23",
    },
    {
      id: "tang-yuan",
      name: "Ginger Tang Yuan",
      desc: "Three rice balls in clear young-ginger soup. For the friend who claims to be cold.",
      price: 6.5,
      flags: ["df", "vg"],
      swatch: "#b98a4a",
    },
  ];

  var DRINKS = [
    { id: "kopi-peng", name: "Kopi Peng", desc: "Proper sock kopi over clear ice.", price: 4.8, flags: ["df"], swatch: "#6b4326" },
    { id: "pandan-brew", name: "Pandan Cold Brew", desc: "Green tea cold-brewed with pandan, unsweetened.", price: 5.5, flags: ["df", "vg"], swatch: "#2f7d4c" },
    { id: "jasmine-fizz", name: "Jasmine Calamansi Fizz", desc: "Jasmine tea, calamansi, soda, no syrup unless you ask.", price: 5.8, flags: ["df", "vg"], swatch: "#7ba05b" },
    { id: "young-coconut", name: "Whole Young Coconut", desc: "One coconut, one straw, one spoon.", price: 6.0, flags: ["df", "vg"], swatch: "#b98a4a" },
  ];

  var BOTTLES = [
    {
      id: "gula-syrup",
      name: "Gula Melaka Syrup",
      desc: "250 ml of the house pour — smoked palm sugar, nothing else. Keeps a month in the fridge.",
      price: 14.0,
      swatch: "#9a5b23",
    },
    {
      id: "pandan-syrup",
      name: "Pandan Syrup",
      desc: "250 ml, pressed leaf and cane sugar. Turns soda water into a better afternoon.",
      price: 12.0,
      swatch: "#2f7d4c",
    },
    {
      id: "bandung-syrup",
      name: "Bandung Rose Syrup",
      desc: "250 ml of the monsoon itself. Milk, ice, one inch of this.",
      price: 12.0,
      swatch: "#c8203e",
    },
  ];

  /* ---- helpers ---- */

  var ALL = ICES.concat(WARM, DRINKS, BOTTLES);

  function kindOf(id) {
    if (ICES.some(function (i) { return i.id === id; })) return "ice";
    if (WARM.some(function (i) { return i.id === id; })) return "warm";
    if (DRINKS.some(function (i) { return i.id === id; })) return "drink";
    if (BOTTLES.some(function (i) { return i.id === id; })) return "bottle";
    return null;
  }

  function byId(id) {
    for (var i = 0; i < ALL.length; i++) if (ALL[i].id === id) return ALL[i];
    return null;
  }

  function addonById(id) {
    for (var i = 0; i < ADDONS.length; i++) if (ADDONS[i].id === id) return ADDONS[i];
    return null;
  }

  /* Price of one line: {id, size, qty, addons:[]} */
  function linePrice(line) {
    var item = byId(line.id);
    if (!item) return 0;
    var unit = item.price;
    if (kindOf(line.id) === "ice" && line.size === "berdua") unit += BERDUA_SURCHARGE;
    (line.addons || []).forEach(function (aid) {
      var a = addonById(aid);
      if (a) unit += a.price;
    });
    return unit * (line.qty || 1);
  }

  /* Seconds of counter time one line adds. */
  function lineShaveS(line) {
    var kind = kindOf(line.id);
    if (!kind) return 0;
    var per = kind === "ice" ? SHAVE_S[line.size === "berdua" ? "berdua" : "solo"] : SHAVE_S[kind];
    return per * (line.qty || 1);
  }

  /* Ready-in minutes for a whole chit (array of lines). */
  function readyInMin(lines) {
    if (!lines.length) return 0;
    var s = BASE_PREP_S;
    lines.forEach(function (l) { s += lineShaveS(l); });
    return Math.ceil(s / 60);
  }

  function fmt(n) {
    return CURRENCY + n.toFixed(2);
  }

  window.SEJUK = window.SEJUK || {};
  window.SEJUK.cat = {
    CURRENCY: CURRENCY,
    BERDUA_SURCHARGE: BERDUA_SURCHARGE,
    ICES: ICES,
    ADDONS: ADDONS,
    WARM: WARM,
    DRINKS: DRINKS,
    BOTTLES: BOTTLES,
    byId: byId,
    kindOf: kindOf,
    addonById: addonById,
    linePrice: linePrice,
    lineShaveS: lineShaveS,
    readyInMin: readyInMin,
    fmt: fmt,
  };
})();
