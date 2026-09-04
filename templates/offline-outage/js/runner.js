/* Dry Run — original endless runner */
(function () {
  const canvas = document.getElementById("runner");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("score");
  const hiEl = document.getElementById("hi");
  const hint = document.getElementById("runner-hint");
  const over = document.getElementById("runner-over");
  const retry = document.getElementById("runner-retry");

  const W = 960;
  const H = 320;
  const GROUND = 250;
  const STORAGE_KEY = "outage-dry-hi";

  let running = false;
  let dead = false;
  let tPrev = 0;
  let score = 0;
  let speed = 280;
  let hi = Number(localStorage.getItem(STORAGE_KEY) || 0);
  let obstacles = [];
  let dust = [];
  let spawnIn = 1.2;

  const dino = {
    x: 90,
    y: GROUND,
    vy: 0,
    w: 44,
    h: 46,
    onGround: true,
    leg: 0
  };

  function pad(n) {
    return String(Math.floor(n)).padStart(5, "0");
  }

  function syncHud() {
    if (scoreEl) scoreEl.textContent = pad(score);
    if (hiEl) hiEl.textContent = pad(hi);
  }

  function reset() {
    running = true;
    dead = false;
    score = 0;
    speed = 280;
    obstacles = [];
    dust = [];
    spawnIn = 1.1;
    dino.y = GROUND;
    dino.vy = 0;
    dino.onGround = true;
    if (over) over.hidden = true;
    if (hint) hint.classList.add("is-hide");
    syncHud();
    tPrev = performance.now();
    requestAnimationFrame(loop);
  }

  function jump() {
    if (dead) {
      reset();
      return;
    }
    if (!running) {
      reset();
      return;
    }
    if (dino.onGround) {
      dino.vy = -620;
      dino.onGround = false;
      for (let i = 0; i < 8; i++) {
        dust.push({
          x: dino.x,
          y: GROUND,
          vx: -40 - Math.random() * 60,
          vy: -20 - Math.random() * 40,
          life: 0.35 + Math.random() * 0.2
        });
      }
    }
  }

  function spawnObstacle() {
    const kind = Math.random() < 0.7 ? "cactus" : "rock";
    const h = kind === "cactus" ? 40 + Math.random() * 28 : 22 + Math.random() * 14;
    const w = kind === "cactus" ? 18 + Math.random() * 16 : 28 + Math.random() * 18;
    obstacles.push({ kind, x: W + 20, y: GROUND, w, h });
  }

  function hitTest(o) {
    const dx = dino.x + 8;
    const dy = dino.y - dino.h + 8;
    const dw = dino.w - 14;
    const dh = dino.h - 12;
    const ox = o.x;
    const oy = o.y - o.h;
    return dx < ox + o.w && dx + dw > ox && dy < oy + o.h && dy + dh > oy;
  }

  function die() {
    dead = true;
    running = false;
    if (score > hi) {
      hi = Math.floor(score);
      localStorage.setItem(STORAGE_KEY, String(hi));
    }
    syncHud();
    if (over) over.hidden = false;
  }

  function drawDino() {
    const x = dino.x;
    const y = dino.y;
    ctx.fillStyle = "#E7DFD2";
    ctx.fillRect(x, y - 34, 36, 20);
    ctx.fillRect(x + 28, y - 48, 26, 16);
    ctx.fillRect(x + 48, y - 42, 10, 5);
    ctx.fillStyle = "#0B0D10";
    ctx.fillRect(x + 42, y - 44, 3, 3);
    ctx.fillStyle = "#E7DFD2";
    ctx.fillRect(x + 10, y - 18, 10, 3);
    const lift = dino.onGround ? Math.sin(dino.leg) * 5 : 0;
    const lift2 = dino.onGround ? Math.sin(dino.leg + Math.PI) * 5 : 0;
    ctx.fillRect(x + 4, y - 14, 8, 14 + lift);
    ctx.fillRect(x + 18, y - 14, 8, 14 + lift2);
    ctx.fillRect(x - 16, y - 28, 18, 8);
    // signal crest
    ctx.fillStyle = "#FF6B2C";
    ctx.fillRect(x + 32, y - 52, 4, 4);
  }

  function drawObstacle(o) {
    if (o.kind === "cactus") {
      ctx.fillStyle = "#7D9B76";
      ctx.fillRect(o.x, o.y - o.h, o.w * 0.45, o.h);
      ctx.fillRect(o.x - o.w * 0.35, o.y - o.h * 0.7, o.w * 0.4, o.w * 0.25);
      ctx.fillRect(o.x - o.w * 0.45, o.y - o.h * 0.7, o.w * 0.2, o.h * 0.35);
      ctx.fillRect(o.x + o.w * 0.4, o.y - o.h * 0.55, o.w * 0.4, o.w * 0.25);
      ctx.fillRect(o.x + o.w * 0.6, o.y - o.h * 0.55, o.w * 0.2, o.h * 0.3);
    } else {
      ctx.fillStyle = "#C4A574";
      ctx.beginPath();
      ctx.moveTo(o.x, o.y);
      ctx.lineTo(o.x + o.w * 0.3, o.y - o.h);
      ctx.lineTo(o.x + o.w, o.y - o.h * 0.45);
      ctx.lineTo(o.x + o.w * 0.85, o.y);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawBg() {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#0e1218");
    sky.addColorStop(0.7, "#16110c");
    sky.addColorStop(1, "#1a140e");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = "rgba(42,48,58,0.9)";
    ctx.beginPath();
    ctx.moveTo(0, GROUND + 0.5);
    ctx.lineTo(W, GROUND + 0.5);
    ctx.stroke();

    ctx.fillStyle = "#1f1812";
    ctx.fillRect(0, GROUND, W, H - GROUND);

    // distant dunes
    ctx.fillStyle = "#18140f";
    ctx.beginPath();
    ctx.moveTo(0, GROUND);
    for (let x = 0; x <= W; x += 20) {
      ctx.lineTo(x, GROUND - 28 - Math.sin(x * 0.01 + score * 0.002) * 10);
    }
    ctx.lineTo(W, GROUND);
    ctx.fill();
  }

  function loop(now) {
    if (!running) return;
    const dt = Math.min(0.033, (now - tPrev) / 1000);
    tPrev = now;

    speed = Math.min(520, 280 + score * 0.35);
    score += dt * (speed / 12);
    dino.leg += dt * (speed / 18);

    dino.vy += 1800 * dt;
    dino.y += dino.vy * dt;
    if (dino.y >= GROUND) {
      dino.y = GROUND;
      dino.vy = 0;
      dino.onGround = true;
    }

    spawnIn -= dt;
    if (spawnIn <= 0) {
      spawnObstacle();
      spawnIn = 0.85 + Math.random() * 1.1 - Math.min(0.4, score / 4000);
    }

    for (const o of obstacles) o.x -= speed * dt;
    obstacles = obstacles.filter((o) => o.x > -60);
    for (const o of obstacles) {
      if (hitTest(o)) {
        die();
        break;
      }
    }

    for (const p of dust) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    dust = dust.filter((p) => p.life > 0);

    drawBg();
    for (const o of obstacles) drawObstacle(o);
    for (const p of dust) {
      ctx.fillStyle = `rgba(196,165,116,${Math.max(0, p.life)})`;
      ctx.fillRect(p.x, p.y, 3, 3);
    }
    drawDino();
    syncHud();

    if (running) requestAnimationFrame(loop);
  }

  function idleDraw() {
    drawBg();
    drawDino();
    syncHud();
  }

  canvas.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    jump();
  });
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.key === " ") {
      const tag = (e.target && e.target.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "BUTTON") return;
      // let splash own Space until live
      if (!document.body.classList.contains("is-live")) return;
      e.preventDefault();
      jump();
    }
  });
  if (retry) retry.addEventListener("click", reset);

  syncHud();
  idleDraw();
})();
