/* Ambient desert canvas — original silhouette, no third-party sprites */
(function () {
  const canvas = document.getElementById("world");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let w = 0;
  let h = 0;
  let dpr = 1;
  let t0 = performance.now();
  let scrollY = 0;
  let stars = [];
  let raf = 0;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seedStars();
  }

  function seedStars() {
    const n = Math.floor((w * h) / 14000);
    stars = Array.from({ length: n }, () => ({
      x: Math.random() * w,
      y: Math.random() * h * 0.62,
      r: Math.random() * 1.4 + 0.3,
      a: Math.random() * 0.7 + 0.2,
      tw: Math.random() * Math.PI * 2
    }));
  }

  function dune(yBase, amp, freq, phase, color) {
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 8) {
      const y =
        yBase +
        Math.sin(x * freq + phase) * amp +
        Math.sin(x * freq * 2.3 + phase * 1.7) * (amp * 0.35);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  function drawRex(x, groundY, scale, legPhase) {
    ctx.save();
    ctx.translate(x, groundY);
    ctx.scale(scale, scale);
    ctx.fillStyle = "#E7DFD2";
    // body
    ctx.fillRect(-18, -34, 42, 22);
    // head
    ctx.fillRect(18, -46, 28, 18);
    ctx.fillRect(40, -40, 10, 6);
    // eye
    ctx.fillStyle = "#0B0D10";
    ctx.fillRect(36, -42, 3, 3);
    ctx.fillStyle = "#E7DFD2";
    // arm
    ctx.fillRect(8, -20, 10, 3);
    // legs
    const lift = Math.sin(legPhase) * 6;
    const lift2 = Math.sin(legPhase + Math.PI) * 6;
    ctx.fillRect(-8, -12, 8, 14 + lift);
    ctx.fillRect(6, -12, 8, 14 + lift2);
    // tail
    ctx.fillRect(-34, -28, 18, 8);
    ctx.fillRect(-42, -24, 10, 5);
    ctx.restore();
  }

  function cactus(x, groundY, s) {
    ctx.fillStyle = "#7D9B76";
    ctx.fillRect(x, groundY - 36 * s, 8 * s, 36 * s);
    ctx.fillRect(x - 10 * s, groundY - 28 * s, 10 * s, 5 * s);
    ctx.fillRect(x - 12 * s, groundY - 28 * s, 5 * s, 14 * s);
    ctx.fillRect(x + 8 * s, groundY - 22 * s, 10 * s, 5 * s);
    ctx.fillRect(x + 13 * s, groundY - 22 * s, 5 * s, 12 * s);
  }

  function frame(now) {
    const t = (now - t0) / 1000;
    const parallax = scrollY * 0.08;
    ctx.clearRect(0, 0, w, h);

    // sky
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#0B0D10");
    g.addColorStop(0.45, "#121820");
    g.addColorStop(1, "#1A140E");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // stars
    for (const s of stars) {
      const a = reduce ? s.a : s.a * (0.55 + 0.45 * Math.sin(t * 1.5 + s.tw));
      ctx.fillStyle = `rgba(231,223,210,${a})`;
      ctx.fillRect(s.x, s.y + parallax * 0.15, s.r, s.r);
    }

    // far dunes
    dune(h * 0.58 + parallax * 0.2, 18, 0.004, t * 0.15, "#16110d");
    dune(h * 0.66 + parallax * 0.35, 28, 0.006, t * 0.25 + 1, "#1c1610");
    dune(h * 0.76 + parallax * 0.55, 36, 0.008, t * 0.35 + 2, "#241c14");

    // ground line scrub
    const ground = h * 0.82 + parallax * 0.7;
    ctx.fillStyle = "#2A2218";
    ctx.fillRect(0, ground, w, h - ground);

    // cacti drifting
    const speed = reduce ? 0 : 40;
    for (let i = 0; i < 5; i++) {
      const cx = ((i * 220 - t * speed * (0.6 + i * 0.08)) % (w + 120) + w + 120) % (w + 120) - 40;
      cactus(cx, ground, 0.7 + (i % 3) * 0.15);
    }

    // runner silhouette
    const leg = reduce ? 0 : t * 10;
    const bob = reduce ? 0 : Math.abs(Math.sin(t * 10)) * 2;
    drawRex(w * 0.22, ground - bob, 1.15, leg);

    // horizon dust
    ctx.fillStyle = "rgba(196,165,116,0.08)";
    ctx.fillRect(0, ground - 40, w, 40);

    if (!reduce) raf = requestAnimationFrame(frame);
  }

  window.addEventListener("resize", () => {
    resize();
    if (reduce) frame(performance.now());
  });
  window.addEventListener(
    "scroll",
    () => {
      scrollY = window.scrollY || 0;
      if (reduce) frame(performance.now());
    },
    { passive: true }
  );

  resize();
  if (reduce) frame(performance.now());
  else raf = requestAnimationFrame(frame);

  window.OUTAGE_WORLD = {
    freeze() {
      cancelAnimationFrame(raf);
    }
  };
})();
