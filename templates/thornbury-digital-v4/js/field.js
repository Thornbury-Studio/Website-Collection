/* Thornbury Digital v4 — Basin restaged as ink on paper.
   Thomas attractor is the gesture. Screen-space ribbons with a maobi
   cut (露锋 / 收笔). Not point dabs. Not a wuxia wipe.
   No Three, no CDN. */

const B = 0.18;
const SIM_DT = 0.028;

function thomas(p, out) {
  out.x = Math.sin(p.y) - B * p.x;
  out.y = Math.sin(p.z) - B * p.y;
  out.z = Math.sin(p.x) - B * p.z;
}

function compile(gl, type, src) {
  var sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(sh));
  }
  return sh;
}

function program(gl, vs, fs) {
  var p = gl.createProgram();
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(p));
  }
  return p;
}

var VS = `#version 300 es
precision highp float;
layout(location=0) in vec3 aPos;
layout(location=1) in vec3 aTan;
layout(location=2) in float aSide;
layout(location=3) in float aAlong;
layout(location=4) in float aLoad;
layout(location=5) in float aSeed;
layout(location=6) in float aHeat;
layout(location=7) in float aWidth;
uniform mat4 uViewProj;
uniform float uAspect;
out float vAcross;
out float vAlong;
out float vLoad;
out float vSeed;
out float vHeat;
void main(){
  vAcross = aSide;
  vAlong = aAlong;
  vLoad = aLoad;
  vSeed = aSeed;
  vHeat = aHeat;
  vec4 clip = uViewProj * vec4(aPos, 1.0);
  vec4 clip2 = uViewProj * vec4(aPos + aTan, 1.0);
  vec2 p = clip.xy / max(abs(clip.w), 1e-4);
  vec2 q = clip2.xy / max(abs(clip2.w), 1e-4);
  p.x *= uAspect;
  q.x *= uAspect;
  vec2 d = q - p;
  float len = length(d);
  d = len < 1e-6 ? vec2(1.0, 0.0) : d / len;
  vec2 n = vec2(-d.y, d.x);
  n.x /= uAspect;
  clip.xy += n * aSide * aWidth * clip.w;
  gl_Position = clip;
}
`;

var FS = `#version 300 es
precision highp float;
in float vAcross;
in float vAlong;
in float vLoad;
in float vSeed;
in float vHeat;
out vec4 outColor;

float hash21(vec2 p){
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main(){
  float u = abs(vAcross);
  if (u > 1.0) discard;
  float n = hash21(vec2(vAlong * 40.0 + vSeed, u * 8.0));
  if (u > 0.72 && n > 0.62 && vLoad < 0.78) discard;
  float edge = 1.0 - smoothstep(0.95, 1.0, u);
  vec3 col = mix(vec3(0.14, 0.12, 0.10), vec3(0.05, 0.045, 0.04), vLoad);
  col = mix(col, vec3(0.56, 0.21, 0.17), vHeat * 0.3);
  float ink = mix(0.88, 1.0, vLoad) * edge;
  outColor = vec4(col * ink, ink);
}
`;

function lookAt(eye, target, up) {
  var zx = eye.x - target.x, zy = eye.y - target.y, zz = eye.z - target.z;
  var zl = 1 / Math.hypot(zx, zy, zz);
  zx *= zl; zy *= zl; zz *= zl;
  var xx = up.y * zz - up.z * zy;
  var xy = up.z * zx - up.x * zz;
  var xz = up.x * zy - up.y * zx;
  var xl = 1 / Math.hypot(xx, xy, xz);
  xx *= xl; xy *= xl; xz *= xl;
  var yx = zy * xz - zz * xy;
  var yy = zz * xx - zx * xz;
  var yz = zx * xy - zy * xx;
  return new Float32Array([
    xx, yx, zx, 0,
    xy, yy, zy, 0,
    xz, yz, zz, 0,
    -(xx * eye.x + xy * eye.y + xz * eye.z),
    -(yx * eye.x + yy * eye.y + yz * eye.z),
    -(zx * eye.x + zy * eye.y + zz * eye.z),
    1
  ]);
}

function perspective(fovy, aspect, near, far) {
  var f = 1 / Math.tan(fovy / 2);
  var nf = 1 / (near - far);
  var out = new Float32Array(16);
  out[0] = f / aspect;
  out[5] = f;
  out[10] = (far + near) * nf;
  out[11] = -1;
  out[14] = 2 * far * near * nf;
  return out;
}

