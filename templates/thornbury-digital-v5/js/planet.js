/* Thornbury Digital v5 — js/planet.js
   The home hero's object: the Earth, as a real sphere, in the site's own
   material.

   THE DATA. Two NASA maps, public domain, credited in IMAGE-CREDITS.md: the
   Blue Marble Next Generation (land, shallow water, topography and
   bathymetry, December) and the Black Marble (the night lights of 2016). At
   build time they are packed into one texture — the day map's luminance in
   red, an ocean mask in green, the night lights in blue — so nothing here
   samples a photograph's colour. The planet is drawn in the site's palette:
   obsidian, chrome, and one ember, which is what the cities burn on the
   night side.

   THE LIGHT. The pointer is the sun. Where it stands, the day is; the
   terminator sweeps across the continents as the cursor moves, the oceans
   throw a chrome highlight toward it, and behind the terminator the night
   side shows its cities in ember. Cursor proximity brings the light in
   closer: the rim burns brighter and the cities glow harder near the
   pointer. Without a pointer the sun drifts on its own.

   THE SPACE. Behind and in front: a nebula far back, stars in three depths
   (the nearest cross in front of the planet), dust past the lens, meteors
   now and then, and a camera that leans with the pointer so each depth
   shifts by its own amount. In the hero the nebula stands in for the field.

   THE THREADS. Strands on orbits around the planet, in the same chrome and
   the same scarce ember as the liquid field behind it, each with a head of
   light travelling along it — the field's law that brightness is velocity —
   and depth-tested against the sphere, so they wrap: they pass behind the
   planet and come out the other side, rather than sitting next to it.

   ONE CANVAS FOR THE SESSION, fixed over the hero's place, started once at
   idle after first load; pages that are not Home fade it out and it stops
   drawing, and a return to Home restarts it — with its pointer listeners on
   the window, not on any element the router swaps. That is the exact way
   the last pointer feature on this site died, and the reason this one is
   built this way. Reduced motion and the effects switch: never mounted. */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.min.js';

var PLANET_VERT = [
  'varying vec3 vN;',
  'varying vec3 vW;',
  'varying vec2 vUv;',
  'void main() {',
  '  vN = normalize(mat3(modelMatrix) * normal);',
  '  vec4 w = modelMatrix * vec4(position, 1.0);',
  '  vW = w.xyz;',
  '  vUv = uv;',
  '  gl_Position = projectionMatrix * viewMatrix * w;',
  '}'
].join('\n');

var PLANET_FRAG = [
  'precision highp float;',
  'uniform sampler2D uTex;',
  'uniform vec3 uSun;',
  'uniform vec3 uEye;',
  'uniform vec3 uChrome;',
  'uniform vec3 uEmber;',
  'uniform float uNear;',
  'uniform float uFade;',
  'uniform float uTime;',
  'varying vec3 vN;',
  'varying vec3 vW;',
  'varying vec2 vUv;',
  'void main() {',
  '  vec3 t = texture2D(uTex, vUv).rgb;',
  '  float day = t.r, ocean = t.g, city = t.b;',
  '  vec3 n = normalize(vN);',
  '  vec3 v = normalize(uEye - vW);',
  '  vec3 s = normalize(uSun);',
  '  float ndl = dot(n, s);',
  '  float lam = max(ndl, 0.0);',
  /* the day: the map's own relief under one key, brighter and harder on the
     ocean, which is chrome here */
  '  vec3 h = normalize(s + v);',
  '  float spec = pow(max(dot(n, h), 0.0), mix(18.0, 160.0, ocean)) * mix(0.10, 0.62, ocean);',
  '  vec3 base = mix(vec3(0.16, 0.16, 0.17), vec3(0.62, 0.63, 0.66), day) * mix(1.0, 0.55, ocean);',
  '  vec3 col = base * (0.035 + 0.96 * lam) + uChrome * spec * lam;',
  /* the terminator: a soft band, warmed by the one accent */
  '  float term = exp(-pow(ndl * 5.0, 2.0));',
  '  col += uEmber * term * 0.10 * (0.5 + 0.5 * uNear);',
  /* the night: the cities, in ember, and only where the sun is not */
  '  float nightMask = smoothstep(0.12, -0.08, ndl);',
  '  float lights = pow(city, 1.15) * nightMask;',
  '  col += uEmber * lights * (1.25 + 0.9 * uNear);',
  '  col += vec3(1.0, 0.55, 0.3) * pow(city, 3.0) * nightMask * 0.5;',
  /* the rim: chrome fresnel, stronger toward the sun and toward the pointer */
  '  float fres = pow(1.0 - max(dot(n, v), 0.0), 3.2);',
  '  col += uChrome * fres * (0.22 + 0.55 * smoothstep(-0.4, 0.5, ndl)) * (0.7 + 0.5 * uNear);',
  '  gl_FragColor = vec4(col * uFade, uFade);',
  '}'
].join('\n');

