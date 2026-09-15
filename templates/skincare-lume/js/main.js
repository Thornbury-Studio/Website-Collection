/* Lume Skin — chrome, reveals, FAQ, pricing, forms */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.remove("no-js");

  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  /* ----- sticky head ----- */
  var head = document.getElementById("head");
  function onScroll() {
    if (!head) return;
    head.classList.toggle("is-scrolled", window.scrollY > 40);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ----- mobile nav ----- */
  var toggle = document.querySelector(".nav-toggle");
  var scrim = document.querySelector(".scrim");
  var nav = document.getElementById("nav");
  var scrollY = 0;

  function openNav() {
    if (!head || !toggle) return;
    scrollY = window.scrollY;
    head.classList.add("nav-open");
    document.body.style.position = "fixed";
    document.body.style.top = "-" + scrollY + "px";
    document.body.style.width = "100%";
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close menu");
  }
  function closeNav() {
    if (!head || !toggle) return;
    head.classList.remove("nav-open");
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.width = "";
    window.scrollTo(0, scrollY);
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open menu");
  }
  if (toggle) {
    toggle.addEventListener("click", function () {
      if (head.classList.contains("nav-open")) closeNav();
      else openNav();
    });
  }
  if (scrim) scrim.addEventListener("click", closeNav);
  if (nav) {
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeNav);
    });
  }

  /* ----- reveals ----- */
  var io = null;
  var seenAny = false;
  function showAll() {
    document.querySelectorAll(".reveal:not(.is-in)").forEach(function (el) {
      el.classList.add("is-in");
    });
  }
  function inViewport(el) {
    var r = el.getBoundingClientRect();
    return r.top < (window.innerHeight || 0) + 40 && r.bottom > -40;
  }
  function sweep() {
    document.querySelectorAll(".reveal:not(.is-in)").forEach(function (el) {
      if (inViewport(el)) el.classList.add("is-in");
    });
  }
  if ("IntersectionObserver" in window) {
    io = new IntersectionObserver(function (entries) {
      seenAny = true;
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.04 });
    document.querySelectorAll(".reveal").forEach(function (el) {
      io.observe(el);
    });
  } else {
    showAll();
  }
  setTimeout(function () { if (!seenAny) showAll(); }, 1600);
  window.addEventListener("scroll", sweep, { passive: true });

  /* ----- FAQ ----- */
  document.querySelectorAll(".faq-item").forEach(function (item) {
    var btn = item.querySelector("button");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var open = item.classList.contains("is-open");
      document.querySelectorAll(".faq-item.is-open").forEach(function (other) {
        other.classList.remove("is-open");
        var b = other.querySelector("button");
        if (b) b.setAttribute("aria-expanded", "false");
      });
      if (!open) {
        item.classList.add("is-open");
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });

  /* ----- pricing toggle ----- */
  var period = "month";
  var toggleBtns = document.querySelectorAll(".price-toggle button");
  function applyPrices() {
    document.querySelectorAll("[data-price-m]").forEach(function (el) {
      var val = period === "year" ? el.getAttribute("data-price-y") : el.getAttribute("data-price-m");
      el.textContent = "$" + val;
    });
  }
  toggleBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      period = btn.getAttribute("data-period") || "month";
      toggleBtns.forEach(function (b) { b.classList.toggle("is-on", b === btn); });
      applyPrices();
    });
  });

  /* ----- counters ----- */
  function animateCount(el) {
    var target = parseInt(el.getAttribute("data-count"), 10) || 0;
    var start = 0;
    var dur = 1100;
    var t0 = null;
    function frame(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(start + (target - start) * eased)) + (target >= 20 ? "+" : "");
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  var counted = false;
  function maybeCount() {
    if (counted) return;
    var first = document.querySelector(".metric strong");
    if (!first || !inViewport(first)) return;
    counted = true;
    document.querySelectorAll(".metric strong[data-count]").forEach(animateCount);
  }
  window.addEventListener("scroll", maybeCount, { passive: true });
  maybeCount();

  /* ----- booking form → mailto ----- */
  var form = document.getElementById("bookForm");
  var formOk = document.getElementById("formOk");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      var fd = new FormData(form);
      var interests = [];
      form.querySelectorAll('input[name="interest"]:checked').forEach(function (c) {
        interests.push(c.value);
      });
      var body = [
        "Name: " + (fd.get("name") || ""),
        "Email: " + (fd.get("email") || ""),
        "Phone: " + (fd.get("phone") || ""),
        "Skin focus: " + (fd.get("skin") || ""),
        "Interests: " + (interests.join(", ") || "—"),
        "Updates: " + (fd.get("updates") ? "yes" : "no"),
        "",
        "Notes:",
        fd.get("notes") || ""
      ].join("\n");
      var mailto = "mailto:hello@lumeskin.com?subject=" +
        encodeURIComponent("Lume Skin consult request") +
        "&body=" + encodeURIComponent(body);
      window.location.href = mailto;
      if (formOk) formOk.classList.add("is-show");
    });
  }

  var news = document.getElementById("newsForm");
  if (news) {
    news.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = document.getElementById("newsEmail");
      if (!email || !email.value) return;
      window.location.href =
        "mailto:hello@lumeskin.com?subject=" +
        encodeURIComponent("Newsletter signup") +
        "&body=" + encodeURIComponent("Please add me to the Lume Skin list: " + email.value);
    });
  }
})();
