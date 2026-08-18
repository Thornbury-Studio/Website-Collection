/* Three's A Crowd — flavour board renderer. TAC_MENU.flavours is the only
   source; tier prices come from TAC_MENU.tiers, never typed here. */
(function () {
  'use strict';

  var data = window.TAC_MENU;
  var gridEl = document.getElementById('flavourGrid');
  var railEl = document.getElementById('chipRail');
  var searchEl = document.getElementById('flavourSearch');
  var clearEl = document.getElementById('searchClear');
  var countEl = document.getElementById('flavourCount');
  if (!data || !gridEl || !railEl) return;

  var activeFilter = 'all';
  var query = '';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function matches(f) {
    if (activeFilter === 'vegan' && !f.vegan) return false;
    if (activeFilter !== 'all' && activeFilter !== 'vegan' && f.tier !== activeFilter) return false;
    if (query) {
      var hay = (f.name + ' ' + (f.note || '')).toLowerCase();
      if (!query.split(/\s+/).every(function (w) { return hay.indexOf(w) !== -1; })) return false;
    }
    return true;
  }

  function render() {
    var shown = data.flavours.filter(matches);
    var html = '';
    shown.forEach(function (f) {
      var tier = data.tiers[f.tier];
      html += '<div class="flav">';
      html += '<b>' + esc(f.name) + '</b>';
      if (f.note) html += '<small>' + esc(f.note) + '</small>';
      html += '<span class="flav-tags">';
      html += '<span class="chip chip-' + esc(f.tier) + '">' + esc(tier.label) + '</span>';
      if (f.vegan) html += '<span class="chip">Vegan</span>';
      html += '</span>';
      html += '</div>';
    });
    if (!shown.length) {
      html = '<div class="empty-state"><p><b>No flavour matches &ldquo;' + esc(query) + '&rdquo;.</b></p>' +
             '<p>Try a shorter word, or clear the search.</p></div>';
      gridEl.classList.add('is-empty');
    } else {
      gridEl.classList.remove('is-empty');
    }
    gridEl.innerHTML = html;
    if (countEl) {
      countEl.textContent = shown.length
        ? shown.length + ' of ' + data.flavours.length + ' flavours'
        : '';
    }
  }

  var filters = [
    { id: 'all', label: 'All' },
    { id: 'classic', label: 'Classic' },
    { id: 'premium', label: 'Premium' },
    { id: 'special', label: 'Special' },
    { id: 'vegan', label: 'Vegan' }
  ];
  railEl.innerHTML = filters.map(function (f) {
    return '<button type="button" aria-pressed="' + (f.id === 'all' ? 'true' : 'false') + '" data-filter="' + f.id + '">' + f.label + '</button>';
  }).join('');

  railEl.addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-filter]');
    if (!btn) return;
    activeFilter = btn.getAttribute('data-filter');
    railEl.querySelectorAll('button').forEach(function (b) {
      b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
    });
    render();
  });

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

  render();
})();
