/* REDLINE. — the one model.
 *
 * Every figure on the site comes from here: the spec sheet, the derived
 * claims (bandwidth, TFLOPS, airflow, burn-in samples), and the live
 * telemetry the page runs off the visitor's measured scroll speed.
 * tools/bake.mjs runs this same file in Node to write the static numbers
 * into the HTML, so nothing is ever typed twice.
 *
 * Anchors (what "today" means, 2026): the fastest consumer card on sale
 * carries 32 GB of GDDR7 on a 512-bit bus at 28 Gbps (1,792 GB/s), is rated
 * 575 W and does ~104.8 TFLOPS FP32. A single 12V-2x6 connector is rated
 * 600 W. GDDR7 ships in 3 GB (24 Gb) modules. The GX9900 is one plausible
 * step past that — not a random big number.
 */
(function (g) {
  'use strict';

  var SPEC = {
    price: 11480,            // S$, GST included
    leadDays: 9,             // working days, order to dispatch
    buildsPerWeek: 6,
    warrantyYears: 3,
    serviceMonth: 24,        // included dust-out + repaste
    burnHours: 72,
    shipKg: 31,

    gpu: {
      name: 'GX9900',
      shaders: 24576,        // 192 units x 128
      boostGHz: 2.62,
      moduleGB: 3,
      modules: 16,           // one per 32-bit channel on a 512-bit bus
      busBits: 512,
      gbps: 32,
      boardW: 600,
      connectorW: 600,       // 12V-2x6 rating
      idleW: 31,
      idleC: 34,             // fans stopped, passive
      loadC: 68,             // sustained full load, closed case, 25 °C room
      fanStopC: 50,          // below this the fans do not turn
      fanRestC: 46,          // once turning, they stop again below this
      fanStartRPM: 900,
      fanTopC: 74,
      fanTopRPM: 2600,
      fanMaxRPM: 3200,
      fans: 3,
      fanMM: 110
    },

    today: { vramGB: 32, modules: 16, moduleGB: 2, busBits: 512, gbps: 28, shaders: 21760, boostGHz: 2.407, boardW: 575 },

    cpu: { cores: 16, threads: 32, boostGHz: 5.7, pptW: 230 },
    ram: { gb: 96, sticks: 2, mts: 6400 },
    ssd: { tb: 4, readMBs: 14500 },
    psu: { w: 1300, rating: '80 PLUS Platinum', standard: 'ATX 3.1' },
    restW: 70,               // board, memory, drive, fans at full load

    air: {
      fans: 7, intakes: 4, fanMM: 140,
      fanMaxRPM: 2000,
      fanFreeCFM: 95,        // one 140 mm fan, free air, at max RPM
      installed: 0.6,        // share left after filters and case impedance
      riseC: 8,              // exhaust air allowed to run this much above the room
      cp: 1005, rho: 1.2     // air: J/(kg·K), kg/m³
    },

    // the loop we built against it and did not ship
    loop: { ml: 720, gpuColderC: 4, serviceMonths: 12 },

    // a model that fits in memory — 4-bit weights plus an 8k-token context
    llm: { paramsB: 70, bits: 4, layers: 80, kvHeads: 8, headDim: 128, ctx: 8192 },

    dB: { idle: 19, load: 36 }  // at 1 m
  };

  var G = SPEC.gpu;

  /* ---------- derived claims ---------- */

  function vramGB() { return G.modules * G.moduleGB; }
  function bandwidthGBs() { return G.busBits * G.gbps / 8; }
  function tflops() { return Math.round(G.shaders * 2 * G.boostGHz / 100) / 10; }
  function peakSystemW() { return G.boardW + SPEC.cpu.pptW + SPEC.restW; }
  function psuShare() { return peakSystemW() / SPEC.psu.w; }
  function burnSamples() { return SPEC.burnHours * 3600; }
  function vsToday(a, b) { return Math.round((a / b - 1) * 100); }
  // today's card, from the same arithmetic
  function todayBandwidthGBs() { var t = SPEC.today; return t.busBits * t.gbps / 8; }
  function todayTflops() { var t = SPEC.today; return Math.round(t.shaders * 2 * t.boostGHz / 100) / 10; }

  function llmWeightsGB() { var m = SPEC.llm; return m.paramsB * m.bits / 8; }
  function llmContextGB() {
    var m = SPEC.llm;               // K and V, fp16, per token, per layer
    return 2 * m.layers * m.kvHeads * m.headDim * 2 * m.ctx / 1e9;
  }
  function llmTotalGB() { return llmWeightsGB() + llmContextGB(); }

  // air needed to carry the full-load heat out at the allowed exhaust rise
  function airM3h() {
    var a = SPEC.air;
    return peakSystemW() / (a.cp * a.rho * a.riseC) * 3600;
  }
  function airCFM() { return airM3h() / 1.699; }
  function intakeRPM() {
    var a = SPEC.air;
    var perFanAtMax = a.fanFreeCFM * a.installed;
    return airCFM() / (a.intakes * perFanAtMax) * a.fanMaxRPM;
  }

  /* ---------- live telemetry ---------- */

  // the GX9900 fan curve (rpm for a given core temperature)
  function fanCurve(tC, spinning) {
    var stopAt = spinning ? G.fanRestC : G.fanStopC;
    if (tC < stopAt) return 0;
    if (tC <= G.fanTopC) {
      var k = Math.max(0, (tC - G.fanStopC) / (G.fanTopC - G.fanStopC));
      return G.fanStartRPM + k * (G.fanTopRPM - G.fanStartRPM);
    }
    var k2 = Math.min(1, (tC - G.fanTopC) / 10);
    return G.fanTopRPM + k2 * (G.fanMaxRPM - G.fanTopRPM);
  }

  function boardW(load) { return G.idleW + (G.boardW - G.idleW) * Math.pow(load, 1.1); }
  function steadyC(load) { return G.idleC + (G.loadC - G.idleC) * Math.pow(load, 0.9); }

  // demand from measured scroll speed: 2.6 viewport heights a second is flat out
  function demand(pxPerSec, viewportH) {
    var d = Math.abs(pxPerSec) / (2.6 * Math.max(320, viewportH));
    return Math.min(1, Math.pow(d, 0.85));
  }

  function idle() {
    return { load: 0, tC: G.idleC, rpm: 0, w: G.idleW, heat: 0, spinning: false };
  }

  function approach(v, target, dt, tauUp, tauDown) {
    var tau = target > v ? tauUp : tauDown;
    return v + (target - v) * (1 - Math.exp(-dt / tau));
  }

  // advance the machine by dt seconds under demand d (0..1)
  function step(s, d, dt) {
    dt = Math.min(0.1, Math.max(0, dt));
    s.load = approach(s.load, d, dt, 0.22, 0.4);
    if (s.load < 0.0005) s.load = 0;
    s.tC = approach(s.tC, steadyC(s.load), dt, 1.1, 1.6);
    s.w = boardW(s.load);
    var target = fanCurve(s.tC, s.spinning);
    s.rpm = target > s.rpm ? Math.min(target, s.rpm + 1400 * dt) : Math.max(target, s.rpm - 700 * dt);
    if (s.rpm < 1) s.rpm = 0;
    s.spinning = s.rpm > 0;
    var th = (s.tC - G.idleC) / (G.loadC - G.idleC);
    s.heat = Math.min(1, Math.max(0, 0.55 * s.load + 0.45 * th));
    return s;
  }

  // the steady state a sustained load settles to (what the bake prints)
  function settled(load) {
    var s = idle();
    for (var i = 0; i < 600; i++) step(s, load, 0.05);
    return s;
  }

  function stateName(s) {
    if (s.load >= 0.85) return 'redline';
    if (s.load >= 0.08 || s.rpm > 0) return 'working';
    return 'idle';
  }

  /* ---------- the one formatter ---------- */
  // Every visible readout AND its aria-live mirror call these. Nothing else
  // turns a state into words or digits.

  function nf(n) { return Math.round(n).toLocaleString('en-SG'); }

  function readout(s) {
    return {
      load: Math.round(s.load * 100),
      temp: Math.round(s.tC),
      rpm: Math.round(s.rpm / 10) * 10,
      watts: Math.round(s.w),
      state: stateName(s)
    };
  }

  function text(r) {
    return {
      load: r.load + '%',
      temp: r.temp + ' °C',
      rpm: r.rpm ? nf(r.rpm) + ' RPM' : 'Stopped',
      watts: r.watts + ' W',
      state: r.state === 'redline' ? 'Redline' : r.state === 'working' ? 'Working' : 'Idle'
    };
  }

  function sentence(r) {
    var t = text(r);
    return 'Load ' + t.load + ', GPU ' + t.temp + ', fans ' +
      (r.rpm ? 'at ' + t.rpm : 'stopped') + ', drawing ' + t.watts + '.';
  }

  g.REDLINE = {
    SPEC: SPEC,
    vramGB: vramGB, bandwidthGBs: bandwidthGBs, tflops: tflops,
    peakSystemW: peakSystemW, psuShare: psuShare, burnSamples: burnSamples,
    vsToday: vsToday, todayBandwidthGBs: todayBandwidthGBs, todayTflops: todayTflops, llmWeightsGB: llmWeightsGB, llmContextGB: llmContextGB,
    llmTotalGB: llmTotalGB, airM3h: airM3h, airCFM: airCFM, intakeRPM: intakeRPM,
    fanCurve: fanCurve, boardW: boardW, steadyC: steadyC, demand: demand,
    idle: idle, step: step, settled: settled, stateName: stateName,
    readout: readout, text: text, sentence: sentence, nf: nf
  };
})(typeof window !== 'undefined' ? window : globalThis);
