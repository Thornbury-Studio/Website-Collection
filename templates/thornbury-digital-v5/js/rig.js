/* Thornbury Digital v5 — js/rig.js
   The console under "What sits behind the site".

   THE SHAPE OF IT. Eight platforms as marks alone, four down each side, with one
   readout between them. Hover lights a mark; choosing one writes that platform
   into the readout. Nothing but the logo is printed until you ask for it, which
   is the point — eight paragraphs stacked in a list is a wall, and nobody reads
   a wall to find out what Upstash is for.

   WHAT IT UPGRADES FROM. The markup ships as a plain <dl>: eight names, eight
   one-line descriptions, readable and complete with no JavaScript at all. This
   file hides that list and reveals the console, so the page loses nothing when
   the file never arrives — which is charter article 03, not a nicety.

   THE TWO EFFECTS, AND WHY THESE TWO. The name arrives as particles, sampled
   from the word itself the way the Team band above samples a photograph — same
   technique, one dimension simpler, on a 2D canvas so it costs no WebGL context.
   The description decodes: each character cycles before it settles, left to
   right. One says "this is being assembled", the other says "this is being
   read out". Both stop dead under reduced motion or with effects switched off,
   and the text is simply there instead. */

var GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/\\<>[]{}#*+-=';

/* Sample the word, not an image: draw the name into an offscreen canvas and keep
   one point per lit pixel on a stride. The same lookup-table idea as the Team
   band, and for the same reason — the text is never itself drawn to the screen. */
function sampleWord(word, boxW, boxH, dpr) {
  var cv = document.createElement('canvas');
  var size = Math.min(boxH * 0.72, boxW / (word.length * 0.62));
  size = Math.max(18, Math.min(size, 92));
  cv.width = Math.max(1, Math.round(boxW * dpr));
  cv.height = Math.max(1, Math.round(boxH * dpr));
  var c = cv.getContext('2d', { willReadFrequently: true });
  c.scale(dpr, dpr);
  c.fillStyle = '#fff';
  c.textBaseline = 'middle';
  c.textAlign = 'left';
  c.font = '800 ' + size + 'px "Archivo", system-ui, sans-serif';
  c.fillText(word, 0, boxH / 2);

  var w = cv.width, h = cv.height;
  var px = c.getImageData(0, 0, w, h).data;
  var step = dpr >= 1.5 ? 4 : 3;
  var pts = [];
  for (var y = 0; y < h; y += step) {
    for (var x = 0; x < w; x += step) {
      if (px[(y * w + x) * 4 + 3] > 128) pts.push(x / dpr, y / dpr);
    }
  }
  return pts;
}

export function decoder(el, text, reduced) {
  if (reduced) { el.textContent = text; return null; }
  var chars = text.split('');
  var frame = 0, raf = 0;
  /* every character gets its own settle time, so the line resolves left to
     right instead of snapping in one go */
  var start = chars.map(function (_, i) { return i * 1.35; });
  var end = start.map(function (s) { return s + 8 + Math.random() * 12; });

  function tick() {
    var out = '', done = 0;
    for (var i = 0; i < chars.length; i++) {
      if (chars[i] === ' ') { out += ' '; done++; continue; }
      if (frame >= end[i]) { out += chars[i]; done++; }
      else if (frame >= start[i]) out += GLYPHS[(Math.random() * GLYPHS.length) | 0];
      else out += '';
    }
    el.textContent = out;
    frame++;
    if (done < chars.length) raf = requestAnimationFrame(tick);
    else raf = 0;
  }
  raf = requestAnimationFrame(tick);
  return function () { if (raf) cancelAnimationFrame(raf); el.textContent = text; };
}

