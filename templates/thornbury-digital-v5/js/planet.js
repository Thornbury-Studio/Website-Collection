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
    small = Math.min(innerWidth, innerHeight) < 700;
    var half = 6 * Math.tan(camera.fov * Math.PI / 360);
    /* the planet stands right of centre on a desktop, under the type on a phone */
    if (small) { group.position.set(0, -half * 0.28, 0); group.scale.setScalar(Math.min(0.72, half * aspect * 0.68)); }
    else { group.position.set(half * aspect * 0.34, 0.02, 0); group.scale.setScalar(1.18); }
  }
  function resize() {
    var r = host.getBoundingClientRect();
    var dpr = Math.min(devicePixelRatio || 1, small ? 1.5 : 1.25);
    renderer.setPixelRatio(dpr);
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
  function onLeave() { nearT = 0; pointerSeen = false; }

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
    threadLines.rotation.x = Math.sin(t * 0.05) * 0.12;

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
               sun: [+sunDir.x.toFixed(3), +sunDir.y.toFixed(3), +sunDir.z.toFixed(3)], pointer: lastPointer, texture: texReady };
    },
    destroy: function () {
      alive = false; stop();
      removeEventListener('resize', resize);
      removeEventListener('pointermove', onPointer);
      document.removeEventListener('pointerleave', onLeave);
      planet.geometry.dispose(); halo.geometry.dispose(); thGeo.dispose();
      planetMat.dispose(); haloMat.dispose(); thMat.dispose();
      renderer.dispose();
      if (renderer.forceContextLoss) renderer.forceContextLoss();
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    }
  };
}
