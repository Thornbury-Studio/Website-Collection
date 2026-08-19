/* GYRE — motor signatures, synthesized in-browser with Web Audio.
   Entirely original audio: nothing sampled, nothing licensed. Combustion
   machines get a firing-pulse rev sweep derived from cylinder count and
   redline; electric machines get a motor-order whine with inverter
   harmonics. Only ever starts from an explicit user action, and every run
   self-stops. */
(function () {
  "use strict";

  var ctx = null;
  var running = null; /* { stop: fn } */

  function ac() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function stopAll() {
    if (running) { running.stop(); running = null; }
  }

  /* Shared output chain: gentle level, soft clip, fade in/out. */
  function chain(a, dur) {
    var master = a.createGain();
    master.gain.setValueAtTime(0.0001, a.currentTime);
    master.gain.exponentialRampToValueAtTime(0.24, a.currentTime + 0.18);
    master.gain.setValueAtTime(0.24, a.currentTime + dur - 0.45);
    master.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
    var comp = a.createDynamicsCompressor();
    master.connect(comp);
    comp.connect(a.destination);
    return master;
  }

  function noiseBuffer(a) {
    var b = a.createBuffer(1, a.sampleRate, a.sampleRate);
    var d = b.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }

  /* Combustion: firing frequency = rpm/60 * cylinders/2 (four-stroke). */
  function iceRun(machine, dur) {
    var a = ac();
    var out = chain(a, dur);
    var cyl = machine.power.layout.indexOf("V4") >= 0 ? 4 : 3;
    var idle = 1300, peak = machine.power.redline * 0.82;

    var t0 = a.currentTime;
    function firingHz(rpm) { return (rpm / 60) * (cyl / 2); }

    /* rpm envelope: idle → climb → hold → fall */
    function rpmAt(x) { /* x 0..1 */
      if (x < 0.12) return idle;
      if (x < 0.62) return idle + (peak - idle) * ((x - 0.12) / 0.5);
      if (x < 0.78) return peak;
      return peak - (peak - idle * 1.6) * ((x - 0.78) / 0.22);
    }

    var saw = a.createOscillator(); saw.type = "sawtooth";
    var sub = a.createOscillator(); sub.type = "square";
    var subGain = a.createGain(); subGain.gain.value = 0.5;
    var lp = a.createBiquadFilter(); lp.type = "lowpass"; lp.Q.value = 2.2;

    var STEPS = 60;
    for (var i = 0; i <= STEPS; i++) {
      var x = i / STEPS, t = t0 + x * dur;
      var f = firingHz(rpmAt(x));
      saw.frequency.setValueAtTime(f, t);
      sub.frequency.setValueAtTime(f / 2, t);
      lp.frequency.setValueAtTime(240 + f * 6, t);
    }

    /* mechanical breath: filtered noise bed */
    var n = a.createBufferSource(); n.buffer = noiseBuffer(a); n.loop = true;
    var nf = a.createBiquadFilter(); nf.type = "bandpass"; nf.frequency.value = 900; nf.Q.value = 0.6;
    var ng = a.createGain(); ng.gain.value = 0.055;

    saw.connect(lp); sub.connect(subGain); subGain.connect(lp);
    lp.connect(out);
    n.connect(nf); nf.connect(ng); ng.connect(out);

    saw.start(); sub.start(); n.start();
    var stopT = t0 + dur + 0.05;
    saw.stop(stopT); sub.stop(stopT); n.stop(stopT);
    return { stop: function () { try { saw.stop(); sub.stop(); n.stop(); } catch (e) { /* already stopped */ } } };
  }

  /* Electric: motor-order whine sweeping with speed + inverter harmonic. */
  function evRun(machine, dur) {
    var a = ac();
    var out = chain(a, dur);
    var t0 = a.currentTime;
    var base = 90, top = machine.id === "slip" ? 950 : 1350;

    function hzAt(x) {
      if (x < 0.7) return base + (top - base) * Math.pow(x / 0.7, 1.4);
      return top - (top - base * 2.4) * ((x - 0.7) / 0.3);
    }

    var o1 = a.createOscillator(); o1.type = "sine";
    var o2 = a.createOscillator(); o2.type = "sine";
    var o2g = a.createGain(); o2g.gain.value = 0.16; /* inverter harmonic, quiet */
    var o3 = a.createOscillator(); o3.type = "triangle";
    var o3g = a.createGain(); o3g.gain.value = 0.3;

    var STEPS = 60;
    for (var i = 0; i <= STEPS; i++) {
      var x = i / STEPS, t = t0 + x * dur, f = hzAt(x);
      o1.frequency.setValueAtTime(f, t);
      o2.frequency.setValueAtTime(f * 11, t);
      o3.frequency.setValueAtTime(f * 2.01, t);
    }

    var n = a.createBufferSource(); n.buffer = noiseBuffer(a); n.loop = true;
    var nf = a.createBiquadFilter(); nf.type = "highpass"; nf.frequency.value = 2600;
    var ng = a.createGain(); ng.gain.value = 0.018; /* wind bed */

    o1.connect(out); o2.connect(o2g); o2g.connect(out); o3.connect(o3g); o3g.connect(out);
    n.connect(nf); nf.connect(ng); ng.connect(out);

    o1.start(); o2.start(); o3.start(); n.start();
    var stopT = t0 + dur + 0.05;
    o1.stop(stopT); o2.stop(stopT); o3.stop(stopT); n.stop(stopT);
    return { stop: function () { try { o1.stop(); o2.stop(); o3.stop(); n.stop(); } catch (e) { /* already stopped */ } } };
  }

  /* tiny UI detent tick — used by the garage selector */
  function tick() {
    var a = ac();
    var o = a.createOscillator(); o.type = "square"; o.frequency.value = 1800;
    var g = a.createGain();
    g.gain.setValueAtTime(0.06, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.045);
    o.connect(g); g.connect(a.destination);
    o.start(); o.stop(a.currentTime + 0.05);
  }

  window.GYRE_AUDIO = {
    play: function (machine, dur) {
      stopAll();
      dur = dur || 3.2;
      running = machine.power.type === "ice" ? iceRun(machine, dur) : evRun(machine, dur);
      return dur;
    },
    stop: stopAll,
    tick: tick,
    active: function () { return !!running; }
  };
})();
