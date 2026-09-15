/* Fake account form note */
(function () {
  'use strict';
  var btn = document.getElementById('acctSubmit');
  var note = document.getElementById('acctNote');
  if (!btn || !note) return;
  btn.addEventListener('click', function () {
    note.textContent =
      'No live accounts on this build. Your cart still works in this browser — head to Shop when you are ready.';
  });
})();
