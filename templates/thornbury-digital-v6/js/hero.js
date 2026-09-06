/* THORNBURY DIGITAL v6 — the film, the ground, and the one scroll treatment.

   The hero is a still first and a film second: the <picture> paints, the film
   is attached once the page is idle and crossed in only when it is actually
   playing. Nothing that can go wrong takes the hero with it.

   One global treatment on scroll, no more: the pinned film settles back and
   dims as the page arrives over it, every plate on the site drifts a few
   percent as it passes, and a grain sits over the whole page. Reduced motion
   keeps the still and the grain and drops the rest. */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var doc = document.documentElement;

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  // ---------- attach the film after first paint ----------
  function attachFilm(root) {
    var stage = $(".hero-film", root);
    if (!stage || reduce) return;
    var v = $("video", stage);
    if (!v) return;
    var srcs = $$("source[data-src]", v);
    if (!srcs.length) return;
    function go() {
      srcs.forEach(function (s) { s.src = s.getAttribute("data-src"); s.removeAttribute("data-src"); });
      v.load();
      var p = v.play();
      if (p && p.catch) p.catch(function () {});
      v.addEventListener("playing", function () { stage.classList.add("is-playing"); }, { once: true });
    }
    if ("requestIdleCallback" in window) requestIdleCallback(go, { timeout: 2500 }); else setTimeout(go, 800);
  }

  // ---------- the pinned hero ----------
  var stick = null, film = null, copy = null, word = null, vh = 0;
  function bindHero(root) {
    stick = $(".hero-stick", root);
    film = stick && $(".hero-film", stick);
    copy = stick && $(".hero-top", stick);
    word = stick && $(".hero-word", stick);
    vh = window.innerHeight;
  }
  function hero() {
    if (!stick || !film || reduce) return;
    var r = stick.getBoundingClientRect();
    var range = Math.max(1, r.height - vh);
    var p = clamp(-r.top / range, 0, 1);          // 0 at the top, 1 when the hero has fully handed over
    var e = p * p * (3 - 2 * p);
    film.style.setProperty("--p", e.toFixed(4));
    if (copy) copy.style.setProperty("--p", clamp(p * 1.6, 0, 1).toFixed(4));
    if (word) word.style.setProperty("--p", clamp(p * 1.25, 0, 1).toFixed(4));
    stick.classList.toggle("is-spent", p >= 0.999);
  }

  // ---------- plates drift as they pass ----------
  var plates = [];
  function bindPlates(root) {
    plates = $$(".plate-media img", root).map(function (img) { return { img: img, box: img.parentElement }; });
  }
  function drift() {
    if (reduce) return;
    for (var i = 0; i < plates.length; i++) {
      var b = plates[i].box.getBoundingClientRect();
      if (b.bottom < -80 || b.top > vh + 80) continue;
      var c = (b.top + b.height / 2 - vh / 2) / vh;   // -1 above centre .. 1 below
      plates[i].img.style.transform = "translate3d(0," + (c * -5).toFixed(2) + "%,0) scale(1.1)";
    }
  }

  // ---------- one rAF for everything ----------
  var raf = 0;
  function frame() { raf = 0; hero(); drift(); }
  function schedule() { if (!raf) raf = requestAnimationFrame(frame); }
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", function () { vh = window.innerHeight; schedule(); });

  function init(root) {
    root = root || document;
    bindHero(root);
    bindPlates(root);
    attachFilm(root);
    frame();
  }
  document.addEventListener("tb:page", function (e) { init(e.detail && e.detail.root); });
  init(document);
  window.TBHero = { init: init };
})();
