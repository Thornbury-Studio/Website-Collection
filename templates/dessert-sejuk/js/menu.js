/* SEJUK board — filters + the item sheet (size, add-ons, live price, share). */
(function () {
  "use strict";

  var cat = window.SEJUK.cat;
  var chit = window.SEJUK.chit;
  var ui = window.SEJUK.ui;

  /* ---------- filters ---------- */

  var family = null; /* null | heritage | fruit | kopi */
  var diets = {}; /* df, vg, nogluten -> true */

  function matches(card) {
    var f = card.getAttribute("data-family");
    var flags = (card.getAttribute("data-flags") || "").split(/\s+/).filter(Boolean);
    if (family && f !== family) return false;
    if (diets.df && flags.indexOf("df") === -1) return false;
    if (diets.vg && flags.indexOf("vg") === -1) return false;
    if (diets.nogluten && flags.indexOf("gluten") !== -1) return false;
    return true;
  }

  function applyFilters() {
    var cards = document.querySelectorAll("[data-item]");
    var shown = 0;
    cards.forEach(function (card) {
      var ok = matches(card);
      card.hidden = !ok;
      if (ok) shown++;
    });
    var count = document.querySelector("[data-board-count]");
    if (count) {
      var total = cards.length;
      count.textContent = shown === total ? "All " + total + " on the board" : shown + " of " + total + " on the board";
    }
    var empty = document.querySelector("[data-board-empty]");
    if (empty) empty.hidden = shown !== 0;
    /* filtered-in cards may sit in fresh viewport space */
    ui.rescanReveals();
  }

  function initChips() {
    document.querySelectorAll("[data-filter-family]").forEach(function (chip) {
      chip.addEventListener("click", function () {
        var val = chip.getAttribute("data-filter-family") || null;
        family = family === val ? null : val;
        document.querySelectorAll("[data-filter-family]").forEach(function (c) {
          c.setAttribute("aria-pressed", String((c.getAttribute("data-filter-family") || null) === family));
        });
        applyFilters();
      });
    });
    document.querySelectorAll("[data-filter-diet]").forEach(function (chip) {
      chip.addEventListener("click", function () {
        var key = chip.getAttribute("data-filter-diet");
        diets[key] = !diets[key];
        chip.setAttribute("aria-pressed", String(!!diets[key]));
        applyFilters();
      });
    });
    var reset = document.querySelector("[data-filter-reset]");
    if (reset)
      reset.addEventListener("click", function () {
        family = null;
        diets = {};
        document.querySelectorAll("[data-filter-family], [data-filter-diet]").forEach(function (c) {
          c.setAttribute("aria-pressed", "false");
        });
        applyFilters();
        ui.toast("Filters cleared.");
      });
  }

  /* ---------- item sheet ---------- */

  var veil = null;
  var sheet = null;
  var lastFocus = null;
  var current = null; /* { item, size, addons: {} } */

  function build() {
    veil = document.createElement("div");
    veil.className = "chit-veil";
    veil.hidden = true;
    sheet = document.createElement("aside");
    sheet.className = "chit-sheet item-sheet";
    sheet.setAttribute("role", "dialog");
    sheet.setAttribute("aria-modal", "true");
    sheet.hidden = true;
    document.body.appendChild(veil);
    document.body.appendChild(sheet);
    veil.addEventListener("click", close);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !sheet.hidden) close();
    });
  }

  function currentPrice() {
    var unit = current.item.price;
    if (current.size === "berdua") unit += cat.BERDUA_SURCHARGE;
    Object.keys(current.addons).forEach(function (aid) {
      if (current.addons[aid]) {
        var a = cat.addonById(aid);
        if (a) unit += a.price;
      }
    });
    return unit;
  }

  function refreshPriceBtn() {
    var btn = sheet.querySelector("[data-sheet-add]");
    if (btn) btn.textContent = "Add to chit — " + cat.fmt(currentPrice());
    sheet.querySelectorAll("[data-size-chip]").forEach(function (c) {
      c.setAttribute("aria-pressed", String(c.getAttribute("data-size-chip") === current.size));
    });
  }

  function open(item) {
    current = { item: item, size: "solo", addons: {} };
    lastFocus = document.activeElement;
    sheet.setAttribute("aria-label", item.name);
    sheet.textContent = "";

    var head = document.createElement("header");
    head.className = "chit-head";
    var title = document.createElement("p");
    title.className = "chit-title";
    title.textContent = "THE BOARD";
    var closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "chit-close";
    closeBtn.setAttribute("aria-label", "Close");
    closeBtn.textContent = "×";
    closeBtn.addEventListener("click", close);
    head.appendChild(title);
    head.appendChild(closeBtn);
    sheet.appendChild(head);

    var fig = document.createElement("div");
    fig.className = "item-sheet-img";
    var img = document.createElement("img");
    img.src = "img/" + item.id + "-800.webp";
    img.alt = item.name;
    img.width = 800;
    img.height = 800;
    fig.appendChild(img);
    sheet.appendChild(fig);

    var nm = document.createElement("h2");
    nm.className = "item-sheet-name";
    nm.textContent = item.name;
    sheet.appendChild(nm);

    var ds = document.createElement("p");
    ds.className = "item-sheet-desc";
    ds.textContent = item.desc;
    sheet.appendChild(ds);

    /* melt meter */
    var melt = document.createElement("div");
    melt.className = "melt";
    var bar = document.createElement("div");
    bar.className = "melt-bar";
    var fill = document.createElement("div");
    fill.className = "melt-fill";
    bar.appendChild(fill);
    var note = document.createElement("p");
    note.className = "melt-note";
    note.textContent = "BEST WITHIN " + item.meltMin + " MIN OF THE BLADE — WE SHAVE WHEN YOU'RE HERE";
    melt.appendChild(bar);
    melt.appendChild(note);
    sheet.appendChild(melt);
    requestAnimationFrame(function () {
      fill.classList.add("is-melting");
    });

    /* size */
    var sg = document.createElement("div");
    sg.className = "opt-group";
    var sl = document.createElement("p");
    sl.className = "opt-label";
    sl.textContent = "Size";
    sg.appendChild(sl);
    var sp = document.createElement("div");
    sp.className = "size-pick";
    [
      { key: "solo", label: "Solo", price: item.price },
      { key: "berdua", label: "Berdua · for two", price: item.price + cat.BERDUA_SURCHARGE },
    ].forEach(function (s) {
      var c = document.createElement("button");
      c.type = "button";
      c.className = "chip";
      c.setAttribute("data-size-chip", s.key);
      c.setAttribute("aria-pressed", String(s.key === "solo"));
      var t = document.createElement("span");
      t.textContent = s.label;
      var p = document.createElement("span");
      p.className = "price";
      p.textContent = cat.fmt(s.price);
      c.appendChild(t);
      c.appendChild(p);
      c.addEventListener("click", function () {
        current.size = s.key;
        refreshPriceBtn();
      });
      sp.appendChild(c);
    });
    sg.appendChild(sp);
    sheet.appendChild(sg);

    /* add-ons */
    var ag = document.createElement("div");
    ag.className = "opt-group";
    var al = document.createElement("p");
    al.className = "opt-label";
    al.textContent = "Over the top";
    ag.appendChild(al);
    var ap = document.createElement("div");
    ap.className = "addon-pick";
    cat.ADDONS.forEach(function (a) {
      var row = document.createElement("label");
      row.className = "addon-row";
      var box = document.createElement("input");
      box.type = "checkbox";
      box.addEventListener("change", function () {
        current.addons[a.id] = box.checked;
        refreshPriceBtn();
      });
      var nm2 = document.createElement("span");
      nm2.textContent = a.name;
      var pr = document.createElement("span");
      pr.className = "price";
      pr.textContent = "+" + cat.fmt(a.price);
      row.appendChild(box);
      row.appendChild(nm2);
      row.appendChild(pr);
      ap.appendChild(row);
    });
    ag.appendChild(ap);
    sheet.appendChild(ag);

    /* add + share */
    var add = document.createElement("button");
    add.type = "button";
    add.className = "btn btn-full";
    add.setAttribute("data-sheet-add", "");
    add.addEventListener("click", function () {
      var addons = Object.keys(current.addons).filter(function (k) { return current.addons[k]; });
      chit.add(item.id, { size: current.size, addons: addons });
      ui.toast(item.name + (current.size === "berdua" ? " (berdua)" : "") + " on the chit.");
      close();
    });
    sheet.appendChild(add);

    var share = document.createElement("button");
    share.type = "button";
    share.className = "btn-ghost btn-full";
    share.textContent = "Send this one to a friend";
    share.addEventListener("click", function () {
      var url = location.origin + location.pathname + "#" + item.id;
      var payload = { title: "SEJUK° — " + item.name, text: item.name + " at SEJUK, an equatorial ice house.", url: url };
      if (navigator.share) {
        navigator.share(payload).catch(function () { /* user closed the share tray */ });
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(
          function () { ui.toast("Link copied — send it before it melts."); },
          function () { ui.toast(url); }
        );
      } else {
        ui.toast(url);
      }
    });
    sheet.appendChild(share);

    veil.hidden = false;
    sheet.hidden = false;
    refreshPriceBtn();
    requestAnimationFrame(function () {
      veil.classList.add("is-on");
      sheet.classList.add("is-on");
    });
    closeBtn.focus();
  }

  function close() {
    if (sheet.hidden) return;
    veil.classList.remove("is-on");
    sheet.classList.remove("is-on");
    setTimeout(function () {
      veil.hidden = true;
      sheet.hidden = true;
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }, 220);
  }

  function initChoose() {
    document.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-choose]");
      if (!btn) return;
      var item = cat.byId(btn.getAttribute("data-choose"));
      if (item) open(item);
    });
  }

  /* shared links land here: #gunung-pandan opens its sheet */
  function initDeepLink() {
    var id = (location.hash || "").replace("#", "");
    if (!id) return;
    var item = cat.byId(id);
    if (item && cat.kindOf(id) === "ice") {
      setTimeout(function () { open(item); }, 350);
    }
  }

  function boot() {
    build();
    initChips();
    initChoose();
    applyFilters();
    initDeepLink();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
