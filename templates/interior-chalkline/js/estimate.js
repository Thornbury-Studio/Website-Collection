/* CHALKLINE — the estimator.

   A renovation quote in Singapore is priced by the room and by the foot:
   carpentry per foot-run, flooring per square foot, electrical per point,
   wet works per bathroom. This module does exactly that, from the plan's
   own geometry, and returns every line so the page can print the working
   under the total. Nothing here is a lookup table with three answers.

   Runs in the browser and under node (the emit script prints the hero
   caption from it). Depends on CHALK_PLANS for measurements. */

(function (root) {
  'use strict';

  var P = root.CHALK_PLANS;

  /* Rates in Singapore dollars. Supply and install unless stated. */
  var R = {
    paint:       { rate: 2.2,  unit: 'sq ft', label: 'Painting, walls and ceiling' },
    vinyl:       { rate: 6.8,  unit: 'sq ft', label: 'Vinyl flooring, overlay' },
    hackFloor:   { rate: 4.5,  unit: 'sq ft', label: 'Hack and clear existing floor' },
    hackWall:    { rate: 6.0,  unit: 'sq ft', label: 'Hack existing wall tiles' },
    tileFloor:   { rate: 15.5, unit: 'sq ft', label: 'Floor tiles, screed and lay' },
    tileOverlay: { rate: 13.5, unit: 'sq ft', label: 'Floor tiles, overlay' },
    tileWall:    { rate: 16.5, unit: 'sq ft', label: 'Wall tiles to ceiling' },
    waterproof:  { rate: 800,  unit: 'room',  label: 'Waterproofing membrane and test' },
    point:       { rate: 85,   unit: 'point', label: 'Electrical points' },
    downlight:   { rate: 48,   unit: 'no.',   label: 'Downlights' },
    lbox:        { rate: 14,   unit: 'ft',    label: 'L-box with cove lighting' },
    kitchenCab:  { rate: 320,  unit: 'ft',    label: 'Kitchen carpentry, top and bottom, soft-close' },
    quartz:      { rate: 95,   unit: 'ft',    label: 'Quartz worktop' },
    splash:      { rate: 16.5, unit: 'sq ft', label: 'Backsplash tiles' },
    wardrobe:    { rate: 335,  unit: 'ft',    label: 'Full-height wardrobe' },
    tvConsole:   { rate: 185,  unit: 'ft',    label: 'TV console' },
    feature:     { rate: 120,  unit: 'ft',    label: 'Fluted feature wall' },
    platform:    { rate: 160,  unit: 'ft',    label: 'Platform bed with headboard' },
    desk:        { rate: 210,  unit: 'ft',    label: 'Built-in desk' },
    shelves:     { rate: 700,  unit: 'set',   label: 'Open shelving' },
    shoeCab:     { rate: 290,  unit: 'ft',    label: 'Full-height shoe cabinet' },
    vanity:      { rate: 720,  unit: 'no.',   label: 'Vanity with basin' },
    screen:      { rate: 950,  unit: 'no.',   label: 'Frameless glass shower screen' },
    sanitary:    { rate: 1850, unit: 'set',   label: 'Sanitary ware, supply' },
    plumbBath:   { rate: 2400, unit: 'room',  label: 'Plumbing, re-run and fit' },
    plumbKit:    { rate: 950,  unit: 'room',  label: 'Kitchen plumbing' },
    plumbYard:   { rate: 450,  unit: 'room',  label: 'Yard sink and tap' },
    doorBed:     { rate: 460,  unit: 'no.',   label: 'Bedroom door' },
    doorBath:    { rate: 540,  unit: 'no.',   label: 'Bathroom door, PVC folding' },
    mainDoor:    { rate: 1350, unit: 'no.',   label: 'Main door, fire-rated' },
    slidingKit:  { rate: 1600, unit: 'no.',   label: 'Kitchen glass sliding door' },
    /* flat-level */
    protection:  { rate: 420,  unit: 'flat',  label: 'Protection to lift, corridor and floors' },
    haulage:     { rate: 650,  unit: 'flat',  label: 'Haulage and debris disposal' },
    chemWash:    { rate: 380,  unit: 'flat',  label: 'Chemical wash and handover clean' },
    permit:      { rate: 300,  unit: 'flat',  label: 'Renovation permit and submissions' }
  };

  var SCOPES = {
    light:    { label: 'Light',    blurb: 'Paint, lights and points. Nothing hacked, nothing built.' },
    standard: { label: 'Standard', blurb: 'Overlay flooring, carpentry, lighting and points.' },
    full:     { label: 'Full',     blurb: 'Hack to bare, re-tile, re-plumb, then build.' }
  };

  var SQFT = 10.7639, FT = 3.28084, WALL_H_FT = 7.9;

  function r10(n) { return Math.round(n / 10) * 10; }
  function q1(n) { return Math.round(n * 10) / 10; }

  /* one line: quantity × rate, rounded to the dollar-ten */
  function line(key, qty, note) {
    var d = R[key];
    var q = q1(qty);
    return { key: key, label: d.label + (note ? ', ' + note : ''), qty: q, unit: d.unit, rate: d.rate, amount: r10(q * d.rate) };
  }

  /* ---- per-kind line generators ------------------------------------------ */

  function living(m, scope) {
    var f = m.area * SQFT, L = [];
    L.push(line('paint', f));
    if (scope === 'light') { L.push(line('point', 6)); L.push(line('downlight', 6)); return L; }
    if (scope === 'full') { L.push(line('hackFloor', f)); L.push(line('tileFloor', f)); }
    else L.push(line('vinyl', f));
    L.push(line('lbox', m.perim * FT * 0.5, 'two sides'));
    L.push(line('tvConsole', 8));
    if (scope === 'full') L.push(line('feature', Math.min(m.long * FT, 12)));
    L.push(line('point', 14)); L.push(line('downlight', 10));
    return L;
  }

  function kitchen(m, scope) {
    var f = m.area * SQFT, run = m.long * FT * 1.1, wall = m.perim * FT * WALL_H_FT, L = [];
    L.push(line('paint', f * 0.6, 'ceiling and exposed wall'));
    if (scope === 'light') { L.push(line('point', 4)); L.push(line('downlight', 4)); return L; }
    if (scope === 'full') {
      L.push(line('hackFloor', f)); L.push(line('hackWall', wall));
      L.push(line('tileFloor', f)); L.push(line('tileWall', wall)); L.push(line('waterproof', 1));
    } else {
      L.push(line('splash', run * 2, 'above the worktop'));
    }
    L.push(line('kitchenCab', run, 'L-run')); L.push(line('quartz', run));
    L.push(line('plumbKit', 1)); L.push(line('point', 10)); L.push(line('downlight', 4));
    if (scope === 'full') L.push(line('slidingKit', 1));
    return L;
  }

  function bed(m, scope, study) {
    var f = m.area * SQFT, L = [];
    L.push(line('paint', f));
    if (scope === 'light') { L.push(line('point', 4)); L.push(line('downlight', 4)); return L; }
    if (scope === 'full') L.push(line('hackFloor', f));
    L.push(line('vinyl', f));
    if (study) { L.push(line('desk', m.long * FT * 0.8, 'window wall')); L.push(line('shelves', 1)); }
    else L.push(line('wardrobe', m.short * FT * 0.8));
    if (scope === 'full' && !study) L.push(line('platform', m.short * FT * 0.6));
    L.push(line('point', 8)); L.push(line('downlight', 4)); L.push(line('doorBed', 1));
    return L;
  }

  function bath(m, scope) {
    var f = m.area * SQFT, wall = m.perim * FT * WALL_H_FT, L = [];
    if (scope === 'light') { L.push(line('sanitary', 1)); L.push(line('vanity', 1)); L.push(line('point', 2)); return L; }
    if (scope === 'full') {
      L.push(line('hackFloor', f)); L.push(line('hackWall', wall)); L.push(line('waterproof', 1));
      L.push(line('tileFloor', f)); L.push(line('tileWall', wall));
    } else {
      L.push(line('tileOverlay', f)); L.push(line('tileWall', wall * 0.8, 'overlay'));
    }
    L.push(line('plumbBath', 1)); L.push(line('sanitary', 1)); L.push(line('vanity', 1)); L.push(line('screen', 1));
    L.push(line('point', 3)); L.push(line('downlight', 2));
    if (scope === 'full') L.push(line('doorBath', 1));
    return L;
  }

  function entry(m, scope) {
    var f = m.area * SQFT, L = [];
    L.push(line('paint', f));
    L.push(line('point', 2)); L.push(line('downlight', 3));
    if (scope === 'light') return L;
    if (scope === 'full') { L.push(line('hackFloor', f)); L.push(line('tileFloor', f)); }
    else L.push(line('vinyl', f));
    L.push(line('shoeCab', 6));
    if (scope === 'full') L.push(line('mainDoor', 1));
    return L;
  }

  function hs(m) {
    var f = m.area * SQFT;
    return [line('paint', f), line('vinyl', f), line('point', 2)];
  }

  function yard(m, scope) {
    var f = m.area * SQFT, L = [line('paint', f), line('point', 2)];
    if (scope === 'standard') { L.push(line('tileOverlay', f)); L.push(line('plumbYard', 1)); }
    return L;
  }

  function store(m, scope) {
    var f = m.area * SQFT, L = [line('paint', f), line('point', 1)];
    if (scope === 'standard') { L.push(line('vinyl', f)); L.push(line('shelves', 1)); }
    return L;
  }

  function balcony(m, scope) {
    var f = m.area * SQFT, L = [line('paint', f), line('point', 1)];
    if (scope === 'standard') L.push(line('tileOverlay', f));
    return L;
  }

  var GEN = {
    living: living, kitchen: kitchen, bath: bath, entry: entry, hs: hs, yard: yard,
    store: store, utility: store, balcony: balcony,
    bed: function (m, s) { return bed(m, s, false); },
    study: function (m, s) { return bed(m, s, true); }
  };

  /* ---- the estimate ------------------------------------------------------- */

  /* picks: { roomId: 'light' | 'standard' | 'full' } */
  function estimate(planId, picks) {
    var plan = P.PLANS[planId];
    if (!plan) return null;
    var rooms = [], subtotal = 0, anyFull = false, any = false;

    plan.rooms.forEach(function (r) {
      var scope = picks[r.id];
      if (!scope) return;
      var allowed = P.KINDS[r.kind].scopes;
      if (allowed.indexOf(scope) === -1) scope = allowed[allowed.length - 1];
      var m = P.measure(r);
      var lines = GEN[r.kind](m, scope);
      var sum = lines.reduce(function (s, l) { return s + l.amount; }, 0);
      rooms.push({ id: r.id, name: r.name, kind: r.kind, scope: scope, area: q1(m.area), lines: lines, total: sum });
      subtotal += sum; any = true;
      if (scope === 'full') anyFull = true;
    });

    var site = [];
    if (any) {
      site.push(line('protection', 1));
      site.push(line('haulage', anyFull ? 1.6 : 1, anyFull ? 'with hacking debris' : ''));
      site.push(line('chemWash', 1));
      if (anyFull) site.push(line('permit', 1));
    }
    var siteTotal = site.reduce(function (s, l) { return s + l.amount; }, 0);
    subtotal += siteTotal;

    /* The band is honest about what an estimate is: material grades and
       site conditions move it a few percent either way. */
    var low = Math.round(subtotal * 0.93 / 500) * 500;
    var high = Math.round(subtotal * 1.08 / 500) * 500;
    return { plan: plan, rooms: rooms, site: site, siteTotal: siteTotal, subtotal: subtotal, low: low, high: high, anyFull: anyFull };
  }

  /* S$ formatting, no cents: a renovation estimate to the cent is a lie. */
  function money(n) {
    return 'S$' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function band(e) { return money(e.low) + ' – ' + money(e.high); }

  /* Weeks on site, from the scope mix: hacking adds, and every wet room
     adds its curing time. */
  function weeks(e) {
    var w = 2, wet = 0;
    e.rooms.forEach(function (r) {
      if (r.scope === 'full') w += (r.kind === 'bath' || r.kind === 'kitchen') ? 1.5 : 0.8;
      else if (r.scope === 'standard') w += 0.5;
      else w += 0.15;
      if (r.kind === 'bath' && r.scope !== 'light') wet++;
    });
    w += wet * 0.5;
    return Math.max(2, Math.round(w));
  }

  root.CHALK_EST = { R: R, SCOPES: SCOPES, estimate: estimate, money: money, band: band, weeks: weeks, line: line };

})(typeof window !== 'undefined' ? window : globalThis);
