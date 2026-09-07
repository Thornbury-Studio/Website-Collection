/* Thornbury Digital v5 — js/figure.js
   The Who-we-are stage: one cloud of points that is, in turn, each step of the
   studio's process; a wave and a ground under it, drawn from one attractor.

   WHAT THE REFERENCE ACTUALLY DOES, because it changed this file twice. Its
   "Our Team" canvas draws one GPU point per pixel of three pre-rendered
   artworks of particle figures and runs them as a sequence: a picture holds,
   comes apart into a scatter, and the next one gathers out of the same cloud
   while it is still flying — so the team is never five people frozen in one
   frame, it is the same light rearranging itself into the next thing they do.
   Its dimensionality was authored in 3D long before the browser saw it; the
   browser only ever moves pixels of a flat picture.

   THIS STAGE keeps the sequence and drops the picture. Nothing here samples
   the colour of a photograph. Each scene is a small tableau of licensed
   photographs traced to shape and surface direction only — no colour, no
   face, nobody who works here — and every point is lit from those two things
   alone (a lambert term for the rounding, a louder fresnel for the edge, so a
   silhouette burns and a cloud reads as a volume). And because the forms
   carry depth, the change between scenes is not a scatter of pixels: every
   point has a home in the scene that is leaving and a home in the scene that
   is arriving, and it travels between them on its own arc, lifted and blown
   across the room in a sweep that runs left to right, glowing while it is in
   the air. Points a scene has no use for park below the floor and rise out of
   it when the next scene needs them. The whole cloud turns a little as it
   changes, which a flat picture cannot do.

   THE SCENES are the four steps of the studio's process from its own About
   text, in order: look before we draw; decide in the open; build it to
   survive us; hand over everything. Each holds, then becomes the next; the
   page captions the one on stage and can jump to any of them.

   THE WAVE is long line strips on the Thomas attractor js/field.js already
   integrates, with constants read from the studio page's own world in
   js/bg.js. THE STARFIELD is a sparse slab behind. THE GROUND is a floor of
   particle trails whose drift the scroll pushes, through the same impulse
   js/main.js gives the field. Four draw calls; everything moves in vertex
   shaders; a scene change writes one set of buffers, not one per frame.
   Imported dynamically by js/main.js only when the stage is near, WebGL
   exists and motion is wanted. */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.min.js';

var HASH = [
  'vec3 hash31(float p) {',
  '  vec3 p3 = fract(vec3(p) * vec3(0.1031, 0.1030, 0.0973));',
  '  p3 += dot(p3, p3.yxz + 33.33);',
  '  return fract((p3.xxy + p3.yzz) * p3.zyx);',
  '}'
].join('\n');

/* One point, two homes. `position` and aNrmA/aDepA/aParkA describe where it
   sits in the scene on stage; aPosB and friends where it sits in the scene
   arriving. uMix runs 0 → 1 across a change and the point flies a quadratic
   arc between the two, lifted and blown in the sweep direction, staggered by
   a hash and by where it stands, so the change crosses the room as a wave
   rather than happening everywhere at once. */
var FIG_VERT = [
  'attribute vec3 aPosB;',
  'attribute vec3 aNrmA;',
  'attribute vec3 aNrmB;',
  'attribute float aDepA;',
  'attribute float aDepB;',
  'attribute float aParkA;',
  'attribute float aParkB;',
  'attribute float aRand;',
  'attribute float aEmber;',
  'uniform float uTime;',
  'uniform float uAssemble;',
  'uniform float uMix;',
  'uniform float uSweep;',
  'uniform float uSeed;',
  'uniform vec2 uPointer;',
  'uniform float uPointerOn;',
  'uniform float uSize;',
  'uniform float uDpr;',
  'uniform vec3 uLight;',
  'varying float vFade;',
  'varying float vEmber;',
  HASH,
  'void main() {',
  '  vec3 A = position;',
  '  vec3 B = aPosB;',
  /* where the change reaches this point: a sweep across the room plus a
     random share, so the wave has a ragged edge rather than a ruler's */
  '  float across = clamp((A.x * uSweep + 3.4) / 6.8, 0.0, 1.0);',
  '  float delay = (0.55 * aRand + 0.45 * across) * 0.5;',
  '  float local = clamp((uMix - delay) / 0.5, 0.0, 1.0);',
  '  float e = local * local * (3.0 - 2.0 * local);',
  /* the arc: points parked in both scenes stay parked and never fly */
  '  float still = aParkA * aParkB;',
  '  vec3 h = hash31(aRand * 7.1 + uSeed) - 0.5;',
  '  vec3 mid = mix(A, B, 0.5) + vec3(uSweep * (0.9 + 0.9 * h.x), 0.8 + 1.0 * abs(h.y), 0.6 * h.z) * (1.0 - still);',
  '  vec3 home = mix(mix(A, mid, e), mix(mid, B, e), e);',
  '  float flight = sin(3.14159 * e) * (1.0 - still);',
  /* the first appearance: out of a scatter, as the band always assembled */
  '  vec3 sc = hash31(aRand) - 0.5;',
  '  vec3 scattered = home + sc * vec3(4.6, 3.4, 3.0);',
  '  float a = clamp(uAssemble, 0.0, 1.0);',
  '  float lead = clamp((a - aRand * 0.32) / 0.68, 0.0, 1.0);',
  '  lead = lead * lead * (3.0 - 2.0 * lead);',
  '  vec3 p = mix(scattered, home, lead);',
  '  p.x += sin(uTime * 0.52 + aRand * 19.0) * 0.011;',
  '  p.y += cos(uTime * 0.44 + aRand * 23.0) * 0.011;',
  '  p.z += sin(uTime * 0.78 + aRand * 11.0) * 0.018;',
  '  vec2 d = p.xy - uPointer;',
  '  float push = smoothstep(0.34, 0.0, length(d)) * uPointerOn;',
  '  p.xy += normalize(d + vec2(1e-4)) * push * 0.13;',
  '  p.z += push * 0.09;',
  '  vec4 mv = modelViewMatrix * vec4(p, 1.0);',
  '  gl_Position = projectionMatrix * mv;',
  '  float park = mix(aParkA, aParkB, e);',
  '  float dep = mix(aDepA, aDepB, e);',
  '  gl_PointSize = uSize * uDpr * (0.55 + 0.70 * dep) * (0.75 + 0.45 * aRand) * (1.0 + 0.5 * flight) * mix(1.0, 0.5, park) * (2.6 / -mv.z);',
  /* No albedo anywhere in here. Which way the surface faces is the whole of the
     shading: lambert for the rounding, fresnel for the edge, and the fresnel is
     the louder of the two because a silhouette that burns is what separates a
     volume from a sheet. A point in the air is lit by its travel instead. */
  '  vec3 n = normalize(normalMatrix * normalize(mix(aNrmA, aNrmB, e) + vec3(1e-4)));',
  '  float lam = max(dot(n, normalize(uLight)), 0.0);',
  '  float fres = pow(1.0 - abs(n.z), 2.2);',
  '  float lit = 0.24 + 0.62 * lam + 0.88 * fres;',
  '  vFade = (lead * (0.70 + 0.30 * aRand) * lit + flight * 0.55 + push * 0.45) * (1.0 - 0.92 * park);',
  '  vEmber = max(aEmber, flight * 0.35);',
  '}'
].join('\n');

