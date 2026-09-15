/* ORRIS — photoreal amber flacon with flowing liquid */
(function () {
  'use strict';

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  function Vial(canvas, opts) {
    opts = opts || {};
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.mode = opts.mode || canvas.getAttribute('data-mode') || 'desk';
    this.rgb = [176, 122, 58];
    this.targetRgb = [176, 122, 58];
    this.density = 0.48;
    this.targetDensity = 0.48;
    this.t = 0;
    this.pointer = { x: 0.55, y: 0.4 };
    this.running = false;
    this.reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.phase = Math.random() * Math.PI * 2;
    this._onResize = this.resize.bind(this);
    this._onMove = this.onMove.bind(this);
    this._tick = this.tick.bind(this);
  }

  Vial.prototype.mount = function () {
    this.resize();
    window.addEventListener('resize', this._onResize, { passive: true });
    window.addEventListener('pointermove', this._onMove, { passive: true });
    if (!this.reduce) {
      this.running = true;
      requestAnimationFrame(this._tick);
    } else {
      this.draw(0);
    }
  };

  Vial.prototype.destroy = function () {
    this.running = false;
    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('pointermove', this._onMove);
  };

  Vial.prototype.resize = function () {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var rect = this.canvas.getBoundingClientRect();
    var w = Math.max(1, Math.floor(rect.width * dpr));
    var h = Math.max(1, Math.floor(rect.height * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this.dpr = dpr;
  };

  Vial.prototype.onMove = function (e) {
    var rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    this.pointer.x = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    this.pointer.y = clamp((e.clientY - rect.top) / rect.height, 0, 1);
  };

  Vial.prototype.setFormula = function (rgb, density) {
    this.targetRgb = rgb.slice();
    this.targetDensity = clamp(density, 0.28, 0.88);
  };

  Vial.prototype.tick = function (now) {
    if (!this.running) return;
    this.t = now * 0.001;
    for (var i = 0; i < 3; i++) {
      this.rgb[i] += (this.targetRgb[i] - this.rgb[i]) * 0.045;
    }
    this.density += (this.targetDensity - this.density) * 0.04;
    this.draw(this.t);
    requestAnimationFrame(this._tick);
  };

  Vial.prototype.draw = function (t) {
    var ctx = this.ctx;
    var w = this.canvas.width;
    var h = this.canvas.height;
    if (!w || !h) return;
    var dpr = this.dpr || 1;
    var solo = this.mode === 'solo';

    // Studio / desk backdrop
    var desk = ctx.createLinearGradient(0, 0, 0, h);
    desk.addColorStop(0, '#efebe3');
    desk.addColorStop(0.55, '#e4dfd5');
    desk.addColorStop(1, '#d5cfc3');
    ctx.fillStyle = desk;
    ctx.fillRect(0, 0, w, h);

    var wash = ctx.createRadialGradient(w * 0.5, h * 0.28, 0, w * 0.5, h * 0.35, w * 0.5);
    wash.addColorStop(0, 'rgba(255,255,255,0.55)');
    wash.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, w, h);

    var r = Math.round(this.rgb[0]);
    var gch = Math.round(this.rgb[1]);
    var b = Math.round(this.rgb[2]);

    // Amber glass bottle — dropper silhouette
    var vw = Math.min(w * (solo ? 0.36 : 0.34), h * 0.3);
    var vh = Math.min(h * (solo ? 0.68 : 0.62), w * 0.78);
    var cx = solo ? w * 0.5 : w * 0.52;
    var top = solo ? h * 0.1 : h * 0.11;
    var neckW = vw * 0.42;
    var neckH = vh * 0.1;
    var bodyTop = top + neckH + vh * 0.02;
    var bodyH = vh - neckH - vh * 0.02;
    var bodyR = vw * 0.12;

    function roundRect(x, y, rw, rh, rad) {
      ctx.beginPath();
      ctx.moveTo(x + rad, y);
      ctx.lineTo(x + rw - rad, y);
      ctx.quadraticCurveTo(x + rw, y, x + rw, y + rad);
      ctx.lineTo(x + rw, y + rh - rad);
      ctx.quadraticCurveTo(x + rw, y + rh, x + rw - rad, y + rh);
      ctx.lineTo(x + rad, y + rh);
      ctx.quadraticCurveTo(x, y + rh, x, y + rh - rad);
      ctx.lineTo(x, y + rad);
      ctx.quadraticCurveTo(x, y, x + rad, y);
      ctx.closePath();
    }

    // Contact shadow
    ctx.save();
    ctx.translate(cx, top + vh + h * 0.015);
    ctx.scale(1, 0.2);
    var shadow = ctx.createRadialGradient(0, 0, 0, 0, 0, vw * 1.15);
    shadow.addColorStop(0, 'rgba(40, 32, 24, 0.32)');
    shadow.addColorStop(1, 'rgba(40, 32, 24, 0)');
    ctx.fillStyle = shadow;
    ctx.beginPath();
    ctx.arc(0, 0, vw * 1.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Dropper bulb + ribbed cap
    var capH = neckH * 0.85;
    var capY = top - capH;
    roundRect(cx - neckW * 0.55, capY, neckW * 1.1, capH * 0.55, 6 * dpr);
    ctx.fillStyle = '#1c1a18';
    ctx.fill();
    // ribs
    ctx.strokeStyle = 'rgba(80,76,70,0.55)';
    ctx.lineWidth = Math.max(1, dpr);
    for (var rib = 0; rib < 5; rib++) {
      var ry = capY + capH * 0.55 + rib * (capH * 0.08);
      ctx.beginPath();
      ctx.moveTo(cx - neckW * 0.48, ry);
      ctx.lineTo(cx + neckW * 0.48, ry);
      ctx.stroke();
    }
    roundRect(cx - neckW * 0.48, capY + capH * 0.5, neckW * 0.96, capH * 0.5, 3 * dpr);
    ctx.fillStyle = '#2a2723';
    ctx.fill();

    // Glass neck collar
    roundRect(cx - neckW / 2, top, neckW, neckH + 4, neckW * 0.12);
    var neckGlass = ctx.createLinearGradient(cx - neckW / 2, top, cx + neckW / 2, top);
    neckGlass.addColorStop(0, 'rgba(120, 70, 30, 0.35)');
    neckGlass.addColorStop(0.45, 'rgba(220, 170, 90, 0.25)');
    neckGlass.addColorStop(1, 'rgba(90, 50, 20, 0.4)');
    ctx.fillStyle = neckGlass;
    ctx.fill();
    ctx.strokeStyle = 'rgba(70, 45, 25, 0.45)';
    ctx.stroke();

    // Bottle body glass shell
    ctx.save();
    roundRect(cx - vw / 2, bodyTop, vw, bodyH, bodyR);
    ctx.clip();

    // Amber glass tint of empty bottle
    var glassBody = ctx.createLinearGradient(cx - vw / 2, bodyTop, cx + vw / 2, bodyTop + bodyH);
    glassBody.addColorStop(0, 'rgba(190, 120, 45, 0.28)');
    glassBody.addColorStop(0.5, 'rgba(230, 190, 120, 0.18)');
    glassBody.addColorStop(1, 'rgba(140, 80, 30, 0.35)');
    ctx.fillStyle = glassBody;
    ctx.fillRect(cx - vw / 2, bodyTop, vw, bodyH);

    // Flowing liquid surface
    var baseFill = bodyTop + bodyH * (1 - this.density * 0.7 - 0.12);
    var waveAmp = (solo ? 7 : 5) * dpr;
    var flow = t * 1.6 + this.phase;
    var tilt = (this.pointer.x - 0.5) * 10 * dpr;

    ctx.beginPath();
    ctx.moveTo(cx - vw / 2, bodyTop + bodyH);
    ctx.lineTo(cx - vw / 2, baseFill + waveAmp);
    var steps = 28;
    for (var i = 0; i <= steps; i++) {
      var px = cx - vw / 2 + (vw * i) / steps;
      var n = i / steps;
      var y =
        baseFill +
        tilt * (n - 0.5) +
        Math.sin(flow + n * Math.PI * 2.2) * waveAmp +
        Math.sin(flow * 1.7 + n * Math.PI * 4.1) * waveAmp * 0.35;
      ctx.lineTo(px, y);
    }
    ctx.lineTo(cx + vw / 2, bodyTop + bodyH);
    ctx.closePath();

    var liquid = ctx.createLinearGradient(cx - vw / 2, baseFill, cx + vw / 2, bodyTop + bodyH);
    liquid.addColorStop(0, 'rgba(' + Math.min(255, r + 35) + ',' + Math.min(255, gch + 22) + ',' + Math.min(255, b + 8) + ',0.78)');
    liquid.addColorStop(0.4, 'rgba(' + r + ',' + gch + ',' + b + ',0.9)');
    liquid.addColorStop(1, 'rgba(' + Math.max(0, r - 40) + ',' + Math.max(0, gch - 35) + ',' + Math.max(0, b - 20) + ',0.96)');
    ctx.fillStyle = liquid;
    ctx.fill();

    // Internal swirl bands that drift with flow
    ctx.save();
    ctx.globalAlpha = 0.22 + this.density * 0.12;
    for (var band = 0; band < 5; band++) {
      var by =
        baseFill +
        ((t * 22 + band * 34 + this.phase * 10) % (bodyH * 0.62));
      var bandGrad = ctx.createLinearGradient(cx - vw / 2, by, cx + vw / 2, by + 14 * dpr);
      bandGrad.addColorStop(0, 'rgba(255,255,255,0)');
      bandGrad.addColorStop(0.45, 'rgba(255,240,210,0.55)');
      bandGrad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = bandGrad;
      ctx.beginPath();
      ctx.ellipse(cx + Math.sin(t + band) * vw * 0.08, by, vw * 0.42, 5 * dpr, 0.15, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Micro bubbles rising
    if (!this.reduce) {
      ctx.fillStyle = 'rgba(255,245,220,0.35)';
      for (var bub = 0; bub < 8; bub++) {
        var bx = cx - vw * 0.28 + ((bub * 47 + Math.sin(t + bub) * 12) % (vw * 0.56));
        var by2 = bodyTop + bodyH - ((t * 28 + bub * 41) % (bodyH * this.density * 0.85 + 1));
        if (by2 > baseFill) {
          ctx.beginPath();
          ctx.arc(bx, by2, (1.2 + (bub % 3) * 0.6) * dpr, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Dip tube
    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.lineWidth = Math.max(1.5, 1.8 * dpr);
    ctx.beginPath();
    ctx.moveTo(cx, top + neckH);
    ctx.lineTo(cx, bodyTop + bodyH - 10 * dpr);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(60,40,20,0.25)';
    ctx.lineWidth = Math.max(1, dpr);
    ctx.beginPath();
    ctx.moveTo(cx + 2 * dpr, top + neckH);
    ctx.lineTo(cx + 2 * dpr, bodyTop + bodyH - 10 * dpr);
    ctx.stroke();

    // Pointer caustic through glass
    var caustic = ctx.createRadialGradient(
      lerp(cx - vw / 2, cx + vw / 2, this.pointer.x),
      lerp(baseFill, bodyTop + bodyH, this.pointer.y),
      0,
      cx,
      baseFill + bodyH * 0.2,
      vw * 0.9
    );
    caustic.addColorStop(0, 'rgba(255,255,255,0.22)');
    caustic.addColorStop(0.35, 'rgba(255,230,180,0.08)');
    caustic.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = caustic;
    ctx.fillRect(cx - vw / 2, baseFill - 8, vw, bodyTop + bodyH - baseFill + 8);

    ctx.restore();

    // Glass rim + thickness
    roundRect(cx - vw / 2, bodyTop, vw, bodyH, bodyR);
    ctx.strokeStyle = 'rgba(90, 55, 25, 0.55)';
    ctx.lineWidth = Math.max(1.4, 1.5 * dpr);
    ctx.stroke();

    // Specular highlight strip
    ctx.save();
    roundRect(cx - vw / 2, bodyTop, vw, bodyH, bodyR);
    ctx.clip();
    var gloss = ctx.createLinearGradient(cx - vw / 2, bodyTop, cx - vw / 2 + vw * 0.32, bodyTop + bodyH);
    gloss.addColorStop(0, 'rgba(255,255,255,0.5)');
    gloss.addColorStop(0.18, 'rgba(255,255,255,0.12)');
    gloss.addColorStop(0.4, 'rgba(255,255,255,0)');
    ctx.fillStyle = gloss;
    ctx.fillRect(cx - vw / 2, bodyTop, vw * 0.32, bodyH);
    // secondary edge sparkle
    var gloss2 = ctx.createLinearGradient(cx + vw * 0.28, bodyTop, cx + vw / 2, bodyTop + bodyH * 0.5);
    gloss2.addColorStop(0, 'rgba(255,255,255,0)');
    gloss2.addColorStop(0.5, 'rgba(255,255,255,0.18)');
    gloss2.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gloss2;
    ctx.fillRect(cx + vw * 0.2, bodyTop, vw * 0.3, bodyH * 0.55);
    ctx.restore();
  };

  window.ORRIS = window.ORRIS || {};
  window.ORRIS.Vial = Vial;
})();
