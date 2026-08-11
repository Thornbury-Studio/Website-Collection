/* UNSTILL — the carbonation engine.

   Three systems share one fixed canvas and one physics loop:

   1. Ambient fizz — small bubbles nucleate at the bottom of the viewport and
      rise with a wobble, like the wall of a glass. Scrolling fast sheds a
      burst, because agitation is the brand.
   2. Pressure — holding the DO NOT SHAKE button charges a gauge. The page
      itself trembles, scaled by pressure, with escalating warnings.
   3. Detonation — at full pressure the can goes: a foam front sweeps the
      viewport, a few hundred bubbles vent, everything settles.

   All of it is decoration, so all of it is skipped outright for
   prefers-reduced-motion, and the page works identically without it. */
(function (root, doc) {
  'use strict';

  var reduced = root.matchMedia('(prefers-reduced-motion: reduce)');
  var UNSTILL = root.UNSTILL;

  /* Flavour fill colours for drawn bubbles, kept in step with the theme. */
  var TINT = {
    citrus: '#ffce00', burn: '#ff4b21', mood: '#8f86ff', snap: '#00c96c'
  };
  function tint() {
    return TINT[UNSTILL ? UNSTILL.getFlavor() : 'citrus'] || '#ffce00';
  }

  /* ---- canvas ------------------------------------------------------------ */

  var canvas = null, ctx = null, W = 0, H = 0, dpr = 1;
  var bubbles = [];
  var MAX_AMBIENT = 46;
  var running = false;

  function ensureCanvas() {
    if (canvas) return true;
    canvas = doc.createElement('canvas');
    canvas.className = 'fizz-layer';
    canvas.setAttribute('aria-hidden', 'true');
    doc.body.appendChild(canvas);
    ctx = canvas.getContext('2d');
    resize();
    root.addEventListener('resize', resize);
    return true;
  }

  function resize() {
    if (!canvas) return;
    dpr = Math.min(root.devicePixelRatio || 1, 2);
    W = root.innerWidth;
    H = root.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawn(x, y, speed, size, life) {
    bubbles.push({
      x: x, y: y,
      r: size || (1 + Math.random() * 2.6),
      vy: -(speed || (0.35 + Math.random() * 0.8)),
      vx: (Math.random() - 0.5) * 0.3,
      wob: Math.random() * Math.PI * 2,
      wobSpeed: 0.02 + Math.random() * 0.05,
      life: life || 1,
      decay: 0.0008 + Math.random() * 0.0016
    });
  }

  var lastScrollY = 0, scrollVel = 0;

  function step() {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);

    /* ambient nucleation, more under pressure */
    var target = MAX_AMBIENT + Math.round(pressure * 120);
    if (bubbles.length < target && Math.random() < 0.4 + pressure) {
      spawn(Math.random() * W, H + 6);
    }

    var col = tint();
    for (var i = bubbles.length - 1; i >= 0; i--) {
      var b = bubbles[i];
      b.wob += b.wobSpeed;
      b.x += b.vx + Math.sin(b.wob) * 0.45;
      b.y += b.vy - scrollVel * 0.02;
      b.vy *= 0.999;
      b.life -= b.decay;
      if (b.y < -10 || b.life <= 0) { bubbles.splice(i, 1); continue; }
      ctx.globalAlpha = Math.max(0, Math.min(0.5, b.life * 0.5));
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.stroke();
      /* highlight dot */
      ctx.globalAlpha *= 0.7;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, Math.max(0.5, b.r * 0.22), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    scrollVel *= 0.9;
    root.requestAnimationFrame(step);
  }

  function start() {
    if (running || reduced.matches) return;
    ensureCanvas();
    running = true;
    root.requestAnimationFrame(step);
  }
  function stop() {
    running = false;
    if (ctx) ctx.clearRect(0, 0, W, H);
  }

  root.addEventListener('scroll', function () {
    var y = root.scrollY;
    var v = Math.abs(y - lastScrollY);
    lastScrollY = y;
    scrollVel = Math.min(60, scrollVel + v * 0.5);
    /* a hard flick sheds a visible burst */
    if (v > 90 && running) {
      for (var i = 0; i < 6; i++) spawn(Math.random() * W, H + 6, 1.5 + Math.random() * 2);
    }
  }, { passive: true });

  /* ---- pressure ---------------------------------------------------------- */

  var pressure = 0;
  var charging = false;
  var chargeTimer = null;
  var el = doc.documentElement;

  var WARNINGS = [
    [0.25, 'It says do not.'],
    [0.5, 'You are still doing it.'],
    [0.75, 'This is now your responsibility.'],
    [0.92, 'LAST WARNING.']
  ];
  var warned = -1;

  function announce(msg) {
    var live = doc.getElementById('shakeLive');
    if (live) live.textContent = msg;
  }

  function setPressure(p) {
    pressure = Math.max(0, Math.min(1, p));
    el.style.setProperty('--pressure', pressure.toFixed(3));
    /* tremble scales with pressure; zeroed for reduced motion via CSS */
    if (!reduced.matches && pressure > 0.05) {
      var a = pressure * pressure * 7;
      el.style.setProperty('--jx', ((Math.random() - 0.5) * a).toFixed(2) + 'px');
      el.style.setProperty('--jy', ((Math.random() - 0.5) * a).toFixed(2) + 'px');
      el.style.setProperty('--jr', ((Math.random() - 0.5) * a * 0.05).toFixed(3) + 'deg');
    } else {
      el.style.setProperty('--jx', '0px');
      el.style.setProperty('--jy', '0px');
      el.style.setProperty('--jr', '0deg');
    }
    for (var i = 0; i < WARNINGS.length; i++) {
      if (pressure >= WARNINGS[i][0] && warned < i) {
        warned = i;
        announce(WARNINGS[i][1]);
      }
    }
  }

  function charge() {
    if (!charging) return;
    if (pressure >= 1) {
      detonate();
      return;
    }
    setPressure(pressure + 0.016);
    chargeTimer = root.setTimeout(charge, 40);
  }

  function beginCharge() {
    if (charging) return;
    charging = true;
    start();
    charge();
  }

  function endCharge() {
    charging = false;
    root.clearTimeout(chargeTimer);
    /* pressure leaks back down unless it blew */
    (function leak() {
      if (charging || pressure <= 0) { warned = -1; return; }
      setPressure(pressure - 0.03);
      root.setTimeout(leak, 40);
    })();
  }

  /* ---- detonation -------------------------------------------------------- */

  var detonating = false;

  function detonate() {
    if (detonating) return;
    detonating = true;
    charging = false;
    root.clearTimeout(chargeTimer);
    announce('Told you.');

    /* vent: a few hundred bubbles from the bottom, fast */
    if (!reduced.matches) {
      ensureCanvas();
      start();
      for (var i = 0; i < 260; i++) {
        spawn(Math.random() * W, H + Math.random() * 60,
          2.2 + Math.random() * 5.5, 1.5 + Math.random() * 5, 1);
      }
      foamSweep();
    }
    root.setTimeout(function () {
      setPressure(0);
      warned = -1;
      detonating = false;
      root.dispatchEvent(new CustomEvent('unstill:detonated'));
    }, reduced.matches ? 50 : 1600);
  }

  /* The foam front: a one-off canvas overlay that washes up the viewport as a
     wall of circles, then drains. Drawn, not videoed — it has to run at any
     viewport size and cost nothing when idle. */
  function foamSweep() {
    var f = doc.createElement('canvas');
    f.className = 'foam';
    f.setAttribute('aria-hidden', 'true');
    doc.body.appendChild(f);
    var fx = f.getContext('2d');
    f.width = Math.round(W * dpr);
    f.height = Math.round(H * dpr);
    fx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var blobs = [];
    var cols = Math.ceil(W / 36) + 2;
    for (var c = 0; c <= cols; c++) {
      blobs.push({
        x: c * 36 + (Math.random() - 0.5) * 18,
        r: 26 + Math.random() * 26,
        ph: Math.random() * Math.PI * 2
      });
    }
    var t0 = null;
    var UP = 520, HOLD = 260, DOWN = 640;

    function frame(ts) {
      if (t0 === null) t0 = ts;
      var t = ts - t0;
      var front;
      if (t < UP) front = H * (1 - t / UP) - 40;
      else if (t < UP + HOLD) front = -40;
      else if (t < UP + HOLD + DOWN) front = H * ((t - UP - HOLD) / DOWN) * 1.2 - 40;
      else { f.remove(); return; }

      fx.clearRect(0, 0, W, H);
      fx.fillStyle = '#f7f3ea';
      fx.beginPath();
      fx.rect(0, Math.max(front, 0), W, H - Math.max(front, 0));
      fx.fill();
      for (var i = 0; i < blobs.length; i++) {
        var b = blobs[i];
        fx.beginPath();
        fx.arc(b.x, front + Math.sin(b.ph + t / 90) * 8, b.r, 0, Math.PI * 2);
        fx.fill();
      }
      root.requestAnimationFrame(frame);
    }
    root.requestAnimationFrame(frame);
  }

  /* ---- wiring ------------------------------------------------------------ */

  function boot() {
    var btn = doc.getElementById('shakeBtn');
    if (btn) {
      /* Hold to shake. Pointer events cover mouse and touch both. */
      btn.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        /* Capture keeps the hold alive if the trembling page walks the button
           out from under the pointer — but a capture failure (an inactive or
           synthetic pointer) must not kill the charge itself. */
        try {
          if (btn.setPointerCapture) btn.setPointerCapture(e.pointerId);
        } catch (err) { /* charge anyway */ }
        beginCharge();
      });
      btn.addEventListener('pointerup', endCharge);
      btn.addEventListener('pointercancel', endCharge);
      btn.addEventListener('pointerleave', function () { if (charging) endCharge(); });
      /* Keyboard: hold Space or Enter. */
      btn.addEventListener('keydown', function (e) {
        if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
          e.preventDefault();
          beginCharge();
        }
      });
      btn.addEventListener('keyup', function (e) {
        if (e.key === ' ' || e.key === 'Enter') endCharge();
      });
    }

    if (!reduced.matches) start();
    if (reduced.addEventListener) {
      reduced.addEventListener('change', function (e) {
        if (e.matches) { stop(); setPressure(0); }
        else start();
      });
    }
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot);
  else boot();

  /* The Fizzics Lab reuses the physics with its own canvases. */
  root.Fizz = {
    spawnAt: function (x, y, n) {
      if (reduced.matches) return;
      ensureCanvas(); start();
      for (var i = 0; i < (n || 12); i++) {
        spawn(x + (Math.random() - 0.5) * 24, y + (Math.random() - 0.5) * 10,
          1 + Math.random() * 2.4);
      }
    },
    pressure: function () { return pressure; },
    detonate: detonate
  };
})(window, document);
