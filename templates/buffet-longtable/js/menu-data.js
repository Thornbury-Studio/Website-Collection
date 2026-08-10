/* LONG TABLE — the seven-day rotation. One entry per weekday. */

window.LT_ROTATION = {
  mon: {
    carvery: 'Roast turkey, sage gravy',
    soup: 'Chicken & wild rice',
    global: { theme: 'Tex-Mex Monday', dishes: ['Beef barbacoa', 'Chicken tinga tacos', 'Elote corn'] },
    hot: ['Meatloaf & mash', 'Lemon-butter cod', 'Baked ziti'],
    dessert: 'Banana pudding'
  },
  tue: {
    carvery: 'Brown-sugar glazed ham',
    soup: 'Tomato basil',
    global: { theme: 'Trattoria Tuesday', dishes: ['Chicken parmigiana', 'Rigatoni alla vodka', 'Garlic knots'] },
    hot: ['Country fried steak', 'Herb roast chicken', 'Vegetable pot pie'],
    dessert: 'Tiramisu cups'
  },
  wed: {
    carvery: 'Herb-roasted chicken',
    soup: 'Corn chowder',
    global: { theme: 'Wok Wednesday', dishes: ['Mongolian beef', 'Sweet-chili shrimp', 'Vegetable lo mein'] },
    hot: ['Pot roast & carrots', 'Blackened tilapia', 'Mac & cheese bar'],
    dessert: 'Apple crumble, warm'
  },
  thu: {
    carvery: 'Roast pork loin, apple jus',
    soup: 'Minestrone',
    global: { theme: 'Curry Thursday', dishes: ['Butter chicken', 'Chana masala', 'Garlic naan'] },
    hot: ['Turkey tetrazzini', 'BBQ meatballs', 'Loaded baked potato bar'],
    dessert: 'Carrot cake'
  },
  fri: {
    carvery: 'Prime rib, au jus',
    soup: 'New England clam chowder',
    global: { theme: 'Fish-Fry Friday', dishes: ['Beer-battered walleye', 'Hushpuppies', 'House slaw'] },
    hot: ['Fried chicken', 'Shrimp scampi pasta', 'Green bean casserole'],
    dessert: 'Key lime pie'
  },
  sat: {
    carvery: 'Prime rib, au jus',
    soup: 'Beef & barley',
    global: { theme: 'Smokehouse Saturday', dishes: ['St. Louis ribs', 'Smoked sausage', 'Cornbread & honey butter'] },
    hot: ['Fried chicken', 'Cheese ravioli', 'Roasted root vegetables'],
    dessert: 'Chocolate layer cake'
  },
  sun: {
    carvery: 'Leg of lamb, mint jus',
    soup: 'French onion',
    global: { theme: 'Sunday Roast', dishes: ['Yorkshire puddings', 'Sage stuffing', 'Roasted brassicas'] },
    hot: ['Chicken & dumplings', 'Honey-glazed salmon', 'Scalloped potatoes'],
    dessert: 'Peach cobbler, warm'
  }
};

/* The six stations and what never leaves them. */
window.LT_STATIONS = [
  {
    id: 'cold', img: 'img/st-cold.webp', name: 'The Cold Bar',
    blurb: 'Forty feet of it. Built fresh at 10:30 every morning and tended all day.',
    always: ['Two dozen salad fixings', 'Three house dressings', 'Marinated vegetables', 'Fresh fruit, cut all day', 'Deviled eggs on weekends']
  },
  {
    id: 'soup', img: 'img/st-soup.webp', name: 'Soup & Bread',
    blurb: 'Two kettles minimum — the day’s soup and one old faithful — beside bread we bake in-house.',
    always: ['Soup of the day', 'Chicken noodle, always', 'Sourdough & honey-wheat, baked here', 'Cornbread', 'Whipped butter']
  },
  {
    id: 'carvery', img: 'img/st-carvery.webp', name: 'The Carvery',
    blurb: 'A carver on duty every service. The roast changes daily; the gravy never runs out.',
    always: ['Roast of the day, carved to order', 'Pan gravy & horseradish cream', 'Mashed potatoes', 'Seasonal vegetables']
  },
  {
    id: 'hotline', img: 'img/st-hotline.webp', name: 'The Hot Line',
    blurb: 'Six mains at any moment — three that rotate with the day, three that would cause a riot if removed.',
    always: ['Fried chicken (daily after 4pm)', 'Mac & cheese', 'Mashed potatoes & gravy', 'Three rotating mains', 'Seasonal sides']
  },
  {
    id: 'global', img: 'img/st-global.webp', name: 'The Global Station',
    blurb: 'A different cuisine every day, cooked to order where the menu allows. The wok gets loud.',
    always: ['Daily theme — see the rotation', 'Cooked-to-order where possible', 'Always one vegetarian main']
  },
  {
    id: 'dessert', img: 'img/st-dessert.webp', name: 'The Dessert Bar',
    blurb: 'One warm special a day, a soft-serve machine that has never once been empty, and the cookie tray.',
    always: ['Warm special of the day', 'Soft serve & toppings', 'Fresh-baked cookies', 'Seasonal pies', 'Sugar-free option daily']
  }
];
