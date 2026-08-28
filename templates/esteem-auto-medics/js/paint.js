/* Esteem Auto Medics — spray paint visualiser.
   A consultation aid for the Level 4 spray division: pick a colour and the
   body is repainted by a soft-edged sweep travelling nose-to-tail, with mist
   at the leading edge and a gloss pass once the coat lands.

   Built as a stylised side profile rather than a photograph so the colour is
   honest — it shows the finish family, not a rendered promise of the exact
   paint. Final colour is matched to the car's paint code in the booth. */

(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var VB_W = 900;
  var VB_H = 340;
  /* Drawing space stays 0..340 tall; the window is cropped to the car so the
     card isn't padded out with empty sky. */
  var VIEW = '0 94 900 222';

  /* Body silhouette. Wheel wells are punched by drawing ground-coloured discs
     over the body, which avoids arc-direction maths in the outline itself.
     Proportioned like a saloon: ~0.6 of length is wheelbase, front overhang
     shorter than rear, beltline well below the roof so the glass reads. */
  var BODY =
    'M 44 236 C 44 221 53 211 67 207 L 216 193 C 242 191 260 188 284 185 ' +
    'L 342 126 C 350 118 360 114 372 113 L 566 110 C 582 110 594 114 604 122 ' +
    'L 688 177 L 828 185 C 851 188 865 197 869 212 C 873 229 871 245 862 254 ' +
    'L 48 254 C 41 250 41 242 44 236 Z';

  var GLASS =
    'M 302 181 L 352 134 C 358 128 366 125 375 125 L 560 122 ' +
    'C 571 122 579 125 585 131 L 648 177 Z';

  var SHUTS = ['M 308 186 L 320 252', 'M 472 182 L 480 252', 'M 604 184 L 612 252'];

  var WHEELS = [{ x: 210, y: 248 }, { x: 686, y: 248 }];

  var COLOURS = [
    { id: 'pearl',    name: 'Pearl White',   spec: 'Three-stage pearl · high gloss', hex: '#E8E6E0', sheen: 0.55 },
    { id: 'graphite', name: 'Graphite Grey', spec: 'Metallic · medium flake',        hex: '#4A4E54', sheen: 0.40 },
    { id: 'candy',    name: 'Candy Red',     spec: 'Candy over silver base',         hex: '#A81726', sheen: 0.50 },
    { id: 'satin',    name: 'Satin Black',   spec: 'Satin clear · low sheen',        hex: '#1A1A1C', sheen: 0.12 },
    { id: 'racing',   name: 'Racing Blue',   spec: 'Solid · high gloss',             hex: '#1B4C93', sheen: 0.50 },
    { id: 'bronze',   name: 'Liquid Bronze', spec: 'Metallic · coarse flake',        hex: '#8A6B2F', sheen: 0.45 }
  ];

  function el(name, attrs) {
    var node = document.createElementNS(NS, name);
    Object.keys(attrs || {}).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    return node;
  }

  /* One SVG car. `uid` keeps defs ids unique when two visualisers coexist. */
  function buildCar(mount, uid) {
    var svg = el('svg', {
      viewBox: VIEW,
      class: 'paintcar',
      role: 'img',
      'aria-label': 'Car paint colour preview'
    });

    var defs = el('defs', {});

    // Soft-edged wipe: a wide rect filled with a white→transparent ramp. Moving
    // it left-to-right reveals the incoming colour with a feathered spray edge.
    var grad = el('linearGradient', { id: 'pg-' + uid, x1: '0', y1: '0', x2: '1', y2: '0' });
    grad.appendChild(el('stop', { offset: '0', 'stop-color': '#fff' }));
    grad.appendChild(el('stop', { offset: '0.60', 'stop-color': '#fff' }));
    grad.appendChild(el('stop', { offset: '0.78', 'stop-color': '#999' }));
    grad.appendChild(el('stop', { offset: '1', 'stop-color': '#000' }));
    defs.appendChild(grad);

    var mask = el('mask', { id: 'pm-' + uid, maskUnits: 'userSpaceOnUse', x: '0', y: '0', width: VB_W, height: VB_H });
    var maskRect = el('rect', { x: -1900, y: 0, width: 1900, height: VB_H, fill: 'url(#pg-' + uid + ')' });
    mask.appendChild(maskRect);
    defs.appendChild(mask);

    // Body-shaped clip so the gloss sweep and mist never spill onto the ground.
    var clip = el('clipPath', { id: 'pc-' + uid });
    clip.appendChild(el('path', { d: BODY }));
    defs.appendChild(clip);

    var mistGrad = el('radialGradient', { id: 'pmist-' + uid });
    mistGrad.appendChild(el('stop', { offset: '0', 'stop-color': '#fff', 'stop-opacity': '0.34' }));
    mistGrad.appendChild(el('stop', { offset: '0.55', 'stop-color': '#fff', 'stop-opacity': '0.12' }));
    mistGrad.appendChild(el('stop', { offset: '1', 'stop-color': '#fff', 'stop-opacity': '0' }));
    defs.appendChild(mistGrad);

    var glossGrad = el('linearGradient', { id: 'pgloss-' + uid, x1: '0', y1: '0', x2: '1', y2: '0' });
    glossGrad.appendChild(el('stop', { offset: '0', 'stop-color': '#fff', 'stop-opacity': '0' }));
    glossGrad.appendChild(el('stop', { offset: '0.5', 'stop-color': '#fff', 'stop-opacity': '0.42' }));
    glossGrad.appendChild(el('stop', { offset: '1', 'stop-color': '#fff', 'stop-opacity': '0' }));
    defs.appendChild(glossGrad);

    // Rocker shading — keeps a flat fill from reading as a paper cut-out.
    var lowGrad = el('linearGradient', { id: 'plow-' + uid, x1: '0', y1: '0', x2: '0', y2: '1' });
    lowGrad.appendChild(el('stop', { offset: '0', 'stop-color': '#000', 'stop-opacity': '0' }));
    lowGrad.appendChild(el('stop', { offset: '1', 'stop-color': '#000', 'stop-opacity': '0.42' }));
    defs.appendChild(lowGrad);

    svg.appendChild(defs);

    svg.appendChild(el('ellipse', { cx: 456, cy: 286, rx: 382, ry: 14, class: 'paint-shadow' }));

    // Current coat, then the incoming coat masked over it.
    var base = el('path', { d: BODY, class: 'paint-body paint-body--base' });
    svg.appendChild(base);

    var overGroup = el('g', { mask: 'url(#pm-' + uid + ')' });
    var over = el('path', { d: BODY, class: 'paint-body paint-body--over' });
    overGroup.appendChild(over);
    svg.appendChild(overGroup);

    // Everything that shapes the surface is clipped to the body, so highlights
    // and the gloss pass never spill onto the glass or the ground.
    var body = el('g', { 'clip-path': 'url(#pc-' + uid + ')' });
    body.appendChild(el('rect', { x: 0, y: 196, width: VB_W, height: 70, fill: 'url(#plow-' + uid + ')' }));
    var sheen = el('path', {
      d: 'M 108 216 C 240 202 380 196 520 196 C 630 196 720 202 812 212',
      class: 'paint-sheen'
    });
    body.appendChild(sheen);
    var gloss = el('rect', { x: -240, y: -40, width: 150, height: VB_H + 80, fill: 'url(#pgloss-' + uid + ')', transform: 'skewX(-16)', class: 'paint-gloss' });
    body.appendChild(gloss);
    svg.appendChild(body);

    var glass = el('path', { d: GLASS, class: 'paint-glass' });
    svg.appendChild(glass);
    svg.appendChild(el('path', { d: 'M 466 124 L 470 179', class: 'paint-pillar' }));

    // Shut lines, handles, lamps — reads as a car, not a blob.
    SHUTS.forEach(function (d) {
      svg.appendChild(el('path', { d: d, class: 'paint-line' }));
    });
    svg.appendChild(el('rect', { x: 392, y: 194, width: 32, height: 7, rx: 3.5, class: 'paint-handle' }));
    svg.appendChild(el('rect', { x: 524, y: 192, width: 32, height: 7, rx: 3.5, class: 'paint-handle' }));
    svg.appendChild(el('path', { d: 'M 50 212 C 60 208 74 205 90 203 L 87 217 L 52 221 Z', class: 'paint-lamp' }));
    svg.appendChild(el('path', { d: 'M 828 191 L 862 197 C 868 202 871 207 872 213 L 830 207 Z', class: 'paint-lamp paint-lamp--rear' }));
    svg.appendChild(el('path', { d: 'M 52 234 L 100 230 L 98 243 L 52 245 Z', class: 'paint-intake' }));

    // Mist puff rides the leading edge of the wipe. Kept inside the cropped
    // viewBox so the soft gradient never meets a hard window edge.
    var mist = el('g', { class: 'paint-mist', opacity: '0' });
    mist.appendChild(el('ellipse', { cx: 0, cy: 202, rx: 46, ry: 78, fill: 'url(#pmist-' + uid + ')' }));
    mist.appendChild(el('ellipse', { cx: 16, cy: 168, rx: 30, ry: 52, fill: 'url(#pmist-' + uid + ')' }));
    mist.appendChild(el('ellipse', { cx: -10, cy: 232, rx: 26, ry: 44, fill: 'url(#pmist-' + uid + ')' }));
    svg.appendChild(mist);

    WHEELS.forEach(function (w) {
      svg.appendChild(el('circle', { cx: w.x, cy: w.y, r: 63, class: 'paint-well' }));
      svg.appendChild(el('circle', { cx: w.x, cy: w.y, r: 54, class: 'paint-tyre' }));
      svg.appendChild(el('circle', { cx: w.x, cy: w.y, r: 29, class: 'paint-rim' }));
      svg.appendChild(el('circle', { cx: w.x, cy: w.y, r: 26, class: 'paint-rim-inner' }));
      svg.appendChild(el('circle', { cx: w.x, cy: w.y, r: 8, class: 'paint-hub' }));
    });

    mount.appendChild(svg);
    return { svg: svg, base: base, over: over, maskRect: maskRect, mist: mist, gloss: gloss, sheen: sheen };
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
    var car = buildCar(stage, uid);

    var bar = document.createElement('div');
    bar.className = 'paint-bar';

    var readout = document.createElement('div');
    readout.className = 'paint-readout';
    var nameEl = document.createElement('strong');
    var specEl = document.createElement('span');
    readout.appendChild(nameEl);
    readout.appendChild(specEl);

    var list = document.createElement('div');
    list.className = 'paint-swatches';
    list.setAttribute('role', 'group');
    list.setAttribute('aria-label', 'Preview a paint colour');

    // Live region so the readout is announced when a swatch is activated.
    readout.setAttribute('aria-live', 'polite');

    bar.appendChild(readout);
    bar.appendChild(list);
    root.appendChild(bar);
    mount.appendChild(root);

    var current = swatches[0];
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var raf = null;
    var busy = false;

    car.base.style.setProperty('--paint', current.hex);
    car.over.style.setProperty('--paint', current.hex);
    car.sheen.style.setProperty('--sheen', String(current.sheen));
    nameEl.textContent = current.name;
    specEl.textContent = current.spec;

    function paint(next) {
      if (next.id === current.id || busy) return;
      busy = true;

      car.over.style.setProperty('--paint', next.hex);
      nameEl.textContent = next.name;
      specEl.textContent = next.spec;

      [].forEach.call(list.children, function (b) {
        b.setAttribute('aria-pressed', String(b.getAttribute('data-colour') === next.id));
      });

      function land() {
        // Promote the incoming coat to the base, then reset the mask so the
        // next pass starts from a clean nose-to-tail sweep.
        car.base.style.setProperty('--paint', next.hex);
        car.sheen.style.setProperty('--sheen', String(next.sheen));
        car.maskRect.setAttribute('x', String(-1900));
        car.mist.setAttribute('opacity', '0');
        current = next;
        busy = false;
      }

      if (reduced) { land(); return; }

      var from = -1900;
      var to = -640;            // white ramp fully past the tail
      var dur = 880;
      var start = null;
      if (raf) cancelAnimationFrame(raf);

      car.gloss.classList.remove('is-sweeping');

      function step(ts) {
        if (start === null) start = ts;
        var t = Math.min(1, (ts - start) / dur);
        var e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        var x = from + (to - from) * e;
        car.maskRect.setAttribute('x', String(x));

        // Leading edge of the ramp, in user units.
        var edge = x + 1900 * 0.70;
        car.mist.setAttribute('transform', 'translate(' + edge.toFixed(1) + ' 0)');
        car.mist.setAttribute('opacity', String(t < 0.08 ? t / 0.08 : (t > 0.86 ? Math.max(0, (1 - t) / 0.14) : 1)));

        if (t < 1) {
          raf = requestAnimationFrame(step);
        } else {
          land();
          // Gloss pass reads as the clear coat flashing off under the lights.
          void car.gloss.getBoundingClientRect().width;
          car.gloss.classList.add('is-sweeping');
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
