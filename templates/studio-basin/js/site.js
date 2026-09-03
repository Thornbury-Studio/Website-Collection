/* Thornbury / BASIN — shared site behaviour: reveal, marquee (true
   loop, see PATTERNS.md), ink cursor, entrance lift, media components.
   Vanilla ES module, no build step, matches this repo's own pattern. */

/* ---------------- Reveal (ink-wipe on scroll) ---------------- */
function initReveal() {
  const els = document.querySelectorAll(".rv");
  if (!els.length) return;
  if (typeof IntersectionObserver === "undefined") {
    els.forEach((el) => el.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: "0px 0px -8% 0px" },
  );
  els.forEach((el) => {
    io.observe(el);
    window.setTimeout(() => el.classList.add("in"), 1800);
  });
}

/* ---------------- Marquee — true loop (PATTERNS.md) ---------------- */
function trueLoopMarquee(track, secondsPerCopy) {
  if (!track || !track.firstElementChild) return;
  const master = track.firstElementChild.cloneNode(true);
  let timer;
  function build() {
    track.style.animationName = "none";
    while (track.children.length > 1) track.removeChild(track.lastElementChild);
    const rowW = track.firstElementChild.getBoundingClientRect().width;
    const boxW = (track.parentElement || document.body).getBoundingClientRect().width;
    if (rowW < 1) { track.style.animationName = ""; return; }
    const perHalf = Math.max(1, Math.ceil(boxW / rowW));
    for (let i = 1; i < perHalf * 2; i++) {
      const copy = master.cloneNode(true);
      copy.setAttribute("aria-hidden", "true");
      track.appendChild(copy);
    }
    track.style.animationDuration = secondsPerCopy * perHalf + "s";
    void track.offsetWidth;
    track.style.animationName = "";
  }
  build();
  window.addEventListener("resize", () => {
    clearTimeout(timer);
    timer = window.setTimeout(build, 200);
  });
}

function initMarquees() {
  document.querySelectorAll(".marquee-track").forEach((track) => {
    const speed = parseFloat(track.dataset.speed || "13");
    trueLoopMarquee(track, speed);
  });
}

/* ---------------- Ink cursor ---------------- */
function initInkCursor() {
  if (!window.matchMedia("(pointer: fine)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const el = document.createElement("div");
  el.className = "ink-cursor";
  el.setAttribute("aria-hidden", "true");
  document.body.appendChild(el);

  let tx = innerWidth / 2, ty = innerHeight / 2, x = tx, y = ty, raf = 0, idle = true;
  const tick = () => {
    const dx = tx - x, dy = ty - y;
    x += dx * 0.18; y += dy * 0.18;
    el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
    if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) { idle = true; return; }
    raf = requestAnimationFrame(tick);
  };
  window.addEventListener("pointermove", (e) => {
    tx = e.clientX; ty = e.clientY;
    el.dataset.live = "1";
    if (idle) { idle = false; raf = requestAnimationFrame(tick); }
    const hot = !!e.target.closest?.("a, button, .media-frame, .case-panel, .wall-plate, [role='button']");
    el.dataset.hot = hot ? "1" : "";
  }, { passive: true });
  document.addEventListener("pointerleave", () => { el.dataset.live = ""; });
}

/* ---------------- Entrance lift (once per session) ---------------- */
function initEntrance() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  try {
    if (sessionStorage.getItem("thornbury-entered") === "1") return;
    sessionStorage.setItem("thornbury-entered", "1");
  } catch {}
  const el = document.createElement("div");
  el.className = "entrance";
  el.setAttribute("aria-hidden", "true");
  el.innerHTML = '<div class="entrance-mark"><span class="entrance-name">Thornbury</span><span class="entrance-rule"></span></div>';
  document.body.appendChild(el);
  window.setTimeout(() => el.remove(), 2100);
}

/* ---------------- Media: hover/tap loop + click-to-play ---------------- */
function initMediaFrames() {
  document.querySelectorAll(".media-frame[data-loop]").forEach((frame) => {
    const v = frame.querySelector("video");
    if (!v) return;
    const autoplayInView = frame.dataset.autoplayInview === "1";
    const hint = frame.querySelector(".media-hint");
    const play = () => v.play().then(() => hint && (hint.dataset.hidden = "1")).catch(() => {});
    const stop = () => { v.pause(); hint && delete hint.dataset.hidden; };
    if (autoplayInView && typeof IntersectionObserver !== "undefined" &&
        !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      new IntersectionObserver(
        (entries) => entries.forEach((e) => (e.intersectionRatio >= 0.35 ? play() : stop())),
        { threshold: [0, 0.35] },
      ).observe(frame);
    } else {
      frame.addEventListener("pointerenter", (e) => e.pointerType === "mouse" && play());
      frame.addEventListener("pointerleave", (e) => e.pointerType === "mouse" && stop());
      frame.addEventListener("click", () => (v.paused ? play() : stop()));
    }
  });

  document.querySelectorAll(".media-frame[data-click-play]").forEach((frame) => {
    const v = frame.querySelector("video");
    if (!v) return;
    const hint = frame.querySelector(".media-hint");
    const label = hint ? hint.textContent : "";
    frame.addEventListener("click", () => {
      if (!v.paused) { v.pause(); hint && delete hint.dataset.hidden; return; }
      if (v.ended) v.currentTime = 0;
      v.play().then(() => hint && (hint.dataset.hidden = "1")).catch(() => {});
    });
    v.addEventListener("ended", () => {
      if (hint) { delete hint.dataset.hidden; hint.textContent = "↺ replay · " + label.replace(/^▶ /, ""); }
    });
  });
}

initEntrance();
initReveal();
initMarquees();
initInkCursor();
initMediaFrames();

/* ---------------- Perf meter (?perf) — manual only, standing rule ----------------
   Reads a number onto the screen. Posts nothing, navigates nowhere,
   nothing listens for it. See DESIGN.md, "Phone verification is manual." */
function initPerfProbe() {
  if (!new URLSearchParams(location.search).has("perf")) return;
  const el = document.createElement("div");
  el.className = "probe";
  el.setAttribute("aria-hidden", "true");
  el.innerHTML = '<div class="probe-sub">measuring&hellip;</div>';
  document.body.appendChild(el);

  window.setTimeout(() => {
    let frames = 0, tailFrames = 0;
    const t0 = performance.now();
    const tick = () => {
      frames++;
      const elapsed = performance.now() - t0;
      if (elapsed >= 4500) tailFrames++;
      if (elapsed < 6000) { requestAnimationFrame(tick); return; }
      const avg = Math.round((frames * 1000) / elapsed);
      const settled = Math.round((tailFrames * 1000) / (elapsed - 4500));
      el.innerHTML = `<div class="probe-big">${settled} fps</div><div class="probe-sub">settled &middot; ${avg} avg</div>`;
    };
    requestAnimationFrame(tick);
  }, 2000);
}

initPerfProbe();
