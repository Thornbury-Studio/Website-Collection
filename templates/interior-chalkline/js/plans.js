/* CHALKLINE — floor plans.

   Four measured layouts, stored as room polygons in centimetres, and one
   renderer that draws them as an architect would: plaster floors, solid
   ink walls, doors with their swing, windows as three lines, a dimension
   string along two edges. Every area the site quotes comes from these
   polygons (shoelace formula), never from a typed number, so a room's
   label, its floor-area line item and the flat's total can't disagree.

   The same module runs in the browser and under node (tools/emit-plan.mjs
   uses it to bake the static hero plan into index.html so the plan is
   there before any script runs). */

(function (root) {
  'use strict';

  /* Room kinds decide what the estimator is allowed to do to a room. */
  var KINDS = {
    living:   { label: 'Living',    scopes: ['light', 'standard', 'full'] },
    kitchen:  { label: 'Kitchen',   scopes: ['light', 'standard', 'full'] },
    bed:      { label: 'Bedroom',   scopes: ['light', 'standard', 'full'] },
    study:    { label: 'Study',     scopes: ['light', 'standard', 'full'] },
    bath:     { label: 'Bathroom',  scopes: ['light', 'standard', 'full'] },
    entry:    { label: 'Entrance',  scopes: ['light', 'standard', 'full'] },
    hs:       { label: 'Shelter',   scopes: ['light'] },
    yard:     { label: 'Yard',      scopes: ['light', 'standard'] },
    store:    { label: 'Store',     scopes: ['light', 'standard'] },
    utility:  { label: 'Utility',   scopes: ['light', 'standard'] },
    balcony:  { label: 'Balcony',   scopes: ['light', 'standard'] }
  };

  /* rect: [x1, y1, x2, y2]. poly: explicit vertices for L-shapes.
     doors: x,y is the start of the gap along the wall; dir h|v; hinge at
     'start' or 'end'; side +1 swings toward increasing coordinate.
     open:true is a cased opening with no leaf. Windows sit on exterior walls. */
  var PLANS = {
    hdb3: {
      id: 'hdb3', label: '3-room HDB', short: '3-room', w: 860, h: 820,
      env: [[0, 0], [860, 0], [860, 820], [0, 820]],
      rooms: [
        { id: 'liv', name: 'Living & dining', short: 'Living', kind: 'living', rect: [0, 0, 380, 540] },
        { id: 'kit', name: 'Kitchen', short: 'Kitchen', kind: 'kitchen', rect: [380, 0, 660, 280] },
        { id: 'sy',  name: 'Service yard', short: 'Yard', kind: 'yard', rect: [660, 0, 860, 280] },
        { id: 'hs',  name: 'Household shelter', short: 'HS', kind: 'hs', rect: [380, 280, 540, 460] },
        { id: 'cb',  name: 'Common bath', short: 'Bath', kind: 'bath', rect: [540, 280, 700, 460] },
        { id: 'st',  name: 'Store', short: 'Store', kind: 'store', rect: [700, 280, 860, 460] },
        { id: 'cor', name: 'Corridor', short: 'Corr.', kind: 'entry', rect: [380, 460, 860, 540] },
        { id: 'br2', name: 'Bedroom 2', short: 'Bed 2', kind: 'bed', rect: [0, 540, 360, 820] },
        { id: 'mbr', name: 'Master bedroom', short: 'Master', kind: 'bed', rect: [360, 540, 700, 820] },
        { id: 'mb',  name: 'Master bath', short: 'M. bath', kind: 'bath', rect: [700, 540, 860, 820] }
      ],
      doors: [
        { x: 60, y: 0, len: 90, dir: 'h', hinge: 'start', side: 1 },
        { x: 380, y: 40, len: 90, dir: 'v', open: true },
        { x: 660, y: 80, len: 120, dir: 'v', open: true },
        { x: 420, y: 460, len: 80, dir: 'h', hinge: 'start', side: -1 },
        { x: 580, y: 460, len: 80, dir: 'h', hinge: 'end', side: -1 },
        { x: 740, y: 460, len: 80, dir: 'h', hinge: 'start', side: -1 },
        { x: 380, y: 468, len: 64, dir: 'v', open: true },
        { x: 250, y: 540, len: 80, dir: 'h', hinge: 'end', side: 1 },
        { x: 420, y: 540, len: 80, dir: 'h', hinge: 'start', side: 1 },
        { x: 700, y: 600, len: 80, dir: 'v', hinge: 'start', side: 1 }
      ],
      windows: [
        { x: 0, y: 120, len: 280, dir: 'v' },
        { x: 0, y: 620, len: 140, dir: 'v' },
        { x: 420, y: 820, len: 200, dir: 'h' },
        { x: 740, y: 820, len: 80, dir: 'h' },
        { x: 860, y: 60, len: 160, dir: 'v' }
      ]
    },

    hdb4: {
      id: 'hdb4', label: '4-room HDB', short: '4-room', w: 1000, h: 920,
      env: [[0, 0], [1000, 0], [1000, 920], [0, 920]],
      rooms: [
        { id: 'liv', name: 'Living & dining', short: 'Living', kind: 'living', rect: [0, 0, 440, 600] },
        { id: 'kit', name: 'Kitchen', short: 'Kitchen', kind: 'kitchen', rect: [440, 0, 760, 300] },
        { id: 'sy',  name: 'Service yard', short: 'Yard', kind: 'yard', rect: [760, 0, 1000, 300] },
        { id: 'hs',  name: 'Household shelter', short: 'HS', kind: 'hs', rect: [440, 300, 600, 500] },
        { id: 'cb',  name: 'Common bath', short: 'Bath', kind: 'bath', rect: [600, 300, 760, 500] },
        { id: 'st',  name: 'Store', short: 'Store', kind: 'store', rect: [760, 300, 1000, 440] },
        { id: 'mb',  name: 'Master bath', short: 'M. bath', kind: 'bath', rect: [760, 440, 1000, 600] },
        { id: 'cor', name: 'Entrance & corridor', short: 'Corr.', kind: 'entry', rect: [440, 500, 760, 600] },
        { id: 'br3', name: 'Bedroom 3', short: 'Bed 3', kind: 'bed', rect: [0, 600, 320, 920] },
        { id: 'br2', name: 'Bedroom 2', short: 'Bed 2', kind: 'study', rect: [320, 600, 620, 920] },
        { id: 'mbr', name: 'Master bedroom', short: 'Master', kind: 'bed', rect: [620, 600, 1000, 920] }
      ],
      doors: [
        { x: 60, y: 0, len: 90, dir: 'h', hinge: 'start', side: 1 },
        { x: 440, y: 40, len: 90, dir: 'v', open: true },
        { x: 760, y: 80, len: 140, dir: 'v', open: true },
        { x: 480, y: 500, len: 80, dir: 'h', hinge: 'start', side: -1 },
        { x: 640, y: 500, len: 80, dir: 'h', hinge: 'end', side: -1 },
        { x: 760, y: 340, len: 70, dir: 'v', hinge: 'start', side: 1 },
        { x: 440, y: 510, len: 80, dir: 'v', open: true },
        { x: 230, y: 600, len: 80, dir: 'h', hinge: 'end', side: 1 },
        { x: 470, y: 600, len: 80, dir: 'h', hinge: 'start', side: 1 },
        { x: 660, y: 600, len: 80, dir: 'h', hinge: 'start', side: 1 },
        { x: 800, y: 600, len: 80, dir: 'h', hinge: 'start', side: -1 }
      ],
      windows: [
        { x: 0, y: 120, len: 300, dir: 'v' },
        { x: 0, y: 680, len: 180, dir: 'v' },
        { x: 380, y: 920, len: 180, dir: 'h' },
        { x: 700, y: 920, len: 200, dir: 'h' },
        { x: 1000, y: 60, len: 180, dir: 'v' },
        { x: 1000, y: 480, len: 80, dir: 'v' }
      ]
    },

    hdb5: {
      id: 'hdb5', label: '5-room HDB', short: '5-room', w: 1180, h: 920,
      env: [[0, 0], [1180, 0], [1180, 920], [0, 920]],
      rooms: [
        { id: 'liv', name: 'Living & dining', short: 'Living', kind: 'living', rect: [0, 0, 500, 600] },
        { id: 'kit', name: 'Kitchen', short: 'Kitchen', kind: 'kitchen', rect: [500, 0, 840, 300] },
        { id: 'sy',  name: 'Service yard', short: 'Yard', kind: 'yard', rect: [840, 0, 1180, 300] },
        { id: 'hs',  name: 'Household shelter', short: 'HS', kind: 'hs', rect: [500, 300, 660, 500] },
        { id: 'cb',  name: 'Common bath', short: 'Bath', kind: 'bath', rect: [660, 300, 820, 500] },
        { id: 'st',  name: 'Store', short: 'Store', kind: 'store', rect: [820, 300, 1000, 500] },
        { id: 'mb',  name: 'Master bath', short: 'M. bath', kind: 'bath', rect: [1000, 300, 1180, 600] },
        { id: 'cor', name: 'Entrance & corridor', short: 'Corr.', kind: 'entry', rect: [500, 500, 1000, 600] },
        { id: 'br3', name: 'Bedroom 3', short: 'Bed 3', kind: 'bed', rect: [0, 600, 320, 920] },
        { id: 'br2', name: 'Bedroom 2', short: 'Bed 2', kind: 'bed', rect: [320, 600, 620, 920] },
        { id: 'stu', name: 'Study', short: 'Study', kind: 'study', rect: [620, 600, 840, 920] },
        { id: 'mbr', name: 'Master bedroom', short: 'Master', kind: 'bed', rect: [840, 600, 1180, 920] }
      ],
      doors: [
        { x: 60, y: 0, len: 90, dir: 'h', hinge: 'start', side: 1 },
        { x: 500, y: 40, len: 90, dir: 'v', open: true },
        { x: 840, y: 80, len: 140, dir: 'v', open: true },
        { x: 540, y: 500, len: 80, dir: 'h', hinge: 'start', side: -1 },
        { x: 700, y: 500, len: 80, dir: 'h', hinge: 'end', side: -1 },
        { x: 870, y: 500, len: 80, dir: 'h', hinge: 'start', side: -1 },
        { x: 500, y: 510, len: 80, dir: 'v', open: true },
        { x: 230, y: 600, len: 80, dir: 'h', hinge: 'end', side: 1 },
        { x: 480, y: 600, len: 80, dir: 'h', hinge: 'start', side: 1 },
        { x: 680, y: 600, len: 80, dir: 'h', hinge: 'start', side: 1 },
        { x: 880, y: 600, len: 80, dir: 'h', hinge: 'start', side: 1 },
        { x: 1040, y: 600, len: 80, dir: 'h', hinge: 'start', side: -1 }
      ],
      windows: [
        { x: 0, y: 120, len: 340, dir: 'v' },
        { x: 0, y: 680, len: 180, dir: 'v' },
        { x: 380, y: 920, len: 180, dir: 'h' },
        { x: 660, y: 920, len: 140, dir: 'h' },
        { x: 920, y: 920, len: 200, dir: 'h' },
        { x: 1180, y: 60, len: 180, dir: 'v' },
        { x: 1180, y: 380, len: 80, dir: 'v' }
      ]
    },

    condo: {
      id: 'condo', label: '3-bedroom condominium', short: 'Condo', w: 1200, h: 880,
      env: [[0, 0], [1200, 0], [1200, 880], [500, 880], [500, 680], [0, 680]],
      rooms: [
        { id: 'liv', name: 'Living & dining', short: 'Living', kind: 'living', rect: [0, 0, 500, 560] },
        { id: 'bal', name: 'Balcony', short: 'Balcony', kind: 'balcony', rect: [0, 560, 500, 680] },
        { id: 'kit', name: 'Kitchen', short: 'Kitchen', kind: 'kitchen', rect: [500, 0, 780, 300] },
        { id: 'sy',  name: 'Yard', short: 'Yard', kind: 'yard', rect: [780, 0, 920, 300] },
        { id: 'cb',  name: 'Common bath', short: 'Bath', kind: 'bath', rect: [500, 300, 660, 460] },
        { id: 'ut',  name: 'Utility', short: 'Utility', kind: 'utility', rect: [660, 300, 920, 460] },
        { id: 'cor', name: 'Entrance & corridor', short: 'Corr.', kind: 'entry', rect: [500, 460, 920, 560] },
        { id: 'mb',  name: 'Master bath', short: 'M. bath', kind: 'bath', rect: [920, 0, 1200, 180] },
        { id: 'mbr', name: 'Master bedroom', short: 'Master', kind: 'bed', rect: [920, 180, 1200, 560] },
        { id: 'br3', name: 'Bedroom 3', short: 'Bed 3', kind: 'bed', rect: [500, 560, 820, 880] },
        { id: 'br2', name: 'Bedroom 2', short: 'Bed 2', kind: 'bed', rect: [820, 560, 1200, 880] }
      ],
      doors: [
        { x: 60, y: 0, len: 90, dir: 'h', hinge: 'start', side: 1 },
        { x: 500, y: 40, len: 90, dir: 'v', open: true },
        { x: 780, y: 80, len: 140, dir: 'v', open: true },
        { x: 540, y: 460, len: 80, dir: 'h', hinge: 'start', side: -1 },
        { x: 720, y: 460, len: 80, dir: 'h', hinge: 'start', side: -1 },
        { x: 500, y: 470, len: 80, dir: 'v', open: true },
        { x: 920, y: 470, len: 80, dir: 'v', hinge: 'start', side: 1 },
        { x: 1000, y: 180, len: 80, dir: 'h', hinge: 'start', side: -1 },
        { x: 540, y: 560, len: 80, dir: 'h', hinge: 'start', side: 1 },
        { x: 860, y: 560, len: 80, dir: 'h', hinge: 'start', side: 1 },
        { x: 100, y: 560, len: 300, dir: 'h', open: true, glass: true }
      ],
      windows: [
        { x: 0, y: 100, len: 360, dir: 'v' },
        { x: 40, y: 680, len: 420, dir: 'h' },
        { x: 560, y: 880, len: 200, dir: 'h' },
        { x: 900, y: 880, len: 220, dir: 'h' },
        { x: 1200, y: 240, len: 200, dir: 'v' },
        { x: 800, y: 0, len: 100, dir: 'h' },
        { x: 1080, y: 0, len: 90, dir: 'h' }
      ]
    }
  };

  /* ---- geometry (cm in, metres out) --------------------------------------- */

  function polyOf(r) {
    if (r.poly) return r.poly;
    var a = r.rect;
    return [[a[0], a[1]], [a[2], a[1]], [a[2], a[3]], [a[0], a[3]]];
  }

  function areaM2(poly) {
    var s = 0;
    for (var i = 0, n = poly.length; i < n; i++) {
      var p = poly[i], q = poly[(i + 1) % n];
      s += p[0] * q[1] - q[0] * p[1];
    }
    return Math.abs(s) / 2 / 10000;
  }

  function perimM(poly) {
    var s = 0;
    for (var i = 0, n = poly.length; i < n; i++) {
      var p = poly[i], q = poly[(i + 1) % n];
      s += Math.hypot(q[0] - p[0], q[1] - p[1]);
    }
    return s / 100;
  }

  function bbox(poly) {
    var x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
    poly.forEach(function (p) {
      if (p[0] < x1) x1 = p[0]; if (p[0] > x2) x2 = p[0];
      if (p[1] < y1) y1 = p[1]; if (p[1] > y2) y2 = p[1];
    });
    return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
  }

  /* Longest and shortest bounding edge in metres: carpentry runs along one
     wall, so the estimator sizes a kitchen run or a wardrobe from these. */
  function edgesM(poly) {
    var b = bbox(poly);
    return { long: Math.max(b.w, b.h) / 100, short: Math.min(b.w, b.h) / 100 };
  }

  function room(planId, roomId) {
    var plan = PLANS[planId];
    if (!plan) return null;
    for (var i = 0; i < plan.rooms.length; i++) if (plan.rooms[i].id === roomId) return plan.rooms[i];
    return null;
  }

  function measure(r) {
    var poly = polyOf(r), e = edgesM(poly);
    return { area: areaM2(poly), perim: perimM(poly), long: e.long, short: e.short };
  }

  function totalArea(plan) {
    return plan.rooms.reduce(function (s, r) { return s + areaM2(polyOf(r)); }, 0);
  }

  /* ---- renderer ------------------------------------------------------------ */

  var WALL = 9, EXT = 18, PAD = 84;

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  }
  function num(n) { return Math.round(n * 10) / 10; }
  function pathOf(poly) {
    return 'M' + poly.map(function (p) { return p[0] + ' ' + p[1]; }).join('L') + 'Z';
  }

  function doorSVG(d) {
    var s = '';
    var ex = d.dir === 'h' ? d.x + d.len : d.x, ey = d.dir === 'v' ? d.y + d.len : d.y;
    /* case the opening: paint the wall out */
    s += '<line class="plan-gap" x1="' + d.x + '" y1="' + d.y + '" x2="' + ex + '" y2="' + ey + '"/>';
    if (d.glass) {
      s += '<line class="plan-glass" x1="' + d.x + '" y1="' + d.y + '" x2="' + ex + '" y2="' + ey + '"/>';
      return s;
    }
    if (d.open) return s;
    var hx = d.hinge === 'end' ? ex : d.x, hy = d.hinge === 'end' ? ey : d.y;
    var jx = d.hinge === 'end' ? d.x : ex, jy = d.hinge === 'end' ? d.y : ey;
    /* leaf: perpendicular to the wall, into the room on `side` */
    var lx = d.dir === 'h' ? hx : hx + d.side * d.len;
    var ly = d.dir === 'h' ? hy + d.side * d.len : hy;
    s += '<line class="plan-leaf" x1="' + hx + '" y1="' + hy + '" x2="' + lx + '" y2="' + ly + '"/>';
    /* quarter arc from leaf tip to the far jamb */
    var cross = (d.dir === 'h' ? 1 : -1) * d.side * (d.hinge === 'end' ? -1 : 1);
    var sweep = cross > 0 ? 1 : 0;
    s += '<path class="plan-swing" d="M' + lx + ' ' + ly + 'A' + d.len + ' ' + d.len + ' 0 0 ' + sweep + ' ' + jx + ' ' + jy + '"/>';
    return s;
  }

  function windowSVG(w) {
    var ex = w.dir === 'h' ? w.x + w.len : w.x, ey = w.dir === 'v' ? w.y + w.len : w.y;
    var s = '<line class="plan-gap plan-gap--ext" x1="' + w.x + '" y1="' + w.y + '" x2="' + ex + '" y2="' + ey + '"/>';
    var off = [-5, 0, 5];
    off.forEach(function (o) {
      var x1 = w.dir === 'h' ? w.x : w.x + o, y1 = w.dir === 'h' ? w.y + o : w.y;
      var x2 = w.dir === 'h' ? ex : ex + o, y2 = w.dir === 'h' ? ey + o : ey;
      s += '<line class="plan-win" x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '"/>';
    });
    return s;
  }

  /* opts:
       uid      id prefix so several plans can share a page
       mode     'hero' rooms are links that fill with a photograph
                'pick' rooms are toggles (aria-checkbox) for the estimator
                'mini' small, static, scoped rooms chalked
       photos   { roomId: src } for hero mode
       hrefs    { roomId: url } for hero mode
       scoped   [roomId] rooms drawn as touched (mini + hero)
       labels   false to drop names (mini) */
  function render(plan, opts) {
    opts = opts || {};
    var uid = opts.uid || plan.id;
    var mode = opts.mode || 'hero';
    var scoped = opts.scoped || [];
    var photos = opts.photos || {};
    var hrefs = opts.hrefs || {};
    var showLabels = opts.labels !== false;
    var vb = (-PAD) + ' ' + (-PAD) + ' ' + (plan.w + PAD * 2) + ' ' + (plan.h + PAD * 2);
    var title = plan.label + ' floor plan';
    var s = '<svg class="plan-svg plan-svg--' + mode + '" viewBox="' + vb + '" role="img" aria-labelledby="' + uid + '-t" focusable="false">';
    s += '<title id="' + uid + '-t">' + esc(title) + '</title>';

    /* clip paths for photographs */
    s += '<defs>';
    plan.rooms.forEach(function (r) {
      s += '<clipPath id="' + uid + '-cp-' + r.id + '"><path d="' + pathOf(polyOf(r)) + '"/></clipPath>';
    });
    s += '</defs>';

    /* rooms */
    plan.rooms.forEach(function (r) {
      var poly = polyOf(r), b = bbox(poly), m = measure(r);
      var isScoped = scoped.indexOf(r.id) !== -1;
      var cls = 'room room--' + r.kind + (isScoped ? ' is-scoped' : '') + (photos[r.id] ? ' has-photo' : '');
      var open, close;
      if (mode === 'hero') {
        var href = hrefs[r.id];
        if (href) {
          open = '<a class="' + cls + '" data-room="' + r.id + '" href="' + esc(href) + '" aria-label="' + esc(r.name + ', see the finished room') + '">';
          close = '</a>';
        } else {
          open = '<g class="' + cls + '" data-room="' + r.id + '">';
          close = '</g>';
        }
      } else if (mode === 'pick') {
        open = '<g class="' + cls + '" data-room="' + r.id + '" role="checkbox" aria-checked="false" tabindex="0" aria-label="' + esc(r.name) + '">';
        close = '</g>';
      } else {
        open = '<g class="' + cls + '" data-room="' + r.id + '">';
        close = '</g>';
      }
      s += open;
      s += '<path class="room__floor" d="' + pathOf(poly) + '"/>';
      if (photos[r.id]) {
        s += '<image class="room__photo" href="' + esc(photos[r.id]) + '" x="' + b.x + '" y="' + b.y + '" width="' + b.w + '" height="' + b.h +
             '" preserveAspectRatio="xMidYMid slice" clip-path="url(#' + uid + '-cp-' + r.id + ')" aria-hidden="true"/>';
      }
      s += '<path class="room__edge" d="' + pathOf(poly) + '"/>';
      if (showLabels) {
        var small = b.w < 200 || b.h < 170;
        var cx = b.x + b.w / 2, cy = b.y + b.h / 2;
        var name = small ? r.short : r.name;
        s += '<text class="room__name' + (small ? ' room__name--sm' : '') + '" x="' + cx + '" y="' + (cy - (small ? 2 : 8)) + '" text-anchor="middle">' + esc(name.toUpperCase()) + '</text>';
        if (!small || b.h >= 130) {
          s += '<text class="room__area" x="' + cx + '" y="' + (cy + (small ? 22 : 26)) + '" text-anchor="middle">' + num(m.area) + ' m²</text>';
        }
      }
      s += close;
    });

    /* walls: interior partitions, then the heavier envelope */
    s += '<g class="plan-walls">';
    plan.rooms.forEach(function (r) { s += '<path class="plan-wall" d="' + pathOf(polyOf(r)) + '"/>'; });
    s += '<path class="plan-wall plan-wall--ext" d="' + pathOf(plan.env) + '"/>';
    s += '</g>';

    /* openings */
    s += '<g class="plan-open">';
    (plan.doors || []).forEach(function (d) { s += doorSVG(d); });
    (plan.windows || []).forEach(function (w) { s += windowSVG(w); });
    s += '</g>';

    /* dimension strings along the top and the left */
    if (opts.dims !== false) {
      var dy = -46, dx = -46;
      s += '<g class="plan-dims" aria-hidden="true">';
      s += '<line x1="0" y1="' + dy + '" x2="' + plan.w + '" y2="' + dy + '"/>';
      s += '<line x1="0" y1="' + (dy - 8) + '" x2="0" y2="' + (dy + 8) + '"/><line x1="' + plan.w + '" y1="' + (dy - 8) + '" x2="' + plan.w + '" y2="' + (dy + 8) + '"/>';
      s += '<text x="' + (plan.w / 2) + '" y="' + (dy - 12) + '" text-anchor="middle">' + num(plan.w / 100) + ' m</text>';
      s += '<line x1="' + dx + '" y1="0" x2="' + dx + '" y2="' + plan.h + '"/>';
      s += '<line x1="' + (dx - 8) + '" y1="0" x2="' + (dx + 8) + '" y2="0"/><line x1="' + (dx - 8) + '" y1="' + plan.h + '" x2="' + (dx + 8) + '" y2="' + plan.h + '"/>';
      s += '<text transform="translate(' + (dx - 12) + ' ' + (plan.h / 2) + ') rotate(-90)" text-anchor="middle">' + num(plan.h / 100) + ' m</text>';
      s += '</g>';
    }

    s += '</svg>';
    return s;
  }

  root.CHALK_PLANS = {
    PLANS: PLANS, KINDS: KINDS,
    polyOf: polyOf, areaM2: areaM2, perimM: perimM, bbox: bbox, edgesM: edgesM,
    room: room, measure: measure, totalArea: totalArea, render: render,
    aspect: function (plan) { return (plan.w + PAD * 2) / (plan.h + PAD * 2); }
  };

})(typeof window !== 'undefined' ? window : globalThis);