var FIG_FRAG = [
  'precision mediump float;',
  'uniform vec3 uChrome;',
  'uniform vec3 uEmber;',
  'uniform float uGain;',
  'varying float vFade;',
  'varying float vEmber;',
  'void main() {',
  '  vec2 c = gl_PointCoord - 0.5;',
  '  float d = dot(c, c);',
  '  if (d > 0.25) discard;',
  /* the gain is the stage's: a desktop stage is three times a phone's height,
     so the same points spread three times thinner and read as dust without it */
  '  float a = smoothstep(0.25, 0.01, d) * clamp(vFade * uGain, 0.0, 1.8) * 0.95;',
  '  gl_FragColor = vec4(mix(uChrome, uEmber, vEmber) * a, a);',
  '}'
].join('\n');

/* The wave is line segments, so a strand is a continuous curve rather than a
   queue of dots. x arrives normalised and is stretched to the frame at run time,
   so the sheet always crosses whatever width the band happens to be. */
var WAVE_VERT = [
  'attribute float aRand;',
  'attribute float aSeq;',
  'attribute float aEmber;',
  'uniform float uTime;',
  'uniform float uAssemble;',
  'uniform float uSpread;',
  'uniform vec2 uPointer;',
  'uniform float uPointerOn;',
  'varying float vFade;',
  'varying float vEmber;',
  'void main() {',
  '  float x = position.x * uSpread + uTime * 0.075 + aRand * uSpread;',
  '  x = mod(x + uSpread * 0.5, uSpread) - uSpread * 0.5;',
  '  vec3 p = vec3(x, position.y, position.z);',
  '  p.y += sin(uTime * 0.45 + aRand * 17.0 + position.x * 6.0) * 0.030;',
  '  vec2 d = p.xy - uPointer;',
  '  float push = smoothstep(0.45, 0.0, length(d)) * uPointerOn;',
  '  p.xy += normalize(d + vec2(1e-4)) * push * 0.05;',
  '  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);',
  '  float edge = 1.0 - smoothstep(uSpread * 0.28, uSpread * 0.5, abs(x));',
  '  vFade = edge * (0.25 + 0.75 * (1.0 - aSeq)) * clamp(uAssemble, 0.0, 1.0) + push * 0.3;',
  '  vEmber = aEmber;',
  '}'
].join('\n');

var FLAT_FRAG = [
  'precision mediump float;',
  'uniform vec3 uChrome;',
  'uniform vec3 uEmber;',
  'uniform float uGain;',
  'varying float vFade;',
  'varying float vEmber;',
  'void main() {',
  '  float a = clamp(vFade, 0.0, 1.0) * uGain;',
  '  gl_FragColor = vec4(mix(uChrome, uEmber, vEmber) * a, a);',
  '}'
].join('\n');

var STAR_VERT = [
  'attribute float aRand;',
  'uniform float uTime;',
  'uniform float uAssemble;',
  'uniform float uSize;',
  'uniform float uDpr;',
  'varying float vFade;',
  'void main() {',
  '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
  '  gl_Position = projectionMatrix * mv;',
  '  gl_PointSize = uSize * uDpr * (0.4 + 0.9 * aRand) * (2.6 / -mv.z);',
  /* out of phase with each other, so the slab never reads as a printed screen */
  '  float tw = 0.55 + 0.45 * sin(uTime * 0.7 + aRand * 40.0);',
  '  vFade = tw * (0.20 + 0.55 * aRand) * clamp(uAssemble, 0.0, 1.0);',
  '}'
].join('\n');

