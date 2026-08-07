/* KESAR — menu data. Prices in pence (integer maths, £). */
/* veg: true = green mark, false = maroon mark. heat: 0 none · 1 gentle · 2 warm · 3 fierce. */
/* spice: array of selectable heats. pick: single required choice. adds: optional extras. */

window.KESAR_MENU = [
  /* ---- From the tandoor ---- */
  {
    id: 't1', cat: 'tandoor', img: 'img/t1-samosa.webp',
    name: 'Vegetable Samosa', hindi: 'समोसा', price: 550, veg: true, heat: 1,
    desc: 'Two hand-folded pastries, spiced potato and pea, fried to a deep crackle.',
    adds: [['Tamarind chutney', 80]]
  },
  {
    id: 't2', cat: 'tandoor', img: 'img/t2-bhaji.webp',
    name: 'Onion Bhaji', hindi: 'प्याज़ भजी', price: 500, veg: true, heat: 1,
    desc: 'Sweet onion in chickpea batter, fried until the edges go lacy.',
    adds: [['Mint yoghurt', 80]]
  },
  {
    id: 't3', cat: 'tandoor', img: 'img/t3-paneertikka.webp',
    name: 'Paneer Tikka', hindi: 'पनीर टिक्का', price: 750, veg: true, heat: 2,
    spice: ['Mild', 'Medium', 'Hot'],
    desc: 'Charred paneer and peppers off the skewer, green chutney alongside.'
  },
  {
    id: 't4', cat: 'tandoor', img: 'img/t4-chickentikka.webp',
    name: 'Chicken Tikka', hindi: 'चिकन टिक्का', price: 790, veg: false, heat: 2,
    spice: ['Mild', 'Medium', 'Hot'],
    desc: 'Thigh pieces in yoghurt and Kashmiri chilli, blistered in the tandoor.'
  },
  {
    id: 't5', cat: 'tandoor', img: 'img/t5-seekh.webp',
    name: 'Seekh Kebab', hindi: 'सीख कबाब', price: 850, veg: false, heat: 2,
    spice: ['Medium', 'Hot'],
    desc: 'Hand-minced lamb pressed along the skewer, coriander and green chilli through it.',
    adds: [['Mint chutney', 80]]
  },
  {
    id: 't6', cat: 'tandoor', img: 'img/t6-tandoori.webp',
    name: 'Tandoori Chicken', hindi: 'तंदूरी मुर्ग़', price: 950, veg: false, heat: 2,
    spice: ['Mild', 'Medium', 'Hot'],
    pick: { name: 'Portion', options: [['Half bird', 0], ['Whole bird', 600]] },
    desc: 'Marinated overnight, cooked on the bone. The half feeds one, the whole feeds two.'
  },

  /* ---- Curries ---- */
  {
    id: 'c1', cat: 'curry', img: 'img/c1-butterchicken.webp',
    name: 'Butter Chicken', hindi: 'मुर्ग़ मक्खनी', price: 1350, veg: false, heat: 1,
    spice: ['Mild', 'Medium'],
    desc: 'Tandoor chicken folded into a silked tomato and butter gravy. The one everyone orders.',
    adds: [['Jeera rice', 320], ['Extra gravy', 150]]
  },
  {
    id: 'c2', cat: 'curry', img: 'img/c2-tikkamasala.webp',
    name: 'Chicken Tikka Masala', hindi: 'टिक्का मसाला', price: 1300, veg: false, heat: 1,
    spice: ['Mild', 'Medium', 'Hot'],
    desc: 'Char off the skewer, then a rounder, spicier masala than its butter cousin.',
    adds: [['Jeera rice', 320]]
  },
  {
    id: 'c3', cat: 'curry', img: 'img/c3-roganjosh.webp',
    name: 'Lamb Rogan Josh', hindi: 'रोग़न जोश', price: 1450, veg: false, heat: 2,
    spice: ['Medium', 'Hot'],
    desc: 'Kashmiri braise — slow lamb, ratan jot red, whole spices left in the pot.',
    adds: [['Jeera rice', 320]]
  },
  {
    id: 'c4', cat: 'curry', img: 'img/c4-vindaloo.webp',
    name: 'Lamb Vindaloo', hindi: 'विंडालू', price: 1400, veg: false, heat: 3,
    desc: 'Goan heat and vinegar tang. Arrives hot; there is no mild version.',
    adds: [['Naga chilli — hotter still', 100], ['Jeera rice', 320]]
  },
  {
    id: 'c5', cat: 'curry', img: 'img/c5-palak.webp',
    name: 'Palak Paneer', hindi: 'पालक पनीर', price: 1150, veg: true, heat: 1,
    spice: ['Mild', 'Medium'],
    desc: 'Spinach blanched and blitzed, paneer dropped in soft, finished with cream.',
    adds: [['Jeera rice', 320]]
  },
  {
    id: 'c6', cat: 'curry', img: 'img/c6-chana.webp',
    name: 'Chana Masala', hindi: 'चना मसाला', price: 1050, veg: true, heat: 1,
    spice: ['Mild', 'Medium', 'Hot'],
    desc: 'Chickpeas in a dark, tangy amchoor gravy. Happens to be vegan.',
    adds: [['Jeera rice', 320]]
  },
  {
    id: 'c7', cat: 'curry', img: 'img/c7-dal.webp',
    name: 'Dal Makhani', hindi: 'दाल मखनी', price: 1090, veg: true, heat: 1,
    desc: 'Black lentils simmered overnight with butter and cream. Patience, served.',
    adds: [['Jeera rice', 320]]
  },
  {
    id: 'c8', cat: 'curry', img: 'img/c8-kofta.webp',
    name: 'Malai Kofta', hindi: 'मलाई कोफ़्ता', price: 1190, veg: true, heat: 1,
    desc: 'Paneer and potato dumplings in a cashew-sweet gravy. The gentlest thing we make.',
    adds: [['Jeera rice', 320]]
  },
  {
    id: 'c9', cat: 'curry', img: 'img/c9-prawn.webp',
    name: 'Goan Prawn Curry', hindi: 'झींगा करी', price: 1550, veg: false, heat: 2,
    spice: ['Medium', 'Hot'],
    desc: 'King prawns in a coconut and kokum curry from the coast.',
    adds: [['Jeera rice', 320]]
  },

  /* ---- Biryani & rice ---- */
  {
    id: 'b1', cat: 'biryani', img: 'img/b1-chickenbiryani.webp',
    name: 'Chicken Biryani', hindi: 'चिकन बिरयानी', price: 1390, veg: false, heat: 2,
    spice: ['Mild', 'Medium', 'Hot'],
    desc: 'Layered and sealed, opened at the table. Raita on the side, always.'
  },
  {
    id: 'b2', cat: 'biryani', img: 'img/b2-lambbiryani.webp',
    name: 'Lamb Biryani', hindi: 'गोश्त बिरयानी', price: 1490, veg: false, heat: 2,
    spice: ['Mild', 'Medium', 'Hot'],
    desc: 'Shoulder cooked down until it gives, buried in saffron rice.'
  },
  {
    id: 'b3', cat: 'biryani', img: 'img/b3-vegbiryani.webp',
    name: 'Vegetable Biryani', hindi: 'सब्ज़ बिरयानी', price: 1190, veg: true, heat: 1,
    spice: ['Mild', 'Medium'],
    desc: 'Seasonal vegetables and paneer through the long rice, cashews on top.'
  },
  {
    id: 'b4', cat: 'biryani', img: 'img/b4-jeera.webp',
    name: 'Jeera Rice', hindi: 'जीरा चावल', price: 420, veg: true, heat: 0,
    desc: 'Basmati tossed with toasted cumin and ghee.'
  },

  /* ---- Breads ---- */
  {
    id: 'n1', cat: 'bread', img: 'img/n1-naan.webp',
    name: 'Plain Naan', hindi: 'नान', price: 320, veg: true, heat: 0,
    desc: 'Slapped on the tandoor wall, brushed with butter as it comes off.'
  },
  {
    id: 'n2', cat: 'bread', img: 'img/n2-garlicnaan.webp',
    name: 'Garlic Naan', hindi: 'लहसुनी नान', price: 380, veg: true, heat: 0,
    desc: 'The plain one, improved by a fistful of garlic and coriander.'
  },
  {
    id: 'n3', cat: 'bread', img: 'img/n3-roti.webp',
    name: 'Tandoori Roti', hindi: 'तंदूरी रोटी', price: 290, veg: true, heat: 0,
    desc: 'Wholemeal, no butter, honest. Happens to be vegan.'
  },
  {
    id: 'n4', cat: 'bread', img: 'img/n4-breadbasket.webp',
    name: 'Bread Basket', hindi: 'रोटी की टोकरी', price: 890, veg: true, heat: 0,
    desc: 'Naan, garlic naan and roti together, because choosing is hard.'
  },

  /* ---- Sides & chutneys ---- */
  {
    id: 's1', cat: 'side', img: 'img/s1-raita.webp',
    name: 'Cucumber Raita', hindi: 'रायता', price: 350, veg: true, heat: 0,
    desc: 'Cold yoghurt, cucumber, roasted cumin. The fire brigade.'
  },
  {
    id: 's2', cat: 'side', img: 'img/s2-papadum.webp',
    name: 'Papadum & Chutneys', hindi: 'पापड़', price: 450, veg: true, heat: 0,
    desc: 'Four crisps with mango chutney, tamarind, and lime pickle.'
  },
  {
    id: 's3', cat: 'side', img: 'img/s3-chutney.webp',
    name: 'Chutney & Pickle Tray', hindi: 'चटनी', price: 390, veg: true, heat: 1,
    desc: 'Green chutney, tamarind, chilli oil, and a proper hot lime pickle.'
  },

  /* ---- Sweets ---- */
  {
    id: 'd1', cat: 'sweet', img: 'img/d1-gulabjamun.webp',
    name: 'Gulab Jamun', hindi: 'गुलाब जामुन', price: 550, veg: true, heat: 0,
    desc: 'Warm milk dumplings in rose and cardamom syrup. Two, so you can share badly.'
  },
  {
    id: 'd2', cat: 'sweet', img: 'img/d2-kulfi.webp',
    name: 'Kesar Pista Kulfi', hindi: 'केसर पिस्ता कुल्फ़ी', price: 590, veg: true, heat: 0,
    desc: 'Saffron and pistachio, frozen dense the old way. Our namesake.'
  },

  /* ---- To drink ---- */
  {
    id: 'dr1', cat: 'drink', img: 'img/dr1-lassi.webp',
    name: 'Mango Lassi', hindi: 'आम लस्सी', price: 450, veg: true, heat: 0,
    desc: 'Alphonso pulp and yoghurt, a thread of saffron on top.'
  },
  {
    id: 'dr2', cat: 'drink', img: 'img/dr2-chai.webp',
    name: 'Masala Chai', hindi: 'मसाला चाय', price: 320, veg: true, heat: 0,
    desc: 'Boiled properly with ginger and whole spices, sweet unless you say otherwise.'
  }
];

