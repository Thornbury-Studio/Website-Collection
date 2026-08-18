/* Professor Brawn Café — dine-in catalogue.
   Transcribed from the official dine-in menus published at profbrawn.com.sg
   (Ang Mo Kio / Campus 1 menu and Tampines menu, retrieved 16 Aug 2026).
   Prices in SGD; every price is subject to 10% service charge + prevailing
   GST, which the UI states once per card. `amk` / `tp` hold that outlet's
   price, or null when the item is not on that outlet's menu. */
(function () {
  "use strict";

  var DATA = {
    outlets: {
      amk: {
        name: "Ang Mo Kio",
        full: "Professor Brawn Café — Ang Mo Kio",
        campus: "Pathlight School Campus 1",
        address: "5 Ang Mo Kio Ave 10, Singapore 569739",
        whatsapp: "6581294029",
        maps: "https://www.google.com/maps/search/?api=1&query=Professor%20Brawn%20Cafe%2C%205%20Ang%20Mo%20Kio%20Ave%2010%2C%20Singapore%20569739"
      },
      tp: {
        name: "Tampines",
        full: "Professor Brawn Café — Tampines",
        campus: "Pathlight School (Tampines)",
        address: "4 Tampines St 91, Singapore 528907",
        whatsapp: "6580937853",
        maps: "https://www.google.com/maps/search/?api=1&query=Professor%20Brawn%20Cafe%2C%204%20Tampines%20St%2091%2C%20Singapore%20528907"
      }
    },

    waText: "I%20would%20like%20to%20place%20an%20order%2Fmake%20a%20reservation.",

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
        dept: "Horticulture Studies",
        label: "Soups & Salads",
        note: "Add-ons for any salad: chicken +$3 · salmon +$6 · striploin +$8.",
        items: [
          { n: "Cream of Mushroom", d: "Served with a hot herb bun.", amk: 8, tp: 8, tags: ["chef"] },
          { n: "Classic Caesar Salad", amk: 8, tp: 8 },
          { n: "Fresh Garden Salad with Mushroom", amk: 9, tp: 9 }
        ]
      },
      {
        id: "breakfast",
        dept: "Academic Majors",
        label: "Breakfast",
        note: "Served 9:00–11:00am. Egg choices: sunny side up, over easy or scrambled. At Ang Mo Kio, breakfast sets include a hot drink (coffee, tea or chamomile; top up for other or iced beverages).",
        items: [
          { n: "Bangers & Eggs", d: "With grilled mushrooms, tomatoes, toast and mesclun salad.", amk: 17, tp: 17, tags: ["chef"] },
          { n: "Striploin Steak & Eggs", d: "With grilled mushrooms, tomatoes, toast and mesclun salad.", amk: 22, tp: 22 },
          { n: "Tuna & Egg Croissant", amk: 10, tp: null },
          { n: "French Toast with Maple Syrup & Salad", d: "Includes toast and side salad.", amk: null, tp: 9, tags: ["new"] }
        ]
      },
      {
        id: "mains",
        dept: "Academic Majors",
        label: "Mains",
        note: "Bangers choices: original chicken bratwurst or chicken cheese; Tampines also offers chicken harisa (spicy). Additional sausage $8 at Tampines.",
        items: [
          { n: "Braised Beef Cheeks", d: "Ang Mo Kio: with roasted potatoes and asparagus. Tampines: with roasted vegetables.", amk: 25, tp: 25, tags: ["chef"] },
          { n: "Pan Grilled Striploin Steak", d: "Ang Mo Kio serves it with wedges and a side salad.", amk: 22, tp: 22 },
          { n: "Grilled Chicken with Truffle Sauce", d: "Grilled chicken leg smothered in truffle butter sauce.", amk: 16, tp: 16, tags: ["chef"] },
          { n: "Steak & Lobster", amk: null, tp: 38, tags: ["new"] },
          { n: "Beef Burger", amk: null, tp: 15 },
          { n: "Plant-Based Burger", amk: 15, tp: 15, tags: ["veg", "new"] },
          { n: "Bangers & Rosti", d: "With sour cream.", amk: 15, tp: 15 },
          { n: "Bangers & Spaghetti", amk: 14, tp: null },
          { n: "Bangers & Mash / Fries / Wedges", amk: 13, tp: 13 },
          { n: "Grilled Chicken Bibimbap with Fried Egg", amk: 10, tp: null },
          { n: "Battered Fish & Chips", d: "Old-school crispy batter, hearty juicy pollock. With fries and side salad at Ang Mo Kio.", amk: 17, tp: 17, tags: ["chef"] },
          { n: "Pan Seared Norwegian Salmon", d: "With sweet potato mash.", amk: 21, tp: 21 },
          { n: "Meat Platter for 2", d: "Sirloin, grilled chicken, calamari, bangers, nuggets, drumlets, pasta and rice.", amk: 49.9, tp: null },
          { n: "Surf & Turf Platter (2–3 pax)", d: "Dinner only, Fridays and Saturdays.", amk: null, tp: 88 }
        ]
      },
      {
        id: "pasta",
        dept: "Italian Electives",
        label: "Pasta",
        note: "Add-ons: chicken +$3 · salmon +$6 · striploin +$8.",
        items: [
          { n: "Soft Shell Crab Pasta", d: "With fish roe.", amk: 23, tp: 23, tags: ["chef"] },
          { n: "Seafood Carbonara", amk: null, tp: 18, tags: ["new"] },
          { n: "Chicken Lasagna", amk: null, tp: 17, tags: ["new"] },
          { n: "Spaghetti Vongole", amk: 16, tp: 16, tags: ["chef"] },
          { n: "Spaghetti Beef Meatballs", amk: 16, tp: null },
          { n: "Chicken Carbonara", amk: 16, tp: null },
          { n: "Spaghetti Bolognaise (Beef or Chicken)", amk: 14, tp: 14 },
          { n: "Spaghetti with Bangers", amk: null, tp: 14 },
          { n: "Vegetarian Spaghetti", d: "Tangy spaghetti with a generous portion of vegetables.", amk: 13, tp: 13, tags: ["veg"] }
        ]
      },
      {
        id: "sides",
        dept: "Academic Minors",
        label: "Sides",
        items: [
          { n: "House Snacks", d: "Wings, nuggets and fries to share.", amk: 16, tp: null },
          { n: "Clams with White Wine & Garlic", amk: null, tp: 12 },
          { n: "Beef Meatballs in Pomodoro Sauce", d: "With a herb bun.", amk: 10, tp: null },
          { n: "House Drumlets", amk: 9, tp: null },
          { n: "Chicken Winglet (5 pcs)", amk: null, tp: 9 },
          { n: "Crunchy Calamari", amk: 9, tp: null },
          { n: "Breaded Calamari Rings", amk: null, tp: 9 },
          { n: "Rosti", amk: 8, tp: null, tags: ["chef"] },
          { n: "Chicken Nuggets", d: "6 pieces at Tampines.", amk: 8, tp: 8 },
          { n: "Truffle Fries", amk: 7, tp: 7 },
          { n: "Cheesy Fries", amk: 7, tp: 7 },
          { n: "French Fries", amk: 6, tp: 6 },
          { n: "Potato Wedges", amk: 6, tp: 6 },
          { n: "Mash", amk: 6, tp: null },
          { n: "Eggs", d: "Sunny side up, over easy or scrambled.", amk: 3, tp: null },
          { n: "Hashbrown (2 pcs)", amk: null, tp: 2 }
        ]
      },
      {
        id: "kids",
        dept: "Prodigy Classes",
        label: "Kids' Menu",
        note: "For the little ones.",
        items: [
          { n: "Kid's Spaghetti with Bangers", d: "Chicken bratwurst.", amk: 9.9, tp: 9.9 },
          { n: "Kid's Spaghetti Beef Bolognaise", amk: 9.9, tp: 9.9 },
          { n: "Kid's Battered Fish & Chips", amk: 9.9, tp: 9.9 }
        ]
      },
      {
        id: "desserts",
        dept: "Anthropology",
        label: "Desserts",
        note: "Gelato flavours: Hokkaido milk, dark chocolate, strawberry, After 8 (chocolate mint) and passionfruit-orange-guava sorbet. Ask our team about the gourmet cake selection.",
        items: [
          { n: "Waffles with Double Scoop Gelato", amk: 11, tp: 11, tags: ["chef"] },
          { n: "Waffles with Single Scoop Gelato", amk: 8, tp: 8 },
          { n: "Waffles with Maple Syrup", amk: 6, tp: 6 },
          { n: "Artisanal Gelato (Single / Double)", amk: 4.5, amk2: 7.5, tp: 4.5, tp2: 7.5, priceNote: "single / double" },
          { n: "Selection of Cakes (per slice)", amk: null, tp: 6.8 },
          { n: "Apple Pie", d: "À la mode +$2.", amk: 7, tp: null },
          { n: "Chocolate Brownie", d: "À la mode +$2.50.", amk: 5, tp: null },
          { n: "Salted Caramel Brownie", amk: 5, tp: null }
        ]
      },
      {
        id: "drinks",
        dept: "Climate Studies",
        label: "Drinks",
        variant: true,
        note: "Ang Mo Kio pours tall and grande sizes; Tampines lists hot and iced. Nutri-Grade marks are based on preparation at 120% sugar, before ice.",
        items: [
          { n: "Americano", nutri: "A", sugar: "0%", v1: 3, v2: 4, amk: 3, tp: null },
          { n: "Long Black", nutri: "A", sugar: "0%", v1: 3, v2: 4, amk: 3, tp: 3 },
          { n: "Cappuccino", nutri: "C", sugar: "0%", v1: 3.5, v2: 4.5, amk: 3.5, tp: 3.5 },
          { n: "Caffè Latte", nutri: "C", sugar: "0%", v1: 3.5, v2: 4.5, amk: 3.5, tp: 3.5 },
          { n: "Caffè Mocha", nutri: "C", sugar: "5%", v1: 4, v2: 5, amk: 4, tp: 4 },
          { n: "Caramel Macchiato", nutri: "C", sugar: "5%", v1: 4, v2: 5, amk: 4, tp: null },
          { n: "Flat White", nutri: "C", sugar: "0%", v1: 4, v2: 5, amk: 4, tp: 4 },
          { n: "Tea — English Breakfast / Earl Grey / Chamomile", nutri: "A", sugar: "0%", v1: 3, v2: 4, amk: 3, tp: 3 },
          { n: "Tea Latte — English Breakfast / Earl Grey", nutri: "B", sugar: "4%", v1: 3.5, v2: 4.5, amk: 3.5, tp: null },
          { n: "Green Tea Latte", nutri: "C", sugar: "3%", v1: 5, v2: 6, amk: null, tp: 5, tags: ["new"] },
          { n: "Honey Citron Tea", nutri: "C", sugar: "9%", v1: 3.5, v2: 4.5, amk: 3.5, tp: 3.5 },
          { n: "Matcha Latte", nutri: "C", sugar: "3%", v1: 5, v2: 6, amk: 5, tp: null },
          { n: "Classic Chocolate", nutri: "C", sugar: "5%", v1: 5, v2: 6, amk: 5, tp: 5 },
          { n: "Crème — Vanilla / Caramel / Hazelnut", nutri: "C", sugar: "5%", v1: 3.5, v2: 4.5, amk: 3.5, tp: 3.5 },
          { n: "Root Beer Float", nutri: "D", sugar: "17%", v1: null, v2: 7, amk: 7, tp: null },
          { n: "Matcha Freeze", nutri: "C", sugar: "5%", v1: null, v2: 6, amk: 6, tp: 6, tags: ["new"] },
          { n: "Milo Freeze / Smoothie", nutri: "D", sugar: "12%", v1: null, v2: 6, amk: 6, tp: 6 },
          { n: "Citron Lime Freeze", nutri: "C", sugar: "10%", v1: null, v2: 5.5, amk: 5.5, tp: 5.5 },
          { n: "Ribena Freeze", nutri: "D", sugar: "14%", v1: null, v2: 5.5, amk: 5.5, tp: 5.5 },
          { n: "Canned Drinks", d: "Coca-Cola, Coke Zero, Sprite, root beer, iced lemon tea.", nutri: "B", sugar: "5%", v1: null, v2: 4, amk: 4, tp: 4 }
        ]
      }
    ],

    sets: {
      amk: [
        { name: "Minor Set Meal", price: 5.5, includes: "soup + beverage", base: "any main" },
        { name: "Major Set Meal", price: 7.5, includes: "soup + beverage + gelato of the day", base: "any main" }
      ],
      tp: [
        { name: "Weekday 2-Course Set Lunch", price: 18, when: "Mon–Fri excluding PH, 11:00am–2:30pm", includes: "soup, choice of main, coffee or tea" },
        { name: "Weekday 3-Course Set Dinner", price: 22, priceBeef: 28, when: "Mon–Fri excluding PH, 6:00–8:00pm", includes: "soup, choice of main, dessert" }
      ]
    },

    specials: [
      {
        name: "Fragrant Lamb Stew",
        price: 25,
        blurb: "This month's special: tender, succulent lamb with lemongrass and spices.",
        img: "promo-lamb",
        alt: "Slow-cooked lamb on mashed potato with greens and a dark sauce."
      },
      {
        name: "Weekday Lunch Bowls",
        blurb: "New specialty bowls of deliciousness, weekdays at both cafés.",
        img: "promo-bowls",
        alt: "A grain bowl with sliced chicken, avocado, broccoli and cucumber, seen from above."
      },
      {
        name: "Mocktail of the Month",
        blurb: "Sweet, tangy and fizzy goodness at both outlets.",
        img: "promo-mocktail",
        alt: "Two tall glasses of iced grapefruit and pomegranate mocktail."
      }
    ],

    pdfs: [
      { label: "Dine-in menu — Ang Mo Kio (PDF)", href: "https://www.profbrawn.com.sg/documents/menu/Menu-Dine-in-C1.pdf" },
      { label: "Dine-in menu — Tampines (PDF)", href: "https://www.profbrawn.com.sg/documents/menu/Menu-Dine-in-TP.pdf" },
      { label: "Takeaway & set meal menu (PDF)", href: "https://www.profbrawn.com.sg/documents/menu/Menu-Takeaway-SetMeal.pdf" }
    ],

    ordering: {
      grab: "https://food.grab.com/sg/en/restaurant/professor-brawn-cafe-pathlight-school-delivery/4-CZDJLFMDCZEDCX",
      oddle: "https://eats.oddle.me/menus/professor-brawn-cafe"
    }
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

  function waLink(outletId) {
    return "https://wa.me/" + DATA.outlets[outletId].whatsapp + "?text=" + DATA.waText;
  }

  window.PB_DATA = DATA;
  window.PB_FMT = fmt;
  window.PB_SECTION_MIN = sectionMin;
  window.PB_WA = waLink;
})();
