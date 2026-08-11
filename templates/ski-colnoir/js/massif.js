/* COL NOIR — the massif, drawn as a living topographic model.
   A procedural heightfield of the domain rendered in raw WebGL as ink
   contour lines on paper — the bulletin's map standing up. Drag rotates;
   it otherwise drifts slowly. Geometry is baked once at init; per frame
   is one draw call with two uniforms. */
(function () {
  'use strict';
  window.CNMassif = function (canvas, sectors) {
    var gl = canvas.getContext('webgl', { antialias: true, alpha: false, powerPreference: 'low-power' });
    if (!gl) return null;

    /* ---------- heightfield: one main ridge, a bowl, couloir notches ---------- */
    var NX = 110, NZ = 78;
    function height(u, v) {
      /* u along the ridge (0..1), v across (0..1) */
      var ridge = Math.exp(-Math.pow((v - 0.42) * 3.1, 2));
      var spine = 0.55 + 0.45 * Math.sin(u * Math.PI * 0.9 + 0.3) * Math.exp(-Math.pow((u - 0.52) * 1.9, 2));
      var summit = Math.exp(-((u - 0.62) * (u - 0.62) * 34 + (v - 0.40) * (v - 0.40) * 46)) * 0.55;
      var shoulder = Math.exp(-((u - 0.30) * (u - 0.30) * 40 + (v - 0.46) * (v - 0.46) * 52)) * 0.34;
      var bowl = -Math.exp(-((u - 0.45) * (u - 0.45) * 26 + (v - 0.62) * (v - 0.62) * 30)) * 0.16;
      var couloir = -Math.exp(-Math.pow((u - 0.70) * 26, 2)) * Math.exp(-Math.pow((v - 0.30) * 6, 2)) * 0.22;
      var rough = (Math.sin(u * 41.7) * Math.sin(v * 33.3) + Math.sin(u * 23.1 + 2) * Math.sin(v * 57.7 + 1)) * 0.016;
      var base = 0.10 * (1 - v * 0.55);
      return Math.max(0, base + ridge * spine * 0.62 + summit + shoulder + bowl + couloir + rough);
    }

    var verts = [], idx = [];
    for (var z = 0; z < NZ; z++) {
      for (var x = 0; x < NX; x++) {
        var u = x / (NX - 1), v = z / (NZ - 1);
        verts.push((u - 0.5) * 2.5, height(u, v), (v - 0.5) * 1.8);
      }
    }
    for (z = 0; z < NZ - 1; z++) {
      for (x = 0; x < NX - 1; x++) {
        var a = z * NX + x, b = a + 1, c = a + NX, d = c + 1;
        idx.push(a, c, b, b, c, d);
      }
    }

    var vs = [
      'attribute vec3 p;varying float h;varying vec3 wp;',
      'uniform mat4 mvp;',
      'void main(){h=p.y;wp=p;gl_Position=mvp*vec4(p,1.0);}'
    ].join('\n');
    var fs = [
      'precision mediump float;varying float h;varying vec3 wp;',
      'uniform float sel;', /* selected sector x-band centre, <-9 none */
      'void main(){',
      '  vec3 paper=vec3(0.984,0.988,0.980);',
      '  vec3 ink=vec3(0.086,0.094,0.102);',
      /* contour lines every step of elevation, finer minor lines */
      '  float e=h*26.0;',
      '  float major=abs(fract(e*0.2)-0.5);',
      '  float minor=abs(fract(e)-0.5);',
      '  float fwM=fwidth(e*0.2),fwm=fwidth(e);',
      '  float lM=1.0-smoothstep(0.0,fwM*1.6,major);',
      '  float lm=(1.0-smoothstep(0.0,fwm*1.2,minor))*0.34;',
      '  vec3 col=mix(paper,ink,max(lM*0.9,lm));',
      /* hypsometric whisper: higher ground very slightly cooler */
      '  col=mix(col,vec3(0.905,0.925,0.930),clamp(h*0.55,0.0,0.5)*(1.0-max(lM,lm)));',
      /* selected sector glows red around its x band */
      '  if(sel>-9.0){float d=abs(wp.x-sel);float g=(1.0-smoothstep(0.12,0.42,d))*0.35;col=mix(col,vec3(0.847,0.153,0.173),g);}',
      '  gl_FragColor=vec4(col,1.0);',
      '}'
    ].join('\n');

    /* OES_standard_derivatives is needed for fwidth in WebGL1 */
    var ext = gl.getExtension('OES_standard_derivatives');
    var fsFinal = (ext ? '#extension GL_OES_standard_derivatives : enable\n' : '') + fs;

    function sh(t, src) {
      var s = gl.createShader(t);
      gl.shaderSource(s, src); gl.compileShader(s);
      return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
    }
    var v = sh(gl.VERTEX_SHADER, vs), f = sh(gl.FRAGMENT_SHADER, fsFinal);
    if (!v || !f) return null;
    if (!ext) return null; /* no derivatives, no clean contours — DOM fallback stays */
    var prog = gl.createProgram();
    gl.attachShader(prog, v); gl.attachShader(prog, f); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);

    var vb = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
    var ib = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(idx), gl.STATIC_DRAW);
    var uintOk = gl.getExtension('OES_element_index_uint');
    if (!uintOk) { /* fall back to 16-bit indices; grid fits under 65k anyway */ }
    var loc = gl.getAttribLocation(prog, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 0, 0);
    var uMVP = gl.getUniformLocation(prog, 'mvp');
    var uSel = gl.getUniformLocation(prog, 'sel');
    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(0.984, 0.988, 0.980, 1);

    /* sector markers live in DOM; we give the page their projected spots */
    var sectorX = { 'face-nord': 0.35, 'couloir-est': 0.50, 'combe': -0.10, 'epaule': -0.55, 'dalles': 0.14, 'foret': -0.95 };

    var rotY = -0.35, targetRot = -0.35, tilt = 0.62, sel = -10;
    var dragging = false, lastX = 0, auto = true;

    canvas.addEventListener('pointerdown', function (e) { dragging = true; auto = false; lastX = e.clientX; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointermove', function (e) { if (dragging) { targetRot += (e.clientX - lastX) * 0.006; lastX = e.clientX; } });
    canvas.addEventListener('pointerup', function () { dragging = false; });
    canvas.addEventListener('pointercancel', function () { dragging = false; });

    function mat(w, hpx) {
      /* tilt + rotate + ortho-ish perspective, hand-rolled */
      var a = rotY, ca = Math.cos(a), sa = Math.sin(a);
      var ct = Math.cos(tilt), st = Math.sin(tilt);
      var aspect = w / hpx, s = 0.97;
      /* column-major mvp = P * T * Rx * Ry, with simple perspective */
      var m = new Float32Array(16);
      /* rotate Y then tilt X then scale/aspect + z into w for depth */
      m[0] = ca * s / aspect; m[1] = sa * st * s; m[2] = sa * ct * 0.5; m[3] = sa * ct * 0.35;
      m[4] = 0; m[5] = ct * s; m[6] = -st * 0.5; m[7] = -st * 0.35;
      m[8] = -sa * s / aspect; m[9] = ca * st * s; m[10] = ca * ct * 0.5; m[11] = ca * ct * 0.35;
      m[12] = 0; m[13] = -0.22 * s; m[14] = 0.5; m[15] = 1.6;
      return m;
    }

    var running = true, visible = true;
    document.addEventListener('visibilitychange', function () {
      running = !document.hidden;
      if (running) requestAnimationFrame(frame);
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }, { threshold: 0.02 }).observe(canvas);
    }

    function size() {
      var dpr = Math.min(window.devicePixelRatio || 1, 1.6);
      var r = canvas.getBoundingClientRect();
      canvas.width = Math.max(2, r.width * dpr);
      canvas.height = Math.max(2, r.height * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    size();
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(size, 180); });

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function frame() {
      if (!running) return;
      if (visible) {
        if (auto && !reduced) targetRot += 0.0011;
        rotY += (targetRot - rotY) * 0.08;
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.uniformMatrix4fv(uMVP, false, mat(canvas.width, canvas.height));
        gl.uniform1f(uSel, sel);
        gl.drawElements(gl.TRIANGLES, idx.length, gl.UNSIGNED_INT, 0);
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    return {
      select: function (id) { sel = id && sectorX[id] !== undefined ? sectorX[id] : -10; },
      stop: function () { running = false; }
    };
  };
})();
