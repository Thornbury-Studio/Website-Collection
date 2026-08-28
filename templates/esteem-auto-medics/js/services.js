/* Services page — the coverage-level trio and the full paint visualiser. */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var trio = document.getElementById('tier-trio');
    if (trio && window.EAMCoverage) {
      EAMCoverage.order.forEach(function (level) {
        var def = EAMCoverage.coverage[level];
        var fig = document.createElement('figure');
        fig.className = 'tier-cell';
        var mount = document.createElement('div');
        fig.appendChild(mount);

        var cap = document.createElement('figcaption');
        var strong = document.createElement('strong');
        strong.textContent = def.label;
        cap.appendChild(strong);
        fig.appendChild(cap);
        trio.appendChild(fig);

        var svg = EAMCoverage.build(mount, {
          mini: true,
          label: def.label + ' coverage',
          clipId: 'covclip-cov-' + level
        });
        EAMCoverage.setStates(svg, EAMCoverage.coverageStates(level));
      });
    }

    var full = document.getElementById('paint-full');
    if (full && window.EAMPaint) {
      EAMPaint.build(full, { uid: 'full' });

      var note = document.createElement('p');
      note.className = 'paint-note';
      note.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
        'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><path d="M12 7.6v.6"/></svg>' +
        '<span></span>';
      note.querySelector('span').textContent =
        'Concept preview. Screen colour is not a paint match — the final colour is ' +
        'confirmed against a sprayed test card under booth light before any panel is painted.';
      full.querySelector('.paint-bar').appendChild(note);
    }
  });
}());
