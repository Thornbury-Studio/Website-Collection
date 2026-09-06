/* Studio column drift — Locomotive Scroll v5 math, native scroll.
   Ref: https://scroll.locomotive.ca/docs/documentation/attributes
   displacement = progress × viewport × speed × -1
   Speeds stay in their documented 0.1–0.5 subtle band, all positive
   (same direction). No Lenis. Off on touch, reduced-motion, and ≤640px. */

function mapRange(inMin, inMax, outMin, outMax, n) {
  return outMin + ((n - inMin) / (inMax - inMin) * (outMax - outMin) || 0);
}

function allow() {
  var html = document.documentElement;
  if (html.classList.contains("rm")) return false;
  if (html.classList.contains("touch")) return false;
  if (!window.matchMedia("(min-width: 641px)").matches) return false;
  return true;
}

export function bindDrift(root) {
  if (!root) return;
  var nodes = Array.prototype.slice.call(root.querySelectorAll("[data-scroll-speed]"));
  if (!nodes.length) return;

  var items = nodes.map(function (el) {
    return {
      el: el,
      speed: parseFloat(el.getAttribute("data-scroll-speed")),
      translate: 0,
      inFold: false,
      measured: false
    };
  }).filter(function (item) {
    return item.speed && !isNaN(item.speed);
  });

  var ticking = false;
  var active = true;

  function measure(item) {
    var vh = innerHeight;
    var bcr = item.el.getBoundingClientRect();
    var offsetStart = scrollY + bcr.top - item.translate;
    item.offsetStart = offsetStart;
    item.height = bcr.height;
    if (!item.measured) {
      item.inFold = offsetStart < vh;
      item.measured = true;
    }
  }

  function applyOne(item) {
    var vh = innerHeight;
    var start = item.offsetStart - vh;
    var end = item.offsetStart + item.height;
    var progress = mapRange(start, end, 0, 1, scrollY);
    if (progress < 0) progress = 0;
    if (progress > 1) progress = 1;

    var mapped = item.inFold
      ? Math.max(0, progress)
      : mapRange(0, 1, -1, 1, progress);
    var y = mapped * vh * item.speed * -1;
    item.translate = y;
    item.el.style.transform = "translate3d(0, " + y.toFixed(2) + "px, 0)";
  }

  function tick() {
    ticking = false;
    if (!active) return;
    items.forEach(measure);
    items.forEach(applyOne);
  }

  function requestTick() {
    if (ticking || !active) return;
    ticking = true;
    requestAnimationFrame(tick);
  }

  function clear() {
    items.forEach(function (item) {
      item.translate = 0;
      item.el.style.transform = "";
    });
  }

  function sync() {
    var next = allow();
    if (next === active && next) {
      items.forEach(function (item) { item.measured = false; });
      requestTick();
      return;
    }
    active = next;
    if (!active) {
      clear();
      return;
    }
    items.forEach(function (item) { item.measured = false; });
    requestTick();
  }

  var io = new IntersectionObserver(function () {
    requestTick();
  }, { rootMargin: "20% 0px" });
  items.forEach(function (item) { io.observe(item.el); });

  window.addEventListener("scroll", requestTick, { passive: true });
  window.addEventListener("resize", sync);
  sync();
}
