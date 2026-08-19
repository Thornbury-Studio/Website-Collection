/* GYRE — shared chrome: nav drawer, reveal system (gated, with failsafe and
   rescan for injected markup), current-page marker. */
(function () {
  "use strict";

  var doc = document;

  /* ---------------- reveal system ----------------
     Gated on .js-anim so a stalled observer can never blank the page.
     rescanReveals() must be called by any injector that emits .reveal. */
  var io = null;
  var seenOnce = false;

  function revealAllNow() {
    doc.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("is-in"); });
  }

  function sweepViewport() {
    var vh = window.innerHeight || doc.documentElement.clientHeight;
    doc.querySelectorAll(".reveal:not(.is-in)").forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < vh * 0.96 && r.bottom > 0) el.classList.add("is-in");
    });
  }

  function rescanReveals() {
    if (!io) return;
    doc.querySelectorAll(".reveal:not(.is-in)").forEach(function (el) { io.observe(el); });
    sweepViewport();
  }

  if ("IntersectionObserver" in window) {
    doc.documentElement.classList.add("js-anim");
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          seenOnce = true;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });

    doc.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });

    /* failsafe: if IO never fires shortly after load, show everything */
    setTimeout(function () { if (!seenOnce) revealAllNow(); }, 1400);

    /* IO can fire once then miss anchor jumps / injected content — throttled sweep */
    var t = 0;
    function throttledSweep() {
      if (t) return;
      t = setTimeout(function () { t = 0; sweepViewport(); }, 180);
    }
    window.addEventListener("scroll", throttledSweep, { passive: true });
    window.addEventListener("resize", throttledSweep);
    window.addEventListener("hashchange", throttledSweep);
  }
  window.rescanReveals = rescanReveals;

  /* ---------------- nav ---------------- */
  var page = (location.pathname.split("/").pop() || "index.html");
  doc.querySelectorAll(".top nav a, .drawer a").forEach(function (a) {
    var href = a.getAttribute("href");
    if (href === page) a.setAttribute("aria-current", "page");
  });

  var burger = doc.querySelector(".burger");
  var drawer = doc.querySelector(".drawer");
  var scrim = doc.querySelector(".scrim");

  function setDrawer(open) {
    if (!drawer) return;
    drawer.classList.toggle("open", open);
    if (scrim) scrim.classList.toggle("show", open);
    if (burger) burger.setAttribute("aria-expanded", open ? "true" : "false");
  }
  if (burger && drawer) {
    burger.addEventListener("click", function () {
      setDrawer(!drawer.classList.contains("open"));
    });
    if (scrim) scrim.addEventListener("click", function () { setDrawer(false); });
    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setDrawer(false);
    });
    drawer.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setDrawer(false); });
    });
  }
})();
