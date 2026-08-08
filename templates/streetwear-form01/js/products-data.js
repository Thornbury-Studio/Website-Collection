/* FORM/01 — the drop. Prices in cents. Twelve pieces, one system. */

window.F01_PRODUCTS = [
  {
    id: 't01', idx: '01', img: 'img/t01-tee.webp',
    name: 'OVERSIZED TEE', code: 'T-01', price: 8500,
    fabric: '420gsm heavyweight cotton / graphite',
    sizes: ['1', '2', '3'],
    desc: 'Boxy through the chest, dropped at the shoulder, cut past the hip. The whole system starts here.'
  },
  {
    id: 'l07', idx: '02', img: 'img/l07-longsleeve.webp',
    name: 'LONGSLEEVE', code: 'L-02', price: 9500,
    fabric: '420gsm heavyweight cotton / bone',
    sizes: ['1', '2', '3'],
    desc: 'The tee with more arm and more winter. Ribbed cuffs that stay where you push them.'
  },
  {
    id: 'h08', idx: '03', img: 'img/h08-hoodie.webp',
    name: 'HOODIE', code: 'H-03', price: 16000,
    fabric: '520gsm loopback fleece / black',
    sizes: ['1', '2', '3'],
    desc: 'Double-layered hood that stands on its own. Heavy enough to replace a jacket until it can’t.'
  },
  {
    id: 'j02', idx: '04', img: 'img/j02-jacket.webp',
    name: 'MODULAR SHELL', code: 'J-04', price: 34000,
    fabric: '3L waterproof shell / black',
    sizes: ['1', '2', '3'],
    desc: 'Detachable sleeve panels, taped seams, funnel collar. One jacket, four configurations.'
  },
  {
    id: 'v09', idx: '05', img: 'img/v09-vest.webp',
    name: 'UTILITY VEST', code: 'V-05', price: 22000,
    fabric: 'Ripstop nylon / silver-grey',
    sizes: ['1', '2', '3'],
    desc: 'Six pockets with actual jobs. Worn over the hoodie, under the shell, or as the whole idea.'
  },
  {
    id: 'p03', idx: '06', img: 'img/p03-trouser.webp',
    name: 'WIDE TROUSER', code: 'P-06', price: 21000,
    fabric: '4-way stretch twill / black',
    sizes: ['1', '2', '3'],
    desc: 'Articulated at the knee, wide to the floor. Pools over the sneaker exactly once.'
  },
  {
    id: 'c04', idx: '07', img: 'img/c04-cargo.webp',
    name: 'TECH CARGO', code: 'C-07', price: 19500,
    fabric: 'Ripstop nylon / silver-grey',
    sizes: ['1', '2', '3'],
    desc: 'Bellowed thigh pockets sized for real objects. Ankle cinches for when it rains sideways.'
  },
  {
    id: 's05', idx: '08', img: 'img/s05-sneaker.webp',
    name: 'SNEAKER', code: 'S-08', price: 23000,
    fabric: 'Layered mesh + rubber / monochrome',
    sizes: ['40', '41', '42', '43', '44', '45'],
    desc: 'Sculptural sole, quiet upper. Built to be the only loud thing in the outfit.'
  },
  {
    id: 'r10', idx: '09', img: 'img/r10-runner.webp',
    name: 'SOCK RUNNER', code: 'R-09', price: 25000,
    fabric: 'Knit upper + sculpted sole / white',
    sizes: ['40', '41', '42', '43', '44', '45'],
    desc: 'Pulls on like a sock, lands like a platform. The white piece in a black outfit.'
  },
  {
    id: 'b06', idx: '10', img: 'img/b06-bag.webp',
    name: 'CROSS-BODY', code: 'B-10', price: 12000,
    fabric: 'Ballistic nylon / black',
    sizes: ['OS'],
    desc: 'Worn tight across the chest. Holds a phone, keys, cards, and nothing you don’t need.'
  },
  {
    id: 't11', idx: '11', img: 'img/t11-tote.webp',
    name: 'TOTE', code: 'T-11', price: 9500,
    fabric: 'Ballistic nylon / black + bone',
    sizes: ['OS'],
    desc: 'Carries the gym, the groceries, or the laptop. Stands up on its own when full.'
  },
  {
    id: 'k12', idx: '12', img: 'img/k12-beanie.webp',
    name: 'BEANIE', code: 'K-12', price: 4500,
    fabric: 'Ribbed heavyweight knit / black',
    sizes: ['OS'],
    desc: 'Folded cuff, no label, no slogan. The quietest thing we make.'
  }
];

/* Lockers — three kits, one per model. pieces reference product ids. */
window.F01_LOCKERS = [
  {
    code: 'LOCKER/01', theme: 'THE COMMUTE', img: 'img/locker01.webp',
    who: 'MODEL A — DROP 02 CAMPAIGN',
    alt: 'A tall East Asian model in the oversized graphite tee, wide black trousers, monochrome sneakers and cross-body bag.',
    pieces: ['t01', 'p03', 's05', 'b06']
  },
  {
    code: 'LOCKER/02', theme: 'THE DOWNPOUR', img: 'img/locker02.webp',
    who: 'MODEL B — DROP 02 CAMPAIGN',
    alt: 'A Black model in the black modular shell zipped to the collar, wide trousers, white sock runners and a black beanie.',
    pieces: ['j02', 'p03', 'r10', 'k12']
  },
  {
    code: 'LOCKER/03', theme: 'THE LOAD-OUT', img: 'img/locker03.webp',
    who: 'MODEL C — DROP 02 CAMPAIGN',
    alt: 'A grey-haired model in his sixties wearing the silver utility vest over the bone longsleeve, silver cargos, sneakers, tote in hand.',
    pieces: ['v09', 'l07', 'c04', 's05', 't11']
  }
];
