/* PELAGIA — the live water on the home hero.
   Over the photograph of the window: marine snow drifting up through the
   tank, and three shafts of surface light that lean toward the pointer, so
   the light in the picture follows the visitor. The photo itself drifts a
   few pixels against the pointer for depth. Runs only while the hero is on
   screen; a still field under prefers-reduced-motion. */
(function () {
  'use strict';
  var hero = document.querySelector('.hero');
  var cv = document.getElementById('water');
  var photo = document.getElementById('heroPhoto');
  if (!hero || !cv || !cv.getContext) return;
  var ctx = cv.getContext('2d');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover)').matches;

  var W = 0, H = 0, motes = [], visible = false, raf = 0, last = 0;
  var pointer = { x: 0.62, y: 0.4, tx: 0.62, ty: 0.4 };

  function size() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = hero.clientWidth; H = hero.clientHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    motes = [];
    var n = Math.round(W * H / 9000);        // ~140 at 1440×900, ~35 on a phone
    for (var i = 0; i < n; i++) motes.push(spawn(true));
    if (reduce) drawStill();
  }
  function spawn(anywhere) {
    return {
      x: Math.random() * W,
      y: anywhere ? Math.random() * H : H + 10,
      r: 0.5 + Math.random() * 1.6,
      v: 6 + Math.random() * 14,            // px per second, upward
      sway: 0.3 + Math.random() * 0.9,
      p: Math.random() * Math.PI * 2,
      a: 0.25 + Math.random() * 0.5,
    };
  }
  function drawStill() {
    ctx.clearRect(0, 0, W, H);
    motes.forEach(function (mt) {
      ctx.beginPath(); ctx.arc(mt.x, mt.y, mt.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(200,235,255,' + (mt.a * 0.8).toFixed(3) + ')'; ctx.fill();
    });
  }

  function frame(t) {
    if (!visible) { raf = 0; return; }
    raf = requestAnimationFrame(frame);
    var dt = last ? Math.min(t - last, 50) / 1000 : 0.016;
    last = t;
    pointer.x += (pointer.tx - pointer.x) * 0.045;
    pointer.y += (pointer.ty - pointer.y) * 0.045;
    if (canHover && photo) {
      photo.style.transform = 'translate3d(' + ((pointer.x - 0.5) * -14).toFixed(1) + 'px,' + ((pointer.y - 0.5) * -8).toFixed(1) + 'px,0) scale(1.05)';
    }
    ctx.clearRect(0, 0, W, H);

    // light from the surface: three shafts leaning toward the pointer
    ctx.globalCompositeOperation = 'lighter';
    var tw = t / 1000;
    for (var s = 0; s < 3; s++) {
      var base = pointer.x * W + (s - 1) * W * 0.11 + Math.sin(tw * 0.35 + s * 2.1) * W * 0.02;
      var lean = (pointer.x - 0.5) * -0.18 + Math.sin(tw * 0.25 + s) * 0.03;
      var topW = W * (0.035 + s * 0.012), botW = W * (0.16 + s * 0.04);
      var g = ctx.createLinearGradient(0, 0, 0, H * 0.95);
      var k = 0.10 + 0.04 * Math.sin(tw * 0.6 + s * 1.7);
      g.addColorStop(0, 'rgba(150,225,255,' + k.toFixed(3) + ')');
      g.addColorStop(0.55, 'rgba(120,200,255,' + (k * 0.35).toFixed(3) + ')');
      g.addColorStop(1, 'rgba(120,200,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(base - topW, -10);
      ctx.lineTo(base + topW, -10);
      ctx.lineTo(base + botW + lean * H, H * 0.95);
      ctx.lineTo(base - botW + lean * H, H * 0.95);
      ctx.closePath();
      ctx.fill();
    }

    // marine snow
    for (var i = 0; i < motes.length; i++) {
      var mt = motes[i];
      mt.y -= mt.v * dt;
      mt.x += Math.sin(tw * mt.sway + mt.p) * 0.25;
      if (mt.y < -10) motes[i] = mt = spawn(false);
      var glow = 1 - Math.min(1, Math.hypot(mt.x - pointer.x * W, mt.y - pointer.y * H) / (W * 0.22));
      var a = mt.a * (0.6 + 0.4 * Math.sin(tw * 1.3 + mt.p)) + glow * 0.35;
      ctx.beginPath();
      ctx.arc(mt.x, mt.y, mt.r + glow * 0.8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(205,238,255,' + Math.min(1, a).toFixed(3) + ')';
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  function start() { if (reduce || raf) return; last = 0; raf = requestAnimationFrame(frame); }

  size();
  var timer;
  window.addEventListener('resize', function () { clearTimeout(timer); timer = setTimeout(size, 150); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) start(); }, { threshold: 0.05 }).observe(hero);
  } else { visible = true; start(); }

  if (canHover) {
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      pointer.tx = (e.clientX - r.left) / r.width;
      pointer.ty = (e.clientY - r.top) / r.height;
    });
    hero.addEventListener('pointerleave', function () { pointer.tx = 0.62; pointer.ty = 0.4; });
  } else {
    setInterval(function () { pointer.tx = 0.3 + Math.random() * 0.5; pointer.ty = 0.2 + Math.random() * 0.4; }, 3600);
  }
})();
