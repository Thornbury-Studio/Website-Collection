/* VOLT//FLOOD — the machine. One fixed WebGL stage behind the page:
   shader-displaced waveform floor, truss + stepped beam fans, two
   speaker walls with kick-pulsed cones, the logotype as sheared
   canvas-strip slabs, signal rain, haze and drifting poster fragments.
   Reads window.VFSTATE (app.js) every frame; every scroll/beat-driven
   transform is recomputed absolutely (home + f(p)), never accumulated. */

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

(function () {
  "use strict";

  var canvas = document.getElementById("gl");
  var S = window.VFSTATE;
  if (!canvas || !S) return;

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas, antialias: true, alpha: false,
      powerPreference: "high-performance"
    });
  } catch (e) { return; }

  var mobile = window.matchMedia("(max-width: 760px), (pointer: coarse)").matches;
  var DPR_CAP = mobile ? 1.25 : 1.75;

  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0x060608);
  scene.fog = new THREE.FogExp2(0x060608, 0.0062);

  var camera = new THREE.PerspectiveCamera(58, 1, 0.5, 900);

  /* palette */
  var COL = {
    acid: new THREE.Color(0xd8f224),
    acidDim: new THREE.Color(0x5a6612),
    flood: new THREE.Color(0x6ed3ff),
    bone: new THREE.Color(0xedede4),
    alert: new THREE.Color(0xff4b1f),
    truss: new THREE.Color(0x3f4233),
    dark: new THREE.Color(0x0c0d10)
  };

  /* exposure management: every luminous material registers a base level */
  var lums = [];
  function reg(mat, base) { lums.push({ m: mat, b: base }); return mat; }
  var exposure = 1;

  /* =============== waveform floor =============== */
  var floorGeo = new THREE.PlaneGeometry(640, 420, mobile ? 70 : 110, mobile ? 46 : 70);
  var floorUniforms = {
    uTime: { value: 0 },
    uAmp: { value: 2.0 },
    uColA: { value: COL.acidDim.clone() },
    uColB: { value: COL.acid.clone() },
    uOpacity: { value: 0.6 },
    uPtr: { value: new THREE.Vector2(0, 0) },      // pointer, floor-local
    uPtrAmp: { value: 0 },                          // interference height
    uSurge: { value: 0 },                           // discharge envelope
    uSurgeR: { value: 0 },                          // shockwave radius
    uSurgeC: { value: new THREE.Vector2(0, 0) }     // shockwave centre
  };
  var floorMat = new THREE.ShaderMaterial({
    uniforms: floorUniforms,
    wireframe: true,
    transparent: true,
    depthWrite: false,
    vertexShader: [
      "uniform float uTime;",
      "uniform float uAmp;",
      "uniform vec2 uPtr;",
      "uniform float uPtrAmp;",
      "uniform float uSurge;",
      "uniform float uSurgeR;",
      "uniform vec2 uSurgeC;",
      "varying float vH;",
      "void main() {",
      "  vec3 p = position;",
      "  float w = sin(p.x * 0.045 + uTime * 1.7) * 0.9",
      "          + sin(p.y * 0.06 - uTime * 1.15) * 0.7",
      "          + sin((p.x + p.y) * 0.021 + uTime * 0.6) * 1.3;",
      "  float d = distance(p.xy, uPtr);",
      "  float ripple = exp(-d * d * 0.0007) * sin(d * 0.17 - uTime * 8.0) * uPtrAmp;",
      "  float sd = distance(p.xy, uSurgeC) - uSurgeR;",
      "  float ring = exp(-sd * sd * 0.0045) * uSurge * 16.0;",
      "  p.z += w * uAmp + ripple + ring;",
      "  vH = clamp(w * 0.32 + 0.5 + abs(ripple) * 0.12 + ring * 0.06, 0.0, 1.0);",
      "  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);",
      "}"
    ].join("\n"),
    fragmentShader: [
      "uniform vec3 uColA;",
      "uniform vec3 uColB;",
      "uniform float uOpacity;",
      "varying float vH;",
      "void main() {",
      "  vec3 c = mix(uColA, uColB, vH * vH);",
      "  gl_FragColor = vec4(c, uOpacity);",
      "}"
    ].join("\n")
  });
  var floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  scene.add(floor);

  /* =============== truss (towers + crossbeam) =============== */
  function trussLines(pts) {
    var geo = new THREE.BufferGeometry().setFromPoints(pts);
    return new THREE.LineSegments(geo, new THREE.LineBasicMaterial({
      color: COL.truss, transparent: true, opacity: 0.85
    }));
  }
  function towerPts(x, z) {
    var pts = [], w = 7, h = 58, step = 7.25, y;
    for (var k = 0; k < 2; k++) {
      var xx = x + (k ? w : 0);
      pts.push(new THREE.Vector3(xx, 0, z), new THREE.Vector3(xx, h, z));
    }
    for (y = 0; y < h; y += step) {
      pts.push(new THREE.Vector3(x, y, z), new THREE.Vector3(x + w, y + step, z));
      pts.push(new THREE.Vector3(x, y + step, z), new THREE.Vector3(x + w, y, z));
    }
    return pts;
  }
  function beamPts() {
    var pts = [], x0 = -70, x1 = 70, yT = 58, yB = 52, z = -55, x;
    pts.push(new THREE.Vector3(x0, yT, z), new THREE.Vector3(x1, yT, z));
    pts.push(new THREE.Vector3(x0, yB, z), new THREE.Vector3(x1, yB, z));
    for (x = x0; x < x1; x += 10) {
      pts.push(new THREE.Vector3(x, yT, z), new THREE.Vector3(x + 10, yB, z));
      pts.push(new THREE.Vector3(x, yB, z), new THREE.Vector3(x + 10, yT, z));
    }
    return pts;
  }
  scene.add(trussLines(towerPts(-77, -55)));
  scene.add(trussLines(towerPts(70, -55)));
  scene.add(trussLines(beamPts()));

  /* =============== beam fans =============== */
  var NBEAMS = mobile ? 7 : 12;
  var beams = [];
  var beamGeo = new THREE.CylinderGeometry(0.6, 9.5, 96, 12, 1, true);
  beamGeo.translate(0, -48, 0);
  var headGeo = new THREE.BoxGeometry(2.6, 2.2, 2.6);
  for (var b = 0; b < NBEAMS; b++) {
    var g = new THREE.Group();
    var frac = NBEAMS === 1 ? 0.5 : b / (NBEAMS - 1);
    g.position.set(-66 + 132 * frac, 55, -55);
    var mat = reg(new THREE.MeshBasicMaterial({
      color: COL.acid.clone(), transparent: true, opacity: 0.085,
      blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
      fog: false
    }), 0.085);
    var cone = new THREE.Mesh(beamGeo, mat);
    g.add(cone);
    var headMat = reg(new THREE.MeshBasicMaterial({
      color: COL.acid.clone(), transparent: true, opacity: 0.9
    }), 0.9);
    g.add(new THREE.Mesh(headGeo, headMat));
    scene.add(g);
    beams.push({ g: g, mat: mat, head: headMat, seed: b * 1.37, cur: 0 });
  }

  /* =============== speaker walls =============== */
  var cones = [];
  var boxGeo = new THREE.BoxGeometry(8, 9, 10);
  var boxMat = new THREE.MeshBasicMaterial({ color: COL.dark });
  var rimGeo = new THREE.RingGeometry(1.5, 3.4, 20);
  function speakerWall(x, dir) {
    var wall = new THREE.Group();
    for (var col = 0; col < 2; col++) {
      for (var row = 0; row < 5; row++) {
        var box = new THREE.Mesh(boxGeo, boxMat);
        box.position.set(0, 4.8 + row * 9.4, -14 + col * 12);
        wall.add(box);
        var rmat = reg(new THREE.MeshBasicMaterial({
          color: COL.acidDim.clone(), transparent: true, opacity: 0.75,
          side: THREE.DoubleSide
        }), 0.75);
        var rim = new THREE.Mesh(rimGeo, rmat);
        rim.position.set(dir * 4.15, 4.8 + row * 9.4, -14 + col * 12);
        rim.rotation.y = dir * Math.PI / 2;
        wall.add(rim);
        cones.push({ mesh: rim, mat: rmat, seed: row * 0.9 + col });
      }
    }
    wall.position.set(x, 0, -38);
    scene.add(wall);
  }
  speakerWall(-84, 1);
  speakerWall(84, -1);

  /* =============== logotype slabs =============== */
  var STRIPS = 12;
  var slabGroup = new THREE.Group();
  slabGroup.position.set(0, 34, -128);
  scene.add(slabGroup);
  var logoCanvas = document.createElement("canvas");
  logoCanvas.width = 2048; logoCanvas.height = 512;
  var lctx = logoCanvas.getContext("2d");
  var logoTex = new THREE.CanvasTexture(logoCanvas);
  logoTex.colorSpace = THREE.SRGBColorSpace;
  function drawLogo(fontReady) {
    lctx.clearRect(0, 0, 2048, 512);
    lctx.fillStyle = "#d8f224";
    lctx.font = (fontReady ? "400 300px Anton" : "700 260px Arial Narrow, sans-serif");
    lctx.textAlign = "center";
    lctx.textBaseline = "middle";
    lctx.fillText("VOLT//FLOOD", 1024, 276);
    logoTex.needsUpdate = true;
  }
  drawLogo(false);
  if (document.fonts && document.fonts.load) {
    document.fonts.load('400 300px "Anton"').then(function (fs) {
      if (fs && fs.length) drawLogo(true);
    }).catch(function () {});
  }
  var slabW = 210, slabH = 52;
  var slabMat = reg(new THREE.MeshBasicMaterial({
    map: logoTex, transparent: true, opacity: 0.85,
    blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
    fog: false
  }), 0.85);
  var strips = [];
  for (var st = 0; st < STRIPS; st++) {
    var v0 = 1 - (st + 1) / STRIPS, v1 = 1 - st / STRIPS;
    var pg = new THREE.PlaneGeometry(slabW, slabH / STRIPS);
    var uv = pg.attributes.uv;
    for (var u = 0; u < uv.count; u++) {
      uv.setY(u, uv.getY(u) === 1 ? v1 : v0);
    }
    var mesh = new THREE.Mesh(pg, slabMat);
    mesh.position.y = (STRIPS / 2 - st - 0.5) * (slabH / STRIPS);
    slabGroup.add(mesh);
    strips.push({ mesh: mesh, seed: Math.sin(st * 91.7) * 43758.5453 % 1 });
  }
  var jolt = 0;  // decaying strip scatter, retriggered on the 4-beat

  /* =============== signal rain =============== */
  var NRAIN = mobile ? 220 : 420;
  var rainGeo = new THREE.BufferGeometry();
  var rainPos = new Float32Array(NRAIN * 6);
  var rainMeta = [];
  for (var r = 0; r < NRAIN; r++) {
    var rx = (Math.random() - 0.5) * 300;
    var rz = -160 + Math.random() * 190;
    var ry = Math.random() * 130;
    var sp = 34 + Math.random() * 50;
    rainMeta.push({ x: rx, z: rz, y0: ry, sp: sp });
    rainPos[r * 6 + 0] = rx; rainPos[r * 6 + 1] = ry;     rainPos[r * 6 + 2] = rz;
    rainPos[r * 6 + 3] = rx; rainPos[r * 6 + 4] = ry - 3; rainPos[r * 6 + 5] = rz;
  }
  rainGeo.setAttribute("position", new THREE.BufferAttribute(rainPos, 3));
  var rainMat = reg(new THREE.LineBasicMaterial({
    color: COL.flood.clone(), transparent: true, opacity: 0.28,
    blending: THREE.AdditiveBlending, depthWrite: false
  }), 0.28);
  var rain = new THREE.LineSegments(rainGeo, rainMat);
  scene.add(rain);

  /* =============== haze =============== */
  var hazeCanvas = document.createElement("canvas");
  hazeCanvas.width = 128; hazeCanvas.height = 128;
  var hctx = hazeCanvas.getContext("2d");
  var grad = hctx.createRadialGradient(64, 64, 4, 64, 64, 64);
  grad.addColorStop(0, "rgba(216,242,36,0.55)");
  grad.addColorStop(0.5, "rgba(216,242,36,0.14)");
  grad.addColorStop(1, "rgba(216,242,36,0)");
  hctx.fillStyle = grad;
  hctx.fillRect(0, 0, 128, 128);
  var hazeTex = new THREE.CanvasTexture(hazeCanvas);
  var hazes = [];
  var NHAZE = mobile ? 4 : 8;
  for (var hz = 0; hz < NHAZE; hz++) {
    var hmat = reg(new THREE.SpriteMaterial({
      map: hazeTex, transparent: true, opacity: 0.05,
      blending: THREE.AdditiveBlending, depthWrite: false, color: 0xffffff
    }), 0.05);
    var sp2 = new THREE.Sprite(hmat);
    var scale = 90 + Math.random() * 150;
    sp2.scale.set(scale, scale, 1);
    sp2.userData = {
      hx: (Math.random() - 0.5) * 220,
      hy: 14 + Math.random() * 44,
      hz: -120 + Math.random() * 110,
      ph: Math.random() * Math.PI * 2
    };
    scene.add(sp2);
    hazes.push(sp2);
  }

  /* =============== poster fragments =============== */
  var posters = [];
  if (!mobile) {
    var POSTER_TEXT = [
      ["EDITION IV", "13.14.15 NOV 2026", "SUBSTATION 9"],
      ["SIGNAL", "OVER", "LOAD"],
      ["ONE MACHINE", "BARELY", "HELD"]
    ];
    POSTER_TEXT.forEach(function (lines, i) {
      var pc = document.createElement("canvas");
      pc.width = 512; pc.height = 512;
      var pctx = pc.getContext("2d");
      pctx.strokeStyle = "rgba(237,237,228,0.5)";
      pctx.lineWidth = 4;
      pctx.strokeRect(10, 10, 492, 492);
      pctx.fillStyle = "rgba(237,237,228,0.85)";
      pctx.textAlign = "left";
      pctx.font = "500 54px 'IBM Plex Mono', monospace";
      lines.forEach(function (ln, li) { pctx.fillText(ln, 42, 120 + li * 130); });
      var ptex = new THREE.CanvasTexture(pc);
      ptex.colorSpace = THREE.SRGBColorSpace;
      var pmat = reg(new THREE.MeshBasicMaterial({
        map: ptex, transparent: true, opacity: 0.15, depthWrite: false,
        side: THREE.DoubleSide, fog: false
      }), 0.15);
      var pm = new THREE.Mesh(new THREE.PlaneGeometry(52, 52), pmat);
      pm.userData = {
        hx: [-165, 158, -120][i], hy: [58, 44, 88][i], hz: [-190, -170, -230][i],
        rot: (i - 1) * 0.24, ph: i * 2.1
      };
      scene.add(pm);
      posters.push(pm);
    });
  }

  /* =============== camera path =============== */
  var KEYS = [
    { p: 0.00, pos: [0, 26, 150],  look: [0, 32, -60] },
    { p: 0.20, pos: [0, 11, 96],   look: [0, 26, -60] },
    { p: 0.44, pos: [-46, 28, 74], look: [12, 30, -60] },
    { p: 0.66, pos: [48, 20, 80],  look: [-12, 26, -58] },
    { p: 0.86, pos: [0, 44, 126],  look: [0, 24, -55] },
    { p: 1.00, pos: [0, 58, 178],  look: [0, 20, -50] }
  ];
  var camPos = new THREE.Vector3();
  var camLook = new THREE.Vector3();
  function smooth(t) { return t * t * (3 - 2 * t); }
  function samplePath(p) {
    var i = 0;
    while (i < KEYS.length - 2 && p > KEYS[i + 1].p) i++;
    var a = KEYS[i], b2 = KEYS[i + 1];
    var t = smooth(Math.min(1, Math.max(0, (p - a.p) / (b2.p - a.p))));
    camPos.set(
      a.pos[0] + (b2.pos[0] - a.pos[0]) * t,
      a.pos[1] + (b2.pos[1] - a.pos[1]) * t,
      a.pos[2] + (b2.pos[2] - a.pos[2]) * t
    );
    camLook.set(
      a.look[0] + (b2.look[0] - a.look[0]) * t,
      a.look[1] + (b2.look[1] - a.look[1]) * t,
      a.look[2] + (b2.look[2] - a.look[2]) * t
    );
  }

  /* =============== stage channels =============== */
  var chTargets = {
    "": { beam: COL.acid, grid: COL.acid, rain: 0.28, floorA: COL.acidDim },
    grid: { beam: COL.acid, grid: COL.acid, rain: 0.1, floorA: COL.acidDim },
    flood: { beam: COL.flood, grid: COL.flood, rain: 0.55, floorA: new THREE.Color(0x1d4b63) },
    drain: { beam: COL.bone, grid: COL.bone, rain: 0.12, floorA: new THREE.Color(0x3c3d38) }
  };
  var curBeam = COL.acid.clone();
  var curGrid = COL.acid.clone();
  var curFloorA = COL.acidDim.clone();
  var curRain = 0.28;

  /* =============== resize =============== */
  function resize() {
    var w = canvas.clientWidth || window.innerWidth;
    var h = canvas.clientHeight || window.innerHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, DPR_CAP));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", function () { resize(); if (S.reduced) renderStatic(); });
  resize();

  /* =============== frame =============== */
  var smoothP = 0;
  var lastBeatSeen = -1;
  var clock = new THREE.Clock();

  /* signal touch: pointer projected onto the floor plane */
  var ptrWorld = new THREE.Vector3(0, 0, -20);
  var ptrNdc = new THREE.Vector3();
  var ptrAmpCur = 0;
  var surgeSeen = null;
  var surgeEnv = 0;

  function projectPointer() {
    ptrNdc.set(S.px, -S.py, 0.5).unproject(camera);
    ptrNdc.sub(camera.position).normalize();
    if (ptrNdc.y < -0.04) {
      var tHit = -camera.position.y / ptrNdc.y;
      ptrWorld.set(
        Math.max(-300, Math.min(300, camera.position.x + ptrNdc.x * tHit)),
        0,
        Math.max(-200, Math.min(190, camera.position.z + ptrNdc.z * tHit))
      );
    }
  }

  /* beam choreography: each stage reconfigures the rig structurally */
  function beamPattern(beat, i, t) {
    var frac = NBEAMS === 1 ? 0.5 : i / (NBEAMS - 1);
    if (S.stage === "flood") {
      /* wide synchronized low sway, off the step clock */
      return Math.sin(t * 0.55 + frac * 1.1) * 1.25;
    }
    if (S.stage === "drain") {
      /* every beam folds to one centre point */
      return Math.atan2(0 - (-66 + 132 * frac), 55) * 0.9;
    }
    var step = S.stage === "grid" ? 2 : 4;      // grid: double-time chase
    var block = Math.floor(beat / step) % 3;
    if (block === 0) return (frac - 0.5) * 1.5;                      // spread fan
    if (block === 1) return (0.5 - frac) * 1.1;                      // crossed
    return Math.sin((beat % step) * Math.PI / step * 2 + i * 0.55) * 0.85; // sweep
  }

  function tick() {
    var t = clock.getElapsedTime();
    var kick = Math.pow(1 - S.beatPhase, 3);

    smoothP += (S.v - smoothP) * 0.07;
    exposure += ((1 - S.dim * 0.68) - exposure) * 0.06;

    /* ---- signal touch ---- */
    projectPointer();
    var charge = S.charge || 0;
    var ptrAmpTgt = S.reduced ? 0 : 3 + charge * 8;
    ptrAmpCur += (ptrAmpTgt - ptrAmpCur) * 0.08;
    floorUniforms.uPtr.value.set(ptrWorld.x, -ptrWorld.z);
    floorUniforms.uPtrAmp.value = ptrAmpCur;

    if (S.surge && S.surge !== surgeSeen) {
      surgeSeen = S.surge;
      floorUniforms.uSurgeC.value.set(ptrWorld.x, -ptrWorld.z);
      jolt = 1.7;                      // scatter the logotype slabs
    }
    if (surgeSeen) {
      var age = (performance.now() - surgeSeen.t) / 1000;
      if (age < 1.8) {
        surgeEnv = Math.exp(-age * 2.7) * (0.35 + surgeSeen.power * 0.85);
        floorUniforms.uSurge.value = surgeEnv;
        floorUniforms.uSurgeR.value = age * 175;
      } else {
        surgeEnv = 0;
        floorUniforms.uSurge.value = 0;
      }
    }
    var aimW = Math.min(1, charge * 1.7 + surgeEnv * 1.4);

    /* channel colours */
    var tgt = chTargets[S.stage || ""] || chTargets[""];
    curBeam.lerp(tgt.beam, 0.06);
    curGrid.lerp(tgt.grid, 0.06);
    curFloorA.lerp(tgt.floorA, 0.06);
    curRain += (tgt.rain - curRain) * 0.06;

    /* floor */
    floorUniforms.uTime.value = t;
    floorUniforms.uAmp.value = 1.4 + smoothP * 6.5 + kick * (0.7 + smoothP * 1.6);
    floorUniforms.uColB.value.copy(curGrid);
    floorUniforms.uColA.value.copy(curFloorA);
    floorUniforms.uOpacity.value = 0.62 * exposure;

    /* beams */
    var lerpRate = S.stage === "drain" ? 0.035 : S.stage === "grid" ? 0.14 : 0.09;
    if (aimW > 0.01) lerpRate = 0.16;
    for (var i = 0; i < beams.length; i++) {
      var bm = beams[i];
      var patAngle = beamPattern(S.beatCount, i, t) + S.px * 0.3;
      var aimAngle = Math.max(-1.15, Math.min(1.15,
        Math.atan2(ptrWorld.x - bm.g.position.x, 55)));
      var target = patAngle * (1 - aimW) + aimAngle * aimW;
      bm.cur += (target - bm.cur) * lerpRate;
      bm.g.rotation.z = bm.cur;
      var baseX = Math.sin(t * 0.4 + bm.seed) * 0.12 + S.py * 0.08 +
                  (S.stage === "flood" ? -0.22 : 0);
      var aimX = Math.max(-0.9, Math.min(0.35, -Math.atan2(ptrWorld.z + 55, 55)));
      bm.g.rotation.x = baseX * (1 - aimW) + aimX * aimW;
      bm.mat.color.copy(curBeam);
      bm.head.color.copy(curBeam);
      var flick = 0.75 + kick * 0.45 + Math.sin(t * 2.1 + bm.seed * 3.3) * 0.12;
      bm.mat.opacity = 0.085 * (flick + surgeEnv * 2.2 + charge * 0.7) *
                       exposure * (0.65 + smoothP * 0.7);
      bm.head.opacity = Math.min(1, 0.9 + surgeEnv) * exposure;
    }

    /* speaker cones */
    for (var c2 = 0; c2 < cones.length; c2++) {
      var cn = cones[c2];
      var s2 = 1 + kick * 0.22 * (0.6 + Math.sin(cn.seed * 5) * 0.4);
      cn.mesh.scale.set(s2, s2, 1);
      cn.mat.color.copy(curGrid).multiplyScalar(0.35 + kick * 0.65);
      cn.mat.opacity = 0.75 * exposure;
    }

    /* logotype strips: absolute recompute, decaying beat scatter */
    if (S.beatCount !== lastBeatSeen) {
      lastBeatSeen = S.beatCount;
      if (S.beatCount % 4 === 0) jolt = 1;
    }
    jolt *= 0.94;
    for (var st2 = 0; st2 < strips.length; st2++) {
      var strip = strips[st2];
      var noise = Math.sin(strip.seed * 400 + S.beatCount * 7.3);
      strip.mesh.position.x = S.px * 10 * strip.seed + noise * jolt * 9;
    }
    slabGroup.rotation.y = S.px * 0.06;
    slabGroup.position.y = 34 + Math.sin(t * 0.5) * 2.2;
    slabMat.opacity = (0.55 + 0.3 * (1 - smoothP)) * exposure;

    /* rain: absolute recompute from meta */
    var posAttr = rainGeo.attributes.position;
    for (var r2 = 0; r2 < rainMeta.length; r2++) {
      var m = rainMeta[r2];
      var y = ((m.y0 - t * m.sp) % 130 + 130) % 130;
      posAttr.array[r2 * 6 + 1] = y;
      posAttr.array[r2 * 6 + 4] = y - 2.4 - m.sp * 0.02;
    }
    posAttr.needsUpdate = true;
    rainMat.color.copy(tgt === chTargets.flood ? COL.flood : curBeam);
    rainMat.opacity = curRain * (0.35 + smoothP * 0.85) * exposure;

    /* haze */
    for (var h3 = 0; h3 < hazes.length; h3++) {
      var hzS = hazes[h3];
      var ud = hzS.userData;
      hzS.position.set(
        ud.hx + Math.sin(t * 0.11 + ud.ph) * 16,
        ud.hy + Math.sin(t * 0.07 + ud.ph * 2) * 5,
        ud.hz
      );
      hzS.material.opacity = (0.035 + smoothP * 0.05 + kick * 0.012 + surgeEnv * 0.05) * exposure;
      hzS.material.color.copy(curBeam);
    }

    /* posters */
    for (var p3 = 0; p3 < posters.length; p3++) {
      var po = posters[p3];
      var pu = po.userData;
      po.position.set(pu.hx, pu.hy + Math.sin(t * 0.23 + pu.ph) * 4, pu.hz);
      po.rotation.y = pu.rot + Math.sin(t * 0.15 + pu.ph) * 0.06;
      po.material.opacity = 0.15 * exposure;
    }

    /* camera */
    samplePath(smoothP);
    camera.position.set(
      camPos.x + S.px * 9,
      camPos.y + S.py * -4,
      camPos.z
    );
    camera.lookAt(camLook);

    renderer.render(scene, camera);
  }

  function loop() {
    tick();
    requestAnimationFrame(loop);
  }

  function renderStatic() {
    /* reduced motion: one composed frame, no clockwork */
    smoothP = 0;
    exposure = 1;
    floorUniforms.uTime.value = 2.0;
    floorUniforms.uAmp.value = 3.2;
    for (var i = 0; i < beams.length; i++) {
      beams[i].g.rotation.z = (i / Math.max(1, beams.length - 1) - 0.5) * 1.5;
    }
    samplePath(0);
    camera.position.copy(camPos);
    camera.lookAt(camLook);
    renderer.render(scene, camera);
  }

  window.VF = { ready: true };
  window.__vfLayers = {
    scene: scene, camera: camera, beams: beams, strips: strips,
    cones: cones, rain: rain, posters: posters,
    state: function () { return { p: smoothP, exposure: exposure }; }
  };

  if (S.reduced) {
    /* redraw once when the display font lands */
    setTimeout(renderStatic, 0);
    setTimeout(renderStatic, 1200);
  } else {
    loop();
  }
})();