export function mount(root, opts) {
  opts = opts || {};
  var reduced = !!opts.reduced;
  var railA = root.querySelector('.rig-rail--a');
  var railB = root.querySelector('.rig-rail--b');
  var out = root.querySelector('.rig-out');
  var list = root.querySelector('[data-rig-list]');
  var canvas = root.querySelector('.rig-canvas');
  var nameEl = root.querySelector('[data-rig-name]');
  var lineEl = root.querySelector('[data-rig-line]');
  var whenEl = root.querySelector('[data-rig-when]');
  if (!railA || !out || !list) return null;

  var tiles = [].slice.call(railA.querySelectorAll('.rig-tile'));
  var rows = [].slice.call(list.querySelectorAll('[data-rig-row]'));
  if (!tiles.length || tiles.length !== rows.length) return null;

  var data = rows.map(function (r) {
    var dd = r.querySelector('dd');
    var when = dd.querySelector('.rig-when');
    return {
      name: r.querySelector('dt').textContent.trim(),
      line: dd.childNodes[0].textContent.trim(),
      when: when ? when.textContent.trim() : ''
    };
  });

  /* Four each side. The split happens here rather than in the markup so the
     no-JS list stays one ordered thing. */
  var half = Math.ceil(tiles.length / 2);
  tiles.slice(half).forEach(function (t) { railB.appendChild(t.parentNode); });

  list.hidden = true;
  railA.hidden = false;
  railB.hidden = false;
  out.hidden = false;

  var pts = [], parts = [], raf = 0, alive = true, visible = true;
  var dpr = Math.min(devicePixelRatio || 1, 2);
  var boxW = 0, boxH = 0, current = -1, undecode = null, undecode2 = null;

  function measure() {
    var r = canvas.getBoundingClientRect();
    boxW = Math.max(1, r.width); boxH = Math.max(1, r.height);
    canvas.width = Math.round(boxW * dpr);
    canvas.height = Math.round(boxH * dpr);
  }

  function assemble(word) {
    measure();
    pts = sampleWord(word, boxW, boxH, dpr);
    var n = pts.length / 2;
    parts = new Float32Array(n * 5);           // x, y, homeX, homeY, seed
    for (var i = 0; i < n; i++) {
      var hx = pts[i * 2], hy = pts[i * 2 + 1];
      var a = Math.random() * Math.PI * 2, d = 40 + Math.random() * 190;
      parts[i * 5]     = hx + Math.cos(a) * d;
      parts[i * 5 + 1] = hy + Math.sin(a) * d * 0.55;
      parts[i * 5 + 2] = hx;
      parts[i * 5 + 3] = hy;
      parts[i * 5 + 4] = Math.random();
    }
    if (!raf && visible) raf = requestAnimationFrame(draw);
  }

  function paintStatic(word) {
    measure();
    var c = canvas.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, boxW, boxH);
    var size = Math.max(18, Math.min(Math.min(boxH * 0.72, boxW / (word.length * 0.62)), 92));
    c.fillStyle = '#e1e1e1';
    c.textBaseline = 'middle';
    c.font = '800 ' + size + 'px "Archivo", system-ui, sans-serif';
    c.fillText(word, 0, boxH / 2);
  }

  function draw() {
    raf = 0;
    if (!alive) return;
    var c = canvas.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, boxW, boxH);
    var n = parts.length / 5, moving = 0;
    for (var i = 0; i < n; i++) {
      var o = i * 5;
      var ease = 0.055 + parts[o + 4] * 0.075;
      var dx = parts[o + 2] - parts[o];
      var dy = parts[o + 3] - parts[o + 1];
      parts[o] += dx * ease;
      parts[o + 1] += dy * ease;
      if (Math.abs(dx) + Math.abs(dy) > 0.4) moving++;
      /* the same 4% ember the field and the Team band carry */
      c.fillStyle = parts[o + 4] < 0.04 ? 'rgba(255,42,0,1)' : 'rgba(232,232,232,1)';
      c.fillRect(parts[o], parts[o + 1], 1.7, 1.7);
    }
    if (moving && visible) raf = requestAnimationFrame(draw);
  }

  function select(i, focusIt) {
    if (i === current) return;
    current = i;
    tiles.forEach(function (t, k) { t.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
    var d = data[i];
    nameEl.textContent = d.name;                  /* the accessible copy */
    if (undecode) { undecode(); undecode = null; }
    if (undecode2) { undecode2(); undecode2 = null; }
    undecode = decoder(lineEl, d.line, reduced);
    undecode2 = decoder(whenEl, d.when, reduced);
    if (reduced) paintStatic(d.name); else assemble(d.name);
    if (focusIt) tiles[i].focus();
  }

  function onClick(ev) {
    var t = ev.currentTarget;
    select(parseInt(t.getAttribute('data-rig'), 10), false);
  }
  function onEnter(ev) {
    /* pointer only: a hover preview on a touch screen fires on the tap that was
       already going to select, and would run the decode twice */
    if (ev.pointerType === 'touch') return;
    select(parseInt(ev.currentTarget.getAttribute('data-rig'), 10), false);
  }
  function onKey(ev) {
    var k = ev.key, n = tiles.length;
    if (k !== 'ArrowRight' && k !== 'ArrowDown' && k !== 'ArrowLeft' && k !== 'ArrowUp') return;
    ev.preventDefault();
    var step = (k === 'ArrowRight' || k === 'ArrowDown') ? 1 : -1;
    select((current + step + n) % n, true);
  }

  tiles.forEach(function (t) {
    t.addEventListener('click', onClick);
    t.addEventListener('pointerenter', onEnter);
    t.addEventListener('keydown', onKey);
  });

  var io = new IntersectionObserver(function (es) {
    visible = es[0].isIntersecting;
    if (visible && !raf && parts.length) raf = requestAnimationFrame(draw);
  }, { threshold: 0 });
  io.observe(out);

  function onResize() {
    if (current < 0) return;
    if (reduced) paintStatic(data[current].name); else assemble(data[current].name);
  }
  addEventListener('resize', onResize);

  /* first paint after layout, so the canvas has a real box to measure */
  requestAnimationFrame(function () { if (alive) select(0, false); });

  return {
    destroy: function () {
      alive = false;
      if (raf) cancelAnimationFrame(raf);
      if (undecode) undecode();
      if (undecode2) undecode2();
      try { io.disconnect(); } catch (e) { /* never observed */ }
      removeEventListener('resize', onResize);
      tiles.forEach(function (t) {
        t.removeEventListener('click', onClick);
        t.removeEventListener('pointerenter', onEnter);
        t.removeEventListener('keydown', onKey);
      });
      /* Put the markup back exactly as it shipped. The effects switch tears this
         module down and mounts it again through the same path, and a mount that
         found four tiles against eight rows would refuse to run and leave the
         section showing neither the console nor the list. */
      tiles.forEach(function (t) { railA.appendChild(t.parentNode); });
      railA.hidden = true;
      railB.hidden = true;
      out.hidden = true;
      list.hidden = false;
      lineEl.textContent = '';
      whenEl.textContent = '';
      nameEl.textContent = '';
      var c = canvas.getContext('2d');
      if (c) c.clearRect(0, 0, canvas.width, canvas.height);
    }
  };
}
