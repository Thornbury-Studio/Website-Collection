/* GRATICULE — sheet AD 148, the drawn map and the section tool.

   Draws the whole sheet to one canvas (relief, water, contours, graticule,
   index labels) and puts an SVG on top for the things the reader moves: the
   section line A-B and the crosshair. The canvas is only redrawn on resize,
   theme change or a relief toggle; dragging a station touches nothing but
   the overlay and the profile, so a drag stays cheap however dense the
   contours are.

   Palette is read from the stylesheet rather than repeated here, so the
   Office/Field swap needs no second copy of the colours. */

(function (root, doc) {
  'use strict';

  var T = root.Terrain;
  if (!T) return;

  var CONTOURS = null;      /* traced once — the terrain never changes */
  var STREAM = null;

  function css(name) {
    return getComputedStyle(doc.documentElement).getPropertyValue(name).trim();
  }

  function rgb(hex) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var v = parseInt(h, 16);
    return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
  }

  function palette() {
    var field = doc.documentElement.getAttribute('data-mode') === 'field';
    var wf = rgb(css('--water-fill'));
    return {
      field: field,
      paper: css('--paper'),
      contour: css('--contour'),
      contour2: css('--contour-2'),
      water: css('--water'),
      grid: css('--grid-line'),
      signal: css('--signal'),
      ink: css('--ink'),
      /* Hypsometric ramp: low ground to high ground. In Office this is the
         damp green-grey of a valley floor rising to sunlit bracken; in Field
         it is the near-black of model space with only enough lift to read. */
      tint: field
        ? { r0: 15, g0: 20, b0: 26, r1: 38, g1: 47, b1: 55, wr: wf.r, wg: wf.g, wb: wf.b }
        : { r0: 207, g0: 206, b0: 188, r1: 235, g1: 227, b1: 205, wr: wf.r, wg: wf.g, wb: wf.b }
    };
  }

  /* ---- the canvas -------------------------------------------------------- */

  function Sheet(plot) {
    this.plot = plot;
    this.canvas = plot.querySelector('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.svg = plot.querySelector('svg');
    this.relief = true;
    this.w = 0; this.h = 0;
    this.raf = 0;
    this.reliefKey = '';
    this.reliefCanvas = null;
  }

  Sheet.prototype.size = function () {
    var r = this.plot.getBoundingClientRect();
    var dpr = Math.min(root.devicePixelRatio || 1, 2);
    if (r.width < 2 || r.height < 2) return false;
    this.w = r.width; this.h = r.height;
    this.canvas.width = Math.round(r.width * dpr);
    this.canvas.height = Math.round(r.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return true;
  };

  Sheet.prototype.draw = function (animate) {
    if (!this.size()) return;
    var ctx = this.ctx, w = this.w, h = this.h, p = palette();
    if (!CONTOURS) { CONTOURS = T.contours(); STREAM = T.stream(); }

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = p.paper;
    ctx.fillRect(0, 0, w, h);

    if (this.relief) this.drawRelief(p);
    this.drawGraticule(p);

    var reduce = root.matchMedia('(prefers-reduced-motion: reduce)').matches;
    cancelAnimationFrame(this.raf);
    if (animate && !reduce) this.plotContours(p, performance.now());
    else { this.drawContours(p, 1); this.drawWater(p); this.drawLabels(p); }
  };

  /* Relief goes to a small offscreen canvas and is enlarged. See terrain.js —
     the shading is low-frequency, so this is both cheaper and closer to a
     printed sheet than shading every device pixel.

     The shaded bitmap is cached against aspect ratio and theme. Without this
     the plot animation would re-shade sixty thousand pixels every frame; with
     it, each animation frame is one drawImage. */
  Sheet.prototype.drawRelief = function (p) {
    var sw = 300, sh = Math.max(80, Math.round(sw * (this.h / this.w)));
    var key = sw + 'x' + sh + (p.field ? '/f' : '/o');
    if (this.reliefKey !== key) {
      var made = doc.createElement('canvas');
      made.width = sw; made.height = sh;
      var octx = made.getContext('2d');
      var img = octx.createImageData(sw, sh);
      img.data.set(T.shade(sw, sh, p.tint));
      octx.putImageData(img, 0, 0);
      this.reliefCanvas = made;
      this.reliefKey = key;
    }
    var off = this.reliefCanvas;

    var ctx = this.ctx;
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.globalAlpha = p.field ? 0.92 : 0.78;
    ctx.drawImage(off, 0, 0, this.w, this.h);
    ctx.restore();
  };

  /* 250 m national grid, the same interval the margin numbers step by. */
  Sheet.prototype.drawGraticule = function (p) {
    var ctx = this.ctx, w = this.w, h = this.h, i;
    ctx.save();
    ctx.strokeStyle = p.grid;
    ctx.globalAlpha = p.field ? 0.55 : 0.38;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (i = 250; i < T.W; i += 250) {
      var x = Math.round(i / T.W * w) + 0.5;
      ctx.moveTo(x, 0); ctx.lineTo(x, h);
    }
    for (i = 250; i < T.H; i += 250) {
      var y = Math.round(i / T.H * h) + 0.5;
      ctx.moveTo(0, y); ctx.lineTo(w, y);
    }
    ctx.stroke();
    ctx.restore();
  };

  Sheet.prototype.drawContours = function (p, upto) {
    var ctx = this.ctx, w = this.w, h = this.h;
    var n = Math.round(CONTOURS.length * upto);
    ctx.save();
    ctx.lineCap = 'round';
    for (var li = 0; li < n; li++) {
      var lv = CONTOURS[li], s = lv.seg;
      if (!s.length) continue;
      ctx.strokeStyle = lv.index ? p.contour : p.contour2;
      ctx.lineWidth = lv.index ? 1.35 : 0.7;
      ctx.globalAlpha = lv.index ? 1 : (p.field ? 0.78 : 0.72);
      ctx.beginPath();
      for (var i = 0; i < s.length; i += 4) {
        ctx.moveTo(s[i] * w, s[i + 1] * h);
        ctx.lineTo(s[i + 2] * w, s[i + 3] * h);
      }
      ctx.stroke();
    }
    ctx.restore();
  };

  /* The sheet arrives the way a pen plotter would lay it down, low ground
     first. It is the one place on the page motion is spent, and it happens
     once. */
  Sheet.prototype.plotContours = function (p, t0) {
    var self = this;
    var DUR = 900;
    (function step(now) {
      var k = Math.min(1, (now - t0) / DUR);
      var e = 1 - Math.pow(1 - k, 3);
      self.ctx.clearRect(0, 0, self.w, self.h);
      self.ctx.fillStyle = p.paper;
      self.ctx.fillRect(0, 0, self.w, self.h);
      if (self.relief) self.drawRelief(p);
      self.drawGraticule(p);
      self.drawContours(p, e);
      if (k < 1) self.raf = requestAnimationFrame(step);
      else { self.drawWater(p); self.drawLabels(p); }
    })(t0);
  };

  Sheet.prototype.drawWater = function (p) {
    var ctx = this.ctx, w = this.w, h = this.h;
    ctx.save();
    ctx.strokeStyle = p.water;
    ctx.lineWidth = 1.6;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    var started = false;
    for (var i = 0; i < STREAM.length; i += 2) {
      var u = STREAM[i], v = STREAM[i + 1];
      /* The watercourse stops at the lake shore rather than being drawn
         across open water. */
      if (T.height(u, v) < T.LAKE) { started = false; continue; }
      if (!started) { ctx.moveTo(u * w, v * h); started = true; }
      else ctx.lineTo(u * w, v * h);
    }
    ctx.stroke();
    ctx.restore();
  };

  /* Index contours carry their height. The label is haloed in paper so the
     line breaks around it — the convention on every printed sheet, and the
     only reason a 50 m label stays readable over its own contour. */
  Sheet.prototype.drawLabels = function (p) {
    var ctx = this.ctx, w = this.w, h = this.h;
    ctx.save();
    ctx.font = '500 10px ' + (css('--mono') || 'monospace');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';

    for (var li = 0; li < CONTOURS.length; li++) {
      var lv = CONTOURS[li];
      if (!lv.index || !lv.seg.length) continue;
      var s = lv.seg, count = s.length / 4;
      /* Two labels per index contour, taken a third and two thirds of the
         way through the level's segment list so they land apart. */
      var picks = count > 40 ? [Math.floor(count / 3), Math.floor(count * 2 / 3)]
                             : [Math.floor(count / 2)];
      for (var k = 0; k < picks.length; k++) {
        var i = picks[k] * 4;
        var x0 = s[i] * w, y0 = s[i + 1] * h, x1 = s[i + 2] * w, y1 = s[i + 3] * h;
        var ang = Math.atan2(y1 - y0, x1 - x0);
        if (ang > Math.PI / 2) ang -= Math.PI;
        if (ang < -Math.PI / 2) ang += Math.PI;
        ctx.save();
        ctx.translate((x0 + x1) / 2, (y0 + y1) / 2);
        ctx.rotate(ang);
        ctx.strokeStyle = p.paper;
        ctx.lineWidth = 4;
        ctx.strokeText(String(lv.z), 0, 0);
        ctx.fillStyle = p.contour;
        ctx.fillText(String(lv.z), 0, 0);
        ctx.restore();
      }
    }
    ctx.restore();
  };

  /* ---- the section tool -------------------------------------------------- */

  var PRESETS = {
    cwm:   { a: [0.14, 0.22], b: [0.72, 0.86], label: 'Across the cwm' },
    ridge: { a: [0.06, 0.62], b: [0.95, 0.44], label: 'Along the north ridge' },
    leat:  { a: [0.30, 0.94], b: [0.86, 0.16], label: 'Llyn to the col' }
  };

  function fmt(n, d) {
    return n.toLocaleString('en-GB', { minimumFractionDigits: d, maximumFractionDigits: d });
  }

  function init() {
    var plot = doc.getElementById('plot');
    if (!plot) return;

    var sheet = new Sheet(plot);
    var svg = plot.querySelector('svg');
    var cursor = doc.getElementById('plotCursor');
    var hA = doc.getElementById('stnA'), hB = doc.getElementById('stnB');
    var line = doc.getElementById('sectionLine');
    var prof = doc.getElementById('profile');
    var stats = doc.getElementById('profileStats');
    var name = doc.getElementById('sectionName');

    var A = PRESETS.cwm.a.slice(), B = PRESETS.cwm.b.slice();
    var current = 'cwm';

    /* -- overlay ----------------------------------------------------------- */

    function placeHandles() {
      var r = plot.getBoundingClientRect();
      hA.style.left = (A[0] * 100) + '%'; hA.style.top = (A[1] * 100) + '%';
      hB.style.left = (B[0] * 100) + '%'; hB.style.top = (B[1] * 100) + '%';
      if (r.width > 2) {
        svg.setAttribute('viewBox', '0 0 ' + r.width + ' ' + r.height);
        line.setAttribute('x1', A[0] * r.width); line.setAttribute('y1', A[1] * r.height);
        line.setAttribute('x2', B[0] * r.width); line.setAttribute('y2', B[1] * r.height);
      }
    }

    /* -- profile ----------------------------------------------------------- */

    var VW = 720, VH = 190, PAD_L = 44, PAD_R = 12, PAD_T = 14, PAD_B = 26;

    function drawProfile() {
      var s = T.section(A[0], A[1], B[0], B[1], 300);

      /* Round the vertical band out to the next 50 m so the axis labels are
         the numbers a section would actually be drawn against. */
      var zLo = Math.floor(s.min / 50) * 50, zHi = Math.ceil(s.max / 50) * 50;
      if (zHi - zLo < 100) zHi = zLo + 100;
      var iw = VW - PAD_L - PAD_R, ih = VH - PAD_T - PAD_B;
      var X = function (i) { return PAD_L + i / (s.z.length - 1) * iw; };
      var Y = function (z) { return PAD_T + (1 - (z - zLo) / (zHi - zLo)) * ih; };

      var d = 'M' + X(0) + ' ' + Y(s.z[0]);
      for (var i = 1; i < s.z.length; i++) d += 'L' + X(i).toFixed(1) + ' ' + Y(s.z[i]).toFixed(1);
      var area = d + 'L' + X(s.z.length - 1) + ' ' + (PAD_T + ih) + 'L' + PAD_L + ' ' + (PAD_T + ih) + 'Z';

      doc.getElementById('profLine').setAttribute('d', d);
      doc.getElementById('profArea').setAttribute('d', area);

      /* Vertical axis: a line every 50 m. */
      var gy = '', ty = '';
      for (var z = zLo; z <= zHi; z += 50) {
        var y = Y(z).toFixed(1);
        gy += '<line x1="' + PAD_L + '" y1="' + y + '" x2="' + (VW - PAD_R) + '" y2="' + y + '"/>';
        ty += '<text x="' + (PAD_L - 7) + '" y="' + y + '" text-anchor="end" dominant-baseline="middle">' + z + '</text>';
      }
      /* Chainage: a tick at a round interval that yields five to nine marks. */
      var stepOpts = [50, 100, 200, 250, 500, 1000];
      var chStep = stepOpts[stepOpts.length - 1];
      for (var k = 0; k < stepOpts.length; k++) {
        if (s.length / stepOpts[k] <= 9) { chStep = stepOpts[k]; break; }
      }
      var gx = '', tx = '';
      for (var c = 0; c <= s.length; c += chStep) {
        var x = (PAD_L + c / s.length * iw).toFixed(1);
        gx += '<line x1="' + x + '" y1="' + PAD_T + '" x2="' + x + '" y2="' + (PAD_T + ih) + '"/>';
        tx += '<text x="' + x + '" y="' + (VH - 8) + '" text-anchor="middle">' + c + '</text>';
      }
      doc.getElementById('profGrid').innerHTML = gy + gx;
      doc.getElementById('profTicks').innerHTML = ty + tx;

      /* Vertical exaggeration, stated because a section without it is a lie
         about the slope. */
      var hScale = s.length / iw;              /* ground metres per unit */
      var vScale = (zHi - zLo) / ih;
      var vex = hScale / vScale;

      stats.innerHTML =
        row('Length', fmt(s.length, 0) + ' m') +
        row('Station A', Math.round(s.a.z) + ' m AOD') +
        row('Station B', Math.round(s.b.z) + ' m AOD') +
        row('Highest', Math.round(s.max) + ' m AOD') +
        row('Lowest', Math.round(s.min) + ' m AOD') +
        row('Total rise', '+' + fmt(s.rise, 0) + ' m') +
        row('Total fall', '−' + fmt(s.fall, 0) + ' m') +
        row('Steepest', fmt(s.grade * 100, 1) + ' %') +
        row('Bearing', fmt(s.bearing, 1) + '°') +
        row('Vert. exag.', '×' + fmt(vex, 1));

      doc.getElementById('refA').textContent = s.a.ref;
      doc.getElementById('refB').textContent = s.b.ref;
    }

    function row(k, v) { return '<div><span>' + k + '</span><b>' + v + '</b></div>'; }

    function update() { placeHandles(); drawProfile(); }

    /* -- dragging ---------------------------------------------------------- */

    function clamp(n) { return n < 0.02 ? 0.02 : n > 0.98 ? 0.98 : n; }

    function drag(handle, pt) {
      handle.addEventListener('pointerdown', function (e) {
        handle.setPointerCapture(e.pointerId);
        handle.dataset.drag = '1';
        e.preventDefault();
      });
      handle.addEventListener('pointermove', function (e) {
        if (handle.dataset.drag !== '1') return;
        var r = plot.getBoundingClientRect();
        pt[0] = clamp((e.clientX - r.left) / r.width);
        pt[1] = clamp((e.clientY - r.top) / r.height);
        setCustom();
        update();
      });
      function end(e) {
        if (handle.dataset.drag !== '1') return;
        handle.dataset.drag = '0';
        try { handle.releasePointerCapture(e.pointerId); } catch (err) { /* already gone */ }
      }
      handle.addEventListener('pointerup', end);
      handle.addEventListener('pointercancel', end);

      /* Keyboard: the same station, moved in 1% steps, so the tool is not
         pointer-only. */
      handle.addEventListener('keydown', function (e) {
        var s = e.shiftKey ? 0.05 : 0.01, used = true;
        if (e.key === 'ArrowLeft') pt[0] = clamp(pt[0] - s);
        else if (e.key === 'ArrowRight') pt[0] = clamp(pt[0] + s);
        else if (e.key === 'ArrowUp') pt[1] = clamp(pt[1] - s);
        else if (e.key === 'ArrowDown') pt[1] = clamp(pt[1] + s);
        else used = false;
        if (used) { e.preventDefault(); setCustom(); update(); }
      });
    }

    function setCustom() {
      if (current === 'custom') return;
      current = 'custom';
      Array.prototype.forEach.call(doc.querySelectorAll('.presets button'), function (b) {
        b.setAttribute('aria-pressed', 'false');
      });
      if (name) name.textContent = 'Section X–X′ (moved)';
    }

    drag(hA, A);
    drag(hB, B);

    Array.prototype.forEach.call(doc.querySelectorAll('.presets button'), function (btn) {
      btn.addEventListener('click', function () {
        var p = PRESETS[btn.dataset.section];
        if (!p) return;
        A[0] = p.a[0]; A[1] = p.a[1]; B[0] = p.b[0]; B[1] = p.b[1];
        current = btn.dataset.section;
        Array.prototype.forEach.call(doc.querySelectorAll('.presets button'), function (b) {
          b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
        });
        if (name) name.textContent = p.label;
        update();
      });
    });

    /* -- hover readout ------------------------------------------------------ */

    plot.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch' || !cursor) return;
      var r = plot.getBoundingClientRect();
      var u = (e.clientX - r.left) / r.width, v = (e.clientY - r.top) / r.height;
      if (u < 0 || u > 1 || v < 0 || v > 1) return;
      cursor.style.left = (e.clientX - r.left) + 'px';
      cursor.style.top = (e.clientY - r.top) + 'px';
      /* Keep the readout inside the sheet near the right and bottom edges. */
      cursor.style.transform = 'translate(' + (u > 0.72 ? 'calc(-100% - .75rem)' : '.75rem') +
                               ',' + (v > 0.8 ? 'calc(-100% - .75rem)' : '.75rem') + ')';
      cursor.setAttribute('data-on', '1');
      cursor.innerHTML =
        T.gridRef(u, v) + '<br>E ' + fmt(T.easting(u), 1) + '<br>N ' + fmt(T.northing(v), 1) +
        '<br><b>' + fmt(T.height(u, v), 1) + ' m AOD</b>';
    });
    plot.addEventListener('pointerleave', function () {
      if (cursor) cursor.setAttribute('data-on', '0');
    });

    /* -- relief toggle ------------------------------------------------------ */

    var reliefBtn = doc.getElementById('reliefBtn');
    if (reliefBtn) {
      reliefBtn.addEventListener('click', function () {
        sheet.relief = !sheet.relief;
        reliefBtn.setAttribute('aria-pressed', sheet.relief ? 'true' : 'false');
        sheet.draw(false);
      });
    }

    /* -- lifecycle ---------------------------------------------------------- */

    sheet.draw(true);
    update();

    var timer;
    root.addEventListener('resize', function () {
      clearTimeout(timer);
      timer = setTimeout(function () { sheet.draw(false); update(); }, 180);
    });
    root.addEventListener('graticule:mode', function () { sheet.draw(false); });

    /* Fonts arrive after the first paint, and the index labels are drawn in
       one of them; redraw once they are ready rather than leaving the sheet
       lettered in the fallback. */
    if (doc.fonts && doc.fonts.ready) {
      doc.fonts.ready.then(function () { sheet.draw(false); });
    }
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init);
  else init();

})(window, document);
