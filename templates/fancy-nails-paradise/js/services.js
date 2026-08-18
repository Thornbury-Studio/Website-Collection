/* Fancy Nails Paradise — the service list, rendered from FNP_SERVICES.

   Filter by category + live search. Built from data rather than markup so the
   salon's price board has exactly one home. */
(function () {
  "use strict";

  var D = window.FNP_SERVICES;
  var listEl = document.getElementById("svcList");
  var chipsEl = document.getElementById("svcChips");
  var searchEl = document.getElementById("svcSearch");
  var countEl = document.getElementById("svcCount");
  if (!D || !listEl) return;

  var group = "all";
  var query = "";

  /* A null price means "not published", never "free" — never render $0.00. */
  function priceText(p) {
    return (p === null || p === undefined) ? "Ask in salon" : "from " + D.currency + p;
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function matches(it) {
    if (!query) return true;
    return (it.name + " " + (it.desc || "")).toLowerCase().indexOf(query) !== -1;
  }

  function render() {
    listEl.textContent = "";
    var shown = 0;

    D.groups.forEach(function (g) {
      if (group !== "all" && group !== g.id) return;
      var items = g.items.filter(matches);
      if (!items.length) return;

      var sec = el("section", "price-group reveal");
      sec.id = "g-" + g.id;
      sec.appendChild(el("h2", null, g.name));
      if (g.note) sec.appendChild(el("p", "note", g.note));

      var ul = el("ul", "price-list");
      items.forEach(function (it) {
        var li = el("li", "price-row");
        li.appendChild(el("span", "nm", it.name));
        var pr = el("span", "pr", priceText(it.price));
        if (it.price === null || it.price === undefined) pr.classList.add("ask");
        li.appendChild(pr);
        if (it.desc) li.appendChild(el("span", "ds", it.desc));
        ul.appendChild(li);
        shown++;
      });
      sec.appendChild(ul);
      listEl.appendChild(sec);
    });

    if (!shown) {
      var e = el("div", "empty");
      e.appendChild(el("b", null, "Nothing matches that"));
      e.appendChild(el("p", null, "Try another word, or show everything and browse."));
      listEl.appendChild(e);
    }

    countEl.textContent = shown === 1 ? "1 service" : shown + " services";

    /* Rows built just now have never been observed — hand them to the reveal
       system or they sit at opacity 0 forever. */
    if (window.FNP_UI && window.FNP_UI.rescanReveals) window.FNP_UI.rescanReveals();
  }

  if (chipsEl) {
    var groups = [{ id: "all", name: "Everything" }].concat(
      D.groups.map(function (g) { return { id: g.id, name: g.name }; })
    );
    groups.forEach(function (g) {
      var b = el("button", "chip", g.name);
      b.type = "button";
      b.setAttribute("aria-pressed", g.id === group ? "true" : "false");
      b.addEventListener("click", function () {
        group = g.id;
        var all = chipsEl.querySelectorAll(".chip");
        for (var i = 0; i < all.length; i++) all[i].setAttribute("aria-pressed", "false");
        b.setAttribute("aria-pressed", "true");
        render();
        /* keep the chosen chip visible in the horizontal scroller */
        if (b.scrollIntoView) b.scrollIntoView({ block: "nearest", inline: "center" });
      });
      chipsEl.appendChild(b);
    });
  }

  if (searchEl) {
    var t = null;
    searchEl.addEventListener("input", function () {
      clearTimeout(t);
      t = setTimeout(function () {
        query = searchEl.value.trim().toLowerCase();
        render();
      }, 120);
    });
  }

  render();
})();
