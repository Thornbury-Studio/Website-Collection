/* TALLOW DARK — see DESIGN.md.
   Three things happen here and nothing else:
     1. the render pass  — one WebGL2 fragment program over one photograph,
        grading the same pixels cold above the melt line and warm below it;
     2. --render         — the single scalar that pass produces, pushed onto
        the document so the page itself warms as the material does;
     3. reveals          — line-level for the two display headings, block
        for everything else.
   Everything degrades: no WebGL2, no GSAP, no JS at all — the page still
   reads, and prefers-reduced-motion turns the scrub into a printed
   comparison rather than a motion. */

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;
  var hasGsap = typeof window.gsap !== 'undefined' &&
                typeof window.ScrollTrigger !== 'undefined';

  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  /* ------------------------------------------------------------------ *
     Lenis — smooth scroll, driven off GSAP's ticker so the scrub and the
     scroll share one clock. Never constructed under reduced motion.
   * ------------------------------------------------------------------ */

  if (!reduced && typeof window.Lenis !== 'undefined' && hasGsap) {
    var lenis = new Lenis({ duration: 1.05, smoothWheel: true });
    window.lenis = lenis;           // anchors, and the screenshot harness
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* ------------------------------------------------------------------ *
     1 — the render pass
   * ------------------------------------------------------------------ */

  var VERT = [
    '#version 300 es',
    'in vec2 p;',
    'out vec2 uv;',
    'void main(){ uv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }'
  ].join('\n');

  var FRAG = [
    '#version 300 es',
    'precision highp float;',
    'in vec2 uv;',
    'out vec4 frag;',
    'uniform sampler2D uTex;',
    'uniform vec2  uRes;',     // canvas size in px
    'uniform vec2  uTexRes;',  // texture size in px
    'uniform float uRender;',  // 0..1 — the melt level
    'uniform float uTime;',

    'float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }',

    'float vnoise(vec2 p){',
    '  vec2 i = floor(p), f = fract(p);',
    '  f = f * f * (3.0 - 2.0 * f);',
    '  return mix(mix(hash(i), hash(i + vec2(1,0)), f.x),',
    '             mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x), f.y);',
    '}',

    // cover-fit: the photograph is never squashed, whatever the viewport
    'vec2 cover(vec2 c){',
    '  float ca = uRes.x / uRes.y, ta = uTexRes.x / uTexRes.y;',
    '  vec2 s = ca > ta ? vec2(1.0, ta / ca) : vec2(ca / ta, 1.0);',
    '  return (c - 0.5) * s + 0.5;',
    '}',

    'vec3 sampleTex(vec2 c){ return texture(uTex, clamp(c, 0.001, 0.999)).rgb; }',

    // a 5-tap cross blur — the rendered side is smooth because it is liquid
    'vec3 soften(vec2 c, float r){',
    '  vec2 d = r / uTexRes;',
    '  vec3 s = sampleTex(c) * 0.36;',
    '  s += sampleTex(c + vec2( d.x, 0.0)) * 0.16;',
    '  s += sampleTex(c + vec2(-d.x, 0.0)) * 0.16;',
    '  s += sampleTex(c + vec2(0.0,  d.y)) * 0.16;',
    '  s += sampleTex(c + vec2(0.0, -d.y)) * 0.16;',
    '  return s;',
    '}',

    'void main(){',
    '  vec2 c = cover(uv);',

    // the melt front: a level rising through the frame, wobbled by a slow
    // noise so it reads as a liquid surface and not a wipe
    '  float wob = (vnoise(vec2(uv.x * 3.1, uTime * 0.06)) - 0.5) * 0.020',
    '            + (vnoise(vec2(uv.x * 9.3, uTime * 0.11 + 4.0)) - 0.5) * 0.008;',
    '  float level = uRender * 1.14 - 0.07 + wob;',
    '  float d = uv.y - level;',            // >0 raw above, <0 molten below
    '  float band = 0.012;',
    '  float done = 1.0 - smoothstep(-band, band, d);',

    // refraction at the meniscus — the sample is pulled toward the surface
    '  float men = exp(-abs(d) / 0.030);',
    '  vec2 cr = c + vec2(sin(uv.x * 34.0 + uTime * 0.25) * 0.0022, -0.010) * men;',

    '  vec3 sharp = sampleTex(cr);',
    '  float l = dot(sharp, vec3(0.2126, 0.7152, 0.0722));',

    // RAW — documentary black and white. Cold, gritty, contrasted, chalky.
    '  float lr = clamp((l - 0.5) * 1.30 + 0.37, 0.0, 1.0);',
    '  lr = pow(lr, 1.14);',
    '  vec3 raw = vec3(lr * 0.94 + 0.014, lr * 0.965 + 0.018, lr * 1.0 + 0.040);',
    '  float gr = (hash(gl_FragCoord.xy * 0.71 + uTime) - 0.5) * 0.085;',
    '  raw += gr * (1.0 - abs(lr - 0.5) * 1.5);',

    // RENDERED — what actually happens to fat in a pot: the structure goes.
    // The slab dissolves into a clear gold liquid. Its broad form survives as
    // density (a far mip of the same photograph), its veining survives only
    // as a faint refraction ghost, and light passes through it.
    '  float lb = dot(textureLod(uTex, clamp(cr, 0.001, 0.999), 5.5).rgb, vec3(0.2126, 0.7152, 0.0722));',
    '  float lm = dot(soften(cr, 3.0), vec3(0.2126, 0.7152, 0.0722));',
    '  float depth = clamp(-d / 0.95, 0.0, 1.0);',
    '  vec3 surf = vec3(0.99, 0.88, 0.62), deep = vec3(0.50, 0.27, 0.06);',
    '  vec3 rend = mix(surf, deep, pow(depth, 0.75));',
    '  rend *= 0.80 + lb * 0.32;',
    '  float ghost = clamp(lm - lb, -0.10, 0.10) * (1.0 - depth * 0.7);',
    '  rend += ghost * vec3(1.0, 0.82, 0.55) * 0.9;',
    '  float ca = vnoise(uv * vec2(6.0, 10.0) + vec2(uTime * 0.05, -uTime * 0.07))',
    '           * vnoise(uv * vec2(12.0, 5.0) - vec2(uTime * 0.04, uTime * 0.02));',
    '  rend += vec3(1.0, 0.86, 0.56) * smoothstep(0.22, 0.55, ca) * 0.16 * (1.0 - depth * 0.5);',
    '  rend += (hash(gl_FragCoord.xy * 0.63 + uTime * 1.7) - 0.5) * 0.014;',

    '  vec3 col = mix(raw, rend, done);',

    // the surface itself: a bright hairline of hot liquid at the front
    '  float rim = exp(-abs(d) / 0.0042);',
    '  col += vec3(1.0, 0.80, 0.46) * rim * 0.55 * smoothstep(0.02, 0.12, uRender) * step(uRender, 0.985);',
    '  float under = exp(-abs(d + 0.020) / 0.055) * step(d, 0.0);',
    '  col += vec3(0.42, 0.26, 0.09) * under * 0.30;',

    // vignette — the frame is a photograph, not a screen
    '  vec2 q = uv - 0.5;',
    '  col *= 1.0 - dot(q, q) * 0.62;',
    // editorial scrim: the frame darkens where the type sits (left third,
    // top and bottom bands) so the readouts hold 4.5:1 against a white slab
    '  float scr = mix(0.34, 1.0, smoothstep(0.02, 0.62, uv.x));',
    '  scr *= mix(0.40, 1.0, smoothstep(0.0, 0.24, uv.y)) * mix(0.30, 1.0, smoothstep(1.0, 0.70, uv.y));',
    '  col *= scr;',

    '  frag = vec4(clamp(col, 0.0, 1.0), 1.0);',
    '}'
  ].join('\n');

  function compile(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  function renderPass(stage, onProgress) {
    var canvas = stage.querySelector('canvas');
    var img = stage.querySelector('.fallback');
    if (!canvas || !img) return null;

    var gl = canvas.getContext('webgl2', {
      alpha: false, antialias: false, powerPreference: 'high-performance'
    });
    if (!gl) return null;

    var vs = compile(gl, gl.VERTEX_SHADER, VERT);
    var fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return null;

    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.bindAttribLocation(prog, 0, 'p');
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    var u = {
      tex: gl.getUniformLocation(prog, 'uTex'),
      res: gl.getUniformLocation(prog, 'uRes'),
      texRes: gl.getUniformLocation(prog, 'uTexRes'),
      render: gl.getUniformLocation(prog, 'uRender'),
      time: gl.getUniformLocation(prog, 'uTime')
    };
    gl.uniform1i(u.tex, 0);

    var ready = false;
    var progress = reduced ? 0.5 : 0;
    var visible = false;
    var raf = 0;
    var t0 = performance.now();

    function upload() {
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.generateMipmap(gl.TEXTURE_2D);   // the far mips are the dissolved slab
      gl.uniform2f(u.texRes, img.naturalWidth || 1537, img.naturalHeight || 1501);
      ready = true;
      stage.classList.add('live');
      draw(0);
    }

    function size() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.round(stage.clientWidth * dpr);
      var h = Math.round(stage.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
        gl.uniform2f(u.res, w, h);
        return true;
      }
      return false;
    }

    function draw(time) {
      if (!ready) return;
      size();
      gl.uniform1f(u.render, progress);
      gl.uniform1f(u.time, time);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    function loop() {
      raf = 0;
      if (!visible) return;
      draw((performance.now() - t0) / 1000);
      raf = requestAnimationFrame(loop);
    }

    // render only while the stage is on screen — DARK.md §5's discipline
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible && !raf && !reduced) raf = requestAnimationFrame(loop);
        if (visible && reduced) draw(0);
      }, { rootMargin: '10% 0px' }).observe(stage);
    } else {
      visible = true;
      if (!reduced) raf = requestAnimationFrame(loop);
    }

    if (img.complete && img.naturalWidth) upload();
    else img.addEventListener('load', upload, { once: true });

    window.addEventListener('resize', function () {
      if (size() && (reduced || !raf)) draw((performance.now() - t0) / 1000);
    });

    if (onProgress) onProgress(progress);

    return {
      set: function (v) {
        progress = v;
        if (reduced) draw(0);
        if (onProgress) onProgress(v);
      }
    };
  }

  /* ------------------------------------------------------------------ *
     2 — --render: the scalar leaves the canvas and warms the document
   * ------------------------------------------------------------------ */

  var section = document.querySelector('.render');
  var chip = document.querySelector('.meniscus-chip');
  var chipVal = chip && chip.querySelector('.v');
  var chipTemp = chip && chip.querySelector('.t');
  var live = document.getElementById('render-state');
  var doneCard = document.querySelector('.state--done');
  var rawCard = document.querySelector('.state--raw');
  var lastQ = -1;
  var lastStage = '';

  var STAGES = [
    [0.00, 'SOLID'],
    [0.14, 'HEAT'],
    [0.40, 'MELT'],
    [0.66, 'SKIM'],
    [0.84, 'CLARIFY'],
    [0.96, 'SET']
  ];

  function stageFor(v) {
    var name = STAGES[0][1];
    for (var i = 0; i < STAGES.length; i++) if (v >= STAGES[i][0]) name = STAGES[i][1];
    return name;
  }

  function paint(v) {
    var q = Math.round(v * 100) / 100;
    if (q === lastQ) return;
    lastQ = q;
    root.style.setProperty('--render', String(q));

    if (chip) {
      chip.style.top = (100 - q * 100) + '%';
      // at the extremes the line sits on the printed readouts — step aside
      chip.style.opacity = (q < 0.06 || q > 0.94) ? '0' : '1';
      if (chipVal) chipVal.textContent = String(Math.round(q * 100)).padStart(2, '0') + '%';
      if (chipTemp) chipTemp.textContent = Math.round(18 + q * 46) + '°C';
    }
    // each readout is only true on its own side of the line: the parfum
    // card appears once the melt reaches it, the suet card goes once melted
    if (doneCard) doneCard.style.opacity = q > 0.2 ? '1' : '0';
    if (rawCard) rawCard.style.opacity = q < 0.82 ? '1' : '0';
    var s = stageFor(q);
    if (live && s !== lastStage) {
      lastStage = s;
      live.textContent = 'Render ' + Math.round(q * 100) + ' per cent. Stage: ' + s + '.';
    }
  }

  var stage = document.querySelector('.render-stage');
  var pass = stage ? renderPass(stage, paint) : null;

  if (section) {
    if (reduced) {
      paint(0.5);
    } else if (hasGsap) {
      ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: function (self) {
          var v = self.progress;
          if (pass) pass.set(v); else paint(v);
        }
      });
    } else {
      // no GSAP: plain scroll maths, same result, no easing
      var fallbackUpdate = function () {
        var r = section.getBoundingClientRect();
        var total = r.height - window.innerHeight;
        var v = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
        if (pass) pass.set(v); else paint(v);
      };
      window.addEventListener('scroll', fallbackUpdate, { passive: true });
      fallbackUpdate();
    }
  }

  /* ------------------------------------------------------------------ *
     3 — reveals
   * ------------------------------------------------------------------ */

  if (!reduced && hasGsap) {
    var hasSplit = typeof window.SplitType !== 'undefined';

    document.querySelectorAll('[data-reveal="lines"]').forEach(function (el) {
      if (hasSplit) {
        var split = new SplitType(el, { types: 'lines', lineClass: 'line-inner' });
        split.lines.forEach(function (line) {
          var mask = document.createElement('span');
          mask.className = 'line-mask';
          line.parentNode.insertBefore(mask, line);
          mask.appendChild(line);
        });
        gsap.set(el.querySelectorAll('.line-inner'), { yPercent: 106 });
        gsap.to(el.querySelectorAll('.line-inner'), {
          yPercent: 0, duration: 1.1, ease: 'power3.out', stagger: 0.075,
          scrollTrigger: { trigger: el, start: 'top 86%', once: true }
        });
      } else {
        gsap.from(el, {
          y: 28, opacity: 0, duration: .9, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 86%', once: true }
        });
      }
    });

    document.querySelectorAll('[data-reveal="block"]').forEach(function (el) {
      gsap.from(el, {
        y: 34, opacity: 0, duration: .95, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
    });

    gsap.utils.toArray('[data-reveal="rows"]').forEach(function (group) {
      gsap.from(group.children, {
        y: 20, opacity: 0, duration: .7, ease: 'power2.out', stagger: 0.045,
        scrollTrigger: { trigger: group, start: 'top 84%', once: true }
      });
    });
  }

  /* ------------------------------------------------------------------ *
     4 — year, so the footer never goes stale
   * ------------------------------------------------------------------ */

  var y = document.querySelector('[data-year]');
  if (y) y.textContent = new Date().getFullYear();
})();
