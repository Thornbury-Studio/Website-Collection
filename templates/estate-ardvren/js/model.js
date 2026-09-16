/* ARDVREN — the model.
   The 1:2,000 site model that stands in the Steading, in the browser: a relief
   of the south shore of Loch Ardvren with its contour lines, the loch, the
   pines as an instanced forest, the roads, the jetty and boathouse, the
   sixteen Phase 1 lodges, and the twenty-four Phase 2 plots as numbered pads
   coloured by availability. Drag to turn it, pinch or the buttons to zoom,
   hover a plot for its facts, click one to reserve it or find it in the
   schedule below. One unit is ten metres. Renders only while on screen. */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

(function () {
  'use strict';

  var A = window.ARDVREN, PLOTS = window.ARDVREN_PLOTS;
  var wrap = document.getElementById('model');
  var host = document.getElementById('modelCanvas');
  if (!A || !PLOTS || !wrap || !host) return;

  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  var small = matchMedia('(max-width: 860px)').matches;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- renderer ---------------- */
  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  } catch (e) {
    wrap.classList.add('no-webgl');
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2));
  renderer.setClearColor(0x1a2928, 1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  host.appendChild(renderer.domElement);
  wrap.classList.add('has-webgl');

  var scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x1a2928, 150, 300);

  var camera = new THREE.PerspectiveCamera(36, 1, 1, 600);

  /* ---------------- the ground ---------------- */
  // shoreline: z of the water's edge for a given x (the loch is to the north, -z)
  function shore(x) { return -6 + 4.2 * Math.sin(x / 18) + 2.0 * Math.sin(x / 7 + 1.0) + (x > 0 && x < 8 ? -3.5 * Math.cos((x - 4) / 8 * Math.PI) : 0); }
  function gauss(x, z, cx, cz, sx, sz) { var dx = (x - cx) / sx, dz = (z - cz) / sz; return Math.exp(-(dx * dx + dz * dz)); }
  function height(x, z) {
    var zs = shore(x);
    var d = z - zs;                                   // distance inland (+) or into the loch (-)
    var land = 0.55 + Math.max(0, d) * 0.085
      + 8.5 * gauss(x, z, 30, 32, 28, 13)             // the ridge, south-east
      + 2.2 * gauss(x, z, -34, 26, 22, 12)            // the gentle woodland rise, south-west
      + 0.35 * Math.sin(x * 0.31) * Math.cos(z * 0.27) + 0.22 * Math.sin(x * 0.9 + z * 0.6);
    var island = 2.6 * gauss(x, z, -16, -31, 8, 5.5);
    var loch = -3.2 + island * 1.5;
    var t = Math.min(1, Math.max(0, (d + 4) / 5));   // smooth step across the shore
    t = t * t * (3 - 2 * t);
    return loch + (land - loch) * t + (d < 0 ? island : 0);
  }

  var W = 150, D = 106, SEG_X = 170, SEG_Z = 120;
  var geo = new THREE.PlaneGeometry(W, D, SEG_X, SEG_Z);
  geo.rotateX(-Math.PI / 2);
  var pos = geo.attributes.position;
  var col = new Float32Array(pos.count * 3);
  var cLow = new THREE.Color(0x33504a), cHigh = new THREE.Color(0x5d7872), cShore = new THREE.Color(0x66735f), cBed = new THREE.Color(0x172a2c);
  var tmp = new THREE.Color();
  for (var i = 0; i < pos.count; i++) {
    var x = pos.getX(i), z = pos.getZ(i);
    var y = height(x, z);
    pos.setY(i, y);
    if (y < 0.1) tmp.copy(cBed);
    else if (y < 0.9) tmp.copy(cShore).lerp(cLow, (y - 0.1) / 0.8);
    else tmp.copy(cLow).lerp(cHigh, Math.min(1, (y - 0.9) / 9));
    col[i * 3] = tmp.r; col[i * 3 + 1] = tmp.g; col[i * 3 + 2] = tmp.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.computeVertexNormals();

  var groundMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.96, metalness: 0.0 });
  // contour lines every ten metres of height, drawn in the shader so they follow the relief exactly
  groundMat.onBeforeCompile = function (sh) {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vH;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvH = position.y;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vH;')
      .replace('#include <color_fragment>', '#include <color_fragment>\n' +
        'float cl = abs(fract(vH * 1.0 + 0.5) - 0.5);\n' +
        'float lw = fwidth(vH) * 1.3;\n' +
        'float line = 1.0 - smoothstep(0.0, lw, cl);\n' +
        'if (vH > 0.25) diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.62, 0.72, 0.70), line * 0.42);');
  };
  var ground = new THREE.Mesh(geo, groundMat);
  ground.receiveShadow = true;
  ground.castShadow = false;
  scene.add(ground);

  // the loch
  var water = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ color: 0x3b626a, roughness: 0.32, metalness: 0.12, transparent: true, opacity: 0.96 }));
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.12;
  water.receiveShadow = true;
  scene.add(water);

  // the plinth the model stands on
  var plinth = new THREE.Mesh(new THREE.BoxGeometry(W + 0.4, 5, D + 0.4), new THREE.MeshStandardMaterial({ color: 0x121d1c, roughness: 0.95 }));
  plinth.position.y = -3.4 - 2.5;
  plinth.receiveShadow = true;
  scene.add(plinth);

  /* ---------------- roads, jetty, buildings ---------------- */
  var roadMat = new THREE.MeshStandardMaterial({ color: 0x8a948f, roughness: 0.9 });
  function ribbon(points, width) {
    var curve = new THREE.CatmullRomCurve3(points.map(function (p) { return new THREE.Vector3(p[0], 0, p[1]); }));
    var n = Math.max(24, Math.round(curve.getLength() * 2));
    var verts = [], idx = [];
    for (var k = 0; k <= n; k++) {
      var t = k / n;
      var p = curve.getPoint(t), tg = curve.getTangent(t).normalize();
      var nx = -tg.z, nz = tg.x;
      var y = height(p.x, p.z) + 0.14;
      verts.push(p.x + nx * width, height(p.x + nx * width, p.z + nz * width) + 0.14, p.z + nz * width);
      verts.push(p.x - nx * width, height(p.x - nx * width, p.z - nz * width) + 0.14, p.z - nz * width);
      if (k < n) { var b = k * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
      void y;
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    var m = new THREE.Mesh(g, roadMat);
    m.receiveShadow = true;
    scene.add(m);
    return curve;
  }
  // the spur from the B846 (south edge) to the Steading, then the three roads
  ribbon([[-4, 53], [-5, 44], [-6, 38]], 0.75);
  var loop = ribbon([[-6, 38], [-14, 34], [-26, 33], [-40, 30], [-50, 24], [-48, 15], [-38, 11], [-26, 13], [-16, 18], [-10, 26], [-6, 38]], 0.6);
  var ridgeRoad = ribbon([[-6, 38], [4, 36], [14, 31], [24, 26], [34, 23], [44, 22], [52, 24]], 0.6);
  ribbon([[-6, 38], [-8, 28], [-14, 18], [-20, 8], [-22, shore(-22) + 3]], 0.55);
  void loop; void ridgeRoad;

  var timber = new THREE.MeshStandardMaterial({ color: 0x8d7a5c, roughness: 0.85 });
  var charred = new THREE.MeshStandardMaterial({ color: 0x1f2a29, roughness: 0.8 });
  var zinc = new THREE.MeshStandardMaterial({ color: 0x66716f, roughness: 0.6, metalness: 0.2 });
  function box(w, h, d, x, z, mat, rot, lift) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, height(x, z) + h / 2 + (lift || 0), z);
    m.rotation.y = rot || 0;
    m.castShadow = true; m.receiveShadow = true;
    scene.add(m);
    return m;
  }
  // the jetty, the boathouse, the Steading
  var jz = shore(-22);
  var jetty = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.25, 7), timber);
  jetty.position.set(-22, 0.45, jz - 2.5); jetty.castShadow = true; scene.add(jetty);
  box(3.2, 2.2, 4.2, -25.5, jz + 3.2, charred, 0.15);
  box(2.6, 1.6, 2.6, -25.5, jz + 3.2, zinc, 0.15, 2.2).scale.set(1.15, 0.35, 1.15);
  box(5.5, 2.6, 3.2, -8.5, 38.5, timber, -0.1);
  box(5.9, 0.8, 3.6, -8.5, 38.5, zinc, -0.1, 2.6);

  // sixteen Phase 1 lodges, south of the loop and along the first shore road
  var P1 = [[-12, 22], [-8, 25], [-14, 27], [-9, 30], [-18, 23], [-22, 20], [-15, 15], [-11, 18], [-20, 28], [-30, 22], [-34, 18], [-28, 16], [-24, 12], [-4, 28], [-2, 32], [-16, 32]];
  P1.forEach(function (p, i) {
    var w = i % 3 === 0 ? 2.1 : (i % 3 === 1 ? 1.4 : 1.7);
    box(w, 0.9, i % 3 === 1 ? 1.2 : 1.6, p[0], p[1], i % 4 === 0 ? timber : charred, (i * 0.7) % 1.2 - 0.6);
  });

  /* ---------------- the plots ---------------- */
  var SITES = {
    17: [-44, 3.2], 18: [-30, 2.6], 19: [-12, 2.4], 20: [4, 1.8], 21: [18, 3.0], 22: [32, 3.4],
    23: [10, 24], 24: [20, 20], 25: [30, 30], 26: [16, 30], 27: [40, 26], 28: [6, 31], 29: [26, 22], 30: [36, 33],
    31: [-46, 20], 32: [-52, 27], 33: [-40, 14], 34: [-44, 30], 35: [-34, 12], 36: [-30, 28], 37: [-22, 12], 38: [-18, 36], 39: [-36, 34], 40: [-24, 24]
  };
  var PAD = { woodland: 4.2, ridge: 4.8, lochside: 5.4 };
  var STATUS_COL = { available: 0xc9a675, reserved: 0x9fb0ad, sold: 0x3a4a48 };
  var pads = [], padByNo = {};
  var padGeo = new THREE.BoxGeometry(1, 0.28, 1);
  PLOTS.forEach(function (p) {
    var s = SITES[p.no]; if (!s) return;
    var x = s[0], z = p.type === 'lochside' ? shore(x) + s[1] + 2.4 : s[1];
    var y = height(x, z);
    var size = PAD[p.type];
    var mat = new THREE.MeshStandardMaterial({ color: STATUS_COL[p.status], roughness: 0.7, emissive: STATUS_COL[p.status], emissiveIntensity: 0.12, transparent: true, opacity: p.status === 'sold' ? 0.75 : 0.95 });
    var m = new THREE.Mesh(padGeo, mat);
    m.scale.set(size, 1, size * (p.type === 'lochside' ? 1.25 : 1));
    m.position.set(x, y + 0.14, z);
    m.rotation.y = (p.no * 0.37) % 0.5 - 0.25;
    m.castShadow = true; m.receiveShadow = true;
    m.userData.plot = p;
    scene.add(m);
    pads.push(m); padByNo[p.no] = m;

    // the number, on a sprite that always faces you
    var c = document.createElement('canvas'); c.width = c.height = 128;
    var g = c.getContext('2d');
    g.beginPath(); g.arc(64, 64, 52, 0, Math.PI * 2);
    g.fillStyle = p.status === 'sold' ? 'rgba(20,32,31,.85)' : 'rgba(20,32,31,.92)'; g.fill();
    g.lineWidth = 5; g.strokeStyle = '#' + new THREE.Color(STATUS_COL[p.status]).getHexString(); g.stroke();
    g.fillStyle = p.status === 'sold' ? '#8e9c99' : '#f1f4f2';
    g.font = '52px "Didact Gothic", "Century Gothic", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(String(p.no), 64, 68);
    var tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
    sp.scale.set(3.0, 3.0, 1);
    sp.position.set(x, y + 3.6, z);
    sp.userData.plot = p;
    sp.renderOrder = 5;
    scene.add(sp);
    m.userData.sprite = sp;
    // a thin stem
    var stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 5), new THREE.MeshBasicMaterial({ color: 0xd9e2df }));
    stem.position.set(x, y + 1.35, z);
    scene.add(stem);
  });

  /* ---------------- the forest ---------------- */
  var COUNT = small ? 1800 : 3400;
  var treeGeo = new THREE.ConeGeometry(0.62, 2.1, 6);
  treeGeo.translate(0, 1.55, 0);
  var trunkGeo = new THREE.CylinderGeometry(0.09, 0.12, 0.6, 5);
  trunkGeo.translate(0, 0.3, 0);
  var treeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 });
  var trunkMat = new THREE.MeshStandardMaterial({ color: 0x3d3128, roughness: 0.95 });
  var trees = new THREE.InstancedMesh(treeGeo, treeMat, COUNT);
  var trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, COUNT);
  var dummy = new THREE.Object3D();
  var tc = new THREE.Color();
  var seed = 7;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  var placed = 0, tries = 0;
  while (placed < COUNT && tries < COUNT * 12) {
    tries++;
    var tx = (rnd() - 0.5) * (W - 6), tz = (rnd() - 0.5) * (D - 6);
    var ty = height(tx, tz);
    if (ty < 0.7) continue;                                     // not in the loch or on the shingle
    if (ty > 9.2 && rnd() < 0.8) continue;                      // the ridge top is heather
    var ok = true;
    for (var q = 0; q < pads.length; q++) {                     // nothing on a building platform
      var pd = pads[q].position;
      if (Math.abs(pd.x - tx) < 4.6 && Math.abs(pd.z - tz) < 4.6) { ok = false; break; }
    }
    if (!ok) continue;
    if (Math.abs(tx + 8) < 5 && Math.abs(tz - 38) < 4) continue;   // the Steading yard
    if (tz > 40 && rnd() < 0.5) continue;                        // thinner toward the road
    var sc = 0.55 + rnd() * 0.5;
    dummy.position.set(tx, ty - 0.05, tz);
    dummy.rotation.set(0, rnd() * Math.PI, 0);
    dummy.scale.set(sc, sc * (0.85 + rnd() * 0.5), sc);
    dummy.updateMatrix();
    trees.setMatrixAt(placed, dummy.matrix);
    trunks.setMatrixAt(placed, dummy.matrix);
    tc.setHSL(0.37 + rnd() * 0.07, 0.24 + rnd() * 0.14, 0.2 + rnd() * 0.12);
    trees.setColorAt(placed, tc);
    placed++;
  }
  trees.count = placed; trunks.count = placed;
  trees.castShadow = true; trees.receiveShadow = true;
  scene.add(trees); scene.add(trunks);

  /* ---------------- light ---------------- */
  scene.add(new THREE.HemisphereLight(0xb6c9c6, 0x1a2928, 1.0));
  var sun = new THREE.DirectionalLight(0xfff1dc, 2.0);
  sun.position.set(45, 95, 75);
  sun.castShadow = true;
  sun.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
  sun.shadow.camera.left = -85; sun.shadow.camera.right = 85;
  sun.shadow.camera.top = 70; sun.shadow.camera.bottom = -70;
  sun.shadow.camera.near = 20; sun.shadow.camera.far = 260;
  sun.shadow.bias = -0.0008;
  scene.add(sun);

  /* ---------------- camera: a turntable you can lean on ---------------- */
  var target = new THREE.Vector3(-2, 2, 12);
  var view = { yaw: -0.5, pitch: small ? 1.0 : 0.93, dist: small ? 112 : 118 };
  var goal = { yaw: view.yaw, pitch: view.pitch, dist: view.dist };
  var LIM = { pitch: [0.5, 1.3], dist: [70, 190] };
  var auto = !reduce, touched = false;

  function place() {
    camera.position.set(
      target.x + view.dist * Math.sin(view.pitch) * Math.sin(view.yaw),
      target.y + view.dist * Math.cos(view.pitch),
      target.z + view.dist * Math.sin(view.pitch) * Math.cos(view.yaw));
    camera.lookAt(target);
  }

  function resize() {
    var w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    need = true;
  }
  var ro = new ResizeObserver(resize);
  ro.observe(host);
  resize();

  /* ---------------- pointer: orbit, pinch, hover, click ---------------- */
  var el = renderer.domElement;
  var drag = null, pointers = {}, pinch0 = 0, dist0 = 0, moved = 0;
  var ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  var hover = null, selected = null;
  var tip = document.getElementById('modelTip');
  var card = document.getElementById('modelCard');

  el.addEventListener('pointerdown', function (e) {
    pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
    var ids = Object.keys(pointers);
    if (ids.length === 1) { drag = { x: e.clientX, y: e.clientY, yaw: goal.yaw, pitch: goal.pitch }; moved = 0; wrap.classList.add('is-dragging'); }
    if (ids.length === 2) { var a = pointers[ids[0]], b = pointers[ids[1]]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); dist0 = goal.dist; drag = null; }
    el.setPointerCapture(e.pointerId);
    auto = false; touched = true; wrap.classList.add('is-touched');
  });
  el.addEventListener('pointermove', function (e) {
    if (pointers[e.pointerId]) pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
    var ids = Object.keys(pointers);
    if (ids.length === 2 && pinch0) {
      var a = pointers[ids[0]], b = pointers[ids[1]];
      var d = Math.hypot(a.x - b.x, a.y - b.y);
      goal.dist = clamp(dist0 * pinch0 / Math.max(1, d), LIM.dist);
      need = true;
      return;
    }
    if (drag && ids.length === 1) {
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      moved = Math.max(moved, Math.abs(dx) + Math.abs(dy));
      goal.yaw = drag.yaw - dx * 0.0055;
      goal.pitch = clamp(drag.pitch - dy * 0.0035, LIM.pitch);
      need = true;
      return;
    }
    if (fine) pick(e, false);
  });
  function endPointer(e) {
    delete pointers[e.pointerId];
    if (!Object.keys(pointers).length) {
      if (drag && moved < 6 && e.type === 'pointerup') pick(e, true);
      drag = null; pinch0 = 0;
      wrap.classList.remove('is-dragging');
    }
  }
  el.addEventListener('pointerup', endPointer);
  el.addEventListener('pointercancel', endPointer);
  el.addEventListener('pointerleave', function () { if (!drag) setHover(null); });
  // the wheel zooms only once you have taken hold of the model, so the page still scrolls past it
  el.addEventListener('wheel', function (e) {
    if (!touched) return;
    e.preventDefault();
    goal.dist = clamp(goal.dist * (1 + Math.sign(e.deltaY) * 0.08), LIM.dist);
    need = true;
  }, { passive: false });

  function clamp(v, lim) { return Math.min(lim[1], Math.max(lim[0], v)); }

  function pick(e, click) {
    var r = el.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    var hits = ray.intersectObjects(pads.concat(pads.map(function (p) { return p.userData.sprite; })), false);
    var plot = hits.length ? hits[0].object.userData.plot : null;
    if (click) select(plot, e);
    else setHover(plot, e);
  }

  function setHover(plot, e) {
    if (hover && (!plot || plot.no !== hover.no)) {
      var pm = padByNo[hover.no]; pm.material.emissiveIntensity = 0.12; pm.scale.y = 1;
    }
    hover = plot;
    el.style.cursor = plot ? 'pointer' : '';
    if (!plot) { tip.classList.remove('is-on'); need = true; return; }
    var m = padByNo[plot.no]; m.material.emissiveIntensity = 0.45; m.scale.y = 1.6;
    tip.innerHTML = '<b>Plot ' + plot.no + '</b>' + typeName(plot) + ' &middot; ' + plot.size.toLocaleString('en-GB') + ' m&sup2;<br><em>' + A.money(plot.price) + '</em> &middot; ' + plot.status.charAt(0).toUpperCase() + plot.status.slice(1);
    var r = wrap.getBoundingClientRect();
    tip.style.left = (e.clientX - r.left) + 'px';
    tip.style.top = (e.clientY - r.top) + 'px';
    tip.classList.add('is-on');
    need = true;
  }
  function typeName(p) { return { woodland: 'Woodland', ridge: 'Ridge', lochside: 'Lochside' }[p.type]; }

  function select(plot) {
    selected = plot;
    if (!plot) { card.hidden = true; return; }
    var acres = (plot.size / 4046.86).toFixed(2);
    var meta = plot.type === 'lochside' ? plot.shore + ' m of shore, to the waterline' : plot.type === 'ridge' ? plot.elev + ' m above the loch' : 'under the canopy, on the loop road';
    var act = plot.status === 'available'
      ? '<a class="btn btn--sm" href="visit.html?plot=' + plot.no + '#book">Reserve plot ' + plot.no + '</a>'
      : plot.status === 'reserved' ? '<a class="btn btn--sm btn--ghost" href="visit.html?plot=' + plot.no + '&amp;wait=1#book">Tell me if it comes back</a>' : '<span class="chip">Sold</span>';
    card.innerHTML = '<button class="close" type="button" aria-label="Close">&times;</button>' +
      '<p class="tile__eyebrow">' + typeName(plot) + ' &middot; ' + plot.status + '</p>' +
      '<h4>Plot ' + plot.no + '</h4>' +
      '<p>' + plot.size.toLocaleString('en-GB') + ' m&sup2; (' + acres + ' acres) &middot; ' + meta + '<br>' + A.esc(plot.note) + '</p>' +
      '<p class="price">' + A.money(plot.price) + '</p>' +
      '<div class="row">' + act + ' <button class="btn btn--sm btn--ghost" type="button" data-show="' + plot.no + '">In the schedule</button></div>';
    card.hidden = false;
    // fly the camera to it
    var m = padByNo[plot.no];
    target.set(m.position.x, m.position.y, m.position.z);
    goal.dist = Math.min(goal.dist, 92);
    need = true;
  }
  card.addEventListener('click', function (e) {
    if (e.target.closest('.close')) { select(null); target.set(-2, 2, 12); need = true; }
    var b = e.target.closest('[data-show]');
    if (b) {
      var row = document.querySelector('.plot[data-no="' + b.getAttribute('data-show') + '"]');
      var all = document.querySelector('#typeSeg button[data-type="all"]');
      if (!row && all) { all.click(); row = document.querySelector('.plot[data-no="' + b.getAttribute('data-show') + '"]'); }
      if (row) {
        row.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
        row.classList.add('is-flash');
        setTimeout(function () { row.classList.remove('is-flash'); }, 2400);
      }
    }
  });

  /* ---------------- the controls under the model ---------------- */
  document.querySelectorAll('[data-zoom]').forEach(function (b) {
    b.addEventListener('click', function () {
      goal.dist = clamp(goal.dist * (b.getAttribute('data-zoom') === 'in' ? 0.8 : 1.25), LIM.dist);
      auto = false; touched = true; wrap.classList.add('is-touched'); need = true;
    });
  });
  var resetBtn = document.getElementById('modelReset');
  if (resetBtn) resetBtn.addEventListener('click', function () {
    goal.yaw = -0.5; goal.pitch = small ? 1.0 : 0.93; goal.dist = small ? 112 : 118;
    target.set(-2, 2, 12); select(null); setHover(null);
    dim('all'); need = true;
  });
  var seg = document.getElementById('modelSeg');
  if (seg) seg.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    seg.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
    dim(b.getAttribute('data-type'));
    auto = false; touched = true; wrap.classList.add('is-touched');
  });
  function dim(type) {
    pads.forEach(function (m) {
      var on = type === 'all' || m.userData.plot.type === type;
      m.material.opacity = on ? (m.userData.plot.status === 'sold' ? 0.75 : 0.95) : 0.18;
      m.userData.sprite.material.opacity = on ? 1 : 0.25;
    });
    need = true;
  }

  /* ---------------- render only while on screen ---------------- */
  var need = true, visible = false, raf = 0, last = 0;
  var io = new IntersectionObserver(function (entries) {
    visible = entries[0].isIntersecting;
    if (visible) { if (!raf) raf = requestAnimationFrame(tick); }
  }, { threshold: 0.05 });
  io.observe(wrap);

  function tick(t) {
    raf = 0;
    if (!visible) return;
    var dt = Math.min(0.05, (t - last) / 1000 || 0.016);
    last = t;
    if (auto) goal.yaw += dt * 0.06;
    var k = 1 - Math.pow(0.001, dt);
    var dy = goal.yaw - view.yaw, dp = goal.pitch - view.pitch, dd = goal.dist - view.dist;
    view.yaw += dy * k; view.pitch += dp * k; view.dist += dd * k;
    var moving = auto || Math.abs(dy) > 1e-4 || Math.abs(dp) > 1e-4 || Math.abs(dd) > 0.01;
    if (moving || need) {
      place();
      renderer.render(scene, camera);
      need = false;
    }
    raf = requestAnimationFrame(tick);
  }
  place();
  renderer.render(scene, camera);
  raf = requestAnimationFrame(tick);

  // arriving with a plot in the hash (plots.html#plot-19) selects it
  var m = /plot-(\d+)/.exec(location.hash);
  if (m) { var p0 = PLOTS.filter(function (p) { return p.no === +m[1]; })[0]; if (p0) select(p0); }
})();
