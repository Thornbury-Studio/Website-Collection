/* Thornbury Digital v5 — js/figure.js
   The Team band: three populations drawn from one photograph and one attractor.

   WHAT THE REFERENCE ACTUALLY DOES, because it changed this file. The look this
   is aiming at is not a runtime effect at all — its "Our Team" canvas samples a
   single 4400×2456 pre-rendered artwork of particle figures and shimmers it. Its
   dimensionality was authored in 3D long before the browser saw it. A photograph
   can never match that completely: a depth estimate gives a shell seen from one
   side, not a body. What it can match is the register, and the register comes
   from one decision — throw the photograph away.

   So the albedo is not used. Nothing here samples the colour of the picture. All
   that is kept is the shape of the subjects and the direction their surface
   faces, and every point is lit from those two things. Faces, clothing, pattern
   and identity all leave with the albedo, which is why the figures read as
   smooth generic forms rather than as photographed people — and why nobody in
   the source is recognisable on the page.

   THE FIGURES. Several licensed photographs, one instance each, so the band
   shows several distinct forms rather than one pose. RMBG-1.4 cuts the subjects out, Depth Anything V2 estimates
   distance, and the depth field is smoothed and differentiated into a surface
   normal — all at build time, all baked into `img/team-pack.webp` (normal.x and
   normal.y in R and G, depth in B; z is recovered rather than stored). Shading
   is a lambert term for the rounding and a louder fresnel term for the edge, so
   silhouettes burn and interiors fall away, which is what makes a cloud read as
   a volume rather than a sheet. Points are jittered along their own normal so
   the cloud has thickness instead of being an infinitely thin shell, and the
   normal goes through `normalMatrix`, so the key light stays fixed in the room
   while the form turns under it.

   THE WAVE. Long line strips, not dots. The law is the Thomas attractor
   js/field.js already integrates and the constants are read at run time from the
   studio page's own world in js/bg.js — the site's own motion system in a
   different renderer, flattened into a shallow sheet and drifted sideways.

   THE STARFIELD. A sparse slab behind both: the ambient layer the reference
   has, and the thing that gives the other two somewhere to sit.

   THE GROUND. A floor of particle trails under the figures, drifting and
   swelling, its speed pushed by the scroll — see GROUND_VERT below.

   Four draw calls. Everything moves in vertex shaders, so the CPU per frame is
   one bounding-rect read and a handful of uniform writes. Imported dynamically
   by js/main.js only when the band is near, WebGL exists and motion is wanted. */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.min.js';

var HASH = [
  'vec3 hash31(float p) {',
  '  vec3 p3 = fract(vec3(p) * vec3(0.1031, 0.1030, 0.0973));',
  '  p3 += dot(p3, p3.yxz + 33.33);',
  '  return fract((p3.xxy + p3.yzz) * p3.zyx);',
  '}'
].join('\n');

var FIG_VERT = [
  'attribute float aRand;',
  'attribute float aEmber;',
  'attribute float aDepth;',
  'attribute vec3 aNrm;',
  'uniform float uTime;',
  'uniform float uAssemble;',
  'uniform vec2 uPointer;',
  'uniform float uPointerOn;',
  'uniform float uSize;',
  'uniform float uDpr;',
  'uniform vec3 uLight;',
  'varying float vFade;',
  'varying float vEmber;',
  HASH,
  'void main() {',
  '  vec3 home = position;',
  '  vec3 h = hash31(aRand) - 0.5;',
  '  vec3 scattered = home + h * vec3(4.6, 3.4, 3.0);',
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
  '  gl_PointSize = uSize * uDpr * (0.55 + 0.70 * aDepth) * (0.75 + 0.45 * aRand) * (2.6 / -mv.z);',
  /* No albedo anywhere in here. Which way the surface faces is the whole of the
     shading: lambert for the rounding, fresnel for the edge, and the fresnel is
     the louder of the two because a silhouette that burns is what separates a
     volume from a sheet. */
  '  vec3 n = normalize(normalMatrix * aNrm);',
  '  float lam = max(dot(n, normalize(uLight)), 0.0);',
  '  float fres = pow(1.0 - abs(n.z), 2.2);',
  '  float lit = 0.17 + 0.60 * lam + 0.88 * fres;',
  '  vFade = lead * (0.70 + 0.30 * aRand) * lit + push * 0.45;',
  '  vEmber = aEmber;',
  '}'
].join('\n');

