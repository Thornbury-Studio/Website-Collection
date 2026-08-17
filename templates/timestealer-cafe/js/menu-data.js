/* =============================================================================
   Timestealer Café — the whole menu, in one place.

   This is the only file that has to change when the counter price list changes.
   menu.js reads it and rebuilds the page; nothing else needs touching.

   `price` is a number in SGD, or null for anything that rotates day to day —
   a null renders as "Daily" instead of a figure, so nothing on the page can
   quote a price the counter isn't charging.
   ============================================================================= */
window.TS_MENU = {
  currency: "$",

  groups: [
    {
      id: "bowls",
      name: "Rice Bowls",
      note: "Cooked to order. Served warm, in a bowl you can carry one-handed.",
      items: [
        {
          name: "Yakitori Chicken Don",
          price: 6.80,
          desc: "Grilled chicken in a sweet-savoury glaze, over hot rice."
        },
        {
          name: "Battered Fish Rice Bowl",
          price: 5.80,
          desc: "Fish fried to order in a light batter, over hot rice."
        },
        {
          name: "Bowl of the Day",
          price: null,
          desc: "Whatever the kitchen is cooking that morning. Ask at the counter."
        }
      ]
    },

    {
      id: "croissants",
      name: "Loaded Croissants",
      note: "Split, filled and pressed to order.",
      items: [
        {
          name: "Egg Mayo Croissant",
          price: 7.00,
          desc: "Egg mayo, made up in the morning and filled when you order."
        },
        {
          name: "Tuna Croissant",
          price: 7.50,
          desc: "Tuna mayo, filled to order."
        }
      ]
    },

    {
      id: "potatoes",
      name: "Baked Potatoes",
      note: "Baked through, split at the counter, loaded while hot.",
      items: [
        {
          name: "Loaded Baked Potato",
          price: null,
          desc: "A whole baked potato with the day's toppings. Ask what's on."
        }
      ]
    },

    {
      id: "oven",
      name: "From the Oven",
      note: "Baked in-house. What is on the rack is what there is — when it goes, it is gone.",
      items: [
        {
          name: "Muffins",
          price: null,
          desc: "Home-style muffins, baked fresh and rotated through the week."
        },
        {
          name: "Coffee Cake",
          price: 15.00,
          desc: "Whole cake. Worth ordering ahead if you need it for a particular day."
        },
        {
          name: "Bake of the Day",
          price: null,
          desc: "There is usually something else out. Have a look at the counter."
        }
      ]
    },

    {
      id: "drinks",
      name: "Coffee & Drinks",
      note: "Made to order, to sit with or to take up the road.",
      items: [
        {
          name: "Coffee",
          price: null,
          desc: "Hot or iced, the way you take it."
        },
        {
          name: "Tea",
          price: null,
          desc: "Hot or iced."
        }
      ]
    }
  ]
};
