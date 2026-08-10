/* ============================================================================
   HOTLINE — menu page
   ----------------------------------------------------------------------------
   Two filters that compose: section, and a cap on the heat scale. Dishes that
   were photographed become cards; the rest become typographic rows, which is
   also how the printed menu reads.
   ========================================================================== */
(function (H) {
  'use strict';

  var U = H.ui, $ = U.$;
  var state = { cat: 'all', heat: 5 };

  var SECTIONS = [
    { id: 'bird',   no: '01', title: 'Bird',          note: 'Brined overnight, dredged twice, fried to order.' },
    { id: 'stacks', no: '02', title: 'Stacks',        note: 'Smashed thin on a flat-top so the edges catch.' },
    { id: 'fries',  no: '03', title: 'Fries & Sides', note: 'Twice-cooked, salted the moment they come out.' },
    { id: 'dips',   no: '04', title: 'Dips',          note: 'Made in-house. Ask for any of them on the side.' },
    { id: 'drinks', no: '05', title: 'Drinks',        note: 'Cold, and poured after the food is boxed.' }
  ];

  function cats() {
    var set = $('#catSet');
    if (!set) return;
    set.innerHTML = H.cats.map(function (c) {
      return '<button class="fchip" type="button" role="switch" aria-pressed="' +
             (c.id === state.cat) + '" data-cat="' + c.id + '">' + U.esc(c.label) + '</button>';
    }).join('');
    set.addEventListener('click', function (e) {
      var b = e.target.closest('.fchip');
      if (!b) return;
      state.cat = b.getAttribute('data-cat');
      U.$$('.fchip', set).forEach(function (x) {
        x.setAttribute('aria-pressed', String(x === b));
      });
      render();
    });
  }

  function heatDial() {
    var input = $('#heatCap'), out = $('#heatCapOut');
    if (!input) return;
    function sync() {
      state.heat = Number(input.value);
      if (out) out.textContent = state.heat === 5 ? 'Any' : state.heat === 0 ? 'None' : '≤ ' + state.heat;
      render();
    }
    input.addEventListener('input', sync);
    sync();
  }

  function render() {
    var out = $('#menuOut'), count = $('#menuCount');
    if (!out) return;

    var shown = 0;
    var html = SECTIONS.map(function (sec) {
      if (state.cat !== 'all' && state.cat !== sec.id) return '';
      var items = H.inCat(sec.id).filter(function (it) { return it.heat <= state.heat; });
      if (!items.length) return '';
      shown += items.length;

      var withImg = items.filter(function (i) { return i.img; });
      var noImg   = items.filter(function (i) { return !i.img; });

      return '<section class="sec--tight" id="' + sec.id + '">' +
          '<div class="wrap">' +
            '<div class="chapter reveal">' +
              '<span class="chapter__no u-num">' + sec.no + '</span>' +
              '<h2 class="chapter__t">' + U.esc(sec.title) + '</h2>' +
              '<p class="chapter__aside">' + U.esc(sec.note) + '</p>' +
            '</div>' +
            (withImg.length ? '<div class="grid">' + withImg.map(U.cardHTML).join('') + '</div>' : '') +
            (noImg.length ? '<div class="rows' + (withImg.length ? ' mt-l' : '') + '">' +
                            noImg.map(U.rowHTML).join('') + '</div>' : '') +
          '</div>' +
        '</section>';
    }).join('');

    out.innerHTML = html || '<div class="wrap"><p class="menu-empty">Nothing on the menu is that mild. ' +
                            'Nudge the heat dial up to see more.</p></div>';
    if (count) {
      count.textContent = shown ? shown + (shown === 1 ? ' dish' : ' dishes') : 'No dishes';
    }
    U.reveals(out);
  }

  cats();
  heatDial();          // calls render()
  U.initBag();
  U.initStatus();
  U.reveals();
})(window.HOTLINE);
