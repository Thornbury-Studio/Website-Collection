/* Copper Ridge Cartridge Co. - catalogue. Prices in cents. */

window.CR_DEPTS = [
  ['handgun', 'Handgun'],
  ['rifle', 'Rifle'],
  ['shotgun', 'Shotgun'],
  ['rimfire', 'Rimfire'],
  ['reloading', 'Reloading']
];

window.CR_USES = ['target', 'hunting', 'defense', 'match', 'reloading'];

window.CR_CATALOG = [
  {
    id: 'cr-9mm-115-fmj', sku: 'CR-9-115-50', dept: 'handgun', brand: 'Copper Ridge',
    name: '9mm Luger 115gr FMJ', caliber: '9mm Luger', grain: 115, bulletType: 'FMJ',
    use: 'target', qty: 50, price: 1499, pricePerRound: 30, velocity: 1180, energy: 356,
    caseType: 'Brass', stock: 'in', stockQty: 420, hazmat: true, weightClass: 1,
    restrictions: [], img: 'img/plate-9mm.jpg',
    caseOf: 'cr-9mm-case',
    desc: 'House 9mm FMJ. Box of 50. Brass case. In stock · Missoula.'
  },
  {
    id: 'cr-9mm-124-jhp', sku: 'CR-9-124-JHP-20', dept: 'handgun', brand: 'Copper Ridge',
    name: '9mm Luger 124gr JHP', caliber: '9mm Luger', grain: 124, bulletType: 'JHP',
    use: 'defense', qty: 20, price: 2199, pricePerRound: 110, velocity: 1150, energy: 364,
    caseType: 'Brass', stock: 'in', stockQty: 86, hazmat: true, weightClass: 1,
    restrictions: ['CA', 'NY', 'DC', 'MA', 'NJ', 'CT', 'HI', 'IL'], img: 'img/plate-jhp.jpg',
    desc: '20-rd JHP defensive box. Ground only. Check state before checkout.'
  },
  {
    id: 'fi-9mm-147', sku: 'FI-9-147-50', dept: 'handgun', brand: 'Federal',
    name: 'Federal American Eagle 9mm 147gr FMJ', caliber: '9mm Luger', grain: 147, bulletType: 'FMJ',
    use: 'target', qty: 50, price: 1799, pricePerRound: 36, velocity: 1000, energy: 326,
    caseType: 'Brass', stock: 'in', stockQty: 210, hazmat: true, weightClass: 1,
    restrictions: [], img: 'img/plate-9mm.jpg',
    desc: '147gr training load. Soft recoil. Box of 50.'
  },
  {
    id: 'win-45-230', sku: 'WIN-45-230-50', dept: 'handgun', brand: 'Winchester',
    name: 'Winchester USA .45 ACP 230gr FMJ', caliber: '.45 ACP', grain: 230, bulletType: 'FMJ',
    use: 'target', qty: 50, price: 2899, pricePerRound: 58, velocity: 835, energy: 356,
    caseType: 'Brass', stock: 'low', stockQty: 24, hazmat: true, weightClass: 2,
    restrictions: [], img: 'img/plate-45.jpg',
    desc: '230gr FMJ. Low stock. Ground hazmat.'
  },
  {
    id: 'speer-40-180', sku: 'SP-40-180-50', dept: 'handgun', brand: 'Speer',
    name: 'Speer Lawman .40 S&W 180gr TMJ', caliber: '.40 S&W', grain: 180, bulletType: 'TMJ',
    use: 'target', qty: 50, price: 2499, pricePerRound: 50, velocity: 990, energy: 392,
    caseType: 'Brass', stock: 'in', stockQty: 140, hazmat: true, weightClass: 1,
    restrictions: [], img: 'img/plate-45.jpg',
    desc: 'TMJ practice ammo. Matched to Gold Dot duty profile.'
  },
  {
    id: 'horn-357-158', sku: 'HA-357-158-25', dept: 'handgun', brand: 'Hornady',
    name: 'Hornady Critical Defense .357 Mag 158gr FTX', caliber: '.357 Magnum', grain: 158, bulletType: 'FTX',
    use: 'defense', qty: 25, price: 3499, pricePerRound: 140, velocity: 1250, energy: 548,
    caseType: 'Nickel', stock: 'in', stockQty: 62, hazmat: true, weightClass: 1,
    restrictions: ['CA', 'NY', 'DC', 'MA', 'NJ', 'CT', 'HI'], img: 'img/plate-jhp.jpg',
    desc: 'FTX defensive revolver load. Nickel cases. State limits apply.'
  },
  {
    id: 'cr-380-95', sku: 'CR-380-95-50', dept: 'handgun', brand: 'Copper Ridge',
    name: '.380 ACP 95gr FMJ', caliber: '.380 ACP', grain: 95, bulletType: 'FMJ',
    use: 'target', qty: 50, price: 1899, pricePerRound: 38, velocity: 980, energy: 203,
    caseType: 'Brass', stock: 'in', stockQty: 175, hazmat: true, weightClass: 1,
    restrictions: [], img: 'img/plate-9mm.jpg',
    desc: 'Compact practice ammo. Box of 50.'
  },
  {
    id: 'magtech-38-158', sku: 'MT-38-158-50', dept: 'handgun', brand: 'Magtech',
    name: 'Magtech .38 Special 158gr LRN', caliber: '.38 Special', grain: 158, bulletType: 'LRN',
    use: 'target', qty: 50, price: 2299, pricePerRound: 46, velocity: 755, energy: 200,
    caseType: 'Brass', stock: 'in', stockQty: 118, hazmat: true, weightClass: 1,
    restrictions: [], img: 'img/plate-45.jpg',
    desc: 'Lead round nose. Revolver practice. Box of 50.'
  },
  {
    id: 'cr-223-55', sku: 'CR-223-55-20', dept: 'rifle', brand: 'Copper Ridge',
    name: '.223 Rem 55gr FMJBT', caliber: '.223 Remington', grain: 55, bulletType: 'FMJBT',
    use: 'target', qty: 20, price: 1199, pricePerRound: 60, velocity: 3240, energy: 1282,
    caseType: 'Brass', stock: 'in', stockQty: 540, hazmat: true, weightClass: 1,
    restrictions: [], img: 'img/plate-556.jpg',
    caseOf: 'cr-223-case',
    desc: 'House .223 FMJBT. 20-rd box. In stock · Missoula.'
  },
  {
    id: 'pmc-556-62', sku: 'PMC-556-62-20', dept: 'rifle', brand: 'PMC',
    name: 'PMC X-TAC 5.56 NATO 62gr Green Tip', caliber: '5.56 NATO', grain: 62, bulletType: 'M855',
    use: 'target', qty: 20, price: 1399, pricePerRound: 70, velocity: 3100, energy: 1323,
    caseType: 'Brass', stock: 'in', stockQty: 190, hazmat: true, weightClass: 1,
    restrictions: ['CA', 'NY', 'DC', 'NJ', 'CT', 'MA', 'HI', 'IL'], img: 'img/plate-556.jpg',
    desc: 'M855-style green tip. Restricted in listed states.'
  },
  {
    id: 'fed-308-150', sku: 'FI-308-150-20', dept: 'rifle', brand: 'Federal',
    name: 'Federal Power-Shok .308 Win 150gr Soft Point', caliber: '.308 Winchester', grain: 150, bulletType: 'SP',
    use: 'hunting', qty: 20, price: 2899, pricePerRound: 145, velocity: 2820, energy: 2648,
    caseType: 'Brass', stock: 'in', stockQty: 96, hazmat: true, weightClass: 2,
    restrictions: [], img: 'img/plate-308.jpg',
    desc: 'Soft-point hunting load. 20-rd box. Ground only.'
  },
  {
    id: 'horn-65cm-140', sku: 'HA-65-140-20', dept: 'rifle', brand: 'Hornady',
    name: 'Hornady Match 6.5 Creedmoor 140gr ELD-M', caliber: '6.5 Creedmoor', grain: 140, bulletType: 'ELD-M',
    use: 'match', qty: 20, price: 3699, pricePerRound: 185, velocity: 2710, energy: 2283,
    caseType: 'Brass', stock: 'in', stockQty: 74, hazmat: true, weightClass: 2,
    restrictions: [], img: 'img/plate-match.jpg',
    desc: 'Match ELD-M. Lot number on box. 20 ct.'
  },
  {
    id: 'win-3006-180', sku: 'WIN-3006-180-20', dept: 'rifle', brand: 'Winchester',
    name: 'Winchester Super-X .30-06 180gr Power-Point', caliber: '.30-06 Springfield', grain: 180, bulletType: 'PP',
    use: 'hunting', qty: 20, price: 3199, pricePerRound: 160, velocity: 2700, energy: 2914,
    caseType: 'Brass', stock: 'low', stockQty: 18, hazmat: true, weightClass: 2,
    restrictions: [], img: 'img/plate-308.jpg',
    desc: 'Power-Point 180gr. Low stock.'
  },
  {
    id: 'cr-300blk-220', sku: 'CR-300-220-20', dept: 'rifle', brand: 'Copper Ridge',
    name: '.300 Blackout 220gr Subsonic FMJ', caliber: '.300 Blackout', grain: 220, bulletType: 'FMJ',
    use: 'target', qty: 20, price: 2499, pricePerRound: 125, velocity: 1020, energy: 508,
    caseType: 'Brass', stock: 'in', stockQty: 88, hazmat: true, weightClass: 1,
    restrictions: [], img: 'img/plate-556.jpg',
    desc: 'Subsonic 220gr. Not a hunting load. 20 ct.'
  },
  {
    id: 'nosler-270-130', sku: 'NS-270-130-20', dept: 'rifle', brand: 'Nosler',
    name: 'Nosler Ballistic Tip .270 Win 130gr', caliber: '.270 Winchester', grain: 130, bulletType: 'BT',
    use: 'hunting', qty: 20, price: 4299, pricePerRound: 215, velocity: 3060, energy: 2705,
    caseType: 'Brass', stock: 'in', stockQty: 41, hazmat: true, weightClass: 2,
    restrictions: [], img: 'img/plate-308.jpg',
    desc: 'Polymer-tip hunting ammo. 20-rd box.'
  },
  {
    id: 'lapua-22-77', sku: 'LP-223-77-50', dept: 'rifle', brand: 'Lapua',
    name: 'Lapua Scenar .223 Rem 77gr HPBT', caliber: '.223 Remington', grain: 77, bulletType: 'HPBT',
    use: 'match', qty: 50, price: 5499, pricePerRound: 110, velocity: 2750, energy: 1293,
    caseType: 'Brass', stock: 'out', stockQty: 0, hazmat: true, weightClass: 2,
    restrictions: [], img: 'img/plate-match.jpg',
    eta: 'Next Finnish lot · expected mid-month',
    desc: 'Match HPBT. Out of stock — next lot pending.'
  },
  {
    id: 'fi-243-100', sku: 'FI-243-100-20', dept: 'rifle', brand: 'Federal',
    name: 'Federal Fusion .243 Win 100gr', caliber: '.243 Winchester', grain: 100, bulletType: 'Bonded',
    use: 'hunting', qty: 20, price: 3399, pricePerRound: 170, velocity: 2960, energy: 1945,
    caseType: 'Brass', stock: 'in', stockQty: 55, hazmat: true, weightClass: 2,
    restrictions: [], img: 'img/plate-308.jpg',
    desc: 'Bonded Fusion. Deer and predators. 20 ct.'
  },
  {
    id: 'win-12-75', sku: 'WIN-12-75-25', dept: 'shotgun', brand: 'Winchester',
    name: 'Winchester AA 12ga 2-3/4" #7.5 1-1/8oz', caliber: '12 Gauge', grain: 0, bulletType: '#7.5 Shot',
    use: 'target', qty: 25, price: 1499, pricePerRound: 60, velocity: 1250, energy: 0,
    caseType: 'Plastic hull', stock: 'in', stockQty: 320, hazmat: true, weightClass: 2,
    restrictions: [], img: 'img/plate-12ga.jpg',
    desc: 'AA target load. 25 shells. Ground hazmat.'
  },
  {
    id: 'fi-12-00', sku: 'FI-12-00-5', dept: 'shotgun', brand: 'Federal',
    name: 'Federal Power-Shok 12ga 00 Buck 9-pellet', caliber: '12 Gauge', grain: 0, bulletType: '00 Buck',
    use: 'defense', qty: 5, price: 999, pricePerRound: 200, velocity: 1325, energy: 0,
    caseType: 'Plastic hull', stock: 'in', stockQty: 110, hazmat: true, weightClass: 1,
    restrictions: ['CA', 'NY', 'DC', 'MA', 'NJ', 'CT', 'HI', 'IL'], img: 'img/plate-slug.jpg',
    desc: '9-pellet 00 buck. 5-rd sleeve. State limits apply.'
  },
  {
    id: 'bren-12-slug', sku: 'BR-12-SLUG-5', dept: 'shotgun', brand: 'Brenneke',
    name: 'Brenneke Classic 12ga 1oz Slug', caliber: '12 Gauge', grain: 0, bulletType: 'Slug',
    use: 'hunting', qty: 5, price: 1299, pricePerRound: 260, velocity: 1600, energy: 2484,
    caseType: 'Plastic hull', stock: 'in', stockQty: 67, hazmat: true, weightClass: 1,
    restrictions: [], img: 'img/plate-slug.jpg',
    desc: 'Rifled slug. 5-pack. Deer counties.'
  },
  {
    id: 'rem-20-75', sku: 'REM-20-75-25', dept: 'shotgun', brand: 'Remington',
    name: 'Remington Gun Club 20ga #7.5', caliber: '20 Gauge', grain: 0, bulletType: '#7.5 Shot',
    use: 'target', qty: 25, price: 1399, pricePerRound: 56, velocity: 1200, energy: 0,
    caseType: 'Plastic hull', stock: 'in', stockQty: 148, hazmat: true, weightClass: 2,
    restrictions: [], img: 'img/plate-12ga.jpg',
    desc: '20ga target shells. 25 ct.'
  },
  {
    id: 'fi-12-4', sku: 'FI-12-4-25', dept: 'shotgun', brand: 'Federal',
    name: 'Federal Game-Shok 12ga #4 1-1/4oz', caliber: '12 Gauge', grain: 0, bulletType: '#4 Shot',
    use: 'hunting', qty: 25, price: 1799, pricePerRound: 72, velocity: 1330, energy: 0,
    caseType: 'Plastic hull', stock: 'low', stockQty: 22, hazmat: true, weightClass: 2,
    restrictions: [], img: 'img/plate-range-sq.jpg',
    desc: 'Upland #4. Low stock. 25 shells.'
  },
  {
    id: 'cci-22-40', sku: 'CCI-22-40-100', dept: 'rimfire', brand: 'CCI',
    name: 'CCI Mini-Mag .22 LR 40gr CPRN', caliber: '.22 LR', grain: 40, bulletType: 'CPRN',
    use: 'target', qty: 100, price: 1299, pricePerRound: 13, velocity: 1235, energy: 135,
    caseType: 'Brass', stock: 'in', stockQty: 640, hazmat: true, weightClass: 1,
    restrictions: [], img: 'img/plate-22lr.jpg',
    desc: 'Mini-Mag brick staple. 100 ct. In stock.'
  },
  {
    id: 'aguila-22-sniper', sku: 'AG-22-SN-50', dept: 'rimfire', brand: 'Aguila',
    name: 'Aguila Super Extra .22 LR 40gr', caliber: '.22 LR', grain: 40, bulletType: 'LRN',
    use: 'target', qty: 50, price: 699, pricePerRound: 14, velocity: 1255, energy: 140,
    caseType: 'Brass', stock: 'in', stockQty: 410, hazmat: true, weightClass: 1,
    restrictions: [], img: 'img/plate-rim-alt.jpg',
    desc: '50-rd box. Reliable ignition. Ground only.'
  },
  {
    id: 'horn-17hmr', sku: 'HA-17-17-50', dept: 'rimfire', brand: 'Hornady',
    name: 'Hornady V-MAX .17 HMR 17gr', caliber: '.17 HMR', grain: 17, bulletType: 'V-MAX',
    use: 'hunting', qty: 50, price: 1899, pricePerRound: 38, velocity: 2550, energy: 245,
    caseType: 'Brass', stock: 'in', stockQty: 92, hazmat: true, weightClass: 1,
    restrictions: [], img: 'img/plate-rim-alt.jpg',
    desc: 'V-MAX .17 HMR. 50 ct.'
  },
  {
    id: 'cci-22wmr', sku: 'CCI-22WMR-40-50', dept: 'rimfire', brand: 'CCI',
    name: 'CCI Maxi-Mag .22 WMR 40gr JHP', caliber: '.22 WMR', grain: 40, bulletType: 'JHP',
    use: 'hunting', qty: 50, price: 2199, pricePerRound: 44, velocity: 1875, energy: 312,
    caseType: 'Brass', stock: 'in', stockQty: 77, hazmat: true, weightClass: 1,
    restrictions: [], img: 'img/plate-22lr.jpg',
    desc: 'Maxi-Mag JHP. 50 ct. Ground hazmat.'
  },
  {
    id: 'eley-22-match', sku: 'EL-22-TM-50', dept: 'rimfire', brand: 'Eley',
    name: 'Eley Tenex .22 LR Match', caliber: '.22 LR', grain: 40, bulletType: 'Round Nose',
    use: 'match', qty: 50, price: 2499, pricePerRound: 50, velocity: 1085, energy: 105,
    caseType: 'Brass', stock: 'low', stockQty: 14, hazmat: true, weightClass: 1,
    restrictions: [], img: 'img/plate-22lr.jpg',
    desc: 'Tenex match. Ask counter for current lot. Low stock.'
  },
  {
    id: 'horn-9mm-bullet', sku: 'HA-B-9-115-100', dept: 'reloading', brand: 'Hornady',
    name: 'Hornady 9mm 115gr FMJ Bullets (100)', caliber: '9mm Component', grain: 115, bulletType: 'FMJ',
    use: 'reloading', qty: 100, price: 1899, pricePerRound: 19, velocity: 0, energy: 0,
    caseType: 'Projectile only', stock: 'in', stockQty: 130, hazmat: false, weightClass: 1,
    restrictions: [], img: 'img/plate-components.jpg',
    desc: 'Component bullets only. No powder or primer.'
  },
  {
    id: 'cci-500', sku: 'CCI-500-100', dept: 'reloading', brand: 'CCI',
    name: 'CCI 500 Small Pistol Primers (100)', caliber: 'Primers', grain: 0, bulletType: 'SP',
    use: 'reloading', qty: 100, price: 899, pricePerRound: 9, velocity: 0, energy: 0,
    caseType: 'Tray', stock: 'in', stockQty: 200, hazmat: true, weightClass: 1,
    restrictions: ['CA', 'NY', 'DC', 'MA', 'NJ', 'CT', 'HI', 'IL', 'AK'], img: 'img/plate-reload.jpg',
    desc: 'Small pistol primers. Hazmat ground. Signature required.'
  },
  {
    id: 'hodgdon-hp38', sku: 'HD-HP38-1LB', dept: 'reloading', brand: 'Hodgdon',
    name: 'Hodgdon HP-38 Powder 1 lb', caliber: 'Powder', grain: 0, bulletType: 'Smokeless',
    use: 'reloading', qty: 1, price: 4299, pricePerRound: 4299, velocity: 0, energy: 0,
    caseType: 'Canister', stock: 'in', stockQty: 48, hazmat: true, weightClass: 2,
    restrictions: ['CA', 'NY', 'DC', 'MA', 'NJ', 'CT', 'HI', 'AK'], img: 'img/plate-reload.jpg',
    desc: '1 lb canister. Not shipped with primers in same carton.'
  },
  {
    id: 'rcbs-die-9', sku: 'RCBS-9-3DIE', dept: 'reloading', brand: 'RCBS',
    name: 'RCBS Carbide 3-Die Set 9mm', caliber: 'Dies', grain: 0, bulletType: 'Die set',
    use: 'reloading', qty: 1, price: 8999, pricePerRound: 8999, velocity: 0, energy: 0,
    caseType: 'Steel', stock: 'in', stockQty: 31, hazmat: false, weightClass: 1,
    restrictions: [], img: 'img/plate-components.jpg',
    desc: 'Carbide 3-die set. No case lube for 9mm.'
  },
  {
    id: 'frankford-brass-223', sku: 'FA-223-BR-100', dept: 'reloading', brand: 'Frankford Arsenal',
    name: 'Once-Fired .223 Brass (100)', caliber: '.223 Remington', grain: 0, bulletType: 'Brass',
    use: 'reloading', qty: 100, price: 2499, pricePerRound: 25, velocity: 0, energy: 0,
    caseType: 'Brass', stock: 'in', stockQty: 85, hazmat: false, weightClass: 1,
    restrictions: [], img: 'img/plate-case.jpg',
    desc: 'Cleaned once-fired brass. Not sized. Inspect pockets.'
  },
  {
    id: 'lee-turret', sku: 'LEE-TURRET', dept: 'reloading', brand: 'Lee Precision',
    name: 'Lee Classic Turret Press Kit', caliber: 'Press', grain: 0, bulletType: 'Kit',
    use: 'reloading', qty: 1, price: 18999, pricePerRound: 18999, velocity: 0, energy: 0,
    caseType: 'Kit', stock: 'low', stockQty: 6, hazmat: false, weightClass: 3,
    restrictions: [], img: 'img/plate-range-sq.jpg',
    desc: 'Turret press kit. Powder and primers sold separately.'
  },
  {
    id: 'cr-9mm-case', sku: 'CR-9-115-CASE', dept: 'handgun', brand: 'Copper Ridge',
    name: '9mm 115gr FMJ Case (1000)', caliber: '9mm Luger', grain: 115, bulletType: 'FMJ',
    use: 'target', qty: 1000, price: 24999, pricePerRound: 25, velocity: 1180, energy: 356,
    caseType: 'Brass', stock: 'in', stockQty: 28, hazmat: true, weightClass: 4,
    restrictions: [], img: 'img/plate-bulk-sq.jpg',
    boxOf: 'cr-9mm-115-fmj',
    desc: '1000-rd case. Best $/rd. Ground hazmat · 5–8 days.'
  },
  {
    id: 'cr-223-case', sku: 'CR-223-55-CASE', dept: 'rifle', brand: 'Copper Ridge',
    name: '.223 55gr FMJBT Case (1000)', caliber: '.223 Remington', grain: 55, bulletType: 'FMJBT',
    use: 'target', qty: 1000, price: 44999, pricePerRound: 45, velocity: 3240, energy: 1282,
    caseType: 'Brass', stock: 'in', stockQty: 16, hazmat: true, weightClass: 4,
    restrictions: [], img: 'img/plate-case.jpg',
    boxOf: 'cr-223-55',
    desc: '1000-rd case. Ground only. Allow 5–8 business days.'
  },
  {
    id: 'underwood-10mm', sku: 'UW-10-200-20', dept: 'handgun', brand: 'Underwood',
    name: 'Underwood 10mm Auto 200gr XTP', caliber: '10mm Auto', grain: 200, bulletType: 'XTP',
    use: 'hunting', qty: 20, price: 3999, pricePerRound: 200, velocity: 1250, energy: 694,
    caseType: 'Nickel', stock: 'in', stockQty: 39, hazmat: true, weightClass: 1,
    restrictions: ['CA', 'NY', 'DC', 'MA', 'NJ', 'CT', 'HI'], img: 'img/plate-jhp.jpg',
    desc: 'Full-power 10mm XTP. Confirm pistol rating. State limits apply.'
  }
];

