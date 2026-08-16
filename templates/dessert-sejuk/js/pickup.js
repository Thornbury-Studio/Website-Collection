/* SEJUK pickup — outlet, slot, details, send. The whole journey is computed:
   slots come from the outlet's hours minus the last-shave cutoff, the earliest
   slot from the chit's own shave time. Payment happens at the counter. */
(function () {
  "use strict";

  var cat = window.SEJUK.cat;
  var svc = window.SEJUK.service;
  var chit = window.SEJUK.chit;
  var ui = window.SEJUK.ui;

  var ORDER_KEY = "sejuk.order.v1";
  var root = document.getElementById("flow-root");
  if (!root) return;

  var picked = { outletId: null, dayOffset: 0, slot: null, name: "", phone: "" };

  function loadOrder() {
    try {
      var o = JSON.parse(localStorage.getItem(ORDER_KEY));
      return o && o.no ? o : null;
    } catch (e) {
      return null;
    }
  }

  function saveOrder(o) {
    try { localStorage.setItem(ORDER_KEY, JSON.stringify(o)); } catch (e) { /* fine */ }
  }

  function clearOrder() {
    try { localStorage.removeItem(ORDER_KEY); } catch (e) { /* fine */ }
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function dayDate(offset) {
    var d = new Date();
    d.setDate(d.getDate() + offset);
    return d;
  }

  function dayLabel(offset) {
    var d = dayDate(offset);
    var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var name = offset === 0 ? "Today" : offset === 1 ? "Tomorrow" : svc.DAY_NAMES[d.getDay()];
    return name + " · " + d.getDate() + " " + MONTHS[d.getMonth()];
  }

  function slotsFor(outlet, offset) {
    if (offset === 0) return svc.slots(outlet, chit.readyIn());
    var d = dayDate(offset);
    d.setHours(0, 0, 0, 0);
    return svc.slots(outlet, chit.readyIn(), d);
  }

  /* ---------- states ---------- */

  function renderEmpty() {
    root.textContent = "";
    var card = el("div", "flow-step");
    card.appendChild(el("h2", null, "The chit is blank."));
    card.appendChild(el("p", "muted", "Pickup starts from the board — put an ice or two on the chit and come back. It takes about a minute, which is four percent of an ice's life."));
    var go = el("a", "btn", "Go to the board");
    go.href = "menu.html";
    card.appendChild(go);
    root.appendChild(card);
  }

  function renderTicket(order) {
    root.textContent = "";
    var t = el("div", "ticket");
    t.appendChild(el("p", "ticket-no", "CHIT " + order.no));
    t.appendChild(el("h2", null, "The blade is booked."));
    var rows = el("div", "ticket-rows");
    function row(k, v) {
      var r = el("div", "ticket-row");
      r.appendChild(el("span", null, k));
      r.appendChild(el("span", null, v));
      rows.appendChild(r);
    }
    row("ROOM", order.outletName);
    row("PICKUP", order.dayLabel + " · " + order.slot);
    row("NAME", order.name);
    order.lines.forEach(function (l) {
      row(l.qty + " × " + l.name + (l.meta ? " (" + l.meta + ")" : ""), l.price);
    });
    row("TOTAL — PAY AT THE COUNTER", order.total);
    t.appendChild(rows);
    t.appendChild(
      el(
        "p",
        "ticket-fine",
        "Show this chit at " + order.addr + ". We start shaving at " + order.slot +
          " sharp — arrive on the slot, not early, not late. An ice lives fifteen minutes; yours will be born about ninety seconds before you eat it."
      )
    );
    root.appendChild(t);

    var actions = el("div", "flow-actions");
    var maps = el("a", "btn-quiet", "Directions");
    maps.href = order.maps;
    maps.rel = "noopener";
    actions.appendChild(maps);
    var again = el("button", "btn-ghost", "Tear this up and start again");
    again.type = "button";
    again.addEventListener("click", function () {
      clearOrder();
      ui.toast("Chit torn up.");
      render();
    });
    actions.appendChild(again);
    root.appendChild(actions);
  }

  /* ---------- form flow ---------- */

  function renderFlow() {
    root.textContent = "";
    var flow = el("div", "flow");

    /* — step 1 · room — */
    var s1 = el("section", "flow-step");
    var h1 = el("h2");
    h1.appendChild(el("span", "step-no", "01°"));
    h1.appendChild(document.createTextNode("Which room?"));
    s1.appendChild(h1);
    svc.OUTLETS.forEach(function (o) {
      var st = svc.status(o);
      var lab = el("label", "pick-option");
      var input = document.createElement("input");
      input.type = "radio";
      input.name = "outlet";
      input.value = o.id;
      /* closed rooms still take tomorrow's chits, so never disable */
      var body = el("div");
      body.appendChild(el("p", "o-title", o.name));
      body.appendChild(el("p", "o-sub", o.addr + " · " + o.mrt));
      body.appendChild(el("p", "o-sub mono", st.line));
      lab.appendChild(input);
      lab.appendChild(body);
      input.addEventListener("change", function () {
        picked.outletId = o.id;
        picked.slot = null;
        /* closed today → jump to the first day with slots */
        if (!slotsFor(o, picked.dayOffset).length) {
          picked.dayOffset = slotsFor(o, 1).length ? 1 : picked.dayOffset;
        }
        render();
      });
      if (picked.outletId === o.id) {
        input.checked = true;
        lab.classList.add("is-picked");
      }
      s1.appendChild(lab);
    });
    flow.appendChild(s1);

    /* — step 2 · slot — */
    if (picked.outletId) {
      var outlet = svc.outletById(picked.outletId);
      var s2 = el("section", "flow-step");
      var h2 = el("h2");
      h2.appendChild(el("span", "step-no", "02°"));
      h2.appendChild(document.createTextNode("When do we start shaving?"));
      s2.appendChild(h2);
      s2.appendChild(el("p", "muted", "Your chit takes about " + chit.readyIn() + " min under the blade and at the pass, so the first slot is never sooner than that."));

      var dayRow = el("div", "opt-row");
      [0, 1].forEach(function (offset) {
        var c = el("button", "chip", dayLabel(offset));
        c.type = "button";
        c.setAttribute("aria-pressed", String(picked.dayOffset === offset));
        c.addEventListener("click", function () {
          picked.dayOffset = offset;
          picked.slot = null;
          render();
        });
        dayRow.appendChild(c);
      });
      s2.appendChild(dayRow);

      var slots = slotsFor(outlet, picked.dayOffset);
      if (!slots.length) {
        s2.appendChild(el("p", "muted", picked.dayOffset === 0 ? "The blade is done for today — tomorrow's first slots are open." : "No slots that day — the room is closed."));
      } else {
        var grid = el("div", "slot-grid");
        slots.forEach(function (s) {
          var b = el("button", "slot", s.label);
          b.type = "button";
          b.setAttribute("aria-pressed", String(picked.slot === s.label));
          b.addEventListener("click", function () {
            picked.slot = s.label;
            grid.querySelectorAll(".slot").forEach(function (x) {
              x.setAttribute("aria-pressed", String(x === b));
            });
            renderSummary();
          });
          grid.appendChild(b);
        });
        s2.appendChild(grid);
      }
      flow.appendChild(s2);
    }

    /* — step 3 · who — */
    if (picked.outletId) {
      var s3 = el("section", "flow-step");
      var h3 = el("h2");
      h3.appendChild(el("span", "step-no", "03°"));
      h3.appendChild(document.createTextNode("Who's collecting?"));
      s3.appendChild(h3);

      var nameField = el("label", "field");
      nameField.appendChild(el("span", null, "Name"));
      var nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.autocomplete = "name";
      nameInput.maxLength = 60;
      nameInput.value = picked.name;
      nameInput.addEventListener("input", function () { picked.name = nameInput.value; });
      nameField.appendChild(nameInput);
      nameField.appendChild(el("p", "field-err", "We need a name to call at the pass."));
      s3.appendChild(nameField);

      var phoneField = el("label", "field");
      phoneField.appendChild(el("span", null, "Mobile · in case the mangoes run out"));
      var phoneInput = document.createElement("input");
      phoneInput.type = "tel";
      phoneInput.autocomplete = "tel";
      phoneInput.maxLength = 20;
      phoneInput.value = picked.phone;
      phoneInput.addEventListener("input", function () { picked.phone = phoneInput.value; });
      phoneField.appendChild(phoneInput);
      phoneField.appendChild(el("p", "field-err", "That doesn't look like a Singapore mobile number."));
      s3.appendChild(phoneField);

      flow.appendChild(s3);
    }

    /* — summary — */
    var sum = el("section", "flow-step");
    sum.id = "chit-summary";
    flow.appendChild(sum);

    root.appendChild(flow);
    renderSummary();
  }

  function renderSummary() {
    var sum = document.getElementById("chit-summary");
    if (!sum) return;
    sum.textContent = "";
    var h = el("h2");
    h.appendChild(el("span", "step-no", "04°"));
    h.appendChild(document.createTextNode("The chit"));
    sum.appendChild(h);

    var rows = el("div", "ticket-rows");
    chit.lines().forEach(function (l) {
      var item = cat.byId(l.id);
      var r = el("div", "ticket-row");
      var meta = [];
      if (l.size === "berdua") meta.push("berdua");
      (l.addons || []).forEach(function (a) {
        var ad = cat.addonById(a);
        if (ad) meta.push(ad.name.toLowerCase());
      });
      r.appendChild(el("span", null, l.qty + " × " + item.name + (meta.length ? " (" + meta.join(", ") + ")" : "")));
      r.appendChild(el("span", null, cat.fmt(cat.linePrice(l))));
      rows.appendChild(r);
    });
    var tr = el("div", "ticket-row");
    tr.appendChild(el("span", null, "TOTAL — PAY AT THE COUNTER"));
    tr.appendChild(el("span", null, cat.fmt(chit.total())));
    rows.appendChild(tr);
    sum.appendChild(rows);

    var edit = el("button", "btn-ghost", "Change the chit");
    edit.type = "button";
    edit.addEventListener("click", function () { ui.openSheet(); });
    sum.appendChild(edit);

    var send = el("button", "btn btn-full", picked.slot ? "Send the chit — pickup " + picked.slot : "Send the chit");
    send.type = "button";
    send.addEventListener("click", submit);
    sum.appendChild(send);
    sum.appendChild(el("p", "muted small-print", "Nothing is charged online. The counter takes PayNow, cards and cash."));
  }

  function submit() {
    var ok = true;
    if (!picked.outletId) {
      ui.toast("Pick a room first.");
      return;
    }
    if (!picked.slot) {
      ui.toast("Pick a pickup slot — the blade needs a start time.");
      return;
    }
    var flow = root;
    var nameField = flow.querySelector('input[autocomplete="name"]');
    var phoneField = flow.querySelector('input[type="tel"]');
    var nameWrap = nameField.closest(".field");
    var phoneWrap = phoneField.closest(".field");
    nameWrap.classList.remove("is-bad");
    phoneWrap.classList.remove("is-bad");
    if (!picked.name || picked.name.trim().length < 2) {
      nameWrap.classList.add("is-bad");
      ok = false;
    }
    var phone = (picked.phone || "").replace(/[\s-]/g, "");
    if (!/^(\+?65)?[3689]\d{7}$/.test(phone)) {
      phoneWrap.classList.add("is-bad");
      ok = false;
    }
    if (!ok) {
      ui.toast("One or two blanks need filling.");
      return;
    }

    var outlet = svc.outletById(picked.outletId);
    var no = outlet.short + "-" + String(100 + Math.floor(((Date.now() / 60000) % 900)));
    var order = {
      no: no,
      outletName: outlet.name,
      addr: outlet.addr + ", " + outlet.postal,
      maps: outlet.maps,
      dayLabel: dayLabel(picked.dayOffset),
      slot: picked.slot,
      name: picked.name.trim(),
      total: cat.fmt(chit.total()),
      lines: chit.lines().map(function (l) {
        var item = cat.byId(l.id);
        var meta = [];
        if (l.size === "berdua") meta.push("berdua");
        (l.addons || []).forEach(function (a) {
          var ad = cat.addonById(a);
          if (ad) meta.push(ad.name.toLowerCase());
        });
        return { qty: l.qty, name: item.name, meta: meta.join(", "), price: cat.fmt(cat.linePrice(l)) };
      }),
    };
    if (chit.note()) order.lines.push({ qty: "✎", name: chit.note(), meta: "", price: "" });
    saveOrder(order);
    chit.clear();
    ui.toast("Chit " + no + " sent to " + outlet.name + ".");
    render();
    window.scrollTo(0, 0);
  }

  function render() {
    var order = loadOrder();
    if (order) return renderTicket(order);
    if (!chit.lines().length) return renderEmpty();
    renderFlow();
  }

  document.addEventListener("sejuk:chit", function () {
    /* chit edited from the sheet while on this page */
    if (!loadOrder()) render();
  });

  render();
})();
