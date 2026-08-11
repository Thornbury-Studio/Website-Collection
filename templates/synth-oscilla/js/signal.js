/* ============================================================================
   OSCILLA — the signal path
   ----------------------------------------------------------------------------
   Four stages of the same chain. Each one plays an identical phrase, so the
   only variable is how much of the chain is switched in. The engine's own
   parameters are moved to express each stage rather than a second synth being
   built alongside it — what you hear here is the instrument on the other pages.
   ========================================================================== */
(function (O) {
  'use strict';

  var U = O.ui, E = U.engine, $ = U.$, $$ = U.$$;

  var STAGES = [
    { id: 'osc', n: '01', t: 'Oscillators',
      d: 'Two sawtooths a few cents apart, plus a sine an octave below. Raw, bright, and a little unpleasant on its own — this is the material, not the sound.',
      note: 'Wide open filter, no envelope shape, no delay. Everything the instrument can make, all at once.',
      p: { cutoff: 8000, resonance: 0.7, envAmount: 0, attack: 0.004, decay: 0.6, sustain: 1, release: 0.1, mix: 0 } },
    { id: 'filter', n: '02', t: '+ Filter',
      d: 'A four-pole lowpass takes the top off. Resonance lifts a peak right at the cutoff, which is where a synthesiser starts sounding like one.',
      note: 'Cutoff pulled down to 900 Hz with resonance up. Same notes — most of the brightness is simply gone.',
      p: { cutoff: 900, resonance: 11, envAmount: 0, attack: 0.004, decay: 0.6, sustain: 1, release: 0.12, mix: 0 } },
    { id: 'env', n: '03', t: '+ Envelope',
      d: 'Now the filter opens and closes with each note instead of sitting still. This is the difference between a drone and a phrase.',
      note: 'The filter envelope adds 2.6 kHz at the start of every note and falls back. Listen to the attack.',
      p: { cutoff: 700, resonance: 9, envAmount: 2600, attack: 0.008, decay: 0.22, sustain: 0.35, release: 0.25, mix: 0 } },
    { id: 'delay', n: '04', t: '+ Delay',
      d: 'A damped repeat, fed back on itself. Each repeat is darker than the last, so it falls away rather than piling up.',
      note: 'The whole instrument. This is roughly how Field leaves the factory.',
      p: { cutoff: 1200, resonance: 7, envAmount: 2400, attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.32, delayTime: 0.3, feedback: 0.42, mix: 0.42 } }
  ];

  var PHRASE = [45, 52, 57, 60, 57, 52];    // A minor shape, six notes
  var active = 'delay';
  var loopTimer = null;

  var host = $('#stages');
  host.innerHTML = STAGES.map(function (s) {
    return '<button class="stage" type="button" role="switch" aria-pressed="false" data-stage="' + s.id + '">' +
        '<span class="stage__n u-num">' + s.n + '</span>' +
        '<span class="stage__t">' + U.esc(s.t) + '</span>' +
        '<span class="stage__d">' + U.esc(s.d) + '</span>' +
      '</button>';
  }).join('');

  function apply(id, announce) {
    var s = STAGES.filter(function (x) { return x.id === id; })[0];
    if (!s) return;
    active = id;
    Object.keys(s.p).forEach(function (k) { E.set(k, s.p[k]); });
    $$('.stage', host).forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-stage') === id));
    });
    var note = $('#sigNote');
    if (note) note.textContent = s.note;
    if (announce) U.toast(s.t + ' — playing.');
    play();
  }

  host.addEventListener('click', function (e) {
    var b = e.target.closest('.stage');
    if (!b) return;
    if (!E.ready) { boot(function () { apply(b.getAttribute('data-stage'), true); }); return; }
    apply(b.getAttribute('data-stage'), true);
  });

  /* -- the phrase ----------------------------------------------------------- */
  var phraseTimers = [];
  function play() {
    if (!E.ready || E.ctx.state !== 'running') return;
    phraseTimers.forEach(clearTimeout);
    phraseTimers = [];
    PHRASE.forEach(function (n, i) {
      phraseTimers.push(setTimeout(function () { E.pluck(n, 0.34, 0.85); }, i * 260));
    });
  }

  $('#sigPlay').addEventListener('click', function () {
    if (!E.ready) { boot(function () { apply(active); }); return; }
    play();
  });

  var loopBtn = $('#sigLoop');
  loopBtn.addEventListener('click', function () {
    if (!E.ready) { boot(function () { apply(active); }); return; }
    if (loopTimer) {
      clearInterval(loopTimer); loopTimer = null;
      loopBtn.textContent = 'Loop it';
      U.toast('Loop stopped.');
    } else {
      play();
      loopTimer = setInterval(play, PHRASE.length * 260 + 700);
      loopBtn.textContent = 'Stop the loop';
      U.toast('Looping — switch stages while it runs.');
    }
  });

  /* -- scope ---------------------------------------------------------------- */
  var canvas = $('#sigScope'), c2 = canvas.getContext('2d');
  var buf = new Uint8Array(2048), raf = null;
  function draw() {
    raf = requestAnimationFrame(draw);
    var w = canvas.width, h = canvas.height;
    c2.fillStyle = '#0C0E12'; c2.fillRect(0, 0, w, h);
    var data = E.scope(buf);
    c2.lineWidth = 2; c2.strokeStyle = '#FF9B21'; c2.beginPath();
    if (!data) { c2.moveTo(0, h / 2); c2.lineTo(w, h / 2); }
    else {
      for (var i = 0; i < data.length; i++) {
        var x = i / data.length * w, y = (data[i] / 128 - 1) * (h / 2 * 0.92) + h / 2;
        i ? c2.lineTo(x, y) : c2.moveTo(x, y);
      }
    }
    c2.stroke();
  }

  /* -- power ---------------------------------------------------------------- */
  function boot(then) {
    E.start().then(function (ok) {
      if (!ok) { U.toast('Your browser blocked audio — click the page and try again.', 'warn'); return; }
      $('#sigPower').hidden = true;
      $('#sigLive').hidden = false;
      $('#sigState').textContent = 'Running';
      if (!raf) draw();
      if (then) then(); else apply(active);
    });
  }
  $('#sigGo').addEventListener('click', function () { boot(); });

  E.on('power', function (on) {
    if (!on) {
      $('#sigState').textContent = 'Standby';
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      if (loopTimer) { clearInterval(loopTimer); loopTimer = null; loopBtn.textContent = 'Loop it'; }
    }
  });

  U.init();
})(window.OSCILLA);
