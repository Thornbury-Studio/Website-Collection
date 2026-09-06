/* THORNBURY DIGITAL v6 — the ground.

   The background is sand: a low relief of wind ripples on the limewash,
   shaded by the same raking light as the hero footage. On a fine pointer,
   moving the cursor drags a soft furrow through it — a finger through fine
   sand — which slowly heals. On touch, and under reduced motion, the relief
   simply stands still. Scrolling drifts the ripples a little slower than the
   page, which is what gives the wall its depth.

   One 2D canvas, simulated and shaded on a coarse grid (one cell per ~8 css
   px) and scaled up soft, the way sand is soft. It draws only when something
   changed — pointer, healing, scroll, resize — and costs nothing at rest.
   The shading is ink and warm white at single-digit alphas over the CSS wall
   colour, so text contrast is untouched. */
(function () {
  "use strict";
  var cv = document.getElementById("ground");
  if (!cv) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(pointer: fine)").matches;
  var ctx = cv.getContext("2d", { alpha: true });
  if (!ctx) return;

  var CELL = 8;                      // css px per sim cell
  var gw = 0, gh = 0;                // grid size = canvas backing size; CSS scales it up,
                                     // so the compositor pays for the upscale, not JS
  var base = null, dig = null;       // static ripples, the furrows
  var img = null;
  var scroll = 0, dirty = true, healing = false, raf = 0;

  function h2(x, y) {
    var n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return n - Math.floor(n);
  }
  function vnoise(x, y) {
    var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    var a = h2(xi, yi), b = h2(xi + 1, yi), c = h2(xi, yi + 1), d = h2(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }

  function size() {
    var w = window.innerWidth, h = window.innerHeight;
    gw = Math.ceil(w / CELL) + 2; gh = Math.ceil(h / CELL) + 2;
    cv.width = gw; cv.height = gh;
    base = new Float32Array(gw * (gh + 400));   // extra rows so scroll can drift through them
    dig = new Float32Array(gw * gh);
    // The relief: broad dune swells carry the depth, and over them run long
    // parallel wind ripples — a sine band whose phase wanders with noise so
    // the ridges wave the way real ones do, amplitude fading in and out.
    var gt = gh + 400;
    for (var y = 0; y < gt; y++) {
      for (var x = 0; x < gw; x++) {
        var wob = vnoise(x * 0.040, y * 0.040);
        var amp = 0.55 + 0.45 * vnoise(x * 0.017, y * 0.06 + 40);
        var band = Math.sin(x * 0.46 + y * 0.19 + wob * 5.2) * amp;
        var swell = vnoise(x * 0.014, y * 0.014 + 9);
        base[y * gw + x] = band * 0.16 + swell * 0.84;
      }
    }
    img = ctx.createImageData(gw, gh);
    dirty = true;
  }

  function render() {
    raf = 0;
    if (!dirty && !healing) return;
    dirty = false;
    var drift = Math.round((scroll * 0.22) / CELL);        // the relief moves slower than the page
    var d = img.data, maxDig = 0;
    var lx = 0.74, ly = 0.62;                              // raking light from the upper left
    for (var y = 0; y < gh; y++) {
      var by = y + drift;
      for (var x = 0; x < gw; x++) {
        var i = y * gw + x;
        var hC = base[(by) * gw + x] + dig[i];
        var hX = base[(by) * gw + Math.min(x + 1, gw - 1)] + dig[y * gw + Math.min(x + 1, gw - 1)];
        var hY = base[(by + 1) * gw + x] + dig[Math.min(y + 1, gh - 1) * gw + x];
        var s = (hC - hX) * lx + (hC - hY) * ly;           // slope against the light
        var a = dig[i]; if (a < 0) a = -a; if (a > maxDig) maxDig = a;
        var p = i * 4;
        if (s > 0) { d[p] = 255; d[p + 1] = 251; d[p + 2] = 242; d[p + 3] = Math.min(26, s * 300) | 0; }
        else { d[p] = 23; d[p + 1] = 21; d[p + 2] = 15; d[p + 3] = Math.min(22, -s * 260) | 0; }
      }
    }
    ctx.putImageData(img, 0, 0);
    if (healing) {
      for (var k = 0; k < dig.length; k++) dig[k] *= 0.988;
      if (maxDig < 0.004) { healing = false; for (var k2 = 0; k2 < dig.length; k2++) dig[k2] = 0; }
      dirty = true; schedule();
    }
  }
  function schedule() { if (!raf) raf = requestAnimationFrame(render); }

  // ---- the finger ----
  var px = -1, py = -1;
  function furrow(ax, ay, bx, by) {
    var steps = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay)));
    for (var s = 0; s <= steps; s++) {
      var cx = ax + (bx - ax) * (s / steps), cy = ay + (by - ay) * (s / steps);
      for (var oy = -3; oy <= 3; oy++) {
        for (var ox = -3; ox <= 3; ox++) {
          var gx = Math.round(cx + ox), gy = Math.round(cy + oy);
          if (gx < 0 || gy < 0 || gx >= gw || gy >= gh) continue;
          var r2 = ox * ox + oy * oy;
          var i = gy * gw + gx;
          if (r2 <= 2.4) dig[i] = Math.max(dig[i] - 0.30, -0.85);           // the groove
          else if (r2 <= 9) dig[i] = Math.min(dig[i] + 0.10, 0.45);         // sand pushed to the sides
        }
      }
    }
  }
  if (fine && !reduce) {
    window.addEventListener("pointermove", function (e) {
      var gx = e.clientX / CELL, gy = e.clientY / CELL;
      if (px >= 0 && (Math.abs(gx - px) + Math.abs(gy - py)) < 24) furrow(px, py, gx, gy);
      px = gx; py = gy;
      healing = true; dirty = true; schedule();
    }, { passive: true });
    window.addEventListener("pointerleave", function () { px = -1; });
  }

  var st = 0;
  window.addEventListener("scroll", function () {
    if (reduce) return;
    scroll = window.scrollY || 0;
    px = -1;                                   // the page moved under the finger; don't smear
    dirty = true; schedule();
  }, { passive: true });
  window.addEventListener("resize", function () { clearTimeout(st); st = setTimeout(function () { size(); schedule(); }, 150); });

  size();
  render();
})();
