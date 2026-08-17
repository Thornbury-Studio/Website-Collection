/* Timestealer Café — the interactive menu.

   Renders window.TS_MENU into the page, then filters it live on category +
   search. The whole menu is built from the data file rather than written into
   the HTML, so the counter price list has exactly one home. */
(function () {
  "use strict";

  var DATA = window.TS_MENU;
  var listEl = document.getElementById("menuList");
  var chipsEl = document.getElementById("menuChips");
  var searchEl = document.getElementById("menuSearch");
  var countEl = document.getElementById("menuCount");
  if (!DATA || !listEl) return;

  var activeGroup = "all";
  var query = "";

  /* ---------- price formatting ----------
     A null price is a rotating item, not a free one — never render "$0.00". */
  function priceText(p) {
    return p === null || p === undefined ? "Daily" : DATA.currency + p.toFixed(2);
  }

  function matches(item) {
    if (!query) return true;
    var hay = (item.name + " " + (item.desc || "")).toLowerCase();
    return hay.indexOf(query) !== -1;
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function render() {
    listEl.textContent = "";
    var shown = 0;

    DATA.groups.forEach(function (group) {
      if (activeGroup !== "all" && activeGroup !== group.id) return;

      var items = group.items.filter(matches);
      if (!items.length) return;

      var section = el("section", "menu-group reveal");
      section.id = "group-" + group.id;

      var h2 = el("h2");
      h2.appendChild(document.createTextNode(group.name));
      section.appendChild(h2);

      if (group.note) section.appendChild(el("p", "group-note", group.note));

      var ul = el("ul", "menu-list");
      items.forEach(function (item) {
        var li = el("li", "menu-row");

        li.appendChild(el("span", "name", item.name));

        var price = el("span", "price", priceText(item.price));
        if (item.price === null || item.price === undefined) price.classList.add("is-daily");
        li.appendChild(price);

        if (item.desc) li.appendChild(el("span", "desc", item.desc));
        ul.appendChild(li);
        shown++;
      });

      section.appendChild(ul);
      listEl.appendChild(section);
    });

    if (!shown) {
      var empty = el("div", "menu-empty");
      empty.appendChild(el("b", null, "Nothing matches that"));
      empty.appendChild(el("p", null, "Try a different word, or clear the filter to see the whole menu."));
      listEl.appendChild(empty);
    }

    countEl.textContent = shown === 1
      ? "Showing 1 item"
      : "Showing " + shown + " items";

    /* Newly built rows have never been observed — hand them to the reveal
       system, or they stay at opacity 0 forever. */
    if (window.TS_UI && window.TS_UI.rescanReveals) window.TS_UI.rescanReveals();
  }

  /* ---------- category chips ---------- */
  if (chipsEl) {
    var groups = [{ id: "all", name: "Everything" }].concat(
      DATA.groups.map(function (g) { return { id: g.id, name: g.name }; })
    );

    groups.forEach(function (g) {
      var b = el("button", "chip", g.name);
      b.type = "button";
      b.setAttribute("aria-pressed", g.id === activeGroup ? "true" : "false");
      b.addEventListener("click", function () {
        activeGroup = g.id;
        var all = chipsEl.querySelectorAll(".chip");
        for (var i = 0; i < all.length; i++) all[i].setAttribute("aria-pressed", "false");
        b.setAttribute("aria-pressed", "true");
        render();
      });
      chipsEl.appendChild(b);
    });
  }

  /* ---------- search ---------- */
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
