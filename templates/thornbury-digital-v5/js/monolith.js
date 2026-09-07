/* Thornbury Digital v5 — js/monolith.js
   The home hero's object: a liquid-chrome monolith, raymarched.

   The site is called LIQUID MONOLITH and until now nothing on it was one. This
   is it: a standing slab of chrome whose surface never sets — a signed
   distance field of a rounded block, displaced by three octaves of
   domain-warped noise that drift across it, marched from the camera in a
   single fragment shader and shaded as chrome by reflecting a procedural
   room: a dark floor, a faint grey sky, one long ember strip of light and a
   soft white key from the upper left. Nothing is textured, nothing is loaded;
   the whole object is arithmetic.

   It stands in front of the liquid field (the strands pass behind it), turns
   toward the pointer, and the pointer's touch raises the surface where it
   points. Scrolling away melts it: the displacement grows and the block comes
   apart before it leaves the frame. Like the field, it is one canvas for the
   whole session, fixed over the hero's place and compiled once at idle after
   first load; pages that are not Home simply fade it out and it stops
   drawing, so a return to Home costs no compile and no context — that cost
   used to land as a 60 ms frame on every arrival. It renders at a fraction
   of device resolution (chrome survives upscaling; the halo is the
   anti-aliasing) and the fraction governs itself by measured frame time.
   Reduced motion and the effects switch: never mounted; the field alone
   stands. Raw WebGL, no library, one triangle, one program. */

var VERT = [
  'attribute vec2 p;',
  'varying vec2 v;',
  'void main() { v = p; gl_Position = vec4(p, 0.0, 1.0); }'
].join('\n');

