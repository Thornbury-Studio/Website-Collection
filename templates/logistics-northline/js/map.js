/* NORTHLINE — the living network board.
   A tilted instrument plane: dot-matrix world (Natural Earth grid), lane
   arcs lifted in z, node marks by kind, vessels in motion, pulsing risk
   zones. Cursor gives parallax only — no scroll cinematics. The catalogue
   in data.js drives everything; hover links both ways with the feed. */

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

(function () {
  "use strict";

  var NL = window.NL, LAND = window.NL_LAND;
  var host = document.getElementById("map-canvas");
  var screenEl = document.getElementById("screen");
  var tipEl = document.getElementById("map-tip");
  if (!NL || !LAND || !host || !screenEl) return;

  var COARSE = matchMedia("(pointer: coarse)").matches;
  var SMALL = matchMedia("(max-width: 760px)").matches;
  var MOBILE = COARSE && SMALL;
  var REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- projection ---------------- */
  var WORLD_W = 4.0, WORLD_H = 2.0;   /* board units for 360 x 180 deg */
  var LAT_MIN = -56;                   /* trim Antarctica */

  function xy(lat, lon) {
    return {
      x: (lon / 180) * (WORLD_W / 2),
      y: (lat / 90) * (WORLD_H / 2)
    };
  }

  /* ---------------- renderer ---------------- */
  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  } catch (e) {
    screenEl.classList.add("no3d");
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MOBILE ? 1.5 : 2));
  host.appendChild(renderer.domElement);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(30, 1, 0.1, 30);

  var board = new THREE.Group();
  board.rotation.x = -0.48;            /* the table tilt */
  scene.add(board);

  /* ---------------- palette ---------------- */
  var C = {
    dot: new THREE.Color("#46536a"),
    dotBright: new THREE.Color("#3a4557"),
    ok: new THREE.Color("#2e7d57"),
    watch: new THREE.Color("#b97a0a"),
    alert: new THREE.Color("#bf3f22"),
    vessel: new THREE.Color("#dbe4ea"),
    node: new THREE.Color("#9fb2c8")
  };
  function statusColor(s) { return s === "alert" ? C.alert : s === "watch" ? C.watch : C.ok; }

  /* ---------------- land dots ---------------- */
  var landMat = null;
  var markScale = 1;                   /* set in resize from camera distance */
  (function buildLand() {
    var step = MOBILE ? 2 : 1;         /* subsample on phones */
    var pos = [];
    for (var r = 0; r < LAND.h; r += step) {
      var lat = 90 - (r + 0.5) * (180 / LAND.h);
      if (lat < LAT_MIN) continue;
      for (var c = 0; c < LAND.w; c += step) {
        if (LAND.bits.charAt(r * LAND.w + c) !== "1") continue;
        var lon = -180 + (c + 0.5) * (360 / LAND.w);
        var p = xy(lat, lon);
        pos.push(p.x, p.y, 0);
      }
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    var m = new THREE.PointsMaterial({
      color: C.dot, size: 0.016, sizeAttenuation: true,
      transparent: true, opacity: 0.95
    });
    landMat = m;
    board.add(new THREE.Points(g, m));
  })();

  /* ---------------- arcs ---------------- */
  var laneLines = {};
  var laneCurves = {};                 /* id -> {curve, wraps} for vessels */

  function laneCurve(a, b) {
    /* unwrap dateline: sample in continuous lon space */
    var lon1 = a.lon, lon2 = b.lon;
    if (Math.abs(lon2 - lon1) > 180) lon2 += (lon2 < lon1 ? 360 : -360);
    var mLat = (a.lat + b.lat) / 2, mLon = (lon1 + lon2) / 2;
    var p1 = xy(a.lat, lon1), p2 = xy(b.lat, lon2), pm = xy(mLat, mLon);
    var d = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    var lift = Math.min(0.42, 0.10 + d * 0.16);
    return new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(p1.x, p1.y, 0.005),
      new THREE.Vector3(pm.x, pm.y, lift),
      new THREE.Vector3(p2.x, p2.y, 0.005)
    );
  }

  function wrapX(x) {
    var half = WORLD_W / 2;
    if (x > half) return x - WORLD_W;
    if (x < -half) return x + WORLD_W;
    return x;
  }

  NL.lanes.forEach(function (lane) {
    var a = NL.nodeById(lane.from), b = NL.nodeById(lane.to);
    if (!a || !b) return;
    var curve = laneCurve(a, b);
    laneCurves[lane.id] = curve;

    var pts = curve.getPoints(72);
    /* split segments at dateline wrap */
    var runs = [[]];
    var prevX = null;
    pts.forEach(function (p) {
      var x = wrapX(p.x);
      if (prevX !== null && Math.abs(x - prevX) > WORLD_W / 2) runs.push([]);
      runs[runs.length - 1].push(new THREE.Vector3(x, p.y, p.z));
      prevX = x;
    });

    var group = new THREE.Group();
    runs.forEach(function (run) {
      if (run.length < 2) return;
      var g = new THREE.BufferGeometry().setFromPoints(run);
      var m = new THREE.LineDashedMaterial({
        color: statusColor(lane.status),
        transparent: true,
        opacity: lane.status === "ok" ? 0.42 : 0.8,
        dashSize: 0.05, gapSize: 0.028
      });
      var line = new THREE.Line(g, m);
      line.computeLineDistances();
      group.add(line);
    });
    board.add(group);
    laneLines[lane.id] = group;
  });

  /* ---------------- node marks ---------------- */
  function spriteTexture(draw) {
    var cv = document.createElement("canvas");
    cv.width = cv.height = 64;
    var ctx = cv.getContext("2d");
    draw(ctx);
    var tx = new THREE.CanvasTexture(cv);
    tx.anisotropy = 1;
    return tx;
  }
  var texCircle = spriteTexture(function (ctx) {
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(32, 32, 14, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#fff"; ctx.globalAlpha = 0.35; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.arc(32, 32, 24, 0, Math.PI * 2); ctx.stroke();
  });
  var texDiamond = spriteTexture(function (ctx) {
    ctx.fillStyle = "#fff";
    ctx.translate(32, 32); ctx.rotate(Math.PI / 4);
    ctx.fillRect(-11, -11, 22, 22);
  });
  var texSquare = spriteTexture(function (ctx) {
    ctx.fillStyle = "#fff";
    ctx.fillRect(18, 18, 28, 28);
  });

  var nodeSprites = {};
  NL.nodes.forEach(function (n) {
    var p = xy(n.lat, n.lon);
    var tex = n.kind === "factory" ? texDiamond : n.kind === "dc" ? texSquare : texCircle;
    var mat = new THREE.SpriteMaterial({
      map: tex, transparent: true,
      color: n.status === "ok" ? C.node : statusColor(n.status)
    });
    var s = new THREE.Sprite(mat);
    s.position.set(p.x, p.y, 0.012);
    var base = n.kind === "port" ? 0.052 : 0.042;
    s.scale.set(base, base, 1);
    s.userData = { id: n.id, base: base };
    board.add(s);
    nodeSprites[n.id] = s;
  });

  /* ---------------- risk zones ---------------- */
  var riskRings = [];
  NL.risks.forEach(function (rz) {
    var p = xy(rz.lat, rz.lon);
    var radius = rz.r / 90 * (WORLD_H / 2);
    var col = rz.sev === "red" ? C.alert : C.watch;

    var ring = new THREE.Mesh(
      new THREE.RingGeometry(radius * 0.92, radius, 48),
      new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.65, side: THREE.DoubleSide })
    );
    ring.position.set(p.x, p.y, 0.006);
    board.add(ring);

    var fill = new THREE.Mesh(
      new THREE.CircleGeometry(radius, 48),
      new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.07, side: THREE.DoubleSide })
    );
    fill.position.set(p.x, p.y, 0.004);
    board.add(fill);

    riskRings.push({ ring: ring, fill: fill, phase: Math.random() * Math.PI * 2 });
  });

  /* ---------------- vessels ---------------- */
  var vesselSprites = [];
  var texVessel = spriteTexture(function (ctx) {
    var g = ctx.createRadialGradient(32, 32, 2, 32, 32, 26);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.35, "rgba(230,238,244,0.85)");
    g.addColorStop(1, "rgba(230,238,244,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
  });
  NL.vessels.forEach(function (v) {
    var mat = new THREE.SpriteMaterial({ map: texVessel, transparent: true, color: C.vessel });
    var s = new THREE.Sprite(mat);
    s.scale.set(0.05, 0.05, 1);
    s.userData = { lane: v.lane, t: v.t, speed: 0.0065 + Math.random() * 0.004 };
    board.add(s);
    vesselSprites.push(s);
  });

  function placeVessel(s, t) {
    var curve = laneCurves[s.userData.lane];
    if (!curve) return;
    var p = curve.getPoint(t);
    s.position.set(wrapX(p.x), p.y, p.z + 0.004);
  }
  vesselSprites.forEach(function (s) { placeVessel(s, s.userData.t); });

  /* ---------------- camera + parallax ----------------
     Framing is computed: fit the full board width into the stage, biased
     left so the docked feed doesn't cover the Pacific. */
  var CAM_BASE = { x: 0.3, y: -0.85, z: 2.6 };
  var LOOK = new THREE.Vector3(0.3, 0.02, 0);
  camera.position.set(CAM_BASE.x, CAM_BASE.y, CAM_BASE.z);
  camera.lookAt(LOOK);

  var px = 0, py = 0, tx = 0, ty = 0;
  if (!COARSE && !REDUCED) {
    screenEl.addEventListener("pointermove", function (e) {
      var r = screenEl.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
    });
    screenEl.addEventListener("pointerleave", function () { tx = 0; ty = 0; });
  }

  /* ---------------- hover: raycast nodes ---------------- */
  var ray = new THREE.Raycaster();
  var mouse = new THREE.Vector2();
  var hoverId = null;
  var focusId = null;                  /* set from the feed */

  function setHover(id) {
    if (hoverId === id) return;
    hoverId = id;
    if (tipEl) tipEl.hidden = !id;
    if (id) {
      var n = NL.nodeById(id);
      if (n && tipEl) {
        tipEl.textContent = "";
        var b = document.createElement("b");
        b.textContent = n.name;
        var meta = document.createElement("span");
        var kindLabel = n.kind === "dc" ? "distribution" : n.kind;
        meta.textContent = kindLabel + " · " + n.status.toUpperCase();
        meta.className = "tip-" + n.status;
        tipEl.appendChild(b);
        tipEl.appendChild(meta);
      }
    }
    /* two-way link: tell the feed */
    document.querySelectorAll("[data-exnode]").forEach(function (row) {
      row.classList.toggle("linked", !!id && row.getAttribute("data-exnode") === id);
    });
    host.style.cursor = id ? "pointer" : "default";
  }

  if (!COARSE) {
    renderer.domElement.addEventListener("pointermove", function (e) {
      var r = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      mouse.y = -((e.clientY - r.top) / r.height) * 2 + 1;
      ray.setFromCamera(mouse, camera);
      var sprites = Object.keys(nodeSprites).map(function (k) { return nodeSprites[k]; });
      var hits = ray.intersectObjects(sprites, false);
      setHover(hits.length ? hits[0].object.userData.id : null);
      if (hits.length && tipEl) {
        tipEl.style.left = (e.clientX - r.left + 14) + "px";
        tipEl.style.top = (e.clientY - r.top - 8) + "px";
      }
    });
    renderer.domElement.addEventListener("pointerleave", function () { setHover(null); });
  }

  /* feed → map focus */
  window.NLMAP = {
    focus: function (id) { focusId = id; },
    ready: true
  };

  /* ---------------- sizing ---------------- */
  function resize() {
    var w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    /* on desktop the feed overlays the right ~320px — fit the board into
       what remains, with a little margin */
    var feedPx = (w > 760 && w * 0.44 > 300) ? Math.min(320, w * 0.44) : 0;
    var usable = Math.max(0.45, (w - feedPx) / w);
    var half = Math.tan((camera.fov * Math.PI) / 360);
    var need = (WORLD_W * 1.06) / (2 * half * camera.aspect * usable);
    CAM_BASE.z = Math.max(1.5, need);
    /* bias the look target so the board centres in the usable region */
    LOOK.x = (WORLD_W / 2) * (1 - usable) * 0.9;
    CAM_BASE.x = LOOK.x;
    camera.position.set(CAM_BASE.x, CAM_BASE.y, CAM_BASE.z);
    camera.lookAt(LOOK);
    camera.updateProjectionMatrix();

    /* marks keep apparent size regardless of camera distance */
    markScale = CAM_BASE.z / 2.6;
    if (landMat) landMat.size = 0.016 * markScale;
    vesselSprites.forEach(function (s) {
      s.scale.set(0.055 * markScale, 0.055 * markScale, 1);
    });
  }
  resize();
  window.addEventListener("resize", resize);

  /* ---------------- loop ---------------- */
  var visible = true, pageVisible = true;
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { visible = e.isIntersecting; });
    }, { threshold: 0.02 }).observe(screenEl);
  }
  document.addEventListener("visibilitychange", function () {
    pageVisible = document.visibilityState !== "hidden";
  });

  function frame(now) {
    requestAnimationFrame(frame);
    if (!visible || !pageVisible) return;
    var t = (now || 0) / 1000;

    /* parallax easing */
    px += (tx - px) * 0.05;
    py += (ty - py) * 0.05;
    camera.position.x = CAM_BASE.x + px * 0.14;
    camera.position.y = CAM_BASE.y - py * 0.09;
    camera.position.z = CAM_BASE.z;
    if (REDUCED) { camera.position.x = CAM_BASE.x; camera.position.y = CAM_BASE.y; }
    camera.lookAt(LOOK);

    /* vessels drift */
    if (!REDUCED) {
      vesselSprites.forEach(function (s) {
        s.userData.t += s.userData.speed / 60;
        if (s.userData.t > 1) s.userData.t = 0;
        placeVessel(s, s.userData.t);
      });
    }

    /* risk pulse */
    riskRings.forEach(function (rz) {
      var k = REDUCED ? 0.5 : (Math.sin(t * 1.6 + rz.phase) + 1) / 2;
      rz.ring.material.opacity = 0.35 + k * 0.4;
      var sc = 1 + k * 0.05;
      rz.ring.scale.set(sc, sc, 1);
    });

    /* node pulse for hover/focus + status breathing */
    Object.keys(nodeSprites).forEach(function (id) {
      var s = nodeSprites[id];
      var n = NL.nodeById(id);
      var base = s.userData.base;
      var k = 1;
      if (id === hoverId || id === focusId) k = 1.55;
      else if (n.status !== "ok" && !REDUCED) k = 1 + 0.16 * (Math.sin(t * 2.2 + id.length) + 1) / 2;
      k *= markScale;
      s.scale.set(base * k, base * k, 1);
    });

    renderer.render(scene, camera);
  }
  /* paint one frame synchronously — hidden-tab rAF never fires */
  resize();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);

  screenEl.classList.add("live");
})();
