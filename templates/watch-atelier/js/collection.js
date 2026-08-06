/* AUREL — collection.js
   Catalogue filtering and the quick-look dialog. Filtering is a class
   toggle only (no layout reads, no reflow measuring); the grid reflows
   itself because filtered-out cards are display:none. */

(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };

  var grid = $('catGrid');
  if (!grid) return;

  var products = Array.prototype.slice.call(grid.querySelectorAll('.product'));
  var editorials = Array.prototype.slice.call(grid.querySelectorAll('.editorial'));
  var countEl = $('catCount');
  var emptyEl = $('catEmpty');
  var filterBar = $('filters');

  var WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];

  function matches(card, filter) {
    if (filter === 'all') return true;
    if (filter === 'available') return card.dataset.stock === 'available';
    return card.dataset.family === filter;
  }

  function apply(filter) {
    var shown = 0;
    products.forEach(function (card) {
      var on = matches(card, filter);
      card.hidden = !on;
      if (on) shown++;
    });
    // the editorial tile belongs to the whole collection, not a family
    editorials.forEach(function (el) { el.hidden = filter !== 'all'; });

    var word = shown < WORDS.length ? WORDS[shown] : String(shown);
    countEl.textContent = word + (shown === 1 ? ' reference' : ' references');
    emptyEl.hidden = shown > 0;
  }

  filterBar.addEventListener('click', function (e) {
    var btn = e.target.closest('.filter');
    if (!btn) return;
    filterBar.querySelectorAll('.filter').forEach(function (b) {
      b.classList.toggle('is-on', b === btn);
    });
    apply(btn.dataset.filter);
  });

  emptyEl.addEventListener('click', function (e) {
    if (!e.target.closest('[data-filter-reset]')) return;
    filterBar.querySelectorAll('.filter').forEach(function (b) {
      b.classList.toggle('is-on', b.dataset.filter === 'all');
    });
    apply('all');
  });

  /* ---------- quick look ---------- */

  var qv = $('qvDialog');
  var qvCurrent = null;

  grid.addEventListener('click', function (e) {
    var btn = e.target.closest('.quick-look');
    if (!btn) return;
    var card = btn.closest('.product');
    qvCurrent = card.dataset.name;

    $('qvImg').src = card.dataset.img;
    $('qvImg').alt = card.querySelector('img').alt;
    $('qvRef').textContent = card.dataset.ref;
    $('qvName').textContent = card.dataset.name;
    $('qvNote').textContent = card.dataset.note;
    $('qvDial').textContent = card.dataset.dial;
    $('qvStrap').textContent = card.dataset.strap;
    $('qvCase').textContent = card.dataset.case;
    $('qvPrice').textContent = card.dataset.price;

    var sold = card.dataset.stock === 'sold';
    var reserveBtn = $('qvReserve');
    reserveBtn.querySelector('span').textContent = sold ? 'Join the register' : 'Reserve this reference';

    qv.showModal();
  });

  $('qvClose').addEventListener('click', function () { qv.close(); });
  qv.addEventListener('click', function (e) { if (e.target === qv) qv.close(); });

  $('qvReserve').addEventListener('click', function () {
    qv.close();
    if (window.aurelOpenReserve) window.aurelOpenReserve(qvCurrent);
  });
})();
