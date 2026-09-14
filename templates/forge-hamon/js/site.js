/* HAMON — a forge at Cleave Ford
 * Four things happen on this site and nothing else:
 *   1. the polish  — the reveal signature
 *   2. the state   — FORGE / BENCH
 *   3. the spine   — the working temperature you are currently reading at
 *   4. the table   — fold arithmetic, and the commission specification
 */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------------
     1. The polish
     A curtain of the section's own ground retracts to the right. If there is
     no IntersectionObserver the content is simply shown — never hidden.
     --------------------------------------------------------------------- */

  var io = null;

  function showAll() {
    var all = doc.querySelectorAll('.reveal');
    for (var i = 0; i < all.length; i++) all[i].classList.add('in');
  }

  function rescanReveals(scope) {
    var nodes = (scope || doc).querySelectorAll('.reveal:not(.in)');
    if (!io) { showAll(); return; }
    for (var i = 0; i < nodes.length; i++) io.observe(nodes[i]);
  }

  if (reduced || !('IntersectionObserver' in window)) {
    showAll();
  } else {
    io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        var e = entries[i];
        if (!e.isIntersecting) continue;
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    /* Stagger siblings inside a group, capped at three steps so a long list
       never keeps the reader waiting. */
    var groups = doc.querySelectorAll('[data-stagger]');
    for (var g = 0; g < groups.length; g++) {
      var kids = groups[g].querySelectorAll('.reveal');
      for (var k = 0; k < kids.length; k++) {
        kids[k].style.setProperty('--d', (Math.min(k, 3) * 0.09) + 's');
      }
    }
    rescanReveals();

    /* Failsafe: if anything is still curtained after two seconds — a browser
       quirk, a zero-height container — uncover it rather than hide content. */
    window.setTimeout(function () {
      var stuck = doc.querySelectorAll('.reveal:not(.in)');
      for (var i = 0; i < stuck.length; i++) {
        var r = stuck[i].getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) stuck[i].classList.add('in');
      }
    }, 2000);
  }

  /* ---------------------------------------------------------------------
     2. The state — FORGE / BENCH
     --------------------------------------------------------------------- */

  var toggle = doc.getElementById('state');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var bench = root.getAttribute('data-theme') === 'bench';
      var next = bench ? 'forge' : 'bench';
      if (next === 'bench') root.setAttribute('data-theme', 'bench');
      else root.removeAttribute('data-theme');
      toggle.setAttribute('aria-label', 'Shop state: ' + (next === 'bench' ? 'bench, daylight' : 'forge, night') + '. Switch.');
      try { localStorage.setItem('hamon.state.v1', next); } catch (e) { /* private mode */ }
      if (window.hamonFoldRedraw) window.hamonFoldRedraw();
    });
  }

  /* ---------------------------------------------------------------------
     3. Menu
     --------------------------------------------------------------------- */

  var burger = doc.getElementById('burger');
  var drawer = doc.getElementById('drawer');
  if (burger && drawer) {
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', open ? 'false' : 'true');
      burger.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
      drawer.setAttribute('data-open', open ? 'false' : 'true');
    });
  }

  /* ---------------------------------------------------------------------
     4. The heat spine
     --------------------------------------------------------------------- */

  var spine = doc.getElementById('spine');
  if (spine) {
    var spineTemp = spine.querySelector('.spine-temp');
    var spineName = spine.querySelector('.spine-name');
    var stages = doc.querySelectorAll('[data-temp]');
    var ticking = false;

    function paintSpine() {
      ticking = false;
      var h = doc.documentElement.scrollHeight - window.innerHeight;
      var p = h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0;
      spine.style.setProperty('--spine-p', p.toFixed(4));

      /* Whichever stage owns the upper third of the viewport is the one you
         are reading, so that is the temperature the rail shows. */
      var mark = window.innerHeight * 0.34;
      var active = null;
      for (var i = 0; i < stages.length; i++) {
        var r = stages[i].getBoundingClientRect();
        if (r.top <= mark && r.bottom > mark) { active = stages[i]; break; }
        if (r.top > mark) break;
        active = stages[i];
      }
      if (!active) active = stages[0];
      if (!active) return;
      var temp = active.getAttribute('data-temp');
      var name = active.getAttribute('data-stage') || '';
      if (spineTemp.textContent !== temp) {
        spineTemp.textContent = temp;
        spineName.textContent = name;
        root.style.setProperty('--heat', active.getAttribute('data-t') || '0');
      }
    }

    if (stages.length) {
      window.addEventListener('scroll', function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(paintSpine);
      }, { passive: true });
      window.addEventListener('resize', paintSpine);
      paintSpine();
    } else {
      spine.hidden = true;
    }
  }

  /* ---------------------------------------------------------------------
     5. The fold table
     Seven bars, 42 mm of billet. Every fold doubles the count and halves the
     layer. Nothing here is typed: layers = 7 * 2^n, layer = 42 mm / layers.
     --------------------------------------------------------------------- */

  var fold = doc.getElementById('fold');
  if (fold) {
    var BARS = 7;
    var BILLET_MM = 42;
    var ETCH_LIMIT_UM = 8;      /* below this the etch cannot bite a layer */
    var MAX_DRAWN = 260;        /* beyond this the face is homogeneous anyway */

    var slider = doc.getElementById('foldRange');
    var btnFold = doc.getElementById('foldStrike');
    var btnReset = doc.getElementById('foldReset');
    var outFolds = doc.getElementById('foldCount');
    var outLayers = doc.getElementById('foldLayers');
    var outLayer = doc.getElementById('foldLayer');
    var note = doc.getElementById('foldNote');
    var cv = doc.getElementById('foldCanvas');
    var ctx = cv.getContext('2d');

    function layersAt(n) { return BARS * Math.pow(2, n); }
    function layerUm(n) { return (BILLET_MM * 1000) / layersAt(n); }

    function fmtCount(v) { return v.toLocaleString('en-GB'); }

    function fmtLayer(um) {
      if (um >= 1000) return (um / 1000).toFixed(2) + ' mm';
      if (um >= 100) return Math.round(um) + ' µm';
      if (um >= 10) return um.toFixed(1) + ' µm';
      return um.toFixed(2) + ' µm';
    }

    /* Two fixed warps stand in for the ladder: a long bow from drawing the
       billet out, and a shorter one from the grinding grooves. Deterministic,
       so the pattern is the same billet at every fold count. */
    function warp(x, w) {
      var u = x / w;
      return Math.sin(u * 6.1 + 0.7) * 0.055 + Math.sin(u * 17.3 + 2.1) * 0.022 + Math.sin(u * 2.3) * 0.03;
    }

    function drawPattern(n) {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = cv.clientWidth, h = cv.clientHeight;
      if (!w || !h) return;
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var bench = root.getAttribute('data-theme') === 'bench';
      var dark = bench ? '#5d6066' : '#191c21';
      var light = bench ? '#cfcec9' : '#7f8a93';
      var base = bench ? '#b8b6b0' : '#0a0b0d';

      ctx.fillStyle = base;
      ctx.fillRect(0, 0, w, h);

      var layers = layersAt(n);
      var um = layerUm(n);
      var homogeneous = um < ETCH_LIMIT_UM || layers > MAX_DRAWN;

      if (homogeneous) {
        /* Past the etch limit the face is one steel. Only a faint tooth is
           left — which is exactly what it looks like. */
        ctx.fillStyle = bench ? '#c4c2bc' : '#14171b';
        ctx.fillRect(0, 0, w, h);
        for (var s = 0; s < 2600; s++) {
          var sx = ((s * 97.13) % w);
          var sy = ((s * 53.77) % h);
          ctx.fillStyle = (s % 2 ? light : dark);
          ctx.globalAlpha = 0.045;
          ctx.fillRect(sx, sy, 1.6, 1);
        }
        ctx.globalAlpha = 1;
        return;
      }

      var band = h / layers;
      /* The warp pushes bands up to ~0.11h off their nominal line, so the
         stack is drawn past both edges by that much or the corners go bald. */
      var pad = Math.ceil((0.12 * h) / band) + 1;
      for (var i = -pad; i < layers + pad; i++) {
        ctx.fillStyle = (i % 2) ? light : dark;
        ctx.globalAlpha = band < 2 ? 0.55 + band * 0.22 : 1;
        ctx.beginPath();
        var step = Math.max(3, w / 90);
        ctx.moveTo(0, i * band + warp(0, w) * h);
        for (var x = step; x <= w; x += step) ctx.lineTo(x, i * band + warp(x, w) * h);
        ctx.lineTo(w, (i + 1) * band + warp(w, w) * h);
        for (var x2 = w - step; x2 >= 0; x2 -= step) ctx.lineTo(x2, (i + 1) * band + warp(x2, w) * h);
        ctx.closePath();
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function render(n) {
      var layers = layersAt(n);
      var um = layerUm(n);
      outFolds.textContent = n;
      outLayers.textContent = fmtCount(layers);
      outLayer.textContent = fmtLayer(um);
      outLayer.classList.toggle('past', um < ETCH_LIMIT_UM);

      if (n === 0) {
        note.innerHTML = 'Seven bars, alternating 1084 and 15N20, forge-welded into one billet 42&nbsp;mm thick. Nothing has been folded yet.';
      } else if (um >= 120) {
        note.innerHTML = 'Drawn out, cut, folded back and welded again. The layers are still coarse enough to read across the room.';
      } else if (um >= ETCH_LIMIT_UM) {
        note.innerHTML = 'The pattern is at its best here: fine enough to look like weather, coarse enough that the etch still bites every layer.';
      } else {
        note.innerHTML = '<b>' + fmtLayer(um) + ' per layer.</b> Below about 8&nbsp;µm the layers are thinner than the etch can bite. Past ten folds you are not making pattern any more. You are making steel — and every weld you added spent a little more carbon.';
      }

      slider.value = n;
      btnFold.disabled = n >= 14;
      drawPattern(n);
    }

    slider.addEventListener('input', function () { render(parseInt(slider.value, 10) || 0); });
    btnFold.addEventListener('click', function () {
      var n = Math.min(14, (parseInt(slider.value, 10) || 0) + 1);
      render(n);
    });
    btnReset.addEventListener('click', function () { render(0); });

    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { drawPattern(parseInt(slider.value, 10) || 0); }, 180);
    });

    window.hamonFoldRedraw = function () { drawPattern(parseInt(slider.value, 10) || 0); };
    render(3);
  }

  /* ---------------------------------------------------------------------
     6. The commission specification
     Static: it writes a specification and hands it to a mail client. There is
     nothing to POST to and the page does not pretend there is.
     --------------------------------------------------------------------- */

  var build = doc.getElementById('build');
  if (build) {
    /* Each shape carries the two numbers everything else is derived from: how
       tall it is for its length, and how thick the spine is at the heel. Those
       are the figures on blades.html, so the two pages cannot disagree. */
    var SHAPE = {
      gyuto: { name: 'Gyuto', std: 210, ratio: 0.2286, spine: 2.9, handle: 50, base: 520, min: 180, max: 270 },
      petty: { name: 'Petty', std: 135, ratio: 0.2074, spine: 2.2, handle: 45, base: 300, min: 120, max: 165 },
      bunka: { name: 'Bunka', std: 175, ratio: 0.2571, spine: 3.1, handle: 55, base: 560, min: 160, max: 200 },
      sujihiki: { name: 'Sujihiki', std: 270, ratio: 0.1407, spine: 2.6, handle: 70, base: 620, min: 210, max: 300 }
    };
    var STEEL = {
      '26c3': { name: '26C3', hrc: '63–64 HRC', quench: 'Water, 28 °C, interrupted', add: 0, line: 'A bright, busy hamon. The steel we reach for when the line is the point.' },
      'w2': { name: 'W2', hrc: '63 HRC', quench: 'Water, 28 °C, interrupted', add: 40, line: 'The most active line of the three — vanadium throws bright flecks above the boundary.' },
      '1084': { name: '1084', hrc: '60 HRC', quench: 'Fast oil, 50 °C', add: -30, line: 'Tough and forgiving. It will take a line, but a quiet one. Say now if that matters.' },
      'sanmai': { name: 'San mai — 26C3 core, mild jacket', hrc: '62 HRC at the core', quench: 'Water, 28 °C, interrupted', add: 50, line: 'The jacket protects the core and hides the hamon. A trade, made on purpose.' },
      'pw': { name: 'Pattern-welded — 1084 / 15N20, 224 layers', hrc: '60 HRC', quench: 'Fast oil, 50 °C', add: 120, line: 'Five folds. Ten is not on the list, for the reason the fold table gives.' }
    };
    var GRIND = {
      flat: { name: 'Full flat, distal taper', behind: 0.24, add: 0 },
      convex: { name: 'Convex', behind: 0.31, add: 30 },
      chisel: { name: 'Single bevel, right-handed', behind: 0.18, add: 60 }
    };

    var fShape = doc.getElementById('fShape');
    var fSteel = doc.getElementById('fSteel');
    var fLength = doc.getElementById('fLength');
    var fLengthOut = doc.getElementById('fLengthOut');
    var fGrind = doc.getElementById('fGrind');
    var fHandle = doc.getElementById('fHandle');
    var fName = doc.getElementById('fName');
    var sheet = doc.getElementById('sheet');
    var mailto = doc.getElementById('mailto');
    var copy = doc.getElementById('copy');
    var said = doc.getElementById('said');
    var advice = doc.getElementById('advice');
    var lengthHint = doc.getElementById('lengthHint');

    function spec() {
      var sh = SHAPE[fShape.value];
      var st = STEEL[fSteel.value];
      var gr = GRIND[fGrind.value];
      var mm = parseInt(fLength.value, 10);

      /* Weight straight from the section: a wedge of height × spine × length,
         at 7.85 g/cm³, plus the handle. Same model as the catalogue. */
      var height = Math.round(mm * sh.ratio);
      var grams = Math.round((0.5 * height * sh.spine * mm / 1000) * 7.85 + sh.handle);
      var price = Math.round((sh.base + st.add + gr.add + (mm - sh.std) * 1.2) / 5) * 5;

      var lines = [
        'HAMON — SPECIFICATION',
        'The Fulling Mill, Cleave Ford',
        '',
        'Shape            ' + sh.name,
        'Edge length      ' + mm + ' mm',
        'Height at heel   ' + height + ' mm',
        'Spine at heel    ' + sh.spine.toFixed(1) + ' mm',
        'Behind the edge  ' + gr.behind.toFixed(2) + ' mm',
        'Grind            ' + gr.name,
        '',
        'Steel            ' + st.name,
        'Hardening        ' + st.quench,
        'Hardness         ' + st.hrc,
        'Temper           200 °C, two cycles of one hour',
        '',
        'Handle           ' + fHandle.options[fHandle.selectedIndex].text,
        'Weight, about    ' + grams + ' g',
        'Guide price      £' + price,
        'Lead time        22 weeks from the deposit',
        '',
        'For              ' + (fName.value.trim() || '—')
      ];
      return lines.join('\n');
    }

    /* The shape decides what lengths are sane, so it retunes the slider. */
    function applyShape() {
      var sh = SHAPE[fShape.value];
      var mm = parseInt(fLength.value, 10);
      fLength.min = sh.min;
      fLength.max = sh.max;
      if (mm < sh.min || mm > sh.max) fLength.value = sh.std;
      lengthHint.textContent = 'Standard for this shape is ' + sh.std + ' mm. We make it between ' + sh.min + ' and ' + sh.max + '.';
      /* A bunka is a san-mai blade here; nothing else is offered in it. */
      if (fShape.value === 'bunka') { fSteel.value = 'sanmai'; }
    }

    function update() {
      var text = spec();
      sheet.textContent = text;
      fLengthOut.textContent = fLength.value;
      advice.textContent = STEEL[fSteel.value].line;
      mailto.href = 'mailto:forge@hamonforge.example?subject=' +
        encodeURIComponent('Commission — ' + SHAPE[fShape.value].name + ' ' + fLength.value + ', ' + STEEL[fSteel.value].name) +
        '&body=' + encodeURIComponent(text + '\n\n');
      said.textContent = '';
    }

    fShape.addEventListener('change', function () { applyShape(); update(); });
    [fSteel, fGrind, fHandle].forEach(function (el) { el.addEventListener('change', update); });
    fLength.addEventListener('input', update);
    fName.addEventListener('input', update);
    applyShape();

    copy.addEventListener('click', function () {
      var text = spec();
      function ok() { said.textContent = 'Specification copied.'; }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(ok, function () { said.textContent = 'Select the text above to copy it.'; });
      } else {
        said.textContent = 'Select the text above to copy it.';
      }
    });

    update();
  }
})();
