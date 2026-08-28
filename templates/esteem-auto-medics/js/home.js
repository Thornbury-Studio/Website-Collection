/* Homepage — interactive package coverage map in the hero. */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var mount = document.getElementById('hero-covmap');
    if (!mount || !window.EAMCoverage) return;

    var svg = EAMCoverage.build(mount, { label: 'PPF package coverage preview', clipId: 'covclip-hero' });
    var cap = document.getElementById('hero-map-cap');
    var tabs = document.querySelectorAll('.tier-tab');
    var total = EAMCoverage.panelCount;

    function show(tier) {
      EAMCoverage.setStates(svg, EAMCoverage.tierStates(tier));
      if (cap) {
        cap.innerHTML = '<strong>Package ' + tier + '</strong> · ' +
          EAMCoverage.tiers[tier].length + ' of ' + total + ' panels wrapped';
      }
      tabs.forEach(function (t) {
        t.setAttribute('aria-pressed', String(t.getAttribute('data-tier') === tier));
      });
    }

    tabs.forEach(function (t) {
      t.addEventListener('click', function () { show(t.getAttribute('data-tier')); });
    });

    show('B');
  });
}());