/* Short curated reviews — keyed by product id (showcase copy). */
window.CR_REVIEWS = {
  'cr-9mm-115-fmj': [
    { name: 'Mike R.', place: 'Billings, MT', stars: 5, text: 'Clean enough for a Saturday of steel. Ordered two cases next time.' },
    { name: 'Sara K.', place: 'Spokane, WA', stars: 4, text: 'Shipped ground like they said. Box was sealed. Soft primer strike on one round out of 50.' }
  ],
  'cr-223-55': [
    { name: 'Jon P.', place: 'Boise, ID', stars: 5, text: 'Holds zero on my 16\". Not match ammo — just honest AR food.' },
    { name: 'Dana L.', place: 'Missoula, MT', stars: 5, text: 'Picked up at the counter. Same price as the site.' }
  ],
  'win-12-75': [
    { name: 'Chris T.', place: 'Kalispell, MT', stars: 5, text: 'AA is AA. Hulls worth saving.' }
  ],
  'cci-22-40': [
    { name: 'Evan B.', place: 'Helena, MT', stars: 4, text: 'Brick staple. One dud in the last hundred — normal for .22.' }
  ],
  'horn-65cm-140': [
    { name: 'Alex M.', place: 'Great Falls, MT', stars: 5, text: 'Lot on the box matched the chrono sheet they posted. Consistent.' }
  ],
  'fi-9mm-147': [
    { name: 'Pat S.', place: 'Coeur d\'Alene, ID', stars: 4, text: 'Soft shooting. Good suppressor host load.' }
  ]
};
