/* FIRST CRACK — the business, as data. Prices, bags, the roast profile and
   the weekly schedule all live here so the page, the cart, the curve and
   the subscription arithmetic cannot disagree. */
window.FIRSTCRACK = {
  currency: 'SGD',
  grams: 250,
  roastDay: 4,                 /* Thursday, 0 = Sunday */
  cutoff: { day: 3, hour: 18 },/* Wednesday 18:00 */
  shipDay: 5,                  /* Friday */
  shipping: 4,
  freeOver: 40,
  subDiscount: 0.12,

  /* Bean temperature through the roast, minutes and degrees Celsius.
     Charge at 190, turning point at 1:30, first crack at 8:40 and 196,
     second crack around 12:30. */
  curve: [[0, 190], [0.75, 118], [1.5, 86], [2.5, 104], [4, 138], [6, 166], [8, 188], [8.67, 196], [9.5, 206], [10.5, 215], [11.5, 223], [12.5, 231], [13, 235]],
  firstCrack: 8.67,
  secondCrack: 12.5,
  stages: [{ at: 0, name: 'Drying' }, { at: 4.5, name: 'Maillard' }, { at: 8.67, name: 'Development' }],

  levels: {
    light:  { name: 'Light',  drop: 9.33,  loss: 12,   cup: 'Bright and floral, with a tea-like body and the acidity intact. Everything the farm put in the bean, and nothing from the roaster. For filter.', tastes: 'apricot, jasmine, black tea' },
    medium: { name: 'Medium', drop: 10.25, loss: 14,   cup: 'Sugars caramelised, acidity rounded into red fruit, more body. The roast and the origin in balance. Filter or espresso.', tastes: 'red apple, caramel, cocoa' },
    dark:   { name: 'Dark',   drop: 11.5,  loss: 16.5, cup: 'Bittersweet, heavy, low acidity, a little oil on the bean. The roast is now the loudest voice in the cup. Espresso, and anything with milk.', tastes: 'dark chocolate, molasses, cedar' }
  },

  bags: [
    { id: 'guji',    origin: 'Ethiopia', region: 'Guji',    producer: 'Smallholders around Hambela', process: 'Washed',      variety: '74158, local landrace', altitude: '2,050 – 2,200 m', notes: ['apricot', 'bergamot', 'black tea'],    roast: 'light',  drop: 9.4,  price: 24, best: 'Filter',           bag: 'matte', story: 'Picked by hand on farms of a hectare or two, fermented for thirty-six hours, dried on raised beds. The kind of lot that tastes like fruit before it tastes like coffee.' },
    { id: 'nyeri',   origin: 'Kenya',    region: 'Nyeri',   producer: 'A washing station above Karatina', process: 'Washed', variety: 'SL28, SL34',      altitude: '1,750 m',       notes: ['blackcurrant', 'tomato', 'brown sugar'], roast: 'light', drop: 9.6, price: 26, best: 'Filter',           bag: 'matte', story: 'Double-washed, soaked overnight, dried slowly under shade. Kenyan coffee is savoury and sharp at once; this one is the reason people fall for it.' },
    { id: 'huila',   origin: 'Colombia', region: 'Huila',   producer: 'One farm above Pitalito',       process: 'Washed',      variety: 'Caturra, Castillo',  altitude: '1,650 m',       notes: ['red apple', 'panela', 'cocoa'],       roast: 'medium', drop: 10.3, price: 22, best: 'Filter or espresso', bag: 'matte', story: 'The bag we sell most of. Clean, sweet, forgiving of your grinder. If you only buy one, buy this.' },
    { id: 'cerrado', origin: 'Brazil',   region: 'Cerrado', producer: 'A family fazenda near Patrocínio', process: 'Natural', variety: 'Yellow Catuaí',   altitude: '1,100 m',       notes: ['hazelnut', 'milk chocolate', 'dried fig'], roast: 'medium', drop: 10.6, price: 20, best: 'Espresso',       bag: 'matte', story: 'Dried whole in the cherry, so the fruit sugars soak into the bean. Low acidity, big body, the espresso that makes a flat white taste like dessert.' },
    { id: 'kerinci', origin: 'Sumatra',  region: 'Kerinci', producer: 'A cooperative on the volcano', process: 'Wet-hulled',  variety: 'Andung Sari, Sigarar Utang', altitude: '1,400 – 1,600 m', notes: ['cedar', 'dark chocolate', 'molasses'], roast: 'dark', drop: 11.4, price: 22, best: 'Espresso and milk', bag: 'matte', story: 'Hulled while still wet, which is why Sumatra tastes like nowhere else: earthy, heavy, almost savoury. Taken dark on purpose.' },
    { id: 'dawn',    origin: 'The Dawn', region: 'Colombia and Brazil', producer: 'Huila and Cerrado, blended after roasting', process: 'Washed and natural', variety: 'Caturra, Castillo, Catuaí', altitude: '1,100 – 1,650 m', notes: ['toffee', 'red apple', 'milk chocolate'], roast: 'medium', drop: 10.5, price: 19, best: 'Anything, every morning', bag: 'kraft', story: 'The blend for people who want the same cup every day. Two of our medium roasts, blended after roasting so each is dropped where it should be.' }
  ],

  notes: [
    { q: 'The roast date on the bag was two days before it arrived. I did not know that was possible from an online order.', who: 'Ai Ling', where: 'Tiong Bahru', how: 'Guji, on a V60' },
    { q: 'I moved the roast to dark on the site, ordered the Kerinci, and it tasted exactly like the description said it would. That has never happened to me.', who: 'Marcus', where: 'Katong', how: 'Kerinci, espresso' },
    { q: 'Subscription every two weeks, roaster’s pick. I have stopped thinking about coffee, which is the point.', who: 'Priya', where: 'Bukit Timah', how: 'The Dawn, moka pot' }
  ],

  log: [
    { bag: 'Guji',    date: '2026-09-10', drop: '9:24',  fc: '8:41', charge: '4.2 kg' },
    { bag: 'Nyeri',   date: '2026-09-10', drop: '9:36',  fc: '8:44', charge: '4.0 kg' },
    { bag: 'Huila',   date: '2026-09-10', drop: '10:18', fc: '8:38', charge: '6.0 kg' },
    { bag: 'Kerinci', date: '2026-09-10', drop: '11:24', fc: '8:40', charge: '4.5 kg' }
  ]
};
