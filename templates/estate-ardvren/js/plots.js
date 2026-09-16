/* ARDVREN — the Phase 2 schedule: filter by ground and availability, sort. */
(function () {
  'use strict';

  var A = window.ARDVREN;
  var list = document.getElementById('plotList');
  var data = window.ARDVREN_PLOTS;
  if (!list || !A || !data) return;

  var seg = document.getElementById('typeSeg');
  var availOnly = document.getElementById('availOnly');
  var sortBy = document.getElementById('sortBy');
  var count = document.getElementById('plotCount');

  var TYPE = { woodland: 'Woodland', ridge: 'Ridge', lochside: 'Lochside' };
  var STATUS = { available: 'Available', reserved: 'Reserved', sold: 'Sold' };
  var type = 'all';

  function acres(m2) { return (m2 / 4046.86).toFixed(2); }

  function row(p) {
    var meta = p.type === 'lochside'
      ? '<b>' + p.shore + ' m of shore</b>to the waterline'
      : p.type === 'ridge'
        ? '<b>' + p.elev + ' m above the loch</b>with the view'
        : '<b>Under the canopy</b>on the loop road';
    var act = p.status === 'available'
      ? '<a class="btn btn--ghost btn--sm" href="visit.html?plot=' + p.no + '#book">Reserve</a>'
      : p.status === 'reserved'
        ? '<a class="textlink" href="visit.html?plot=' + p.no + '&amp;wait=1#book">Tell me</a>'
        : '';
    return '<li class="plot plot--' + p.status + '">' +
      '<span class="plot__no">' + p.no + '</span>' +
      '<span class="plot__type">' + TYPE[p.type] + '<small>' + A.esc(p.note) + '</small></span>' +
      '<span class="plot__meta"><b>' + p.size.toLocaleString('en-GB') + ' m&sup2;</b>' + acres(p.size) + ' acres</span>' +
      '<span class="plot__meta">' + meta + '</span>' +
      '<span class="plot__price' + (p.status === 'sold' ? ' is-sold' : '') + '">' + A.money(p.price) + '</span>' +
      '<span class="plot__act"><span class="plot__status"><i class="dot' + (p.status === 'reserved' ? ' dot--reserved' : p.status === 'sold' ? ' dot--sold' : '') + '"></i>' + STATUS[p.status] + '</span>' + (act ? '<br>' + act : '') + '</span>' +
      '</li>';
  }

  function render() {
    var rows = data.filter(function (p) {
      if (type !== 'all' && p.type !== type) return false;
      if (availOnly.checked && p.status !== 'available') return false;
      return true;
    });
    var s = sortBy.value;
    rows.sort(function (a, b) {
      if (s === 'price-asc') return a.price - b.price;
      if (s === 'price-desc') return b.price - a.price;
      if (s === 'size-desc') return b.size - a.size;
      return a.no - b.no;
    });
    list.innerHTML = rows.length ? rows.map(row).join('') : '<li class="plots__empty">No plots match. Reserved plots come back if missives lapse; ask to be told.</li>';
    var avail = rows.filter(function (p) { return p.status === 'available'; }).length;
    count.textContent = rows.length + ' plot' + (rows.length === 1 ? '' : 's') + ' · ' + avail + ' available';
  }

  seg.addEventListener('click', function (e) {
    var b = e.target.closest('button');
    if (!b) return;
    type = b.getAttribute('data-type');
    seg.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
    render();
  });
  availOnly.addEventListener('change', render);
  sortBy.addEventListener('change', render);

  // Deep link from the home page: plots.html?type=lochside
  var pre = A.qs('type');
  if (pre && TYPE[pre]) {
    var btn = seg.querySelector('button[data-type="' + pre + '"]');
    if (btn) btn.click(); else render();
  } else {
    render();
  }
})();
