/* Thornbury Digital v5 — js/figure.js
   A licensed photograph traced into a point cloud and drawn as THREE.Points.

   The classic Codrops / Mamboleoo technique: draw the image into an offscreen
   2D canvas, walk its pixels on a stride, and emit one point for every pixel
   dark enough to be inside the silhouette. Nothing about the photograph is ever
   shown — the file is a lookup table for positions, and the only thing that
   reaches the screen is the points.

   Everything after that is one draw call. The scatter, the drift, the assembly
   and the pointer push all happen in the vertex shader from two attributes and
   four uniforms, so the CPU per frame is a rect read and a uniform write.

   This module is imported dynamically by js/main.js, and only when the band is
   close to the viewport, WebGL exists and motion is wanted. Nothing here is on
   the critical path, and under reduced motion or with effects switched off it is
   never fetched at all. */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.min.js';

var VERT = [
  'attribute float aRand;',
  'attribute float aEmber;',
  'uniform float uTime;',
  'uniform float uAssemble;',
  'uniform vec2 uPointer;',
  'uniform float uPointerOn;',
  'uniform float uSize;',
  'uniform float uDpr;',
  'varying float vFade;',
  'varying float vEmber;',
  /* Dave Hoskins hash: a deterministic scatter, so a point always returns to
     the same place it came from and the assembly is repeatable. */
  'vec3 hash31(float p) {',
  '  vec3 p3 = fract(vec3(p) * vec3(0.1031, 0.1030, 0.0973));',
  '  p3 += dot(p3, p3.yxz + 33.33);',
  '  return fract((p3.xxy + p3.yzz) * p3.zyx);',
  '}',
  'void main() {',
  '  vec3 home = position;',
  '  vec3 h = hash31(aRand) - 0.5;',
  '  vec3 scattered = home + h * vec3(5.2, 4.0, 3.4);',
  '  float a = clamp(uAssemble, 0.0, 1.0);',
  /* points arrive at slightly different times, so the figure gathers rather
     than snapping into place all at once */
  '  float lead = clamp((a - aRand * 0.35) / 0.65, 0.0, 1.0);',
  '  lead = lead * lead * (3.0 - 2.0 * lead);',
  '  vec3 p = mix(scattered, home, lead);',
  /* it never sits perfectly still */
  '  p.x += sin(uTime * 0.55 + aRand * 19.0) * 0.018;',
  '  p.y += cos(uTime * 0.47 + aRand * 23.0) * 0.018;',
  '  p.z += sin(uTime * 0.80 + aRand * 11.0) * 0.055;',
  /* the pointer pushes points aside and they fall back on their own */
  '  vec2 d = p.xy - uPointer;',
  '  float dist = length(d);',
  '  float push = smoothstep(0.34, 0.0, dist) * uPointerOn;',
  '  p.xy += normalize(d + vec2(1e-4)) * push * 0.15;',
  '  p.z += push * 0.10;',
  '  vec4 mv = modelViewMatrix * vec4(p, 1.0);',
  '  gl_Position = projectionMatrix * mv;',
  '  gl_PointSize = uSize * uDpr * (0.55 + 0.75 * aRand) * (2.6 / -mv.z);',
  '  vFade = lead * (0.45 + 0.55 * aRand) + push * 0.5;',
  '  vEmber = aEmber;',
  '}'
].join('\n');

var FRAG = [
  'precision mediump float;',
  'uniform vec3 uChrome;',
  'uniform vec3 uEmber;',
  'varying float vFade;',
  'varying float vEmber;',
  'void main() {',
  '  vec2 c = gl_PointCoord - 0.5;',
  '  float d = dot(c, c);',
  '  if (d > 0.25) discard;',
  /* a soft core rather than a hard disc, so overlapping points pool the way
     the liquid field does instead of stacking into flat plates */
  '  float a = smoothstep(0.25, 0.02, d) * clamp(vFade, 0.0, 1.4) * 1.05;',
  '  vec3 col = mix(uChrome, uEmber, vEmber);',
  '  gl_FragColor = vec4(col * a, a);',
  '}'
].join('\n');

/* Sample the photograph. Returns flat arrays of positions in world units,
   centred on the origin and scaled to `worldH` tall. */
function trace(img, stride, worldH, threshold) {
  var w = img.naturalWidth, h = img.naturalHeight;
  var cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  var ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  var px = ctx.getImageData(0, 0, w, h).data;

  var scale = worldH / h;
  var pos = [], rnd = [], emb = [];
  for (var y = 0; y < h; y += stride) {
    for (var x = 0; x < w; x += stride) {
      var i = (y * w + x) * 4;
      /* the source is greyscale, so one channel is the luminance */
      if (px[i] > threshold) continue;
      /* jitter inside the cell, or the cloud reads as a lattice */
      var jx = (Math.random() - 0.5) * stride;
      var jy = (Math.random() - 0.5) * stride;
      pos.push((x + jx - w / 2) * scale,
               -(y + jy - h / 2) * scale,
               (Math.random() - 0.5) * 0.34);
      rnd.push(Math.random());
      /* the same ember fraction the liquid field carries */
      emb.push(Math.random() < 0.045 ? 1 : 0);
    }
  }
  return { pos: pos, rnd: rnd, emb: emb, count: rnd.length, aspect: w / h };
}

