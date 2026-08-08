/* MORROW & FINCH — the catalogue. Prices in pence. */

window.MF_DEPTS = [
  ['outerwear',  'Department I',   'Outerwear'],
  ['tailoring',  'Department II',  'Tailoring'],
  ['shirting',   'Department III', 'Shirting'],
  ['knitwear',   'Department IV',  'Knitwear'],
  ['accessories','Department V',   'Accessories']
];

window.MF_CATALOG = [
  {
    id: 'p01', plate: 'I', dept: 'outerwear', img: 'img/p01-overcoat.webp',
    name: 'The Kensington Overcoat', price: 39500,
    fabric: '22oz camel wool, fully canvassed',
    sizes: ['38', '40', '42', '44', '46'],
    desc: 'Double-breasted with peak lapels, cut long the way a coat was cut when a man walked ' +
      'everywhere. The cloth is a 22-ounce camel wool that will outlast the buttons, and the ' +
      'buttons are horn.',
    note: 'As photographed on our man on Ledbury Row.'
  },
  {
    id: 'p02', plate: 'II', dept: 'outerwear', img: 'img/p02-flightjacket.webp',
    name: 'The Aldgate Flight Jacket', price: 42500,
    fabric: 'Seal-brown horsehide, shearling collar',
    sizes: ['38', '40', '42', '44'],
    desc: 'Horsehide takes ten years to give in and thirty to give up. Deep shearling collar, ' +
      'heavy brass zip, and a fit close enough to sit under the Kensington in January.'
  },
  {
    id: 'p03', plate: 'III', dept: 'tailoring', img: 'img/p03-trouser.webp',
    name: 'The Grafton Trouser', price: 12000,
    fabric: 'Charcoal 14oz worsted wool',
    sizes: ['30', '32', '34', '36', '38'],
    desc: 'High in the rise, double forward pleats, side adjusters in place of a belt, and a leg ' +
      'wide enough to break cleanly over the shoe. Turned up two inches, as is right.'
  },
  {
    id: 'p04', plate: 'IV', dept: 'tailoring', img: 'img/p04-waistcoat.webp',
    name: 'The Marlow Waistcoat', price: 9500,
    fabric: 'Brown herringbone wool, horn buttons',
    sizes: ['38', '40', '42', '44'],
    desc: 'Double-breasted, six horn buttons, a fob pocket for a watch you wind by hand. Wear it ' +
      'and be the best-dressed man at any table you sit down to.'
  },
  {
    id: 'p05', plate: 'V', dept: 'shirting', img: 'img/p05-oxford.webp',
    name: 'The Albany Oxford', price: 8500,
    fabric: 'White cotton oxford, soft unfused collar',
    sizes: ['14½', '15', '15½', '16', '16½'],
    desc: 'The plain white oxford, which is to say the shirt that carries everything else. Soft ' +
      'collar, mother-of-pearl buttons, cut full through the body for a day of actual work.'
  },
  {
    id: 'p06', plate: 'VI', dept: 'shirting', img: 'img/p06-clubcollar.webp',
    name: 'The Clerkenwell Stripe', price: 9000,
    fabric: 'Bengal stripe cotton, club collar',
    sizes: ['14½', '15', '15½', '16', '16½'],
    desc: 'A faded burgundy bengal stripe under a rounded club collar. The collar that every ' +
      'photograph of 1934 turns out to have been wearing.'
  },
  {
    id: 'p07', plate: 'VII', dept: 'knitwear', img: 'img/p07-shawlcardigan.webp',
    name: 'The Hebrides Cardigan', price: 16500,
    fabric: 'Cream aran wool, leather football buttons',
    sizes: ['S', 'M', 'L', 'XL'],
    desc: 'Cabled heavy enough to stand in for a jacket, with a shawl collar that meets the back ' +
      'of your neck like a scarf you never have to find. Knitted, not assembled.'
  },
  {
    id: 'p08', plate: 'VIII', dept: 'knitwear', img: 'img/p08-fairisle.webp',
    name: 'The Norfolk Fair Isle', price: 14500,
    fabric: 'Shetland wool, traditional pattern',
    sizes: ['S', 'M', 'L', 'XL'],
    desc: 'Muted browns and burgundies in a pattern older than the shop. Worn under tweed or ' +
      'over an oxford; correct either way.'
  },
  {
    id: 'p09', plate: 'IX', dept: 'accessories', img: 'img/p09-gloves.webp',
    name: 'Kidskin Gloves', price: 5500,
    fabric: 'Chestnut kidskin, wool lined',
    sizes: ['8', '8½', '9', '9½'],
    desc: 'Cut close, stitched by hand, lined in wool. The pair our man on Ledbury Row is ' +
      'holding rather than wearing, which is also correct.'
  },
  {
    id: 'p10', plate: 'X', dept: 'accessories', img: 'img/p10-scarf.webp',
    name: 'The Lambswool Scarf', price: 4500,
    fabric: 'Lambswool, burgundy and cream block stripe',
    sizes: ['One size'],
    desc: 'Long enough to wrap twice, soft enough to forget. The burgundy is dyed to match the ' +
      'Clerkenwell stripe, because we are that sort of shop.'
  }
];
