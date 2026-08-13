/* NOCTURNE — the field. One object per entry; every page reads from here.
   Judging card: coachwork /30 · interior /25 · presence after dark /25 ·
   provenance /20 — total /100. Entry 10 is sealed until judging night. */
(function () {
  'use strict';

  window.NOCTURNE_CLASSES = {
    touring: 'Grand Touring',
    formal: 'Formal Coachwork',
    chrome: 'The Chrome Age',
    sport: 'Competition & Sport',
    sealed: 'To Be Unveiled'
  };

  window.NOCTURNE_ENTRIES = [
    {
      id: 'continental', no: '01', cls: 'touring',
      name: 'The Black Continental',
      spec: 'W12 grand tourer · black over black hide',
      era: 'Modern era',
      plate: { src: 'img/e-continental', focus: '50% 50%', w: 6656, h: 3744, alt: 'A black grand touring coupé photographed in a black studio, its bodywork carrying a single sweep of light' },
      details: [
        { src: 'img/d-continental-lamp', w: 5100, h: 3400, alt: 'Twin round headlamps of the black grand tourer, lit', cap: 'Lamps, held at dusk setting for judging' },
        { src: 'img/d-continental-tail', w: 5100, h: 3400, alt: 'An oval tail lamp glowing red against black coachwork', cap: 'Tail lamp, the only red permitted on the field' }
      ],
      card: { coachwork: 29, interior: 23, dark: 25, provenance: 17 },
      citation: 'Presented in the strictest possible specification — black on black, nothing brightened for the lawn. Under the field lamps the body reads as one continuous reflection, which is precisely the standard this class exists to test.',
      notes: [
        'Paint depth measured at three points; no respray detected.',
        'Interior unrestored, factory hide, correct stitch count.',
        'Presence after dark: full marks. The car disappears; the light stays.'
      ]
    },
    {
      id: 'hemi', no: '02', cls: 'sport',
      name: 'American Two-Door, Hemi Era',
      spec: 'V8 hardtop · deep black · red halo lamps',
      era: '1970s',
      plate: { src: 'img/e-hemi', focus: '62% 58%', w: 5472, h: 3648, alt: 'A black American muscle hardtop parked in a dark lot, tail lamps glowing as red rings' },
      details: [],
      card: { coachwork: 26, interior: 21, dark: 24, provenance: 18 },
      citation: 'Arrived on its own wheels, at night, as this class demands. The halo lamps carry the whole rear elevation; judges are asked to stand twenty paces back before scoring.',
      notes: [
        'Numbers-matching drivetrain, documented since new.',
        'Original brightwork, unpolished for the field by request.',
        'Idles at judging volume. Barely.'
      ]
    },
    {
      id: 'saloon', no: '03', cls: 'formal',
      name: 'Saloon in Old Gold',
      spec: 'Straight-six saloon · original bronze-gold lacquer',
      era: '1970s',
      plate: { src: 'img/e-saloon', focus: '50% 45%', w: 3940, h: 5219, alt: 'A bronze-gold vintage saloon photographed at night against a dark wall', portrait: true },
      details: [
        { src: 'img/d-saloon-bench', w: 2592, h: 1728, alt: 'A cream leather bench seat inside a vintage saloon', cap: 'Front bench, parchment hide, one careful family' }
      ],
      card: { coachwork: 27, interior: 24, dark: 23, provenance: 19 },
      citation: 'The only entry permitted to be a colour, because the colour is the one the factory mixed for it in 1973 and it has never worn another. At night it holds the exact temperature of the field lamps.',
      notes: [
        'Single respray in the original formula, documented.',
        'Parchment interior original throughout.',
        'The class judges asked to sit in it. Request declined, marks unaffected.'
      ]
    },
    {
      id: 'landaulet', no: '04', cls: 'formal',
      name: 'The Formal Car',
      spec: 'Coachbuilt limousine · black over midnight blue',
      era: '1960s',
      plate: { src: 'img/e-landaulet', focus: '50% 62%', w: 3376, h: 4220, alt: 'A coachbuilt limousine parked beneath warm lamps at night outside a modern building', portrait: true },
      details: [
        { src: 'img/d-landaulet-ornament', w: 2784, h: 3712, alt: 'The winged ornament and grille of a formal car in golden light', cap: 'Radiator ornament, unlacquered, polished by hand', portrait: true }
      ],
      card: { coachwork: 28, interior: 24, dark: 24, provenance: 20 },
      citation: 'Embassy service, three owners, every logbook. Formal coachwork is judged at walking pace and this car rewards exactly that: nothing announces itself, everything is correct.',
      notes: [
        'Full provenance — the only perfect provenance score on the field.',
        'Division glass original and uncracked.',
        'Ornament secured for the night; judged from photograph and affidavit.'
      ]
    },
    {
      id: 'chrome', no: '05', cls: 'chrome',
      name: 'Chrome Age Coupé',
      spec: 'Postwar coupé · black lacquer · full brightwork',
      era: '1940s',
      plate: { src: 'img/e-chrome', focus: '50% 60%', w: 4000, h: 6000, alt: 'The chrome grille and single round headlamp of a 1940s black coupé in rain-wet darkness', portrait: true },
      details: [
        { src: 'img/d-chrome-hood', w: 4000, h: 6000, alt: 'A dark vintage hood carrying one white sweep of reflected light', cap: 'Bonnet, judged for reflection continuity', portrait: true }
      ],
      card: { coachwork: 28, interior: 20, dark: 25, provenance: 16 },
      citation: 'The Chrome Age is judged in the rain whenever the sky permits. It permitted. Every bar of the grille held a separate lamp without one of them crossing another — the judges checked twice.',
      notes: [
        'Brightwork original, hand-straightened over four hundred hours.',
        'Interior sympathetic older restoration, marked accordingly.',
        'Requested the wet corner of the field. Granted.'
      ]
    },
    {
      id: 'roadster', no: '06', cls: 'sport',
      name: 'Competition Roadster',
      spec: 'Race number carried in period · lamps in period lenses',
      era: '1950s',
      plate: { src: 'img/e-roadster', focus: '50% 68%', w: 4000, h: 5985, alt: 'A vintage competition car at night with warm headlights on, race number on the door', portrait: true },
      details: [
        { src: 'img/d-roadster-wheel', w: 9000, h: 6000, alt: 'A black vintage steering wheel and dark dashboard with chrome bezels', cap: 'Wheel and fascia, competition trim' },
        { src: 'img/d-roadster-dash', w: 2000, h: 3000, alt: 'A cognac leather dashboard with classic instruments', cap: 'Instruments, period glass, original needles', portrait: true }
      ],
      card: { coachwork: 24, interior: 22, dark: 24, provenance: 19 },
      citation: 'Competition provenance is scored on scars kept, not scars hidden. This entry kept the right ones. The lamps run warm at the exact colour of the period lenses, which after dark is worth more than paint.',
      notes: [
        'Period race history verified across three seasons.',
        'Body panels carry their original imperfections by instruction.',
        'Loudest applause at last year’s judging. Applause is not scored.'
      ]
    },
    {
      id: 'aircooled', no: '07', cls: 'sport',
      name: 'Air-Cooled, In Motion',
      spec: 'Rear-engined coupé · judged at speed',
      era: '1990s',
      plate: { src: 'img/e-aircooled', focus: '50% 55%', w: 4000, h: 6000, alt: 'A black rear-engined sports coupé photographed at night with the city lights drawn into streaks behind it', portrait: true },
      details: [],
      card: { coachwork: 25, interior: 21, dark: 23, provenance: 17 },
      citation: 'The only class judged with the cars moving. Entries are scored through a single held pan at the field’s north gate; what blurs and what stays sharp is the whole examination.',
      notes: [
        'Driven to the field every year of its entry.',
        'Original paint on every panel but one, declared.',
        'The pan photograph above is the judging record itself.'
      ]
    },
    {
      id: 'emerald', no: '08', cls: 'sport',
      name: 'Emerald, After Dark',
      spec: 'Air-cooled coupé · deep green over black',
      era: '1990s',
      plate: { src: 'img/e-emerald', focus: '45% 60%', w: 3283, h: 4924, alt: 'A dark green sports coupé at a night gathering, one headlamp beam cutting the darkness', portrait: true },
      details: [],
      card: { coachwork: 26, interior: 22, dark: 22, provenance: 16 },
      citation: 'Green reads as black until the lamp crosses it, and then it doesn’t. The class regulations call this “a colour with discretion,” and award it the benefit of the dark.',
      notes: [
        'Factory colour, rare in period, rarer kept.',
        'Judged mid-arrival; the beam in the record photograph is its own.',
        'Owner declined the studio. The field agreed with the owner.'
      ]
    },
    {
      id: 'sodium', no: '09', cls: 'touring',
      name: 'The Sodium Coupé',
      spec: 'Two-door tourer · bronze under streetlight',
      era: '1970s',
      plate: { src: 'img/e-sodium', focus: '50% 60%', w: 4160, h: 6240, alt: 'A bronze 1970s coupé parked at night under sodium streetlight', portrait: true },
      details: [],
      card: { coachwork: 25, interior: 21, dark: 24, provenance: 15 },
      citation: 'Entered under the field’s oldest rule: a touring car must be judged under the light it actually lives beneath. Sodium light was chosen; the paint was mixed for it. Both facts are in the file.',
      notes: [
        'Daily driven, declared and celebrated.',
        'Provenance file thinner than the paint. Marks reflect it.',
        'Best-scored entry per franc spent, three years running.'
      ]
    },
    {
      id: 'sealed', no: '10', cls: 'sealed',
      name: 'Entry Sealed',
      spec: 'Coachwork sighted once, at collection',
      era: 'Undisclosed',
      plate: { src: 'img/e-sealed', focus: '50% 35%', w: 4672, h: 7008, alt: 'The silhouette of a classic car in near-total darkness, a single rake of light along its roofline', portrait: true },
      details: [],
      card: null,
      citation: 'One entry each year arrives under seal and is unveiled only when the field lamps are lit. The photograph above is the only record the house will release: one rake of light, one roofline.',
      notes: [
        'Class assignment announced at unveiling.',
        'The judges have not seen it. Neither have we, properly.',
        'Rosettes may be pinned in advance. They always are.'
      ]
    }
  ];
})();