/* the halo: a slightly larger sphere, back faces only, that fades in toward
   its own edge — the thin bright atmosphere line the eye expects */
var HALO_VERT = [
  'varying vec3 vN;',
  'varying vec3 vW;',
  'void main() {',
  '  vN = normalize(mat3(modelMatrix) * normal);',
  '  vec4 w = modelMatrix * vec4(position, 1.0);',
  '  vW = w.xyz;',
  '  gl_Position = projectionMatrix * viewMatrix * w;',
  '}'
].join('\n');
var HALO_FRAG = [
  'precision mediump float;',
  'uniform vec3 uSun;',
  'uniform vec3 uEye;',
  'uniform vec3 uChrome;',
  'uniform vec3 uEmber;',
  'uniform float uNear;',
  'uniform float uFade;',
  'varying vec3 vN;',
  'varying vec3 vW;',
  'void main() {',
  '  vec3 n = normalize(vN);',
  '  vec3 v = normalize(uEye - vW);',
  '  float edge = pow(max(dot(n, v), 0.0), 2.6);',
  '  float lit = 0.35 + 0.65 * smoothstep(-0.6, 0.6, dot(n, normalize(uSun)));',
  '  vec3 c = mix(uEmber, uChrome, smoothstep(-0.2, 0.5, dot(n, normalize(uSun))));',
  '  float a = edge * lit * (0.28 + 0.22 * uNear) * uFade;',
  '  gl_FragColor = vec4(c * a, a);',
  '}'
].join('\n');

/* the orbital threads: a head of light runs along each, the way length is
   velocity in the field; the planet occludes them through the depth test */
var THREAD_VERT = [
  'attribute float aSeq;',
  'attribute float aRand;',
  'attribute float aEmber;',
  'uniform float uTime;',
  'uniform float uFade;',
  'uniform float uNear;',
  'varying float vFade;',
  'varying float vEmber;',
  'void main() {',
  '  vec3 p = position;',
  '  p *= 1.0 + sin(uTime * 0.6 + aRand * 12.0 + aSeq * 6.2832) * 0.012;',
  '  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);',
  '  float head = fract(aSeq - uTime * (0.045 + 0.05 * aRand) - aRand);',
  '  float glow = smoothstep(0.22, 0.0, head);',
  '  vFade = (0.022 + 0.978 * glow) * (0.55 + 0.45 * aRand) * uFade * (0.85 + 0.35 * uNear);',
  '  vEmber = aEmber;',
  '}'
].join('\n');
var THREAD_FRAG = [
  'precision mediump float;',
  'uniform vec3 uChrome;',
  'uniform vec3 uEmber;',
  'varying float vFade;',
  'varying float vEmber;',
  'void main() {',
  '  float a = clamp(vFade, 0.0, 1.0);',
  '  gl_FragColor = vec4(mix(uChrome, uEmber, vEmber) * a, a);',
  '}'
].join('\n');

/* THE SPACE. What you see in space, in the site's palette, and in depth:
   a nebula of haze far behind with ember filaments in it; stars in three
   depths, some of them nearer the camera than the planet so they cross in
   front of it; dust drifting past the lens; and now and then a meteor. The
   camera itself leans with the pointer, so every depth shifts by a different
   amount — that parallax is what makes the space read as space rather than
   as a picture behind a ball. In the hero the nebula is opaque and stands in
   for the liquid field; it fades with the hero, and the field is there
   underneath as it always was. */
