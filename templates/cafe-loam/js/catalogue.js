/* LOAM — the catalogue. Every price, count and opening time the site
   quotes is read from here, never typed into copy. */
(function () {
  "use strict";

  // Swap this one string to re-currency the whole site.
  var CURRENCY = "£";

  var GROUPS = [
    { key: "coffee", name: "Coffee", note: "Pulled on the house blend unless you ask otherwise." },
    { key: "other", name: "Not coffee", note: "Whisked, steeped and stirred to order." },
    { key: "counter", name: "The counter", note: "Baked here each morning. When they're gone, they're gone." },
    { key: "plates", name: "Plates", note: "From the kitchen, all day until three." }
  ];

  var ITEMS = [
    // --- coffee ---
    { id: "espresso", group: "coffee", name: "Espresso", note: "Two ounces, no ceremony.", price: 2.60,
      img: "espresso", alt: "A short espresso in a cream stoneware cup, thick hazel crema.",
      milk: false, strength: 3, temp: "hot" },
    { id: "cortado", group: "coffee", name: "Cortado", note: "Cut with just enough milk to soften it.", price: 3.20,
      img: "cortado", alt: "A cortado in a small glass, dark espresso below a band of steamed milk.",
      milk: true, strength: 2, temp: "hot" },
    { id: "flat-white", group: "coffee", name: "Flat white", note: "Silky, and poured with a leaf if the hand is steady.", price: 3.60,
      img: "flat-white", alt: "A flat white in a wide cream cup with a white rosetta poured into the foam.",
      milk: true, strength: 2, temp: "hot" },
    { id: "filter", group: "coffee", name: "Filter", note: "Today's single origin, brewed by the batch.", price: 3.20,
      img: "filter", alt: "Black filter coffee in a tall cream stoneware mug.",
      milk: false, strength: 1, temp: "hot" },
    { id: "cold-brew", group: "coffee", name: "Cold brew", note: "Steeped sixteen hours, poured over ice.", price: 3.80,
      img: "cold-brew", alt: "Cold brew coffee over large ice cubes in a tall glass.",
      milk: false, strength: 2, temp: "cold" },
    { id: "espresso-tonic", group: "coffee", name: "Espresso tonic", note: "Tonic, ice, a shot floated on top, orange peel.", price: 4.20,
      img: "espresso-tonic", alt: "An espresso tonic: bubbling tonic with a dark espresso layer and orange peel.",
      milk: false, strength: 2, temp: "cold" },

    // --- not coffee ---
    { id: "matcha", group: "other", name: "Matcha", note: "Whisked thick, steamed milk poured through.", price: 4.20,
      img: "matcha", alt: "A matcha latte in a cream cup, jade green with a swirl of milk.",
      milk: true, strength: 1, temp: "hot" },
    { id: "chai", group: "other", name: "Masala chai", note: "Steeped with the whole spice, not a syrup.", price: 3.80,
      img: "chai", alt: "A masala chai in a cream cup, tan spiced milk tea dusted with cinnamon.",
      milk: true, strength: 1, temp: "hot" },
    { id: "cocoa", group: "other", name: "Drinking chocolate", note: "Dark, thick, faintly bitter.", price: 3.60,
      img: "cocoa", alt: "Thick drinking chocolate in a cream cup with a dusting of cocoa.",
      milk: true, strength: 1, temp: "hot" },

    // --- counter ---
    { id: "croissant", group: "counter", name: "Butter croissant", note: "Laminated Tuesday, baked this morning.", price: 3.20,
      img: "croissant", alt: "A golden butter croissant with crisp flaking layers on a cream plate.",
      milk: null, strength: null, temp: null },
    { id: "cardamom-bun", group: "counter", name: "Cardamom bun", note: "Knotted by hand, heavy on the cardamom.", price: 3.80,
      img: "cardamom-bun", alt: "A knotted cardamom bun glossy with pearl sugar on a cream plate.",
      milk: null, strength: null, temp: null },
    { id: "banana-bread", group: "counter", name: "Banana bread", note: "Cut thick. Warmed if you want it.", price: 3.40,
      img: "banana-bread", alt: "A thick slice of banana bread with a craggy top on a cream plate.",
      milk: null, strength: null, temp: null },
    { id: "cookie", group: "counter", name: "Rye cookie", note: "Dark chocolate, sea salt, a soft middle.", price: 2.80,
      img: "cookie", alt: "A large rye chocolate chunk cookie with molten chocolate pools.",
      milk: null, strength: null, temp: null },

    // --- plates (kitchen hours) ---
    { id: "avocado-toast", group: "plates", name: "Avocado on sourdough", note: "Chilli, lemon, a soft egg on top.", price: 9.50,
      img: "avocado-toast", alt: "Sourdough toast with smashed avocado, chilli flakes and a halved soft-boiled egg.",
      kitchen: true },
    { id: "granola", group: "plates", name: "Granola bowl", note: "Toasted oats, thick yoghurt, whatever fruit is good.", price: 7.50,
      img: "granola", alt: "A granola bowl with yoghurt, oat clusters, blackberries and raspberries.",
      kitchen: true },
    { id: "toastie", group: "plates", name: "Cheese toastie", note: "Three cheeses, grilled hard on the press.", price: 8.50,
      img: "toastie", alt: "A cheese toastie on grilled sourdough, cut and stacked, cheese pulling at the edge.",
      kitchen: true }
  ];

  // Retail bags, sold at the counter and online.
  var BEANS = [
    { id: "morning-bell", name: "Morning Bell", kind: "House espresso blend",
      origin: "Brazil · Colombia", notes: ["milk chocolate", "hazelnut", "red apple"],
      roast: 3, price: 11.00, size: "250g",
      blurb: "What the machine runs on all day. Forgiving with milk, sweet on its own." },
    { id: "long-shadow", name: "Long Shadow", kind: "Single origin",
      origin: "Colombia · washed", notes: ["blackcurrant", "cocoa nib", "orange"],
      roast: 2, price: 13.50, size: "250g",
      blurb: "Our filter most weeks. Bright enough to wake up a grey morning." },
    { id: "understorey", name: "Understorey", kind: "Single origin",
      origin: "Ethiopia · natural", notes: ["peach", "jasmine", "honey"],
      roast: 1, price: 14.50, size: "250g",
      blurb: "Floral and loud. Brew it gently and it will do the rest." },
    { id: "nightshift", name: "Nightshift", kind: "Decaf",
      origin: "Colombia · sugarcane", notes: ["dark chocolate", "fig", "almond"],
      roast: 4, price: 12.50, size: "250g",
      blurb: "Decaf that nobody has to apologise for. Good after four o'clock." }
  ];

  // Opening hours, 24h. day 0 = Sunday.
  var HOURS = [
    { day: 0, open: 8.0, close: 16.0, kitchen: [9.0, 15.0] },
    { day: 1, open: 7.0, close: 17.0, kitchen: [8.0, 15.0] },
    { day: 2, open: 7.0, close: 17.0, kitchen: [8.0, 15.0] },
    { day: 3, open: 7.0, close: 17.0, kitchen: [8.0, 15.0] },
    { day: 4, open: 7.0, close: 17.0, kitchen: [8.0, 15.0] },
    { day: 5, open: 7.0, close: 17.0, kitchen: [8.0, 15.0] },
    { day: 6, open: 8.0, close: 16.0, kitchen: [9.0, 15.0] }
  ];

  var HOUSE = {
    // Pickup estimate: a base wait plus a little per item on the ticket.
    pickupBase: 4,
    pickupPerItem: 1,
    pickupMax: 25,
    maxPerLine: 9,
    seats: 24
  };

  function money(n) {
    return CURRENCY + n.toFixed(2);
  }

  function byId(id) {
    for (var i = 0; i < ITEMS.length; i++) if (ITEMS[i].id === id) return ITEMS[i];
    for (var j = 0; j < BEANS.length; j++) if (BEANS[j].id === id) return BEANS[j];
    return null;
  }

  function inGroup(key) {
    var out = [];
    for (var i = 0; i < ITEMS.length; i++) if (ITEMS[i].group === key) out.push(ITEMS[i]);
    return out;
  }

  window.LOAM = {
    CURRENCY: CURRENCY,
    GROUPS: GROUPS,
    ITEMS: ITEMS,
    BEANS: BEANS,
    HOURS: HOURS,
    HOUSE: HOUSE,
    money: money,
    byId: byId,
    inGroup: inGroup
  };
})();
