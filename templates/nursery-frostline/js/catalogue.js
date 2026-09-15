/* FROSTLINE — the stock list.
   One source of truth for every page. The gate on index.html, the specimen
   entries on catalogue.html and the lifting table on order.html all read
   this array; nothing about a plant is typed twice.

   `rhs` is the RHS hardiness rating. `floor` is the bottom of that rating's
   band in °C and is the number the gate actually compares against:
     H3  −5 … 1      half hardy, needs a sheltered wall
     H4  −10 … −5    hardy in an average winter
     H5  −15 … −10   hardy in a cold winter
     H6  −20 … −15   hardy in a very cold winter
     H7  below −20   very hardy
   H7 has no published bottom, so it is modelled at −25 for arithmetic.

   aspect  — walls the plant will take: N E S W
   wind    — 'exposed' takes open ground, 'sheltered' needs a lee
   soil    — moisture bands tolerated: dry moist wet
   ph      — acid neutral alkaline
   form    — which drawn specimen glyph the entry uses
   note    — the grower's own line, not marketing copy
*/
(function (root) {
  'use strict';

  var FLOOR = { H3: -5, H4: -10, H5: -15, H6: -20, H7: -25 };

  var STOCK = [
    {
      genus: 'Dryas', species: 'octopetala', authority: 'L.',
      common: 'Mountain avens', family: 'Rosaceae',
      rhs: 'H7', h: 10, w: 60, aspect: ['S', 'E', 'W'], wind: 'exposed',
      soil: ['dry'], ph: ['alkaline', 'neutral'], form: 'mat',
      note: 'Arctic–alpine. Grows on limestone scree above the treeline. Wants the worst corner you have.',
      lift: 'Nov–Mar', stock: 'field', price: 9
    },
    {
      genus: 'Thymus', species: 'serpyllum', authority: 'L.',
      common: 'Wild thyme', family: 'Lamiaceae',
      rhs: 'H7', h: 5, w: 45, aspect: ['S', 'E', 'W'], wind: 'exposed',
      soil: ['dry'], ph: ['alkaline', 'neutral'], form: 'mat',
      note: 'Drought is not a problem. Winter wet at the crown is what kills it.',
      lift: 'Mar–May', stock: 'frame', price: 6
    },
    {
      genus: 'Geranium', species: '‘Rozanne’', authority: '',
      common: 'Cranesbill', family: 'Geraniaceae',
      rhs: 'H7', h: 50, w: 100, aspect: ['N', 'E', 'S', 'W'], wind: 'exposed',
      soil: ['moist'], ph: ['acid', 'neutral', 'alkaline'], form: 'mound',
      note: 'Sterile, so it never seeds about and never stops flowering. The plant we sell when someone has no idea what they want.',
      lift: 'Oct–Apr', stock: 'field', price: 11
    },
    {
      genus: 'Persicaria', species: 'amplexicaulis', authority: '‘Firetail’',
      common: 'Red bistort', family: 'Polygonaceae',
      rhs: 'H7', h: 120, w: 120, aspect: ['N', 'E', 'S', 'W'], wind: 'exposed',
      soil: ['moist', 'wet'], ph: ['acid', 'neutral', 'alkaline'], form: 'spike',
      note: 'Will take a wet north-facing border that nothing else tolerates, and flower until the first hard frost.',
      lift: 'Oct–Apr', stock: 'field', price: 12
    },
    {
      genus: 'Sanguisorba', species: 'officinalis', authority: '‘Red Thunder’',
      common: 'Great burnet', family: 'Rosaceae',
      rhs: 'H7', h: 120, w: 60, aspect: ['N', 'E', 'S', 'W'], wind: 'exposed',
      soil: ['moist', 'wet'], ph: ['acid', 'neutral', 'alkaline'], form: 'spike',
      note: 'Bottle-brush heads on wire stems. Stands until February, then you cut it and it does it again.',
      lift: 'Oct–Apr', stock: 'field', price: 13
    },
    {
      genus: 'Astrantia', species: 'major', authority: '‘Claret’',
      common: 'Masterwort', family: 'Apiaceae',
      rhs: 'H7', h: 70, w: 45, aspect: ['N', 'E'], wind: 'sheltered',
      soil: ['moist'], ph: ['neutral', 'alkaline'], form: 'umbel',
      note: 'One of the few things that flowers properly in real shade. Resents drying out; it will not forgive you twice.',
      lift: 'Oct–Apr', stock: 'field', price: 12
    },
    {
      genus: 'Molinia', species: 'caerulea', authority: 'subsp. arundinacea ‘Transparent’',
      common: 'Purple moor grass', family: 'Poaceae',
      rhs: 'H6', h: 200, w: 90, aspect: ['S', 'E', 'W'], wind: 'exposed',
      soil: ['moist'], ph: ['acid', 'neutral'], form: 'grass',
      note: 'You look through it, not at it. Two metres of flower stem on a 60 cm clump of leaf.',
      lift: 'Mar–May', stock: 'field', price: 14
    },
    {
      genus: 'Helleborus', species: '× hybridus', authority: '',
      common: 'Lenten rose', family: 'Ranunculaceae',
      rhs: 'H6', h: 45, w: 45, aspect: ['N', 'E'], wind: 'sheltered',
      soil: ['moist'], ph: ['neutral', 'alkaline'], form: 'mound',
      note: 'Flowers in February under deciduous shade. Cut the old leaves off in January or the new flowers arrive behind a screen of them.',
      lift: 'Oct–Mar', stock: 'frame', price: 16
    },
    {
      genus: 'Rodgersia', species: 'podophylla', authority: 'A.Gray',
      common: 'Rodgersia', family: 'Saxifragaceae',
      rhs: 'H6', h: 120, w: 120, aspect: ['N', 'E'], wind: 'sheltered',
      soil: ['wet'], ph: ['acid', 'neutral'], form: 'palmate',
      note: 'Bronze palmate leaves the size of a hand. Needs genuinely wet ground and shelter — wind shreds it by July.',
      lift: 'Oct–Apr', stock: 'field', price: 17
    },
    {
      genus: 'Cornus', species: 'sanguinea', authority: '‘Midwinter Fire’',
      common: 'Dogwood', family: 'Cornaceae',
      rhs: 'H6', h: 200, w: 250, aspect: ['S', 'E', 'W'], wind: 'exposed',
      soil: ['moist', 'wet'], ph: ['acid', 'neutral', 'alkaline'], form: 'stems',
      note: 'Grown for one-year stems, so it is coppiced hard every March. Left uncut it is a dull green shrub.',
      lift: 'Nov–Mar', stock: 'field', price: 15
    },
    {
      genus: 'Eryngium', species: 'giganteum', authority: 'M.Bieb.',
      common: 'Miss Willmott’s ghost', family: 'Apiaceae',
      rhs: 'H5', h: 90, w: 30, aspect: ['S', 'W'], wind: 'exposed',
      soil: ['dry'], ph: ['neutral', 'alkaline'], form: 'thistle',
      note: 'Biennial: rosette one year, then a silver candelabra and death. It seeds itself, so it never actually leaves.',
      lift: 'Mar–May', stock: 'frame', price: 10
    },
    {
      genus: 'Amsonia', species: 'hubrichtii', authority: 'Woodson',
      common: 'Threadleaf bluestar', family: 'Apocynaceae',
      rhs: 'H5', h: 90, w: 90, aspect: ['S', 'W'], wind: 'exposed',
      soil: ['moist'], ph: ['neutral', 'acid'], form: 'plume',
      note: 'Pale blue for a fortnight in May and then the best autumn colour of any perennial we grow. Buy it for October.',
      lift: 'Oct–Apr', stock: 'field', price: 15
    },
    {
      genus: 'Sesleria', species: 'autumnalis', authority: '(Scop.) F.W.Schultz',
      common: 'Autumn moor grass', family: 'Poaceae',
      rhs: 'H5', h: 40, w: 40, aspect: ['S', 'E', 'W'], wind: 'exposed',
      soil: ['dry', 'moist'], ph: ['alkaline', 'neutral'], form: 'grass',
      note: 'Yellow-green, evergreen, and it holds a line. Plant it in drifts of nine or do not bother.',
      lift: 'Mar–May', stock: 'field', price: 8
    },
    {
      genus: 'Stipa', species: 'gigantea', authority: 'Link',
      common: 'Golden oats', family: 'Poaceae',
      rhs: 'H4', h: 250, w: 120, aspect: ['S', 'W'], wind: 'exposed',
      soil: ['dry'], ph: ['neutral', 'alkaline'], form: 'grass',
      note: 'Evergreen base, oat heads at two and a half metres. Cold does not kill it here — a wet winter at the crown does.',
      lift: 'Mar–May', stock: 'frame', price: 18
    },
    {
      genus: 'Salvia', species: '‘Amistad’', authority: '',
      common: 'Sage', family: 'Lamiaceae',
      rhs: 'H3', h: 120, w: 60, aspect: ['S', 'W'], wind: 'sheltered',
      soil: ['moist'], ph: ['acid', 'neutral', 'alkaline'], form: 'spike',
      note: 'Flowers from June to the first frost, which is why everyone asks for it. It is also the first thing in this list to die in a cold garden.',
      lift: 'Apr–Jun', stock: 'frame', price: 13, flagship: true
    },
    {
      genus: 'Melianthus', species: 'major', authority: 'L.',
      common: 'Honey bush', family: 'Francoaceae',
      rhs: 'H3', h: 250, w: 250, aspect: ['S', 'W'], wind: 'sheltered',
      soil: ['moist'], ph: ['acid', 'neutral', 'alkaline'], form: 'palmate',
      note: 'Glaucous sawtooth foliage, nothing else looks like it. South African, and it has no business being outside in a hard winter.',
      lift: 'Apr–Jun', stock: 'frame', price: 22, flagship: true
    }
  ];

  var ASPECT_NAME = { N: 'north', E: 'east', S: 'south', W: 'west' };
  var SOIL_NAME = { dry: 'dry', moist: 'moist', wet: 'wet' };

  /* Verdict for one plant on one site.
     Returns { rank: 'thrive'|'survive'|'fail', reason: string, headroom: number }
     headroom is °C of cold margin — how much colder the plant can take than
     the site actually gets. Negative means the plant dies of cold. */
  function assess(plant, site) {
    var floor = FLOOR[plant.rhs];
    var headroom = site.min - floor;          // site −18, floor −25 → 7 °C spare
    var faults = [];

    if (headroom < 0) {
      /* the rating itself is already shown as a badge beside the name, so
         the reason states the consequence and not the rating again */
      return {
        rank: 'fail',
        headroom: headroom,
        reason: 'Hardy to −' + Math.abs(floor) +
                ' °C. Your site reaches −' + Math.abs(site.min) + ' °C.'
      };
    }
    if (plant.aspect.indexOf(site.aspect) === -1) {
      faults.push('Will not take a ' + ASPECT_NAME[site.aspect] + '-facing position.');
    }
    if (plant.wind === 'sheltered' && site.exposed) {
      faults.push('Needs a lee. Open ground shreds it.');
    }
    if (plant.soil.indexOf(site.soil) === -1) {
      faults.push('Wants ' + plant.soil.map(function (s) { return SOIL_NAME[s]; }).join(' or ') +
                  ' ground. Yours is ' + SOIL_NAME[site.soil] + '.');
    }
    if (plant.ph.indexOf(site.ph) === -1) {
      faults.push('Wants ' + plant.ph.join(' or ') + ' soil, not ' + site.ph + '.');
    }

    if (faults.length >= 2) {
      return { rank: 'fail', headroom: headroom, reason: faults[0] };
    }
    if (faults.length === 1) {
      return { rank: 'survive', headroom: headroom, reason: faults[0] };
    }
    if (headroom < 5) {
      return {
        rank: 'survive',
        headroom: headroom,
        reason: 'Only ' + headroom + ' °C of margin. It will live, but a bad February will mark it.'
      };
    }
    return {
      rank: 'thrive',
      headroom: headroom,
      reason: headroom + ' °C colder than it needs. Nothing about your site troubles it.'
    };
  }

  function binomial(plant) {
    return plant.genus + ' ' + plant.species;
  }

  root.FROSTLINE = {
    stock: STOCK,
    floor: FLOOR,
    assess: assess,
    binomial: binomial
  };
})(window);
