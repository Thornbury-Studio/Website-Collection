/* GRATICULE — the terrain behind sheet AD 148.

   Everything the map draws comes out of this file. There is no image of the
   ground anywhere on this site: the elevation is a deterministic function of
   position, and the contours, the relief shading, the water and every
   elevation the page ever quotes are derived from that one function. Same
   seed, same ground, on every device and every reload — which is the point,
   because a survey sheet that changed between two people looking at it would
   be worthless.

   Ground extent is 2400 m east-west by 1500 m north-south, with the sheet's
   south-west corner at national grid AD 18000 05000. Contour interval 10 m,
   index contour every 50 m, exactly as a 1:10 000 sheet would carry it. */

(function (root) {
  'use strict';

  var W = 2400;             /* ground metres, east-west  */
  var H = 1500;             /* ground metres, north-south */
  var E0 = 18000, N0 = 5000; /* sheet SW corner within grid square AD */
  var LO = 128, HI = 646;   /* the elevation band the sheet is normalised to */
  var IV = 10, INDEX_EVERY = 5;

  /* ---- deterministic value noise -------------------------------------- */

  function h2(ix, iy) {
    var n = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }

  function vn(x, y) {
    var ix = Math.floor(x), iy = Math.floor(y);
    var fx = x - ix, fy = y - iy;
    var ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    var a = h2(ix, iy), b = h2(ix + 1, iy), c = h2(ix, iy + 1), d = h2(ix + 1, iy + 1);
    return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
  }

  function fbm(x, y, oct) {
    var v = 0, amp = 0.5, f = 1, i;
    for (i = 0; i < oct; i++) { v += amp * vn(x * f, y * f); f *= 2.03; amp *= 0.5; }
    return v;
  }

  /* ---- the landform ----------------------------------------------------- */

  /* A glaciated valley — Cwm Aderyn — running roughly WSW to ENE, with the
     floor rising toward the head of the cwm and broken ground on both flanks.
     The axis is a curve rather than a straight line so the contours never
     fall into the mirror symmetry that gives procedural terrain away. */
  function axisAt(x) {
    return 760 + 235 * Math.sin(x / W * Math.PI * 1.28 + 0.55) - 140 * (x / W);
  }

  function raw(u, v) {
    var x = u * W, y = v * H;
    var d = y - axisAt(x);
    /* Cross-valley profile: a wide parabolic trough, not a V. */
    var trough = 1 - Math.exp(-(d * d) / (2 * 330 * 330));
    /* Four octaves, not five. The fifth put a cycle every thirty metres,
       which is finer than a 10 m contour can resolve: it never reached the
       drawn sheet, but it did reach the section profile, where it showed up
       as 100% gradients between stations 5 m apart. Hillsides are not that
       rough at that scale. */
    var flank = fbm(u * 3.6 + 11.3, v * 3.6 + 7.1, 4);
    var coarse = fbm(u * 1.7 + 3.9, v * 1.7 + 2.2, 3);
    /* Floor gradient: the cwm head is higher than its mouth. */
    var along = 0.34 * (x / W);
    return trough * (0.52 + 0.48 * flank) + 0.34 * flank + 0.34 * coarse + along;
  }

  /* raw() has no fixed range, so calibrate once against a coarse sample and
     map the result onto LO..HI. This keeps the sheet's elevation band stable
     even if the landform terms are ever retuned. */
  var rMin = Infinity, rMax = -Infinity;
  (function calibrate() {
    for (var j = 0; j <= 96; j++) {
      for (var i = 0; i <= 152; i++) {
        var r = raw(i / 152, j / 96);
        if (r < rMin) rMin = r;
        if (r > rMax) rMax = r;
      }
    }
  })();

  /* Elevation in metres at normalised sheet position (u,v), v measured from
     the north edge downward — screen order, since that is how it is used. */
  function height(u, v) {
    var r = (raw(u, v) - rMin) / (rMax - rMin);
    return LO + r * (HI - LO);
  }

  var LAKE = LO + 0.052 * (HI - LO);   /* Llyn Aderyn's surface */

  /* ---- sampled grid ------------------------------------------------------ */

  /* One shared elevation grid feeds both the contour tracer and the relief
     shader. GX/GY are the cell counts; the array is (GX+1) x (GY+1) corners. */
  var GX = 264, GY = 165;
  var grid = new Float32Array((GX + 1) * (GY + 1));
  (function sample() {
    for (var j = 0; j <= GY; j++) {
      for (var i = 0; i <= GX; i++) grid[j * (GX + 1) + i] = height(i / GX, j / GY);
    }
  })();

  function gridAt(i, j) { return grid[j * (GX + 1) + i]; }

  /* ---- contours: marching squares --------------------------------------- */

  /* Returns an array of levels, each { z, index, seg } where seg is a flat
     Float32Array of x0,y0,x1,y1 quadruples in normalised sheet space. Only
     the levels a cell actually spans are tested, so this stays close to
     linear in cell count rather than cells x levels. */
  function contours() {
    var first = Math.ceil(LO / IV) * IV;
    var levels = [], byLevel = [], k;
    for (k = first; k <= HI; k += IV) {
      levels.push({ z: k, index: (k % (IV * INDEX_EVERY)) === 0, seg: null });
      byLevel.push([]);
    }
    var dx = 1 / GX, dy = 1 / GY;

    for (var j = 0; j < GY; j++) {
      for (var i = 0; i < GX; i++) {
        var a = gridAt(i, j), b = gridAt(i + 1, j),
            c = gridAt(i + 1, j + 1), d = gridAt(i, j + 1);
        var cmin = Math.min(a, b, c, d), cmax = Math.max(a, b, c, d);
        var lo = Math.max(0, Math.ceil((cmin - first) / IV));
        var hi = Math.min(levels.length - 1, Math.floor((cmax - first) / IV));
        if (hi < lo) continue;

        var x0 = i * dx, y0 = j * dy, x1 = x0 + dx, y1 = y0 + dy;

        for (var li = lo; li <= hi; li++) {
          var lv = levels[li].z;
          var idx = (a > lv ? 8 : 0) | (b > lv ? 4 : 0) | (c > lv ? 2 : 0) | (d > lv ? 1 : 0);
          if (idx === 0 || idx === 15) continue;

          /* Crossing points on each edge, computed lazily. */
          var tx = x0 + (lv - a) / (b - a) * dx;          /* top    (a-b) */
          var ry = y0 + (lv - b) / (c - b) * dy;          /* right  (b-c) */
          var bx = x0 + (lv - d) / (c - d) * dx;          /* bottom (d-c) */
          var ly = y0 + (lv - a) / (d - a) * dy;          /* left   (a-d) */
          var out = byLevel[li];

          switch (idx) {
            case 1: case 14: out.push(x0, ly, bx, y1); break;
            case 2: case 13: out.push(bx, y1, x1, ry); break;
            case 3: case 12: out.push(x0, ly, x1, ry); break;
            case 4: case 11: out.push(tx, y0, x1, ry); break;
            case 6: case  9: out.push(tx, y0, bx, y1); break;
            case 7: case  8: out.push(x0, ly, tx, y0); break;
            case 5: case 10: {
              /* Saddle. The cell centre decides which way the two branches
                 join; guessing produces the classic crossed-contour artefact. */
              var mid = (a + b + c + d) / 4;
              var high = (idx === 5) === (mid > lv);
              if (high) { out.push(tx, y0, x1, ry); out.push(x0, ly, bx, y1); }
              else      { out.push(x0, ly, tx, y0); out.push(bx, y1, x1, ry); }
              break;
            }
          }
        }
      }
    }

    for (k = 0; k < levels.length; k++) levels[k].seg = new Float32Array(byLevel[k]);
    return levels;
  }

  /* ---- relief shading ---------------------------------------------------- */

  /* Lambertian hillshade with the light in the north-west at 45 degrees —
     the cartographic convention since Imhof, and the one the eye reads as
     terrain rather than as a hole in the page. Rendered small and scaled up:
     relief is low-frequency, so a soft enlargement is truer to a printed
     sheet than a crisp per-pixel one, and it costs nothing to redraw. */
  function shade(w, h, tint) {
    var img = new Uint8ClampedArray(w * h * 4);
    var lx = -0.5, ly = -0.5, lz = 0.7071;
    var n = Math.sqrt(lx * lx + ly * ly + lz * lz);
    lx /= n; ly /= n; lz /= n;
    /* Metres of ground per shading pixel, needed for a real slope. */
    var mx = W / w, my = H / h;

    for (var j = 0; j < h; j++) {
      var v = (j + 0.5) / h;
      for (var i = 0; i < w; i++) {
        var u = (i + 0.5) / w;
        var e = height(u, v);
        var dzdx = (height(Math.min(1, u + 1 / w), v) - height(Math.max(0, u - 1 / w), v)) / (2 * mx);
        var dzdy = (height(u, Math.min(1, v + 1 / h)) - height(u, Math.max(0, v - 1 / h))) / (2 * my);
        /* Vertical exaggeration of 1.25 — a sheet's relief is drawn a little
           steeper than the ground or nothing below 15 degrees reads, but push
           it past about 1.5 and the shading stops looking like landform and
           starts looking like cloud shadow on the paper. */
        var nx = -dzdx * 1.25, ny = -dzdy * 1.25, nz = 1;
        var nl = Math.sqrt(nx * nx + ny * ny + 1);
        var lam = (nx * lx + ny * ly + nz * lz) / nl;
        var lit = Math.max(0, lam);
        lit = 0.52 + 0.48 * lit;

        /* Hypsometric tint: valley floor cooler and darker, tops warmer. */
        var t = (e - LO) / (HI - LO);
        var o = (j * w + i) * 4;
        img[o + 3] = 255;

        if (e < LAKE) {
          /* Llyn Aderyn. Standing water takes no hillshade — a lake surface
             is level, so shading it would draw relief that is not there. */
          img[o] = tint.wr; img[o + 1] = tint.wg; img[o + 2] = tint.wb;
          continue;
        }

        img[o]     = tint.r0 + (tint.r1 - tint.r0) * t;
        img[o + 1] = tint.g0 + (tint.g1 - tint.g0) * t;
        img[o + 2] = tint.b0 + (tint.b1 - tint.b0) * t;
        /* Apply the light multiplicatively so the tint keeps its hue. */
        img[o]     *= lit; img[o + 1] *= lit; img[o + 2] *= lit;
      }
    }
    return img;
  }

  /* ---- water ------------------------------------------------------------- */

  /* The watercourse follows the valley axis with a small deterministic
     wander, and is clipped where it enters the lake. */
  function stream() {
    var pts = [];
    for (var i = 0; i <= 120; i++) {
      var u = i / 120;
      var x = u * W;
      var y = axisAt(x) + 46 * (vn(u * 7.4 + 2.1, 0.7) - 0.5) * 2;
      pts.push(x / W, y / H);
    }
    return pts;
  }

  /* ---- coordinate helpers ------------------------------------------------ */

  function easting(u)  { return E0 + u * W; }
  function northing(v) { return N0 + (1 - v) * H; }

  /* A six-figure grid reference in the sheet's square, the form a surveyor
     would actually read off the margin. */
  function gridRef(u, v) {
    var e = Math.floor(easting(u) / 10) % 10000;
    var n = Math.floor(northing(v) / 10) % 10000;
    function pad(x) { return ('000' + x).slice(-4); }
    return 'AD ' + pad(e) + ' ' + pad(n);
  }

  /* Profile along a straight section A-B, sampled at n stations. */
  function section(ax, ay, bx, by, n) {
    var dxm = (bx - ax) * W, dym = (by - ay) * H;
    var len = Math.sqrt(dxm * dxm + dym * dym);
    var z = new Float32Array(n), i;
    for (i = 0; i < n; i++) {
      var t = n === 1 ? 0 : i / (n - 1);
      z[i] = height(ax + (bx - ax) * t, ay + (by - ay) * t);
    }
    var min = Infinity, max = -Infinity, rise = 0, fall = 0, steep = 0;
    var step = len / Math.max(1, n - 1);
    /* Ruling gradient is quoted over a chainage interval, not between two
       adjacent stations — a single-sample slope is dominated by whatever the
       sampling interval happens to be, which is a property of the drawing
       rather than of the ground. 25 m is the interval a track design would
       be checked at. */
    var win = Math.max(1, Math.round(25 / step));
    for (i = 0; i < n; i++) {
      if (z[i] < min) min = z[i];
      if (z[i] > max) max = z[i];
      if (i) {
        var dz = z[i] - z[i - 1];
        if (dz > 0) rise += dz; else fall -= dz;
      }
      if (i >= win) {
        var g = Math.abs(z[i] - z[i - win]) / (step * win);
        if (g > steep) steep = g;
      }
    }
    /* Bearing as a surveyor states it: clockwise from grid north. */
    var brg = (Math.atan2(dxm, -dym) * 180 / Math.PI + 360) % 360;
    return {
      z: z, length: len, min: min, max: max, rise: rise, fall: fall,
      grade: steep, bearing: brg,
      a: { e: easting(ax), n: northing(ay), z: z[0], ref: gridRef(ax, ay) },
      b: { e: easting(bx), n: northing(by), z: z[n - 1], ref: gridRef(bx, by) }
    };
  }

  root.Terrain = {
    W: W, H: H, LO: LO, HI: HI, IV: IV, INDEX_EVERY: INDEX_EVERY, LAKE: LAKE,
    height: height, contours: contours, shade: shade, stream: stream,
    section: section, gridRef: gridRef, easting: easting, northing: northing,
    grid: { gx: GX, gy: GY, at: gridAt }
  };

})(window);
