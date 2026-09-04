/* CHALKLINE — the work page filters. Two axes, the ones Singapore
   actually browses by: which room, which flat. Everything is visible
   without script; this only hides what doesn't match. */

(function (root, doc) {
  'use strict';

  var kinds = Array.prototype.slice.call(doc.querySelectorAll('input[name="kind"]'));
  var flats = Array.prototype.slice.call(doc.querySelectorAll('input[name="flat"]'));
  var projects = Array.prototype.slice.call(doc.querySelectorAll('.project'));
  var status = doc.getElementById('filterStatus');
  var empty = doc.getElementById('workEmpty');
  if (!kinds.length || !projects.length) return;

  function value(inputs) {
    for (var i = 0; i < inputs.length; i++) if (inputs[i].checked) return inputs[i].value;
    return 'all';
  }

  function apply() {
    var kind = value(kinds), flat = value(flats), shownPairs = 0, shownProjects = 0;
    projects.forEach(function (p) {
      var flatOk = flat === 'all' || p.getAttribute('data-flat') === flat;
      var pairs = Array.prototype.slice.call(p.querySelectorAll('.pair'));
      var visible = 0;
      pairs.forEach(function (f) {
        var ok = flatOk && (kind === 'all' || f.getAttribute('data-kind') === kind);
        f.hidden = !ok;
        if (ok) visible++;
      });
      p.hidden = !visible;
      if (visible) { shownProjects++; shownPairs += visible; }
    });
    if (empty) empty.hidden = shownPairs > 0;
    if (status) {
      status.textContent = shownPairs + ' pair' + (shownPairs === 1 ? '' : 's') + ' across ' + shownProjects + ' project' + (shownProjects === 1 ? '' : 's');
    }
    if (root.CHALK_UI) root.CHALK_UI.rescanReveals(doc);
  }

  kinds.concat(flats).forEach(function (inp) { inp.addEventListener('change', apply); });

  /* a hash like #tampines-kitchen arrives from the hero plan: clear filters
     so the target is never hidden, then let the browser scroll to it */
  if (root.location.hash) {
    kinds.forEach(function (i) { i.checked = i.value === 'all'; });
    flats.forEach(function (i) { i.checked = i.value === 'all'; });
  }
  apply();

})(window, document);
