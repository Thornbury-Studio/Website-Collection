/* VEXOR — shared chrome: nav, drawer, compare tray, reveals, finance helpers */
(function () {
  "use strict";

  var COMPARE_KEY = "vexor-compare";
  var MAX_COMPARE = 3;

  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function getCompare() {
    try {
      var raw = localStorage.getItem(COMPARE_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr.slice(0, MAX_COMPARE) : [];
    } catch (e) {
      return [];
    }
  }

  function setCompare(ids) {
    localStorage.setItem(COMPARE_KEY, JSON.stringify(ids.slice(0, MAX_COMPARE)));
    updateCompareBadge();
    document.dispatchEvent(new CustomEvent("vexor:compare", { detail: ids }));
  }

  function toggleCompare(id) {
    var ids = getCompare();
    var i = ids.indexOf(id);
    if (i >= 0) ids.splice(i, 1);
    else {
      if (ids.length >= MAX_COMPARE) {
        alert("Compare holds up to " + MAX_COMPARE + " machines. Remove one first.");
        return ids;
      }
      ids.push(id);
    }
    setCompare(ids);
    return ids;
  }

  function updateCompareBadge() {
    var n = getCompare().length;
    qsa("[data-compare-count]").forEach(function (el) {
      el.textContent = String(n);
      el.hidden = n === 0;
      if (n > 0) {
        el.classList.remove("badge-pop");
        void el.offsetWidth;
        el.classList.add("badge-pop");
      }
    });
  }

  function initNav() {
    var burger = qs(".burger");
    var drawer = qs(".drawer");
    var scrim = qs(".scrim");
    var top = qs(".top");
    if (!burger || !drawer) return;

    function close() {
      document.body.classList.remove("nav-open");
      burger.setAttribute("aria-expanded", "false");
    }
    function open() {
      document.body.classList.add("nav-open");
      burger.setAttribute("aria-expanded", "true");
    }

    burger.addEventListener("click", function () {
      if (document.body.classList.contains("nav-open")) close();
      else open();
    });
    if (scrim) scrim.addEventListener("click", close);
    drawer.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", close);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });

    if (top) {
      var onScroll = function () {
        top.classList.toggle("is-scrolled", window.scrollY > 24);
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
    }
  }

  function initReveals() {
    var nodes = qsa(".reveal");
    if (!nodes.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      nodes.forEach(function (n) { n.classList.add("in"); });
      return;
    }
    if (!("IntersectionObserver" in window)) {
      nodes.forEach(function (n) { n.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    nodes.forEach(function (n) { io.observe(n); });
  }

  function initHero() {
    var hero = qs(".hero");
    if (!hero) return;
    requestAnimationFrame(function () {
      hero.classList.add("hero-in");
    });

    var media = qs(".hero-media img", hero);
    if (!media || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    hero.addEventListener("mousemove", function (e) {
      var r = hero.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      media.style.transform = "scale(1.06) translate(" + (x * -18) + "px," + (y * -12) + "px)";
    });
    hero.addEventListener("mouseleave", function () {
      media.style.transform = "";
    });
  }

  function financeMonthly(price, downPct, months, annualRate) {
    var principal = price * (1 - downPct / 100);
    if (months <= 0) return 0;
    var r = annualRate / 100 / 12;
    if (r === 0) return principal / months;
    var factor = Math.pow(1 + r, months);
    return (principal * r * factor) / (factor - 1);
  }

  function popText(el, text) {
    if (!el) return;
    el.textContent = text;
    el.classList.remove("fin-pop");
    void el.offsetWidth;
    el.classList.add("fin-pop");
  }

  function bindFinance(root) {
    root = root || document;
    var priceEl = qs("[data-fin-price]", root);
    var downEl = qs("[data-fin-down]", root);
    var monthsEl = qs("[data-fin-months]", root);
    var rateEl = qs("[data-fin-rate]", root);
    var outMonthly = qs("[data-fin-monthly]", root);
    var outTotal = qs("[data-fin-total]", root);
    var outInterest = qs("[data-fin-interest]", root);
    if (!priceEl || !outMonthly) return;

    function recalc() {
      var price = parseFloat(priceEl.value) || 0;
      var down = parseFloat(downEl && downEl.value) || 0;
      var months = parseInt(monthsEl && monthsEl.value, 10) || 36;
      var rate = parseFloat(rateEl && rateEl.value) || 0;
      var monthly = financeMonthly(price, down, months, rate);
      var total = monthly * months;
      var principal = price * (1 - down / 100);
      var interest = Math.max(0, total - principal);
      popText(outMonthly, "S$" + Math.round(monthly).toLocaleString("en-SG"));
      if (outTotal) popText(outTotal, "S$" + Math.round(total).toLocaleString("en-SG"));
      if (outInterest) popText(outInterest, "S$" + Math.round(interest).toLocaleString("en-SG"));
    }

    [priceEl, downEl, monthsEl, rateEl].forEach(function (el) {
      if (el) el.addEventListener("input", recalc);
    });
    recalc();
  }

  function sgMobileOk(v) {
    var s = String(v).replace(/\s+/g, "");
    return /^(\+65)?[689]\d{7}$/.test(s);
  }

  function emailOk(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim());
  }

  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    initReveals();
    initHero();
    updateCompareBadge();
    bindFinance();
  });

  window.VexorUI = {
    getCompare: getCompare,
    setCompare: setCompare,
    toggleCompare: toggleCompare,
    updateCompareBadge: updateCompareBadge,
    financeMonthly: financeMonthly,
    bindFinance: bindFinance,
    sgMobileOk: sgMobileOk,
    emailOk: emailOk,
    qs: qs,
    qsa: qsa
  };
})();
