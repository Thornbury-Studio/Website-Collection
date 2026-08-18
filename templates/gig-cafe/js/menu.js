/* GIG Cafe — menu renderer. GIG_MENU (js/menu-data.js) is the only source of
   truth; this file renders, filters and searches it. Menu rows are injected
   without reveal animations on purpose: the menu is the page people came for,
   it should simply be there. */
(function () {
  'use strict';

  var data = window.GIG_MENU;
  var groupsEl = document.getElementById('menuGroups');
  var railEl = document.getElementById('chipRail');
  var searchEl = document.getElementById('menuSearch');
  var clearEl = document.getElementById('searchClear');
  var countEl = document.getElementById('menuCount');
  if (!data || !groupsEl || !railEl) return;

  var activeGroup = 'all';
  var query = '';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function money(v) { return '$' + v.toFixed(2); }

  function priceHtml(item) {
    if (typeof item.price === 'number') return esc(money(item.price));
    if (item.variants && item.variants.length) {
      return item.variants.map(function (v) {
        return '<small>' + esc(v.label) + ' ' + esc(money(v.price)) + '</small>';
      }).join('');
    }
    return '<span class="seasonal">Seasonal</span>';
  }

  function matches(item) {
    if (!query) return true;
    var hay = (item.name + ' ' + (item.desc || '')).toLowerCase();
    return query.split(/\s+/).every(function (word) { return hay.indexOf(word) !== -1; });
  }

  function render() {
    var html = '';
    var shown = 0;

    data.groups.forEach(function (group) {
      if (activeGroup !== 'all' && group.id !== activeGroup) return;
      var items = group.items.filter(matches);
      if (!items.length) return;
      shown += items.length;

      html += '<section class="menu-group" id="group-' + esc(group.id) + '" aria-label="' + esc(group.name) + '">';
      html += '<div class="menu-group-head"><h2>' + esc(group.name) + '</h2>';
      if (group.id === 'brunch') html += '<span class="chip">10am–3pm</span>';
      if (group.id === 'dream') html += '<span class="chip chip-straw">Rotating</span>';
      html += '</div>';
      if (group.note) html += '<p class="menu-group-note">' + esc(group.note) + '</p>';

      items.forEach(function (item) {
        html += '<div class="mi">';
        html += '<div class="mi-name">' + esc(item.name);
        if (item.spicy) html += ' <span class="spicy-dot" title="Spicy"></span><span class="sr-note">(spicy)</span>';
        if (item.tag) html += ' <span class="chip chip-straw">' + esc(item.tag) + '</span>';
        html += '</div>';
        html += '<div class="mi-price">' + priceHtml(item) + '</div>';
        if (item.desc) html += '<p class="mi-desc">' + esc(item.desc) + '</p>';
        html += '</div>';
      });
      html += '</section>';
    });

    if (!shown) {
      html = '<div class="empty-state"><p><b>Nothing matches &ldquo;' + esc(query) + '&rdquo;.</b></p>' +
             '<p>Try a shorter word &mdash; or clear the search to see the whole menu.</p></div>';
    }

    groupsEl.innerHTML = html;
    if (countEl) {
      countEl.textContent = shown
        ? shown + (shown === 1 ? ' item' : ' items') + (activeGroup === 'all' && !query ? ' on the menu' : ' shown')
        : '';
    }
  }

  /* chip rail */
  var railHtml = '<button type="button" aria-pressed="true" data-group="all">All</button>';
  data.groups.forEach(function (group) {
    railHtml += '<button type="button" aria-pressed="false" data-group="' + esc(group.id) + '">' + esc(group.name) + '</button>';
  });
  railEl.innerHTML = railHtml;

  railEl.addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-group]');
    if (!btn) return;
    activeGroup = btn.getAttribute('data-group');
    railEl.querySelectorAll('button').forEach(function (b) {
      b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
    });
    render();
  });

  /* search */
  function onSearch() {
    query = (searchEl.value || '').trim().toLowerCase();
    if (clearEl) clearEl.hidden = !query;
    render();
  }
  if (searchEl) {
    searchEl.addEventListener('input', onSearch);
    if (clearEl) {
      clearEl.addEventListener('click', function () {
        searchEl.value = '';
        onSearch();
        searchEl.focus();
      });
    }
  }

  /* deep links: menu.html#group-pasta opens that category */
  var hash = (location.hash || '').replace('#group-', '');
  if (hash && data.groups.some(function (g) { return g.id === hash; })) {
    activeGroup = hash;
    railEl.querySelectorAll('button').forEach(function (b) {
      b.setAttribute('aria-pressed', b.getAttribute('data-group') === hash ? 'true' : 'false');
    });
  }

  render();
})();