var FIG_FRAG = [
  'precision mediump float;',
  'uniform vec3 uChrome;',
  'uniform vec3 uEmber;',
  'varying float vFade;',
  'varying float vEmber;',
  'void main() {',
  '  vec2 c = gl_PointCoord - 0.5;',
  '  float d = dot(c, c);',
  '  if (d > 0.25) discard;',
  '  float a = smoothstep(0.25, 0.01, d) * clamp(vFade, 0.0, 1.8) * 0.95;',
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
   taken is where it sits and which way it faces. */
function trace(packImg, stride, worldH, depthScale, thickness) {
  var w = packImg.naturalWidth, h = packImg.naturalHeight;
  var cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  var ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(packImg, 0, 0);
  var px = ctx.getImageData(0, 0, w, h).data;

  var scale = worldH / h;
  var pos = [], rnd = [], emb = [], dep = [], nrm = [];
  for (var y = 0; y < h; y += stride) {
    for (var x = 0; x < w; x += stride) {
      var i = (y * w + x) * 4;
      if (px[i] === 0 && px[i + 1] === 0 && px[i + 2] === 0) continue;
      var nx = px[i] / 127.5 - 1, ny = px[i + 1] / 127.5 - 1;
      var nz = Math.sqrt(Math.max(0.0001, 1 - nx * nx - ny * ny));
      var dv = px[i + 2] / 255;
      var jx = (Math.random() - 0.5) * stride;
      var jy = (Math.random() - 0.5) * stride;
      /* lifted off the surface along its own normal, so the cloud has thickness
         and the rim does not read as a cut edge */
      var t = (Math.random() - 0.5) * thickness;
      pos.push((x + jx - w / 2) * scale + nx * t,
               -(y + jy - h / 2) * scale + ny * t,
               (dv - 0.5) * depthScale + nz * t);
      rnd.push(Math.random());
      dep.push(dv);
      nrm.push(nx, ny, nz);
      emb.push(Math.random() < 0.04 ? 1 : 0);
    }
  }
  return { pos: pos, rnd: rnd, emb: emb, dep: dep, nrm: nrm, count: rnd.length };
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

/* THE GROUND. The population the reference has under its figures and this band
   did not: a sheet of particles on the floor plane, drifting across the frame
   under two crossing swells, each one drawn as a short trail from where it was
   a beat ago to where it is — so length is velocity, which is the law the
   liquid field on every page already obeys. The drift has a flow speed that
   the scroll pushes, through the same impulse js/main.js gives the field, so
   one gesture moves both objects. Dense where the figures stand, thinning into
   the distance and at the edges; crests are brighter than troughs. */
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

/* Several forms, not one pose. Each instance is its own licensed photograph
   traced the same way — shape and surface direction only, no colour, no face —
   placed in the room at its own depth and turn. x is in world units right of
   the copy column; on a phone the whole group slides left and shrinks so the
   ensemble sits under the words instead of beside them. `delay` staggers the
   assembly so the forms gather one after another rather than all at once. */
var INSTANCES = [
  { src: 'img/team-pack.webp',   x: 1.10, y: 0.16, z: 0.00, s: 1.00, r: 0.00, delay: 0.00 },
  { src: 'img/team-pack-2.webp', x: 0.30, y: 0.06, z: -0.95, s: 0.88, r: 0.30, delay: 0.16 },
  { src: 'img/team-pack-3.webp', x: 1.75, y: 0.02, z: -0.55, s: 0.92, r: -0.28, delay: 0.30 },
  { src: 'img/team-pack-4.webp', x: 0.62, y: -0.02, z: -1.55, s: 0.80, r: 0.12, delay: 0.44 }
];

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
  var packSrc = opts.packSrc || host.getAttribute('data-figure-pack');
  if (!packSrc) return null;

  var canvas = document.createElement('canvas');
  canvas.className = 'fig3d-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  host.insertBefore(canvas, host.firstChild);

  var renderer, scene, camera, waveLines, starPts, groundLines, ensemble;
  var figs = [];   /* { pts, mat, geo, inst } per instance */
  var waveGeo, starGeo, groundGeo, waveMat, starMat, groundMat;
  var raf = 0, alive = true, visible = false, t0 = performance.now(), last = 0;
  var pointerOn = 0, pointerTarget = 0, pxWorld = 0, pyWorld = 0, pxT = 0, pyT = 0, assemble = 0;
  /* the ground's drift: a base speed plus whatever the scroll has pushed into
     it, decaying with the same ~0.36 s half-life the field's yaw impulse uses */
  var flow = 0, flowBoost = 0, FLOW_BASE = 0.11;

  var packs = INSTANCES.slice();
  if (packSrc && packs[0].src !== packSrc) packs[0].src = packSrc;
  Promise.all(packs.map(function (i) { return loadImage(i.src); })).then(build);

  function build(imgs) {
    if (!alive) return;
    var small = Math.min(innerWidth, innerHeight) < 700;
    var traced = [];
    for (var k = 0; k < imgs.length; k++) {
      if (!imgs[k]) continue;   /* a missing pack drops its instance, never the band */
      var fg = trace(imgs[k], small ? 3 : 2, 2.05 * packs[k].s, 1.05 * packs[k].s, small ? 0.05 : 0.06);
      if (fg.count) traced.push({ inst: packs[k], fig: fg });
    }
    if (!traced.length) { cleanup(); return; }
    var total = 0;
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
    traced.forEach(function (tr) {
      var fig = tr.fig, inst = tr.inst;
      var geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(fig.pos, 3));
      geo.setAttribute('aRand', new THREE.Float32BufferAttribute(fig.rnd, 1));
      geo.setAttribute('aEmber', new THREE.Float32BufferAttribute(fig.emb, 1));
      geo.setAttribute('aDepth', new THREE.Float32BufferAttribute(fig.dep, 1));
      geo.setAttribute('aNrm', new THREE.Float32BufferAttribute(fig.nrm, 3));
      var mat = new THREE.ShaderMaterial({
        vertexShader: FIG_VERT, fragmentShader: FIG_FRAG,
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 }, uAssemble: { value: 0 },
          uPointer: { value: new THREE.Vector2(999, 999) }, uPointerOn: { value: 0 },
          /* smaller points on a phone: the additive cloud over-exposes at a
             phone's density, and the pair in front went white */
          uSize: { value: (small ? 1.55 : 2.2) * (0.86 + 0.14 * inst.s) }, uDpr: { value: 1 },
          uLight: { value: new THREE.Vector3(0.42, 0.50, 0.76) },
          uChrome: { value: chrome }, uEmber: { value: ember }
        }
      });
      var pts = new THREE.Points(geo, mat);
      pts.position.set(inst.x, inst.y, inst.z);
      ensemble.add(pts);
      figs.push({ pts: pts, mat: mat, geo: geo, inst: inst });
      total += fig.count;
    });

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

    if (typeof opts.onReady === 'function') opts.onReady(total);
    resize();
    addEventListener('resize', resize);
    host.addEventListener('pointermove', onPointer);
    host.addEventListener('pointerleave', onLeave);
    io.observe(host);
    step(performance.now());
  }

  function resize() {
    if (!renderer) return;
    var w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    var dpr = Math.min(devicePixelRatio || 1, Math.min(innerWidth, innerHeight) < 700 ? 1.25 : 1.6);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    figs.forEach(function (f) { f.mat.uniforms.uDpr.value = dpr; });
    starMat.uniforms.uDpr.value = dpr;
    /* the copy has the left of the stage on a desktop; on a phone the words sit
       above and the whole group comes back to the middle, a little smaller */
    var phone = w < 761;
    ensemble.position.x = phone ? -1.05 : 0;
    ensemble.scale.setScalar(phone ? 0.78 : 1);
    camera.aspect = w / h;
    camera.position.z = 1.32 / Math.tan((camera.fov * Math.PI / 180) / 2);
    camera.updateProjectionMatrix();
    waveMat.uniforms.uSpread.value = Math.max(3.2, 1.32 * camera.aspect * 2 + 1.6);
    groundMat.uniforms.uSpread.value = waveMat.uniforms.uSpread.value;
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

  function step(now) {
    raf = 0;
    if (!alive || !renderer) return;
    var t = (now - t0) / 1000;
    var r = host.getBoundingClientRect();
    var vh = innerHeight || 1;
    /* assembled whenever a real share of the stage is on screen; the stage is
       sticky for the length of the section, so this holds while the words scroll */
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
    groundMat.uniforms.uTime.value = t;
    groundMat.uniforms.uFlow.value = flow;
    groundMat.uniforms.uFlowVel.value = flowVel;
    groundMat.uniforms.uAssemble.value = assemble;
    groundMat.uniforms.uPointerOn.value = pointerOn;

    figs.forEach(function (f, i) {
      var d = f.inst.delay;
      f.mat.uniforms.uTime.value = t;
      f.mat.uniforms.uAssemble.value = Math.max(0, Math.min(1, (assemble - d) / (1 - d)));
      f.mat.uniforms.uPointerOn.value = pointerOn;
      /* the shader works in the instance's own space, so the pointer is moved into it */
      f.mat.uniforms.uPointer.value.set((pxWorld - ensemble.position.x) / ensemble.scale.x - f.inst.x, pyWorld / ensemble.scale.x - f.inst.y);
      f.pts.rotation.y = f.inst.r + Math.sin(t * 0.15 + i * 1.7) * 0.14;
      f.pts.rotation.x = Math.sin(t * 0.10 + i * 0.9) * 0.028;
    });
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
    figs.forEach(function (f) { f.geo.dispose(); f.mat.dispose(); });
    figs.length = 0;
    [waveGeo, starGeo, groundGeo].forEach(function (g) { if (g) g.dispose(); });
    [waveMat, starMat, groundMat].forEach(function (m) { if (m) m.dispose(); });
    if (renderer) {
      renderer.dispose();
      /* <main> is swapped on navigation, so the context has to go with it or a
         handful of visits exhausts the browser's WebGL context budget */
      if (renderer.forceContextLoss) renderer.forceContextLoss();
    }
    renderer = scene = camera = ensemble = waveLines = starPts = groundLines = null;
    waveGeo = starGeo = groundGeo = waveMat = starMat = groundMat = null;
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
  }

  return {
    destroy: cleanup,
    /* the scroll's push, in floor units per second; decays on its own */
    impulse: function (v) { flowBoost = Math.min(1.4, flowBoost + v); }
  };
}