var NEBULA_VERT = [
  'varying vec2 vUv;',
  'void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }'
].join('\n');
var NEBULA_FRAG = [
  'precision mediump float;',
  'uniform float uTime;',
  'uniform float uFade;',
  'uniform vec2 uPar;',
  'uniform float uAspect;',
  'uniform vec3 uEmber;',
  'varying vec2 vUv;',
  'float h2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
  'float n2(vec2 x) { vec2 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);',
  '  return mix(mix(h2(i), h2(i + vec2(1, 0)), f.x), mix(h2(i + vec2(0, 1)), h2(i + vec2(1, 1)), f.x), f.y); }',
  'float fbm(vec2 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 3; i++) { s += a * n2(p); p = p * 2.02 + vec2(3.1, 1.7); a *= 0.5; } return s; }',
  'void main() {',
  '  vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0) * 2.2 + uPar * 0.06;',
  '  float t = uTime * 0.012;',
  '  float n1 = fbm(p * 1.1 + vec2(t, -t * 0.6));',
  '  float n2v = fbm(p * 2.4 - vec2(t * 0.7, t * 0.4) + 5.3);',
  '  float haze = smoothstep(0.38, 0.85, n1) * 0.13;',
  '  float veins = pow(smoothstep(0.60, 0.76, n2v), 2.4) * smoothstep(0.45, 0.72, n1);',
  '  vec3 col = vec3(0.022, 0.022, 0.024) + vec3(0.55, 0.57, 0.62) * haze + uEmber * veins * 0.11;',
  /* the room falls off toward its edges, so the type's corner stays dark */
  '  float vig = 1.0 - smoothstep(0.55, 1.35, length((vUv - 0.5) * vec2(uAspect * 0.8, 1.15)));',
  '  col *= 0.55 + 0.45 * vig;',
  '  gl_FragColor = vec4(col * uFade, uFade);',
  '}'
].join('\n');

var STAR_VERT = [
  'attribute float aSize;',
  'attribute float aRand;',
  'attribute float aEmber;',
  'uniform float uTime;',
  'uniform float uFade;',
  'uniform float uDpr;',
  'varying float vFade;',
  'varying float vEmber;',
  'void main() {',
  '  vec4 mv = modelViewMatrix * vec4(position, 1.0);',
  '  gl_Position = projectionMatrix * mv;',
  '  gl_PointSize = aSize * uDpr;',
  '  float tw = 0.72 + 0.28 * sin(uTime * (0.6 + aRand * 1.4) + aRand * 40.0);',
  '  vFade = tw * (0.45 + 0.55 * aRand) * uFade;',
  '  vEmber = aEmber;',
  '}'
].join('\n');
var STAR_FRAG = [
  'precision mediump float;',
  'uniform vec3 uChrome;',
  'uniform vec3 uEmber;',
  'varying float vFade;',
  'varying float vEmber;',
  'void main() {',
  '  vec2 c = gl_PointCoord - 0.5;',
  '  float d = dot(c, c);',
  '  if (d > 0.25) discard;',
  '  float a = (smoothstep(0.25, 0.0, d) * 0.55 + smoothstep(0.06, 0.0, d)) * clamp(vFade, 0.0, 1.0);',
  '  gl_FragColor = vec4(mix(uChrome, uEmber, vEmber) * a, a);',
  '}'
].join('\n');

/* dust: large, soft, slow, close to the lens */
var DUST_VERT = [
  'attribute float aSize;',
  'attribute float aRand;',
  'uniform float uTime;',
  'uniform float uFade;',
  'uniform float uDpr;',
  'varying float vFade;',
  'void main() {',
  '  vec3 p = position;',
  '  p.x += sin(uTime * 0.05 + aRand * 9.0) * 0.4 + uTime * 0.012 * (0.5 + aRand);',
  '  p.y += cos(uTime * 0.04 + aRand * 7.0) * 0.3;',
  '  p.x = mod(p.x + 6.0, 12.0) - 6.0;',
  '  vec4 mv = modelViewMatrix * vec4(p, 1.0);',
  '  gl_Position = projectionMatrix * mv;',
  '  gl_PointSize = aSize * uDpr * clamp(8.0 / -mv.z, 0.5, 4.0);',
  '  vFade = (0.025 + 0.035 * aRand) * uFade;',
  '}'
].join('\n');
var DUST_FRAG = [
  'precision mediump float;',
  'uniform vec3 uChrome;',
  'varying float vFade;',
  'void main() {',
  '  vec2 c = gl_PointCoord - 0.5;',
  '  float d = dot(c, c);',
  '  if (d > 0.25) discard;',
  '  float a = pow(smoothstep(0.25, 0.0, d), 1.6) * vFade;',
  '  gl_FragColor = vec4(uChrome * a, a);',
  '}'
].join('\n');

/* meteors: a pool of streaks; each has a start, a direction, a launch time
   and a speed, and the shader places its head and tail from the clock */
