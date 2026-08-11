/* COL NOIR — terrain page: sector grid from the model + the massif model. */
(function () {
  'use strict';
  var M = window.CN.today();
  var U = window.CNUI;
  var $ = function (id) { return document.getElementById(id); };

  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  $('isDate').textContent = M.date.getDate() + ' ' + months[M.date.getMonth()] + ' ' + M.date.getFullYear();
  $('isDanger').innerHTML = 'Danger <b>' + M.danger.max + ' — ' + window.CN.DANGER_WORDS[M.danger.max] + '</b>';
  var open = M.sectors.filter(function (s) { return s.state === 'open'; }).length;
  $('isOpen').innerHTML = 'Sectors <b>' + open + ' / ' + M.sectors.length + ' open</b>';
  $('secAside').textContent = open + ' open · ' +
    M.sectors.filter(function (s) { return s.state === 'no-access'; }).length + ' without lift access · ' +
    M.sectors.filter(function (s) { return s.state === 'closed'; }).length + ' closed';

  function rose(aspects, size) {
    var s = size, c = s / 2, r = c - 3;
    var C = window.CN.COMPASS;
    var out = ['<svg class="mini-rose" viewBox="0 0 ' + s + ' ' + s + '" role="img" aria-label="Aspect ' + aspects.join(', ') + '">'];
    for (var i = 0; i < 8; i++) {
      var a1 = (i * 45 - 90 - 22.5) * Math.PI / 180, a2 = (i * 45 - 90 + 22.5) * Math.PI / 180;
      var on = aspects.indexOf(C[i]) !== -1;
      out.push('<path d="M' + c + ' ' + c + ' L' + (c + Math.cos(a1) * r) + ' ' + (c + Math.sin(a1) * r) +
               ' A' + r + ' ' + r + ' 0 0 1 ' + (c + Math.cos(a2) * r) + ' ' + (c + Math.sin(a2) * r) + ' Z" fill="' +
               (on ? '#16181a' : '#e8ebe8') + '" stroke="#f5f6f4" stroke-width="1"/>');
    }
    out.push('</svg>');
    return out.join('');
  }

  var CLIP = {
    'face-nord': ['video/clouds.mp4', 'img/poster-clouds.webp', 'Cloud tearing off the north face'],
    'couloir-est': ['video/peaks.mp4', 'img/poster-peaks.webp', 'First sun on the east spires'],
    'combe': ['video/bowl.mp4', 'img/poster-bowl.webp', 'The bowl from the plateau'],
    'epaule': ['video/summit.mp4', 'img/poster-summit.webp', 'The shoulder station, bluebird'],
    'dalles': ['video/piste.mp4', 'img/poster-piste.webp', 'Spring lines below Les Dalles'],
    'foret': ['video/storm.mp4', 'img/poster-storm.webp', 'The forest lift in weather']
  };
  var stateWord = { open: 'Open', closed: 'Closed', 'no-access': 'No lift access' };

  $('sectorGrid').innerHTML = M.sectors.map(function (s) {
    var media = CLIP[s.id];
    return '<article class="sector" data-sector="' + s.id + '" tabindex="0">' +
      '<div class="sector-top"><div><h3>' + s.name + '</h3>' +
      '<p class="meta">' + s.aspect + ' · ' + s.alt[0] + '–' + s.alt[1] + ' m · ' + s.steep + '° max · via ' +
      s.lifts.map(function (id) { return id.replace(/^t[a-z]-/, '').replace(/^\w/, function (c) { return c.toUpperCase(); }); }).join(' + ') + '</p></div>' +
      rose([s.aspect], 46) + '</div>' +
      '<span class="sector-state ' + (s.loaded && s.state === 'open' ? 'loaded' : s.state) + '">' +
      (s.loaded && s.state === 'open' ? 'Open · loaded aspects' : stateWord[s.state]) + '</span>' +
      '<p>' + s.character + '</p>' +
      '<div class="sector-media"><video data-src="' + media[0] + '" muted playsinline loop preload="none" poster="' + media[1] + '" aria-label="' + media[2] + '"></video></div>' +
      '</article>';
  }).join('');

  /* massif hookup */
  var massif = null;
  if (!U.reduced) massif = window.CNMassif($('massif'), M.sectors);
  var legend = document.querySelector('#massifLegend b');
  function select(id, name) {
    if (massif) massif.select(id);
    legend.textContent = name || '—';
  }
  Array.prototype.forEach.call(document.querySelectorAll('[data-sector]'), function (el) {
    var id = el.getAttribute('data-sector');
    var name = el.querySelector('h3').textContent;
    el.addEventListener('mouseenter', function () { select(id, name); });
    el.addEventListener('focus', function () { select(id, name); });
    el.addEventListener('mouseleave', function () { select(null, null); });
    el.addEventListener('blur', function () { select(null, null); });
  });

  U.setWind(M.weather.wind);
  U.rise();
  U.video(document);
})();
