/* ZARI — stars, nav, reveals, plate slider, marquee, reviews */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.remove("no-js");

  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  /* ----- stars canvas ----- */
  var canvas = document.querySelector(".stars-canvas");
  if (canvas && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var stars = [];
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function resize() {
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.floor((window.innerWidth * window.innerHeight) / 9000);
      stars = [];
      for (var i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          r: Math.random() * 1.4 + 0.2,
          a: Math.random() * 0.55 + 0.15,
          s: Math.random() * 0.015 + 0.004
        });
      }
    }

    function draw(t) {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (var i = 0; i < stars.length; i++) {
        var st = stars[i];
        var tw = reduce ? st.a : st.a * (0.65 + 0.35 * Math.sin(t * st.s + i));
        ctx.beginPath();
        ctx.fillStyle = "rgba(246,241,231," + tw + ")";
        ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (!reduce) requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener("resize", resize);
    if (reduce) draw(0);
    else requestAnimationFrame(draw);
  }

  /* ----- header scrolled ----- */
  var head = document.querySelector(".site-header");
  function onScroll() {
    if (!head) return;
    head.classList.toggle("scrolled", window.scrollY > 40);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ----- nav overlay ----- */
  var overlay = document.querySelector(".nav-overlay");
  var openBtn = document.querySelector(".menu-btn");
  var closeBtn = document.querySelector(".nav-overlay__close");
  var scrollY = 0;

  function openNav() {
    if (!overlay) return;
    scrollY = window.scrollY;
    overlay.classList.add("is-open");
    document.body.style.position = "fixed";
    document.body.style.top = "-" + scrollY + "px";
    document.body.style.width = "100%";
    if (openBtn) openBtn.setAttribute("aria-expanded", "true");
  }
  function closeNav() {
    if (!overlay) return;
    overlay.classList.remove("is-open");
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.width = "";
    window.scrollTo(0, scrollY);
    if (openBtn) openBtn.setAttribute("aria-expanded", "false");
  }
  if (openBtn) openBtn.addEventListener("click", openNav);
  if (closeBtn) closeBtn.addEventListener("click", closeNav);
  if (overlay) {
    overlay.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeNav);
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeNav();
  });

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
    document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
  } else {
    showAll();
  }
  setTimeout(function () { if (!seenAny) showAll(); }, 1600);
  window.addEventListener("scroll", sweep, { passive: true });

  /* ----- plate slider ----- */
  var plates = document.querySelectorAll(".plate[data-plate]");
  var plateIdx = 0;
  function showPlate(i) {
    if (!plates.length) return;
    plateIdx = (i + plates.length) % plates.length;
    plates.forEach(function (p, n) {
      p.classList.toggle("is-active", n === plateIdx);
    });
  }
  showPlate(0);
  var prev = document.querySelector("[data-plate-prev]");
  var next = document.querySelector("[data-plate-next]");
  if (prev) prev.addEventListener("click", function () { showPlate(plateIdx - 1); });
  if (next) next.addEventListener("click", function () { showPlate(plateIdx + 1); });
  if (plates.length && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    setInterval(function () { showPlate(plateIdx + 1); }, 4200);
  }

  /* ----- reviews ----- */
  var slides = document.querySelectorAll(".review-slide");
  var dots = document.querySelectorAll(".review-dots button");
  var revIdx = 0;
  function showReview(i) {
    if (!slides.length) return;
    revIdx = (i + slides.length) % slides.length;
    slides.forEach(function (s, n) { s.classList.toggle("is-on", n === revIdx); });
    dots.forEach(function (d, n) { d.classList.toggle("is-on", n === revIdx); });
  }
  showReview(0);
  dots.forEach(function (d, n) {
    d.addEventListener("click", function () { showReview(n); });
  });
  if (slides.length > 1 && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    setInterval(function () { showReview(revIdx + 1); }, 5500);
  }

  /* ----- stats ----- */
  var counted = false;
  function animateCount(el) {
    var target = parseFloat(el.getAttribute("data-count")) || 0;
    var decimals = el.getAttribute("data-decimals");
    var suffix = el.getAttribute("data-suffix") || "";
    var start = 0;
    var dur = 1100;
    var t0 = null;
    function frame(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = start + (target - start) * eased;
      el.textContent = (decimals ? val.toFixed(parseInt(decimals, 10)) : String(Math.round(val))) + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  function maybeCount() {
    if (counted) return;
    var first = document.querySelector(".stat strong[data-count]");
    if (!first || !inViewport(first)) return;
    counted = true;
    document.querySelectorAll(".stat strong[data-count]").forEach(animateCount);
  }
  window.addEventListener("scroll", maybeCount, { passive: true });
  maybeCount();

  /* ----- newsletter ----- */
  var news = document.getElementById("newsForm");
  if (news) {
    news.addEventListener("submit", function (e) {
      e.preventDefault();
      var email = document.getElementById("newsEmail");
      if (!email || !email.value) return;
      window.location.href =
        "mailto:hello@zaridining.com?subject=" +
        encodeURIComponent("ZARI evening list") +
        "&body=" + encodeURIComponent("Please add me to the ZARI list: " + email.value);
    });
  }
})();
