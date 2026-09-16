(function () {
  "use strict";

  var menuBtn = document.getElementById("menuBtn");
  var menu = document.getElementById("menu");
  if (menuBtn && menu) {
    menuBtn.addEventListener("click", function () {
      var open = menuBtn.getAttribute("aria-expanded") === "true";
      menuBtn.setAttribute("aria-expanded", String(!open));
      menu.hidden = open;
      document.body.style.overflow = open ? "" : "hidden";
    });
    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        menu.hidden = true;
        menuBtn.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !menu.hidden) {
        menu.hidden = true;
        menuBtn.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
        menuBtn.focus();
      }
    });
  }

  var pixels = document.getElementById("pixels");
  if (pixels) {
    var ctx = pixels.getContext("2d");
    var cols = 42;
    var rows = 8;
    var lime = "#d7efa8";
    var ink = "#111111";
    var cream = "#f4f1ec";
    function paint() {
      var w = pixels.width = pixels.clientWidth * 2 || 720;
      var h = pixels.height = pixels.clientHeight * 2 || 128;
      var cw = w / cols;
      var ch = h / rows;
      for (var y = 0; y < rows; y++) {
        for (var x = 0; x < cols; x++) {
          var r = Math.random();
          ctx.fillStyle = r > 0.72 ? lime : r > 0.42 ? ink : cream;
          ctx.fillRect(x * cw, y * ch, cw + 0.5, ch + 0.5);
        }
      }
    }
    paint();
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
      var ticks = 0;
      var timer = setInterval(function () {
        paint();
        ticks += 1;
        if (ticks > 18) clearInterval(timer);
      }, 90);
    }
  }

  var traps = document.getElementById("trapsTrack");
  if (traps && traps.firstElementChild) {
    traps.appendChild(traps.firstElementChild.cloneNode(true));
  }

  document.querySelectorAll("video[data-src]").forEach(function (vid) {
    var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    function load() {
      if (vid.getAttribute("src")) return;
      vid.src = vid.getAttribute("data-src");
      vid.play().catch(function () {});
    }
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) load();
          else if (!vid.paused) vid.pause();
        });
      }, { rootMargin: "200px" });
      io.observe(vid);
    } else load();
  });

  var form = document.getElementById("sessionForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var note = document.getElementById("formOk");
      form.hidden = true;
      if (note) note.hidden = false;
    });
  }

  var audio = document.getElementById("hum");
  var audioBtn = document.getElementById("humToggle");
  if (audio && audioBtn) {
    audioBtn.addEventListener("click", function () {
      if (audio.paused) {
        audio.play().catch(function () {});
        audioBtn.textContent = "Sound on";
      } else {
        audio.pause();
        audioBtn.textContent = "Sound off";
      }
    });
  }
})();
