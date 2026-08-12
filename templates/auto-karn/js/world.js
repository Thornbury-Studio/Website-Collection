/* KARN index — the scrub, the chart, the fleet. All figures from KN. */
(function () {
  'use strict';
  var K = window.KN;

  /* ---------- the scrub ---------- */

  var scrubSection = document.getElementById('entry');
  var scrubCanvas = document.getElementById('scrubCanvas');
  var scrubMeter = document.getElementById('scrubMeter');
  K.wireScrubSeq(scrubSection, scrubCanvas, scrubMeter, {
    count: 180,
    hi: 'video/seq-hi/f-%03d.webp',
    lo: 'video/seq-lo/f-%03d.webp'
  });

  // chapter lines swap with progress
  if (!K.reduced && scrubSection) {
    var lines = scrubSection.querySelectorAll('.scrub-line');
    window.addEventListener('scroll', function () {
      var r = scrubSection.getBoundingClientRect();
      var span = r.height - window.innerHeight;
      if (span <= 0) return;
      var p = K.clamp(-r.top / span, 0, 1);
      var ch = p < 0.35 ? 0 : (p < 0.75 ? 1 : 2);
      lines.forEach(function (l) {
        l.classList.toggle('on', parseInt(l.getAttribute('data-chapter'), 10) === ch);
      });
    }, { passive: true });
  }

  /* ---------- the chart ---------- */

  var SECTORS = [
    { id: 'SC-01', name: 'WEISS FLAT', slug: 'monolit', x: 150, y: 130, label: 'salt · record straight' },
    { id: 'SC-02', name: 'THE RING', slug: 'serra', x: 420, y: 120, label: 'basalt circuit · 7.4 km' },
    { id: 'SC-03', name: 'ASKA DUNES', slug: 'brekka', x: 250, y: 250, label: 'black ash · 40° slopes' },
    { id: 'SC-04', name: 'KYST ROAD', slug: 'nokt', x: 470, y: 300, label: 'coast road · 61 km' },
    { id: 'SC-05', name: 'THE WORKS', slug: 'varde', x: 320, y: 390, label: 'assembly · wind hall' }
  ];

  var dateEl = document.querySelector('[data-chart-date]');
  if (dateEl) {
    dateEl.textContent = 'CONDITIONS · ' + new Date().toISOString().slice(0, 10) + ' · LIVE MODEL';
  }

  var ns = 'http://www.w3.org/2000/svg';
  var grid = document.getElementById('chartGrid');
  if (grid) {
    for (var gx = 40; gx < 640; gx += 60) {
      var l1 = document.createElementNS(ns, 'line');
      l1.setAttribute('x1', gx); l1.setAttribute('y1', 20);
      l1.setAttribute('x2', gx); l1.setAttribute('y2', 460);
      grid.appendChild(l1);
    }
    for (var gy = 40; gy < 480; gy += 60) {
      var l2 = document.createElementNS(ns, 'line');
      l2.setAttribute('x1', 30); l2.setAttribute('y1', gy);
      l2.setAttribute('x2', 610); l2.setAttribute('y2', gy);
      grid.appendChild(l2);
    }
  }

  var sectorsG = document.getElementById('chartSectors');
  var legend = document.getElementById('chartLegend');
  if (sectorsG && legend) {
    SECTORS.forEach(function (s) {
      var c = K.conditions[s.id];
      var g = document.createElementNS(ns, 'g');
      g.setAttribute('class', 'sec');
      g.setAttribute('data-sec', s.id);

      var ring = document.createElementNS(ns, 'circle');
      ring.setAttribute('class', 'ring');
      ring.setAttribute('cx', s.x); ring.setAttribute('cy', s.y); ring.setAttribute('r', 14);
      g.appendChild(ring);

      var dot = document.createElementNS(ns, 'circle');
      dot.setAttribute('class', 'sector-dot');
      dot.setAttribute('cx', s.x); dot.setAttribute('cy', s.y); dot.setAttribute('r', 4);
      g.appendChild(dot);

      var t1 = document.createElementNS(ns, 'text');
      t1.setAttribute('x', s.x + 20); t1.setAttribute('y', s.y - 2);
      t1.textContent = s.id + ' · ' + s.name;
      g.appendChild(t1);

      var t2 = document.createElementNS(ns, 'text');
      t2.setAttribute('x', s.x + 20); t2.setAttribute('y', s.y + 12);
      t2.textContent = c.temp + '°C · WIND ' + c.wind + ' · ' + (c.open ? 'OPEN' : 'HOLD');
      g.appendChild(t2);

      // generous invisible hit area, navigates to the machine
      var hit = document.createElementNS(ns, 'circle');
      hit.setAttribute('class', 'sector-hit');
      hit.setAttribute('cx', s.x); hit.setAttribute('cy', s.y); hit.setAttribute('r', 34);
      hit.addEventListener('click', function () { location.href = s.slug + '.html'; });
      g.appendChild(hit);

      sectorsG.appendChild(g);

      // legend row
      var v = K.fleet[s.slug];
      var row = document.createElement('a');
      row.className = 'chart-row hudt';
      row.href = s.slug + '.html';
      row.innerHTML =
        '<span class="hudt-cy">' + s.id + '</span>' +
        '<span><span class="cr-name">' + v.code + ' ' + v.name + '</span><br>' +
        '<span class="hudt-dim">' + s.label + '</span></span>' +
        '<span class="' + (c.open ? 'hudt-sig' : 'hudt-dim') + '">' + (c.open ? 'OPEN' : 'HOLD') + '</span>';
      row.addEventListener('mouseenter', function () { g.classList.add('lit'); });
      row.addEventListener('mouseleave', function () { g.classList.remove('lit'); });
      legend.appendChild(row);
    });
    K.rescanReveals(legend);
  }

  /* ---------- the fleet strip ---------- */

  var fleetHost = document.getElementById('fleetHost');
  if (fleetHost) {
    var order = ['monolit', 'serra', 'brekka', 'nokt', 'varde'];
    order.forEach(function (slug) {
      var v = K.fleet[slug];
      var vmax = K.perf.vmax(v), t = K.perf.t100(v), pw = K.perf.pw(v);
      var row = document.createElement('a');
      row.className = 'machine-row snap';
      row.href = slug + '.html';
      row.innerHTML =
        '<div class="machine-media"><img src="img/' + slug + '-hero.webp" alt="' + v.code + ' ' + v.name + ' — ' + v.role + '." width="1600" height="900" loading="lazy" decoding="async"></div>' +
        '<div class="machine-brief">' +
        '  <span class="machine-code" aria-hidden="true">' + v.code + '</span>' +
        '  <p class="hudt hudt-cy">' + v.sector + ' · ' + v.role.toUpperCase() + '</p>' +
        '  <h3 class="machine-name">' + v.name + '</h3>' +
        '  <p class="machine-stats hudt">' +
        '    <span>VMAX <b>' + K.fmt.kmh(vmax) + (K.perf.vmaxLimited(v) ? ' (LTD)' : '') + '</b></span>' +
        '    <span>0–100 <b>' + K.fmt.s(t) + '</b></span>' +
        '    <span>' + (v.battery ? 'RANGE <b>' + K.fmt.km(K.perf.range(v)) + '</b>' : 'MASS <b>' + K.fmt.kg(v.m) + '</b>') + '</span>' +
        '  </p>' +
        '  <p class="dim">' + v.note + '</p>' +
        '  <span class="machine-go hudt">ENTER ' + v.sector.split(' · ')[0] + ' <span class="arr" aria-hidden="true">→</span></span>' +
        '</div>';
      fleetHost.appendChild(row);
    });
    K.rescanReveals(fleetHost);
  }

  var fleetLine = document.querySelector('[data-fleet-line]');
  if (fleetLine) {
    var maxV = 0, minT = 99;
    Object.keys(K.fleet).forEach(function (k) {
      maxV = Math.max(maxV, K.perf.vmax(K.fleet[k]));
      minT = Math.min(minT, K.perf.t100(K.fleet[k]));
    });
    fleetLine.textContent = 'FIVE MACHINES · FASTEST ' + K.fmt.kmh(maxV) + ' · QUICKEST ' + K.fmt.s(minT);
  }
}());