var FRAG = [
  'precision highp float;',
  'varying vec2 v;',
  'uniform vec2 uRes;',
  'uniform float uTime;',
  'uniform vec2 uTilt;',      /* yaw, pitch from the pointer, eased */
  'uniform vec2 uTouch;',     /* pointer in object space, x/y */
  'uniform float uTouchOn;',
  'uniform float uFade;',     /* 0 gone, 1 present */
  'uniform float uMelt;',     /* 0 solid, 1 liquefied (scroll) */
  'uniform float uShift;',    /* where the slab stands, in view units */
  'uniform float uScale;',    /* the slab's size */
  'uniform int uSteps;',
  'uniform vec3 uEmber;',

  /* ---- noise: value noise with a smooth kernel, three octaves, warped ---- */
  'float hash(vec3 p) { p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3)); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }',
  'float noise(vec3 x) {',
  '  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);',
  '  return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),',
  '             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);',
  '}',
  'float fbm(vec3 p) {',
  '  return 0.62 * noise(p) + 0.38 * noise(p * 2.07 + vec3(1.7, 9.2, 3.1));',
  '}',

  /* ---- the object ---- */
  'float sdBox(vec3 p, vec3 b, float r) { vec3 q = abs(p) - b; return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r; }',
  'mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }',
  'vec3 toObj(vec3 p) {',
  '  p.x -= uShift;',
  '  p.yz = rot(uTilt.y) * p.yz;',
  '  p.xz = rot(uTilt.x + sin(uTime * 0.11) * 0.18) * p.xz;',
  '  return p / uScale;',
  '}',
  'float map(vec3 p) {',
  '  vec3 q = toObj(p);',
  '  float d = sdBox(q, vec3(0.36, 1.42, 0.14), 0.07);',
  /* the surface: warped noise that drifts down the slab, deeper where the
     block is melting, and a raised ring around the pointer's touch */
  '  vec3 w = q * vec3(2.4, 1.6, 2.4) + vec3(0.0, -uTime * 0.22, uTime * 0.08);',
  '  float warp = fbm(w + vec3(sin(q.y * 2.3 + uTime * 0.4), 0.0, cos(q.x * 3.1 - uTime * 0.3)) * 0.35);',
  '  float amp = 0.075 + 0.22 * uMelt;',
  '  d -= (warp - 0.5) * amp * 2.0;',
  '  float touch = exp(-6.0 * dot(q.xy - uTouch, q.xy - uTouch)) * uTouchOn;',
  '  d -= touch * 0.06 * (0.5 + 0.5 * sin(uTime * 3.0 + length(q.xy - uTouch) * 18.0));',
  '  return d * uScale * 0.8;',
  '}',
  'vec3 normalAt(vec3 p) {',
  '  const vec2 k = vec2(1.0, -1.0); const float e = 0.002;',
  '  return normalize(k.xyy * map(p + k.xyy * e) + k.yyx * map(p + k.yyx * e) + k.yxy * map(p + k.yxy * e) + k.xxx * map(p + k.xxx * e));',
  '}',

  /* ---- the room the chrome reflects ---- */
  'vec3 env(vec3 d) {',
  '  float up = d.y;',
  /* the room: dark floor, grey sky, and its lights are on the camera's side,
     because a flat face reflects what is behind the viewer — a room lit only
     behind the object would show it as a black slab */
  '  vec3 sky = mix(vec3(0.02), vec3(0.16, 0.165, 0.18), smoothstep(-0.3, 1.0, up));',
  '  float floor_ = smoothstep(0.0, -0.7, up);',
  '  vec3 c = mix(sky, vec3(0.006), floor_);',
  /* a tall soft box above and in front: the chrome's long white sweep */
  '  float box = smoothstep(0.15, 0.95, d.z * 0.55 + up * 0.85);',
  '  c += vec3(0.92, 0.94, 1.0) * box * 1.15;',
  /* one ember strip, low, on the camera's side: heat under the sweep */
  '  float strip = exp(-pow((up + 0.22) * 9.0, 2.0)) * smoothstep(-0.1, 0.8, d.z);',
  '  c += uEmber * strip * 0.45;',
  /* a soft white key from the upper left, for the edges */
  '  float key = pow(max(dot(d, normalize(vec3(-0.6, 0.6, 0.5))), 0.0), 5.0);',
  '  c += vec3(0.95, 0.96, 1.0) * key * 0.9;',
  /* a thin cold rim from the right and behind, so the far edge is never lost */
  '  float rim = pow(max(dot(d, normalize(vec3(0.85, 0.15, -0.5))), 0.0), 16.0);',
  '  c += vec3(0.55, 0.6, 0.7) * rim * 0.6;',
  '  return c;',
  '}',

  'void main() {',
  '  vec2 uv = v * vec2(uRes.x / uRes.y, 1.0);',
  '  vec3 ro = vec3(0.0, 0.05, 4.2);',
  '  vec3 rd = normalize(vec3(uv * 0.62, -1.0));',
  /* the slab lives inside one sphere; a ray that misses it does no marching
     at all, and most rays miss it */
  '  vec3 sc = vec3(uShift, 0.0, 0.0); float sr = 1.75 * uScale;',
  '  vec3 oc = ro - sc; float b = dot(oc, rd); float cc = dot(oc, oc) - sr * sr; float disc = b * b - cc;',
  '  if (disc < 0.0) { gl_FragColor = vec4(0.0); return; }',
  '  float t = max(0.0, -b - sqrt(disc)), tEnd = -b + sqrt(disc), d = 1.0, near = 1e3;',
  '  for (int i = 0; i < 96; i++) {',
  '    if (i >= uSteps) break;',
  '    vec3 p = ro + rd * t;',
  '    d = map(p);',
  '    near = min(near, d);',
  '    if (d < 0.0015 || t > tEnd) break;',
  '    t += d * 0.9;',
  '  }',
  '  if (d >= 0.0015) {',
  /* a miss: the edge gets a soft glow from how close the ray came, which is
     both the anti-aliasing and the object's halo */
  '    float halo = exp(-near * 260.0) * 0.22 * uFade;',
  '    gl_FragColor = vec4(vec3(0.75, 0.76, 0.8) * halo, halo);',
  '    return;',
  '  }',
  '  vec3 p = ro + rd * t;',
  '  vec3 n = normalAt(p);',
  '  vec3 r = reflect(rd, n);',
  '  float fres = pow(1.0 - max(dot(-rd, n), 0.0), 3.0);',
  '  vec3 col = env(r) * (0.55 + 0.45 * fres);',
  /* the block is darker chrome than a mirror: it keeps the page's obsidian */
  '  col *= 0.85;',
  /* an ember seam where the surface folds hardest: the melt shows as heat */
  '  float seam = smoothstep(0.55, 1.0, 1.0 - abs(n.z)) * uMelt;',
  '  col += uEmber * seam * 0.35;',
  '  float a = uFade;',
  '  gl_FragColor = vec4(col * a, a);',
  '}'
].join('\n');

