/* FIRST CRACK — shared behaviour for every page. Reads window.FIRSTCRACK
   (js/data.js). Blocks that do not exist on the current page are skipped
   by the presence check at the top of each. */
(function () {
  'use strict';

  var D = window.FIRSTCRACK;
  var doc = document, root = doc.documentElement;
  var anim = root.classList.contains('js-anim');
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var SVG = 'http://www.w3.org/2000/svg';
  function el(tag, cls, html) { var e = doc.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function svg(tag, attrs) { var e = doc.createElementNS(SVG, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function money(n) { return D.currency + ' ' + (Math.round(n * 100) / 100).toFixed(n % 1 ? 2 : 0); }
  function mmss(m) { var s = Math.round(m * 60); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
  var store = {
    get: function (k, d) { try { var v = window.localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { window.localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } }
  };
  var WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function fmt(d) { return WD[d.getDay()] + ' ' + d.getDate() + ' ' + MO[d.getMonth()]; }
  function fmtShort(d) { return d.getDate() + ' ' + MO[d.getMonth()]; }
  function bagById(id) { for (var i = 0; i < D.bags.length; i++) if (D.bags[i].id === id) return D.bags[i]; return null; }

  /* ------------------------------------------------------------------ */
  /* Dates: the next cutoff, the roast day it buys, the door day.        */
  /* ------------------------------------------------------------------ */
  function nextCutoff(now) {
    var d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), D.cutoff.hour, 0, 0);
    var delta = (D.cutoff.day - d.getDay() + 7) % 7;
    d.setDate(d.getDate() + delta);
    if (d <= now) d.setDate(d.getDate() + 7);
    return d;
  }
  function roastAfter(cut) { var r = new Date(cut); r.setDate(r.getDate() + ((D.roastDay - r.getDay() + 7) % 7 || 7 * 0)); if (r <= cut) r.setDate(r.getDate() + 7); r.setHours(6, 0, 0, 0); return r; }
  var now = new Date();
  var cutoff = nextCutoff(now);
  var roastDate = roastAfter(cutoff);
  var doorDate = new Date(roastDate); doorDate.setDate(doorDate.getDate() + 2);
  $$('[data-roast-date]').forEach(function (n) { n.textContent = fmt(roastDate); });
  $$('[data-roast-date-short]').forEach(function (n) { n.textContent = fmtShort(roastDate); });
  $$('[data-door-date]').forEach(function (n) { n.textContent = fmt(doorDate); });
  $$('[data-cutoff]').forEach(function (n) { n.textContent = WD[cutoff.getDay()] + ' ' + String(D.cutoff.hour).padStart(2, '0') + ':00'; });
  $$('[data-year]').forEach(function (n) { n.textContent = String(now.getFullYear()); });

  /* ------------------------------------------------------------------ */
  /* Header, drawer                                                      */
  /* ------------------------------------------------------------------ */
  var top = $('#top'), lastY = window.scrollY, drawerOpen = false;
  function headerState() {
    if (!top) return;
    var y = window.scrollY;
    top.classList.toggle('is-solid', y > 24 || drawerOpen);
    if (!drawerOpen) top.classList.toggle('is-hidden', y > 560 && y > lastY + 6 && !cartOpen);
    if (y < lastY - 6 || y < 560) top.classList.remove('is-hidden');
    lastY = y;
  }
  var burger = $('#burger'), drawer = $('#drawer');
  if (burger && drawer) {
    burger.addEventListener('click', function () {
      drawerOpen = burger.getAttribute('aria-expanded') !== 'true';
      burger.setAttribute('aria-expanded', String(drawerOpen));
      burger.setAttribute('aria-label', drawerOpen ? 'Close menu' : 'Open menu');
      drawer.setAttribute('data-open', String(drawerOpen));
      doc.body.style.overflow = drawerOpen ? 'hidden' : '';
      headerState();
    });
    $$('a', drawer).forEach(function (a) { a.addEventListener('click', function () { if (drawerOpen) burger.click(); }); });
  }

  /* ------------------------------------------------------------------ */
  /* Footage: source by viewport, load near the viewport, play in view.  */
  /* ------------------------------------------------------------------ */
  var vids = $$('video[data-src]');
  if (vids.length && anim && 'IntersectionObserver' in window) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) {
          if (!v.getAttribute('src')) {
            var small = v.getAttribute('data-src-sm');
            v.src = (small && window.innerWidth < 760) ? small : v.getAttribute('data-src');
            v.load();
          }
          var p = v.play();
          if (p && p.then) p.then(function () { v.classList.add('is-live'); }).catch(function () { /* poster stays */ });
          else v.classList.add('is-live');
        } else if (v.getAttribute('src')) v.pause();
      });
    }, { rootMargin: '50% 0px 50% 0px', threshold: 0 });
    vids.forEach(function (v) { vio.observe(v); });
  }

  /* ------------------------------------------------------------------ */
  /* Reveals                                                             */
  /* ------------------------------------------------------------------ */
  function revealAll() { $$('.rv').forEach(function (n) { n.classList.add('is-in'); }); }
  var rio = null;
  if (anim && 'IntersectionObserver' in window) {
    rio = new IntersectionObserver(function (entries) {
      var vh = window.innerHeight;
      entries.forEach(function (e) {
        var r = e.boundingClientRect;
        if (e.isIntersecting || (r.top < vh * 0.94 && r.bottom > 0)) { e.target.classList.add('is-in'); rio.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0 });
    $$('.rv').forEach(function (n) { rio.observe(n); });
    setTimeout(revealAll, 4000);
    var sweepT = 0;
    var sweep = function () {
      if (sweepT) return;
      sweepT = setTimeout(function () {
        sweepT = 0; var vh = window.innerHeight;
        $$('.rv').forEach(function (n) { if (!n.classList.contains('is-in')) { var r = n.getBoundingClientRect(); if (r.top < vh && r.bottom > 0) n.classList.add('is-in'); } });
      }, 140);
    };
    window.addEventListener('load', sweep);
    window.addEventListener('scroll', sweep, { passive: true });
  } else revealAll();

  /* ------------------------------------------------------------------ */
  /* The meter: every glass panel reads the plate behind it and sets    */
  /* its own tint, alpha, blur and text colour so body text clears 5:1. */
  /* ------------------------------------------------------------------ */
  /* metered against the secondary text colour, so the quiet type clears 4.6:1 and the headline clears far more */
  var LIGHT = { tint: [241, 230, 213], Lt: 0.79, fg: 0.0987, minA: 0.66 };
  var DARK = { tint: [30, 20, 16], Lt: 0.0078, fg: 0.47, minA: 0.6 };
  var TARGET = 4.6;
  var samples = {};
  function lum(r, g, b) {
    var f = function (c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  }
  function sampleOf(src, cb) {
    if (samples[src]) { if (samples[src].data) cb(samples[src]); else samples[src].q.push(cb); return; }
    var rec = { q: [cb] }; samples[src] = rec;
    var im = new Image();
    im.onload = function () {
      var w = 96, h = Math.max(8, Math.round(w * im.naturalHeight / im.naturalWidth));
      var c = doc.createElement('canvas'); c.width = w; c.height = h;
      var ctx = c.getContext('2d', { willReadFrequently: true });
      try { ctx.drawImage(im, 0, 0, w, h); rec.data = ctx.getImageData(0, 0, w, h).data; rec.w = w; rec.h = h; rec.ar = im.naturalWidth / im.naturalHeight; }
      catch (e) { rec.data = null; rec.err = true; }
      rec.q.forEach(function (f) { f(rec); }); rec.q = [];
    };
    im.onerror = function () { rec.err = true; rec.q.forEach(function (f) { f(rec); }); rec.q = []; };
    im.src = src;
  }
  function plateSource(panel) {
    var sec = panel.closest('[data-plate]');
    if (!sec) return null;
    var media = $('.plate img, .plate video', sec);
    if (!media) return null;
    var src = media.tagName === 'VIDEO' ? media.getAttribute('poster') : (media.currentSrc || media.getAttribute('src'));
    return { sec: sec, media: media, src: src };
  }
  function region(rec, media, panel) {
    /* map the panel's rect onto the image, honouring object-fit: cover */
    var pr = media.getBoundingClientRect(), r = panel.getBoundingClientRect();
    var boxAr = pr.width / pr.height, imAr = rec.ar;
    var sx, sy, sw, sh;
    if (imAr > boxAr) { sh = rec.h; sw = rec.h * boxAr; sx = (rec.w - sw) / 2; sy = 0; }
    else { sw = rec.w; sh = rec.w / boxAr; sx = 0; sy = (rec.h - sh) / 2; }
    var x0 = clamp((r.left - pr.left) / pr.width, 0, 1), x1 = clamp((r.right - pr.left) / pr.width, 0, 1);
    var y0 = clamp((r.top - pr.top) / pr.height, 0, 1), y1 = clamp((r.bottom - pr.top) / pr.height, 0, 1);
    return { x0: Math.floor(sx + x0 * sw), x1: Math.ceil(sx + x1 * sw), y0: Math.floor(sy + y0 * sh), y1: Math.ceil(sy + y1 * sh) };
  }
  function meterPanel(panel) {
    var ps = plateSource(panel);
    if (!ps || !ps.src) return;
    sampleOf(ps.src, function (rec) {
      if (!rec.data) return;
      var g = region(rec, ps.media, panel);
      var n = 0, sum = 0, sq = 0;
      for (var y = Math.max(0, g.y0); y < Math.min(rec.h, g.y1); y++) for (var x = Math.max(0, g.x0); x < Math.min(rec.w, g.x1); x++) {
        var i = (y * rec.w + x) * 4; var L = lum(rec.data[i], rec.data[i + 1], rec.data[i + 2]);
        sum += L; sq += L * L; n++;
      }
      if (!n) return;
      var mean = sum / n, sd = Math.sqrt(Math.max(0, sq / n - mean * mean));
      var forced = panel.getAttribute('data-meter');
      var tone = ps.sec.getAttribute('data-plate');
      var mode = forced === 'light' || forced === 'dark' ? forced : (tone === 'light' || tone === 'dark' ? tone : (mean > 0.34 ? 'light' : 'dark'));
      var M = mode === 'light' ? LIGHT : DARK;
      var a;
      if (mode === 'light') { var need = TARGET * (M.fg + 0.05) - 0.05; a = (need - mean) / (M.Lt - mean); }
      else { var maxL = (M.fg + 0.05) / TARGET - 0.05; a = (mean - maxL) / (mean - M.Lt); }
      if (!isFinite(a)) a = M.minA;
      a = clamp(a + clamp(sd * 1.4, 0, 0.14), M.minA, 0.94);
      var blur = clamp(Math.round(16 + sd * 60), 14, 30);
      panel.setAttribute('data-mode', mode);
      panel.style.setProperty('--g-tint', M.tint.join(', '));
      panel.style.setProperty('--g-a', a.toFixed(3));
      panel.style.setProperty('--g-blur', blur + 'px');
      panel.style.setProperty('--g-sat', mode === 'light' ? '1.05' : '0.9');
      panel.dataset.bgL = mean.toFixed(3);
    });
  }
  var meterT = 0;
  function meterAll() { $$('.glass[data-meter]').forEach(meterPanel); }
  function meterSoon() { clearTimeout(meterT); meterT = setTimeout(meterAll, 120); }
  meterAll();
  window.addEventListener('load', meterAll);
  window.addEventListener('resize', meterSoon);
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(meterSoon);

  /* ------------------------------------------------------------------ */
  /* Parallax and the scroll loop                                        */
  /* ------------------------------------------------------------------ */
  var pxs = anim ? $$('.px') : [];
  function parallax() {
    var vh = window.innerHeight;
    pxs.forEach(function (n) {
      var r = n.parentElement.getBoundingClientRect();
      if (r.bottom < -100 || r.top > vh + 100) return;
      var c = (r.top + r.height / 2) - vh / 2;
      n.style.transform = 'translate3d(0,' + clamp(c * -0.06, -60, 60).toFixed(1) + 'px,0)';
    });
  }
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () { ticking = false; headerState(); parallax(); });
  }, { passive: true });
  headerState(); parallax();

  /* ------------------------------------------------------------------ */
  /* Roast level: one choice, shared by the curve, the bags, the sub.    */
  /* ------------------------------------------------------------------ */
  var level = store.get('fc.level', 'medium');
  if (!D.levels[level]) level = 'medium';
  var levelListeners = [];
  function setLevel(l, silent) {
    if (!D.levels[l]) return;
    level = l; store.set('fc.level', l);
    if (!silent) levelListeners.forEach(function (f) { f(l); });
  }

  /* ------------------------------------------------------------------ */
  /* The curve: Catmull-Rom through the profile, sampled and drawn.      */
  /* ------------------------------------------------------------------ */
  var P = D.curve;
  function seg(i) { return [P[Math.max(0, i - 1)], P[i], P[Math.min(P.length - 1, i + 1)], P[Math.min(P.length - 1, i + 2)]]; }
  function cr(p0, p1, p2, p3, t) {
    var t2 = t * t, t3 = t2 * t;
    return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
  }
  function temp(t) {
    t = clamp(t, P[0][0], P[P.length - 1][0]);
    for (var i = 0; i < P.length - 1; i++) {
      if (t >= P[i][0] && t <= P[i + 1][0]) {
        var s = seg(i), u = (t - P[i][0]) / (P[i + 1][0] - P[i][0]);
        return cr(s[0][1], s[1][1], s[2][1], s[3][1], u);
      }
    }
    return P[P.length - 1][1];
  }
  function ror(t) { var h = 0.05; return (temp(t + h) - temp(t - h)) / (2 * h); }
  function stageAt(t) { var s = D.stages[0].name; D.stages.forEach(function (st) { if (t >= st.at) s = st.name; }); return s; }
  function pathFor(t0, t1, X, Y, step) {
    var d = '', first = true;
    for (var t = t0; t <= t1 + 1e-6; t += step) { var x = X(t), y = Y(temp(t)); d += (first ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1); first = false; }
    return d;
  }

  /* The big chart on the home page */
  var chart = $('#chart');
  if (chart) {
    var W = 880, H = 400, ML = 52, MR = 26, MT = 26, MB = 44;
    var T0 = 0, T1 = 13, C0 = 60, C1 = 245;
    var X = function (t) { return ML + (t - T0) / (T1 - T0) * (W - ML - MR); };
    var Y = function (c) { return MT + (1 - (c - C0) / (C1 - C0)) * (H - MT - MB); };
    var tX = function (x) { return T0 + (x - ML) / (W - ML - MR) * (T1 - T0); };
    while (chart.lastChild && chart.lastChild.tagName !== 'desc' && chart.lastChild.tagName !== 'title') chart.removeChild(chart.lastChild);

    /* stages */
    var gStage = svg('g', { 'class': 'stage' });
    D.stages.forEach(function (st, i) {
      var end = i + 1 < D.stages.length ? D.stages[i + 1].at : T1;
      if (i % 2 === 1) gStage.appendChild(svg('rect', { x: X(st.at), y: MT, width: X(end) - X(st.at), height: H - MT - MB }));
      var tx = svg('text', { x: X(st.at) + 8, y: MT + 16 }); tx.textContent = st.name; gStage.appendChild(tx);
    });
    chart.appendChild(gStage);
    /* grid */
    var gGrid = svg('g', { 'class': 'grid' });
    for (var c = 80; c <= 240; c += 40) { gGrid.appendChild(svg('line', { x1: ML, x2: W - MR, y1: Y(c), y2: Y(c) })); var lt = svg('text', { 'class': 'temp', x: ML - 8, y: Y(c) + 4, 'text-anchor': 'end' }); lt.textContent = c + '°'; gGrid.appendChild(lt); }
    for (var m = 0; m <= 12; m += 2) { var lm = svg('text', { x: X(m), y: H - 14, 'text-anchor': 'middle' }); lm.textContent = m + ':00'; gGrid.appendChild(lm); }
    chart.appendChild(gGrid);
    var gAxis = svg('g', { 'class': 'axis' });
    gAxis.appendChild(svg('line', { x1: ML, x2: W - MR, y1: Y(C0), y2: Y(C0) }));
    chart.appendChild(gAxis);
    /* development shade (first crack to drop) */
    var dev = svg('rect', { 'class': 'dev', x: X(D.firstCrack), y: MT, width: 0, height: H - MT - MB });
    chart.appendChild(dev);
    /* the whole profile, ghosted; the roasted part, clipped */
    var full = pathFor(T0, T1, X, Y, 0.05);
    chart.appendChild(svg('path', { 'class': 'ghost', d: full }));
    var preview = svg('path', { 'class': 'preview', d: full });
    var pclip = svg('clipPath', { id: 'clip-preview' }); var prect = svg('rect', { x: 0, y: 0, width: 0, height: H }); pclip.appendChild(prect);
    chart.appendChild(pclip); preview.setAttribute('clip-path', 'url(#clip-preview)'); chart.appendChild(preview);
    var clip = svg('clipPath', { id: 'clip-live', 'class': 'clip' }); var crect = svg('rect', { x: 0, y: 0, width: X(D.levels[level].drop), height: H }); clip.appendChild(crect); chart.appendChild(clip);
    var rorPath = '';
    for (var t = 1.6, f = true; t <= T1; t += 0.05) { rorPath += (f ? 'M' : 'L') + X(t).toFixed(1) + ' ' + (Y(C0) - clamp(ror(t), 0, 40) * 3.2).toFixed(1); f = false; }
    var rorEl = svg('path', { 'class': 'ror', d: rorPath }); rorEl.setAttribute('clip-path', 'url(#clip-live)'); chart.appendChild(rorEl);
    var live = svg('path', { 'class': 'live', d: full }); live.setAttribute('clip-path', 'url(#clip-live)'); chart.appendChild(live);
    /* first crack */
    var gFc = svg('g', { 'class': 'fc' });
    gFc.appendChild(svg('line', { x1: X(D.firstCrack), x2: X(D.firstCrack), y1: Y(temp(D.firstCrack)) + 10, y2: Y(C0) }));
    gFc.appendChild(svg('circle', { 'class': 'pulse', cx: X(D.firstCrack), cy: Y(temp(D.firstCrack)), r: 7 }));
    gFc.appendChild(svg('circle', { cx: X(D.firstCrack), cy: Y(temp(D.firstCrack)), r: 5.5 }));
    var fl = svg('text', { x: X(D.firstCrack) - 12, y: Y(temp(D.firstCrack)) - 22, 'text-anchor': 'end' }); fl.textContent = 'First crack'; gFc.appendChild(fl);
    var ft = svg('text', { 'class': 't', x: X(D.firstCrack) - 12, y: Y(temp(D.firstCrack)) - 8, 'text-anchor': 'end' }); ft.textContent = mmss(D.firstCrack) + ' · ' + Math.round(temp(D.firstCrack)) + '°'; gFc.appendChild(ft);
    chart.appendChild(gFc);
    /* drop marker */
    var gDrop = svg('g', { 'class': 'drop' });
    gDrop.appendChild(svg('line', { x1: 0, x2: 0, y1: 10, y2: 0 }));
    gDrop.appendChild(svg('circle', { cx: 0, cy: 0, r: 6.5 }));
    var dl = svg('text', { x: 12, y: -10 }); dl.textContent = 'Drop'; gDrop.appendChild(dl);
    var dt = svg('text', { 'class': 't', x: 12, y: 6 }); gDrop.appendChild(dt);
    chart.appendChild(gDrop);
    /* playhead */
    var gHead = svg('g', { 'class': 'head' });
    var hl = svg('line', { x1: 0, x2: 0, y1: MT, y2: Y(C0) }); var hc = svg('circle', { cx: 0, cy: 0, r: 5.5 });
    gHead.appendChild(hl); gHead.appendChild(hc); chart.appendChild(gHead);

    var tip = $('#tip'), tipT = $('#tip-t'), tipTemp = $('#tip-temp'), tipRor = $('#tip-ror'), tipStage = $('#tip-stage');
    var roDropT = $('#ro-drop-t'), roDropC = $('#ro-drop-c'), roDev = $('#ro-dev'), roDtr = $('#ro-dtr'), roLoss = $('#ro-loss'), roTaste = $('#ro-taste');
    var levelEl = $('#level'), thumb = $('.seg-thumb', levelEl);
    var keys = Object.keys(D.levels);

    function setDropVisual(l) {
      var L = D.levels[l], x = X(L.drop), y = Y(temp(L.drop));
      crect.style.width = x + 'px';
      dev.style.width = Math.max(0, x - X(D.firstCrack)) + 'px';
      gDrop.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      gDrop.querySelector('line').setAttribute('y2', String(Y(C0) - y));
      dt.textContent = mmss(L.drop) + ' · ' + Math.round(temp(L.drop)) + '°';
      if (x > W - 140) { dl.setAttribute('text-anchor', 'end'); dt.setAttribute('text-anchor', 'end'); dl.setAttribute('x', '-12'); dt.setAttribute('x', '-12'); }
      else { dl.setAttribute('text-anchor', 'start'); dt.setAttribute('text-anchor', 'start'); dl.setAttribute('x', '12'); dt.setAttribute('x', '12'); }
    }
    var tweens = {};
    function tweenNum(key, node, from, to, render) {
      if (!anim) { render(to); return; }
      cancelAnimationFrame(tweens[key]);
      var t0 = performance.now(), dur = 560;
      (function step(nw) { var p = clamp((nw - t0) / dur, 0, 1), e = 1 - Math.pow(1 - p, 3); render(lerp(from, to, e)); if (p < 1) tweens[key] = requestAnimationFrame(step); })(t0);
    }
    var shown = { drop: D.levels[level].drop, dev: D.levels[level].drop - D.firstCrack, loss: D.levels[level].loss };
    function renderReadouts(l) {
      var L = D.levels[l];
      tweenNum('drop', roDropT, shown.drop, L.drop, function (v) { roDropT.textContent = mmss(v); roDropC.textContent = Math.round(temp(v)) + ' °C'; });
      tweenNum('dev', roDev, shown.dev, L.drop - D.firstCrack, function (v) { roDev.textContent = mmss(v); roDtr.textContent = Math.round(v / L.drop * 100) + '% of the roast, after first crack'; });
      tweenNum('loss', roLoss, shown.loss, L.loss, function (v) { roLoss.textContent = v.toFixed(1).replace(/\.0$/, '') + '%'; });
      shown = { drop: L.drop, dev: L.drop - D.firstCrack, loss: L.loss };
      roTaste.textContent = L.cup;
      var i = keys.indexOf(l); levelEl.style.setProperty('--i', String(i));
      $$('input', levelEl).forEach(function (inp) { inp.checked = inp.value === l; });
    }
    function applyLevel(l) { setDropVisual(l); renderReadouts(l); }
    applyLevel(level);
    levelListeners.push(applyLevel);
    $$('input', levelEl).forEach(function (inp) {
      inp.addEventListener('change', function () { if (inp.checked) { chart.classList.remove('is-preview'); setLevel(inp.value); } });
      var lab = inp.parentElement;
      lab.addEventListener('pointerenter', function () { if (inp.value === level) return; prect.setAttribute('width', String(X(D.levels[inp.value].drop))); chart.classList.add('is-preview'); });
      lab.addEventListener('pointerleave', function () { chart.classList.remove('is-preview'); });
    });

    /* playhead: pointer and keyboard */
    var headT = D.levels[level].drop, headTarget = headT, headRaf = 0, headOn = false;
    function placeHead(t) {
      var x = X(t), y = Y(temp(t));
      hl.setAttribute('x1', x); hl.setAttribute('x2', x); hc.setAttribute('cx', x); hc.setAttribute('cy', y);
      tipT.textContent = mmss(t); tipTemp.textContent = Math.round(temp(t)) + ' °C'; tipRor.textContent = (ror(t) >= 0 ? '+' : '') + ror(t).toFixed(1) + ' °/min'; tipStage.textContent = t >= D.levels[level].drop ? 'After the drop' : stageAt(t);
      var cw = chart.clientWidth, ch = chart.clientHeight, px = x / W * cw, py = y / H * ch;
      var tw = tip.offsetWidth || 150;
      tip.style.left = clamp(px - tw / 2, 0, cw - tw) + 'px';
      tip.style.top = Math.max(0, py - tip.offsetHeight - 18) + 'px';
    }
    function headLoop() {
      headT = anim ? lerp(headT, headTarget, 0.22) : headTarget;
      placeHead(headT);
      if (Math.abs(headT - headTarget) > 0.002) headRaf = requestAnimationFrame(headLoop); else { headT = headTarget; placeHead(headT); headRaf = 0; }
    }
    function moveHead(t) { headTarget = clamp(t, T0, T1); if (!headRaf) headRaf = requestAnimationFrame(headLoop); }
    function showHead(on) { headOn = on; chart.classList.toggle('is-live', on); tip.classList.toggle('is-on', on); if (on) tip.hidden = false; }
    function tFromEvent(e) { var r = chart.getBoundingClientRect(); return tX((e.clientX - r.left) / r.width * W); }
    chart.addEventListener('pointerenter', function (e) { showHead(true); moveHead(tFromEvent(e)); });
    chart.addEventListener('pointermove', function (e) { if (!headOn) showHead(true); moveHead(tFromEvent(e)); });
    chart.addEventListener('pointerleave', function () { if (doc.activeElement !== chart) showHead(false); });
    chart.addEventListener('pointerdown', function (e) { showHead(true); moveHead(tFromEvent(e)); });
    chart.addEventListener('focus', function () { showHead(true); moveHead(headTarget); });
    chart.addEventListener('blur', function () { showHead(false); });
    chart.addEventListener('keydown', function (e) {
      var step = e.shiftKey ? 1 : 1 / 6;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') moveHead(headTarget + step);
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') moveHead(headTarget - step);
      else if (e.key === 'Home') moveHead(T0);
      else if (e.key === 'End') moveHead(D.levels[level].drop);
      else if (e.key === 'f' || e.key === 'F') moveHead(D.firstCrack);
      else return;
      e.preventDefault();
    });
    placeHead(headT);
    window.addEventListener('resize', function () { placeHead(headT); });
    chart.setAttribute('aria-valuetext', 'Bean temperature over time. First crack at ' + mmss(D.firstCrack) + '. Use arrow keys to move along the roast.');
  }

  /* Mini curves on the origins page */
  $$('.mini[data-drop]').forEach(function (m) {
    var drop = parseFloat(m.getAttribute('data-drop'));
    var W = 400, H = 150, ML = 34, MR = 14, MT = 16, MB = 22, T1 = 13, C0 = 60, C1 = 245;
    var X = function (t) { return ML + t / T1 * (W - ML - MR); }, Y = function (c) { return MT + (1 - (c - C0) / (C1 - C0)) * (H - MT - MB); };
    m.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    m.appendChild(svg('rect', { 'class': 'dev', x: X(D.firstCrack), y: MT, width: Math.max(0, X(drop) - X(D.firstCrack)), height: H - MT - MB }));
    m.appendChild(svg('path', { 'class': 'ghost', d: pathFor(0, T1, X, Y, 0.1) }));
    m.appendChild(svg('path', { 'class': 'live', d: pathFor(0, drop, X, Y, 0.1) }));
    var gf = svg('g', { 'class': 'fc' }); gf.appendChild(svg('line', { x1: X(D.firstCrack), x2: X(D.firstCrack), y1: Y(temp(D.firstCrack)) + 8, y2: Y(C0) })); gf.appendChild(svg('circle', { cx: X(D.firstCrack), cy: Y(temp(D.firstCrack)), r: 4 })); m.appendChild(gf);
    var gd = svg('g', { 'class': 'drop' }); gd.appendChild(svg('circle', { cx: X(drop), cy: Y(temp(drop)), r: 5 })); m.appendChild(gd);
    [0, 4, 8, 12].forEach(function (mn) { var t = svg('text', { x: X(mn), y: H - 6, 'text-anchor': 'middle' }); t.textContent = mn + ':00'; m.appendChild(t); });
    [100, 200].forEach(function (c) { var t = svg('text', { x: ML - 6, y: Y(c) + 4, 'text-anchor': 'end' }); t.textContent = c + '°'; m.appendChild(t); });
  });

  /* ------------------------------------------------------------------ */
  /* Cart                                                                */
  /* ------------------------------------------------------------------ */
  var cart = store.get('fc.cart', []);
  var cartEl = $('#cart'), cartBtn = $('#cart-btn'), cartCount = $('#cart-count'), veil = $('#veil'), cartOpen = false;
  function cartQty() { return cart.reduce(function (s, l) { return s + l.qty; }, 0); }
  function lineLabel(l) {
    if (l.sub) return { name: 'Subscription', sub: l.sub.bags + ' bag' + (l.sub.bags > 1 ? 's' : '') + ' every ' + l.sub.every + ' weeks · ' + (l.sub.pick === 'pick' ? 'roaster’s pick, ' + D.levels[l.sub.level].name.toLowerCase() : bagById(l.sub.bag).origin + ' ' + bagById(l.sub.bag).region), price: l.price, img: l.sub.pick === 'pick' ? 'img/bag-kraft-700.webp' : 'img/bag-' + bagById(l.sub.bag).bag + '-700.webp' };
    var b = bagById(l.id);
    return { name: b.origin + ' · ' + b.region, sub: D.grams + ' g · ' + D.levels[b.roast].name.toLowerCase() + ' roast · roasted ' + fmtShort(roastDate), price: b.price, img: 'img/bag-' + b.bag + '-700.webp' };
  }
  function saveCart() { store.set('fc.cart', cart); renderCart(); }
  function renderCart() {
    if (!cartEl) return;
    var q = cartQty();
    cartCount.textContent = String(q);
    cartBtn.setAttribute('aria-label', 'Your bag, ' + q + ' item' + (q === 1 ? '' : 's'));
    var list = $('#cart-list', cartEl); list.innerHTML = '';
    if (!cart.length) list.appendChild(el('p', 'cart-empty', 'Nothing in your bag yet. This week’s roast is on the table.'));
    var sub = 0;
    cart.forEach(function (l, i) {
      var L = lineLabel(l); sub += L.price * l.qty;
      var row = el('div', 'cart-line');
      row.innerHTML = '<img src="' + L.img + '" alt=""><div class="n"><b>' + esc(L.name) + '</b><small>' + esc(L.sub) + '</small></div><div class="r"><span class="mono">' + money(L.price * l.qty) + '</span>' + (l.sub ? '' : '<div class="qty"><button type="button" data-d="-1" aria-label="One fewer">−</button><output>' + l.qty + '</output><button type="button" data-d="1" aria-label="One more">+</button></div>') + '<button type="button" class="rm">Remove</button></div>';
      $$('[data-d]', row).forEach(function (b) { b.addEventListener('click', function () { l.qty = clamp(l.qty + (+b.getAttribute('data-d')), 1, 12); saveCart(); }); });
      $('.rm', row).addEventListener('click', function () { cart.splice(i, 1); saveCart(); });
      list.appendChild(row);
    });
    var ship = sub === 0 ? 0 : (sub >= D.freeOver || cart.some(function (l) { return l.sub; }) ? 0 : D.shipping);
    $('#c-sub', cartEl).textContent = money(sub);
    $('#c-ship', cartEl).textContent = ship ? money(ship) : (sub ? 'Free' : '—');
    $('#c-total', cartEl).textContent = money(sub + ship);
    $('#c-hint', cartEl).textContent = sub && sub < D.freeOver && !cart.some(function (l) { return l.sub; }) ? money(D.freeOver - sub) + ' more for free delivery' : (sub ? 'Roasted ' + fmt(roastDate) + ', at your door ' + fmt(doorDate) : 'Free delivery over ' + money(D.freeOver));
    $('#c-order', cartEl).disabled = !cart.length;
  }
  function openCart(on) {
    if (!cartEl) return;
    cartOpen = on;
    cartEl.setAttribute('data-open', String(on)); cartEl.setAttribute('aria-hidden', String(!on));
    cartBtn.setAttribute('aria-expanded', String(on));
    veil.classList.toggle('is-on', on);
    doc.body.style.overflow = on ? 'hidden' : '';
    if (on) { setTimeout(function () { ($('.x', cartEl) || cartEl).focus(); }, 60); } else cartBtn.focus();
  }
  function addToCart(id, qty) {
    var line = cart.filter(function (l) { return l.id === id && !l.sub; })[0];
    if (line) line.qty = clamp(line.qty + qty, 1, 12); else cart.push({ id: id, qty: qty });
    saveCart();
    if (anim && cartCount) { cartCount.classList.remove('pop'); void cartCount.offsetWidth; cartCount.classList.add('pop'); }
  }
  if (cartEl) {
    renderCart();
    cartBtn.addEventListener('click', function () { openCart(!cartOpen); });
    $('.x', cartEl).addEventListener('click', function () { openCart(false); });
    veil.addEventListener('click', function () { openCart(false); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && cartOpen) openCart(false); });
    $('#c-order', cartEl).addEventListener('click', function () {
      if (!cart.length) return;
      var lines = ['Order — FIRST CRACK', '', 'Roast day: ' + fmt(roastDate), ''];
      cart.forEach(function (l) { var L = lineLabel(l); lines.push((l.sub ? '' : l.qty + ' × ') + L.name + ' — ' + L.sub + ' — ' + money(L.price * l.qty)); });
      lines.push('', 'Subtotal: ' + $('#c-sub', cartEl).textContent, 'Delivery: ' + $('#c-ship', cartEl).textContent, 'Total: ' + $('#c-total', cartEl).textContent, '', 'Name:', 'Address:', 'Phone:');
      var mailto = 'mailto:orders@firstcrack.sg?subject=' + encodeURIComponent('Order for ' + fmt(roastDate) + '’s roast') + '&body=' + encodeURIComponent(lines.join('\n'));
      var ev = new CustomEvent('firstcrack:order', { cancelable: true, detail: { mailto: mailto, cart: cart.slice() } });
      var go = cartEl.dispatchEvent(ev);
      $('#c-sent', cartEl).hidden = false;
      if (go) window.location.href = mailto;
    });
  }

  /* ------------------------------------------------------------------ */
  /* Bags: rendered from data, labelled with the real roast date.        */
  /* ------------------------------------------------------------------ */
  function labelHTML(b) {
    var dots = ['light', 'medium', 'dark'].map(function (k) { return '<i class="' + (k === b.roast ? 'on' : '') + '"></i>'; }).join('');
    return '<div class="label" aria-hidden="true"><i><span>First Crack</span><span>' + D.grams + ' g</span></i><b>' + esc(b.origin) + '<small>' + esc(b.region) + ' · ' + esc(b.process) + '</small></b><u><span>Roasted ' + fmtShort(roastDate) + '</span><span class="dots">' + dots + '</span></u></div>';
  }
  function bagFigure(b, sizes) {
    return '<figure class="bag bag--' + b.bag + '"><img src="img/bag-' + b.bag + '-700.webp" srcset="img/bag-' + b.bag + '-700.webp 700w, img/bag-' + b.bag + '.webp 1400w" sizes="' + sizes + '" alt="A ' + D.grams + ' gram bag of ' + esc(b.origin) + ' ' + esc(b.region) + '" loading="lazy" decoding="async">' + labelHTML(b) + '</figure>';
  }
  var grid = $('#grid');
  if (grid) {
    var hint = $('#bags-hint');
    D.bags.forEach(function (b, i) {
      var card = el('article', 'card glass rv' + (i % 3 ? ' d' + (i % 3) : ''));
      card.setAttribute('data-meter', ''); card.setAttribute('data-id', b.id); card.setAttribute('data-roast', b.roast);
      card.innerHTML = bagFigure(b, '(max-width: 860px) 46vw, 18vw') +
        '<div class="card-body"><p class="origin"><b>' + esc(b.origin) + '</b><span>' + esc(b.region) + ' · ' + esc(b.process) + ' · ' + esc(b.variety) + '</span></p>' +
        '<p class="notes">' + esc(b.notes.join(', ')) + '</p>' +
        '<p class="meta mono"><span>' + esc(b.altitude) + '</span><span class="lvl">' + D.levels[b.roast].name + ' roast</span></p>' +
        '<div class="buy"><span class="price"><b>' + money(b.price) + '</b><small>' + D.grams + ' g · ' + esc(b.best) + '</small></span><div class="qty"><button type="button" data-d="-1" aria-label="One fewer">−</button><output>1</output><button type="button" data-d="1" aria-label="One more">+</button></div><button type="button" class="btn btn--primary add" data-add="' + b.id + '"><span>Add</span></button></div></div>';
      var out = $('output', card), q = 1;
      $$('[data-d]', card).forEach(function (btn) { btn.addEventListener('click', function () { q = clamp(q + (+btn.getAttribute('data-d')), 1, 12); out.value = q; }); });
      var add = $('.add', card), addT = 0;
      add.addEventListener('click', function () {
        addToCart(b.id, q);
        add.classList.add('is-added'); add.firstChild.textContent = 'Added';
        clearTimeout(addT); addT = setTimeout(function () { add.classList.remove('is-added'); add.firstChild.textContent = 'Add'; }, 1400);
      });
      grid.appendChild(card);
      if (rio) rio.observe(card);
    });
    function markRec(l) {
      var n = 0;
      $$('.card', grid).forEach(function (c) { var rec = c.getAttribute('data-roast') === l; c.classList.toggle('is-rec', rec); $('.lvl', c).classList.toggle('rec', rec); if (rec) n++; });
      if (hint) hint.innerHTML = 'Your roast level is <b>' + D.levels[l].name.toLowerCase() + '</b> · ' + n + ' of ' + D.bags.length + ' bags are roasted there';
    }
    markRec(level); levelListeners.push(markRec);
    meterSoon();
  }
  /* hero bag label + pill */
  $$('[data-hero-bag]').forEach(function (n) { var b = bagById(n.getAttribute('data-hero-bag')); if (b) { $('[data-hero-origin]', n.parentElement || doc).textContent = b.origin + ' · ' + b.region; $('[data-hero-price]', n.parentElement || doc).textContent = money(b.price); } });
  $$('[data-add]').forEach(function (btn) {
    if (btn.closest('#grid')) return;
    btn.addEventListener('click', function () {
      addToCart(btn.getAttribute('data-add'), 1);
      var t = $('span', btn) || btn; var was = t.textContent; btn.classList.add('is-added'); t.textContent = 'Added';
      setTimeout(function () { btn.classList.remove('is-added'); t.textContent = was; }, 1400);
    });
  });

  /* ------------------------------------------------------------------ */
  /* Freshness: the week strip and the countdown.                        */
  /* ------------------------------------------------------------------ */
  var strip = $('#strip');
  if (strip) {
    var monday = new Date(now); monday.setDate(now.getDate() - ((now.getDay() + 6) % 7)); monday.setHours(0, 0, 0, 0);
    var roastThisWeek = new Date(monday); roastThisWeek.setDate(monday.getDate() + ((D.roastDay - 1 + 7) % 7));
    for (var i = 0; i < 7; i++) {
      var d = new Date(monday); d.setDate(monday.getDate() + i);
      var li = el('li'); var ev = '', hot = false;
      if (d.getDay() === D.cutoff.day) ev = 'Order by ' + D.cutoff.hour + ':00';
      if (d.getDay() === D.roastDay) { ev = 'Roast day'; hot = true; }
      if (d.getDay() === D.shipDay) ev = 'Bagged, shipped';
      if (d.getDay() === (D.roastDay + 2) % 7) ev = 'At your door';
      li.innerHTML = '<span class="d">' + WD[d.getDay()] + '</span><span class="n">' + d.getDate() + '</span>' + (ev ? '<span class="e' + (hot ? ' hot' : '') + '">' + ev + '</span>' : '');
      if (d.toDateString() === now.toDateString()) { li.classList.add('today'); li.setAttribute('aria-current', 'date'); }
      strip.appendChild(li);
    }
    var cd = $('#cutdown');
    function tick() {
      var ms = cutoff - new Date();
      if (ms < 0) { cutoff = nextCutoff(new Date()); roastDate = roastAfter(cutoff); ms = cutoff - new Date(); }
      var h = Math.floor(ms / 3600000), m = Math.floor(ms % 3600000 / 60000);
      cd.textContent = h >= 24 ? Math.floor(h / 24) + 'd ' + (h % 24) + 'h ' + m + 'm' : h + 'h ' + String(m).padStart(2, '0') + 'm';
    }
    tick(); setInterval(tick, 30000);
  }

  /* ------------------------------------------------------------------ */
  /* Subscription configurator                                           */
  /* ------------------------------------------------------------------ */
  var sub = $('#sub');
  if (sub) {
    var s = { bags: 2, every: 2, pick: 'pick', bag: 'huila' };
    var bagSel = $('#s-bag', sub);
    D.bags.forEach(function (b) { var o = doc.createElement('option'); o.value = b.id; o.textContent = b.origin + ' ' + b.region + ' · ' + money(b.price); bagSel.appendChild(o); });
    bagSel.value = s.bag;
    function levelAvg(l) { var arr = D.bags.filter(function (b) { return b.roast === l; }); return Math.round(arr.reduce(function (a, b) { return a + b.price; }, 0) / arr.length); }
    function calc() {
      var unit = s.pick === 'pick' ? levelAvg(level) : bagById(s.bag).price;
      var full = unit * s.bags, disc = full * D.subDiscount, net = full - disc;
      return { unit: unit, full: full, disc: disc, net: net, perBag: net / s.bags, perMonth: net * (4 / s.every) };
    }
    function renderSub() {
      var c = calc();
      $('#s-unit', sub).textContent = money(c.unit) + ' × ' + s.bags;
      $('#s-full', sub).textContent = money(c.full);
      $('#s-disc', sub).textContent = '− ' + money(c.disc);
      $('#s-net', sub).textContent = money(c.net);
      $('#s-per', sub).textContent = money(c.perBag) + ' a bag · about ' + money(c.perMonth) + ' a month · delivery free';
      $('#s-pickrow', sub).hidden = s.pick !== 'pick';
      $('#s-bagrow', sub).hidden = s.pick !== 'bag';
      $('#s-level', sub).textContent = D.levels[level].name.toLowerCase();
      $$('.seg', sub).forEach(function (sg) { var k = sg.getAttribute('data-k'); var opts = $$('input', sg); opts.forEach(function (o, i) { if (String(s[k]) === o.value) sg.style.setProperty('--i', String(i)); }); });
    }
    $$('.seg input', sub).forEach(function (inp) { inp.addEventListener('change', function () { var k = inp.closest('.seg').getAttribute('data-k'); s[k] = isNaN(+inp.value) ? inp.value : +inp.value; renderSub(); }); });
    bagSel.addEventListener('change', function () { s.bag = bagSel.value; renderSub(); });
    levelListeners.push(renderSub);
    renderSub();
    var startT = 0;
    $('#s-start', sub).addEventListener('click', function () {
      var c = calc(), btn = $('#s-start', sub);
      cart = cart.filter(function (l) { return !l.sub; });
      cart.push({ sub: { bags: s.bags, every: s.every, pick: s.pick, bag: s.bag, level: level }, qty: 1, price: Math.round(c.net * 100) / 100 });
      saveCart();
      if (anim && cartCount) { cartCount.classList.remove('pop'); void cartCount.offsetWidth; cartCount.classList.add('pop'); }
      btn.classList.add('is-added'); $('span', btn).textContent = 'In your bag';
      clearTimeout(startT); startT = setTimeout(function () { btn.classList.remove('is-added'); $('span', btn).textContent = 'Start the subscription'; openCart(true); }, 900);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Notes and the roast log, from data.                                 */
  /* ------------------------------------------------------------------ */
  var notesEl = $('#notes-grid');
  if (notesEl) D.notes.forEach(function (n, i) {
    var a = el('article', 'note glass rv' + (i ? ' d' + i : '')); a.setAttribute('data-meter', '');
    a.innerHTML = '<blockquote>' + esc(n.q) + '</blockquote><cite><b>' + esc(n.who) + ', ' + esc(n.where) + '</b><span>' + esc(n.how) + '</span></cite>';
    notesEl.appendChild(a); if (rio) rio.observe(a);
  });
  var logEl = $('#log');
  if (logEl) D.log.forEach(function (r) {
    var li = el('li'); var d = new Date(r.date);
    li.innerHTML = '<b>' + esc(r.bag) + '</b><span class="mono">' + fmtShort(d) + ' · ' + esc(r.charge) + '</span><span class="mono fc">' + esc(r.fc) + '</span><span class="mono">' + esc(r.drop) + '</span>';
    logEl.appendChild(li);
  });
  var levelNames = $$('[data-level-name]'); levelListeners.push(function (l) { levelNames.forEach(function (n) { n.textContent = D.levels[l].name.toLowerCase(); }); });
  levelNames.forEach(function (n) { n.textContent = D.levels[level].name.toLowerCase(); });

  /* Origins page: level control there too */
  var lvl2 = $('#level-origins');
  if (lvl2) {
    var keys2 = Object.keys(D.levels);
    function syncLvl2(l) { lvl2.style.setProperty('--i', String(keys2.indexOf(l))); $$('input', lvl2).forEach(function (i) { i.checked = i.value === l; }); }
    syncLvl2(level); levelListeners.push(syncLvl2);
    $$('input', lvl2).forEach(function (i) { i.addEventListener('change', function () { if (i.checked) setLevel(i.value); }); });
    $$('[data-rec-for]').forEach(function (n) { function m(l) { n.hidden = n.getAttribute('data-rec-for') !== l; } m(level); levelListeners.push(m); });
  }

  meterSoon();
})();
