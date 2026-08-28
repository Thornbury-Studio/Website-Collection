/* Esteem Auto Medics — coverage map.
   One top-down car, drawn once, reused three ways:
   - homepage: interactive coverage-level explainer (which panels each level wraps)
   - services: static coverage trio
   - tracker/console: live job map (panels being worked on light up)

   Coverage level is NOT the same thing as the vehicle category (Sedan /
   SUV-MPV / Supercar). Category sets which price list a quote is drawn from;
   coverage sets how much of the car is wrapped. Every coverage level is
   available on every category, so the two are modelled separately.

   Panel keys are shared with store.js job `areas`. */

(function () {
  'use strict';

  /* Symmetric plan view, nose up. viewBox 0 0 520 960. */
  var BODY_OUTLINE =
    'M260,28 C186,28 128,44 112,64 C96,84 84,132 82,190 L78,332 ' +
    'C76,420 76,520 78,610 L82,776 C84,836 96,884 112,904 C130,926 190,934 260,934 ' +
    'C330,934 390,926 408,904 C424,884 436,836 438,776 L442,610 C444,520 444,420 442,332 ' +
    'L438,190 C436,132 424,84 408,64 C392,44 334,28 260,28 Z';

  var PANELS = [
    { key: 'bumper-f',  d: 'M260,28 C186,28 128,44 112,64 C104,74 98,92 94,116 L426,116 C422,92 416,74 408,64 C392,44 334,28 260,28 Z' },
    { key: 'lamp-l',    d: 'M110,124 L196,124 L188,152 L106,148 Z' },
    { key: 'lamp-r',    d: 'M410,124 L324,124 L332,152 L414,148 Z' },
    { key: 'bonnet',    d: 'M138,160 L382,160 C390,220 392,268 388,318 L132,318 C128,268 130,220 138,160 Z' },
    { key: 'fender-l',  d: 'M94,124 L98,124 L124,160 C120,220 118,268 122,318 L80,318 L82,190 C83,164 87,142 94,124 Z' },
    { key: 'fender-r',  d: 'M426,124 L422,124 L396,160 C400,220 402,268 398,318 L440,318 L438,190 C437,164 433,142 426,124 Z' },
    { key: 'glass-f',   d: 'M132,328 L388,328 C386,364 380,396 370,420 L150,420 C140,396 134,364 132,328 Z', glass: true },
    { key: 'mirror-l',  d: 'M74,330 L28,344 C20,347 16,354 18,362 C20,370 28,374 38,372 L76,362 Z' },
    { key: 'mirror-r',  d: 'M446,330 L492,344 C500,347 504,354 502,362 C500,370 492,374 482,372 L444,362 Z' },
    { key: 'roof',      d: 'M150,430 L370,430 C378,478 380,528 376,576 L144,576 C140,528 142,478 150,430 Z', },
    { key: 'door-l',    d: 'M78,328 L122,328 C118,412 118,500 124,584 L78,584 C76,500 76,412 78,328 Z' },
    { key: 'door-r',    d: 'M442,328 L398,328 C402,412 402,500 396,584 L442,584 C444,500 444,412 442,328 Z' },
    { key: 'glass-r',   d: 'M144,586 L376,586 C378,616 378,644 374,668 L148,668 C144,644 142,616 144,586 Z', glass: true },
    { key: 'quarter-l', d: 'M78,594 L124,594 C120,668 118,730 120,798 L82,798 L79,700 Z' },
    { key: 'quarter-r', d: 'M442,594 L396,594 C400,668 402,730 400,798 L438,798 L441,700 Z' },
    { key: 'boot',      d: 'M148,678 L372,678 C376,720 378,762 376,806 L144,806 C142,762 144,720 148,678 Z' },
    { key: 'bumper-r',  d: 'M86,814 L434,814 C431,852 422,888 408,904 C390,926 330,934 260,934 C190,934 130,926 112,904 C98,888 89,852 86,814 Z' }
  ];

  /* Coverage levels — how much of the car gets wrapped. Indicative shapes so
     the difference reads instantly; the exact panel list for any job is agreed
     at the walk-around, and final scope is confirmed with the client. */
  var COVERAGE = {
    front: {
      label: 'Front end',
      blurb: 'The panels that take stone chips first.',
      panels: ['bumper-f', 'lamp-l', 'lamp-r', 'mirror-l', 'mirror-r']
    },
    impact: {
      label: 'High-impact',
      blurb: 'Front end plus the panels that collect carpark damage.',
      panels: ['bumper-f', 'lamp-l', 'lamp-r', 'mirror-l', 'mirror-r', 'bonnet',
               'fender-l', 'fender-r', 'door-l', 'door-r']
    },
    full: {
      label: 'Full body',
      blurb: 'Every painted panel on the car.',
      panels: ['bumper-f', 'lamp-l', 'lamp-r', 'mirror-l', 'mirror-r', 'bonnet',
               'fender-l', 'fender-r', 'door-l', 'door-r', 'roof', 'quarter-l',
               'quarter-r', 'boot', 'bumper-r']
    }
  };

  var COVERAGE_ORDER = ['front', 'impact', 'full'];

  var NS = 'http://www.w3.org/2000/svg';

  function el(name, attrs) {
    var node = document.createElementNS(NS, name);
    Object.keys(attrs || {}).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    return node;
  }

  function build(container, opts) {
    opts = opts || {};
    var svg = el('svg', {
      viewBox: '0 0 520 960',
      class: 'covmap' + (opts.mini ? ' covmap--mini' : ''),
      role: 'img',
      'aria-label': opts.label || 'Vehicle coverage map'
    });

    var defs = el('defs', {});
    var clip = el('clipPath', { id: opts.clipId || ('covclip-' + Math.random().toString(36).slice(2, 8)) });
    clip.appendChild(el('path', { d: BODY_OUTLINE }));
    defs.appendChild(clip);
    svg.appendChild(defs);

    svg.appendChild(el('path', { d: BODY_OUTLINE, class: 'covmap-body' }));

    /* Mirrors wing outside the body outline, so they skip the body clip. */
    var g = el('g', { 'clip-path': 'url(#' + clip.getAttribute('id') + ')' });
    PANELS.forEach(function (p) {
      var path = el('path', {
        d: p.d,
        class: 'covmap-panel' + (p.glass ? ' covmap-glass' : ''),
        'data-panel': p.key
      });
      if (p.key === 'mirror-l' || p.key === 'mirror-r') svg.appendChild(path);
      else g.appendChild(path);
    });
    svg.appendChild(g);

    svg.appendChild(el('path', { d: BODY_OUTLINE, class: 'covmap-edge' }));
    container.appendChild(svg);
    return svg;
  }

  function setStates(svg, states) {
    var panels = svg.querySelectorAll('.covmap-panel');
    for (var i = 0; i < panels.length; i += 1) {
      var p = panels[i];
      if (p.classList.contains('covmap-glass')) continue;
      var s = states[p.getAttribute('data-panel')] || 'off';
      p.classList.remove('is-on', 'is-active');
      if (s === 'on') p.classList.add('is-on');
      if (s === 'active') p.classList.add('is-active');
    }
  }

  function coverageStates(level) {
    var states = {};
    var def = COVERAGE[level];
    if (def) def.panels.forEach(function (k) { states[k] = 'on'; });
    return states;
  }

  function areaStates(areas, mode) {
    var states = {};
    (areas || []).forEach(function (k) { states[k] = mode || 'active'; });
    return states;
  }

  window.EAMCoverage = {
    build: build,
    setStates: setStates,
    coverageStates: coverageStates,
    areaStates: areaStates,
    coverage: COVERAGE,
    order: COVERAGE_ORDER,
    panelCount: PANELS.filter(function (p) { return !p.glass; }).length
  };
}());
