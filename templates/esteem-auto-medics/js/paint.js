/* Esteem Auto Medics — spray paint visualiser.
   A consultation aid for the Level 4 spray division.

   The subject is a curved body panel under booth lighting, not a car
   illustration: a character crease splits it into an upper plane that catches
   the ceiling strips and a lower plane that falls away from them, with
   clearcoat specular, metallic flake and a panel shut line at the trailing
   edge. That is what a painter actually assesses a colour on, and it keeps the
   preview about the finish rather than about a cartoon vehicle.

   Selecting a colour lays the new coat down behind a soft-edged mask sweeping
   across the panel, with spray mist and a wet leading edge, then a booth light
   travels the fresh clearcoat. Final colour is matched in the booth, and the
   page says so. */

(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var VB_W = 900;
  var VB_H = 300;

  /* Full-bleed crop. The surface runs off every edge on purpose — an outlined
     panel floating in the frame reads as a lozenge-shaped object, whereas a
     crop reads as a section of a much larger car. Curvature is carried by the
     character line and the plane shading, not by the silhouette. */
  var PANEL = 'M 0 0 L ' + VB_W + ' 0 L ' + VB_W + ' ' + VB_H + ' L 0 ' + VB_H + ' Z';

  var CREASE = 'M 0 168 C 220 140 560 132 900 158';
  var SHOULDER = 'M 0 74 C 240 52 580 46 900 66';

  /* The two planes either side of the character line. */
  var UPPER = 'M 0 0 L 900 0 L 900 158 C 560 132 220 140 0 168 Z';
  var LOWER = 'M 0 168 C 220 140 560 132 900 158 L 900 300 L 0 300 Z';

  /* Ceiling strip reflections, running parallel to the crease. Each is drawn
     twice — a wide halo and a tight core — which is what separates a glossy
     clearcoat from a soft satin one. */
  var STRIPS = [
    { d: 'M -20 104 C 240 78 580 70 920 92',  w: 26, o: 0.34, core: 5 },
    { d: 'M -20 140 C 240 116 580 108 920 130', w: 9, o: 0.24, core: 2 },
    { d: 'M -20 238 C 240 216 580 210 920 230', w: 16, o: 0.13, core: 0 }
  ];

  var COLOURS = [
    { id: 'pearl',    name: 'Pearl White',   spec: 'Three-stage pearl · high gloss', hex: '#E8E6E0', sheen: 0.72, flake: 0.30 },
    { id: 'graphite', name: 'Graphite Grey', spec: 'Metallic · medium flake',        hex: '#4A4E54', sheen: 0.60, flake: 0.42 },
    { id: 'candy',    name: 'Candy Red',     spec: 'Candy over silver base',         hex: '#A81726', sheen: 0.68, flake: 0.26 },
    { id: 'satin',    name: 'Satin Black',   spec: 'Satin clear · low sheen',        hex: '#1A1A1C', sheen: 0.14, flake: 0.06 },
    { id: 'racing',   name: 'Racing Blue',   spec: 'Solid · high gloss',             hex: '#1B4C93', sheen: 0.66, flake: 0.08 },
    { id: 'bronze',   name: 'Liquid Bronze', spec: 'Metallic · coarse flake',        hex: '#8A6B2F', sheen: 0.56, flake: 0.52 }
  ];

  function el(name, attrs) {
    var node = document.createElementNS(NS, name);
    Object.keys(attrs || {}).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    return node;
  }

  function buildPanel(mount, uid) {
    var svg = el('svg', {
      viewBox: '0 0 ' + VB_W + ' ' + VB_H,
      class: 'paintpanel',
      role: 'img',
      'aria-label': 'Paint finish preview on a curved body panel under booth lighting'
    });

    var defs = el('defs', {});

    // Soft-edged wipe: a wide rect filled with a white→transparent ramp.
    var grad = el('linearGradient', { id: 'pg-' + uid, x1: '0', y1: '0', x2: '1', y2: '0' });
    grad.appendChild(el('stop', { offset: '0', 'stop-color': '#fff' }));
    grad.appendChild(el('stop', { offset: '0.62', 'stop-color': '#fff' }));
    grad.appendChild(el('stop', { offset: '0.80', 'stop-color': '#8a8a8a' }));
    grad.appendChild(el('stop', { offset: '1', 'stop-color': '#000' }));
    defs.appendChild(grad);

    var mask = el('mask', { id: 'pm-' + uid, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: VB_W, height: VB_H });
    var maskRect = el('rect', { x: -1900, y: 0, width: 1900, height: VB_H, fill: 'url(#pg-' + uid + ')' });
    mask.appendChild(maskRect);
    defs.appendChild(mask);

    var clip = el('clipPath', { id: 'pc-' + uid });
    clip.appendChild(el('path', { d: PANEL }));
    defs.appendChild(clip);

    var mistGrad = el('radialGradient', { id: 'pmist-' + uid });
    mistGrad.appendChild(el('stop', { offset: '0', 'stop-color': '#fff', 'stop-opacity': '0.30' }));
    mistGrad.appendChild(el('stop', { offset: '0.55', 'stop-color': '#fff', 'stop-opacity': '0.10' }));
    mistGrad.appendChild(el('stop', { offset: '1', 'stop-color': '#fff', 'stop-opacity': '0' }));
    defs.appendChild(mistGrad);

    var glossGrad = el('linearGradient', { id: 'pgloss-' + uid, x1: '0', y1: '0', x2: '1', y2: '0' });
    glossGrad.appendChild(el('stop', { offset: '0', 'stop-color': '#fff', 'stop-opacity': '0' }));
    glossGrad.appendChild(el('stop', { offset: '0.5', 'stop-color': '#fff', 'stop-opacity': '0.30' }));
    glossGrad.appendChild(el('stop', { offset: '1', 'stop-color': '#fff', 'stop-opacity': '0' }));
    defs.appendChild(glossGrad);

    // Wet leading edge — fresh paint flashes before it flows out.
    var wetGrad = el('linearGradient', { id: 'pwet-' + uid, x1: '0', y1: '0', x2: '1', y2: '0' });
    wetGrad.appendChild(el('stop', { offset: '0', 'stop-color': '#fff', 'stop-opacity': '0' }));
    wetGrad.appendChild(el('stop', { offset: '0.55', 'stop-color': '#fff', 'stop-opacity': '0.45' }));
    wetGrad.appendChild(el('stop', { offset: '1', 'stop-color': '#fff', 'stop-opacity': '0' }));
    defs.appendChild(wetGrad);

    // Plane shading: the upper face is turned toward the lights.
    var upGrad = el('linearGradient', { id: 'pup-' + uid, x1: '0', y1: '0', x2: '0', y2: '1' });
    upGrad.appendChild(el('stop', { offset: '0', 'stop-color': '#fff', 'stop-opacity': '0.16' }));
    upGrad.appendChild(el('stop', { offset: '1', 'stop-color': '#fff', 'stop-opacity': '0.02' }));
    defs.appendChild(upGrad);

    var lowGrad = el('linearGradient', { id: 'plow-' + uid, x1: '0', y1: '0', x2: '0', y2: '1' });
    lowGrad.appendChild(el('stop', { offset: '0', 'stop-color': '#000', 'stop-opacity': '0.06' }));
    lowGrad.appendChild(el('stop', { offset: '1', 'stop-color': '#000', 'stop-opacity': '0.46' }));
    defs.appendChild(lowGrad);

    /* Metallic flake — greyscale fractal noise over the coat. Rendered into a
       128px tile and repeated: running feTurbulence across the whole panel
       instead costs the page ~2fps, since the filter re-rasterises on paint. */
    var flakeFilter = el('filter', { id: 'pflakef-' + uid, x: '0', y: '0', width: '100%', height: '100%' });
    flakeFilter.appendChild(el('feTurbulence', { type: 'fractalNoise', baseFrequency: '0.9', numOctaves: '2', seed: '11' }));
    flakeFilter.appendChild(el('feColorMatrix', { type: 'saturate', values: '0' }));
    defs.appendChild(flakeFilter);

    var flakePat = el('pattern', { id: 'pflake-' + uid, width: 128, height: 128, patternUnits: 'userSpaceOnUse' });
    flakePat.appendChild(el('rect', { width: 128, height: 128, filter: 'url(#pflakef-' + uid + ')' }));
    defs.appendChild(flakePat);

    svg.appendChild(defs);

    // 1 — current coat, 2 — incoming coat behind the sweep mask.
    var base = el('path', { d: PANEL, class: 'paint-coat paint-coat--base' });
    svg.appendChild(base);

    var overGroup = el('g', { mask: 'url(#pm-' + uid + ')' });
    var over = el('path', { d: PANEL, class: 'paint-coat paint-coat--over' });
    overGroup.appendChild(over);
    svg.appendChild(overGroup);

    // 3 — everything that shapes the surface sits above both coats.
    var surface = el('g', { 'clip-path': 'url(#pc-' + uid + ')' });

    surface.appendChild(el('path', { d: UPPER, fill: 'url(#pup-' + uid + ')' }));
    surface.appendChild(el('path', { d: LOWER, fill: 'url(#plow-' + uid + ')' }));

    var flake = el('rect', { x: 0, y: 0, width: VB_W, height: VB_H, fill: 'url(#pflake-' + uid + ')', class: 'paint-flake' });
    surface.appendChild(flake);

    var stripEls = [];
    STRIPS.forEach(function (s) {
      var halo = el('path', { d: s.d, class: 'paint-strip', 'stroke-width': s.w });
      halo.style.setProperty('--strip-o', String(s.o));
      surface.appendChild(halo);
      stripEls.push(halo);
      if (s.core) {
        var core = el('path', { d: s.d, class: 'paint-strip paint-strip--core', 'stroke-width': s.core });
        core.style.setProperty('--strip-o', String(s.o * 1.5));
        surface.appendChild(core);
        stripEls.push(core);
      }
    });

    // Crease: a bright catch on the turn, a shadow just under it.
    surface.appendChild(el('path', { d: CREASE, class: 'paint-crease-lo' }));
    var creaseHi = el('path', { d: CREASE, class: 'paint-crease-hi' });
    surface.appendChild(creaseHi);
    surface.appendChild(el('path', { d: SHOULDER, class: 'paint-shoulder' }));

    // Panel shut line at the trailing edge — says "body panel", not "swatch".
    surface.appendChild(el('path', { d: 'M 812 -10 L 800 310', class: 'paint-shut' }));
    surface.appendChild(el('path', { d: 'M 817 -10 L 805 310', class: 'paint-shut-hi' }));

    var wet = el('rect', { x: -60, y: -20, width: 46, height: VB_H + 40, fill: 'url(#pwet-' + uid + ')', class: 'paint-wet', opacity: '0' });
    surface.appendChild(wet);

    var gloss = el('rect', { x: -300, y: -60, width: 190, height: VB_H + 120, fill: 'url(#pgloss-' + uid + ')', transform: 'skewX(-12)', class: 'paint-gloss' });
    surface.appendChild(gloss);

    // Booth falloff — the crop is lit from above, not evenly flooded.
    var vig = el('radialGradient', { id: 'pvig-' + uid, cx: '0.5', cy: '0.22', r: '0.95' });
    vig.appendChild(el('stop', { offset: '0.35', 'stop-color': '#000', 'stop-opacity': '0' }));
    vig.appendChild(el('stop', { offset: '1', 'stop-color': '#000', 'stop-opacity': '0.5' }));
    defs.appendChild(vig);
    surface.appendChild(el('rect', { x: 0, y: 0, width: VB_W, height: VB_H, fill: 'url(#pvig-' + uid + ')' }));

    svg.appendChild(surface);

    // Spray fan rides the leading edge, outside the clip so it reads as air.
    var mist = el('g', { class: 'paint-mist', opacity: '0' });
    mist.appendChild(el('ellipse', { cx: 0, cy: 150, rx: 52, ry: 190, fill: 'url(#pmist-' + uid + ')' }));
    mist.appendChild(el('ellipse', { cx: 24, cy: 108, rx: 28, ry: 118, fill: 'url(#pmist-' + uid + ')' }));
    mist.appendChild(el('ellipse', { cx: -16, cy: 206, rx: 24, ry: 96, fill: 'url(#pmist-' + uid + ')' }));
    svg.appendChild(mist);

    mount.appendChild(svg);
    return {
      svg: svg, base: base, over: over, maskRect: maskRect,
      mist: mist, gloss: gloss, wet: wet, flake: flake,
      strips: stripEls, creaseHi: creaseHi
    };
  }

  function build(mount, opts) {
    opts = opts || {};
    var swatches = (opts.colours || COLOURS.map(function (c) { return c.id; }))
      .map(function (id) {
        for (var i = 0; i < COLOURS.length; i += 1) if (COLOURS[i].id === id) return COLOURS[i];
        return null;
      }).filter(Boolean);
    if (!swatches.length) return null;

    var uid = (opts.uid || 'p') + '-' + Math.random().toString(36).slice(2, 7);
    var root = document.createElement('div');
    root.className = 'paintviz' + (opts.compact ? ' paintviz--compact' : '');

    var stage = document.createElement('div');
    stage.className = 'paint-stage';
    root.appendChild(stage);
    var p = buildPanel(stage, uid);

    var bar = document.createElement('div');
    bar.className = 'paint-bar';

    var readout = document.createElement('div');
    readout.className = 'paint-readout';
    readout.setAttribute('aria-live', 'polite');
    var nameEl = document.createElement('strong');
    var specEl = document.createElement('span');
    readout.appendChild(nameEl);
    readout.appendChild(specEl);

    var list = document.createElement('div');
    list.className = 'paint-swatches';
    list.setAttribute('role', 'group');
    list.setAttribute('aria-label', 'Preview a paint finish');

    bar.appendChild(readout);
    bar.appendChild(list);
    root.appendChild(bar);
    mount.appendChild(root);

    var current = swatches[0];
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var raf = null;
    var busy = false;

    /* Gloss is a look, not just an opacity: a low-sheen finish scatters the
       ceiling strips wide, a high-gloss one holds them tight. */
    function applyFinish(c) {
      p.svg.style.setProperty('--sheen', String(c.sheen));
      p.svg.style.setProperty('--flake', String(c.flake));
      p.svg.style.setProperty('--strip-blur', (5 + (1 - c.sheen) * 17).toFixed(1) + 'px');
    }

    p.base.style.setProperty('--paint', current.hex);
    p.over.style.setProperty('--paint', current.hex);
    applyFinish(current);
    nameEl.textContent = current.name;
    specEl.textContent = current.spec;

    function paint(next) {
      if (next.id === current.id || busy) return;
      busy = true;

      p.over.style.setProperty('--paint', next.hex);
      nameEl.textContent = next.name;
      specEl.textContent = next.spec;

      [].forEach.call(list.children, function (b) {
        b.setAttribute('aria-pressed', String(b.getAttribute('data-colour') === next.id));
      });

      function land() {
        p.base.style.setProperty('--paint', next.hex);
        applyFinish(next);
        p.maskRect.setAttribute('x', String(-1900));
        p.mist.setAttribute('opacity', '0');
        p.wet.setAttribute('opacity', '0');
        current = next;
        busy = false;
      }

      if (reduced) { land(); return; }

      // The finish changes with the coat, so cross-fade it during the pass.
      applyFinish({
        sheen: (current.sheen + next.sheen) / 2,
        flake: (current.flake + next.flake) / 2
      });

      var from = -1900;
      var to = -600;
      var dur = 900;
      var start = null;
      if (raf) cancelAnimationFrame(raf);
      p.gloss.classList.remove('is-sweeping');

      function step(ts) {
        if (start === null) start = ts;
        var t = Math.min(1, (ts - start) / dur);
        var e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        var x = from + (to - from) * e;
        p.maskRect.setAttribute('x', String(x));

        var edge = x + 1900 * 0.71;
        var fade = t < 0.08 ? t / 0.08 : (t > 0.86 ? Math.max(0, (1 - t) / 0.14) : 1);
        p.mist.setAttribute('transform', 'translate(' + edge.toFixed(1) + ' 0)');
        p.mist.setAttribute('opacity', String(fade));
        p.wet.setAttribute('x', String((edge - 23).toFixed(1)));
        p.wet.setAttribute('opacity', String(fade));

        if (t < 1) {
          raf = requestAnimationFrame(step);
        } else {
          land();
          void p.gloss.getBoundingClientRect().width;
          p.gloss.classList.add('is-sweeping');
        }
      }
      raf = requestAnimationFrame(step);
    }

    swatches.forEach(function (c, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'paint-swatch';
      b.setAttribute('data-colour', c.id);
      b.setAttribute('aria-pressed', String(i === 0));
      b.title = c.name;
      var dot = document.createElement('span');
      dot.className = 'paint-dot';
      dot.style.setProperty('--dot', c.hex);
      var label = document.createElement('span');
      label.className = 'paint-swatch-name';
      label.textContent = c.name;
      b.appendChild(dot);
      b.appendChild(label);
      b.addEventListener('click', function () { paint(c); });
      list.appendChild(b);
    });

    return { paint: paint, colours: swatches };
  }

  window.EAMPaint = { build: build, colours: COLOURS };
}());
