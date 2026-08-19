/* GYRE — teardown: hotspot callouts over the APEX plate. Buttons toggle the
   matching callout card; only one active at a time. */
(function () {
  "use strict";

  var fig = document.getElementById("plate");
  if (!fig) return;

  var spots = fig.querySelectorAll(".hotspot");
  var callouts = document.querySelectorAll(".callout");

  /* position markers from data-x/data-y percentages (keeps markup style-free) */
  spots.forEach(function (s) {
    s.style.left = s.getAttribute("data-x") + "%";
    s.style.top = s.getAttribute("data-y") + "%";
  });

  function activate(id) {
    spots.forEach(function (s) {
      s.setAttribute("aria-expanded", s.getAttribute("aria-controls") === id ? "true" : "false");
    });
    callouts.forEach(function (c) {
      c.classList.toggle("active", c.id === id);
    });
    var target = document.getElementById(id);
    if (target && window.matchMedia("(max-width: 900px)").matches) {
      target.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  spots.forEach(function (s) {
    s.addEventListener("click", function () {
      var id = s.getAttribute("aria-controls");
      var already = s.getAttribute("aria-expanded") === "true";
      if (already) {
        s.setAttribute("aria-expanded", "false");
        callouts.forEach(function (c) { c.classList.remove("active"); });
      } else {
        if (window.GYRE_AUDIO) window.GYRE_AUDIO.tick();
        activate(id);
      }
    });
  });
})();
