/* Boot: age gate, header, cart drawer, checkout */

(function () {
  'use strict';
  if (!/\.html$/i.test(location.pathname) && !/\/$/.test(location.pathname)) {
    history.replaceState(null, '', location.pathname + '/' + location.search + location.hash);
  }
  if (!window.CR) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

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

  var menuBtn = document.querySelector('.menu-btn');
  var mobileMenu = document.getElementById('mobileMenu');
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', function () {
      var open = mobileMenu.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
      mobileMenu.setAttribute('aria-hidden', String(!open));
    });
    mobileMenu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        mobileMenu.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
        mobileMenu.setAttribute('aria-hidden', 'true');
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
  function setAgeA11y(open) {
    if (!ageGate) return;
    ageGate.setAttribute('aria-hidden', String(!open));
    if (open) {
      ageGate.removeAttribute('inert');
    } else {
      ageGate.setAttribute('inert', '');
    }
  }
  if (ageGate && !ageOk()) {
    ageGate.hidden = false;
    setAgeA11y(true);
    document.body.classList.add('no-scroll');
    var enter = document.getElementById('ageEnter');
    var leave = document.getElementById('ageLeave');
    var deny = document.getElementById('ageDeny');
    if (enter) {
      enter.addEventListener('click', function () {
        setAgeOk();
        ageGate.hidden = true;
        setAgeA11y(false);
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
    setAgeA11y(false);
  }

  /* Toast */
  var toast = document.getElementById('crToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'crToast';
    toast.className = 'cr-toast';
    toast.hidden = true;
    toast.setAttribute('role', 'status');
    document.body.appendChild(toast);
  }
  function showToast(msg) {
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(function () { toast.hidden = true; }, 4200);
  }

  /* Cart UI */
  var veil = document.getElementById('cartVeil');
  var drawer = document.getElementById('cartDrawer');
  var linesEl = document.getElementById('cartLines');
  var emptyEl = document.getElementById('cartEmpty');
  var tailEl = document.getElementById('cartTail');
  var countEls = document.querySelectorAll('.cart-count');
  var form = document.getElementById('checkoutForm');

  if (form && !form.querySelector('#shipStreet')) {
    form.innerHTML =
      '<label>Full name<input id="shipName" name="name" autocomplete="name" required></label>' +
      '<label>Street address<input id="shipStreet" name="street" autocomplete="street-address" required></label>' +
      '<label>City<input id="shipCity" name="city" autocomplete="address-level2" required></label>' +
      '<div class="form-row">' +
        '<label>ZIP<input id="shipZip" name="zip" inputmode="numeric" autocomplete="postal-code" required></label>' +
        '<label>State<select id="shipState" name="state" required></select></label>' +
      '</div>' +
      '<label class="check-row"><input type="checkbox" id="shipSig" required> I am 21+ and will provide signature on delivery</label>' +
      '<label>Email for confirmation<input id="shipEmail" name="email" type="email" autocomplete="email" required></label>';
  }

  function openCart() {
    if (!drawer) return;
    drawer.hidden = false;
    drawer.setAttribute('aria-hidden', 'false');
    if (veil) veil.hidden = false;
    requestAnimationFrame(function () { drawer.classList.add('open'); });
    document.body.classList.add('no-scroll');
    renderCart();
  }

  function closeCart() {
    if (!drawer) return;
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
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

  function ensureSumRows() {
    var sums = document.getElementById('cartSums');
    if (!sums) return;
    if (!document.getElementById('sumHazmat')) {
      sums.innerHTML =
        '<div><span>Goods</span><strong id="sumGoods">$0.00</strong></div>' +
        '<div><span>Hazmat fee</span><strong id="sumHazmat">$0.00</strong></div>' +
        '<div><span>Ground shipping</span><strong id="sumShip">$0.00</strong></div>' +
        '<div class="total"><span>Total</span><strong id="sumTotal">$0.00</strong></div>';
    }
  }

  function renderCart() {
    if (!linesEl) return;
    ensureSumRows();
    var items = window.CR.loadCart();
    updateCounts();

    var success = document.getElementById('orderSuccess');
    if (items.length && success) {
      success.hidden = true;
      delete success.dataset.keep;
      if (form) form.hidden = false;
      var sumsReset = document.getElementById('cartSums');
      if (sumsReset) sumsReset.hidden = false;
      var noteReset = document.getElementById('shipNote');
      if (noteReset) noteReset.hidden = false;
      if (placeBtn) placeBtn.hidden = false;
    } else if (success && !success.dataset.keep) {
      success.hidden = true;
    }

    if (!items.length) {
      linesEl.innerHTML = '';
      if (success && !success.hidden) {
        if (emptyEl) emptyEl.hidden = true;
        if (tailEl) tailEl.hidden = false;
        return;
      }
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
    var haz = window.CR.hazmatFee(items);
    var ship = window.CR.shippingCost(items, goods);
    var goodsEl = document.getElementById('sumGoods');
    var hazEl = document.getElementById('sumHazmat');
    var shipEl = document.getElementById('sumShip');
    var totalEl = document.getElementById('sumTotal');
    if (goodsEl) goodsEl.textContent = window.CR.money(goods);
    if (hazEl) hazEl.textContent = haz === 0 ? '—' : window.CR.money(haz);
    if (shipEl) shipEl.textContent = !items.length ? '$0.00' : (ship === 0 ? 'Free' : window.CR.money(ship));
    if (totalEl) totalEl.textContent = window.CR.money(goods + haz + ship);

    var note = document.getElementById('shipNote');
    if (note && window.CR_SHIP) {
      note.textContent = window.CR.hasHazmat(items)
        ? window.CR_SHIP.copy.ground + ' ' + window.CR_SHIP.copy.hazmat
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

  var stateSelect = document.getElementById('shipState');
  if (stateSelect && window.CR_STATES) {
    stateSelect.innerHTML =
      '<option value="">State</option>' +
      window.CR_STATES.map(function (s) {
        return '<option value="' + s + '">' + s + '</option>';
      }).join('');

    stateSelect.addEventListener('change', function () {
      var result = window.CR.purgeBlockedForState(stateSelect.value);
      if (result.removed.length) {
        showToast((window.CR_SHIP && window.CR_SHIP.copy.purged) + ' Removed: ' + result.removed.join(', '));
        renderCart();
      }
      var err = document.getElementById('shipError');
      if (err) err.hidden = true;
    });
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
      var street = ((document.getElementById('shipStreet') || {}).value || '').trim();
      var city = ((document.getElementById('shipCity') || {}).value || '').trim();
      var email = ((document.getElementById('shipEmail') || {}).value || '').trim();
      var sig = document.getElementById('shipSig');

      function fail(msg) {
        if (err) {
          err.hidden = false;
          err.textContent = msg;
        }
      }

      if (!items.length) {
        fail('Cart is empty.');
        return;
      }
      if (!name || !street || !city || !zip || !state || !email) {
        fail('Enter name, address, city, ZIP, state, and email.');
        return;
      }
      if (sig && !sig.checked) {
        fail('Confirm you are 21+ and will sign for delivery.');
        return;
      }
      if (!/^\d{5}(-\d{4})?$/.test(zip)) {
        fail('Enter a valid US ZIP code.');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        fail('Enter a valid email for the confirmation.');
        return;
      }

      var check = window.CR.canShipToState(state, items);
      if (!check.ok) {
        fail(check.msg);
        return;
      }

      if (err) err.hidden = true;
      var goods = window.CR.cartGoods(items);
      var haz = window.CR.hazmatFee(items);
      var ship = window.CR.shippingCost(items, goods);
      var total = goods + haz + ship;
      var orderId = 'CR-' + Date.now().toString(36).toUpperCase();
      var snapshot = {
        id: orderId,
        email: email,
        name: name,
        street: street,
        city: city,
        state: state,
        zip: zip,
        lines: items.map(function (l) {
          return { name: l.name, qty: l.qty, unit: l.unit };
        }),
        goods: goods,
        hazmat: haz,
        ship: ship,
        total: total
      };
      try { sessionStorage.setItem('cr.lastOrder', JSON.stringify(snapshot)); } catch (e) { /* */ }

      window.CR.clearCart();
      linesEl.innerHTML = '';
      if (emptyEl) emptyEl.hidden = true;
      if (tailEl) {
        tailEl.hidden = false;
        if (success) {
          success.hidden = false;
          success.dataset.keep = '1';
          success.innerHTML =
            '<strong>Order ' + orderId + ' received.</strong><br>' +
            'Confirmation sent to ' + window.CR.esc(email) + '. ' +
            'Ship-to: ' + window.CR.esc(name) + ', ' + window.CR.esc(street) + ', ' + window.CR.esc(city) + ' ' + window.CR.esc(state) + ' ' + window.CR.esc(zip) + '. ' +
            'Total ' + window.CR.money(total) + ' (goods + hazmat + ground). ' +
            '<a href="order.html">View printable receipt</a>. Ground only · signature required.';
        }
        if (form) form.hidden = true;
        var sums = document.getElementById('cartSums');
        if (sums) sums.hidden = true;
        var note = document.getElementById('shipNote');
        if (note) note.hidden = true;
        placeBtn.hidden = true;
      }
      updateCounts();
    });
  }

  /* Home finder → shop */
  var homeFinder = document.getElementById('finderInput');
  var homeFinderBtn = document.getElementById('finderGo');
  if (homeFinder && homeFinderBtn) {
    homeFinderBtn.addEventListener('click', function (e) {
      e.preventDefault();
      var q = homeFinder.value.trim();
      location.href = 'shop.html' + (q ? ('?q=' + encodeURIComponent(q)) : '');
    });
    homeFinder.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        homeFinderBtn.click();
      }
    });
  }

  document.querySelectorAll('.chip[data-caliber]').forEach(function (btn) {
    if (document.getElementById('productGrid')) return;
    btn.addEventListener('click', function () {
      location.href = 'shop.html?q=' + encodeURIComponent(btn.getAttribute('data-caliber'));
    });
  });

  updateCounts();
  if (drawer) drawer.setAttribute('aria-hidden', drawer.hidden ? 'true' : 'false');
})();
