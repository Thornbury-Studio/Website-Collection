/* =============================================================================
   cafe BomBom Tampines 1 — the menu, in one file.

   This is the only file to change when the counter board changes. menu.js
   renders it; no HTML needs touching.

   PRICE PROVENANCE — READ BEFORE EDITING.
   cafe BomBom publishes no price list of its own. Every figure below was taken
   from published Singapore editorial coverage of THIS outlet, and each carries
   the year it was reported. They are indicative and MUST be confirmed against
   the counter board before this site is shown publicly.

   The vintages genuinely differ: the bulk come from launch coverage in Oct
   2022, while a later listing reports Melon Bingsu at $8.80 and an iced
   hazelnut latte at $6.90 — so prices have demonstrably moved since opening.
   Everything therefore renders as "from $X", never as a firm price, and
   anything with no reported figure renders "Ask at counter" rather than
   carrying an invented number. Nothing here is guessed.

   `src` records where each figure came from so a future editor can re-check it
   without repeating the research.
   ============================================================================= */
window.BOMBOM_MENU = {
  currency: "$",

  note: "Prices are indicative and start from the figures shown. The counter board is the final word — flavours and specials rotate.",

  groups: [
    {
      id: "bingsu",
      name: "Bingsu",
      korean: "빙수",
      note: "Korean shaved-ice, built to share. Milk-fine ice, piled with toppings.",
      items: [
        { name: "Chocolate Bingsu", price: 7.60, src: "2022", tag: "Signature",
          desc: "Cocoa shaved ice under condensed milk, the one the queue is usually for." },
        { name: "Strawberry Bingsu", price: 7.60, src: "2022",
          desc: "Milk ice, strawberries and cream." },
        { name: "K-Ogok Bingsu", price: 7.60, src: "2022",
          desc: "Korean five-grain — nutty and toasted rather than sweet." },
        { name: "Dalgona Bingsu", price: 7.60, src: "2022",
          desc: "Built on the burnt-sugar candy: bitter-edged caramel over ice." },
        { name: "Melon Bingsu", price: 8.80, src: "2024",
          desc: "Seasonal melon, when it is on." }
      ]
    },
    {
      id: "bomcaron",
      name: "Bomcarons",
      note: "The house macaron — thicker and less sweet than the French kind. Flavours rotate.",
      items: [
        { name: "Bomcaron — Oreo", price: 4.90, src: "2022" },
        { name: "Bomcaron — Cheddar", price: 4.90, src: "2022" },
        { name: "Bomcaron — Chocolate", price: 4.90, src: "2022" },
        { name: "Bomcaron — Strawberry", price: 4.90, src: "2022" },
        { name: "Bomcaron — Vanilla", price: 4.90, src: "2022" },
        { name: "Seasonal flavours", price: null,
          desc: "Orange and hojicha have both appeared. Ask what is in today." }
      ]
    },
    {
      id: "coffee",
      name: "Coffee & Lattes",
      note: "The other half of the counter — and the reason to come when it is not dessert weather.",
      items: [
        { name: "Hot Hazelnut Latte", price: 6.00, src: "2022" },
        { name: "Iced Hazelnut Latte", price: 6.90, src: "2024" },
        { name: "Sweet Potato Latte (hot)", price: 6.00, src: "2022",
          desc: "Roasted sweet potato, thick and barely sweet. A proper Korean café staple." },
        { name: "Sweet Potato Latte (iced)", price: 6.90, src: "2022" },
        { name: "Iced Mint Cream Chocolate Latte", price: 7.20, src: "2022" },
        { name: "Bom Blanc", price: 6.80, src: "2022" },
        { name: "Sea Salt Blanc", price: 7.50, src: "2022" },
        { name: "Iced Orange Blanc", price: 6.50, src: "2022" },
        { name: "Americano", price: null,
          desc: "Hot or iced." }
      ]
    },
    {
      id: "cold",
      name: "Frappes, Smoothies & Soda",
      note: "More than fifty drinks on the board in total.",
      items: [
        { name: "Mango Smoothie", price: 7.80, src: "2022" },
        { name: "Bomb Frappe", price: 7.80, src: "2022",
          desc: "Priced from — the flavour you pick changes it." },
        { name: "Lemon Soda", price: 5.50, src: "2022" },
        { name: "Yogurt Smoothies", price: null }
      ]
    },
    {
      id: "bakes",
      name: "Cakes & Bakes",
      items: [
        { name: "New York Cheesecake", price: 8.50, src: "2022", desc: "By the slice." },
        { name: "Croffles", price: null,
          desc: "Croissant pressed in a waffle iron. Ask what is on today." }
      ]
    }
  ]
};
