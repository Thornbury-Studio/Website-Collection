/* UNSTILL — about: the all-flavours nutrition table, from the catalogue. */
(function (root, doc) {
  'use strict';

  var U = root.UNSTILL;
  if (!U) return;

  function boot() {
    var body = doc.querySelector('#nutritionAll tbody');
    if (!body) return;
    body.innerHTML = U.flavors.map(function (f) {
      return '<tr><th scope="row">' + f.name + '</th>' +
        '<td class="n">' + f.per100.kcal + '</td>' +
        '<td class="n">' + f.per100.sugar + '</td>' +
        '<td class="n">' + f.per100.carbs + '</td>' +
        '<td class="n">' + f.per100.salt + '</td></tr>';
    }).join('');
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window, document);
