(function () {
  "use strict";

  var navToggle = document.getElementById("navToggle");
  var mobileMenu = document.getElementById("mobileMenu");
  if (navToggle && mobileMenu) {
    navToggle.addEventListener("click", function () {
      var open = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", String(!open));
      mobileMenu.hidden = open;
    });
    mobileMenu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        mobileMenu.hidden = true;
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* —— Chart —— */
  var POINTS = [42, 55, 48, 62, 58, 71, 66, 74, 69, 82, 78, 88, 84, 91, 86, 94];

  function buildPaths(values) {
    var w = 640;
    var h = 160;
    var padY = 12;
    var max = Math.max.apply(null, values);
    var min = Math.min.apply(null, values);
    var range = Math.max(1, max - min);
    var step = w / (values.length - 1);
    var coords = values.map(function (v, i) {
      var x = i * step;
      var y = padY + (1 - (v - min) / range) * (h - padY * 2);
      return [x, y];
    });
    var line = coords
      .map(function (p, i) {
        return (i === 0 ? "M" : "L") + p[0].toFixed(1) + " " + p[1].toFixed(1);
      })
      .join(" ");
    var area =
      line +
      " L" +
      w.toFixed(1) +
      " " +
      h +
      " L0 " +
      h +
      " Z";
    return { line: line, area: area };
  }

  function drawChart(animate) {
    var lineEl = document.getElementById("chartLine");
    var areaEl = document.getElementById("chartArea");
    if (!lineEl || !areaEl) return;
    var jittered = POINTS.map(function (v) {
      return v + (Math.random() * 6 - 3);
    });
    var paths = buildPaths(jittered);
    areaEl.setAttribute("d", paths.area);
    lineEl.classList.remove("is-drawn");
    lineEl.setAttribute("d", paths.line);
    if (animate !== false) {
      void lineEl.getBoundingClientRect();
      lineEl.classList.add("is-drawn");
    } else {
      lineEl.style.strokeDashoffset = "0";
    }
  }

  drawChart(true);

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") drawChart(true);
  });

  /* Soft KPI tick */
  var kpiLat = document.getElementById("kpiLat");
  if (kpiLat) {
    setInterval(function () {
      var n = 38 + Math.floor(Math.random() * 9);
      kpiLat.innerHTML = n + '<span class="unit">ms</span>';
    }, 4200);
  }

  /* Trust line + stage reveal */
  var lines = document.querySelectorAll(".reveal-line");
  var stages = document.querySelectorAll(".reveal-stage");

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    lines.forEach(function (el, i) {
      el.style.transitionDelay = i * 0.07 + "s";
      io.observe(el);
    });
    stages.forEach(function (el) {
      io.observe(el);
    });
  } else {
    lines.forEach(function (el) {
      el.classList.add("is-in");
    });
    stages.forEach(function (el) {
      el.classList.add("is-in");
    });
  }
})();
