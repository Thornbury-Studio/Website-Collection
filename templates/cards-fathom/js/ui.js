/* FATHOM — shared chrome: reveal system (gated + failsafe + rescan), current
   page marks, sound toggle. */
(function () {
  "use strict";

  var doc = document;

  /* reveals */
  var io = null, seenOnce = false;
  function revealAll() { doc.querySelectorAll(".fade").forEach(function (el) { el.classList.add("is-in"); }); }
  function sweep() {
    var vh = window.innerHeight || doc.documentElement.clientHeight;
    doc.querySelectorAll(".fade:not(.is-in)").forEach(function (el) {
      var r = el.getBoundingClientRect();
      /* anything at or ABOVE the viewport reveals too — a fast scroll can jump
         clean past an element between IO frames, and it must not stay blank */
      if (r.top < vh * 0.96) el.classList.add("is-in");
    });
  }
  function rescan() {
    if (!io) return;
    doc.querySelectorAll(".fade:not(.is-in)").forEach(function (el) { io.observe(el); });
    sweep();
  }
  if ("IntersectionObserver" in window) {
    doc.documentElement.classList.add("js-anim");
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { seenOnce = true; e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -5% 0px", threshold: 0.05 });
    doc.querySelectorAll(".fade").forEach(function (el) { io.observe(el); });
    setTimeout(function () { if (!seenOnce) revealAll(); }, 1400);
    var t = 0;
    function throttled() { if (t) return; t = setTimeout(function () { t = 0; sweep(); }, 180); }
    window.addEventListener("scroll", throttled, { passive: true });
    window.addEventListener("resize", throttled);
    window.addEventListener("hashchange", throttled);
  }
  window.rescanFades = rescan;

  /* current page */
  var page = (location.pathname.split("/").pop() || "index.html");
  doc.querySelectorAll(".top nav a, .dock a").forEach(function (a) {
    if (a.getAttribute("href") === page) a.setAttribute("aria-current", "page");
  });

  /* sound toggle (state in the log) */
  var st = doc.getElementById("sound-toggle");
  function syncSound() {
    if (!st || !window.FATHOM_LOG) return;
    var on = window.FATHOM_LOG.sound();
    st.setAttribute("aria-pressed", on ? "true" : "false");
    st.querySelector("span").textContent = on ? "Sound on" : "Sound off";
  }
  if (st) {
    st.addEventListener("click", function () {
      var now = !window.FATHOM_LOG.sound();
      window.FATHOM_LOG.sound(now);
      syncSound();
      if (now && window.FATHOM_AUDIO) window.FATHOM_AUDIO.tick();
    });
    syncSound();
  }
})();
