/* THORNBURY DIGITAL v6 — feedback.
   Everything that answers the hand: a cursor label over the plates, buttons
   that lean toward the pointer, a hairline that shows how far down the page
   you are, live validation on the brief, and a toast when the mail opens.
   Fine pointers only for the cursor and the lean; touch keeps its native
   feedback. */
(function () {
  "use strict";
  var doc = document.documentElement;
  var fine = window.matchMedia("(pointer: fine)").matches;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

  // ---------- scroll hairline ----------
  var bar = document.createElement("i");
  bar.className = "progress"; bar.setAttribute("aria-hidden", "true");
  document.body.appendChild(bar);
  function progress() {
    var h = doc.scrollHeight - window.innerHeight;
    bar.style.transform = "scaleX(" + (h > 0 ? Math.min(1, window.scrollY / h) : 0).toFixed(4) + ")";
  }
  window.addEventListener("scroll", progress, { passive: true });
  window.addEventListener("resize", progress);
  progress();

  // ---------- cursor label over plates ----------
  var cur = null, curText = null, curOn = false, cx = 0, cy = 0, tx = 0, ty = 0, curRaf = 0;
  if (fine) {
    cur = document.createElement("div");
    cur.className = "cursor"; cur.setAttribute("aria-hidden", "true");
    curText = document.createElement("span"); cur.appendChild(curText);
    document.body.appendChild(cur);
    window.addEventListener("pointermove", function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!curRaf) curRaf = requestAnimationFrame(moveCursor);
    }, { passive: true });
  }
  function moveCursor() {
    curRaf = 0;
    cx += (tx - cx) * (reduce ? 1 : 0.35); cy += (ty - cy) * (reduce ? 1 : 0.35);
    cur.style.transform = "translate3d(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px,0)";
    if (curOn && (Math.abs(tx - cx) > 0.5 || Math.abs(ty - cy) > 0.5)) curRaf = requestAnimationFrame(moveCursor);
  }
  function bindCursor(root) {
    if (!cur) return;
    $$("[data-cursor]", root).forEach(function (el) {
      el.addEventListener("pointerenter", function () { curText.textContent = el.getAttribute("data-cursor"); cur.classList.add("is-on"); curOn = true; if (!curRaf) curRaf = requestAnimationFrame(moveCursor); });
      el.addEventListener("pointerleave", function () { cur.classList.remove("is-on"); curOn = false; });
    });
  }

  // ---------- magnetic controls ----------
  function bindMagnets(root) {
    if (!fine || reduce) return;
    $$(".btn, .more, .sunrail-now, .wall-filter button", root).forEach(function (el) {
      var r = null;
      el.addEventListener("pointerenter", function () { r = el.getBoundingClientRect(); });
      el.addEventListener("pointermove", function (e) {
        if (!r) r = el.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / r.width, dy = (e.clientY - (r.top + r.height / 2)) / r.height;
        el.style.translate = (dx * 8).toFixed(1) + "px " + (dy * 6).toFixed(1) + "px";
      });
      el.addEventListener("pointerleave", function () { el.style.translate = ""; r = null; });
    });
  }

  // ---------- the brief: says what it needs, as you go ----------
  function bindForm(root) {
    var form = $("form.brief", root);
    if (!form) return;
    var fields = $$("input, textarea, select", form);
    function check(el, quiet) {
      var wrap = el.closest(".field"), hint = wrap && $(".hint", wrap);
      var bad = el.required && !el.value.trim() ? "This one we need." : (el.type === "email" && el.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value) ? "That does not look like an address yet." : "");
      if (wrap) { wrap.classList.toggle("is-bad", !!bad && !quiet); wrap.classList.toggle("is-ok", !bad && !!el.value.trim()); }
      if (hint) hint.textContent = quiet ? "" : bad;
      return !bad;
    }
    fields.forEach(function (el) {
      var wrap = el.closest(".field");
      if (wrap && !$(".hint", wrap)) { var h = document.createElement("p"); h.className = "hint lab"; h.setAttribute("aria-live", "polite"); wrap.appendChild(h); }
      el.addEventListener("blur", function () { check(el, false); });
      el.addEventListener("input", function () { if (wrap && wrap.classList.contains("is-bad")) check(el, false); else check(el, true); });
    });
    form.addEventListener("submit", function (e) {
      var ok = true;
      fields.forEach(function (el) { if (!check(el, false)) ok = false; });
      if (!ok) {
        e.preventDefault(); e.stopImmediatePropagation();
        var bad = $$(".field.is-bad", form).length;
        var first = $(".field.is-bad input, .field.is-bad textarea, .field.is-bad select", form); if (first) first.focus();
        toast(bad === 1 ? "One thing missing on the brief." : ["Two", "Three", "Four"][bad - 2] + " things missing on the brief.", true);
        return;
      }
      var btn = $(".btn", form);
      if (btn) { btn.classList.add("is-busy"); btn.querySelector("span") ? (btn.querySelector("span").textContent = "Opening your mail app") : (btn.textContent = "Opening your mail app"); }
      toast("Your mail app should open with the brief filled in.");
    }, true);
  }

  // ---------- toast ----------
  var toastEl = null, toastT = 0;
  function toast(msg, bad) {
    if (!toastEl) { toastEl = document.createElement("p"); toastEl.className = "toast"; toastEl.setAttribute("role", "status"); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.toggle("is-bad", !!bad);
    toastEl.classList.add("is-on"); clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.classList.remove("is-on"); }, 4200);
  }

  // ---------- back to top ----------
  function bindTop(root) {
    $$(".to-top", root).forEach(function (b) { b.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduce ? "instant" : "smooth" }); }); });
  }

  // ---------- filter chips: a pressed pulse and a count that reads ----------
  function bindChips(root) {
    $$(".wall-filter button", root).forEach(function (c) {
      c.addEventListener("click", function () { c.classList.remove("is-pulse"); void c.offsetWidth; c.classList.add("is-pulse"); var n = $("[data-shown]", root); if (n) toast(n.textContent + " on the wall"); });
    });
  }

  function init(root) { root = root || document; bindCursor(root); bindMagnets(root); bindForm(root); bindTop(root); bindChips(root); progress(); }
  document.addEventListener("tb:page", function (e) { init(e.detail && e.detail.root); });
  init(document);
  window.TBUI = { toast: toast };
})();