var METEOR_VERT = [
  'attribute vec3 aStart;',
  'attribute vec3 aDir;',
  'attribute float aLaunch;',
  'attribute float aSpeed;',
  'attribute float aEnd;',
  'uniform float uTime;',
  'uniform float uFade;',
  'varying float vFade;',
  'void main() {',
  '  float age = uTime - aLaunch;',
  '  float life = 1.4;',
  '  float u = clamp(age / life, 0.0, 1.0);',
  '  vec3 head = aStart + aDir * age * aSpeed;',
  '  float far = (6.0 - aStart.z) / 6.0;',
  '  vec3 p = head - aDir * (0.8 + 0.5 * u) * far * aEnd;',
  '  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);',
  '  float alive = step(0.0, age) * step(age, life);',
  '  float env = sin(u * 3.14159);',
  '  vFade = alive * env * (1.0 - 0.85 * aEnd) * uFade;',
  '}'
].join('\n');
var METEOR_FRAG = [
  'precision mediump float;',
  'uniform vec3 uChrome;',
  'varying float vFade;',
  'void main() { float a = clamp(vFade, 0.0, 1.0); gl_FragColor = vec4(uChrome * a, a); }'
].join('\n');

function hash(n) { var v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); }

/* strands on inclined, slightly wobbling orbits, as line-segment pairs */
function threads(count, per, seed) {
  var pos = [], seq = [], rnd = [], emb = [];
  for (var k = 0; k < count; k++) {
    var r0 = 1.16 + hash(seed + k) * 0.85;
    var inc = (hash(seed + k + 51) - 0.5) * Math.PI;
    var node = hash(seed + k + 97) * Math.PI * 2;
    var ph = hash(seed + k + 131) * Math.PI * 2;
    var rand = hash(seed + k + 173);
    var e = hash(seed + k + 211) < 0.06 ? 1 : 0;
    var ci = Math.cos(inc), si = Math.sin(inc), cn = Math.cos(node), sn = Math.sin(node);
    var prev = null;
    for (var j = 0; j <= per; j++) {
      var th = (j / per) * Math.PI * 2 + ph;
      var r = r0 * (1 + 0.045 * Math.sin(3 * th + ph) + 0.025 * Math.sin(7 * th - ph * 2));
      var x = r * Math.cos(th), y = r * Math.sin(th), z = 0;
      /* incline, then turn the node */
      var y2 = y * ci - z * si, z2 = y * si + z * ci;
      var x3 = x * cn - y2 * sn, y3 = x * sn + y2 * cn;
      var cur = [x3, y3, z2];
      if (prev) {
        pos.push(prev[0], prev[1], prev[2], cur[0], cur[1], cur[2]);
        var t0 = (j - 1) / per, t1 = j / per;
        seq.push(t0, t1);
        rnd.push(rand, rand);
        emb.push(e, e);
      }
      prev = cur;
    }
  }
  return { pos: pos, seq: seq, rnd: rnd, emb: emb };
}

function loadTexture(src) {
  return new Promise(function (res, rej) {
    new THREE.TextureLoader().load(src, res, undefined, rej);
  });
}

