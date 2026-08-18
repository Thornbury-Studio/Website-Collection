/* Common Ground Café — dine-in catalogue.
   Fictional concept menu for this preview: original dish names, descriptions
   and prices, not transcribed from any real business. Prices in SGD; every
   price is subject to 10% service charge + prevailing GST, which the UI
   states once per card. `amk` / `tp` hold that outlet's price, or null when
   the item is not on that outlet's menu. */
(function () {
  "use strict";

  var DATA = {
    outlets: {
      amk: {
        name: "Ang Mo Kio",
        full: "Common Ground Café — Ang Mo Kio",
        campus: "Our first kitchen",
        address: "Blk 712 Ang Mo Kio Ave 6, Singapore 560712",
        maps: "https://www.google.com/maps/search/?api=1&query=Common%20Ground%20Cafe%2C%20Blk%20712%20Ang%20Mo%20Kio%20Ave%206%2C%20Singapore%20560712"
      },
      tp: {
        name: "Tampines",
        full: "Common Ground Café — Tampines",
        campus: "Our newest kitchen",
        address: "Blk 201 Tampines St 23, Singapore 521201",
        maps: "https://www.google.com/maps/search/?api=1&query=Common%20Ground%20Cafe%2C%20Blk%20201%20Tampines%20St%2023%2C%20Singapore%20521201"
      }
    },

    /* Contact is email, not a live phone/WhatsApp deep link — this is a
       concept preview, not a wired-up ordering line for a real business. */
    contactEmail: "hello@commongroundcafe.sg",

    hours: {
      line: "Mon–Sat & public holidays, 9:00am–9:00pm",
      lastOrder: "8:20pm",
      closed: "Closed on Sundays",
      open: 9 * 60,
      close: 21 * 60,
      lastOrderMin: 20 * 60 + 20
    },

    sections: [
      {
        id: "soups-salads",
        dept: "From the Garden",
        label: "Soups & Salads",
        note: "Add-ons for any salad: chicken +$3 · salmon +$6 · striploin +$8.",
        items: [
          { n: "Cream of Mushroom", d: "Served with a hot herb bun.", amk: 7, tp: 7, tags: ["chef"] },
          { n: "Classic Caesar Salad", amk: 8, tp: 8 },
          { n: "Roast Pumpkin & Feta Salad", amk: 9, tp: 9, tags: ["veg", "new"] }
        ]
      },
      {
        id: "breakfast",
        dept: "Morning Kitchen",
        label: "Breakfast",
        note: "Served 9:00–11:00am. Egg choices: sunny side up, over easy or scrambled.",
        items: [
          { n: "Bangers & Eggs", d: "Grilled mushrooms, tomatoes, toast and a side salad.", amk: 15, tp: 15, tags: ["chef"] },
          { n: "Striploin Steak & Eggs", d: "Grilled mushrooms, tomatoes, toast and a side salad.", amk: 21, tp: 21 },
          { n: "French Toast with Maple Syrup", d: "With a side salad.", amk: 9, tp: 9, tags: ["new"] }
        ]
      },
      {
        id: "mains",
        dept: "The Mains",
        label: "Mains",
        note: "Tampines runs a Fri–Sat seafood platter for two — ask the team.",
        items: [
          { n: "Braised Beef Cheeks", d: "With roasted potatoes and seasonal vegetables.", amk: 24, tp: 24, tags: ["chef"] },
          { n: "Pan Grilled Striploin Steak", d: "With wedges and a side salad.", amk: 21, tp: 21 },
          { n: "Grilled Chicken with Mushroom Sauce", amk: 15, tp: 15, tags: ["chef"] },
          { n: "Beef Burger", d: "With house fries.", amk: 15, tp: 15 },
          { n: "Plant-Based Burger", amk: 15, tp: 15, tags: ["veg", "new"] },
          { n: "Bangers & Mash", amk: 13, tp: 13 },
          { n: "Battered Fish & Chips", d: "Old-school crispy batter, fries and a dressed side salad.", amk: 16, tp: 16, tags: ["chef"] },
          { n: "Pan Seared Salmon", d: "With sweet potato mash.", amk: 20, tp: 20 },
          { n: "Fri–Sat Seafood Platter (2 pax)", d: "Dinner only.", amk: null, tp: 68 }
        ]
      },
      {
        id: "pasta",
        dept: "Pasta Bar",
        label: "Pasta",
        note: "Add-ons: chicken +$3 · salmon +$6 · striploin +$8.",
        items: [
          { n: "Spaghetti Vongole", amk: 16, tp: 16, tags: ["chef"] },
          { n: "Chicken Carbonara", amk: 15, tp: 15 },
          { n: "Spaghetti Bolognaise (Beef or Chicken)", amk: 14, tp: 14 },
          { n: "Vegetarian Spaghetti", d: "Tossed with cherry tomatoes, basil and a generous helping of vegetables.", amk: 12, tp: 12, tags: ["veg"] }
        ]
      },
      {
        id: "sides",
        dept: "Extras",
        label: "Sides",
        items: [
          { n: "House Snacks", d: "Wings, nuggets and fries to share.", amk: 15, tp: 15 },
          { n: "Chicken Winglets (5 pcs)", amk: 9, tp: 9 },
          { n: "Truffle Fries", amk: 7, tp: 7 },
          { n: "French Fries", amk: 6, tp: 6 },
          { n: "Potato Wedges", amk: 6, tp: 6 }
        ]
      },
      {
        id: "kids",
        dept: "Little Ones",
        label: "Kids' Menu",
        note: "For the little ones.",
        items: [
          { n: "Kid's Spaghetti Bolognaise", amk: 9, tp: 9 },
          { n: "Kid's Battered Fish & Chips", amk: 9, tp: 9 }
        ]
      },
      {
        id: "desserts",
        dept: "Something Sweet",
        label: "Desserts",
        note: "Gelato flavours: Hokkaido milk, dark chocolate, strawberry and passionfruit sorbet.",
        items: [
          { n: "Waffles with Double Scoop Gelato", amk: 10, tp: 10, tags: ["chef"] },
          { n: "Waffles with Maple Syrup", amk: 6, tp: 6 },
          { n: "Artisanal Gelato (Single / Double)", amk: 4.5, amk2: 7.5, tp: 4.5, tp2: 7.5, priceNote: "single / double" },
          { n: "Chocolate Brownie", d: "À la mode +$2.50.", amk: 5, tp: 5 }
        ]
      },
      {
        id: "drinks",
        dept: "The Drinks Counter",
        label: "Drinks",
        variant: true,
        note: "Ang Mo Kio pours tall and grande sizes; Tampines lists hot and iced. Nutri-Grade marks are based on preparation at 120% sugar, before ice.",
        items: [
          { n: "Americano", nutri: "A", sugar: "0%", v1: 3, v2: 4, amk: 3, tp: 3 },
          { n: "Cappuccino", nutri: "C", sugar: "0%", v1: 3.5, v2: 4.5, amk: 3.5, tp: 3.5 },
          { n: "Caffè Latte", nutri: "C", sugar: "0%", v1: 3.5, v2: 4.5, amk: 3.5, tp: 3.5 },
          { n: "Flat White", nutri: "C", sugar: "0%", v1: 4, v2: 5, amk: 4, tp: 4 },
          { n: "Tea — English Breakfast / Earl Grey / Chamomile", nutri: "A", sugar: "0%", v1: 3, v2: 4, amk: 3, tp: 3 },
          { n: "Matcha Latte", nutri: "C", sugar: "3%", v1: 5, v2: 6, amk: 5, tp: 5, tags: ["new"] },
          { n: "Classic Chocolate", nutri: "C", sugar: "5%", v1: 5, v2: 6, amk: 5, tp: 5 },
          { n: "Milo Freeze", nutri: "D", sugar: "12%", v1: null, v2: 6, amk: 6, tp: 6 },
          { n: "Canned Drinks", d: "Coca-Cola, Coke Zero, Sprite, iced lemon tea.", nutri: "B", sugar: "5%", v1: null, v2: 4, amk: 4, tp: 4 }
        ]
      }
    ],

    sets: {
      amk: [
        { name: "Set Meal", price: 6, includes: "soup + beverage", base: "any main" }
      ],
      tp: [
        { name: "Weekday 2-Course Set Lunch", price: 16, when: "Mon–Fri excluding PH, 11:00am–2:30pm", includes: "soup, choice of main, coffee or tea" },
        { name: "Weekday 3-Course Set Dinner", price: 22, when: "Mon–Fri excluding PH, 6:00–8:00pm", includes: "soup, choice of main, dessert" }
      ]
    },

    specials: [
      {
        name: "Braised Lamb Shoulder",
        price: 24,
        blurb: "This month's braise: lamb shoulder, slow-cooked with rosemary and root vegetables.",
        img: "promo-lamb",
        alt: "Slow-cooked lamb on mashed potato with greens and a dark sauce."
      },
      {
        name: "Weekday Grain Bowls",
        blurb: "New protein bowls, weekdays at both kitchens.",
        img: "promo-bowls",
        alt: "A grain bowl with sliced chicken, avocado, broccoli and cucumber, seen from above."
      },
      {
        name: "Mocktail of the Month",
        blurb: "Sweet, tart and fizzy — this month's specialty mocktail.",
        img: "promo-mocktail",
        alt: "Two tall glasses of iced grapefruit and pomegranate mocktail."
      }
    ]
  };

  function fmt(v) {
    if (v == null) return "";
    return "$" + (Number.isInteger(v) ? v : v.toFixed(2));
  }

  /* Cheapest priced item across both outlets for a section — used for the
     "from $x" lines so copy can never drift from the catalogue. */
  function sectionMin(section) {
    var min = Infinity;
    section.items.forEach(function (it) {
      [it.amk, it.tp, it.v1, it.v2].forEach(function (p) {
        if (typeof p === "number" && p < min) min = p;
      });
    });
    return min === Infinity ? null : min;
  }

  /* Enquiry link for a given outlet. This is a concept preview, so contact is
     a plain mailto rather than a live phone/WhatsApp number. */
  function waLink(outletId) {
    var o = DATA.outlets[outletId];
    var subject = "Enquiry" + (o ? " — " + o.name : "");
    return "mailto:" + DATA.contactEmail + "?subject=" + encodeURIComponent(subject);
  }

  window.PB_DATA = DATA;
  window.PB_FMT = fmt;
  window.PB_SECTION_MIN = sectionMin;
  window.PB_WA = waLink;
})();
