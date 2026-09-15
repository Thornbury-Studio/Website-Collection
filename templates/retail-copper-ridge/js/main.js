/* Boot: age gate, header, cart drawer, checkout */

(function () {
  'use strict';
  if (!window.CR) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Year */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* Reveal */
  if (!reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('visible'); });
  }

  /* Progress + hide header */
  var progress = document.getElementById('progress');
  var header = document.getElementById('siteHeader');
  var lastY = 0;
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var max = document.documentElement.scrollHeight - innerHeight;
      if (progress) progress.style.transform = 'scaleX(' + (max > 0 ? scrollY / max : 0) + ')';
      if (header) {
        header.classList.toggle('is-hidden', scrollY > lastY && scrollY > 420);
        lastY = Math.max(0, scrollY);
      }
      ticking = false;
    });
  }, { passive: true });

  /* Mobile menu */
  var menuBtn = document.querySelector('.menu-btn');
  var mobileMenu = document.getElementById('mobileMenu');
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', function () {
      var open = mobileMenu.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
    });
    mobileMenu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        mobileMenu.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* Age gate */
  var ageGate = document.getElementById('ageGate');
  function ageOk() {
    try { return sessionStorage.getItem(window.CR.AGE_KEY) === '1'; } catch (e) { return false; }
  }
  function setAgeOk() {
    try { sessionStorage.setItem(window.CR.AGE_KEY, '1'); } catch (e) { /* */ }
  }
  if (ageGate && !ageOk()) {
    ageGate.hidden = false;
    document.body.classList.add('no-scroll');
    var enter = document.getElementById('ageEnter');
    var leave = document.getElementById('ageLeave');
    var deny = document.getElementById('ageDeny');
    if (enter) {
      enter.addEventListener('click', function () {
        setAgeOk();
        ageGate.hidden = true;
        document.body.classList.remove('no-scroll');
      });
      enter.focus();
    }
    if (leave) {
      leave.addEventListener('click', function () {
        if (deny) deny.hidden = false;
      });
    }
  } else if (ageGate) {
    ageGate.hidden = true;
  }

  /* Cart UI */
  var veil = document.getElementById('cartVeil');
  var drawer = document.getElementById('cartDrawer');
  var linesEl = document.getElementById('cartLines');
  var emptyEl = document.getElementById('cartEmpty');
  var tailEl = document.getElementById('cartTail');
  var countEls = document.querySelectorAll('.cart-count');

  function openCart() {
    if (!drawer) return;
    drawer.hidden = false;
    if (veil) veil.hidden = false;
    requestAnimationFrame(function () { drawer.classList.add('open'); });
    document.body.classList.add('no-scroll');
    renderCart();
  }

  function closeCart() {
    if (!drawer) return;
    drawer.classList.remove('open');
    document.body.classList.remove('no-scroll');
    setTimeout(function () {
      drawer.hidden = true;
      if (veil) veil.hidden = true;
    }, 380);
  }

  function updateCounts() {
    var n = window.CR.cartCount(window.CR.loadCart());
    countEls.forEach(function (el) { el.textContent = String(n); });
  }

  function renderCart() {
    if (!linesEl) return;
    var items = window.CR.loadCart();
    updateCounts();

    var success = document.getElementById('orderSuccess');
    if (success) success.hidden = true;

    if (!items.length) {
      linesEl.innerHTML = '';
      if (emptyEl) emptyEl.hidden = false;
      if (tailEl) tailEl.hidden = true;
      return;
    }
    if (emptyEl) emptyEl.hidden = true;
    if (tailEl) tailEl.hidden = false;

    linesEl.innerHTML = items.map(function (l) {
      return (
        '<li class="cart-line" data-id="' + window.CR.esc(l.id) + '">' +
          '<img src="' + window.CR.esc(l.img) + '" alt="" width="72" height="54">' +
          '<div><h3>' + window.CR.esc(l.name) + '</h3>' +
            '<div class="meta">' + window.CR.esc(l.sku) + '</div>' +
            '<div class="qty-row">' +
              '<button type="button" data-dec aria-label="Decrease">−</button>' +
              '<span>' + l.qty + '</span>' +
              '<button type="button" data-inc aria-label="Increase">+</button>' +
              '<button type="button" data-rm style="margin-left:8px;border:0;text-decoration:underline;font:500 11px var(--cond);letter-spacing:.06em;text-transform:uppercase;color:var(--danger)">Remove</button>' +
            '</div></div>' +
          '<strong>' + window.CR.money(l.unit * l.qty) + '</strong>' +
        '</li>'
      );
    }).join('');

    var goods = window.CR.cartGoods(items);
    var ship = window.CR.shippingCost(items, goods);
    var goodsEl = document.getElementById('sumGoods');
    var shipEl = document.getElementById('sumShip');
    var totalEl = document.getElementById('sumTotal');
    if (goodsEl) goodsEl.textContent = window.CR.money(goods);
    if (shipEl) shipEl.textContent = ship === 0 ? 'Free' : window.CR.money(ship);
    if (totalEl) totalEl.textContent = window.CR.money(goods + ship);

    var note = document.getElementById('shipNote');
    if (note && window.CR_SHIP) {
      note.textContent = window.CR.hasHazmat(items)
        ? window.CR_SHIP.copy.ground
        : 'Standard ground shipping. Free over $200.';
    }
  }

  if (linesEl) {
    linesEl.addEventListener('click', function (e) {
      var li = e.target.closest('.cart-line');
      if (!li) return;
      var id = li.getAttribute('data-id');
      var items = window.CR.loadCart();
      var line = items.find(function (l) { return l.id === id; });
      if (!line) return;
      if (e.target.closest('[data-inc]')) window.CR.setQty(id, line.qty + 1);
      if (e.target.closest('[data-dec]')) window.CR.setQty(id, line.qty - 1);
      if (e.target.closest('[data-rm]')) window.CR.removeLine(id);
      renderCart();
    });
  }

  document.querySelectorAll('[data-cart-open]').forEach(function (btn) {
    btn.addEventListener('click', openCart);
  });
  document.querySelectorAll('[data-cart-close]').forEach(function (btn) {
    btn.addEventListener('click', closeCart);
  });
  if (veil) veil.addEventListener('click', closeCart);

  document.addEventListener('cr:cartchange', function () {
    updateCounts();
    if (drawer && !drawer.hidden) renderCart();
  });
  document.addEventListener('cr:opencart', openCart);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeCart();
  });

  /* Checkout */
  var stateSelect = document.getElementById('shipState');
  if (stateSelect && window.CR_STATES) {
    stateSelect.innerHTML =
      '<option value="">State</option>' +
      window.CR_STATES.map(function (s) {
        return '<option value="' + s + '">' + s + '</option>';
      }).join('');
  }

  var placeBtn = document.getElementById('placeOrder');
  if (placeBtn) {
    placeBtn.addEventListener('click', function () {
      var items = window.CR.loadCart();
      var err = document.getElementById('shipError');
      var success = document.getElementById('orderSuccess');
      var state = (document.getElementById('shipState') || {}).value || '';
      var zip = ((document.getElementById('shipZip') || {}).value || '').trim();
      var name = ((document.getElementById('shipName') || {}).value || '').trim();

      if (!name || !zip || !state) {
        if (err) {
          err.hidden = false;
          err.textContent = 'Enter name, ZIP, and state to place the order.';
        }
        return;
      }
      if (!/^\d{5}(-\d{4})?$/.test(zip)) {
        if (err) {
          err.hidden = false;
          err.textContent = 'Enter a valid US ZIP code.';
        }
        return;
      }

      var check = window.CR.canShipToState(state, items);
      if (!check.ok) {
        if (err) {
          err.hidden = false;
          err.textContent = check.msg;
        }
        return;
      }

      if (err) err.hidden = true;
      var orderId = 'CR-' + Date.now().toString(36).toUpperCase();
      window.CR.clearCart();
      renderCart();
      if (emptyEl) emptyEl.hidden = true;
      if (tailEl) {
        tailEl.hidden = false;
        if (success) {
          success.hidden = false;
          success.textContent =
            'Order ' + orderId + ' received. We will charge your card at fulfillment and email a hazmat tracking number. Ground only.';
        }
        var form = document.getElementById('checkoutForm');
        if (form) form.hidden = true;
        var sums = document.getElementById('cartSums');
        if (sums) sums.hidden = true;
        placeBtn.hidden = true;
      }
      updateCounts();
    });
  }

  updateCounts();
})();
