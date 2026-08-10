/* =====================================================================
   KIYO 清 — ordering flow.
   No dependencies. The menu renders from KIYO_MENU; the cart lives in
   localStorage so a refresh mid-order loses nothing. Checkout validates
   like the real thing and, deliberately, submits to nothing.
   ===================================================================== */
(function () {
  'use strict';

  var MENU = window.KIYO_MENU || [];
  var byId = {};
  MENU.forEach(function (m) { byId[m.id] = m; });

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (id) { return document.getElementById(id); };
  var money = function (cents) { return '$' + (cents / 100).toFixed(2); };

  var TAX = 0.08;
  var DELIVERY_FEE = 390;

  /* ==================================================================
     1. Render the menu
     ================================================================== */

  var TAG_LABEL = { vegetarian: ['veg', 'V'], vegan: ['vegan', 'VG'], 'gluten-free': ['gf', 'GF'], spicy: ['spicy', '辛'] };

  function tagChips(tags) {
    return tags.map(function (t) {
      var d = TAG_LABEL[t];
      return d ? '<span class="item-tag ' + d[0] + '">' + d[1] + '</span>' : '';
    }).join('');
  }

  function renderMenu() {
    var grids = {};
    [].slice.call(document.querySelectorAll('.grid[data-cat]')).forEach(function (g) {
      grids[g.getAttribute('data-cat')] = g;
    });
    var lastSub = '';
    MENU.forEach(function (m) {
      var g = grids[m.cat];
      if (!g) return;
      if (m.sub && m.sub !== lastSub) {
        var sh = document.createElement('p');
        sh.className = 'drinks-sub';
        sh.textContent = m.sub;
        g.appendChild(sh);
        lastSub = m.sub;
      }
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'item';
      b.setAttribute('data-id', m.id);
      b.setAttribute('data-tags', m.tags.join(' '));
      b.setAttribute('aria-label', m.name + ', ' + money(m.price) + ', view options');
      b.innerHTML =
        '<span class="item-info">' +
          '<span class="item-name">' + m.name + '<span lang="ja">' + m.jp + '</span></span>' +
          '<span class="item-desc">' + m.desc + '</span>' +
          '<span class="item-foot"><span class="item-price">' + money(m.price) + '</span>' +
          '<span class="item-tags">' + tagChips(m.tags) + '</span></span>' +
        '</span>' +
        '<span class="item-media">' +
          '<img src="' + m.img + '" alt="" width="96" height="96" loading="lazy" decoding="async">' +
          '<span class="item-add" aria-hidden="true">+</span>' +
        '</span>';
      b.addEventListener('click', function () { openMod(m.id); });
      g.appendChild(b);
    });
  }
  renderMenu();

  /* ==================================================================
     2. Header, tabs, scrollspy
     ================================================================== */

  var hd = $('hd');
  var tabs = [].slice.call(document.querySelectorAll('.tab'));
  var ink = $('tabInk');
  var cats = [].slice.call(document.querySelectorAll('.cat'));

  function setTab(cat) {
    tabs.forEach(function (t) {
      var on = t.getAttribute('data-cat') === cat;
      t.classList.toggle('is-active', on);
      if (on && ink) {
        ink.style.width = t.offsetWidth * 0.55 + 'px';
        ink.style.transform = 'translateX(' + (t.offsetLeft + t.offsetWidth * 0.225) + 'px)';
        // keep the active tab in view when the row scrolls horizontally
        t.parentElement.scrollTo({ left: t.offsetLeft - 60, behavior: reduced ? 'auto' : 'smooth' });
      }
    });
  }

  window.addEventListener('scroll', function () {
    if (hd) hd.classList.toggle('is-stuck', window.scrollY > 8);
    var line = window.scrollY + 140;
    var current = 'mains';
    cats.forEach(function (c) { if (c.offsetTop <= line) current = c.id.replace('c-', ''); });
    if (!tabs.some(function (t) { return t.classList.contains('is-active') && t.getAttribute('data-cat') === current; })) {
      setTab(current);
    }
  }, { passive: true });

  window.addEventListener('load', function () { setTab('mains'); });
  window.addEventListener('resize', function () {
    var on = tabs.filter(function (t) { return t.classList.contains('is-active'); })[0];
    if (on) setTab(on.getAttribute('data-cat'));
  });

  /* ==================================================================
     3. Dietary filters
     ================================================================== */

  var chips = [].slice.call(document.querySelectorAll('.chip'));
  var filterLive = $('filterLive');

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      chips.forEach(function (c) {
        var on = c === chip;
        c.classList.toggle('is-on', on);
        c.setAttribute('aria-pressed', String(on));
      });
      var f = chip.getAttribute('data-filter');
      var shown = 0, total = 0;
      [].slice.call(document.querySelectorAll('.item')).forEach(function (el) {
        total++;
        var tags = (el.getAttribute('data-tags') || '').split(' ');
        var hit = f === 'all' || tags.indexOf(f) !== -1 ||
                  (f === 'spicy' && tags.indexOf('spicy-option') !== -1) ||
                  (f === 'vegetarian' && tags.indexOf('vegan') !== -1) ||
                  (f === 'gluten-free' && tags.indexOf('gluten-free-option') !== -1);
        el.classList.toggle('is-dim', !hit);
        if (hit) shown++;
      });
      if (filterLive) {
        filterLive.textContent = f === 'all'
          ? 'Showing all ' + total + ' items.'
          : shown + ' of ' + total + ' items match ' + chip.textContent.trim() + '.';
      }
    });
  });

  /* ==================================================================
     4. Modifier drawer
     ================================================================== */

  var modDrawer = $('modDrawer'), modVeil = $('modVeil');
  var modForm = $('modForm');
  var qty = 1;
  var currentItem = null;
  var lastFocus = null;

  function openMod(id) {
    var m = byId[id];
    if (!m) return;
    currentItem = m;
    qty = 1;
    $('qtyOut').textContent = '1';
    $('modImg').src = m.img;
    $('modTitle').textContent = m.name;
    $('modJp').textContent = m.jp;
    $('modDesc').textContent = m.desc;

    modForm.innerHTML = m.mods.map(function (g, gi) {
      var name = 'g' + gi;
      var input = g.type === 'pick'
        ? '<input type="radio" name="' + name + '" value="%i"%c>'
        : '<input type="checkbox" name="' + name + '" value="%i">';
      return '<fieldset class="mgroup"><legend>' + g.name +
        (g.type === 'pick' ? '<small>choose one</small>' : '<small>optional</small>') +
        '</legend><div class="mrow">' +
        g.options.map(function (o, oi) {
          return '<label class="mopt">' +
            input.replace('%i', oi).replace('%c', oi === 0 ? ' checked' : '') +
            '<span class="mopt-name">' + o[0] + '</span>' +
            '<span class="mopt-price">' + (o[1] ? '+' + money(o[1]) : '') + '</span>' +
            '</label>';
        }).join('') +
        '</div></fieldset>';
    }).join('');

    modForm.addEventListener('change', updateModPrice);
    updateModPrice();

    lastFocus = document.activeElement;
    show(modVeil); show(modDrawer);
    document.body.style.overflow = 'hidden';
    $('modClose').focus();
  }

  function readMods() {
    if (!currentItem) return { picked: [], extra: 0 };
    var picked = [], extra = 0;
    currentItem.mods.forEach(function (g, gi) {
      [].slice.call(modForm.querySelectorAll('[name="g' + gi + '"]:checked')).forEach(function (inp) {
        var o = g.options[+inp.value];
        // default radio choices are noise on a ticket; record non-defaults and all adds
        if (g.type === 'add' || +inp.value !== 0) picked.push(o[0]);
        extra += o[1];
      });
    });
    return { picked: picked, extra: extra };
  }

  function updateModPrice() {
    if (!currentItem) return;
    var r = readMods();
    $('modPrice').textContent = money((currentItem.price + r.extra) * qty);
  }

  $('qtyPlus').addEventListener('click', function () { qty = Math.min(qty + 1, 12); $('qtyOut').textContent = qty; updateModPrice(); });
  $('qtyMinus').addEventListener('click', function () { qty = Math.max(qty - 1, 1); $('qtyOut').textContent = qty; updateModPrice(); });

  $('modAdd').addEventListener('click', function () {
    if (!currentItem) return;
    var r = readMods();
    addToCart(currentItem.id, qty, r.picked, currentItem.price + r.extra);
    closeOver(modDrawer, modVeil);
    toast(currentItem.name + ' added');
  });

  /* ==================================================================
     5. Cart
     ================================================================== */

  var KEY = 'kiyo.cart.v1';
  var cart = [];
  try { cart = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { cart = []; }
  // drop anything that no longer matches the menu (stale storage)
  cart = cart.filter(function (l) { return byId[l.id]; });

  function saveCart() { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) {} }

  function addToCart(id, n, mods, unit) {
    var sig = id + '|' + mods.join(',');
    var line = cart.filter(function (l) { return l.sig === sig; })[0];
    if (line) line.n += n;
    else cart.push({ sig: sig, id: id, n: n, mods: mods, unit: unit });
    saveCart();
    paintCart(true);
  }

  function cartCount() { return cart.reduce(function (a, l) { return a + l.n; }, 0); }
  function cartSub()   { return cart.reduce(function (a, l) { return a + l.unit * l.n; }, 0); }

  var cartbar = $('cartbar'), hdCartN = $('hdCartN');

  function paintCart(popped) {
    var n = cartCount(), sub = cartSub();

    if (hdCartN) { hdCartN.hidden = n === 0; hdCartN.textContent = n; }
    if (cartbar) {
      cartbar.hidden = n === 0;
      $('cartbarN').textContent = n;
      $('cartbarTotal').textContent = money(sub);
      if (popped && !reduced) {
        cartbar.classList.remove('is-pop');
        void cartbar.offsetWidth;
        cartbar.classList.add('is-pop');
      }
    }

    var list = $('cartList');
    if (list) {
      list.innerHTML = cart.map(function (l, i) {
        var m = byId[l.id];
        return '<li class="cline">' +
          '<img src="' + m.img + '" alt="" width="54" height="54" loading="lazy">' +
          '<span><span class="cline-name">' + m.name + '</span>' +
          (l.mods.length ? '<span class="cline-mods">' + l.mods.join(' · ') + '</span>' : '') +
          '</span>' +
          '<span class="cline-right">' +
            '<span class="cline-price">' + money(l.unit * l.n) + '</span>' +
            '<span class="cline-qty">' +
              '<button type="button" data-dec="' + i + '" aria-label="Remove one ' + m.name + '">&minus;</button>' +
              '<output aria-live="polite">' + l.n + '</output>' +
              '<button type="button" data-inc="' + i + '" aria-label="Add one ' + m.name + '">+</button>' +
            '</span>' +
          '</span></li>';
      }).join('');
    }
    $('cartEmpty').hidden = n !== 0;
    $('cartSums').style.display = n === 0 ? 'none' : '';
    $('toCheckout').disabled = n === 0;
    $('toCheckout').style.opacity = n === 0 ? '.4' : '';

    var tax = Math.round(cartSub() * TAX);
    $('sumSub').textContent = money(sub);
    $('sumTax').textContent = money(tax);
    $('sumTotal').textContent = money(sub + tax);
  }

  $('cartList').addEventListener('click', function (ev) {
    var inc = ev.target.getAttribute('data-inc');
    var dec = ev.target.getAttribute('data-dec');
    if (inc !== null) { cart[+inc].n = Math.min(cart[+inc].n + 1, 12); }
    if (dec !== null) {
      cart[+dec].n--;
      if (cart[+dec].n <= 0) cart.splice(+dec, 1);
    }
    if (inc !== null || dec !== null) { saveCart(); paintCart(false); }
  });

  $('cartClear').addEventListener('click', function () {
    cart = []; saveCart(); paintCart(false);
  });

  /* ==================================================================
     6. Overlays (shared open/close plumbing)
     ================================================================== */

  function show(el) { if (el) el.hidden = false; }

  function closeOver(drawer, veil) {
    if (drawer) drawer.hidden = true;
    if (veil) veil.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) { lastFocus.focus(); lastFocus = null; }
  }

  var cartDrawer = $('cartDrawer'), cartVeil = $('cartVeil');

  function openCart() {
    paintCart(false);
    lastFocus = document.activeElement;
    show(cartVeil); show(cartDrawer);
    document.body.style.overflow = 'hidden';
    $('cartClose').focus();
  }

  $('hdCart').addEventListener('click', openCart);
  cartbar.addEventListener('click', openCart);
  $('cartClose').addEventListener('click', function () { closeOver(cartDrawer, cartVeil); });
  $('modClose').addEventListener('click', function () { closeOver(modDrawer, modVeil); });
  modVeil.addEventListener('click', function () { closeOver(modDrawer, modVeil); });
  cartVeil.addEventListener('click', function () { closeOver(cartDrawer, cartVeil); });

  document.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Escape') return;
    if (!$('checkout').hidden) { $('coBack').click(); return; }
    if (!modDrawer.hidden) closeOver(modDrawer, modVeil);
    if (!cartDrawer.hidden) closeOver(cartDrawer, cartVeil);
  });

  /* ==================================================================
     7. Checkout
     ================================================================== */

  var checkout = $('checkout');
  var payMethod = 'card';

  $('toCheckout').addEventListener('click', function () {
    if (!cartCount()) return;
    closeOver(cartDrawer, cartVeil);
    buildTimes();
    paintSummary();
    show(checkout);
    document.body.style.overflow = 'hidden';
    $('coBack').focus();
  });

  $('coBack').addEventListener('click', function () {
    checkout.hidden = true;
    openCart();
  });

  /* fulfillment switches */
  var coWhen = $('coWhen'), coAddr = $('coAddr');
  [].slice.call(document.querySelectorAll('input[name="fulfil"]')).forEach(function (r) {
    r.addEventListener('change', function () {
      coWhen.hidden = r.value !== 'later';
      coAddr.hidden = r.value !== 'delivery';
      paintSummary();
    });
  });

  function buildTimes() {
    var sel = $('coTime');
    if (sel.options.length) return;
    // quarter-hour slots from 45 min out to close (21:30), demo-static
    var t = new Date();
    t.setMinutes(t.getMinutes() + 45);
    t.setMinutes(Math.ceil(t.getMinutes() / 15) * 15, 0, 0);
    for (var i = 0; i < 12; i++) {
      var h = t.getHours(), min = t.getMinutes();
      if (h >= 21 && min > 30) break;
      var label = (h % 12 || 12) + ':' + String(min).padStart(2, '0') + ' ' + (h < 12 ? 'AM' : 'PM');
      sel.appendChild(new Option(label, h + ':' + min));
      t.setMinutes(t.getMinutes() + 15);
    }
    if (!sel.options.length) sel.appendChild(new Option('Tomorrow 11:30 AM', 'tomorrow'));
  }

  /* demo address validation: format checks + a plausibility read-back */
  var adStreet = $('adStreet'), adZip = $('adZip'), addrCheck = $('addrCheck');
  var addrTimer = null;

  function checkAddress() {
    var street = adStreet.value.trim(), zip = adZip.value.trim();
    if (!street && !zip) { addrCheck.textContent = ''; addrCheck.className = 'addr-check'; return; }
    var streetOk = /^\d+\s+\S+/.test(street);
    var zipOk = /^97[0-9]{3}$/.test(zip);
    if (streetOk && zipOk) {
      addrCheck.textContent = '✓ In our delivery zone — about 35 minutes right now.';
      addrCheck.className = 'addr-check ok';
    } else if (zip.length === 5 && !zipOk) {
      addrCheck.textContent = 'That ZIP is outside our delivery zone (Portland 97xxx only).';
      addrCheck.className = 'addr-check bad';
    } else {
      addrCheck.textContent = 'Checking address…';
      addrCheck.className = 'addr-check';
    }
  }
  [adStreet, adZip].forEach(function (el) {
    el.addEventListener('input', function () {
      clearTimeout(addrTimer);
      addrTimer = setTimeout(checkAddress, 350);
    });
  });

  /* wallet buttons: selecting one sidelines the card box */
  function setPay(method) {
    payMethod = method;
    $('payApple').setAttribute('aria-pressed', String(method === 'apple'));
    $('payGoogle').setAttribute('aria-pressed', String(method === 'google'));
    $('cardBox').classList.toggle('is-off', method !== 'card');
    $('payNote').textContent = method === 'card'
      ? 'We accept Visa, Mastercard and American Express.'
      : 'You will be asked to confirm in ' +
        (method === 'apple' ? 'Apple Pay' : 'Google Pay') + '.';
  }
  $('payApple').addEventListener('click', function () { setPay(payMethod === 'apple' ? 'card' : 'apple'); });
  $('payGoogle').addEventListener('click', function () { setPay(payMethod === 'google' ? 'card' : 'google'); });

  /* live formatting for card fields */
  $('ccNum').addEventListener('input', function () {
    var d = this.value.replace(/\D/g, '').slice(0, 16);
    this.value = d.replace(/(.{4})/g, '$1 ').trim();
  });
  $('ccExp').addEventListener('input', function () {
    var d = this.value.replace(/\D/g, '').slice(0, 4);
    this.value = d.length > 2 ? d.slice(0, 2) + ' / ' + d.slice(2) : d;
  });
  $('ccCvc').addEventListener('input', function () {
    this.value = this.value.replace(/\D/g, '').slice(0, 4);
  });

  function paintSummary() {
    var f = document.querySelector('input[name="fulfil"]:checked').value;
    var sub = cartSub();
    var tax = Math.round(sub * TAX);
    var fee = f === 'delivery' ? DELIVERY_FEE : 0;
    var rows = cart.map(function (l) {
      return '<div class="row"><span>' + l.n + ' × ' + byId[l.id].name + '</span><span>' + money(l.unit * l.n) + '</span></div>';
    }).join('');
    rows += '<div class="row"><span>Tax (8%)</span><span>' + money(tax) + '</span></div>';
    if (fee) rows += '<div class="row"><span>Delivery</span><span>' + money(fee) + '</span></div>';
    rows += '<div class="row total"><span>Total</span><span>' + money(sub + tax + fee) + '</span></div>';
    $('coSummary').innerHTML = rows;
    $('coTotal').textContent = money(sub + tax + fee);
  }

  /* validation */
  function bad(id, errId, msg) {
    var el = $(id), er = $(errId);
    var wrap = el.closest('.fld');
    wrap.classList.add('is-bad');
    er.textContent = msg;
    return el;
  }
  function clearBad() {
    [].slice.call(checkout.querySelectorAll('.fld.is-bad')).forEach(function (f) { f.classList.remove('is-bad'); });
    [].slice.call(checkout.querySelectorAll('.err')).forEach(function (e) { e.textContent = ''; });
  }

  $('coForm').addEventListener('submit', function (ev) {
    ev.preventDefault();
    clearBad();
    var f = document.querySelector('input[name="fulfil"]:checked').value;
    var firstBad = null;
    var mark = function (el) { if (!firstBad) firstBad = el; };

    if ($('coName').value.trim().length < 2) mark(bad('coName', 'eName', 'Your name, so we can call the order.'));
    if (!/^[\d\s()+-]{7,}$/.test($('coPhone').value.trim())) mark(bad('coPhone', 'ePhone', 'A phone number we can text.'));
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test($('coEmail').value.trim())) mark(bad('coEmail', 'eEmail', 'That email does not look right.'));

    if (f === 'delivery') {
      if (!/^\d+\s+\S+/.test(adStreet.value.trim())) mark(bad('adStreet', 'eStreet', 'Street number and name, e.g. 214 Alder Street.'));
      if (!/^97[0-9]{3}$/.test(adZip.value.trim())) mark(bad('adZip', 'eZip', 'A Portland 97xxx ZIP.'));
    }

    if (payMethod === 'card') {
      if ($('ccNum').value.replace(/\D/g, '').length !== 16) mark(bad('ccNum', 'eCcNum', '16 digits — 4242 4242 4242 4242 works here.'));
      var exp = $('ccExp').value.replace(/\D/g, '');
      var expOk = exp.length === 4 && +exp.slice(0, 2) >= 1 && +exp.slice(0, 2) <= 12;
      if (!expOk) mark(bad('ccExp', 'eCcExp', 'MM / YY.'));
      if ($('ccCvc').value.length < 3) mark(bad('ccCvc', 'eCcCvc', '3–4 digits.'));
    }

    if (firstBad) {
      firstBad.focus({ preventScroll: false });
      firstBad.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
      return;
    }

    /* place the "order" */
    var no = 'K-' + String(Math.floor(100 + Math.random() * 900));
    $('doneNo').textContent = no;
    $('doneLine').textContent = f === 'delivery'
      ? 'Heading to ' + adStreet.value.trim() + ' in about 35 minutes.'
      : f === 'later'
        ? 'Ready for pickup at ' + $('coTime').selectedOptions[0].textContent + '.'
        : 'Ready for pickup in about 15 minutes.';
    checkout.hidden = true;
    show($('doneSheet'));
    cart = []; saveCart(); paintCart(false);
    $('doneClose').focus();
  });

  $('doneClose').addEventListener('click', function () {
    $('doneSheet').hidden = true;
    document.body.style.overflow = '';
    window.scrollTo({ top: $('menu').offsetTop - 120, behavior: reduced ? 'auto' : 'smooth' });
  });

  /* ==================================================================
     8. Toast
     ================================================================== */

  var toastEl = $('toast'), toastTimer = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.hidden = true; }, 2200);
  }

  paintCart(false);
})();