function mul4(a, b) {
  var o = new Float32Array(16);
  for (var c = 0; c < 4; c++) {
    for (var r = 0; r < 4; r++) {
      o[c * 4 + r] =
        a[0 * 4 + r] * b[c * 4 + 0] +
        a[1 * 4 + r] * b[c * 4 + 1] +
        a[2 * 4 + r] * b[c * 4 + 2] +
        a[3 * 4 + r] * b[c * 4 + 3];
    }
  }
  return o;
}

function rotY(a) {
  var c = Math.cos(a), s = Math.sin(a);
  return new Float32Array([
    c, 0, -s, 0,
    0, 1, 0, 0,
    s, 0, c, 0,
    0, 0, 0, 1
  ]);
}

function translate(x, y, z) {
  return new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    x, y, z, 1
  ]);
}

function scaleM(s) {
  return new Float32Array([
    s, 0, 0, 0,
    0, s, 0, 0,
    0, 0, s, 0,
    0, 0, 0, 1
  ]);
}

function widthAt(t, load, heat) {
  var body = 0.58 + 0.42 * load;
  var head = t < 0.1 ? Math.pow(t / 0.1, 0.85) : 1;
  var tail = 1;
  if (t > 0.7) {
    var u = (t - 0.7) / 0.3;
    tail = u >= 1 ? 0 : Math.pow(1 - u, 2.8);
  }
  return Math.max(0, body * head * tail * (1 + heat * 0.16));
}