export function mount(host, opts) {
  opts = opts || {};
  var canvas = document.createElement('canvas');
  canvas.className = 'hero-gl';
  canvas.setAttribute('aria-hidden', 'true');
  host.appendChild(canvas);
  var gl = null;
  try { gl = canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: true, powerPreference: 'high-performance' }); } catch (e) { gl = null; }
  if (!gl) { canvas.remove(); return null; }

  function shader(type, src) {
    var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { return null; }
    return s;
  }
  var vs = shader(gl.VERTEX_SHADER, VERT), fs = shader(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) { canvas.remove(); return null; }
  var prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { canvas.remove(); return null; }
  gl.useProgram(prog);
  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  var U = {};
  ['uRes', 'uTime', 'uTilt', 'uTouch', 'uTouchOn', 'uFade', 'uMelt', 'uShift', 'uScale', 'uSteps', 'uEmber'].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });
  gl.uniform3f(U.uEmber, 1.0, 0.165, 0.0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  var small = Math.min(innerWidth, innerHeight) < 700;
  /* render scale: chrome survives upscaling, and the halo is the anti-aliasing.
     It adapts: the loop measures its own frame time and steps the scale down
     while frames run long, back up while they run short, so a weak GPU gets a
     softer monolith rather than a slow page. */
  var scale = small ? 0.55 : 0.8, SCALE_MIN = 0.4, SCALE_MAX = small ? 0.6 : 0.85;
  var steps = small ? 36 : 56;
  var alive = true, raf = 0, on = false, t0 = performance.now(), last = 0;
  var tiltX = 0, tiltY = 0, tX = 0, tY = 0, touchOn = 0, touchT = 0, touchX = 0, touchY = 0;
  var fade = 0, melt = 0, w = 0, h = 0, want = 0;
  var acc = 0, accN = 0;

  function resize() {
    var r = host.getBoundingClientRect();
    w = Math.max(1, Math.round(r.width * scale));
    h = Math.max(1, Math.round(r.height * scale));
    canvas.width = w; canvas.height = h;
    gl.viewport(0, 0, w, h);
    small = Math.min(innerWidth, innerHeight) < 700;
  }

  function onPointer(ev) {
    if (!on) return;
    var r = host.getBoundingClientRect();
    if (ev.clientY > r.bottom) { touchT = 0; return; }
    var nx = ((ev.clientX - r.left) / r.width) * 2 - 1;
    var ny = -(((ev.clientY - r.top) / r.height) * 2 - 1);
    tX = nx * 0.28; tY = ny * -0.14;
    /* the touch lands on the slab's face: undo the shift and the scale */
    var aspect = r.width / r.height;
    var shift = small ? 0.0 : 0.72;
    var sc = small ? 0.66 : 1.12;
    touchX = (nx * aspect * 0.62 * 4.2 - shift) / sc * 0.42;
    touchY = (ny * 0.62 * 4.2) / sc * 0.42;
    touchT = 1;
  }
  function onLeave() { touchT = 0; tX = 0; tY = 0; }

  function run() { if (!raf && alive) { last = 0; raf = requestAnimationFrame(frame); } }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }

  function frame(now) {
    raf = 0;
    if (!alive) return;
    var t = (now - t0) / 1000;
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now;
    /* present while the home hero is on screen; melting as it scrolls away */
    var H = host.clientHeight || 1;
    var gone = Math.max(0, Math.min(1, scrollY / (H * 0.75)));
    var wantFade = (on && !opts.paused) ? (1 - gone) : 0;
    fade += (wantFade - fade) * Math.min(1, dt * 2.4);
    melt += (gone - melt) * Math.min(1, dt * 3.0);
    tiltX += (tX - tiltX) * Math.min(1, dt * 3.0);
    tiltY += (tY - tiltY) * Math.min(1, dt * 3.0);
    touchOn += (touchT - touchOn) * Math.min(1, dt * 4.0);
    gl.uniform2f(U.uRes, w, h);
    gl.uniform1f(U.uTime, t);
    gl.uniform2f(U.uTilt, tiltX, tiltY);
    gl.uniform2f(U.uTouch, touchX, touchY);
    gl.uniform1f(U.uTouchOn, touchOn);
    gl.uniform1f(U.uFade, fade);
    gl.uniform1f(U.uMelt, melt);
    gl.uniform1f(U.uShift, small ? 0.0 : 0.72);
    gl.uniform1f(U.uScale, small ? 0.66 : 1.12);
    gl.uniform1i(U.uSteps, steps);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    /* the frame-time governor: a step down after ~1.5 s of long frames, a step
       back up after ~3 s of short ones */
    if (fade > 0.5 && last) {
      acc += dt; accN++;
      if (accN >= 90) {
        var avg = acc / accN; acc = 0; accN = 0;
        if (avg > 0.0195 && scale > SCALE_MIN) { scale = Math.max(SCALE_MIN, scale - 0.1); resize(); }
        else if (avg < 0.0125 && scale < SCALE_MAX && accN === 0) { scale = Math.min(SCALE_MAX, scale + 0.05); resize(); }
      }
    }
    /* gone from the screen, or faded out: nothing more to draw until asked */
    var idle = (!on || opts.paused || gone >= 1) && fade < 0.01;
    if (!idle) raf = requestAnimationFrame(frame);
  }

  resize();
  addEventListener('resize', resize);
  addEventListener('pointermove', onPointer, { passive: true });
  document.addEventListener('pointerleave', onLeave);
  addEventListener('scroll', function () { if (on && !opts.paused && scrollY < (host.clientHeight || 1)) run(); }, { passive: true });

  return {
    /* the page says whether it is the home page: the monolith stands only there */
    page: function (home) {
      on = !!home;
      host.classList.toggle('is-on', on);
      if (on) { opts.paused = false; run(); } else run();   /* run once more so it fades out */
    },
    /* the router: hold while a page leaves; the last frame stands under the fade */
    pause: function (p) { opts.paused = !!p; if (p) stop(); else if (on) run(); },
    destroy: function () {
      alive = false; stop();
      removeEventListener('resize', resize);
      removeEventListener('pointermove', onPointer);
      document.removeEventListener('pointerleave', onLeave);
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      var lose = gl.getExtension('WEBGL_lose_context');
      if (lose) lose.loseContext();
    }
  };
}
