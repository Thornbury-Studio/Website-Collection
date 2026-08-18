/* cafe BomBom — the menu, rendered from BOMBOM_MENU.

   Category filter + live search, built from data so the counter board has one
   home. Kept deliberately small: no framework, no dependencies, one pass over
   the data per keystroke (debounced), and DOM built with createElement rather
   than innerHTML so nothing in the data file can inject markup. */
(function () {
  "use strict";

  var D = window.BOMBOM_MENU;
  var listEl = document.getElementById("menuList");
  var chipsEl = document.getElementById("menuChips");
  var searchEl = document.getElementById("menuSearch");
  var countEl = document.getElementById("menuCount");
  if (!D || !listEl) return;

  var group = "all";
  var query = "";

  /* A null price means "not published" — never $0.00, never a guess. */
  function priceText(p) {
    return (p === null || p === undefined) ? "Ask at counter" : "from " + D.currency + p.toFixed(2);
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

      var sec = el("section", "mgroup reveal");
      sec.id = "m-" + g.id;

      var h = el("h2");
      h.appendChild(document.createTextNode(g.name));
      /* The one place Korean script appears: the actual product name, given
         once beside its English name, not sprinkled as decoration. */
      if (g.korean) {
        var k = el("span", "kr", " " + g.korean);
        h.appendChild(k);
      }
      sec.appendChild(h);
      if (g.note) sec.appendChild(el("p", "note", g.note));

      var ul = el("ul", "mlist");
      items.forEach(function (it) {
        var li = el("li", "mrow");
        var nm = el("span", "nm");
        nm.appendChild(document.createTextNode(it.name));
        if (it.tag) nm.appendChild(el("span", "tag", it.tag));
        li.appendChild(nm);

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

    countEl.textContent = shown === 1 ? "1 item" : shown + " items";

    /* Rows built just now were never observed — hand them to the reveal system
       or they stay at opacity 0 forever. */
    if (window.BOM_UI && window.BOM_UI.rescanReveals) window.BOM_UI.rescanReveals();
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
      }, 110);
    });
  }

  render();
})();
