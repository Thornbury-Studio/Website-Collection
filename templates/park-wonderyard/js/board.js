/* WONDERYARD — the Board. Renders every attraction from the catalogue,
   filters by world and nerve, statuses from the park clock. */
(function () {
  "use strict";

  var doc = document;
  var WY = window.WY;
  if (!WY) return;

  var rowsEl = doc.getElementById("board-rows");
  var fw = "all";  /* world filter */
  var fi = "all";  /* intensity band */

  function bandOf(intensity) {
    if (intensity <= 2) return "calm";
    if (intensity === 3) return "lively";
    return "fierce";
  }

  function render() {
    if (!rowsEl) return;
    rowsEl.textContent = "";
    var frag = doc.createDocumentFragment();
    var shown = 0;

    WY.attractions.forEach(function (a) {
      if (fw !== "all" && a.world !== fw) return;
      if (fi !== "all" && bandOf(a.intensity) !== fi) return;
      shown++;

      var w = WY.worldById(a.world);
      var st = WY.statusFor(a);

      var row = doc.createElement("div");
      row.className = "brow reveal";
      row.style.setProperty("--wacc", w ? w.accent : "#888");
      row.style.setProperty("--wink", w ? w.accentInk : "#fff");

      var name = doc.createElement("div");
      name.className = "bname";
      name.textContent = a.name;
      var small = doc.createElement("small");
      small.textContent = a.copy.split(". ")[0] + ".";
      name.appendChild(small);

      var world = doc.createElement("span");
      world.className = "bworld";
      var sw = doc.createElement("i");
      world.appendChild(sw);
      world.appendChild(doc.createTextNode(w ? w.name : ""));

      var type = doc.createElement("span");
      type.className = "btype tt";
      type.textContent = WY.typeLabel[a.type] || a.type;

      var h = doc.createElement("span");
      h.className = "bh";
      h.textContent = a.minH ? (a.minH + " cm+") : "Any";

      var stat = doc.createElement("span");
      stat.className = "bstat ts s-" + st.state;
      stat.textContent = st.label;

      row.appendChild(name);
      row.appendChild(world);
      row.appendChild(type);
      row.appendChild(h);
      row.appendChild(stat);
      frag.appendChild(row);
    });

    if (!shown) {
      var empty = doc.createElement("p");
      empty.className = "empty";
      empty.textContent = "Nothing matches that mix today. Loosen a filter — the park will still be here.";
      frag.appendChild(empty);
    }
    rowsEl.appendChild(frag);
    if (window.rescanReveals) window.rescanReveals();
  }

  doc.querySelectorAll(".fbtn[data-fw]").forEach(function (b) {
    b.addEventListener("click", function () {
      fw = b.getAttribute("data-fw");
      doc.querySelectorAll(".fbtn[data-fw]").forEach(function (x) {
        x.setAttribute("aria-pressed", x === b ? "true" : "false");
      });
      render();
    });
  });
  doc.querySelectorAll(".fbtn[data-fi]").forEach(function (b) {
    b.addEventListener("click", function () {
      fi = b.getAttribute("data-fi");
      doc.querySelectorAll(".fbtn[data-fi]").forEach(function (x) {
        x.setAttribute("aria-pressed", x === b ? "true" : "false");
      });
      render();
    });
  });

  render();

  /* -------- height chart: computed from the catalogue -------- */
  var chart = doc.getElementById("hgt-chart");
  if (chart) {
    var withH = WY.attractions.filter(function (a) { return a.minH; })
      .sort(function (a, b) { return a.minH - b.minH; });
    var maxH = 150;

    /* an "everyone" bar first, for scale and warmth */
    var everyone = WY.attractions.length - withH.length;
    var frag2 = doc.createDocumentFragment();

    function bar(label, cm, who, none) {
      var b = doc.createElement("div");
      b.className = "bar";
      var cmEl = doc.createElement("span");
      cmEl.className = "cm";
      cmEl.textContent = cm ? (cm + " cm") : "0 cm";
      var col = doc.createElement("div");
      col.className = "col" + (none ? " none" : "");
      col.style.height = Math.max(18, Math.round((cm || 30) / maxH * 170)) + "px";
      var whoEl = doc.createElement("span");
      whoEl.className = "who";
      whoEl.textContent = who;
      b.appendChild(cmEl);
      b.appendChild(col);
      b.appendChild(whoEl);
      /* label under column, inside who — keep name visible */
      whoEl.textContent = label + " — " + who;
      return b;
    }

    frag2.appendChild(bar("Everything else", 0, everyone + " attractions, any height", true));
    withH.forEach(function (a) {
      frag2.appendChild(bar(a.name, a.minH, WY.worldById(a.world).name, false));
    });
    chart.appendChild(frag2);
  }
})();
