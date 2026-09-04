/* Thornbury work rail.
   Home shows the five live sites. Work shows all fourteen.
   Drag the rail; clicks still open the live collection sites. */

export var WORK = [
  {
    name: "Midwater",
    line: "A film about the ocean between the light and the floor.",
    group: "lead",
    src: "img/case-midwater.webp",
    href: "../film-midwater/",
    op: "50% 36%"
  },
  {
    name: "Kiyo",
    line: "Dinner, settled in three taps.",
    group: "set",
    src: "img/case-kiyo.webp",
    href: "../japanese-restaurant/",
    light: true,
    op: "50% 8%"
  },
  {
    name: "Aurel",
    line: "One hundred years, one second at a time.",
    group: "set",
    src: "img/case-aurel.webp",
    href: "../watch-atelier/",
    op: "50% 42%"
  },
  {
    name: "Loam",
    line: "Good coffee, no theatre.",
    group: "set",
    src: "img/case-loam.webp",
    href: "../cafe-loam/",
    light: true,
    op: "50% 18%"
  },
  {
    name: "Form/01",
    line: "Clothing for what’s next.",
    group: "wide",
    src: "img/case-form01.webp",
    href: "../streetwear-form01/",
    light: true,
    op: "50% 12%"
  },
  { group: "cluster" },
  { group: "cluster" },
  { group: "cluster" },
  { group: "cluster" },
  { group: "tail" },
  { group: "tail" },
  { group: "tail" },
  { group: "tail" },
  { group: "tail" }
];

function plate(item) {
  var el = document.createElement("div");
  el.className = "piece-plate gate";
  if (item.src) {
    el.classList.add("has-media");
    if (item.light) el.classList.add("light");
    var img = document.createElement("img");
    img.className = "plate-media";
    img.src = item.src;
    img.alt = "";
    img.width = 1400;
    img.height = 884;
    img.loading = "lazy";
    img.decoding = "async";
    if (item.op) img.style.setProperty("--op", item.op);
    el.appendChild(img);
    if (item.light) {
      var scrim = document.createElement("i");
      scrim.className = "scrim";
      scrim.setAttribute("aria-hidden", "true");
      el.appendChild(scrim);
    }
  }
  el.setAttribute("aria-hidden", "true");
  return el;
}

function copy(item, idx) {
  var wrap = document.createElement("div");
  wrap.className = "piece-copy";
  if (idx) {
    var n = document.createElement("p");
    n.className = "idx";
    n.textContent = idx;
    wrap.appendChild(n);
  }
  var h = document.createElement("h2");
  h.textContent = item.name;
  wrap.appendChild(h);
  return wrap;
}

function listed(item, idx) {
  var a = document.createElement("a");
  a.className = "piece";
  a.href = item.href || "work.html";
  a.appendChild(plate(item));
  a.appendChild(copy(item, idx));
  return a;
}

function silent() {
  var el = document.createElement("article");
  el.className = "piece";
  el.setAttribute("data-wait", "");
  el.appendChild(plate({}));
  return el;
}

export function mountPieces(root, opts) {
  if (!root) return;
  var home = !!(opts && opts.home);
  var frag = document.createDocumentFragment();
  var n = 0;
  var listedItems = WORK.filter(function (item) { return item.name; });
  listedItems.forEach(function (item) {
    n += 1;
    frag.appendChild(listed(item, String(n).padStart(2, "0")));
  });
  var waiting = home
    ? WORK.filter(function (item) { return item.group === "cluster"; })
    : WORK.filter(function (item) { return !item.name; });
  waiting.forEach(function () { frag.appendChild(silent()); });
  root.replaceChildren(frag);
}

export function bindRail(root, hooks) {
  if (!root) return;
  hooks = hooks || {};
  var down = false;
  var pid = 0;
  var origin = 0;
  var originScroll = 0;
  var moved = 0;
  var pending = 0;
  var raf = 0;

  function step() {
    var card = root.querySelector(".piece");
    return card ? Math.round(card.getBoundingClientRect().width + 18) : 220;
  }

  function apply() {
    raf = 0;
    if (!down) return;
    root.scrollLeft = originScroll - pending;
  }

  root.addEventListener("pointerdown", function (e) {
    if (e.pointerType === "touch") return;
    if (e.button !== 0) return;
    down = true;
    pid = e.pointerId;
    origin = e.clientX;
    originScroll = root.scrollLeft;
    moved = 0;
    pending = 0;
    root.classList.add("is-drag");
    try { root.setPointerCapture(pid); } catch (err) {}
    if (hooks.onHold) hooks.onHold();
  });

  function onMove(e) {
    if (!down || e.pointerId !== pid) return;
    var dx = e.clientX - origin;
    moved = Math.max(moved, Math.abs(dx));
    pending = dx;
    if (!raf) raf = requestAnimationFrame(apply);
  }

  function release(e) {
    if (!down || (e && e.pointerId !== pid)) return;
    down = false;
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
    root.scrollLeft = originScroll - pending;
    root.classList.remove("is-drag");
    if (moved > 16) root.dataset.skipClick = "1";
    if (hooks.onRelease) hooks.onRelease();
  }

  root.addEventListener("pointermove", onMove);
  root.addEventListener("pointerup", release);
  window.addEventListener("pointerup", release);
  root.addEventListener("pointercancel", release);

  root.addEventListener("click", function (e) {
    if (root.dataset.skipClick === "1") {
      e.preventDefault();
      e.stopPropagation();
      delete root.dataset.skipClick;
    }
  }, true);

  root.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      root.scrollBy({ left: e.key === "ArrowRight" ? step() : -step(), behavior: "smooth" });
    }
  });

  root.addEventListener("wheel", function (e) {
    if (root.scrollWidth <= root.clientWidth + 1) return;
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    e.preventDefault();
    root.scrollLeft += e.deltaY;
  }, { passive: false });
}
