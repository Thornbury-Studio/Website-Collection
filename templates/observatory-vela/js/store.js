/* VELA — institution data, programme and basket.

   One rule governs this file: any number a visitor is shown is derived here,
   never typed into a page. Prices, savings, seat counts and session times all
   come out of the catalogue, so the marketing copy and the checkout cannot
   drift apart.

   The programme is generated against the sky rather than written down. A
   telescope night is only offered on a date the engine says will reach
   astronomical darkness, which at this latitude rules out eighty-five nights
   a year — so the summer simply has no deep-sky sessions to sell, and nothing
   has to remember to take them down. */
(function (root) {
  'use strict';

  var Sky = root.Sky;

  /* ---- The institution -------------------------------------------------- */

  var site = {
    name: 'VELA',
    full: 'VELA Observatory & Sky Centre',
    latitude: 54.4832,
    longitude: -3.1104,
    elevation: 612,
    timeZone: 'Europe/London',
    address: ['Hallow Fell Road', 'Ravenglass', 'Cumbria CA18 1SQ'],
    phone: '+44 1229 717 400',
    email: 'visit@vela-observatory.org',
    founded: 1963,
    domeRebuilt: 2019,
    planetariumSeats: 96,
    planetariumDiameter: 14,
    telescopeAperture: 1.2,
    refractorYear: 1908,
    refractorAperture: 457,
    bortle: 2,
    /* Measured at the zenith on a moonless night, in magnitudes per square
       arcsecond. 21.7 is genuinely dark sky. */
    skyBrightness: 21.7
  };

  /* ---- Admission and tickets -------------------------------------------- */

  var tickets = {
    admission: [
      { id: 'adult', label: 'Adult', note: '16 and over', price: 1450 },
      { id: 'concession', label: 'Concession', note: 'Student, 65+, disabled visitor', price: 1150 },
      { id: 'child', label: 'Child', note: '5 to 15 years', price: 800 },
      { id: 'infant', label: 'Under 5', note: 'Admitted free', price: 0 },
      { id: 'family', label: 'Family', note: 'Two adults and up to three children', price: 3900 }
    ],
    /* Add-on price when bought with admission, and the standalone price. */
    domeShow: { withAdmission: 750, standalone: 1250 },
    telescopeNight: 2800,
    solarSession: 900,
    lecture: 1100,
    /* Members are admitted free and take this off everything else. */
    memberDiscount: 0.25
  };

  var membership = [
    { id: 'individual', label: 'Individual', price: 4800, people: 1,
      perks: ['Unlimited admission for a year', '25% off dome shows and telescope nights',
        'Priority booking two weeks ahead', 'The Fell Report four times a year'] },
    { id: 'joint', label: 'Joint', price: 7800, people: 2,
      perks: ['Everything in Individual, for two named adults',
        'Two guest passes a year', 'Invitation to the annual members’ observing night'] },
    { id: 'family', label: 'Family', price: 9600, people: 5,
      perks: ['Two adults and up to three children under 16',
        'Free places on the Saturday young astronomers’ mornings',
        'Two guest passes a year'] },
    { id: 'patron', label: 'Patron', price: 25000, people: 2,
      perks: ['Everything in Joint', 'A night on the 1.2 m with a duty astronomer',
        'Named in the annual review', 'Your support funds the schools programme'] }
  ];

  /* ---- Dome shows -------------------------------------------------------- */

  var shows = [
    { id: 'thirteen-eight', title: 'Thirteen Point Eight', minutes: 38, age: '8+',
      blurb: 'The universe has an age, and we can measure it. A full-dome account of how ' +
             'three separate lines of evidence — expansion, the microwave background and the ' +
             'oldest stars we can find — arrive at the same number.' },
    { id: 'cold-cores', title: 'The Cold Cores', minutes: 32, age: '8+',
      blurb: 'Inside the dark clouds where stars have not happened yet. Built from ' +
             'submillimetre survey data, shown at the scale it was actually collected.' },
    { id: 'ocean-worlds', title: 'Ocean Worlds', minutes: 35, age: '7+',
      blurb: 'Europa, Enceladus, Titan. Three moons with more liquid water than Earth, and ' +
             'what it would take to look under the ice.' },
    { id: 'night-shift', title: 'Night Shift', minutes: 28, age: '10+',
      blurb: 'Made here, on the fell. One winter night on the 1.2 m telescope from dusk ' +
             'checks to the last calibration frame, in real time and real weather.' },
    { id: 'small-hours', title: 'Small Hours', minutes: 22, age: '3 to 6',
      blurb: 'A gentle first dome show for very young visitors. Lights stay half up, ' +
             'nobody minds noise, and it never gets properly dark.' }
  ];

  /* ---- Deterministic pseudo-randomness ----------------------------------- */

  /* Seat counts have to look lived-in without being random: a visitor who
     reloads must see the same numbers, and tomorrow must differ from today.
     Hashing the date string gives both. */
  function hash(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = (h * 16777619) >>> 0;
    }
    return h;
  }
  function seeded(seed, lo, hi) {
    var x = Math.sin(seed) * 10000;
    return lo + Math.floor((x - Math.floor(x)) * (hi - lo + 1));
  }

  function isoDate(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  /* ---- Programme --------------------------------------------------------- */

  function money(pence) {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency', currency: 'GBP',
      minimumFractionDigits: pence % 100 === 0 ? 0 : 2
    }).format(pence / 100);
  }

  function localTime(date) { return Sky.clock(date, site.timeZone); }

  function dayLabel(d) {
    return d.toLocaleDateString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short', timeZone: site.timeZone
    });
  }

  /* Every session offered on one date. */
  function sessionsFor(date) {
    var iso = isoDate(date);
    var seed = hash(iso);
    var dow = date.getDay();
    var out = [];
    var win = Sky.darkWindow(date, site.latitude, site.longitude);
    var noDark = win.darkStatus === 'above';

    /* Dome shows run every day the centre is open. Tuesday is a closed day. */
    if (dow !== 2) {
      var slots = (dow === 0 || dow === 6) ? [11, 13, 15, 16.5] : [11, 13, 15];
      slots.forEach(function (h, i) {
        var show = shows[(seed + i) % (shows.length - 1)];
        /* The under-sevens show only takes the first slot, at weekends. */
        if (i === 0 && (dow === 0 || dow === 6)) show = shows[4];
        var cap = site.planetariumSeats;
        var sold = seeded(seed + i * 31, Math.round(cap * 0.35), cap);
        out.push({
          kind: 'dome',
          id: iso + '-dome-' + i,
          date: iso,
          showId: show.id,
          title: show.title,
          blurb: show.blurb,
          minutes: show.minutes,
          age: show.age,
          startsAt: atLocalHour(date, h),
          capacity: cap,
          remaining: Math.max(0, cap - sold),
          price: tickets.domeShow.standalone,
          priceNote: money(tickets.domeShow.withAdmission) + ' with admission'
        });
      });
    }

    /* Telescope nights: Thursday, Friday, Saturday, and only when the sky
       actually reaches astronomical darkness for long enough to be worth the
       drive. Below an hour of true dark the session is not offered. */
    if ((dow === 4 || dow === 5 || dow === 6) && !noDark && win.darkMinutes >= 60) {
      var cap2 = 24;
      var sold2 = seeded(seed + 907, 8, cap2);
      out.push({
        kind: 'telescope',
        id: iso + '-scope',
        date: iso,
        title: 'Telescope night on the 1.2 m',
        blurb: 'Two and a half hours at the eyepiece of the Fell Telescope with a duty ' +
               'astronomer, starting when the sky reaches astronomical darkness. Cancelled ' +
               'and refunded in full if the cloud does not clear.',
        minutes: 150,
        age: '12+',
        startsAt: win.darkStart,
        darkMinutes: win.darkMinutes,
        capacity: cap2,
        remaining: Math.max(0, cap2 - sold2),
        price: tickets.telescopeNight,
        priceNote: 'Weather-dependent'
      });
    }

    /* When the sky never darkens, the fell turns its instruments on the Sun
       instead — which is the honest thing to programme in June. */
    if (noDark && dow !== 2) {
      var cap3 = 30;
      var sold3 = seeded(seed + 55, 4, cap3);
      out.push({
        kind: 'solar',
        id: iso + '-solar',
        date: iso,
        title: 'Solar observing on the terrace',
        blurb: 'Hydrogen-alpha and white-light views of the photosphere, prominences and ' +
               'whatever sunspots are turned our way. Runs through the light months, when ' +
               'the night sky here never gets dark enough for deep-sky work.',
        minutes: 60,
        age: 'All ages',
        startsAt: atLocalHour(date, 14),
        capacity: cap3,
        remaining: Math.max(0, cap3 - sold3),
        price: tickets.solarSession,
        priceNote: 'Cloud-dependent'
      });
    }

    /* Evening lecture on the first Thursday of the month. */
    if (dow === 4 && date.getDate() <= 7) {
      var cap4 = 120;
      out.push({
        kind: 'lecture',
        id: iso + '-lecture',
        date: iso,
        title: 'Fell Lecture: ' + lectureTitle(seed),
        blurb: 'The monthly evening lecture in the Ransome Room, followed by questions and ' +
               'the dome if the sky is clear.',
        minutes: 75,
        age: '14+',
        startsAt: atLocalHour(date, 19),
        capacity: cap4,
        remaining: Math.max(0, cap4 - seeded(seed + 12, 30, cap4)),
        price: tickets.lecture,
        priceNote: 'Members free'
      });
    }

    return out.sort(function (a, b) { return a.startsAt - b.startsAt; });
  }

  var LECTURES = [
    'What the Gaia catalogue did to the shape of the galaxy',
    'Reading a light curve: how we weigh a planet we cannot see',
    'The sky before street lighting',
    'Two hundred years of the Cumbrian weather record',
    'Radio astronomy in a valley: fighting the noise floor',
    'How an observatory decides what to point at'
  ];
  function lectureTitle(seed) { return LECTURES[seed % LECTURES.length]; }

  /* Build a Date at a given local wall-clock hour at the observatory. Going
     through the formatter rather than assuming an offset keeps this correct
     across the March and October clock changes. */
  function atLocalHour(date, hour) {
    var h = Math.floor(hour), m = Math.round((hour - h) * 60);
    var guess = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), h, m));
    var shown = new Date(guess.toLocaleString('en-US', { timeZone: site.timeZone }));
    var utcEcho = new Date(guess.toLocaleString('en-US', { timeZone: 'UTC' }));
    return new Date(guess.getTime() + (utcEcho - shown));
  }

  /* The next `days` days of programme, flattened. */
  function programme(days, from) {
    var start = from || new Date();
    var out = [];
    for (var i = 0; i < days; i++) {
      var d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      out = out.concat(sessionsFor(d));
    }
    return out;
  }

  /* ---- Basket ------------------------------------------------------------ */

  var KEY = 'vela.basket.v1';
  var MEMBER_KEY = 'vela.member.v1';

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      var v = raw ? JSON.parse(raw) : [];
      return Array.isArray(v) ? v : [];
    } catch (e) { return []; }
  }

  function write(lines) {
    try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch (e) { /* private mode */ }
    root.dispatchEvent(new CustomEvent('vela:basket', { detail: { lines: lines } }));
  }

  function isMember() {
    try { return localStorage.getItem(MEMBER_KEY) === '1'; } catch (e) { return false; }
  }
  function setMember(on) {
    try { localStorage.setItem(MEMBER_KEY, on ? '1' : '0'); } catch (e) { /* private mode */ }
    root.dispatchEvent(new CustomEvent('vela:basket', { detail: { lines: read() } }));
  }

  var basket = {
    lines: read,
    count: function () {
      return read().reduce(function (n, l) { return n + l.qty; }, 0);
    },
    add: function (line) {
      var lines = read();
      var found = null;
      for (var i = 0; i < lines.length; i++) {
        if (lines[i].sku === line.sku) { found = lines[i]; break; }
      }
      if (found) found.qty += (line.qty || 1);
      else lines.push({
        sku: line.sku, title: line.title, meta: line.meta || '',
        unit: line.unit, qty: line.qty || 1, kind: line.kind || 'ticket',
        discountable: line.discountable !== false
      });
      write(lines);
      return lines;
    },
    setQty: function (sku, qty) {
      var lines = read().map(function (l) {
        if (l.sku === sku) l.qty = Math.max(0, qty);
        return l;
      }).filter(function (l) { return l.qty > 0; });
      write(lines);
      return lines;
    },
    remove: function (sku) {
      write(read().filter(function (l) { return l.sku !== sku; }));
    },
    clear: function () { write([]); },
    isMember: isMember,
    setMember: setMember,

    /* Every figure the checkout shows, computed from the lines. Membership in
       the basket applies its own discount to the same visit, which is the
       behaviour the membership page promises. */
    totals: function () {
      var lines = read();
      var member = isMember() || lines.some(function (l) { return l.kind === 'membership'; });
      var gross = 0, discountable = 0, membershipCost = 0;
      lines.forEach(function (l) {
        var sum = l.unit * l.qty;
        gross += sum;
        if (l.kind === 'membership') membershipCost += sum;
        else if (l.discountable) discountable += sum;
      });
      var saving = member ? Math.round(discountable * tickets.memberDiscount) : 0;
      return {
        lines: lines,
        member: member,
        gross: gross,
        discountable: discountable,
        membershipCost: membershipCost,
        saving: saving,
        total: gross - saving,
        /* What a non-member would save by joining today, for the prompt on
           the basket. Only worth showing when it beats the joining fee. */
        wouldSave: member ? 0 : Math.round(discountable * tickets.memberDiscount)
      };
    }
  };

  root.VELA = {
    site: site,
    tickets: tickets,
    membership: membership,
    shows: shows,
    programme: programme,
    sessionsFor: sessionsFor,
    basket: basket,
    money: money,
    localTime: localTime,
    dayLabel: dayLabel,
    isoDate: isoDate,
    atLocalHour: atLocalHour
  };
})(window);
