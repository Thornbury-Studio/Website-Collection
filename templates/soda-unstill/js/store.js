/* UNSTILL — catalogue and basket.

   One rule: any number a visitor sees is derived here, never typed into a
   page. Prices, pack maths, subscription savings, nutrition per can — all of
   it comes out of this catalogue, so the marketing copy and the checkout
   cannot drift apart. */
(function (root) {
  'use strict';

  var site = {
    name: 'UNSTILL',
    strap: 'Sparkling botanical soda',
    email: 'hello@drinkunstill.co',
    phone: '+44 20 7946 0brew'.replace('brew', '112'),
    address: ['Unit 9, Ferment Yard', 'Hackney Wick', 'London E9 5EN'],
    founded: 2023,
    canMl: 330
  };

  /* The range. Colour tokens live in CSS; hue rotations for the two video
     clips live here beside the flavour they belong to, so a new flavour is
     one entry, not a scavenger hunt. Nutrition is per 100 ml. */
  var flavors = [
    {
      id: 'citrus',
      name: 'Citrus Riot',
      strap: 'Yuzu + ginger',
      tagline: 'A fist-fight between two citruses. Both win.',
      story: 'Yuzu juice from a single grower in Kochi, cold-pressed ginger, and nothing to ' +
        'round the edges off. It is sharp on purpose. The ginger arrives about two seconds ' +
        'after the yuzu and stays longer.',
      ingredients: ['Carbonated spring water', 'Yuzu juice (8%)', 'Cold-pressed ginger (4%)',
        'Raw cane sugar', 'Citric acid', 'Nothing else'],
      per100: { kcal: 19, sugar: 4.4, carbs: 4.6, salt: 0.01 },
      pairing: 'Fried chicken, karaage especially. Anything you would put lemon on.',
      chaos: 4
    },
    {
      id: 'burn',
      name: 'Slow Burn',
      strap: 'Blood orange + bird’s eye chilli',
      tagline: 'Starts as a soft drink. Finishes as a dare.',
      story: 'Sicilian blood orange up front, and a bird’s eye chilli infusion that does ' +
        'not show up until you have already committed. The heat builds across the can, which ' +
        'is why the stripe on the livery is doubled. We warned you in the design.',
      ingredients: ['Carbonated spring water', 'Blood orange juice (10%)', 'Raw cane sugar',
        'Bird’s eye chilli infusion', 'Citric acid', 'Nothing else'],
      per100: { kcal: 22, sugar: 5.1, carbs: 5.3, salt: 0.01 },
      pairing: 'Tacos, barbecue, dark chocolate. Milk on standby.',
      chaos: 5
    },
    {
      id: 'mood',
      name: 'Mood Ring',
      strap: 'Butterfly pea + lime',
      tagline: 'The only soda on earth that changes colour when you pour it.',
      story: 'Butterfly pea flower steeps a deep indigo. Then the lime hits and the ' +
        'anthocyanins flip — indigo to violet to hot pink, live, in your glass. This is not ' +
        'an effect. It is pH chemistry you can drink, and the Fizzics Lab will show you ' +
        'exactly how it works.',
      ingredients: ['Carbonated spring water', 'Butterfly pea flower infusion', 'Lime juice (6%)',
        'Raw cane sugar', 'Nothing else'],
      per100: { kcal: 17, sugar: 3.9, carbs: 4.1, salt: 0.01 },
      pairing: 'Serve it in glass, always, or you will miss the whole point.',
      chaos: 3
    },
    {
      id: 'snap',
      name: 'Cold Snap',
      strap: 'Cucumber + Sichuan pepper',
      tagline: 'Cools you down, then makes your lips buzz about it.',
      story: 'Cucumber pressed the same morning it arrives, and a Sichuan peppercorn tincture ' +
        'that does the famous trick — a cold electric tingle where the fizz should be. ' +
        'Carbonation squared.',
      ingredients: ['Carbonated spring water', 'Cucumber juice (9%)', 'Raw cane sugar',
        'Sichuan peppercorn tincture', 'Malic acid', 'Nothing else'],
      per100: { kcal: 16, sugar: 3.6, carbs: 3.8, salt: 0.01 },
      pairing: 'Gyoza, sashimi, a very hot day.',
      chaos: 4
    }
  ];

  /* Pricing. Everything downstream is computed from these four numbers. */
  var pricing = {
    can: 280,            /* single can, pence */
    crateSize: 12,
    crateDiscount: 0.11, /* filling a full crate takes this off the can price */
    subDiscount: 0.15    /* subscription takes this off the crate price */
  };

  function cratePrice() {
    return Math.round(pricing.can * pricing.crateSize * (1 - pricing.crateDiscount));
  }
  function subCratePrice() {
    return Math.round(cratePrice() * (1 - pricing.subDiscount));
  }

  var stockists = [
    { city: 'London', shops: ['Forza Wine, Peckham', 'General Store, Peckham',
      'Climpson & Sons, Broadway Market', 'Panzer’s, St John’s Wood',
      'The Grocery, Shoreditch', 'Bottle Apostle, Victoria Park'] },
    { city: 'Bristol', shops: ['Better Food, Whiteladies Road', 'Hugo’s Greengrocer, Bishopston'] },
    { city: 'Manchester', shops: ['Isca, Ancoats', 'Village Greens Co-op, Prestwich'] },
    { city: 'Leeds', shops: ['Ricci’s Place, Kirkgate Market'] },
    { city: 'Brighton', shops: ['Infinity Foods, North Laine', 'Bison Beer, East Street'] },
    { city: 'Glasgow', shops: ['Roots & Fruits, Great Western Road'] },
    { city: 'Edinburgh', shops: ['Real Foods, Broughton Street', 'Margiotta, Stockbridge'] }
  ];

  function money(pence) {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency', currency: 'GBP',
      minimumFractionDigits: pence % 100 === 0 ? 0 : 2
    }).format(pence / 100);
  }

  function flavor(id) {
    for (var i = 0; i < flavors.length; i++) {
      if (flavors[i].id === id) return flavors[i];
    }
    return null;
  }

  /* Per-can nutrition derives from per-100ml — one source of truth. */
  function perCan(f) {
    var k = site.canMl / 100;
    return {
      kcal: Math.round(f.per100.kcal * k),
      sugar: Math.round(f.per100.sugar * k * 10) / 10,
      carbs: Math.round(f.per100.carbs * k * 10) / 10,
      salt: Math.round(f.per100.salt * k * 100) / 100
    };
  }

  /* ---- basket ------------------------------------------------------------ */

  var KEY = 'unstill.basket.v1';

  function read() {
    try {
      var v = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(v) ? v : [];
    } catch (e) { return []; }
  }
  function write(lines) {
    try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch (e) { /* private mode */ }
    root.dispatchEvent(new CustomEvent('unstill:basket', { detail: { lines: lines } }));
  }

  var basket = {
    lines: read,
    count: function () {
      return read().reduce(function (n, l) { return n + l.qty; }, 0);
    },
    /* A crate line carries its mix: {citrus:3, burn:3, mood:3, snap:3}. */
    addCrate: function (mix, subscribe) {
      var total = 0, k;
      for (k in mix) { if (Object.prototype.hasOwnProperty.call(mix, k)) total += mix[k]; }
      if (total !== pricing.crateSize) return false;
      var lines = read();
      lines.push({
        sku: 'crate-' + Date.now(),
        kind: subscribe ? 'sub' : 'crate',
        mix: mix,
        unit: subscribe ? subCratePrice() : cratePrice(),
        qty: 1
      });
      write(lines);
      return true;
    },
    setQty: function (sku, qty) {
      write(read().map(function (l) {
        if (l.sku === sku) l.qty = Math.max(0, qty);
        return l;
      }).filter(function (l) { return l.qty > 0; }));
    },
    remove: function (sku) {
      write(read().filter(function (l) { return l.sku !== sku; }));
    },
    clear: function () { write([]); },
    totals: function () {
      var lines = read();
      var gross = 0, saved = 0;
      lines.forEach(function (l) {
        gross += l.unit * l.qty;
        /* what the same cans would have cost singly */
        saved += (pricing.can * pricing.crateSize - l.unit) * l.qty;
      });
      return { lines: lines, gross: gross, savedVsSingles: saved, total: gross };
    }
  };

  /* ---- flavour switching ------------------------------------------------- */

  function setFlavor(id) {
    if (!flavor(id)) return;
    document.documentElement.setAttribute('data-flavor', id);
    try { localStorage.setItem('unstill.flavor', id); } catch (e) { /* private mode */ }
    root.dispatchEvent(new CustomEvent('unstill:flavor', { detail: { id: id } }));
  }
  function getFlavor() {
    return document.documentElement.getAttribute('data-flavor') || 'citrus';
  }

  root.UNSTILL = {
    site: site,
    flavors: flavors,
    flavor: flavor,
    perCan: perCan,
    pricing: pricing,
    cratePrice: cratePrice,
    subCratePrice: subCratePrice,
    stockists: stockists,
    basket: basket,
    money: money,
    setFlavor: setFlavor,
    getFlavor: getFlavor
  };
})(window);
