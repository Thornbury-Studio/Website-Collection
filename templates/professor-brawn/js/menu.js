/* Common Ground Café — menu page renderer. Builds the menu from
   PB_DATA with an outlet toggle and honest filters. */
(function () {
  "use strict";

  var D = window.PB_DATA, fmt = window.PB_FMT;
  var rootEl = document.getElementById("menu-root");
  var deptNav = document.getElementById("dept-nav");
  if (!D || !rootEl) return;

  var state = {
    outlet: (function () {
      try { var v = localStorage.getItem("pb-outlet"); return v === "tp" ? "tp" : "amk"; }
      catch (e) { return "amk"; }
    })(),
    veg: false,
    picks: false
  };

  /* Items whose iced price is not published on the Tampines menu. */
  var NO_TP_ICED = { "Cappuccino": true, "Flat White": true };

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function tagChip(t) {
    var labels = { veg: "Vegetarian", "new": "New", chef: "Chef's pick", spicy: "Spicy" };
    return el("span", "tag " + t, labels[t] || t);
  }

  function itemVisible(it) {
    if (it[state.outlet] == null) return false;
    var tags = it.tags || [];
    if (state.veg && tags.indexOf("veg") === -1) return false;
    if (state.picks && tags.indexOf("chef") === -1 && tags.indexOf("new") === -1) return false;
    return true;
  }

  function otherOutlet() { return state.outlet === "amk" ? "tp" : "amk"; }

  function renderItem(it, section) {
    var li = el("li", "mi" + (section.variant ? " variant" : ""));
    var nm = el("span", "nm");
    nm.appendChild(document.createTextNode(it.n));
    (it.tags || []).forEach(function (t) { nm.appendChild(tagChip(t)); });
    if (it[otherOutlet()] == null) {
      nm.appendChild(el("span", "tag only", "Only at " + D.outlets[state.outlet].name));
    }
    if (section.variant && it.nutri) {
      var ng = el("span", "nutri n" + it.nutri);
      ng.appendChild(el("b", null, it.nutri));
      ng.appendChild(el("span", null, it.sugar + " sugar"));
      ng.setAttribute("title", "Nutri-Grade " + it.nutri + ", " + it.sugar + " sugar");
      nm.appendChild(ng);
    }
    li.appendChild(nm);

    if (section.variant) {
      var p1 = el("span", "pr p1", it.v1 != null ? fmt(it.v1) : "—");
      var p2v = state.outlet === "tp" && NO_TP_ICED[it.n] ? "—" : (it.v2 != null ? fmt(it.v2) : "—");
      var p2 = el("span", "pr p2", p2v);
      li.appendChild(p1);
      li.appendChild(p2);
    } else {
      var price = it[state.outlet];
      var second = state.outlet === "amk" ? it.amk2 : it.tp2;
      var pr = el("span", "pr", second != null ? fmt(price) + " / " + fmt(second) : fmt(price));
      li.appendChild(pr);
    }

    if (it.d) li.appendChild(el("span", "ds", it.d));
    return li;
  }

  function renderSets() {
    var wrapEl = el("div");
    if (state.outlet === "amk") {
      D.sets.amk.forEach(function (s) {
        var p = el("div", "set-panel");
        p.appendChild(el("h3", null, s.name));
        var line = el("p");
        line.innerHTML = "Top up <b>" + fmt(s.price) + "</b> to " + s.base + " for " + s.includes + ".";
        p.appendChild(line);
        wrapEl.appendChild(p);
      });
    } else {
      D.sets.tp.forEach(function (s) {
        var p = el("div", "set-panel");
        p.appendChild(el("h3", null, s.name));
        var line = el("p");
        var priceTxt = s.priceBeef
          ? "<b>" + fmt(s.priceBeef) + "</b> beef / <b>" + fmt(s.price) + "</b> other mains"
          : "<b>" + fmt(s.price) + "</b>";
        line.innerHTML = priceTxt + " — " + s.includes + ". " + s.when + ".";
        p.appendChild(line);
        wrapEl.appendChild(p);
      });
    }
    return wrapEl;
  }

  function render() {
    rootEl.textContent = "";

    D.sections.forEach(function (section) {
      var visible = section.items.filter(itemVisible);
      var sec = el("section", "menu-section");
      sec.id = section.id;
      sec.setAttribute("aria-label", section.label);

      var card = el("div", "menu-card crest-water reveal");
      var head = el("div", "dept-head");
      head.appendChild(el("span", "dept-tag", section.dept));
      head.appendChild(el("h2", null, section.label));
      /* Cheapest price at the SELECTED outlet, so the line can't advertise
         a dish the other café sells. */
      var min = null;
      section.items.forEach(function (it) {
        if (it[state.outlet] == null) return;
        var candidates = section.variant ? [it.v1, it.v2] : [it[state.outlet]];
        candidates.forEach(function (p) {
          if (typeof p === "number" && (min == null || p < min)) min = p;
        });
      });
      if (min != null) head.appendChild(el("span", "dept-tag", "from " + fmt(min)));
      card.appendChild(head);

      var noteTxt = section.note;
      if (section.variant) {
        noteTxt = (noteTxt || "") + (state.outlet === "amk"
          ? " Iced versions of most drinks are available — iced pricing is on the in-café board."
          : "");
      }
      if (noteTxt) card.appendChild(el("p", "dept-note", noteTxt));

      if (visible.length === 0) {
        card.appendChild(el("p", "empty-note",
          "Nothing in " + section.label + " matches the current filters at the " +
          D.outlets[state.outlet].name + " café."));
      } else {
        if (section.variant) {
          var vh = el("div", "variant-head");
          vh.setAttribute("aria-hidden", "true");
          vh.appendChild(el("span", null, "Drink"));
          vh.appendChild(el("span", null, state.outlet === "amk" ? "Tall" : "Hot"));
          vh.appendChild(el("span", null, state.outlet === "amk" ? "Grande" : "Iced"));
          card.appendChild(vh);
        }
        var list = el("ul", "mi-list");
        visible.forEach(function (it) { list.appendChild(renderItem(it, section)); });
        card.appendChild(list);
      }

      if (section.id === "mains") card.appendChild(renderSets());
      if (section.id === "breakfast" && state.outlet === "tp") {
        card.appendChild(el("p", "menu-note",
          "Tampines also runs weekday set lunches and dinners — see Mains below."));
      }

      card.appendChild(el("p", "menu-note",
        "All prices are subject to 10% service charge and prevailing GST."));

      sec.appendChild(card);
      rootEl.appendChild(sec);
    });

    var announce = document.getElementById("menu-announce");
    if (announce) {
      announce.textContent = "Showing the " + D.outlets[state.outlet].full +
        " menu" + (state.veg ? ", vegetarian only" : "") + (state.picks ? ", chef's picks and new dishes" : "") + ".";
    }

    if (window.PB_UI) window.PB_UI.rescanReveals();
  }

  /* ---------- controls ---------- */

  function bindSeg() {
    var seg = document.getElementById("outlet-seg");
    if (!seg) return;
    var btns = seg.querySelectorAll("button");
    function paint() {
      for (var i = 0; i < btns.length; i++) {
        btns[i].setAttribute("aria-pressed", btns[i].dataset.outlet === state.outlet ? "true" : "false");
      }
    }
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener("click", function () {
        state.outlet = this.dataset.outlet;
        try { localStorage.setItem("pb-outlet", state.outlet); } catch (e) { /* private mode */ }
        paint();
        render();
      });
    }
    paint();
  }

  function bindChip(id, key) {
    var chip = document.getElementById(id);
    if (!chip) return;
    chip.addEventListener("click", function () {
      state[key] = !state[key];
      chip.setAttribute("aria-pressed", state[key] ? "true" : "false");
      render();
    });
  }

  function buildDeptNav() {
    if (!deptNav) return;
    D.sections.forEach(function (s) {
      var a = document.createElement("a");
      a.href = "#" + s.id;
      a.textContent = s.label;
      deptNav.appendChild(a);
    });
  }

  buildDeptNav();
  bindSeg();
  bindChip("chip-veg", "veg");
  bindChip("chip-picks", "picks");
  render();

  /* Enquiry CTA reflects the selected outlet. */
  var waBtn = document.getElementById("menu-wa");
  if (waBtn) {
    waBtn.addEventListener("click", function (e) {
      e.preventDefault();
      window.open(window.PB_WA(state.outlet), "_blank", "noopener");
    });
  }
})();
