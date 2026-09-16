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
    var lime = "#d7efa8";
    var ink = "#111111";
    var cream = "#f4f1ec";
    var grid = [];
    var cols = 0;
    var rows = 0;

    function cellColor() {
      var r = Math.random();
      if (r > 0.82) return lime;
      if (r > 0.48) return ink;
      return cream;
    }

    function sizeGrid() {
      var cssW = Math.max(1, pixels.clientWidth);
      var cssH = Math.max(1, pixels.clientHeight);
      var cell = cssW < 700 ? 14 : 18;
      cols = Math.max(20, Math.round(cssW / cell));
      rows = Math.max(14, Math.round(cssH / cell));
      pixels.width = cols;
      pixels.height = rows;
      grid = [];
      for (var i = 0; i < cols * rows; i++) grid[i] = cellColor();
    }

    function paint() {
      var i = 0;
      for (var y = 0; y < rows; y++) {
        for (var x = 0; x < cols; x++) {
          ctx.fillStyle = grid[i++];
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }

    function dissolve() {
      var flips = Math.max(12, (cols * rows * 0.045) | 0);
      for (var n = 0; n < flips; n++) {
        var i = (Math.random() * grid.length) | 0;
        grid[i] = cellColor();
      }
      paint();
    }

    sizeGrid();
    paint();
    requestAnimationFrame(function () {
      sizeGrid();
      paint();
    });
    window.addEventListener("resize", function () {
      sizeGrid();
      paint();
    });
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setInterval(dissolve, 140);
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
    vid.addEventListener("playing", function () {
      var cover = vid.parentElement && vid.parentElement.querySelector("img[hidden], img[data-cover]");
      if (cover) {
        cover.hidden = true;
        cover.setAttribute("hidden", "");
      }
    });
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

  var back = document.querySelector(".back-link");
  if (back) {
    var bands = document.querySelectorAll(".media-band, .dissolve-hero, .cta-band");
    function tuckBack() {
      var vh = window.innerHeight;
      var hide = false;
      for (var i = 0; i < bands.length; i++) {
        var r = bands[i].getBoundingClientRect();
        if (r.bottom > vh - 110 && r.top < vh) {
          hide = true;
          break;
        }
      }
      back.classList.toggle("is-tucked", hide);
    }
    tuckBack();
    window.addEventListener("scroll", tuckBack, { passive: true });
    window.addEventListener("resize", tuckBack);
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
