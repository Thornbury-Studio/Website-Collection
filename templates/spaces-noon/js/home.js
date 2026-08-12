/* NOON index — every figure filled from NN.sun and the registry. */
(function () {
  'use strict';
  var N = window.NN;

  // today's sky line, in the conviction margin
  var rs = N.sun.riseSet();
  var noonAlt = N.sun.position(12).alt;
  var sky = document.querySelector('[data-sky-today]');
  if (sky) {
    sky.textContent =
      'Today over Havnsund — sunrise ' + N.fmt.clock(rs.rise) +
      ' · solar noon ' + N.fmt.deg(noonAlt) + ' high' +
      ' · sunset ' + N.fmt.clock(rs.set) +
      ' · ' + N.fmt.hours(rs.set - rs.rise) + ' of sky. Solar time; the survey keeps no other clock.';
  }

  // portfolio line in the holdings header
  var totalArea = 0, totalFloors = 0, openFloors = 0;
  Object.keys(N.buildings).forEach(function (k) {
    N.buildings[k].floors.forEach(function (f) {
      totalArea += f.area; totalFloors += 1;
      if (f.state === 'available') openFloors += 1;
    });
  });
  var pl = document.querySelector('[data-portfolio-line]');
  if (pl) {
    pl.textContent = '4 buildings · ' + totalFloors + ' floors · ' +
      totalArea.toLocaleString('en-IE') + ' m² · ' + openFloors + ' open today';
  }

  // per-building stats
  Object.keys(N.buildings).forEach(function (k) {
    var b = N.buildings[k];
    var sun = document.querySelector('[data-b-sun="' + k + '"]');
    if (sun) {
      var h = N.sun.directHours(b.walls);
      sun.textContent = h < 0.05 ? 'None — steady' : N.fmt.hours(h);
    }
    var open = document.querySelector('[data-b-open="' + k + '"]');
    if (open) {
      var n = b.floors.filter(function (f) { return f.state === 'available'; }).length;
      open.textContent = n + ' of ' + b.floors.length;
    }
    var rate = document.querySelector('[data-b-rate="' + k + '"]');
    if (rate) rate.textContent = '€' + b.rate + '/m²·mo';
  });
}());
