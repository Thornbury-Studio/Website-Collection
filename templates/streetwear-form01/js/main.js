/* FORM/01 — index grid, product takeover, minimal cart. Zero dependencies.
   Cart lives in localStorage under f01.cart.v1 as {key, id, name, size, unit, qty}. */

(function () {
  'use strict';

  var P = window.F01_PRODUCTS;
  var LS_KEY = 'f01.cart.v1';

  var cart = load();
  var current = -1;       /* index into P for the open takeover */
  var pickedSize = null;

  function usd(c) { return '$' + (c % 100 === 0 ? (c / 100) : (c / 100).toFixed(2)); }

  function load() {
    try {
      var arr = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
      return Array.isArray(arr) ? arr.filter(function (l) {
        return l && typeof l.unit === 'number' && typeof l.qty === 'number';
      }) : [];
    } catch (e) { return []; }
  }
  function save() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(cart)); } catch (e) { /* private mode */ }
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function subtotal() { return cart.reduce(function (s, l) { return s + l.unit * l.qty; }, 0); }
  function count() { return cart.reduce(function (s, l) { return s + l.qty; }, 0); }

  /* ---------- grid ---------- */

  var grid = document.getElementById('grid');

  P.forEach(function (p, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'cell';
    b.setAttribute('aria-label', p.name + ', ' + usd(p.price));
    b.innerHTML =
      '<img src="' + p.img + '" alt="" width="1100" height="1100" loading="lazy">' +
      '<span class="cell-idx">' + p.code + '</span>' +
      '<span class="cell-bar"><span class="cell-name">' + esc(p.name) + '</span>' +
      '<span class="cell-price">' + usd(p.price) + '</span></span>';
    b.addEventListener('click', function () { openTake(i); });
    grid.appendChild(b);
  });

  /* ---------- lockers ---------- */

  var lockerGrid = document.getElementById('lockerGrid');
  if (lockerGrid && window.F01_LOCKERS) {
    window.F01_LOCKERS.forEach(function (lk) {
      var total = lk.pieces.reduce(function (s, id) {
        return s + P.find(function (p) { return p.id === id; }).price;
      }, 0);

      var card = document.createElement('article');
      card.className = 'locker';

      var img = document.createElement('img');
      img.src = lk.img;
      img.alt = lk.alt;
      img.width = 900; img.height = 1200;
      img.loading = 'lazy';
      card.appendChild(img);

      var bar = document.createElement('div');
      bar.className = 'locker-bar';
      bar.innerHTML = '<span class="locker-code">' + esc(lk.code) + '</span>' +
        '<span class="locker-theme">' + esc(lk.theme) + '</span>';
      card.appendChild(bar);

      var ul = document.createElement('ul');
      ul.className = 'locker-pieces';
      lk.pieces.forEach(function (id) {
        var pi = P.findIndex(function (p) { return p.id === id; });
        var p = P[pi];
        var li = document.createElement('li');
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'locker-piece';
        btn.innerHTML = '<span class="lp-code">' + esc(p.code) + '</span>' +
          '<span>' + esc(p.name) + '</span>' +
          '<span class="lp-price">' + usd(p.price) + '</span>';
        btn.addEventListener('click', function () { openTake(pi); });
        li.appendChild(btn);
        ul.appendChild(li);
      });
      card.appendChild(ul);

      var tot = document.createElement('p');
      tot.className = 'locker-total';
      tot.innerHTML = '<span>THE WHOLE LOCKER</span><span>' + usd(total) + '</span>';
      card.appendChild(tot);

      lockerGrid.appendChild(card);
    });
  }

  /* ---------- takeover ---------- */

  var take = document.getElementById('take');
  var lastFocus = null;

  function openTake(i) {
    current = i;
    var p = P[i];
    pickedSize = p.sizes.length === 1 ? p.sizes[0] : null;

    document.getElementById('takeImg').src = p.img;
    document.getElementById('takeImg').alt = 'Product photograph: ' + p.name + ', ' + p.fabric + '.';
    document.getElementById('takeCode').textContent = p.code + ' — ' + p.fabric.split('/')[1].trim().toUpperCase();
    document.getElementById('takeName').textContent = p.name;
    document.getElementById('takePrice').textContent = usd(p.price);
    document.getElementById('takeFabric').textContent = p.fabric.toUpperCase();
    document.getElementById('takeDesc').textContent = p.desc;
    document.getElementById('takePos').textContent = p.idx + ' / ' + String(P.length).padStart(2, '0');

    var sz = document.getElementById('takeSizes');
    sz.innerHTML = '';
    p.sizes.forEach(function (s) {
      var sb = document.createElement('button');
      sb.type = 'button';
      sb.className = 'size' + (s === pickedSize ? ' is-on' : '');
      sb.textContent = s;
      sb.setAttribute('aria-pressed', s === pickedSize ? 'true' : 'false');
      sb.addEventListener('click', function () {
        pickedSize = s;
        sz.querySelectorAll('.size').forEach(function (o) { o.classList.remove('is-on'); o.setAttribute('aria-pressed', 'false'); });
        sb.classList.add('is-on'); sb.setAttribute('aria-pressed', 'true');
      });
      sz.appendChild(sb);
    });

    var addBtn = document.getElementById('takeAdd');
    addBtn.classList.remove('added');
    addBtn.textContent = 'ADD TO CART';

    if (take.hidden) {
      lastFocus = document.activeElement;
      take.hidden = false;
      document.body.style.overflow = 'hidden';
    }
    document.getElementById('takeClose').focus();
  }

  function closeTake() {
    take.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }

  document.getElementById('takeClose').addEventListener('click', closeTake);
  document.getElementById('takePrev').addEventListener('click', function () { openTake((current + P.length - 1) % P.length); });
  document.getElementById('takeNext').addEventListener('click', function () { openTake((current + 1) % P.length); });

  document.getElementById('takeAdd').addEventListener('click', function () {
    var p = P[current];
    var btn = this;
    if (!pickedSize) {
      btn.textContent = 'PICK A SIZE';
      setTimeout(function () { btn.textContent = 'ADD TO CART'; }, 1200);
      return;
    }
    var key = p.id + '|' + pickedSize;
    var hit = cart.find(function (l) { return l.key === key; });
    if (hit) hit.qty = Math.min(9, hit.qty + 1);
    else cart.push({ key: key, id: p.id, name: p.name, size: pickedSize, unit: p.price, qty: 1 });
    save();
    paint();
    btn.classList.add('added');
    btn.textContent = 'ADDED ✓';
    setTimeout(function () { btn.classList.remove('added'); btn.textContent = 'ADD TO CART'; }, 1000);
  });

  /* ---------- cart panel ---------- */

  var cartEl = document.getElementById('cart');
  var veil = document.getElementById('veil');
  var linesEl = document.getElementById('cartLines');
  var cartFocus = null;

  function openCart() {
    if (!take.hidden) closeTake();
    cartFocus = document.activeElement;
    cartEl.hidden = false;
    veil.hidden = false;
    document.getElementById('cartClose').focus();
  }
  function closeCart() {
    cartEl.hidden = true;
    veil.hidden = true;
    if (cartFocus) cartFocus.focus();
  }

  document.getElementById('cartBtn').addEventListener('click', openCart);
  document.getElementById('cartClose').addEventListener('click', closeCart);
  veil.addEventListener('click', closeCart);
  document.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Escape') return;
    if (!cartEl.hidden) closeCart();
    else if (!take.hidden) closeTake();
  });

  function paint() {
    linesEl.innerHTML = '';
    cart.forEach(function (l, i) {
      var li = document.createElement('li');
      li.className = 'cart-line';
      li.innerHTML =
        '<span>' + l.qty + ' × ' + esc(l.name) + '</span>' +
        '<span class="cl-price">' + usd(l.unit * l.qty) + '</span>' +
        '<span class="cl-detail">SIZE ' + esc(l.size) + '</span>' +
        '<span class="cl-ctl">' +
        '<button type="button" class="linkish mono" data-act="less" data-i="' + i + '">−1</button>' +
        '<button type="button" class="linkish mono" data-act="more" data-i="' + i + '">+1</button>' +
        '<button type="button" class="linkish mono" data-act="drop" data-i="' + i + '">REMOVE</button></span>';
      linesEl.appendChild(li);
    });

    var has = cart.length > 0;
    document.getElementById('cartEmpty').hidden = has;
    document.getElementById('cartTail').hidden = !has;
    document.getElementById('cartTotal').textContent = usd(subtotal());
    document.getElementById('payTotal').textContent = usd(subtotal());

    var c = document.getElementById('cartCount');
    c.textContent = count();
    var btn = document.getElementById('cartBtn');
    btn.classList.remove('bump');
    btn.offsetWidth;
    btn.classList.add('bump');
  }

  linesEl.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-act]');
    if (!b) return;
    var i = +b.dataset.i;
    if (!cart[i]) return;
    if (b.dataset.act === 'more') cart[i].qty = Math.min(9, cart[i].qty + 1);
    if (b.dataset.act === 'less') { cart[i].qty -= 1; if (cart[i].qty <= 0) cart.splice(i, 1); }
    if (b.dataset.act === 'drop') cart.splice(i, 1);
    save();
    paint();
  });

  /* ---------- checkout ---------- */

  function bad(id, on) {
    document.getElementById(id).classList.toggle('bad', on);
    document.getElementById(id + 'Err').hidden = !on;
    return on;
  }

  document.getElementById('payForm').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var fail = false;
    var email = document.getElementById('pfEmail').value.trim();
    fail = bad('pfEmail', !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) || fail;
    var card = document.getElementById('pfCard').value.replace(/\s/g, '');
    fail = bad('pfCard', !/^\d{16}$/.test(card)) || fail;
    if (fail) return;

    document.getElementById('doneLine').textContent =
      'ORDER LOGGED — ' + count() + ' ITEM(S), ' + usd(subtotal()) +
      '. CONFIRMATION ON ITS WAY TO YOUR INBOX.';

    cart = [];
    save();
    paint();
    this.reset();
    this.hidden = true;
    document.getElementById('cartDone').hidden = false;
  });

  document.getElementById('doneReset').addEventListener('click', function () {
    document.getElementById('cartDone').hidden = true;
    document.getElementById('payForm').hidden = false;
    closeCart();
  });

  paint();
})();
