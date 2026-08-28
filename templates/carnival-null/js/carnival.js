/* ═══════════════════════════════════════════════════════════════════
   NULL CARNIVAL — the midway.

   A drained natatorium: a deck ring at floor level, a pit in the
   middle with a carousel standing on the bottom of it, seven booths
   around the outside, and a heptagram of bulb wire overhead. The
   camera rides the ring; scroll turns it.

   This module is a pure consumer of window.NCSTATE. It never writes
   back, and if it never boots at all the page is unaffected.

   Rendering is hand-rolled end to end — no addons are reachable under
   this page's CSP, so the composer (bright-pass, separable blur,
   composite with the null lens) is four fullscreen passes written here.
   ═══════════════════════════════════════════════════════════════════ */
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

/* Colours are authored as sRGB hex and must survive untouched all the
   way to the framebuffer. Disabling colour management makes every
   conversion in the pipeline an identity. This must run before the
   first THREE.Color is constructed. */
THREE.ColorManagement.enabled = false;

(function () {
  "use strict";

  var canvas = document.getElementById("gl");
  var S = window.NCSTATE;
  if (!canvas || !S) return;

  /* ─── tier ──────────────────────────────────────────────────────── */
  var COARSE = matchMedia("(pointer: coarse)").matches;
  var SMALL = matchMedia("(max-width: 760px)").matches;
  var MOBILE = COARSE && SMALL;
  var REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

  var CFG = {
    dprCap: MOBILE ? 1.5 : 1.75,
    fov: MOBILE ? 58 : 46,
    masks: MOBILE ? 90 : 180,
    glyphs: MOBILE ? 1200 : 3000,
    haze: MOBILE ? 3 : 5,
    perSpan: MOBILE ? 15 : 26,
    perChord: MOBILE ? 18 : 30,
    samples: MOBILE ? 0 : 4,
    bloomDiv: 4
  };

  var R_RING = 40;      /* booths */
  var R_PIT = 16;       /* the empty tank */
  var PIT_Y = -9;
  var LEG_H = 6.4;
  var NB = 7;
  var TAU = Math.PI * 2;

  /* ─── renderer ──────────────────────────────────────────────────── */
  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas, antialias: false, alpha: false,
      powerPreference: "high-performance", stencil: false
    });
  } catch (e) { return; }

  var DPR = Math.min(window.devicePixelRatio || 1, CFG.dprCap);
  renderer.setPixelRatio(DPR);
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.sortObjects = true;

  var COL = {
    sodium: new THREE.Color(0xff8a2b),
    gilt: new THREE.Color(0xe0b457),
    mercury: new THREE.Color(0x6ff2c4),
    carmine: new THREE.Color(0xff2d55),
    bone: new THREE.Color(0xf4eada),
    ink: new THREE.Color(0x0a0711),
    night: new THREE.Color(0x07050d),
    concrete: new THREE.Color(0x241a30),
    tile: new THREE.Color(0x1a1426)
  };
  var CHAN = [COL.sodium, COL.mercury, COL.carmine, COL.gilt];

  var scene = new THREE.Scene();
  scene.background = COL.night.clone();
  var camera = new THREE.PerspectiveCamera(CFG.fov, 1, 0.4, 460);

  /* ─── shared uniform objects, referenced by every material ──────── */
  var U = {
    time: { value: 0 },
    chan: { value: COL.sodium.clone() },
    chan2: { value: COL.gilt.clone() },
    expo: { value: 1 },
    fogK: { value: 0.000105 },
    night: { value: COL.night.clone() },
    ptr: { value: new THREE.Vector3(0, 4, -30) },
    ptrAmt: { value: 0 },
    kick: { value: 0 },
    expoLine: { value: 1 },
    hot: { value: -1 },
    hotAmt: { value: 0 },
    lock: { value: 0 },
    beam: { value: 1 },      /* per-station beam intensity            */
    warp: { value: 0 },      /* pointer distortion on the carousel    */
    rev: { value: 1 }        /* which way the bulb chase runs         */
  };

  /* ═══════════════ shader chunks ═══════════════════════════════════ */

  var NOISE = [
    /* The floor is 300 units across, so the lattice index reaches the
       hundreds and the usual fract(p.x*p.y) hash multiplies its way past
       float32's fractional range — which shows up as flat blocks the size
       of a car. This hash keeps every intermediate small, and the lattice
       index is wrapped so the inputs never grow at all. */
    "float h21(vec2 p){",
    "  vec3 p3 = fract(vec3(p.xyx) * 0.1031);",
    "  p3 += dot(p3, p3.yzx + 33.33);",
    "  return fract((p3.x + p3.y) * p3.z);",
    "}",
    "float vnoise(vec2 p){",
    "  vec2 i = mod(floor(p), 289.0), f = fract(p);",
    "  vec2 u = f*f*f*(f*(f*6.0-15.0)+10.0);",              /* quintic: no lattice creases */
    "  return mix(mix(h21(i), h21(i+vec2(1.0,0.0)), u.x),",
    "             mix(h21(i+vec2(0.0,1.0)), h21(i+vec2(1.0,1.0)), u.x), u.y);",
    "}",
    /* rotate between octaves, or the value lattice reads as a chequerboard
       the moment it is stretched across a floor this large */
    "float fbm(vec2 p){",
    "  const mat2 R = mat2(0.80, 0.60, -0.60, 0.80);",
    "  float a = 0.5, s = 0.0;",
    "  p = R * p;",                                  /* the first octave too, or the
                                                        lattice sits on the world axes */
    "  for(int i=0;i<5;i++){ s += a * vnoise(p); p = R * p * 2.07; a *= 0.5; }",
    "  return s;",
    "}"
  ].join("\n");

  var FOG_FN = [
    "vec3 nightFog(vec3 col, vec3 wpos, float k, vec3 night){",
    "  float d = length(wpos - cameraPosition);",
    "  float f = clamp(1.0 - exp(-k * d * d), 0.0, 1.0);",
    "  return mix(col, night, f);",
    "}",
    "float fogFade(vec3 wpos, float k){",
    "  float d = length(wpos - cameraPosition);",
    "  return clamp(exp(-k * d * d), 0.0, 1.0);",
    "}"
  ].join("\n");

  /* One definition of where a mask actually is, used by the masks and by
     the shadows they throw, so the two can never drift apart. */
  var MASK_MOVE = [
    "vec3 maskCentre(vec3 c, float seed, float turn, float sc, vec3 ptr, float amt, float t){",
    "  float bob = sin(t * 0.5 + seed * 12.6) * 0.24;",
    "  vec3 to = ptr - c;",
    "  float dd = length(to);",
    /* a mask the size of a door does not get dragged across the hall by a
       cursor — weight the pull against its own scale */
    "  float heavy = 1.0 / (1.0 + sc * sc * 0.62);",
    "  float pull = amt * exp(-dd * dd * 0.0016) * turn * heavy;",
    "  vec3 dir = to / max(dd, 0.001);",
    "  vec3 tang = normalize(cross(dir, vec3(0.0, 1.0, 0.0)) + vec3(0.001));",
    "  return c + vec3(0.0, bob, 0.0)",
    "       + dir * pull * min(dd * 0.42, 5.4)",
    "       + tang * pull * 3.1 * sin(t * 0.7 + seed * 6.2831);",
    "}"
  ].join("\n");

  var WORLD_VERT = [
    "varying vec3 vW;",
    "varying vec2 vU;",
    "void main(){",
    "  vU = uv;",
    "  vec4 w = modelMatrix * vec4(position, 1.0);",
    "  vW = w.xyz;",
    "  gl_Position = projectionMatrix * viewMatrix * w;",
    "}"
  ].join("\n");

  /* ─── the ground: deck, pit floor, pit wall ─────────────────────── */
  function groundMat(tint, kind) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: U.time, uChan: U.chan, uExpo: U.expo, uFogK: U.fogK,
        uNight: U.night, uPtr: U.ptr, uPtrAmt: U.ptrAmt, uLock: U.lock,
        uTint: { value: tint.clone() }, uKind: { value: kind },
        uMerc: { value: COL.mercury.clone() }
      },
      vertexShader: WORLD_VERT,
      fragmentShader: [
        "precision highp float;",
        "uniform float uTime, uExpo, uFogK, uPtrAmt, uKind, uLock;",
        "uniform vec3 uChan, uNight, uTint, uPtr, uMerc;",
        "varying vec3 vW;",
        "varying vec2 vU;",
        NOISE, FOG_FN,
        "void main(){",
        "  vec2 p = mix(vW.xz, vec2(atan(vW.z, vW.x) * 9.0, vW.y * 2.2), uKind);",
        "  float grit = fbm(p * 0.42);",
        /* break the puddle contour with the high-frequency grit, or the
           value lattice reads as flat panels across a floor this wide */
        "  float wet = smoothstep(0.26, 0.88, fbm(p * 0.19 + 21.0) + (grit - 0.5) * 0.42);",
        "  vec3 base = uTint * (0.30 + grit * 0.46);",
        /* tile grout on the pit wall */
        "  vec2 g = abs(fract(p * vec2(0.62, 1.4)) - 0.5);",
        "  float grout = (1.0 - smoothstep(0.40, 0.49, max(g.x, g.y))) ;",
        "  base *= mix(1.0, 0.55 + grout * 0.75, uKind);",
        /* light pools: the bulb ring above the booths, and the pit mouth */
        "  float r = length(vW.xz);",
        "  float ring = exp(-pow((r - 40.0) * 0.062, 2.0));",
        "  float mouth = exp(-pow((r - 16.0) * 0.10, 2.0));",
        "  float mid = exp(-pow(r * 0.045, 2.0));",
        /* sodium from the ring above, mercury out of the tank: the two
           lights the building has, and they never agree */
        "  vec3 lamp = uChan * (ring * 0.92 + mid * 0.12)",
        "            + uMerc * (mouth * 0.52 + mid * 0.34);",
        /* the null pushes rings through the standing water */
        "  float d = length(vW.xz - uPtr.xz);",
        "  float rip = sin(d * 0.52 - uTime * 2.2) * exp(-d * 0.052) * uPtrAmt;",
        "  lamp += uChan * max(0.0, rip) * 0.50;",
        "  vec3 col = base + lamp * (0.56 + wet * 0.60);",
        "  col += uChan * pow(wet, 2.4) * 0.045;",
        "  col = mix(col, col * vec3(0.34, 0.72, 0.62), uLock * 0.75);",
        /* the concrete under your feet is unlit — the pools belong to the
           middle distance, which is what makes the room feel like a room */
        "  float near = smoothstep(2.5, 27.0, length(vW - cameraPosition));",
        "  col *= 0.13 + 0.87 * near;",
        "  col = nightFog(col, vW, uFogK, uNight);",
        "  gl_FragColor = vec4(col * uExpo, 1.0);",
        "}"
      ].join("\n"),
      fog: false
    });
  }

  var deckGeo = new THREE.RingGeometry(R_PIT, 150, 108, 1);
  deckGeo.rotateX(-Math.PI / 2);
  var deck = new THREE.Mesh(deckGeo, groundMat(COL.concrete, 0));
  deck.renderOrder = 0;
  scene.add(deck);

  var pitGeo = new THREE.PlaneGeometry(38, 38, 1, 1);
  pitGeo.rotateX(-Math.PI / 2);
  var pitFloor = new THREE.Mesh(pitGeo, groundMat(COL.tile, 0));
  pitFloor.position.y = PIT_Y;
  scene.add(pitFloor);

  var wallGeo = new THREE.CylinderGeometry(R_PIT, R_PIT, -PIT_Y, 72, 1, true);
  var wallMat = groundMat(COL.tile, 1);
  wallMat.side = THREE.BackSide;
  var pitWall = new THREE.Mesh(wallGeo, wallMat);
  pitWall.position.y = PIT_Y / 2;
  scene.add(pitWall);

  /* ─── booths: arches, legs, portals ─────────────────────────────── */
  var boothPos = [];
  var boothBasis = [];
  var _T = new THREE.Vector3(), _N = new THREE.Vector3(), _UP = new THREE.Vector3(0, 1, 0);
  for (var b = 0; b < NB; b++) {
    var th = (b / NB) * TAU;
    boothPos.push(new THREE.Vector3(Math.cos(th) * R_RING, 0, Math.sin(th) * R_RING));
    var T = new THREE.Vector3(-Math.sin(th), 0, Math.cos(th));
    var N = new THREE.Vector3().crossVectors(T, _UP);
    boothBasis.push(new THREE.Matrix4().makeBasis(T, _UP.clone(), N));
  }

  var archMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: U.time, uChan: U.chan, uExpo: U.expo, uFogK: U.fogK,
      uNight: U.night, uHot: U.hot, uHotAmt: U.hotAmt, uLock: U.lock,
      uGilt: { value: COL.gilt.clone() }, uInk: { value: COL.ink.clone() }
    },
    vertexShader: [
      "attribute float aIdx;",
      "varying vec3 vW; varying vec3 vN; varying float vIdx;",
      "void main(){",
      "  vIdx = aIdx;",
      "  vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0);",
      "  vW = w.xyz;",
      "  vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);",
      "  gl_Position = projectionMatrix * viewMatrix * w;",
      "}"
    ].join("\n"),
    fragmentShader: [
      "precision highp float;",
      "uniform float uTime, uExpo, uFogK, uHot, uHotAmt, uLock;",
      "uniform vec3 uChan, uNight, uGilt, uInk;",
      "varying vec3 vW; varying vec3 vN; varying float vIdx;",
      FOG_FN,
      "void main(){",
      "  vec3 v = normalize(cameraPosition - vW);",
      "  float rim = 1.0 - abs(dot(normalize(vN), v));",
      "  float hot = (1.0 - step(0.5, abs(vIdx - uHot))) * uHotAmt;",
      "  vec3 edge = mix(uGilt, uChan, 0.35 + hot * 0.55);",
      "  vec3 col = uInk * 0.55 + edge * pow(rim, 1.6) * (1.00 + hot * 1.9);",
      "  col += uChan * pow(rim, 5.0) * 0.55 * (0.5 + hot);",
      "  col = mix(col, col * vec3(0.30, 0.70, 0.60), uLock * 0.7);",
      "  col = nightFog(col, vW, uFogK, uNight);",
      "  gl_FragColor = vec4(col * uExpo, 1.0);",
      "}"
    ].join("\n"),
    fog: false
  });

  function idxAttr(geo, n, get) {
    var a = new Float32Array(n);
    for (var i = 0; i < n; i++) a[i] = get(i);
    geo.setAttribute("aIdx", new THREE.InstancedBufferAttribute(a, 1));
  }

  var _m = new THREE.Matrix4();
  var _pos = new THREE.Vector3();

  var archGeo = new THREE.TorusGeometry(6.8, 0.34, 8, 52, Math.PI);
  idxAttr(archGeo, NB, function (i) { return i; });
  var arches = new THREE.InstancedMesh(archGeo, archMat, NB);
  arches.frustumCulled = false;
  for (var i = 0; i < NB; i++) {
    _m.copy(boothBasis[i]);
    _m.setPosition(boothPos[i].x, LEG_H, boothPos[i].z);
    arches.setMatrixAt(i, _m);
  }
  arches.instanceMatrix.needsUpdate = true;
  scene.add(arches);

  var legGeo = new THREE.CylinderGeometry(0.28, 0.40, LEG_H, 8, 1);
  idxAttr(legGeo, NB * 2, function (i) { return Math.floor(i / 2); });
  var legs = new THREE.InstancedMesh(legGeo, archMat, NB * 2);
  legs.frustumCulled = false;
  for (var L = 0; L < NB; L++) {
    var TT = new THREE.Vector3().setFromMatrixColumn(boothBasis[L], 0);
    for (var s2 = 0; s2 < 2; s2++) {
      var off = (s2 ? 6.8 : -6.8);
      _m.identity().setPosition(
        boothPos[L].x + TT.x * off, LEG_H / 2, boothPos[L].z + TT.z * off);
      legs.setMatrixAt(L * 2 + s2, _m);
    }
  }
  legs.instanceMatrix.needsUpdate = true;
  scene.add(legs);

  /* portals — a hole punched through the back of every booth */
  var portalMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: U.time, uChan: U.chan, uChan2: U.chan2, uExpo: U.expo,
      uFogK: U.fogK, uHot: U.hot, uHotAmt: U.hotAmt, uLock: U.lock,
      uMerc: { value: COL.mercury.clone() }
    },
    vertexShader: [
      "attribute float aIdx;",
      "varying vec2 vU; varying vec3 vW; varying float vIdx;",
      "void main(){",
      "  vU = uv; vIdx = aIdx;",
      "  vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0);",
      "  vW = w.xyz;",
      "  gl_Position = projectionMatrix * viewMatrix * w;",
      "}"
    ].join("\n"),
    fragmentShader: [
      "precision highp float;",
      "uniform float uTime, uExpo, uFogK, uHot, uHotAmt, uLock;",
      "uniform vec3 uChan, uChan2, uMerc;",
      "varying vec2 vU; varying vec3 vW; varying float vIdx;",
      FOG_FN,
      "void main(){",
      "  vec2 p = vU * 2.0 - 1.0;",
      "  float r = length(p);",
      "  if (r > 1.0) discard;",
      "  float a = atan(p.y, p.x);",
      "  float hot = (1.0 - step(0.5, abs(vIdx - uHot))) * uHotAmt;",
      "  float spin = uTime * (0.34 + hot * 0.5) + vIdx * 1.7;",
      "  float sw = sin(a * 3.0 + spin - r * 6.2) * 0.5 + 0.5;",
      "  float sw2 = sin(a * 5.0 - spin * 0.7 + r * 3.1) * 0.5 + 0.5;",
      "  float core = pow(1.0 - r, 2.8);",
      /* concentric shutters and radial spokes: an aperture, not a fog ball */
      "  float rings = pow(max(0.0, sin(r * 15.0 - spin * 1.6)), 6.0) * (1.0 - r);",
      "  float spokes = pow(max(0.0, sin(a * 7.0 + spin * 0.8)), 8.0) * (1.0 - r) * r;",
      "  vec3 tint = mix(uChan, uMerc, 0.30 + hot * 0.30);",
      "  vec3 col = tint * (core * 0.55 + rings * 0.85 + spokes * 0.7);",
      "  col *= 0.75 + 0.45 * (sw * 0.6 + sw2 * 0.4);",
      "  float rim = pow(max(0.0, 1.0 - abs(r - 0.94) * 22.0), 2.0);",
      "  col += mix(uChan2, uMerc, 0.35 + hot * 0.5) * rim * (1.25 + hot * 1.1);",
      "  col = mix(col, col.gbr, uLock * 0.8);",
      "  float alpha = (core * 0.42 + rings * 0.55 + spokes * 0.4 + rim * 1.0)",
      "              * (0.72 + hot * 0.55);",
      "  gl_FragColor = vec4(col * uExpo, alpha * fogFade(vW, uFogK));",
      "}"
    ].join("\n"),
    transparent: true, blending: THREE.AdditiveBlending,
    depthTest: true, depthWrite: false, side: THREE.DoubleSide, fog: false
  });

  var portalGeo = new THREE.CircleGeometry(6.2, 54);
  idxAttr(portalGeo, NB, function (i) { return i; });
  var portals = new THREE.InstancedMesh(portalGeo, portalMat, NB);
  portals.frustumCulled = false;
  portals.renderOrder = 10;
  for (var q = 0; q < NB; q++) {
    _m.copy(boothBasis[q]);
    _m.setPosition(boothPos[q].x, 6.6, boothPos[q].z);
    portals.setMatrixAt(q, _m);
  }
  portals.instanceMatrix.needsUpdate = true;
  scene.add(portals);

  /* ─── bulb wire: a ring round the booths and a heptagram across ─── */
  var wirePts = [];
  var bulbPos = [];
  var bulbMeta = [];

  function span(A, B, n, hi, sag, kind) {
    var prev = null;
    for (var t = 0; t <= n; t++) {
      var u = t / n;
      var x = A.x + (B.x - A.x) * u;
      var z = A.z + (B.z - A.z) * u;
      var y = hi - sag * 4 * u * (1 - u);
      var P = new THREE.Vector3(x, y, z);
      if (prev) { wirePts.push(prev.x, prev.y, prev.z, P.x, P.y, P.z); }
      prev = P;
      if (t < n) { bulbPos.push(x, y, z); bulbMeta.push(Math.random(), kind, t); }
    }
  }

  for (var w1 = 0; w1 < NB; w1++) {
    span(boothPos[w1], boothPos[(w1 + 1) % NB], CFG.perSpan, 15.8, 3.6, 0);
  }
  for (var w2 = 0; w2 < NB; w2++) {
    span(boothPos[w2], boothPos[(w2 + 3) % NB], CFG.perChord, 22.0, 8.6, 1);
  }

  var wireGeo = new THREE.BufferGeometry();
  wireGeo.setAttribute("position", new THREE.Float32BufferAttribute(wirePts, 3));
  var wire = new THREE.LineSegments(wireGeo, new THREE.LineBasicMaterial({
    color: 0x241b33, transparent: true, opacity: 0.85, depthWrite: false, fog: false
  }));
  wire.renderOrder = 14;
  wire.frustumCulled = false;
  scene.add(wire);

  var nBulb = bulbPos.length / 3;
  var bulbGeo = new THREE.BufferGeometry();
  bulbGeo.setAttribute("position", new THREE.Float32BufferAttribute(bulbPos, 3));
  var bSeed = new Float32Array(nBulb), bKind = new Float32Array(nBulb), bIx = new Float32Array(nBulb);
  for (var bi = 0; bi < nBulb; bi++) {
    bSeed[bi] = bulbMeta[bi * 3];
    bKind[bi] = bulbMeta[bi * 3 + 1];
    bIx[bi] = bulbMeta[bi * 3 + 2];
  }
  bulbGeo.setAttribute("aSeed", new THREE.BufferAttribute(bSeed, 1));
  bulbGeo.setAttribute("aKind", new THREE.BufferAttribute(bKind, 1));
  bulbGeo.setAttribute("aIx", new THREE.BufferAttribute(bIx, 1));

  var bulbMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: U.time, uChan: U.chan, uExpo: U.expoLine, uFogK: U.fogK,
      uKick: U.kick, uLock: U.lock, uDpr: { value: DPR }, uRev: U.rev,
      uGilt: { value: COL.gilt.clone() }, uBone: { value: COL.bone.clone() }
    },
    vertexShader: [
      "attribute float aSeed; attribute float aKind; attribute float aIx;",
      "uniform float uTime, uKick, uDpr, uRev;",
      "varying float vLit; varying float vKind;",
      "void main(){",
      "  vKind = aKind;",
      "  vec4 w = modelMatrix * vec4(position, 1.0);",
      "  vec4 mv = viewMatrix * w;",
      /* a slow chase along the wire, plus a per-bulb worn flicker */
      "  float chase = 0.55 + 0.45 * sin(aIx * 0.62 - uTime * 2.1 * uRev + aKind * 2.0);",
      "  float flick = 0.80 + 0.20 * sin(uTime * 3.1 + aSeed * 39.0);",
      "  float dud = step(0.045, fract(aSeed * 17.3));",
      "  vLit = chase * flick * dud * (0.75 + uKick * 0.45);",
      "  gl_PointSize = clamp((mix(150.0, 118.0, aKind) * uDpr) / max(0.1, -mv.z), 1.0, 46.0 * uDpr);",
      "  gl_Position = projectionMatrix * mv;",
      "}"
    ].join("\n"),
    fragmentShader: [
      "precision highp float;",
      "uniform vec3 uChan, uGilt, uBone;",
      "uniform float uExpo, uLock;",
      "varying float vLit; varying float vKind;",
      "void main(){",
      "  float d = length(gl_PointCoord - 0.5);",
      "  if (d > 0.5) discard;",
      "  float core = 1.0 - smoothstep(0.0, 0.17, d);",
      "  float halo = exp(-d * 8.5);",
      "  vec3 warm = mix(uGilt, uBone, 0.35);",
      "  vec3 col = warm * core + mix(uChan, uGilt, 0.5) * halo * 0.85;",
      "  col = mix(col, col.gbr, uLock * 0.85);",
      "  gl_FragColor = vec4(col * uExpo, (core * 0.95 + halo * 0.55) * vLit);",
      "}"
    ].join("\n"),
    transparent: true, blending: THREE.AdditiveBlending,
    depthTest: true, depthWrite: false, fog: false
  });
  var bulbs = new THREE.Points(bulbGeo, bulbMat);
  bulbs.renderOrder = 20;
  bulbs.frustumCulled = false;
  scene.add(bulbs);

  /* --- searchlight beams: seven rigs sweeping the hall ------------- */
  var beamGeo = new THREE.CylinderGeometry(0.30, 6.2, 27, 14, 1, true);
  beamGeo.translate(0, -13.5, 0);            /* hang from the mount point */
  idxAttr(beamGeo, NB, function (i) { return i; });

  var beamMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: U.time, uChan: U.chan, uExpo: U.expoLine, uFogK: U.fogK,
      uHot: U.hot, uHotAmt: U.hotAmt, uBeam: U.beam, uLock: U.lock,
      uGilt: { value: COL.gilt.clone() }
    },
    vertexShader: [
      "attribute float aIdx;",
      "varying vec2 vU; varying vec3 vW; varying float vIdx;",
      "void main(){",
      "  vU = uv; vIdx = aIdx;",
      "  vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0);",
      "  vW = w.xyz;",
      "  gl_Position = projectionMatrix * viewMatrix * w;",
      "}"
    ].join("\n"),
    fragmentShader: [
      "precision highp float;",
      "uniform float uTime, uExpo, uFogK, uHot, uHotAmt, uBeam, uLock;",
      "uniform vec3 uChan, uGilt;",
      "varying vec2 vU; varying vec3 vW; varying float vIdx;",
      FOG_FN,
      "void main(){",
      "  float hot = (1.0 - step(0.5, abs(vIdx - uHot))) * uHotAmt;",
      "  float along = pow(vU.y, 1.9);",
      "  float across = abs(vU.x * 2.0 - 1.0);",
      "  float edge = smoothstep(0.55, 1.0, across) * 0.7 + 0.3;",
      "  float flick = 0.86 + 0.14 * sin(uTime * 7.3 + vIdx * 11.0);",
      "  vec3 col = mix(uChan, uGilt, 0.35 + hot * 0.4);",
      "  float a = along * edge * flick * uBeam * (0.125 + hot * 0.11);",
      /* the sweep will walk a cone straight through the camera; without
         this the whole frame detonates white for a second */
      "  a *= smoothstep(2.5, 15.0, length(vW - cameraPosition));",
      "  col = mix(col, col.gbr, uLock * 0.85);",
      "  gl_FragColor = vec4(col * uExpo, a * fogFade(vW, uFogK));",
      "}"
    ].join("\n"),
    transparent: true, blending: THREE.AdditiveBlending,
    depthTest: true, depthWrite: false, side: THREE.DoubleSide, fog: false
  });

  var beams = new THREE.InstancedMesh(beamGeo, beamMat, NB);
  beams.frustumCulled = false;
  beams.renderOrder = 11;
  scene.add(beams);
  var beamMount = [];
  for (var bm = 0; bm < NB; bm++) {
    beamMount.push(new THREE.Vector3(boothPos[bm].x * 0.80, 15.6, boothPos[bm].z * 0.80));
  }

  /* --- impossible signage: a named board over every booth ---------- */
  var signCan = document.createElement("canvas");
  signCan.width = 1024; signCan.height = 1024;
  var SIGN_TEXT = [
    "THE FACE EXCHANGE", "HALL OF DISAGREEING MIRRORS", "ALWAYS A WINNER",
    "THE LISTENING RANGE", "DEEP END CAROUSEL", "THE ORACLE STUB",
    "NO EXIT THIS WAY"
  ];
  var signTex = new THREE.CanvasTexture(signCan);
  signTex.minFilter = THREE.LinearFilter;
  signTex.generateMipmaps = false;
  signTex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

  function drawSigns() {
    var c = signCan.getContext("2d");
    c.clearRect(0, 0, 1024, 1024);
    c.textAlign = "center";
    c.textBaseline = "middle";
    for (var i = 0; i < 7; i++) {
      var y = i * 128 + 64;
      c.strokeStyle = "rgba(224,180,87,0.55)";
      c.lineWidth = 3;
      c.strokeRect(14, y - 50, 996, 100);
      c.fillStyle = "#E0B457";
      for (var bx = 40; bx < 1000; bx += 42) {
        c.beginPath(); c.arc(bx, y - 50, 4.5, 0, 7); c.fill();
        c.beginPath(); c.arc(bx, y + 50, 4.5, 0, 7); c.fill();
      }
      c.font = "700 54px 'Bodoni Moda', Georgia, serif";
      c.fillStyle = "#F4EADA";
      c.fillText(SIGN_TEXT[i], 512, y + 2);
    }
    signTex.needsUpdate = true;
  }
  drawSigns();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawSigns);

  var signGeo = new THREE.PlaneGeometry(10.2, 1.28);
  idxAttr(signGeo, NB, function (i) { return i; });
  var signMat = new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: signTex }, uTime: U.time, uChan: U.chan, uExpo: U.expoLine,
      uFogK: U.fogK, uHot: U.hot, uHotAmt: U.hotAmt, uLock: U.lock
    },
    vertexShader: [
      "attribute float aIdx;",
      "varying vec2 vU; varying vec3 vW; varying float vIdx;",
      "void main(){",
      "  vU = uv; vIdx = aIdx;",
      "  vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0);",
      "  vW = w.xyz;",
      "  gl_Position = projectionMatrix * viewMatrix * w;",
      "}"
    ].join("\n"),
    fragmentShader: [
      "precision highp float;",
      "uniform sampler2D uMap; uniform vec3 uChan;",
      "uniform float uTime, uExpo, uFogK, uHot, uHotAmt, uLock;",
      "varying vec2 vU; varying vec3 vW; varying float vIdx;",
      FOG_FN,
      "void main(){",
      "  vec2 uvv = vec2(vU.x, (vIdx + 1.0 - vU.y) / 8.0);",
      "  vec4 t = texture2D(uMap, uvv);",
      "  if (t.a < 0.02) discard;",
      "  float hot = (1.0 - step(0.5, abs(vIdx - uHot))) * uHotAmt;",
      "  float buzz = 0.72 + 0.28 * sin(uTime * 2.1 + vIdx * 4.7);",
      "  buzz *= 0.86 + 0.14 * sin(uTime * 23.0 + vIdx * 9.0);",
      "  vec3 col = mix(t.rgb, uChan, 0.34 + hot * 0.4) * (0.75 + hot * 1.25) * buzz;",
      "  col = mix(col, col.gbr, uLock * 0.85);",
      "  gl_FragColor = vec4(col * uExpo, t.a * (0.62 + hot * 0.38) * fogFade(vW, uFogK));",
      "}"
    ].join("\n"),
    transparent: true, blending: THREE.AdditiveBlending,
    depthTest: true, depthWrite: false, side: THREE.DoubleSide, fog: false
  });
  var signs = new THREE.InstancedMesh(signGeo, signMat, NB);
  signs.frustumCulled = false;
  signs.renderOrder = 22;
  for (var sg = 0; sg < NB; sg++) {
    _m.copy(boothBasis[sg]);
    _m.setPosition(boothPos[sg].x, LEG_H + 4.7, boothPos[sg].z);
    signs.setMatrixAt(sg, _m);
  }
  signs.instanceMatrix.needsUpdate = true;
  scene.add(signs);

  /* --- the tank lip reads itself out loud -------------------------- */
  var tickCan = document.createElement("canvas");
  tickCan.width = 2048; tickCan.height = 64;
  var tickTex = new THREE.CanvasTexture(tickCan);
  tickTex.wrapS = THREE.RepeatWrapping;
  tickTex.repeat.x = 4;
  tickTex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

  function drawTicker() {
    var c = tickCan.getContext("2d");
    c.clearRect(0, 0, 2048, 64);
    c.font = "700 34px 'Space Mono', monospace";
    c.textBaseline = "middle";
    c.fillStyle = "#F4EADA";
    var msg = "STAND STILL  \u25C6  THE LIGHTS ARE OURS  \u25C6  EXCHANGE BEFORE 03:00  \u25C6  ";
    var x = 0;
    while (x < 2048) { c.fillText(msg, x, 34); x += c.measureText(msg).width; }
    tickTex.needsUpdate = true;
  }
  drawTicker();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawTicker);

  var tickMat = new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: tickTex }, uTime: U.time, uChan: U.chan,
      uExpo: U.expoLine, uFogK: U.fogK, uLock: U.lock
    },
    vertexShader: WORLD_VERT,
    fragmentShader: [
      "precision highp float;",
      "uniform sampler2D uMap; uniform vec3 uChan;",
      "uniform float uTime, uExpo, uFogK, uLock;",
      "varying vec2 vU; varying vec3 vW;",
      FOG_FN,
      "void main(){",
      "  vec4 t = texture2D(uMap, vU);",
      "  if (t.a < 0.03) discard;",
      "  vec3 col = mix(uChan, vec3(1.0), 0.34) * (0.5 + 0.5 * sin(uTime * 1.4 + vU.x * 18.0));",
      "  col = mix(col, col.gbr, uLock * 0.85);",
      "  gl_FragColor = vec4(col * uExpo, t.a * 0.5 * fogFade(vW, uFogK));",
      "}"
    ].join("\n"),
    transparent: true, blending: THREE.AdditiveBlending,
    depthTest: true, depthWrite: false, side: THREE.DoubleSide, fog: false
  });
  var ticker = new THREE.Mesh(
    new THREE.CylinderGeometry(R_PIT + 0.35, R_PIT + 0.35, 1.15, 96, 1, true), tickMat);
  ticker.position.y = -0.72;
  ticker.renderOrder = 18;
  ticker.frustumCulled = false;
  scene.add(ticker);

  /* ─── masks — the signature object ──────────────────────────────── */
  var maskGeo = new THREE.PlaneGeometry(1, 1);
  var NM = CFG.masks;
  var mSeed = new Float32Array(NM), mArche = new Float32Array(NM),
      mTurn = new Float32Array(NM), mTint = new Float32Array(NM * 3);
  var masks = null;

  var maskMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: U.time, uChan: U.chan, uExpo: U.expoLine, uFogK: U.fogK,
      uPtr: U.ptr, uPtrAmt: U.ptrAmt, uKick: U.kick, uLock: U.lock,
      uBone: { value: COL.bone.clone() }
    },
    vertexShader: [
      "attribute float aSeed; attribute float aArche; attribute float aTurn;",
      "attribute vec3 aTint;",
      "uniform vec3 uPtr; uniform float uPtrAmt, uTime;",
      MASK_MOVE,
      "varying vec2 vU; varying float vSeed, vArche, vFace; varying vec3 vTint; varying vec3 vW;",
      "void main(){",
      "  vU = uv; vSeed = aSeed; vArche = aArche; vTint = aTint;",
      "  mat4 im = instanceMatrix;",
      "  vec4 home = modelMatrix * im * vec4(0.0, 0.0, 0.0, 1.0);",
      /* the null does not just turn the masks, it draws them out of the
         crowd and swings them round its rim */
      "  vec3 ctr = maskCentre(home.xyz, aSeed, aTurn, length(im[0].xyz), uPtr, uPtrAmt, uTime);",
      "  vec4 wc = vec4(ctr, 1.0);",
      "  float sx = length(im[0].xyz);",
      "  float sy = length(im[1].xyz);",
      "  vec3 toCam = normalize(cameraPosition - wc.xyz);",
      "  vec3 toPtr = normalize(uPtr - wc.xyz);",
      "  float near = exp(-dot(uPtr - wc.xyz, uPtr - wc.xyz) * 0.0022);",
      "  float k = clamp(uPtrAmt * aTurn * near * 2.2, 0.0, 1.0);",
      "  vec3 fwd = normalize(mix(toCam, toPtr, k));",
      "  vFace = k;",
      /* guard the degenerate basis: parallel to world up gives NaN */
      "  vec3 wup = abs(fwd.y) > 0.985 ? vec3(0.0, 0.0, 1.0) : vec3(0.0, 1.0, 0.0);",
      "  vec3 right = normalize(cross(wup, fwd));",
      "  vec3 up = cross(fwd, right);",
      "  float sway = sin(uTime * 0.62 + aSeed * 6.2831) * 0.10 + k * 0.12;",
      "  float c = cos(sway), s = sin(sway);",
      "  vec3 r2 = right * c + up * s;",
      "  vec3 u2 = up * c - right * s;",
      "  vec3 wp = wc.xyz + r2 * (position.x * sx) + u2 * (position.y * sy);",
      "  vW = wp;",
      "  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);",
      "}"
    ].join("\n"),
    fragmentShader: [
      "precision highp float;",
      "uniform vec3 uChan, uBone; uniform float uExpo, uFogK, uKick, uTime, uLock;",
      "varying vec2 vU; varying float vSeed, vArche, vFace; varying vec3 vTint; varying vec3 vW;",
      FOG_FN,
      "float sdEll(vec2 p, vec2 r){",
      "  float k1 = length(p / r);",
      "  float k2 = length(p / (r * r));",
      "  return k1 * (k1 - 1.0) / max(k2, 1e-5);",
      "}",
      /* A carnival mask, not a face: pointed chin, scalloped crown, and
         slanted almond voids where the eyes are not. The slant is what
         keeps it uncanny — level round eyes read as an animal. */
      "float maskSDF(vec2 p, float a){",
      "  vec2 q = p;",
      "  q.x *= 1.0 + max(0.0, -q.y) * mix(1.45, 0.78, a);",   /* taper to the chin */
      "  q.x *= 1.0 - max(0.0,  q.y) * mix(0.12, 0.32, a);",   /* widen at the brow */
      "  float face = sdEll(q, vec2(mix(0.245, 0.325, a), mix(0.455, 0.390, a)));",
      "  float ang = atan(p.x, p.y);",
      "  float crown = cos(ang * mix(4.0, 6.0, a)) * mix(0.018, 0.032, a)",
      "              * smoothstep(0.02, 0.30, p.y);",
      "  float d = face - crown;",
      "  vec2 ep = vec2(abs(p.x) - mix(0.116, 0.142, a), p.y - 0.085);",
      "  float ca = 0.940, sa = 0.342;",                       /* ~20 deg, outward-down */
      "  ep = vec2(ep.x * ca - ep.y * sa, ep.x * sa + ep.y * ca);",
      "  float eye = sdEll(ep, vec2(mix(0.088, 0.068, a), mix(0.029, 0.043, a)));",
      "  d = max(d, -eye);",
      "  vec2 tp = vec2(abs(p.x) - mix(0.205, 0.268, a), p.y - 0.045);",
      "  float tie = sdEll(tp, vec2(0.013, 0.013));",          /* the string holes */
      "  d = max(d, -tie);",
      "  return d;",
      "}",
      "void main(){",
      "  vec2 p = vU - 0.5;",
      "  float d = maskSDF(p, vArche);",
      "  float aa = fwidth(d) + 1e-5;",
      "  float shell = abs(d) - 0.011;",
      "  float rim = 1.0 - smoothstep(-aa, aa, shell);",
      "  float fill = 1.0 - smoothstep(-aa, aa, d);",
      "  if (rim + fill < 0.004) discard;",
      "  float flick = 0.78 + 0.22 * sin(uTime * 1.6 + vSeed * 21.0);",
      "  vec3 face = mix(vTint, uChan, 0.30 + vFace * 0.55);",
      "  vec3 col = face * rim * (0.85 + vFace * 1.5 + uKick * 0.22)",
      "           + uChan * fill * 0.085;",
      "  col = mix(col, col.gbr, uLock * 0.9);",
      "  float alpha = (rim * 0.92 + fill * 0.07) * flick * (0.5 + vFace * 0.8);",
      /* A mask on the lens is a glowing ball, not a mask — the pull can walk
         one right up to the camera, so give them all a near clip the same
         way the haze has one. */
      "  alpha *= smoothstep(3.0, 13.0, length(vW - cameraPosition));",
      "  gl_FragColor = vec4(col * uExpo, alpha * fogFade(vW, uFogK));",
      "}"
    ].join("\n"),
    transparent: true, blending: THREE.AdditiveBlending,
    depthTest: true, depthWrite: false, side: THREE.DoubleSide, fog: false
  });

  (function buildMasks() {
    var _q = new THREE.Quaternion(), _s = new THREE.Vector3();
    maskGeo.setAttribute("aSeed", new THREE.InstancedBufferAttribute(mSeed, 1));
    maskGeo.setAttribute("aArche", new THREE.InstancedBufferAttribute(mArche, 1));
    maskGeo.setAttribute("aTurn", new THREE.InstancedBufferAttribute(mTurn, 1));
    maskGeo.setAttribute("aTint", new THREE.InstancedBufferAttribute(mTint, 3));
    masks = new THREE.InstancedMesh(maskGeo, maskMat, NM);
    masks.frustumCulled = false;
    masks.renderOrder = 30;

    var tints = [COL.bone, COL.gilt, COL.mercury, COL.sodium, COL.carmine];
    for (var i = 0; i < NM; i++) {
      var a = Math.random() * TAU;
      /* a loose band around the ring, thinning toward the pit */
      var band = Math.random();
      /* Three shoals, all of them clear of the camera's own orbit (r 8-21):
         a crowd out past the booths, a drift down inside the empty tank
         where the camera never goes, and a few large ones just outside the
         orbit that pass close without ever landing on the lens. */
      var rr = 27 + Math.random() * 31;
      var y = 1.2 + Math.pow(Math.random(), 0.72) * 15.5;
      var sc = 1.0 + Math.pow(Math.random(), 2.0) * 2.5;
      if (band >= 0.62 && band < 0.80) {
        rr = 4 + Math.random() * 10;
        y = -7.4 + Math.random() * 6.2;      /* below the deck, in the tank */
        sc = 0.5 + Math.random() * 1.0;
      } else if (band >= 0.80 && band < 0.90) {
        rr = 5 + Math.random() * 16;          /* overhead, in the roof space */
        y = 18.5 + Math.random() * 9;
        sc = 1.6 + Math.random() * 2.2;
      } else if (band >= 0.90) {
        rr = 23.5 + Math.random() * 10;
        y = 2.0 + Math.random() * 12;
        sc = 2.9 + Math.random() * 1.8;
      }
      _pos.set(Math.cos(a) * rr, y, Math.sin(a) * rr);
      _s.setScalar(sc);
      _q.identity();
      masks.setMatrixAt(i, _m.compose(_pos, _q, _s));

      mSeed[i] = Math.random();
      mArche[i] = Math.random();
      mTurn[i] = 0.35 + Math.random() * 0.65;
      var t = tints[(Math.random() * tints.length) | 0];
      mTint[i * 3] = t.r; mTint[i * 3 + 1] = t.g; mTint[i * 3 + 2] = t.b;
    }
    masks.instanceMatrix.needsUpdate = true;
    scene.add(masks);
  })();

  /* --- what the masks throw on the deck --------------------------- */
  var shadowGeo = new THREE.CircleGeometry(1, 18);
  shadowGeo.setAttribute("aSeed", new THREE.InstancedBufferAttribute(mSeed, 1));
  shadowGeo.setAttribute("aTurn", new THREE.InstancedBufferAttribute(mTurn, 1));
  var shadowMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: U.time, uPtr: U.ptr, uPtrAmt: U.ptrAmt, uExpo: U.expo, uLock: U.lock
    },
    vertexShader: [
      "attribute float aSeed; attribute float aTurn;",
      "uniform vec3 uPtr; uniform float uPtrAmt, uTime;",
      MASK_MOVE,
      "varying float vFade; varying vec2 vU;",
      "void main(){",
      "  vU = uv;",
      "  mat4 im = instanceMatrix;",
      "  vec4 home = modelMatrix * im * vec4(0.0, 0.0, 0.0, 1.0);",
      "  float sc = length(im[0].xyz);",
      "  vec3 ctr = maskCentre(home.xyz, aSeed, aTurn, sc, uPtr, uPtrAmt, uTime);",
      "  float h = clamp(ctr.y, 0.0, 20.0);",
      "  float spread = 1.0 + h * 0.19;",
      /* only the ones over the deck throw anything, and the higher they
         ride the wider and fainter it gets */
      "  vFade = (1.0 - smoothstep(1.0, 15.0, h)) * step(0.7, ctr.y);",
      "  vec3 wp = vec3(ctr.x + position.x * sc * spread, 0.035,",
      "                 ctr.z + position.y * sc * spread);",
      "  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);",
      "}"
    ].join("\n"),
    fragmentShader: [
      "precision highp float;",
      "uniform float uExpo, uLock;",
      "varying float vFade; varying vec2 vU;",
      "void main(){",
      "  float d = length(vU * 2.0 - 1.0);",
      "  if (d > 1.0) discard;",
      "  float a = pow(1.0 - d, 1.7) * vFade * 0.42 * uExpo * (1.0 - uLock * 0.7);",
      "  gl_FragColor = vec4(0.016, 0.010, 0.028, a);",
      "}"
    ].join("\n"),
    transparent: true, blending: THREE.NormalBlending,
    depthTest: true, depthWrite: false, fog: false
  });
  var maskShadows = new THREE.InstancedMesh(shadowGeo, shadowMat, NM);
  maskShadows.frustumCulled = false;
  maskShadows.renderOrder = 5;
  maskShadows.instanceMatrix = masks.instanceMatrix;
  scene.add(maskShadows);

  /* ─── the carousel drum: the programme, printed and turning ─────── */
  var drumCanvas = document.createElement("canvas");
  drumCanvas.width = 2048; drumCanvas.height = 256;
  var drumTex = new THREE.CanvasTexture(drumCanvas);
  drumTex.wrapS = THREE.RepeatWrapping;
  drumTex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

  var PROGRAM = [
    "20:00 THE GATE OPENS", "21:20 FIRST TURN", "22:45 MASS EXCHANGE",
    "00:00 THE NULL HOUR", "01:30 SECOND TURN", "03:00 PROCESSION OF THE UNCLAIMED",
    "04:40 THE LIGHTS ARE RETURNED", "05:12 EMPTY"
  ];

  function drawDrum() {
    var c = drumCanvas.getContext("2d");
    var W = drumCanvas.width, H = drumCanvas.height;
    c.clearRect(0, 0, W, H);
    c.fillStyle = "#0b0713"; c.fillRect(0, 0, W, H);
    c.strokeStyle = "rgba(224,180,87,0.42)"; c.lineWidth = 3;
    c.beginPath(); c.moveTo(0, 26); c.lineTo(W, 26);
    c.moveTo(0, H - 26); c.lineTo(W, H - 26); c.stroke();
    c.textBaseline = "middle";
    var x = 0;
    for (var i = 0; i < PROGRAM.length; i++) {
      var parts = PROGRAM[i].split(" ");
      var t = parts.shift();
      var n = parts.join(" ");
      c.font = "700 34px 'Space Mono', monospace";
      c.fillStyle = "#FF8A2B";
      c.fillText(t, x + 20, H / 2);
      var tw = c.measureText(t).width;
      c.font = "700 42px 'Bodoni Moda', Georgia, serif";
      c.fillStyle = "#F4EADA";
      c.fillText(n, x + 20 + tw + 18, H / 2 + 2);
      var nw = c.measureText(n).width;
      x += tw + nw + 74;
      c.fillStyle = "#E0B457";
      c.beginPath(); c.arc(x - 34, H / 2, 4, 0, Math.PI * 2); c.fill();
    }
    drumTex.repeat.x = Math.max(1, Math.round(x / W));
    drumTex.needsUpdate = true;
  }
  drawDrum();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawDrum);

  var drumMat = new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: drumTex }, uTime: U.time, uChan: U.chan, uExpo: U.expo,
      uFogK: U.fogK, uLock: U.lock, uNight: U.night,
      uWarp: U.warp, uPtr: U.ptr
    },
    /* the drum is not rigid: point at it and the printed programme buckles */
    vertexShader: [
      "uniform float uWarp, uTime; uniform vec3 uPtr;",
      "varying vec3 vW; varying vec2 vU;",
      "void main(){",
      "  vU = uv;",
      "  vec3 pos = position;",
      "  vec4 w0 = modelMatrix * vec4(pos, 1.0);",
      "  float d = length(w0.xz - uPtr.xz);",
      "  float k = uWarp * exp(-d * d * 0.0035);",
      "  float ripple = sin(uv.x * 34.0 - uTime * 2.6) * 0.6",
      "               + sin(uv.y * 8.0 + uTime * 1.9) * 0.4;",
      "  pos.xz *= 1.0 + k * ripple * 0.17;",
      "  pos.y += k * ripple * 0.55;",
      "  vec4 w = modelMatrix * vec4(pos, 1.0);",
      "  vW = w.xyz;",
      "  gl_Position = projectionMatrix * viewMatrix * w;",
      "}"
    ].join("\n"),
    fragmentShader: [
      "precision highp float;",
      "uniform sampler2D uMap; uniform vec3 uChan, uNight;",
      "uniform float uTime, uExpo, uFogK, uLock;",
      "varying vec2 vU; varying vec3 vW;",
      FOG_FN,
      "void main(){",
      "  vec4 t = texture2D(uMap, vU);",
      "  float lum = max(t.r, max(t.g, t.b));",
      "  vec3 col = t.rgb * 0.30 + uChan * pow(lum, 2.6) * 0.16;",
      "  float band = 0.62 + 0.38 * sin(vU.y * 34.0 + uTime * 1.1);",
      "  col *= mix(0.82, 1.05, band);",
      "  col = mix(col, col.gbr, uLock * 0.8);",
      "  col = nightFog(col, vW, uFogK, uNight);",
      "  gl_FragColor = vec4(col * uExpo, 1.0);",
      "}"
    ].join("\n"),
    side: THREE.DoubleSide, fog: false
  });

  var drum = new THREE.Group();
  var drumGeo = new THREE.CylinderGeometry(8, 8, 5.4, 72, 1, true);
  var drumMesh = new THREE.Mesh(drumGeo, drumMat);
  drum.add(drumMesh);

  /* hub column + spokes: the armature the horses hang from */
  var hubMat = new THREE.ShaderMaterial({
    uniforms: { uChan: U.chan, uGilt: { value: COL.gilt.clone() }, uExpo: U.expo, uFogK: U.fogK, uLock: U.lock },
    vertexShader: WORLD_VERT,
    fragmentShader: [
      "precision highp float;",
      "uniform vec3 uChan, uGilt; uniform float uExpo, uFogK, uLock;",
      "varying vec2 vU; varying vec3 vW;",
      FOG_FN,
      "void main(){",
      "  vec3 col = mix(uGilt, uChan, 0.4) * (0.35 + 0.55 * pow(1.0 - abs(vU.x * 2.0 - 1.0), 2.0));",
      "  col = mix(col, col.gbr, uLock * 0.8);",
      "  gl_FragColor = vec4(col * uExpo, 0.85 * fogFade(vW, uFogK));",
      "}"
    ].join("\n"),
    transparent: true, blending: THREE.AdditiveBlending,
    depthTest: true, depthWrite: false, fog: false
  });
  var hub = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 7.4, 12, 1, true), hubMat);
  hub.position.y = 1.2;
  drum.add(hub);

  var spokePts = [];
  for (var sp = 0; sp < 8; sp++) {
    var sa = (sp / 8) * TAU;
    spokePts.push(0, 4.6, 0, Math.cos(sa) * 8.1, 3.0, Math.sin(sa) * 8.1);
    spokePts.push(Math.cos(sa) * 8.1, 3.0, Math.sin(sa) * 8.1, Math.cos(sa) * 8.1, -2.7, Math.sin(sa) * 8.1);
  }
  var spokeGeo = new THREE.BufferGeometry();
  spokeGeo.setAttribute("position", new THREE.Float32BufferAttribute(spokePts, 3));
  var spokes = new THREE.LineSegments(spokeGeo, new THREE.LineBasicMaterial({
    color: 0x8a6b2e, transparent: true, opacity: 0.7, depthWrite: false, fog: false
  }));
  spokes.renderOrder = 16;
  drum.add(spokes);

  drum.position.y = PIT_Y + 3.1;
  drum.frustumCulled = false;
  scene.add(drum);

  /* ─── glyph storm ───────────────────────────────────────────────── */
  var atlas = document.createElement("canvas");
  atlas.width = 512; atlas.height = 512;

  function drawAtlas() {
    var c = atlas.getContext("2d");
    c.clearRect(0, 0, 512, 512);
    c.lineWidth = 7; c.lineCap = "round"; c.lineJoin = "round";
    for (var i = 0; i < 16; i++) {
      var cx = (i % 4) * 128 + 64, cy = ((i / 4) | 0) * 128 + 64;
      c.save(); c.translate(cx, cy);
      c.strokeStyle = "#fff"; c.fillStyle = "#fff";
      switch (i) {
        case 0: c.beginPath(); c.arc(0, 0, 34, 0, Math.PI * 2); c.stroke();
                c.beginPath(); c.moveTo(-26, 26); c.lineTo(26, -26); c.stroke(); break;
        case 1: c.beginPath(); c.moveTo(0, -36); c.lineTo(34, 26); c.lineTo(-34, 26); c.closePath(); c.stroke(); break;
        case 2: c.beginPath(); c.moveTo(-32, -32); c.lineTo(32, 32); c.moveTo(32, -32); c.lineTo(-32, 32); c.stroke(); break;
        case 3: c.strokeRect(-30, -20, 60, 40);
                c.beginPath(); c.moveTo(10, -20); c.lineTo(10, 20); c.stroke(); break;
        case 4: c.beginPath(); c.arc(0, 0, 30, 0, Math.PI * 2); c.stroke();
                c.beginPath(); c.arc(0, 0, 11, 0, Math.PI * 2); c.fill(); break;
        case 5: c.beginPath();
                for (var k = 0; k < 5; k++) {
                  var a5 = -Math.PI / 2 + k * (Math.PI * 4 / 5);
                  var fn = k ? "lineTo" : "moveTo";
                  c[fn](Math.cos(a5) * 34, Math.sin(a5) * 34);
                }
                c.closePath(); c.stroke(); break;
        case 6: c.beginPath(); c.moveTo(-34, 0); c.lineTo(34, 0); c.moveTo(0, -34); c.lineTo(0, 34); c.stroke(); break;
        case 7: c.beginPath(); c.moveTo(-32, 20); c.quadraticCurveTo(0, -44, 32, 20); c.stroke();
                c.beginPath(); c.arc(-13, 6, 6, 0, Math.PI * 2); c.fill();
                c.beginPath(); c.arc(13, 6, 6, 0, Math.PI * 2); c.fill(); break;
        case 8: c.beginPath(); c.arc(0, 0, 34, 0.5, 5.1); c.stroke(); break;
        case 9: c.strokeRect(-26, -34, 52, 68);
                for (var d9 = -26; d9 < 26; d9 += 12) { c.beginPath(); c.arc(d9 + 6, -34, 3, 0, 7); c.stroke(); } break;
        case 10: c.beginPath(); c.moveTo(0, -34); c.lineTo(0, 34); c.moveTo(-20, -14); c.lineTo(0, -34); c.lineTo(20, -14); c.stroke(); break;
        case 11: c.beginPath(); c.arc(0, 0, 36, 0, Math.PI * 2); c.stroke();
                 c.beginPath(); c.arc(0, 0, 20, 0, Math.PI * 2); c.stroke(); break;
        case 12: c.beginPath(); c.moveTo(-34, -18); c.lineTo(0, 18); c.lineTo(34, -18); c.stroke(); break;
        case 13: c.beginPath(); c.moveTo(-30, 30); c.lineTo(-8, -30); c.lineTo(8, 12); c.lineTo(30, -28); c.stroke(); break;
        case 14: c.font = "700 74px 'Space Mono', monospace"; c.textAlign = "center"; c.textBaseline = "middle";
                 c.fillText("Ø", 0, 2); break;
        default: c.font = "700 70px 'Space Mono', monospace"; c.textAlign = "center"; c.textBaseline = "middle";
                 c.fillText("VII", 0, 2); break;
      }
      c.restore();
    }
  }
  drawAtlas();
  var atlasTex = new THREE.CanvasTexture(atlas);
  atlasTex.minFilter = THREE.LinearFilter;
  atlasTex.generateMipmaps = false;
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { drawAtlas(); atlasTex.needsUpdate = true; });
  }

  var NG = CFG.glyphs;
  var gPos = new Float32Array(NG * 3), gSeed = new Float32Array(NG),
      gCell = new Float32Array(NG), gScale = new Float32Array(NG);
  for (var gi = 0; gi < NG; gi++) {
    var ga = Math.random() * TAU;
    var gr = 6 + Math.pow(Math.random(), 0.6) * 46;
    gPos[gi * 3] = Math.cos(ga) * gr;
    gPos[gi * 3 + 1] = -7 + Math.pow(Math.random(), 0.85) * 27;
    gPos[gi * 3 + 2] = Math.sin(ga) * gr;
    gSeed[gi] = Math.random();
    gCell[gi] = (Math.random() * 16) | 0;
    gScale[gi] = 0.5 + Math.pow(Math.random(), 2.3) * 2.4;
  }
  var glyphGeo = new THREE.BufferGeometry();
  glyphGeo.setAttribute("position", new THREE.BufferAttribute(gPos, 3));
  glyphGeo.setAttribute("aSeed", new THREE.BufferAttribute(gSeed, 1));
  glyphGeo.setAttribute("aCell", new THREE.BufferAttribute(gCell, 1));
  glyphGeo.setAttribute("aScale", new THREE.BufferAttribute(gScale, 1));

  var glyphMat = new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: atlasTex }, uTime: U.time, uChan: U.chan, uExpo: U.expoLine,
      uFogK: U.fogK, uPtr: U.ptr, uPtrAmt: U.ptrAmt, uLock: U.lock,
      uDpr: { value: DPR }, uBone: { value: COL.bone.clone() }
    },
    vertexShader: [
      "attribute float aSeed; attribute float aCell; attribute float aScale;",
      "uniform float uTime, uPtrAmt, uDpr;",
      "uniform vec3 uPtr;",
      "varying float vCell; varying float vLit; varying vec3 vW;",
      "void main(){",
      "  vCell = aCell;",
      "  vec3 pos = position;",
      "  pos.y += sin(uTime * 0.34 + aSeed * 6.2831) * 1.9;",
      "  pos.x += cos(uTime * 0.21 + aSeed * 19.0) * 1.5;",
      "  pos.z += sin(uTime * 0.185 + aSeed * 27.0) * 1.5;",
      /* the null gathers them: pulled in, then held in orbit round its rim */
      "  vec3 to = uPtr - pos;",
      "  float dd = length(to);",
      "  float pull = uPtrAmt * exp(-dd * dd * 0.0016);",
      "  vec3 dir = to / max(dd, 0.001);",
      "  vec3 tang = normalize(cross(dir, vec3(0.0, 1.0, 0.0)) + vec3(0.001));",
      "  pos += dir * pull * min(dd * 0.62, 9.0);",
      "  pos += tang * pull * 6.5 * sin(uTime * 0.85 + aSeed * 6.2831);",
      "  vLit = 0.42 + 0.58 * pull + 0.18 * sin(uTime * 1.9 + aSeed * 31.0);",
      "  vW = pos;",
      "  vec4 mv = viewMatrix * vec4(pos, 1.0);",
      "  gl_PointSize = clamp((aScale * 46.0 * uDpr) / max(0.1, -mv.z), 1.0, 44.0 * uDpr);",
      "  gl_Position = projectionMatrix * mv;",
      "}"
    ].join("\n"),
    fragmentShader: [
      "precision highp float;",
      "uniform sampler2D uMap; uniform vec3 uChan, uBone;",
      "uniform float uExpo, uFogK, uLock;",
      "varying float vCell; varying float vLit; varying vec3 vW;",
      FOG_FN,
      "void main(){",
      "  vec2 pc = vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y);",
      "  vec2 cell = vec2(mod(vCell, 4.0), floor(vCell / 4.0));",
      "  float a = texture2D(uMap, (pc + cell) * 0.25).a;",
      "  if (a < 0.02) discard;",
      "  vec3 col = mix(uBone, uChan, 0.55) * (0.6 + vLit * 0.8);",
      "  col = mix(col, col.gbr, uLock * 0.9);",
      "  gl_FragColor = vec4(col * uExpo, a * vLit * 0.62 * fogFade(vW, uFogK));",
      "}"
    ].join("\n"),
    transparent: true, blending: THREE.AdditiveBlending,
    depthTest: true, depthWrite: false, fog: false
  });
  var glyphs = new THREE.Points(glyphGeo, glyphMat);
  glyphs.renderOrder = 40;
  glyphs.frustumCulled = false;
  scene.add(glyphs);

  /* ─── haze ──────────────────────────────────────────────────────── */
  var hazeCan = document.createElement("canvas");
  hazeCan.width = hazeCan.height = 128;
  (function () {
    var c = hazeCan.getContext("2d");
    var g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(255,255,255,0.85)");
    g.addColorStop(0.45, "rgba(255,255,255,0.20)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = g; c.fillRect(0, 0, 128, 128);
  })();
  var hazeTex = new THREE.CanvasTexture(hazeCan);
  var hazeGroup = [];
  for (var h = 0; h < CFG.haze; h++) {
    var col = h % 2 ? COL.mercury : COL.sodium;
    var sm = new THREE.SpriteMaterial({
      map: hazeTex, color: col.clone(), transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false, depthTest: true,
      opacity: 0.034, fog: false
    });
    var sprite = new THREE.Sprite(sm);
    var ha = (h / CFG.haze) * TAU + 0.4;
    /* always outside the camera's orbit (max r ~21) so a haze sprite can
       never end up on the lens and wash the whole frame */
    var hr = 34 + Math.random() * 24;
    sprite.position.set(Math.cos(ha) * hr, 4 + Math.random() * 9, Math.sin(ha) * hr);
    var hs = 13 + Math.random() * 9;
    sprite.scale.set(hs, hs, 1);
    sprite.renderOrder = 12;
    scene.add(sprite);
    hazeGroup.push({ s: sprite, m: sm, base: 0.034, seed: Math.random() * 10 });
  }

  /* ═══════════════ composer ════════════════════════════════════════ */
  var RT_COMMON = {
    type: THREE.UnsignedByteType,
    format: THREE.RGBAFormat,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
    generateMipmaps: false
    /* colorSpace deliberately omitted → NoColorSpace → RGBA8, no conversion */
  };

  var rtScene = new THREE.WebGLRenderTarget(2, 2, Object.assign({}, RT_COMMON, {
    depthBuffer: true, stencilBuffer: false,
    samples: CFG.samples, resolveDepthBuffer: false
  }));
  var rtA = new THREE.WebGLRenderTarget(2, 2, Object.assign({}, RT_COMMON, { depthBuffer: false, stencilBuffer: false }));
  var rtB = new THREE.WebGLRenderTarget(2, 2, Object.assign({}, RT_COMMON, { depthBuffer: false, stencilBuffer: false }));

  /* one triangle, not a quad: no diagonal seam, one primitive */
  var triGeo = new THREE.BufferGeometry();
  triGeo.setAttribute("position", new THREE.Float32BufferAttribute([-1, 3, 0, -1, -1, 0, 3, -1, 0], 3));
  triGeo.setAttribute("uv", new THREE.Float32BufferAttribute([0, 2, 0, 0, 2, 0], 2));
  var passCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  var passMesh = new THREE.Mesh(triGeo, null);
  passMesh.frustumCulled = false;

  var PASS_VERT = [
    "varying vec2 vUv;",
    "void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }"
  ].join("\n");

  function passMat(uniforms, frag) {
    return new THREE.ShaderMaterial({
      uniforms: uniforms, vertexShader: PASS_VERT, fragmentShader: frag,
      depthTest: false, depthWrite: false, transparent: false,
      blending: THREE.NoBlending
    });
  }
  function blit(mat, target) {
    passMesh.material = mat;
    renderer.setRenderTarget(target);
    renderer.render(passMesh, passCam);
  }

  var uBright = {
    tSrc: { value: null }, uTexel: { value: new THREE.Vector2() },
    uThreshold: { value: 0.56 }, uKnee: { value: 0.26 }
  };
  var matBright = passMat(uBright, [
    "precision highp float;",
    "uniform sampler2D tSrc; uniform vec2 uTexel;",
    "uniform float uThreshold, uKnee;",
    "varying vec2 vUv;",
    "void main(){",
    "  vec3 c = texture2D(tSrc, vUv + uTexel * vec2(-1.0,-1.0)).rgb",
    "         + texture2D(tSrc, vUv + uTexel * vec2( 1.0,-1.0)).rgb",
    "         + texture2D(tSrc, vUv + uTexel * vec2(-1.0, 1.0)).rgb",
    "         + texture2D(tSrc, vUv + uTexel * vec2( 1.0, 1.0)).rgb;",
    "  c *= 0.25;",
    "  float l = max(c.r, max(c.g, c.b));",
    "  float s = clamp(l - uThreshold + uKnee, 0.0, 2.0 * uKnee);",
    "  s = s * s / (4.0 * uKnee + 1e-4);",
    "  float w = max(s, l - uThreshold) / max(l, 1e-4);",
    "  gl_FragColor = vec4(c * w, 1.0);",
    "}"
  ].join("\n"));

  var uBlur = {
    tSrc: { value: null }, uTexel: { value: new THREE.Vector2() },
    uDir: { value: new THREE.Vector2(1, 0) }, uRadius: { value: 1.35 }
  };
  var matBlur = passMat(uBlur, [
    "precision highp float;",
    "uniform sampler2D tSrc; uniform vec2 uTexel, uDir; uniform float uRadius;",
    "varying vec2 vUv;",
    "void main(){",
    "  vec2 d = uDir * uTexel * uRadius;",
    "  vec3 c = texture2D(tSrc, vUv).rgb * 0.2270270270;",
    "  c += (texture2D(tSrc, vUv + d * 1.3846153846).rgb + texture2D(tSrc, vUv - d * 1.3846153846).rgb) * 0.3162162162;",
    "  c += (texture2D(tSrc, vUv + d * 3.2307692308).rgb + texture2D(tSrc, vUv - d * 3.2307692308).rgb) * 0.0702702703;",
    "  gl_FragColor = vec4(c, 1.0);",
    "}"
  ].join("\n"));

  var uComp = {
    tScene: { value: null }, tBloom: { value: null },
    uAspect: { value: 1 }, uCssH: { value: 800 }, uTime: { value: 0 },
    uBloom: { value: 0.86 }, uBarrel: { value: 0.052 }, uCA: { value: 0.0032 },
    uGrain: { value: 0.055 }, uVig: { value: 0.60 }, uScan: { value: 0.035 },
    uLens: { value: new THREE.Vector2(0.5, 0.5) },
    uLensR: { value: 0.0 }, uLensAmt: { value: 0.0 },
    uLock: { value: 0.0 }, uChan: { value: COL.mercury.clone() }
  };
  var matComp = passMat(uComp, [
    "precision highp float;",
    "uniform sampler2D tScene, tBloom;",
    "uniform vec2 uLens;",
    "uniform float uAspect, uCssH, uTime, uBloom, uBarrel, uCA, uGrain, uVig, uScan;",
    "uniform float uLensR, uLensAmt, uLock;",
    "uniform vec3 uChan;",
    "varying vec2 vUv;",
    "float hash21(vec2 p){",
    "  p = fract(p * vec2(123.34, 456.21));",
    "  p += dot(p, p + 45.32);",
    "  return fract(p.x * p.y);",
    "}",
    "void main(){",
    "  vec2 uv = vUv;",
    "  vec2 c = uv - 0.5;",
    /* 1 — lens optics first: everything downstream sees the warped world */
    "  float r2 = dot(c, c);",
    "  vec2 duv = c * (1.0 + uBarrel * r2) + 0.5;",
    /* 2 — radial chromatic aberration, scene only */
    "  vec2 ca = c * uCA * (0.35 + r2);",
    "  vec3 col;",
    "  col.r = texture2D(tScene, duv + ca).r;",
    "  col.g = texture2D(tScene, duv).g;",
    "  col.b = texture2D(tScene, duv - ca).b;",
    /* 3 — bloom */
    "  col += texture2D(tBloom, duv).rgb * uBloom;",
    /* 4 — the null: a hole carried across the world, after the glow is in */
    "  float d = length((uv - uLens) * vec2(uAspect, 1.0));",
    "  float soft = max(0.02, uLensR * 0.30);",
    "  float lens = (1.0 - smoothstep(uLensR - soft, uLensR + soft, d)) * uLensAmt * (1.0 - uLock);",
    "  vec3 nulled = vec3(1.0) - col;",
    "  nulled = mix(nulled, nulled.gbr, 0.55);",
    "  float lum = dot(col, vec3(0.299, 0.587, 0.114));",
    "  vec3 hollow = col * 0.22 + uChan * 0.035;",
    "  nulled = mix(hollow, nulled, smoothstep(0.045, 0.34, lum));",
    "  col = mix(col, nulled, lens);",
    /* the rim of the hole */
    "  float rim = 1.0 - smoothstep(0.0, soft * 1.6, abs(d - uLensR));",
    "  col += uChan * rim * uLensAmt * 0.42 * (1.0 - uLock);",
    /* The ACCESS ritual: the hall is handed back to the dark and only the
       middle of the frame keeps its light. Draining rather than inverting —
       inverting a night scene turns the whole page white under the copy. */
    "  float ctr = length((uv - vec2(0.5, 0.46)) * vec2(uAspect, 1.0));",
    "  float keep = 1.0 - smoothstep(0.16, 0.46, ctr);",
    "  vec3 drained = mix(col, col.gbr, 0.62) * 0.15;",
    "  col = mix(col, drained, uLock * (1.0 - keep));",
    "  float iris = 1.0 - smoothstep(0.0, 0.030, abs(ctr - 0.31));",
    "  col += uChan * iris * uLock * 0.32;",
    /* 5 — the display. Never warped by anything above. */
    "  col *= 1.0 - uVig * smoothstep(0.24, 0.86, length(c * vec2(uAspect, 1.0)));",
    "  col *= 1.0 - uScan * (0.5 + 0.5 * sin(uv.y * uCssH * 1.5708 + uTime * 2.0));",
    "  col += (hash21(gl_FragCoord.xy + fract(uTime) * 311.7) - 0.5) * uGrain;",
    "  gl_FragColor = vec4(col, 1.0);",
    "}"
  ].join("\n"));

  /* ─── resize ────────────────────────────────────────────────────── */
  var _db = new THREE.Vector2();
  var bufW = 2, bufH = 2, cssH = 800;

  function resize() {
    var cw = Math.max(1, canvas.clientWidth || window.innerWidth);
    var ch = Math.max(1, canvas.clientHeight || window.innerHeight);
    renderer.setPixelRatio(DPR);
    renderer.setSize(cw, ch, false);

    renderer.getDrawingBufferSize(_db);
    bufW = Math.max(1, Math.floor(_db.x));
    bufH = Math.max(1, Math.floor(_db.y));
    cssH = ch;

    rtScene.setSize(bufW, bufH);
    var bw = Math.max(1, Math.floor(bufW / CFG.bloomDiv));
    var bh = Math.max(1, Math.floor(bufH / CFG.bloomDiv));
    rtA.setSize(bw, bh);
    rtB.setSize(bw, bh);

    uBright.uTexel.value.set(1 / bufW, 1 / bufH);
    uBlur.uTexel.value.set(1 / bw, 1 / bh);
    uComp.uAspect.value = cw / ch;
    uComp.uCssH.value = ch;

    bulbMat.uniforms.uDpr.value = DPR;
    glyphMat.uniforms.uDpr.value = DPR;

    camera.aspect = cw / ch;
    camera.fov = cw < 720 ? 62 : CFG.fov;
    camera.updateProjectionMatrix();
  }

  /* ─── the camera path: authored per station, C1 through Catmull-Rom ─ */
  function cr(a, t) {
    var n = a.length - 1;
    var f = Math.max(0, Math.min(n, t));
    var i = Math.min(n - 1, Math.floor(f));
    var u = f - i;
    var p0 = a[Math.max(0, i - 1)], p1 = a[i], p2 = a[i + 1], p3 = a[Math.min(n, i + 2)];
    var u2 = u * u, u3 = u2 * u;
    return 0.5 * ((2 * p1) + (-p0 + p2) * u +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * u2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * u3);
  }

  /*            GATE  PREM  MIDW  PROG  SITE  ACCS  RULE  */
  var K_R    = [14.5, 12.8, 11.4, 21.0, 13.0,  8.2, 16.5];
  var K_Y    = [ 9.0,  6.2,  4.4, 15.0,  6.6,  2.6, 11.0];
  var K_LY   = [ 4.4,  4.6,  4.0, -3.0,  4.8, -1.8,  6.0];
  var K_OUT  = [ 1.0,  1.0,  1.0,  0.0,  1.0,  0.15, 0.85];
  var K_LEAD = [ 0.00, 0.04, 0.00, 0.18, 0.02, 0.00, 0.22];
  /* Each turn is lit and staged differently, so the seven stations are
     seven rooms rather than one room seen from seven angles. */
  var K_FOG  = [ 1.00, 1.20, 0.95, 0.62, 1.10, 1.75, 0.85];  /* air density  */
  var K_BEAM = [ 1.00, 0.62, 1.55, 0.42, 0.90, 0.18, 1.25];  /* searchlights */
  var K_SPIN = [ 1.00, 0.85, 1.15, 2.30, 0.95, 0.22,-1.40];  /* carousel     */
  var K_REV  = [ 1.00, 1.00, 1.00, 1.00, 1.00,-1.00,-1.00];  /* bulb chase   */
  var K_SWAY = [ 0.60, 0.85, 1.30, 0.45, 1.00, 0.30, 1.15];  /* beam sweep   */

  var camPos = new THREE.Vector3();
  var camLook = new THREE.Vector3();
  var _bq = new THREE.Quaternion();
  var _down = new THREE.Vector3(0, -1, 0);
  var _aim = new THREE.Vector3();
  var _one = new THREE.Vector3(1, 1, 1);
  var _bt = new THREE.Vector3();
  var _ring = new THREE.Vector3();
  var _ctr = new THREE.Vector3();

  function samplePath(sf) {
    var ang = sf * (TAU / NB);
    var rr = cr(K_R, sf);
    var yy = cr(K_Y, sf);
    var ly = cr(K_LY, sf);
    var out = Math.max(0, Math.min(1, cr(K_OUT, sf)));
    var lead = cr(K_LEAD, sf);

    camPos.set(Math.cos(ang) * rr, yy, Math.sin(ang) * rr);
    var la = ang + lead;
    _ring.set(Math.cos(la) * R_RING, ly, Math.sin(la) * R_RING);
    _ctr.set(Math.cos(la) * 1.6, ly - 2.4, Math.sin(la) * 1.6);
    camLook.copy(_ctr).lerp(_ring, out);
  }

  /* ─── pointer → a world point in front of the viewer ────────────── */
  var _ndc = new THREE.Vector3();
  var ptrWorld = new THREE.Vector3(0, 4, -30);
  function updatePointerWorld() {
    _ndc.set(S.pxn * 2 - 1, -(S.pyn * 2 - 1), 0.5).unproject(camera);
    _ndc.sub(camera.position).normalize();
    ptrWorld.copy(camera.position).addScaledVector(_ndc, 27);
    U.ptr.value.lerp(ptrWorld, 0.16);
  }

  /* ─── frame ─────────────────────────────────────────────────────── */
  var clock = new THREE.Clock();
  var smoothSF = 0, exposure = 1, chanCur = new THREE.Color(0xff8a2b);
  var hotEase = 0, hotIdx = -1;
  var visible = true, pageVisible = true;
  var frameAcc = 0, frameCount = 0, tier = 0;

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { visible = e.isIntersecting; });
    }, { threshold: 0.01 }).observe(canvas);
  }
  document.addEventListener("visibilitychange", function () {
    pageVisible = document.visibilityState !== "hidden";
  });

  function compose(dt) {
    var t = clock.elapsedTime;
    U.time.value = t;

    /* ring position, eased so a flick of the wheel does not snap the world */
    smoothSF += (S.stationF - smoothSF) * (REDUCED ? 0.4 : 0.075);
    /* the visitor can lean on the ring: holding the pointer out toward
       either edge pushes the turn, and it drifts back when they let go */
    var sfNow = smoothSF + (S.turnPush || 0);
    samplePath(sfNow);

    /* the pointer leans the whole room */
    var lean = S.active * (REDUCED ? 0 : 1);
    camera.position.set(
      camPos.x + S.px * 1.9 * lean,
      camPos.y + -S.py * 1.15 * lean,
      camPos.z + S.py * 1.1 * lean
    );
    camera.lookAt(camLook);
    camera.rotation.z += Math.sin(t * 0.21) * 0.012 + S.px * 0.018 * lean;
    camera.updateMatrixWorld();
    updatePointerWorld();

    /* clock terms */
    var kick = Math.pow(1 - (S.phase || 0), 3);
    U.kick.value = kick;
    U.ptrAmt.value = S.nullAmt;
    U.lock.value = S.lock;

    /* the channel the whole world is lit in */
    var target = CHAN[S.ch] || COL.sodium;
    chanCur.lerp(target, 0.045);
    U.chan.value.copy(chanCur);
    U.chan2.value.copy(chanCur).lerp(COL.gilt, 0.5);

    /* which booth is being read */
    if (S.booth >= 0) hotIdx = S.booth;
    hotEase += ((S.booth >= 0 ? 1 : 0) - hotEase) * 0.09;
    U.hot.value = hotIdx;
    U.hotAmt.value = hotEase;

    /* the world yields where the copy is dense */
    var wantExpo = 1 - S.dim * 0.58;
    exposure += (wantExpo - exposure) * 0.06;
    U.expo.value = exposure;
    /* masks, bulbs and glyphs are drawing, not lighting — they hold their
       presence over the copy where the big light sources have to yield */
    U.expoLine.value = 0.46 + exposure * 0.54;

    /* what this turn looks like */
    var sfc = Math.max(0, Math.min(6, sfNow));
    U.fogK.value = 0.000105 * cr(K_FOG, sfc);
    U.rev.value = cr(K_REV, sfc);
    var beamAmt = Math.max(0, cr(K_BEAM, sfc));
    U.beam.value = beamAmt * (0.75 + kick * 0.25);
    U.warp.value = S.nullAmt * (REDUCED ? 0 : 1);

    /* seven searchlights: each sweeps its own arc, and all seven lean
       toward the null when the visitor is holding one */
    if (!REDUCED) {
      var sway = cr(K_SWAY, sfc);
      for (var bi2 = 0; bi2 < NB; bi2++) {
        var swp = t * 0.21 * sway + bi2 * (TAU / NB);
        var tr = 21 + Math.sin(t * 0.17 + bi2 * 1.3) * 17;
        _bt.set(Math.cos(swp) * tr, 0.0, Math.sin(swp) * tr);
        _bt.x += (U.ptr.value.x - _bt.x) * 0.42 * S.nullAmt;
        _bt.z += (U.ptr.value.z - _bt.z) * 0.42 * S.nullAmt;
        _aim.copy(_bt).sub(beamMount[bi2]).normalize();
        _bq.setFromUnitVectors(_down, _aim);
        _m.compose(beamMount[bi2], _bq, _one);
        beams.setMatrixAt(bi2, _m);
      }
      beams.instanceMatrix.needsUpdate = true;
    }

    /* drum + ticker + haze idle motion */
    drum.rotation.y = -t * 0.075 * cr(K_SPIN, sfc);
    ticker.rotation.y = t * 0.045;
    drumMat.uniforms.uMap.value.offset.x = t * 0.012;
    for (var i = 0; i < hazeGroup.length; i++) {
      var hh = hazeGroup[i];
      /* haze is atmosphere at depth only. A sprite this size that drifts
         near the lens is a white disc over the whole frame, so fade it
         out by distance rather than trusting its placement. */
      var hd = hh.s.position.distanceTo(camera.position);
      var far = Math.max(0, Math.min(1, (hd - 16) / 22));
      hh.m.opacity = hh.base * exposure * far * far * (0.7 + 0.3 * Math.sin(t * 0.23 + hh.seed));
      hh.s.position.y += Math.sin(t * 0.19 + hh.seed) * 0.004;
    }

    /* composite uniforms */
    uComp.uTime.value = t;
    uComp.uLens.value.set(S.pxn, 1 - S.pyn);
    uComp.uLensR.value = cssH > 0 ? (S.nr / cssH) : 0;
    uComp.uLensAmt.value = S.nullAmt;
    uComp.uLock.value = S.lock;
    uComp.uChan.value.copy(chanCur).lerp(COL.mercury, 0.55);
    uComp.uBloom.value = 0.72 + S.nullAmt * 0.16 + kick * 0.06;
    uComp.uCA.value = 0.0022 + S.nullAmt * 0.0022 + S.lock * 0.004;
  }

  function renderPasses() {
    renderer.setRenderTarget(rtScene);
    renderer.render(scene, camera);

    uBright.tSrc.value = rtScene.texture;
    blit(matBright, rtA);

    /* two octaves: a tight core, then a wide halo over the top of it */
    uBlur.uRadius.value = 1.5;
    uBlur.tSrc.value = rtA.texture; uBlur.uDir.value.set(1, 0); blit(matBlur, rtB);
    uBlur.tSrc.value = rtB.texture; uBlur.uDir.value.set(0, 1); blit(matBlur, rtA);
    uBlur.uRadius.value = 3.9;
    uBlur.tSrc.value = rtA.texture; uBlur.uDir.value.set(1, 0); blit(matBlur, rtB);
    uBlur.tSrc.value = rtB.texture; uBlur.uDir.value.set(0, 1); blit(matBlur, rtA);

    uComp.tScene.value = rtScene.texture;
    uComp.tBloom.value = rtA.texture;
    blit(matComp, null);
  }

  /* ─── adaptive ladder: DPR first, bloom division last ───────────── */
  function stepDown() {
    tier++;
    if (tier === 1 || tier === 4) {
      DPR = Math.max(1, DPR * 0.8);
      renderer.setPixelRatio(DPR);
      resize();
    } else if (tier === 2) {
      if (rtScene.samples > 0) { rtScene.samples = 0; rtScene.dispose(); }
    } else if (tier === 3) {
      glyphs.geometry.setDrawRange(0, Math.floor(NG * 0.45));
      masks.count = Math.max(40, Math.floor(NM * 0.55));
      maskShadows.count = masks.count;
      beams.visible = false;
      for (var i = hazeGroup.length - 1; i >= Math.max(2, hazeGroup.length - 2); i--) {
        hazeGroup[i].s.visible = false;
      }
    } else if (tier === 5) {
      CFG.bloomDiv = 6;
      resize();
    }
  }

  function frame() {
    requestAnimationFrame(frame);
    if (!visible || !pageVisible) return;
    var dt = Math.min(clock.getDelta(), 0.05);
    compose(dt);
    renderPasses();

    if (tier < 5) {
      frameAcc += dt; frameCount++;
      if (frameCount === 110) {
        if (frameAcc / frameCount > 0.026) stepDown();
        frameAcc = 0; frameCount = 0;
      }
    }
  }

  function renderStatic() {
    clock.getDelta();
    U.time.value = 6.2;
    smoothSF = 0;
    samplePath(0);
    camera.position.copy(camPos);
    camera.lookAt(camLook);
    camera.updateMatrixWorld();
    U.expo.value = 1;
    U.expoLine.value = 1;
    U.ptrAmt.value = 0;
    U.beam.value = 1;
    U.warp.value = 0;
    U.rev.value = 1;
    for (var rb = 0; rb < NB; rb++) {
      _bt.set(Math.cos(rb * 1.1) * 27, 0, Math.sin(rb * 1.1) * 27);
      _aim.copy(_bt).sub(beamMount[rb]).normalize();
      _bq.setFromUnitVectors(_down, _aim);
      _m.compose(beamMount[rb], _bq, _one);
      beams.setMatrixAt(rb, _m);
    }
    beams.instanceMatrix.needsUpdate = true;
    U.kick.value = 0.3;
    U.chan.value.copy(COL.sodium);
    U.chan2.value.copy(COL.gilt);
    uComp.uLensAmt.value = 0;
    uComp.uLock.value = 0;
    uComp.uTime.value = 6.2;
    uComp.uGrain.value = 0.02;
    renderPasses();
  }

  /* ─── context loss falls back to the designed static midway ─────── */
  canvas.addEventListener("webglcontextlost", function (e) {
    e.preventDefault();
    document.body.classList.add("no3d");
  }, false);
  canvas.addEventListener("webglcontextrestored", function () {
    document.body.classList.remove("no3d");
    resize();
    if (REDUCED) renderStatic();
  }, false);

  window.addEventListener("resize", function () {
    resize();
    if (REDUCED) renderStatic();
  });

  resize();
  /* A handle on the layers. Bisecting a blown-out frame by toggling
     .visible from the console is the only way to attribute one, and
     guessing at it from screenshots costs far more than this line. */
  window.NC = {
    ready: true, three: THREE.REVISION,
    layers: {
      deck: deck, pitFloor: pitFloor, pitWall: pitWall,
      arches: arches, legs: legs, portals: portals,
      beams: beams, signs: signs, ticker: ticker,
      wire: wire, bulbs: bulbs, masks: masks, maskShadows: maskShadows,
      drum: drum, glyphs: glyphs,
      haze: hazeGroup.map(function (h) { return h.s; })
    }
  };

  if (REDUCED) {
    renderStatic();
    setTimeout(renderStatic, 900);
    setTimeout(renderStatic, 2400);
  } else {
    /* paint one frame synchronously — a hidden tab never fires rAF */
    compose(0);
    renderPasses();
    requestAnimationFrame(frame);
  }
})();
