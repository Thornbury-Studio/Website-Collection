/* THORNBURY DIGITAL v6 — the light.

   Two fixed canvases share one fragment shader. #wall paints the lit wall
   underneath the page; #shade paints only the illumination factor and is
   composited with mix-blend-mode: multiply over everything, so the type and
   the plates are shaded by the same screen as the wall behind them.

   The model: the page is the floor of a room in Singapore. Above it hangs a
   screen of ventilation blocks (circle-in-square cells with quarter-circle
   corners, the tropical-modernist standard). The sun's real altitude and
   azimuth for 01°17′N 103°51′E at this minute — or at the minute the
   visitor has dragged the rail to — decide where the light through each
   opening lands, how far the block's own depth cuts it off, and how warm it
   is. After sunset a street lamp takes over through the same screen.

   It renders only when something changed (time, scroll, pointer, size, the
   rail), never on a free-running loop, so it costs nothing while you read.

   Exposed as window.TBLight: { setMinutes(m|null), minutes(), state(), invalidate() } */
(function () {
  "use strict";

  var doc = document.documentElement;
  var wallCv = document.getElementById("wall");
  var shadeCv = document.getElementById("shade");
  var Sun = window.TBSun;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var coarse = window.matchMedia("(pointer: coarse)").matches;

  var VS = "#version 300 es\nin vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }";
  var FS = [
    "#version 300 es",
    "precision highp float;",
    "out vec4 o;",
    "uniform vec2 u_res;",      // canvas px
    "uniform float u_scroll;",  // page scroll in css px
    "uniform vec2 u_par;",      // pointer parallax, cells
    "uniform vec3 u_sun;",      // sin(alt), az (rad), direct intensity 0..1
    "uniform vec3 u_lamp;",     // sin(alt), az, intensity (night)
    "uniform float u_night;",   // 0 day .. 1 night, gradual: the lamp
    "uniform float u_dark;",    // 0 or 1 within a minute of dusk: the wall
    "uniform float u_cell;",    // cell size in css px
    "uniform float u_dpr;",
    "uniform float u_mode;",    // 0 wall, 1 shade
    "uniform vec3 u_wall;",     // wall albedo (sRGB-ish)
    "uniform float u_t;",
    "float h21(vec2 p){ p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.x); }",
    "float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);",
    "  return mix(mix(h21(i), h21(i + vec2(1,0)), f.x), mix(h21(i + vec2(0,1)), h21(i + vec2(1,1)), f.x), f.y); }",
    // the screen: three kinds of block, chosen per cell, the way a real vent
    // wall mixes them. Openings return 1.
    "float opening(vec2 q, float w){",
    "  vec2 id = floor(q);",
    "  float kind = h21(id + 7.3);",
    "  vec2 c = fract(q) - 0.5;",
    "  float ac = max(abs(c.x), abs(c.y));",
    "  vec2 k = abs(c) - 0.5;",
    "  if (kind < 0.56) {",                        // circle in square, small corner quarter-circles
    "    float a = smoothstep(0.30 + w, 0.30 - w, length(c));",
    "    float b = smoothstep(0.125 + w, 0.125 - w, length(k));",
    "    return max(a, b);",
    "  } else if (kind < 0.82) {",                 // the petal block: a square void with four corner discs of material
    "    float sq = smoothstep(0.405 + w, 0.405 - w, ac);",
    "    float corner = smoothstep(0.33 - w, 0.33 + w, length(k));",
    "    return sq * corner;",
    "  }",
    "  return smoothstep(0.30 + w, 0.30 - w, ac);", // a plain square opening
    "}",
    // light through the screen from a direction (sinAlt, az) onto the floor
    "float beam(vec2 q, float sinAlt, float az, float H, float T, float pen){",
    "  float cosAlt = sqrt(max(0.0, 1.0 - sinAlt * sinAlt));",
    "  float cot = cosAlt / max(sinAlt, 0.035);",
    "  vec2 dir = vec2(sin(az), -cos(az));",       // page x = east, page y down = south
    "  vec2 shiftH = dir * cot * H;",              // the opening this floor point sees the sun through
    "  vec2 shiftT = dir * cot * T;",              // the block's own depth, cutting the beam at low sun
    "  float stretch = 1.0 + 0.45 * min(cot, 3.5);", // low sun draws the patches long
    "  vec2 n = normalize(dir + vec2(1e-4, 0.0));",
    "  vec2 t = vec2(-n.y, n.x);",
    "  vec2 qs = q + shiftH;",
    "  vec2 qq = n * (dot(qs, n) / stretch) + t * dot(qs, t);",
    "  vec2 q2 = qq - shiftT;",
    "  float w = pen * (0.45 + 0.35 * min(cot, 3.0));",
    "  return opening(qq, w) * opening(q2, w * 0.7);",
    "}",
    "void main(){",
    "  vec2 px = gl_FragCoord.xy / u_dpr;",       // css px, origin bottom-left
    "  vec2 css = vec2(px.x, (u_res.y / u_dpr) - px.y);", // origin top-left
    "  vec2 q = (css + vec2(0.0, u_scroll)) / u_cell + u_par;",
    "  float sinAlt = u_sun.x;",
    "  float day = smoothstep(-0.02, 0.12, sinAlt);",
    // the screen stands on the sun's side of the room: patches are strongest
    // and sharpest there and fade, softening, across the floor
    "  float side = sin(u_sun.y);",
    "  float across = css.x / (u_res.x / u_dpr) - 0.5;",
    "  float far = clamp(-side * across * 2.2, 0.0, 1.0);",
    "  float fall = 1.0 - 0.5 * far;",
    // an overhead sun is calm: a little softer and a little dimmer than the
    // long low light of the morning and the late afternoon
    "  float high = smoothstep(0.62, 0.96, sinAlt);",
    "  float direct = u_sun.z * fall * (1.0 - 0.3 * high) * beam(q, max(sinAlt, 0.02), u_sun.y, 5.2, 0.30, 0.024 + 0.05 * far + 0.03 * high);",
    "  vec3 sunCol = mix(vec3(1.0, 0.62, 0.30), vec3(1.0, 0.965, 0.90), smoothstep(0.03, 0.55, sinAlt));",
    "  float lampB = beam(q + vec2(-1.7, 0.9), u_lamp.x, u_lamp.y, 4.2, 0.30, 0.05);",
    "  vec2 lampAt = vec2(0.0, 0.42 * u_res.y / u_dpr) + vec2(0.0, u_scroll);",
    "  float lampFall = 1.0 / (1.0 + pow(length((css + vec2(0.0, u_scroll) - lampAt) / (u_cell * 6.5)), 2.0));",
    "  float lamp = u_lamp.z * lampB * (0.35 + 0.65 * lampFall);",
    "  vec3 lampCol = vec3(1.0, 0.66, 0.34);",
    "  float grain = (vnoise(css * 0.9) * 0.6 + vnoise(css * 3.1) * 0.4 - 0.5);",
    "  float dither = (h21(css + u_t) - 0.5) / 255.0;",
    // #wall carries the colour of the light; #shade carries the darkness of the
    // screen, multiplied over the whole page. Neither darkens twice.
    "  if (u_mode < 0.5) {",
    "    vec3 lit = u_wall * (0.985 + 0.19 * direct) * mix(vec3(1.0), sunCol, direct * 0.9);",
    "    vec3 nightBase = u_wall * (0.92 + 0.08 * lampFall);",
    "    vec3 nightLit = nightBase + lampCol * lamp * 0.58;",
    "    vec3 col = mix(lit, nightLit, u_dark);",
    "    col += grain * mix(0.016, 0.010, u_dark);",
    "    col += dither;",
    "    o = vec4(col, 1.0);",
    "  } else {",
    "    float amb = mix(0.79, 0.90, smoothstep(0.15, 0.85, sinAlt));", // a higher sun fills the shade from the sky
    "    float shadeDay = amb + (1.0 - amb) * clamp(direct * 1.2, 0.0, 1.0);",
    "    float shadeNight = 0.80 + 0.20 * clamp(lamp * 1.4, 0.0, 1.0);",
    "    float f = mix(mix(1.0, shadeDay, day), shadeNight, u_dark);",
    "    o = vec4(vec3(f + dither), 1.0);",
    "  }",
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
    ["u_res", "u_scroll", "u_par", "u_sun", "u_lamp", "u_night", "u_dark", "u_cell", "u_dpr", "u_mode", "u_wall", "u_t"].forEach(function (n) { U[n] = gl.getUniformLocation(pr, n); });
    return { gl: gl, U: U, cv: cv, dprCap: dprCap, w: 0, h: 0, dpr: 1 };
  }

  var wall = wallCv && makeGL(wallCv, 1.5);
  var shade = shadeCv && makeGL(shadeCv, 1.0);
  if (!wall || !shade) { doc.classList.add("nogl"); window.TBLight = { setMinutes: function () {}, minutes: function () { return null; }, state: function () { return null; }, invalidate: function () {} }; return; }

  // ---- state ----
  var override = null;         // minutes since SGT midnight, or null for now
  var shown = null;            // the minute currently drawn (eases toward target)
  var par = { x: 0, y: 0, tx: 0, ty: 0 };
  var dirty = true, raf = 0, animating = false;
  var wallRGB = [0.922, 0.906, 0.875];
  var nightRGB = [0.153, 0.137, 0.125];
  var cell = 160;

  function targetMinutes() {
    if (override !== null) return override;
    var c = Sun.sgt(new Date());
    return c.hour * 60;
  }
  function stateFor(minutes) {
    var d = Sun.at(new Date(), minutes / 60);
    var p = Sun.position(d);
    var sinAlt = Math.sin(p.altitude * Math.PI / 180);
    var direct = Math.min(1, Math.max(0, (sinAlt - 0.03) / 0.30));
    direct = direct * direct * (3 - 2 * direct);
    // the lamp comes up while the sun is still a few degrees high, so dusk
    // never goes flat; the wall itself crosses to night in the middle of that
    var night = 1 - Math.min(1, Math.max(0, (sinAlt - 0.01) / 0.10));
    var dark = Math.min(1, Math.max(0, (night - 0.45) / 0.10));
    dark = dark * dark * (3 - 2 * dark);
    return { minutes: minutes, altitude: p.altitude, azimuth: p.azimuth, sinAlt: sinAlt, direct: direct, night: night, dark: dark };
  }

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

  var lastNight = -1;
  function draw() {
    raf = 0;
    if (!dirty && !animating) return;
    dirty = false;
    var target = targetMinutes();
    if (shown === null) shown = target;
    if (animating) {
      var diff = target - shown;
      shown += diff * 0.16;
      if (Math.abs(diff) < 0.25) { shown = target; animating = false; }
    } else shown = target;
    var s = stateFor(shown);
    var nightFlag = s.dark > 0.5 ? "night" : "day";
    if (doc.getAttribute("data-light") !== nightFlag) doc.setAttribute("data-light", nightFlag);
    var wr = wallRGB.map(function (v, i) { return v + (nightRGB[i] - v) * s.dark; });
    var t = (performance.now() / 1000) % 60;
    [wall, shade].forEach(function (c, i) {
      var gl = c.gl, U = c.U;
      gl.uniform2f(U.u_res, c.w, c.h);
      gl.uniform1f(U.u_scroll, window.scrollY || 0);
      gl.uniform2f(U.u_par, par.x, par.y);
      gl.uniform3f(U.u_sun, s.sinAlt, s.azimuth * Math.PI / 180, s.direct);
      gl.uniform3f(U.u_lamp, Math.sin(31 * Math.PI / 180), 244 * Math.PI / 180, s.night);
      gl.uniform1f(U.u_night, s.night);
      gl.uniform1f(U.u_dark, s.dark);
      gl.uniform1f(U.u_cell, cell);
      gl.uniform1f(U.u_dpr, c.dpr);
      gl.uniform1f(U.u_mode, i);
      gl.uniform3f(U.u_wall, wr[0], wr[1], wr[2]);
      gl.uniform1f(U.u_t, t);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    });
    if (lastNight !== nightFlag) { lastNight = nightFlag; document.dispatchEvent(new CustomEvent("tb:light", { detail: s })); }
    document.dispatchEvent(new CustomEvent("tb:sun", { detail: s }));
    if (animating) schedule();
  }
  function schedule() { if (!raf) raf = requestAnimationFrame(draw); }
  function invalidate() { dirty = true; schedule(); }

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
      dirty = true; draw();
      if (Math.abs(par.tx - par.x) > 0.0006 || Math.abs(par.ty - par.y) > 0.0006) parRaf = requestAnimationFrame(step); else parRaf = 0;
    });
  }
  // the clock: one redraw a minute is all a sun needs
  setInterval(function () { if (override === null) invalidate(); }, 30000);

  function setMinutes(m) {
    override = (m === null || m === undefined) ? null : Math.max(0, Math.min(1439.9, m));
    animating = !reduce;
    invalidate();
  }

  size();
  // ?at=HH:MM loads the room at that hour, so a link can say "see it at six"
  var at = /[?&]at=(\d{1,2})(?::(\d{2}))?/.exec(location.search);
  if (at) override = Math.min(1439, (+at[1]) * 60 + (+(at[2] || 0)));
  // the entrance: the light arrives from three hours earlier and settles on now
  if (!reduce) { shown = Math.max(0, targetMinutes() - 170); animating = true; }
  draw();

  function jump(m) { setMinutes(m); shown = targetMinutes(); animating = false; dirty = true; draw(); }

  window.TBLight = {
    setMinutes: setMinutes,
    jump: jump,
    minutes: function () { return shown; },
    target: targetMinutes,
    state: function () { return stateFor(shown === null ? targetMinutes() : shown); },
    invalidate: invalidate,
    isOverridden: function () { return override !== null; }
  };
})();
