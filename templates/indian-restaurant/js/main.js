/* KESAR — ordering logic. Zero dependencies.
   Order lines live in localStorage under kesar.order.v1.
   A line is {key, id, name, detail, unit, qty} — key encodes the exact configuration,
   so the same dish at a different heat is a different line. Feast lines use id 'f*'. */

(function () {
  'use strict';

  var MENU = window.KESAR_MENU;
  var CHAPTERS = window.KESAR_CHAPTERS;
  var FEASTS = window.KESAR_FEASTS;
  var LS_KEY = 'kesar.order.v1';

  var order = load();
  var fulfil = 'pickup';
  var pay = 'card';
  var DELIVERY_FEE = 250;

  /* ---------- helpers ---------- */

  function gbp(p) { return '£' + (p / 100).toFixed(2); }

  function load() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr.filter(function (l) {
        return l && typeof l.unit === 'number' && typeof l.qty === 'number';
      }) : [];
    } catch (e) { return []; }
  }

  function save() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(order)); } catch (e) { /* private mode */ }
  }

  function subtotal() {
    return order.reduce(function (s, l) { return s + l.unit * l.qty; }, 0);
  }

  function count() {
    return order.reduce(function (s, l) { return s + l.qty; }, 0);
  }

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html !== undefined) n.innerHTML = html;
    return n;
  }

  var esc = function (s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  /* ---------- render: dawat feasts ---------- */

  var dawatWrap = document.getElementById('dawatCards');

  FEASTS.forEach(function (f) {
    var card = el('article', 'feast reveal');
    var perHead = Math.round(f.price / f.people);
    card.innerHTML =
      '<div class="feast-top"><h3>' + esc(f.name) + '</h3>' +
      '<p class="feast-price"><strong>' + gbp(f.price) + '</strong>' +
      '<small>' + gbp(perHead) + ' a head · feeds ' + f.people + '</small></p></div>' +
      '<ul class="feast-menu">' + f.menu.map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('') + '</ul>' +
      '<div class="feast-foot">' +
      '<div class="feast-spice" role="radiogroup" aria-label="Table heat for ' + esc(f.name) + '">' +
      ['Mild table', 'Medium table', 'Hot table'].map(function (s, i) {
        return '<button type="button" class="opt' + (i === 1 ? ' is-on' : '') + '" data-spice="' + s + '" aria-pressed="' + (i === 1) + '">' + s + '</button>';
      }).join('') + '</div>' +
      '<button type="button" class="add-btn feast-add">Add the feast</button></div>';

    var spiceBtns = card.querySelectorAll('.feast-spice .opt');
    spiceBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        spiceBtns.forEach(function (o) { o.classList.remove('is-on'); o.setAttribute('aria-pressed', 'false'); });
        b.classList.add('is-on'); b.setAttribute('aria-pressed', 'true');
      });
    });

    card.querySelector('.feast-add').addEventListener('click', function (ev) {
      var spice = card.querySelector('.feast-spice .is-on').dataset.spice;
      addLine({
        key: f.id + '|' + spice,
        id: f.id,
        name: f.name,
        detail: spice + ' · feeds ' + f.people,
        unit: f.price,
        qty: 1
      });
      flash(ev.currentTarget);
    });

    dawatWrap.appendChild(card);
  });

  /* ---------- render: menu book ---------- */

  var chaptersWrap = document.getElementById('chapters');
  var toc = document.getElementById('toc');

  CHAPTERS.forEach(function (ch) {
    var slug = ch[0], title = ch[1], hindi = ch[2];
    var dishes = MENU.filter(function (d) { return d.cat === slug; });

    var a = el('a', null, esc(title));
    a.href = '#chap-' + slug;
    toc.appendChild(a);

    var sec = el('section', 'chapter');
    sec.dataset.chapter = slug;
    var head = el('h3', 'chap-title reveal');
    head.id = 'chap-' + slug;
    head.innerHTML = esc(title) + ' <small lang="hi">' + esc(hindi) + '</small>' +
      '<span class="chap-count">' + dishes.length + (dishes.length === 1 ? ' dish' : ' dishes') + '</span>';
    sec.appendChild(head);

    dishes.forEach(function (d) { sec.appendChild(dishNode(d)); });
    chaptersWrap.appendChild(sec);
  });

  function dishNode(d) {
    var wrap = el('article', 'dish');
    wrap.dataset.veg = d.veg ? '1' : '0';
    wrap.dataset.heat = String(d.heat);

    var heatMarks = '';
    for (var i = 0; i < d.heat; i++) heatMarks += '<i></i>';

    var row = el('button', 'dish-row');
    row.type = 'button';
    row.setAttribute('aria-expanded', 'false');
    row.innerHTML =
      '<img class="dish-thumb" src="' + d.img + '" alt="" width="86" height="86" loading="lazy">' +
      '<span class="dish-main">' +
      '<span class="dish-name"><span class="' + (d.veg ? 'mark-veg' : 'mark-nonveg') + '" role="img" aria-label="' + (d.veg ? 'Vegetarian' : 'Non-vegetarian') + '"></span>' +
      '<strong>' + esc(d.name) + '</strong><span class="dish-hi" lang="hi">' + esc(d.hindi) + '</span></span>' +
      '<span class="dish-desc">' + esc(d.desc) + '</span>' +
      '<span class="dish-meta"><span class="heat" data-h="' + d.heat + '" aria-label="Heat level ' + d.heat + ' of 3">' + heatMarks + '</span></span>' +
      '</span>' +
      '<span class="dish-right"><span class="dish-price">' + gbp(d.price) + '</span>' +
      '<span class="dish-toggle">Choose</span></span>';

    /* Inline panel */
    var panel = el('div', 'dish-panel');
    var inner = el('div', 'dish-panel-inner');
    var pad = el('div', 'dish-panel-pad');

    var state = { spice: d.spice ? defaultSpice(d) : null, pick: d.pick ? 0 : null, adds: [], qty: 1 };

    if (d.spice) {
      var fs = el('fieldset', 'opt-group');
      fs.innerHTML = '<legend>How hot?</legend>';
      var orow = el('div', 'opt-row');
      d.spice.forEach(function (s) {
        var b = el('button', 'opt' + (s === state.spice ? ' is-on' : ''), esc(s));
        b.type = 'button';
        b.setAttribute('aria-pressed', s === state.spice ? 'true' : 'false');
        b.addEventListener('click', function () {
          state.spice = s;
          orow.querySelectorAll('.opt').forEach(function (o) { o.classList.remove('is-on'); o.setAttribute('aria-pressed', 'false'); });
          b.classList.add('is-on'); b.setAttribute('aria-pressed', 'true');
        });
        orow.appendChild(b);
      });
      fs.appendChild(orow);
      pad.appendChild(fs);
    }

    if (d.pick) {
      var pf = el('fieldset', 'opt-group');
      pf.innerHTML = '<legend>' + esc(d.pick.name) + '</legend>';
      var prow = el('div', 'opt-row');
      d.pick.options.forEach(function (opt, idx) {
        var lbl = esc(opt[0]) + (opt[1] ? ' <small>+' + gbp(opt[1]).slice(0) + '</small>' : '');
        var b = el('button', 'opt' + (idx === 0 ? ' is-on' : ''), lbl);
        b.type = 'button';
        b.setAttribute('aria-pressed', idx === 0 ? 'true' : 'false');
        b.addEventListener('click', function () {
          state.pick = idx;
          prow.querySelectorAll('.opt').forEach(function (o) { o.classList.remove('is-on'); o.setAttribute('aria-pressed', 'false'); });
          b.classList.add('is-on'); b.setAttribute('aria-pressed', 'true');
          syncPrice();
        });
        prow.appendChild(b);
      });
      pf.appendChild(prow);
      pad.appendChild(pf);
    }

    if (d.adds) {
      var af = el('fieldset', 'opt-group');
      af.innerHTML = '<legend>On the side</legend>';
      var arow = el('div', 'opt-row');
      d.adds.forEach(function (add, idx) {
        var b = el('button', 'opt', esc(add[0]) + ' <small>+' + gbp(add[1]) + '</small>');
        b.type = 'button';
        b.setAttribute('aria-pressed', 'false');
        b.addEventListener('click', function () {
          var at = state.adds.indexOf(idx);
          if (at === -1) { state.adds.push(idx); b.classList.add('is-on'); b.setAttribute('aria-pressed', 'true'); }
          else { state.adds.splice(at, 1); b.classList.remove('is-on'); b.setAttribute('aria-pressed', 'false'); }
          syncPrice();
        });
        arow.appendChild(b);
      });
      af.appendChild(arow);
      pad.appendChild(af);
    }

    var foot = el('div', 'panel-foot');
    var qty = el('div', 'qty');
    qty.innerHTML = '<button type="button" aria-label="One fewer">−</button><output aria-live="polite">1</output><button type="button" aria-label="One more">+</button>';
    var qOut = qty.querySelector('output');
    qty.children[0].addEventListener('click', function () { state.qty = Math.max(1, state.qty - 1); qOut.textContent = state.qty; syncPrice(); });
    qty.children[2].addEventListener('click', function () { state.qty = Math.min(12, state.qty + 1); qOut.textContent = state.qty; syncPrice(); });

    var addBtn = el('button', 'add-btn');
    addBtn.type = 'button';

    function unitPrice() {
      var u = d.price;
      if (d.pick && state.pick !== null) u += d.pick.options[state.pick][1];
      state.adds.forEach(function (i) { u += d.adds[i][1]; });
      return u;
    }

    function syncPrice() {
      addBtn.innerHTML = 'Add to order — ' + gbp(unitPrice() * state.qty);
    }
    syncPrice();

    addBtn.addEventListener('click', function () {
      var details = [];
      if (state.spice) details.push(state.spice);
      if (d.pick && state.pick !== null) details.push(d.pick.options[state.pick][0]);
      state.adds.forEach(function (i) { details.push('+ ' + d.adds[i][0]); });

      addLine({
        key: d.id + '|' + details.join('|'),
        id: d.id,
        name: d.name,
        detail: details.join(' · '),
        unit: unitPrice(),
        qty: state.qty
      });
      flash(addBtn);
      state.qty = 1; qOut.textContent = '1'; syncPrice();
    });

    foot.appendChild(qty);
    foot.appendChild(addBtn);
    pad.appendChild(foot);

    inner.appendChild(pad);
    panel.appendChild(inner);

    row.addEventListener('click', function () {
      var open = wrap.classList.toggle('is-open');
      row.setAttribute('aria-expanded', open ? 'true' : 'false');
      row.querySelector('.dish-toggle').textContent = open ? 'Close' : 'Choose';
    });

    wrap.appendChild(row);
    wrap.appendChild(panel);
    return wrap;
  }

  function defaultSpice(d) {
    /* Default to the dish's native heat where it appears in its own options. */
    if (d.spice.indexOf('Medium') !== -1) return 'Medium';
    return d.spice[0];
  }

  function flash(btn) {
    var old = btn.innerHTML;
    btn.classList.add('added');
    btn.innerHTML = 'Added ✓';
    setTimeout(function () { btn.classList.remove('added'); btn.innerHTML = old; }, 900);
  }

  /* ---------- filters ---------- */

  var chips = document.querySelectorAll('.filters .chip');
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      chips.forEach(function (c) { c.classList.remove('is-on'); });
      chip.classList.add('is-on');
      var f = chip.dataset.filter;
      document.querySelectorAll('.dish').forEach(function (d) {
        var show =
          f === 'all' ||
          (f === 'veg' && d.dataset.veg === '1') ||
          (f === 'nonveg' && d.dataset.veg === '0') ||
          (f === 'noheat' && d.dataset.heat === '0');
        d.classList.toggle('is-hidden', !show);
      });
    });
  });

  /* ---------- order state & rendering ---------- */

  var listEl = document.getElementById('orderList');
  var emptyEl = document.getElementById('orderEmpty');
  var sumsEl = document.getElementById('orderSums');
  var formEl = document.getElementById('orderForm');
  var barEl = document.getElementById('bar');

  function addLine(line) {
    var hit = order.find(function (l) { return l.key === line.key; });
    if (hit) hit.qty = Math.min(24, hit.qty + line.qty);
    else order.push(line);
    save();
    paint();
  }

  function paint() {
    listEl.innerHTML = '';
    order.forEach(function (l, idx) {
      var li = el('li', 'order-line');
      li.innerHTML =
        '<span class="order-line-name">' + l.qty + ' × ' + esc(l.name) + '</span>' +
        '<span class="order-line-price">' + gbp(l.unit * l.qty) + '</span>' +
        (l.detail ? '<span class="order-line-detail">' + esc(l.detail) + '</span>' : '') +
        '<span class="order-line-ctl">' +
        '<button type="button" class="line-btn" data-act="less" data-i="' + idx + '">fewer</button>' +
        '<button type="button" class="line-btn" data-act="more" data-i="' + idx + '">more</button>' +
        '<button type="button" class="line-btn" data-act="drop" data-i="' + idx + '">remove</button></span>';
      listEl.appendChild(li);
    });

    var has = order.length > 0;
    emptyEl.hidden = has;
    sumsEl.hidden = !has;
    formEl.hidden = !has;
    barEl.hidden = !has;

    var sub = subtotal();
    var fee = fulfil === 'delivery' ? DELIVERY_FEE : 0;
    document.getElementById('sumSub').textContent = gbp(sub);
    document.getElementById('rowDeliv').hidden = fulfil !== 'delivery';
    document.getElementById('sumTotal').textContent = gbp(sub + fee);
    document.getElementById('placeTotal').textContent = gbp(sub + fee);
    document.getElementById('barTotal').textContent = gbp(sub + fee);
    document.getElementById('barCount').textContent = count();

    var top = document.getElementById('topTotal');
    top.textContent = gbp(sub + fee);
    top.classList.add('bump');
    setTimeout(function () { top.classList.remove('bump'); }, 220);
  }

  listEl.addEventListener('click', function (ev) {
    var b = ev.target.closest('.line-btn');
    if (!b) return;
    var i = +b.dataset.i, act = b.dataset.act;
    if (!order[i]) return;
    if (act === 'more') order[i].qty = Math.min(24, order[i].qty + 1);
    if (act === 'less') { order[i].qty -= 1; if (order[i].qty <= 0) order.splice(i, 1); }
    if (act === 'drop') order.splice(i, 1);
    save();
    paint();
  });

  /* ---------- fulfilment & payment toggles ---------- */

  var btnPick = document.getElementById('fulfilPickup');
  var btnDeliv = document.getElementById('fulfilDeliv');
  var pcField = document.getElementById('postcodeField');

  function setFulfil(mode) {
    fulfil = mode;
    btnPick.classList.toggle('is-on', mode === 'pickup');
    btnPick.setAttribute('aria-pressed', mode === 'pickup');
    btnDeliv.classList.toggle('is-on', mode === 'delivery');
    btnDeliv.setAttribute('aria-pressed', mode === 'delivery');
    pcField.hidden = mode !== 'delivery';
    paint();
  }
  btnPick.addEventListener('click', function () { setFulfil('pickup'); });
  btnDeliv.addEventListener('click', function () { setFulfil('delivery'); });

  var payBtns = document.querySelectorAll('.pay-btn');
  payBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      pay = b.dataset.pay;
      payBtns.forEach(function (o) { o.classList.remove('is-on'); o.setAttribute('aria-pressed', 'false'); });
      b.classList.add('is-on'); b.setAttribute('aria-pressed', 'true');
      document.getElementById('cardFields').hidden = pay !== 'card';
      document.getElementById('walletNote').hidden = pay === 'card';
    });
  });

  /* ---------- validation & place order ---------- */

  function bad(id, on) {
    document.getElementById(id).classList.toggle('bad', on);
    document.getElementById(id + 'Err').hidden = !on;
    return on;
  }

  formEl.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var fail = false;

    fail = bad('name', document.getElementById('name').value.trim().length < 2) || fail;

    var phone = document.getElementById('phone').value.replace(/[\s-]/g, '');
    fail = bad('phone', !/^(\+44|0)7\d{9}$/.test(phone) && !/^(\+44|0)[12]\d{8,9}$/.test(phone)) || fail;

    var email = document.getElementById('email').value.trim();
    fail = bad('email', email !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) || fail;

    if (fulfil === 'delivery') {
      var pc = document.getElementById('postcode').value.trim().toUpperCase();
      fail = bad('postcode', !/^E[123]\s?\d[A-Z]{2}$/.test(pc)) || fail;
    }

    if (pay === 'card') {
      var num = document.getElementById('cardNum').value.replace(/\s/g, '');
      fail = bad('cardNum', !/^\d{16}$/.test(num)) || fail;

      var exp = document.getElementById('cardExp').value.trim();
      var m = exp.match(/^(0[1-9]|1[0-2])\/(\d{2})$/);
      var expOk = false;
      if (m) {
        var now = new Date();
        var yy = now.getFullYear() % 100, mm = now.getMonth() + 1;
        expOk = +m[2] > yy || (+m[2] === yy && +m[1] >= mm);
      }
      fail = bad('cardExp', !expOk) || fail;
      fail = bad('cardCvc', !/^\d{3,4}$/.test(document.getElementById('cardCvc').value.trim())) || fail;
    }

    if (fail) {
      var firstBad = formEl.querySelector('.bad');
      if (firstBad) firstBad.focus();
      return;
    }

    var name = document.getElementById('name').value.trim().split(/\s+/)[0];
    document.getElementById('doneHead').textContent = 'Shukriya, ' + name + ' — order noted.';
    document.getElementById('doneBody').textContent =
      (fulfil === 'delivery'
        ? count() + ' item(s) on their way — about 45 minutes to your door.'
        : 'Your ' + count() + ' item(s) will be ready to collect in about 25 minutes.');

    order = [];
    save();
    paint();
    formEl.reset();
    setFulfil('pickup');

    var done = document.getElementById('done');
    done.hidden = false;
    document.querySelector('.order-grid').hidden = true;
    done.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  document.getElementById('againBtn').addEventListener('click', function () {
    document.getElementById('done').hidden = true;
    document.querySelector('.order-grid').hidden = false;
    document.getElementById('menu').scrollIntoView({ behavior: 'smooth' });
  });

  /* ---------- reveals ---------- */

  var toReveal = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    toReveal.forEach(function (n) { io.observe(n); });
    /* Backgrounded-tab safety net: if nothing has fired shortly after load, show all. */
    setTimeout(function () {
      toReveal.forEach(function (n) { n.classList.add('is-in'); });
    }, 2500);
  } else {
    toReveal.forEach(function (n) { n.classList.add('is-in'); });
  }

  paint();
})();
