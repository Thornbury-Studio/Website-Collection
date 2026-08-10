/* OVERCAST — pdp.js
   Gallery switching, size selection, add-to-bag (which requires a size,
   the way a real storefront does), and the "wears well with" rail. */

(function () {
  'use strict';
  if (!window.OC) return;

  var ID = 'overshirt';
  var chosen = null;

  /* ---- gallery ---- */

  var thumbs = document.getElementById('pdpThumbs');
  var main = document.getElementById('pdpMain');
  if (thumbs && main) {
    thumbs.addEventListener('click', function (e) {
      var b = e.target.closest('.pdp-thumb'); if (!b) return;
      OC.$$('.pdp-thumb', thumbs).forEach(function (t) { t.classList.toggle('on', t === b); });
      main.src = b.getAttribute('data-src');
    });
  }

  /* ---- size ---- */

  var row = document.getElementById('sizeRow');
  var warn = document.getElementById('sizeWarn');
  if (row) row.addEventListener('click', function (e) {
    var b = e.target.closest('.size-lg');
    if (!b || b.disabled) return;
    OC.$$('.size-lg', row).forEach(function (s) { s.classList.toggle('on', s === b); });
    chosen = b.getAttribute('data-size');
    warn.textContent = '';
  });

  var fit = document.getElementById('fitBtn');
  if (fit) fit.addEventListener('click', function () {
    var d = OC.$$('.acc details')[2];
    if (d) { d.open = true; d.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  });

  /* ---- add to bag ---- */

  var add = document.getElementById('addBtn');
  if (add) add.addEventListener('click', function () {
    if (!chosen) {
      warn.textContent = 'Please choose a size.';
      return;
    }
    OC.add(ID, chosen, { open: true });
  });

  /* ---- wears well with ---- */

  var rel = document.getElementById('related');
  if (rel) {
    var picks = ['cableknit', 'trouser', 'scarf', 'cap'];
    rel.innerHTML = picks.map(function (id, i) {
      var p = OC.CATALOGUE[id];
      var sizes = Object.keys(p.sizes).map(function (s) {
        return p.sizes[s]
          ? '<button class="size-btn" data-add="' + id + '" data-size="' + s + '">' + s + '</button>'
          : '<button class="size-btn" disabled title="Sold out">' + s + '</button>';
      }).join('');
      return '<article class="card rv' + (i ? ' rv-d' + i : '') + '">' +
        '<a href="product.html" class="card-media img-rv" aria-label="' + p.name + '">' +
        '<img src="' + p.img + '" alt="' + p.name + ' — close detail of the cloth." loading="lazy" decoding="async">' +
        '<span class="quick"><span class="quick-lbl">Quick add</span>' + sizes + '</span></a>' +
        '<div class="card-body"><div class="card-row">' +
        '<a class="card-name" href="product.html">' + p.name + '</a>' +
        '<span class="card-price">' + OC.money(p.price) + '</span></div>' +
        '<span class="card-meta">' + p.fabric + ' &middot; ' + p.cat + '</span></div></article>';
    }).join('');

    requestAnimationFrame(function () {
      OC.$$('.card', rel).forEach(function (c) {
        c.classList.add('in');
        var m = c.querySelector('.img-rv'); if (m) m.classList.add('in');
      });
    });
  }
})();
