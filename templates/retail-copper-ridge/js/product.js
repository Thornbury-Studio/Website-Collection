/* Product detail page */

(function () {
  'use strict';
  if (!window.CR_CATALOG || !window.CR) return;

  var root = document.getElementById('pdpRoot');
  if (!root) return;

  var id = new URLSearchParams(location.search).get('id');
  if (!id && location.hash) {
    var h = location.hash.replace(/^#/, '');
    id = h.indexOf('id=') === 0 ? h.slice(3).split('&')[0] : h.split('&')[0];
  }
  var p = window.CR.catalogById(id);

  if (!p) {
    root.innerHTML =
      '<div class="not-found"><h1>SKU not found</h1>' +
      '<p><a class="btn btn-ghost" href="index.html#shop">Back to the catalog</a></p></div>';
    return;
  }

  document.title = p.name + ' — Copper Ridge Cartridge Co.';
  var descMeta = document.querySelector('meta[name="description"]');
  if (descMeta) descMeta.setAttribute('content', p.desc);

  var restrict = '';
  if (p.restrictions && p.restrictions.length) {
    restrict =
      '<div class="restrict-callout" role="note">' +
      'Cannot ship to: ' + window.CR.esc(p.restrictions.join(', ')) +
      '. Confirm your state at checkout.</div>';
  }

  var ballisticRows = '';
  if (p.velocity) {
    ballisticRows +=
      '<tr><th>Muzzle velocity</th><td>' + p.velocity.toLocaleString() + ' fps</td></tr>';
  }
  if (p.energy) {
    ballisticRows +=
      '<tr><th>Muzzle energy</th><td>' + p.energy.toLocaleString() + ' ft-lbs</td></tr>';
  }

  var grainRow = p.grain
    ? '<tr><th>Bullet weight</th><td>' + p.grain + ' gr</td></tr>'
    : '';

  var stockText = p.stock === 'out' ? 'Out of stock' : p.stock === 'low' ? 'Low stock' : 'In stock';
  var disabled = p.stock === 'out' ? ' disabled' : '';

  root.innerHTML =
    '<div class="pdp-photo">' +
      '<img src="' + window.CR.esc(p.img) + '" alt="' + window.CR.esc(p.name) + '" width="900" height="900">' +
    '</div>' +
    '<div class="pdp-body">' +
      '<p class="pdp-kicker">' + window.CR.esc(p.brand) + ' · ' + window.CR.esc(deptLabel(p.dept)) + '</p>' +
      '<h1>' + window.CR.esc(p.name) + '</h1>' +
      '<p class="pdp-sku">SKU ' + window.CR.esc(p.sku) + ' · ' + stockText + '</p>' +
      '<div class="pdp-price"><strong>' + window.CR.money(p.price) + '</strong>' +
        (p.qty > 1 && p.pricePerRound < 500
          ? '<span class="per-round">' + window.CR.money(p.pricePerRound) + ' per round · ' + p.qty + ' ct</span>'
          : '') +
      '</div>' +
      '<p class="pdp-desc">' + window.CR.esc(p.desc) + '</p>' +
      restrict +
      '<table class="spec-table">' +
        '<tr><th>Caliber</th><td>' + window.CR.esc(p.caliber) + '</td></tr>' +
        grainRow +
        '<tr><th>Bullet</th><td>' + window.CR.esc(p.bulletType) + '</td></tr>' +
        '<tr><th>Case</th><td>' + window.CR.esc(p.caseType) + '</td></tr>' +
        '<tr><th>Use</th><td>' + window.CR.esc(p.use) + '</td></tr>' +
        ballisticRows +
        (p.hazmat ? '<tr><th>Shipping</th><td>Ground hazmat · signature on delivery</td></tr>' : '') +
      '</table>' +
      '<div class="pdp-actions">' +
        '<div class="qty-field">' +
          '<button type="button" id="qtyMinus" aria-label="Decrease quantity">−</button>' +
          '<input id="qtyInput" type="number" min="1" max="99" value="1" aria-label="Quantity">' +
          '<button type="button" id="qtyPlus" aria-label="Increase quantity">+</button>' +
        '</div>' +
        '<button class="btn btn-brass" type="button" id="addBtn"' + disabled + '>Add to cart</button>' +
      '</div>' +
    '</div>';

  var qtyInput = document.getElementById('qtyInput');
  document.getElementById('qtyMinus').addEventListener('click', function () {
    qtyInput.value = Math.max(1, (parseInt(qtyInput.value, 10) || 1) - 1);
  });
  document.getElementById('qtyPlus').addEventListener('click', function () {
    qtyInput.value = Math.min(99, (parseInt(qtyInput.value, 10) || 1) + 1);
  });
  document.getElementById('addBtn').addEventListener('click', function () {
    if (window.CR.addToCart(p.id, qtyInput.value)) {
      document.dispatchEvent(new CustomEvent('cr:cartchange'));
      document.dispatchEvent(new CustomEvent('cr:opencart'));
    }
  });

  function deptLabel(slug) {
    var d = (window.CR_DEPTS || []).find(function (x) { return x[0] === slug; });
    return d ? d[1] : slug;
  }
})();
