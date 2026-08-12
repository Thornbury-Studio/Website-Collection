/* HARLOWE bells page — every printed weight computed from HB.model. */
(function () {
  'use strict';
  var U = window.HB;
  var fmt = U.model.fmt;

  function parse(noteStr) {
    return U.model.freqOf(noteStr.replace(/[0-9]/g, ''), parseInt(noteStr.replace(/[^\d]/g, ''), 10));
  }

  document.querySelectorAll('[data-note][data-spec]').forEach(function (el) {
    var f = parse(el.getAttribute('data-note'));
    var spec = U.model.specOf(f);
    var kind = el.getAttribute('data-spec');
    if (kind === 'w') {
      el.textContent = fmt.kg(spec.w);
    } else if (kind === 'dw') {
      el.textContent = fmt.mm(spec.d) + ' · ' + fmt.kg(spec.w);
    } else if (kind === 'ring8') {
      // a diatonic major ring of eight up from the tenor, summed honestly
      var total = 0;
      [0, 2, 4, 5, 7, 9, 11, 12].forEach(function (semis) {
        total += U.model.specOf(f * Math.pow(2, semis / 12)).w;
      });
      el.textContent = 'tenor ' + fmt.kg(spec.w) + ' · ' + fmt.kg(total) + ' of bronze all told';
    }
  });
}());
