/* HARLOWE home — the tenor in D the page follows.
   Its weight in the margin ledger is computed, not typed, so the story and
   the model can never disagree. */
(function () {
  'use strict';
  var U = window.HB;
  var TENOR = U.model.freqOf('D', 4);
  var spec = U.model.specOf(TENOR);

  var w = document.getElementById('heroBellW');
  if (w) w.textContent = U.model.fmt.kg(spec.w);

  /* the five partials, heard alone */
  document.querySelectorAll('.partial').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var ratio = parseFloat(btn.getAttribute('data-partial'));
      var decay = parseFloat(btn.getAttribute('data-decay'));
      U.strike(TENOR, { solo: [ratio, 0.8, decay], gain: 0.5 });
      btn.classList.add('lit');
      setTimeout(function () { btn.classList.remove('lit'); }, 1400);
    });
  });
}());
