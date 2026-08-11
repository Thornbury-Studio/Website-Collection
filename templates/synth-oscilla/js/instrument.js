/* ============================================================================
   OSCILLA — instrument detail
   ----------------------------------------------------------------------------
   Runs BEFORE panel.js so the [data-panel] attribute exists by the time
   panel.js scans the document for panels to build.
   ========================================================================== */
(function (O) {
  'use strict';
  var U = O.ui;
  var item = O.byId(new URLSearchParams(location.search).get('i'));

  if (!item) {
    U.$('#missing').hidden = false;
    U.init();
    return;
  }

  U.$('#found').hidden = false;
  document.title = item.name + ' — OSCILLA';
  U.$('#crumb').textContent = item.name;
  U.$('#iName').textContent = item.name;
  U.$('#iRole').textContent = item.code + ' · ' + item.role;
  U.$('#iLine').textContent = item.line;
  U.$('#iBody').textContent = item.body;
  U.$('#iPrice').textContent = O.money(item.price);

  var img = U.$('#iImg');
  img.src = 'img/' + item.img;
  img.alt = item.alt;
  U.$('#iCap').textContent = item.name + ' · ' + item.code;
  U.$('#iCap2').textContent = item.size + ' · ' + item.weight;

  U.$('#iSpecs').innerHTML = item.specs.map(function (s) {
    return '<div><dt>' + U.esc(s[0]) + '</dt><dd>' + U.esc(s[1]) + '</dd></div>';
  }).join('');

  U.$('#iAdd').addEventListener('click', function () {
    O.basket.add(item.id, 1);
    U.toast(item.name + ' added to the basket.');
  });

  /* Hand the panel this instrument. North is the sequencer, so its panel is
     the one that gets a sequencer. */
  var host = U.$('#panelHost');
  host.setAttribute('data-panel', item.id);
  if (item.id === 'north' || item.id === 'dusk') host.setAttribute('data-seq', '');

  U.init();
})(window.OSCILLA);