var STAR_FRAG = [
  'precision mediump float;',
  'uniform vec3 uChrome;',
  'varying float vFade;',
  'void main() {',
  '  vec2 c = gl_PointCoord - 0.5;',
  '  float d = dot(c, c);',
  '  if (d > 0.25) discard;',
  '  float a = smoothstep(0.25, 0.0, d) * clamp(vFade, 0.0, 1.0) * 0.55;',
  '  gl_FragColor = vec4(uChrome * a, a);',
  '}'
].join('\n');

/* Read the packed surface description. There is deliberately no colour input: a
   pixel is either inside the cut-out or it is not, and if it is, all that is
   taken is where it sits and which way it faces. The budget is counted against
   the pixels actually inside the matte, so a small pack is traced as densely as
   a large one. */
function trace(packImg, worldH, depthScale, thickness, budget) {
  var w = packImg.naturalWidth, h = packImg.naturalHeight;
  var cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  var ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(packImg, 0, 0);
  var px = ctx.getImageData(0, 0, w, h).data;
  var inside = 0;
  for (var q = 0; q < px.length; q += 4) if (px[q] || px[q + 1] || px[q + 2]) inside++;
  var keep = Math.min(1, budget / Math.max(1, inside));

  var scale = worldH / h;
  var pos = [], rnd = [], dep = [], nrm = [];
  for (var y = 0; y < h; y++) {
    for (var x = 0; x < w; x++) {
      var i = (y * w + x) * 4;
      if (px[i] === 0 && px[i + 1] === 0 && px[i + 2] === 0) continue;
      if (keep < 1 && Math.random() > keep) continue;
      var nx = px[i] / 127.5 - 1, ny = px[i + 1] / 127.5 - 1;
      var nz = Math.sqrt(Math.max(0.0001, 1 - nx * nx - ny * ny));
      var dv = px[i + 2] / 255;
      var jx = Math.random() - 0.5, jy = Math.random() - 0.5;
      /* lifted off the surface along its own normal, so the cloud has thickness
         and the rim does not read as a cut edge */
      var t = (Math.random() - 0.5) * thickness;
      pos.push((x + jx - w / 2) * scale + nx * t,
               -(y + jy - h / 2) * scale + ny * t,
               (dv - 0.5) * depthScale + nz * t);
      rnd.push(Math.random());
      dep.push(dv);
      nrm.push(nx, ny, nz);
    }
  }
  return { pos: pos, rnd: rnd, dep: dep, nrm: nrm, count: rnd.length };
}

/* The site's own law, and the studio page's own constants. */
function studioLaw() {
  var w = null;
  try { w = window.TBBg && window.TBBg.presets && window.TBBg.presets.studio.world; } catch (e) { w = null; }
  return {
    b: w && w.b != null ? w.b : 0.205,
    ext: w && w.ext != null ? w.ext : 4.4,
    seed: w && w.seed != null ? w.seed : 11
  };
}

/* Strands on the Thomas attractor, seeded the way js/field.js seeds them, then
   flattened into a sheet and emitted as line-segment pairs. */
function wave(strands, per, groundY, opts) {
  var law = studioLaw(), b = law.b, ext = law.ext, DT = 0.02;
  var pos = [], rnd = [], seq = [], emb = [];
  var s = law.seed * 0.618;
  function hash(n) { var v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); }

  for (var k = 0; k < strands; k++) {
    var x = (hash(s + k) - 0.5) * 4, y = (hash(s + k + 91) - 0.5) * 4, z = (hash(s + k + 173) - 0.5) * 4;
    var i, dx, dy, dz;
    for (i = 0; i < 240; i++) {
      dx = Math.sin(y) - b * x; dy = Math.sin(z) - b * y; dz = Math.sin(x) - b * z;
      x += dx * DT; y += dy * DT; z += dz * DT;
    }
    var phase = hash(s + k + 400), prev = null;
    for (var j = 0; j < per; j++) {
      for (i = 0; i < 3; i++) {
        dx = Math.sin(y) - b * x; dy = Math.sin(z) - b * y; dz = Math.sin(x) - b * z;
        x += dx * DT; y += dy * DT; z += dz * DT;
      }
      var cur = [(x / ext) * 0.5, groundY + (y / ext) * opts.rise, (z / ext) * opts.depth];
      if (prev) {
        pos.push(prev[0], prev[1], prev[2], cur[0], cur[1], cur[2]);
        var t = j / (per - 1 || 1);
        rnd.push(phase, phase);
        seq.push(t, t);
        var e = Math.random() < 0.045 ? 1 : 0;
        emb.push(e, e);
      }
      prev = cur;
    }
  }
  return { pos: pos, rnd: rnd, seq: seq, emb: emb, count: rnd.length };
}

/* THE GROUND. A sheet of particles on the floor plane, drifting across the
   frame under two crossing swells, each one drawn as a short trail from where
   it was a beat ago to where it is — so length is velocity, which is the law
   the liquid field on every page already obeys. The drift has a flow speed
   that the scroll pushes, through the same impulse js/main.js gives the field,
   so one gesture moves both objects. Dense where the figures stand, thinning
   into the distance and at the edges; crests are brighter than troughs. */
