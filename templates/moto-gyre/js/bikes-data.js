/* GYRE — machine catalogue. Single source of truth.
   Only *declared engineering* lives here (mass, power, torque points, drag,
   battery). Every figure shown on the site — hp, power-to-weight, top speed,
   range, dyno curves — is COMPUTED from these numbers at runtime, so copy
   can never drift from the engineering. */
(function () {
  "use strict";

  var MACHINES = [
    {
      id: "apex",
      name: "APEX",
      cls: "Hypersport",
      line: "The corner, resolved.",
      story:
        "APEX exists for one instant: maximum lean, throttle opening, the halo pointed at the exit. A 65° V4 revs to fifteen thousand behind winglets that press the front tyre into the road it is trying to leave.",
      power: { type: "ice", layout: "1090cc 65° V4", redline: 15000 },
      massKg: 197,
      cdA: 0.32,
      seatMm: 848,
      wheelbaseMm: 1445,
      tankL: 16.5,
      /* torque curve: [rpm, Nm] — power is derived, never declared */
      curve: [[3000, 78], [5000, 96], [7000, 108], [9000, 118], [11000, 124], [12800, 121], [14200, 106], [15000, 88]],
      stage: "stage-apex",
      alt: "APEX hypersport: fully faired motorcycle with a glowing ring headlamp and winglets, in dark studio light",
      detail: { crop: "halo", label: "Halo optic, fairing nose" }
    },
    {
      id: "camber",
      name: "CAMBER",
      cls: "Naked performance",
      line: "Nothing between you and the machine.",
      story:
        "CAMBER wears no fairing because it has nothing to hide. The cast spine is the bodywork; the inline-three hangs from it like an exhibit. Short gearing, wide bar, and a chassis that treats every roundabout as a proposal.",
      power: { type: "ice", layout: "890cc inline-3", redline: 12400 },
      massKg: 182,
      cdA: 0.42,
      seatMm: 828,
      wheelbaseMm: 1408,
      tankL: 14,
      curve: [[2500, 68], [4000, 80], [5500, 88], [7000, 92], [9000, 93], [10500, 88], [11500, 79], [12400, 66]],
      stage: "stage-camber",
      alt: "CAMBER naked motorcycle: exposed inline-three engine, ring headlamp and cast spine frame, in dark studio light",
      detail: { crop: "spine", label: "Exposed spine casting" }
    },
    {
      id: "rake",
      name: "RAKE",
      cls: "Electric power cruiser",
      line: "All of the torque. None of the warning.",
      story:
        "RAKE is the long, low answer to a simple question: what does muscle look like when it doesn't need to breathe? Twin radial-flux motors feed a 300-section rear tyre through one belt — every newton-metre present from zero.",
      power: { type: "ev", layout: "Twin radial-flux motors", kWh: 21.4, whPerKm: 74 },
      massKg: 289,
      cdA: 0.48,
      seatMm: 678,
      wheelbaseMm: 1742,
      /* EV torque curve: [km/h, Nm at belt] — flat to base speed, then tapering */
      curve: [[0, 380], [40, 380], [80, 380], [110, 342], [140, 268], [170, 196], [190, 148]],
      peakKw: 102,
      stage: "stage-rake",
      alt: "RAKE electric cruiser: long low motorcycle with a wide rear tyre, ring headlamp and belt drive, in dark studio light",
      detail: { crop: "keel", label: "Battery keel, machined" }
    },
    {
      id: "trail",
      name: "TRAIL",
      cls: "Electric grand tourer",
      line: "Distance is a battery state of mind.",
      story:
        "TRAIL carries two packs, a tall screen and the patience of a machine that plans in provinces. It is the quiet argument that touring was never about fuel — it was about staying out longer than everyone else.",
      power: { type: "ev", layout: "Single radial-flux motor, dual pack", kWh: 29.6, whPerKm: 61 },
      massKg: 246,
      cdA: 0.36,
      seatMm: 812,
      wheelbaseMm: 1560,
      curve: [[0, 260], [40, 260], [90, 260], [120, 224], [150, 176], [180, 132], [205, 102]],
      peakKw: 96,
      stage: "stage-trail",
      alt: "TRAIL electric tourer: faired motorcycle with tall windscreen and ring headlamp, in dark studio light",
      detail: { crop: "fairing", label: "Touring prow, halo set deep" }
    },
    {
      id: "slip",
      name: "SLIP",
      cls: "Urban flyweight",
      line: "The city, at one third its usual mass.",
      story:
        "SLIP weighs less than its rider's excuses. A naked stalk of a machine — spine, motor, two wheels, a small bright halo — built to thread the morning like a needle and charge from a wall socket by lunch.",
      power: { type: "ev", layout: "Compact axial-flux motor", kWh: 9.6, whPerKm: 42 },
      massKg: 138,
      cdA: 0.44,
      seatMm: 790,
      wheelbaseMm: 1335,
      curve: [[0, 118], [30, 118], [60, 118], [80, 102], [100, 78], [115, 58], [125, 44]],
      peakKw: 30,
      stage: "stage-slip",
      alt: "SLIP lightweight electric motorcycle: slim naked frame with a small ring headlamp, in dark studio light",
      detail: { crop: "frame", label: "Open frame, visible motor" }
    }
  ];

  /* ---------------- derived physics ---------------- */

  var RHO = 1.204;      /* air density kg/m3 */
  var CRR = 0.015;      /* rolling resistance */
  var G = 9.81;
  var DRIVELINE = 0.9;  /* driveline efficiency for road-load solving */

  function peakPowerKw(m) {
    if (m.power.type === "ev") return m.peakKw;
    /* ICE: P(kW) = T(Nm) * rpm / 9549 — take the max over the declared curve */
    var best = 0;
    m.curve.forEach(function (pt) {
      var kw = (pt[1] * pt[0]) / 9549;
      if (kw > best) best = kw;
    });
    return best;
  }

  function hp(kw) { return kw * 1.341; }

  function peakTorque(m) {
    var best = 0;
    m.curve.forEach(function (pt) { if (pt[1] > best) best = pt[1]; });
    return best;
  }

  /* Top speed: solve P_avail = drag + rolling, numerically. */
  function topSpeedKmh(m) {
    var pW = peakPowerKw(m) * 1000 * DRIVELINE;
    var v = 30; /* m/s start */
    for (var i = 0; i < 60; i++) {
      var need = 0.5 * RHO * m.cdA * v * v * v + CRR * m.massKg * G * v;
      v = v * Math.pow(pW / need, 0.34);
    }
    return v * 3.6;
  }

  /* 0–100 estimate: torque-limited launch capped by traction, then power-limited. Coarse but honest. */
  function zeroToHundredS(m) {
    var v = 0, t = 0, dt = 0.02, target = 100 / 3.6;
    var pW = peakPowerKw(m) * 1000 * DRIVELINE;
    var aTraction = 0.95 * G; /* wheelie/traction cap */
    while (v < target && t < 20) {
      var aPower = v > 0.5 ? pW / (v * m.massKg) : aTraction;
      var drag = (0.5 * RHO * m.cdA * v * v + CRR * m.massKg * G) / m.massKg;
      var a = Math.min(aTraction, aPower) - drag;
      v += a * dt; t += dt;
    }
    return t;
  }

  function rangeKm(m) {
    if (m.power.type !== "ev") return null;
    return (m.power.kWh * 1000) / m.power.whPerKm;
  }

  function powerToWeight(m) { return hp(peakPowerKw(m)) / (m.massKg / 1000); } /* hp per tonne */

  function fmt(n, dp) { return Number(n).toFixed(dp == null ? 0 : dp); }

  window.GYRE = {
    machines: MACHINES,
    byId: function (id) {
      for (var i = 0; i < MACHINES.length; i++) if (MACHINES[i].id === id) return MACHINES[i];
      return null;
    },
    derive: function (m) {
      return {
        kw: peakPowerKw(m),
        hp: hp(peakPowerKw(m)),
        nm: peakTorque(m),
        top: topSpeedKmh(m),
        sprint: zeroToHundredS(m),
        range: rangeKm(m),
        ptw: powerToWeight(m)
      };
    },
    fmt: fmt,
    contactEmail: "ride@gyremotors.sg"
  };
})();
