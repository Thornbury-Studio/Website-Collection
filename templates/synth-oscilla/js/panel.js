/* ============================================================================
   OSCILLA — the panel
   ----------------------------------------------------------------------------
   Builds a playable instrument into any element carrying [data-panel]. The
   controls are real <input type="range"> elements wearing a drawn knob, so
   they keep keyboard support, labels and screen-reader semantics for free —
   the dial is decoration rotated from a CSS variable.

   Nothing here creates audio. The engine is only started by the header power
   button or by the panel's own power prompt, both of which are clicks.
   ========================================================================== */
(function (O) {
  'use strict';

  var U = O.ui, E = U.engine, $ = U.$, $$ = U.$$;

  /* Two octaves of C — white keys only, with the sharps sitting between as
     narrower keys. Keeps the row playable on a phone. */
  var KEYS = [
    { n: 48, l: 'C' }, { n: 50, l: 'D' }, { n: 52, l: 'E' }, { n: 53, l: 'F' },
    { n: 55, l: 'G' }, { n: 57, l: 'A' }, { n: 59, l: 'B' },
    { n: 60, l: 'C' }, { n: 62, l: 'D' }, { n: 64, l: 'E' }, { n: 65, l: 'F' },
    { n: 67, l: 'G' }, { n: 69, l: 'A' }, { n: 71, l: 'B' }, { n: 72, l: 'C' }
  ];

  /* Typing row → notes, so a desktop visitor can actually play it. */
  var TYPE_MAP = { a:48, s:50, d:52, f:53, g:55, h:57, j:59, k:60, l:62, ';':64 };

  var KNOBS = [
    { key: 'cutoff',    label: 'Cutoff',  min: 120,  max: 8000, step: 10,   unit: 'Hz',  curve: 'log' },
    { key: 'resonance', label: 'Reso',    min: 0.5,  max: 20,   step: 0.1,  unit: '' },
    { key: 'detune',    label: 'Drift',   min: 0,    max: 30,   step: 1,    unit: 'c' },
    { key: 'sub',       label: 'Sub',     min: 0,    max: 1,    step: 0.01, unit: '' },
    { key: 'decay',     label: 'Decay',   min: 0.03, max: 1.2,  step: 0.01, unit: 's' },
    { key: 'feedback',  label: 'Repeats', min: 0,    max: 0.8,  step: 0.01, unit: '' },
    { key: 'mix',       label: 'Delay',   min: 0,    max: 0.7,  step: 0.01, unit: '' },
    { key: 'volume',    label: 'Level',   min: 0,    max: 0.9,  step: 0.01, unit: '' }
  ];

  var DEFAULT_PATTERN = [0, null, 2, null, 4, null, 2, null, 5, null, 4, null, 2, null, 0, null];

  function fmt(k, v) {
    if (k === 'cutoff') return Math.round(v) + ' Hz';
    if (k === 'decay') return v.toFixed(2) + ' s';
    if (k === 'detune') return Math.round(v) + ' c';
    if (k === 'resonance') return v.toFixed(1);
    return Math.round(v * 100) + '';
  }

  function build(host) {
    var id = host.getAttribute('data-panel');
    var item = O.byId(id) || O.byId('field');
    var seqOn = host.hasAttribute('data-seq');
    var pattern = DEFAULT_PATTERN.slice();

    host.innerHTML =
      '<div class="panel__top">' +
        '<span class="panel__name">' + U.esc(item.name) + '</span>' +
        '<span class="panel__code">' + U.esc(item.code) + '</span>' +
        '<span class="panel__state"><span data-state>Standby</span></span>' +
      '</div>' +
      '<div class="panel__power" data-power>' +
        '<button class="btn btn--amber" type="button" data-go>Switch it on</button>' +
        '<p>Nothing plays until you ask. This is a working instrument, not a recording — ' +
           'every note is generated in your browser.</p>' +
      '</div>' +
      '<div class="panel__body" data-live hidden>' +
        '<canvas class="scope" data-scope width="900" height="200" aria-hidden="true"></canvas>' +
        '<div class="knobs" data-knobs></div>' +
        (seqOn
          ? '<div class="panel__row">' +
              '<span class="u-label">Sequence</span>' +
              '<button class="btn btn--line" type="button" data-run>Run</button>' +
              '<span class="u-label" data-tempo-l>108 BPM</span>' +
              '<input type="range" id="tempo-' + U.esc(id) + '" min="70" max="150" step="1" value="108" ' +
                'class="grow" aria-label="Tempo in beats per minute" data-tempo>' +
            '</div>' +
            '<div class="seq" data-seq role="group" aria-label="Sixteen step sequencer"></div>'
          : '') +
        '<div>' +
          '<p class="u-label mb-s">Play — click, or use the A to L keys</p>' +
          '<div class="keys" data-keys></div>' +
        '</div>' +
      '</div>';

    var live = $('[data-live]', host), powerBox = $('[data-power]', host);
    var stateEl = $('[data-state]', host);

    /* -- knobs ------------------------------------------------------------- */
    var knobHost = $('[data-knobs]', host);
    knobHost.innerHTML = KNOBS.map(function (k) {
      var v = E.p[k.key];
      var uid = 'k-' + id + '-' + k.key;
      return '<div class="knob">' +
          '<div class="knob__wrap">' +
            '<div class="knob__dial" data-dial="' + k.key + '"></div>' +
            '<span class="knob__ring"></span>' +
            '<input type="range" id="' + uid + '" min="' + k.min + '" max="' + k.max + '" ' +
              'step="' + k.step + '" value="' + v + '" data-k="' + k.key + '" ' +
              'aria-label="' + U.esc(k.label) + '">' +
          '</div>' +
          '<label class="knob__l" for="' + uid + '">' + U.esc(k.label) + '</label>' +
          '<span class="knob__v u-num" data-v="' + k.key + '">' + fmt(k.key, v) + '</span>' +
        '</div>';
    }).join('');

    function paintKnob(k, v) {
      var spec = KNOBS.filter(function (x) { return x.key === k; })[0];
      if (!spec) return;
      var t = (v - spec.min) / (spec.max - spec.min);
      var dial = $('[data-dial="' + k + '"]', host);
      if (dial) dial.style.setProperty('--a', (-140 + t * 280).toFixed(1));
      var out = $('[data-v="' + k + '"]', host);
      if (out) out.textContent = fmt(k, v);
    }

    $$('input[data-k]', host).forEach(function (input) {
      paintKnob(input.getAttribute('data-k'), parseFloat(input.value));
      input.addEventListener('input', function () {
        var k = input.getAttribute('data-k'), v = parseFloat(input.value);
        E.set(k, v);
        paintKnob(k, v);
      });
    });

    /* Apply this product's voice so each instrument page sounds like itself. */
    function applyVoice() {
      var v = item.voice || {};
      Object.keys(v).forEach(function (k) {
        E.set(k, v[k]);
        var input = $('input[data-k="' + k + '"]', host);
        if (input) { input.value = v[k]; paintKnob(k, v[k]); }
      });
    }

    /* -- keyboard ---------------------------------------------------------- */
    var keyHost = $('[data-keys]', host);
    keyHost.innerHTML = KEYS.map(function (k) {
      return '<button class="key" type="button" data-note="' + k.n + '" ' +
             'aria-label="Play ' + k.l + '">' + k.l + '</button>';
    }).join('');

    var held = {};
    function press(note, el) {
      if (held[note]) return;
      var v = E.noteOn(note, 0.85);
      if (!v) return;
      held[note] = v;
      if (el) el.setAttribute('data-on', '1');
    }
    function release(note, el) {
      if (!held[note]) return;
      E.noteOff(held[note]);
      delete held[note];
      if (el) el.removeAttribute('data-on');
    }

    $$('.key', keyHost).forEach(function (el) {
      var note = +el.getAttribute('data-note');
      el.addEventListener('pointerdown', function (e) {
        e.preventDefault(); el.setPointerCapture(e.pointerId); press(note, el);
      });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) {
        el.addEventListener(ev, function () { release(note, el); });
      });
      /* keyboard users: space/enter give a short note rather than a hold */
      el.addEventListener('keydown', function (e) {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); E.pluck(note, 0.3, 0.85); el.setAttribute('data-on', '1'); }
      });
      el.addEventListener('keyup', function () { el.removeAttribute('data-on'); });
    });

    document.addEventListener('keydown', function (e) {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      var t = e.target.tagName;
      if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT') return;
      var note = TYPE_MAP[e.key.toLowerCase()];
      if (note == null || !E.ready) return;
      var el = $('.key[data-note="' + note + '"]', host);
      press(note, el);
    });
    document.addEventListener('keyup', function (e) {
      var note = TYPE_MAP[e.key.toLowerCase()];
      if (note == null) return;
      release(note, $('.key[data-note="' + note + '"]', host));
    });

    /* -- sequencer --------------------------------------------------------- */
    if (seqOn) {
      var seqHost = $('[data-seq]', host);
      seqHost.innerHTML = pattern.map(function (v, i) {
        return '<button class="step" type="button" role="switch" aria-pressed="' + (v !== null) + '" ' +
               'data-step="' + i + '" aria-label="Step ' + (i + 1) + '"></button>';
      }).join('');

      seqHost.addEventListener('click', function (e) {
        var b = e.target.closest('.step');
        if (!b) return;
        var i = +b.getAttribute('data-step');
        pattern[i] = pattern[i] === null ? [0, 2, 4, 5][i % 4] : null;
        b.setAttribute('aria-pressed', String(pattern[i] !== null));
        E.seqSet(pattern, 'minor', 45);
      });

      var runBtn = $('[data-run]', host);
      runBtn.addEventListener('click', function () {
        if (!E.ready) { boot(); return; }
        if (E.seq.on) { E.seqStop(); runBtn.textContent = 'Run'; U.toast('Sequence stopped.'); }
        else { E.seqSet(pattern, 'minor', 45); E.seqStart(); runBtn.textContent = 'Stop'; U.toast('Sequence running.'); }
      });

      var tempo = $('[data-tempo]', host), tempoL = $('[data-tempo-l]', host);
      tempo.addEventListener('input', function () {
        tempoL.textContent = tempo.value + ' BPM';
        E.setTempo(+tempo.value);
      });

      E.on('step', function (i) {
        $$('.step', seqHost).forEach(function (b, bi) {
          if (bi === i) b.setAttribute('data-playing', '1');
          else b.removeAttribute('data-playing');
        });
      });
    }

    /* -- scope -------------------------------------------------------------- */
    var canvas = $('[data-scope]', host), ctx2d = canvas.getContext('2d');
    var buf = new Uint8Array(2048);
    var raf = null;

    function draw() {
      raf = requestAnimationFrame(draw);
      var w = canvas.width, h = canvas.height;
      ctx2d.clearRect(0, 0, w, h);
      ctx2d.fillStyle = '#0C0E12'; ctx2d.fillRect(0, 0, w, h);
      var data = E.scope(buf);
      ctx2d.lineWidth = 2;
      ctx2d.strokeStyle = '#FF9B21';
      ctx2d.beginPath();
      if (!data) {                       // flatline when nothing is sounding
        ctx2d.moveTo(0, h / 2); ctx2d.lineTo(w, h / 2);
      } else {
        for (var i = 0; i < data.length; i++) {
          var x = i / data.length * w;
          var y = (data[i] / 128 - 1) * (h / 2 * 0.92) + h / 2;
          i ? ctx2d.lineTo(x, y) : ctx2d.moveTo(x, y);
        }
      }
      ctx2d.stroke();
    }

    /* -- power -------------------------------------------------------------- */
    function boot() {
      E.start().then(function (ok) {
        if (!ok) { U.toast('Your browser blocked audio — click the page, then try again.', 'warn'); return; }
        powerBox.hidden = true;
        live.hidden = false;
        stateEl.textContent = 'Running';
        applyVoice();
        if (!raf && !U.reduce) draw();
        else if (!raf) { draw(); cancelAnimationFrame(raf); raf = null; }   // one static frame
        U.toast('Ready. Play the keys, or press A to L.');
      });
    }

    $('[data-go]', host).addEventListener('click', boot);

    /* If the header power switch was used first, open the panel to match. */
    E.on('ready', function () {
      if (E.ctx && E.ctx.state === 'running' && powerBox && !powerBox.hidden) {
        powerBox.hidden = true; live.hidden = false;
        stateEl.textContent = 'Running';
        applyVoice();
        if (!raf && !U.reduce) draw();
      }
    });
    E.on('power', function (on) {
      if (!on) {
        stateEl.textContent = 'Standby';
        if (raf) { cancelAnimationFrame(raf); raf = null; }
        var rb = $('[data-run]', host); if (rb) rb.textContent = 'Run';
      }
    });
  }

  O.panel = { build: build, keys: KEYS };

  $$('[data-panel]').forEach(build);
})(window.OSCILLA);
