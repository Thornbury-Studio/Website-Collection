/* =============================================================================
   Three's A Crowd — menu + flavour data. Single source of truth for the
   flavour board, the menu page and every price quoted in page copy.

   Every figure was read off the cafe's own published Tampines in-store menu
   ("2025" edition, read 18 Aug 2026) or its live online store (28 flavours,
   tier derived from each flavour's published pint price: $16 Classic /
   $20 Premium / $22 Special). Nothing is invented.

   Renderer rules:
   - Flavour tiers price through TIERS; per-flavour prices are never typed.
   - The cabinet rotates: the flavour board says so rather than promising
     today's line-up.
   - variants: [{label, price}] for hot/iced and portion splits.
   - price: null renders as "At the counter" (used for House Cake).
   ============================================================================= */

window.TAC_MENU = {
  tiers: {
    classic: { label: 'Classic', scoop: 4.5, pint: 16, affogato: 7.5 },
    premium: { label: 'Premium', scoop: 5.5, pint: 20, affogato: 8.5 },
    special: { label: 'Special', scoop: 6.0, pint: 22, affogato: 9.0 }
  },

  flavours: [
    { name: 'MSW Durian', tier: 'special', note: 'Mao Shan Wang' },
    { name: 'Roasted Pistachio', tier: 'special' },
    { name: 'Chendol', tier: 'special' },
    { name: 'Kaya Speculoos', tier: 'special' },
    { name: 'Mango Passion Sorbet', tier: 'special', vegan: true },
    { name: '"Leegacy" Dark Chocolate', tier: 'premium' },
    { name: 'Dark Gianduia', tier: 'premium' },
    { name: 'Speculoos', tier: 'premium' },
    { name: 'Berries Cheesecake', tier: 'premium' },
    { name: 'Matcha', tier: 'premium' },
    { name: 'Hojicha', tier: 'premium' },
    { name: 'Butterscotch', tier: 'premium' },
    { name: 'Strawberry', tier: 'premium' },
    { name: 'Milosaurus', tier: 'premium' },
    { name: 'Blue Pea Hokkaido Milk', tier: 'premium' },
    { name: 'PB & J', tier: 'premium' },
    { name: 'Cookies & Cream', tier: 'classic' },
    { name: 'Peanut Butter Caramel', tier: 'classic' },
    { name: 'Coconut', tier: 'classic', vegan: true },
    { name: 'Unicorn Pop', tier: 'classic' },
    { name: 'Double Chocolate', tier: 'classic' },
    { name: 'Vanilla Bean', tier: 'classic' },
    { name: 'Espresso', tier: 'classic' },
    { name: 'Oreo Mint', tier: 'classic' },
    { name: 'Masala', tier: 'classic' },
    { name: 'Honey Creme', tier: 'classic' },
    { name: 'Oolong Tea Latte', tier: 'classic' },
    { name: 'Rose Lychee', tier: 'classic' }
  ],

  groups: [
    {
      id: 'waffles',
      name: 'Waffles & Bakes',
      note: 'Waffles come with maple syrup; churros waffles with chocolate sauce. Add a scoop: Classic $4.50 · Premium $5.50 · Special $6.',
      items: [
        { name: 'Mochi Waffle', desc: 'Crisp outside, chewy glutinous inside — the house signature.', price: 8.50, tag: 'Signature' },
        { name: 'Churros Mochi Waffle', desc: 'The mochi waffle dusted in cinnamon sugar, chocolate sauce over.', price: 10.50 },
        { name: 'Churros Waffle', desc: 'Cinnamon-sugar crisp, chocolate sauce.', price: 8.00 },
        { name: 'Maple Waffle', desc: 'The classic, with maple syrup.', price: 6.00 },
        { name: 'Fudgey Brownie', desc: '', price: 4.80 },
        { name: 'Choco Lava Cookie', desc: '', price: 6.90 },
        { name: 'Speculoos Lava Cookie', desc: '', price: 6.90 },
        { name: 'House Cake', desc: 'The day’s bakes are in the counter display.', price: null }
      ]
    },
    {
      id: 'deals',
      name: 'Sweet Deals',
      note: 'Premium scoop +$1 · Special scoop +$1.50.',
      items: [
        { name: 'Brownie + Gelato', desc: 'Warm fudgey brownie with a classic scoop.', price: 8.80, tag: 'U.P. $9.30' },
        { name: 'Lava Cookie + Gelato', desc: 'Molten cookie with a classic scoop.', price: 11.00, tag: 'U.P. $11.40' }
      ]
    },
    {
      id: 'savoury',
      name: 'Savoury',
      items: [
        { name: 'Fried Chicken & Waffle', desc: 'Crispy fried chicken over a fresh waffle, maple on the side.', price: 12.00 },
        { name: 'Lasagna', desc: 'Chicken or beef, baked to order.', price: 11.90 }
      ]
    },
    {
      id: 'coffee',
      name: 'Coffee',
      items: [
        { name: 'Black', desc: '', variants: [ { label: 'Hot', price: 4.00 }, { label: 'Iced', price: 5.00 } ] },
        { name: 'Cafe Latte', desc: '', variants: [ { label: 'Hot', price: 5.00 }, { label: 'Iced', price: 6.00 } ] },
        { name: 'Cafe Mocha', desc: '', variants: [ { label: 'Hot', price: 6.50 }, { label: 'Iced', price: 7.50 } ] },
        { name: 'Vanilla Latte', desc: '', variants: [ { label: 'Hot', price: 6.50 }, { label: 'Iced', price: 7.50 } ] },
        { name: 'Hazelnut Latte', desc: '', variants: [ { label: 'Hot', price: 6.50 }, { label: 'Iced', price: 7.50 } ] },
        { name: 'Iced Bandung Latte', desc: 'Rose-pink, very Singapore.', price: 7.50 },
        { name: 'Iced Chendol Latte', desc: '', price: 8.00 }
      ]
    },
    {
      id: 'tea',
      name: 'Tea & Cocoa',
      items: [
        { name: 'Oolong Tea', desc: '', variants: [ { label: 'Hot', price: 4.00 }, { label: 'Iced', price: 5.00 } ] },
        { name: 'Earl Grey Tea', desc: '', variants: [ { label: 'Hot', price: 4.00 }, { label: 'Iced', price: 5.00 } ] },
        { name: 'Matcha Latte', desc: '', variants: [ { label: 'Hot', price: 6.50 }, { label: 'Iced', price: 7.50 } ] },
        { name: 'Hojicha Latte', desc: '', variants: [ { label: 'Hot', price: 6.50 }, { label: 'Iced', price: 7.50 } ] },
        { name: 'Hot Chocolate', desc: '', price: 6.00 },
        { name: 'Iced Chocolate', desc: '', price: 7.00 },
        { name: 'Hazelnut Chocolate', desc: '', variants: [ { label: 'Hot', price: 7.00 }, { label: 'Iced', price: 8.00 } ] }
      ]
    },
    {
      id: 'shakes',
      name: 'Gelato Shakes & Soda',
      note: 'M.Y.O.: pick any one flavour from the cabinet. Premium +$1 · Special +$1.50.',
      items: [
        { name: 'M.Y.O. Gelato Shake', desc: 'Any one flavour, blended thick.', price: 8.90, tag: 'Build your own' },
        { name: 'Rootbeer Float', desc: '', price: 7.50 },
        { name: 'Yuzu / Lychee Soda', desc: 'Add a float scoop +$1.50.', price: 6.00 },
        { name: 'Soft Drink', desc: 'Sprite, soda water or 100plus.', price: 2.50 }
      ]
    }
  ]
};
