/* ============================================================================
   OSCILLA — the voice
   ----------------------------------------------------------------------------
   A real subtractive synthesiser voice built on Web Audio. This is not a
   recording: every note on this site is generated in the browser at the moment
   you ask for it.

   Signal path, in order:

       osc A ──┐
               ├─▶ mix ─▶ filter ─▶ VCA ─▶ ┬─▶ dry ──────────┐
       osc B ──┘          (LPF)    (ADSR)  └─▶ delay ─▶ fb ───┼─▶ master ─▶ out
                                                              │   (limiter)
                                              sub ────────────┘

   Two rules the whole file is built around:

   1. NOTHING makes sound until a user gesture. The AudioContext is not even
      constructed until start() is called from a click, because constructing one
      on load is what gets a site auto-muted by the browser and is rude besides.
   2. Every parameter change is ramped, never assigned. Setting an AudioParam
      directly mid-note produces a click; `setTargetAtTime` is the difference
      between a synth and a bug.
   ========================================================================== */
(function (root) {
  'use strict';

  var AC = root.AudioContext || root.webkitAudioContext;

  /* Equal temperament from A4 = 440Hz. */
  function midiToHz(n) { return 440 * Math.pow(2, (n - 69) / 12); }

  var SCALES = {
    minor:      [0, 2, 3, 5, 7, 8, 10],
    pentatonic: [0, 3, 5, 7, 10],
    dorian:     [0, 2, 3, 5, 7, 9, 10]
  };

  function Engine() {
    this.ctx = null;
    this.ready = false;
    this.muted = false;
    this.nodes = {};
    this.voices = [];
    this.seq = { on: false, step: 0, timer: null, pattern: [], tempo: 108 };
    this.listeners = {};
    /* Panel state. Defaults are chosen to sound good the instant someone
       presses a key without touching anything — a demo that needs tuning
       before it sounds intentional is a broken demo. */
    this.p = {
      wave: 'sawtooth',
      detune: 8,        // cents between the two oscillators — the "drift"
      sub: 0.35,        // sub oscillator level
      cutoff: 1400,     // Hz
      resonance: 6,     // Q
      envAmount: 2200,  // Hz the envelope opens the filter by
      attack: 0.012,
      decay: 0.18,
      sustain: 0.55,
      release: 0.32,
      delayTime: 0.28,
      feedback: 0.34,
      mix: 0.28,        // delay send
      volume: 0.5
    };
  }

  Engine.prototype.on = function (evt, fn) {
    (this.listeners[evt] = this.listeners[evt] || []).push(fn);
  };
  Engine.prototype.emit = function (evt, data) {
    (this.listeners[evt] || []).forEach(function (fn) { fn(data); });
  };

  /* -- build the graph (first user gesture only) --------------------------- */
  Engine.prototype.start = function () {
    var self = this;
    if (this.ready) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return Promise.resolve(true);
    }
    if (!AC) return Promise.resolve(false);

    var ctx = this.ctx = new AC();
    var n = this.nodes;

    n.master = ctx.createGain();
    n.master.gain.value = this.p.volume;

    /* A gentle limiter so stacked notes and delay feedback can never clip into
       something unpleasant. Slow-ish release keeps it musical rather than pumpy. */
    n.limiter = ctx.createDynamicsCompressor();
    n.limiter.threshold.value = -8;
    n.limiter.knee.value = 6;
    n.limiter.ratio.value = 12;
    n.limiter.attack.value = 0.003;
    n.limiter.release.value = 0.18;

    n.filter = ctx.createBiquadFilter();
    n.filter.type = 'lowpass';
    n.filter.frequency.value = this.p.cutoff;
    n.filter.Q.value = this.p.resonance;

    n.vca = ctx.createGain();
    n.vca.gain.value = 1;

    /* delay line with feedback, plus a damping filter inside the loop so
       repeats get darker as they die — the analog behaviour people expect */
    n.delay = ctx.createDelay(2.0);
    n.delay.delayTime.value = this.p.delayTime;
    n.fb = ctx.createGain();
    n.fb.gain.value = this.p.feedback;
    n.damp = ctx.createBiquadFilter();
    n.damp.type = 'lowpass';
    n.damp.frequency.value = 2600;
    n.send = ctx.createGain();
    n.send.gain.value = this.p.mix;

    n.analyser = ctx.createAnalyser();
    n.analyser.fftSize = 2048;
    n.analyser.smoothingTimeConstant = 0.75;

    /*  filter ▸ vca ▸ (dry ▸ limiter) and (send ▸ delay ▸ damp ▸ fb ▸ delay)  */
    n.filter.connect(n.vca);
    n.vca.connect(n.limiter);
    n.vca.connect(n.send);
    n.send.connect(n.delay);
    n.delay.connect(n.damp);
    n.damp.connect(n.fb);
    n.fb.connect(n.delay);          // the loop
    n.damp.connect(n.limiter);
    n.limiter.connect(n.master);
    n.master.connect(n.analyser);
    n.analyser.connect(ctx.destination);

    this.ready = true;
    this.emit('ready', true);

    /* Browsers hand back a suspended context when the gesture is indirect. */
    return (ctx.state === 'suspended' ? ctx.resume() : Promise.resolve())
      .then(function () { return self.ctx.state === 'running'; });
  };

  Engine.prototype.stop = function () {
    this.seqStop();
    this.allOff();
    if (this.ctx && this.ctx.state === 'running') this.ctx.suspend();
    this.emit('power', false);
  };

  Engine.prototype.setMuted = function (m) {
    this.muted = !!m;
    if (!this.ready) return;
    var t = this.ctx.currentTime;
    this.nodes.master.gain.setTargetAtTime(this.muted ? 0 : this.p.volume, t, 0.02);
    this.emit('mute', this.muted);
  };

  /* -- parameters ----------------------------------------------------------
     One entry point so the UI never touches an AudioParam directly, and every
     change is ramped rather than assigned. */
  Engine.prototype.set = function (key, value) {
    this.p[key] = value;
    if (!this.ready) return;
    var t = this.ctx.currentTime, n = this.nodes, T = 0.02;
    switch (key) {
      case 'cutoff':     n.filter.frequency.setTargetAtTime(value, t, T); break;
      case 'resonance':  n.filter.Q.setTargetAtTime(value, t, T); break;
      case 'delayTime':  n.delay.delayTime.setTargetAtTime(value, t, 0.06); break;
      case 'feedback':   n.fb.gain.setTargetAtTime(Math.min(value, 0.82), t, T); break;
      case 'mix':        n.send.gain.setTargetAtTime(value, t, T); break;
      case 'volume':     if (!this.muted) n.master.gain.setTargetAtTime(value, t, T); break;
      default: break;    // wave/detune/sub/env apply to the next note
    }
    this.emit('param', { key: key, value: value });
  };

  /* -- one note ------------------------------------------------------------- */
  Engine.prototype.noteOn = function (midi, velocity) {
    if (!this.ready || this.ctx.state !== 'running') return null;
    var ctx = this.ctx, n = this.nodes, p = this.p;
    var t = ctx.currentTime;
    var hz = midiToHz(midi);
    var vel = velocity == null ? 0.85 : velocity;

    var a = ctx.createOscillator(); a.type = p.wave; a.frequency.value = hz;
    var b = ctx.createOscillator(); b.type = p.wave; b.frequency.value = hz;
    a.detune.value = -p.detune; b.detune.value = p.detune;

    var sub = ctx.createOscillator();
    sub.type = 'sine'; sub.frequency.value = hz / 2;

    var mix = ctx.createGain(); mix.gain.value = 0.32 * vel;
    var subG = ctx.createGain(); subG.gain.value = p.sub * vel * 0.5;

    a.connect(mix); b.connect(mix); sub.connect(subG);

    /* Per-note amplitude envelope, and a filter envelope that opens the shared
       lowpass — classic subtractive behaviour. */
    var vca = ctx.createGain();
    vca.gain.setValueAtTime(0.0001, t);
    vca.gain.exponentialRampToValueAtTime(Math.max(0.0002, vel), t + p.attack);
    vca.gain.exponentialRampToValueAtTime(Math.max(0.0002, vel * p.sustain), t + p.attack + p.decay);

    mix.connect(vca); subG.connect(vca);
    vca.connect(n.filter);

    var peak = Math.min(12000, p.cutoff + p.envAmount * vel);
    n.filter.frequency.cancelScheduledValues(t);
    n.filter.frequency.setValueAtTime(n.filter.frequency.value, t);
    n.filter.frequency.linearRampToValueAtTime(peak, t + p.attack);
    n.filter.frequency.setTargetAtTime(p.cutoff, t + p.attack, Math.max(0.05, p.decay));

    a.start(t); b.start(t); sub.start(t);

    var voice = { midi: midi, osc: [a, b, sub], vca: vca, done: false };
    this.voices.push(voice);
    this.emit('note', { midi: midi, on: true });
    return voice;
  };

  Engine.prototype.noteOff = function (voice) {
    if (!voice || voice.done || !this.ready) return;
    voice.done = true;
    var t = this.ctx.currentTime, r = this.p.release;
    try {
      voice.vca.gain.cancelScheduledValues(t);
      voice.vca.gain.setValueAtTime(Math.max(0.0002, voice.vca.gain.value), t);
      voice.vca.gain.exponentialRampToValueAtTime(0.0001, t + r);
    } catch (e) { /* param already torn down */ }
    voice.osc.forEach(function (o) { try { o.stop(t + r + 0.03); } catch (e) {} });
    var self = this;
    setTimeout(function () {
      var i = self.voices.indexOf(voice);
      if (i > -1) self.voices.splice(i, 1);
      self.emit('note', { midi: voice.midi, on: false });
    }, (r + 0.08) * 1000);
  };

  /* A fire-and-forget note for the sequencer and for tap-to-hear buttons. */
  Engine.prototype.pluck = function (midi, holdSec, velocity) {
    var v = this.noteOn(midi, velocity);
    if (!v) return;
    var self = this;
    setTimeout(function () { self.noteOff(v); }, (holdSec || 0.16) * 1000);
  };

  Engine.prototype.allOff = function () {
    var self = this;
    this.voices.slice().forEach(function (v) { self.noteOff(v); });
  };

  /* -- sequencer ------------------------------------------------------------
     16 steps. Timing runs off setInterval rather than lookahead scheduling:
     at these tempos the jitter is inaudible, and it keeps the step highlight
     in the UI exactly in sync with what you hear, which matters more here. */
  Engine.prototype.seqSet = function (pattern, scale, root) {
    this.seq.pattern = pattern.slice();
    this.seq.scale = SCALES[scale] || SCALES.minor;
    this.seq.root = root == null ? 45 : root;
  };

  Engine.prototype.seqStart = function () {
    if (!this.ready || this.seq.on) return;
    var self = this, s = this.seq;
    s.on = true; s.step = 0;
    var tick = function () {
      var deg = s.pattern[s.step];
      if (deg !== null && deg !== undefined && deg >= 0) {
        var oct = Math.floor(deg / s.scale.length);
        var note = s.root + s.scale[deg % s.scale.length] + 12 * oct;
        self.pluck(note, (60 / s.tempo) * 0.42, 0.9);
      }
      self.emit('step', s.step);
      s.step = (s.step + 1) % 16;
    };
    tick();
    s.timer = setInterval(tick, (60 / s.tempo) / 4 * 1000);   // 16ths
    this.emit('seq', true);
  };

  Engine.prototype.seqStop = function () {
    var s = this.seq;
    if (s.timer) clearInterval(s.timer);
    s.timer = null; s.on = false; s.step = 0;
    this.emit('seq', false);
    this.emit('step', -1);
  };

  Engine.prototype.setTempo = function (bpm) {
    this.seq.tempo = bpm;
    if (this.seq.on) { this.seqStop(); this.seqStart(); }
  };

  /* -- scope ----------------------------------------------------------------
     Time-domain data for the on-screen oscilloscope. Returns null when there
     is nothing to draw so callers can skip the frame entirely. */
  Engine.prototype.scope = function (arr) {
    if (!this.ready || this.ctx.state !== 'running') return null;
    this.nodes.analyser.getByteTimeDomainData(arr);
    return arr;
  };

  root.OSCILLA_AUDIO = { Engine: Engine, midiToHz: midiToHz, scales: SCALES };
})(window);
