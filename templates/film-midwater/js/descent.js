/* MIDWATER — the descent engine.
   One rAF loop drives everything: depth model, HUD readouts, water
   crossfade, marine snow, the echo-sounder strip chart, station letterbox
   masks, and the WebGL hero. Videos start and stop on visibility only.
   Bake once, animate cheap: all per-frame work is lerps and one canvas
   pass; nothing allocates inside the loop. */
(function () {
  'use strict';
  var MW = window.MW;
  var reduced = MW.prefersReduced;

  var docEl = document.documentElement;
  var vh = window.innerHeight;
  var scrollY = window.scrollY;

  /* ---------------- depth model ----------------
     Depth is piecewise-linear through each station's [from,to] band across
     its scroll span; readouts derive from physics: pressure = 1 + d/10 atm,
     light = e^(-0.046 d), temperature follows a thermocline curve. */
  var hero = document.getElementById('hero');
  var stations = Array.prototype.slice.call(document.querySelectorAll('.station'));
  var credits = document.getElementById('credits');
  var segs = [];

  function buildSegs() {
    segs = [];
    var heroH = hero.offsetHeight;
    segs.push({ top: 0, bot: heroH * 0.6, from: 0, to: 0 });
    stations.forEach(function (s) {
      var top = s.offsetTop, h = s.offsetHeight;
      segs.push({
        top: top - vh * 0.4, bot: top + h - vh,
        from: parseFloat(s.getAttribute('data-depth-from')),
        to: parseFloat(s.getAttribute('data-depth-to'))
      });
    });
    /* ascent to 0 across the credits */
    var cTop = credits.offsetTop - vh;
    segs.push({ top: cTop, bot: cTop + vh * 1.4, from: 10, to: 0 });
  }

  function depthAt(y) {
    var d = 0;
    for (var i = 0; i < segs.length; i++) {
      var s = segs[i];
      if (y <= s.top) break;
      var t = y >= s.bot ? 1 : (y - s.top) / (s.bot - s.top);
      d = s.from + (s.to - s.from) * t;
    }
    return d;
  }

  function tempAt(d) {
    /* warm mixed layer, thermocline, cold deep */
    if (d < 30) return 27 - d * 0.05;
    if (d < 200) return 25.5 - (d - 30) * 0.082;
    return Math.max(4.2, 11.6 - (d - 200) * 0.012);
  }

  /* ---------------- HUD ---------------- */
  var elDepth = document.getElementById('hudDepth');
  var elPres = document.getElementById('hudPres');
  var elLight = document.getElementById('hudLight');
  var elTemp = document.getElementById('hudTemp');
  var elTC = document.getElementById('hudTimecode');
  var waterDeep = document.getElementById('waterDeep');

  var FILM_FRAMES = 78 * 60 * 24; /* 78 min at 24 fps */
  function timecode(p) {
    var f = Math.round(p * FILM_FRAMES);
    var fr = f % 24; f = (f / 24) | 0;
    var s = f % 60; f = (f / 60) | 0;
    var m = f % 60; var h = (f / 60) | 0;
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    return pad(h) + ':' + pad(m) + ':' + pad(s) + ':' + pad(fr);
  }

  /* ---------------- station videos + letterbox ---------------- */
  stations.forEach(function (s) {
    var v = s.querySelector('.stn-video');
    var src = s.getAttribute('data-video');
    s._video = v; s._src = src; s._loaded = false; s._frame = s.querySelector('.frame');
  });

  function loadStation(s) {
    if (s._loaded) return;
    s._loaded = true;
    var v = s._video;
    v.src = s._src;
    v.load();
  }

  if ('IntersectionObserver' in window) {
    /* preload one viewport ahead; play only while on screen */
    var loadIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) loadStation(en.target);
      });
    }, { rootMargin: '90% 0px 90% 0px' });
    var playIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var s = en.target, v = s._video;
        if (en.isIntersecting) {
          loadStation(s);
          if (!reduced) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
          s._frame.classList.add('lit');
        } else {
          v.pause();
        }
      });
    }, { threshold: 0.18 });
    stations.forEach(function (s) { loadIO.observe(s); playIO.observe(s); });
  } else {
    stations.forEach(function (s) { loadStation(s); s._frame.classList.add('lit'); });
  }
  /* backgrounded-tab guard: captions must never stay hidden */
  setTimeout(function () {
    stations.forEach(function (s) {
      var r = s.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) s._frame.classList.add('lit');
    });
  }, 2200);

  /* ---------------- station index ---------------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.stnav a'));
  var lastLive = -2;
  /* live station = whichever section actually covers the viewport middle */
  function paintNav() {
    var idx = -1; /* -1 hero, 0..5 stations, 6 end */
    var mid = vh * 0.5;
    for (var i = 0; i < stations.length; i++) {
      var r = stations[i].getBoundingClientRect();
      if (r.top <= mid && r.bottom >= mid) { idx = i; break; }
    }
    if (idx === -1 && credits.getBoundingClientRect().top <= mid) idx = stations.length;
    if (idx === lastLive) return;
    lastLive = idx;
    navLinks.forEach(function (a, i) { a.classList.toggle('live', i === idx + 1); });
    if (idx >= 0 && idx < stations.length && MW.ping) MW.ping();
  }

  /* ---------------- marine snow ---------------- */
  var snowCanvas = document.getElementById('snow');
  var snowCtx = null, flakes = [], snowDPR = 1;
  function snowInit() {
    if (reduced) return;
    snowCtx = snowCanvas.getContext('2d');
    snowDPR = Math.min(window.devicePixelRatio || 1, 1.5);
    var w = window.innerWidth, h = window.innerHeight;
    snowCanvas.width = w * snowDPR; snowCanvas.height = h * snowDPR;
    var n = (w < 760 || navigator.hardwareConcurrency < 4) ? 46 : 110;
    flakes = [];
    for (var i = 0; i < n; i++) {
      flakes.push({
        x: Math.random() * w, y: Math.random() * h,
        r: 0.4 + Math.random() * 1.5,
        s: 0.14 + Math.random() * 0.5,   /* sink speed of the water past us */
        p: Math.random() * Math.PI * 2   /* sway phase */
      });
    }
  }

  var lastY = scrollY;
  function snowDraw(depth, t) {
    if (!snowCtx) return;
    var w = snowCanvas.width / snowDPR, h = snowCanvas.height / snowDPR;
    var a = MW.clamp((depth - 4) / 40, 0, 1) * 0.85;
    snowCanvas.style.opacity = a <= 0.01 ? '0' : String(0.5 + a * 0.5);
    if (a <= 0.01) return;
    var dy = (scrollY - lastY);
    snowCtx.clearRect(0, 0, w * snowDPR, h * snowDPR);
    snowCtx.save();
    snowCtx.scale(snowDPR, snowDPR);
    snowCtx.fillStyle = 'rgba(190,224,220,' + (0.16 + a * 0.3) + ')';
    for (var i = 0; i < flakes.length; i++) {
      var f = flakes[i];
      /* particles rise as the page sinks — we are the one moving */
      f.y -= f.s + dy * f.s * 0.55;
      f.x += Math.sin(t * 0.0004 + f.p) * 0.12;
      if (f.y < -4) { f.y = h + 4; f.x = Math.random() * w; }
      if (f.y > h + 6) { f.y = -4; f.x = Math.random() * w; }
      snowCtx.beginPath();
      snowCtx.arc(f.x, f.y, f.r, 0, 6.2832);
      snowCtx.fill();
    }
    snowCtx.restore();
  }

  /* ---------------- echo-sounder strip chart ----------------
     The whole descent as one vertical profile: hairline depth grid, the
     seabed trace (baked noise), and the vessel's current position. */
  var sndWrap = document.getElementById('sounder');
  var sndCanvas = document.getElementById('sounderCanvas');
  var sndCtx = null, sndDPR = 1, seabed = [];
  var MAXD = 700;
  function sounderInit() {
    if (!sndWrap || getComputedStyle(sndWrap).display === 'none') { sndCtx = null; return; }
    sndCtx = sndCanvas.getContext('2d');
    sndDPR = Math.min(window.devicePixelRatio || 1, 2);
    sndCanvas.width = sndWrap.clientWidth * sndDPR;
    sndCanvas.height = sndWrap.clientHeight * sndDPR;
    if (!seabed.length) {
      var v = 0.5;
      for (var i = 0; i <= 200; i++) {
        v += (Math.random() - 0.5) * 0.16;
        v = MW.clamp(v, 0.05, 0.95);
        seabed.push(v);
      }
    }
  }

  function sounderDraw(depth) {
    if (!sndCtx) return;
    var w = sndCanvas.width / sndDPR, h = sndCanvas.height / sndDPR;
    var c = sndCtx;
    c.save();
    c.scale(sndDPR, sndDPR);
    c.clearRect(0, 0, w, h);

    /* depth grid: a line every 100 m */
    c.strokeStyle = 'rgba(143,208,204,0.14)';
    c.fillStyle = 'rgba(143,208,204,0.5)';
    c.lineWidth = 1;
    c.font = '8px "Martian Mono", monospace';
    c.textAlign = 'right';
    for (var d = 0; d <= MAXD; d += 100) {
      var y = 12 + (h - 44) * (d / MAXD);
      c.beginPath(); c.moveTo(w - 26, y); c.lineTo(w - 8, y); c.stroke();
      c.fillText(String(d), w - 30, y + 3);
    }

    /* seabed trace along the left of the strip */
    c.strokeStyle = 'rgba(143,208,204,0.30)';
    c.beginPath();
    for (var i = 0; i < seabed.length; i++) {
      var yy = 12 + (h - 44) * (i / (seabed.length - 1));
      var xx = 10 + seabed[i] * 14;
      if (i === 0) c.moveTo(xx, yy); else c.lineTo(xx, yy);
    }
    c.stroke();

    /* the vessel */
    var vy = 12 + (h - 44) * MW.clamp(depth / MAXD, 0, 1);
    c.strokeStyle = 'rgba(224,163,62,0.9)';
    c.beginPath(); c.moveTo(8, vy); c.lineTo(w - 8, vy); c.stroke();
    c.fillStyle = '#e0a33e';
    c.beginPath(); c.arc(w / 2, vy, 2.4, 0, 6.2832); c.fill();
    c.fillStyle = 'rgba(224,163,62,0.75)';
    c.textAlign = 'left';
    c.fillText(Math.round(depth) + 'M', 10, vy - 5);
    c.restore();
  }

  /* ---------------- WebGL hero ----------------
     A single quad sampling the hero video with baked-cheap treatment:
     animated grain, vignette, edge chromatic split, and one cursor ripple.
     Falls back to the plain <video> when unavailable. */
  var heroVideo = document.getElementById('heroVideo');
  var glCanvas = document.getElementById('heroGL');
  var gl = null, glProg = null, glTex = null, glReady = false;
  var uni = {};
  var mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, amp: 0, ramp: 0 };

  function glInit() {
    if (reduced) return;
    gl = glCanvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
    if (!gl) return;
    var vs = 'attribute vec2 p;varying vec2 v;void main(){v=p*0.5+0.5;v.y=1.0-v.y;gl_Position=vec4(p,0.,1.);}';
    var fs = [
      'precision mediump float;varying vec2 v;',
      'uniform sampler2D t;uniform float time;uniform vec2 mouse;uniform float amp;uniform vec2 cover;',
      'float hash(vec2 q){return fract(sin(dot(q,vec2(127.1,311.7)))*43758.5453);}',
      'void main(){',
      '  vec2 uv=(v-0.5)*cover+0.5;',
      /* cursor ripple: radial push that decays with distance and amp */
      '  vec2 d=uv-mouse;float dist=length(d);',
      '  uv+=normalize(d+0.0001)*sin(dist*28.0-time*5.0)*0.012*amp*exp(-dist*4.5);',
      /* edge chromatic split */
      '  vec2 cc=uv-0.5;float r2=dot(cc,cc);vec2 sh=cc*r2*0.022;',
      '  float cr=texture2D(t,uv+sh).r;',
      '  vec3 col=texture2D(t,uv).rgb;col.r=cr;',
      /* grain + vignette */
      '  float g=hash(v*vec2(1280.0,720.0)+fract(time)*7.0)-0.5;',
      '  col+=g*0.055;',
      '  col*=1.0-r2*0.85;',
      '  gl_FragColor=vec4(col,1.0);',
      '}'
    ].join('\n');
    function sh(type, srcStr) {
      var s = gl.createShader(type);
      gl.shaderSource(s, srcStr); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) return null;
      return s;
    }
    var v = sh(gl.VERTEX_SHADER, vs), f = sh(gl.FRAGMENT_SHADER, fs);
    if (!v || !f) { gl = null; return; }
    glProg = gl.createProgram();
    gl.attachShader(glProg, v); gl.attachShader(glProg, f); gl.linkProgram(glProg);
    if (!gl.getProgramParameter(glProg, gl.LINK_STATUS)) { gl = null; return; }
    gl.useProgram(glProg);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(glProg, 'p');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    glTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, glTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    ['time', 'mouse', 'amp', 'cover'].forEach(function (n) { uni[n] = gl.getUniformLocation(glProg, n); });
    glSize();
    hero.classList.add('gl-on');
  }

  function glSize() {
    if (!gl) return;
    var dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 900 ? 1 : 1.5);
    glCanvas.width = hero.clientWidth * dpr;
    glCanvas.height = hero.clientHeight * dpr;
    gl.viewport(0, 0, glCanvas.width, glCanvas.height);
  }

  function glDraw(t) {
    if (!gl || heroVideo.readyState < 2) return;
    if (!glReady) { glReady = true; }
    gl.bindTexture(gl.TEXTURE_2D, glTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, heroVideo);
    /* cover-fit: scale UVs so the video fills the canvas like object-fit */
    var va = (heroVideo.videoWidth || 16) / (heroVideo.videoHeight || 9);
    var ca = glCanvas.width / glCanvas.height;
    var cx = 1, cy = 1;
    if (ca > va) { cy = va / ca; } else { cx = ca / va; }
    gl.uniform2f(uni.cover, cx, cy);
    gl.uniform1f(uni.time, t * 0.001);
    mouse.x = MW.lerp(mouse.x, mouse.tx, 0.06);
    mouse.y = MW.lerp(mouse.y, mouse.ty, 0.06);
    mouse.amp = MW.lerp(mouse.amp, mouse.ramp, 0.05);
    mouse.ramp *= 0.985;
    gl.uniform2f(uni.mouse, mouse.x, mouse.y);
    gl.uniform1f(uni.amp, mouse.amp);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  hero.addEventListener('pointermove', function (e) {
    var r = hero.getBoundingClientRect();
    mouse.tx = (e.clientX - r.left) / r.width;
    mouse.ty = (e.clientY - r.top) / r.height;
    mouse.ramp = Math.min(1, mouse.ramp + 0.14);
  });

  /* hero source: big screens that didn't ask to save data get the 4K VP9 */
  (function heroSource() {
    var conn = navigator.connection || {};
    var want4k = window.innerWidth * (window.devicePixelRatio || 1) >= 2200 &&
                 !conn.saveData && (conn.downlink === undefined || conn.downlink > 4);
    var s = document.createElement('source');
    if (want4k && heroVideo.canPlayType('video/webm; codecs="vp9"')) {
      s.src = 'video/hero-4k.webm'; s.type = 'video/webm';
      heroVideo.appendChild(s);
    }
    var m = document.createElement('source');
    m.src = 'video/hero.mp4'; m.type = 'video/mp4';
    heroVideo.appendChild(m);
    heroVideo.load();
    if (!reduced) { var p = heroVideo.play(); if (p && p.catch) p.catch(function () {}); }
  })();

  var heroOnScreen = true;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      heroOnScreen = en[0].isIntersecting;
      if (heroOnScreen && !reduced) { var p = heroVideo.play(); if (p && p.catch) p.catch(function () {}); }
      else heroVideo.pause();
    }, { threshold: 0.02 }).observe(hero);
  }

  /* ---------------- the loop ---------------- */
  var running = true;
  document.addEventListener('visibilitychange', function () {
    running = !document.hidden;
    if (running) requestAnimationFrame(tick);
  });

  var shownDepth = 0;
  function tick(t) {
    if (!running) return;
    scrollY = window.scrollY;
    var maxScroll = docEl.scrollHeight - vh;
    var progress = maxScroll > 0 ? MW.clamp(scrollY / maxScroll, 0, 1) : 0;
    var depth = depthAt(scrollY);
    shownDepth = MW.lerp(shownDepth, depth, 0.12);
    if (Math.abs(shownDepth - depth) < 0.05) shownDepth = depth;

    /* HUD */
    elDepth.textContent = Math.round(shownDepth);
    elPres.textContent = (1 + shownDepth / 10).toFixed(1) + ' ATM';
    var light = 100 * Math.exp(-0.046 * shownDepth);
    elLight.textContent = light >= 0.1 ? light.toFixed(light > 10 ? 0 : 1) + '%' : '<0.1%';
    elTemp.textContent = tempAt(shownDepth).toFixed(1) + '°C';
    elTC.textContent = timecode(progress);

    /* water darkens with depth */
    waterDeep.style.opacity = String(MW.clamp(shownDepth / 240, 0, 1));

    /* letterbox opens as each frame occupies the viewport */
    for (var i = 0; i < stations.length; i++) {
      var s = stations[i];
      var r = s.getBoundingClientRect();
      if (r.top > vh || r.bottom < 0) continue;
      var open = MW.clamp(1 - Math.abs(r.top) / (vh * 0.9), 0, 1);
      if (reduced) open = 1;
      var inset = 19 * (1 - open * open);
      s._video.style.clipPath = 'inset(' + inset.toFixed(2) + '% 0 ' + inset.toFixed(2) + '% 0)';
    }

    paintNav();
    snowDraw(shownDepth, t);
    sounderDraw(shownDepth);
    if (heroOnScreen) glDraw(t);
    MW.setAudioDepth(shownDepth);

    lastY = scrollY;
    requestAnimationFrame(tick);
  }

  /* ---------------- wiring ---------------- */
  var diveBtn = document.getElementById('diveSound');
  if (diveBtn) {
    diveBtn.addEventListener('click', function () {
      MW.setSound(true);
      diveBtn.classList.add('done');
    });
    if (MW.soundOn()) diveBtn.classList.add('done');
  }

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      vh = window.innerHeight;
      buildSegs(); snowInit(); sounderInit(); glSize();
    }, 180);
  });

  buildSegs();
  snowInit();
  sounderInit();
  glInit();
  requestAnimationFrame(tick);
})();