/* Chapters, in menu-book order. */
window.KESAR_CHAPTERS = [
  ['tandoor', 'From the Tandoor', 'तंदूर से'],
  ['curry',   'Curries',          'करी'],
  ['biryani', 'Biryani & Rice',   'बिरयानी'],
  ['bread',   'Breads',           'रोटियाँ'],
  ['side',    'Sides & Chutneys', 'साथ में'],
  ['sweet',   'Sweets',           'मीठा'],
  ['drink',   'To Drink',         'पीने के लिए']
];

/* Dawat — set feasts for the table. Priced whole, shown per head. */
window.KESAR_FEASTS = [
  {
    id: 'f2', people: 2, price: 5200, name: 'Dawat for Two',
    menu: ['Onion Bhaji', 'Chicken Tikka', 'Butter Chicken', 'Dal Makhani',
           'Jeera Rice', 'Two Plain Naan', 'Gulab Jamun to share']
  },
  {
    id: 'f4', people: 4, price: 9800, name: 'Dawat for Four',
    menu: ['Vegetable Samosa', 'Onion Bhaji', 'Chicken Tikka', 'Seekh Kebab',
           'Butter Chicken', 'Lamb Rogan Josh', 'Palak Paneer',
           'Chicken Biryani', 'Bread Basket', 'Cucumber Raita',
           'Gulab Jamun', 'Kesar Pista Kulfi']
  },
  {
    id: 'f6', people: 6, price: 13900, name: 'Dawat for Six',
    menu: ['Papadum & Chutneys', 'Vegetable Samosa', 'Paneer Tikka',
           'Chicken Tikka', 'Seekh Kebab', 'Tandoori Chicken — whole',
           'Butter Chicken', 'Lamb Rogan Josh', 'Chana Masala', 'Dal Makhani',
           'Lamb Biryani', 'Jeera Rice', 'Bread Basket ×2', 'Cucumber Raita',
           'Gulab Jamun ×2', 'Kesar Pista Kulfi ×2']
  }
];
