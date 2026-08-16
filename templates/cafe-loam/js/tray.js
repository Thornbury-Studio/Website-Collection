/* LOAM — the tray. Order state, persisted, with a docked bar on every
   page and a bottom-sheet panel. Every figure is computed from the
   catalogue; nothing about the total is written by hand. */
(function () {
  "use strict";

  var C = window.LOAM;
  if (!C) return;

  var KEY = "loam.tray.v1";
  var state = { lines: [], note: "" };

  /* ---------- state ---------- */

  function load() {
    try {
      var raw = JSON.parse(localStorage.getItem(KEY) || "null");
      if (raw && Array.isArray(raw.lines)) {
        // Drop anything no longer on the menu, and clamp quantities.
        var clean = [];
        for (var i = 0; i < raw.lines.length; i++) {
          var l = raw.lines[i];
          if (l && C.byId(l.id)) {
            clean.push({ id: l.id, qty: Math.max(1, Math.min(C.HOUSE.maxPerLine, l.qty | 0 || 1)) });
          }
        }
        state.lines = clean;
        state.note = typeof raw.note === "string" ? raw.note.slice(0, 280) : "";
      }
    } catch (e) { /* start empty */ }
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* session only */ }
  }

  function announce() {
    save();
    render();
    window.dispatchEvent(new CustomEvent("loam:tray", { detail: summary() }));
  }

  function lineFor(id) {
    for (var i = 0; i < state.lines.length; i++) if (state.lines[i].id === id) return state.lines[i];
    return null;
  }

  function count() {
    var n = 0;
    for (var i = 0; i < state.lines.length; i++) n += state.lines[i].qty;
    return n;
  }

  function total() {
    var t = 0;
    for (var i = 0; i < state.lines.length; i++) {
      var item = C.byId(state.lines[i].id);
      if (item) t += item.price * state.lines[i].qty;
    }
    return t;
  }

  function pickupMinutes() {
    if (!state.lines.length) return 0;
    return Math.min(C.HOUSE.pickupMax, C.HOUSE.pickupBase + C.HOUSE.pickupPerItem * count());
  }

  function summary() {
    return { count: count(), total: total(), pickup: pickupMinutes(), lines: state.lines.slice() };
  }

  function add(id) {
    var item = C.byId(id);
    if (!item) return null;
    var line = lineFor(id);
    if (line) {
      if (line.qty >= C.HOUSE.maxPerLine) return { item: item, capped: true, qty: line.qty };
      line.qty++;
    } else {
      state.lines.push({ id: id, qty: 1 });
    }
    announce();
    return { item: item, capped: false, qty: lineFor(id).qty };
  }

  function setQty(id, qty) {
    var line = lineFor(id);
    if (!line) return;
    if (qty <= 0) {
      state.lines = state.lines.filter(function (l) { return l.id !== id; });
    } else {
      line.qty = Math.min(C.HOUSE.maxPerLine, qty);
    }
    announce();
  }

  function clear() {
    state.lines = [];
    state.note = "";
    announce();
  }

  function setNote(text) {
    state.note = String(text || "").slice(0, 280);
    save();
  }

  /* ---------- rendering ---------- */

  var root, bar, panel, backdrop, lastFocus = null;

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function mount() {
    root = document.querySelector("[data-tray-root]");
    if (!root) return;
    root.innerHTML =
      '<div class="tray-bar" data-tray-bar hidden>' +
        '<button class="tray-bar-btn" type="button" data-tray-open>' +
          '<span class="tray-pip" data-tray-count aria-hidden="true">0</span>' +
          '<span class="tray-bar-label">View tray</span>' +
          '<span class="tray-bar-total" data-tray-total></span>' +
        "</button>" +
      "</div>" +
      '<div class="tray-backdrop" data-tray-backdrop hidden></div>' +
      '<section class="tray-panel" data-tray-panel role="dialog" aria-modal="true" aria-labelledby="tray-h" hidden>' +
        '<header class="tray-head">' +
          '<h2 id="tray-h">Your tray</h2>' +
          '<button class="icon-btn" type="button" data-tray-close aria-label="Close tray">' +
            '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
          "</button>" +
        "</header>" +
        '<div class="tray-lines" data-tray-lines></div>' +
        '<div class="tray-note">' +
          '<label for="tray-note-field">Anything we should know?</label>' +
          '<textarea id="tray-note-field" data-tray-note rows="2" maxlength="280" placeholder="Oat milk, extra hot, no rush&hellip;"></textarea>' +
        "</div>" +
        '<footer class="tray-foot">' +
          '<p class="tray-sum"><span data-tray-foot-count></span><span class="tray-sum-total" data-tray-foot-total></span></p>' +
          '<p class="tray-pickup" data-tray-pickup></p>' +
          '<button class="btn btn-primary btn-block" type="button" data-tray-send>Send to the counter</button>' +
          '<button class="btn btn-quiet btn-block" type="button" data-tray-clear>Empty the tray</button>' +
        "</footer>" +
        '<div class="tray-sent" data-tray-sent hidden>' +
          '<p class="tray-sent-mark" aria-hidden="true">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>' +
          "</p>" +
          '<h3>On the pass.</h3>' +
          '<p data-tray-sent-line></p>' +
          '<p class="muted">Pay at the counter when you collect. This is a request, not a charge.</p>' +
          '<button class="btn btn-quiet btn-block" type="button" data-tray-again>Start another tray</button>' +
        "</div>" +
      "</section>";

    bar = root.querySelector("[data-tray-bar]");
    panel = root.querySelector("[data-tray-panel]");
    backdrop = root.querySelector("[data-tray-backdrop]");

    root.querySelector("[data-tray-open]").addEventListener("click", open);
    root.querySelector("[data-tray-close]").addEventListener("click", close);
    backdrop.addEventListener("click", close);
    root.querySelector("[data-tray-clear]").addEventListener("click", function () {
      clear();
      close();
      if (window.LOAM_UI) window.LOAM_UI.toast("Tray emptied.");
    });
    root.querySelector("[data-tray-send]").addEventListener("click", send);
    root.querySelector("[data-tray-again]").addEventListener("click", function () {
      root.querySelector("[data-tray-sent]").hidden = true;
      clear();
      close();
    });

    var noteField = root.querySelector("[data-tray-note]");
    noteField.addEventListener("input", function () { setNote(noteField.value); });

    root.querySelector("[data-tray-lines]").addEventListener("click", function (ev) {
      var btn = ev.target.closest("[data-line-act]");
      if (!btn) return;
      var id = btn.getAttribute("data-line-id");
      var line = lineFor(id);
      if (!line) return;
      var act = btn.getAttribute("data-line-act");
      if (act === "inc") setQty(id, line.qty + 1);
      else if (act === "dec") setQty(id, line.qty - 1);
      else if (act === "rm") {
        setQty(id, 0);
        if (window.LOAM_UI) window.LOAM_UI.toast(esc(C.byId(id).name) + " taken off.");
      }
    });

    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && panel && !panel.hidden) close();
    });

    render();
  }

  function open() {
    if (!panel) return;
    lastFocus = document.activeElement;
    panel.hidden = false;
    backdrop.hidden = false;
    document.body.classList.add("tray-locked");
    var field = panel.querySelector("[data-tray-close]");
    if (field) field.focus();
  }

  function close() {
    if (!panel) return;
    panel.hidden = true;
    backdrop.hidden = true;
    document.body.classList.remove("tray-locked");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function send() {
    if (!state.lines.length) return;
    var s = summary();
    var sent = root.querySelector("[data-tray-sent]");
    root.querySelector("[data-tray-sent-line]").textContent =
      s.count + (s.count === 1 ? " item" : " items") + ", " + C.money(s.total) +
      " — ready in about " + s.pickup + " minutes.";
    sent.hidden = false;
    sent.focus && sent.focus();
  }

  function render() {
    if (!root) return;
    var n = count(), t = total();

    bar.hidden = n === 0;
    root.querySelector("[data-tray-count]").textContent = String(n);
    root.querySelector("[data-tray-total]").textContent = C.money(t);
    root.querySelector("[data-tray-open]").setAttribute(
      "aria-label", "View tray: " + n + (n === 1 ? " item" : " items") + ", " + C.money(t)
    );

    root.querySelector("[data-tray-foot-count]").textContent = n + (n === 1 ? " item" : " items");
    root.querySelector("[data-tray-foot-total]").textContent = C.money(t);
    root.querySelector("[data-tray-pickup]").textContent = n
      ? "Ready about " + pickupMinutes() + " minutes after you send it."
      : "";

    var noteField = root.querySelector("[data-tray-note]");
    if (noteField.value !== state.note) noteField.value = state.note;

    var lines = root.querySelector("[data-tray-lines]");
    if (!state.lines.length) {
      lines.innerHTML = '<p class="tray-empty">Nothing on the tray yet. Tap anything on the menu and it lands here.</p>';
      return;
    }

    var html = "";
    for (var i = 0; i < state.lines.length; i++) {
      var line = state.lines[i];
      var item = C.byId(line.id);
      if (!item) continue;
      var isBean = !item.group;
      html +=
        '<div class="tray-line">' +
          (isBean
            ? '<span class="tray-thumb tray-thumb--bag" aria-hidden="true"></span>'
            : '<img class="tray-thumb" src="img/' + esc(item.img) + '-400.webp" alt="" width="80" height="80" loading="lazy" decoding="async">') +
          '<span class="tray-line-body">' +
            '<span class="tray-line-name">' + esc(item.name) + "</span>" +
            '<span class="tray-line-price">' + C.money(item.price) + " each</span>" +
          "</span>" +
          '<span class="stepper">' +
            '<button class="stepper-btn" type="button" data-line-act="dec" data-line-id="' + esc(item.id) + '" aria-label="One fewer ' + esc(item.name) + '">&minus;</button>' +
            '<span class="stepper-qty" aria-label="' + line.qty + ' ' + esc(item.name) + '">' + line.qty + "</span>" +
            '<button class="stepper-btn" type="button" data-line-act="inc" data-line-id="' + esc(item.id) + '" aria-label="One more ' + esc(item.name) + '"' +
              (line.qty >= C.HOUSE.maxPerLine ? " disabled" : "") + ">+</button>" +
          "</span>" +
          '<button class="line-rm" type="button" data-line-act="rm" data-line-id="' + esc(item.id) + '" aria-label="Remove ' + esc(item.name) + '">' +
            '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
          "</button>" +
        "</div>";
    }
    lines.innerHTML = html;
  }

  load();

  window.LOAM_TRAY = {
    mount: mount,
    add: add,
    setQty: setQty,
    clear: clear,
    count: count,
    total: total,
    pickupMinutes: pickupMinutes,
    summary: summary,
    qtyOf: function (id) { var l = lineFor(id); return l ? l.qty : 0; },
    open: open,
    close: close
  };
})();
