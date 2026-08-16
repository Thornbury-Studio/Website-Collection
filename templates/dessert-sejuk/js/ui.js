/* SEJUK shared chrome — reveals, toast, chit badge + sheet, live clocks,
   catalogue-driven text. Loads on every page after catalogue/service/chit. */
(function () {
  "use strict";

  var cat = window.SEJUK.cat;
  var svc = window.SEJUK.service;
  var chit = window.SEJUK.chit;

  /* ---------- reveals ---------- */
  /* Animation is opt-in: .js-anim on <html> gates every transition, so a
     stalled observer can never serve a blank page. Failsafes: a hard timer,
     and a throttled scroll/resize/hashchange sweep that reveals anything
     already in the viewport (IO firing once is not enough — anchor jumps). */

  var revealed = false;

  function revealAll() {
    document.querySelectorAll(".reveal:not(.is-in)").forEach(function (el) {
      el.classList.add("is-in");
    });
  }

  function inView(el) {
    var r = el.getBoundingClientRect();
    return r.top < window.innerHeight + 40 && r.bottom > -40;
  }

  function sweep() {
    document.querySelectorAll(".reveal:not(.is-in)").forEach(function (el) {
      if (inView(el)) el.classList.add("is-in");
    });
  }

  var io = null;

  function rescanReveals() {
    if (!io) return revealAll();
    document.querySelectorAll(".reveal:not(.is-in)").forEach(function (el) {
      io.observe(el);
      if (inView(el)) el.classList.add("is-in");
    });
  }

  function initReveals() {
    if (!("IntersectionObserver" in window)) return revealAll();
    document.documentElement.classList.add("js-anim");
    io = new IntersectionObserver(
      function (entries) {
        revealed = true;
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add("is-in");
            io.unobserve(en.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
    /* hard failsafe: if IO never fired, show everything */
    setTimeout(function () { if (!revealed) revealAll(); }, 2500);
    /* sweep failsafe: anchor jumps, resizes, late layout shifts */
    var t = null;
    function throttled() {
      if (t) return;
      t = setTimeout(function () { t = null; sweep(); }, 150);
    }
    window.addEventListener("scroll", throttled, { passive: true });
    window.addEventListener("resize", throttled);
    window.addEventListener("hashchange", function () { setTimeout(sweep, 60); });
  }

  /* ---------- toast ---------- */

  var toastEl = null;
  var toastTimer = null;

  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast";
      toastEl.setAttribute("role", "status");
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add("is-up");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("is-up"); }, 2600);
  }

  /* ---------- catalogue-driven text ---------- */

  function fillPrices() {
    document.querySelectorAll("[data-price]").forEach(function (el) {
      var item = cat.byId(el.getAttribute("data-price"));
      if (item) el.textContent = cat.fmt(item.price);
    });
    document.querySelectorAll("[data-berdua-price]").forEach(function (el) {
      var item = cat.byId(el.getAttribute("data-berdua-price"));
      if (item) el.textContent = cat.fmt(item.price + cat.BERDUA_SURCHARGE);
    });
    document.querySelectorAll("[data-berdua-plus]").forEach(function (el) {
      el.textContent = "+" + cat.fmt(cat.BERDUA_SURCHARGE);
    });
  }

  /* ---------- live outlet lines ---------- */

  function fillService() {
    svc.OUTLETS.forEach(function (o) {
      var st = svc.status(o);
      document.querySelectorAll('[data-outlet-line="' + o.id + '"]').forEach(function (el) {
        el.textContent = st.line;
      });
      document.querySelectorAll('[data-open-dot="' + o.id + '"]').forEach(function (el) {
        el.classList.toggle("is-open", st.open);
      });
    });
    /* first available pickup slot per outlet (a light solo chit ≈ 5 min) */
    document.querySelectorAll("[data-first-slot]").forEach(function (el) {
      var o = svc.outletById(el.getAttribute("data-first-slot"));
      if (!o) return;
      var today = svc.slots(o, 5);
      if (today.length) {
        el.textContent = "first slot " + today[0].label;
        return;
      }
      var d = new Date();
      d.setDate(d.getDate() + 1);
      d.setHours(0, 0, 0, 0);
      var tmrw = svc.slots(o, 5, d);
      el.textContent = tmrw.length ? "tmrw " + tmrw[0].label : "—";
    });
    /* weekly hours lists */
    document.querySelectorAll("[data-hours]").forEach(function (el) {
      var o = svc.outletById(el.getAttribute("data-hours"));
      if (!o) return;
      el.textContent = "";
      /* Mon..Sun display order */
      [1, 2, 3, 4, 5, 6, 0].forEach(function (d) {
        var row = document.createElement("div");
        row.className = "hours-row";
        var day = document.createElement("span");
        day.textContent = svc.DAY_NAMES[d].slice(0, 3);
        var span = document.createElement("span");
        span.textContent = o.hours[d] ? svc.hhmm(o.hours[d][0]) + " – " + svc.hhmm(o.hours[d][1]) : "Closed";
        if (!o.hours[d]) span.className = "is-closed";
        row.appendChild(day);
        row.appendChild(span);
        el.appendChild(row);
      });
    });
  }

  /* ---------- chit badge + sheet ---------- */

  var sheet = null;
  var veil = null;
  var lastFocus = null;

  function buildSheet() {
    veil = document.createElement("div");
    veil.className = "chit-veil";
    veil.hidden = true;
    sheet = document.createElement("aside");
    sheet.className = "chit-sheet";
    sheet.setAttribute("role", "dialog");
    sheet.setAttribute("aria-modal", "true");
    sheet.setAttribute("aria-label", "Your chit");
    sheet.hidden = true;
    document.body.appendChild(veil);
    document.body.appendChild(sheet);
    veil.addEventListener("click", closeSheet);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !sheet.hidden) closeSheet();
    });
  }

  function describeLine(l) {
    var bits = [];
    if (l.size === "berdua") bits.push("berdua");
    (l.addons || []).forEach(function (a) {
      var ad = cat.addonById(a);
      if (ad) bits.push(ad.name.toLowerCase());
    });
    return bits.join(" · ");
  }

  function renderSheet() {
    if (!sheet) return;
    sheet.textContent = "";

    var head = document.createElement("header");
    head.className = "chit-head";
    var title = document.createElement("p");
    title.className = "chit-title";
    title.textContent = "YOUR CHIT";
    var close = document.createElement("button");
    close.type = "button";
    close.className = "chit-close";
    close.setAttribute("aria-label", "Close chit");
    close.textContent = "×";
    close.addEventListener("click", closeSheet);
    head.appendChild(title);
    head.appendChild(close);
    sheet.appendChild(head);

    var lines = chit.lines();
    if (!lines.length) {
      var empty = document.createElement("p");
      empty.className = "chit-empty";
      empty.textContent = "Nothing on the chit yet. The board is this way →";
      sheet.appendChild(empty);
      var toMenu = document.createElement("a");
      toMenu.className = "btn btn-full";
      toMenu.href = "menu.html";
      toMenu.textContent = "See the board";
      sheet.appendChild(toMenu);
      return;
    }

    var list = document.createElement("div");
    list.className = "chit-lines";
    lines.forEach(function (l, i) {
      var item = cat.byId(l.id);
      var row = document.createElement("div");
      row.className = "chit-line";

      var info = document.createElement("div");
      info.className = "chit-line-info";
      var nm = document.createElement("p");
      nm.className = "chit-line-name";
      nm.textContent = item.name;
      info.appendChild(nm);
      var meta = describeLine(l);
      if (meta) {
        var mt = document.createElement("p");
        mt.className = "chit-line-meta";
        mt.textContent = meta;
        info.appendChild(mt);
      }

      var step = document.createElement("div");
      step.className = "stepper";
      var minus = document.createElement("button");
      minus.type = "button";
      minus.textContent = "−";
      minus.setAttribute("aria-label", "One less " + item.name);
      minus.addEventListener("click", function () { chit.setQty(i, l.qty - 1); });
      var q = document.createElement("span");
      q.className = "stepper-q";
      q.textContent = l.qty;
      var plus = document.createElement("button");
      plus.type = "button";
      plus.textContent = "+";
      plus.setAttribute("aria-label", "One more " + item.name);
      plus.addEventListener("click", function () { chit.setQty(i, l.qty + 1); });
      step.appendChild(minus);
      step.appendChild(q);
      step.appendChild(plus);

      var price = document.createElement("p");
      price.className = "chit-line-price";
      price.textContent = cat.fmt(cat.linePrice(l));

      row.appendChild(info);
      row.appendChild(step);
      row.appendChild(price);
      list.appendChild(row);
    });
    sheet.appendChild(list);

    var noteWrap = document.createElement("label");
    noteWrap.className = "chit-note";
    var noteLab = document.createElement("span");
    noteLab.textContent = "Note to the counter";
    var noteField = document.createElement("textarea");
    noteField.rows = 2;
    noteField.maxLength = 200;
    noteField.placeholder = "Less sweet? Say so here.";
    noteField.value = chit.note();
    noteField.addEventListener("change", function () { chit.setNote(noteField.value); });
    noteWrap.appendChild(noteLab);
    noteWrap.appendChild(noteField);
    sheet.appendChild(noteWrap);

    var math = document.createElement("div");
    math.className = "chit-math";
    var totalRow = document.createElement("div");
    totalRow.className = "chit-math-row chit-math-total";
    var tl = document.createElement("span");
    tl.textContent = "TOTAL · pay at the counter";
    var tv = document.createElement("span");
    tv.textContent = cat.fmt(chit.total());
    totalRow.appendChild(tl);
    totalRow.appendChild(tv);
    var readyRow = document.createElement("div");
    readyRow.className = "chit-math-row";
    var rl = document.createElement("span");
    rl.textContent = "READY IN";
    var rv = document.createElement("span");
    rv.textContent = "~" + chit.readyIn() + " min from send";
    readyRow.appendChild(rl);
    readyRow.appendChild(rv);
    math.appendChild(totalRow);
    math.appendChild(readyRow);
    sheet.appendChild(math);

    var go = document.createElement("a");
    go.className = "btn btn-full";
    go.href = "pickup.html";
    go.textContent = "Choose a pickup time";
    sheet.appendChild(go);

    var clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "btn-ghost btn-full";
    clearBtn.textContent = "Tear up the chit";
    clearBtn.addEventListener("click", function () {
      chit.clear();
      toast("Chit torn up.");
    });
    sheet.appendChild(clearBtn);
  }

  function openSheet() {
    if (!sheet) return;
    lastFocus = document.activeElement;
    renderSheet();
    veil.hidden = false;
    sheet.hidden = false;
    requestAnimationFrame(function () {
      veil.classList.add("is-on");
      sheet.classList.add("is-on");
    });
    var btn = sheet.querySelector("button, a");
    if (btn) btn.focus();
  }

  function closeSheet() {
    if (!sheet || sheet.hidden) return;
    veil.classList.remove("is-on");
    sheet.classList.remove("is-on");
    setTimeout(function () {
      veil.hidden = true;
      sheet.hidden = true;
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }, 220);
  }

  function updateBadges() {
    var n = chit.count();
    document.querySelectorAll("[data-chit-count]").forEach(function (el) {
      el.textContent = n;
      el.classList.toggle("is-some", n > 0);
    });
    document.querySelectorAll("[data-on-chit]").forEach(function (el) {
      el.classList.toggle("is-on-chit", chit.has(el.getAttribute("data-on-chit")));
    });
  }

  /* ---------- delegated add-to-chit ---------- */

  function initAdd() {
    document.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-add]");
      if (!btn) return;
      var id = btn.getAttribute("data-add");
      var item = cat.byId(id);
      if (!item) return;
      var size = btn.getAttribute("data-size") || undefined;
      if (chit.add(id, { size: size })) {
        toast(item.name + " on the chit.");
        btn.classList.add("did-add");
        setTimeout(function () { btn.classList.remove("did-add"); }, 700);
      }
    });
    document.addEventListener("click", function (e) {
      var open = e.target.closest("[data-open-chit]");
      if (open) {
        e.preventDefault();
        openSheet();
      }
    });
  }

  /* ---------- header scroll state ---------- */

  function initHeader() {
    var h = document.querySelector(".site-head");
    if (!h) return;
    var on = false;
    function check() {
      var want = window.scrollY > 8;
      if (want !== on) {
        on = want;
        h.classList.toggle("is-scrolled", on);
      }
    }
    window.addEventListener("scroll", check, { passive: true });
    check();
  }

  /* ---------- boot ---------- */

  function boot() {
    initReveals();
    buildSheet();
    fillPrices();
    fillService();
    updateBadges();
    initAdd();
    initHeader();
    document.addEventListener("sejuk:chit", function () {
      updateBadges();
      if (sheet && !sheet.hidden) renderSheet();
    });
    /* keep open/closed lines honest without a reload */
    setInterval(fillService, 60 * 1000);
    document.querySelectorAll("[data-year]").forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  window.SEJUK.ui = { toast: toast, rescanReveals: rescanReveals, openSheet: openSheet, closeSheet: closeSheet };
})();
