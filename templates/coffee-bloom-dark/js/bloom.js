/* BLOOM. — the stage. See DESIGN.md §1.

   One photograph of dry grounds in a wave dripper, one WebGL2 fragment
   program, drawn twice per frame: once per bed, each in its own viewport.
   The program knows nothing about coffee freshness. Everything it draws —
   how high the dome stands, how much foam, how busy the bubbles, whether
   water pools on top — arrives as uniforms from js/bloom-model.js, sampled
   at the current brew time for that bed's days-since-roast. The readouts
   beside each bed are printed from the same numbers.

   Scroll scrubs brew time (0–50 s). The right-hand bed's age is the
   visitor's: a slider, or the roast date off their own bag.

   Discipline, per DARK.md §5: DPR capped at 1.5, nothing renders while the
   stage is off screen, the loop only runs while bubbles are actually
   moving, and under prefers-reduced-motion there is no scrub, no pin and
   no idle motion — a still frame at 0:14 that the time slider can step. */

(function () {
  'use strict';

  var B = window.BLOOM;
  var section = document.querySelector('[data-bloom]');
  if (!B || !section) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  var stage = section.querySelector('.stage');
  var canvas = section.querySelector('canvas.bloom-gl');
  var timeInput = document.getElementById('bloom-t');
  var clockEl = section.querySelector('[data-o="clock"]');
  var summaryEl = document.getElementById('bloom-summary');
  var dayInput = document.getElementById('bag-day');
  var dateInput = document.getElementById('bag-date');

  if (reduced) section.classList.add('is-still');

  var T_STILL = 14;
  var t = reduced ? T_STILL : 0;
  var sched = B.schedule(new Date());

  /* ------------------------------------------------------------------ *
     beds
   * ------------------------------------------------------------------ */

  var beds = [].slice.call(section.querySelectorAll('[data-bed]')).map(function (el, i) {
    var o = function (k) { return el.querySelector('[data-o="' + k + '"]'); };
    return {
      el: el,
      view: el.querySelector('.bed-view'),
      kind: el.getAttribute('data-bed'),
      day: +el.getAttribute('data-day'),
      seed: i ? 7.31 : 2.17,
      out: { day: o('day'), note: o('note'), mm: o('mm'), held: o('held'), co2: o('co2') },
      full: el.querySelector('.spark-full'),
      live: el.querySelector('.spark-live'),
      head: el.querySelector('.spark-head'),
      gNow: el.querySelector('.g-now'),
      gPeak: el.querySelector('.g-peak'),
      last: {}
    };
  });

  var ours = beds[0], yours = beds[1];
  ours.day = sched.dayNow;

  function setText(bed, key, value) {
    if (bed.last[key] === value || !bed.out[key]) return;
    bed.last[key] = value;
    bed.out[key].textContent = value;
  }

  var SPARK_W = 200, SPARK_H = 56;
  var GAUGE_MM = 12;   // the printed rule runs 0–12 mm

  function describe(bed) {
    var c = B.curve(bed.day);
    bed.curve = c;
    if (bed.full) bed.full.setAttribute('d', B.path(bed.day, SPARK_W, SPARK_H));
    setText(bed, 'day', 'Day ' + bed.day);
    setText(bed, 'co2', String(Math.round(B.co2(bed.day) * 100)));
    if (bed === ours) {
      setText(bed, 'note', 'Roasted ' + B.fmt(sched.lastRoast) + '.');
    } else {
      var roasted = sched.today - bed.day;
      var note = bed.day === 0 ? 'Roasted today.' :
        'Roasted ' + B.fmt(roasted) + (bed.day >= 60 ? ' — the back of the cupboard.' :
          bed.day > B.WINDOW.to ? ' — past its month.' :
          bed.day < B.WINDOW.from ? ' — still resting.' : ' — inside its month.');
      setText(bed, 'note', note);
    }
  }

  function summary() {
    if (!summaryEl) return;
    var a = B.summary(ours.day), b = B.summary(yours.day);
    summaryEl.textContent =
      'Ours, day ' + ours.day + ': rises ' + a.peak.toFixed(1) + ' millimetres and holds ' +
      Math.round(a.hold) + ' seconds. The other bag, day ' + yours.day + ': rises ' +
      b.peak.toFixed(1) + ' millimetres and holds ' + Math.round(b.hold) + ' seconds.';
  }

  function readouts() {
    beds.forEach(function (bed) {
      var s = B.at(bed.curve, t);
      setText(bed, 'mm', s.mm.toFixed(1));
      setText(bed, 'held', String(Math.round(s.held)));
      if (bed.gNow) {
        bed.gNow.style.bottom = (Math.min(s.mm, GAUGE_MM) / GAUGE_MM * 100).toFixed(2) + '%';
        bed.gPeak.style.bottom = (Math.min(s.peak, GAUGE_MM) / GAUGE_MM * 100).toFixed(2) + '%';
      }
      // the sparkline: the part of the curve already brewed, and a head
      if (bed.live) {
        var n = bed.curve.mm.length, upto = Math.round(t / 0.1), d = '';
        for (var i = 0; i <= upto && i < n; i += 2) {
          d += (i ? 'L' : 'M') + ((i / (n - 1)) * SPARK_W).toFixed(1) + ' ' +
            (SPARK_H - (bed.curve.mm[i] / B.RISE_MAX) * SPARK_H).toFixed(1);
        }
        bed.live.setAttribute('d', d || 'M0 ' + SPARK_H);
        bed.head.setAttribute('cx', ((t / B.T_END) * SPARK_W).toFixed(1));
        bed.head.setAttribute('cy', (SPARK_H - (s.mm / B.RISE_MAX) * SPARK_H).toFixed(1));
      }
    });
    if (clockEl) {
      var sec = Math.floor(t);
      var txt = '0:' + String(sec).padStart(2, '0');
      if (clockEl.textContent !== txt) clockEl.textContent = txt;
    }
  }

  /* ------------------------------------------------------------------ *
     the fragment program
   * ------------------------------------------------------------------ */

  var VERT = [
    '#version 300 es',
    'in vec2 p;',
    'out vec2 vUv;',
    'void main(){ vUv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }'
  ].join('\n');

  var FRAG = [
    '#version 300 es',
    'precision highp float;',
    'in vec2 vUv;',
    'out vec4 frag;',
    'uniform sampler2D uTex;',
    'uniform float uT;',      // brew time, s
    'uniform float uH;',      // dome height now, 0..1 of RISE_MAX
    'uniform float uFoam;',   // foam coverage now
    'uniform float uAct;',    // bubble activity now
    'uniform float uGas;',    // gas released so far — drives bubble lives, monotonic in t
    'uniform float uFall;',   // how far the dome has given way
    'uniform float uPool;',   // water standing on a bed with no gas to lift it
    'uniform float uClock;',  // wall clock, for the idle shimmer only (0 under reduced motion)
    'uniform float uZoom;',   // framing
    'uniform float uSeed;',
    'uniform float uPxQ;',    // one device pixel, in grounds units
    'const float RG = 0.30;', // grounds radius / plate width — tools/grade.py GROUNDS_R
    'const float TAU = 6.2831853;',

    // hashes without sine — no grid artefacts at these coordinate ranges
    'float hash21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }',
    // lattice jitter: rows of cells must not line up, so this one is sin-based
    // (coordinates here never leave a few hundred units, well inside highp)
    'vec2 hash22(vec2 p){ p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3))); return fract(sin(p) * 43758.5453); }',
    'float vnoise(vec2 p){',
    '  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);',
    '  return mix(mix(hash21(i), hash21(i + vec2(1,0)), f.x), mix(hash21(i + vec2(0,1)), hash21(i + vec2(1,1)), f.x), f.y);',
    '}',
    'const mat2 ROT = mat2(0.8, 0.6, -0.6, 0.8);',
    'float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 4; i++){ s += a * vnoise(p); p = ROT * p * 2.03 + 7.1; a *= 0.5; } return s / 0.9375; }',

    // packed froth: foam is literally bubbles pressed together, so it is
    // drawn as cells. x = distance to the nearest centre, y = to the wall,
    // zw = offset from the nearest centre
    'vec4 froth(vec2 p){',
    '  vec2 i0 = floor(p), f = fract(p);',
    '  float d1 = 8.0, d2 = 8.0; vec2 v = vec2(0.0);',
    '  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++){',
    '    vec2 o = vec2(float(i), float(j));',
    '    vec2 c = o + 0.12 + 0.76 * hash22(i0 + o);',
    '    float d = length(f - c);',
    '    if (d < d1){ d2 = d1; d1 = d; v = f - c; } else if (d < d2){ d2 = d; }',
    '  }',
    '  return vec4(d1, d2 - d1, v);',
    '}',

    // when the spiral pour reaches a point on the bed: out from the centre in
    // three turns over five seconds, then the rim wicks in after it
    'float wetTime(vec2 q){',
    '  float r = length(q);',
    '  float s = clamp(r / 0.92, 0.0, 1.0);',
    '  float th = 3.0 * TAU * s;',
    '  float d = mod(atan(q.y, q.x) - th + 3.14159265, TAU) - 3.14159265;',
    '  float tw = 2.0 + 5.0 * s + d / TAU * (5.0 / 3.0);',
    '  tw += (fbm(q * 3.0 + uSeed) - 0.5) * 1.1;',
    '  tw += max(r - 0.92, 0.0) * 24.0;',
    '  return max(tw, 1.9);',
    '}',

    // F2 − F1 of a jittered grid — the cracks a collapsing dome opens
    'float cellEdge(vec2 p){',
    '  vec2 i0 = floor(p), f = fract(p);',
    '  float d1 = 8.0, d2 = 8.0;',
    '  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++){',
    '    vec2 o = vec2(float(i), float(j));',
    '    vec2 c = o + hash22(i0 + o + 9.3);',
    '    float d = length(f - c);',
    '    if (d < d1){ d2 = d1; d1 = d; } else if (d < d2){ d2 = d; }',
    '  }',
    '  return d2 - d1;',
    '}',

    // one layer of bubbles. Each cell may hold one; its life (swell, then
    // burst) is driven by the gas released so far, so scrubbing backwards
    // un-bursts them exactly. x = coverage, y = specular, z = rim, w = r
    'vec4 bubbles(vec2 q, float scale, float density, float drive, float sizeMax, float seed){',
    '  vec2 g = q * scale + seed;',
    '  vec2 i0 = floor(g), f = fract(g);',
    '  float px = uPxQ * scale;',
    '  vec4 best = vec4(0.0);',
    '  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++){',
    '    vec2 o = vec2(float(i), float(j));',
    '    vec2 id = i0 + o;',
    '    if (hash21(id * 1.31 + 4.7) > density) continue;',
    '    vec2 rnd = hash22(id);',
    '    vec2 c = o + 0.2 + rnd * 0.6;',
    '    float life = fract(rnd.x * 7.13 + drive * (0.55 + rnd.y * 0.9));',
    '    float grow = smoothstep(0.0, 0.7, life) * (1.0 - smoothstep(0.93, 1.0, life));',
    '    float rad = sizeMax * (0.35 + 0.65 * rnd.y) * grow;',
    '    if (rad < px * 0.9) continue;',
    '    vec2 d = f - c;',
    '    float dist = length(d) / rad;',
    '    float m = 1.0 - smoothstep(1.0 - 1.6 * px / rad, 1.0, dist);',
    '    if (m > best.x){',
    '      vec2 e = d / rad - vec2(-0.34, 0.38);',
    '      best = vec4(m, exp(-dot(e, e) / 0.03), smoothstep(0.5, 1.0, dist), dist);',
    '    }',
    '  }',
    '  return best;',
    '}',

    'void main(){',
    '  vec2 uvp = 0.5 + (vUv - 0.5) / uZoom;',
    '  vec2 q0 = (uvp - 0.5) / RG;',          // grounds units: r = 1 at the rim
    '  float r0 = length(q0);',
    '  float inBed = 1.0 - smoothstep(0.96, 1.03, r0);',

    // wetting
    '  float tw = wetTime(q0);',
    '  float wet = smoothstep(tw, tw + 0.7, uT);',

    // the pour: where the stream is now
    '  float ps = clamp((uT - 2.0) / 5.0, 0.0, 1.0);',
    '  float pa = 3.0 * TAU * ps;',
    '  vec2 pp = 0.92 * ps * vec2(cos(pa), sin(pa));',
    '  float pouring = smoothstep(1.9, 2.1, uT) * (1.0 - smoothstep(6.9, 7.2, uT));',
    '  float pd = length(q0 - pp);',
    '  float ripple = sin(pd * 64.0 - uT * 22.0) * exp(-pd * 6.0) * pouring;',

    // the dome, and the lens: a rising surface comes toward the camera
    '  float dome = pow(clamp(1.0 - r0 * r0, 0.0, 1.0), 1.1);',
    '  float hl = uH * dome * mix(0.3, 1.0, wet);',
    '  vec2 q = q0 * (1.0 - 0.09 * hl) + ripple * 0.004 * normalize(q0 - pp + 1e-4);',
    '  vec3 tex = texture(uTex, 0.5 + q * RG).rgb;',
    '  float lum = dot(tex, vec3(0.2126, 0.7152, 0.0722));',

    // filter paper and steel, off white so they never glare on a dark page
    '  float paper = smoothstep(0.42, 0.62, lum) * smoothstep(0.8, 0.97, r0);',
    '  vec3 col = mix(tex, tex * vec3(0.63, 0.6, 0.56), paper);',

    // wet grounds: darker, redder
    '  col = mix(col, tex * vec3(0.46, 0.36, 0.29), wet * inBed * (1.0 - 0.7 * paper));',

    // grounds that water has just reached are glossy for a second or two,
    // so the spiral of the pour draws itself in light
    '  float fresh = wet * exp(-max(uT - tw, 0.0) / 1.3) * inBed * (1.0 - paper);',
    '  col += vec3(0.7, 0.58, 0.46) * fresh * (0.45 + 0.55 * smoothstep(0.4, 0.8, vnoise(q0 * 70.0))) * 0.8;',

    // the stain the brew wicks into the paper
    '  float reach = 1.0 + 0.2 * (1.0 - exp(-max(uT - 6.0, 0.0) / 6.0));',
    '  float stain = paper * step(6.0, uT) * (1.0 - smoothstep(reach - 0.07, reach + 0.02, r0 + (fbm(q0 * 5.0) - 0.5) * 0.12));',
    '  col *= mix(vec3(1.0), vec3(0.74, 0.55, 0.37), stain * 0.85);',

    // foam: packed crema-tan froth where the gas is, in patches with dark
    // wet channels between them, torn open as the dome gives
    '  float fn = smoothstep(0.28, 0.72, fbm(q0 * 2.4 + uSeed * 3.0));',
    '  float edgeN = (fbm(q0 * 6.0 + 4.0) - 0.5) * 0.14;',
    '  float cover = uFoam * wet * (1.0 - smoothstep(0.9, 1.04, r0 + edgeN));',
    '  float foam = smoothstep(0.18, 0.9, cover * (0.45 + 0.6 * fn) + 0.2 * dome * uFoam);',
    '  foam *= 1.0 - smoothstep(0.46, 0.6, lum) * smoothstep(0.8, 0.95, r0);',  // the real paper ridges cut the edge
    '  vec2 w = q0 * 2.7 + (vec2(fbm(q0 * 2.4), fbm(q0 * 2.4 + 5.2)) - 0.5) * 1.2;',
    '  float cw = uFall * 0.16;',
    '  float crack = uFall > 0.001 ? 1.0 - smoothstep(cw * 0.45, cw, cellEdge(w)) : 0.0;',
    '  foam *= 1.0 - crack * 0.95;',
    '  vec3 crema = mix(vec3(0.27, 0.155, 0.09), vec3(0.66, 0.475, 0.31), smoothstep(0.2, 0.85, fbm(q0 * 4.5 + 2.0) * 0.8 + 0.35 * dome * uH));',
    // two sizes of packed round bubbles: a lit cap each, dark where they meet
    '  vec4 f1 = froth(q * 40.0 + uSeed);',
    '  crema *= 0.62 + 0.5 * smoothstep(0.62, 0.16, f1.x);',
    '  vec2 e1 = f1.zw - vec2(-0.11, 0.12);',
    '  crema += vec3(1.0, 0.95, 0.86) * exp(-dot(e1, e1) / 0.006) * 0.16;',
    '  vec4 f2 = froth(q * 13.0 + uSeed * 2.0);',
    '  crema *= 0.84 + 0.22 * smoothstep(0.66, 0.26, f2.x);',
    '  vec2 e2 = f2.zw - vec2(-0.12, 0.13);',
    '  crema += vec3(1.0, 0.95, 0.86) * exp(-dot(e2, e2) / 0.004) * 0.2;',
    '  crema = mix(crema, tex * vec3(0.5, 0.4, 0.33), 0.3 * smoothstep(0.66, 0.95, vnoise(q0 * 44.0)));',  // grounds caught in the froth
    '  col = mix(col, crema, foam);',
    '  col *= 1.0 - 0.45 * exp(-abs(r0 - 1.0 - edgeN) / 0.035) * uH * wet;',  // the crevice where dome meets paper

    // lighting: the dome\'s analytic slope, one raking light from top left
    '  float K = 0.34 * uH;',
    '  vec2 grad = -2.0 * q0 * 1.1 * pow(max(1.0 - r0 * r0, 1e-3), 0.1) * K * wet * inBed;',
    '  vec3 n = normalize(vec3(-grad, 1.0));',
    '  vec3 L = normalize(vec3(-0.55, 0.6, 0.58));',
    '  float shade = dot(n, L) / L.z;',
    '  col *= mix(1.0, shade, 1.0);',

    // wet glints on grounds not under foam
    '  float glint = step(0.72, vnoise(q0 * 140.0 + uSeed)) * wet * inBed * (1.0 - foam);',
    '  col += vec3(0.9, 0.8, 0.68) * glint * 0.10 * (0.4 + 0.6 * shade);',

    // standing water: darkens the bed, mirrors the light, drains away
    '  float pool = uPool * wet * inBed * (1.0 - foam);',
    // the reflection is the room's window, so it is window-shaped, bent a
    // little by the grounds under the film
    '  vec2 lp = q0 - vec2(-0.26, 0.30) + (lum - 0.3) * 0.06 + ripple * 0.04;',
    '  lp = mat2(0.94, 0.34, -0.34, 0.94) * lp;',
    '  vec2 bq = abs(lp) - vec2(0.3, 0.18) + 0.05;',
    '  float sd = length(max(bq, 0.0)) + min(max(bq.x, bq.y), 0.0) - 0.05;',
    '  float sheen = smoothstep(0.16, -0.06, sd) * 0.34 + exp(-max(sd, 0.0) / 0.22) * 0.07;',
    '  sheen *= 0.35 + 1.1 * smoothstep(0.35, 0.75, vnoise(q0 * 26.0 + 3.0) * 0.6 + lum * 0.9);',  // a film over grains, not a mirror
    '  col = mix(col, col * 0.7, pool);',
    '  col += vec3(0.93, 0.88, 0.8) * sheen * pool;',
    '  col += vec3(0.85, 0.78, 0.7) * max(ripple, 0.0) * 0.22 * wet * inBed;',

    // bubbles: a few big glassy ones, many small; each is a thin film over
    // whatever is under it, with a dark rim and one highlight
    '  float bm = wet * inBed;',
    '  float drive = uGas * 1.5 + uClock * 0.1 * uAct;',
    '  float clump = smoothstep(0.35, 0.75, vnoise(q0 * 2.3 + uSeed * 5.0));',   // big bubbles gather
    '  vec4 big = bubbles(q0, 6.5, uAct * (0.18 + 0.5 * clump + 0.25 * smoothstep(0.5, 0.95, r0)) * bm, drive, 0.48, 3.1);',
    // a big bubble is a clear film over dark liquid: darker inside, a thin
    // lit rim, one hard highlight and a faint second one opposite
    '  vec3 film = col * 0.52 + vec3(0.012, 0.006, 0.003);',
    '  film += vec3(0.55, 0.42, 0.3) * smoothstep(0.78, 0.96, big.w) * (1.0 - smoothstep(0.96, 1.0, big.w)) * 0.55;',
    '  film += vec3(1.0, 0.96, 0.9) * big.y * 1.1;',
    '  col = mix(col, film, big.x);',
    '  vec4 fine = bubbles(q0, 19.0, uAct * 0.8 * bm, drive * 1.7, 0.44, 11.7);',
    '  vec3 film2 = col * 0.7 + vec3(0.01, 0.005, 0.0);',
    '  film2 += vec3(0.6, 0.46, 0.34) * smoothstep(0.7, 0.95, fine.w) * 0.35;',
    '  film2 += vec3(1.0, 0.95, 0.86) * fine.y * 0.85;',
    '  col = mix(col, film2, fine.x);',

    // the stream itself, seen from above: a glossy column end and its splash
    // a thin column of water seen end-on: bright, glassy, with the light
    // running down its near side, never a dark disc
    '  float col_d = smoothstep(0.042, 0.03, pd) * pouring;',
    '  vec2 hq = q0 - pp - vec2(-0.01, 0.012);',
    '  vec3 stream = vec3(0.74, 0.68, 0.6) + vec3(0.26, 0.26, 0.24) * exp(-dot(hq, hq) / 0.00018);',
    '  col = mix(col, stream, col_d * 0.85);',
    '  col += vec3(0.5, 0.45, 0.38) * smoothstep(0.075, 0.04, pd) * (1.0 - col_d) * 0.22 * pouring;',
    '  float splash = exp(-pow((pd - 0.085) / 0.018, 2.0)) * pouring;',
    '  col += vec3(0.75, 0.66, 0.56) * splash * 0.3 * (0.6 + 0.4 * vnoise(q0 * 40.0 + uT * 3.0));',

    // the dripper sits in the dark: the plate fades into the page ground
    '  float pr = length(vUv - 0.5);',
    '  col = mix(vec3(0.059, 0.051, 0.043), col, smoothstep(0.5, 0.35, pr));',
    '  col += (hash21(gl_FragCoord.xy + fract(uClock * 7.0)) - 0.5) / 255.0;',
    '  frag = vec4(clamp(col, 0.0, 1.0), 1.0);',
    '}'
  ].join('\n');

  /* ------------------------------------------------------------------ *
     GL
   * ------------------------------------------------------------------ */

  var gl = null, prog = null, U = {}, ready = false;

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      if (window.console) console.warn('[bloom] shader:', gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  function initGL() {
    if (!canvas) return false;
    try {
      gl = canvas.getContext('webgl2', { alpha: false, antialias: false, powerPreference: 'high-performance' });
    } catch (e) { gl = null; }
    if (!gl) return false;
    var vs = compile(gl.VERTEX_SHADER, VERT), fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return false;
    prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.bindAttribLocation(prog, 0, 'p');
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    ['uTex', 'uT', 'uH', 'uFoam', 'uAct', 'uGas', 'uFall', 'uPool', 'uClock', 'uZoom', 'uSeed', 'uPxQ']
      .forEach(function (k) { U[k] = gl.getUniformLocation(prog, k); });
    gl.uniform1i(U.uTex, 0);

    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // the plate: the larger file on large screens, loaded off the critical path
    var plate = new Image();
    plate.decoding = 'async';
    plate.onload = function () {
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      try {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, plate);
      } catch (e) {
        // opened from file://, the plate counts as cross-origin: keep the
        // photograph and the printed numbers instead of a broken canvas
        section.classList.add('no-gl');
        return;
      }
      gl.generateMipmap(gl.TEXTURE_2D);
      ready = true;
      section.classList.add('is-live');
      kick();
    };
    plate.src = window.innerWidth * Math.min(window.devicePixelRatio || 1, 1.5) > 1500 ?
      'img/bed.webp' : 'img/bed-1024.webp';

    return true;
  }

  var dpr = 1;

  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var w = Math.round(stage.clientWidth * dpr), h = Math.round(stage.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  }

  function render(clock) {
    if (!ready) return;
    size();
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.disable(gl.SCISSOR_TEST);
    gl.clearColor(0.059, 0.051, 0.043, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.SCISSOR_TEST);
    var cr = canvas.getBoundingClientRect();
    var zoom = window.innerWidth < 700 ? 1.28 : 1.0;
    beds.forEach(function (bed) {
      var r = bed.view.getBoundingClientRect();
      var x = Math.round((r.left - cr.left) * dpr), w = Math.round(r.width * dpr);
      var y = Math.round((cr.bottom - r.bottom) * dpr), h = Math.round(r.height * dpr);
      if (w < 2 || h < 2) return;
      gl.viewport(x, y, w, h);
      gl.scissor(x, y, w, h);
      var s = B.state(t, bed.day), a = B.at(bed.curve, t);
      gl.uniform1f(U.uT, t);
      gl.uniform1f(U.uH, s.h);
      gl.uniform1f(U.uFoam, s.foam);
      gl.uniform1f(U.uAct, s.act);
      gl.uniform1f(U.uGas, a.gas);
      gl.uniform1f(U.uFall, s.fall * Math.min(1, s.v * 1.4));
      gl.uniform1f(U.uPool, s.pool);
      gl.uniform1f(U.uClock, reduced ? 0 : clock);
      gl.uniform1f(U.uZoom, zoom);
      gl.uniform1f(U.uSeed, bed.seed);
      gl.uniform1f(U.uPxQ, 1 / (w * 0.30 * zoom));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    });
  }

  /* ------------------------------------------------------------------ *
     scheduling: draw on change; loop only while bubbles move on screen
   * ------------------------------------------------------------------ */

  var visible = false, raf = 0, t0 = performance.now();

  function busy() {
    if (reduced) return false;
    return beds.some(function (bed) { return B.state(t, bed.day).act > 0.03; });
  }

  function frame() {
    raf = 0;
    if (!visible) return;
    render((performance.now() - t0) / 1000);
    if (busy()) raf = requestAnimationFrame(frame);
  }

  function kick() {
    if (visible && !raf) raf = requestAnimationFrame(frame);
  }

  function setT(v) {
    v = Math.max(0, Math.min(B.T_END, v));
    if (Math.abs(v - t) < 1e-4) return;
    t = v;
    readouts();
    if (timeInput && document.activeElement !== timeInput) timeInput.value = String(Math.round(t * 2) / 2);
    kick();
  }

  function setDay(bed, day) {
    day = Math.max(0, Math.min(365, Math.round(day)));
    if (day === bed.day && bed.curve) return;
    bed.day = day;
    describe(bed);
    readouts();
    summary();
    kick();
  }

  /* ------------------------------------------------------------------ *
     wiring
   * ------------------------------------------------------------------ */

  beds.forEach(describe);
  readouts();
  summary();

  var live = initGL();
  if (!live) section.classList.add('no-gl');

  // context loss/restore: GPU resources (program, buffer, texture) are gone
  // once lost, so recovery re-runs the same setup initGL() already does,
  // rather than leaving the mechanic permanently dead for the pageview.
  canvas.addEventListener('webglcontextlost', function (e) {
    e.preventDefault();
    ready = false;
    section.classList.remove('is-live');
  });
  canvas.addEventListener('webglcontextrestored', function () {
    if (initGL()) section.classList.remove('no-gl');
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) kick();
    }, { rootMargin: '5% 0px' }).observe(stage);
  } else {
    visible = true;
  }

  window.addEventListener('resize', function () { kick(); });

  // the visitor's bag: a slider, or the date off the bag itself
  if (dateInput) {
    dateInput.max = B.isoFor(sched.today);
    dateInput.value = B.isoFor(sched.today - yours.day);
    dateInput.addEventListener('change', function () {
      var d = B.daysSince(dateInput.value);
      if (d === null || d < 0) return;
      var clamped = Math.min(365, d);
      if (dayInput) dayInput.value = String(clamped);
      setDay(yours, clamped);
    });
  }
  if (dayInput) {
    dayInput.value = String(yours.day);
    dayInput.addEventListener('input', function () {
      setDay(yours, +dayInput.value);
      if (dateInput) dateInput.value = B.isoFor(sched.today - yours.day);
    });
  }

  // scroll scrubs brew time. The first and last few percent of the pinned
  // run are dead zones: dry grounds before, the settled bed after.
  var st = null;
  if (!reduced && hasGsap) {
    gsap.registerPlugin(ScrollTrigger);
    var proxy = { t: -4 };
    var tween = gsap.to(proxy, {
      t: B.T_END + 3, ease: 'none', paused: true,
      onUpdate: function () { setT(proxy.t); }
    });
    st = ScrollTrigger.create({
      trigger: section, start: 'top top', end: 'bottom bottom',
      scrub: 0.5, animation: tween
    });
  } else if (!reduced) {
    var onScroll = function () {
      var r = section.getBoundingClientRect();
      var span = r.height - window.innerHeight;
      var p = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
      setT(-4 + p * (B.T_END + 7));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // the timeline is also a control: dragging it moves the scroll (or, when
  // the page is still, the brew itself)
  if (timeInput) {
    timeInput.value = String(t);
    timeInput.addEventListener('input', function () {
      var v = +timeInput.value;
      if (reduced || !st) { t = -1; setT(v); return; }
      var p = (v + 4) / (B.T_END + 7);
      var y = st.start + p * (st.end - st.start);
      if (window.lenis) window.lenis.scrollTo(y, { immediate: true });
      else window.scrollTo(0, y);
    });
  }

  // a handle for the screenshot harness
  window.__bloom = {
    setT: function (v) { t = -1; setT(v); render((performance.now() - t0) / 1000); },
    setDay: function (i, d) { setDay(beds[i], d); },
    get t() { return t; },
    get live() { return ready; },
    beds: beds
  };
})();
