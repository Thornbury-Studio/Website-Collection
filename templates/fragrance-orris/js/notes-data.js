/* ORRIS — note catalogue + pricing math */
window.ORRIS = window.ORRIS || {};

window.ORRIS.NOTES = [
  { id: 'bergamot', name: 'Bergamot', tier: 'top', family: 'Citrus', origin: 'Calabria', lasting: '15–25 min', intensity: 'Bright', hue: [210, 185, 95], cost: 12, weight: 1, blurb: 'Cold rind and green pith — the first lift before iris settles.' },
  { id: 'pink-pepper', name: 'Pink Pepper', tier: 'top', family: 'Spice', origin: 'Réunion', lasting: '20–35 min', intensity: 'Dry spark', hue: [196, 92, 98], cost: 14, weight: 1.1, blurb: 'A dry spark that clears the nose without heat.' },
  { id: 'yuzu', name: 'Yuzu', tier: 'top', family: 'Citrus', origin: 'Kōchi', lasting: '15–30 min', intensity: 'Green zest', hue: [232, 210, 110], cost: 16, weight: 1.05, blurb: 'Wet stone citrus — sharper and greener than lemon.' },
  { id: 'neroli', name: 'Neroli', tier: 'top', family: 'Floral', origin: 'Tunisia', lasting: '25–40 min', intensity: 'Sunlit', hue: [240, 230, 210], cost: 18, weight: 1.15, blurb: 'Orange blossom at noon — clean, not sugary.' },
  { id: 'orris', name: 'Orris Butter', tier: 'heart', family: 'Iris', origin: 'Florence', lasting: '4–6 hrs', intensity: 'Powder', hue: [168, 150, 178], cost: 42, weight: 1.8, blurb: 'Aged rhizome butter — powdered root and violet hush.' },
  { id: 'rose', name: 'Rose Absolute', tier: 'heart', family: 'Floral', origin: 'Isparta', lasting: '3–5 hrs', intensity: 'Damask', hue: [188, 110, 128], cost: 36, weight: 1.5, blurb: 'Damask rose absolute — velvet petal, not candy.' },
  { id: 'magnolia', name: 'Magnolia', tier: 'heart', family: 'Floral', origin: 'Sichuan', lasting: '2–4 hrs', intensity: 'Cream', hue: [230, 220, 228], cost: 28, weight: 1.3, blurb: 'Cream petal and cool air — soft without soap.' },
  { id: 'jasmine', name: 'Jasmine Sambac', tier: 'heart', family: 'Floral', origin: 'Madurai', lasting: '3–5 hrs', intensity: 'Night bloom', hue: [220, 205, 160], cost: 34, weight: 1.45, blurb: 'Night bloom with soft heat — indolic, not loud.' },
  { id: 'vetiver', name: 'Vetiver', tier: 'base', family: 'Wood', origin: 'Haiti', lasting: '8–12 hrs', intensity: 'Root smoke', hue: [96, 110, 78], cost: 24, weight: 1.4, blurb: 'Rooted smoke and dry grass — the spine of the trail.' },
  { id: 'ambroxan', name: 'Ambroxan', tier: 'base', family: 'Amber', origin: 'Lab', lasting: '10–14 hrs', intensity: 'Mineral', hue: [214, 188, 142], cost: 22, weight: 1.35, blurb: 'Mineral warmth worn close to skin.' },
  { id: 'cedar', name: 'Cedar Atlas', tier: 'base', family: 'Wood', origin: 'Morocco', lasting: '6–10 hrs', intensity: 'Clean wood', hue: [140, 112, 86], cost: 18, weight: 1.25, blurb: 'Pencil shavings and dry cupboard wood.' },
  { id: 'labdanum', name: 'Labdanum', tier: 'base', family: 'Resin', origin: 'Crete', lasting: '8–12 hrs', intensity: 'Resin', hue: [120, 78, 54], cost: 26, weight: 1.55, blurb: 'Sticky dusk resin — seals the formula.' }
];

window.ORRIS.HOUSE = [
  {
    id: 'iris-stone',
    name: 'Iris Stone',
    line: 'Cool powder over wet limestone.',
    formula: ['bergamot', 'orris', 'vetiver'],
    price: 168,
    size: '50 ml',
    stock: 14,
    ships: '5 working days',
    wear: 'Day · cool weather',
    image: 'img/scent-iris-stone.png'
  },
  {
    id: 'violet-ash',
    name: 'Violet Ash',
    line: 'Smoke at the edge of a bloom.',
    formula: ['pink-pepper', 'rose', 'labdanum'],
    price: 182,
    size: '50 ml',
    stock: 9,
    ships: '5 working days',
    wear: 'Evening · autumn',
    image: 'img/scent-violet-ash.png'
  },
  {
    id: 'yuzu-veil',
    name: 'Yuzu Veil',
    line: 'Green citrus held in glass.',
    formula: ['yuzu', 'magnolia', 'ambroxan'],
    price: 156,
    size: '50 ml',
    stock: 22,
    ships: '3 working days',
    wear: 'Day · warm weather',
    image: 'img/scent-yuzu-veil.png'
  },
  {
    id: 'sambac-dusk',
    name: 'Sambac Dusk',
    line: 'Night flower on warm wood.',
    formula: ['neroli', 'jasmine', 'cedar'],
    price: 174,
    size: '50 ml',
    stock: 11,
    ships: '5 working days',
    wear: 'Night · humid air',
    image: 'img/scent-sambac-dusk.png'
  },
  {
    id: 'root-mirror',
    name: 'Root Mirror',
    line: 'Orris reflected in vetiver.',
    formula: ['bergamot', 'orris', 'ambroxan'],
    price: 196,
    size: '50 ml',
    stock: 6,
    ships: '7 working days',
    wear: 'All day · signature',
    image: 'img/scent-root-mirror.png'
  },
  {
    id: 'resin-letter',
    name: 'Resin Letter',
    line: 'A sealed note, opened late.',
    formula: ['pink-pepper', 'magnolia', 'labdanum'],
    price: 188,
    size: '50 ml',
    stock: 8,
    ships: '5 working days',
    wear: 'Evening · cool rooms',
    image: 'img/scent-resin-letter.png'
  }
];

window.ORRIS.BASE_KIT = 48;
window.ORRIS.MAX_PER_TIER = 2;

window.ORRIS.byId = function (id) {
  for (var i = 0; i < window.ORRIS.NOTES.length; i++) {
    if (window.ORRIS.NOTES[i].id === id) return window.ORRIS.NOTES[i];
  }
  return null;
};

window.ORRIS.priceFormula = function (ids) {
  var total = window.ORRIS.BASE_KIT;
  var weight = 0;
  var rgb = [0, 0, 0];
  var count = 0;
  for (var i = 0; i < ids.length; i++) {
    var n = window.ORRIS.byId(ids[i]);
    if (!n) continue;
    total += n.cost;
    weight += n.weight;
    rgb[0] += n.hue[0];
    rgb[1] += n.hue[1];
    rgb[2] += n.hue[2];
    count++;
  }
  if (count) {
    rgb = [Math.round(rgb[0] / count), Math.round(rgb[1] / count), Math.round(rgb[2] / count)];
  } else {
    rgb = [176, 122, 58];
  }
  var concentration = Math.min(100, Math.round(18 + weight * 14));
  return { price: total, concentration: concentration, rgb: rgb, count: count };
};
