/* Services page — the three package coverage maps, side by side. */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var trio = document.getElementById('tier-trio');
    if (!trio || !window.EAMCoverage) return;

    ['A', 'B', 'C'].forEach(function (tier) {
      var fig = document.createElement('figure');
      fig.className = 'tier-cell';
      var mount = document.createElement('div');
      fig.appendChild(mount);
      var cap = document.createElement('figcaption');
      cap.innerHTML = '<strong>Pkg ' + tier + '</strong> · ' + EAMCoverage.tiers[tier].length + ' panels';
      fig.appendChild(cap);
      trio.appendChild(fig);

      var svg = EAMCoverage.build(mount, {
        mini: true,
        label: 'Package ' + tier + ' coverage',
        clipId: 'covclip-tier-' + tier
      });
      EAMCoverage.setStates(svg, EAMCoverage.tierStates(tier));
    });
  });
}());
