/* THORNBURY DIGITAL v6 — the light.

   Two fixed canvases share one fragment shader. #wall paints the lit wall
   underneath the page; #shade paints only the illumination factor and is
   composited with mix-blend-mode: multiply over everything, so the type and
   the plates are shaded by the same screen as the wall behind them.

   The model: the page is the floor of a room in Singapore. Above it hangs a
   screen of ventilation blocks (circle-in-square, petal and plain-square
   cells, the tropical-modernist mix). The sun comes through it.

   The day is EIGHT AUTHORED MOMENTS, not a clock. Each one below is a fixed
   set of numbers that was rendered, looked at and kept — dawn, morning, late
   morning, noon, afternoon, golden hour, dusk, night. The room walks through
   them on a slow ambient loop, crossfading the finished picture of one moment
   into the finished picture of the next; the shader never invents an
   in-between arrangement. The loop starts at the moment nearest the real
   Singapore time, so the first thing you see is roughly the light outside.
   The rail lets a visitor stop the loop and pick a moment.

   It renders only while a crossfade is running or when scroll, pointer or
   size changed. At rest it costs nothing.

   Exposed as window.TBLight: { go(i), resume(), pause(), index(), state(),
   STATES, invalidate(), isPaused() } */
(function () {
  "use strict";

  var doc = document.documentElement;
  var wallCv = document.getElementById("wall");
  var shadeCv = document.getElementById("shade");
  var Sun = window.TBSun;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var coarse = window.matchMedia("(pointer: coarse)").matches;

  /* The eight moments. alt/az set the geometry of the beams; direct is the
     sun's strength through the screen; high softens and dims an overhead sun;
     lamp is the street lamp after dark; dark flips the wall (and the text
     tokens) to night; warm is the colour of the sun from white to amber; fall
     is how much the light weakens across the floor away from the sun's side;
     pen adds penumbra; stretch draws the patches long; cell scales the screen;
     depth is the block's own thickness — the thing that turns a low sun into
     slivers. hour is only what the rail prints. */
  var STATES = [
    { key: "dawn",         name: "Dawn",         word: "first light",      hour: "06:55", alt: 5,  az: 84,  direct: 0.75, high: 0, lamp: 0.35, dark: 1, warm: 1.0,  fall: 0.6, pen: 0.010, stretch: 1.6, cell: 1.00, depth: 0.05 },
    { key: "morning",      name: "Morning",      word: "morning light",    hour: "08:30", alt: 21, az: 84,  direct: 1.0,  high: 0, lamp: 0,    dark: 0, warm: 0.45, fall: 1.0, pen: 0.000, stretch: 1.0, cell: 1.00, depth: 0.30 },
    { key: "late-morning", name: "Late morning", word: "a high morning sun", hour: "10:30", alt: 51, az: 83, direct: 1.0, high: 0, lamp: 0,    dark: 0, warm: 0.12, fall: 1.0, pen: 0.000, stretch: 1.0, cell: 1.00, depth: 0.30 },
    { key: "noon",         name: "Noon",         word: "an overhead sun",  hour: "13:00", alt: 85, az: 10,  direct: 0.85, high: 1, lamp: 0,    dark: 0, warm: 0.0,  fall: 0.0, pen: 0.030, stretch: 1.0, cell: 1.06, depth: 0.30 },
    { key: "afternoon",    name: "Afternoon",    word: "afternoon light",  hour: "15:30", alt: 53, az: 280, direct: 1.0,  high: 0, lamp: 0,    dark: 0, warm: 0.15, fall: 1.0, pen: 0.000, stretch: 1.0, cell: 1.00, depth: 0.30 },
    { key: "golden",       name: "Golden hour",  word: "golden hour",      hour: "17:40", alt: 20, az: 277, direct: 1.0,  high: 0, lamp: 0,    dark: 0, warm: 0.92, fall: 1.0, pen: 0.000, stretch: 1.0, cell: 1.00, depth: 0.30 },
    { key: "dusk",         name: "Dusk",         word: "dusk",             hour: "19:00", alt: 7,  az: 276, direct: 0.6,  high: 0, lamp: 0.75, dark: 1, warm: 1.0,  fall: 0.6, pen: 0.010, stretch: 1.4, cell: 1.00, depth: 0.06 },
    { key: "night",        name: "Night",        word: "night, a street lamp", hour: "22:00", alt: -30, az: 276, direct: 0, high: 0, lamp: 1.0, dark: 1, warm: 1.0, fall: 0.0, pen: 0.000, stretch: 1.0, cell: 1.00, depth: 0.30 }
  ];
  var HOLD = 14000;   // ms a moment is held
  var FADE = 2600;    // ms of crossfade between two moments

  var VS = "#version 300 es\nin vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }";
  var FS = [
    "#version 300 es",
    "precision highp float;",
    "out vec4 o;",
    "uniform vec2 u_res;",      // canvas px
    "uniform float u_scroll;",  // page scroll in css px
    "uniform vec2 u_par;",      // pointer parallax, cells
    "uniform float u_cell;",    // cell size in css px
    "uniform float u_dpr;",
    "uniform float u_mode;",    // 0 wall, 1 shade
    "uniform vec3 u_wallDay;",
    "uniform vec3 u_wallNight;",
    "uniform float u_t;",
    "uniform float u_mix;",     // 0 = moment A, 1 = moment B
    "uniform float u_sa[12];",  // sinAlt, az, direct, high, lamp, dark, warm, fall, pen, stretch, cell, depth
    "uniform float u_sb[12];",
    "float h21(vec2 p){ p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.x); }",
    "float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);",
    "  return mix(mix(h21(i), h21(i + vec2(1,0)), f.x), mix(h21(i + vec2(0,1)), h21(i + vec2(1,1)), f.x), f.y); }",
    // the screen: three kinds of block, chosen per cell from one fixed seed,
    // the way a real vent wall mixes them. Openings return 1.
    "float opening(vec2 q, float w){",
    "  vec2 id = floor(q);",
    "  float kind = h21(id + 7.3);",
    "  vec2 c = fract(q) - 0.5;",
    "  float ac = max(abs(c.x), abs(c.y));",
    "  vec2 k = abs(c) - 0.5;",
    "  if (kind < 0.56) {",
    "    float a = smoothstep(0.30 + w, 0.30 - w, length(c));",
    "    float b = smoothstep(0.125 + w, 0.125 - w, length(k));",
    "    return max(a, b);",
    "  } else if (kind < 0.82) {",
    "    float sq = smoothstep(0.405 + w, 0.405 - w, ac);",
    "    float corner = smoothstep(0.33 - w, 0.33 + w, length(k));",
    "    return sq * corner;",
    "  }",
    "  return smoothstep(0.30 + w, 0.30 - w, ac);",
    "}",
    // light through the screen from a direction (sinAlt, az) onto the floor
    "float beam(vec2 q, float sinAlt, float az, float H, float T, float pen, float stretchK){",
    "  float cosAlt = sqrt(max(0.0, 1.0 - sinAlt * sinAlt));",
    "  float cot = min(cosAlt / max(sinAlt, 0.035), 4.0);",
    "  vec2 dir = vec2(sin(az), -cos(az));",       // page x = east, page y down = south
    "  vec2 shiftH = dir * cot * H;",              // the opening this floor point sees the sun through
    "  vec2 shiftT = dir * cot * T;",              // the block's own depth, cutting the beam at low sun
    "  float stretch = (1.0 + 0.45 * min(cot, 3.5)) * stretchK;",
    "  vec2 n = normalize(dir + vec2(1e-4, 0.0));",
    "  vec2 t = vec2(-n.y, n.x);",
    "  vec2 qs = q + shiftH;",
    "  vec2 qq = n * (dot(qs, n) / stretch) + t * dot(qs, t);",
    "  vec2 q2 = qq - shiftT;",
    "  float w = pen * (0.45 + 0.35 * min(cot, 3.0));",
    "  return opening(qq, w) * opening(q2, w * 0.7);",
    "}",
    // one authored moment, evaluated for this pixel
    "void moment(float s[12], vec2 css, vec2 qb, float grain, out vec3 col, out float shadeF){",
    "  float sinAlt = s[0], az = s[1];",
    "  vec2 q = qb / s[10];",
    "  float side = sin(az);",
    "  float across = css.x / (u_res.x / u_dpr) - 0.5;",
    "  float far = clamp(-side * across * 2.2, 0.0, 1.0) * s[7];",
    "  float fallI = 1.0 - 0.5 * far;",
    "  float direct = s[2] * fallI * (1.0 - 0.3 * s[3]) * beam(q, max(sinAlt, 0.02), az, 5.2, s[11], 0.024 + 0.05 * far + 0.03 * s[3] + s[8], s[9]);",
    "  vec3 sunCol = mix(vec3(1.0, 0.965, 0.90), vec3(1.0, 0.62, 0.30), s[6]);",
    "  float lampB = beam(q + vec2(-1.7, 0.9), 0.515, 4.26, 4.2, 0.30, 0.05, 1.0);",
    "  vec2 lampAt = vec2(0.0, 0.42 * u_res.y / u_dpr + u_scroll);",
    "  float lampFall = 1.0 / (1.0 + pow(length((css + vec2(0.0, u_scroll) - lampAt) / (u_cell * 6.5)), 2.0));",
    "  float lamp = s[4] * lampB * (0.35 + 0.65 * lampFall);",
    "  vec3 lampCol = vec3(1.0, 0.66, 0.34);",
    "  vec3 wall = mix(u_wallDay, u_wallNight, s[5]);",
    "  vec3 lit = wall * (0.985 + 0.19 * direct) * mix(vec3(1.0), sunCol, direct * 0.9);",
    "  vec3 nightBase = wall * (0.92 + 0.08 * lampFall);",
    "  vec3 nightLit = nightBase + lampCol * lamp * 0.58 + sunCol * direct * 0.42;",
    "  col = mix(lit, nightLit, s[5]) + grain * mix(0.016, 0.010, s[5]);",
    "  float amb = mix(0.79, 0.90, smoothstep(0.15, 0.85, sinAlt));",
    "  float shadeDay = amb + (1.0 - amb) * clamp(direct * 1.2, 0.0, 1.0);",
    "  float shadeNight = 0.80 + 0.20 * clamp(max(lamp * 1.4, direct * 1.2), 0.0, 1.0);",
    "  shadeF = mix(shadeDay, shadeNight, s[5]);",
    "}",
    "void main(){",
    "  vec2 px = gl_FragCoord.xy / u_dpr;",
    "  vec2 css = vec2(px.x, (u_res.y / u_dpr) - px.y);",
    "  vec2 qb = (css + vec2(0.0, u_scroll)) / u_cell + u_par;",
    "  float grain = (vnoise(css * 0.9) * 0.6 + vnoise(css * 3.1) * 0.4 - 0.5);",
    "  float dither = (h21(css + u_t) - 0.5) / 255.0;",
    "  vec3 ca, cb; float fa, fb;",
    "  moment(u_sa, css, qb, grain, ca, fa);",
    "  moment(u_sb, css, qb, grain, cb, fb);",
    "  if (u_mode < 0.5) o = vec4(mix(ca, cb, u_mix) + dither, 1.0);",
    "  else o = vec4(vec3(mix(fa, fb, u_mix) + dither), 1.0);",
    "}"
  ].join("\n");

  function makeGL(cv, dprCap) {
    var gl = cv.getContext("webgl2", { alpha: false, antialias: false, premultipliedAlpha: false, preserveDrawingBuffer: false, powerPreference: "low-power" });
    if (!gl) return null;
    function sh(type, src) {
      var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.error(gl.getShaderInfoLog(s)); return null; }
      return s;
    }
    var vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return null;
    var pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) { console.error(gl.getProgramInfoLog(pr)); return null; }
    gl.useProgram(pr);
    var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(pr, "p"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    var U = {};
    ["u_res", "u_scroll", "u_par", "u_cell", "u_dpr", "u_mode", "u_wallDay", "u_wallNight", "u_t", "u_mix", "u_sa", "u_sb"].forEach(function (n) { U[n] = gl.getUniformLocation(pr, n); });
    return { gl: gl, U: U, cv: cv, dprCap: dprCap, w: 0, h: 0, dpr: 1 };
  }

  var wall = wallCv && makeGL(wallCv, 1.5);
  var shade = shadeCv && makeGL(shadeCv, 1.0);
  var noop = function () {};
  if (!wall || !shade) {
    doc.classList.add("nogl");
    window.TBLight = { go: noop, resume: noop, pause: noop, index: function () { return 0; }, state: function () { return null; }, STATES: STATES, invalidate: noop, isPaused: function () { return true; } };
    return;
  }

  function pack(s) {
    var alt = s.alt * Math.PI / 180;
    return new Float32Array([Math.sin(alt), s.az * Math.PI / 180, s.direct, s.high, s.lamp, s.dark, s.warm, s.fall, s.pen, s.stretch, s.cell, s.depth]);
  }
  var PACKED = STATES.map(pack);

  // ---- state ----
  var a = 0, b = 0, mix = 0;        // moment A, moment B, and how far between them
  var paused = false, fading = false, holdTimer = 0, fadeStart = 0, raf = 0, dirty = true;
  var par = { x: 0, y: 0, tx: 0, ty: 0 };
  var wallDay = [0.922, 0.906, 0.875], wallNight = [0.153, 0.137, 0.125];
  var cell = 160;

  function nearestToNow() {
    var h = Sun.sgt(new Date()).hour;
    var best = 0, bd = 99;
    STATES.forEach(function (s, i) {
      var sh = +s.hour.slice(0, 2) + (+s.hour.slice(3)) / 60;
      var d = Math.abs(sh - h); d = Math.min(d, 24 - d);
      if (d < bd) { bd = d; best = i; }
    });
    return best;
  }
  function displayed() { return mix < 0.5 ? a : b; }
  function darkNow() { return STATES[a].dark * (1 - mix) + STATES[b].dark * mix; }

  function size() {
    var w = window.innerWidth, h = window.innerHeight;
    cell = Math.max(150, Math.min(w / 4.2, 380));
    [wall, shade].forEach(function (c) {
      var dpr = Math.min(window.devicePixelRatio || 1, c.dprCap);
      var pw = Math.round(w * dpr), ph = Math.round(h * dpr);
      if (c.w !== pw || c.h !== ph) { c.cv.width = pw; c.cv.height = ph; c.w = pw; c.h = ph; c.dpr = dpr; c.gl.viewport(0, 0, pw, ph); }
    });
    dirty = true;
  }

  var lastFlag = "", lastShown = -1;
  function draw(now) {
    raf = 0;
    if (fading) {
      var t = Math.min(1, ((now || performance.now()) - fadeStart) / FADE);
      mix = t * t * (3 - 2 * t);
      if (t >= 1) { a = b; mix = 0; fading = false; if (!paused) armHold(); }
      dirty = true;
    }
    if (!dirty) return;
    dirty = false;
    var flag = darkNow() > 0.5 ? "night" : "day";
    if (flag !== lastFlag) { lastFlag = flag; doc.setAttribute("data-light", flag); }
    var tt = (performance.now() / 1000) % 60;
    [wall, shade].forEach(function (c, i) {
      var gl = c.gl, U = c.U;
      gl.uniform2f(U.u_res, c.w, c.h);
      gl.uniform1f(U.u_scroll, window.scrollY || 0);
      gl.uniform2f(U.u_par, par.x, par.y);
      gl.uniform1f(U.u_cell, cell);
      gl.uniform1f(U.u_dpr, c.dpr);
      gl.uniform1f(U.u_mode, i);
      gl.uniform3f(U.u_wallDay, wallDay[0], wallDay[1], wallDay[2]);
      gl.uniform3f(U.u_wallNight, wallNight[0], wallNight[1], wallNight[2]);
      gl.uniform1f(U.u_t, tt);
      gl.uniform1f(U.u_mix, mix);
      gl.uniform1fv(U.u_sa, PACKED[a]);
      gl.uniform1fv(U.u_sb, PACKED[b]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    });
    var shown = displayed();
    if (shown !== lastShown) { lastShown = shown; document.dispatchEvent(new CustomEvent("tb:state", { detail: info() })); }
    if (fading) schedule();
  }
  function schedule() { if (!raf) raf = requestAnimationFrame(draw); }
  function invalidate() { dirty = true; schedule(); }

  function fadeTo(i) {
    i = ((i % STATES.length) + STATES.length) % STATES.length;
    if (fading) { a = b; mix = 0; fading = false; }
    if (i === a) { invalidate(); return; }
    b = i;
    if (reduce) { a = i; mix = 0; invalidate(); return; }
    fading = true; fadeStart = performance.now(); schedule();
  }
  function armHold() {
    clearTimeout(holdTimer);
    if (paused || reduce) return;
    holdTimer = setTimeout(function () { if (!paused) fadeTo(a + 1); }, HOLD);
  }
  function go(i) { paused = true; clearTimeout(holdTimer); fadeTo(i); }
  function pause() { paused = true; clearTimeout(holdTimer); }
  function resume() { paused = false; fadeTo(nearestToNow()); if (!fading) armHold(); }
  function info() {
    var s = STATES[displayed()];
    return { index: displayed(), key: s.key, name: s.name, word: s.word, hour: s.hour, altitude: s.alt, azimuth: s.az, paused: paused };
  }

  // ---- inputs ----
  window.addEventListener("resize", function () { size(); schedule(); });
  window.addEventListener("scroll", function () { invalidate(); }, { passive: true });
  if (!reduce && !coarse) {
    window.addEventListener("pointermove", function (e) {
      par.tx = ((e.clientX / window.innerWidth) - 0.5) * 0.09;
      par.ty = ((e.clientY / window.innerHeight) - 0.5) * 0.06;
      easePar();
    }, { passive: true });
  }
  var parRaf = 0;
  function easePar() {
    if (parRaf) return;
    parRaf = requestAnimationFrame(function step() {
      par.x += (par.tx - par.x) * 0.08; par.y += (par.ty - par.y) * 0.08;
      if (!fading) { dirty = true; draw(); }
      if (Math.abs(par.tx - par.x) > 0.0006 || Math.abs(par.ty - par.y) > 0.0006) parRaf = requestAnimationFrame(step); else parRaf = 0;
    });
  }
  document.addEventListener("visibilitychange", function () { if (document.hidden) clearTimeout(holdTimer); else if (!paused && !fading) armHold(); });

  size();
  // ?at=HH:MM or ?state=key opens the room at a chosen moment and holds it
  var qs = location.search;
  var mAt = /[?&]at=(\d{1,2})(?::(\d{2}))?/.exec(qs), mSt = /[?&]state=([a-z-]+)/.exec(qs);
  var start = nearestToNow();
  if (mSt) STATES.forEach(function (s, i) { if (s.key === mSt[1]) start = i; });
  if (mAt) {
    var hh = (+mAt[1]) + (+(mAt[2] || 0)) / 60, best = 0, bd = 99;
    STATES.forEach(function (s, i) { var sh = +s.hour.slice(0, 2) + (+s.hour.slice(3)) / 60; var d = Math.abs(sh - hh); d = Math.min(d, 24 - d); if (d < bd) { bd = d; best = i; } });
    start = best;
  }
  a = b = start; mix = 0;
  if (mAt || mSt) paused = true;
  draw();
  if (!paused) armHold();

  window.TBLight = {
    go: go, resume: resume, pause: pause,
    index: displayed, state: info, STATES: STATES, invalidate: invalidate,
    isPaused: function () { return paused; }
  };
})();
