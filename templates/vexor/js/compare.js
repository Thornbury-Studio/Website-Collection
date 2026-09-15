/* compare.html */
(function () {
  "use strict";
  function $(s) { return document.querySelector(s); }

  function rowsFor(models) {
    function cell(m, key, fmt) {
      var v = m[key];
      if (key === "tankOrRange") {
        v = m.tankL != null ? m.tankL + " L" : m.rangeKm + " km";
      } else if (key === "priceSGD") v = VEXOR.formatSGD(m.priceSGD);
      else if (key === "pw") v = VEXOR.powerToWeight(m);
      else if (fmt) v = fmt(v);
      return v;
    }

    var defs = [
      { label: "Price", key: "priceSGD", best: "min" },
      { label: "Power (kW)", key: "powerKw", best: "max" },
      { label: "Torque (N·m)", key: "torqueNm", best: "max" },
      { label: "Weight (kg)", key: "weightKg", best: "min" },
      { label: "Seat (mm)", key: "seatMm", best: null },
      { label: "Tank / Range", key: "tankOrRange", best: null },
      { label: "0–100 (s)", key: "zeroTo100", best: "min" },
      { label: "Top speed", key: "topSpeedKmh", best: "max" },
      { label: "P/W (kW/kg)", key: "pw", best: "max" }
    ];

    return defs.map(function (d) {
      var values = models.map(function (m) {
        if (d.key === "pw") return VEXOR.powerToWeight(m);
        if (d.key === "tankOrRange") return null;
        return m[d.key];
      });
      var bestVal = null;
      if (d.best === "max") bestVal = Math.max.apply(null, values.filter(function (v) { return v != null; }));
      if (d.best === "min") bestVal = Math.min.apply(null, values.filter(function (v) { return v != null; }));

      return {
        label: d.label,
        cells: models.map(function (m, i) {
          var display = cell(m, d.key);
          var raw = values[i];
          var isBest = d.best && raw != null && raw === bestVal;
          return { display: display, best: isBest };
        })
      };
    });
  }

  function render() {
    var ids = VexorUI.getCompare();
    var models = ids.map(VEXOR.byId).filter(Boolean);
    var empty = $("#compare-empty");
    var tableWrap = $("#compare-table-wrap");
    var actions = $("#compare-actions");

    if (!models.length) {
      empty.hidden = false;
      tableWrap.hidden = true;
      actions.hidden = true;
      return;
    }
    empty.hidden = true;
    tableWrap.hidden = false;
    actions.hidden = false;

    var head = "<tr><th>Spec</th>" + models.map(function (m) {
      return '<th><a href="model.html?id=' + m.id + '">' + m.name + '</a><div class="label">' + m.class + '</div><button type="button" class="btn btn-ghost" data-remove="' + m.id + '" style="margin-top:10px;padding:8px 12px">Remove</button></th>';
    }).join("") + "</tr>";

    var body = rowsFor(models).map(function (r) {
      return "<tr><th>" + r.label + "</th>" + r.cells.map(function (c) {
        return '<td class="' + (c.best ? "best" : "") + '">' + c.display + "</td>";
      }).join("") + "</tr>";
    }).join("");

    $("#compare-table").innerHTML = "<thead>" + head + "</thead><tbody>" + body + "</tbody>";
    tableWrap.querySelectorAll("[data-remove]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        VexorUI.toggleCompare(btn.getAttribute("data-remove"));
        render();
      });
    });

    $("#book-selected").href = "ride.html?model=" + models[0].id;
  }

  document.addEventListener("DOMContentLoaded", function () {
    $("#clear-compare").addEventListener("click", function () {
      VexorUI.setCompare([]);
      render();
    });
    document.addEventListener("vexor:compare", render);
    render();
  });
})();
