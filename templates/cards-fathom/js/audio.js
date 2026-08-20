/* FATHOM — synthesized sounds. Nothing sampled, nothing licensed: card flip
   (filtered noise swish), soft tick, foil shimmer (sparkle arpeggio), beacon
   chime (FM bell), trawl tear, page turn. Master switch lives in the log
   (off by default); every call is a no-op while off or before first
   user gesture. */
(function () {
  "use strict";

  var ctx = null;

  function on() { return window.FATHOM_LOG && window.FATHOM_LOG.sound(); }
  function ac() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function noiseBuf(a, secs) {
    var b = a.createBuffer(1, Math.floor(a.sampleRate * secs), a.sampleRate);
    var d = b.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }

  function swish(dur, from, to, level) {
    if (!on()) return;
    var a = ac();
    var n = a.createBufferSource(); n.buffer = noiseBuf(a, dur + 0.05);
    var f = a.createBiquadFilter(); f.type = "bandpass"; f.Q.value = 1.2;
    f.frequency.setValueAtTime(from, a.currentTime);
    f.frequency.exponentialRampToValueAtTime(to, a.currentTime + dur);
    var g = a.createGain();
    g.gain.setValueAtTime(0.0001, a.currentTime);
    g.gain.exponentialRampToValueAtTime(level, a.currentTime + dur * 0.25);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
    n.connect(f); f.connect(g); g.connect(a.destination);
    n.start(); n.stop(a.currentTime + dur + 0.05);
  }

  function tone(freq, dur, level, type, delay) {
    if (!on()) return;
    var a = ac(), t0 = a.currentTime + (delay || 0);
    var o = a.createOscillator(); o.type = type || "sine"; o.frequency.value = freq;
    var g = a.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(level, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(a.destination);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }

  window.FATHOM_AUDIO = {
    tick: function () { tone(1500, 0.05, 0.05, "square"); },
    flip: function () { swish(0.22, 500, 3800, 0.12); },
    page: function () { swish(0.3, 900, 260, 0.1); },
    tear: function () {
      swish(0.36, 300, 2400, 0.22);
      swish(0.2, 1400, 5200, 0.1);
    },
    shimmer: function () {
      /* sparkle arpeggio: detuned high sines */
      [1567.98, 1975.53, 2349.32, 2793.83].forEach(function (f, i) {
        tone(f, 0.5, 0.035, "sine", i * 0.07);
        tone(f * 1.007, 0.5, 0.02, "sine", i * 0.07);
      });
    },
    beacon: function () {
      /* FM-ish bell: carrier + bright partials, slow decay */
      if (!on()) return;
      var a = ac(), t0 = a.currentTime;
      [392, 587.33, 783.99, 1174.66].forEach(function (f, i) {
        var o = a.createOscillator(); o.type = "sine"; o.frequency.value = f;
        var g = a.createGain();
        var lvl = 0.09 / (i + 1);
        g.gain.setValueAtTime(0.0001, t0 + i * 0.03);
        g.gain.exponentialRampToValueAtTime(lvl, t0 + i * 0.03 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.6);
        o.connect(g); g.connect(a.destination);
        o.start(t0 + i * 0.03); o.stop(t0 + 1.7);
      });
    },
    signature: function () {
      this.beacon();
      var self = this;
      setTimeout(function () { self.shimmer(); }, 350);
    }
  };
})();
