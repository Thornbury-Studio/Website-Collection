/* models.html — catalogue filters */
(function () {
  "use strict";
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  function params() {
    return new URLSearchParams(location.search);
  }

  function writeParams(state) {
    var p = new URLSearchParams();
    if (state.q) p.set("q", state.q);
    if (state.cls && state.cls !== "all") p.set("class", state.cls);
    if (state.sort && state.sort !== "name") p.set("sort", state.sort);
    if (state.avail === "in") p.set("avail", "in");
    if (state.priceMax) p.set("priceMax", state.priceMax);
    if (state.powerMin) p.set("powerMin", state.powerMin);
    var qs = p.toString();
    history.replaceState(null, "", qs ? "?" + qs : location.pathname);
  }

  function readState() {
    var p = params();
    return {
      q: p.get("q") || "",
      cls: p.get("class") || "all",
      sort: p.get("sort") || "name",
      avail: p.get("avail") || "all",
      priceMax: p.get("priceMax") || "",
      powerMin: p.get("powerMin") || ""
    };
  }

  function filterModels(state) {
    var list = VEXOR.MODELS.slice();
    var q = state.q.trim().toLowerCase();
    if (q) list = list.filter(function (m) {
      return (m.name + " " + m.class + " " + m.line).toLowerCase().indexOf(q) >= 0;
    });
    if (state.cls !== "all") list = list.filter(function (m) { return m.class === state.cls; });
    if (state.avail === "in") list = list.filter(function (m) { return m.available; });
    if (state.priceMax) {
      var max = parseInt(state.priceMax, 10);
      list = list.filter(function (m) { return m.priceSGD <= max; });
    }
    if (state.powerMin) {
      var min = parseInt(state.powerMin, 10);
      list = list.filter(function (m) { return m.powerKw >= min; });
    }
    list.sort(function (a, b) {
      if (state.sort === "price") return a.priceSGD - b.priceSGD;
      if (state.sort === "power") return b.powerKw - a.powerKw;
      if (state.sort === "weight") return a.weightKg - b.weightKg;
      return a.name.localeCompare(b.name);
    });
    return list;
  }

  function card(m) {
    return (
      '<a class="bike-card" href="model.html?id=' + m.id + '">' +
        '<figure><img src="' + m.heroImg + '" alt="' + m.alt + '" width="800" height="500" loading="lazy"></figure>' +
        '<div class="body">' +
          '<div class="label">' + m.class + (m.available ? "" : " · Waitlist") + "</div>" +
          '<div class="name">' + m.name + "</div>" +
          '<p class="muted">' + m.line + "</p>" +
          '<div class="meta"><span>' + VEXOR.formatSGD(m.priceSGD) + '</span><span>' + m.powerKw + " kW</span></div>" +
        "</div>" +
      "</a>"
    );
  }

  function render() {
    var state = {
      q: $("#f-q").value,
      cls: $("#f-class").value,
      sort: $("#f-sort").value,
      avail: $("#f-avail").value,
      priceMax: $("#f-price").value,
      powerMin: $("#f-power").value
    };
    writeParams(state);
    var grid = $("#catalogue");
    grid.classList.add("is-filtering");
    setTimeout(function () {
      var list = filterModels(state);
      if (!list.length) {
        grid.innerHTML = '<div class="empty-state">No machines match these filters. Clear one constraint and try again.</div>';
      } else {
        grid.innerHTML = list.map(card).join("");
      }
      grid.classList.remove("is-filtering");
      $("#result-count").textContent = list.length + " machine" + (list.length === 1 ? "" : "s");
    }, 120);
  }

  document.addEventListener("DOMContentLoaded", function () {
    var state = readState();
    var classSel = $("#f-class");
    VEXOR.classes().forEach(function (c) {
      var opt = document.createElement("option");
      opt.value = c; opt.textContent = c;
      classSel.appendChild(opt);
    });
    $("#f-q").value = state.q;
    $("#f-class").value = state.cls;
    $("#f-sort").value = state.sort;
    $("#f-avail").value = state.avail;
    $("#f-price").value = state.priceMax;
    $("#f-power").value = state.powerMin;
    ["f-q", "f-class", "f-sort", "f-avail", "f-price", "f-power"].forEach(function (id) {
      $("#" + id).addEventListener("input", render);
      $("#" + id).addEventListener("change", render);
    });
    $("#f-clear").addEventListener("click", function () {
      $("#f-q").value = "";
      $("#f-class").value = "all";
      $("#f-sort").value = "name";
      $("#f-avail").value = "all";
      $("#f-price").value = "";
      $("#f-power").value = "";
      render();
    });
    render();
  });
})();
