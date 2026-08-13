/* NEAP — the catalogue. Every number the site quotes about the menus
   (course counts, prices) is read from here, never typed in copy. */
(function () {
  "use strict";

  window.NEAP_MENUS = {
    flood: {
      key: "flood",
      name: "Flood",
      tide: "served on spring tides, when the sea moves",
      price: 285,
      courses: [
        { n: "oyster", d: "iced rain water · white pepper flower" },
        { n: "herring, lightly cured", d: "burnt cream · warm rye" },
        { n: "scallop from the diver", d: "cold brown butter · sea grass" },
        { n: "haddock, salted overnight", d: "smoked roe · a broth of potato skins" },
        { n: "dorade on the bone", d: "flood butter · charred hearts of lettuce" },
        { n: "salmon, barely warmed", d: "pine · last summer's gooseberries" },
        { n: "aged duck — the one landward course", d: "beach rose · smoked beet" },
        { n: "frozen fennel", d: "buttermilk · broken meringue" },
        { n: "sea-salt caramel", d: "dulse · malted barley" }
      ]
    },
    still: {
      key: "still",
      name: "Still",
      tide: "served on neap tides, when the water barely breathes",
      price: 240,
      courses: [
        { n: "a clear broth of shells", d: "chervil, one leaf" },
        { n: "oyster, warm this time", d: "cream risen overnight · cider lees" },
        { n: "scallop, raw", d: "herbs cut at four o'clock · oil pressed from their stems" },
        { n: "haddock poached in whey", d: "young leeks · nothing else" },
        { n: "dorade baked in salt, carved at the counter", d: "bay-leaf butter" },
        { n: "warm brown bread", d: "cultured cream · heather honey" },
        { n: "milk skin", d: "apples kept since autumn · lovage" }
      ]
    }
  };

  window.NEAP_SUPPLEMENTS = [
    { n: "caviar, in its tin, with a spoon", price: 90 },
    { n: "the cheese kept in the cellar", price: 28 },
    { n: "a second pour of the old sherry", price: 35 }
  ];

  window.NEAP_PAIRINGS = [
    { n: "tide pairing — wines, ciders, one sherry", price: 165 },
    { n: "still pairing — teas, pressed juices, infusions", price: 95 }
  ];

  // Reservation constants, quoted by copy and enforced by the form.
  window.NEAP_HOUSE = {
    seats: 14,
    maxParty: 4,
    seatings: ["17:45", "20:45"],
    releaseDay: 1,        // bookings open the 1st of each month
    releaseHour: 12,      // at noon
    horizonMonths: 2,     // two months ahead
    noticeHours: 72,      // allergies + cancellation window
    depositPerGuest: 120
  };
})();
