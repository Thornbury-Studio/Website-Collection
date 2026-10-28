/* The stage: one photograph, rebuilt as a small 3D scene.
   Three layers share a single registration, so at rest they sit exactly where they did in the photograph:
     backdrop  the room with the sitter painted out, graded to the house oxblood, far back
     wordmark  the house name, drawn from the page's own Bodoni, between the room and the sitter
     sitter    the cutout, displaced by a monocular depth map (Depth Anything V2 Small), so it has real relief
   Nothing here is hand-modelled geometry: the only mesh is a flat plane; every bit of form comes from the depth map.
   The camera is a pure function of scroll position, the pointer and time. See DESIGN.md and LICENSES.md. */
import * as THREE from '../vendor/three.module.min.js';
import { state } from './state.js';

const root = document.documentElement;
const canvas = document.getElementById('gl');

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, k) => a + (b - a) * k;
const sstep = t => t * t * (3 - 2 * t);

let renderer = null;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: !state.coarse, alpha: true, powerPreference: 'high-performance' });
} catch (e) { renderer = null; }
if (!renderer) { state.gl = false; root.classList.add('no-gl'); } else { boot(); }

function boot() {
  const PW = 899 / 1599;              // photograph aspect
  const PLW = 2 * PW, PLH = 2;        // plate size in world units
  const FOV = 30;
  const D = 1 / Math.tan(THREE.MathUtils.degToRad(FOV / 2));   // distance at which the plate exactly fits the viewport height
  const RELIEF = 0.34;                // world units between the farthest and nearest part of the sitter
  const Z_BACK = 0.6, TILT_BACK = 0.3; // backdrop sits behind the sitter, its top edge further still
  const Z_WORD = 0.2;

  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;   // shaders below grade in display space and write it straight out
  renderer.setClearColor(0x000000, 0);
  const MAXDPR = state.coarse ? 1.5 : 2;
  let W = 1, H = 1, mobile = false;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 30);

  /* ---------------------------------------------------------------- textures */
  const loader = new THREE.TextureLoader();
  const load = (src, mip) => new Promise((ok, no) => loader.load(src, t => {
    t.colorSpace = THREE.NoColorSpace;
    t.generateMipmaps = !!mip;
    t.minFilter = mip ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.anisotropy = 4;
    ok(t);
  }, undefined, no));

  /* ------------------------------------------------------------- shared uniforms */
  const U = {
    uD: { value: D },
    uFade: { value: 1 },
    uSpot: { value: new THREE.Vector3(0, 0, 9) },
    uSpotK: { value: 0 },
    uTime: { value: 0 },
    uLight: { value: new THREE.Vector3(0.2, 0.4, 0.9) },
  };

  const REG = /* glsl */`
    // keep every layer exactly where the flat photograph had it, as seen from the rest camera
    vec3 register(vec3 p, float d) { float s = (d - p.z) / d; return vec3(p.xy * s, p.z); }
  `;

  const planeGeo = new THREE.PlaneGeometry(PLW, PLH, 150, 266);

  let tMap, tDepth, tBack, tWord, wordMesh, wordCtx, wordCanvas;

  function build(maps) {
    [tMap, tDepth, tBack] = maps;
    tDepth.minFilter = THREE.LinearFilter;

    /* backdrop */
    const back = new THREE.Mesh(planeGeo, new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { tBack: { value: tBack }, uZ: { value: Z_BACK }, uTiltBack: { value: TILT_BACK }, ...U },
      vertexShader: /* glsl */`
        uniform float uD, uZ, uTiltBack;
        varying vec2 vUv; varying vec2 vPlate;
        ${REG}
        void main() {
          vUv = uv; vPlate = position.xy;
          vec3 p = position; p.z = -uZ - uv.y * uTiltBack;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(register(p, uD), 1.0);
        }`,
      fragmentShader: /* glsl */`
        precision highp float;
        uniform sampler2D tBack; uniform vec3 uSpot; uniform float uSpotK, uFade, uTime;
        varying vec2 vUv; varying vec2 vPlate;
        float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
        void main() {
          vec3 c = texture2D(tBack, vUv).rgb;
          float lum = dot(c, vec3(0.299, 0.587, 0.114));
          float t = pow(clamp(lum, 0.0, 1.0), 1.7);
          vec3 col = mix(vec3(0.060, 0.016, 0.024), vec3(0.52, 0.17, 0.19), t);
          float d = distance(vPlate, uSpot.xy);
          col *= 1.0 - smoothstep(uSpot.z, uSpot.z * 2.6, d) * uSpotK * 0.8;
          float e = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
          float a = smoothstep(0.0, 0.15, e) * uFade;
          col += (hash(gl_FragCoord.xy + uTime) - 0.5) * 0.028;
          gl_FragColor = vec4(col, a);
        }`,
    }));
    back.renderOrder = 0;
    scene.add(back);

    /* wordmark: a flat plane carrying a canvas texture of the house name */
    wordCanvas = document.createElement('canvas');
    wordCtx = wordCanvas.getContext('2d');
    tWord = new THREE.CanvasTexture(wordCanvas);
    tWord.colorSpace = THREE.NoColorSpace;
    tWord.generateMipmaps = true;
    tWord.minFilter = THREE.LinearMipmapLinearFilter;
    tWord.anisotropy = 4;
    wordMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { tWord: { value: tWord }, uZ: { value: Z_WORD }, uOpacity: { value: 1 }, uD: U.uD, uFade: U.uFade },
      vertexShader: /* glsl */`
        uniform float uD, uZ; varying vec2 vUv;
        ${REG}
        void main() {
          vUv = uv; vec3 p = position; p.z = -uZ;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(register(p, uD), 1.0);
        }`,
      fragmentShader: /* glsl */`
        precision highp float;
        uniform sampler2D tWord; uniform float uOpacity, uFade; varying vec2 vUv;
        void main() { vec4 c = texture2D(tWord, vUv); gl_FragColor = vec4(c.rgb, c.a * uOpacity * uFade); }`,
    }));
    wordMesh.renderOrder = 1;
    scene.add(wordMesh);
    drawWordmark();

    /* sitter */
    const sitter = new THREE.Mesh(planeGeo, new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { tMap: { value: tMap }, tDepth: { value: tDepth }, uRelief: { value: RELIEF }, uTexel: { value: new THREE.Vector2(1 / 450, 1 / 800) }, uPlate: { value: new THREE.Vector2(PLW, PLH) }, ...U },
      vertexShader: /* glsl */`
        uniform sampler2D tDepth; uniform float uRelief, uD;
        varying vec2 vUv; varying vec2 vPlate;
        ${REG}
        void main() {
          vUv = uv; vPlate = position.xy;
          float h = texture2D(tDepth, uv).r;
          vec3 p = position; p.z = h * uRelief;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(register(p, uD), 1.0);
        }`,
      fragmentShader: /* glsl */`
        precision highp float;
        uniform sampler2D tMap, tDepth; uniform vec2 uTexel; uniform vec3 uLight, uSpot; uniform float uSpotK, uFade, uTime;
        varying vec2 vUv; varying vec2 vPlate;
        float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
        void main() {
          vec4 c = texture2D(tMap, vUv);
          if (c.a < 0.004) discard;
          // surface normal from the depth gradient, lit by a light that follows the pointer
          vec2 e = uTexel * 2.0;
          float hx = texture2D(tDepth, vUv + vec2(e.x, 0.0)).r - texture2D(tDepth, vUv - vec2(e.x, 0.0)).r;
          float hy = texture2D(tDepth, vUv + vec2(0.0, e.y)).r - texture2D(tDepth, vUv - vec2(0.0, e.y)).r;
          vec3 n = normalize(vec3(-hx * 11.0, -hy * 11.0, 1.0));
          float dif = dot(n, normalize(uLight));
          vec3 col = c.rgb * (0.8 + 0.34 * dif);
          float lum = dot(col, vec3(0.299, 0.587, 0.114));
          col = mix(vec3(lum), col, 0.9) * vec3(1.03, 0.985, 0.97);
          float d = distance(vPlate, uSpot.xy);
          col *= 1.0 - smoothstep(uSpot.z, uSpot.z * 2.4, d) * uSpotK * 0.72;
          col += vec3(0.05, 0.03, 0.02) * (1.0 - smoothstep(uSpot.z * 0.2, uSpot.z, d)) * uSpotK;
          // the photograph was cut at its sides and foot: dissolve there instead of showing a straight edge
          float ex = smoothstep(0.0, 0.07, vUv.x) * smoothstep(0.0, 0.11, 1.0 - vUv.x);
          float ey = smoothstep(0.0, 0.07, vUv.y);
          col += (hash(gl_FragCoord.xy + uTime) - 0.5) * 0.026;
          gl_FragColor = vec4(col, c.a * ex * ey * uFade);
        }`,
    }));
    sitter.renderOrder = 2;
    scene.add(sitter);
  }

  /* --------------------------------------------------------------- wordmark art */
  function drawWordmark() {
    if (!wordCtx) return;
    const cw = 2048, ch = 560;
    wordCanvas.width = cw; wordCanvas.height = ch;
    const c = wordCtx;
    c.clearRect(0, 0, cw, ch);
    const word = 'ATTENTE';
    c.textBaseline = 'alphabetic';
    c.fillStyle = '#f3ebe0';
    c.font = '500 400px "Bodoni Moda", "Bodoni 72", Didot, serif';
    const track = 26;
    const measure = () => {
      let w = 0; for (const ch of word) w += c.measureText(ch).width + track;
      return w - track;
    };
    const k = (cw * 0.97) / measure();
    c.font = `500 ${Math.floor(400 * k)}px "Bodoni Moda", "Bodoni 72", Didot, serif`;
    const total = measure();
    const m = c.measureText('H');
    const capH = m.actualBoundingBoxAscent;
    let x = (cw - total) / 2;
    const y = (ch + capH) / 2;
    for (const chr of word) { c.fillText(chr, x, y); x += c.measureText(chr).width + track; }
    tWord.needsUpdate = true;
    wordAspect = ch / cw;
    layoutWordmark();
  }
  let wordAspect = 560 / 2048;

  /* ------------------------------------------------------------------- layout */
  let wmY = 0.76, wmW = 2.4;
  function layoutWordmark() {
    if (!wordMesh) return;
    const heroZoom = (mobile ? KEYS.campagne.m.zoom : KEYS.campagne.d.zoom) || 1;
    const vis = 2 * (W / H) / heroZoom;                          // world width visible at the hero zoom
    wmW = mobile ? Math.min(vis * 0.88, 1.7) : Math.min(2.5, vis * 0.82);
    wmY = mobile ? 0.93 : 0.74;
    wordMesh.scale.set(wmW, wmW * wordAspect, 1);
    wordMesh.position.set(0, wmY, 0);
  }

  /* ------------------------------------------------- camera keys, per section */
  // x,y: the plate point the camera looks at · zoom: 1 = plate fills the viewport height
  // sx,sy: shift the picture right / up as a fraction of the viewport · yaw: radians · spot: x,y,radius · k: spot strength
  const RECEIPT = { x: 0.27, y: -0.74, z: 0.3 };
  const SHIRT = { x: 0.06, y: -0.2, z: 0.17 };
  const SIGN = { x: 0.11, y: 0.88, z: -(Z_BACK + 0.94 * TILT_BACK) };
  const K_BASE = { x: 0, y: 0.02, zoom: 1, sx: 0, sy: 0, yaw: 0, pitch: 0, spot: [0, 0, 9], k: 0, fade: 1, wm: 1 };
  const KEYS = {
    campagne:   { d: { zoom: 0.96 }, m: { zoom: 0.78, sy: -0.02 } },
    piece:      { d: { x: RECEIPT.x, y: RECEIPT.y, zoom: 2.25, sx: 0.2, yaw: -0.2, pitch: 0.02, spot: [RECEIPT.x, RECEIPT.y, 0.3], k: 1, wm: 0 },
                  m: { x: RECEIPT.x, y: RECEIPT.y, zoom: 2.0, sy: 0.2, yaw: -0.18, spot: [RECEIPT.x, RECEIPT.y, 0.3], k: 1, wm: 0 } },
    collection: { slot: '#slot1', d: { wm: 0, fade: 1 }, m: { wm: 0, fade: 1 } },
    maison:     { d: { x: SIGN.x, y: 0.92, zoom: 1.65, sx: 0.2, yaw: 0.14, pitch: -0.05, spot: [SIGN.x, SIGN.y, 0.34], k: 1, wm: 0 },
                  m: { x: SIGN.x, y: 0.9, zoom: 1.45, sy: 0.14, yaw: 0.12, spot: [SIGN.x, SIGN.y, 0.34], k: 1, wm: 0 } },
    provenance: { d: { x: SHIRT.x, y: SHIRT.y, zoom: 1.55, sx: -0.26, yaw: 0.16, spot: [SHIRT.x, SHIRT.y, 0.36], k: 1, wm: 0 },
                  m: { x: SHIRT.x, y: SHIRT.y, zoom: 1.5, sy: 0.2, yaw: 0.14, spot: [SHIRT.x, SHIRT.y, 0.36], k: 1, wm: 0 } },
    presse:     { d: { zoom: 1.1, fade: 0.15, wm: 0 }, m: { zoom: 1.1, sy: 0.06, fade: 0.15, wm: 0 } },
    boutique:   { d: { x: RECEIPT.x, y: RECEIPT.y, zoom: 1.9, sx: -0.2, yaw: 0.18, spot: [RECEIPT.x, RECEIPT.y, 0.34], k: 0.8, wm: 0 },
                  m: { x: RECEIPT.x, y: RECEIPT.y, zoom: 1.8, sy: 0.2, yaw: 0.14, spot: [RECEIPT.x, RECEIPT.y, 0.34], k: 0.8, wm: 0 } },
  };
  const CALLOUT_ACTIVE = { piece: 'receipt', boutique: 'receipt', maison: 'sign', provenance: 'shirt' };
  const ANCHORS = { receipt: RECEIPT, sign: SIGN, shirt: SHIRT };

  let sections = [];
  function measure() {
    sections = [...document.querySelectorAll('[data-cam]')].map(el => {
      const r = el.getBoundingClientRect();
      const top = r.top + scrollY, h = r.height;
      const inset = mobile ? 0.12 : 0.2;
      return { el, id: el.dataset.cam, a: top + h * inset, b: top + h * (1 - inset), top, bottom: top + h };
    });
  }

  function keyFor(i) {
    const s = sections[i];
    const def = KEYS[s.id] || {};
    const base = { ...K_BASE, ...(mobile ? def.m : def.d) };
    if (def.slot) {
      const slot = document.querySelector(def.slot);
      if (slot) {
        const r = slot.getBoundingClientRect();
        if (r.width > 4) {
          base.x = 0; base.y = 0; base.yaw = 0;
          base.zoom = r.height / H;
          base.sx = ((r.left + r.width / 2) - W / 2) / W;
          base.sy = -((r.top + r.height / 2) - H / 2) / H;
        }
      }
    }
    return base;
  }

  const mix = (A, B, t) => ({
    x: lerp(A.x, B.x, t), y: lerp(A.y, B.y, t),
    zoom: Math.exp(lerp(Math.log(A.zoom), Math.log(B.zoom), t)),
    sx: lerp(A.sx, B.sx, t), sy: lerp(A.sy, B.sy, t), yaw: lerp(A.yaw, B.yaw, t), pitch: lerp(A.pitch, B.pitch, t),
    spot: [lerp(A.spot[0], B.spot[0], t), lerp(A.spot[1], B.spot[1], t), lerp(A.spot[2], B.spot[2], t)],
    k: lerp(A.k, B.k, t), fade: lerp(A.fade, B.fade, t), wm: lerp(A.wm, B.wm, t),
  });

  /* ----------------------------------------------------------------- state */
  const cur = { ...K_BASE, spot: [0, 0, 9] };
  let target = { ...K_BASE };
  let activeId = 'campagne';
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const callouts = [...document.querySelectorAll('.callout')];

  function aim() {
    if (!sections.length) return;
    const pos = scrollY + H * 0.5;
    // between two holds? interpolate; otherwise stay on the nearest hold
    let j = -1;
    for (let k = 0; k < sections.length - 1; k++) {
      if (pos > sections[k].b && pos < sections[k + 1].a) { j = k; break; }
    }
    let idx;
    if (j >= 0) {
      let t = (pos - sections[j].b) / (sections[j + 1].a - sections[j].b);
      if (state.reduced) t = t < 0.5 ? 0 : 1;
      t = sstep(clamp(t, 0, 1));
      target = mix(keyFor(j), keyFor(j + 1), t);
      idx = t < 0.5 ? j : j + 1;
    } else {
      idx = 0;
      for (let k = 0; k < sections.length; k++) if (pos >= sections[k].a) idx = k;
      target = keyFor(idx);
    }
    activeId = sections[idx].id;
  }

  /* ------------------------------------------------------------------ frame */
  let last = 0, raf = 0, running = false, lost = false, t0 = 0;
  const v3 = new THREE.Vector3();
  const T = new THREE.Vector3();

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.1); last = now;
    const time = (now - t0) / 1000;
    U.uTime.value = state.reduced ? 0 : time;

    aim();
    const kc = state.reduced ? 1 : 1 - Math.exp(-dt * 3.4);
    for (const k of ['x', 'y', 'zoom', 'sx', 'sy', 'yaw', 'pitch', 'k', 'fade', 'wm']) cur[k] = lerp(cur[k], target[k], kc);
    for (let i = 0; i < 3; i++) cur.spot[i] = lerp(cur.spot[i], target.spot[i], kc);

    const kp = state.reduced ? 0 : 1 - Math.exp(-dt * 5);
    pointer.x = lerp(pointer.x, state.reduced ? 0 : pointer.tx, kp);
    pointer.y = lerp(pointer.y, state.reduced ? 0 : pointer.ty, kp);
    const idleYaw = state.reduced ? 0 : Math.sin(time * 0.33) * (state.coarse ? 0.05 : 0.02);
    const idlePitch = state.reduced ? 0 : Math.sin(time * 0.27 + 1.3) * (state.coarse ? 0.025 : 0.012);

    const yaw = cur.yaw + pointer.x * 0.2 + idleYaw;
    const pitch = cur.pitch - pointer.y * 0.1 + idlePitch;
    const dist = D / cur.zoom;
    T.set(cur.x, cur.y, 0.1);
    camera.position.set(T.x + dist * Math.sin(yaw) * Math.cos(pitch), T.y + dist * Math.sin(pitch), T.z + dist * Math.cos(yaw) * Math.cos(pitch));
    camera.lookAt(T);
    camera.setViewOffset(W, H, -cur.sx * W, cur.sy * H, W, H);
    camera.updateMatrixWorld();

    U.uLight.value.set(pointer.x * 0.9, pointer.y * 0.7 + 0.35, 0.85);
    U.uSpot.value.set(cur.spot[0], cur.spot[1], cur.spot[2]);
    U.uSpotK.value = cur.k;
    U.uFade.value = clamp(cur.fade, 0, 1);
    if (wordMesh) wordMesh.material.uniforms.uOpacity.value = clamp(cur.wm, 0, 1);

    renderer.render(scene, camera);
    placeCallouts();
  }

  function placeCallouts() {
    const want = CALLOUT_ACTIVE[activeId];
    for (const el of callouts) {
      const name = el.dataset.anchor;
      const on = name === want;
      el.classList.toggle('on', on);
      if (!on) continue;
      const a = ANCHORS[name];
      const s = (D - a.z) / D;
      v3.set(a.x * s, a.y * s, a.z).project(camera);
      const x = (v3.x * 0.5 + 0.5) * W, y = (-v3.y * 0.5 + 0.5) * H;
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    }
  }

  function start() { if (running || lost) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
  function stop() { running = false; cancelAnimationFrame(raf); }

  /* ----------------------------------------------------------------- resize */
  function resize() {
    // the canvas box, not innerWidth: innerWidth includes a desktop scrollbar the fixed stage does not cover
    W = Math.max(1, canvas.clientWidth || window.innerWidth); H = Math.max(1, canvas.clientHeight || window.innerHeight);
    mobile = W < 900;
    const dpr = Math.min(window.devicePixelRatio || 1, MAXDPR);
    renderer.setPixelRatio(dpr);
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    K_BASE.zoom = 1;
    measure();
    layoutWordmark();
    for (const el of callouts) if (el.dataset.anchor === 'sign') el.dataset.side = mobile ? 'left' : 'right';
  }
  window.addEventListener('resize', resize);
  new ResizeObserver(() => { if (canvas.clientWidth !== W || canvas.clientHeight !== H) resize(); }).observe(canvas);
  new ResizeObserver(() => measure()).observe(document.body);

  /* ---------------------------------------------------------------- pointer */
  if (!state.coarse) {
    window.addEventListener('pointermove', e => {
      pointer.tx = (e.clientX / W) * 2 - 1;
      pointer.ty = -((e.clientY / H) * 2 - 1);
    }, { passive: true });
    document.addEventListener('pointerleave', () => { pointer.tx = 0; pointer.ty = 0; });
  }

  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); lost = true; stop(); root.classList.add('gl-lost'); });
  canvas.addEventListener('webglcontextrestored', () => {
    lost = false; root.classList.remove('gl-lost');
    for (const t of [tMap, tDepth, tBack, tWord]) if (t) t.needsUpdate = true;   // their GPU copies died with the old context
    start();
  });

  /* ------------------------------------------------------------------- go */
  resize();
  Promise.all([
    load('img/waiting-portrait-cutout.webp', true),
    load('img/waiting-portrait-depth.webp', false),
    load('img/waiting-portrait-backdrop.webp', true),
    document.fonts ? document.fonts.load('500 200px "Bodoni Moda"').catch(() => {}) : null,
  ]).then(res => {
    build(res.slice(0, 3));
    t0 = performance.now();
    resize();
    root.classList.add('gl-on');
    start();
  }).catch(() => { state.gl = false; root.classList.add('no-gl'); });

  if (document.fonts) document.fonts.ready.then(() => { drawWordmark(); });
  window.addEventListener('load', () => { measure(); });
}
