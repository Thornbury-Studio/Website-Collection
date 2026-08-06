/* =====================================================================
   KIYO — menu catalogue.
   One flat list; category drives the tabs, tags drive the filters.
   Prices are cents to keep the cart arithmetic exact.
   Modifier groups: pick = radio (required), add = checkboxes (optional).
   ===================================================================== */
window.KIYO_MENU = [

  /* ------------------------------- mains ------------------------------ */
  {
    id: 'tonkotsu', cat: 'mains', img: 'img/m01-tonkotsu.webp',
    name: 'Tonkotsu Ramen', jp: '豚骨ラーメン', price: 1690,
    desc: '18-hour pork bone broth, chashu, ajitama egg, kikurage, benishoga.',
    tags: ['spicy-option'],
    mods: [
      { type: 'pick', name: 'Broth richness', options: [['Classic', 0], ['Kotteri — extra rich', 0], ['Assari — light', 0]] },
      { type: 'pick', name: 'Noodle firmness', options: [['Regular', 0], ['Firm (barikata)', 0], ['Soft', 0]] },
      { type: 'add', name: 'Extras', options: [['Extra chashu', 380], ['Extra ajitama egg', 180], ['Nori (3 pc)', 120], ['Spicy mayu oil', 90]] }
    ]
  },
  {
    id: 'spicymiso', cat: 'mains', img: 'img/m02-spicymiso.webp',
    name: 'Spicy Miso Ramen', jp: '辛味噌ラーメン', price: 1750,
    desc: 'Red miso broth, minced pork, ajitama, scallion heap, chili threads.',
    tags: ['spicy'],
    mods: [
      { type: 'pick', name: 'Heat level', options: [['Mild 辛1', 0], ['Medium 辛2', 0], ['Hot 辛3', 0], ['Demon 辛5', 100]] },
      { type: 'add', name: 'Extras', options: [['Extra chashu', 380], ['Butter corn', 160], ['Extra ajitama egg', 180]] }
    ]
  },
  {
    id: 'shoyu', cat: 'mains', img: 'img/m03-shoyu.webp',
    name: 'Shoyu Ramen', jp: '醤油ラーメン', price: 1590,
    desc: 'Clear chicken-dashi broth, aged soy tare, menma, three-cut scallion.',
    tags: [],
    mods: [
      { type: 'pick', name: 'Noodle firmness', options: [['Regular', 0], ['Firm', 0], ['Soft', 0]] },
      { type: 'add', name: 'Extras', options: [['Extra chashu', 380], ['Extra menma', 140], ['Yuzu zest', 90]] }
    ]
  },
  {
    id: 'veganramen', cat: 'mains', img: 'img/m10-veganramen.webp',
    name: 'Garden Miso Ramen', jp: '野菜ラーメン', price: 1650,
    desc: 'White miso–shiitake broth, seared tofu, corn, broccolini, chili crisp.',
    tags: ['vegan', 'vegetarian', 'spicy-option'],
    mods: [
      { type: 'pick', name: 'Chili crisp', options: [['On', 0], ['On the side', 0], ['Off', 0]] },
      { type: 'add', name: 'Extras', options: [['Extra tofu', 280], ['Butter corn (vegan)', 160]] }
    ]
  },
  {
    id: 'katsucurry', cat: 'mains', img: 'img/m04-katsucurry.webp',
    name: 'Chicken Katsu Curry', jp: 'チキンカツカレー', price: 1780,
    desc: 'Panko chicken cutlet, medium-sweet curry, pickles, steamed rice.',
    tags: [],
    mods: [
      { type: 'pick', name: 'Curry heat', options: [['Mild', 0], ['Medium', 0], ['Hot', 0]] },
      { type: 'add', name: 'Extras', options: [['Extra cutlet', 520], ['Cheese', 180], ['Fried egg', 160]] }
    ]
  },
  {
    id: 'gyudon', cat: 'mains', img: 'img/m05-gyudon.webp',
    name: 'Gyudon', jp: '牛丼', price: 1490,
    desc: 'Soy-simmered beef and onion over rice, benishoga, seven-spice.',
    tags: [],
    mods: [
      { type: 'pick', name: 'Size', options: [['Regular', 0], ['Large (omori)', 250]] },
      { type: 'add', name: 'Extras', options: [['Onsen egg', 160], ['Extra beef', 420], ['Kimchi', 180]] }
    ]
  },
  {
    id: 'butadon', cat: 'mains', img: 'img/m06-butadon.webp',
    name: 'Butadon', jp: '豚丼', price: 1520,
    desc: 'Char-grilled pork belly over rice, sunny egg, sansho pepper.',
    tags: [],
    mods: [
      { type: 'pick', name: 'Size', options: [['Regular', 0], ['Large (omori)', 250]] },
      { type: 'add', name: 'Extras', options: [['Extra pork', 420], ['Scallion heap', 120]] }
    ]
  },
  {
    id: 'unagi', cat: 'mains', img: 'img/m07-unagi.webp',
    name: 'Unagi Don', jp: '鰻丼', price: 2450,
    desc: 'Glazed freshwater eel over rice, kabayaki tare, sansho, pickles.',
    tags: [],
    mods: [
      { type: 'add', name: 'Extras', options: [['Extra tare', 0], ['Kimo-sui broth', 280]] }
    ]
  },
  {
    id: 'bento', cat: 'mains', img: 'img/m08-bento.webp',
    name: 'Teriyaki Salmon Bento', jp: '鮭照焼き弁当', price: 1980,
    desc: 'Teriyaki salmon, prawn tempura, tamagoyaki, rice, seasonal sides.',
    tags: [],
    mods: [
      { type: 'pick', name: 'Rice', options: [['White rice', 0], ['Brown rice', 0]] },
      { type: 'add', name: 'Extras', options: [['Miso soup', 180], ['Extra tempura (2 pc)', 340]] }
    ]
  },
  {
    id: 'sushi', cat: 'mains', img: 'img/m09-sushi.webp',
    name: 'Sushi Moriawase', jp: '寿司盛り合わせ', price: 2680,
    desc: 'Chef’s selection: 6 nigiri and 6 maki, wasabi, gari, house soy.',
    tags: ['gluten-free-option'],
    mods: [
      { type: 'pick', name: 'Soy sauce', options: [['House soy', 0], ['Tamari (gluten-free)', 0]] },
      { type: 'add', name: 'Extras', options: [['Extra wasabi', 0], ['Salmon nigiri (2 pc)', 420], ['Tuna nigiri (2 pc)', 480]] }
    ]
  },

  /* ------------------------------- sides ------------------------------ */
  {
    id: 'edamame', cat: 'sides', img: 'img/s01-edamame.webp',
    name: 'Edamame', jp: '枝豆', price: 580,
    desc: 'Steamed young soybeans, flake salt or seven-spice.',
    tags: ['vegan', 'vegetarian', 'gluten-free'],
    mods: [
      { type: 'pick', name: 'Seasoning', options: [['Flake salt', 0], ['Shichimi seven-spice', 0], ['Garlic butter', 60]] }
    ]
  },
  {
    id: 'gyoza', cat: 'sides', img: 'img/s02-gyoza.webp',
    name: 'Pork Gyoza (6)', jp: '餃子', price: 780,
    desc: 'Pan-seared dumplings, crisped base, black-vinegar soy dip.',
    tags: [],
    mods: [
      { type: 'pick', name: 'Style', options: [['Pan-seared', 0], ['Steamed', 0]] },
      { type: 'add', name: 'Extras', options: [['Chili oil dip', 60], ['Extra 3 pieces', 360]] }
    ]
  },
  {
    id: 'takoyaki', cat: 'sides', img: 'img/s03-takoyaki.webp',
    name: 'Takoyaki (6)', jp: 'たこ焼き', price: 820,
    desc: 'Osaka octopus fritters, takoyaki sauce, kewpie, bonito flakes.',
    tags: [],
    mods: [
      { type: 'add', name: 'Adjust', options: [['No bonito (vegetarian-ish)', 0], ['Extra sauce', 40], ['Aonori', 0]] }
    ]
  },
  {
    id: 'agedashi', cat: 'sides', img: 'img/s04-agedashi.webp',
    name: 'Agedashi Tofu', jp: '揚げ出し豆腐', price: 720,
    desc: 'Crisp-fried silken tofu in warm dashi, daikon oroshi, ginger.',
    tags: ['vegetarian'],
    mods: [
      { type: 'pick', name: 'Broth', options: [['Classic dashi', 0], ['Kombu dashi (vegan)', 0]] }
    ]
  },
  {
    id: 'karaage', cat: 'sides', img: 'img/s05-karaage.webp',
    name: 'Chicken Karaage', jp: '鶏の唐揚げ', price: 890,
    desc: 'Twice-fried soy-ginger chicken thigh, lemon, kewpie mayo.',
    tags: ['spicy-option'],
    mods: [
      { type: 'pick', name: 'Mayo', options: [['Kewpie', 0], ['Spicy mayo', 0], ['None', 0]] },
      { type: 'add', name: 'Extras', options: [['Extra 3 pieces', 420], ['Yuzu kosho', 80]] }
    ]
  },

  /* ------------------------------ desserts ---------------------------- */
  {
    id: 'matchaice', cat: 'desserts', img: 'img/d01-matchaice.webp',
    name: 'Matcha Ice Cream', jp: '抹茶アイス', price: 620,
    desc: 'Stone-milled Uji matcha, double scoop, toasted soybean flour.',
    tags: ['vegetarian', 'gluten-free'],
    mods: [
      { type: 'add', name: 'Toppings', options: [['Shiratama mochi', 120], ['Red bean (anko)', 100], ['Kuromitsu syrup', 80]] }
    ]
  },
  {
    id: 'daifuku', cat: 'desserts', img: 'img/d02-daifuku.webp',
    name: 'Ichigo Daifuku (2)', jp: '苺大福', price: 680,
    desc: 'Fresh strawberry and red bean wrapped in soft mochi.',
    tags: ['vegan', 'vegetarian', 'gluten-free'],
    mods: []
  },
  {
    id: 'taiyaki', cat: 'desserts', img: 'img/d03-taiyaki.webp',
    name: 'Taiyaki', jp: 'たい焼き', price: 540,
    desc: 'Warm fish-shaped waffle, filled to the tail.',
    tags: ['vegetarian'],
    mods: [
      { type: 'pick', name: 'Filling', options: [['Red bean (anko)', 0], ['Custard', 0], ['Matcha custard', 40]] }
    ]
  },
  {
    id: 'sesame', cat: 'desserts', img: 'img/d04-sesame.webp',
    name: 'Black Sesame Ice Cream', jp: '黒ごまアイス', price: 640,
    desc: 'Roasted kurogoma, deep nutty char, sesame brittle shard.',
    tags: ['vegetarian', 'gluten-free'],
    mods: []
  },
  {
    id: 'sorbet', cat: 'desserts', img: 'img/d05-sorbet.webp',
    name: 'Shiso-Lime Sorbet', jp: '紫蘇ライムソルベ', price: 580,
    desc: 'Bright shiso-lime ice, palate-cleanser sharp, mint tip.',
    tags: ['vegan', 'vegetarian', 'gluten-free'],
    mods: []
  },

  /* ------------------------------- drinks ----------------------------- */
  {
    id: 'junmai', cat: 'drinks', sub: 'Sake', img: 'img/k01-junmai.webp',
    name: 'Junmai Sake', jp: '純米酒', price: 1200,
    desc: 'Dry, rice-forward. Served in a ceramic tokkuri, 180 ml.',
    tags: ['alcohol', 'vegan', 'gluten-free'],
    mods: [{ type: 'pick', name: 'Temperature', options: [['Chilled', 0], ['Room', 0], ['Warm (atsukan)', 0]] }]
  },
  {
    id: 'nigori', cat: 'drinks', sub: 'Sake', img: 'img/k02-nigori.webp',
    name: 'Nigori Sake', jp: 'にごり酒', price: 1300,
    desc: 'Unfiltered, silky and gently sweet. Shake softly. 180 ml.',
    tags: ['alcohol', 'vegan', 'gluten-free'],
    mods: [{ type: 'pick', name: 'Temperature', options: [['Chilled', 0], ['Room', 0]] }]
  },
  {
    id: 'umeshu', cat: 'drinks', sub: 'Sake', img: 'img/k03-umeshu.webp',
    name: 'Umeshu', jp: '梅酒', price: 980,
    desc: 'House plum wine, one whole ume in the glass.',
    tags: ['alcohol', 'vegan', 'gluten-free'],
    mods: [{ type: 'pick', name: 'Serve', options: [['On the rocks', 0], ['Soda split', 0], ['Straight', 0]] }]
  },
  {
    id: 'highball', cat: 'drinks', sub: 'Beer & Highball', img: 'img/k04-highball.webp',
    name: 'Toki Highball', jp: 'ハイボール', price: 1050,
    desc: 'Japanese whisky, hard soda, lemon peel, frozen mug.',
    tags: ['alcohol', 'vegan', 'gluten-free'],
    mods: [{ type: 'add', name: 'Adjust', options: [['Double shot', 450], ['Extra lemon', 0]] }]
  },
  {
    id: 'lager', cat: 'drinks', sub: 'Beer & Highball', img: 'img/k10-lager.webp',
    name: 'Kura Lager', jp: 'クラフトラガー', price: 880,
    desc: 'Crisp rice lager brewed for gyoza. 400 ml draft.',
    tags: ['alcohol', 'vegan'],
    mods: []
  },
  {
    id: 'matchalatte', cat: 'drinks', sub: 'Matcha & Tea', img: 'img/k05-matchalatte.webp',
    name: 'Matcha Latte', jp: '抹茶ラテ', price: 680,
    desc: 'Ceremonial matcha whisked to order, steamed milk.',
    tags: ['vegetarian'],
    mods: [
      { type: 'pick', name: 'Milk', options: [['Whole', 0], ['Oat', 60], ['Soy', 60]] },
      { type: 'pick', name: 'Sweetness', options: [['Unsweetened', 0], ['Lightly sweet', 0], ['Sweet', 0]] }
    ]
  },
  {
    id: 'icedmatcha', cat: 'drinks', sub: 'Matcha & Tea', img: 'img/k06-icedmatcha.webp',
    name: 'Iced Matcha', jp: 'アイス抹茶', price: 620,
    desc: 'Shaken over ice, no milk, cleanly bitter.',
    tags: ['vegan', 'vegetarian', 'gluten-free'],
    mods: [{ type: 'pick', name: 'Sweetness', options: [['Unsweetened', 0], ['Lightly sweet', 0]] }]
  },
  {
    id: 'hojicha', cat: 'drinks', sub: 'Matcha & Tea', img: 'img/k07-hojicha.webp',
    name: 'Hojicha Latte', jp: 'ほうじ茶ラテ', price: 660,
    desc: 'Roasted green tea, toasty and low-caffeine, iced or hot.',
    tags: ['vegetarian'],
    mods: [
      { type: 'pick', name: 'Serve', options: [['Iced', 0], ['Hot', 0]] },
      { type: 'pick', name: 'Milk', options: [['Whole', 0], ['Oat', 60], ['Soy', 60]] }
    ]
  },
  {
    id: 'sencha', cat: 'drinks', sub: 'Matcha & Tea', img: 'img/k08-sencha.webp',
    name: 'Sencha', jp: '煎茶', price: 420,
    desc: 'First-flush green tea, brewed at 70 °C. Pot for one.',
    tags: ['vegan', 'vegetarian', 'gluten-free'],
    mods: []
  },
  {
    id: 'ramune', cat: 'drinks', sub: 'Soft', img: 'img/k09-ramune.webp',
    name: 'Ramune', jp: 'ラムネ', price: 480,
    desc: 'The marble-stopper soda. Original citrus.',
    tags: ['vegan', 'vegetarian', 'gluten-free'],
    mods: []
  }
];
