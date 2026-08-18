/* =============================================================================
   Fancy Nails Paradise — the whole service list, in one place.

   This is the only file that changes when the salon's price board changes.
   services.js reads it and rebuilds the page; no HTML needs touching.

   PRICE PROVENANCE — read before editing.
   The salon does not publish a price list of its own. The figures marked
   `verified: true` below were each corroborated in published Singapore
   editorial listings (see IMAGE-CREDITS.md / DESIGN.md for the sources and
   dates). They are indicative and MUST be confirmed with the owner before
   this site goes anywhere public — editorial prices go stale, and a wrong
   price on a live salon site costs the salon money and trust.

   Where no price could be corroborated, `price` is null and the row renders
   as "Ask in salon" rather than inventing a number. Nothing here is guessed.

   Service CATEGORIES are taken from the salon's own publicly listed service
   categories, so the shape of the menu is accurate even where prices are not.
   ============================================================================= */
window.FNP_SERVICES = {
  currency: "$",

  /* Shown under the price list so a visitor understands the figures. */
  priceNote: "Prices start from the figures shown and vary with length, shape and design. Ask when you call and we'll give you the exact price.",

  groups: [
    {
      id: "express",
      name: "Express",
      note: "In and out on a lunch break.",
      items: [
        { name: "Express Manicure", price: 10, verified: true,
          desc: "Shape, tidy the cuticles, buff and a coat of colour." },
        { name: "Express Pedicure", price: 15, verified: true,
          desc: "The same quick tidy-up for toes." },
        { name: "Express Gelish Manicure", price: 25, verified: true,
          desc: "Gel colour cured under the lamp — dry before you leave, and it stays put for weeks." }
      ]
    },
    {
      id: "handsfeet",
      name: "Manicure & Pedicure",
      note: "The full sit-down version, with a proper soak and a longer massage.",
      items: [
        { name: "Manicure", price: 25, verified: true,
          desc: "Soak, shape, cuticle work, hand massage and colour." },
        { name: "Pedicure", price: 35, verified: true,
          desc: "Soak, hard-skin work, shape, foot massage and colour." },
        { name: "Manicure & Pedicure", price: null,
          desc: "Both together, in one sitting." },
        { name: "Men's Manicure", price: null,
          desc: "Shape, cuticle tidy and buff. No colour unless you want it." },
        { name: "Men's Pedicure", price: null,
          desc: "The same for feet, with hard-skin work." }
      ]
    },
    {
      id: "gel",
      name: "Gel & Gelish",
      note: "Cured hard under the lamp, so nothing smudges on the bus home.",
      items: [
        { name: "Gel Nails", price: null,
          desc: "Gel colour on your natural nails." },
        { name: "Gel Nail Extensions", price: null,
          desc: "Length added, then finished in gel." },
        { name: "Soak-off & Removal", price: null,
          desc: "Gentle removal of an old set. Free when you're having a new set on the same visit." }
      ]
    },
    {
      id: "extensions",
      name: "Extensions",
      note: "Choose the length and shape — we'll tell you honestly what will last.",
      items: [
        { name: "Acrylic Nails", price: null,
          desc: "Hard-wearing extensions, good if you're rough on your hands." },
        { name: "Dip Powder Nails", price: null,
          desc: "Powder-dipped colour — lighter than acrylic, no lamp needed." },
        { name: "Nail Extensions", price: null,
          desc: "Tips added and shaped to the length you want." },
        { name: "Infill", price: null,
          desc: "Topping up a grown-out set rather than starting again." }
      ]
    },
    {
      id: "art",
      name: "Nail Art & Colour",
      note: "From one accent nail to a full set. Bring a screenshot.",
      items: [
        { name: "Nail Art", price: null,
          desc: "Priced per nail, by how detailed the design is." },
        { name: "Nail Polish", price: null,
          desc: "A straight coat of colour, no treatment." },
        { name: "French Finish", price: null,
          desc: "The classic white tip, or a colour tip if you'd rather." }
      ]
    }
  ]
};
