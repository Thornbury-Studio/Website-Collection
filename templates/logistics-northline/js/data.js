/* NORTHLINE — the network catalogue. One source of truth: the map scene,
   the exception feed and the consoles all read from here. */
(function () {
  "use strict";

  var NL = {};

  /* ---------------- nodes ----------------
     kind: port | factory | dc   status: ok | watch | alert */
  NL.nodes = [
    { id: "sha", name: "Shanghai",        kind: "port", lat: 31.23, lon: 121.49, status: "watch" },
    { id: "sin", name: "Singapore",       kind: "port", lat: 1.29,  lon: 103.85, status: "ok" },
    { id: "bus", name: "Busan",           kind: "port", lat: 35.10, lon: 129.04, status: "ok" },
    { id: "khh", name: "Kaohsiung",       kind: "port", lat: 22.61, lon: 120.28, status: "ok" },
    { id: "col", name: "Colombo",         kind: "port", lat: 6.95,  lon: 79.85,  status: "ok" },
    { id: "nsa", name: "Nhava Sheva",     kind: "port", lat: 18.95, lon: 72.95,  status: "watch" },
    { id: "jea", name: "Jebel Ali",       kind: "port", lat: 25.01, lon: 55.06,  status: "ok" },
    { id: "rot", name: "Rotterdam",       kind: "port", lat: 51.95, lon: 4.14,   status: "ok" },
    { id: "ham", name: "Hamburg",         kind: "port", lat: 53.54, lon: 9.98,   status: "ok" },
    { id: "alg", name: "Algeciras",       kind: "port", lat: 36.13, lon: -5.44,  status: "ok" },
    { id: "lax", name: "Los Angeles",     kind: "port", lat: 33.73, lon: -118.26, status: "ok" },
    { id: "nyc", name: "NY / NJ",         kind: "port", lat: 40.67, lon: -74.05, status: "ok" },
    { id: "sav", name: "Savannah",        kind: "port", lat: 32.12, lon: -81.14, status: "ok" },
    { id: "san", name: "Santos",          kind: "port", lat: -23.98, lon: -46.30, status: "ok" },
    { id: "suz", name: "Suzhou plant",    kind: "factory", lat: 31.30, lon: 120.60, status: "watch" },
    { id: "pen", name: "Penang plant",    kind: "factory", lat: 5.40,  lon: 100.30, status: "ok" },
    { id: "mty", name: "Monterrey plant", kind: "factory", lat: 25.70, lon: -100.30, status: "ok" },
    { id: "ein", name: "Eindhoven DC",    kind: "dc", lat: 51.40, lon: 5.50,   status: "ok" },
    { id: "chi", name: "Chicago DC",      kind: "dc", lat: 41.80, lon: -87.70, status: "ok" }
  ];

  /* ---------------- lanes ----------------
     conf: forecast confidence 0..1 · plan/forecast: transit days */
  NL.lanes = [
    { id: "sha-lax", from: "sha", to: "lax", conf: 0.81, plan: 14, fcst: 16.2, status: "watch" },
    { id: "sha-rot", from: "sha", to: "rot", conf: 0.62, plan: 31, fcst: 34.5, status: "alert" },
    { id: "sin-rot", from: "sin", to: "rot", conf: 0.88, plan: 26, fcst: 26.4, status: "ok" },
    { id: "sin-jea", from: "sin", to: "jea", conf: 0.93, plan: 7,  fcst: 7.1,  status: "ok" },
    { id: "bus-lax", from: "bus", to: "lax", conf: 0.90, plan: 11, fcst: 11.3, status: "ok" },
    { id: "sha-sin", from: "sha", to: "sin", conf: 0.71, plan: 5,  fcst: 6.4,  status: "watch" },
    { id: "nsa-rot", from: "nsa", to: "rot", conf: 0.77, plan: 22, fcst: 23.6, status: "watch" },
    { id: "alg-nyc", from: "alg", to: "nyc", conf: 0.91, plan: 10, fcst: 10.2, status: "ok" },
    { id: "sav-san", from: "sav", to: "san", conf: 0.89, plan: 12, fcst: 12.1, status: "ok" },
    { id: "sin-col", from: "sin", to: "col", conf: 0.92, plan: 4,  fcst: 4.0,  status: "ok" },
    { id: "khh-lax", from: "khh", to: "lax", conf: 0.87, plan: 13, fcst: 13.4, status: "ok" },
    { id: "jea-nsa", from: "jea", to: "nsa", conf: 0.90, plan: 4,  fcst: 4.1,  status: "ok" },
    { id: "rot-ham", from: "rot", to: "ham", conf: 0.97, plan: 1,  fcst: 1.0,  status: "ok" },
    { id: "col-alg", from: "col", to: "alg", conf: 0.84, plan: 13, fcst: 13.8, status: "ok" }
  ];

  /* vessels: lane + phase (0..1) + direction */
  NL.vessels = [
    { lane: "sha-lax", t: 0.36 }, { lane: "sha-rot", t: 0.61 },
    { lane: "sin-rot", t: 0.22 }, { lane: "bus-lax", t: 0.78 },
    { lane: "nsa-rot", t: 0.45 }, { lane: "alg-nyc", t: 0.55 },
    { lane: "sav-san", t: 0.30 }, { lane: "khh-lax", t: 0.12 },
    { lane: "sin-jea", t: 0.68 }, { lane: "col-alg", t: 0.84 }
  ];

  /* ---------------- risk zones ---------------- */
  NL.risks = [
    { id: "rz-sha", name: "Port congestion — Shanghai", lat: 31.23, lon: 121.49,
      r: 5, sev: "amber", note: "Dwell 4.1 d, +1.8 vs plan" },
    { id: "rz-scs", name: "Weather cell — South China Sea", lat: 15.0, lon: 114.0,
      r: 9, sev: "red", note: "Gale field crossing SHA–SIN and KHH lanes" },
    { id: "rz-red", name: "Transit advisory — Red Sea", lat: 15.5, lon: 41.5,
      r: 7, sev: "amber", note: "Escort scheduling adds 0.8–1.4 d variance" }
  ];

  /* ---------------- exceptions ----------------
     Severity drives chips and node pulses; refs tie rows to the scene. */
  NL.exceptions = [
    { id: "EX-4171", kind: "Congestion", sev: "amber", node: "sha",
      text: "Shanghai dwell at 4.1 d (+1.8 vs plan). 6 shipments exposed, first inventory impact 9 Oct.", when: "07:42" },
    { id: "EX-4166", kind: "Weather", sev: "red", node: "khh",
      text: "South China Sea gale field. Reroute via Kaohsiung proposed for 2 sailings — awaiting approval.", when: "06:15" },
    { id: "EX-4152", kind: "Supplier", sev: "watch", node: "suz",
      text: "Suzhou plant 2 lots behind schedule. Buffer covers 11 days at current run rate.", when: "05:58" },
    { id: "EX-4149", kind: "Customs", sev: "amber", node: "nsa",
      text: "Nhava Sheva clearance backlog ~36 h. Broker escalation filed, next update 14:00.", when: "05:31" },
    { id: "EX-4137", kind: "Capacity", sev: "info", node: "lax",
      text: "Trans-Pacific spot rates +12% w/w. Contract coverage holds through Q4.", when: "04:47" }
  ];

  /* ---------------- headline KPIs ---------------- */
  NL.kpis = [
    { k: "On-time (7 d)", v: "94.2%" },
    { k: "Open exceptions", v: String(5) },
    { k: "TEU in motion", v: "18,412" },
    { k: "Forecast window", v: "14 d" }
  ];

  /* ---------------- reroute scenario ---------------- */
  NL.reroute = {
    shipment: "NL-88213 · 2 × 40HC · brake actuators",
    from: "Shanghai", to: "Rotterdam", due: "21 Oct",
    options: [
      { name: "Current — via Suez", eta: "14 Oct", days: 34.5, conf: 0.62,
        cost: "—", co2: "—", flag: "Red Sea variance on escort schedule", rec: false },
      { name: "Reroute — via Cape", eta: "19 Oct", days: 39.4, conf: 0.90,
        cost: "+$1,840", co2: "+9%", flag: "Clears due date with 2 d margin", rec: true },
      { name: "Split — air for 1 pallet", eta: "9 Oct (air) / 19 Oct", days: null, conf: 0.94,
        cost: "+$6,300", co2: "+41%", flag: "Only if line-down risk is priced in", rec: false }
    ]
  };

  NL.nodeById = function (id) {
    for (var i = 0; i < NL.nodes.length; i++) if (NL.nodes[i].id === id) return NL.nodes[i];
    return null;
  };
  NL.laneById = function (id) {
    for (var i = 0; i < NL.lanes.length; i++) if (NL.lanes[i].id === id) return NL.lanes[i];
    return null;
  };

  window.NL = NL;
})();
