/* Relief renderer: one photograph and its baked depth map, drawn as a displaced
   mesh that tilts with the pointer or the device. The same vertices are drawn
   twice - as a surface (living photograph, then cast glass) and as points (the
   scan) - and a radial front, travelling out from the flower's throat, decides
   which of the three a given pixel belongs to at a given phase.

   phase 0 = living, 1 = scan, 2 = glass. Everything between is the front.

   Everything on the page that matters is also plain text in the DOM; this file
   only paints the specimen. */

(function () {
  'use strict';

  var GRID_X = 220, GRID_Y = 165;
  var THROAT = [0.487, 0.585];        // where the six tepals meet, in image uv (v up)
  var DEPTH = 0.19;                   // relief height as a fraction of image width
  var MID = 0.42;                     // depth value that stays on the picture plane
  var PERSP = 0.30;
  var MAX_TILT = 0.20;                // radians, about 11.5 degrees

  var COMMON = [
    'uniform vec2 uTilt;',
    'vec3 rot(vec3 p){',
    '  float cy = cos(uTilt.x), sy = sin(uTilt.x), cx = cos(uTilt.y), sx = sin(uTilt.y);',
    '  p = vec3(cy * p.x + sy * p.z, p.y, -sy * p.x + cy * p.z);',
    '  return vec3(p.x, cx * p.y - sx * p.z, sx * p.y + cx * p.z);',
    '}'
  ].join('\n');

  var VERT = [
    '#version 300 es',
    'precision highp float;',
    COMMON,
    'uniform sampler2D uRelief;',
    'uniform vec2 uGrid;',
    'uniform float uDepth, uMid, uPersp, uDpr, uPoint, uStride, uJitter;',
    'out vec2 vUv;',
    'out float vD;',
    'out vec3 vN;',
    'invariant gl_Position;',
    'void main(){',
    '  float id = float(gl_VertexID);',
    '  float col = mod(id, uGrid.x + 1.0), row = floor(id / (uGrid.x + 1.0));',
    '  vec2 uv = vec2(col / uGrid.x, row / uGrid.y);',
    '  if (uStride > 1.5 && (mod(col, uStride) > 0.5 || mod(row, uStride) > 0.5)) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; return; }',
    // scan points are scattered inside their cell so the cloud does not read as a screen-door grid
    '  uv = clamp(uv + (vec2(fract(sin(id * 12.9898) * 43758.5453), fract(sin(id * 78.233) * 12345.6789)) - 0.5) * uJitter * max(uStride, 1.0) / uGrid, 0.0, 1.0);',
    '  float d = textureLod(uRelief, uv, 0.0).r;',
    '  vec3 p = rot(vec3(uv.x - 0.5, (uv.y - 0.5) * 0.75, (d - uMid) * uDepth));',
    '  float w = 1.0 - p.z * uPersp;',
    '  gl_Position = vec4(p.x * 2.0, p.y * 2.6667, -p.z * 2.0 * w, w);',
    '  gl_PointSize = uPoint * uDpr * (0.75 + d * 0.9) / w;',
    '  vec4 rl = textureLod(uRelief, uv, 0.0);',
    '  vec3 n0 = vec3(rl.g * 2.0 - 1.0, rl.b * 2.0 - 1.0, 0.0);',
    '  n0.z = sqrt(max(0.0, 1.0 - dot(n0.xy, n0.xy)));',
    '  vN = rot(n0);',
    '  vUv = uv; vD = d;',
    '}'
  ].join('\n');

  var FRAG_HEAD = [
    '#version 300 es',
    'precision highp float;',
    COMMON,
    'uniform sampler2D uPhoto, uRelief;',
    'uniform float uPhase, uTime, uQ, uSweep;',
    'uniform vec3 uAccent;',
    'uniform vec2 uThroat;',
    'in vec2 vUv;',
    'in float vD;',
    'in vec3 vN;',
    'out vec4 frag;',

    'const vec3 LUMA = vec3(0.299, 0.587, 0.114);',

    'float cover(vec3 c){ return smoothstep(0.012, 0.060, max(c.r, max(c.g, c.b)) - min(c.r, min(c.g, c.b))); }',

    // how far the two fronts have travelled at this fragment: x = scanned, y = cast
    'vec2 fronts(vec2 uv){',
    '  vec2 q = (uv - uThroat) * vec2(1.0, 0.75);',
    '  float a = atan(q.y, q.x);',
    '  float r = length(q) + 0.016 * sin(a * 5.0 + uTime * 0.5) + 0.009 * sin(a * 11.0 - uTime * 0.8);',
    '  float r1 = uPhase * 0.62 - 0.05, r2 = (uPhase - 1.0) * 0.62 - 0.05;',
    '  return vec2(1.0 - smoothstep(r1 - 0.025, r1 + 0.025, r), 1.0 - smoothstep(r2 - 0.025, r2 + 0.025, r));',
    '}',
    'vec2 rings(vec2 uv){',
    '  vec2 q = (uv - uThroat) * vec2(1.0, 0.75);',
    '  float a = atan(q.y, q.x);',
    '  float r = length(q) + 0.016 * sin(a * 5.0 + uTime * 0.5) + 0.009 * sin(a * 11.0 - uTime * 0.8);',
    '  float r1 = uPhase * 0.62 - 0.05, r2 = (uPhase - 1.0) * 0.62 - 0.05;',
    '  return vec2(exp(-abs(r - r1) / 0.0028) * step(0.0, r1) * step(uPhase, 1.0), exp(-abs(r - r2) / 0.0028) * step(0.0, r2) * step(uPhase, 1.999));',
    '}'
  ].join('\n');

  var FRAG_SURFACE = FRAG_HEAD + '\n' + [
    'void main(){',
    '  vec4 ph = texture(uPhoto, vUv);',
    '  float cv = cover(ph.rgb);',
    '  vec2 f = fronts(vUv);',
    '  if (cv < 0.01 || (1.0 - f.x) + f.y < 0.01) discard;',

    '  vec4 rl = texture(uRelief, vUv);',
    '  vec3 n0 = vec3(rl.g * 2.0 - 1.0, rl.b * 2.0 - 1.0, 0.0);',
    '  n0.z = sqrt(max(0.0, 1.0 - dot(n0.xy, n0.xy)));',
    '  vec3 n = rot(n0);',
    '  vec3 key = normalize(vec3(-0.35, 0.55, 0.75));',

    // living: the photograph, relit only by how far the surface has turned
    '  vec3 live = ph.rgb * (1.0 + 0.9 * (dot(n, key) - dot(n0, key)));',

    // cast glass. Thick near the throat, thin toward the tips: thin glass is paler and lets the
    // page show through, thick glass is deeper and denser. The silhouette is found from the
    // photograph's own coverage, so the rim is a hairline on the true edge.
    '  float ndv = max(n.z, 0.0);',
    '  float fres = pow(1.0 - ndv, 3.2);',
    '  float thick = clamp(1.0 - length((vUv - uThroat) * vec2(1.0, 0.75)) * 2.3, 0.0, 1.0) * 0.8 + vD * 0.2;',
    '  vec2 off = n.xy * 0.040;',
    // refraction that stops at the silhouette: a sample that lands on the backdrop falls back to the
    // pixel's own colour, so there is no dark outline around the glass
    '  vec3 t1 = texture(uPhoto, vUv + off).rgb, t2 = texture(uPhoto, vUv + off * 1.35).rgb, t3 = texture(uPhoto, vUv + off * 1.8).rgb;',
    '  vec3 tr = vec3(mix(ph.r, t1.r, cover(t1)), mix(ph.g, t2.g, cover(t2)), mix(ph.b, t3.b, cover(t3)));',
    '  if (uQ < 0.5) { vec3 sq = texture(uPhoto, vUv + off * 1.3).rgb; tr = mix(ph.rgb, sq, cover(sq)); }',
    '  float l = dot(tr, LUMA);',
    '  float lb = dot(textureLod(uPhoto, vUv, 3.5).rgb, LUMA);',
    '  vec3 thin = vec3(l) * vec3(1.45, 1.10, 0.66) + vec3(0.30, 0.20, 0.08);',
    '  vec3 deep = pow(tr, vec3(0.70)) * vec3(1.32, 1.00, 0.70);',
    // clear glass carries only a pale tint; colour deepens with thickness, and the anthers stay opaque enamel
    '  vec3 body = mix(thin, deep, thick);',
    '  body = mix(vec3(dot(body, LUMA)), body, mix(0.35, 0.80, thick)) * vec3(1.0, 0.97, 0.88);',
    '  float chromaP = max(ph.r, max(ph.g, ph.b)) - min(ph.r, min(ph.g, ph.b));',
    '  float enamel = smoothstep(0.34, 0.20, dot(ph.rgb, LUMA)) * smoothstep(0.10, 0.22, chromaP);',
    '  body = mix(body, ph.rgb * vec3(1.25, 0.95, 0.85), enamel);',
    '  body += vec3(1.0, 0.93, 0.78) * clamp((dot(ph.rgb, LUMA) - lb) * 3.6, -0.05, 0.42);',

    '  float e = 0.0024;',
    '  float cmin = min(min(cover(texture(uPhoto, vUv + vec2(e, 0.0)).rgb), cover(texture(uPhoto, vUv - vec2(e, 0.0)).rgb)),',
    '                   min(cover(texture(uPhoto, vUv + vec2(0.0, e)).rgb), cover(texture(uPhoto, vUv - vec2(0.0, e)).rgb)));',
    '  float edge = clamp(1.0 - cmin, 0.0, 1.0);',

    '  vec3 R = reflect(vec3(0.0, 0.0, -1.0), n);',
    '  vec2 re = R.xy;',
    '  float p1 = (1.0 - smoothstep(0.0, 0.07, abs(re.x + 0.24 + uTilt.x * 1.1) - 0.055)) * (1.0 - smoothstep(0.0, 0.22, abs(re.y - 0.12 - uTilt.y * 1.1) - 0.34));',
    '  float p2 = (1.0 - smoothstep(0.0, 0.05, abs(re.y + 0.30 + uTilt.y * 1.1) - 0.035)) * (1.0 - smoothstep(0.0, 0.2, abs(re.x - 0.10 + uTilt.x * 1.1) - 0.40));',
    '  vec3 k1 = normalize(vec3(-0.30 - uTilt.x * 1.4, 0.62 + uTilt.y * 1.4, 0.72));',
    '  float s1 = pow(max(dot(R, k1), 0.0), 170.0) * 1.1;',
    '  vec3 shine = vec3(1.0, 0.98, 0.94) * (p1 * 0.16 + s1) + vec3(0.70, 0.93, 1.0) * p2 * 0.20;',
    '  vec3 rim = vec3(0.72, 0.96, 1.0) * (edge * 0.75 + fres * 0.55);',
    '  vec3 caustic = vec3(1.0, 0.82, 0.52) * smoothstep(0.55, 0.98, ndv) * pow(l, 1.5) * 0.30 * thick;',

    '  float ag = clamp(mix(0.16, 0.56, thick) + fres * 0.55 + edge * 0.22, 0.0, 1.0);',
    '  ag = mix(ag, 0.96, enamel);',
    '  vec3 gBody = body * ag;',
    '  vec3 gAdd = shine + rim + caustic;',

    '  vec2 rg = rings(vUv);',
    '  vec3 glow = uAccent * rg.x * 0.55 + vec3(0.75, 0.95, 1.0) * rg.y * 0.45;',
    '  float aTot = (1.0 - f.x) + f.y * ag;',
    '  vec3 pm = live * (1.0 - f.x) + gBody * f.y + gAdd * f.y + glow;',
    '  frag = vec4(pm * cv, clamp(aTot, 0.0, 1.0) * cv);',
    '}'
  ].join('\n');

  var FRAG_POINTS = FRAG_HEAD + '\n' + [
    'void main(){',
    '  vec2 pc = gl_PointCoord - 0.5;',
    '  float rr = length(pc) * 2.0;',
    '  if (rr > 1.0) discard;',
    '  vec3 ph = texture(uPhoto, vUv).rgb;',
    '  float cv = cover(ph);',
    '  vec2 f = fronts(vUv);',
    '  float a = (f.x - f.y) * cv * (1.0 - smoothstep(0.55, 1.0, rr));',
    '  if (a < 0.01) discard;',
    '  float l = dot(ph, LUMA);',
    '  vec3 key = normalize(vec3(-0.35, 0.55, 0.75));',
    '  float shade = max(dot(vN, key), 0.0);',
    '  float band = smoothstep(0.82, 1.0, abs(sin(vD * 58.0)));',
    '  vec3 c = uAccent * (0.20 + l * 0.9) * (0.5 + shade * 0.95);',
    '  c += uAccent * band * 0.55;',
    '  c = mix(c, vec3(0.92, 1.0, 1.0), smoothstep(0.78, 1.0, shade) * 0.40);',
    '  float sw = exp(-abs(vUv.y - uSweep) / 0.010);',
    '  c += vec3(0.9, 1.0, 1.0) * sw * 0.85;',
    '  frag = vec4(c * a, a);',
    '}'
  ].join('\n');

  // Depth-only pass: where the displaced mesh folds over itself, a translucent surface would be blended
  // twice and show as thin bright rows. Writing depth first lets only the nearest layer reach the colour pass.
  var FRAG_DEPTH = [
    '#version 300 es',
    'precision highp float;',
    'uniform sampler2D uPhoto;',
    'in vec2 vUv;',
    'in float vD;',
    'in vec3 vN;',
    'out vec4 frag;',
    'void main(){',
    '  vec3 c = texture(uPhoto, vUv).rgb;',
    '  if (max(c.r, max(c.g, c.b)) - min(c.r, min(c.g, c.b)) < 0.03) discard;',
    '  frag = vec4(0.0);',
    '}'
  ].join('\n');

  function compile(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { gl.deleteShader(s); return null; }
    return s;
  }

  function link(gl, fragSrc) {
    var vs = compile(gl, gl.VERTEX_SHADER, VERT), fs = compile(gl, gl.FRAGMENT_SHADER, fragSrc);
    if (!vs || !fs) return null;
    var p = gl.createProgram();
    gl.attachShader(p, vs); gl.attachShader(p, fs); gl.linkProgram(p);
    return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
  }

  function hexToRgb(hex) {
    var h = String(hex || '').trim().replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return isNaN(n) ? [0.4, 0.9, 0.8] : [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
  }

  var TIERS = [
    { dpr: 1.75, q: 1 },
    { dpr: 1.25, q: 0 },
    { dpr: 1.0,  q: 0 },
    { dpr: 0.75, q: 0 }
  ];

  function create(stage, opts) {
    var canvas = stage.querySelector('canvas');
    var photo = stage.querySelector('img');
    if (!canvas || !photo) return null;

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var coarse = window.matchMedia('(pointer: coarse)').matches;
    var gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false, depth: true, powerPreference: 'high-performance' });
    if (!gl) return null;

    var reliefImg = new Image();
    var cpuDepth = null, cpuW = 0, cpuH = 0;
    var S = {                         // all state the loop reads
      phase: opts.phase || 0, tilt: [0, 0], target: [0, 0], accent: [0.4, 0.9, 0.8],
      tier: coarse ? 1 : 0, ceiling: 3, visible: false, ready: false, lost: false,
      lastInput: -1e9, sweep: 0, dirty: true, raf: 0, t0: performance.now(), onFrame: null
    };
    var G = {};                       // GL objects, rebuilt after a context loss

    function build() {
      G.surf = link(gl, FRAG_SURFACE);
      G.pts = link(gl, FRAG_POINTS);
      G.depth = link(gl, FRAG_DEPTH);
      if (!G.surf || !G.pts || !G.depth) return false;
      G.vao = gl.createVertexArray();
      gl.bindVertexArray(G.vao);
      var idx = new Uint16Array(GRID_X * GRID_Y * 6), k = 0;
      for (var y = 0; y < GRID_Y; y++) {
        for (var x = 0; x < GRID_X; x++) {
          var a = y * (GRID_X + 1) + x, b = a + 1, c = a + GRID_X + 1, d = c + 1;
          idx[k++] = a; idx[k++] = b; idx[k++] = c; idx[k++] = b; idx[k++] = d; idx[k++] = c;
        }
      }
      G.idxCount = idx.length;
      G.ibo = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, G.ibo);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
      G.ptCount = (GRID_X + 1) * (GRID_Y + 1);
      G.u = {};
      [['surf', G.surf], ['pts', G.pts], ['depth', G.depth]].forEach(function (pair) {
        var u = {};
        ['uTilt', 'uRelief', 'uGrid', 'uStride', 'uJitter', 'uDepth', 'uMid', 'uPersp', 'uDpr', 'uPoint', 'uPhoto', 'uPhase', 'uTime', 'uQ', 'uSweep', 'uAccent', 'uThroat']
          .forEach(function (n) { u[n] = gl.getUniformLocation(pair[1], n); });
        G.u[pair[0]] = u;
      });
      G.texPhoto = makeTex(0);
      G.texRelief = makeTex(1);
      return true;
    }

    function makeTex(unit) {
      var t = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      return t;
    }

    function upload() {
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, G.texPhoto);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, photo);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, G.texRelief);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, reliefImg);
      gl.generateMipmap(gl.TEXTURE_2D);
    }

    function readDepth() {
      var c = document.createElement('canvas');
      cpuW = 160; cpuH = 120;
      c.width = cpuW; c.height = cpuH;
      var g = c.getContext('2d', { willReadFrequently: true });
      g.drawImage(reliefImg, 0, 0, cpuW, cpuH);
      var px = g.getImageData(0, 0, cpuW, cpuH).data;
      cpuDepth = new Float32Array(cpuW * cpuH);
      for (var i = 0; i < cpuDepth.length; i++) cpuDepth[i] = px[i * 4] / 255;
    }

    function sampleDepth(u, v) {       // v up, bilinear, mirrors the vertex fetch
      var x = Math.min(cpuW - 1.001, Math.max(0, u * cpuW - 0.5)), y = Math.min(cpuH - 1.001, Math.max(0, (1 - v) * cpuH - 0.5));
      var x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
      var a = cpuDepth[y0 * cpuW + x0], b = cpuDepth[y0 * cpuW + x0 + 1], c = cpuDepth[(y0 + 1) * cpuW + x0], d = cpuDepth[(y0 + 1) * cpuW + x0 + 1];
      return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
    }

    // where a point of the photograph (u across, v down) sits on screen right now, in stage fractions
    function anchor(u, vDown) {
      var v = 1 - vDown;
      var d = cpuDepth ? sampleDepth(u, v) : MID;
      var x = u - 0.5, y = (v - 0.5) * 0.75, z = (d - MID) * DEPTH;
      var cy = Math.cos(S.tilt[0]), sy = Math.sin(S.tilt[0]), cx = Math.cos(S.tilt[1]), sx = Math.sin(S.tilt[1]);
      var x1 = cy * x + sy * z, z1 = -sy * x + cy * z;
      var y2 = cx * y - sx * z1, z2 = sx * y + cx * z1;
      var w = 1 - z2 * PERSP;
      return { x: 0.5 + (x1 / w), y: 0.5 - (y2 / w) / 0.75 };
    }

    function size() {
      var t = TIERS[S.tier];
      var dpr = Math.min(window.devicePixelRatio || 1, t.dpr);
      var w = Math.max(2, Math.round(stage.clientWidth * dpr)), h = Math.max(2, Math.round(stage.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      return dpr;
    }

    function draw(now) {
      if (!S.ready || S.lost) return;
      var dpr = size();
      var t = TIERS[S.tier];
      var time = (now - S.t0) / 1000;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.bindVertexArray(G.vao);
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
      gl.enable(gl.BLEND);

      var stride = stage.clientWidth < 600 ? 2 : 1;
      var pointCss = Math.min(3.4, Math.max(1.5, stage.clientWidth / (GRID_X / stride) * 0.62));

      function common(u, prog) {
        gl.useProgram(prog);
        gl.uniform2f(u.uTilt, S.tilt[0], S.tilt[1]);
        gl.uniform1i(u.uPhoto, 0);
        gl.uniform1i(u.uRelief, 1);
        gl.uniform2f(u.uGrid, GRID_X, GRID_Y);
        gl.uniform1f(u.uDepth, DEPTH);
        gl.uniform1f(u.uMid, MID);
        gl.uniform1f(u.uPersp, PERSP);
        gl.uniform1f(u.uDpr, dpr);
        gl.uniform1f(u.uPoint, pointCss);
        gl.uniform1f(u.uStride, prog === G.pts ? stride : 1);
        gl.uniform1f(u.uJitter, prog === G.pts ? 0.9 : 0);
        gl.uniform1f(u.uPhase, S.phase);
        gl.uniform1f(u.uTime, reduced ? 0 : time);
        gl.uniform1f(u.uQ, t.q);
        gl.uniform1f(u.uSweep, S.sweep);
        gl.uniform3f(u.uAccent, S.accent[0], S.accent[1], S.accent[2]);
        gl.uniform2f(u.uThroat, THROAT[0], THROAT[1]);
      }

      gl.colorMask(false, false, false, false);
      common(G.u.depth, G.depth);
      gl.drawElements(gl.TRIANGLES, G.idxCount, gl.UNSIGNED_SHORT, 0);
      gl.colorMask(true, true, true, true);

      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      common(G.u.surf, G.surf);
      gl.drawElements(gl.TRIANGLES, G.idxCount, gl.UNSIGNED_SHORT, 0);

      if (S.phase > 0.02 && S.phase < 1.98) {
        gl.blendFunc(gl.ONE, gl.ONE);
        common(G.u.pts, G.pts);
        gl.drawArrays(gl.POINTS, 0, G.ptCount);
      }
    }

    // ---- frame governor: measure, then spend less if the device cannot keep up ----
    var win = [], settle = 40, calm = 0, lastT = 0;
    function govern(dt) {
      if (settle > 0) { settle--; return; }
      win.push(dt);
      if (win.length < 40) return;
      var sum = 0; for (var i = 0; i < win.length; i++) sum += win[i];
      var avg = sum / win.length; win.length = 0;
      if (avg > 22 && S.tier < TIERS.length - 1) {
        S.ceiling = S.tier; S.tier++; settle = 60; calm = 0;
        canvas.setAttribute('data-tier', String(S.tier));
      } else if (avg < 11.5 && S.tier > 0 && S.tier - 1 < S.ceiling) {
        if (++calm > 8) { S.tier--; settle = 60; calm = 0; canvas.setAttribute('data-tier', String(S.tier)); }
      } else calm = 0;
    }

    function loop(now) {
      S.raf = 0;
      if (!S.visible || document.hidden || S.lost) return;
      var dt = lastT ? now - lastT : 16; lastT = now;
      if (dt < 250) govern(dt);

      var idle = now - S.lastInput > 2500;
      if (!reduced) {
        if (idle) { S.target[0] = Math.sin(now / 2600) * 0.055; S.target[1] = Math.cos(now / 3300) * 0.035; }
        S.tilt[0] += (S.target[0] - S.tilt[0]) * 0.08;
        S.tilt[1] += (S.target[1] - S.tilt[1]) * 0.08;
        S.sweep = (now / 4200) % 1;
      }
      draw(now);
      if (S.onFrame) S.onFrame(S);
      if (!reduced || S.dirty) { S.dirty = false; if (!reduced) S.raf = requestAnimationFrame(loop); }
    }

    function wake() {
      if (S.raf || !S.ready || S.lost) return;
      lastT = 0;
      S.raf = requestAnimationFrame(loop);
    }

    function setTargetFromPointer(e) {
      var r = stage.getBoundingClientRect();
      var nx = Math.min(1, Math.max(-1, ((e.clientX - r.left) / r.width - 0.5) * 2));
      var ny = Math.min(1, Math.max(-1, ((e.clientY - r.top) / r.height - 0.5) * 2));
      S.target[0] = -nx * MAX_TILT; S.target[1] = -ny * MAX_TILT * 0.8;
      S.lastInput = performance.now();
    }

    if (!reduced) {
      window.addEventListener('pointermove', function (e) {
        if (!S.visible || e.pointerType === 'touch') return;
        setTargetFromPointer(e);
      }, { passive: true });
      stage.addEventListener('pointerdown', function (e) { setTargetFromPointer(e); });
      stage.addEventListener('pointermove', function (e) { if (e.pointerType === 'touch') setTargetFromPointer(e); }, { passive: true });
      window.addEventListener('deviceorientation', function (e) {
        if (!S.visible || e.gamma == null) return;
        S.target[0] = -Math.max(-1, Math.min(1, e.gamma / 28)) * MAX_TILT;
        S.target[1] = -Math.max(-1, Math.min(1, ((e.beta || 0) - 50) / 28)) * MAX_TILT * 0.8;
        S.lastInput = performance.now();
      }, { passive: true });
    }

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        S.visible = en[0].isIntersecting;
        if (S.visible) { S.dirty = true; wake(); if (reduced) draw(performance.now()); }
      }, { rootMargin: '8% 0px' }).observe(stage);
    } else { S.visible = true; }
    document.addEventListener('visibilitychange', function () { if (!document.hidden) { lastT = 0; settle = 40; wake(); } });
    window.addEventListener('resize', function () { S.dirty = true; if (reduced) draw(performance.now()); else wake(); });

    canvas.addEventListener('webglcontextlost', function (e) {
      e.preventDefault();
      S.lost = true; S.ready = false;
      stage.classList.remove('is-live');
    }, false);
    canvas.addEventListener('webglcontextrestored', function () {
      S.lost = false;
      if (build()) { upload(); S.ready = true; stage.classList.add('is-live'); S.dirty = true; wake(); if (reduced) draw(performance.now()); }
    }, false);

    function start() {
      if (!photo.naturalWidth || !reliefImg.naturalWidth) return;
      if (!build()) return;
      upload();
      readDepth();
      S.ready = true;
      stage.classList.add('is-live');
      canvas.setAttribute('data-tier', String(S.tier));
      draw(performance.now());
      if (opts.onReady) opts.onReady();
      wake();
    }

    reliefImg.onload = function () {
      if (photo.complete && photo.naturalWidth) start();
      else photo.addEventListener('load', start, { once: true });
    };
    reliefImg.src = opts.relief;

    return {
      anchor: anchor,
      get ready() { return S.ready; },
      get phase() { return S.phase; },
      setPhase: function (p) { S.phase = Math.max(0, Math.min(2, p)); S.dirty = true; if (reduced) draw(performance.now()); else wake(); },
      setAccent: function (hex) { S.accent = hexToRgb(hex); S.dirty = true; if (reduced && S.ready) draw(performance.now()); },
      onFrame: function (fn) { S.onFrame = fn; },
      refresh: function () { S.dirty = true; if (S.ready) draw(performance.now()); }
    };
  }

  window.PontilRelief = { create: create };
})();