export function startField(canvas, opts) {
  opts = opts || {};
  var near = opts.mode === "near";
  var reduced = !!opts.reduced;
  var bridge = canvas.classList.contains("field-bridge");
  var still = !!opts.still || reduced;
  var gl = canvas.getContext("webgl2", {
    alpha: true,
    antialias: false,
    premultipliedAlpha: true,
    powerPreference: "high-performance"
  });
  if (!gl) throw new Error("WebGL2 unavailable");

  var mobile = matchMedia("(max-width: 760px)").matches ||
    (matchMedia("(pointer: coarse)").matches && innerWidth < 900);
  var N = mobile ? 4 : near ? 6 : 4;
  var H = mobile ? 72 : near ? 120 : 112;
  var maxV = N * (H - 1) * 6;
  var ndcW = near ? 0.02 : 0.017;

  var pos = new Float32Array(N * 3);
  var vel = new Float32Array(N);
  var heat = new Float32Array(N);
  var load = new Float32Array(N);
  var seed = new Float32Array(N);
  var hist = new Float32Array(N * H * 3);
  var drawPos = new Float32Array(maxV * 3);
  var drawTan = new Float32Array(maxV * 3);
  var drawSide = new Float32Array(maxV);
  var drawAlong = new Float32Array(maxV);
  var drawLoad = new Float32Array(maxV);
  var drawSeed = new Float32Array(maxV);
  var drawHeat = new Float32Array(maxV);
  var drawWidth = new Float32Array(maxV);

  var tmp = { x: 0, y: 0, z: 0 };
  for (var i = 0; i < N; i++) {
    var p = {
      x: (Math.random() - 0.5) * 6,
      y: (Math.random() - 0.5) * 6,
      z: (Math.random() - 0.5) * 6
    };
    for (var w = 0; w < 90; w++) {
      thomas(p, tmp);
      p.x += tmp.x * 0.08;
      p.y += tmp.y * 0.08;
      p.z += tmp.z * 0.08;
    }
    load[i] = 0.5 + Math.random() * 0.5;
    seed[i] = Math.random() * 97.0;
    for (var h = H - 1; h >= 0; h--) {
      hist[(i * H + h) * 3] = p.x;
      hist[(i * H + h) * 3 + 1] = p.y;
      hist[(i * H + h) * 3 + 2] = p.z;
      thomas(p, tmp);
      p.x += tmp.x * SIM_DT * 1.15;
      p.y += tmp.y * SIM_DT * 1.15;
      p.z += tmp.z * SIM_DT * 1.15;
    }
    pos[i * 3] = p.x;
    pos[i * 3 + 1] = p.y;
    pos[i * 3 + 2] = p.z;
    hist[i * H * 3] = p.x;
    hist[i * H * 3 + 1] = p.y;
    hist[i * H * 3 + 2] = p.z;
  }

  var prog = program(gl, VS, FS);
  var vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  var bPos = gl.createBuffer();
  var bTan = gl.createBuffer();
  var bSide = gl.createBuffer();
  var bAlong = gl.createBuffer();
  var bLoad = gl.createBuffer();
  var bSeed = gl.createBuffer();
  var bHeat = gl.createBuffer();
  var bWidth = gl.createBuffer();
  function bindAttr(buf, loc, size, data) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
  }
  bindAttr(bPos, 0, 3, drawPos);
  bindAttr(bTan, 1, 3, drawTan);
  bindAttr(bSide, 2, 1, drawSide);
  bindAttr(bAlong, 3, 1, drawAlong);
  bindAttr(bLoad, 4, 1, drawLoad);
  bindAttr(bSeed, 5, 1, drawSeed);
  bindAttr(bHeat, 6, 1, drawHeat);
  bindAttr(bWidth, 7, 1, drawWidth);
  gl.bindVertexArray(null);

  var uViewProj = gl.getUniformLocation(prog, "uViewProj");
  var uAspect = gl.getUniformLocation(prog, "uAspect");

  var kick = { x: 0, y: 0, z: 0, t: 0 };
  var running = false;
  var last = 0;
  var rot = 0;
  var raf = 0;
  var dprCap = mobile ? 1.25 : bridge ? 1.25 : 1.5;
  var drawCount = 0;

  function aimKick(clientX, clientY) {
    var r = canvas.getBoundingClientRect();
    kick.t = 1;
    kick.x = (((clientX - r.left) / r.width) * 2 - 1) * 2.4;
    kick.y = -(((clientY - r.top) / r.height) * 2 - 1) * 1.6;
    kick.z = 0.2;
  }
  function onPointer(e) {
    aimKick(e.clientX, e.clientY);
  }
  var pointerTarget = bridge ? window : canvas;
  pointerTarget.addEventListener("pointermove", onPointer, { passive: true });
  pointerTarget.addEventListener("pointerdown", onPointer, { passive: true });

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, dprCap);
    var w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
    var hgt = Math.max(1, Math.floor(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== hgt) {
      canvas.width = w;
      canvas.height = hgt;
    }
    gl.viewport(0, 0, w, hgt);
  }

  function emit(k, x, y, z, tx, ty, tz, side, along, ld, sd, ht, width) {
    drawPos[k * 3] = x;
    drawPos[k * 3 + 1] = y;
    drawPos[k * 3 + 2] = z;
    drawTan[k * 3] = tx;
    drawTan[k * 3 + 1] = ty;
    drawTan[k * 3 + 2] = tz;
    drawSide[k] = side;
    drawAlong[k] = along;
    drawLoad[k] = ld;
    drawSeed[k] = sd;
    drawHeat[k] = ht;
    drawWidth[k] = width;
  }

  function pack() {
    var k = 0;
    for (var i = 0; i < N; i++) {
      var ht = heat[i];
      var ld = load[i];
      var sd = seed[i];
      for (var h = 0; h < H - 1; h++) {
        var a = (i * H + h) * 3;
        var b = (i * H + h + 1) * 3;
        var x0 = hist[a] + hist[a + 2] * 0.22;
        var y0 = hist[a + 1];
        var z0 = 0;
        var x1 = hist[b] + hist[b + 2] * 0.22;
        var y1 = hist[b + 1];
        var z1 = 0;
        var tx = x0 - x1, ty = y0 - y1, tz = z0 - z1;
        if (tx * tx + ty * ty < 1e-6) continue;
        var t0 = h / (H - 1);
        var t1 = (h + 1) / (H - 1);
        var w0 = ndcW * widthAt(t0, ld, ht);
        var w1 = ndcW * widthAt(t1, ld, ht);
        if (w0 < 0.0004 && w1 < 0.0004) continue;
        emit(k++, x0, y0, z0, tx, ty, tz, 1, t0, ld, sd, ht, w0);
        emit(k++, x0, y0, z0, tx, ty, tz, -1, t0, ld, sd, ht, w0);
        emit(k++, x1, y1, z1, tx, ty, tz, 1, t1, ld, sd, ht, w1);
        emit(k++, x0, y0, z0, tx, ty, tz, -1, t0, ld, sd, ht, w0);
        emit(k++, x1, y1, z1, tx, ty, tz, -1, t1, ld, sd, ht, w1);
        emit(k++, x1, y1, z1, tx, ty, tz, 1, t1, ld, sd, ht, w1);
      }
    }
    drawCount = k;
    function sub(buf, data, stride) {
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, data.subarray(0, k * stride));
    }
    sub(bPos, drawPos, 3);
    sub(bTan, drawTan, 3);
    sub(bSide, drawSide, 1);
    sub(bAlong, drawAlong, 1);
    sub(bLoad, drawLoad, 1);
    sub(bSeed, drawSeed, 1);
    sub(bHeat, drawHeat, 1);
    sub(bWidth, drawWidth, 1);
  }

  function step(dt) {
    if (still) return;
    rot += dt * (near ? 0.048 : 0.028);
    kick.t = Math.max(0, kick.t - dt * 1.8);
    for (var i = 0; i < N; i++) {
      var px = pos[i * 3], py = pos[i * 3 + 1], pz = pos[i * 3 + 2];
      var p = { x: px, y: py, z: pz };
      thomas(p, tmp);
      vel[i] = Math.hypot(tmp.x, tmp.y, tmp.z);
      p.x += tmp.x * SIM_DT * 1.15;
      p.y += tmp.y * SIM_DT * 1.15;
      p.z += tmp.z * SIM_DT * 1.15;
      if (kick.t > 0.02) {
        var dx = p.x - kick.x, dy = p.y - kick.y, dz = p.z - kick.z;
        var d2 = dx * dx + dy * dy + dz * dz;
        if (d2 < 2.8) {
          var g = Math.exp(-d2 * 1.1) * kick.t;
          p.x += dx * g * 0.18;
          p.y += dy * g * 0.18;
          p.z += dz * g * 0.18;
          heat[i] = Math.min(1, heat[i] + g * 0.85);
        }
      }
      heat[i] *= Math.exp(-dt * 1.35);
      pos[i * 3] = p.x;
      pos[i * 3 + 1] = p.y;
      pos[i * 3 + 2] = p.z;
      for (var h = H - 1; h > 0; h--) {
        var to = (i * H + h) * 3;
        var from = (i * H + h - 1) * 3;
        hist[to] = hist[from];
        hist[to + 1] = hist[from + 1];
        hist[to + 2] = hist[from + 2];
      }
      hist[i * H * 3] = p.x;
      hist[i * H * 3 + 1] = p.y;
      hist[i * H * 3 + 2] = p.z;
    }
  }

  function draw() {
    resize();
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clearColor(0.969, 0.957, 0.937, bridge ? 0 : 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    var aspect = canvas.width / canvas.height;
    var proj = perspective(0.72, aspect, 0.2, 40);
    var eye = near
      ? { x: 0.15, y: 0.2, z: 7.1 }
      : { x: 0.55, y: 0.12, z: 8.4 };
    var view = lookAt(eye, { x: 0, y: 0, z: 0 }, { x: 0, y: 1, z: 0 });
    var model = mul4(
      translate(near ? 0.08 : 0.85, near ? 0.06 : 0.02, 0),
      mul4(rotY(rot), scaleM(near ? 1.05 : 0.82))
    );
    var vp = mul4(proj, mul4(view, model));

    pack();
    gl.useProgram(prog);
    gl.uniformMatrix4fv(uViewProj, false, vp);
    gl.uniform1f(uAspect, aspect);
    gl.bindVertexArray(vao);
    if (drawCount > 0) gl.drawArrays(gl.TRIANGLES, 0, drawCount);
  }

  function frame(t) {
    if (!running) return;
    var dt = last ? Math.min(0.033, (t - last) / 1000) : 0.016;
    last = t;
    step(dt);
    draw();
    raf = requestAnimationFrame(frame);
  }

  function startLoop() {
    if (still || running) return;
    running = true;
    last = 0;
    raf = requestAnimationFrame(frame);
  }

  function stopLoop() {
    running = false;
    cancelAnimationFrame(raf);
    raf = 0;
  }

  if (still) {
    step(0);
    draw();
  } else {
    startLoop();
  }

  var io = null;
  if (!bridge && !still) {
    io = new IntersectionObserver(function (entries) {
      var on = entries[0] && entries[0].isIntersecting;
      if (on) startLoop();
      else stopLoop();
    }, { threshold: 0.05 });
    io.observe(canvas);
  }

  canvas.addEventListener("webglcontextlost", function (e) {
    e.preventDefault();
    stopLoop();
    if (window.__tbFold) window.__tbFold();
  });

  return {
    stop: function () {
      stopLoop();
      if (io) io.disconnect();
    },
    pause: function () {
      if (still) return;
      stopLoop();
    },
    resume: function () {
      if (still) return;
      startLoop();
    },
    kickAt: function (clientX, clientY) {
      if (still) return;
      aimKick(clientX, clientY);
    }
  };
}
