(function () {
  "use strict";

  var rail = document.getElementById("rail");
  var track = document.getElementById("track");
  var progress = document.getElementById("progress");
  var panelLabel = document.getElementById("panelLabel");
  var dots = Array.prototype.slice.call(document.querySelectorAll(".dot"));
  var panels = Array.prototype.slice.call(document.querySelectorAll(".panel"));
  var particles = document.getElementById("particles");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var panelCount = panels.length;
  var current = 0;
  var ticking = false;

  function spawnParticles() {
    if (!particles || reduceMotion) return;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < 28; i++) {
      var s = document.createElement("span");
      s.style.left = Math.random() * 100 + "%";
      s.style.top = Math.random() * 100 + "%";
      s.style.setProperty("--dur", 3 + Math.random() * 5 + "s");
      s.style.animationDelay = Math.random() * -6 + "s";
      frag.appendChild(s);
    }
    particles.appendChild(frag);
  }

  function maxScroll() {
    return Math.max(0, rail.scrollWidth - rail.clientWidth);
  }

  function goTo(index) {
    index = Math.max(0, Math.min(panelCount - 1, index));
    var x = index * rail.clientWidth;
    rail.scrollTo({ left: x, behavior: reduceMotion ? "auto" : "smooth" });
  }

  function updateDepth() {
    var max = maxScroll();
    var ratio = max ? rail.scrollLeft / max : 0;
    var local = (rail.scrollLeft / rail.clientWidth) || 0;
    current = Math.round(local);
    current = Math.max(0, Math.min(panelCount - 1, current));

    if (progress) {
      progress.style.transform = "scaleX(" + (0.25 + ratio * 0.75) + ")";
    }
    if (panelLabel) {
      panelLabel.textContent = String(current + 1).padStart(2, "0") + " / 0" + panelCount;
    }

    dots.forEach(function (dot, i) {
      var on = i === current;
      dot.classList.toggle("is-active", on);
      if (on) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    });

    /* Parallax: word / human / glass move at different rates inside the active neighborhood */
    panels.forEach(function (panel, i) {
      var offset = (rail.scrollLeft - i * rail.clientWidth) / rail.clientWidth;
      var layers = panel.querySelectorAll(".layer");
      for (var j = 0; j < layers.length; j++) {
        var depth = parseFloat(layers[j].getAttribute("data-depth") || "0.3");
        var shift = offset * depth * -80;
        layers[j].style.transform = "translate3d(" + shift + "px, 0, 0)";
      }
    });

    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateDepth);
    }
  }

  /* Vertical wheel → horizontal travel */
  rail.addEventListener(
    "wheel",
    function (e) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        rail.scrollLeft += e.deltaY + e.deltaX;
      }
    },
    { passive: false }
  );

  rail.addEventListener("scroll", onScroll, { passive: true });

  window.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight" || e.key === "PageDown") {
      e.preventDefault();
      goTo(current + 1);
    } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
      e.preventDefault();
      goTo(current - 1);
    } else if (e.key === "Home") {
      e.preventDefault();
      goTo(0);
    } else if (e.key === "End") {
      e.preventDefault();
      goTo(panelCount - 1);
    }
  });

  dots.forEach(function (dot) {
    dot.addEventListener("click", function () {
      goTo(parseInt(dot.getAttribute("data-go"), 10));
    });
  });

  document.querySelectorAll("[data-go]").forEach(function (el) {
    if (el.classList.contains("dot")) return;
    el.addEventListener("click", function (e) {
      var idx = el.getAttribute("data-go");
      if (idx == null) return;
      e.preventDefault();
      goTo(parseInt(idx, 10));
    });
  });

  window.addEventListener("resize", function () {
    goTo(current);
    updateDepth();
  });

  spawnParticles();
  updateDepth();
  rail.focus({ preventScroll: true });
})();
