/* THORNBURY DIGITAL v6 — page runtime.
   Reveals (gated on html.js, failsafed), the live clock in the bar, the sun
   rail, the contact form, and a fetch-and-swap router so the room's light
   survives a navigation: only <main> is exchanged, the canvases never are. */
(function () {
  "use strict";
  var doc = document.documentElement;
  doc.classList.add("js");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function pad(n) { return String(Math.floor(n)).padStart(2, "0"); }

  // ---------- reveals ----------
  var io = null, seen = false;
  function rescanReveals() {
    var els = $$(".reveal:not(.is-in)");
    if (!("IntersectionObserver" in window)) { els.forEach(function (e) { e.classList.add("is-in"); }); return; }
    if (!io) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { seen = true; en.target.classList.add("is-in"); io.unobserve(en.target); } });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    }
    els.forEach(function (e) { io.observe(e); });
    setTimeout(function () { if (!seen) $$(".reveal:not(.is-in)").forEach(function (e) { e.classList.add("is-in"); }); }, 1800);
  }
  var sweepT = 0;
  function sweep() {
    clearTimeout(sweepT);
    sweepT = setTimeout(function () {
      var vh = window.innerHeight;
      $$(".reveal:not(.is-in)").forEach(function (e) { var r = e.getBoundingClientRect(); if (r.top < vh && r.bottom > 0) e.classList.add("is-in"); });
    }, 120);
  }
  window.addEventListener("scroll", sweep, { passive: true });
  window.addEventListener("resize", sweep);
  window.addEventListener("hashchange", sweep);

  // ---------- fitted wordmarks ----------
  // A display face renders wider or narrower than any CSS ratio can promise,
  // so a .fit heading is measured and sized to its column once the fonts are
  // in. Each <span> is a line on the phone and a word on the desktop.
  function fitWords() {
    $$(".fit").forEach(function (el) {
      var spans = $$("span", el);
      if (!spans.length) return;
      el.style.fontSize = "";
      var fs = parseFloat(getComputedStyle(el).fontSize);
      var col = el.parentElement.getBoundingClientRect().width;
      var block = getComputedStyle(spans[0]).display === "block";
      var w = 0;
      if (block) spans.forEach(function (s) { w = Math.max(w, s.getBoundingClientRect().width); });
      else spans.forEach(function (s) { w += s.getBoundingClientRect().width; });
      if (!w || !col) return;
      var next = fs * (col / w) * 0.995;
      if (!block) next = Math.min(next, window.innerHeight * 0.36);
      el.style.fontSize = next.toFixed(2) + "px";
    });
  }
  var fitT = 0;
  window.addEventListener("resize", function () { clearTimeout(fitT); fitT = setTimeout(fitWords, 120); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitWords);

  // ---------- the bar ----------
  function onScroll() { doc.classList.toggle("scrolled", window.scrollY > 24); }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ---------- the clock: Singapore time in the bar and the foot ----------
  function realClock() {
    var d = new Date(Date.now() + 8 * 3600000);
    return pad(d.getUTCHours()) + ":" + pad(d.getUTCMinutes());
  }
  function renderClock() {
    var el = $("#barTime");
    if (el) el.innerHTML = "<b>" + realClock() + " SGT</b> · Singapore";
    $$("[data-sun-time]").forEach(function (e) { e.textContent = realClock() + " SGT"; });
  }
  setInterval(renderClock, 20000);

  // ---------- contact form: composes a mail, nothing leaves the page ----------
  function initForm(root) {
    var form = $("form.brief", root);
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var d = new FormData(form);
      var body = ["Name: " + d.get("name"), "Email: " + d.get("email"), "What exists now: " + d.get("have"), "", d.get("brief")].join("\n");
      var href = "mailto:hello@thornbury.studio?subject=" + encodeURIComponent("A project — " + (d.get("name") || "")) + "&body=" + encodeURIComponent(body);
      var sent = $(".form-sent", form);
      if (sent) { sent.hidden = false; sent.focus && sent.focus(); }
      window.location.href = href;
    });
  }

  // ---------- page init / teardown ----------
  function initPage(root) {
    root = root || document;
    rescanReveals();
    initForm(root);
    fitWords();
    var page = doc.getAttribute("data-page");
    $$(".nav a, .foot-nav a").forEach(function (a) {
      var href = (a.getAttribute("href") || "").replace("./", "");
      var is = (page === "home" && href === "index.html") || href === page + ".html";
      if (is) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    renderClock();
    initWall(root);
    document.dispatchEvent(new CustomEvent("tb:page", { detail: { root: root } }));
  }

  // ---------- the collection wall: one filter row, plates hide by category ----------
  function initWall(root) {
    var wall = $(".wall-grid", root);
    if (!wall) return;
    var chips = $$(".wall-filter button", root);
    var plates = $$(".plate", wall);
    var count = $("[data-shown]", root);
    function apply(cat) {
      var n = 0;
      plates.forEach(function (p) { var on = cat === "all" || p.getAttribute("data-cat") === cat; p.hidden = !on; if (on) n++; });
      chips.forEach(function (c) { c.setAttribute("aria-pressed", c.getAttribute("data-cat") === cat ? "true" : "false"); });
      if (count) count.textContent = n;
      rescanReveals(); sweep();
    }
    chips.forEach(function (c) { c.addEventListener("click", function () { apply(c.getAttribute("data-cat")); }); });
    if (count) count.textContent = plates.filter(function (p) { return !p.hidden; }).length;
  }

  // ---------- router ----------
  var busy = false;
  function sameDir(url) {
    try {
      var u = new URL(url, location.href);
      if (u.origin !== location.origin) return null;
      var here = location.pathname.replace(/[^/]*$/, "");
      if (u.pathname.replace(/[^/]*$/, "") !== here) return null;
      if (!/\.html$/.test(u.pathname)) return null;
      return u;
    } catch (err) { return null; }
  }
  function swap(u, push) {
    if (busy) return;
    busy = true;
    fetch(u.href, { credentials: "same-origin" }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); }).then(function (html) {
      var next = new DOMParser().parseFromString(html, "text/html");
      var nm = next.querySelector("#main"), cur = $("#main");
      if (!nm || !cur) throw new Error("no main");
      doc.classList.add("bg-out");
      return new Promise(function (res) { setTimeout(res, reduce ? 0 : 330); }).then(function () {
        cur.replaceWith(nm);
        document.title = next.title;
        var md = next.querySelector('meta[name="description"]'), mc = $('meta[name="description"]');
        if (md && mc) mc.setAttribute("content", md.getAttribute("content"));
        var cl = next.querySelector('link[rel="canonical"]'), cc = $('link[rel="canonical"]');
        if (cl && cc) cc.setAttribute("href", cl.getAttribute("href"));
        doc.setAttribute("data-page", next.documentElement.getAttribute("data-page") || "home");
        if (push) history.pushState({ tb: 1 }, "", u.href);
        window.scrollTo({ top: 0, behavior: "instant" });
        window.dispatchEvent(new Event("scroll"));
        initPage(nm);
        nm.setAttribute("tabindex", "-1");
        nm.focus({ preventScroll: true });
        requestAnimationFrame(function () { doc.classList.remove("bg-out"); busy = false; });
      });
    }).catch(function () { busy = false; location.href = u.href; });
  }
  document.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
    var u = sameDir(a.getAttribute("href"));
    if (!u) return;
    if (u.pathname === location.pathname) { e.preventDefault(); window.scrollTo({ top: 0, behavior: reduce ? "instant" : "smooth" }); return; }
    e.preventDefault();
    swap(u, true);
  });
  window.addEventListener("popstate", function () {
    var u = sameDir(location.href);
    if (u) swap(u, false); else location.reload();
  });
  if (!history.state) history.replaceState({ tb: 1 }, "", location.href);

  initPage(document);
  window.TB = { initPage: initPage, rescanReveals: rescanReveals };
})();