export function mount(host, opts) {
  opts = opts || {};
  var small = Math.min(innerWidth, innerHeight) < 700;
  var canvas = document.createElement('canvas');
  canvas.className = 'hero-gl';
  canvas.setAttribute('aria-hidden', 'true');
  host.appendChild(canvas);

  var renderer;
  try {
    /* no multisampling: the halo is the edge, and MSAA at this size was a third of the frame */
    renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: false, powerPreference: 'high-performance' });
  } catch (e) { canvas.remove(); return null; }
  renderer.setClearColor(0x000000, 0);
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(36, 1, 0.1, 60);
  camera.position.set(0, 0, 6);

  var chrome = new THREE.Color(0xe1e1e1), ember = new THREE.Color(0xff2a00);
  var group = new THREE.Group();
  scene.add(group);
  var sunDir = new THREE.Vector3(-0.55, 0.35, 0.75).normalize();
  var sunTarget = sunDir.clone();
  var near = 0, nearT = 0, pointerAt = 0, pointerSeen = false, lastPointer = null;

  var planetMat = new THREE.ShaderMaterial({
    vertexShader: PLANET_VERT, fragmentShader: PLANET_FRAG,
    transparent: true,
    uniforms: {
      uTex: { value: null }, uSun: { value: sunDir.clone() }, uEye: { value: camera.position.clone() },
      uChrome: { value: chrome }, uEmber: { value: ember }, uNear: { value: 0 }, uFade: { value: 0 }, uTime: { value: 0 }
    }
  });
  var planet = new THREE.Mesh(new THREE.SphereGeometry(1, small ? 72 : 112, small ? 48 : 72), planetMat);
  planet.rotation.z = 23.4 * Math.PI / 180;
  group.add(planet);

  var haloMat = new THREE.ShaderMaterial({
    vertexShader: HALO_VERT, fragmentShader: HALO_FRAG,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide,
    uniforms: { uSun: { value: sunDir.clone() }, uEye: { value: camera.position.clone() }, uChrome: { value: chrome }, uEmber: { value: ember }, uNear: { value: 0 }, uFade: { value: 0 } }
  });
  var halo = new THREE.Mesh(new THREE.SphereGeometry(1.045, 64, 40), haloMat);
  group.add(halo);

  var th = threads(small ? 48 : 84, 120, 11);
  var thGeo = new THREE.BufferGeometry();
  thGeo.setAttribute('position', new THREE.Float32BufferAttribute(th.pos, 3));
  thGeo.setAttribute('aSeq', new THREE.Float32BufferAttribute(th.seq, 1));
  thGeo.setAttribute('aRand', new THREE.Float32BufferAttribute(th.rnd, 1));
  thGeo.setAttribute('aEmber', new THREE.Float32BufferAttribute(th.emb, 1));
  var thMat = new THREE.ShaderMaterial({
    vertexShader: THREAD_VERT, fragmentShader: THREAD_FRAG,
    transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uFade: { value: 0 }, uNear: { value: 0 }, uChrome: { value: chrome }, uEmber: { value: ember } }
  });
  var threadLines = new THREE.LineSegments(thGeo, thMat);
  group.add(threadLines);

  /* ---- the space ---- */
  var space = new THREE.Group();
  scene.add(space);
  var NEB_Z = -30;
  /* baked once: three octaves of noise per pixel per frame was a third of the
     frame, for a cloud that moves slower than the eye can tell */
  var nebBakeMat = new THREE.ShaderMaterial({
    vertexShader: NEBULA_VERT, fragmentShader: NEBULA_FRAG, depthWrite: false, depthTest: false,
    uniforms: { uTime: { value: 0 }, uFade: { value: 1 }, uPar: { value: new THREE.Vector2() }, uAspect: { value: 1.8 }, uEmber: { value: ember } }
  });
  var nebRT = new THREE.WebGLRenderTarget(small ? 512 : 1024, small ? 288 : 576, { depthBuffer: false, stencilBuffer: false });
  var nebScene = new THREE.Scene();
  var nebCam = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0, 1);
  nebScene.add(new THREE.Mesh(new THREE.PlaneGeometry(1, 1), nebBakeMat));
  function bakeNebula() {
    renderer.setRenderTarget(nebRT);
    renderer.render(nebScene, nebCam);
    renderer.setRenderTarget(null);
  }
  var nebMat = new THREE.ShaderMaterial({
    vertexShader: NEBULA_VERT,
    fragmentShader: [
      'precision mediump float;',
      'uniform sampler2D uMap;',
      'uniform float uFade;',
      'uniform float uTime;',
      'uniform vec2 uPar;',
      'varying vec2 vUv;',
      'void main() {',
      '  vec2 uv = (vUv - 0.5) * 0.86 + 0.5 + uPar * 0.012 + vec2(uTime * 0.0008, -uTime * 0.0005);',
      '  vec3 c = texture2D(uMap, uv).rgb;',
      '  gl_FragColor = vec4(c * uFade, uFade);',
      '}'
    ].join(String.fromCharCode(10)),
    transparent: true, depthWrite: false, depthTest: false,
    uniforms: { uMap: { value: nebRT.texture }, uFade: { value: 0 }, uTime: { value: 0 }, uPar: { value: new THREE.Vector2() } }
  });
  var nebula = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), nebMat);
  nebula.position.z = NEB_Z;
  nebula.renderOrder = -3;
  space.add(nebula);

  function starField(n, zMin, zMax, spread, sizeMin, sizeMax, seed) {
    var pos = [], size = [], rnd = [], emb = [];
    for (var i = 0; i < n; i++) {
      var z = zMin + hash(seed + i * 3.1) * (zMax - zMin);
      /* the frustum's half-width at this depth (fov 36, aspect up to 1.9), with margin for the lean */
      var s = (6 - z) * 0.325 * spread;
      pos.push((hash(seed + i * 1.7) - 0.5) * s * 2 * 1.9, (hash(seed + i * 2.3) - 0.5) * s * 2 * 1.15, z);
      size.push(sizeMin + hash(seed + i * 4.1) * (sizeMax - sizeMin));
      rnd.push(hash(seed + i * 5.3));
      emb.push(hash(seed + i * 6.7) < 0.03 ? 1 : 0);
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aSize', new THREE.Float32BufferAttribute(size, 1));
    g.setAttribute('aRand', new THREE.Float32BufferAttribute(rnd, 1));
    g.setAttribute('aEmber', new THREE.Float32BufferAttribute(emb, 1));
    return g;
  }
  var starMat = new THREE.ShaderMaterial({
    vertexShader: STAR_VERT, fragmentShader: STAR_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uFade: { value: 0 }, uDpr: { value: 1 }, uChrome: { value: chrome }, uEmber: { value: ember } }
  });
  var farStars = new THREE.Points(starField(small ? 1100 : 3000, -26, -8, 1.15, 1.2, 3.2, 7), starMat);
  farStars.renderOrder = -2;
  var midStars = new THREE.Points(starField(small ? 260 : 600, -7, -1.6, 1.15, 1.4, 3.6, 19), starMat);
  midStars.renderOrder = -1;
  /* nearer than the planet: these cross in front of it */
  var nearStars = new THREE.Points(starField(small ? 40 : 90, 1.2, 4.2, 1.1, 1.6, 3.4, 31), starMat);
  nearStars.renderOrder = 3;
  space.add(farStars); space.add(midStars); space.add(nearStars);

  var dustMat = new THREE.ShaderMaterial({
    vertexShader: DUST_VERT, fragmentShader: DUST_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uFade: { value: 0 }, uDpr: { value: 1 }, uChrome: { value: chrome } }
  });
  var dust = new THREE.Points(starField(small ? 18 : 36, 2.0, 4.6, 1.2, 10, 34, 43), dustMat);
  dust.renderOrder = 4;
  space.add(dust);

  var METEORS = 7;
  var mGeo = new THREE.BufferGeometry();
  var mStart = new Float32Array(METEORS * 2 * 3), mDir = new Float32Array(METEORS * 2 * 3), mLaunch = new Float32Array(METEORS * 2), mSpeed = new Float32Array(METEORS * 2), mEnd = new Float32Array(METEORS * 2);
  for (var mi = 0; mi < METEORS * 2; mi++) { mEnd[mi] = mi % 2; mLaunch[mi] = -100; }
  mGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(METEORS * 2 * 3), 3));
  mGeo.setAttribute('aStart', new THREE.BufferAttribute(mStart, 3).setUsage(THREE.DynamicDrawUsage));
  mGeo.setAttribute('aDir', new THREE.BufferAttribute(mDir, 3).setUsage(THREE.DynamicDrawUsage));
  mGeo.setAttribute('aLaunch', new THREE.BufferAttribute(mLaunch, 1).setUsage(THREE.DynamicDrawUsage));
  mGeo.setAttribute('aSpeed', new THREE.BufferAttribute(mSpeed, 1).setUsage(THREE.DynamicDrawUsage));
  mGeo.setAttribute('aEnd', new THREE.BufferAttribute(mEnd, 1));
  mGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 60);
  var meteorMat = new THREE.ShaderMaterial({
    vertexShader: METEOR_VERT, fragmentShader: METEOR_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uFade: { value: 0 }, uChrome: { value: chrome } }
  });
  var meteors = new THREE.LineSegments(mGeo, meteorMat);
  meteors.frustumCulled = false;
  meteors.renderOrder = 5;
  space.add(meteors);
  var nextMeteor = 1.2, meteorSlot = 0, meteorsLaunched = 0, lastLaunch = -1;
  function launchMeteor(t) {
    var i = meteorSlot; meteorSlot = (meteorSlot + 1) % METEORS;
    var front = Math.random() < 0.35;
    var z = front ? 1.5 + Math.random() * 2.5 : -14 + Math.random() * 10;
    var s = (6 - z) / 6;
    var sx = (Math.random() - 0.5) * 2 * 0.55 * s * 1.9, sy = (0.15 + Math.random() * 0.45) * s * 2.3;
    var ang = -0.9 + (Math.random() - 0.5) * 0.9;
    var dx = Math.cos(ang), dy = Math.sin(ang);
    var speed = (front ? 2.4 : 1.9) * (0.8 + Math.random() * 0.6) * s;
    for (var k = 0; k < 2; k++) {
      var j = i * 2 + k;
      mStart[j * 3] = sx; mStart[j * 3 + 1] = sy; mStart[j * 3 + 2] = z;
      mDir[j * 3] = dx; mDir[j * 3 + 1] = dy; mDir[j * 3 + 2] = 0;
      mLaunch[j] = t; mSpeed[j] = speed;
    }
    mGeo.attributes.aStart.needsUpdate = mGeo.attributes.aDir.needsUpdate = mGeo.attributes.aLaunch.needsUpdate = mGeo.attributes.aSpeed.needsUpdate = true;
    nextMeteor = t + 1.6 + Math.random() * 3.6;
    meteorsLaunched++; lastLaunch = t;
  }
  var par = new THREE.Vector2(), parT = new THREE.Vector2();

  var texReady = false;
  loadTexture(opts.texture || ('img/earth-pack' + (small ? '-sm' : '') + '.webp')).then(function (tex) {
    tex.colorSpace = THREE.NoColorSpace;
    tex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    planetMat.uniforms.uTex.value = tex;
    texReady = true;
    if (on) run();
  }).catch(function () { /* the sphere stays unlit; nothing else is affected */ });

  var alive = true, raf = 0, on = false, t0 = performance.now(), last = 0, frames = 0;
  var fade = 0, w = 0, h = 0;

  function place() {
    var aspect = w / h;
    /* the nebula fills the frustum at its own depth, with margin for the lean */
    var nh = 2 * (6 - NEB_Z) * Math.tan(camera.fov * Math.PI / 360) * 1.25;
    nebula.scale.set(nh * aspect, nh, 1);
    small = Math.min(innerWidth, innerHeight) < 700;
    var half = 6 * Math.tan(camera.fov * Math.PI / 360);
    /* the planet stands right of centre on a desktop, under the type on a phone */
    if (small) { group.position.set(0, -half * 0.28, 0); group.scale.setScalar(Math.min(0.72, half * aspect * 0.68)); }
    else { group.position.set(half * aspect * 0.34, 0.02, 0); group.scale.setScalar(1.18); }
  }
  function resize() {
    var r = host.getBoundingClientRect();
    var dpr = Math.min(devicePixelRatio || 1, small ? 1.0 : 1.25);
    renderer.setPixelRatio(dpr);
    starMat.uniforms.uDpr.value = dpr; dustMat.uniforms.uDpr.value = dpr;
    w = Math.max(1, r.width); h = Math.max(1, r.height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    place();
  }

  /* the pointer is the sun: its place on the stage becomes a direction on the
     hemisphere facing the camera; its distance from the planet is how close
     the light is */
  function onPointer(ev) {
    if (!on) return;
    var r = host.getBoundingClientRect();
    if (ev.clientY > r.bottom || ev.clientY < r.top) { nearT = 0; return; }
    var nx = ((ev.clientX - r.left) / r.width) * 2 - 1;
    var ny = -(((ev.clientY - r.top) / r.height) * 2 - 1);
    sunTarget.set(nx * 1.5, ny * 1.1, 0.7).normalize();
    parT.set(nx, ny);
    /* where the planet sits on the stage, in the same units */
    var half = 6 * Math.tan(camera.fov * Math.PI / 360);
    var px = group.position.x / (half * camera.aspect), py = group.position.y / half;
    var dx = nx - px, dy = ny - py;
    var d = Math.sqrt(dx * dx + dy * dy);
    nearT = 1 - Math.min(1, Math.max(0, (d - 0.28) / 0.75));
    pointerSeen = true;
    pointerAt = performance.now();
    lastPointer = [nx, ny];
  }
  function onLeave() { nearT = 0; pointerSeen = false; parT.set(0, 0); }

  function run() { if (!raf && alive) { last = 0; raf = requestAnimationFrame(frame); } }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }

  function frame(now) {
    raf = 0;
    if (!alive) return;
    var t = (now - t0) / 1000;
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now;
    var H = host.clientHeight || 1;
    var gone = Math.max(0, Math.min(1, scrollY / (H * 0.8)));
    var wantFade = (on && !opts.paused && texReady) ? (1 - gone) : 0;
    fade += (wantFade - fade) * Math.min(1, dt * 2.2);
    /* without a pointer the sun drifts on its own */
    if (!pointerSeen || now - pointerAt > 6000) {
      sunTarget.set(-0.6 + Math.sin(t * 0.07) * 0.5, 0.3 + Math.cos(t * 0.05) * 0.2, 0.75).normalize();
      nearT = 0;
    }
    sunDir.lerp(sunTarget, Math.min(1, dt * 2.6)).normalize();
    near += (nearT - near) * Math.min(1, dt * 3.0);

    planet.rotation.y += dt * 0.045;
    threadLines.rotation.y += dt * 0.02;
    /* the lean: every depth shifts by its own amount, which is the parallax */
    par.lerp(parT, Math.min(1, dt * 2.0));
    camera.position.x = par.x * 0.32;
    camera.position.y = par.y * 0.18;
    camera.lookAt(0, 0, 0);
    space.rotation.z = Math.sin(t * 0.02) * 0.03;
    farStars.rotation.z += dt * 0.0025;
    if (t > nextMeteor && fade > 0.5) launchMeteor(t);
    nebMat.uniforms.uTime.value = t; nebMat.uniforms.uFade.value = fade; nebMat.uniforms.uPar.value.copy(par);
    starMat.uniforms.uTime.value = t; starMat.uniforms.uFade.value = fade;
    dustMat.uniforms.uTime.value = t; dustMat.uniforms.uFade.value = fade;
    meteorMat.uniforms.uTime.value = t; meteorMat.uniforms.uFade.value = fade;
    threadLines.rotation.x = Math.sin(t * 0.05) * 0.12;

    planetMat.uniforms.uEye.value.copy(camera.position);
    haloMat.uniforms.uEye.value.copy(camera.position);
    planetMat.uniforms.uSun.value.copy(sunDir);
    planetMat.uniforms.uNear.value = near;
    planetMat.uniforms.uFade.value = fade;
    planetMat.uniforms.uTime.value = t;
    haloMat.uniforms.uSun.value.copy(sunDir);
    haloMat.uniforms.uNear.value = near;
    haloMat.uniforms.uFade.value = fade;
    thMat.uniforms.uTime.value = t;
    thMat.uniforms.uFade.value = fade;
    thMat.uniforms.uNear.value = near;

    renderer.render(scene, camera);
    frames++;
    var idle = (!on || opts.paused || gone >= 1) && fade < 0.01;
    if (!idle) raf = requestAnimationFrame(frame);
  }

  resize();
  bakeNebula();
  addEventListener('resize', resize);
  addEventListener('pointermove', onPointer, { passive: true });
  document.addEventListener('pointerleave', onLeave);
  addEventListener('scroll', function () { if (on && !opts.paused && scrollY < (host.clientHeight || 1)) run(); }, { passive: true });

  return {
    /* the page says whether it is the home page: the planet stands only there */
    page: function (home) {
      on = !!home;
      host.classList.toggle('is-on', on);
      if (on) opts.paused = false;
      run();   /* on: draw; off: draw until faded out, then stop on its own */
    },
    /* the router: hold while a page leaves; the last frame stands under the fade */
    pause: function (p) { opts.paused = !!p; if (p) stop(); else if (on) run(); },
    /* for the verification harness and the phone probe: is it alive, and does it feel the pointer */
    state: function () {
      return { on: on, paused: !!opts.paused, drawing: !!raf, frames: frames, fade: +fade.toFixed(3), near: +near.toFixed(3),
               sun: [+sunDir.x.toFixed(3), +sunDir.y.toFixed(3), +sunDir.z.toFixed(3)], pointer: lastPointer, texture: texReady,
               meteors: meteorsLaunched, lastMeteorAge: lastLaunch < 0 ? null : +(((performance.now() - t0) / 1000) - lastLaunch).toFixed(2) };
    },
    destroy: function () {
      alive = false; stop();
      removeEventListener('resize', resize);
      removeEventListener('pointermove', onPointer);
      document.removeEventListener('pointerleave', onLeave);
      planet.geometry.dispose(); halo.geometry.dispose(); thGeo.dispose();
      planetMat.dispose(); haloMat.dispose(); thMat.dispose();
      [farStars, midStars, nearStars, dust].forEach(function (o) { o.geometry.dispose(); });
      nebula.geometry.dispose(); mGeo.dispose(); nebMat.dispose(); nebBakeMat.dispose(); nebRT.dispose(); starMat.dispose(); dustMat.dispose(); meteorMat.dispose();
      renderer.dispose();
      if (renderer.forceContextLoss) renderer.forceContextLoss();
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    }
  };
}