export function mount(host, opts) {
  opts = opts || {};
  var src = opts.src || host.getAttribute('data-figure-src');
  if (!src) return null;

  var canvas = document.createElement('canvas');
  canvas.className = 'fig3d-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  host.insertBefore(canvas, host.firstChild);

  var renderer, scene, camera, points, geo, mat, raf = 0, alive = true;
  var visible = false, t0 = performance.now();
  var pointerOn = 0, pointerTarget = 0, pxWorld = 0, pyWorld = 0;
  var assemble = 0;

  var img = new Image();
  img.decoding = 'async';

  img.onload = function () {
    if (!alive) return;
    var small = Math.min(innerWidth, innerHeight) < 700;
    var data = trace(img, small ? 4 : 3, 2.45, 118);
    if (!data.count) { cleanup(); return; }

    try {
      renderer = new THREE.WebGLRenderer({
        canvas: canvas, alpha: true, antialias: false, powerPreference: 'low-power'
      });
    } catch (e) { cleanup(); return; }
    renderer.setClearColor(0x000000, 0);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(42, 1, 0.1, 40);

    geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(data.pos, 3));
    geo.setAttribute('aRand', new THREE.Float32BufferAttribute(data.rnd, 1));
    geo.setAttribute('aEmber', new THREE.Float32BufferAttribute(data.emb, 1));

    mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uAssemble: { value: 0 },
        uPointer: { value: new THREE.Vector2(999, 999) },
        uPointerOn: { value: 0 },
        uSize: { value: small ? 2.4 : 2.9 },
        uDpr: { value: 1 },
        uChrome: { value: new THREE.Color(0xe1e1e1) },
        uEmber: { value: new THREE.Color(0xff2a00) }
      }
    });

    points = new THREE.Points(geo, mat);
    scene.add(points);

    if (typeof opts.onReady === 'function') opts.onReady(data.count);
    resize();
    addEventListener('resize', resize);
    host.addEventListener('pointermove', onPointer);
    host.addEventListener('pointerleave', onLeave);

    io.observe(host);
    /* one frame immediately, so the band is never an empty hole even if the
       loop is not running yet */
    step(performance.now());
  };
  img.onerror = cleanup;
  img.src = src;

  function resize() {
    if (!renderer) return;
    var w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    var dpr = Math.min(devicePixelRatio || 1, 1.6);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    mat.uniforms.uDpr.value = dpr;
    camera.aspect = w / h;
    /* pull back until the figure's full height fits, with a margin */
    var need = 1.32 / Math.tan((camera.fov * Math.PI / 180) / 2);
    camera.position.z = need;
    camera.updateProjectionMatrix();
  }

  function onPointer(ev) {
    if (!camera) return;
    var r = host.getBoundingClientRect();
    var nx = ((ev.clientX - r.left) / r.width) * 2 - 1;
    var ny = -(((ev.clientY - r.top) / r.height) * 2 - 1);
    /* the plane the figure sits on, at z = 0 */
    var vz = camera.position.z;
    var hh = Math.tan((camera.fov * Math.PI / 180) / 2) * vz;
    pxWorld = nx * hh * camera.aspect;
    pyWorld = ny * hh;
    pointerTarget = 1;
  }
  function onLeave() { pointerTarget = 0; }

  var io = new IntersectionObserver(function (es) {
    visible = es[0].isIntersecting;
    if (visible) run(); else stop();
  }, { threshold: 0 });

  function run() { if (!raf && alive && renderer) { t0 = performance.now(); raf = requestAnimationFrame(step); } }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }

  function step(now) {
    raf = 0;
    if (!alive || !renderer) return;
    var t = (now - t0) / 1000;

    /* assembly is tied to the band's own travel through the viewport: the
       figure gathers as you arrive at it and lets go as you leave */
    var r = host.getBoundingClientRect();
    var vh = innerHeight || 1;
    var off = Math.abs((r.top + r.height * 0.5) - vh * 0.5) / (vh * 0.5 + r.height * 0.5);
    var want = Math.max(0, Math.min(1, (1 - off) * 1.5));
    assemble += (want - assemble) * 0.06;

    pointerOn += (pointerTarget - pointerOn) * 0.09;

    mat.uniforms.uTime.value = t;
    mat.uniforms.uAssemble.value = assemble;
    mat.uniforms.uPointerOn.value = pointerOn;
    mat.uniforms.uPointer.value.set(pxWorld, pyWorld);
    points.rotation.y = Math.sin(t * 0.16) * 0.10;

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
    if (renderer) {
      renderer.dispose();
      /* <main> is swapped on navigation, so the context has to go with it or a
         handful of visits exhausts the browser's WebGL context budget */
      if (renderer.forceContextLoss) renderer.forceContextLoss();
    }
    renderer = scene = camera = points = geo = mat = null;
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
  }

  return { destroy: cleanup };
}
