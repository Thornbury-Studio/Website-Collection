/* Homepage — the hero coverage explainer and the compact paint teaser. */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var mount = document.getElementById('hero-covmap');
    if (mount && window.EAMCoverage) {
      var svg = EAMCoverage.build(mount, {
        label: 'PPF coverage level preview',
        clipId: 'covclip-hero'
      });
      var cap = document.getElementById('hero-map-cap');
      var tabs = document.querySelectorAll('.tier-tab');

      function show(level) {
        var def = EAMCoverage.coverage[level];
        if (!def) return;
        EAMCoverage.setStates(svg, EAMCoverage.coverageStates(level));
        if (cap) {
          cap.textContent = '';
          var strong = document.createElement('strong');
          strong.textContent = def.label;
          cap.appendChild(strong);
          cap.appendChild(document.createTextNode(' · ' + def.blurb));
        }
        tabs.forEach(function (t) {
          t.setAttribute('aria-pressed', String(t.getAttribute('data-cov') === level));
        });
      }

      tabs.forEach(function (t) {
        t.addEventListener('click', function () { show(t.getAttribute('data-cov')); });
      });

      show('impact');
    }

    var teaser = document.getElementById('paint-teaser');
    if (teaser && window.EAMPaint) {
      EAMPaint.build(teaser, {
        compact: true,
        uid: 'teaser',
        colours: ['graphite', 'pearl', 'candy', 'racing']
      });
      var note = document.createElement('p');
      note.className = 'paint-note';
      note.textContent = 'Concept preview — final colour matched in the workshop.';
      teaser.querySelector('.paint-bar').appendChild(note);
    }
  });
}());
