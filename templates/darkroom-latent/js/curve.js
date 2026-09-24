/* LATENT. — the characteristic-curve sheet.
   Draws all seven grades from paper.js and marks where the negative on
   the bench lands at the time on the clock. Redrawn on every change the
   bench announces ('latent:bench'). */
(function () {
  'use strict';
  var P = window.LatentPaper;
  var svg = document.querySelector('[data-curve-svg]');
  if (!P || !svg) return;

  var NS = 'http://www.w3.org/2000/svg';
  var X0 = 64, X1 = 612, Y0 = 26, Y1 = 352;       // plot box
  var LX0 = -1.6, LX1 = 1.6, DY1 = 2.2;
  function x(l) { return X0 + (l - LX0) / (LX1 - LX0) * (X1 - X0); }
  function y(d) { return Y1 - d / DY1 * (Y1 - Y0); }
  function el(name, attrs, text) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    svg.appendChild(e);
    return e;
  }

  // static frame
  [0, 0.5, 1, 1.5, 2].forEach(function (d) {
    el('line', { class: 'grid', x1: X0, x2: X1, y1: y(d), y2: y(d) });
    el('text', { class: 'tick', x: X0 - 10, y: y(d) + 4, 'text-anchor': 'end' }, d.toFixed(1));
  });
  [-1.5, -1, -0.5, 0, 0.5, 1, 1.5].forEach(function (l) {
    el('line', { class: 'grid', x1: x(l), x2: x(l), y1: Y0, y2: Y1 });
    el('text', { class: 'tick', x: x(l), y: Y1 + 18, 'text-anchor': 'middle' }, (l > 0 ? '+' : '') + l.toFixed(1));
  });
  el('line', { class: 'axis', x1: X0, x2: X1, y1: Y1, y2: Y1 });
  el('line', { class: 'axis', x1: X0, x2: X0, y1: Y0, y2: Y1 });
  el('text', { class: 'lab', x: X1, y: Y1 + 60, 'text-anchor': 'end' }, 'Log exposure →');
  el('text', { class: 'lab', x: X0 - 50, y: Y0 - 12 }, 'Print density ↑');

  var curves = {}, labels = {};
  P.GRADES.forEach(function (g) {
    var pts = [];
    for (var l = LX0; l <= LX1 + 1e-6; l += 0.04) pts.push(x(l).toFixed(1) + ',' + y(P.density(l, g)).toFixed(1));
    curves[g.id] = el('polyline', { class: 'c', points: pts.join(' ') });
    var lx = P.logHFor(1.9, g);
    labels[g.id] = el('text', { class: 'cl', x: x(lx) + 5, y: y(1.9) + 4 }, g.id);
  });

  var band = el('rect', { class: 'neg', y: Y1 + 28, height: 12, rx: 1 });
  var bandL = el('text', { class: 'neg-l', y: Y1 + 60 });
  var dotHi = el('circle', { class: 'dot-hi', r: 5 });
  var dotLo = el('circle', { class: 'dot-lo', r: 5 });
  var hiL = el('text', { class: 'neg-l', 'text-anchor': 'end' }, 'highlights');
  var loL = el('text', { class: 'neg-l' }, 'shadows');

  var liveEls = {
    grade: document.querySelector('[data-landing-grade]'),
    time: document.querySelector('[data-landing-time]'),
    hi: document.querySelector('[data-landing-hi]'),
    lo: document.querySelector('[data-landing-lo]')
  };

  function clampX(l) { return Math.min(LX1, Math.max(LX0, l)); }

  function draw(d) {
    var g = P.grade(d.grade), neg = P.NEGS[d.neg];
    var land = P.landing(neg, d.stops, g);
    P.GRADES.forEach(function (gg) {
      var now = gg.id === g.id;
      curves[gg.id].setAttribute('class', 'c' + (now ? ' is-now' : ''));
      labels[gg.id].setAttribute('class', 'cl' + (now ? ' is-now' : ''));
    });
    svg.appendChild(curves[g.id]);   // current curve on top

    var a = x(clampX(land.hiLogH)), b = x(clampX(land.loLogH));
    band.setAttribute('x', Math.min(a, b));
    band.setAttribute('width', Math.max(2, Math.abs(b - a)));
    bandL.setAttribute('x', Math.min(a, b));
    bandL.textContent = 'Frame ' + neg.frame + ' at ' + P.fmtSec(P.seconds(d.stops)) + ' s';
    dotHi.setAttribute('cx', a); dotHi.setAttribute('cy', y(land.hiD));
    dotLo.setAttribute('cx', b); dotLo.setAttribute('cy', y(land.loD));
    hiL.setAttribute('x', a - 9); hiL.setAttribute('y', y(land.hiD) - 9);
    loL.setAttribute('x', b + 9); loL.setAttribute('y', y(land.loD) + 18);
    svg.appendChild(dotHi); svg.appendChild(dotLo);

    if (liveEls.grade) liveEls.grade.textContent = 'grade ' + g.id;
    if (liveEls.time) liveEls.time.textContent = P.fmtSec(P.seconds(d.stops)) + ' s';
    if (liveEls.hi) liveEls.hi.textContent = land.hiD.toFixed(2);
    if (liveEls.lo) liveEls.lo.textContent = land.loD.toFixed(2);
    var frameWord = document.querySelector('[data-landing-frame]');
    if (frameWord) frameWord.textContent = 'frame ' + neg.frame;
  }

  var current = { neg: 0, grade: '2', stops: 3 };
  document.addEventListener('latent:bench', function (e) { current = e.detail; draw(current); });
  draw(current);
})();
