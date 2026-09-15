/* DAL — age gate, nav, cart, reveals */
(function () {
  "use strict";
  var root = document.documentElement;
  root.classList.remove("no-js");

  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  /* age gate */
  var gate = document.getElementById("ageGate");
  var passed = false;
  try { passed = sessionStorage.getItem("dal-age") === "1"; } catch (e) {}
  if (passed && gate) gate.classList.add("is-gone");
  var yes = document.querySelector("[data-age-yes]");
  var no = document.querySelector("[data-age-no]");
  if (yes) {
    yes.addEventListener("click", function () {
      try { sessionStorage.setItem("dal-age", "1"); } catch (e) {}
      if (gate) gate.classList.add("is-gone");
    });
  }
  if (no) {
    no.addEventListener("click", function () {
      window.location.href = "https://www.google.com";
    });
  }

  /* header */
  var head = document.querySelector(".site-header");
  function onScroll() {
    if (head) head.classList.toggle("scrolled", window.scrollY > 20);
    var top = document.querySelector(".to-top");
    if (top) top.classList.toggle("is-show", window.scrollY > 600);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  var toTop = document.querySelector(".to-top");
  if (toTop) toTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  /* nav */
  var overlay = document.querySelector(".nav-overlay");
  var openNav = document.querySelector(".menu-btn");
  var closeNavBtn = document.querySelector("[data-close-nav]");
  var scrollY = 0;
  function lock() {
    scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = "-" + scrollY + "px";
    document.body.style.width = "100%";
  }
  function unlock() {
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.width = "";
    window.scrollTo(0, scrollY);
  }
  function showNav() {
    if (!overlay) return;
    lock();
    overlay.classList.add("is-open");
    if (openNav) openNav.setAttribute("aria-expanded", "true");
  }
  function hideNav() {
    if (!overlay) return;
    overlay.classList.remove("is-open");
    unlock();
    if (openNav) openNav.setAttribute("aria-expanded", "false");
  }
  if (openNav) openNav.addEventListener("click", showNav);
  if (closeNavBtn) closeNavBtn.addEventListener("click", hideNav);
  if (overlay) {
    overlay.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", hideNav);
    });
  }

  /* cart */
  var cart = [];
  try {
    cart = JSON.parse(localStorage.getItem("dal-cart") || "[]");
    if (!Array.isArray(cart)) cart = [];
  } catch (e) { cart = []; }

  var drawer = document.getElementById("cartDrawer");
  var cartBtn = document.querySelector(".cart-btn");
  var closeCart = document.querySelector("[data-close-cart]");
  var countEl = document.querySelector(".cart-count");
  var listEl = document.getElementById("cartList");
  var totalEl = document.getElementById("cartTotal");
  var toast = document.getElementById("toast");

  function save() {
    try { localStorage.setItem("dal-cart", JSON.stringify(cart)); } catch (e) {}
  }
  function renderCart() {
    var n = cart.reduce(function (s, i) { return s + i.qty; }, 0);
    if (countEl) {
      countEl.textContent = String(n);
      countEl.hidden = n === 0;
    }
    if (!listEl) return;
    if (!cart.length) {
      listEl.innerHTML = '<p class="cart-empty">Your bag is empty.</p>';
    } else {
      listEl.innerHTML = cart.map(function (i) {
        return '<div class="cart-item"><span>' + i.name + " × " + i.qty + '</span><span>$' + (i.price * i.qty).toFixed(0) + "</span></div>";
      }).join("");
    }
    var total = cart.reduce(function (s, i) { return s + i.price * i.qty; }, 0);
    if (totalEl) totalEl.textContent = "$" + total.toFixed(0);
  }
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("is-show");
    setTimeout(function () { toast.classList.remove("is-show"); }, 1600);
  }
  function openCart() {
    if (!drawer) return;
    lock();
    drawer.classList.add("is-open");
  }
  function hideCart() {
    if (!drawer) return;
    drawer.classList.remove("is-open");
    unlock();
  }
  if (cartBtn) cartBtn.addEventListener("click", openCart);
  if (closeCart) closeCart.addEventListener("click", hideCart);

  document.querySelectorAll("[data-add]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var name = btn.getAttribute("data-add");
      var price = parseFloat(btn.getAttribute("data-price") || "0");
      var found = cart.find(function (i) { return i.name === name; });
      if (found) found.qty += 1;
      else cart.push({ name: name, price: price, qty: 1 });
      save();
      renderCart();
      showToast("Added to bag");
    });
  });

  var checkout = document.getElementById("checkoutBtn");
  if (checkout) {
    checkout.addEventListener("click", function () {
      if (!cart.length) return;
      var body = cart.map(function (i) {
        return i.name + " × " + i.qty + " — $" + (i.price * i.qty).toFixed(0);
      }).join("\n");
      window.location.href =
        "mailto:order@dalspirits.com?subject=" +
        encodeURIComponent("DAL order request") +
        "&body=" + encodeURIComponent(body + "\n\nTotal: " + (totalEl ? totalEl.textContent : ""));
    });
  }
  renderCart();

  /* reveals */
  var io = null, seen = false;
  function showAll() {
    document.querySelectorAll(".reveal:not(.is-in)").forEach(function (el) {
      el.classList.add("is-in");
    });
  }
  if ("IntersectionObserver" in window) {
    io = new IntersectionObserver(function (entries) {
      seen = true;
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -5% 0px" });
    document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
  } else showAll();
  setTimeout(function () { if (!seen) showAll(); }, 1500);

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { hideNav(); hideCart(); }
  });
})();