var GROUND_VERT = [
  'attribute float aRand;',
  'attribute float aEnd;',
  'attribute float aEmber;',
  'uniform float uTime;',
  'uniform float uFlow;',
  'uniform float uFlowVel;',
  'uniform float uAssemble;',
  'uniform float uSpread;',
  'uniform vec2 uPointer;',
  'uniform float uPointerOn;',
  'varying float vFade;',
  'varying float vEmber;',
  'float lift(float x, float z, float t) {',
  '  float y = sin(x * 1.9 + t * 0.62 + z * 1.4) * 0.036;',
  '  y += sin(z * 3.1 - t * 0.41 + x * 0.7) * 0.020;',
  '  y += sin(x * 4.3 - t * 0.9) * 0.008;',
  '  return y;',
  '}',
  'void main() {',
  '  float xh = position.x * uSpread + uFlow + aRand * uSpread;',
  '  xh = mod(xh + uSpread * 0.5, uSpread) - uSpread * 0.5;',
  '  float xt = xh - uFlowVel * 0.7;',
  '  float z = position.z;',
  '  float yh = position.y + lift(xh, z, uTime);',
  '  float yt = position.y + lift(xt, z, uTime - 0.7);',
  '  vec2 d = vec2(xh, yh) - uPointer;',
  '  float push = smoothstep(0.55, 0.0, length(d)) * uPointerOn;',
  '  yh += push * 0.07;',
  '  vec3 p = mix(vec3(xt, yt, z), vec3(xh, yh, z), aEnd);',
  '  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);',
  '  float edge = 1.0 - smoothstep(uSpread * 0.30, uSpread * 0.5, abs(xh));',
  '  float crest = smoothstep(-0.03, 0.05, yh - position.y);',
  '  float depth = 1.0 - smoothstep(0.6, 2.8, -z);',
  '  vFade = edge * depth * (0.26 + 0.74 * crest) * (0.55 + 0.45 * aRand)',
  '        * clamp(uAssemble, 0.0, 1.0) * (0.12 + 0.88 * aEnd) + push * 0.35 * aEnd;',
  '  vEmber = aEmber;',
  '}'
].join('\n');

/* A floor of particle pairs. More than half of them stand where the figures
   stand; the rest recede. Each particle is two vertices — tail and head — so it
   can be drawn as a trail. */
function ground(n, groundY) {
  var pos = [], rnd = [], end = [], emb = [];
  for (var i = 0; i < n; i++) {
    var near = Math.random() < 0.58;
    var x = Math.random() - 0.5;
    var z = near ? (Math.random() - 0.5) * 1.1 - 0.05 : -2.6 + Math.random() * 3.5;
    var y = groundY + (Math.random() - 0.5) * 0.03;
    var r = Math.random();
    var e = Math.random() < 0.03 ? 1 : 0;
    pos.push(x, y, z, x, y, z);
    rnd.push(r, r);
    end.push(0, 1);
    emb.push(e, e);
  }
  return { pos: pos, rnd: rnd, end: end, emb: emb, count: n };
}

function stars(n, spanX, spanY, spanZ) {
  var pos = [], rnd = [];
  for (var i = 0; i < n; i++) {
    pos.push((Math.random() - 0.5) * spanX,
             (Math.random() - 0.5) * spanY,
             -0.9 - Math.random() * spanZ);
    rnd.push(Math.random());
  }
  return { pos: pos, rnd: rnd, count: n };
}

/* THE SCENES. One per step of the studio's process, in order. Each is a small
   tableau of forms whose prop is part of the silhouette — that is what makes
   it read as an action rather than a person — placed in the room at its own
   depth and turn. x, y, z in stage units; s = scale; r = turn; pts = the
   point budget. `anchor` is the form the page's caption points at; `chest`
   its height above its own centre, as a share of its scale. Forms whose
   photograph ends at the shin sit a little lower, so the cut is in the ground. */
var SCENES = [
  { /* 01 We look before we draw: binoculars up, and a camera held up */
    forms: [
      { src: 'img/team-pack-8.webp',  x: -0.60, y: -0.04, z:  0.05, s: 1.00, r:  0.18, pts: 26000 },
      { src: 'img/team-pack-7.webp',  x:  0.80, y: -0.02, z: -0.60, s: 0.92, r: -0.28, pts: 18000 }
    ], anchor: 0, chest: 0.55 },
  { /* 02 We decide in the open: one at the board, two listening */
    forms: [
      { src: 'img/team-pack-9.webp',  x: -0.40, y: -0.20, z: -0.20, s: 0.82, r: -0.06, pts: 42000 },
      { src: 'img/team-pack-2.webp',  x:  1.60, y:  0.00, z: -0.65, s: 0.86, r:  0.35, pts: 14000 }
    ], anchor: 0, chest: 0.45 },
  { /* 03 We build it to survive us: hands on the laptop; the review at the table behind */
    forms: [
      { src: 'img/team-pack-10.webp', x: -0.90, y: -0.10, z:  0.00, s: 0.92, r: -0.16, pts: 28000 },
      { src: 'img/team-pack.webp',    x:  1.35, y: -0.02, z: -1.30, s: 0.78, r:  0.08, pts: 22000 }
    ], anchor: 0, chest: 0.55 },
  { /* 04 We hand over everything: the box changing hands; one already carrying it away */
    forms: [
      { src: 'img/team-pack-11.webp', x: -0.55, y: -0.04, z: -0.15, s: 0.95, r: -0.15, pts: 30000 },
      { src: 'img/team-pack-6.webp',  x:  1.60, y: -0.02, z: -0.80, s: 0.90, r: -0.35, pts: 16000 }
    ], anchor: 0, chest: 0.55 }
];

