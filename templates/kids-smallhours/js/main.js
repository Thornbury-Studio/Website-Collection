/* SMALL HOURS — shop rendering, product pages and the bag. Zero dependencies.
   The bag lives in localStorage under smallhours.bag.v1 as
   {key, id, name, size, unit, qty, img}. Shared by index.html and product.html. */

(function () {
  'use strict';

  var P = window.SH_PRODUCTS;
  var COLS = window.SH_COLLECTIONS;
  var LS_KEY = 'smallhours.bag.v1';
  var FREE_SHIP = 12000;
  var SIZES = ['2Y', '3Y', '4Y', '5Y', '6Y', '8Y'];

  var bag = load();

  function sgd(c) { return 'S$' + (c % 100 === 0 ? (c / 100) : (c / 100).toFixed(2)); }

  function load() {
    try {
      var arr = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
      return Array.isArray(arr) ? arr.filter(function (l) {
        return l && typeof l.unit === 'number' && typeof l.qty === 'number';
      }) : [];
    } catch (e) { return []; }
  }
  function save() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(bag)); } catch (e) { /* private mode */ }
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function subtotal() { return bag.reduce(function (s, l) { return s + l.unit * l.qty; }, 0); }
  function count() { return bag.reduce(function (s, l) { return s + l.qty; }, 0); }

  function cardNode(p) {
    var a = document.createElement('a');
    a.className = 'card reveal';
    a.href = 'product.html?id=' + p.id;
    a.dataset.col = p.col;
    a.innerHTML =
      '<span class="card-photo"><img src="' + p.img + '" alt="Flat-lay of the ' + esc(p.name) + ' in ' + esc(p.colour) + ' on oatmeal linen." width="900" height="1200" loading="lazy">' +
      (p.isNew ? '<span class="card-new">New</span>' : '') + '</span>' +
      '<span class="card-name">' + esc(p.name) + '</span>' +
      '<span class="card-meta"><span>' + esc(p.colour) + '</span><span class="price">' + sgd(p.price) + '</span></span>';
    return a;
  }

  /* ---------- index page ---------- */

  var newStrip = document.getElementById('newStrip');
  if (newStrip) {
    P.filter(function (p) { return p.isNew; }).slice(0, 4).forEach(function (p) {
      newStrip.appendChild(cardNode(p));
    });

    var collGrid = document.getElementById('collectionGrid');
    COLS.forEach(function (c) {
      var first = P.find(function (p) { return p.col === c[0]; });
      var a = document.createElement('a');
      a.className = 'coll reveal';
      a.href = '#everything';
      a.dataset.col = c[0];
      a.innerHTML =
        '<img src="' + first.img + '" alt="" width="900" height="1200" loading="lazy">' +
        '<span class="coll-bar"><h3>' + esc(c[1]) + '</h3><p>' + esc(c[2]) + '</p></span>';
      a.addEventListener('click', function () {
        var chip = document.querySelector('.filter[data-col="' + c[0] + '"]');
        if (chip) chip.click();
      });
      collGrid.appendChild(a);
    });

    var filterRow = document.getElementById('filterRow');
    COLS.forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'filter';
      b.dataset.col = c[0];
      b.textContent = c[1];
      filterRow.appendChild(b);
    });

    var allGrid = document.getElementById('allGrid');
    P.forEach(function (p) { allGrid.appendChild(cardNode(p)); });

    filterRow.addEventListener('click', function (ev) {
      var chip = ev.target.closest('.filter');
      if (!chip) return;
      filterRow.querySelectorAll('.filter').forEach(function (f) { f.classList.remove('is-on'); });
      chip.classList.add('is-on');
      var col = chip.dataset.col;
      allGrid.querySelectorAll('.card').forEach(function (card) {
        card.classList.toggle('is-hidden', col !== 'all' && card.dataset.col !== col);
      });
    });
  }

  /* ---------- product page ---------- */

  var detail = document.getElementById('pieceDetail');
  if (detail) {
    var id = new URLSearchParams(location.search).get('id');
    var p = P.find(function (x) { return x.id === id; });

    if (!p) {
      detail.innerHTML = '<div class="not-found"><h1>We don\'t make that one.</h1>' +
        '<p><a class="quiet-link" href="index.html#everything">Back to everything</a></p></div>';
    } else {
      document.title = p.name + ' — SMALL HOURS';
      var colName = (COLS.find(function (c) { return c[0] === p.col; }) || ['', ''])[1];
      var state = { size: null };
      var oneSize = (p.id === 'k08' || p.id === 's12');   /* beanie & socks fit 2–8 */

      detail.innerHTML =
        '<div class="piece-photo"><img src="' + p.img + '" alt="Flat-lay of the ' + esc(p.name) + ' in ' + esc(p.colour) + ' on oatmeal linen." width="900" height="1200"></div>' +
        '<div class="piece-body">' +
        '<p class="piece-kicker">' + esc(colName) + '</p>' +
        '<h1>' + esc(p.name) + '</h1>' +
        '<p class="piece-colour">' + esc(p.colour) + '</p>' +
        '<p class="piece-price">' + sgd(p.price) + '</p>' +
        '<p class="piece-desc">' + esc(p.desc) + '</p>' +
        '<p class="piece-fabric"><strong>Fabric —</strong> ' + esc(p.fabric) + '</p>' +
        '<p class="size-label">' + (oneSize ? 'One size, ages 2–8' : 'Age') + '</p>' +
        '<div class="size-row" id="sizeRow"></div>' +
        '<button class="add-btn" id="addBtn" type="button">Add to bag</button>' +
        '<p class="piece-care">' + esc(p.care) + '</p>' +
        '</div>';

      var sizeRow = document.getElementById('sizeRow');
      var sizes = oneSize ? ['One size'] : SIZES;
      sizes.forEach(function (s, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'size-btn' + (sizes.length === 1 && i === 0 ? ' is-on' : '');
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

      document.getElementById('addBtn').addEventListener('click', function () {
        var btn = this;
        if (!state.size) {
          btn.textContent = 'Choose an age first';
          setTimeout(function () { btn.textContent = 'Add to bag'; }, 1300);
          return;
        }
        var key = p.id + '|' + state.size;
        var hit = bag.find(function (l) { return l.key === key; });
        if (hit) hit.qty = Math.min(9, hit.qty + 1);
        else bag.push({ key: key, id: p.id, name: p.name, size: state.size, unit: p.price, qty: 1, img: p.img });
        save();
        paint();
        btn.classList.add('added');
        btn.textContent = 'In the bag ✓';
        setTimeout(function () { btn.classList.remove('added'); btn.textContent = 'Add to bag'; }, 1100);
        openBag();
      });

      /* Goes well with: 3 others, same collection first */
      var also = document.getElementById('also');
      var strip = document.getElementById('alsoStrip');
      var others = P.filter(function (x) { return x.id !== p.id && x.col === p.col; })
        .concat(P.filter(function (x) { return x.id !== p.id && x.col !== p.col; }))
        .slice(0, 4);
      others.forEach(function (o) { strip.appendChild(cardNode(o)); });
      also.hidden = false;
    }
  }

  /* ---------- bag drawer ---------- */

  var bagEl = document.getElementById('bag');
  var veil = document.getElementById('veil');
  var linesEl = document.getElementById('bagLines');
  var lastFocus = null;

  function openBag() {
    lastFocus = document.activeElement;
    bagEl.hidden = false;
    veil.hidden = false;
    document.getElementById('bagClose').focus();
  }
  function closeBag() {
    bagEl.hidden = true;
    veil.hidden = true;
    if (lastFocus) lastFocus.focus();
  }

  document.getElementById('bagBtn').addEventListener('click', openBag);
  document.getElementById('bagClose').addEventListener('click', closeBag);
  veil.addEventListener('click', closeBag);
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape' && !bagEl.hidden) closeBag();
  });

  function paint() {
    linesEl.innerHTML = '';
    bag.forEach(function (l, i) {
      var li = document.createElement('li');
      li.className = 'bag-line';
      li.innerHTML =
        '<img src="' + l.img + '" alt="" width="64" height="80">' +
        '<span class="bl-name">' + l.qty + ' × ' + esc(l.name) + '</span>' +
        '<span class="bl-price">' + sgd(l.unit * l.qty) + '</span>' +
        '<span class="bl-detail">' + esc(l.size) + '</span>' +
        '<span class="bl-ctl">' +
        '<button type="button" class="bl-btn" data-act="less" data-i="' + i + '">fewer</button>' +
        '<button type="button" class="bl-btn" data-act="more" data-i="' + i + '">more</button>' +
        '<button type="button" class="bl-btn" data-act="drop" data-i="' + i + '">remove</button></span>';
      linesEl.appendChild(li);
    });

    var has = bag.length > 0;
    document.getElementById('bagEmpty').hidden = has;
    document.getElementById('bagTail').hidden = !has;

    var sub = subtotal();
    document.getElementById('bagTotal').textContent = sgd(sub);
    document.getElementById('payTotal').textContent = sgd(sub);
    document.getElementById('bagShip').textContent = sub >= FREE_SHIP
      ? 'Delivery is on us.'
      : sgd(FREE_SHIP - sub) + ' away from free delivery.';

    var c = document.getElementById('bagCount');
    c.textContent = count();
    var btn = document.getElementById('bagBtn');
    btn.classList.remove('bump');
    btn.offsetWidth;
    btn.classList.add('bump');
  }

  linesEl.addEventListener('click', function (ev) {
    var b = ev.target.closest('.bl-btn');
    if (!b) return;
    var i = +b.dataset.i;
    if (!bag[i]) return;
    if (b.dataset.act === 'more') bag[i].qty = Math.min(9, bag[i].qty + 1);
    if (b.dataset.act === 'less') { bag[i].qty -= 1; if (bag[i].qty <= 0) bag.splice(i, 1); }
    if (b.dataset.act === 'drop') bag.splice(i, 1);
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
    fail = bad('pfName', document.getElementById('pfName').value.trim().length < 2) || fail;
    var email = document.getElementById('pfEmail').value.trim();
    fail = bad('pfEmail', !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) || fail;
    var card = document.getElementById('pfCard').value.replace(/\s/g, '');
    fail = bad('pfCard', !/^\d{16}$/.test(card)) || fail;
    if (fail) {
      var firstBad = this.querySelector('.bad');
      if (firstBad) firstBad.focus();
      return;
    }

    var name = document.getElementById('pfName').value.trim().split(/\s+/)[0];
    document.getElementById('doneBody').textContent =
      'Thank you, ' + name + '. Your ' + count() +
      ' piece(s) will be folded in tissue and posted within two working days.';

    bag = [];
    save();
    paint();
    this.reset();
    this.hidden = true;
    document.querySelector('.bag-total').hidden = true;
    document.getElementById('bagShip').hidden = true;
    document.getElementById('bagDone').hidden = false;
  });

  document.getElementById('doneAgain').addEventListener('click', function () {
    document.getElementById('bagDone').hidden = true;
    document.getElementById('payForm').hidden = false;
    document.querySelector('.bag-total').hidden = false;
    document.getElementById('bagShip').hidden = false;
    closeBag();
  });

  /* ---------- reveals ---------- */

  var toReveal = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -6% 0px' });
    toReveal.forEach(function (n) { io.observe(n); });
    setTimeout(function () {
      toReveal.forEach(function (n) { n.classList.add('is-in'); });
    }, 2500);
  } else {
    toReveal.forEach(function (n) { n.classList.add('is-in'); });
  }

  paint();
})();
