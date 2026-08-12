/* NOON building sheet — one dial, four drawings, zero typed numbers.
   The page reads its building from body[data-building]; geometry beyond the
   shared registry (plan dimensions, drawing quirks) lives here. */
(function () {
  'use strict';
  var N = window.NN;
  var slug = document.body.getAttribute('data-building');
  var B = N.buildings[slug];
  if (!B) return;

  var PLANS = {
    lantern: { w: 46, d: 22, monitors: 4 },
    meridian: { w: 36, d: 18 },
    grain: { w: 30, d: 24, cols: { nx: 4, ny: 3 } },
    signal: { w: 9, d: 9 }
  };
  var plan = PLANS[slug];

  // bearing (deg from N) -> rectangle side for the plan drawing
  function sideOf(bearing) {
    var s = ['N', 'E', 'S', 'W'][Math.round(bearing / 90) % 4];
    return s;
  }

  /* ---------- state ---------- */

  var now = new Date();
  var rs = N.sun.riseSet();
  var t = N.clamp(now.getHours() + now.getMinutes() / 60, 5, 21);

  /* ---------- the dial ---------- */

  var rail = document.querySelector('.dial-rail');
  var range = document.getElementById('dialRange');
  if (rail && range) {
    // hour ticks 05..21
    for (var h = 5; h <= 21; h++) {
      var tick = document.createElement('span');
      tick.className = 'tick' + (h % 3 === 0 ? ' major' : '');
      tick.style.left = ((h - 5) / 16 * 100) + '%';
      rail.appendChild(tick);
    }
    // the lit span of the day
    var day = document.createElement('span');
    day.className = 'rail-day';
    var l = N.clamp((rs.rise - 5) / 16, 0, 1), r = N.clamp((rs.set - 5) / 16, 0, 1);
    day.style.left = (l * 100) + '%';
    day.style.width = ((r - l) * 100) + '%';
    rail.appendChild(day);

    range.value = t;
    range.addEventListener('input', function () {
      t = parseFloat(range.value);
      paint();
    });
  }

  /* ---------- sun-path card ---------- */

  var AZ0 = 45, AZ1 = 315, X0 = 24, X1 = 436, Y0 = 170, ALT1 = 62, Y1 = 22;
  function px(az) { return X0 + (az - AZ0) / (AZ1 - AZ0) * (X1 - X0); }
  function py(alt) { return Y0 - N.clamp(alt, 0, ALT1) / ALT1 * (Y0 - Y1); }

  function drawArc() {
    var svg = document.getElementById('sunpathSvg');
    if (!svg) return;
    var pts = [];
    for (var tt = rs.rise; tt <= rs.set; tt += 0.1) {
      var p = N.sun.position(tt);
      if (p.alt >= 0) pts.push(px(p.az).toFixed(1) + ',' + py(p.alt).toFixed(1));
    }
    document.getElementById('sunArc').setAttribute('points', pts.join(' '));
    // hour ticks on the arc
    var g = document.getElementById('arcHours');
    for (var hh = Math.ceil(rs.rise); hh <= Math.floor(rs.set); hh++) {
      if (hh % 3 !== 0) continue;
      var p2 = N.sun.position(hh);
      var c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      c.setAttribute('cx', px(p2.az)); c.setAttribute('cy', py(p2.alt));
      c.setAttribute('r', 1.6); c.setAttribute('fill', 'currentColor');
      g.appendChild(c);
      var tx = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      tx.setAttribute('x', px(p2.az)); tx.setAttribute('y', py(p2.alt) - 7);
      tx.setAttribute('text-anchor', 'middle');
      tx.textContent = (hh < 10 ? '0' : '') + hh;
      g.appendChild(tx);
    }
  }

  /* ---------- the plan ---------- */

  var PW = 460, PH = 320;
  function planScale() { return Math.min(380 / plan.w, 220 / plan.d); }

  function planRect() {
    var s = planScale();
    var w = plan.w * s, d = plan.d * s;
    return { x: (PW - w) / 2, y: (PH - d) / 2 - 14, w: w, h: d, s: s };
  }

  function buildPlanStatic() {
    var svg = document.getElementById('planSvg');
    if (!svg) return;
    var r = planRect();
    var ns = 'http://www.w3.org/2000/svg';
    // walls
    var rect = document.createElementNS(ns, 'rect');
    rect.setAttribute('x', r.x); rect.setAttribute('y', r.y);
    rect.setAttribute('width', r.w); rect.setAttribute('height', r.h);
    rect.setAttribute('class', 'wall');
    svg.appendChild(rect);

    // glass: monitors (lantern) or window walls mapped to sides
    if (plan.monitors) {
      for (var i = 1; i <= plan.monitors; i++) {
        var y = r.y + r.h * i / (plan.monitors + 1);
        var ln = document.createElementNS(ns, 'line');
        ln.setAttribute('x1', r.x + 8); ln.setAttribute('x2', r.x + r.w - 8);
        ln.setAttribute('y1', y); ln.setAttribute('y2', y);
        ln.setAttribute('class', 'glass');
        svg.appendChild(ln);
      }
    } else {
      B.walls.forEach(function (bearing) {
        var side = sideOf(bearing);
        var ln = document.createElementNS(ns, 'line');
        ln.setAttribute('class', 'glass');
        if (side === 'N') { ln.setAttribute('x1', r.x + 6); ln.setAttribute('x2', r.x + r.w - 6); ln.setAttribute('y1', r.y); ln.setAttribute('y2', r.y); }
        if (side === 'S') { ln.setAttribute('x1', r.x + 6); ln.setAttribute('x2', r.x + r.w - 6); ln.setAttribute('y1', r.y + r.h); ln.setAttribute('y2', r.y + r.h); }
        if (side === 'E') { ln.setAttribute('x1', r.x + r.w); ln.setAttribute('x2', r.x + r.w); ln.setAttribute('y1', r.y + 6); ln.setAttribute('y2', r.y + r.h - 6); }
        if (side === 'W') { ln.setAttribute('x1', r.x); ln.setAttribute('x2', r.x); ln.setAttribute('y1', r.y + 6); ln.setAttribute('y2', r.y + r.h - 6); }
        svg.appendChild(ln);
      });
    }

    // columns (grain)
    if (plan.cols) {
      for (var cx = 1; cx <= plan.cols.nx; cx++) {
        for (var cy = 1; cy <= plan.cols.ny; cy++) {
          var dot = document.createElementNS(ns, 'circle');
          dot.setAttribute('cx', r.x + r.w * cx / (plan.cols.nx + 1));
          dot.setAttribute('cy', r.y + r.h * cy / (plan.cols.ny + 1));
          dot.setAttribute('r', 2.6);
          dot.setAttribute('class', 'col');
          svg.appendChild(dot);
        }
      }
    }

    // dimension ticks
    function dim(x1, y1, x2, y2, label, tx, ty) {
      var d1 = document.createElementNS(ns, 'line');
      d1.setAttribute('x1', x1); d1.setAttribute('y1', y1);
      d1.setAttribute('x2', x2); d1.setAttribute('y2', y2);
      d1.setAttribute('class', 'dim');
      svg.appendChild(d1);
      var lt = document.createElementNS(ns, 'text');
      lt.setAttribute('x', tx); lt.setAttribute('y', ty);
      lt.setAttribute('text-anchor', 'middle');
      lt.textContent = label;
      svg.appendChild(lt);
    }
    dim(r.x, r.y + r.h + 16, r.x + r.w, r.y + r.h + 16, plan.w + ' m', r.x + r.w / 2, r.y + r.h + 30);
    dim(r.x - 16, r.y, r.x - 16, r.y + r.h, plan.d + ' m', r.x - 16, r.y - 8);

    // north arrow
    var na = document.createElementNS(ns, 'text');
    na.setAttribute('x', PW - 20); na.setAttribute('y', 18);
    na.setAttribute('text-anchor', 'middle');
    na.textContent = 'N ↑';
    svg.appendChild(na);
  }

  function paintPlanLight() {
    var g = document.getElementById('planLight');
    if (!g) return;
    while (g.firstChild) g.removeChild(g.firstChild);
    var ns = 'http://www.w3.org/2000/svg';
    var p = N.sun.position(t);
    var note = document.querySelector('[data-plan-note]');
    if (p.alt < 6) {
      if (note) note.textContent = 'Sun below the useful horizon — the room rests.';
      return;
    }
    var r = planRect();
    // light propagation vector in plan coords (x=E, y=S; north is up)
    var az = p.az * Math.PI / 180;
    var vx = -Math.sin(az), vy = Math.cos(az);
    var Lm = Math.min(3.2 / Math.tan(p.alt * Math.PI / 180), plan.d * 0.92);
    var L = Lm * r.s;
    var litAny = false;

    function patch(x1, y1, x2, y2) {
      var poly = document.createElementNS(ns, 'polygon');
      poly.setAttribute('points',
        x1 + ',' + y1 + ' ' + x2 + ',' + y2 + ' ' +
        (x2 + vx * L) + ',' + (y2 + vy * L) + ' ' + (x1 + vx * L) + ',' + (y1 + vy * L));
      poly.setAttribute('class', 'sun-wash');
      g.appendChild(poly);
    }

    if (!plan.monitors) {
      B.walls.forEach(function (bearing) {
        if (N.sun.bearingGap(p.az, bearing) >= 78) return;
        litAny = true;
        var side = sideOf(bearing);
        if (side === 'N') patch(r.x + 6, r.y, r.x + r.w - 6, r.y);
        if (side === 'S') patch(r.x + 6, r.y + r.h, r.x + r.w - 6, r.y + r.h);
        if (side === 'E') patch(r.x + r.w, r.y + 6, r.x + r.w, r.y + r.h - 6);
        if (side === 'W') patch(r.x, r.y + 6, r.x, r.y + r.h - 6);
      });
    }

    if (note) {
      if (plan.monitors) {
        note.textContent = 'No direct patch at any hour — the monitors face north. Steady light is the point.';
      } else if (litAny) {
        note.textContent = 'Sun on the glass — the wash shows where the patch falls at ' + N.fmt.clock(t) + ' solar.';
      } else {
        note.textContent = 'No direct sun on the glass at this hour; the room runs on sky light.';
      }
    }
  }

  /* ---------- the floor stack ---------- */

  function buildStack() {
    var svg = document.getElementById('stackSvg');
    if (!svg) return;
    var ns = 'http://www.w3.org/2000/svg';
    var floors = B.floors.slice().reverse(); // draw top floor first (highest y is bottom slab)
    var n = B.floors.length;
    var H = 60 + n * 44;
    svg.setAttribute('viewBox', '0 0 460 ' + H);
    var W = 240, OFF = 74, TH = 16, STEP = 44, X = 70;
    floors.forEach(function (f, i) {
      var y = 34 + i * STEP;
      var g = document.createElementNS(ns, 'g');
      g.setAttribute('data-slab', f.id);
      var top = document.createElementNS(ns, 'polygon');
      top.setAttribute('points',
        X + ',' + y + ' ' + (X + W) + ',' + y + ' ' +
        (X + W + OFF) + ',' + (y - 22) + ' ' + (X + OFF) + ',' + (y - 22));
      top.setAttribute('class', 'slab' + (f.state === 'let' ? ' gone' : ''));
      g.appendChild(top);
      var front = document.createElementNS(ns, 'rect');
      front.setAttribute('x', X); front.setAttribute('y', y);
      front.setAttribute('width', W); front.setAttribute('height', TH);
      front.setAttribute('class', 'slab-side');
      g.appendChild(front);
      if (f.state === 'let') {
        var hg = document.createElementNS(ns, 'g');
        hg.setAttribute('class', 'hatch');
        for (var hx = 0; hx < 5; hx++) {
          var hl = document.createElementNS(ns, 'line');
          var bx = X + 30 + hx * 44;
          hl.setAttribute('x1', bx); hl.setAttribute('y1', y);
          hl.setAttribute('x2', bx + OFF); hl.setAttribute('y2', y - 22);
          hg.appendChild(hl);
        }
        g.appendChild(hg);
      }
      var label = document.createElementNS(ns, 'text');
      label.setAttribute('x', X + W + OFF + 10); label.setAttribute('y', y - 4);
      label.textContent = f.id + ' · ' + f.area + ' m²';
      g.appendChild(label);
      svg.appendChild(g);
    });
  }

  function liftSlab(id, on) {
    var svg = document.getElementById('stackSvg');
    if (!svg) return;
    var g = svg.querySelector('[data-slab="' + id + '"]');
    if (!g) return;
    g.querySelectorAll('.slab, .slab-side').forEach(function (el) {
      el.classList.toggle('hot', on);
    });
  }

  /* ---------- availability rows ---------- */

  function buildRows() {
    var host = document.getElementById('availRows');
    if (!host) return;
    B.floors.forEach(function (f) {
      var el = document.createElement(f.state === 'available' ? 'a' : 'div');
      el.className = 'avail-row survey';
      el.setAttribute('data-state', f.state);
      if (f.state === 'available') {
        el.href = 'enquiry.html?b=' + slug + '&f=' + f.id;
        el.setAttribute('aria-label', 'Enquire about ' + f.name + ', ' + f.area + ' square metres');
      }
      var sunH = N.sun.directHours(f.walls || B.walls);
      var sunTxt = sunH < 0.05 ? 'steady' : N.fmt.hours(sunH);
      el.innerHTML =
        '<span class="survey-soft">' + f.id + '</span>' +
        '<span class="a-name">' + f.name + ' · ' + f.area + ' m²</span>' +
        '<span class="a-glaze survey-soft">' + Math.round(f.glaze * 100) + '% glass</span>' +
        '<span class="a-sun">' + sunTxt + '</span>' +
        '<span class="a-rent">' + N.fmt.eur(N.rent(B, f)) + '/mo</span>' +
        '<span class="a-state state-' + f.state + '">' + f.state + '</span>';
      el.addEventListener('mouseenter', function () { liftSlab(f.id, true); });
      el.addEventListener('mouseleave', function () { liftSlab(f.id, false); });
      el.addEventListener('focus', function () { liftSlab(f.id, true); });
      el.addEventListener('blur', function () { liftSlab(f.id, false); });
      host.appendChild(el);
    });
    N.rescanReveals(host);
  }

  /* ---------- readouts ---------- */

  function paint() {
    var p = N.sun.position(t);
    var set = function (id, v) {
      var el = document.getElementById(id);
      if (el) el.textContent = v;
    };
    set('rTime', N.fmt.clock(t) + ' solar');
    set('rAlt', p.alt <= 0 ? 'below horizon' : N.fmt.deg(p.alt) + ' high');
    set('rAz', N.fmt.deg(p.az) + ' · ' + N.fmt.compass(p.az));
    var lit = p.alt >= 6 && B.walls.some(function (w) { return N.sun.bearingGap(p.az, w) < 78; });
    set('rGlass', plan && plan.monitors ? 'sky only — by design' : (lit ? 'yes — on the glass' : 'not at this hour'));

    // sun disc on the arc
    var disc = document.getElementById('sunDisc');
    var halo = document.getElementById('sunHalo');
    if (disc) {
      if (p.alt <= 0) { disc.setAttribute('r', 0); halo.setAttribute('r', 0); }
      else {
        disc.setAttribute('cx', px(p.az)); disc.setAttribute('cy', py(p.alt)); disc.setAttribute('r', 5);
        halo.setAttribute('cx', px(p.az)); halo.setAttribute('cy', py(p.alt)); halo.setAttribute('r', 9);
      }
    }
    paintPlanLight();
    N.ambient(t);
  }

  /* ---------- static figures ---------- */

  var hToday = document.querySelector('[data-direct-today]');
  if (hToday) {
    var h = N.sun.directHours(B.walls);
    hToday.textContent = h < 0.05 ? 'None — steady north light' : N.fmt.hours(h) + ' today';
  }
  var riseSetEl = document.querySelector('[data-rise-set]');
  if (riseSetEl) riseSetEl.textContent = N.fmt.clock(rs.rise) + ' – ' + N.fmt.clock(rs.set) + ' solar';

  drawArc();
  buildPlanStatic();
  buildStack();
  buildRows();
  paint();
}());
