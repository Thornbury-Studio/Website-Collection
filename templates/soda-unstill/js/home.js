/* UNSTILL — home. Range cards and every computed figure on the page. */
(function (root, doc) {
  'use strict';

  var U = root.UNSTILL;
  if (!U) return;

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function set(id, html) {
    var el = doc.getElementById(id);
    if (el) el.innerHTML = html;
  }

  function rangeCards() {
    var host = doc.getElementById('rangeCards');
    if (!host) return;
    host.innerHTML = U.flavors.map(function (f, i) {
      return '<a class="can-card reveal' + (i ? ' reveal--d' + Math.min(i, 3) : '') +
        '" href="flavor.html?id=' + f.id + '">' +
        '<div class="can-card__media">' +
        '<img src="img/can-' + f.id + '.webp" width="717" height="1128" loading="lazy" ' +
        'decoding="async" alt="The ' + esc(f.name) + ' can: ' + esc(f.strap.toLowerCase()) + '.">' +
        '<span class="can-card__tag sticker sticker--bone tilt-l">' +
        'Chaos ' + f.chaos + '/5</span></div>' +
        '<div class="can-card__body"><h3>' + esc(f.name) + '</h3>' +
        '<p>' + esc(f.strap) + '</p>' +
        '<div class="can-card__foot"><span class="can-card__price num">' +
        U.money(U.pricing.can) + '</span><span class="label">330 ml</span></div>' +
        '</div></a>';
    }).join('');
    /* These cards were injected after the reveal observer's first scan; without
       a rescan they hold their space at opacity 0 forever. */
    if (root.UnstillUI) root.UnstillUI.rescanReveals();
  }

  function figures() {
    set('crateDiscountPct', Math.round(U.pricing.crateDiscount * 100) + '%');
    set('subDiscountPct', Math.round(U.pricing.subDiscount * 100) + '%');
    set('statCan', U.money(U.pricing.can));
    set('statCrate', U.money(U.cratePrice()));
    set('statSub', U.money(U.subCratePrice()));
    var shops = 0;
    U.stockists.forEach(function (c) { shops += c.shops.length; });
    set('statShops', String(shops));
    set('statCities', String(U.stockists.length));
  }

  function boot() {
    rangeCards();
    figures();
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window, document);
