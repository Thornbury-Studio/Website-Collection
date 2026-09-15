/* Shop grid + filters — shop.html (also works if #productGrid exists) */

(function () {
  'use strict';
  if (!window.CR_CATALOG || !window.CR) return;

  var grid = document.getElementById('productGrid');
  if (!grid) return;

  var state = {
    dept: 'all',
    use: 'all',
    query: '',
    inStockOnly: false,
    sort: 'featured'
  };

  function stockLabel(s) {
    if (s === 'low') return { cls: 'low', text: 'Low stock' };
    if (s === 'out') return { cls: 'out', text: 'Out of stock' };
    return { cls: 'in', text: 'In stock' };
  }

  function sortItems(items) {
    var list = items.slice();
    if (state.sort === 'price-asc') {
      list.sort(function (a, b) { return a.price - b.price; });
    } else if (state.sort === 'price-desc') {
      list.sort(function (a, b) { return b.price - a.price; });
    } else if (state.sort === 'caliber') {
      list.sort(function (a, b) {
        return a.caliber.localeCompare(b.caliber) || a.name.localeCompare(b.name);
      });
    } else if (state.sort === 'stock') {
      var rank = { in: 0, low: 1, out: 2 };
      list.sort(function (a, b) {
        return (rank[a.stock] || 9) - (rank[b.stock] || 9) || a.name.localeCompare(b.name);
      });
    }
    return list;
  }

  function render() {
    var q = state.query.trim().toLowerCase();
    var items = window.CR_CATALOG.filter(function (p) {
      if (state.dept !== 'all' && p.dept !== state.dept) return false;
      if (state.use !== 'all' && p.use !== state.use) return false;
      if (state.inStockOnly && p.stock === 'out') return false;
      if (q) {
        var hay = (p.name + ' ' + p.brand + ' ' + p.caliber + ' ' + p.sku + ' ' + p.bulletType).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });

    items = sortItems(items);

    var countEl = document.getElementById('resultCount');
    if (countEl) countEl.textContent = items.length + (items.length === 1 ? ' SKU' : ' SKUs');

    if (!items.length) {
      grid.innerHTML = '<p class="empty-shop">No cartridges match those filters. Clear search or pick another caliber.</p>';
      return;
    }

    var listMode = window.matchMedia('(max-width: 640px)').matches;
    grid.classList.toggle('is-list', listMode);

    grid.innerHTML = items.map(function (p) {
      var badge = stockLabel(p.stock);
      var grain = p.grain ? p.grain + 'gr · ' : '';
      var per = p.qty > 1 && p.pricePerRound < 500
        ? '<span class="per-round">' + window.CR.money(p.pricePerRound) + '/rd</span>'
        : '';
      var ground = p.hazmat ? '<span class="chip-mini">Ground only</span>' : '<span class="chip-mini muted">Standard</span>';
      var stockChip = '<span class="chip-mini ' + badge.cls + '">' + window.CR.esc(badge.text) +
        (p.stockQty != null && p.stock !== 'out' ? ' · ' + p.stockQty : '') + '</span>';
      return (
        '<a class="product-card reveal visible" href="product.html#' + encodeURIComponent(p.id) + '">' +
          '<div class="product-visual">' +
            '<img src="' + window.CR.esc(p.img) + '" alt="' + window.CR.esc(p.name) + '" width="700" height="700" loading="lazy" decoding="async">' +
          '</div>' +
          '<div class="product-info">' +
            '<div class="product-top">' +
              '<span class="product-brand">' + window.CR.esc(p.brand) + '</span>' +
              '<span class="product-sku">' + window.CR.esc(p.sku) + '</span>' +
            '</div>' +
            '<h3>' + window.CR.esc(p.name) + '</h3>' +
            '<div class="product-specs"><span>' + window.CR.esc(p.caliber) + '</span><span>' + grain + window.CR.esc(p.bulletType) + '</span><span>' + p.qty + ' ct</span></div>' +
            '<div class="product-chips">' + stockChip + ground + '</div>' +
            '<div class="product-foot"><strong>' + window.CR.money(p.price) + '</strong>' + per + '</div>' +
          '</div>' +
        '</a>'
      );
    }).join('');
  }

  function setDept(dept) {
    state.dept = dept;
    document.querySelectorAll('.filter[data-dept]').forEach(function (btn) {
      btn.classList.toggle('is-on', btn.getAttribute('data-dept') === dept);
    });
    render();
  }

  function setUse(use) {
    state.use = use;
    document.querySelectorAll('.chip[data-use]').forEach(function (btn) {
      btn.classList.toggle('is-on', btn.getAttribute('data-use') === use);
    });
    render();
  }

  var filterHost = document.getElementById('deptFilters');
  if (filterHost) {
    var counts = { all: window.CR_CATALOG.length };
    window.CR_DEPTS.forEach(function (d) {
      counts[d[0]] = window.CR_CATALOG.filter(function (p) { return p.dept === d[0]; }).length;
    });
    var html = '<button class="filter is-on" type="button" data-dept="all">All <span>' + counts.all + '</span></button>';
    window.CR_DEPTS.forEach(function (d) {
      html += '<button class="filter" type="button" data-dept="' + d[0] + '">' + window.CR.esc(d[1]) +
        ' <span>' + (counts[d[0]] || 0) + '</span></button>';
    });
    filterHost.innerHTML = html;
    filterHost.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-dept]');
      if (!btn) return;
      setDept(btn.getAttribute('data-dept'));
    });
  }

  document.querySelectorAll('.chip[data-use]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var u = btn.getAttribute('data-use');
      setUse(state.use === u ? 'all' : u);
    });
  });

  document.querySelectorAll('.chip[data-caliber]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var cal = btn.getAttribute('data-caliber');
      var input = document.getElementById('finderInput') || document.getElementById('shopSearch');
      if (input) {
        input.value = cal;
        state.query = cal;
      }
      var shop = document.getElementById('shop');
      if (shop) shop.scrollIntoView({ behavior: 'smooth' });
      render();
    });
  });

  ['finderInput', 'shopSearch'].forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', function () {
      state.query = el.value;
      render();
    });
  });

  var stockToggle = document.getElementById('inStockOnly');
  if (stockToggle) {
    stockToggle.addEventListener('change', function () {
      state.inStockOnly = stockToggle.checked;
      render();
    });
  }

  var sortEl = document.getElementById('sortSelect');
  if (sortEl) {
    sortEl.addEventListener('change', function () {
      state.sort = sortEl.value;
      render();
    });
  }

  window.addEventListener('resize', function () {
    if (grid) render();
  });

  var params = new URLSearchParams(location.search);
  var deptParam = params.get('dept');
  if (deptParam && ['handgun', 'rifle', 'shotgun', 'rimfire', 'reloading'].indexOf(deptParam) !== -1) {
    setDept(deptParam);
  } else {
    render();
  }

  var useParam = params.get('use');
  if (useParam) setUse(useParam);

  var qParam = params.get('q');
  if (qParam) {
    state.query = qParam;
    var search = document.getElementById('shopSearch') || document.getElementById('finderInput');
    if (search) search.value = qParam;
    render();
  }

  window.CR_SHOP = { render: render, setDept: setDept, setUse: setUse };
})();
