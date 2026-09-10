/* NELL BARDSLEY — the nib.

   One engine, three uses: the loader writes the wordmark with it, the
   instrument in THE HAND writes whatever you type into it, and the four
   release cards each render their diagnostic letter through it at that
   family's own tool setting.

   The idea it implements is the oldest one in the trade: a letter is the
   record of a tool. Nothing here stores an outline. Every glyph is a
   SKELETON — the path the pen travelled, nothing more — and the outline you
   see is computed by sweeping a nib along it. Change the nib's angle and the
   same skeleton produces a different letter, because the thicks and thins
   move. That is not a stylisation of calligraphy; it is what calligraphy is.

   HOW THE SWEEP WORKS

   A broad-edge nib is a straight edge of fixed width held at a fixed angle
   to the baseline — the angle does NOT follow the stroke. Where the stroke
   runs across the edge you get the full width; where it runs along the edge
   you get a hairline. So for each pair of adjacent samples on the path we
   emit the quadrilateral swept between two copies of that edge, and the union
   of all those quads is the stroke.

   Two implementation notes that are load-bearing:

   1. All the quads for one stroke go into a SINGLE Path2D and are filled
      once with the nonzero rule, rather than filled one at a time. A
      12-letter word is ~30 strokes and ~5,000 quads; 5,000 fill() calls a
      frame is a stall, 30 is nothing.

   2. Nonzero only unions shapes that wind the same way, and the winding of a
      swept quad flips whenever the stroke direction crosses the nib
      direction — which happens inside almost every curve. So every quad is
      winding-normalised by its signed area before it is added. Without that,
      the overlaps subtract and the letter develops holes exactly where the
      pen turns.

   COORDINATES

   Glyph space, y UP: baseline 0, x-height 500, ascender 720, descender -220.
   Everything is authored on that grid and scaled at draw time. */

