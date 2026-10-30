(() => {
  const TRACKS = [
    {
      id: "ask",
      title: "Ask",
      engine: "ChatGPT",
      trigger: "Ends with ?",
      sample: "why is the sky blue?",
      meta: "ends with ?",
      disc: "img/cd-ask.webp",
      liner: "A question wants an answer, not ten blue links. End with ? and SEA seats ChatGPT.",
    },
    {
      id: "define",
      title: "Define",
      engine: "Wikipedia",
      trigger: "wiki · what is · meaning",
      sample: "what is nginx",
      meta: "definition words",
      disc: "img/cd-define.webp",
      liner: "When you ask what something is, you want the page. Those words put Wikipedia on the spindle.",
    },
    {
      id: "find",
      title: "Find",
      engine: "Google",
      trigger: "Everything else",
      sample: "best espresso machines 2026",
      meta: "everything else",
      disc: "img/cd-find.webp",
      liner: "Browsing still matters. If it isn’t a question or a definition, SEA drops the needle on Google.",
    },
  ];

  const WIKI =
    /\b(wiki|wikipedia|what is|what's|whats|meaning of|define|definition of|who is|who's)\b/i;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const theatre = document.getElementById("theatre");
  const discsEl = document.getElementById("discs");
  const songList = document.getElementById("song-list");
  const indexList = document.getElementById("index-list");
  const nowTitle = document.getElementById("now-title");
  const cEngine = document.getElementById("c-engine");
  const cTrigger = document.getElementById("c-trigger");
  const cSample = document.getElementById("c-sample");
  const liner = document.getElementById("liner");
  const status = document.getElementById("status");
  const form = document.getElementById("form");
  const input = document.getElementById("q");
  const indexBtn = document.getElementById("index-btn");
  const indexPanel = document.getElementById("index");

  let i = 0;
  let dragging = false;
  let startX = 0;
  let dragX = 0;
  const discNodes = [];
  const songNodes = [];

  TRACKS.forEach((t, n) => {
    const d = document.createElement("figure");
    d.className = "disc";
    d.innerHTML = `<img src="${t.disc}" alt="${t.title} CD" width="1200" height="1200" draggable="false" decoding="async" ${n === 0 ? 'fetchpriority="high"' : 'loading="lazy"'}>`;
    discsEl.appendChild(d);
    discNodes.push(d);

    const li = document.createElement("li");
    li.className = "song";
    li.id = `song-${t.id}`;
    li.role = "option";
    li.tabIndex = n === 0 ? 0 : -1;
    li.dataset.i = String(n);
    li.setAttribute("aria-selected", n === 0 ? "true" : "false");
    li.innerHTML = `
      <span class="song-num">${String(n + 1).padStart(2, "0")}</span>
      <span class="song-slot" aria-hidden="true"><img src="${t.disc}" alt="" width="64" height="64"></span>
      <span class="song-body"><span class="song-title">${t.title}</span><span class="song-meta">${t.meta} → ${t.engine}</span></span>`;
    li.addEventListener("click", () => go(n, { catchCd: true }));
    li.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        go(n, { catchCd: true });
      }
    });
    songList.appendChild(li);
    songNodes.push(li);

    const ib = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = `${String(n + 1).padStart(2, "0")}  ${t.title}`;
    btn.addEventListener("click", () => {
      go(n, { catchCd: true });
      closeIndex();
    });
    ib.appendChild(btn);
    indexList.appendChild(ib);
  });

  function layout(off = 0) {
    const gap = Math.min(innerWidth * 0.42, 420);
    discNodes.forEach((el, n) => {
      const d = n - i + off;
      const x = d * gap;
      const rot = -14 + d * 9;
      const scale = Math.max(0.58, 1 - Math.abs(d) * 0.16);
      el.style.transform = `translate3d(${x}px, ${Math.abs(d) * 8}px, 0) rotate(${rot}deg) scale(${scale})`;
      el.style.zIndex = String(30 - Math.abs(d) * 2);
      el.style.opacity = String(Math.abs(d) > 2 ? 0 : 1 - Math.min(Math.abs(d) * 0.3, 0.55));
      el.classList.toggle("is-on", n === i && Math.abs(off) < 0.04);
    });
  }

  function sync(catchCd) {
    const t = TRACKS[i];
    nowTitle.textContent = t.title;
    cEngine.textContent = t.engine;
    cTrigger.textContent = t.trigger;
    cSample.textContent = t.sample;
    liner.textContent = t.liner;
    status.innerHTML = `Playing on <strong>${t.engine}</strong>`;
    songList.setAttribute("aria-activedescendant", `song-${t.id}`);
    songNodes.forEach((el, n) => {
      const on = n === i;
      el.classList.toggle("is-on", on);
      el.setAttribute("aria-selected", on ? "true" : "false");
      el.tabIndex = on ? 0 : -1;
      el.classList.remove("is-catch");
      if (on && catchCd && !reduce) {
        void el.offsetWidth;
        el.classList.add("is-catch");
        window.setTimeout(() => el.classList.remove("is-catch"), 700);
      }
    });
    [...indexList.querySelectorAll("button")].forEach((b, n) => b.classList.toggle("is-on", n === i));
  }

  function go(n, { catchCd = false } = {}) {
    i = ((n % TRACKS.length) + TRACKS.length) % TRACKS.length;
    layout(0);
    sync(catchCd);
  }

  function routeKey(q) {
    const s = (q || "").trim();
    if (!s) return 2;
    if (/\?\s*$/.test(s)) return 0;
    if (WIKI.test(s)) return 1;
    return 2;
  }

  function applyQuery(q, { scroll = false } = {}) {
    go(routeKey(q), { catchCd: true });
    if (scroll) theatre.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  theatre.addEventListener("pointerdown", (e) => {
    if (e.target.closest("a,button,input,.songs,.index")) return;
    dragging = true;
    startX = e.clientX;
    dragX = 0;
    theatre.classList.add("is-drag");
  });
  window.addEventListener(
    "pointermove",
    (e) => {
      if (!dragging) return;
      dragX = e.clientX - startX;
      layout(dragX / Math.min(innerWidth * 0.52, 480));
      if (e.cancelable) e.preventDefault();
    },
    { passive: false }
  );
  window.addEventListener("pointerup", () => {
    if (!dragging) return;
    dragging = false;
    theatre.classList.remove("is-drag");
    const delta = Math.round(-dragX / (Math.min(innerWidth * 0.52, 480) * 0.35));
    if (delta) go(i + delta, { catchCd: true });
    else layout(0);
  });

  theatre.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      go(i + 1, { catchCd: true });
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      go(i - 1, { catchCd: true });
    }
  });

  function closeIndex() {
    indexPanel.hidden = true;
    indexBtn.setAttribute("aria-expanded", "false");
  }
  indexBtn.addEventListener("click", () => {
    const open = indexPanel.hidden;
    indexPanel.hidden = !open;
    indexBtn.setAttribute("aria-expanded", open ? "true" : "false");
  });
  document.addEventListener("click", (e) => {
    if (!indexPanel.hidden && !e.target.closest("#index,#index-btn")) closeIndex();
  });

  let t = 0;
  input.addEventListener("input", () => {
    clearTimeout(t);
    t = setTimeout(() => applyQuery(input.value), 140);
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    applyQuery(input.value, { scroll: true });
    theatre.focus({ preventScroll: true });
  });
  document.querySelectorAll("[data-q]").forEach((b) => {
    b.addEventListener("click", () => {
      input.value = b.getAttribute("data-q") || "";
      applyQuery(input.value, { scroll: true });
    });
  });

  addEventListener("resize", () => layout(0));
  go(0, { catchCd: true });
})();
