/* APOGEE — the business, as data.
 *
 * Four aircraft types, four bases, the programme, and the cities the route
 * tools know about. Every figure the pages print — a flight time, the
 * hours a leg costs, whether a type can do it without a stop — is computed
 * here from the same numbers, so nothing on the site can disagree with
 * itself.
 */
window.APOGEE = (function () {
  'use strict';

  /* The fleet. One cabin standard across four sizes. Ranges are the
   * manufacturer's headline figures rounded down to the hundred; cruise is
   * a normal long-range cruise, not the placard. Cabin dimensions in metres. */
  var FLEET = [
    { key: 'long', name: 'Global 7500', tag: 'Long', count: 3, seats: 14, beds: 8, range: 7700, cruise: 488, ceiling: 51000,
      cabin: { l: 16.6, w: 2.44, h: 1.88 }, zones: 4, rate: 15800,
      line: 'Four living spaces and a bed that is a bed. London to Singapore, Dubai to Los Angeles, without touching the ground.',
      pairs: ['London – Singapore', 'Dubai – Los Angeles', 'Geneva – Tokyo'] },
    { key: 'super', name: 'Praetor 600', tag: 'Super-mid', count: 4, seats: 8, beds: 2, range: 4000, cruise: 466, ceiling: 45000,
      cabin: { l: 8.4, w: 2.08, h: 1.83 }, zones: 2, rate: 8900,
      line: 'Flat floor, full-height cabin, a real galley. London to Dubai or New York to Los Angeles with fuel to spare.',
      pairs: ['London – Dubai', 'New York – Los Angeles', 'Singapore – Tokyo'] },
    { key: 'mid', name: 'Challenger 350', tag: 'Mid', count: 5, seats: 9, beds: 2, range: 3200, cruise: 470, ceiling: 45000,
      cabin: { l: 8.7, w: 2.19, h: 1.85 }, zones: 2, rate: 10600,
      line: 'The widest cabin in its class and the one we own most of. Europe and the Gulf in a single sector, every time.',
      pairs: ['London – Riyadh', 'Geneva – Marrakech', 'Nice – Reykjavik'] },
    { key: 'light', name: 'Phenom 300E', tag: 'Light', count: 2, seats: 6, beds: 0, range: 2000, cruise: 453, ceiling: 45000,
      cabin: { l: 5.2, w: 1.55, h: 1.50 }, zones: 1, rate: 6400,
      line: 'For the two-hour sector where a bigger aircraft is a waste of everyone’s time. Geneva to Ibiza before lunch.',
      pairs: ['Geneva – Ibiza', 'London – Nice', 'Munich – Lisbon'] }
  ];

  var BASES = [
    { key: 'FAB', city: 'London', airport: 'Farnborough', lat: 51.276, lon: -0.776 },
    { key: 'GVA', city: 'Geneva', airport: 'Cointrin', lat: 46.238, lon: 6.109 },
    { key: 'DWC', city: 'Dubai', airport: 'Al Maktoum', lat: 24.897, lon: 55.161 },
    { key: 'XSP', city: 'Singapore', airport: 'Seletar', lat: 1.417, lon: 103.868 }
  ];

  /* The cities the route tools know. Coordinates are the business-aviation
   * airport where one exists, not the city centre. */
  var CITIES = [
    { key: 'london', name: 'London', apt: 'Farnborough', lat: 51.276, lon: -0.776 },
    { key: 'paris', name: 'Paris', apt: 'Le Bourget', lat: 48.969, lon: 2.441 },
    { key: 'geneva', name: 'Geneva', apt: 'Cointrin', lat: 46.238, lon: 6.109 },
    { key: 'nice', name: 'Nice', apt: 'Côte d’Azur', lat: 43.665, lon: 7.215 },
    { key: 'milan', name: 'Milan', apt: 'Linate', lat: 45.449, lon: 9.278 },
    { key: 'zurich', name: 'Zurich', apt: 'Kloten', lat: 47.458, lon: 8.548 },
    { key: 'munich', name: 'Munich', apt: 'Franz Josef Strauss', lat: 48.354, lon: 11.786 },
    { key: 'madrid', name: 'Madrid', apt: 'Barajas', lat: 40.472, lon: -3.561 },
    { key: 'lisbon', name: 'Lisbon', apt: 'Humberto Delgado', lat: 38.774, lon: -9.134 },
    { key: 'ibiza', name: 'Ibiza', apt: 'Ibiza', lat: 38.873, lon: 1.373 },
    { key: 'reykjavik', name: 'Reykjavík', apt: 'Keflavík', lat: 63.985, lon: -22.605 },
    { key: 'marrakech', name: 'Marrakech', apt: 'Menara', lat: 31.607, lon: -8.036 },
    { key: 'dubai', name: 'Dubai', apt: 'Al Maktoum', lat: 24.897, lon: 55.161 },
    { key: 'doha', name: 'Doha', apt: 'Hamad', lat: 25.273, lon: 51.608 },
    { key: 'riyadh', name: 'Riyadh', apt: 'King Khalid', lat: 24.958, lon: 46.699 },
    { key: 'nairobi', name: 'Nairobi', apt: 'Wilson', lat: -1.322, lon: 36.815 },
    { key: 'capetown', name: 'Cape Town', apt: 'Cape Town', lat: -33.965, lon: 18.602 },
    { key: 'mumbai', name: 'Mumbai', apt: 'Chhatrapati Shivaji', lat: 19.089, lon: 72.868 },
    { key: 'male', name: 'Malé', apt: 'Velana', lat: 4.192, lon: 73.529 },
    { key: 'singapore', name: 'Singapore', apt: 'Seletar', lat: 1.417, lon: 103.868 },
    { key: 'hongkong', name: 'Hong Kong', apt: 'Chek Lap Kok', lat: 22.308, lon: 113.918 },
    { key: 'tokyo', name: 'Tokyo', apt: 'Haneda', lat: 35.553, lon: 139.781 },
    { key: 'sydney', name: 'Sydney', apt: 'Kingsford Smith', lat: -33.946, lon: 151.177 },
    { key: 'newyork', name: 'New York', apt: 'Teterboro', lat: 40.850, lon: -74.061 },
    { key: 'miami', name: 'Miami', apt: 'Opa-locka', lat: 25.907, lon: -80.278 },
    { key: 'aspen', name: 'Aspen', apt: 'Pitkin County', lat: 39.223, lon: -106.869 },
    { key: 'losangeles', name: 'Los Angeles', apt: 'Van Nuys', lat: 34.210, lon: -118.490 },
    { key: 'saopaulo', name: 'São Paulo', apt: 'Congonhas', lat: -23.627, lon: -46.655 }
  ];

  /* The programme: hours a year, bought up front, flown on any aircraft in
   * the fleet at that aircraft's rate. The rate is held for the term. */
  var PROGRAMME = [
    { key: 'fifty', hours: 50, term: 1, name: 'Fifty', line: 'Enough for a season. Around twenty-five sectors in Europe, or ten long ones.' },
    { key: 'hundred', hours: 100, term: 2, name: 'One hundred', line: 'The one most members hold. Rate fixed for two years, hours carried over.' },
    { key: 'twohundred', hours: 200, term: 3, name: 'Two hundred', line: 'A household, a board, or one person who lives in three cities. Three-year term, a dedicated crew.' }
  ];
  var TERMS = [
    'Guaranteed availability with twenty-four hours’ notice, anywhere the fleet is based',
    'No positioning charges and no empty legs on the invoice',
    'No peak-day surcharges: Christmas costs what March costs',
    'The same cabin standard and the same host on every aircraft in the fleet',
    'Hours carried over the term; unused hours refunded at the end of it',
    'Fuel, catering, ground handling and landing fees inside the rate'
  ];

  /* ---- geometry ---------------------------------------------------- */

  var R_NM = 3440.065;
  function rad(d) { return d * Math.PI / 180; }
  function deg(r) { return r * 180 / Math.PI; }

  /* Great-circle distance in nautical miles. */
  function distance(a, b) {
    var p1 = rad(a.lat), p2 = rad(b.lat), dp = rad(b.lat - a.lat), dl = rad(b.lon - a.lon);
    var h = Math.sin(dp / 2) * Math.sin(dp / 2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
    return 2 * R_NM * Math.asin(Math.min(1, Math.sqrt(h)));
  }

  /* n points along the great circle from a to b, inclusive, as {lat, lon}. */
  function arc(a, b, n) {
    var p1 = rad(a.lat), l1 = rad(a.lon), p2 = rad(b.lat), l2 = rad(b.lon);
    var d = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin((p1 - p2) / 2), 2) + Math.cos(p1) * Math.cos(p2) * Math.pow(Math.sin((l1 - l2) / 2), 2)));
    var out = [];
    if (d < 1e-9) return [{ lat: a.lat, lon: a.lon }, { lat: b.lat, lon: b.lon }];
    for (var i = 0; i <= n; i++) {
      var f = i / n;
      var A = Math.sin((1 - f) * d) / Math.sin(d), B = Math.sin(f * d) / Math.sin(d);
      var x = A * Math.cos(p1) * Math.cos(l1) + B * Math.cos(p2) * Math.cos(l2);
      var y = A * Math.cos(p1) * Math.sin(l1) + B * Math.cos(p2) * Math.sin(l2);
      var z = A * Math.sin(p1) + B * Math.sin(p2);
      out.push({ lat: deg(Math.atan2(z, Math.sqrt(x * x + y * y))), lon: deg(Math.atan2(y, x)) });
    }
    return out;
  }

  /* ---- operations -------------------------------------------------- */

  /* Block time for a leg on a type: distance at cruise, plus taxi, climb
   * and descent, plus a technical stop when the leg is beyond the range
   * we will plan with (ninety per cent of the headline, for reserves). */
  function leg(type, nm) {
    var planning = type.range * 0.9;
    var stops = nm <= planning ? 0 : Math.ceil(nm / planning) - 1;
    var hours = nm / type.cruise + 0.45 + stops * 0.95;
    return { nm: Math.round(nm), hours: Math.round(hours * 10) / 10, stops: stops, nonstop: stops === 0 };
  }

  function types(nm) { return FLEET.map(function (t) { var l = leg(t, nm); l.type = t; return l; }); }

  function city(key) { for (var i = 0; i < CITIES.length; i++) if (CITIES[i].key === key) return CITIES[i]; return null; }
  function type(key) { for (var i = 0; i < FLEET.length; i++) if (FLEET[i].key === key) return FLEET[i]; return null; }

  /* ISA temperature at an altitude in feet. The lapse stops at the
   * tropopause; above it the air is a steady −56.5. */
  function isa(ft) { return ft < 36089 ? 15 - 1.98 * ft / 1000 : -56.5; }

  function fmtHours(h) {
    var hh = Math.floor(h), mm = Math.round((h - hh) * 60);
    if (mm === 60) { hh++; mm = 0; }
    return hh + 'h ' + (mm < 10 ? '0' : '') + mm;
  }
  function fmtMoney(n) { return '$' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
  function fmtNum(n) { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

  return {
    fleet: FLEET, bases: BASES, cities: CITIES, programme: PROGRAMME, terms: TERMS,
    distance: distance, arc: arc, leg: leg, types: types, city: city, type: type, isa: isa,
    fmtHours: fmtHours, fmtMoney: fmtMoney, fmtNum: fmtNum
  };
})();
