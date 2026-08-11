/* UNSTILL — stockists: filterable by city, all counts computed. */
(function (root, doc) {
  'use strict';

  var U = root.UNSTILL;
  if (!U) return;

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  var current = 'all';

  function renderFilters() {
    var host = doc.getElementById('cityFilters');
    if (!host) return;
    var btns = ['<button class="btn btn--sm' + (current === 'all' ? '' : ' btn--ghost') +
      '" type="button" data-city="all" aria-pressed="' + (current === 'all') + '">Everywhere</button>'];
    U.stockists.forEach(function (c) {
      var on = current === c.city;
      btns.push('<button class="btn btn--sm' + (on ? '' : ' btn--ghost') +
        '" type="button" data-city="' + esc(c.city) + '" aria-pressed="' + on + '">' +
        esc(c.city) + ' <span class="num">(' + c.shops.length + ')</span></button>');
    });
    host.innerHTML = btns.join('');
  }

  function renderList() {
    var host = doc.getElementById('stockistList');
    if (!host) return;
    var groups = U.stockists.filter(function (c) {
      return current === 'all' || c.city === current;
    });
    host.innerHTML = groups.map(function (c) {
      return '<h2>' + esc(c.city) + '</h2><ul class="prose">' +
        c.shops.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul>';
    }).join('');

    var lede = doc.getElementById('stockistLede');
    if (lede) {
      var shops = 0;
      U.stockists.forEach(function (c) { shops += c.shops.length; });
      lede.textContent = shops + ' independent fridges across ' + U.stockists.length +
        ' UK cities, and proud of every one of them.';
    }
  }

  doc.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('[data-city]') : null;
    if (!btn) return;
    current = btn.getAttribute('data-city');
    renderFilters();
    renderList();
  });

  function boot() { renderFilters(); renderList(); }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window, document);
