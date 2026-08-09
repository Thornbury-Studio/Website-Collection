/* MORROW & FINCH — catalogue, plate pages and the Order Book. Zero dependencies.
   The order lives in localStorage under mf.orderbook.v1 as
   {key, id, name, size, unit, qty}. Shared by index.html and product.html. */

(function () {
  'use strict';

  var CATALOG = window.MF_CATALOG;
  var DEPTS = window.MF_DEPTS;
  var LS_KEY = 'mf.orderbook.v1';
  var POST_FEE = 450;

  var order = load();
  var fulfil = 'collect';

  function gbp(p) { return '£' + (p / 100).toFixed(2); }

  function load() {
    try {
      var arr = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
      return Array.isArray(arr) ? arr.filter(function (l) {
        return l && typeof l.unit === 'number' && typeof l.qty === 'number';
      }) : [];
    } catch (e) { return []; }
  }

  function save() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(order)); } catch (e) { /* private mode */ }
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function subtotal() { return order.reduce(function (s, l) { return s + l.unit * l.qty; }, 0); }
  function count() { return order.reduce(function (s, l) { return s + l.qty; }, 0); }

  /* ---------- index: contents + departments ---------- */

  var deptWrap = document.getElementById('departments');
  if (deptWrap) {
    var contents = document.getElementById('contentsList');

    DEPTS.forEach(function (d) {
      var slug = d[0], num = d[1], title = d[2];
      var items = CATALOG.filter(function (p) { return p.dept === slug; });

      var li = document.createElement('li');
      li.innerHTML = '<a href="#dept-' + slug + '"><span class="c-num">' + esc(num) + '</span>' +
        '<span class="c-name">' + esc(title) + '</span><span class="c-line"></span>' +
        '<span class="c-count">' + items.length + (items.length === 1 ? ' plate' : ' plates') + '</span></a>';
      contents.appendChild(li);

      var head = document.createElement('div');
      head.className = 'dept-head';
      head.id = 'dept-' + slug;
      head.innerHTML = '<p class="dept-num">' + esc(num) + '</p><h2>' + esc(title) + '</h2>';
      deptWrap.appendChild(head);

      var grid = document.createElement('div');
      grid.className = 'plate-grid';
      items.forEach(function (p) {
        var a = document.createElement('a');
        a.className = 'plate-card';
        a.href = 'product.html?id=' + p.id;
        a.innerHTML =
          '<span class="plate-photo"><img src="' + p.img + '" alt="Catalogue plate: ' + esc(p.name) + ' — ' + esc(p.fabric) + '." width="840" height="1120" loading="lazy">' +
          '<span class="plate-no">Plate ' + esc(p.plate) + '</span></span>' +
          '<span class="plate-body"><h3>' + esc(p.name) + '</h3>' +
          '<span class="plate-fabric">' + esc(p.fabric) + '</span>' +
          '<span class="plate-foot"><span class="tag">' + gbp(p.price) + '</span>' +
          '<span class="plate-view">View plate →</span></span></span>';
        grid.appendChild(a);
      });
      deptWrap.appendChild(grid);
    });
  }

  /* ---------- product page ---------- */

  var detail = document.getElementById('plateDetail');
  if (detail) {
    var id = new URLSearchParams(location.search).get('id');
    var p = CATALOG.find(function (x) { return x.id === id; });

    if (!p) {
      detail.innerHTML = '<div class="not-found"><h1>That plate is not in this catalogue.</h1>' +
        '<p><a href="index.html#catalogue">Return to the contents page</a>.</p></div>';
    } else {
      document.title = p.name + ' — MORROW & FINCH';
      var state = { size: null, qty: 1 };

      detail.innerHTML =
        '<div class="detail-photo"><img src="' + p.img + '" alt="Catalogue plate: ' + esc(p.name) + ' — ' + esc(p.fabric) + '." width="840" height="1120">' +
        '<span class="plate-no">Plate ' + esc(p.plate) + '</span></div>' +
        '<div class="detail-body">' +
        '<p class="detail-kicker">' + esc(deptName(p.dept)) + '</p>' +
        '<h1>' + esc(p.name) + '</h1>' +
        '<p class="detail-fabric">' + esc(p.fabric) + '</p>' +
        '<p class="detail-price">' + gbp(p.price) + '</p>' +
        '<p class="detail-desc">' + esc(p.desc) + '</p>' +
        (p.note ? '<p class="detail-note">' + esc(p.note) + '</p>' : '') +
        '<p class="size-label">Size</p>' +
        '<div class="size-row" id="sizeRow"></div>' +
        '<div class="detail-cta">' +
        '<div class="qty"><button type="button" aria-label="One fewer">−</button><output>1</output><button type="button" aria-label="One more">+</button></div>' +
        '<button class="add-btn" id="addBtn" type="button">Enter in the order book</button>' +
        '</div></div>';

      var sizeRow = document.getElementById('sizeRow');
      p.sizes.forEach(function (s, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'size-btn' + (p.sizes.length === 1 && i === 0 ? ' is-on' : '');
        b.textContent = s;
        b.setAttribute('aria-pressed', b.classList.contains('is-on') ? 'true' : 'false');
        if (b.classList.contains('is-on')) state.size = s;
        b.addEventListener('click', function () {
          state.size = s;
          sizeRow.querySelectorAll('.size-btn').forEach(function (o) { o.classList.remove('is-on'); o.setAttribute('aria-pressed', 'false'); });
          b.classList.add('is-on'); b.setAttribute('aria-pressed', 'true');
        });
        sizeRow.appendChild(b);
      });

      var qtyEl = detail.querySelector('.qty');
      var qOut = qtyEl.querySelector('output');
      qtyEl.children[0].addEventListener('click', function () { state.qty = Math.max(1, state.qty - 1); qOut.textContent = state.qty; });
      qtyEl.children[2].addEventListener('click', function () { state.qty = Math.min(9, state.qty + 1); qOut.textContent = state.qty; });

      document.getElementById('addBtn').addEventListener('click', function () {
        if (!state.size) {
          this.textContent = 'Choose a size first';
          var btn = this;
          setTimeout(function () { btn.textContent = 'Enter in the order book'; }, 1300);
          return;
        }
        addLine({
          key: p.id + '|' + state.size,
          id: p.id, name: p.name, size: state.size,
          unit: p.price, qty: state.qty
        });
        var btn = this;
        btn.classList.add('added');
        btn.textContent = 'Entered ✓';
        setTimeout(function () { btn.classList.remove('added'); btn.textContent = 'Enter in the order book'; }, 1100);
        state.qty = 1; qOut.textContent = '1';
        openBook();
      });
    }
  }

  function deptName(slug) {
    var d = DEPTS.find(function (x) { return x[0] === slug; });
    return d ? d[2] : '';
  }

  /* ---------- order book ---------- */

  var bookEl = document.getElementById('book');
  var veilEl = document.getElementById('bookVeil');
  var linesEl = document.getElementById('bookLines');
  var lastFocus = null;

  function openBook() {
    lastFocus = document.activeElement;
    bookEl.hidden = false;
    veilEl.hidden = false;
    document.getElementById('bookClose').focus();
  }
  function closeBook() {
    bookEl.hidden = true;
    veilEl.hidden = true;
    if (lastFocus) lastFocus.focus();
  }

  document.getElementById('bookBtn').addEventListener('click', openBook);
  document.getElementById('bookClose').addEventListener('click', closeBook);
  veilEl.addEventListener('click', closeBook);
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && !bookEl.hidden) closeBook();
  });

  function addLine(line) {
    var hit = order.find(function (l) { return l.key === line.key; });
    if (hit) hit.qty = Math.min(9, hit.qty + line.qty);
    else order.push(line);
    save();
    paint();
  }

  function paint() {
    linesEl.innerHTML = '';
    order.forEach(function (l, i) {
      var li = document.createElement('li');
      li.className = 'book-line';
      li.innerHTML =
        '<span class="bl-name">' + l.qty + ' × ' + esc(l.name) + '</span>' +
        '<span class="bl-price">' + gbp(l.unit * l.qty) + '</span>' +
        '<span class="bl-detail">size ' + esc(l.size) + '</span>' +
        '<span class="bl-ctl">' +
        '<button type="button" class="bl-btn" data-act="less" data-i="' + i + '">fewer</button>' +
        '<button type="button" class="bl-btn" data-act="more" data-i="' + i + '">more</button>' +
        '<button type="button" class="bl-btn" data-act="strike" data-i="' + i + '">strike out</button></span>';
      linesEl.appendChild(li);
    });

    var has = order.length > 0;
    document.getElementById('bookEmpty').hidden = has;
    document.getElementById('bookTail').hidden = !has;

    var sub = subtotal();
    var fee = fulfil === 'post' ? POST_FEE : 0;
    document.getElementById('sumGoods').textContent = gbp(sub);
    document.getElementById('rowPost').hidden = fulfil !== 'post';
    document.getElementById('sumTotal').textContent = gbp(sub + fee);
    document.getElementById('placeTotal').textContent = gbp(sub + fee);

    var c = document.getElementById('bookCount');
    c.textContent = count();
    c.classList.add('bump');
    setTimeout(function () { c.classList.remove('bump'); }, 200);
  }

  linesEl.addEventListener('click', function (ev) {
    var b = ev.target.closest('.bl-btn');
    if (!b) return;
    var i = +b.dataset.i;
    if (!order[i]) return;
    if (b.dataset.act === 'more') order[i].qty = Math.min(9, order[i].qty + 1);
    if (b.dataset.act === 'less') { order[i].qty -= 1; if (order[i].qty <= 0) order.splice(i, 1); }
    if (b.dataset.act === 'strike') order.splice(i, 1);
    save();
    paint();
  });

  /* ---------- fulfilment + checkout ---------- */

  var fulCollect = document.getElementById('fulCollect');
  var fulPost = document.getElementById('fulPost');

  function setFulfil(mode) {
    fulfil = mode;
    fulCollect.classList.toggle('is-on', mode === 'collect');
    fulCollect.setAttribute('aria-pressed', mode === 'collect');
    fulPost.classList.toggle('is-on', mode === 'post');
    fulPost.setAttribute('aria-pressed', mode === 'post');
    document.getElementById('addrField').hidden = mode !== 'post';
    paint();
  }
  fulCollect.addEventListener('click', function () { setFulfil('collect'); });
  fulPost.addEventListener('click', function () { setFulfil('post'); });

  function bad(id, on) {
    document.getElementById(id).classList.toggle('bad', on);
    document.getElementById(id + 'Err').hidden = !on;
    return on;
  }

  document.getElementById('orderForm').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var fail = false;

    fail = bad('obName', document.getElementById('obName').value.trim().length < 2) || fail;

    var phone = document.getElementById('obPhone').value.replace(/[\s-]/g, '');
    fail = bad('obPhone', !/^(\+44|0)\d{9,10}$/.test(phone)) || fail;

    if (fulfil === 'post') {
      var addr = document.getElementById('obAddr').value.trim();
      var hasPostcode = /[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i.test(addr);
      fail = bad('obAddr', addr.length < 12 || !hasPostcode) || fail;
    }

    var card = document.getElementById('obCard').value.replace(/\s/g, '');
    fail = bad('obCard', !/^\d{16}$/.test(card)) || fail;

    if (fail) {
      var firstBad = this.querySelector('.bad');
      if (firstBad) firstBad.focus();
      return;
    }

    var name = document.getElementById('obName').value.trim().split(/\s+/)[0];
    document.getElementById('doneHead').textContent = 'Entered and initialled, ' + name + '.';
    document.getElementById('doneBody').textContent =
      (fulfil === 'post'
        ? count() + ' item(s) will leave Ledbury Row with the morning post.'
        : 'Your ' + count() + ' item(s) will be wrapped in brown paper and waiting under your name.');

    order = [];
    save();
    paint();
    this.reset();
    setFulfil('collect');
    this.hidden = true;
    document.querySelector('.book-sums').hidden = true;
    document.getElementById('bookDone').hidden = false;
  });

  document.getElementById('doneAgain').addEventListener('click', function () {
    document.getElementById('bookDone').hidden = true;
    document.getElementById('orderForm').hidden = false;
    document.querySelector('.book-sums').hidden = false;
    closeBook();
  });

  paint();
})();
