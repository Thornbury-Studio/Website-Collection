// Concept redesign — WebGL hero: a molten tile floor receding into the dark.
//
// The centrepiece game at this venue is "Floor Is Lava", so the hero is that
// floor rather than a stock photo: dark crust tiles with glowing seams, and a
// heat wave that travels diagonally across the grid.
//
// PERFORMANCE — "bake once, animate cheap" (the house rule):
// There is no noise anywhere. The whole surface is one plane with one material;
// the pattern comes from fract() on the UV, and the motion from a single sin()
// per fragment. Per frame the CPU writes one uniform. Everything else is the
// GPU drawing two triangles.
//
// The grid is anti-aliased with fwidth() rather than left to shimmer — a
// perspective grid without it aliases badly toward the horizon, which is
// exactly where this one recedes to.

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';

function visualRandom() {
  const bytes = new Uint32Array(1);
  window.crypto.getRandomValues(bytes);
  return bytes[0] / 0x100000000;
}

const host = document.getElementById('lava');
if (host && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  try { boot(host); } catch (e) { host.classList.add('is-dead'); }
}

function boot(host) {
  const tier = (() => {
    const w = window.innerWidth;
    const cores = navigator.hardwareConcurrency || 4;
    if (w < 700 || cores <= 4) return { dpr: 1.25, aa: false, tiles: 3 };
    if (w < 1200 || cores <= 8) return { dpr: 1.5, aa: true, tiles: 5 };
    return { dpr: 2, aa: true, tiles: 6 };
  })();

  const renderer = new THREE.WebGLRenderer({ antialias: tier.aa, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, tier.dpr));
  renderer.setClearAlpha(0);
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 120);
  camera.position.set(0, 1.35, 4.2);
  camera.lookAt(0, 0.15, -6);

  const uniforms = { uTime: { value: 0 } };

  /* ---------- the floor ---------- */
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60, 1, 1),
    new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vLocal;
        void main() {
          vUv = uv;
          vLocal = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        uniform float uTime;
        varying vec2 vUv;
        varying vec3 vLocal;

        void main() {
          // One grid cell per world unit, so tile size stays constant in space
          // rather than stretching with the plane.
          vec2 g = vLocal.xy * 0.55;
          vec2 c = fract(g) - 0.5;
          float d = max(abs(c.x), abs(c.y));

          // Screen-space-consistent seam width. Without fwidth the grid
          // shimmers into moire toward the horizon.
          float w = fwidth(d) * 1.4 + 0.002;
          float seam = smoothstep(0.46 - w, 0.46 + w, d);

          // Heat travelling diagonally across whole tiles.
          vec2 id = floor(g);
          float wave = sin(uTime * 1.15 - (id.x * 0.42 + id.y * 0.30));
          float heat = 0.40 + 0.60 * wave * wave;

          vec3 crust = vec3(0.050, 0.040, 0.075);
          vec3 lava  = mix(vec3(1.00, 0.16, 0.42), vec3(1.00, 0.58, 0.14), heat);

          vec3 col = mix(crust, lava, seam * (0.26 + heat * 0.72));
          // A little bounce light on the crust so tiles aren't flat black.
          col += lava * (1.0 - seam) * heat * 0.045;

          // Fade out with distance from the camera, and drop alpha with it so
          // the floor dissolves into the page instead of ending on a hard edge.
          float dist = length(vLocal.xy - vec2(0.0, 4.0));
          float fade = 1.0 - smoothstep(6.0, 26.0, dist);
          gl_FragColor = vec4(col * fade, fade);
        }
      `
    })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.55;
  scene.add(floor);

  /* ---------- floating safe tiles ---------- */
  // What makes it read as the game rather than a generic grid.
  const tileGeo = new THREE.BoxGeometry(1, 0.09, 1);
  const tileMat = new THREE.MeshBasicMaterial({ color: 0x14101f });
  const edgeMat = new THREE.LineBasicMaterial({ color: 0xc9ff3d, transparent: true, opacity: 0.55 });
  const tiles = [];

  // Jittered grid rather than pure random placement. Independent visualRandom()
  // on x and z clumps badly at these counts — two tiles landing near each other
  // is far more likely than intuition suggests. Stratifying gives every tile its
  // own depth slice AND its own lateral column (a Latin-square arrangement), so
  // no two can ever line up, while the jitter inside each cell keeps it from
  // looking like a regular grid.
  const N = tier.tiles;
  const X_MIN = -4.4, X_MAX = 4.4;
  const Z_MIN = -8.5, Z_MAX = -1.2;
  const xStep = (X_MAX - X_MIN) / N;
  const zStep = (Z_MAX - Z_MIN) / N;

  const cols = Array.from({ length: N }, (_, i) => i);
  for (let i = cols.length - 1; i > 0; i--) {           // Fisher-Yates
    const j = Math.floor(visualRandom() * (i + 1));
    [cols[i], cols[j]] = [cols[j], cols[i]];
  }

  for (let i = 0; i < N; i++) {
    const grp = new THREE.Group();
    const mesh = new THREE.Mesh(tileGeo, tileMat);
    grp.add(mesh);
    grp.add(new THREE.LineSegments(new THREE.EdgesGeometry(tileGeo), edgeMat));

    // 0.18..0.82 inside the cell keeps tiles off their shared cell borders,
    // which is where neighbours would otherwise be able to touch.
    const jx = 0.18 + visualRandom() * 0.64;
    const jz = 0.18 + visualRandom() * 0.64;
    grp.position.set(
      X_MIN + (cols[i] + jx) * xStep,
      0.2 + (i % 3) * 0.26 + visualRandom() * 0.18,   // staggered heights
      Z_MIN + (i + jz) * zStep
    );
    grp.rotation.y = visualRandom() * Math.PI;
    grp.scale.setScalar(0.68 + visualRandom() * 0.5);
    scene.add(grp);
    tiles.push({ grp, phase: visualRandom() * Math.PI * 2, baseY: grp.position.y });
  }

  /* ---------- sizing ---------- */
  function resize() {
    const r = host.getBoundingClientRect();
    const w = Math.max(1, r.width);
    const h = Math.max(1, r.height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  /* ---------- run only when it's worth running ---------- */
  let onScreen = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(e => { onScreen = e[0].isIntersecting; }, { threshold: 0 }).observe(host);
  }

  let running = false;
  const clock = new THREE.Clock();

  function frame() {
    if (!running) return;
    requestAnimationFrame(frame);
    if (!onScreen) return;

    const dt = Math.min(clock.getDelta(), 0.05);
    uniforms.uTime.value += dt;
    const t = uniforms.uTime.value;

    for (let i = 0; i < tiles.length; i++) {
      const tl = tiles[i];
      tl.grp.position.y = tl.baseY + Math.sin(t * 0.9 + tl.phase) * 0.09;
      tl.grp.rotation.y += dt * 0.12;
    }

    renderer.render(scene, camera);
  }

  function start() { if (!running) { running = true; clock.getDelta(); requestAnimationFrame(frame); } }
  function stop() { running = false; }
  document.addEventListener('visibilitychange', () => { document.hidden ? stop() : start(); });

  /* The browser caps live WebGL contexts per process and reclaims the oldest,
     so this grid can be taken away mid-visit. Three.js restores its own GL
     state, but the loop has to be parked and resumed by hand or the canvas
     stays blank after the context comes back. */
  renderer.domElement.addEventListener('webglcontextlost', () => { stop(); }, false);
  renderer.domElement.addEventListener('webglcontextrestored', () => { start(); }, false);

  host.classList.add('is-live');
  start();
}
