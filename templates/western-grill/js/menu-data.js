/* =====================================================================
   THE BRASS OX — menu catalogue.
   Prices in cents. `cat` drives the rail; `tags` drive the filters.
   Modifier groups: pick = one required choice, add = optional extras.
   Steaks carry a doneness group, which is the whole reason this menu
   needs modifiers at all.
   ===================================================================== */
window.OX_MENU = [

  /* ------------------------------ starters ---------------------------- */
  {
    id: 'calamari', cat: 'starters', img: 'img/a1-calamari.webp',
    name: 'Crispy Calamari', price: 1400,
    desc: 'Buttermilk-soaked, semolina crust, lemon aioli, pickled chilli.',
    tags: [],
    mods: [
      { type: 'pick', name: 'Dip', options: [['Lemon aioli', 0], ['Marinara', 0], ['Both', 150]] }
    ]
  },
  {
    id: 'wings', cat: 'starters', img: 'img/a2-wings.webp',
    name: 'Buffalo Wings', price: 1500,
    desc: 'Twelve wings, cayenne butter, blue cheese, celery batons.',
    tags: ['spicy'],
    mods: [
      { type: 'pick', name: 'Heat', options: [['Mild', 0], ['Buffalo', 0], ['Devil’s cut', 0]] },
      { type: 'pick', name: 'Dip', options: [['Blue cheese', 0], ['Ranch', 0]] },
      { type: 'add', name: 'Extras', options: [['Six more wings', 700], ['Extra dip', 150]] }
    ]
  },
  {
    id: 'caesar', cat: 'starters', img: 'img/a3-caesar.webp',
    name: 'Caesar Salad', price: 1300,
    desc: 'Baby gem, anchovy dressing, sourdough croutons, aged parmesan.',
    tags: [],
    mods: [
      { type: 'add', name: 'Add protein', options: [['Grilled chicken', 600], ['Garlic prawns', 850], ['Sliced sirloin', 1100]] },
      { type: 'add', name: 'Adjust', options: [['No anchovy', 0], ['Dressing on the side', 0]] }
    ]
  },
  {
    id: 'chowder', cat: 'starters', img: 'img/a4-chowder.webp',
    name: 'Clam Chowder', price: 1100,
    desc: 'New England style, smoked bacon, thyme, oyster crackers.',
    tags: [],
    mods: [
      { type: 'add', name: 'Extras', options: [['Sourdough roll', 250], ['Extra crackers', 0]] }
    ]
  },
  {
    id: 'garlicbread', cat: 'starters', img: 'img/a5-garlicbread.webp',
    name: 'Confit Garlic Bread', price: 900,
    desc: 'Sourdough, slow-cooked garlic butter, parsley, sea salt.',
    tags: ['vegetarian'],
    mods: [
      { type: 'add', name: 'Extras', options: [['Melted mozzarella', 300], ['Bone marrow butter', 450]] }
    ]
  },

  /* ----------------------------- the grill ---------------------------- */
  {
    id: 'ribeye', cat: 'grill', img: 'img/g1-ribeye.webp',
    name: 'Bone-In Ribeye', weight: '12 oz', price: 4600,
    desc: 'Dry-aged thirty-five days over oak. Bone marrow butter, watercress.',
    tags: ['gluten-free-option'],
    mods: [
      { type: 'pick', name: 'Cook it', options: [['Rare', 0], ['Medium rare', 0], ['Medium', 0], ['Medium well', 0], ['Well done', 0]] },
      { type: 'pick', name: 'Sauce', options: [['Bone marrow butter', 0], ['Green peppercorn', 0], ['Béarnaise', 0], ['None', 0]] },
      { type: 'add', name: 'Add to the plate', options: [['Blue cheese crust', 450], ['Garlic prawns', 850], ['Half lobster tail', 1600]] }
    ]
  },
  {
    id: 'flank', cat: 'grill', img: 'img/g2-flank.webp',
    name: 'Flank Steak & Chimichurri', weight: '10 oz', price: 3800,
    desc: 'Sliced across the grain, charred edges, parsley-oregano chimichurri.',
    tags: ['gluten-free'],
    mods: [
      { type: 'pick', name: 'Cook it', options: [['Rare', 0], ['Medium rare', 0], ['Medium', 0], ['Medium well', 0], ['Well done', 0]] },
      { type: 'add', name: 'Add to the plate', options: [['Extra chimichurri', 200], ['Chimichurri on the side', 0]] }
    ]
  },
  {
    id: 'tomahawk', cat: 'grill', img: 'img/g3-tomahawk.webp',
    name: 'Tomahawk, For Two', weight: '32 oz', price: 9200,
    desc: 'Carved at the pass. Smoked chilli salt, red wine jus, two sides included.',
    tags: [],
    mods: [
      { type: 'pick', name: 'Cook it', options: [['Rare', 0], ['Medium rare', 0], ['Medium', 0], ['Medium well', 0]] },
      { type: 'pick', name: 'First side', options: [['Triple-cooked chips', 0], ['Creamed spinach', 0], ['Grilled asparagus', 0], ['Onion rings', 0]] },
      { type: 'pick', name: 'Second side', options: [['Triple-cooked chips', 0], ['Creamed spinach', 0], ['Grilled asparagus', 0], ['Onion rings', 0]] }
    ]
  },
  {
    id: 'lamb', cat: 'grill', img: 'img/g4-lamb.webp',
    name: 'Lamb Chops', weight: '4 chops', price: 3600,
    desc: 'Rosemary and garlic overnight, mint salsa verde, charred lemon.',
    tags: ['gluten-free'],
    mods: [
      { type: 'pick', name: 'Cook it', options: [['Medium rare', 0], ['Medium', 0], ['Medium well', 0]] },
      { type: 'add', name: 'Add to the plate', options: [['Extra salsa verde', 200]] }
    ]
  },
  {
    id: 'salmon', cat: 'grill', img: 'img/g5-salmon.webp',
    name: 'Grilled Atlantic Salmon', price: 3200,
    desc: 'Skin crisped on the bars, lemon caper butter, grilled asparagus.',
    tags: ['gluten-free'],
    mods: [
      { type: 'pick', name: 'Cook it', options: [['Medium', 0], ['Medium well', 0], ['Through', 0]] },
      { type: 'add', name: 'Adjust', options: [['Butter on the side', 0], ['No capers', 0]] }
    ]
  },
  {
    id: 'ribs', cat: 'grill', img: 'img/g6-ribs.webp',
    name: 'Baby Back Ribs', weight: 'full rack', price: 3400,
    desc: 'Six hours low, bourbon molasses glaze, finished hot over coals.',
    tags: ['spicy-option'],
    mods: [
      { type: 'pick', name: 'Glaze', options: [['Bourbon molasses', 0], ['Smoked chilli', 0], ['Dry rub, no glaze', 0]] },
      { type: 'pick', name: 'Portion', options: [['Full rack', 0], ['Half rack', -1200]] },
      { type: 'add', name: 'Extras', options: [['Extra glaze', 150], ['Pickle plate', 400]] }
    ]
  },
  {
    id: 'chicken', cat: 'grill', img: 'img/g7-chicken.webp',
    name: 'Half Rotisserie Chicken', price: 2800,
    desc: 'Twelve-hour herb brine, turned over the fire, pan jus, charred lemon.',
    tags: ['gluten-free-option'],
    mods: [
      { type: 'pick', name: 'Finish', options: [['Pan jus', 0], ['Smoked chilli butter', 0], ['Plain', 0]] },
      { type: 'add', name: 'Extras', options: [['Extra jus', 0], ['Coleslaw', 450]] }
    ]
  },

  /* --------------------------- burgers & handhelds -------------------- */
  {
    id: 'oxburger', cat: 'burgers', img: 'img/b1-cheeseburger.webp',
    name: 'The Brass Ox Burger', price: 2200,
    desc: 'Two dry-aged patties, aged cheddar, house sauce, brioche, chips.',
    tags: [],
    mods: [
      { type: 'pick', name: 'Cook it', options: [['Medium rare', 0], ['Medium', 0], ['Medium well', 0], ['Well done', 0]] },
      { type: 'pick', name: 'Cheese', options: [['Aged cheddar', 0], ['American', 0], ['Blue cheese', 100], ['No cheese', 0]] },
      { type: 'add', name: 'Pile it on', options: [['Smoked bacon', 350], ['Fried egg', 250], ['Caramelised onion', 200], ['Third patty', 800]] }
    ]
  },
  {
    id: 'blueburger', cat: 'burgers', img: 'img/b2-blueburger.webp',
    name: 'Bacon & Blue Burger', price: 2400,
    desc: 'Streaky bacon, blue cheese, pickled shallot, black garlic mayo, chips.',
    tags: [],
    mods: [
      { type: 'pick', name: 'Cook it', options: [['Medium rare', 0], ['Medium', 0], ['Medium well', 0], ['Well done', 0]] },
      { type: 'add', name: 'Pile it on', options: [['Extra bacon', 350], ['Fried egg', 250], ['Jalapeños', 150]] }
    ]
  },
  {
    id: 'pulledpork', cat: 'burgers', img: 'img/b3-pulledpork.webp',
    name: 'Pulled Pork Sandwich', price: 1900,
    desc: 'Twelve-hour shoulder, cider slaw, bread-and-butter pickles, brioche.',
    tags: [],
    mods: [
      { type: 'pick', name: 'Sauce', options: [['Carolina vinegar', 0], ['Kansas City sweet', 0], ['Smoked chilli', 0]] },
      { type: 'add', name: 'Extras', options: [['Extra slaw', 300], ['Crispy onions', 200]] }
    ]
  },
  {
    id: 'chickensand', cat: 'burgers', img: 'img/b4-chickensand.webp',
    name: 'Buttermilk Chicken Sandwich', price: 2000,
    desc: 'Overnight buttermilk, craggy crust, slaw, pickles, hot honey.',
    tags: ['spicy-option'],
    mods: [
      { type: 'pick', name: 'Heat', options: [['Plain', 0], ['Hot honey', 0], ['Nashville hot', 0]] },
      { type: 'add', name: 'Extras', options: [['Extra pickles', 0], ['Smoked bacon', 350], ['Cheese', 200]] }
    ]
  },
  {
    id: 'steaksand', cat: 'burgers', img: 'img/b5-steaksand.webp',
    name: 'Steak Sandwich', price: 2300,
    desc: 'Sirloin, caramelised onion, horseradish cream, toasted ciabatta.',
    tags: [],
    mods: [
      { type: 'pick', name: 'Cook it', options: [['Rare', 0], ['Medium rare', 0], ['Medium', 0], ['Medium well', 0]] },
      { type: 'add', name: 'Extras', options: [['Melted swiss', 250], ['Extra horseradish', 0], ['Truffle chips upgrade', 400]] }
    ]
  },

  /* ------------------------------- plates ----------------------------- */
  {
    id: 'fishchips', cat: 'plates', img: 'img/p1-fishchips.webp',
    name: 'Fish & Chips', price: 2400,
    desc: 'Beer-battered haddock, triple-cooked chips, mushy peas, tartare.',
    tags: [],
    mods: [
      { type: 'add', name: 'Extras', options: [['Extra tartare', 150], ['Curry sauce', 250], ['Malt vinegar', 0]] }
    ]
  },
  {
    id: 'carbonara', cat: 'plates', img: 'img/p2-carbonara.webp',
    name: 'Carbonara', price: 2200,
    desc: 'Guanciale, egg yolk, pecorino, an unreasonable amount of black pepper.',
    tags: [],
    mods: [
      { type: 'add', name: 'Extras', options: [['Extra guanciale', 450], ['Extra pecorino', 200]] }
    ]
  },
  {
    id: 'macncheese', cat: 'plates', img: 'img/p3-macncheese.webp',
    name: 'Truffle Mac & Cheese', price: 2100,
    desc: 'Three cheeses, black truffle, baked in the skillet with a crumb lid.',
    tags: ['vegetarian'],
    mods: [
      { type: 'add', name: 'Pile it on', options: [['Smoked bacon', 350], ['Pulled pork', 550], ['Extra truffle', 500]] }
    ]
  },
  {
    id: 'risotto', cat: 'plates', img: 'img/p4-risotto.webp',
    name: 'Wild Mushroom Risotto', price: 2300,
    desc: 'Carnaroli, porcini stock, aged parmesan, thyme, hazelnut butter.',
    tags: ['vegetarian', 'gluten-free'],
    mods: [
      { type: 'pick', name: 'Finish', options: [['Parmesan', 0], ['Vegan — no dairy', 0]] },
      { type: 'add', name: 'Add protein', options: [['Grilled chicken', 600], ['Sliced sirloin', 1100]] }
    ]
  },
  {
    id: 'chickenparm', cat: 'plates', img: 'img/p5-chickenparm.webp',
    name: 'Chicken Parmigiana', price: 2600,
    desc: 'Crumbed breast, San Marzano sugo, mozzarella, spaghetti.',
    tags: [],
    mods: [
      { type: 'add', name: 'Extras', options: [['Extra mozzarella', 250], ['Chilli flakes', 0]] }
    ]
  },

  /* -------------------------------- sides ----------------------------- */
  {
    id: 'chips', cat: 'sides', img: 'img/s1-fries.webp',
    name: 'Triple-Cooked Chips', price: 900,
    desc: 'Beef dripping or vegetable oil, rosemary salt.',
    tags: ['vegetarian', 'vegan-option'],
    mods: [
      { type: 'pick', name: 'Cooked in', options: [['Beef dripping', 0], ['Vegetable oil — vegan', 0]] },
      { type: 'pick', name: 'Seasoning', options: [['Rosemary salt', 0], ['Truffle & parmesan', 400], ['Plain', 0]] }
    ]
  },
  {
    id: 'onionrings', cat: 'sides', img: 'img/s2-onionrings.webp',
    name: 'Beer-Battered Onion Rings', price: 900,
    desc: 'Thick-cut sweet onion, ale batter, smoked paprika salt.',
    tags: ['vegetarian'],
    mods: [
      { type: 'add', name: 'Extras', options: [['Chipotle mayo', 150]] }
    ]
  },
  {
    id: 'spinach', cat: 'sides', img: 'img/s3-spinach.webp',
    name: 'Creamed Spinach', price: 1000,
    desc: 'The steakhouse one. Nutmeg, shallot, far too much cream.',
    tags: ['vegetarian', 'gluten-free'],
    mods: []
  },
  {
    id: 'asparagus', cat: 'sides', img: 'img/s4-asparagus.webp',
    name: 'Grilled Asparagus', price: 1100,
    desc: 'Charred over coals, lemon, shaved parmesan, olive oil.',
    tags: ['vegetarian', 'gluten-free', 'vegan-option'],
    mods: [
      { type: 'pick', name: 'Parmesan', options: [['Yes', 0], ['No — vegan', 0]] }
    ]
  },

  /* ------------------------------ desserts ---------------------------- */
  {
    id: 'cheesecake', cat: 'desserts', img: 'img/d1-cheesecake.webp',
    name: 'New York Cheesecake', price: 1200,
    desc: 'Baked dense, graham crust, whipped cream, macerated berries.',
    tags: ['vegetarian'],
    mods: [
      { type: 'pick', name: 'Top it', options: [['Berries', 0], ['Salted caramel', 0], ['Plain', 0]] }
    ]
  },
  {
    id: 'lavacake', cat: 'desserts', img: 'img/d2-lavacake.webp',
    name: 'Chocolate Fondant', price: 1300,
    desc: 'Seventy-percent dark, molten centre, vanilla bean ice cream. Twelve minutes.',
    tags: ['vegetarian'],
    mods: [
      { type: 'add', name: 'Extras', options: [['Extra scoop', 300], ['Salted caramel sauce', 200]] }
    ]
  },
  {
    id: 'applepie', cat: 'desserts', img: 'img/d3-applepie.webp',
    name: 'Apple Pie à la Mode', price: 1200,
    desc: 'Bramley apples, lattice top, cinnamon, vanilla ice cream.',
    tags: ['vegetarian'],
    mods: [
      { type: 'pick', name: 'Serve', options: [['With ice cream', 0], ['With cream', 0], ['On its own', 0]] }
    ]
  },
  {
    id: 'stickytoffee', cat: 'desserts', img: 'img/d4-stickytoffee.webp',
    name: 'Sticky Toffee Pudding', price: 1200,
    desc: 'Date sponge, dark toffee sauce, clotted cream ice cream.',
    tags: ['vegetarian'],
    mods: [
      { type: 'add', name: 'Extras', options: [['Extra toffee sauce', 150]] }
    ]
  }
];
