/* ============================================================================
   SALTFIELD — home page
   ========================================================================== */
(function (S) {
  'use strict';

  var U = S.ui;

  var grid = U.$('#roomsPreview');
  if (grid) {
    grid.innerHTML = ['bay', 'fen', 'lantern'].map(function (id) {
      return U.cardHTML(S.byId(id));
    }).join('');
  }

  U.init();
  U.reveals();
})(window.SALTFIELD);
