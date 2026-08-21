/* WONDERYARD — the catalogue. One source of truth: worlds, attractions,
   tickets, hours. Everything the pages print (prices, counts, statuses,
   height rules) is computed from here, never typed twice. */
(function () {
  "use strict";

  var WY = {};

  /* ---------------- worlds ---------------- */
  WY.worlds = [
    {
      id: "yard",
      name: "The Yard",
      kicker: "The middle of everything",
      accent: "#e8a020",
      accentInk: "#3d2a05",
      blurb: "The park's beating centre. The Hundredhand waves on the hour, a brass band owns the bandstand, and every path in the park eventually brings you back here — usually hungrier than you left."
    },
    {
      id: "tilt",
      name: "Tilt",
      kicker: "For people who like their stomach elsewhere",
      accent: "#c8401e",
      accentInk: "#ffffff",
      blurb: "The tall district. Timber lattice, red steel, and the sound of forty people changing their minds at the top of a hill. Tilt is where WONDERYARD keeps its gravity experiments."
    },
    {
      id: "soak",
      name: "Soak",
      kicker: "You will not stay dry. That's the contract.",
      accent: "#157f96",
      accentInk: "#ffffff",
      blurb: "Mist arcs, splash lagoons, a river with opinions and a storm you control. Soak is the wet quarter of the park, and dryness here is considered a personal failing."
    },
    {
      id: "sideways",
      name: "Sideways",
      kicker: "Normal rules, slightly loosened",
      accent: "#6a4fa3",
      accentInk: "#ffffff",
      blurb: "A house that leans, doors that go nowhere in particular, a marble run you could lose a friend inside. Sideways is what happens when playground engineers stop being told no."
    },
    {
      id: "giants",
      name: "Little Giants",
      kicker: "Where the small people are the big people",
      accent: "#467f38",
      accentInk: "#ffffff",
      blurb: "Grass three metres tall. A picnic table you climb instead of sit at. Little Giants is scaled so the under-tens finally get to be the giants — grown-ups are welcome, at their own risk of feeling short."
    },
    {
      id: "afterdark",
      name: "Afterdark",
      kicker: "The park after sunset",
      accent: "#39c4d8",
      accentInk: "#0b0a14",
      blurb: "At sunset WONDERYARD doesn't close — it changes shift. Lanterns go up, the Night Market opens, rides run into the dark, and every night ends with exactly one firework. One. It's better that way."
    }
  ];

  /* ---------------- attractions ----------------
     type: coaster | ride | water | play | show | food | walk | ritual
     intensity: 1 calm … 5 ferocious
     minH: minimum height in cm (null = everyone)
     night: also runs after sunset
     sig: signature attraction (gets a big card on the walk) */
  WY.attractions = [
    /* THE YARD */
    { id: "hundredhand", world: "yard", name: "The Hundredhand", type: "ritual",
      intensity: 1, minH: null, night: true, sig: true,
      copy: "A tower of one hundred articulated steel hands above the plaza. On the hour, they wave. People wave back. Nobody has ever explained why, and nobody needs to." },
    { id: "otheranimals", world: "yard", name: "Carousel of Other Animals", type: "ride",
      intensity: 1, minH: null, night: true, sig: false,
      copy: "A carousel with no horses. Ride creatures that never existed and probably should — chosen by queue order, argued about for years." },
    { id: "signalstage", world: "yard", name: "Signal Stage", type: "show",
      intensity: 1, minH: null, night: true, sig: false,
      copy: "The open-air bandstand. Brass in the morning, drums at noon, something unclassifiable at four. Check the day's board and trust it." },
    { id: "snackworks", world: "yard", name: "The Snackworks", type: "food",
      intensity: 1, minH: null, night: false, sig: false,
      copy: "Twelve counters under one striped roof. The rule: nothing you could easily make at home, everything you can eat with one hand." },

    /* TILT */
    { id: "loosetooth", world: "tilt", name: "Loosetooth", type: "coaster",
      intensity: 5, minH: 132, night: true, sig: true,
      copy: "Our signature wood-and-steel hybrid. 47 metres up, 100 km/h down, and a first drop with a name we can't print on signage. It rattles exactly as much as it should." },
    { id: "grandfather", world: "tilt", name: "The Grandfather", type: "ride",
      intensity: 4, minH: 120, night: true, sig: false,
      copy: "A forty-metre pendulum that ticks. Each swing is one second on a clock that runs far too slowly to be measuring anything good." },
    { id: "vertigogarden", world: "tilt", name: "Vertigo Garden", type: "play",
      intensity: 3, minH: 110, night: false, sig: false,
      copy: "A high-ropes garden planted over the whole district. Cross it and you'll know more about your friends than you did at the gate." },

    /* SOAK */
    { id: "squall", world: "soak", name: "Squall", type: "water",
      intensity: 4, minH: 122, night: false, sig: true,
      copy: "A water coaster that ends in a splashdown you can hear from The Yard. The people on the bridge get wetter than the people in the boat. They know. It's why they're there." },
    { id: "millpond", world: "soak", name: "The Millpond", type: "water",
      intensity: 1, minH: null, night: false, sig: false,
      copy: "A lazy river with opinions. Mostly it drifts. Occasionally it decides you were getting too comfortable." },
    { id: "rainroom", world: "soak", name: "Rainroom", type: "play",
      intensity: 2, minH: null, night: false, sig: false,
      copy: "A glass hall where the weather answers to a brass wheel. Drizzle, downpour, sideways monsoon — you drive. Umbrellas available and pointless." },
    { id: "hosepipe", world: "soak", name: "The Hosepipe Rebellion", type: "play",
      intensity: 2, minH: null, night: false, sig: false,
      copy: "A splash battleground with pump stations, crossfire bridges and no neutral parties. Alliances form fast and end faster." },

    /* SIDEWAYS */
    { id: "upsidehouse", world: "sideways", name: "The Upside House", type: "walk",
      intensity: 2, minH: null, night: true, sig: true,
      copy: "A whole house at the wrong angle. Walk it upright while your eyes and ears file separate reports. Exit through the fireplace." },
    { id: "slowrace", world: "sideways", name: "The Slow Race", type: "play",
      intensity: 1, minH: null, night: false, sig: false,
      copy: "A racetrack where last place wins. Harder than it sounds. Much harder. The record is 41 minutes and it is fiercely defended." },
    { id: "marblerun", world: "sideways", name: "Marble Run", type: "play",
      intensity: 2, minH: null, night: false, sig: false,
      copy: "A marble run at architecture scale, rolling spheres the size of dogs through steel channels overhead. You operate the gates. Queues form for the good levers." },

    /* LITTLE GIANTS */
    { id: "tallgrass", world: "giants", name: "Tall Grass", type: "play",
      intensity: 1, minH: null, night: false, sig: true,
      copy: "A meadow at ant scale — grass over your head, ladybirds you can sit on. For the under-tens it's the one place in the world built to size." },
    { id: "thefort", world: "giants", name: "The Fort", type: "play",
      intensity: 2, minH: null, night: false, sig: false,
      copy: "Built, defended, lost and rebuilt roughly hourly. Soft ramparts, rope bridges, and a strict no-adults tower the adults keep trying to enter." },
    { id: "smallparade", world: "giants", name: "The Small Parade", type: "show",
      intensity: 1, minH: null, night: false, sig: false,
      copy: "Fifteen minutes, twice a day, led by whichever children volunteer at the gate. Chaotically punctual: 11:00 and 16:00." },

    /* AFTERDARK */
    { id: "lanternroute", world: "afterdark", name: "The Lantern Route", type: "walk",
      intensity: 1, minH: null, night: true, sig: false,
      copy: "A path of a thousand lanterns from The Yard to the lake. It opens when the sky goes indigo and closes when the firework says so." },
    { id: "nightmarket", world: "afterdark", name: "Night Market", type: "food",
      intensity: 1, minH: null, night: true, sig: false,
      copy: "Steam, smoke, skewers, sugar. The cooks change nightly, the queues move fast, and the best stall is always the one about to sell out." },
    { id: "lastfirework", world: "afterdark", name: "The Last Firework", type: "ritual",
      intensity: 1, minH: null, night: true, sig: true,
      copy: "Every night, at close, WONDERYARD launches exactly one firework over the lake. One. You will remember it longer than a thousand." }
  ];

  /* ---------------- practical ---------------- */
  WY.hours = { open: 10, close: 23, firework: "22:45", afterdarkFrom: 17 };

  WY.tickets = [
    { id: "day", name: "Full Day", price: 89, kids: 69,
      note: "Gate to firework. All six worlds, all day." },
    { id: "afterdark", name: "Afterdark", price: 49, kids: 39,
      note: "From 5pm. Night rides, Night Market, Lantern Route, the firework." },
    { id: "twoday", name: "Two Days", price: 149, kids: 115,
      note: "Any two days in the same season. The park is too big for one." }
  ];
  /* family bundle = 2 adults + 2 kids on Full Day, minus the bundle discount.
     Printed prices derive from these numbers in plan.js — never typed. */
  WY.familyBundle = { adults: 2, kids: 2, off: 36 };

  WY.typeLabel = {
    coaster: "Coaster", ride: "Ride", water: "Water", play: "Playground",
    show: "Live", food: "Food", walk: "Walk-through", ritual: "Ritual"
  };

  WY.worldById = function (id) {
    for (var i = 0; i < WY.worlds.length; i++) if (WY.worlds[i].id === id) return WY.worlds[i];
    return null;
  };

  /* ---------------- deterministic "now" ----------------
     Status is a pure function of clock time (and a stable per-id hash), so
     the board feels live without pretending to be a queue API. */
  function hash(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) % 997; }
    return h;
  }

  WY.statusFor = function (a, date) {
    var d = date || new Date();
    var h = d.getHours() + d.getMinutes() / 60;
    var open = WY.hours.open, close = WY.hours.close;
    if (h < open || h >= close) return { state: "closed", label: "Park closed" };

    if (a.id === "lastfirework") {
      return (h >= close - 0.5)
        ? { state: "now", label: "Any minute now" }
        : { state: "later", label: "Tonight " + WY.hours.firework };
    }
    if (a.id === "smallparade") {
      if (h >= 10.75 && h < 11.25) return { state: "now", label: "Rolling now" };
      if (h >= 15.75 && h < 16.25) return { state: "now", label: "Rolling now" };
      return { state: "later", label: "11:00 & 16:00" };
    }
    if (a.id === "hundredhand") {
      var m = d.getMinutes();
      if (m >= 57 || m < 3) return { state: "now", label: "Waving" };
      return { state: "later", label: "Waves on the hour" };
    }
    if (a.world === "afterdark" || (a.id === "lanternroute")) {
      return (h >= WY.hours.afterdarkFrom + 1.5)
        ? { state: "open", label: "Open" }
        : { state: "later", label: "From sunset" };
    }
    if (!a.night && h >= 20) return { state: "closed", label: "Done for today" };

    /* wait pseudo-minutes: intensity + stable jitter + midday hump */
    var hump = Math.max(0, 1 - Math.abs(h - 14.5) / 4.5);
    var wait = Math.round((a.intensity * 9 + (hash(a.id) % 14)) * (0.45 + hump * 0.8));
    if (a.type === "show" || a.type === "food" || a.type === "walk") {
      return { state: "open", label: "Open" };
    }
    if (wait <= 10) return { state: "open", label: "Walk on" };
    return { state: "open", label: "~" + wait + " min" };
  };

  window.WY = WY;
})();
