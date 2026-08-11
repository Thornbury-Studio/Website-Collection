/* UNSTILL — the Fizzics Lab.

   Two live panels, each its own canvas and physics:

   1. The nucleation tank — bubbles only form at seeded sites, which is the
      real physics; carbonation and temperature sliders change the rates, and
      the temperature curve follows Henry's law closely enough to be honest.
   2. The Mood Ring pH bench — the butterfly-pea anthocyanin colour ramp as a
      glass you titrate with a slider.

   Reduced motion swaps both animations for a static painted state. */
(function (root, doc) {
  'use strict';

  var reduced = root.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function fit(canvas) {
    var dpr = Math.min(root.devicePixelRatio || 1, 2);
    var box = canvas.getBoundingClientRect();
    var w = Math.max(280, Math.round(box.width));
    var h = Math.round(w * 0.66);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: w, h: h };
  }

  /* ---- tank -------------------------------------------------------------- */

  function tank() {
    var canvas = doc.getElementById('tankCanvas');
    if (!canvas) return;
    var S = fit(canvas);
    var seeds = [
      { x: S.w * 0.28, y: S.h * 0.86 },
      { x: S.w * 0.62, y: S.h * 0.9 }
    ];
    var bubbles = [];
    var carb = 6, temp = 6;

    /* CO2 solubility falls roughly linearly over drinking temperatures;
       normalised so 1°C ≈ 1.0 and 30°C ≈ 0.45. */
    function henry() { return Math.max(0.45, 1 - (temp - 1) * 0.019); }

    function liquid() { return '#101018'; }

    function paintStill() {
      var x = S.ctx;
      x.fillStyle = liquid();
      x.fillRect(0, 0, S.w, S.h);
      x.fillStyle = '#f4efe6';
      x.font = '700 12px "Martian Mono", monospace';
      x.fillText('REDUCED MOTION: TANK PAUSED', 14, 24);
    }

    function step() {
      var x = S.ctx;
      x.fillStyle = liquid();
      x.fillRect(0, 0, S.w, S.h);

      /* headspace line */
      x.strokeStyle = '#2a2733';
      x.lineWidth = 2;
      x.beginPath();
      x.moveTo(0, 14);
      x.lineTo(S.w, 14);
      x.stroke();

      /* seeds fizz at a rate set by carbonation × Henry factor */
      var rate = carb * henry() * 0.055;
      seeds.forEach(function (s) {
        if (Math.random() < rate) {
          bubbles.push({
            x: s.x + (Math.random() - 0.5) * 6,
            y: s.y,
            r: 1 + Math.random() * (1.6 + carb * 0.24),
            vy: 0.5 + Math.random() * 0.9 + (30 - temp) * 0.006,
            wob: Math.random() * 6.3
          });
        }
        /* the site itself */
        x.fillStyle = '#3a352c';
        x.fillRect(s.x - 3, s.y, 6, 3);
      });

      var col = getComputedStyle(doc.documentElement).getPropertyValue('--fl-pop').trim() || '#ffce00';
      for (var i = bubbles.length - 1; i >= 0; i--) {
        var b = bubbles[i];
        b.wob += 0.08;
        b.x += Math.sin(b.wob) * 0.5;
        b.y -= b.vy;
        b.r += 0.004; /* decompression: bubbles grow as they rise */
        if (b.y < 18) { bubbles.splice(i, 1); continue; }
        x.globalAlpha = 0.75;
        x.strokeStyle = col;
        x.lineWidth = 1.3;
        x.beginPath();
        x.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        x.stroke();
      }
      x.globalAlpha = 1;
      if (bubbles.length > 420) bubbles.splice(0, bubbles.length - 420);
      root.requestAnimationFrame(step);
    }

    canvas.addEventListener('pointerdown', function (e) {
      var box = canvas.getBoundingClientRect();
      var px = e.clientX - box.left, py = e.clientY - box.top;
      if (py < 30) py = 30;
      seeds.push({ x: px, y: Math.min(py, S.h - 6) });
      if (seeds.length > 9) seeds.shift();
    });

    var carbEl = doc.getElementById('carbSlider');
    var tempEl = doc.getElementById('tempSlider');
    var tempOut = doc.getElementById('tempOut');
    var henryOut = doc.getElementById('henryOut');

    function paintOuts() {
      if (tempOut) tempOut.innerHTML = temp + '&deg;C';
      if (henryOut) henryOut.textContent = Math.round(henry() * 100) + '%';
    }
    if (carbEl) carbEl.addEventListener('input', function () { carb = +carbEl.value; });
    if (tempEl) tempEl.addEventListener('input', function () { temp = +tempEl.value; paintOuts(); });
    paintOuts();

    root.addEventListener('resize', function () { S = fit(canvas); });
    if (reduced) {
      paintStill();
    } else {
      /* One synchronous frame before the loop: requestAnimationFrame does not
         fire until the document is visible, and an unpainted canvas reads as
         a broken panel — in a background tab, and for the first paint. */
      var wasRunning = false;
      var once = function () {
        if (wasRunning) return;
        wasRunning = true;
        root.requestAnimationFrame(step);
      };
      /* paint the tank once, immediately */
      (function firstFrame() {
        var x = S.ctx;
        x.fillStyle = liquid();
        x.fillRect(0, 0, S.w, S.h);
        x.strokeStyle = '#2a2733';
        x.lineWidth = 2;
        x.beginPath();
        x.moveTo(0, 14);
        x.lineTo(S.w, 14);
        x.stroke();
        seeds.forEach(function (s2) {
          x.fillStyle = '#3a352c';
          x.fillRect(s2.x - 3, s2.y, 6, 3);
        });
      })();
      once();
    }
  }

  /* ---- pH bench ---------------------------------------------------------- */

  /* The anthocyanin ramp, teal through indigo to hot pink. Anchors are the
     published colour behaviour of butterfly pea extract, interpolated. */
  var RAMP = [
    [10.0, [0, 150, 136]],
    [8.0, [42, 90, 190]],
    [7.0, [59, 52, 180]],
    [6.0, [75, 63, 212]],
    [5.0, [122, 60, 200]],
    [4.0, [190, 55, 160]],
    [3.0, [235, 42, 120]],
    [2.0, [244, 58, 94]]
  ];

  function phColor(ph) {
    for (var i = 0; i < RAMP.length - 1; i++) {
      var a = RAMP[i], b = RAMP[i + 1];
      if (ph <= a[0] && ph >= b[0]) {
        var t = (a[0] - ph) / (a[0] - b[0]);
        return [
          Math.round(a[1][0] + (b[1][0] - a[1][0]) * t),
          Math.round(a[1][1] + (b[1][1] - a[1][1]) * t),
          Math.round(a[1][2] + (b[1][2] - a[1][2]) * t)
        ];
      }
    }
    return ph > 10 ? RAMP[0][1] : RAMP[RAMP.length - 1][1];
  }

  function bench() {
    var canvas = doc.getElementById('phCanvas');
    if (!canvas) return;
    var S = fit(canvas);
    var ph = 7.0;
    var bubbles = [];

    function draw() {
      var x = S.ctx;
      x.fillStyle = '#101018';
      x.fillRect(0, 0, S.w, S.h);

      var gx = S.w * 0.5, gw = Math.min(180, S.w * 0.34), gh = S.h * 0.74;
      var top = S.h * 0.14;
      var c = phColor(ph);
      var fill = 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')';

      /* glass */
      x.strokeStyle = '#f4efe6';
      x.lineWidth = 3;
      x.strokeRect(gx - gw / 2, top, gw, gh);
      /* liquid */
      x.fillStyle = fill;
      x.fillRect(gx - gw / 2 + 3, top + gh * 0.14, gw - 6, gh * 0.86 - 3);
      /* meniscus shine */
      x.globalAlpha = 0.35;
      x.fillStyle = '#ffffff';
      x.fillRect(gx - gw / 2 + 3, top + gh * 0.14, gw - 6, 5);
      x.globalAlpha = 1;

      /* fizz inside the glass */
      if (!reduced) {
        if (Math.random() < 0.5) {
          bubbles.push({
            x: gx - gw / 2 + 8 + Math.random() * (gw - 16),
            y: top + gh - 8,
            r: 1 + Math.random() * 2,
            vy: 0.4 + Math.random() * 0.7
          });
        }
        x.globalAlpha = 0.6;
        x.strokeStyle = '#ffffff';
        for (var i = bubbles.length - 1; i >= 0; i--) {
          var b = bubbles[i];
          b.y -= b.vy;
          if (b.y < top + gh * 0.16) { bubbles.splice(i, 1); continue; }
          x.lineWidth = 1;
          x.beginPath();
          x.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          x.stroke();
        }
        x.globalAlpha = 1;
      }

      /* the lime wedge slides in as the pH falls */
      var wedge = Math.max(0, Math.min(1, (7 - ph) / 4));
      if (wedge > 0.02) {
        x.save();
        x.translate(gx + gw / 2 - 14, top - 6 + wedge * 10);
        x.rotate(-0.5 + wedge * 0.3);
        x.fillStyle = '#00a85a';
        x.beginPath();
        x.arc(0, 0, 16, 0, Math.PI, true);
        x.fill();
        x.fillStyle = '#d6f5d6';
        x.beginPath();
        x.arc(0, -2, 11, 0, Math.PI, true);
        x.fill();
        x.restore();
      }

      /* scale */
      x.font = '700 11px "Martian Mono", monospace';
      x.fillStyle = '#a9a29a';
      x.fillText('pH ' + ph.toFixed(1), 14, 24);
      x.fillText(ph > 6.4 ? 'INDIGO — STRAIGHT FROM THE CAN'
        : ph > 4.6 ? 'VIOLET — FIRST SQUEEZE'
        : 'HOT PINK — FULLY LIMED', 14, S.h - 14);

      if (!reduced) root.requestAnimationFrame(draw);
    }

    var slider = doc.getElementById('phSlider');
    var out = doc.getElementById('phOut');
    if (slider) {
      slider.addEventListener('input', function () {
        ph = (+slider.value) / 10;
        if (out) out.textContent = ph.toFixed(1);
        if (reduced) draw();
      });
    }
    root.addEventListener('resize', function () { S = fit(canvas); if (reduced) draw(); });
    draw();
  }

  function boot() { tank(); bench(); }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window, document);
