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
    caseType: 'Brass', stock: 'in', hazmat: true, weightClass: 1,
    restrictions: [], img: 'img/p-9mm-115.svg',
    desc: 'House-load 9mm for range days. Clean-burning powder, brass cases, consistent seating. Sold by the box of 50.'
  },
  {
    id: 'cr-9mm-124-jhp', sku: 'CR-9-124-JHP-20', dept: 'handgun', brand: 'Copper Ridge',
    name: '9mm Luger 124gr JHP', caliber: '9mm Luger', grain: 124, bulletType: 'JHP',
    use: 'defense', qty: 20, price: 2199, pricePerRound: 110, velocity: 1150, energy: 364,
    caseType: 'Brass', stock: 'in', hazmat: true, weightClass: 1,
    restrictions: ['CA', 'NY', 'DC', 'MA', 'NJ', 'CT', 'HI', 'IL'], img: 'img/p-9mm-124jhp.svg',
    desc: 'Jacketed hollow point in a 20-round defensive box. Controlled expansion profile for duty and home defense loads.'
  },
  {
    id: 'fi-9mm-147', sku: 'FI-9-147-50', dept: 'handgun', brand: 'Federal',
    name: 'Federal American Eagle 9mm 147gr FMJ', caliber: '9mm Luger', grain: 147, bulletType: 'FMJ',
    use: 'target', qty: 50, price: 1799, pricePerRound: 36, velocity: 1000, energy: 326,
    caseType: 'Brass', stock: 'in', hazmat: true, weightClass: 1,
    restrictions: [], img: 'img/p-9mm-147.svg',
    desc: 'Soft-shooting 147gr training ammo. Popular for suppressors and steel-plate practice.'
  },
  {
    id: 'win-45-230', sku: 'WIN-45-230-50', dept: 'handgun', brand: 'Winchester',
    name: 'Winchester USA .45 ACP 230gr FMJ', caliber: '.45 ACP', grain: 230, bulletType: 'FMJ',
    use: 'target', qty: 50, price: 2899, pricePerRound: 58, velocity: 835, energy: 356,
    caseType: 'Brass', stock: 'low', hazmat: true, weightClass: 2,
    restrictions: [], img: 'img/p-45-230.svg',
    desc: 'Full-metal-jacket .45 ACP in the classic 230gr weight. Range staple for 1911 and Glock 21 owners.'
  },
  {
    id: 'speer-40-180', sku: 'SP-40-180-50', dept: 'handgun', brand: 'Speer',
    name: 'Speer Lawman .40 S&W 180gr TMJ', caliber: '.40 S&W', grain: 180, bulletType: 'TMJ',
    use: 'target', qty: 50, price: 2499, pricePerRound: 50, velocity: 990, energy: 392,
    caseType: 'Brass', stock: 'in', hazmat: true, weightClass: 1,
    restrictions: [], img: 'img/p-40-180.svg',
    desc: 'Total metal jacket practice ammo matched to Speer Gold Dot duty loads.'
  },
  {
    id: 'horn-357-158', sku: 'HA-357-158-25', dept: 'handgun', brand: 'Hornady',
    name: 'Hornady Critical Defense .357 Mag 158gr FTX', caliber: '.357 Magnum', grain: 158, bulletType: 'FTX',
    use: 'defense', qty: 25, price: 3499, pricePerRound: 140, velocity: 1250, energy: 548,
    caseType: 'Nickel', stock: 'in', hazmat: true, weightClass: 1,
    restrictions: ['CA', 'NY', 'DC', 'MA', 'NJ', 'CT', 'HI'], img: 'img/p-357-158.svg',
    desc: 'Flex Tip defensive load for revolvers. Nickel cases for reliable extraction.'
  },
  {
    id: 'cr-380-95', sku: 'CR-380-95-50', dept: 'handgun', brand: 'Copper Ridge',
    name: '.380 ACP 95gr FMJ', caliber: '.380 ACP', grain: 95, bulletType: 'FMJ',
    use: 'target', qty: 50, price: 1899, pricePerRound: 38, velocity: 980, energy: 203,
    caseType: 'Brass', stock: 'in', hazmat: true, weightClass: 1,
    restrictions: [], img: 'img/p-380-95.svg',
    desc: 'Compact-carry practice ammo. Soft recoil for high-round-count days with micro pistols.'
  },
  {
    id: 'magtech-38-158', sku: 'MT-38-158-50', dept: 'handgun', brand: 'Magtech',
    name: 'Magtech .38 Special 158gr LRN', caliber: '.38 Special', grain: 158, bulletType: 'LRN',
    use: 'target', qty: 50, price: 2299, pricePerRound: 46, velocity: 755, energy: 200,
    caseType: 'Brass', stock: 'in', hazmat: true, weightClass: 1,
    restrictions: [], img: 'img/p-38-158.svg',
    desc: 'Lead round nose for revolver practice and cowboy-action warm-ups.'
  },
  {
    id: 'cr-223-55', sku: 'CR-223-55-20', dept: 'rifle', brand: 'Copper Ridge',
    name: '.223 Rem 55gr FMJBT', caliber: '.223 Remington', grain: 55, bulletType: 'FMJBT',
    use: 'target', qty: 20, price: 1199, pricePerRound: 60, velocity: 3240, energy: 1282,
    caseType: 'Brass', stock: 'in', hazmat: true, weightClass: 1,
    restrictions: [], img: 'img/p-223-55.svg',
    desc: 'House .223 for AR-pattern rifles. Boat-tail FMJ, 20-round boxes, case pricing available at checkout.'
  },
  {
    id: 'pmc-556-62', sku: 'PMC-556-62-20', dept: 'rifle', brand: 'PMC',
    name: 'PMC X-TAC 5.56 NATO 62gr Green Tip', caliber: '5.56 NATO', grain: 62, bulletType: 'M855',
    use: 'target', qty: 20, price: 1399, pricePerRound: 70, velocity: 3100, energy: 1323,
    caseType: 'Brass', stock: 'in', hazmat: true, weightClass: 1,
    restrictions: ['CA', 'NY', 'DC', 'NJ', 'CT', 'MA', 'HI', 'IL'], img: 'img/p-556-62.svg',
    desc: 'M855-style green tip. Check local range rules before shooting steel at close distance.'
  },
  {
    id: 'fed-308-150', sku: 'FI-308-150-20', dept: 'rifle', brand: 'Federal',
    name: 'Federal Power-Shok .308 Win 150gr Soft Point', caliber: '.308 Winchester', grain: 150, bulletType: 'SP',
    use: 'hunting', qty: 20, price: 2899, pricePerRound: 145, velocity: 2820, energy: 2648,
    caseType: 'Brass', stock: 'in', hazmat: true, weightClass: 2,
    restrictions: [], img: 'img/p-308-150.svg',
    desc: 'Soft-point hunting load for deer-sized game. Reliable expansion at woods ranges.'
  },
  {
    id: 'horn-65cm-140', sku: 'HA-65-140-20', dept: 'rifle', brand: 'Hornady',
    name: 'Hornady Match 6.5 Creedmoor 140gr ELD-M', caliber: '6.5 Creedmoor', grain: 140, bulletType: 'ELD-M',
    use: 'match', qty: 20, price: 3699, pricePerRound: 185, velocity: 2710, energy: 2283,
    caseType: 'Brass', stock: 'in', hazmat: true, weightClass: 2,
    restrictions: [], img: 'img/p-65cm-140.svg',
    desc: 'Match-grade ELD-M for PRS and long-range practice. Lot-tracked velocity on the box.'
  },
  {
    id: 'win-3006-180', sku: 'WIN-3006-180-20', dept: 'rifle', brand: 'Winchester',
    name: 'Winchester Super-X .30-06 180gr Power-Point', caliber: '.30-06 Springfield', grain: 180, bulletType: 'PP',
    use: 'hunting', qty: 20, price: 3199, pricePerRound: 160, velocity: 2700, energy: 2914,
    caseType: 'Brass', stock: 'low', hazmat: true, weightClass: 2,
    restrictions: [], img: 'img/p-3006-180.svg',
    desc: 'Classic Power-Point for elk country and mixed hardwoods. 180gr for deeper penetration.'
  },
  {
    id: 'cr-300blk-220', sku: 'CR-300-220-20', dept: 'rifle', brand: 'Copper Ridge',
    name: '.300 Blackout 220gr Subsonic FMJ', caliber: '.300 Blackout', grain: 220, bulletType: 'FMJ',
    use: 'target', qty: 20, price: 2499, pricePerRound: 125, velocity: 1020, energy: 508,
    caseType: 'Brass', stock: 'in', hazmat: true, weightClass: 1,
    restrictions: [], img: 'img/p-300blk-220.svg',
    desc: 'Subsonic 220gr for suppressed ARs. Keep powder dry; these are not hunting loads.'
  },
  {
    id: 'nosler-270-130', sku: 'NS-270-130-20', dept: 'rifle', brand: 'Nosler',
    name: 'Nosler Ballistic Tip .270 Win 130gr', caliber: '.270 Winchester', grain: 130, bulletType: 'BT',
    use: 'hunting', qty: 20, price: 4299, pricePerRound: 215, velocity: 3060, energy: 2705,
    caseType: 'Brass', stock: 'in', hazmat: true, weightClass: 2,
    restrictions: [], img: 'img/p-270-130.svg',
    desc: 'Polymer-tip hunting ammo for open-country mule deer and antelope.'
  },
  {
    id: 'lapua-22-77', sku: 'LP-223-77-50', dept: 'rifle', brand: 'Lapua',
    name: 'Lapua Scenar .223 Rem 77gr HPBT', caliber: '.223 Remington', grain: 77, bulletType: 'HPBT',
    use: 'match', qty: 50, price: 5499, pricePerRound: 110, velocity: 2750, energy: 1293,
    caseType: 'Brass', stock: 'out', hazmat: true, weightClass: 2,
    restrictions: [], img: 'img/p-223-77.svg',
    desc: 'Match HPBT for 1:71:8 twist barrels. Currently awaiting the next Finnish shipment.'
  },
  {
    id: 'fi-243-100', sku: 'FI-243-100-20', dept: 'rifle', brand: 'Federal',
    name: 'Federal Fusion .243 Win 100gr', caliber: '.243 Winchester', grain: 100, bulletType: 'Bonded',
    use: 'hunting', qty: 20, price: 3399, pricePerRound: 170, velocity: 2960, energy: 1945,
    caseType: 'Brass', stock: 'in', hazmat: true, weightClass: 2,
    restrictions: [], img: 'img/p-243-100.svg',
    desc: 'Bonded Fusion core for deer and predators. Flat trajectory out of carbine-length barrels.'
  },
  {
    id: 'win-12-75', sku: 'WIN-12-75-25', dept: 'shotgun', brand: 'Winchester',
    name: 'Winchester AA 12ga 2-3/4" #7.5 1-1/8oz', caliber: '12 Gauge', grain: 0, bulletType: '#7.5 Shot',
    use: 'target', qty: 25, price: 1499, pricePerRound: 60, velocity: 1250, energy: 0,
    caseType: 'Plastic hull', stock: 'in', hazmat: true, weightClass: 2,
    restrictions: [], img: 'img/p-12-75.svg',
    desc: 'Target load for skeet, trap, and sporting clays. The hull everyone reloads eventually.'
  },
  {
    id: 'fi-12-00', sku: 'FI-12-00-5', dept: 'shotgun', brand: 'Federal',
    name: 'Federal Power-Shok 12ga 00 Buck 9-pellet', caliber: '12 Gauge', grain: 0, bulletType: '00 Buck',
    use: 'defense', qty: 5, price: 999, pricePerRound: 200, velocity: 1325, energy: 0,
    caseType: 'Plastic hull', stock: 'in', hazmat: true, weightClass: 1,
    restrictions: ['CA', 'NY', 'DC', 'MA', 'NJ', 'CT', 'HI', 'IL'], img: 'img/p-12-00.svg',
    desc: 'Nine-pellet 00 buck in a five-round defensive sleeve. Confirm magazine-tube capacity before loading.'
  },
  {
    id: 'bren-12-slug', sku: 'BR-12-SLUG-5', dept: 'shotgun', brand: 'Brenneke',
    name: 'Brenneke Classic 12ga 1oz Slug', caliber: '12 Gauge', grain: 0, bulletType: 'Slug',
    use: 'hunting', qty: 5, price: 1299, pricePerRound: 260, velocity: 1600, energy: 2484,
    caseType: 'Plastic hull', stock: 'in', hazmat: true, weightClass: 1,
    restrictions: [], img: 'img/p-12-slug.svg',
    desc: 'Rifled slug for deer in shotgun-only counties. Sabot not required for most smoothbores.'
  },
  {
    id: 'rem-20-75', sku: 'REM-20-75-25', dept: 'shotgun', brand: 'Remington',
    name: 'Remington Gun Club 20ga #7.5', caliber: '20 Gauge', grain: 0, bulletType: '#7.5 Shot',
    use: 'target', qty: 25, price: 1399, pricePerRound: 56, velocity: 1200, energy: 0,
    caseType: 'Plastic hull', stock: 'in', hazmat: true, weightClass: 2,
    restrictions: [], img: 'img/p-20-75.svg',
    desc: 'Light-recoil 20ga target shells for youth and upland practice.'
  },
  {
    id: 'fi-12-4', sku: 'FI-12-4-25', dept: 'shotgun', brand: 'Federal',
    name: 'Federal Game-Shok 12ga #4 1-1/4oz', caliber: '12 Gauge', grain: 0, bulletType: '#4 Shot',
    use: 'hunting', qty: 25, price: 1799, pricePerRound: 72, velocity: 1330, energy: 0,
    caseType: 'Plastic hull', stock: 'low', hazmat: true, weightClass: 2,
    restrictions: [], img: 'img/p-12-4.svg',
    desc: 'Upland and small-game load. #4 shot for pheasant and rabbits in open cover.'
  },
  {
    id: 'cci-22-40', sku: 'CCI-22-40-100', dept: 'rimfire', brand: 'CCI',
    name: 'CCI Mini-Mag .22 LR 40gr CPRN', caliber: '.22 LR', grain: 40, bulletType: 'CPRN',
    use: 'target', qty: 100, price: 1299, pricePerRound: 13, velocity: 1235, energy: 135,
    caseType: 'Brass', stock: 'in', hazmat: true, weightClass: 1,
    restrictions: [], img: 'img/p-22-40.svg',
    desc: 'Copper-plated round nose. The bulk brick staple for plinking and small-game practice.'
  },
  {
    id: 'aguila-22-sniper', sku: 'AG-22-SN-50', dept: 'rimfire', brand: 'Aguila',
    name: 'Aguila Super Extra .22 LR 40gr', caliber: '.22 LR', grain: 40, bulletType: 'LRN',
    use: 'target', qty: 50, price: 699, pricePerRound: 14, velocity: 1255, energy: 140,
    caseType: 'Brass', stock: 'in', hazmat: true, weightClass: 1,
    restrictions: [], img: 'img/p-22-aguila.svg',
    desc: 'Reliable Mexican-made .22 LR. Clean primers, consistent ignition in cold weather.'
  },
  {
    id: 'horn-17hmr', sku: 'HA-17-17-50', dept: 'rimfire', brand: 'Hornady',
    name: 'Hornady V-MAX .17 HMR 17gr', caliber: '.17 HMR', grain: 17, bulletType: 'V-MAX',
    use: 'hunting', qty: 50, price: 1899, pricePerRound: 38, velocity: 2550, energy: 245,
    caseType: 'Brass', stock: 'in', hazmat: true, weightClass: 1,
    restrictions: [], img: 'img/p-17hmr.svg',
    desc: 'Polymer-tip .17 HMR for prairie dogs and coyote work inside 150 yards.'
  },
  {
    id: 'cci-22wmr', sku: 'CCI-22WMR-40-50', dept: 'rimfire', brand: 'CCI',
    name: 'CCI Maxi-Mag .22 WMR 40gr JHP', caliber: '.22 WMR', grain: 40, bulletType: 'JHP',
    use: 'hunting', qty: 50, price: 2199, pricePerRound: 44, velocity: 1875, energy: 312,
    caseType: 'Brass', stock: 'in', hazmat: true, weightClass: 1,
    restrictions: [], img: 'img/p-22wmr.svg',
    desc: 'Jacketed hollow point for pest control and small game where .22 LR runs out of steam.'
  },
  {
    id: 'eley-22-match', sku: 'EL-22-TM-50', dept: 'rimfire', brand: 'Eley',
    name: 'Eley Tenex .22 LR Match', caliber: '.22 LR', grain: 40, bulletType: 'Round Nose',
    use: 'match', qty: 50, price: 2499, pricePerRound: 50, velocity: 1085, energy: 105,
    caseType: 'Brass', stock: 'low', hazmat: true, weightClass: 1,
    restrictions: [], img: 'img/p-22-eley.svg',
    desc: 'Olympic-grade rimfire. Lot numbers matter  ask the counter for the current sweet lot.'
  },
  {
    id: 'horn-9mm-bullet', sku: 'HA-B-9-115-100', dept: 'reloading', brand: 'Hornady',
    name: 'Hornady 9mm 115gr FMJ Bullets (100)', caliber: '9mm Component', grain: 115, bulletType: 'FMJ',
    use: 'reloading', qty: 100, price: 1899, pricePerRound: 19, velocity: 0, energy: 0,
    caseType: 'Projectile only', stock: 'in', hazmat: false, weightClass: 1,
    restrictions: [], img: 'img/p-rel-9mm.svg',
    desc: 'Component bullets only  no powder, primer, or loaded rounds. For handloaders with a press.'
  },
  {
    id: 'cci-500', sku: 'CCI-500-100', dept: 'reloading', brand: 'CCI',
    name: 'CCI 500 Small Pistol Primers (100)', caliber: 'Primers', grain: 0, bulletType: 'SP',
    use: 'reloading', qty: 100, price: 899, pricePerRound: 9, velocity: 0, energy: 0,
    caseType: 'Tray', stock: 'in', hazmat: true, weightClass: 1,
    restrictions: ['CA', 'NY', 'DC', 'MA', 'NJ', 'CT', 'HI', 'IL', 'AK', 'HI'], img: 'img/p-rel-primer.svg',
    desc: 'Small pistol primers. Hazmat ground only. Quantity limits apply in some jurisdictions.'
  },
  {
    id: 'hodgdon-hp38', sku: 'HD-HP38-1LB', dept: 'reloading', brand: 'Hodgdon',
    name: 'Hodgdon HP-38 Powder 1 lb', caliber: 'Powder', grain: 0, bulletType: 'Smokeless',
    use: 'reloading', qty: 1, price: 4299, pricePerRound: 4299, velocity: 0, energy: 0,
    caseType: 'Canister', stock: 'in', hazmat: true, weightClass: 2,
    restrictions: ['CA', 'NY', 'DC', 'MA', 'NJ', 'CT', 'HI', 'AK'], img: 'img/p-rel-powder.svg',
    desc: 'Versatile pistol powder. Signature required. We do not ship powder with primers in the same carton.'
  },
  {
    id: 'rcbs-die-9', sku: 'RCBS-9-3DIE', dept: 'reloading', brand: 'RCBS',
    name: 'RCBS Carbide 3-Die Set 9mm', caliber: 'Dies', grain: 0, bulletType: 'Die set',
    use: 'reloading', qty: 1, price: 8999, pricePerRound: 8999, velocity: 0, energy: 0,
    caseType: 'Steel', stock: 'in', hazmat: false, weightClass: 1,
    restrictions: [], img: 'img/p-rel-dies.svg',
    desc: 'Carbide sizing die  no case lube required for straight-wall 9mm brass.'
  },
  {
    id: 'frankford-brass-223', sku: 'FA-223-BR-100', dept: 'reloading', brand: 'Frankford Arsenal',
    name: 'Once-Fired .223 Brass (100)', caliber: '.223 Remington', grain: 0, bulletType: 'Brass',
    use: 'reloading', qty: 100, price: 2499, pricePerRound: 25, velocity: 0, energy: 0,
    caseType: 'Brass', stock: 'in', hazmat: false, weightClass: 1,
    restrictions: [], img: 'img/p-rel-brass.svg',
    desc: 'Range-picked, cleaned, and sorted. Not sized. Inspect primer pockets before loading.'
  },
  {
    id: 'lee-turret', sku: 'LEE-TURRET', dept: 'reloading', brand: 'Lee Precision',
    name: 'Lee Classic Turret Press Kit', caliber: 'Press', grain: 0, bulletType: 'Kit',
    use: 'reloading', qty: 1, price: 18999, pricePerRound: 18999, velocity: 0, energy: 0,
    caseType: 'Kit', stock: 'low', hazmat: false, weightClass: 3,
    restrictions: [], img: 'img/p-rel-press.svg',
    desc: 'Four-hole turret with auto-index. Ships freight-friendly; powder and primers sold separately.'
  },
  {
    id: 'cr-9mm-case', sku: 'CR-9-115-CASE', dept: 'handgun', brand: 'Copper Ridge',
    name: '9mm 115gr FMJ Case (1000)', caliber: '9mm Luger', grain: 115, bulletType: 'FMJ',
    use: 'target', qty: 1000, price: 24999, pricePerRound: 25, velocity: 1180, energy: 356,
    caseType: 'Brass', stock: 'in', hazmat: true, weightClass: 4,
    restrictions: [], img: 'img/p-9mm-case.svg',
    desc: 'Twenty boxes of our house 9mm, strapped and pallet-ready. Best $/round in the warehouse.'
  },
  {
    id: 'cr-223-case', sku: 'CR-223-55-CASE', dept: 'rifle', brand: 'Copper Ridge',
    name: '.223 55gr FMJBT Case (1000)', caliber: '.223 Remington', grain: 55, bulletType: 'FMJBT',
    use: 'target', qty: 1000, price: 44999, pricePerRound: 45, velocity: 3240, energy: 1282,
    caseType: 'Brass', stock: 'in', hazmat: true, weightClass: 4,
    restrictions: [], img: 'img/p-223-case.svg',
    desc: 'Fifty boxes of house .223. Ground hazmat only  allow 58 business days to the Lower 48.'
  },
  {
    id: 'underwood-10mm', sku: 'UW-10-200-20', dept: 'handgun', brand: 'Underwood',
    name: 'Underwood 10mm Auto 200gr XTP', caliber: '10mm Auto', grain: 200, bulletType: 'XTP',
    use: 'hunting', qty: 20, price: 3999, pricePerRound: 200, velocity: 1250, energy: 694,
    caseType: 'Nickel', stock: 'in', hazmat: true, weightClass: 1,
    restrictions: ['CA', 'NY', 'DC', 'MA', 'NJ', 'CT', 'HI'], img: 'img/p-10mm-200.svg',
    desc: 'Hot 10mm hunting load. Confirm your pistol is rated for +P / full-power 10mm before ordering.'
  }
];

