/* The stage: one glTF chess set, vanilla Three.js, driven entirely by state.t.
   Nothing here is scripted geometry — the set is a real asset (see LICENSES.md).
   Every piece position, the camera and the lighting are pure functions of the
   timeline, so scrubbing backwards undoes the game exactly. */
import * as THREE from '../vendor/three.module.min.js';
import { GLTFLoader } from '../vendor/GLTFLoader.js';
import { PLIES, START } from './game.js';
import { state } from './state.js';

const root = document.documentElement;
const canvas = document.getElementById('gl');
const tagEl = document.getElementById('tag');
const tagSan = document.getElementById('tag-san');
const veil = document.getElementById('veil');

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, k) => a + (b - a) * k;
const rad = d => d * Math.PI / 180;
const easeIO = u => u * u * (3 - 2 * u);
const easeIn = u => u * u;
const N = PLIES.length;

/* ------------------------------------------------------------------ renderer */
let renderer = null;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: !state.coarse, powerPreference: 'high-performance' });
} catch (e) { renderer = null; }
if (!renderer) { noGL(); } else { boot(); }

function noGL() { state.gl = false; root.classList.add('no-gl'); }

function boot() {
  const MAXDPR = state.coarse ? 1.5 : 2;
  let dpr = Math.min(window.devicePixelRatio || 1, MAXDPR);
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  if ('transmissionResolutionScale' in renderer) renderer.transmissionResolutionScale = state.coarse ? 0.5 : 0.75;

  const GROUND = 0x0a1410;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(GROUND);
  scene.fog = new THREE.FogExp2(GROUND, 0.45);
  const camera = new THREE.PerspectiveCamera(36, 1, 0.02, 12);

  /* ---------------------------------------------------------------- environment
     Baked once from a throwaway scene of soft panels, so the glass and the
     lacquer have something real to reflect. No texture files, no CDN. */
  let envRT = null;
  function buildEnv() {
    if (envRT) envRT.dispose();
    const s = new THREE.Scene();
    s.add(new THREE.Mesh(new THREE.SphereGeometry(6, 32, 16), new THREE.MeshBasicMaterial({ color: 0x0d1c16, side: THREE.BackSide })));
    const panel = (w, h, pos, color, k) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), side: THREE.DoubleSide }));
      m.position.set(pos[0], pos[1], pos[2]); m.lookAt(0, 0, 0); s.add(m);
    };
    panel(3.2, 2.2, [0.4, 4.2, 0.4], 0xfff0d2, 16);     // overhead softbox
    panel(0.7, 3.2, [-4.2, 1.6, -1.2], 0xd2efe2, 9);    // tall cool strip, left
    panel(0.7, 3.2, [4.2, 1.8, 1.4], 0xd2efe2, 7);      // tall cool strip, right
    panel(2.4, 0.5, [0.3, 1.1, -4.6], 0xffffff, 5);     // low strip behind the camera, for glints
    panel(1.2, 1.2, [2.5, 2.4, 3.6], 0xffe2b4, 6);      // warm card, far side
    const pm = new THREE.PMREMGenerator(renderer);
    envRT = pm.fromScene(s, 0.04);
    pm.dispose();
    scene.environment = envRT.texture;
  }
  buildEnv();

  /* -------------------------------------------------------------------- lights */
  const key = new THREE.SpotLight(0xffe2b0, 2, 0, rad(34), 0.9, 2);
  key.castShadow = true;
  key.shadow.mapSize.set(state.coarse ? 1024 : 2048, state.coarse ? 1024 : 2048);
  key.shadow.camera.near = 0.3; key.shadow.camera.far = 3;
  key.shadow.bias = -0.00025; key.shadow.normalBias = 0.0015; key.shadow.radius = 4;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0xa9dcc6, 0.6);
  rim.position.set(0.7, 0.45, 1.1);
  scene.add(rim);
  const pool = new THREE.SpotLight(0xfff0d8, 0, 0, rad(22), 1, 2);
  scene.add(pool, pool.target);

  /* ---------------------------------------------------------- table (staging) */
  const noise = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d'); const d = g.createImageData(256, 256);
    for (let i = 0; i < d.data.length; i += 4) { const v = 110 + Math.random() * 90; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    g.putImageData(d, 0, 0);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(28, 28); return t;
  })();
  const fade = (() => {                // the cloth thins to nothing at its edge instead of ending in a horizon
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d'), r = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    r.addColorStop(0, '#fff'); r.addColorStop(0.2, '#fff'); r.addColorStop(0.45, '#4a4a4a'); r.addColorStop(1, '#000');
    g.fillStyle = r; g.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  })();
  const table = new THREE.Mesh(
    new THREE.CircleGeometry(1.5, 72),
    new THREE.MeshStandardMaterial({ color: 0x0f2c22, roughness: 0.96, metalness: 0, bumpMap: noise, bumpScale: 1.2, alphaMap: fade, transparent: true, depthWrite: false })
  );
  table.rotation.x = -Math.PI / 2;
  table.receiveShadow = true;
  scene.add(table);

  /* ------------------------------------------------------------------- the set */
  const pieces = [];            // { node, p0, c0, events, type, color }
  const byName = {};
  const moverOf = new Array(N + 1).fill(null);
  let boardHalf = 0.28;
  const SQ = 0.0625;
  const sq = s => ({ x: 3.5 * SQ - (s.charCodeAt(0) - 97) * SQ, z: -3.5 * SQ + (s.charCodeAt(1) - 49) * SQ });
  let ready = false;

  new GLTFLoader().load('models/chess-set.glb', gltf => {
    const model = gltf.scene;
    const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    model.traverse(o => {
      if (o.name) byName[o.name] = o;
      if (o.isMesh) {
        o.castShadow = true; o.receiveShadow = true;
        for (const k of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap']) if (o.material[k]) o.material[k].anisotropy = aniso;
      }
    });
    scene.add(model);

    const box = new THREE.Box3().setFromObject(byName.Chessboard);
    boardHalf = Math.max(box.max.x, -box.min.x);
    table.position.y = box.min.y - 0.0005;
    key.target.position.set(0, box.max.y, 0);

    // identify every piece, then replay the score to learn each piece's own itinerary
    const occ = {};
    for (const [s, name] of Object.entries(START)) {
      const node = byName[name];
      const type = { Pawn: 'p', Castle: 'r', Knight: 'n', Bishop: 'b', Queen: 'q', King: 'k' }[name.split('_')[0]];
      const p = { node, p0: node.position.clone(), c0: sq(s), events: [], type, color: name.includes('_W') ? 'w' : 'b' };
      pieces.push(p); occ[s] = p;
    }
    const trayN = { w: 0, b: 0 };
    PLIES.forEach(([, , from, to, cap], i) => {
      const ply = i + 1;
      const mover = occ[from];
      moverOf[ply] = mover;
      if (cap) {
        const victim = occ[to];
        const k = trayN[victim.color]++;
        const x = (victim.color === 'w' ? 1 : -1) * (boardHalf + 0.075 + (k % 2) * 0.05);
        const z = victim.color === 'w' ? -0.2 + Math.floor(k / 2) * 0.062 : 0.2 - Math.floor(k / 2) * 0.062;
        victim.events.push({ ply, kind: 'cap', at: sq(to), tray: { x, z } });
      }
      mover.events.push({ ply, kind: 'mv', from: sq(from), to: sq(to), cap: !!cap });
      occ[to] = mover; delete occ[from];
    });

    ready = true;
    root.classList.add('gl-ready');
    dirty = true;
  }, undefined, () => { noGL(); });

  function placePieces(f) {
    for (const p of pieces) {
      let x = p.c0.x, z = p.c0.z, lift = 0;
      for (const ev of p.events) {
        const u = f - (ev.ply - 1);
        if (u <= 0) break;
        const q = Math.min(u, 1);
        if (ev.kind === 'mv') {
          const st = ev.cap ? 0.3 : 0;
          const s = easeIO(clamp((q - st) / (1 - st), 0, 1));
          x = lerp(ev.from.x, ev.to.x, s); z = lerp(ev.from.z, ev.to.z, s);
          lift = Math.sin(Math.PI * s) * (p.type === 'n' ? 0.06 : 0.018);
          if (q < 1) break;
        } else {
          const s = easeIn(clamp(q / 0.45, 0, 1));
          x = lerp(ev.at.x, ev.tray.x, s); z = lerp(ev.at.z, ev.tray.z, s);
          lift = Math.sin(Math.PI * Math.min(1, s * 1.15)) * 0.05;
          if (q < 0.45) break;
        }
      }
      p.node.position.set(p.p0.x + (x - p.c0.x), p.p0.y + lift, p.p0.z + (z - p.c0.z));
    }
  }

  /* ----------------------------------------------------- camera path (the story)
     az: 0 = from White's side, + swings toward the a-file, > 90 passes to Black's side.
     el: degrees above the table. d: metres from the focus. w: how far the focus
     leaves the board centre to ride the piece that is moving. */
  const BEATS = [
    { t: -1,   az: 36,  el: 21, d: 0.80, w: 0 },     // hero: low, long, corner-on
    { t: 0,    az: 10,  el: 38, d: 0.68, w: 0 },     // White's side, the board laid out
    { t: 1.5,  az: 6,   el: 33, d: 0.52, w: 0.55 },  // e4 e5
    { t: 4,    az: -14, el: 31, d: 0.48, w: 0.65 },  // f4 exf4
    { t: 6,    az: -56, el: 27, d: 0.40, w: 0.80 },  // Qh4+, from the king's side, low
    { t: 7.6,  az: -10, el: 34, d: 0.44, w: 0.65 },  // Kf1
    { t: 9,    az: 50,  el: 27, d: 0.40, w: 0.80 },  // Bxb5, across to the queenside
    { t: 13,   az: 20,  el: 37, d: 0.56, w: 0.45 },  // the middle of the game
    { t: 17,   az: -34, el: 28, d: 0.42, w: 0.75 },  // Nf5
    { t: 21,   az: -58, el: 26, d: 0.42, w: 0.70 },  // Rg1 and the g-file
    { t: 25,   az: -20, el: 41, d: 0.54, w: 0.50 },
    { t: 29,   az: 36,  el: 28, d: 0.42, w: 0.80 },  // Bxf4
    { t: 33.5, az: 30,  el: 25, d: 0.38, w: 0.85 },  // Nd5, Qxb2: eye level with the pieces
    { t: 35,   az: 100, el: 20, d: 0.46, w: 0.70 },  // swing round to Black's side
    { t: 37,   az: 150, el: 30, d: 0.48, w: 0.60 },  // Bxg1, Qxa1+ from behind Black
    { t: 40,   az: 118, el: 32, d: 0.48, w: 0.55 },
    { t: 41.5, az: 30,  el: 27, d: 0.38, w: 0.85 },  // Nxg7+, back round the front
    { t: 43.2, az: -34, el: 24, d: 0.34, w: 0.90 },  // Qf6+, the queen offered
    { t: 44.6, az: -44, el: 24, d: 0.34, w: 0.90 },  // Nxf6
    { t: 45,   az: -40, el: 32, d: 0.40, w: 0.90 },  // Be7#
    { t: 46,   az: -8,  el: 62, d: 0.80, w: 0.15 },  // the room: lift off and look down
    { t: 47,   az: 18,  el: 50, d: 1.00, w: 0.05 }
  ];
  function spline(keys, t, k) {
    const n = keys.length;
    if (t <= keys[0].t) return keys[0][k];
    if (t >= keys[n - 1].t) return keys[n - 1][k];
    let i = 0; while (keys[i + 1].t <= t) i++;
    const a = keys[i], b = keys[i + 1], dt = b.t - a.t;
    const m0 = i > 0 ? (b[k] - keys[i - 1][k]) / (b.t - keys[i - 1].t) : 0;
    const m1 = i + 2 < n ? (keys[i + 2][k] - a[k]) / (keys[i + 2].t - a.t) : 0;
    const u = (t - a.t) / dt, u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * a[k] + (u3 - 2 * u2 + u) * m0 * dt + (-2 * u3 + 3 * u2) * b[k] + (u3 - u2) * m1 * dt;
  }

  /* lighting follows the game: even and warm, then raking, then cold and hard for the finish */
  const LIGHT = [
    { t: -1,   key: 2.6, cool: 0.0, kaz: -40, kel: 52, rim: 0.5, pool: 0.0, pa: 24, env: 0.55, ex: 1.0 },
    { t: 3,    key: 2.4, cool: 0.0, kaz: -40, kel: 50, rim: 0.6, pool: 0.5, pa: 24, env: 0.55, ex: 1.0 },
    { t: 6,    key: 1.3, cool: 0.1, kaz: -70, kel: 30, rim: 1.4, pool: 2.0, pa: 20, env: 0.40, ex: 1.0 },
    { t: 14,   key: 2.0, cool: 0.2, kaz: -30, kel: 48, rim: 0.8, pool: 0.8, pa: 24, env: 0.50, ex: 1.0 },
    { t: 21,   key: 1.0, cool: 0.4, kaz: 70,  kel: 28, rim: 1.6, pool: 1.8, pa: 20, env: 0.38, ex: 1.0 },
    { t: 34,   key: 0.6, cool: 0.6, kaz: 95,  kel: 24, rim: 2.0, pool: 2.6, pa: 18, env: 0.32, ex: 1.05 },
    { t: 43,   key: 0.4, cool: 0.9, kaz: 20,  kel: 34, rim: 2.3, pool: 3.4, pa: 14, env: 0.28, ex: 1.1 },
    { t: 45,   key: 1.8, cool: 1.0, kaz: 0,   kel: 70, rim: 1.2, pool: 3.0, pa: 16, env: 0.55, ex: 1.05 },
    { t: 46,   key: 2.2, cool: 0.0, kaz: -30, kel: 60, rim: 0.9, pool: 0.0, pa: 24, env: 0.60, ex: 1.0 }
  ];
  const WARM = new THREE.Color(0xffe0ae), COLD = new THREE.Color(0xd4ecf4), tmpC = new THREE.Color();
  const LK = 1.15;                // metres from the board to the key light
  const tune = { key: 7, rim: 4, pool: 7, env: 1.6, fog: 0.45 };   // three's light units are physical: these lift the 0-3 authoring scale to a lit room

  /* ------------------------------------------------------------------- loop */
  const focus = new THREE.Vector3(0, 0.03, 0);
  const want = new THREE.Vector3();
  const tilt = { x: 0, y: 0, tx: 0, ty: 0 };
  const v3 = new THREE.Vector3();
  let W = 1, H = 1, dirty = true, lost = false, raf = 0, last = performance.now();
  let lastCur = -1, lastSig = '', slow = 0, frames = 0;

  function size() {
    W = Math.max(1, window.innerWidth); H = Math.max(1, window.innerHeight);
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.fov = W / H < 0.9 ? 44 : 36;
    measure();
    dirty = true;
  }
  /* the HUD sits left on wide screens and under the board on tall ones: centre the board in the free space */
  const barEl = document.getElementById('bar'), hudEl = document.getElementById('hud'), heroEl = document.querySelector('.hero-copy');
  let heroH = 0, hudH = 0, offKey = '';
  function measure() { heroH = heroEl.offsetHeight + 48; hudH = hudEl.offsetHeight + 16; offKey = ''; }
  function applyOffset(t) {
    let x = 0, y = 0;
    if (W / H >= 0.9) x = -W * 0.2;
    else y = Math.max(0, (lerp(heroH, hudH, clamp(t + 1, 0, 1)) - barEl.offsetHeight) / 2);
    const key = x.toFixed(0) + ',' + y.toFixed(0);
    if (key === offKey) return;
    offKey = key; camera.setViewOffset(W, H, x, y, W, H); camera.updateProjectionMatrix(); dirty = true;
  }
  size();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measure(); dirty = true; });
  let rz = 0;
  window.addEventListener('resize', () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(size); });

  if (!state.coarse && !state.reduced) {
    window.addEventListener('pointermove', e => {
      tilt.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      tilt.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.1); last = now;
    if (!ready) return;
    const t = state.t, f = clamp(t, 0, N);
    applyOffset(t);
    const cur = clamp(Math.ceil(f - 1e-6), 0, N);

    // --- pointer tilt, damped
    const kd = state.reduced ? 1 : 1 - Math.exp(-dt * 4);
    tilt.x = lerp(tilt.x, tilt.tx, kd); tilt.y = lerp(tilt.y, tilt.ty, kd);

    // --- camera
    const idle = t > 46 ? Math.sin(now * 0.00012) * 4 : 0;       // a slow drift once the game is over
    const az = rad(spline(BEATS, t, 'az') + tilt.x * 3.2 + (state.reduced ? 0 : idle));
    const el = rad(clamp(spline(BEATS, t, 'el') - tilt.y * 2.2, 8, 84));
    const portrait = W / H < 0.9;
    let d = spline(BEATS, t, 'd') * 1.32;
    if (portrait) d *= Math.pow(clamp(0.95 / (W / H), 1, 2.4), 0.8);
    const w0 = clamp(spline(BEATS, t, 'w'), 0, 1);
    const w = t > 0 && t < N + 0.5 ? 0.4 + 0.6 * w0 : w0;

    const mover = cur >= 1 ? moverOf[cur] : null;
    placePieces(f);
    if (mover) { mover.node.getWorldPosition(v3); want.set(lerp(0, v3.x, w), 0.03 + lerp(0, v3.y * 0.4, w), lerp(0, v3.z, w)); }
    else want.set(0, 0.03, 0);
    const kf = state.reduced ? 1 : 1 - Math.exp(-dt * 3.2);
    focus.lerp(want, kf);

    camera.position.set(focus.x + d * Math.sin(az) * Math.cos(el), focus.y + d * Math.sin(el), focus.z - d * Math.cos(az) * Math.cos(el));
    camera.lookAt(focus);

    // --- lights
    const L = k => spline(LIGHT, t, k);
    const kaz = rad(L('kaz')), kel = rad(L('kel'));
    key.position.set(Math.sin(kaz) * Math.cos(kel) * LK, Math.sin(kel) * LK, -Math.cos(kaz) * Math.cos(kel) * LK);
    key.intensity = L('key') * tune.key;
    key.color.copy(tmpC.copy(WARM).lerp(COLD, clamp(L('cool'), 0, 1)));
    rim.intensity = L('rim') * tune.rim;
    pool.position.set(focus.x, 0.62, focus.z - 0.1); pool.target.position.copy(focus);
    pool.intensity = L('pool') * tune.pool; pool.angle = rad(L('pa'));
    scene.environmentIntensity = L('env') * tune.env; scene.fog.density = tune.fog;
    renderer.toneMappingExposure = L('ex');

    // --- the veil dims the board behind the room's text
    const vv = clamp((t - 45.15) / 0.8, 0, 1);

    // --- the one anchor: the move in hand, pinned to the piece that is making it
    if (mover && t > 0.05 && t <= N + 0.2) {
      mover.node.getWorldPosition(v3); v3.y += 0.085;
      v3.project(camera);
      const sx = (v3.x * 0.5 + 0.5) * W, sy = (-v3.y * 0.5 + 0.5) * H;
      tagEl.style.transform = 'translate3d(' + sx.toFixed(1) + 'px,' + sy.toFixed(1) + 'px,0)';
      tagEl.style.opacity = '1';
      if (cur !== lastCur) { lastCur = cur; tagSan.textContent = PLIES[cur - 1][5]; }
    } else tagEl.style.opacity = '0';

    const sig = camera.position.x.toFixed(5) + camera.position.y.toFixed(5) + camera.position.z.toFixed(5) + t.toFixed(4) + vv.toFixed(3);
    if (sig === lastSig && !dirty) return;
    lastSig = sig; dirty = false;
    veil.style.opacity = vv.toFixed(3);
    renderer.render(scene, camera);

    // --- quality ladder: sample the delivered frame time, step the pixel ratio down, never up
    if (dt < 0.25) {
      frames++; if (dt > 0.034) slow++;
      if (frames >= 60) { if (slow > 36 && dpr > 1) { dpr = Math.max(1, dpr - 0.25); renderer.setPixelRatio(dpr); size(); } frames = 0; slow = 0; }
    }
  }

  function start() { if (!raf && !lost && document.visibilityState !== 'hidden') { last = performance.now(); raf = requestAnimationFrame(frame); } }
  function stop() { cancelAnimationFrame(raf); raf = 0; }
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else { dirty = true; start(); } });

  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); lost = true; stop(); root.classList.add('gl-lost'); });
  canvas.addEventListener('webglcontextrestored', () => { lost = false; envRT = null; /* its GL objects died with the old context */ buildEnv(); root.classList.remove('gl-lost'); dirty = true; start(); });

  start();
}
