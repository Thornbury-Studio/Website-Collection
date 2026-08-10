/* OVERCAST — shop.js
   Renders the collection grid from the shared catalogue, then filters and
   sorts it. Cards are built once and reordered/hidden in place, so filtering
   never re-decodes an image. */

(function () {
  'use strict';
  if (!window.OC) return;

  var CAT = OC.CATALOGUE;
  var grid = document.getElementById('grid');
  if (!grid) return;

  var WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'];
  var ORDER = ['overshirt', 'cableknit', 'crew', 'jacket', 'trouser', 'shirt', 'scarf', 'cap'];
  var TAG = { overshirt: 'Best seller', jacket: 'Low stock', crew: 'Restocked' };

  /* ---- build the cards once ---- */

  grid.innerHTML = ORDER.map(function (id, i) {
    var p = CAT[id];
    var sizes = Object.keys(p.sizes);
    var soldOut = sizes.every(function (s) { return !p.sizes[s]; });
    var quick = sizes.map(function (s) {
      return p.sizes[s]
        ? '<button class="size-btn" data-add="' + id + '" data-size="' + s + '">' + s + '</button>'
        : '<button class="size-btn" disabled title="Sold out">' + s + '</button>';
    }).join('');

    return '<article class="card rv' + (i % 4 ? ' rv-d' + (i % 4) : '') +
      '" data-id="' + id + '" data-cat="' + p.cat + '" data-price="' + p.price + '">' +
      '<a href="product.html" class="card-media img-rv" aria-label="' + p.name + '">' +
      (TAG[id] ? '<span class="card-tag">' + TAG[id] + '</span>' : '') +
      (soldOut ? '<span class="card-tag sold">Sold out</span>' : '') +
      '<img src="' + p.img + '" alt="' + p.name + ' — close detail of the cloth." loading="lazy" decoding="async">' +
      '<span class="quick"><span class="quick-lbl">Quick add</span>' + quick + '</span>' +
      '</a>' +
      '<div class="card-body"><div class="card-row">' +
      '<a class="card-name" href="product.html">' + p.name + '</a>' +
      '<span class="card-price">' + OC.money(p.price) + '</span></div>' +
      '<span class="card-meta">' + p.fabric + ' &middot; ' + p.cat + '</span></div></article>';
  }).join('');

  var cards = OC.$$('.card', grid);

  /* the reveal observer already ran on DOMContentLoaded, so show these now */
  requestAnimationFrame(function () {
    cards.forEach(function (c) {
      c.classList.add('in');
      var m = c.querySelector('.img-rv'); if (m) m.classList.add('in');
    });
  });

  /* ---- filter + sort ---- */

  var state = { cat: 'all', sort: 'featured' };

  function apply() {
    var shown = 0;
    cards.forEach(function (c) {
      var on = state.cat === 'all' || c.dataset.cat === state.cat;
      c.hidden = !on;
      if (on) shown++;
    });

    var sorted = cards.slice();
    if (state.sort === 'low')  sorted.sort(function (a, b) { return a.dataset.price - b.dataset.price; });
    if (state.sort === 'high') sorted.sort(function (a, b) { return b.dataset.price - a.dataset.price; });
    sorted.forEach(function (c) { grid.appendChild(c); });

    document.getElementById('countLbl').textContent =
      (shown < WORDS.length ? WORDS[shown] : shown) + (shown === 1 ? ' piece' : ' pieces');
    document.getElementById('empty').hidden = shown > 0;
  }

  document.getElementById('chips').addEventListener('click', function (e) {
    var b = e.target.closest('.chip'); if (!b) return;
    OC.$$('.chip').forEach(function (c) { c.classList.toggle('on', c === b); });
    state.cat = b.dataset.cat;
    apply();
  });

  document.getElementById('sort').addEventListener('change', function (e) {
    state.sort = e.target.value;
    apply();
  });

  apply();
})();
