/* ═══════════════════════════════════════════════════════════════════════════
   archive — the instrument, and the room it is being inspected in.

   One idea runs the whole scene: the archive is dark, and the visitor is
   carrying the only useful light. Scroll authors the composition (where the
   camera stands, which face of the instrument is presented); the pointer
   authors the light (what is currently legible). Nothing else moves on its
   own account beyond a breath of drift, because an object being examined as
   evidence should not be performing.

   Pin discipline: the three.js URL below must match the rewritten specifier
   at the top of js/vendor/GLTFLoader.js, DRACOLoader.js and
   BufferGeometryUtils.js. Two copies of three would break every instanceof.
   ═══════════════════════════════════════════════════════════════════════════ */

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";
import { GLTFLoader } from "./vendor/GLTFLoader.js";
import { DRACOLoader } from "./vendor/DRACOLoader.js";

const doc = document.documentElement;
const canvas = document.getElementById("gl");
if (canvas) boot();

function boot() {

  /* ── tier ───────────────────────────────────────────────────────────── */
  const COARSE = matchMedia("(pointer: coarse)").matches;
  const SMALL = matchMedia("(max-width: 760px)").matches;
  const MOBILE = COARSE && SMALL;
  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const CFG = {
    dprCap: MOBILE ? 1.5 : 1.75,
    fov: MOBILE ? 44 : 34,
    shadows: !MOBILE,
    shadowSize: 1024,
    dust: MOBILE ? 190 : 460,
    frags: MOBILE ? 7 : 13,
    transmission: !MOBILE,          // the lens glass costs a whole extra pass
    scrollK: REDUCED ? 0.24 : MOBILE ? 0.1 : 0.075,
    lightK: REDUCED ? 0.5 : 0.085
  };

  /* ── renderer ───────────────────────────────────────────────────────── */
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas, antialias: !MOBILE, alpha: false,
      powerPreference: "high-performance", stencil: false
    });
  } catch (e) {
    doc.classList.add("no-3d");
    throw e;
  }

  let DPR = Math.min(devicePixelRatio || 1, CFG.dprCap);
  renderer.setPixelRatio(DPR);
  renderer.setSize(innerWidth, innerHeight, false);   /* CSS owns layout */
  renderer.setClearColor(0x07080a, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  if (CFG.shadows) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x07080a, 0.088);

  const camera = new THREE.PerspectiveCamera(CFG.fov, innerWidth / innerHeight, 0.05, 60);
  camera.position.set(1.15, 0.45, 1.95);

  /* ── the room, baked to an environment map ──────────────────────────── */
  {
    const room = new THREE.Scene();
    const box = (w, h, d, c, x, y, z, ry = 0, rx = 0) => {
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(w, h, d),
        new THREE.MeshBasicMaterial({ color: c })
      );
      m.position.set(x, y, z); m.rotation.y = ry; m.rotation.x = rx;
      room.add(m);
    };
    /* the dark of the archive itself */
    room.add(new THREE.Mesh(
      new THREE.SphereGeometry(60, 16, 12),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(0.016, 0.018, 0.023), side: THREE.BackSide })
    ));
    /* one tungsten inspection lamp above-front, a cold light table below,
       and a narrow cool strip behind for edge separation. The warm source is
       kept close to neutral on purpose — the instrument is a black body with
       brass showing through, and an over-warm room turns the whole thing gold */
    box(20, 14, 1, new THREE.Color(1.95, 1.72, 1.42), -14, 22, 15, Math.PI / 3.4);
    box(46, 1, 34, new THREE.Color(0.34, 0.46, 0.60), 0, -13, 0);
    box(40, 3, 1, new THREE.Color(0.50, 0.72, 1.00), 4, 15, -30, -0.15, 0.3);
    box(1, 20, 12, new THREE.Color(0.86, 0.92, 1.05), 26, 3, -4);
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(room, 0.032).texture;
    pmrem.dispose();
    room.traverse(o => { if (o.geometry) { o.geometry.dispose(); o.material.dispose(); } });
  }

  /* ── lights ─────────────────────────────────────────────────────────── */
  /* the one the visitor carries */
  const lamp = new THREE.SpotLight(0xffdcbb, 0, 9, Math.PI / 7.2, 0.62, 1.4);
  lamp.position.set(1.4, 1.9, 2.4);
  if (CFG.shadows) {
    lamp.castShadow = true;
    lamp.shadow.mapSize.setScalar(CFG.shadowSize);
    lamp.shadow.bias = -0.00035;
    lamp.shadow.normalBias = 0.022;
    lamp.shadow.camera.near = 0.4;
    lamp.shadow.camera.far = 9;
  }
  scene.add(lamp, lamp.target);

  /* the table, cold and always on, so the silhouette never disappears */
  const table = new THREE.PointLight(0x8fb0cc, 2.6, 7, 2.1);
  table.position.set(-0.7, -1.15, 0.5);
  scene.add(table);

  const rim = new THREE.DirectionalLight(0xa8c6e2, 1.05);
  rim.position.set(-2.4, 1.1, -2.2);
  scene.add(rim);

  /* ── the light table ────────────────────────────────────────────────── */
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x0a0c0f, roughness: 0.82, metalness: 0.05
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(26, 26), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.62;
  floor.receiveShadow = CFG.shadows;
  scene.add(floor);

  /* a cold pool of light on the table surface, drawn rather than lit */
  {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d");
    const rg = g.createRadialGradient(128, 128, 6, 128, 128, 126);
    rg.addColorStop(0, "rgba(150,182,208,.50)");
    rg.addColorStop(0.45, "rgba(110,140,170,.16)");
    rg.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = rg; g.fillRect(0, 0, 256, 256);
    const pool = new THREE.Mesh(
      new THREE.PlaneGeometry(5.4, 5.4),
      new THREE.MeshBasicMaterial({
        map: new THREE.CanvasTexture(c), transparent: true,
        blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.85
      })
    );
    pool.rotation.x = -Math.PI / 2;
    pool.position.y = -0.612;
    scene.add(pool);
  }

  /* ── archive fragments ──────────────────────────────────────────────── */
  /* Contact sheets and index cards, drawn to canvas so the site ships no
     extra image bytes. They sit far enough back to read as depth, and only
     become legible when the visitor's light reaches them. */
  const RECORDS = [
    ["AI-0412", "INTERIOR", "STAIR HALL, TEXTILE WORKS", "1.3121 N  103.8452 E", "DEMOLISHED", "18:52"],
    ["AI-0388", "COASTLINE", "SEA WALL, EAST RECLAMATION", "1.2903 N  103.9612 E", "SUBMERGED", "19:14"],
    ["AI-0361", "OBJECT", "PRINTER'S CABINET, 3F", "1.3044 N  103.8571 E", "SOLD", "17:38"],
    ["AI-0357", "STRUCTURE", "WATER TOWER, NORTH QUARRY", "1.3899 N  103.7402 E", "CLEARED", "19:02"],
    ["AI-0344", "INTERIOR", "PROJECTION ROOM", "1.2998 N  103.8402 E", "RENOVATED", "18:20"]
  ];

  function sheetTexture(seed) {
    const c = document.createElement("canvas");
    c.width = 384; c.height = 256;
    const g = c.getContext("2d");
    g.fillStyle = "#0e1013"; g.fillRect(0, 0, 384, 256);
    g.strokeStyle = "#2a2f37"; g.lineWidth = 1;
    g.strokeRect(6.5, 6.5, 371, 243);
    /* six frames with sprocket runs, the way a contact strip actually prints */
    let n = 0;
    for (let r = 0; r < 2; r++) {
      for (let col = 0; col < 3; col++, n++) {
        const x = 22 + col * 116, y = 30 + r * 108, w = 100, h = 74;
        const v = ((seed * 37 + n * 53) % 23) / 23;
        g.fillStyle = "rgba(" + (26 + v * 34) + "," + (28 + v * 32) + "," + (33 + v * 30) + ",1)";
        g.fillRect(x, y, w, h);
        g.strokeStyle = "#31373f"; g.strokeRect(x + .5, y + .5, w, h);
        g.fillStyle = "rgba(200,214,228,.10)";
        for (let s = 0; s < 7; s++) { g.fillRect(x + 4 + s * 14, y - 8, 7, 5); g.fillRect(x + 4 + s * 14, y + h + 3, 7, 5); }
        g.fillStyle = "rgba(255,201,143,.5)";
        g.font = "9px ui-monospace, monospace";
        g.fillText(String(n + 1 + seed * 6).padStart(2, "0") + "A", x + 3, y + h - 5);
      }
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }

  function cardTexture(rec) {
    const c = document.createElement("canvas");
    c.width = 384; c.height = 224;
    const g = c.getContext("2d");
    g.fillStyle = "#12141a"; g.fillRect(0, 0, 384, 224);
    g.strokeStyle = "#333944"; g.lineWidth = 1; g.strokeRect(8.5, 8.5, 367, 207);
    g.fillStyle = "rgba(255,201,143,.85)";
    g.font = "500 15px ui-monospace, monospace";
    g.fillText(rec[0], 24, 44);
    g.fillStyle = "rgba(150,158,170,.75)";
    g.font = "11px ui-monospace, monospace";
    g.fillText(rec[1], 24, 68);
    g.strokeStyle = "#272d36"; g.beginPath(); g.moveTo(24, 84); g.lineTo(360, 84); g.stroke();
    g.fillStyle = "rgba(226,224,218,.88)";
    g.font = "13px ui-monospace, monospace";
    const name = rec[2].length > 30 ? rec[2].slice(0, 29) + "…" : rec[2];
    g.fillText(name, 24, 112);
    g.fillStyle = "rgba(150,158,170,.7)";
    g.font = "11px ui-monospace, monospace";
    g.fillText(rec[3], 24, 138);
    g.fillText("LIGHT FAILED " + rec[5], 24, 158);
    /* the status stamp, set slightly askew like it was pressed by hand */
    g.save();
    g.translate(258, 186); g.rotate(-0.045);
    g.strokeStyle = "rgba(187,90,60,.85)"; g.lineWidth = 1.5;
    g.strokeRect(-6, -19, 112, 27);
    g.fillStyle = "rgba(187,90,60,.95)";
    g.font = "500 12px ui-monospace, monospace";
    g.fillText(rec[4].slice(0, 10), 2, 0);
    g.restore();
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }

  const sheetTex = [0, 1, 2, 3].map(sheetTexture);
  const cardTex = RECORDS.map(cardTexture);

  const frags = [];
  {
    const geo = new THREE.PlaneGeometry(1, 1);
    for (let i = 0; i < CFG.frags; i++) {
      const isCard = i % 3 === 1;
      const tex = isCard ? cardTex[i % cardTex.length] : sheetTex[i % sheetTex.length];
      const mat = new THREE.MeshStandardMaterial({
        map: tex, transparent: true, opacity: 0,
        roughness: 0.94, metalness: 0, side: THREE.DoubleSide,
        depthWrite: false
      });
      const m = new THREE.Mesh(geo, mat);
      const a = (i / CFG.frags) * Math.PI * 2 + 0.7;
      const rad = 2.2 + ((i * 7) % 5) * 0.42;
      m.position.set(Math.cos(a) * rad, -0.35 + ((i * 11) % 7) * 0.29, Math.sin(a) * rad - 0.5);
      const s = isCard ? 0.82 : 0.96;
      m.scale.set(s * (isCard ? 1 : 1.5), s, 1);
      m.userData = {
        isCard, base: m.position.clone(), phase: i * 1.37,
        spin: (i % 2 ? 1 : -1) * 0.045, aim: 0
      };
      frags.push(m);
      scene.add(m);
    }
  }

  /* ── dust ───────────────────────────────────────────────────────────── */
  let dust;
  {
    const n = CFG.dust;
    const pos = new Float32Array(n * 3);
    const spd = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 7;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 4;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6;
      spd[i] = 0.1 + Math.random() * 0.5;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    dust = new THREE.Points(g, new THREE.PointsMaterial({
      color: 0xffd7ab, size: 0.011, transparent: true, opacity: 0.5,
      sizeAttenuation: true, depthWrite: false, blending: THREE.AdditiveBlending
    }));
    dust.userData.spd = spd;
    scene.add(dust);
  }

  /* ── stages: scroll authors the composition ─────────────────────────── */
  /* Each entry is a place to stand and a face of the instrument to present.
     `at` is scroll progress. Everything between is smoothstepped. */
  const STAGES = [
    { at: 0.00, cam: [1.12, 0.42, 1.92], look: [0, -0.02, 0], rot: -0.52, lamp: 1.00 },
    { at: 0.15, cam: [1.64, 0.78, 2.36], look: [0, 0.02, 0], rot: -0.30, lamp: 0.86 },
    { at: 0.31, cam: [0.20, 0.05, 1.18], look: [0, -0.01, 0], rot: 0.02, lamp: 1.24 },
    { at: 0.44, cam: [0.46, 1.12, 0.86], look: [0, 0.02, 0], rot: -0.34, lamp: 1.12 },
    { at: 0.57, cam: [-1.34, 0.22, 0.98], look: [0, -0.03, 0], rot: -1.68, lamp: 1.06 },
    { at: 0.70, cam: [1.48, 0.62, 2.18], look: [0, 0, 0], rot: -0.62, lamp: 0.82 },
    { at: 0.85, cam: [1.98, 0.48, 2.06], look: [0.05, -0.02, 0], rot: -0.92, lamp: 0.95 },
    { at: 1.00, cam: [1.22, 0.34, 3.70], look: [0, -0.04, 0], rot: -0.55, lamp: 0.28 }
  ];

  const _a = new THREE.Vector3(), _b = new THREE.Vector3();
  const camPos = new THREE.Vector3().fromArray(STAGES[0].cam);
  const camLook = new THREE.Vector3().fromArray(STAGES[0].look);
  let stageRot = STAGES[0].rot, stageLamp = STAGES[0].lamp;

  function sampleStage(p) {
    let i = 0;
    while (i < STAGES.length - 2 && p > STAGES[i + 1].at) i++;
    const A = STAGES[i], B = STAGES[i + 1];
    const span = Math.max(B.at - A.at, 1e-5);
    let t = THREE.MathUtils.clamp((p - A.at) / span, 0, 1);
    t = t * t * (3 - 2 * t);                       /* smoothstep */
    _a.fromArray(A.cam); _b.fromArray(B.cam);
    camPos.lerpVectors(_a, _b, t);
    _a.fromArray(A.look); _b.fromArray(B.look);
    camLook.lerpVectors(_a, _b, t);
    stageRot = A.rot + (B.rot - A.rot) * t;
    stageLamp = A.lamp + (B.lamp - A.lamp) * t;
  }

  /* ── scroll ─────────────────────────────────────────────────────────── */
  let targetP = 0, smoothP = 0;
  function readScroll() {
    const span = Math.max(document.body.scrollHeight - innerHeight, 1);
    targetP = THREE.MathUtils.clamp(scrollY / span, 0, 1);
  }
  addEventListener("scroll", readScroll, { passive: true });
  readScroll();

  /* ── the light the visitor carries ──────────────────────────────────── */
  /* Pointer in NDC, damped, then pushed out to a plane in front of the
     instrument. On touch it follows the finger and drifts when idle, so the
     mechanic survives without a cursor. */
  let ptrX = 0.35, ptrY = 0.3, aimX = 0.35, aimY = 0.3;
  let idle = 0;

  function onPointer(e) {
    const t = e.touches ? e.touches[0] : e;
    if (!t) return;
    ptrX = (t.clientX / innerWidth) * 2 - 1;
    ptrY = -((t.clientY / innerHeight) * 2 - 1);
    idle = 0;
  }
  addEventListener("pointermove", onPointer, { passive: true });
  addEventListener("touchmove", onPointer, { passive: true });

  /* ── model ──────────────────────────────────────────────────────────── */
  const rig = new THREE.Group();      /* holds the model, owns presentation rotation */
  scene.add(rig);

  let model = null, lensMat = null;
  const devN = document.querySelector("[data-dev-n]");
  const devBar = document.querySelector("[data-dev-bar]");

  const draco = new DRACOLoader();
  draco.setDecoderPath("js/vendor/draco/");
  draco.setDecoderConfig({ type: "wasm" });

  const gltf = new GLTFLoader();
  gltf.setDRACOLoader(draco);

  gltf.load("model/camera-web.glb", onLoaded, onProgress, onFailed);

  function onProgress(e) {
    if (!devN) return;
    /* total is only present when the server sends content-length */
    const pc = e.total ? Math.round((e.loaded / e.total) * 100) : null;
    devN.textContent = pc === null
      ? "DEVELOPING · " + Math.round(e.loaded / 1024) + "K"
      : "DEVELOPING · " + pc + "%";
    if (devBar && pc !== null) devBar.style.transform = "scaleX(" + (pc / 100) + ")";
  }

  function onFailed(err) {
    console.error("[aperture-index] model failed to load", err);
    doc.classList.add("no-3d");
    doc.classList.add("ready");           /* never leave scroll locked */
  }

  function onLoaded(g) {
    model = g.scene;

    /* Normalise so the camera BODY is one unit and sits on the origin, which
       is what the stage table above is written against.
       Measured on the body alone, deliberately: the strap loop is more than
       twice the width of the camera, so fitting the whole bounding box left
       the actual subject at under half the intended size in every shot. */
    const box = new THREE.Box3();
    model.traverse(o => {
      if (!o.isMesh) return;
      const isStrap = /strap/i.test(o.name) || (o.material && /strap/i.test(o.material.name || ""));
      if (!isStrap) box.expandByObject(o);
    });
    if (box.isEmpty()) box.setFromObject(model);      /* names changed: fall back */
    const size = new THREE.Vector3(), mid = new THREE.Vector3();
    box.getSize(size); box.getCenter(mid);
    const k = 1 / Math.max(size.x, size.y, size.z);
    model.position.sub(mid);
    const holder = new THREE.Group();
    holder.add(model);
    holder.scale.setScalar(k);
    rig.add(holder);

    model.traverse(o => {
      if (!o.isMesh) return;
      o.castShadow = CFG.shadows;
      o.receiveShadow = CFG.shadows;
      const m = o.material;
      if (!m) return;
      m.envMapIntensity = 1.15;
      /* the lens is the one transmissive material in the file; on a phone the
         extra pass is not worth it, so it becomes dark polished glass instead */
      if (m.transmission !== undefined && m.transmission > 0) {
        lensMat = m;
        if (!CFG.transmission) {
          m.transmission = 0;
          m.roughness = 0.08;
          m.metalness = 0.15;
          m.color = new THREE.Color(0x0a0d11);
        }
      }
    });

    /* aim the shadow and the lamp at the instrument */
    lamp.target.position.set(0, 0, 0);
    lamp.target.updateMatrixWorld();

    /* console handle, in the house style — enough to bisect a bad frame
       without a debugger: which tier ran, what decoded, what is on screen */
    window.__AI = {
      ready: true, three: THREE.REVISION,
      meshes: (() => { let n = 0; model.traverse(o => { if (o.isMesh) n++; }); return n; })(),
      tier: { MOBILE, REDUCED, DPR, shadows: CFG.shadows, transmission: CFG.transmission },
      scene, camera, rig, model, lamp, frags,
      /* Jump every damped value to where the current scroll position is
         heading and draw it. Exists because a throttled rAF (headless
         capture, a background tab) leaves the smoothing mid-flight, so a
         screenshot shows a frame the visitor would never actually see. */
      settle(n) {
        readScroll(); smoothP = targetP;
        for (let i = 0; i < (n || 90); i++) step(0);
        renderer.render(scene, camera);
        return { p: +smoothP.toFixed(3), dist: +camera.position.length().toFixed(2) };
      },
      maps() {
        const out = [];
        model.traverse(o => {
          if (!o.isMesh || !o.material) return;
          const m = o.material;
          out.push({
            mesh: o.name, mat: m.name,
            map: !!(m.map && m.map.image), mapW: m.map && m.map.image ? m.map.image.width : 0,
            normal: !!(m.normalMap && m.normalMap.image),
            rough: !!(m.roughnessMap && m.roughnessMap.image),
            transmission: m.transmission || 0
          });
        });
        return out;
      }
    };

    doc.classList.add("ready");
    const dev = document.querySelector("[data-dev]");
    if (dev) dev.classList.add("done");

    /* paint one frame synchronously — a hidden tab never fires rAF */
    step(0);
    renderer.render(scene, camera);

    if (REDUCED) {
      /* a composed still, refreshed a couple of times as fonts/layout settle */
      const still = () => { readScroll(); smoothP = targetP; step(0); renderer.render(scene, camera); };
      addEventListener("scroll", still, { passive: true });
      setTimeout(still, 400); setTimeout(still, 1400);
    } else {
      requestAnimationFrame(frame);
    }
  }

  /* ── per-frame ──────────────────────────────────────────────────────── */
  const clock = new THREE.Clock();
  let visible = true, pageVisible = true;
  let frames = 0, acc = 0, degraded = 0;

  const _lampPos = new THREE.Vector3();

  function step(dt) {
    /* scroll → composition */
    smoothP += (targetP - smoothP) * (REDUCED ? 1 : CFG.scrollK);
    if (Math.abs(targetP - smoothP) < 0.00005) smoothP = targetP;
    sampleStage(smoothP);

    /* pointer → light */
    if (!REDUCED) {
      idle += dt;
      if (idle > 2.6 && COARSE) {
        /* untouched on a phone: let the light wander so the mechanic reads */
        const t = clock.elapsedTime * 0.22;
        ptrX = Math.cos(t) * 0.55;
        ptrY = 0.18 + Math.sin(t * 0.8) * 0.3;
      }
    }
    aimX += (ptrX - aimX) * CFG.lightK;
    aimY += (ptrY - aimY) * CFG.lightK;

    /* Frame the instrument off-centre so type never has to fight it: to the
       right on wide screens, high up on narrow ones. The shift has to scale
       with how far away we are — a fixed world offset is barely visible from
       the wide stages and throws the object clean off frame from the close
       ones, which is exactly what it did before this was proportional. */
    const wide = innerWidth > 900;
    const narrow = innerWidth <= 760;
    camera.position.copy(camPos);
    /* A portrait viewport is narrower than the instrument is wide at these
       stage distances, so every shot would crop. Stand further back. */
    if (!wide) camera.position.multiplyScalar(narrow ? 1.44 : 1.22);
    _a.copy(camLook);
    const dist = camera.position.distanceTo(_a);
    /* A world offset proportional to distance holds a CONSTANT screen-space
       shift — right for the wide stages, not enough for the close ones, where
       the instrument grows past the frame and swallows the text column. So
       the shift opens up further the nearer we get. */
    const near = THREE.MathUtils.clamp((1.9 - dist) * 0.17, 0, 0.2);
    _a.x += wide ? -(0.215 + near) * dist : 0;
    /* Narrow: aim BELOW the instrument so it rides in the upper band and the
       type owns everything under it. Aiming above pushed it off the bottom. */
    _a.y += wide ? 0 : -0.235 * dist;
    /* a breath of pointer parallax, never enough to feel like a toy */
    camera.position.x += aimX * 0.06;
    camera.position.y += aimY * 0.04;
    camera.lookAt(_a);

    /* the instrument itself: authored rotation, plus a slow breath */
    const breath = REDUCED ? 0 : Math.sin(clock.elapsedTime * 0.19) * 0.028;
    rig.rotation.y = stageRot + breath + aimX * 0.075;
    rig.rotation.x = -0.02 + aimY * 0.035;

    /* the lamp rides in front of the camera, thrown by the pointer */
    _lampPos.set(aimX * 2.5, 0.9 + aimY * 1.7, 1.9);
    _lampPos.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(camera.position.x, camera.position.z));
    lamp.position.lerp(_lampPos, REDUCED ? 1 : 0.14);
    lamp.intensity = 15 * stageLamp;

    /* fragments: face the camera loosely, drift, and answer the lit record */
    const lit = window.AISTATE ? window.AISTATE.record : -1;
    for (let i = 0; i < frags.length; i++) {
      const f = frags[i], u = f.userData;
      f.position.y = u.base.y + Math.sin(clock.elapsedTime * 0.24 + u.phase) * 0.045;
      f.rotation.y += u.spin * dt;
      f.lookAt(camera.position.x * 0.55, f.position.y, camera.position.z * 0.55);
      f.rotation.z = Math.sin(clock.elapsedTime * 0.13 + u.phase) * 0.035;

      /* a card belonging to the lit record comes up; everything else settles */
      let want = 0.40;
      if (lit >= 0) want = u.isCard && (i % cardTex.length) === (lit % cardTex.length) ? 0.95 : 0.16;
      f.material.opacity += (want - f.material.opacity) * (REDUCED ? 1 : 0.06);
    }

    /* dust drifts upward through the beam and wraps */
    if (dust && !REDUCED) {
      const p = dust.geometry.attributes.position, sp = dust.userData.spd;
      for (let i = 0; i < sp.length; i++) {
        let y = p.array[i * 3 + 1] + sp[i] * dt * 0.075;
        if (y > 2.1) y = -2.1;
        p.array[i * 3 + 1] = y;
      }
      p.needsUpdate = true;
      dust.rotation.y += dt * 0.012;
    }
  }

  function frame() {
    requestAnimationFrame(frame);
    if (!visible || !pageVisible) return;

    const dt = Math.min(clock.getDelta(), 0.05);
    step(dt);
    renderer.render(scene, camera);

    /* adaptive: sample a window of frames and shed cost once if we are slow */
    if (degraded < 2) {
      acc += dt; frames++;
      if (frames >= 110) {
        const ms = (acc / frames) * 1000;
        if (ms > 26) {
          degraded++;
          if (degraded === 1) {
            DPR = Math.max(1, DPR * 0.8);
            renderer.setPixelRatio(DPR);
          } else if (lensMat && lensMat.transmission > 0) {
            lensMat.transmission = 0;
            lensMat.roughness = 0.08;
            lensMat.metalness = 0.15;
          }
          if (window.__AI) window.__AI.tier.DPR = DPR;
        }
        frames = 0; acc = 0;
      }
    }
  }

  /* ── resize / visibility ────────────────────────────────────────────── */
  addEventListener("resize", () => {
    camera.aspect = innerWidth / innerHeight;
    camera.fov = matchMedia("(max-width: 760px)").matches ? 44 : 34;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight, false);
    readScroll();
  });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(es => { visible = es[0].isIntersecting; }, { threshold: 0 }).observe(canvas);
  }
  document.addEventListener("visibilitychange", () => { pageVisible = !document.hidden; });

  canvas.addEventListener("webglcontextlost", e => { e.preventDefault(); doc.classList.add("no-3d"); });
  canvas.addEventListener("webglcontextrestored", () => { doc.classList.remove("no-3d"); });
}
