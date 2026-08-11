/* ============================================================================
   SALTFIELD — house data, rates, hold, and the light
   ----------------------------------------------------------------------------
   One source of truth for every page. The hold (a room + dates a guest is
   carrying toward the booking page) lives in localStorage so it survives
   navigation, and every page listens to the same change event.

   The rate engine prices each night in the season that night falls in, so a
   stay that crosses a season boundary is priced night by night — the quote the
   room page shows is the quote the booking page charges, because they are the
   same function.
   ========================================================================== */
(function (root) {
  'use strict';

  var KEY = 'saltfield.hold.v1';

  /* -- the rooms ---------------------------------------------------------- */
  var ROOMS = [
    { id: 'fen',     no: '01', name: 'The Fen',      img: 'room-fen.webp',
      alt: 'A wide bed under an oat-coloured spread in a pale room, morning light from a floor window.',
      sleeps: 2, bed: 'King', bath: 'Shower room', outlook: 'field',
      floor: 'Ground floor', sqm: 26, rate: 340,
      line: 'The quiet one. A gable of pale plaster over the tidal field, and nothing on the walls to argue with the light.',
      details: ['Handmade oak bed, linen dressed', 'Deep window seat over the field', 'Shower room in tadelakt plaster', 'No television, by design'] },

    { id: 'gull',    no: '02', name: 'The Gull',     img: 'room-gull.webp',
      alt: 'A white room with a low dressed bed, a reading lamp and a small green plant.',
      sleeps: 2, bed: 'Queen', bath: 'Shower room', outlook: 'dunes',
      floor: 'First floor', sqm: 22, rate: 310,
      line: 'White on white at the top of the stairs. The smallest room and the first to be asked for again.',
      details: ['Low oak bed under the eave', 'Dune light both ends of the day', 'Writing shelf and a good chair', 'Shower room across a private landing'] },

    { id: 'bay',     no: '03', name: 'The Bay',      img: 'room-bay.webp',
      alt: 'A long room with a bay of curtained windows, a sofa and a low table beside the bed.',
      sleeps: 3, bed: 'King + day bed', bath: 'Bathroom with tub', outlook: 'sea',
      floor: 'First floor', sqm: 38, rate: 420,
      line: 'The big one. A bow of five windows holds the afternoon, and the day bed means one more can stay.',
      details: ['Five-window bow with the long view', 'Day bed for a third guest', 'Bathroom with a cast tub', 'Sitting corner that keeps the sun'] },

    { id: 'keepers', no: '04', name: "The Keeper's", img: 'room-keepers.webp',
      alt: 'A panelled room with a timber bedhead, striped cushions and a small woven lamp lit warm.',
      sleeps: 2, bed: 'King', bath: 'Shower room', outlook: 'garden',
      floor: 'Ground floor', sqm: 28, rate: 360,
      line: 'Panelled and low-lit, nearest the kitchen garden. Named for the man who kept the light down the coast.',
      details: ['Painted panelling to the ceiling', 'Steps straight to the garden', 'Bedside lamps you will want at home', 'The warmest room in a north wind'] },

    { id: 'heron',   no: '05', name: 'The Heron',    img: 'room-heron.webp',
      alt: 'A timber-floored room with a wool throw across the bed and gauze curtains at a bright window.',
      sleeps: 2, bed: 'Queen + cot', bath: 'Shower room', outlook: 'garden',
      floor: 'First floor', sqm: 25, rate: 330,
      line: 'Timber floors, a wool throw, and the garden below the window. The cot fits without the room noticing.',
      details: ['Cot or small bed on request', 'Garden outlook to the fruit wall', 'Old boards, new mattress', 'Blackout behind the gauze'] },

    { id: 'lantern', no: '06', name: 'The Lantern',  img: 'room-lantern.webp',
      alt: 'A whitewashed room with a woven pendant lamp glowing over a rattan bedhead.',
      sleeps: 2, bed: 'Queen', bath: 'Bathroom with tub', outlook: 'dunes',
      floor: 'Top of the house', sqm: 24, rate: 350,
      line: 'Up under the roof, lit like its name after dark. The one photographers ask for.',
      details: ['Woven pendant over the bed', 'Smallest window, biggest sky', 'Tub under the slope of the roof', 'Steepest stairs in the house — fair warning'] }
  ];

  /* -- seasons ------------------------------------------------------------
     Priced per NIGHT by the month that night begins in. Kept to three bands
     so a guest can hold the whole system in their head.                    */
  var SEASONS = {
    high:     { months: [5, 6, 7],           mult: 1.25, label: 'High summer' },
    shoulder: { months: [3, 4, 8, 9],        mult: 1.0,  label: 'Season' },
    low:      { months: [0, 1, 2, 10, 11],   mult: 0.85, label: 'The quiet months' }
  };

  var MIN_NIGHTS = 2, MAX_NIGHTS = 28, TAX = 0.09;

  function seasonOf(date) {
    var m = date.getMonth();
    for (var k in SEASONS) if (SEASONS[k].months.indexOf(m) > -1) return k;
    return 'shoulder';
  }

  function byId(id) {
    for (var i = 0; i < ROOMS.length; i++) if (ROOMS[i].id === id) return ROOMS[i];
    return null;
  }

  function money(n) {
    return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  /* Parse a yyyy-mm-dd input value as a LOCAL date — new Date('yyyy-mm-dd')
     is UTC and shifts a day in west-of-Greenwich timezones. */
  function parseDay(v) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v || '')) return null;
    var p = v.split('-');
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    return isNaN(d) ? null : d;
  }

  function today0() {
    var t = new Date(); t.setHours(0, 0, 0, 0); return t;
  }

  /* -- the quote -----------------------------------------------------------
     Returns {ok:false, why} for anything unpriceable, otherwise the full
     night-by-night breakdown. Every caller renders from this one shape.    */
  function quote(roomId, inV, outV) {
    var room = byId(roomId);
    if (!room) return { ok: false, why: 'Pick a room.' };
    var din = parseDay(inV), dout = parseDay(outV);
    if (!din || !dout) return { ok: false, why: 'Pick both dates.' };
    if (din < today0()) return { ok: false, why: 'Arrival is in the past.' };
    var nights = Math.round((dout - din) / 86400000);
    if (nights <= 0) return { ok: false, why: 'Departure must come after arrival.' };
    if (nights < MIN_NIGHTS) return { ok: false, why: 'The house asks for ' + MIN_NIGHTS + ' nights or more.' };
    if (nights > MAX_NIGHTS) return { ok: false, why: 'For stays past ' + MAX_NIGHTS + ' nights, write to us instead.' };

    var bands = {}, order = [];
    var d = new Date(din);
    for (var i = 0; i < nights; i++) {
      var s = seasonOf(d);
      if (!bands[s]) { bands[s] = { season: s, label: SEASONS[s].label, nights: 0, perNight: Math.round(room.rate * SEASONS[s].mult) }; order.push(s); }
      bands[s].nights++;
      d.setDate(d.getDate() + 1);
    }
    var lodging = 0;
    var lines = order.map(function (k) {
      var b = bands[k]; b.sum = b.perNight * b.nights; lodging += b.sum; return b;
    });
    var tax = Math.round(lodging * TAX * 100) / 100;
    return {
      ok: true, room: room, nights: nights, in: din, out: dout,
      lines: lines, lodging: lodging, tax: tax, total: lodging + tax
    };
  }

  /* -- the hold ------------------------------------------------------------ */
  function readHold() {
    try {
      var h = JSON.parse(localStorage.getItem(KEY) || 'null');
      return (h && byId(h.room)) ? h : null;
    } catch (e) { return null; }
  }
  function writeHold(h) {
    try {
      if (h) localStorage.setItem(KEY, JSON.stringify(h));
      else localStorage.removeItem(KEY);
    } catch (e) { /* non-fatal */ }
    document.dispatchEvent(new CustomEvent('saltfield:hold', { detail: readHold() }));
  }

  /* -- the light -----------------------------------------------------------
     Sunrise and sunset at the house (54.6°N, 0.9°W), NOAA's simplified
     equations with the equation-of-time correction. Times are the house's
     own clock (UTC), whatever clock the visitor reads this on — the header
     says "at the house" for that reason.                                   */
  var LAT = 54.6, LON = -0.9;

  function light(date) {
    date = date || new Date();
    var start = Date.UTC(date.getUTCFullYear(), 0, 0);
    var n = Math.floor((Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - start) / 86400000);
    var rad = Math.PI / 180;
    var decl = -23.44 * Math.cos(2 * Math.PI / 365 * (n + 10));            // declination, deg
    var B = 2 * Math.PI * (n - 81) / 364;
    var eot = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B); // minutes
    var cosH = -Math.tan(LAT * rad) * Math.tan(decl * rad);
    cosH = Math.max(-1, Math.min(1, cosH));
    var H = Math.acos(cosH) / rad;                                          // half day arc, deg
    var noonUTC = 12 - LON / 15 - eot / 60;                                 // hours
    function hm(hours) {
      var h = Math.floor(hours), m = Math.round((hours - h) * 60);
      if (m === 60) { h++; m = 0; }
      return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
    }
    return { first: hm(noonUTC - H / 15), last: hm(noonUTC + H / 15) };
  }

  root.SALTFIELD = {
    rooms: ROOMS, byId: byId, money: money,
    seasons: SEASONS, seasonOf: seasonOf,
    minNights: MIN_NIGHTS, maxNights: MAX_NIGHTS, tax: TAX,
    quote: quote, parseDay: parseDay, today0: today0,
    hold: { read: readHold, write: writeHold, clear: function () { writeHold(null); } },
    light: light
  };
})(window);
