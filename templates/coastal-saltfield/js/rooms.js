/* ============================================================================
   SALTFIELD — rooms page: the six, with filters that answer immediately
   ========================================================================== */
(function (S) {
  'use strict';

  var U = S.ui;

  var TESTS = {
    all:    function ()  { return true; },
    sea:    function (r) { return r.outlook === 'sea' || r.outlook === 'dunes'; },
    garden: function (r) { return r.outlook === 'garden' || r.outlook === 'field'; },
    three:  function (r) { return r.sleeps >= 3; },
    tub:    function (r) { return /tub/i.test(r.bath); }
  };

  var active = 'all';

  function render() {
    var grid = U.$('#roomsGrid'), count = U.$('#fCount'), empty = U.$('#fEmpty');
    if (!grid) return;
    var rooms = S.rooms.filter(TESTS[active] || TESTS.all);
    grid.innerHTML = rooms.map(U.cardHTML).join('');
    if (count) count.textContent = rooms.length === 6 ? 'All six rooms' :
      rooms.length + (rooms.length === 1 ? ' room' : ' rooms');
    if (empty) empty.hidden = rooms.length > 0;
    U.reveals(grid);
  }

  var set = U.$('#filterSet');
  if (set) set.addEventListener('click', function (e) {
    var b = e.target.closest('.fchip');
    if (!b) return;
    active = b.getAttribute('data-f');
    U.$$('.fchip', set).forEach(function (x) {
      x.setAttribute('aria-pressed', String(x === b));
    });
    render();
  });

  var reset = U.$('#fReset');
  if (reset) reset.addEventListener('click', function () {
    active = 'all';
    U.$$('.fchip', set).forEach(function (x) {
      x.setAttribute('aria-pressed', String(x.getAttribute('data-f') === 'all'));
    });
    render();
  });

  render();
  U.init();
  U.reveals();
})(window.SALTFIELD);
