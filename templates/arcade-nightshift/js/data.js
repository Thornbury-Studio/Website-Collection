/* NIGHTSHIFT — the catalogue. Zones, machines, pricing, hours, and the
   ops-portal data. Everything printed on the pages derives from here. */
(function () {
  "use strict";

  var NS = {};

  /* ---------------- zones ---------------- */
  NS.zones = [
    { id: "grid", name: "GRID", kicker: "The racing arena",
      blurb: "Four networked motion pods and a twin drift cab, raced under one suspended leaderboard. Qualifying runs all night; the wall remembers everything." },
    { id: "volt", name: "VOLT", kicker: "Rhythm & reaction",
      blurb: "The loud corner. A nine-pad rhythm wall, a wall of a hundred and twenty buttons, and footwork cabinets that have ended friendships." },
    { id: "arena", name: "ARENA", kicker: "Competitive multiplayer",
      blurb: "Six-seat co-op pods and a proper 5v5 stage with a casters' desk. Book it with your team or turn up and get drafted." },
    { id: "vault", name: "VAULT", kicker: "The prize gallery",
      blurb: "Redemption, presented like a gallery: glass cases, real spotlights, and prizes worth the walk. The case lighting runs on its own schedule." },
    { id: "sidequest", name: "SIDEQUEST", kicker: "The strange corridor",
      blurb: "A corridor of small machines that exist nowhere else. One has a single button. One has a telephone. One is just a column of light. People get attached." },
    { id: "table", name: "TABLE", kicker: "Food & social",
      blurb: "Burgers, baskets, cold drinks and a view of the floor. Kitchen runs to one, which is later than you think you'll need and exactly as late as you will." },
    { id: "rooms", name: "ROOMS", kicker: "Private hires",
      blurb: "Four private rooms for crews, birthdays and grudge matches. Your machines, your playlist, your door." }
  ];

  /* ---------------- machines ----------------
     kind: racing | rhythm | reaction | coop | stage | redemption | oddity
     service: one line of history; keep almost all of them mundane. */
  NS.machines = [
    { id: "hairpin", model: "NS-GRD-01", name: "Hairpin", zone: "grid",
      players: "4", kind: "racing", sig: true,
      copy: "Four enclosed motion pods on one live circuit. The pods lean into every corner; your stomach files a complaint one apex late.",
      service: "Pod 3 seat runner replaced twice this year." },
    { id: "overcut", model: "NS-GRD-02", name: "Overcut", zone: "grid",
      players: "2", kind: "racing", sig: false,
      copy: "Twin drift cabs with a clutch pedal that actually matters. Best enjoyed by exactly two people who used to be friends.",
      service: "Clutch return spring on cab B renewed quarterly." },
    { id: "tempozero", model: "NS-VLT-01", name: "Tempo Zero", zone: "volt",
      players: "1", kind: "rhythm", sig: true,
      copy: "A nine-pad wall that starts polite and ends personal. The top grade has been reached four times. Twice by the same person.",
      service: "Attract board replaced three times — cause not found." },
    { id: "flicker", model: "NS-VLT-02", name: "Flicker", zone: "volt",
      players: "1–2", kind: "reaction", sig: false,
      copy: "A hundred and twenty buttons, sixty seconds, one wall of light. Clear it and the whole zone hears about it.",
      service: "Buttons re-seated on rolling schedule; 14 spares on site." },
    { id: "slipstep", model: "NS-VLT-03", name: "Slipstep", zone: "volt",
      players: "1–2", kind: "rhythm", sig: false,
      copy: "Footwork cabinet. The floor tells you where to be; your feet disagree; the crowd takes the floor's side.",
      service: "Deck panels rotated monthly for even wear." },
    { id: "fireteam", model: "NS-ARN-01", name: "Fireteam Six", zone: "arena",
      players: "6", kind: "coop", sig: true,
      copy: "A six-seat pod for one shared campaign. Nobody drives alone; every seat has one job and one excuse.",
      service: "Headset cables replaced venue-wide in June." },
    { id: "kingmaker", model: "NS-ARN-02", name: "Kingmaker", zone: "arena",
      players: "10", kind: "stage", sig: false,
      copy: "The 5v5 stage, with a casters' desk we will absolutely let your friend use. Monthly open runs on the last Saturday.",
      service: "Stage lighting rig inspected annually. Passed." },
    { id: "thecase", model: "NS-VAU-01", name: "The Case", zone: "vault",
      players: "—", kind: "redemption", sig: true,
      copy: "The glass wall at the end of the night. Everything in it can be won; the top shelf takes roughly a season of Fridays.",
      service: "Case lighting on its own circuit since fit-out." },
    { id: "penthouse", model: "NS-VAU-02", name: "Penthouse", zone: "vault",
      players: "1", kind: "redemption", sig: false,
      copy: "A stacker built like a lift going up a tower. Floor by floor, steadier hands. The top floor pays out the case.",
      service: "Belt tension checked weekly." },
    { id: "longestminute", model: "NS-SDQ-01", name: "The Longest Minute", zone: "sidequest",
      players: "1", kind: "oddity", sig: false,
      copy: "Hold the button for exactly sixty seconds. No clock is provided. Closest attempt this year: 60.4.",
      service: "Button rated to two million presses. It will outlive us." },
    { id: "dialtone", model: "NS-SDQ-02", name: "Dial Tone", zone: "sidequest",
      players: "1", kind: "oddity", sig: false,
      copy: "A rotary phone on a cabinet. Sometimes it rings. If you answer, the game starts. We don't decide when it rings.",
      service: "Reported ringing while unplugged. Could not reproduce." },
    { id: "queue", model: "NS-SDQ-03", name: "Queue", zone: "sidequest",
      players: "∞", kind: "oddity", sig: false,
      copy: "A game about waiting. There is usually a queue for it. We are aware of what we have done.",
      service: "No moving parts. Nothing to service. Somehow still warm." },
    { id: "lighthouse", model: "NS-SDQ-04", name: "Lighthouse", zone: "sidequest",
      players: "1", kind: "oddity", sig: false,
      copy: "A single column of light. Catch it at the top. That's the whole game. Nobody has.",
      service: "Lamp replaced once. The old one is in lost property." }
  ];

  /* ---------------- practical ---------------- */
  NS.hours = { open: "10:00", close: "02:00", kitchen: "01:00", lastRace: "01:40" };

  /* Night Pass: pay X, get credits. Bonus % printed is computed. */
  NS.topups = [
    { pay: 20, credits: 200 },
    { pay: 50, credits: 550 },
    { pay: 100, credits: 1200 }
  ];
  NS.playCost = { min: 8, max: 20 };   /* credits per game */
  NS.rooms = { perHour: 120, capacity: 10, minHours: 2 };

  NS.leagues = [
    { day: "Tuesday", name: "Tempo Tuesday", what: "VOLT ladder night — Tempo Zero and Flicker brackets from 8pm." },
    { day: "Friday", name: "Lock-In", what: "GRID time-attack from 11pm. Wall resets at close; your lap doesn't." },
    { day: "Last Saturday", name: "Kingmaker Open", what: "Monthly 5v5. Sixteen teams, casters' desk live, winners on The Case." }
  ];

  /* ---------------- ops portal ---------------- */
  NS.cams = [
    { cam: "CAM 01", area: "FLOOR — MAIN", img: "floor", status: "live" },
    { cam: "CAM 02", area: "GRID", img: "grid", status: "live" },
    { cam: "CAM 03", area: "VOLT", img: "volt", status: "live" },
    { cam: "CAM 04", area: "VAULT", img: "vault", status: "live",
      note: "Case lighting ON — outside schedule" },
    { cam: "CAM 05", area: "TABLE", img: "table", status: "live" },
    { cam: "CAM 06", area: "SIDEQUEST — CORRIDOR", img: "sidequest", status: "live" },
    { cam: "CAM 07", area: "SIDEQUEST — END", img: null, status: "nosignal",
      note: "Signal lost 02:13 — ticket #4471" }
  ];

  NS.opsLog = [
    { t: "01:58:12", text: "Last guests out. Head count reconciled: 0." },
    { t: "02:00:00", text: "Close procedure complete. House lights to night level." },
    { t: "02:13:41", text: "CAM 07 (SIDEQUEST — END) signal lost. Ticket auto-raised (#4471).", flag: true },
    { t: "02:31:02", text: "VAULT case lighting ON — outside lighting schedule.", flag: true },
    { t: "02:44:17", text: "Attract loop active: NS-VLT-01. Power plan says standby.", flag: true },
    { t: "02:52:—", text: "Motion event, GRID. Reviewed. No person found." }
  ];

  NS.lostProperty = [
    "One left glove, grey.",
    "Prescription glasses, black frames, strong.",
    "A Night Pass holding 41,000 credits. Unclaimed since March.",
    "A lamp. (Internal — see NS-SDQ-04 service history.)"
  ];

  /* computed view of a top-up: bonus % against the entry tier, and a games
     range from the play-cost band — figures derive, never typed. */
  NS.topupView = function (t) {
    var base = NS.topups[0].credits / NS.topups[0].pay;
    return {
      pay: t.pay,
      credits: t.credits,
      bonusPct: Math.round((t.credits / t.pay / base - 1) * 100),
      games: Math.floor(t.credits / NS.playCost.max) + "–" + Math.floor(t.credits / NS.playCost.min)
    };
  };

  NS.zoneById = function (id) {
    for (var i = 0; i < NS.zones.length; i++) if (NS.zones[i].id === id) return NS.zones[i];
    return null;
  };

  window.NS = NS;
})();
