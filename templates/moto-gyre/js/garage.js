/* GYRE — garage: gear-selector machine switcher (hard-cut detents, keyboard
   and hash support), computed spec sheet, dyno curve SVG drawn from the
   declared torque points, synthesized motor signature, compare table. */
(function () {
  "use strict";

  var G = window.GYRE;
  if (!G) return;

  var stageFig = document.getElementById("stage-fig");
  var stageTitle = document.getElementById("stage-title");
  var stageCls = document.getElementById("stage-cls");
  var selector = document.getElementById("selector");
  var specGrid = document.getElementById("spec-grid");
  var dynoBox = document.getElementById("dyno-svg");
  var dynoCap = document.getElementById("dyno-cap");
  var storyEl = document.getElementById("stage-story");
  var lineEl = document.getElementById("stage-line");
  var pulseBtn = document.getElementById("pulse-btn");
  var pulseNote = document.getElementById("pulse-note");
  var meter = document.getElementById("pulse-meter");

  var current = null;
  var pulseTimer = 0;

  /* ---------------- selector ---------------- */
  var byHash = (location.hash || "").replace("#", "");
  var startId = G.byId(byHash) ? byHash : "apex";

  function buildSelector() {
    var html = "";
    G.machines.forEach(function (m, i) {
      html += '<button type="button" data-id="' + m.id + '" aria-pressed="false">' +
        '<b>' + (i + 1) + '</b>' + m.name + '</button>';
    });
    selector.innerHTML = html;
    selector.addEventListener("click", function (e) {
      var btn = e.target.closest("button[data-id]");
      if (btn && btn.getAttribute("data-id") !== current.id) {
        if (window.GYRE_AUDIO) window.GYRE_AUDIO.tick();
        select(btn.getAttribute("data-id"), true);
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      var tag = (document.activeElement && document.activeElement.tagName) || "";
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      var idx = G.machines.indexOf(current);
      var next = e.key === "ArrowRight" ? idx + 1 : idx - 1;
      if (next >= 0 && next < G.machines.length) {
        if (window.GYRE_AUDIO) window.GYRE_AUDIO.tick();
        select(G.machines[next].id, true);
      }
    });
  }

  /* ---------------- dyno ---------------- */
  function dynoSvg(m) {
    var W = 560, H = 300, pad = 44;
    var isEv = m.power.type === "ev";
    var xs = m.curve.map(function (p) { return p[0]; });
    var xMax = Math.max.apply(null, xs);
    var tMax = 0, pMax = 0;
    var pts = m.curve.map(function (p) {
      var kw = isEv ? null : (p[1] * p[0]) / 9549;
      if (p[1] > tMax) tMax = p[1];
      if (kw !== null && kw > pMax) pMax = kw;
      return { x: p[0], t: p[1], p: kw };
    });
    var yTMax = Math.ceil(tMax / 50) * 50 + 50;
    var yPMax = Math.ceil((pMax || 1) / 50) * 50 + 50;

    function X(v) { return pad + (v / xMax) * (W - pad * 2); }
    function YT(v) { return H - pad - (v / yTMax) * (H - pad * 2); }
    function YP(v) { return H - pad - (v / yPMax) * (H - pad * 2); }

    function path(key, Y) {
      return pts.map(function (pt, i) {
        return (i ? "L" : "M") + X(pt.x).toFixed(1) + " " + Y(pt[key]).toFixed(1);
      }).join(" ");
    }

    var grid = "";
    for (var i = 1; i <= 3; i++) {
      var gy = pad + ((H - pad * 2) / 4) * i;
      grid += '<line x1="' + pad + '" y1="' + gy + '" x2="' + (W - pad) + '" y2="' + gy + '" stroke="rgba(154,165,177,0.14)" stroke-width="1"/>';
    }

    var axisLabel = isEv ? "speed, km/h" : "engine speed, rpm";
    var svg =
      '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Torque' + (isEv ? "" : " and power") + ' curve for ' + m.name + '">' +
      grid +
      '<line x1="' + pad + '" y1="' + (H - pad) + '" x2="' + (W - pad) + '" y2="' + (H - pad) + '" stroke="rgba(154,165,177,0.4)" stroke-width="1"/>' +
      '<line x1="' + pad + '" y1="' + pad + '" x2="' + pad + '" y2="' + (H - pad) + '" stroke="rgba(154,165,177,0.4)" stroke-width="1"/>' +
      '<path d="' + path("t", YT) + '" fill="none" stroke="#d6f42b" stroke-width="2.5"/>' +
      (isEv ? "" : '<path d="' + path("p", YP) + '" fill="none" stroke="#9aa5b1" stroke-width="2" stroke-dasharray="5 4"/>') +
      '<text x="' + (W - pad) + '" y="' + (H - 12) + '" text-anchor="end" fill="#9aa5b1" font-family="Chakra Petch, monospace" font-size="10" letter-spacing="1">' + axisLabel + '</text>' +
      '<text x="' + pad + '" y="' + (pad - 12) + '" fill="#9aa5b1" font-family="Chakra Petch, monospace" font-size="10" letter-spacing="1">Nm</text>' +
      '</svg>';
    return svg;
  }

  /* ---------------- spec sheet ---------------- */
  function specs(m) {
    var d = G.derive(m);
    var cells = [
      { l: "Powertrain", v: m.power.layout, s: m.power.type === "ev" ? "" : "redline " + m.power.redline + " rpm" },
      { l: "Peak output", v: G.fmt(d.hp) + " hp", s: G.fmt(d.kw) + " kW" },
      { l: "Peak torque", v: G.fmt(d.nm) + " Nm", s: m.power.type === "ev" ? "from 0 rpm" : "" },
      { l: "Wet mass", v: m.massKg + " kg", s: G.fmt(d.ptw) + " hp per tonne" },
      { l: "0–100 km/h", v: G.fmt(d.sprint, 1) + " s", s: "computed estimate" },
      { l: "Top speed", v: G.fmt(d.top) + " km/h", s: "computed from drag area" }
    ];
    if (m.power.type === "ev") {
      cells.push({ l: "Battery", v: m.power.kWh + " kWh", s: m.power.whPerKm + " Wh/km" });
      cells.push({ l: "Range", v: G.fmt(d.range) + " km", s: "computed" });
    } else {
      cells.push({ l: "Tank", v: m.tankL + " L", s: "" });
      cells.push({ l: "Wheelbase", v: m.wheelbaseMm + " mm", s: "seat " + m.seatMm + " mm" });
    }
    return cells.map(function (c) {
      return '<div class="spec-cell"><span class="label">' + c.l + '</span><b>' + c.v + '</b>' +
        (c.s ? '<small>' + c.s + '</small>' : '') + '</div>';
    }).join("");
  }

  /* ---------------- pulse meter ---------------- */
  function meterSvg(active) {
    var bars = "";
    for (var i = 0; i < 26; i++) {
      var h = active ? 6 + Math.abs(Math.sin(i * 1.7)) * 22 : 4;
      bars += '<rect x="' + (i * 8) + '" y="' + (30 - h) + '" width="4" height="' + h + '" fill="' + (active ? "#d6f42b" : "rgba(154,165,177,0.4)") + '"/>';
    }
    return '<svg viewBox="0 0 208 32" aria-hidden="true">' + bars + '</svg>';
  }

  /* ---------------- select ---------------- */
  function select(id, pushHash) {
    var m = G.byId(id);
    if (!m) return;
    current = m;

    if (window.GYRE_AUDIO) window.GYRE_AUDIO.stop();
    clearTimeout(pulseTimer);
    if (meter) meter.innerHTML = meterSvg(false);
    if (pulseBtn) {
      pulseBtn.setAttribute("aria-pressed", "false");
      pulseBtn.textContent = "Play motor signature";
    }

    stageFig.innerHTML = '<img src="img/' + m.stage + '.webp" width="2200" height="1228" alt="' + m.alt + '"' +
      ' fetchpriority="high">';
    stageTitle.textContent = m.name;
    stageCls.textContent = m.cls;
    lineEl.textContent = m.line;
    storyEl.textContent = m.story;
    specGrid.innerHTML = specs(m);
    dynoBox.innerHTML = dynoSvg(m);
    dynoCap.textContent = m.power.type === "ev"
      ? "Belt torque against road speed, from declared motor data."
      : "Torque (solid) and derived power (dashed) against engine speed, from declared curve points.";
    if (pulseNote) {
      pulseNote.textContent = m.power.type === "ev"
        ? "Synthesized from this machine's motor order — an original electric signature, not a recording."
        : "Synthesized from this machine's cylinder count and redline — an original signature, not a recording.";
    }

    selector.querySelectorAll("button[data-id]").forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-id") === id ? "true" : "false");
    });

    if (pushHash && history.replaceState) history.replaceState(null, "", "#" + id);
  }

  /* ---------------- audio ---------------- */
  if (pulseBtn) {
    pulseBtn.addEventListener("click", function () {
      if (!window.GYRE_AUDIO) return;
      if (window.GYRE_AUDIO.active()) {
        window.GYRE_AUDIO.stop();
        clearTimeout(pulseTimer);
        pulseBtn.setAttribute("aria-pressed", "false");
        pulseBtn.textContent = "Play motor signature";
        if (meter) meter.innerHTML = meterSvg(false);
        return;
      }
      var dur = window.GYRE_AUDIO.play(current, 3.4);
      pulseBtn.setAttribute("aria-pressed", "true");
      pulseBtn.textContent = "Stop";
      if (meter) meter.innerHTML = meterSvg(true);
      pulseTimer = setTimeout(function () {
        pulseBtn.setAttribute("aria-pressed", "false");
        pulseBtn.textContent = "Play motor signature";
        if (meter) meter.innerHTML = meterSvg(false);
      }, dur * 1000 + 120);
    });
  }

  /* ---------------- compare ---------------- */
  var cmp = document.getElementById("compare-body");
  if (cmp) {
    var rows = "";
    G.machines.forEach(function (m) {
      var d = G.derive(m);
      rows += "<tr><th scope=\"row\">" + m.name + "</th>" +
        "<td>" + m.power.layout + "</td>" +
        "<td>" + G.fmt(d.hp) + " hp</td>" +
        "<td>" + G.fmt(d.nm) + " Nm</td>" +
        "<td>" + m.massKg + " kg</td>" +
        "<td>" + G.fmt(d.sprint, 1) + " s</td>" +
        "<td>" + G.fmt(d.top) + " km/h</td>" +
        "<td>" + (d.range ? G.fmt(d.range) + " km" : "—") + "</td></tr>";
    });
    cmp.innerHTML = rows;
  }

  if (stageFig && selector) {
    buildSelector();
    select(startId, false);
    window.addEventListener("hashchange", function () {
      var id = (location.hash || "").replace("#", "");
      if (G.byId(id) && id !== current.id) select(id, false);
    });
  }
})();
