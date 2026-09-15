/* VEXOR — machine catalogue. Single source of truth. */
(function (global) {
  "use strict";

  var MODELS = [
    {
      id: "line",
      name: "LINE",
      class: "Naked",
      year: 2026,
      priceSGD: 18900,
      powerKw: 88,
      torqueNm: 93,
      weightKg: 183,
      seatMm: 825,
      tankL: 14,
      topSpeedKmh: 225,
      zeroTo100: 3.4,
      available: true,
      featured: true,
      powertrain: "ice",
      layout: "890cc inline-3",
      line: "Nothing between you and the apex.",
      story:
        "LINE is the naked argument: short gearing, wide bar, exposed aluminium spar. Built to hold a corner line you chose on purpose.",
      highlights: [
        "Ride-by-wire with three maps",
        "Brembo Stylema front pair",
        "Cornering ABS as standard"
      ],
      colors: [
        { name: "Signal Red", hex: "#E11D2E" },
        { name: "Asphalt", hex: "#2A2E34" },
        { name: "Bone", hex: "#E8E4DC" }
      ],
      heroImg: "img/model-line.png",
      gallery: ["img/model-line.png"],
      alt: "VEXOR LINE naked motorcycle in dark studio, signal-red accents on asphalt ground"
    },
    {
      id: "hold",
      name: "HOLD",
      class: "Adventure",
      year: 2026,
      priceSGD: 24800,
      powerKw: 95,
      torqueNm: 105,
      weightKg: 214,
      seatMm: 860,
      tankL: 21,
      topSpeedKmh: 210,
      zeroTo100: 3.9,
      available: true,
      featured: true,
      powertrain: "ice",
      layout: "1090cc parallel-twin",
      line: "Distance without apology.",
      story:
        "HOLD carries fuel, luggage rails and long-travel suspension without softening the chassis. Singapore to the peninsula is a Tuesday, not a campaign.",
      highlights: [
        "21 L tank, 19-inch front",
        "Switchable ABS / TC modes",
        "TFT with phone nav mirror"
      ],
      colors: [
        { name: "Trail Grey", hex: "#6B7078" },
        { name: "Ink", hex: "#121418" },
        { name: "Signal Red", hex: "#E11D2E" }
      ],
      heroImg: "img/model-hold.png",
      gallery: ["img/model-hold.png"],
      alt: "VEXOR HOLD adventure motorcycle with tall screen and spoked wheels in dark studio"
    },
    {
      id: "arc",
      name: "ARC",
      class: "Sport",
      year: 2026,
      priceSGD: 32900,
      powerKw: 142,
      torqueNm: 114,
      weightKg: 198,
      seatMm: 835,
      tankL: 16.5,
      topSpeedKmh: 285,
      zeroTo100: 2.9,
      available: true,
      featured: false,
      powertrain: "ice",
      layout: "999cc inline-4",
      line: "The exit is the point.",
      story:
        "ARC exists for one job: open the throttle when the bike is still leaned. Winglets, a steep rake, and electronics that trust a committed rider.",
      highlights: [
        "Aero package with downforce vanes",
        "6-axis IMU rider aids",
        "Quickshifter up / down"
      ],
      colors: [
        { name: "Race White", hex: "#F4F2EC" },
        { name: "Ink", hex: "#0C0D0F" },
        { name: "Signal Red", hex: "#E11D2E" }
      ],
      heroImg: "img/model-arc.png",
      gallery: ["img/model-arc.png"],
      alt: "VEXOR ARC fully faired sport motorcycle with winglets in dark studio light"
    },
    {
      id: "span",
      name: "SPAN",
      class: "Touring",
      year: 2026,
      priceSGD: 27400,
      powerKw: 92,
      torqueNm: 118,
      weightKg: 248,
      seatMm: 820,
      tankL: 24,
      topSpeedKmh: 215,
      zeroTo100: 4.2,
      available: true,
      featured: false,
      powertrain: "ice",
      layout: "1200cc parallel-twin",
      line: "Hours, not minutes.",
      story:
        "SPAN is the long-line machine: heated grips, adjustable screen, soft bags that clip without drama. Built for riders who measure days in kilometres.",
      highlights: [
        "Electrically adjustable screen",
        "Cruise control standard",
        "Shaft drive, low maintenance"
      ],
      colors: [
        { name: "Midnight", hex: "#1A1C22" },
        { name: "Steel Blue", hex: "#4A5568" },
        { name: "Bone", hex: "#E8E4DC" }
      ],
      heroImg: "img/model-span.png",
      gallery: ["img/model-span.png"],
      alt: "VEXOR SPAN touring motorcycle with tall screen and soft luggage in dark studio"
    },
    {
      id: "volt",
      name: "VOLT",
      class: "Electric",
      year: 2026,
      priceSGD: 26500,
      powerKw: 110,
      torqueNm: 240,
      weightKg: 228,
      seatMm: 790,
      tankL: null,
      rangeKm: 280,
      topSpeedKmh: 200,
      zeroTo100: 3.1,
      available: true,
      featured: true,
      powertrain: "ev",
      layout: "Radial-flux motor, 18.4 kWh pack",
      line: "Torque from zero. Silence as a weapon.",
      story:
        "VOLT delivers belt-drive torque without a clutch apology. One charge covers a peninsula day; DC fast charge recovers the commute before lunch.",
      highlights: [
        "0–100 in 3.1 s",
        "280 km mixed-cycle range",
        "Regen levels selectable on bar"
      ],
      colors: [
        { name: "Volt White", hex: "#F2F0EA" },
        { name: "Ink", hex: "#0C0D0F" },
        { name: "Signal Red", hex: "#E11D2E" }
      ],
      heroImg: "img/model-volt.png",
      gallery: ["img/model-volt.png"],
      alt: "VEXOR VOLT electric motorcycle with clean fairing and belt drive in dark studio"
    },
    {
      id: "trace",
      name: "TRACE",
      class: "Heritage",
      year: 2026,
      priceSGD: 16400,
      powerKw: 54,
      torqueNm: 72,
      weightKg: 176,
      seatMm: 780,
      tankL: 13.5,
      topSpeedKmh: 175,
      zeroTo100: 5.1,
      available: true,
      featured: false,
      powertrain: "ice",
      layout: "650cc parallel-twin",
      line: "Modern manners. Older silhouette.",
      story:
        "TRACE keeps a round headlamp and a low seat, then quietly adds ABS, USB, and a chassis that does not chatter on broken tarmac. Heritage without the museum fee.",
      highlights: [
        "Low 780 mm seat",
        "LED round optic",
        "Dual-channel ABS"
      ],
      colors: [
        { name: "British Green", hex: "#1F3D2F" },
        { name: "Bone", hex: "#E8E4DC" },
        { name: "Ink", hex: "#0C0D0F" }
      ],
      heroImg: "img/model-trace.png",
      gallery: ["img/model-trace.png"],
      alt: "VEXOR TRACE heritage motorcycle with round headlamp and low seat in dark studio"
    }
  ];

  var LOCATIONS = [
    {
      id: "kallang",
      name: "VEXOR Hall Kallang",
      address: "12 Kallang Junction, Singapore 339266",
      hours: "Tue–Sun 10:00–19:00 · Closed Mon",
      phone: "+65 6248 9100",
      maps: "https://maps.google.com/?q=12+Kallang+Junction+Singapore"
    },
    {
      id: "jurong",
      name: "VEXOR West Jurong",
      address: "8 Boon Lay Way, #01-12 TradeHub 21, Singapore 609964",
      hours: "Wed–Sun 11:00–20:00 · Closed Mon–Tue",
      phone: "+65 6261 4400",
      maps: "https://maps.google.com/?q=8+Boon+Lay+Way+Singapore"
    }
  ];

  function byId(id) {
    for (var i = 0; i < MODELS.length; i++) {
      if (MODELS[i].id === id) return MODELS[i];
    }
    return null;
  }

  function powerToWeight(m) {
    return Math.round((m.powerKw / m.weightKg) * 1000) / 1000;
  }

  function formatSGD(n) {
    return "S$" + n.toLocaleString("en-SG");
  }

  function classes() {
    var map = {};
    MODELS.forEach(function (m) { map[m.class] = true; });
    return Object.keys(map);
  }

  global.VEXOR = {
    MODELS: MODELS,
    LOCATIONS: LOCATIONS,
    byId: byId,
    powerToWeight: powerToWeight,
    formatSGD: formatSGD,
    classes: classes
  };
})(typeof window !== "undefined" ? window : globalThis);
