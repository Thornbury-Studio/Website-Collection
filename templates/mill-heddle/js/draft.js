/* HEDDLE — the drafting room.

   The same four grids a weaver draws on squared paper, as buttons, with the
   cloth painted underneath them by the engine every time one is pressed.
   Forty ends by forty picks: enough to hold the longest repeat in the range
   (Glen, thirty-four) with a margin, and small enough that every cell is a
   real button a finger can find.

   State is one draft object and one selected shade. Everything else — the
   grids, the cloth, the readouts, the code, the send link — is derived from
   those on every change, so nothing can drift. */
(function (root, doc) {
  'use strict';

  var W = root.WEAVE;
  var layoutEl = doc.getElementById('draftLayout');
  if (!W || !layoutEl) return;

  var ENDS = 40, PICKS = 40;
  var el = {
    threading: doc.getElementById('threading'),
    tieup: doc.getElementById('tieup'),
    treadling: doc.getElementById('treadling'),
    warp: doc.getElementById('warpStrip'),
    weft: doc.getElementById('weftStrip'),
    canvas: doc.getElementById('drawdown'),
    preset: doc.getElementById('preset'),
    sett: doc.getElementById('sett'),
    code: doc.getElementById('code'),
    codeNote: doc.getElementById('codeNote'),
    readEnds: doc.getElementById('readEnds'),
    readWeight: doc.getElementById('readWeight'),
    readFloat: doc.getElementById('readFloat'),
    readRepeat: doc.getElementById('readRepeat'),
    floatWarn: doc.getElementById('floatWarn'),
    send: doc.getElementById('sendDraft'),
    shadeList: doc.getElementById('shadeList')
  };

  var draft = null;
  var shade = 'peat';

  /* --- draft helpers ----------------------------------------------------- */

  function tileTo(seq, n) {
    var out = new Array(n);
    for (var i = 0; i < n; i++) out[i] = seq[i % seq.length];
    return out;
  }
  function copyEntries(seq, n) {
    var out = new Array(n);
    for (var i = 0; i < n; i++) out[i] = seq[i % seq.length].slice();
    return out;
  }
  function twill(S) {
    var t = [];
    for (var i = 0; i < S; i++) t.push(S === 4 ? [i, (i + 1) % 4] : [i, (i + 1) % 8, (i + 4) % 8, (i + 5) % 8]);
    return t;
  }
  function blank(S) {
    var d = { shafts: S, treadles: S, threading: [], tieup: [], treadling: [], warp: [], weft: [] };
    for (var i = 0; i < ENDS; i++) { d.threading.push(i % S); d.warp.push('ecru'); }
    for (var t = 0; t < S; t++) d.tieup.push([]);
    for (var j = 0; j < PICKS; j++) { d.treadling.push([j % S]); d.weft.push('peat'); }
    return d;
  }
  /* any draft — from the range, a code, a resize — normalised to the room */
  function adopt(src) {
    var S = src.shafts === 8 ? 8 : 4;
    var d = { shafts: S, treadles: S, threading: [], tieup: [], treadling: [], warp: [], weft: [] };
    d.threading = tileTo(src.threading, ENDS).map(function (v) { return v % S; });
    for (var t = 0; t < S; t++) {
      d.tieup.push((src.tieup[t] || []).filter(function (v) { return v < S; }));
    }
    d.treadling = copyEntries(src.treadling, PICKS).map(function (e) { return e.filter(function (v) { return v < S; }); });
    d.warp = tileTo(src.warp, ENDS);
    d.weft = tileTo(src.weft, PICKS);
    return d;
  }

  /* --- the grids ------------------------------------------------------- */

  function cell(attrs, label) {
    var b = doc.createElement('button');
    b.type = 'button';
    b.className = 'cell';
    b.tabIndex = -1;
    for (var k in attrs) if (attrs.hasOwnProperty(k)) b.setAttribute('data-' + k, attrs[k]);
    b.setAttribute('aria-label', label);
    return b;
  }

  function buildGrids() {
    var S = draft.shafts, T = draft.treadles;
    var i, j, k, t, b;

    el.threading.innerHTML = '';
    el.threading.style.setProperty('--cols', ENDS);
    for (k = S - 1; k >= 0; k--) for (i = 0; i < ENDS; i++) {
      el.threading.appendChild(cell({ i: i, k: k }, 'End ' + (i + 1) + ', shaft ' + (k + 1)));
    }

    el.tieup.innerHTML = '';
    el.tieup.style.setProperty('--cols', T);
    for (k = S - 1; k >= 0; k--) for (t = 0; t < T; t++) {
      el.tieup.appendChild(cell({ t: t, k: k }, 'Treadle ' + (t + 1) + ' lifts shaft ' + (k + 1)));
    }

    el.treadling.innerHTML = '';
    el.treadling.style.setProperty('--cols', T);
    for (j = 0; j < PICKS; j++) for (t = 0; t < T; t++) {
      el.treadling.appendChild(cell({ j: j, t: t }, 'Pick ' + (j + 1) + ', treadle ' + (t + 1)));
    }

    el.warp.innerHTML = '';
    el.warp.style.setProperty('--cols', ENDS);
    for (i = 0; i < ENDS; i++) {
      b = cell({ i: i }, 'End ' + (i + 1) + ' colour');
      b.className += ' cell--shade';
      el.warp.appendChild(b);
    }

    el.weft.innerHTML = '';
    el.weft.style.setProperty('--cols', 1);
    for (j = 0; j < PICKS; j++) {
      b = cell({ j: j }, 'Pick ' + (j + 1) + ' colour');
      b.className += ' cell--shade';
      el.weft.appendChild(b);
    }

    /* one tab stop per grid; arrows move inside it */
    var grids = [el.threading, el.tieup, el.treadling, el.warp, el.weft];
    for (var g = 0; g < grids.length; g++) if (grids[g].firstChild) grids[g].firstChild.tabIndex = 0;
  }

  function sync() {
    var S = draft.shafts, T = draft.treadles;
    var kids, n, b, i, j, k, t;
    kids = el.threading.children;
    for (n = 0; n < kids.length; n++) {
      b = kids[n]; i = +b.getAttribute('data-i'); k = +b.getAttribute('data-k');
      b.setAttribute('aria-pressed', draft.threading[i] === k ? 'true' : 'false');
    }
    kids = el.tieup.children;
    for (n = 0; n < kids.length; n++) {
      b = kids[n]; t = +b.getAttribute('data-t'); k = +b.getAttribute('data-k');
      b.setAttribute('aria-pressed', draft.tieup[t].indexOf(k) >= 0 ? 'true' : 'false');
    }
    kids = el.treadling.children;
    for (n = 0; n < kids.length; n++) {
      b = kids[n]; j = +b.getAttribute('data-j'); t = +b.getAttribute('data-t');
      b.setAttribute('aria-pressed', draft.treadling[j].indexOf(t) >= 0 ? 'true' : 'false');
    }
    kids = el.warp.children;
    for (n = 0; n < kids.length; n++) {
      b = kids[n]; i = +b.getAttribute('data-i');
      b.style.background = W.HEX[draft.warp[i]];
      b.setAttribute('aria-label', 'End ' + (i + 1) + ', ' + draft.warp[i]);
    }
    kids = el.weft.children;
    for (n = 0; n < kids.length; n++) {
      b = kids[n]; j = +b.getAttribute('data-j');
      b.style.background = W.HEX[draft.weft[j]];
      b.setAttribute('aria-label', 'Pick ' + (j + 1) + ', ' + draft.weft[j]);
    }
    var radios = doc.querySelectorAll('input[name="shafts"]');
    for (n = 0; n < radios.length; n++) radios[n].checked = (+radios[n].value === S);
    void T;
  }

  function cellPx() {
    var v = parseFloat(root.getComputedStyle(layoutEl).getPropertyValue('--cell'));
    return v > 0 ? v : 16;
  }

  function paint() {
    W.renderCloth(el.canvas, draft, cellPx());
  }

  /* --- readouts -------------------------------------------------------- */

  function fmt(n) { return n.toLocaleString('en-GB'); }

  /* smallest period of the threading, so the readout can say "repeats every
     8 ends" — or that it does not repeat inside the forty */
  function period(seq) {
    for (var p = 1; p < seq.length; p++) {
      var ok = true;
      for (var i = p; i < seq.length; i++) if (seq[i] !== seq[i - p]) { ok = false; break; }
      if (ok) return p;
    }
    return 0;
  }

  function readouts() {
    var epc = parseInt(el.sett.value, 10);
    if (!(epc >= 8 && epc <= 32)) epc = 22;
    var ppc = Math.round(epc * 0.9);
    var fl = W.floats(draft, ENDS, PICKS);
    el.readEnds.textContent = fmt(epc * 150);
    el.readWeight.textContent = '~ ' + fmt(W.weight(epc, ppc)) + ' g/m²';
    el.readFloat.textContent = fl.warp + ' warp · ' + fl.weft + ' weft';
    var pr = period(draft.threading);
    el.readRepeat.textContent = pr ? 'every ' + pr + ' ends' : 'none in 40';
    el.floatWarn.hidden = !(fl.warp > 5 || fl.weft > 5);
    var code = W.serialize(draft);
    el.code.value = code;
    var body = [
      'A draft for sampling, from the drafting room.', '',
      code, '',
      'Sett: ' + epc + ' ends/cm, about ' + ppc + ' picks/cm',
      'Estimated weight: ' + W.weight(epc, ppc) + ' g/m²',
      'Longest floats: ' + fl.warp + ' warp, ' + fl.weft + ' weft', '',
      'Metres wanted: ', 'For: ', 'Name: '
    ].join('\n');
    el.send.href = 'mailto:cloth@heddle.scot?subject=' + encodeURIComponent('A draft for sampling') + '&body=' + encodeURIComponent(body);
  }

  function refresh() { sync(); paint(); readouts(); }

  /* --- edits ----------------------------------------------------------- */

  el.threading.addEventListener('click', function (e) {
    var b = e.target.closest('.cell'); if (!b) return;
    draft.threading[+b.getAttribute('data-i')] = +b.getAttribute('data-k');
    refresh();
  });
  el.tieup.addEventListener('click', function (e) {
    var b = e.target.closest('.cell'); if (!b) return;
    var t = +b.getAttribute('data-t'), k = +b.getAttribute('data-k');
    var at = draft.tieup[t].indexOf(k);
    if (at >= 0) draft.tieup[t].splice(at, 1); else draft.tieup[t].push(k);
    refresh();
  });
  el.treadling.addEventListener('click', function (e) {
    var b = e.target.closest('.cell'); if (!b) return;
    var j = +b.getAttribute('data-j'), t = +b.getAttribute('data-t');
    var at = draft.treadling[j].indexOf(t);
    if (at >= 0) draft.treadling[j].splice(at, 1); else draft.treadling[j].push(t);
    refresh();
  });
  el.warp.addEventListener('click', function (e) {
    var b = e.target.closest('.cell'); if (!b) return;
    draft.warp[+b.getAttribute('data-i')] = shade;
    refresh();
  });
  el.weft.addEventListener('click', function (e) {
    var b = e.target.closest('.cell'); if (!b) return;
    draft.weft[+b.getAttribute('data-j')] = shade;
    refresh();
  });

  /* arrows inside a grid; the focused cell is the grid's one tab stop */
  function arrows(container, cols) {
    container.addEventListener('keydown', function (e) {
      var keys = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -cols(), ArrowDown: cols() };
      if (!(e.key in keys)) return;
      var kids = container.children;
      var at = Array.prototype.indexOf.call(kids, doc.activeElement);
      if (at < 0) return;
      var to = at + keys[e.key];
      if (to < 0 || to >= kids.length) return;
      e.preventDefault();
      kids[at].tabIndex = -1;
      kids[to].tabIndex = 0;
      kids[to].focus();
    });
    container.addEventListener('focusin', function (e) {
      var kids = container.children;
      for (var n = 0; n < kids.length; n++) kids[n].tabIndex = (kids[n] === e.target) ? 0 : -1;
    });
  }
  arrows(el.threading, function () { return ENDS; });
  arrows(el.tieup, function () { return draft.treadles; });
  arrows(el.treadling, function () { return draft.treadles; });
  arrows(el.warp, function () { return ENDS; });
  arrows(el.weft, function () { return 1; });

  /* --- the bench ------------------------------------------------------- */

  function load(src) {
    draft = adopt(src);
    buildGrids();
    refresh();
  }

  el.preset.addEventListener('change', function () {
    var id = el.preset.value;
    if (id === 'blank') load(blank(draft.shafts));
    else if (W.BY_ID[id]) load(W.fromCloth(W.BY_ID[id]));
    el.codeNote.textContent = '';
  });

  var radios = doc.querySelectorAll('input[name="shafts"]');
  for (var r = 0; r < radios.length; r++) {
    radios[r].addEventListener('change', function () {
      if (!this.checked) return;
      var S = +this.value;
      if (S === draft.shafts) return;
      draft.shafts = S;
      load(draft);
    });
  }

  var tools = doc.querySelectorAll('[data-tool]');
  for (var q = 0; q < tools.length; q++) {
    tools[q].addEventListener('click', function () {
      var tool = this.getAttribute('data-tool');
      var S = draft.shafts, i, j, t;
      if (tool === 'straight') { for (i = 0; i < ENDS; i++) draft.threading[i] = i % S; }
      else if (tool === 'mirror') { for (i = ENDS / 2; i < ENDS; i++) draft.threading[i] = draft.threading[ENDS - 1 - i]; }
      else if (tool === 'asdrawn') { for (j = 0; j < PICKS; j++) draft.treadling[j] = [draft.threading[j] % draft.treadles]; }
      else if (tool === 'twill') { draft.tieup = twill(S); }
      else if (tool === 'tabby') {
        draft.tieup = [];
        for (t = 0; t < S; t++) draft.tieup.push([]);
        for (var k = 0; k < S; k++) draft.tieup[k % 2].push(k);
        for (j = 0; j < PICKS; j++) draft.treadling[j] = [j % 2];
      }
      else if (tool === 'clear') { for (t = 0; t < S; t++) draft.tieup[t] = []; for (j = 0; j < PICKS; j++) draft.treadling[j] = []; }
      else if (tool === 'warp-all') { for (i = 0; i < ENDS; i++) draft.warp[i] = shade; }
      else if (tool === 'weft-all') { for (j = 0; j < PICKS; j++) draft.weft[j] = shade; }
      refresh();
    });
  }

  /* the shade card */
  if (el.shadeList) {
    for (var s = 0; s < W.SHADES.length; s++) {
      var sh = W.SHADES[s];
      var lab = doc.createElement('label');
      lab.className = 'shade';
      var inp = doc.createElement('input');
      inp.type = 'radio'; inp.name = 'shade'; inp.value = sh.id; inp.checked = (sh.id === shade);
      var chip = doc.createElement('span');
      chip.className = 'chip'; chip.style.background = sh.hex;
      lab.appendChild(inp); lab.appendChild(chip); lab.appendChild(doc.createTextNode(sh.name));
      el.shadeList.appendChild(lab);
    }
    el.shadeList.addEventListener('change', function (e) {
      if (e.target.name === 'shade') shade = e.target.value;
    });
  }

  el.sett.addEventListener('input', readouts);

  doc.getElementById('copyCode').addEventListener('click', function () {
    var code = el.code.value;
    function done() { el.codeNote.textContent = 'Copied. Paste it into an email, or into this box on another day.'; }
    function fallback() { el.code.focus(); el.code.select(); el.codeNote.textContent = 'Select the code and copy it.'; }
    if (root.navigator.clipboard && root.navigator.clipboard.writeText) root.navigator.clipboard.writeText(code).then(done, fallback);
    else fallback();
  });
  doc.getElementById('loadCode').addEventListener('click', function () {
    var parsed = W.parse(el.code.value);
    if (!parsed) { el.codeNote.textContent = 'That is not a draft code we can read. It should begin HEDDLE1.'; return; }
    load(parsed);
    el.preset.value = 'custom';
    el.codeNote.textContent = 'Loaded.';
  });

  /* --- start ----------------------------------------------------------- */

  var q1 = /[?&]cloth=([a-z]+)/.exec(root.location.search);
  var q2 = /[?&]d=([^&]+)/.exec(root.location.search);
  var start = null;
  if (q2) { try { start = W.parse(decodeURIComponent(q2[1])); } catch (e) { start = null; } }
  if (!start && q1 && W.BY_ID[q1[1]]) { start = W.fromCloth(W.BY_ID[q1[1]]); el.preset.value = q1[1]; }
  if (!start) { start = W.fromCloth(W.BY_ID.kirkbrae); el.preset.value = 'kirkbrae'; }
  else if (q2) el.preset.value = 'custom';
  load(start);

  var repaint;
  root.addEventListener('resize', function () { clearTimeout(repaint); repaint = setTimeout(paint, 120); });
})(window, document);
