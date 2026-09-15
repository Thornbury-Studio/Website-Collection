/* model.html — gallery, compare, finance, related */
(function () {
  "use strict";
  function $(s, r) { return (r || document).querySelector(s); }

  function idFromUrl() {
    return new URLSearchParams(location.search).get("id") || "line";
  }

  function renderGallery(m) {
    var main = $("#gallery-main");
    var thumbs = $("#gallery-thumbs");
    var idx = 0;
    var imgs = m.gallery && m.gallery.length ? m.gallery : [m.heroImg];

    function show(i) {
      idx = (i + imgs.length) % imgs.length;
      main.src = imgs[idx];
      main.alt = m.alt;
      thumbs.querySelectorAll("button").forEach(function (b, n) {
        b.setAttribute("aria-current", n === idx ? "true" : "false");
      });
    }

    thumbs.innerHTML = imgs.map(function (src, i) {
      return '<button type="button" aria-label="Image ' + (i + 1) + '"><img src="' + src + '" alt=""></button>';
    }).join("");
    thumbs.querySelectorAll("button").forEach(function (b, i) {
      b.addEventListener("click", function () { show(i); });
    });
    $("#gal-prev").addEventListener("click", function () { show(idx - 1); });
    $("#gal-next").addEventListener("click", function () { show(idx + 1); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") show(idx - 1);
      if (e.key === "ArrowRight") show(idx + 1);
    });
    show(0);
  }

  function renderSwatches(m) {
    var wrap = $("#swatches");
    var nameEl = $("#color-name");
    wrap.innerHTML = m.colors.map(function (c, i) {
      return '<button type="button" class="swatch" style="background:' + c.hex + '" data-i="' + i + '" aria-label="' + c.name + '" aria-pressed="' + (i === 0) + '"></button>';
    }).join("");
    nameEl.textContent = m.colors[0].name;
    wrap.querySelectorAll(".swatch").forEach(function (btn) {
      btn.addEventListener("click", function () {
        wrap.querySelectorAll(".swatch").forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
        btn.setAttribute("aria-pressed", "true");
        nameEl.textContent = m.colors[parseInt(btn.getAttribute("data-i"), 10)].name;
      });
    });
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
      ? { label: "Tank", value: m.tankL + " L" }
      : { label: "Range", value: m.rangeKm + " km" };

    $("#specs").innerHTML = [
      { label: "Power", value: m.powerKw + " kW" },
      { label: "Torque", value: m.torqueNm + " N·m" },
      { label: "Weight", value: m.weightKg + " kg" },
      { label: "Seat", value: m.seatMm + " mm" },
      fuelOrRange,
      { label: "0–100", value: m.zeroTo100 + " s" },
      { label: "Top speed", value: m.topSpeedKmh + " km/h" },
      { label: "P/W", value: VEXOR.powerToWeight(m) + " kW/kg" },
      { label: "Price", value: VEXOR.formatSGD(m.priceSGD) }
    ].map(function (s) {
      return '<div class="spec-cell"><div class="label">' + s.label + '</div><div class="num">' + s.value + "</div></div>";
    }).join("");

    renderGallery(m);
    renderSwatches(m);
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
  });
})();