var HOLD_S = 4.8;     /* how long a scene is held once it has settled */
var MORPH_S = 2.6;    /* how long the change to the next one takes */

function loadImage(src) {
  return new Promise(function (res) {
    var img = new Image();
    img.decoding = 'async';
    img.onload = function () { res(img); };
    img.onerror = function () { res(null); };
    img.src = src;
  });
}

export function mount(host, opts) {
  opts = opts || {};

  var canvas = document.createElement('canvas');
  canvas.className = 'fig3d-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  host.insertBefore(canvas, host.firstChild);

  var renderer, scene, camera, waveLines, starPts, groundLines, ensemble, cloud;
  var geo, mat, N = 0, scenes = [];   /* compiled scenes: { pos, nrm, dep, park, count, anchor:[x,y,z] } */
  var waveGeo, starGeo, groundGeo, waveMat, starMat, groundMat;
  var raf = 0, alive = true, visible = false, t0 = performance.now(), last = 0;
  var pointerOn = 0, pointerTarget = 0, pxWorld = 0, pyWorld = 0, pxT = 0, pyT = 0, assemble = 0;
  /* the ground's drift: a base speed plus whatever the scroll has pushed into
     it, decaying with the same ~0.36 s half-life the field's yaw impulse uses */
  var flow = 0, flowBoost = 0, FLOW_BASE = 0.11;
  /* the sequence */
  var cur = 0, nxt = -1, mix = 0, holdT = 0, pending = -1, sweep = 1, seed = 0, settled = false;
  var phone = false, xk = 1;
  var yaw = 0, pitch = 0;   /* the pointer's turn of the tableau, eased */

  /* a phone traces fewer points than a half-size pack holds, so it is handed
     the half-size tier: a third of the bytes, nothing it could show lost */
  var tier = Math.min(innerWidth, innerHeight) < 700 ? '-sm' : '';
  var srcs = [];
  SCENES.forEach(function (sc) { sc.forms.forEach(function (f) { if (srcs.indexOf(f.src) < 0) srcs.push(f.src); }); });
  Promise.all(srcs.map(function (s) { return loadImage(s.replace('.webp', tier + '.webp')); })).then(build);

  /* Trace every pack once, then lay each scene out: forms turned, scaled and
     placed on the CPU, so the shader only ever sees two homes per point. */
  function compile(imgs, small) {
    var traced = {};
    srcs.forEach(function (s, i) { if (imgs[i]) traced[s] = imgs[i]; });
    var out = [];
    SCENES.forEach(function (sc) {
      var pos = [], nrm = [], dep = [], anchor = null;
      sc.forms.forEach(function (f, fi) {
        var img = traced[f.src];
        if (!img) return;   /* a missing pack drops its form, never the scene */
        var fg = trace(img, 2.05 * f.s, 1.05 * f.s, small ? 0.05 : 0.06, Math.round(f.pts * (small ? 0.45 : 1)));
        var c = Math.cos(f.r), s = Math.sin(f.r);
        for (var i = 0; i < fg.count; i++) {
          var x = fg.pos[i * 3], y = fg.pos[i * 3 + 1], z = fg.pos[i * 3 + 2];
          pos.push(x * c + z * s + f.x, y + f.y, -x * s + z * c + f.z);
          var nx = fg.nrm[i * 3], ny = fg.nrm[i * 3 + 1], nz = fg.nrm[i * 3 + 2];
          nrm.push(nx * c + nz * s, ny, -nx * s + nz * c);
          dep.push(fg.dep[i]);
        }
        if (fi === sc.anchor) anchor = [f.x, f.y + sc.chest * f.s, f.z];
      });
      out.push({ pos: pos, nrm: nrm, dep: dep, count: pos.length / 3, anchor: anchor || [0, 0.4, 0] });
    });
    return out;
  }

  /* Fill one home (A or B) of the shared buffers from a compiled scene. Points
     the scene has no use for park below the floor, out of frame, and rise out
     of it when a later scene needs them. */
  function fill(target, sc) {
    var P = target.pos.array, Nn = target.nrm.array, D = target.dep.array, K = target.park.array;
    var i, n = sc.count;
    for (i = 0; i < n; i++) {
      P[i * 3] = sc.pos[i * 3] * xk; P[i * 3 + 1] = sc.pos[i * 3 + 1]; P[i * 3 + 2] = sc.pos[i * 3 + 2];
      Nn[i * 3] = sc.nrm[i * 3]; Nn[i * 3 + 1] = sc.nrm[i * 3 + 1]; Nn[i * 3 + 2] = sc.nrm[i * 3 + 2];
      D[i] = sc.dep[i]; K[i] = 0;
    }
    for (i = n; i < N; i++) {
      var h = ((i * 2654435761) >>> 0) / 4294967296;
      var g = ((i * 40503 + 7) >>> 0) % 1000 / 1000;
      P[i * 3] = (h - 0.5) * 6.4; P[i * 3 + 1] = -2.8 - g * 0.5; P[i * 3 + 2] = (g - 0.5) * 2.4;
      Nn[i * 3] = 0; Nn[i * 3 + 1] = 1; Nn[i * 3 + 2] = 0;
      D[i] = 0.5; K[i] = 1;
    }
    target.pos.needsUpdate = target.nrm.needsUpdate = target.dep.needsUpdate = target.park.needsUpdate = true;
  }
  var A, B;   /* the two homes' attribute sets */

  function build(imgs) {
    if (!alive) return;
    var small = Math.min(innerWidth, innerHeight) < 700;
    scenes = compile(imgs, small);
    N = 0;
    scenes.forEach(function (s) { N = Math.max(N, s.count); });
    if (!N) { cleanup(); return; }
    var wv = wave(small ? 90 : 150, small ? 26 : 38, -1.00, { rise: 0.26, depth: 0.80 });
    var st = stars(small ? 260 : 520, 9, 3.2, 1.6);
    var gd = ground(small ? 3200 : 8400, -1.02);

    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvas, alpha: true, antialias: false, powerPreference: 'low-power'
      });
    } catch (e) { cleanup(); return; }
    renderer.setClearColor(0x000000, 0);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(42, 1, 0.1, 40);

    var chrome = new THREE.Color(0xe1e1e1), ember = new THREE.Color(0xff2a00);
    var pointer = new THREE.Vector2(999, 999);

    ensemble = new THREE.Group();
    scene.add(ensemble);

    geo = new THREE.BufferGeometry();
    var rnd = new Float32Array(N), emb = new Float32Array(N);
    for (var i = 0; i < N; i++) { rnd[i] = Math.random(); emb[i] = Math.random() < 0.04 ? 1 : 0; }
    A = { pos: new THREE.BufferAttribute(new Float32Array(N * 3), 3), nrm: new THREE.BufferAttribute(new Float32Array(N * 3), 3),
          dep: new THREE.BufferAttribute(new Float32Array(N), 1), park: new THREE.BufferAttribute(new Float32Array(N), 1) };
    B = { pos: new THREE.BufferAttribute(new Float32Array(N * 3), 3), nrm: new THREE.BufferAttribute(new Float32Array(N * 3), 3),
          dep: new THREE.BufferAttribute(new Float32Array(N), 1), park: new THREE.BufferAttribute(new Float32Array(N), 1) };
    [A.pos, A.nrm, A.dep, A.park, B.pos, B.nrm, B.dep, B.park].forEach(function (a) { a.setUsage(THREE.DynamicDrawUsage); });
    geo.setAttribute('position', A.pos);
    geo.setAttribute('aNrmA', A.nrm);
    geo.setAttribute('aDepA', A.dep);
    geo.setAttribute('aParkA', A.park);
    geo.setAttribute('aPosB', B.pos);
    geo.setAttribute('aNrmB', B.nrm);
    geo.setAttribute('aDepB', B.dep);
    geo.setAttribute('aParkB', B.park);
    geo.setAttribute('aRand', new THREE.BufferAttribute(rnd, 1));
    geo.setAttribute('aEmber', new THREE.BufferAttribute(emb, 1));
    /* the cloud is never culled by a stale bound: it is the whole room */
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 12);
    mat = new THREE.ShaderMaterial({
      vertexShader: FIG_VERT, fragmentShader: FIG_FRAG,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 }, uAssemble: { value: 0 }, uMix: { value: 0 }, uSweep: { value: 1 }, uSeed: { value: 0 },
        uPointer: { value: new THREE.Vector2(999, 999) }, uPointerOn: { value: 0 },
        /* smaller points on a phone: the additive cloud over-exposes at a phone's density */
        uSize: { value: small ? 1.55 : 2.9 }, uDpr: { value: 1 },
        uGain: { value: small ? 1.0 : 1.5 },
        uLight: { value: new THREE.Vector3(0.42, 0.50, 0.76) },
        uChrome: { value: chrome }, uEmber: { value: ember }
      }
    });
    cloud = new THREE.Points(geo, mat);
    cloud.frustumCulled = false;
    ensemble.add(cloud);

    waveGeo = new THREE.BufferGeometry();
    waveGeo.setAttribute('position', new THREE.Float32BufferAttribute(wv.pos, 3));
    waveGeo.setAttribute('aRand', new THREE.Float32BufferAttribute(wv.rnd, 1));
    waveGeo.setAttribute('aSeq', new THREE.Float32BufferAttribute(wv.seq, 1));
    waveGeo.setAttribute('aEmber', new THREE.Float32BufferAttribute(wv.emb, 1));
    waveMat = new THREE.ShaderMaterial({
      vertexShader: WAVE_VERT, fragmentShader: FLAT_FRAG,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 }, uAssemble: { value: 0 }, uSpread: { value: 6 },
        uPointer: { value: pointer }, uPointerOn: { value: 0 },
        uGain: { value: 0.46 },
        uChrome: { value: chrome }, uEmber: { value: ember }
      }
    });
    waveLines = new THREE.LineSegments(waveGeo, waveMat);
    scene.add(waveLines);

    starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(st.pos, 3));
    starGeo.setAttribute('aRand', new THREE.Float32BufferAttribute(st.rnd, 1));
    starMat = new THREE.ShaderMaterial({
      vertexShader: STAR_VERT, fragmentShader: STAR_FRAG,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 }, uAssemble: { value: 0 },
        uSize: { value: small ? 1.6 : 1.9 }, uDpr: { value: 1 },
        uChrome: { value: chrome }
      }
    });
    starPts = new THREE.Points(starGeo, starMat);
    scene.add(starPts);

    groundGeo = new THREE.BufferGeometry();
    groundGeo.setAttribute('position', new THREE.Float32BufferAttribute(gd.pos, 3));
    groundGeo.setAttribute('aRand', new THREE.Float32BufferAttribute(gd.rnd, 1));
    groundGeo.setAttribute('aEnd', new THREE.Float32BufferAttribute(gd.end, 1));
    groundGeo.setAttribute('aEmber', new THREE.Float32BufferAttribute(gd.emb, 1));
    groundMat = new THREE.ShaderMaterial({
      vertexShader: GROUND_VERT, fragmentShader: FLAT_FRAG,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 }, uFlow: { value: 0 }, uFlowVel: { value: FLOW_BASE },
        uAssemble: { value: 0 }, uSpread: { value: 6 },
        uPointer: { value: pointer }, uPointerOn: { value: 0 },
        uGain: { value: 1.15 },
        uChrome: { value: chrome }, uEmber: { value: ember }
      }
    });
    groundLines = new THREE.LineSegments(groundGeo, groundMat);
    scene.add(groundLines);

    resize();
    fill(A, scenes[0]); fill(B, scenes[0]);
    if (typeof opts.onReady === 'function') opts.onReady(N, scenes.map(function (s) { return s.count; }));
    addEventListener('resize', resize);
    host.addEventListener('pointermove', onPointer);
    host.addEventListener('pointerleave', onLeave);
    io.observe(host);
    announce('hold');
    step(performance.now());
  }

  /* Where each scene's caption should point: the anchor form's chest, projected
     to stage fractions, so the leader lands on the figure rather than on a guess. */
  function anchors() {
    if (!camera) return [];
    camera.updateMatrixWorld(true);
    camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
    var v = new THREE.Vector3();
    return scenes.map(function (s, i) {
      v.set(s.anchor[0] * xk, s.anchor[1], s.anchor[2]);
      ensemble.localToWorld(v);
      v.project(camera);
      return { index: i, u: (v.x + 1) / 2, v: (1 - v.y) / 2 };
    });
  }
  function announce(phase) {
    if (typeof opts.onScene !== 'function') return;
    var an = anchors();
    opts.onScene({ index: phase === 'morph' ? nxt : cur, phase: phase, anchors: an, hold: HOLD_S, morph: MORPH_S });
  }

  function resize() {
    if (!renderer) return;
    var w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    var dpr = Math.min(devicePixelRatio || 1, Math.min(innerWidth, innerHeight) < 700 ? 1.25 : 1.6);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    mat.uniforms.uDpr.value = dpr;
    starMat.uniforms.uDpr.value = dpr;
    /* the tableau holds the middle of the stage; on a phone it comes down a
       little and smaller, and the forms close ranks */
    var wasPhone = phone;
    phone = w < 761;
    xk = phone ? 0.8 : 1;
    ensemble.position.x = 0;
    ensemble.position.y = phone ? 0.02 : -0.30;
    ensemble.scale.setScalar(phone ? 0.55 : 0.86);
    ensemble.updateMatrixWorld(true);
    camera.aspect = w / h;
    camera.position.z = 1.32 / Math.tan((camera.fov * Math.PI / 180) / 2);
    camera.updateProjectionMatrix();
    waveMat.uniforms.uSpread.value = Math.max(3.2, 1.32 * camera.aspect * 2 + 1.6);
    groundMat.uniforms.uSpread.value = waveMat.uniforms.uSpread.value;
    if (A && wasPhone !== phone) { fill(A, scenes[cur]); fill(B, scenes[nxt >= 0 ? nxt : cur]); }
    if (typeof opts.onLayout === 'function') opts.onLayout(anchors());
  }

  function onPointer(ev) {
    if (!camera) return;
    var r = host.getBoundingClientRect();
    var nx = ((ev.clientX - r.left) / r.width) * 2 - 1;
    var ny = -(((ev.clientY - r.top) / r.height) * 2 - 1);
    var hh = Math.tan((camera.fov * Math.PI / 180) / 2) * camera.position.z;
    pxT = nx * hh * camera.aspect;
    pyT = ny * hh;
    if (!pointerTarget) { pxWorld = pxT; pyWorld = pyT; }
    pointerTarget = 1;
  }
  function onLeave() { pointerTarget = 0; }

  var io = new IntersectionObserver(function (es) {
    visible = es[0].isIntersecting;
    if (visible) run(); else stop();
  }, { threshold: 0 });

  function run() { if (!raf && alive && renderer) { t0 = performance.now(); last = 0; raf = requestAnimationFrame(step); } }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }

  /* Begin the change to scene k: its homes go into B, the sweep direction
     alternates so a scene never leaves the way the last one arrived. */
  function advance(k) {
    if (!scenes.length || k === cur || nxt >= 0) return;
    nxt = k;
    fill(B, scenes[k]);
    sweep = -sweep;
    seed = Math.random() * 100;
    mat.uniforms.uSweep.value = sweep;
    mat.uniforms.uSeed.value = seed;
    mix = 0;
    announce('morph');
  }
  /* The change is complete: B becomes A, and the scene holds. */
  function settle() {
    A.pos.array.set(B.pos.array); A.nrm.array.set(B.nrm.array); A.dep.array.set(B.dep.array); A.park.array.set(B.park.array);
    A.pos.needsUpdate = A.nrm.needsUpdate = A.dep.needsUpdate = A.park.needsUpdate = true;
    cur = nxt; nxt = -1; mix = 0; holdT = 0;
    mat.uniforms.uMix.value = 0;
    announce('hold');
    if (pending >= 0 && pending !== cur) { var p = pending; pending = -1; advance(p); }
    else pending = -1;
  }

  function step(now) {
    raf = 0;
    if (!alive || !renderer) return;
    var t = (now - t0) / 1000;
    var r = host.getBoundingClientRect();
    var vh = innerHeight || 1;
    /* assembled whenever a real share of the stage is on screen */
    var seen = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0)) / Math.min(r.height || 1, vh);
    var want = Math.max(0, Math.min(1, seen * 2.2));
    assemble += (want - assemble) * 0.06;
    pointerOn += (pointerTarget - pointerOn) * 0.12;
    pxWorld += (pxT - pxWorld) * 0.16;
    pyWorld += (pyT - pyWorld) * 0.16;
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now;
    flowBoost *= Math.exp(-dt / 0.52);
    var flowVel = FLOW_BASE + flowBoost;
    flow += flowVel * dt;

    /* the sequence: hold once assembled, then change; a change in flight
       finishes before the next begins */
    if (assemble > 0.98) settled = true;
    if (settled) {
      if (nxt >= 0) {
        mix = Math.min(1, mix + dt / MORPH_S);
        mat.uniforms.uMix.value = mix;
        if (mix >= 1) settle();
      } else if (seen > 0.35) {
        holdT += dt;
        if (holdT >= HOLD_S) advance((cur + 1) % scenes.length);
      }
    }

    groundMat.uniforms.uTime.value = t;
    groundMat.uniforms.uFlow.value = flow;
    groundMat.uniforms.uFlowVel.value = flowVel;
    groundMat.uniforms.uAssemble.value = assemble;
    groundMat.uniforms.uPointerOn.value = pointerOn;

    mat.uniforms.uTime.value = t;
    mat.uniforms.uAssemble.value = assemble;
    mat.uniforms.uPointerOn.value = pointerOn;
    /* the shader works in the cloud's own space, so the pointer is moved into it */
    mat.uniforms.uPointer.value.set((pxWorld - ensemble.position.x) / ensemble.scale.x, (pyWorld - ensemble.position.y) / ensemble.scale.x);
    /* the tableau is a volume, so it turns: a slow turntable that never stops,
       the pointer's own turn on top of it (left of the stage looks from the
       left), and a swing through each change — none of which a flat picture
       can do. The forms are relief shells traced from one side, so the turn is
       bounded where their edges would show. */
    var hh = Math.tan((camera.fov * Math.PI / 180) / 2) * camera.position.z;
    var yawT = pointerOn * Math.max(-1, Math.min(1, pxWorld / (hh * camera.aspect))) * 0.30;
    var pitchT = pointerOn * Math.max(-1, Math.min(1, pyWorld / hh)) * -0.07;
    yaw += (yawT - yaw) * 0.035;
    pitch += (pitchT - pitch) * 0.035;
    var turn = nxt >= 0 ? Math.sin(Math.PI * mix) * 0.18 * sweep : 0;
    var table = Math.sin(t * 0.09) * 0.24;
    cloud.rotation.y = Math.max(-0.5, Math.min(0.5, table + yaw)) + turn;
    cloud.rotation.x = Math.sin(t * 0.10) * 0.02 + pitch;

    waveMat.uniforms.uTime.value = t;
    waveMat.uniforms.uAssemble.value = assemble;
    waveMat.uniforms.uPointerOn.value = pointerOn;
    starMat.uniforms.uTime.value = t;
    starMat.uniforms.uAssemble.value = assemble;

    renderer.render(scene, camera);
    if (visible) raf = requestAnimationFrame(step);
  }

  function cleanup() {
    alive = false;
    stop();
    try { io.disconnect(); } catch (e) { /* never observed */ }
    removeEventListener('resize', resize);
    host.removeEventListener('pointermove', onPointer);
    host.removeEventListener('pointerleave', onLeave);
    if (geo) geo.dispose();
    if (mat) mat.dispose();
    [waveGeo, starGeo, groundGeo].forEach(function (g) { if (g) g.dispose(); });
    [waveMat, starMat, groundMat].forEach(function (m) { if (m) m.dispose(); });
    if (renderer) {
      renderer.dispose();
      /* <main> is swapped on navigation, so the context has to go with it or a
         handful of visits exhausts the browser's WebGL context budget */
      if (renderer.forceContextLoss) renderer.forceContextLoss();
    }
    renderer = scene = camera = ensemble = cloud = waveLines = starPts = groundLines = null;
    geo = mat = waveGeo = starGeo = groundGeo = waveMat = starMat = groundMat = null;
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
  }

  return {
    destroy: cleanup,
    /* the scroll's push, in floor units per second; decays on its own */
    impulse: function (v) { flowBoost = Math.min(1.4, flowBoost + v); },
    /* jump to a scene: now if the stage is holding, or as soon as the change
       in flight has landed */
    go: function (i) {
      if (!scenes.length) return;
      i = ((i % scenes.length) + scenes.length) % scenes.length;
      if (nxt >= 0) { pending = i; return; }
      if (i !== cur) advance(i);
    },
    scene: function () { return nxt >= 0 ? nxt : cur; },
    count: function () { return scenes.length; }
  };
}
