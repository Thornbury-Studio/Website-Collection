/* model.html — gallery crossfade, real colour plates, count-up specs */
(function () {
  "use strict";
  function $(s, r) { return (r || document).querySelector(s); }

  function idFromUrl() {
    return new URLSearchParams(location.search).get("id") || "line";
  }

  function reduceMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function crossfadeTo(main, src, alt) {
    if (!main || main.getAttribute("src") === src) return;
    if (reduceMotion()) {
      main.src = src;
      main.alt = alt || main.alt;
      return;
    }
    main.classList.add("is-fading");
    window.setTimeout(function () {
      main.src = src;
      main.alt = alt || main.alt;
      main.onload = function () {
        main.classList.remove("is-fading");
        main.onload = null;
      };
      if (main.complete) main.classList.remove("is-fading");
    }, 180);
  }

  function renderGallery(m, getColorImg) {
    var main = $("#gallery-main");
    var thumbs = $("#gallery-thumbs");
    var labelEl = $("#gallery-label");
    var idx = 0;
    var frames = (m.gallery || []).map(function (g) {
      if (typeof g === "string") return { src: g, label: "View" };
      return g;
    });
    if (!frames.length) frames = [{ src: m.heroImg, label: "Front ¾" }];

    function activeSrc(i) {
      /* index 0 follows selected paint; other angles stay fixed plates */
      if (i === 0 && getColorImg) return getColorImg() || frames[0].src;
      return frames[i].src;
    }

    function show(i) {
      idx = (i + frames.length) % frames.length;
      crossfadeTo(main, activeSrc(idx), m.alt + " — " + frames[idx].label);
      if (labelEl) labelEl.textContent = frames[idx].label;
      thumbs.querySelectorAll("button").forEach(function (b, n) {
        if (n === idx) b.setAttribute("aria-current", "true");
        else b.removeAttribute("aria-current");
      });
    }

    function rebuildThumbs() {
      thumbs.innerHTML = frames.map(function (f, i) {
        var src = i === 0 && getColorImg ? (getColorImg() || f.src) : f.src;
        return '<button type="button" aria-label="' + f.label + '"><img src="' + src + '" alt=""></button>';
      }).join("");
      thumbs.querySelectorAll("button").forEach(function (b, i) {
        b.addEventListener("click", function () { show(i); });
      });
    }

    rebuildThumbs();
    $("#gal-prev").addEventListener("click", function () { show(idx - 1); });
    $("#gal-next").addEventListener("click", function () { show(idx + 1); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") show(idx - 1);
      if (e.key === "ArrowRight") show(idx + 1);
    });

    /* touch swipe */
    var startX = 0;
    var stage = $(".gallery-main");
    if (stage) {
      stage.addEventListener("touchstart", function (e) {
        startX = e.changedTouches[0].screenX;
      }, { passive: true });
      stage.addEventListener("touchend", function (e) {
        var dx = e.changedTouches[0].screenX - startX;
        if (Math.abs(dx) < 40) return;
        if (dx < 0) show(idx + 1);
        else show(idx - 1);
      }, { passive: true });
    }

    show(0);

    return {
      refreshColor: function () {
        rebuildThumbs();
        show(idx);
      },
      showFront: function () { show(0); }
    };
  }

  function renderSwatches(m, onColor) {
    var wrap = $("#swatches");
    var nameEl = $("#color-name");
    var colorIdx = 0;
    wrap.innerHTML = m.colors.map(function (c, i) {
      return '<button type="button" class="swatch" style="background:' + c.hex + '" data-i="' + i + '" aria-label="' + c.name + '" aria-pressed="' + (i === 0) + '"></button>';
    }).join("");
    nameEl.textContent = m.colors[0].name;

    wrap.querySelectorAll(".swatch").forEach(function (btn) {
      btn.addEventListener("click", function () {
        colorIdx = parseInt(btn.getAttribute("data-i"), 10);
        wrap.querySelectorAll(".swatch").forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
        btn.setAttribute("aria-pressed", "true");
        nameEl.textContent = m.colors[colorIdx].name;
        nameEl.classList.remove("pop");
        void nameEl.offsetWidth;
        nameEl.classList.add("pop");
        if (onColor) onColor(m.colors[colorIdx], colorIdx);
      });
    });

    return {
      getImg: function () { return m.colors[colorIdx].img || m.heroImg; },
      getColor: function () { return m.colors[colorIdx]; }
    };
  }

  function countUp(el, target, opts) {
    opts = opts || {};
    var prefix = opts.prefix || "";
    var suffix = opts.suffix || "";
    var decimals = opts.decimals || 0;
    var duration = opts.duration || 900;
    if (reduceMotion()) {
      el.textContent = prefix + (decimals ? target.toFixed(decimals) : Math.round(target).toLocaleString("en-SG")) + suffix;
      return;
    }
    var start = performance.now();
    var from = 0;
    function frame(now) {
      var t = Math.min(1, (now - start) / duration);
      var eased = 1 - Math.pow(1 - t, 3);
      var val = from + (target - from) * eased;
      el.textContent = prefix + (decimals ? val.toFixed(decimals) : Math.round(val).toLocaleString("en-SG")) + suffix;
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function printSpec(m) {
    var lines = [
      "VEXOR " + m.name + " — Specification",
      "Class: " + m.class,
      "Layout: " + m.layout,
      "Price: " + VEXOR.formatSGD(m.priceSGD),
      "Power: " + m.powerKw + " kW",
      "Torque: " + m.torqueNm + " N·m",
      "Weight: " + m.weightKg + " kg",
      "Seat: " + m.seatMm + " mm",
      m.tankL != null ? ("Tank: " + m.tankL + " L") : ("Range: " + m.rangeKm + " km"),
      "0–100: " + m.zeroTo100 + " s",
      "Top speed: " + m.topSpeedKmh + " km/h",
      "Power-to-weight: " + VEXOR.powerToWeight(m) + " kW/kg"
    ];
    var blob = new Blob([lines.join("\n")], { type: "text/plain" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "vexor-" + m.id + "-spec.txt";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var m = VEXOR.byId(idFromUrl()) || VEXOR.MODELS[0];
    document.title = m.name + " — VEXOR";
    var sn = document.getElementById("subnav-model");
    if (sn) sn.textContent = m.name;
    var sr = document.getElementById("subnav-ride");
    if (sr) sr.href = "ride.html?model=" + m.id;
    $("#m-name").textContent = m.name;
    $("#m-class").textContent = m.class + " · " + m.year;
    $("#m-line").textContent = m.line;
    $("#m-story").textContent = m.story;
    $("#m-price").textContent = VEXOR.formatSGD(m.priceSGD);
    $("#m-layout").textContent = m.layout;
    $("#hl").innerHTML = m.highlights.map(function (h) { return "<li>" + h + "</li>"; }).join("");
    $("#ride-link").href = "ride.html?model=" + m.id;
    $("#fin-price").value = m.priceSGD;

    var fuelOrRange = m.tankL != null
      ? { label: "Tank", value: m.tankL, suffix: " L", decimals: 1 }
      : { label: "Range", value: m.rangeKm, suffix: " km", decimals: 0 };

    var specDefs = [
      { label: "Power", value: m.powerKw, suffix: " kW" },
      { label: "Torque", value: m.torqueNm, suffix: " N·m" },
      { label: "Weight", value: m.weightKg, suffix: " kg" },
      { label: "Seat", value: m.seatMm, suffix: " mm" },
      fuelOrRange,
      { label: "0–100", value: m.zeroTo100, suffix: " s", decimals: 1 },
      { label: "Top speed", value: m.topSpeedKmh, suffix: " km/h" },
      { label: "P/W", value: VEXOR.powerToWeight(m), suffix: " kW/kg", decimals: 3 },
      { label: "Price", value: m.priceSGD, prefix: "S$", decimals: 0 }
    ];

    $("#specs").innerHTML = specDefs.map(function (s, i) {
      return '<div class="spec-cell reveal" style="transition-delay:' + (i * 40) + 'ms"><div class="label">' + s.label + '</div><div class="num" data-count="' + s.value + '" data-prefix="' + (s.prefix || "") + '" data-suffix="' + (s.suffix || "") + '" data-decimals="' + (s.decimals || 0) + '">—</div></div>';
    }).join("");

    var galleryApi;
    var swatchApi = renderSwatches(m, function () {
      if (galleryApi) galleryApi.refreshColor();
    });
    galleryApi = renderGallery(m, function () { return swatchApi.getImg(); });

    VexorUI.bindFinance(document);

    var cmpBtn = $("#compare-btn");
    function syncCmp() {
      var on = VexorUI.getCompare().indexOf(m.id) >= 0;
      cmpBtn.textContent = on ? "In compare" : "Add to compare";
      cmpBtn.setAttribute("aria-pressed", on ? "true" : "false");
    }
    cmpBtn.addEventListener("click", function () {
      VexorUI.toggleCompare(m.id);
      syncCmp();
    });
    syncCmp();

    $("#spec-dl").addEventListener("click", function () { printSpec(m); });

    var related = VEXOR.MODELS.filter(function (x) { return x.class === m.class && x.id !== m.id; }).slice(0, 3);
    if (!related.length) related = VEXOR.MODELS.filter(function (x) { return x.id !== m.id; }).slice(0, 3);
    $("#related").innerHTML = related.map(function (r) {
      return '<a class="bike-card" href="model.html?id=' + r.id + '"><figure><img src="' + r.heroImg + '" alt="' + r.alt + '" loading="lazy"></figure><div class="body"><div class="name">' + r.name + '</div><div class="meta"><span>' + VEXOR.formatSGD(r.priceSGD) + '</span><span>' + r.powerKw + ' kW</span></div></div></a>';
    }).join("");

    /* count-up when specs enter view */
    var nums = document.querySelectorAll("#specs [data-count]");
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var el = en.target;
          countUp(el, parseFloat(el.getAttribute("data-count")), {
            prefix: el.getAttribute("data-prefix") || "",
            suffix: el.getAttribute("data-suffix") || "",
            decimals: parseInt(el.getAttribute("data-decimals"), 10) || 0
          });
          el.parentElement.classList.add("in");
          io.unobserve(el);
        });
      }, { threshold: 0.35 });
      nums.forEach(function (n) { io.observe(n); });
    } else {
      nums.forEach(function (el) {
        countUp(el, parseFloat(el.getAttribute("data-count")), {
          prefix: el.getAttribute("data-prefix") || "",
          suffix: el.getAttribute("data-suffix") || "",
          decimals: parseInt(el.getAttribute("data-decimals"), 10) || 0
        });
      });
    }
  });
})();