(function (root) {
  'use strict';

  var METRICS = { base: 0, xh: 500, asc: 720, desc: -220, cap: 700 };

  /* ---- the hand ---------------------------------------------------------
     Lowercase only, on purpose. This nib is cut for minuscules — the
     capitals of this hand are drawn with a different tool and are not in
     here, so anything typed is folded down before it is laid out.
     `w` is the advance width; `s` is the list of strokes, each a control
     polyline that gets splined. Stroke order is pen order: the site draws
     them in the sequence a hand would. ---------------------------------- */

  var G = {
    'a': { w: 430, s: [
      [[335,430],[255,500],[135,470],[62,350],[60,150],[140,12],[262,14],[335,84]],
      [[335,500],[335,92],[358,14],[408,2]] ] },
    'b': { w: 430, s: [
      [[72,720],[72,66],[100,10]],
      [[72,330],[172,422],[292,382],[346,252],[322,92],[212,12],[102,28],[76,72]] ] },
    'c': { w: 400, s: [
      [[352,398],[282,480],[162,500],[70,410],[56,240],[112,80],[224,6],[332,52],[360,112]] ] },
    'd': { w: 440, s: [
      [[352,400],[272,490],[152,494],[70,388],[60,208],[132,50],[252,18],[344,92]],
      [[352,720],[352,92],[374,16],[424,4]] ] },
    'e': { w: 410, s: [
      [[64,254],[332,286],[336,400],[230,496],[110,470],[54,340],[62,178],[142,50],[262,14],[352,72]] ] },
    'f': { w: 300, s: [
      [[112,0],[112,556],[162,678],[252,700],[300,656]],
      [[26,482],[244,492]] ] },
    'g': { w: 430, s: [
      [[344,400],[262,490],[142,486],[64,378],[70,190],[162,50],[282,56],[344,142]],
      [[352,500],[346,62],[330,-108],[230,-208],[110,-198],[58,-138]] ] },
    'h': { w: 440, s: [
      [[72,720],[72,20],[96,0]],
      [[72,338],[152,470],[272,490],[352,400],[356,60],[388,4]] ] },
    'i': { w: 220, s: [
      [[76,500],[76,60],[112,0],[168,6]],
      [[76,648],[79,650]] ] },
    'j': { w: 230, s: [
      [[152,500],[152,-70],[82,-198],[-8,-186]],
      [[152,648],[155,650]] ] },
    'k': { w: 410, s: [
      [[72,720],[72,20],[96,0]],
      [[336,490],[72,232]],
      [[164,318],[352,20],[392,0]] ] },
    'l': { w: 240, s: [
      [[72,720],[72,60],[112,0],[178,6]] ] },
    'm': { w: 660, s: [
      [[72,500],[72,20],[96,0]],
      [[72,338],[146,470],[256,486],[322,396],[325,20],[350,0]],
      [[325,338],[399,470],[509,486],[575,396],[578,60],[608,4]] ] },
    'n': { w: 440, s: [
      [[72,500],[72,20],[96,0]],
      [[72,338],[152,470],[272,490],[352,400],[356,60],[388,4]] ] },
    'o': { w: 430, s: [
      [[202,500],[92,454],[50,320],[62,160],[152,18],[282,14],[352,130],[346,320],[262,470],[202,500]] ] },
    'p': { w: 440, s: [
      [[72,500],[72,-190],[98,-214]],
      [[72,330],[172,430],[292,400],[352,270],[332,100],[222,14],[106,30],[76,80]] ] },
    'q': { w: 440, s: [
      [[352,400],[272,490],[152,494],[70,388],[60,208],[132,50],[252,18],[348,96]],
      [[352,500],[352,-190],[382,-214],[432,-198]] ] },
    'r': { w: 350, s: [
      [[72,500],[72,20],[96,0]],
      [[72,330],[152,462],[262,500],[332,470]] ] },
    's': { w: 390, s: [
      [[334,420],[252,492],[130,490],[80,410],[122,318],[262,250],[302,150],[250,30],[130,10],[54,72]] ] },
    't': { w: 300, s: [
      [[132,648],[132,88],[192,10],[282,20],[322,72]],
      [[36,490],[262,496]] ] },
    'u': { w: 440, s: [
      [[72,500],[72,140],[152,20],[272,26],[352,120]],
      [[352,500],[352,58],[382,4],[432,0]] ] },
    'v': { w: 430, s: [
      [[60,500],[216,20]],
      [[216,20],[372,500]] ] },
    'w': { w: 590, s: [
      [[54,500],[176,26]],
      [[176,26],[292,432]],
      [[292,432],[402,26]],
      [[402,26],[524,500]] ] },
    'x': { w: 410, s: [
      [[54,500],[352,10]],
      [[60,10],[352,500]] ] },
    'y': { w: 410, s: [
      [[64,500],[196,92]],
      [[352,500],[232,92],[152,-118],[42,-204],[-28,-168]] ] },
    'z': { w: 410, s: [
      [[58,490],[344,490],[68,20],[362,20]] ] },
    ' ': { w: 210, s: [] },
    '.': { w: 190, s: [ [[80,28],[83,30]] ] },
    ',': { w: 190, s: [ [[86,40],[68,-96]] ] },
    '-': { w: 330, s: [ [[46,242],[286,242]] ] },
    '&': { w: 470, s: [
      [[400,60],[300,4],[160,10],[70,110],[100,240],[260,330],[300,420],[240,494],[150,478],[140,390],[220,250],[360,80],[420,20]] ] }
  };

  /* ---- centripetal Catmull-Rom -----------------------------------------
     Uniform Catmull-Rom cusps and self-intersects wherever the control
     points are unevenly spaced, which they always are in hand-authored
     skeletons — the bowl of an 'a' has points 40 units apart at the turn and
     200 apart down the side. Centripetal (alpha 0.5) is the one variant
     with a proof that it never does that, which is why it costs the extra
     arithmetic here. ---------------------------------------------------- */

  function dist(a, b) { return Math.sqrt((b[0] - a[0]) * (b[0] - a[0]) + (b[1] - a[1]) * (b[1] - a[1])); }

  function crPoint(p0, p1, p2, p3, t) {
    var t0 = 0;
    var t1 = t0 + Math.sqrt(dist(p0, p1));
    var t2 = t1 + Math.sqrt(dist(p1, p2));
    var t3 = t2 + Math.sqrt(dist(p2, p3));
    if (t1 === t0 || t2 === t1 || t3 === t2) {
      return [p1[0] + (p2[0] - p1[0]) * t, p1[1] + (p2[1] - p1[1]) * t];
    }
    var tt = t1 + (t2 - t1) * t;
    function mix(a, b, ta, tb) {
      var k = (tb - tt) / (tb - ta), m = (tt - ta) / (tb - ta);
      return [a[0] * k + b[0] * m, a[1] * k + b[1] * m];
    }
    var A1 = mix(p0, p1, t0, t1), A2 = mix(p1, p2, t1, t2), A3 = mix(p2, p3, t2, t3);
    var B1 = (function () { var k = (t2 - tt) / (t2 - t0), m = (tt - t0) / (t2 - t0); return [A1[0] * k + A2[0] * m, A1[1] * k + A2[1] * m]; })();
    var B2 = (function () { var k = (t3 - tt) / (t3 - t1), m = (tt - t1) / (t3 - t1); return [A2[0] * k + A3[0] * m, A2[1] * k + A3[1] * m]; })();
    var k = (t2 - tt) / (t2 - t1), m = (tt - t1) / (t2 - t1);
    return [B1[0] * k + B2[0] * m, B1[1] * k + B2[1] * m];
  }

  function spline(ctrl, spacing) {
    if (ctrl.length === 1) return [ctrl[0].slice()];
    var p = ctrl.slice();
    p.unshift([2 * p[0][0] - p[1][0], 2 * p[0][1] - p[1][1]]);
    p.push([2 * p[p.length - 1][0] - p[p.length - 2][0], 2 * p[p.length - 1][1] - p[p.length - 2][1]]);

    var out = [];
    for (var i = 1; i < p.length - 2; i++) {
      var span = dist(p[i], p[i + 1]);
      var n = Math.max(2, Math.ceil(span / spacing));
      for (var j = 0; j < n; j++) out.push(crPoint(p[i - 1], p[i], p[i + 1], p[i + 2], j / n));
    }
    out.push(ctrl[ctrl.length - 1].slice());
    return out;
  }

  /* ---- layout -----------------------------------------------------------
     Splining is the expensive half and depends only on the word, never on
     the nib, so it happens once here and the per-frame path build reads the
     result. `cum` is arc length along the stroke; `at` is where the stroke
     starts in the word's total travel, which is what turns a single 0..1
     progress value into "pen has reached the middle of the third letter". */

  function layout(word, tracking) {
    var track = typeof tracking === 'number' ? tracking : 34;
    var strokes = [], x = 0, total = 0;
    var chars = String(word).toLowerCase().split('');

    for (var c = 0; c < chars.length; c++) {
      var g = G[chars[c]];
      if (!g) continue;
      for (var s = 0; s < g.s.length; s++) {
        var pts = spline(g.s[s], 7);
        var abs = new Array(pts.length), cum = new Float64Array(pts.length);
        var len = 0;
        for (var i = 0; i < pts.length; i++) {
          abs[i] = [pts[i][0] + x, pts[i][1]];
          if (i) len += dist(abs[i - 1], abs[i]);
          cum[i] = len;
        }
        /* A dot is a single mark, not a travel: give it a nominal length so
           it still consumes a slice of the progress and lands in sequence. */
        if (len < 1) len = 26;
        strokes.push({ pts: abs, cum: cum, len: len, at: total });
        total += len;
      }
      x += g.w + track;
    }
    /* Ink bounds as well as metric bounds. A single 'a' occupies a fifth of
       the ascender-to-descender band, so a fit that always reserves the full
       band renders it at a fifth of the size it could be — which is wrong for
       a specimen letter. It is right for the instrument, where the baseline
       must not jump every time the word loses a descender, so both are
       carried and the caller picks. */
    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (var k = 0; k < strokes.length; k++) {
      var pp = strokes[k].pts;
      for (var m = 0; m < pp.length; m++) {
        if (pp[m][0] < minX) minX = pp[m][0];
        if (pp[m][0] > maxX) maxX = pp[m][0];
        if (pp[m][1] < minY) minY = pp[m][1];
        if (pp[m][1] > maxY) maxY = pp[m][1];
      }
    }
    if (!strokes.length) { minX = maxX = minY = maxY = 0; }

    return {
      strokes: strokes,
      total: total || 1,
      width: Math.max(0, x - track),
      top: METRICS.asc,
      bottom: METRICS.desc,
      ink: { x0: minX, x1: maxX, y0: minY, y1: maxY }
    };
  }

  /* ---- the sweep -------------------------------------------------------- */

  function nibEnds(p, dx, dy) {
    return [[p[0] - dx, p[1] - dy], [p[0] + dx, p[1] + dy]];
  }

  /* Emit one swept quad, wound counter-clockwise whatever the direction of
     travel. See note 2 at the top: nonzero fill unions same-wound shapes and
     subtracts opposite-wound ones, and the winding of this quad flips every
     time the path crosses the nib's own direction. */
  function quad(path, a1, a2, b1, b2) {
    var cross = (b1[0] - a1[0]) * (a2[1] - a1[1]) - (b1[1] - a1[1]) * (a2[0] - a1[0]);
    path.moveTo(a1[0], a1[1]);
    if (cross >= 0) { path.lineTo(a2[0], a2[1]); path.lineTo(b2[0], b2[1]); path.lineTo(b1[0], b1[1]); }
    else { path.lineTo(b1[0], b1[1]); path.lineTo(b2[0], b2[1]); path.lineTo(a2[0], a2[1]); }
    path.closePath();
  }

  /* opts:
       angle    pen angle in degrees off the baseline (0 = flat, 90 = upright)
       nibW     nib width in glyph units
       round    true for a monoline (round) nib rather than a broad edge
       progress 0..1 of the word's total travel
       scale, ox, oy   glyph space -> device space (y is flipped here)
       ghosts   draw the nib edge itself every so often
  */
  function draw(ctx, lay, opts) {
    var angle = (opts.angle || 0) * Math.PI / 180;
    var half = (opts.nibW || 70) / 2;
    var prog = opts.progress == null ? 1 : Math.max(0, Math.min(1, opts.progress));
    var travelled = prog * lay.total;
    var sc = opts.scale, ox = opts.ox, oy = opts.oy;

    /* Glyph space is y-up and the canvas is y-down, so the nib's vertical
       component is negated here rather than by transforming the context —
       a scaled context would also scale the hairlines of the guides. */
    var dx = Math.cos(angle) * half * sc;
    var dy = -Math.sin(angle) * half * sc;

    ctx.fillStyle = opts.color || '#131211';
    ctx.strokeStyle = opts.color || '#131211';

    for (var s = 0; s < lay.strokes.length; s++) {
      var st = lay.strokes[s];
      var want = travelled - st.at;
      if (want <= 0) break;                       /* pen has not got here yet */
      var frac = Math.min(1, want / st.len);

      /* Walk the samples up to the pen, then interpolate the last one so the
         stroke ends exactly where the pen is rather than at whichever sample
         happens to be nearest. */
      var pts = st.pts, cum = st.cum, end = cum[cum.length - 1] * frac;
      var run = [];
      for (var i = 0; i < pts.length; i++) {
        if (cum[i] <= end || i === 0) run.push([pts[i][0] * sc + ox, -pts[i][1] * sc + oy]);
        else {
          var t = (end - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]);
          run.push([(pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t) * sc + ox,
                    -(pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t) * sc + oy]);
          break;
        }
      }

      if (opts.round) {
        ctx.lineWidth = half * 2 * sc;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        if (run.length === 1) { ctx.moveTo(run[0][0], run[0][1]); ctx.lineTo(run[0][0] + 0.01, run[0][1]); }
        else { ctx.moveTo(run[0][0], run[0][1]); for (var r = 1; r < run.length; r++) ctx.lineTo(run[r][0], run[r][1]); }
        ctx.stroke();
      } else {
        var path = new Path2D();
        if (run.length === 1) {
          var e = nibEnds(run[0], dx, dy);
          path.moveTo(e[0][0], e[0][1]); path.lineTo(e[1][0], e[1][1]);
          path.lineTo(e[1][0] + 0.6, e[1][1] + 0.6); path.lineTo(e[0][0] + 0.6, e[0][1] + 0.6);
          path.closePath();
        }
        for (var q = 1; q < run.length; q++) {
          var A = nibEnds(run[q - 1], dx, dy), B = nibEnds(run[q], dx, dy);
          quad(path, A[0], A[1], B[0], B[1]);
        }
        ctx.fill(path, 'nonzero');
      }

      if (opts.ghosts) {
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
        ctx.strokeStyle = opts.ghostColor || '#b8b3a8';
        ctx.beginPath();
        for (var k = 0; k < run.length; k += 9) {
          var gEnd = nibEnds(run[k], dx, dy);
          ctx.moveTo(gEnd[0][0], gEnd[0][1]);
          ctx.lineTo(gEnd[1][0], gEnd[1][1]);
        }
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  /* Fit a layout inside a box, leaving room for the nib itself: a 90-degree
     nib sticks half its width above and below the skeleton, so a word laid
     out to the exact glyph bounds would be clipped at the extremes. */
  function fit(lay, boxW, boxH, nibW, pad, tight) {
    var p = pad == null ? 0 : pad;
    var bleed = nibW * 0.55;

    var x0 = tight ? lay.ink.x0 : 0;
    var x1 = tight ? lay.ink.x1 : lay.width;
    var y1 = tight ? lay.ink.y1 : lay.top;
    var y0 = tight ? lay.ink.y0 : lay.bottom;

    var gw = (x1 - x0) + bleed * 2;
    var gh = (y1 - y0) + bleed * 2;
    var sc = Math.min((boxW - p * 2) / gw, (boxH - p * 2) / gh);
    return {
      scale: sc,
      ox: (boxW - (x1 - x0) * sc) / 2 - x0 * sc,
      oy: (boxH - gh * sc) / 2 + (y1 + bleed) * sc
    };
  }

  root.NIB = { glyphs: G, metrics: METRICS, layout: layout, draw: draw, fit: fit };

})(window);
