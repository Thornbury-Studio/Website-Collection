/* KIAM 咸 — site.js
   One classic script, no dependencies, no inline handlers (CSP: script-src 'self').
   The catalogue below is the single source for every number the pages quote;
   PRODUCT.md is its human-readable twin. */
(function () {
  'use strict';

  /* ---------- Catalogue ---------- */
  var KIAM = {
    bottleMl: 250,
    saltMgPerBottle: 150,
    colaSugarPerBottle: 26.5,   // g, a 250 ml pour of an ordinary cola (10.6 g/100 ml)
    prices: { single: 5, six: 27, twelve: 50, deliveryFee: 6, freeDeliveryFrom: 60 },
    whatsapp: '6582104632',
    sodas: [
      { id: 'calamansi',  name: 'Calamansi & Sour Plum',      sugar100: 3.4, fruit: 'calamansi juice 20%', color: '#d8d54f', taste: [3, 5, 2] },
      { id: 'grapefruit', name: 'Pink Grapefruit & Sea Salt', sugar100: 3.2, fruit: 'pink grapefruit juice 22%', color: '#f08a80', taste: [3, 3, 2] },
      { id: 'pineapple',  name: 'Pineapple & Sea Salt',       sugar100: 3.6, fruit: 'pineapple juice 24%', color: '#f2c24b', taste: [3, 2, 3] },
      { id: 'roselle',    name: 'Roselle & Sea Salt',         sugar100: 3.0, fruit: 'roselle infusion', color: '#a81b36', taste: [2, 4, 2] },
      { id: 'watermelon', name: 'Watermelon & Sea Salt',      sugar100: 2.8, fruit: 'watermelon juice 30%', color: '#ee5a73', taste: [3, 1, 3], seasonal: 'until December' }
    ]
  };
  KIAM.sodas.forEach(function (s) { s.sugarBottle = Math.round(s.sugar100 * KIAM.bottleMl / 100 * 2) / 2; });
  KIAM.sugarRange = (function () {
    var v = KIAM.sodas.map(function (s) { return s.sugarBottle; });
    return { min: Math.min.apply(null, v), max: Math.max.apply(null, v) };
  })();
  window.KIAM = KIAM;

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var money = function (n) { return 'S$' + (Math.round(n * 100) / 100).toString().replace(/\.5$/, '.50'); };
  var NBSP = String.fromCharCode(160); // number + unit never break across a line

  /* ---------- Figures: any element with data-fig renders from the catalogue ---------- */
  var figs = {
    'price-single': function () { return money(KIAM.prices.single); },
    'price-six': function () { return money(KIAM.prices.six); },
    'price-twelve': function () { return money(KIAM.prices.twelve); },
    'delivery-fee': function () { return money(KIAM.prices.deliveryFee); },
    'free-from': function () { return money(KIAM.prices.freeDeliveryFrom); },
    'salt-mg': function () { return KIAM.saltMgPerBottle + NBSP + 'mg'; },
    'sugar-range': function () { return KIAM.sugarRange.min + '–' + KIAM.sugarRange.max + NBSP + 'g'; },
    'cola-sugar': function () { return KIAM.colaSugarPerBottle + NBSP + 'g'; },
    'sugar-fraction': function () {
      var avg = KIAM.sodas.reduce(function (a, s) { return a + s.sugarBottle; }, 0) / KIAM.sodas.length;
      var frac = avg / KIAM.colaSugarPerBottle;                       // ≈ 0.30
      return frac <= 0.34 ? 'about a third' : 'under half';
    },
    'count': function () { return String(KIAM.sodas.length); }
  };
  $$('[data-fig]').forEach(function (el) {
    var key = el.getAttribute('data-fig');
    var soda = el.getAttribute('data-soda');
    if (soda) {
      var s = KIAM.sodas.filter(function (x) { return x.id === soda; })[0];
      if (!s) return;
      if (key === 'sugar100') el.textContent = s.sugar100 + NBSP + 'g';
      if (key === 'sugar-bottle') el.textContent = s.sugarBottle + NBSP + 'g';
      return;
    }
    if (figs[key]) el.textContent = figs[key]();
  });

  /* ---------- Nav (phone) ---------- */
  var toggle = $('.nav-toggle'), nav = $('.nav');
  if (toggle && nav) {
    var setOpen = function (open) {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.textContent = open ? 'Close' : 'Menu';
    };
    toggle.addEventListener('click', function () { setOpen(!nav.classList.contains('is-open')); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { setOpen(false); toggle.focus(); }
    });
    // clicking outside closes
    document.addEventListener('click', function (e) {
      if (nav.classList.contains('is-open') && !nav.contains(e.target) && e.target !== toggle) setOpen(false);
    });
  }

  /* ---------- Hero line-up: stagger index for the fill ---------- */
  $$('.lineup-item').forEach(function (el, i) { el.style.setProperty('--i', i); });

  /* ---------- Six-pack builder (sodas page) ---------- */
  var pack = $('.pack');
  if (pack) {
    var SIZE = 6;
    var counts = {};
    var rows = $$('.pack-row', pack);
    var total = $('.pack-total .big', pack);
    var price = $('.pack-price b', pack);
    var priceNote = $('.pack-price .note-line', pack);
    var msg = $('.pack-msg', pack);
    var order = $('.pack-order', pack);

    var sum = function () { return Object.keys(counts).reduce(function (a, k) { return a + counts[k]; }, 0); };

    var render = function () {
      var n = sum();
      rows.forEach(function (row) {
        var id = row.getAttribute('data-soda');
        $('output', row).value = counts[id];
        $('.dec', row).disabled = counts[id] === 0;
        $('.inc', row).disabled = n >= SIZE;
      });
      total.textContent = n;
      var packs = n === SIZE ? 1 : 0;
      var cost = packs ? KIAM.prices.six : n * KIAM.prices.single;
      price.textContent = money(cost);
      priceNote.textContent = n === SIZE
        ? 'six-pack price'
        : (n === 0 ? 'pick six bottles, any mix' : 'six bottles cost ' + money(KIAM.prices.six) + ' — ' + (SIZE - n) + ' to go');
      var ready = n === SIZE;
      order.setAttribute('aria-disabled', String(!ready));
      order.tabIndex = ready ? 0 : -1;
      if (ready) {
        var lines = KIAM.sodas.filter(function (s) { return counts[s.id] > 0; })
          .map(function (s) { return counts[s.id] + ' × ' + s.name; });
        var text = 'Hi Kiam, I’d like to order a six-pack: ' + lines.join(', ') + '. ' +
          '(' + money(KIAM.prices.six) + ' + delivery unless I collect on Saturday.) My name is ';
        order.href = 'https://wa.me/' + KIAM.whatsapp + '?text=' + encodeURIComponent(text);
        msg.textContent = 'Opens WhatsApp with the order written out. Add your name and where to deliver.';
      } else {
        order.removeAttribute('href');
        msg.textContent = '';
      }
    };

    rows.forEach(function (row) {
      var id = row.getAttribute('data-soda');
      counts[id] = 0;
      $('.inc', row).addEventListener('click', function () { if (sum() < SIZE) { counts[id]++; render(); } });
      $('.dec', row).addEventListener('click', function () { if (counts[id] > 0) { counts[id]--; render(); } });
    });
    order.addEventListener('click', function (e) { if (order.getAttribute('aria-disabled') === 'true') e.preventDefault(); });
    render();
  }

  /* ---------- Stockist map ↔ list ---------- */
  var map = $('.map');
  if (map) {
    var pins = $$('.pin', map);
    var items = $$('.stockists li[data-id]');
    var light = function (id, on) {
      pins.forEach(function (p) { p.classList.toggle('is-on', on && p.getAttribute('data-id') === id); });
      items.forEach(function (li) { li.classList.toggle('is-on', on && li.getAttribute('data-id') === id); });
    };
    pins.forEach(function (p) {
      var id = p.getAttribute('data-id');
      p.addEventListener('mouseenter', function () { light(id, true); });
      p.addEventListener('mouseleave', function () { light(id, false); });
      p.addEventListener('focus', function () { light(id, true); });
      p.addEventListener('blur', function () { light(id, false); });
    });
    items.forEach(function (li) {
      var id = li.getAttribute('data-id');
      li.addEventListener('mouseenter', function () { light(id, true); });
      li.addEventListener('mouseleave', function () { light(id, false); });
      li.addEventListener('focusin', function () { light(id, true); });
      li.addEventListener('focusout', function () { light(id, false); });
    });
  }

  /* ---------- Contact form: validate, then fall through to mailto ---------- */
  var form = $('.contact-form form');
  if (form) {
    form.setAttribute('novalidate', '');
    var fields = ['name', 'email', 'message'];
    var show = function (name, text) {
      var wrap = form.elements[name].closest('.field');
      var err = $('.err', wrap);
      wrap.classList.toggle('is-invalid', !!text);
      err.textContent = text || '';
      form.elements[name].setAttribute('aria-invalid', text ? 'true' : 'false');
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true, first = null;
      fields.forEach(function (n) {
        var el = form.elements[n], v = el.value.trim(), t = '';
        if (!v) t = n === 'message' ? 'Write us something — even one line.' : 'We need this to reply.';
        else if (n === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) t = 'That email doesn’t look right.';
        show(n, t);
        if (t) { ok = false; first = first || el; }
      });
      if (!ok) { first.focus(); return; }
      var subject = 'Message from ' + form.elements.name.value.trim();
      var body = form.elements.message.value.trim() + '\n\n— ' + form.elements.name.value.trim() + ' (' + form.elements.email.value.trim() + ')';
      window.location.href = 'mailto:hello@kiam.sg?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      var done = $('.form-done');
      if (done) { done.hidden = false; done.setAttribute('tabindex', '-1'); done.focus(); }
    });
  }
})();
