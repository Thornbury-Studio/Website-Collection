/* LATENT. — bay 3.
   One sheet of paper on an easel. The visitor sets a time and a grade,
   exposes (holding light back or letting it through with their hand),
   develops, fixes, and only then may turn the lights on.

   What the page keeps: a float map of lamp-seconds each point of the
   sheet has received (EXP_W × EXP_H), written on the CPU as the lamp
   burns and uploaded as an R16F texture. Everything the eye sees is one
   fragment shader over that map and the negative, following paper.js:
   density(logH) on the sheet's grade, scaled by how far development has
   got, lit by whatever light is in the room. */
(function () {
  'use strict';

  var P = window.LatentPaper;
  var root = document.querySelector('[data-bench]');
  if (!P || !root) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var q = function (s) { return root.querySelector(s); };
  var qa = function (s) { return Array.prototype.slice.call(root.querySelectorAll(s)); };

  var canvas = q('[data-canvas]');
  var easel = q('[data-easel]');
  var still = q('[data-still]');
  var statusEl = q('[data-status]');
  var ledEl = q('[data-led]');
  var ledGhost = q('[data-led-ghost]');
  var ledUnit = q('[data-led-unit]');
  var stopsText = q('[data-stops-text]');
  var gradeText = q('[data-grade-text]');
  var timeSr = q('[data-time-sr]');
  var stripLabels = q('[data-strip-labels]');
  var processEl = q('[data-process]');
  var lineWrap = q('[data-line-wrap]');
  var lineList = q('[data-line]');
  var roomText = document.querySelector('[data-roomlight-text]');
  var deckLed = q('[data-deck-led]'), deckUnit = q('[data-deck-unit]'), deckGo = q('[data-deck-go]');
  var deckAct = 'expose';
  var acts = {};
  qa('[data-act]').forEach(function (b) { acts[b.getAttribute('data-act')] = b; });

  // how much faster than a real room the bench runs (darkroom s per real s)
  var SPEED = { lamp: 2, dev: 6, fix: 6 };
  var FIX_TOTAL = 40;                        // 10 s stop + 30 s rapid fixer
  var FOG_E = 900;                           // lamp-seconds of white room light
  var EXP_W = 250, EXP_H = 200;              // 10×8 sheet, one cell per 1 mm
  var IMG = [0.05, 0.125, 0.95, 0.875];      // 9×6 in image in the easel blades
  var ASPECT = 1.25;

  var NEGS = P.NEGS;
  var state = {
    neg: 0, grade: '2', stops: 3,
    phase: 'blank',          // blank · exposing · exposed · developing · fixing · fixed
    sheetGrade: null, sheetNeg: null,
    lampLeft: 0, focus: true,       // the red filter starts under the lens: compose first
    tool: 'hand', ptr: { x: 0.5, y: 0.5, on: false },
    dev: 0, fix: 0, lights: false, fogged: false,
    strip: null, stripDone: null,
    lampSecs: 0, handSecs: 0
  };
  var exp = new Float32Array(EXP_W * EXP_H);
  var expDirty = true;

  /* ------------------------------------------------------------------ *
     text
   * ------------------------------------------------------------------ */

  function ledString(sec) {
    // DSEG: "!" is a blank digit, "." takes no width
    var s = sec >= 100 ? String(Math.round(sec)) : sec.toFixed(1);
    while (s.replace('.', '').length < 3) s = '!' + s;
    return s;
  }
  function stopsWords(stops) {
    var whole = Math.floor(stops + 1e-6), frac = Math.round((stops - whole) * 3);
    if (frac === 3) { whole += 1; frac = 0; }
    var f = frac === 1 ? '⅓' : frac === 2 ? '⅔' : '';
    return (whole ? whole : '') + f + (stops === 1 ? ' stop' : ' stops');
  }
  function mmss(sec) {
    var s = Math.floor(sec), m = Math.floor(s / 60);
    return m + ':' + ('0' + (s % 60)).slice(-2);
  }
  function negName(i) { return 'frame ' + NEGS[i].frame; }

  var lastSaid = '';
  function say(msg) {
    if (msg === lastSaid) return;
    lastSaid = msg;
    statusEl.textContent = msg;
  }

  function readout() {
    var ph = state.phase;
    if (ph === 'exposing') {
      ledGhost.textContent = '88.8';
      ledEl.textContent = ledString(Math.max(0, state.lampLeft));
      ledUnit.textContent = 'lamp';
    } else if (ph === 'developing' || ph === 'fixing') {
      var t = ph === 'developing' ? state.dev : state.fix;
      ledGhost.textContent = '8:88';
      ledEl.textContent = mmss(t);
      ledUnit.textContent = ph === 'developing' ? 'dev' : 'fix';
    } else {
      var sec = P.seconds(state.stops);
      ledGhost.textContent = '88.8';
      ledEl.textContent = ledString(sec);
      ledUnit.textContent = 'sec';
    }
    if (deckLed) { deckLed.textContent = ledEl.textContent; deckUnit.textContent = ledUnit.textContent; }
    stopsText.textContent = stopsWords(state.stops);
    gradeText.textContent = state.sheetGrade || state.grade;
  }
  function announceTime() {
    timeSr.textContent = 'Timer ' + P.fmtSec(P.seconds(state.stops)) + ' seconds, grade ' + state.grade + '.';
  }

  function sheetHasLight() { return state.lampSecs > 0 || state.fogged; }

  function sync() {
    var ph = state.phase, busy = ph === 'exposing' || ph === 'developing' || ph === 'fixing';
    var onEasel = ph === 'blank' || ph === 'exposing' || ph === 'exposed';
    var locked = sheetHasLight() || !onEasel;

    acts.expose.disabled = !(ph === 'blank' || ph === 'exposed' || ph === 'exposing') || (state.lights && ph !== 'exposing');
    acts.expose.textContent = ph === 'exposing' ? 'Stop lamp' : 'Expose';
    acts.expose.classList.toggle('is-on', ph === 'exposing');
    acts.focus.disabled = !onEasel || ph === 'exposing' || state.lights;
    acts.focus.setAttribute('aria-pressed', String(state.focus));
    acts.strip.disabled = ph !== 'blank' || state.lights || sheetHasLight();
    acts.develop.disabled = !(ph === 'exposed' || (ph === 'blank' && state.fogged));
    acts.fix.disabled = ph !== 'developing';
    acts.lights.setAttribute('aria-pressed', String(state.lights));
    acts.lights.textContent = state.lights ? 'Safelight only' : 'Lights on';
    acts.hang.disabled = ph !== 'fixed' || !state.lampSecs;

    // the one thing to do next carries the weight; everything else stays quiet
    var next = ph === 'blank' ? (state.fogged ? 'develop' : 'expose') : ph === 'exposed' ? 'develop' : ph === 'developing' ? 'fix'
      : ph === 'fixed' ? (state.lights ? (state.lampSecs && !state.fogged ? 'hang' : 'sheet') : 'lights') : null;
    if (state.lights && ph !== 'fixed') next = 'lights';
    Object.keys(acts).forEach(function (k) { acts[k].classList.toggle('is-next', k === next && !acts[k].disabled); });

    // phones: the pinned deck under the easel carries just that one action
    deckAct = ph === 'exposing' ? 'expose' : next;
    if (deckGo) {
      deckGo.textContent = deckAct ? acts[deckAct].textContent : 'Wait';
      deckGo.disabled = !deckAct || acts[deckAct].disabled;
      deckGo.classList.toggle('is-on', ph === 'exposing');
    }
    acts.sheet.disabled = ph === 'exposing';
    acts.house.disabled = locked;

    qa('[data-step]').forEach(function (b) { b.disabled = busy; });
    qa('[data-grade]').forEach(function (b) {
      var id = b.getAttribute('data-grade');
      b.setAttribute('aria-pressed', String(id === (state.sheetGrade || state.grade)));
      b.disabled = locked;
    });
    qa('[data-neg]').forEach(function (b) {
      var i = +b.getAttribute('data-neg');
      b.setAttribute('aria-pressed', String(i === state.neg));
      b.disabled = locked;
    });
    qa('[data-tool]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-tool') === state.tool));
    });

    var at = ph === 'blank' || ph === 'exposing' ? 0 : ph === 'exposed' ? 0.5 : ph === 'developing' ? 1 : ph === 'fixing' ? 2 : 3;
    qa('[data-p]').forEach(function (li, i) {
      li.classList.toggle('is-now', Math.floor(at) === i && !(ph === 'exposed' && i === 0));
      li.classList.toggle('is-done', i < at || (ph === 'exposed' && i === 0) || (ph === 'fixed' && state.lights && i === 3));
    });
    if (ph === 'exposed') processEl.querySelector('[data-p="develop"]').classList.add('is-now');

    easel.classList.toggle('is-tray', ph === 'developing' || ph === 'fixing' || ph === 'fixed');
    easel.classList.toggle('is-live-hand', state.tool !== 'hand' && (ph === 'exposing' || state.focus));
    root.classList.toggle('is-lit', state.lights);
    root.classList.toggle('is-lamp', ph === 'exposing');
    document.body.classList.toggle('lights-on', state.lights);
    if (roomText) roomText.textContent = state.lights ? 'Lights on' : 'Safelight';

    // test-strip labels, readable once the image is up
    var showStrip = state.stripDone && (ph === 'fixing' || ph === 'fixed' || (ph === 'developing' && state.dev > 14));
    stripLabels.hidden = !showStrip;

    readout();
    describeCanvas();
    kick();
  }

  function describeCanvas() {
    var n = NEGS[state.sheetNeg != null ? state.sheetNeg : state.neg];
    var ph = state.phase, d;
    if (state.fogged && ph !== 'fixed') d = 'A fogged sheet: it will develop black.';
    else if (ph === 'blank') d = 'A blank 10 by 8 inch sheet on the easel' + (state.focus ? ', with ' + n.title.toLowerCase() + ' projected through the red filter.' : '.');
    else if (ph === 'exposing') d = 'The enlarger lamp is on, projecting the negative of ' + n.title.toLowerCase() + ' onto the sheet.';
    else if (ph === 'exposed') d = 'An exposed sheet that still looks blank: the image is latent.';
    else if (ph === 'developing') d = state.dev < 8 ? 'The sheet in the developer, still blank.' : 'A print of ' + n.title.toLowerCase() + ' coming up in the developer.';
    else d = 'A black-and-white print of ' + n.title.toLowerCase() + ', grade ' + state.sheetGrade + ', ' + P.fmtSec(state.lampSecs) + ' lamp-seconds.';
    canvas.setAttribute('aria-label', d);
  }

  /* ------------------------------------------------------------------ *
     exposure
   * ------------------------------------------------------------------ */

  function toolBlock(u, v) {
    if (state.tool === 'hand') return 0;
    var p = state.ptr;
    if (state.tool === 'burn' && !p.on) return 1;           // the card covers it all
    if (!p.on) return 0;
    var dx = (u - p.x) * ASPECT, dy = v - p.y, d = Math.sqrt(dx * dx + dy * dy);
    if (state.tool === 'dodge') return 1 - smooth(0.075, 0.15, d);
    return smooth(0.06, 0.12, d);                            // burn: light only through the hole
  }
  function smooth(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }

  function stripEdge() {
    if (!state.strip) return -1;
    return IMG[0] + (IMG[2] - IMG[0]) * state.strip.idx / 5;
  }

  function burn(dtD) {
    var g = P.grade(state.sheetGrade), rate = dtD / g.factor, edge = stripEdge();
    var usedHand = false;
    for (var j = 0; j < EXP_H; j++) {
      var v = (j + 0.5) / EXP_H;
      if (v < IMG[1] || v > IMG[3]) continue;
      for (var i = 0; i < EXP_W; i++) {
        var u = (i + 0.5) / EXP_W;
        if (u < IMG[0] || u > IMG[2]) continue;
        if (edge >= 0 && u < edge) continue;
        var cu = (u - 0.5) / 0.45, cv = (v - 0.5) / 0.375;
        var fall = 1 - 0.08 * Math.min(1, (cu * cu + cv * cv) / 2);   // lamp fall-off toward the corners
        var b = toolBlock(u, v);
        if (b > 0.02) usedHand = true;
        exp[j * EXP_W + i] += rate * fall * (1 - b);
      }
    }
    if (usedHand) state.handSecs += dtD;
    state.lampSecs += dtD;
    expDirty = true;
  }

  function startLamp(seconds) {
    state.phase = 'exposing';
    state.lampLeft = seconds;
    state.focus = false;
    if (!state.sheetGrade) { state.sheetGrade = state.grade; state.sheetNeg = state.neg; }
  }

  function lampDone() {
    if (state.strip) {
      var s = state.strip;
      s.idx += 1;
      if (s.idx < 5) {
        state.lampLeft = P.seconds(s.stops[s.idx]) - P.seconds(s.stops[s.idx - 1]);
        say('Card moved one band over. Band ' + (s.idx + 1) + ' of 5: ' + P.fmtSec(P.seconds(s.stops[s.idx])) + ' s in total.');
        return;
      }
      state.stripDone = s.stops.slice();
      state.strip = null;
      buildStripLabels();
      state.phase = 'exposed';
      say('Test strip exposed: five bands from ' + P.fmtSec(P.seconds(state.stripDone[0])) + ' to ' + P.fmtSec(P.seconds(state.stripDone[4])) + ' s. Develop it and pick the band that looks right.');
      return;
    }
    state.phase = 'exposed';
    say('Lamp off. ' + P.fmtSec(state.lampSecs) + ' lamp-seconds on the sheet, and it still looks blank. Develop it, or expose more to burn in.');
  }

  function buildStripLabels() {
    stripLabels.textContent = '';
    state.stripDone.forEach(function (st, k) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = P.fmtSec(P.seconds(st)) + 's';
      b.style.left = ((IMG[0] + (IMG[2] - IMG[0]) * (k + 0.5) / 5) * 100) + '%';
      b.setAttribute('aria-label', 'Set the timer to ' + P.fmtSec(P.seconds(st)) + ' seconds');
      b.addEventListener('click', function () {
        state.stops = P.snap(st);
        announceTime();
        say('Timer set to ' + P.fmtSec(P.seconds(state.stops)) + ' s from the strip. Take a new sheet and make the print.');
        sync();
        emit();
      });
      stripLabels.appendChild(b);
    });
  }

  function newSheet(msg) {
    exp.fill(0); expDirty = true;
    state.phase = 'blank'; state.sheetGrade = null; state.sheetNeg = null;
    state.dev = 0; state.fix = 0; state.fogged = false; state.strip = null; state.stripDone = null;
    state.lampSecs = 0; state.handSecs = 0; state.lampLeft = 0;
    stripLabels.textContent = '';
    if (state.lights) fogNow();
    say(msg || 'Fresh sheet on the easel. ' + cap(negName(state.neg)) + ' in the carrier.');
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function fogNow() {
    if (state.phase === 'fixed' || state.fogged) return;
    state.fogged = true;
    if (state.phase === 'developing') say('White light on a sheet in the developer. Watch it go.');
    else say('White light on open paper. It still looks fine, but it’ll develop black. That sheet’s gone.');
  }

  /* ------------------------------------------------------------------ *
     controls
   * ------------------------------------------------------------------ */

  qa('[data-step]').forEach(function (b) {
    b.addEventListener('click', function () {
      state.stops = P.snap(state.stops + parseFloat(b.getAttribute('data-step')));
      announceTime(); sync(); emit();
    });
  });
  qa('[data-grade]').forEach(function (b) {
    b.addEventListener('click', function () {
      state.grade = b.getAttribute('data-grade');
      var g = P.grade(state.grade);
      announceTime();
      say('Grade ' + state.grade + ' in the drawer.' + (g.factor > 1 ? ' Double the time for this one.' : ''));
      sync(); emit();
    });
  });
  qa('[data-neg]').forEach(function (b) {
    b.addEventListener('click', function () { loadNeg(+b.getAttribute('data-neg')); });
  });
  function loadNeg(i) {
    if (sheetHasLight() || !(state.phase === 'blank')) newSheet();
    state.neg = i;
    say(cap(negName(i)) + ' in the carrier. ' + NEGS[i].note);
    uploadNeg();
    still.src = 'img/neg-' + NEGS[i].id + '-900.webp';
    still.alt = 'The house print of frame ' + NEGS[i].frame + ': ' + NEGS[i].title.toLowerCase() + '.';
    sync(); emit();
  }
  qa('[data-tool]').forEach(function (b) {
    b.addEventListener('click', function () {
      state.tool = b.getAttribute('data-tool');
      if (state.tool === 'dodge') say('Dodging: your hand holds light back wherever it is over the sheet. Keep it moving or the edge shows.');
      else if (state.tool === 'burn') say('Burning: a card with a hole. Light only gets through where the hole is.');
      else say('Hands out of the light.');
      sync();
    });
  });

  acts.expose.addEventListener('click', function () {
    if (state.phase === 'exposing') {
      state.strip = null;
      state.phase = 'exposed';
      say('Lamp stopped early. ' + P.fmtSec(state.lampSecs) + ' lamp-seconds on the sheet.');
      sync(); return;
    }
    if (!(state.phase === 'blank' || state.phase === 'exposed')) return;
    var first = !state.sheetGrade;
    startLamp(P.seconds(state.stops));
    var g = P.grade(state.sheetGrade);
    say((first ? 'Lamp on, ' : 'Lamp on again, burning in: ') + P.fmtSec(P.seconds(state.stops)) + ' s through the grade ' + state.sheetGrade + ' filter.' + (g.factor > 1 ? ' Half the light gets through this one.' : ''));
    sync();
  });
  acts.focus.addEventListener('click', function () {
    state.focus = !state.focus;
    say(state.focus ? 'Red filter under the lens: you can see the negative on the easel and the paper can’t.' : 'Red filter away.');
    sync();
  });
  acts.strip.addEventListener('click', function () {
    var stops = P.stripStops(state.stops).map(function (s) { return Math.max(0, s); });
    state.strip = { stops: stops, idx: 0 };
    startLamp(P.seconds(stops[0]));
    say('Test strip. Band 1 of 5: ' + P.fmtSec(P.seconds(stops[0])) + ' s across the whole sheet, then the card moves over one band at a time.');
    sync();
  });
  acts.develop.addEventListener('click', function () {
    state.phase = 'developing'; state.dev = 0; state.focus = false;
    say('In the developer. Rock the tray. Nothing for about ' + Math.round(P.DEV.full * P.DEV.induction) + ' seconds, then the shadows come first.');
    sync();
  });
  acts.fix.addEventListener('click', function () {
    var early = state.dev < P.DEV.full * 0.8, late = state.dev > P.DEV.full * 1.5;
    state.phase = 'fixing'; state.fix = 0;
    say('Stop bath, then fixer, after ' + Math.round(state.dev) + ' s in the developer.' + (early ? ' That’s early: the blacks won’t be all the way down.' : late ? ' That’s long: the whites will have started to fog.' : ''));
    sync();
  });
  acts.lights.addEventListener('click', function () {
    state.lights = !state.lights;
    if (state.lights) {
      state.focus = false;
      if (state.phase !== 'fixed') fogNow();
      else say('Lights on. That’s your print: grade ' + state.sheetGrade + ', ' + P.fmtSec(state.lampSecs) + ' lamp-seconds' + (state.handSecs > 0.2 ? ', with your hand in the light for ' + P.fmtSec(state.handSecs) + ' of them.' : '.'));
    } else {
      say('Safelight only.');
    }
    sync();
  });
  acts.sheet.addEventListener('click', function () { newSheet(); sync(); });
  acts.house.addEventListener('click', function () {
    var n = NEGS[state.neg];
    state.grade = n.grade; state.stops = n.stops;
    announceTime();
    say('House settings for ' + negName(state.neg) + ': grade ' + n.grade + ', ' + P.fmtSec(P.seconds(n.stops)) + ' s. ' + n.note);
    sync(); emit();
  });
  acts.hang.addEventListener('click', hang);
  if (deckGo) deckGo.addEventListener('click', function () { if (deckAct && !acts[deckAct].disabled) acts[deckAct].click(); });

  function hang() {
    if (!gl || !ready) return;
    render(performance.now() / 1000);
    var url;
    try { url = canvas.toDataURL('image/jpeg', 0.82); } catch (e) { return; }
    var li = document.createElement('li');
    var img = new Image();
    img.src = url;
    img.alt = 'Your print of frame ' + NEGS[state.sheetNeg].frame + ' at grade ' + state.sheetGrade + '.';
    var p = document.createElement('p');
    p.textContent = 'Frame ' + NEGS[state.sheetNeg].frame + ' · grade ' + state.sheetGrade + ' · ' + P.fmtSec(state.lampSecs) + ' s' + (state.handSecs > 0.2 ? ' · hand ' + P.fmtSec(state.handSecs) + ' s' : '') + (state.stripDone ? ' · test strip' : '');
    li.appendChild(img); li.appendChild(p);
    lineList.insertBefore(li, lineList.firstChild);
    while (lineList.children.length > 6) lineList.removeChild(lineList.lastChild);
    lineWrap.hidden = false;
    newSheet('Hung on the line. Fresh sheet on the easel.');
    sync();
  }

  // the hand: pointer over the easel, or arrow keys when the easel has focus
  function ptrFrom(e) {
    var r = canvas.getBoundingClientRect();
    state.ptr.x = (e.clientX - r.left) / r.width;
    state.ptr.y = (e.clientY - r.top) / r.height;
    state.ptr.on = state.ptr.x >= 0 && state.ptr.x <= 1 && state.ptr.y >= 0 && state.ptr.y <= 1;
    kick();
  }
  easel.addEventListener('pointermove', ptrFrom);
  easel.addEventListener('pointerdown', function (e) {
    ptrFrom(e);
    if (e.pointerType !== 'mouse' && state.tool !== 'hand' && state.phase === 'exposing') {
      try { easel.setPointerCapture(e.pointerId); } catch (err) { /* no-op */ }
    }
  });
  easel.addEventListener('pointerleave', function () { state.ptr.on = false; kick(); });
  easel.addEventListener('pointerup', function (e) { if (e.pointerType !== 'mouse') { state.ptr.on = false; kick(); } });
  easel.addEventListener('pointercancel', function () { state.ptr.on = false; kick(); });
  easel.addEventListener('focus', function () { if (state.tool !== 'hand') { state.ptr.on = true; kick(); } });
  easel.addEventListener('blur', function () { state.ptr.on = false; kick(); });
  easel.addEventListener('keydown', function (e) {
    var d = e.shiftKey ? 0.08 : 0.03, k = e.key;
    if (k !== 'ArrowLeft' && k !== 'ArrowRight' && k !== 'ArrowUp' && k !== 'ArrowDown') return;
    if (state.tool === 'hand') return;
    e.preventDefault();
    state.ptr.on = true;
    if (k === 'ArrowLeft') state.ptr.x -= d;
    if (k === 'ArrowRight') state.ptr.x += d;
    if (k === 'ArrowUp') state.ptr.y -= d;
    if (k === 'ArrowDown') state.ptr.y += d;
    state.ptr.x = Math.min(1, Math.max(0, state.ptr.x));
    state.ptr.y = Math.min(1, Math.max(0, state.ptr.y));
    kick();
  });

  // contact-sheet frames load the carrier
  document.querySelectorAll('[data-load]').forEach(function (b) {
    b.addEventListener('click', function () {
      loadNeg(+b.getAttribute('data-load'));
      var target = document.getElementById('bench');
      if (window.lenis) window.lenis.scrollTo(target, { offset: -10 });
      else target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
      setTimeout(function () { try { easel.focus({ preventScroll: true }); } catch (e) { easel.focus(); } }, reduced ? 0 : 700);
    });
  });

  function emit() {
    document.dispatchEvent(new CustomEvent('latent:bench', {
      detail: { neg: state.sheetNeg != null ? state.sheetNeg : state.neg, grade: state.sheetGrade || state.grade, stops: state.stops }
    }));
  }

  /* ------------------------------------------------------------------ *
     WebGL2
   * ------------------------------------------------------------------ */

  var VERT = '#version 300 es\nlayout(location=0) in vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';

  var FRAG = [
    '#version 300 es',
    'precision highp float;',
    'uniform sampler2D uNeg, uExp;',
    'uniform vec2 uRes;',
    'uniform vec4 uImg;',
    'uniform float uKs, uKh, uLogTh;',   // sheet slope, house slope, log10(house s / factor)
    'uniform float uDev, uDFog, uFogE;',
    'uniform float uLamp, uFocus, uWet, uTime, uLampRate;',
    'uniform vec3 uLampCol, uRoom;',
    'uniform vec3 uPtr;',                // x, y, on
    'uniform float uTool, uEdge;',
    'out vec4 o;',
    'const float DMIN=' + P.DMIN.toFixed(3) + ', DMAX=' + P.DMAX.toFixed(3) + ';',
    'const float LN10=2.302585;',
    'float lin(float c){return c<=0.04045?c/12.92:pow((c+0.055)/1.055,2.4);}',
    'vec3 srgb(vec3 c){c=clamp(c,0.,1.);return mix(c*12.92,1.055*pow(c,vec3(1./2.4))-0.055,step(0.0031308,c));}',
    'float sm(float a,float b,float x){float t=clamp((x-a)/(b-a),0.,1.);return t*t*(3.-2.*t);}',
    'float hash(vec2 p){p=fract(p*vec2(443.897,441.423));p+=dot(p,p.yx+19.19);return fract((p.x+p.y)*p.x);}',
    // paper.js negOffset(), per pixel
    'float negOff(float L){',
    '  float target=DMIN-log(max(L,1e-4))/LN10;',
    '  float s=clamp((target-DMIN)/(DMAX-DMIN),0.004,0.996);',
    '  return log(s/(1.-s))/uKh-uLogTh;',
    '}',
    'float block(vec2 uv){',
    '  if(uEdge>=0. && uv.x<uEdge && uv.x>uImg.x-0.01) return 1.;',
    '  if(uTool<0.5) return 0.;',
    '  if(uTool>1.5 && uPtr.z<0.5) return 1.;',
    '  if(uPtr.z<0.5) return 0.;',
    '  float d=length((uv-uPtr.xy)*vec2(' + ASPECT.toFixed(3) + ',1.));',
    '  return uTool<1.5 ? 1.-sm(0.075,0.15,d) : sm(0.06,0.12,d);',
    '}',
    'void main(){',
    '  vec2 uv=vec2(gl_FragCoord.x/uRes.x,1.-gl_FragCoord.y/uRes.y);',
    '  bool inImg=uv.x>uImg.x&&uv.x<uImg.z&&uv.y>uImg.y&&uv.y<uImg.w;',
    '  vec2 iuv=(uv-uImg.xy)/(uImg.zw-uImg.xy);',
    '  float L=lin(texture(uNeg,iuv).r);',
    '  float off=inImg?negOff(L):0.;',
    '  float E=texture(uExp,uv).r+uFogE;',
    '  float D=DMIN;',
    '  if(E>1e-4){',
    '    float lh=log(E)/LN10+off;',
    '    float Df=DMIN+(DMAX-DMIN)/(1.+exp(-uKs*lh));',
    '    D=DMIN+(Df-DMIN)*uDev;',
    '  }',
    '  D+=uDFog;',
    '  float refl=pow(10.,-D);',
    '  vec3 paperCol=vec3(0.965,0.955,0.935)*refl/pow(10.,-DMIN);',
    // wet paper reads a touch deeper, and the tray rocks a sheen across it
    '  if(uWet>0.){',
    '    paperCol*=mix(1.,0.93,uWet);',
    '    float sh=sm(0.55,1.,sin((uv.x*1.3+uv.y*0.7)*4.2-uTime*1.1))*0.03*uWet;',
    '    paperCol+=sh;',
    '  }',
    '  vec3 col=paperCol*uRoom;',
    // the projected negative: light where the film is thin
    '  float offMax=log(0.996/0.004)/uKh-uLogTh;',
    '  float proj=inImg?pow(10.,(off-offMax)*0.55):0.;',
    '  float b=block(uv);',
    '  vec2 c=(uv-0.5)/vec2(0.45,0.375);',
    '  float fall=1.-0.08*min(1.,dot(c,c)*0.5);',
    '  vec3 lampLight=uLampCol*uLamp*uLampRate*1.35+vec3(1.0,0.10,0.04)*uFocus*1.6;',
    '  col+=paperCol*proj*fall*(1.-b)*lampLight;',
    // the hand, seen as a faint ring when it is live
    '  if(uTool>0.5&&uPtr.z>0.5&&(uLamp>0.5||uFocus>0.5)){',
    '    float d=length((uv-uPtr.xy)*vec2(' + ASPECT.toFixed(3) + ',1.));',
    '    float r=uTool<1.5?0.11:0.09;',
    '    col+=vec3(0.9,0.5,0.2)*(uLamp>0.5?0.05:0.12)*(1.-sm(0.,0.006,abs(d-r)));',
    '  }',
    '  col+=(hash(gl_FragCoord.xy+uTime)-0.5)*0.012;',
    '  o=vec4(srgb(col),1.);',
    '}'
  ].join('\n');

  var gl = null, prog = null, U = {}, texNeg = null, texExp = null, ready = false, negReady = false;

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      if (window.console) console.warn('[latent] shader:', gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  function initGL() {
    try { gl = canvas.getContext('webgl2', { alpha: false, antialias: false, preserveDrawingBuffer: false }); } catch (e) { gl = null; }
    if (!gl) return false;
    var vs = compile(gl.VERTEX_SHADER, VERT), fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return false;
    prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    ['uNeg', 'uExp', 'uRes', 'uImg', 'uKs', 'uKh', 'uLogTh', 'uDev', 'uDFog', 'uFogE', 'uLamp', 'uFocus',
      'uWet', 'uTime', 'uLampRate', 'uLampCol', 'uRoom', 'uPtr', 'uTool', 'uEdge']
      .forEach(function (k) { U[k] = gl.getUniformLocation(prog, k); });
    gl.uniform1i(U.uNeg, 0);
    gl.uniform1i(U.uExp, 1);
    gl.uniform4f(U.uImg, IMG[0], IMG[1], IMG[2], IMG[3]);

    texNeg = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texNeg);
    params();
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, 1, 1, 0, gl.RED, gl.UNSIGNED_BYTE, new Uint8Array([128]));

    texExp = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texExp);
    params();
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, EXP_W, EXP_H, 0, gl.RED, gl.FLOAT, exp);
    expDirty = false;

    ready = true;
    negReady = false;
    uploadNeg();
    return true;
  }
  function params() {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  }

  var negToken = 0;
  function uploadNeg() {
    if (!gl || !ready) return;
    var n = NEGS[state.neg], token = ++negToken;
    var big = window.innerWidth * Math.min(window.devicePixelRatio || 1, 1.5) > 1100;
    var img = new Image();
    img.decoding = 'async';
    img.onload = function () {
      if (token !== negToken || !gl) return;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texNeg);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      try {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, gl.RED, gl.UNSIGNED_BYTE, img);
      } catch (e) {
        root.classList.add('no-gl');
        return;
      }
      negReady = true;
      root.classList.add('is-live');
      kick();
    };
    img.src = 'img/neg-' + n.id + (big ? '' : '-900') + '.webp';
  }

  var dpr = 1;
  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var w = Math.max(2, Math.round(canvas.clientWidth * dpr)), h = Math.max(2, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  }

  function roomLight() {
    if (state.lights) return [0.97, 0.95, 0.91];
    if (state.phase === 'exposing') return [0.20, 0.09, 0.03];
    if (state.focus) return [0.30, 0.15, 0.05];   // the red filter is dim: you lean in
    return [0.78, 0.40, 0.13];               // amber safelight
  }

  function render(clock) {
    if (!ready || !negReady) return;
    size();
    gl.viewport(0, 0, canvas.width, canvas.height);
    if (expDirty) {
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, texExp);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, EXP_W, EXP_H, gl.RED, gl.FLOAT, exp);
      expDirty = false;
    }
    var shown = state.sheetNeg != null ? state.sheetNeg : state.neg;
    var n = NEGS[shown], hg = P.grade(n.grade);
    var sg = P.grade(state.sheetGrade || state.grade);
    var lampG = P.grade(state.sheetGrade || state.grade);
    var ph = state.phase;
    var devF = ph === 'developing' || ph === 'fixing' || ph === 'fixed' ? P.devFactor(state.dev) : 0;
    // fogged paper in the developer goes all the way; a white light on a
    // sheet still on the easel shows nothing until it is developed
    gl.uniform2f(U.uRes, canvas.width, canvas.height);
    gl.uniform1f(U.uKs, P.slope(sg));
    gl.uniform1f(U.uKh, P.slope(hg));
    gl.uniform1f(U.uLogTh, Math.log(P.seconds(n.stops) / hg.factor) / Math.LN10);
    gl.uniform1f(U.uDev, devF);
    gl.uniform1f(U.uDFog, ph === 'developing' || ph === 'fixing' || ph === 'fixed' ? P.devFog(state.dev) : 0);
    gl.uniform1f(U.uFogE, state.fogged ? FOG_E : 0);
    gl.uniform1f(U.uLamp, ph === 'exposing' ? 1 : 0);
    gl.uniform1f(U.uLampRate, 1 / lampG.factor);
    gl.uniform3f(U.uLampCol, lampG.lamp[0], lampG.lamp[1], lampG.lamp[2]);
    gl.uniform1f(U.uFocus, state.focus ? 1 : 0);
    gl.uniform1f(U.uWet, ph === 'developing' || ph === 'fixing' ? 1 : ph === 'fixed' ? 0.4 : 0);
    gl.uniform1f(U.uTime, reduced ? 0 : clock);
    var room = roomLight();
    gl.uniform3f(U.uRoom, room[0], room[1], room[2]);
    gl.uniform3f(U.uPtr, state.ptr.x, state.ptr.y, state.ptr.on ? 1 : 0);
    gl.uniform1f(U.uTool, state.tool === 'dodge' ? 1 : state.tool === 'burn' ? 2 : 0);
    gl.uniform1f(U.uEdge, stripEdge());
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /* ------------------------------------------------------------------ *
     the clock
   * ------------------------------------------------------------------ */

  var visible = true, raf = 0, last = 0, t0 = performance.now();
  var lastSecond = -1;

  function animating() {
    var ph = state.phase;
    return ph === 'exposing' || ph === 'developing' || ph === 'fixing';
  }

  function tick(dtReal) {
    var ph = state.phase;
    if (ph === 'exposing') {
      var dtD = Math.min(dtReal * SPEED.lamp, state.lampLeft);
      burn(dtD);
      state.lampLeft -= dtD;
      if (state.lampLeft <= 1e-4) { lampDone(); sync(); }
      readout();
    } else if (ph === 'developing') {
      state.dev = Math.min(P.DEV.full * 3, state.dev + dtReal * SPEED.dev);
      var s = Math.floor(state.dev);
      if (s !== lastSecond) {
        lastSecond = s;
        if (s === Math.round(P.DEV.full * P.DEV.induction) + 2) say('There: shadows first.');
        if (s === P.DEV.full) say('Sixty seconds. It won’t get any blacker. Stop and fix it.');
        if (s === P.DEV.full * 2) say('Two minutes. The whites are starting to fog.');
        if (s === 15 && state.stripDone) stripLabels.hidden = false;
      }
      readout();
    } else if (ph === 'fixing') {
      state.fix = Math.min(FIX_TOTAL, state.fix + dtReal * SPEED.fix);
      if (state.fix >= FIX_TOTAL) {
        state.phase = 'fixed';
        say(state.fogged ? 'Fixed. It’s black: the light got to it first. New sheet.' : 'Fixed. It’s safe now. Turn the lights on and have a look.');
        sync();
      }
      readout();
    }
  }

  function frame(now) {
    raf = 0;
    // true elapsed time: the lamp and the trays are clocks, and a throttled
    // tab must not stretch a 12-second exposure into a minute (PATTERNS.md)
    var dt = last ? Math.min(60, (now - last) / 1000) : 0;
    last = now;
    tick(dt);
    if (visible) render((now - t0) / 1000);
    if (animating() || (state.focus && state.tool !== 'hand')) raf = requestAnimationFrame(frame);
    else last = 0;
  }
  function kick() {
    if (!raf) raf = requestAnimationFrame(frame);
  }

  /* ------------------------------------------------------------------ *
     wiring
   * ------------------------------------------------------------------ */

  var live = initGL();
  if (!live) {
    root.classList.add('no-gl');
    ['expose', 'focus', 'strip', 'develop', 'fix', 'hang'].forEach(function (k) { acts[k].disabled = true; });
    say('This bench needs WebGL2, which this browser has turned off. That’s the house print of frame 14 on the easel.');
  }

  canvas.addEventListener('webglcontextlost', function (e) {
    e.preventDefault();
    ready = false; negReady = false;
    root.classList.remove('is-live');
  });
  canvas.addEventListener('webglcontextrestored', function () {
    expDirty = true;
    if (initGL()) { root.classList.remove('no-gl'); kick(); }
  });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) kick();
    }, { rootMargin: '10% 0px' }).observe(easel);
  }
  window.addEventListener('resize', kick);

  announceTime();
  if (live) sync();
  emit();

  window.__latent = { state: state, exp: exp, P: P };
})();
