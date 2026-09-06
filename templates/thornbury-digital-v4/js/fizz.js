/* Compact carbonation from soda-unstill's Fizzics Lab.
   Gold / madder / teal / acid orbs, not a generic particle wallpaper. */

var TINTS = ["#e2b84a", "#e24a3a", "#2ad4c8", "#d8f224"];

export function startFizz(canvas) {
  var ctx = canvas.getContext("2d", { alpha: true });
  var W = 0, H = 0, dpr = 1;
  var bubbles = [];
  var running = false;
  var raf = 0;

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 1.5);
    W = innerWidth;
    H = innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawn(x, y, burst) {
    bubbles.push({
      x: x,
      y: y,
      r: burst ? 10 + Math.random() * 28 : 6 + Math.random() * 18,
      vy: -(0.45 + Math.random() * 1.5),
      vx: (Math.random() - 0.5) * (burst ? 1.8 : 0.55),
      wob: Math.random() * Math.PI * 2,
      wobSpeed: 0.028 + Math.random() * 0.05,
      life: 1,
      decay: burst ? 0.005 : 0.0011 + Math.random() * 0.0018,
      tint: TINTS[(Math.random() * TINTS.length) | 0]
    });
  }

  function step() {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);
    if (bubbles.length < 56 && Math.random() < 0.62) {
      spawn(Math.random() * W, H + 10, false);
    }
    for (var i = bubbles.length - 1; i >= 0; i--) {
      var b = bubbles[i];
      b.wob += b.wobSpeed;
      b.x += b.vx + Math.sin(b.wob) * 0.65;
      b.y += b.vy;
      b.life -= b.decay;
      if (b.y < -24 || b.life <= 0) {
        bubbles.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = Math.max(0, b.life * 0.92);
      ctx.fillStyle = b.tint;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha *= 0.5;
      ctx.fillStyle = "#fff6e4";
      ctx.beginPath();
      ctx.arc(b.x - b.r * 0.28, b.y - b.r * 0.3, Math.max(1.1, b.r * 0.22), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(step);
  }

  function start() {
    if (running) return;
    resize();
    var n;
    for (n = 0; n < 18; n++) {
      spawn(Math.random() * W, Math.random() * H, n < 4);
    }
    running = true;
    raf = requestAnimationFrame(step);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
    raf = 0;
    bubbles.length = 0;
    if (ctx) ctx.clearRect(0, 0, W, H);
  }

  function burst(x, y) {
    if (!running) return;
    for (var n = 0; n < 12; n++) {
      spawn(x + (Math.random() - 0.5) * 48, y + (Math.random() - 0.5) * 28, true);
    }
  }

  window.addEventListener("resize", resize);
  return { start: start, stop: stop, burst: burst };
}
