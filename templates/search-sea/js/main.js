(() => {
  const ALBUMS = [
    {
      id: "ask",
      title: "Ask",
      engine: "ChatGPT",
      trigger: "Ends with ?",
      sample: "why is the sky blue?",
      disc: "img/cd-ask.webp",
      side: "a",
      liner: "A question wants an answer, not a list of links. End with ? and SEA puts ChatGPT on the spindle.",
      example: "why is the sky blue?",
      route: "ask",
    },
    {
      id: "define",
      title: "Define",
      engine: "Wikipedia",
      trigger: "wiki · what is · meaning",
      sample: "what is nginx",
      disc: "img/cd-define.webp",
      side: "a",
      liner: "When you ask what something is, you want the page — not a guess. Definition-shaped words go to Wikipedia.",
      example: "what is nginx",
      route: "define",
    },
    {
      id: "find",
      title: "Find",
      engine: "Google",
      trigger: "Everything else",
      sample: "best espresso machines 2026",
      disc: "img/cd-find.webp",
      side: "a",
      liner: "Browsing still matters. If it isn’t a question or a definition, SEA drops the needle on Google.",
      example: "best espresso machines 2026",
      route: "find",
    },
    {
      id: "compile",
      title: "Compile",
      engine: "Go → Nginx",
      trigger: "config.toml",
      sample: "go run cmd/sea/main.go",
      disc: "img/cd-compile.webp",
      side: "b",
      liner: "A small Go program turns your config into Nginx map rules. The playlist is compiled, not reinvented per request.",
      example: "go run cmd/sea/main.go",
      route: null,
    },
    {
      id: "endpoint",
      title: "Endpoint",
      engine: "One URL",
      trigger: "Browser search",
      sample: "https://sea.example/search",
      disc: "img/cd-endpoint.webp",
      side: "b",
      liner: "One door for every query. Point the browser’s search box here and stop opening three tabs by habit.",
      example: "set as default search",
      route: null,
    },
    {
      id: "map",
      title: "Map",
      engine: "Regex once",
      trigger: "map directive",
      sample: "pcre_jit on",
      disc: "img/cd-map.webp",
      side: "b",
      liner: "Rules run once per request inside Nginx. Enable pcre_jit if you want the adapter as fast as it is thin.",
      example: "pcre_jit on",
      route: null,
    },
  ];

  const ASIDE = ALBUMS.filter((a) => a.side === "a");
  const WIKI_RE =
    /\b(wiki|wikipedia|what is|what's|whats|meaning of|define|definition of|who is|who's)\b/i;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const gallery = document.getElementById("gallery");
  const track = document.getElementById("track");
  const titleEl = document.getElementById("film-title");
  const engineEl = document.getElementById("credit-engine");
  const triggerEl = document.getElementById("credit-trigger");
  const sampleEl = document.getElementById("credit-sample");
  const linerText = document.getElementById("liner-text");
  const linerEx = document.getElementById("liner-ex");
  const indexBtn = document.getElementById("index-btn");
  const indexPanel = document.getElementById("index-panel");
  const indexList = document.getElementById("index-list");
  const indexBsides = document.getElementById("index-bsides");
  const form = document.getElementById("search-form");
  const input = document.getElementById("q");
  const routeOut = document.getElementById("route-out");

  // Carousel shows A-side only; B-sides selectable from Index (swaps into view)
  let playlist = [...ASIDE];
  let index = 0;
  let dragX = 0;
  let startX = 0;
  let dragging = false;
  let nodes = [];

  function rebuildTrack() {
    track.innerHTML = "";
    nodes = playlist.map((album, i) => {
      const el = document.createElement("figure");
      el.className = "cd";
      el.dataset.id = album.id;
      el.innerHTML = `<img src="${album.disc}" alt="${album.title} music CD" width="1024" height="1024" draggable="false" decoding="async" ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'}>`;
      track.appendChild(el);
      return el;
    });
  }

  function fillIndex() {
    indexList.innerHTML = "";
    indexBsides.innerHTML = "";
    ALBUMS.forEach((album, globalI) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      const n = String(globalI + 1).padStart(2, "0");
      btn.textContent = `${n}  ${album.title}`;
      btn.dataset.id = album.id;
      btn.addEventListener("click", () => {
        selectById(album.id, { seat: true, scroll: true });
        closeIndex();
      });
      li.appendChild(btn);
      (album.side === "a" ? indexList : indexBsides).appendChild(li);
    });
  }

  function layout(offset = 0) {
    const gap = Math.min(window.innerWidth * 0.55, 520);
    nodes.forEach((el, i) => {
      const d = i - index + offset;
      const x = d * gap;
      const rot = -16 + d * 10;
      const scale = Math.max(0.55, 1 - Math.abs(d) * 0.18);
      const z = 20 - Math.abs(d) * 2;
      const opacity = Math.abs(d) > 2.2 ? 0 : 1 - Math.min(Math.abs(d) * 0.28, 0.65);
      el.style.transform = `translate3d(${x}px, ${Math.abs(d) * 10}px, 0) rotate(${rot}deg) scale(${scale})`;
      el.style.zIndex = String(z);
      el.style.opacity = String(opacity);
      el.classList.toggle("is-active", i === index && Math.abs(offset) < 0.05);
      el.setAttribute("aria-hidden", Math.abs(d) > 1.2 ? "true" : "false");
    });
  }

  function syncMeta() {
    const a = playlist[index];
    titleEl.textContent = a.title;
    engineEl.textContent = a.engine;
    triggerEl.textContent = a.trigger;
    sampleEl.textContent = a.sample;
    linerText.textContent = a.liner;
    linerEx.textContent = a.example;
    gallery.dataset.active = a.id;
    gallery.setAttribute("aria-label", `SEA route discs — now playing ${a.title}`);
    document.querySelectorAll(".index-panel button").forEach((b) => {
      b.classList.toggle("is-active", b.dataset.id === a.id);
    });
  }

  function pulseSeat() {
    if (reduce) return;
    gallery.classList.remove("is-seating");
    void gallery.offsetWidth;
    gallery.classList.add("is-seating");
    window.setTimeout(() => gallery.classList.remove("is-seating"), 750);
  }

  function go(i, { seat = false } = {}) {
    index = ((i % playlist.length) + playlist.length) % playlist.length;
    layout(0);
    syncMeta();
    if (seat) pulseSeat();
  }

  function ensureInPlaylist(album) {
    const i = playlist.findIndex((a) => a.id === album.id);
    if (i >= 0) return i;
    // B-side: temporarily append so it can be shown, keep A-sides first
    playlist = [...ASIDE];
    if (album.side === "b") playlist.push(album);
    rebuildTrack();
    return playlist.findIndex((a) => a.id === album.id);
  }

  function selectById(id, { seat = false, scroll = false } = {}) {
    const album = ALBUMS.find((a) => a.id === id);
    if (!album) return;
    const i = ensureInPlaylist(album);
    go(i, { seat });
    if (scroll) gallery.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  function routeKey(q) {
    const s = (q || "").trim();
    if (!s) return "find";
    if (/\?\s*$/.test(s)) return "ask";
    if (WIKI_RE.test(s)) return "define";
    return "find";
  }

  function goRoute(key, { scroll = false } = {}) {
    const names = { ask: "ChatGPT", define: "Wikipedia", find: "Google" };
    routeOut.innerHTML = `This query plays on <strong>${names[key]}</strong>`;
    selectById(key, { seat: true, scroll });
  }

  function onDown(e) {
    if (e.target.closest("a,button,input,textarea,label,.index-panel")) return;
    dragging = true;
    startX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    dragX = 0;
    gallery.classList.add("is-dragging");
  }
  function onMove(e) {
    if (!dragging) return;
    const x = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    dragX = x - startX;
    const gap = Math.min(window.innerWidth * 0.55, 520);
    layout(dragX / gap);
    if (e.cancelable) e.preventDefault();
  }
  function onUp() {
    if (!dragging) return;
    dragging = false;
    gallery.classList.remove("is-dragging");
    const gap = Math.min(window.innerWidth * 0.55, 520);
    const delta = Math.round(-dragX / (gap * 0.35));
    if (delta !== 0) go(index + delta, { seat: true });
    else layout(0);
    dragX = 0;
  }

  gallery.addEventListener("pointerdown", onDown);
  window.addEventListener("pointermove", onMove, { passive: false });
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);

  gallery.addEventListener(
    "wheel",
    (e) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 8) {
        e.preventDefault();
        go(index + (e.deltaX > 0 ? 1 : -1), { seat: true });
      } else if (Math.abs(e.deltaY) > 40 && e.shiftKey) {
        e.preventDefault();
        go(index + (e.deltaY > 0 ? 1 : -1), { seat: true });
      }
    },
    { passive: false }
  );

  gallery.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      go(index + 1, { seat: true });
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      go(index - 1, { seat: true });
    } else if (e.key === "Home") {
      e.preventDefault();
      go(0, { seat: true });
    } else if (e.key === "End") {
      e.preventDefault();
      go(playlist.length - 1, { seat: true });
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
    if (!indexPanel.hidden && !e.target.closest("#index-panel, #index-btn")) closeIndex();
  });

  let routeTimer = 0;
  input?.addEventListener("input", () => {
    window.clearTimeout(routeTimer);
    routeTimer = window.setTimeout(() => goRoute(routeKey(input.value), { scroll: false }), 120);
  });
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    goRoute(routeKey(input.value), { scroll: true });
    gallery.focus({ preventScroll: true });
  });
  document.querySelectorAll("[data-fill]").forEach((btn) => {
    btn.addEventListener("click", () => {
      input.value = btn.getAttribute("data-fill") || "";
      goRoute(routeKey(input.value), { scroll: true });
      gallery.focus({ preventScroll: true });
    });
  });

  window.addEventListener("resize", () => layout(0));

  fillIndex();
  rebuildTrack();
  go(0);
})();
