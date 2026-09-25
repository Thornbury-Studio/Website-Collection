/* REDLINE. — the heat.
 *
 * One WebGL2 fragment program over one full-screen triangle, composited over
 * the page with mix-blend-mode: screen. Heat rises off the bottom edge of the
 * screen the way it rises off the card: a turbulent front whose height, speed
 * and colour follow REDLINE's own heat value (telemetry.js calls set() every
 * frame it runs). At zero heat nothing is drawn and the loop sleeps.
 *
 * Rendered at a fraction of the screen resolution — it is soft light, not
 * detail — and capped: the glow can lift the page ground to rgb(78, 24, 16)
 * at most, which keeps --ink body text over it at 12.0:1, --ink-2 at 5.8:1
 * and --ink-3 labels at 4.9:1 (DESIGN.md §2). Embers are brighter, but a few
 * pixels wide and never still.
 *
 * Both webglcontextlost AND webglcontextrestored are handled: losing the
 * context stops drawing; getting it back rebuilds the program and buffer and
 * carries on (DARK.md §5 — pairing only the first already shipped once).
 */
(function () {
  'use strict';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var canvas = document.querySelector('[data-heat]');
  if (!canvas) return;

  var VS = '#version 300 es\n' +
    'void main(){ vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));' +
    ' gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0); }';

  var FS = [
    '#version 300 es',
    'precision highp float;',
    'uniform vec2 uRes; uniform float uTime; uniform float uHeat; uniform float uLoad;',
    'out vec4 o;',
    'float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }',
    'float noise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);',
    '  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }',
    'float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int k = 0; k < 4; k++) { s += a * noise(p); p = p * 2.02 + vec2(1.7, 9.2); a *= 0.5; } return s; }',
    'void main(){',
    '  vec2 uv = gl_FragCoord.xy / uRes;',              // y = 0 at the bottom of the screen
    '  float asp = uRes.x / uRes.y;',
    '  vec2 q = vec2(uv.x * asp, uv.y);',
    '  float rise = uTime * (0.08 + 0.36 * uHeat);',       // hotter air climbs faster
    '  float warp = fbm(vec2(q.x * 1.1 + uTime * 0.03, q.y * 1.4 - rise * 0.6));',
    '  float f = fbm(vec2(q.x * 1.8, q.y * 2.4 - rise) + warp * 0.9);',
    '  float front = 0.06 + 0.34 * uHeat;',                // the heat stands taller as it builds
    '  float h = uv.y - (f - 0.5) * 0.18 * (0.4 + uHeat);',
    '  float band = 1.0 - smoothstep(0.0, front, h);',     // edges in order: reversed smoothstep edges are undefined in GLSL
    '  band *= band;',
    '  float side = pow(1.0 - min(uv.x, 1.0 - uv.x) * 2.0, 8.0) * (1.0 - smoothstep(0.0, 0.9, uv.y));',
    '  float e = clamp(band * (0.6 + 0.5 * f) + side * 0.3, 0.0, 1.0) * uHeat;',
    // embers: sparse cells drifting up, only when it is really working
    '  vec2 cell = vec2(q.x * 30.0, q.y * 18.0 - uTime * (1.0 + 3.5 * uHeat));',
    '  vec2 id = floor(cell); vec2 fc = fract(cell) - 0.5; float r = hash(id);',
    '  float ember = step(0.975 - 0.03 * uLoad, r) * (1.0 - smoothstep(0.0, 0.12, length(fc + vec2(r - 0.5, 0.0) * 0.6)))',
    '    * (1.0 - smoothstep(0.0, 0.55, uv.y)) * smoothstep(0.3, 0.85, uHeat);',
    // a deep glow, never brighter than the cap that keeps text over it legible
    '  vec3 cap = vec3(0.28, 0.06, 0.024);',
    '  vec3 glow = mix(vec3(0.12, 0.009, 0.004), cap, smoothstep(0.35, 1.0, e)) * smoothstep(0.0, 0.3, e);',
    '  vec3 c = min(glow, cap) + vec3(0.55, 0.20, 0.07) * ember;',
    '  o = vec4(min(c, vec3(0.60, 0.22, 0.08)), 1.0);',
    '}'
  ].join('\n');

  var gl = null, prog = null, uRes, uTime, uHeat, uLoad;
  var heat = 0, load = 0, shown = 0, running = false, lost = false, t0 = performance.now();
  var coarse = window.matchMedia('(pointer: coarse)').matches;
  var scale = coarse ? 0.35 : 0.5;

  function build() {
    gl = canvas.getContext('webgl2', { alpha: false, antialias: false, depth: false, powerPreference: 'low-power' });
    if (!gl) return false;
    var sh = function (type, src) {
      var s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; }
      return s;
    };
    var v = sh(gl.VERTEX_SHADER, VS), f = sh(gl.FRAGMENT_SHADER, FS);
    if (!v || !f) return false;
    prog = gl.createProgram();
    gl.attachShader(prog, v); gl.attachShader(prog, f); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.warn(gl.getProgramInfoLog(prog)); return false; }
    gl.useProgram(prog);
    gl.bindVertexArray(gl.createVertexArray());   // attribute-less triangle, from gl_VertexID
    uRes = gl.getUniformLocation(prog, 'uRes');
    uTime = gl.getUniformLocation(prog, 'uTime');
    uHeat = gl.getUniformLocation(prog, 'uHeat');
    uLoad = gl.getUniformLocation(prog, 'uLoad');
    resize();
    return true;
  }

  function resize() {
    if (!gl) return;
    var w = Math.max(1, Math.round(window.innerWidth * scale));
    var h = Math.max(1, Math.round(window.innerHeight * scale));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, w, h);
  }

  function draw() {
    if (!running) return;
    if (lost || !gl) { running = false; return; }
    // ease the drawn value so a single jittery frame never flickers
    shown += (heat - shown) * 0.2;
    if (shown < 0.004 && heat < 0.004) {
      shown = 0; running = false;
      canvas.classList.remove('on');
      return;
    }
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, (performance.now() - t0) / 1000);
    gl.uniform1f(uHeat, shown);
    gl.uniform1f(uLoad, load);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    requestAnimationFrame(draw);
  }

  function wake() {
    if (running || lost || !gl) return;
    running = true;
    canvas.classList.add('on');
    requestAnimationFrame(draw);
  }

  canvas.addEventListener('webglcontextlost', function (e) {
    e.preventDefault();          // tells the browser we want it back
    lost = true; running = false; prog = null;
  });
  canvas.addEventListener('webglcontextrestored', function () {
    lost = false;
    if (build() && heat > 0.004) wake();
  });
  window.addEventListener('resize', resize);

  if (!build()) return;
  window.REDLINE_HEAT = {
    set: function (h, l) { heat = h; load = l; if (h > 0.004) wake(); }
  };
})();
