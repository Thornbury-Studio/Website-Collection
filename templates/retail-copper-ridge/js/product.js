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

  function deptLabel(slug) {
    var d = (window.CR_DEPTS || []).find(function (x) { return x[0] === slug; });
    return d ? d[1] : slug;
  }

  if (!p) {
    root.innerHTML =
      '<div class="not-found"><h1>SKU not found</h1>' +
      '<p><a class="btn btn-ghost" href="shop.html">Back to the catalog</a></p></div>';
    var crumb = document.querySelector('.crumb');
    if (crumb) crumb.innerHTML = '<a href="index.html">Home</a> / <a href="shop.html">Shop</a> / Not found';
    return;
  }

  document.title = p.name + ' — Copper Ridge Cartridge Co.';
  var descMeta = document.querySelector('meta[name="description"]');
  if (descMeta) descMeta.setAttribute('content', p.desc);

  var crumb = document.querySelector('.crumb');
  if (crumb) {
    crumb.innerHTML =
      '<a href="index.html">Home</a> / <a href="shop.html">Shop</a> / ' +
      '<a href="shop.html?dept=' + encodeURIComponent(p.dept) + '">' + window.CR.esc(deptLabel(p.dept)) + '</a> / ' +
      '<span>' + window.CR.esc(p.sku) + '</span>';
  }

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
  if (p.stockQty != null && p.stock !== 'out') stockText += ' · ' + p.stockQty + ' on floor';
  var disabled = p.stock === 'out' ? ' disabled' : '';

  var packHtml = '';
  if (p.caseOf || p.boxOf) {
    packHtml =
      '<div class="pack-toggle" role="group" aria-label="Pack size">' +
        '<button type="button" class="is-on" data-pack="current">This SKU</button>' +
        (p.caseOf
          ? '<button type="button" data-pack="case" data-href="product.html#' + encodeURIComponent(p.caseOf) + '">Buy case</button>'
          : '') +
        (p.boxOf
          ? '<button type="button" data-pack="box" data-href="product.html#' + encodeURIComponent(p.boxOf) + '">Buy box</button>'
          : '') +
      '</div>';
  }

  var etaHtml = '';
  if (p.stock === 'out' && p.eta) {
    etaHtml = '<p class="eta-note">' + window.CR.esc(p.eta) + '. Leave a note at the counter or check back — we do not take deposits on this showcase.</p>';
  }

  var reviews = (window.CR_REVIEWS && window.CR_REVIEWS[p.id]) || [];
  var reviewsHtml = '';
  if (reviews.length) {
    reviewsHtml =
      '<section class="reviews" aria-labelledby="reviewsTitle">' +
        '<h2 id="reviewsTitle">Customer notes</h2>' +
        reviews.map(function (r) {
          var stars = Array(r.stars + 1).join('★') + Array(6 - r.stars).join('☆');
          return (
            '<article class="review">' +
              '<div class="review-meta"><span class="stars" aria-label="' + r.stars + ' of 5">' + stars + '</span> · ' +
              window.CR.esc(r.name) + ' · ' + window.CR.esc(r.place) + '</div>' +
              '<p>' + window.CR.esc(r.text) + '</p>' +
            '</article>'
          );
        }).join('') +
      '</section>';
  }

  var related = window.CR_CATALOG.filter(function (x) {
    return x.id !== p.id && (x.caliber === p.caliber || (x.dept === p.dept && x.use === p.use));
  }).slice(0, 4);

  var relatedHtml = '';
  if (related.length) {
    relatedHtml =
      '<section class="related" aria-labelledby="relatedTitle">' +
        '<h2 id="relatedTitle">Also in this caliber / aisle</h2>' +
        '<div class="related-grid">' +
        related.map(function (r) {
          return (
            '<a class="related-card" href="product.html#' + encodeURIComponent(r.id) + '">' +
              '<img src="' + window.CR.esc(r.img) + '" alt="" width="120" height="120" loading="lazy">' +
              '<div><strong>' + window.CR.esc(r.name) + '</strong>' +
              '<span>' + window.CR.money(r.price) + ' · ' + window.CR.esc(r.sku) + '</span></div>' +
            '</a>'
          );
        }).join('') +
        '</div></section>';
  }

  root.innerHTML =
    '<div class="pdp-layout">' +
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
        '<p class="pdp-trust">Missoula floor · ' + (p.hazmat ? 'Ground hazmat' : 'Standard ground') + '</p>' +
        packHtml +
        etaHtml +
        '<p class="pdp-desc">' + window.CR.esc(p.desc) + '</p>' +
        restrict +
        '<table class="spec-table">' +
          '<tr><th>Caliber</th><td>' + window.CR.esc(p.caliber) + '</td></tr>' +
          grainRow +
          '<tr><th>Bullet</th><td>' + window.CR.esc(p.bulletType) + '</td></tr>' +
          '<tr><th>Case</th><td>' + window.CR.esc(p.caseType) + '</td></tr>' +
          '<tr><th>Use</th><td>' + window.CR.esc(p.use) + '</td></tr>' +
          ballisticRows +
          (p.hazmat ? '<tr><th>Shipping</th><td>Ground hazmat · signature · hazmat fee at checkout</td></tr>' : '') +
        '</table>' +
        '<div class="pdp-actions">' +
          '<div class="qty-field">' +
            '<button type="button" id="qtyMinus" aria-label="Decrease quantity">−</button>' +
            '<input id="qtyInput" type="number" min="1" max="99" value="1" aria-label="Quantity">' +
            '<button type="button" id="qtyPlus" aria-label="Increase quantity">+</button>' +
          '</div>' +
          '<button class="btn btn-brass" type="button" id="addBtn"' + disabled + '>Add to cart</button>' +
        '</div>' +
        reviewsHtml +
      '</div>' +
    '</div>' + relatedHtml;

  var qtyInput = document.getElementById('qtyInput');
  var minus = document.getElementById('qtyMinus');
  var plus = document.getElementById('qtyPlus');
  var addBtn = document.getElementById('addBtn');
  if (minus) {
    minus.addEventListener('click', function () {
      qtyInput.value = Math.max(1, (parseInt(qtyInput.value, 10) || 1) - 1);
    });
  }
  if (plus) {
    plus.addEventListener('click', function () {
      qtyInput.value = Math.min(99, (parseInt(qtyInput.value, 10) || 1) + 1);
    });
  }
  if (addBtn) {
    addBtn.addEventListener('click', function () {
      if (window.CR.addToCart(p.id, qtyInput.value)) {
        document.dispatchEvent(new CustomEvent('cr:cartchange'));
        document.dispatchEvent(new CustomEvent('cr:opencart'));
      }
    });
  }

  root.querySelectorAll('.pack-toggle [data-href]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      location.href = btn.getAttribute('data-href');
    });
  });
})();
