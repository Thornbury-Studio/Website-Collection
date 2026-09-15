/* YORIMICHI — the live sky on the film band.
   A canvas of small stars twinkles over the night photograph; the stars near
   the pointer wake up and brighten; the whole sky drifts a few pixels against
   the pointer so the photo has depth; a meteor crosses every couple of seconds.
   Runs only while the band is on screen, draws nothing under
   prefers-reduced-motion beyond a still field of stars. */
(function () {
  'use strict';
  var film = document.querySelector('.film');
  var sky = document.getElementById('sky');
  var photo = document.getElementById('skyPhoto');
  if (!film || !sky || !sky.getContext) return;
  var ctx = sky.getContext('2d');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover)').matches;
  var HORIZON = 0.58;                 // stars live above this fraction of the band

  var W = 0, H = 0, stars = [], visible = false, raf = 0, last = 0;
  var pointer = { x: 0.5, y: 0.4, tx: 0.5, ty: 0.4, on: false };
  var meteors = [], nextMeteor = 0;

  function size() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = film.clientWidth;
    H = film.clientHeight;
    sky.width = Math.round(W * dpr);
    sky.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars = [];
    var n = Math.round(W * H / 7000);   // ~185 stars at 1440×900, ~45 on a phone
    for (var i = 0; i < n; i++) {
      var y = Math.random() * HORIZON;
      stars.push({
        x: Math.random() * W,
        y: y * H,
        r: 0.6 + Math.random() * 1.7,
        a: (0.35 + Math.random() * 0.65) * (1 - y / HORIZON * 0.55),  // dimmer toward the horizon
        p: Math.random() * Math.PI * 2,
        s: 0.5 + Math.random() * 1.8,
        warm: Math.random() < 0.18,
      });
    }
    if (reduce) drawStill();
  }

  function drawStill() {
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < stars.length; i++) {
      var st = stars[i];
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,' + st.a.toFixed(3) + ')';
      ctx.fill();
    }
  }

  function spawnMeteor(t) {
    var fromLeft = Math.random() < 0.5;
    meteors.push({
      t0: t,
      life: 900 + Math.random() * 500,
      x: fromLeft ? W * (0.05 + Math.random() * 0.4) : W * (0.55 + Math.random() * 0.4),
      y: H * (0.03 + Math.random() * 0.24),
      dx: (fromLeft ? 1 : -1) * (0.55 + Math.random() * 0.3),
      dy: 0.26 + Math.random() * 0.16,
      len: 170 + Math.random() * 130,
    });
    // one every couple of seconds, so the first visit catches one
    nextMeteor = t + 1400 + Math.random() * 1800;
  }

  function frame(t) {
    if (!visible) { raf = 0; return; }
    raf = requestAnimationFrame(frame);
    var dt = last ? Math.min(t - last, 50) : 16;
    last = t;

    // the pointer eases; the sky and the photo drift against it
    pointer.x += (pointer.tx - pointer.x) * 0.06;
    pointer.y += (pointer.ty - pointer.y) * 0.06;
    var ox = (pointer.x - 0.5), oy = (pointer.y - 0.5);
    if (canHover) {
      photo.style.transform = 'translate3d(' + (ox * -16).toFixed(1) + 'px,' + (oy * -10).toFixed(1) + 'px,0) scale(1.06)';
      sky.style.transform = 'translate3d(' + (ox * -26).toFixed(1) + 'px,' + (oy * -16).toFixed(1) + 'px,0) scale(1.06)';
    }

    ctx.clearRect(0, 0, W, H);
    var px = pointer.x * W, py = pointer.y * H;
    var glowR = Math.min(W, H) * 0.26;
    var tw = t / 1000;
    for (var i = 0; i < stars.length; i++) {
      var st = stars[i];
      var a = st.a * (0.6 + 0.4 * Math.sin(tw * st.s + st.p));
      var r = st.r;
      if (pointer.on) {
        var d = Math.hypot(st.x - px, st.y - py);
        if (d < glowR) {
          var k = 1 - d / glowR;
          a = Math.min(1, a + k * 0.8);
          r = st.r + k * 2;
        }
      }
      ctx.beginPath();
      ctx.arc(st.x, st.y, r, 0, Math.PI * 2);
      ctx.fillStyle = (st.warm ? 'rgba(255,236,210,' : 'rgba(226,236,255,') + a.toFixed(3) + ')';
      ctx.fill();
    }

    // meteors: a new one every couple of seconds, two may overlap
    if (meteors.length < 2 && t > nextMeteor) spawnMeteor(t);
    for (var m = meteors.length - 1; m >= 0; m--) {
      var mt = meteors[m];
      var k2 = (t - mt.t0) / mt.life;
      if (k2 >= 1) { meteors.splice(m, 1); continue; }
      var hx = mt.x + mt.dx * k2 * 1000, hy = mt.y + mt.dy * k2 * 1000;
      var fade = k2 < 0.15 ? k2 / 0.15 : 1 - (k2 - 0.15) / 0.85;
      var g = ctx.createLinearGradient(hx, hy, hx - mt.dx * mt.len, hy - mt.dy * mt.len);
      g.addColorStop(0, 'rgba(255,255,255,' + (0.95 * fade).toFixed(3) + ')');
      g.addColorStop(0.35, 'rgba(226,236,255,' + (0.5 * fade).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(226,236,255,0)');
      ctx.strokeStyle = g;
      ctx.lineWidth = 2.2;
      ctx.shadowColor = 'rgba(255,255,255,' + (0.8 * fade).toFixed(3) + ')';
      ctx.shadowBlur = 8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(hx - mt.dx * mt.len, hy - mt.dy * mt.len);
      ctx.stroke();
      // a bright head
      ctx.beginPath();
      ctx.arc(hx, hy, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,' + fade.toFixed(3) + ')';
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  function start() {
    if (reduce || raf) return;
    last = 0;
    if (!nextMeteor) nextMeteor = performance.now() + 500;   // the first one almost at once
    raf = requestAnimationFrame(frame);
  }

  size();
  var timer;
  window.addEventListener('resize', function () {
    clearTimeout(timer);
    timer = setTimeout(size, 150);
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) start();
    }, { threshold: 0.05 }).observe(film);
  } else {
    visible = true;
    start();
  }

  if (canHover) {
    film.addEventListener('pointermove', function (e) {
      var r = film.getBoundingClientRect();
      pointer.tx = (e.clientX - r.left) / r.width;
      pointer.ty = (e.clientY - r.top) / r.height;
      pointer.on = true;
    });
    film.addEventListener('pointerleave', function () {
      pointer.tx = 0.5;
      pointer.ty = 0.4;
      pointer.on = false;
    });
  } else {
    // no pointer to follow on a phone: the glow wanders slowly on its own
    setInterval(function () {
      pointer.tx = 0.2 + Math.random() * 0.6;
      pointer.ty = 0.1 + Math.random() * 0.35;
      pointer.on = true;
    }, 3200);
  }
})();
