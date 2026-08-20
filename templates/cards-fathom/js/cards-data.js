/* FATHOM — the archive. Single source of truth for every plate.
   All completion figures, rarity counts and set arithmetic on the site are
   computed from this file at runtime — never typed into copy. */
(function () {
  "use strict";

  var ZONES = {
    photic: { name: "Photic", depth: "0–200 m", order: 1 },
    twilight: { name: "Twilight", depth: "200–1,000 m", order: 2 },
    midnight: { name: "Midnight", depth: "1,000–4,000 m", order: 3 },
    abyssal: { name: "Abyssal", depth: "4,000–6,000 m", order: 4 },
    hadal: { name: "Hadal", depth: "6,000 m +", order: 5 }
  };

  var ESSENCES = {
    ember: { name: "Ember", color: "#ffa14f", note: "warm light" },
    volt: { name: "Volt", color: "#8be9ff", note: "storm light" },
    frost: { name: "Frost", color: "#cfeaff", note: "cold light" },
    bloom: { name: "Bloom", color: "#6ee8a6", note: "living light" },
    veil: { name: "Veil", color: "#b993ff", note: "absent light" },
    tide: { name: "Tide", color: "#5cb8ff", note: "moving light" }
  };

  /* Rarity ladder — a luminescence scale. `tier` drives every treatment. */
  var RARITIES = {
    drift: { name: "Drift", tier: 1, mark: "·" },
    glow: { name: "Glow", tier: 2, mark: "··" },
    pulse: { name: "Pulse", tier: 3, mark: "···" },
    beacon: { name: "Beacon", tier: 4, mark: "◈" },
    signature: { name: "Abyssal Signature", tier: 5, mark: "AS" }
  };

  var SET = {
    id: "descent-1",
    name: "Descent I — The Long Dark",
    short: "Descent I",
    teaser: { id: "descent-2", name: "Descent II — The Glass Gardens", status: "In preparation" }
  };

  /* ---- plates ----
     n: plate number in Descent I. art: image basename. kind: creature|field|full|signature.
     artOf: for Full Plate variants, the plate number whose art is reused.
     lumen: 0–100 survey light-output figure (sortable flavour stat).
     len: recorded specimen length. note: the field note — the personality. */
  var PLATES = [
    { n: 1, id: "copperling", name: "Copperling", kind: "creature", zone: "photic", ess: "tide", rar: "drift", lumen: 12, len: "9 cm",
      note: "Polishes its own scales against smooth coral every morning. Vain, and correct to be." },
    { n: 2, id: "sunmote", name: "Sunmote", kind: "creature", zone: "photic", ess: "bloom", rar: "drift", lumen: 18, len: "3 cm",
      note: "Farms a private galaxy of algae inside its bell. Refuses to share, shares anyway when it rains." },
    { n: 3, id: "brinepup", name: "Brinepup", kind: "creature", zone: "photic", ess: "tide", rar: "drift", lumen: 8, len: "62 cm",
      note: "Follows survey divers home. Three vessels in the fleet now have one on the crew manifest." },
    { n: 4, id: "glassveil", name: "Glassveil", kind: "creature", zone: "photic", ess: "veil", rar: "glow", lumen: 22, len: "1.1 m",
      note: "Near-perfect glass. Only its shadow gives it away, and it knows to swim above the light." },
    { n: 5, id: "lanternjaw", name: "Lanternjaw", kind: "creature", zone: "twilight", ess: "ember", rar: "glow", lumen: 41, len: "17 cm",
      note: "Dims its lure when watched. Survey footage shows it re-lighting the moment it thinks you've gone." },
    { n: 6, id: "murmurel", name: "Murmurel", kind: "creature", zone: "twilight", ess: "volt", rar: "drift", lumen: 26, len: "2.3 m",
      note: "Hums the pattern of currents that no longer run. Older charts match the song exactly." },
    { n: 7, id: "palegaze", name: "Palegaze", kind: "creature", zone: "twilight", ess: "frost", rar: "glow", lumen: 30, len: "24 cm",
      note: "Its thoughts are visible through the dome of its head. Legible, never. Beautiful, always." },
    { n: 8, id: "vesperwing", name: "Vesperwing", kind: "creature", zone: "twilight", ess: "veil", rar: "drift", lumen: 15, len: "5 cm",
      note: "Migrates by starlight it has never once seen. The stars, presumably, are flattered." },
    { n: 9, id: "cinderfin", name: "Cinderfin", kind: "creature", zone: "twilight", ess: "ember", rar: "drift", lumen: 34, len: "13 cm",
      note: "Runs hot. The water behind it whispers for a full minute after it has gone." },
    { n: 10, id: "tessellure", name: "Tessellure", kind: "creature", zone: "twilight", ess: "bloom", rar: "pulse", lumen: 47, len: "38 cm",
      note: "Repaints itself every dusk, tile by tile. Has never repeated a pattern. We checked." },
    { n: 11, id: "duskhound", name: "Duskhound", kind: "creature", zone: "midnight", ess: "veil", rar: "glow", lumen: 9, len: "80 cm",
      note: "Hunts in packs of five. Counts by teeth: one bright one each, four dark. The bright one leads." },
    { n: 12, id: "bellowdeep", name: "Bellowdeep", kind: "creature", zone: "midnight", ess: "tide", rar: "glow", lumen: 28, len: "1.8 m",
      note: "Its yawn measurably changes the local tide table. Try not to bore it." },
    { n: 13, id: "wickfish", name: "Wickfish", kind: "creature", zone: "midnight", ess: "ember", rar: "drift", lumen: 21, len: "11 cm",
      note: "Carries its flame under a hood of wax. The monks of the dark; they travel single file." },
    { n: 14, id: "faradrift", name: "Faradrift", kind: "creature", zone: "midnight", ess: "volt", rar: "pulse", lumen: 63, len: "29 cm",
      note: "Stores the lightning of the storm it was born under. Some are still carrying 1987." },
    { n: 15, id: "hollowhymn", name: "Hollowhymn", kind: "creature", zone: "midnight", ess: "veil", rar: "pulse", lumen: 37, len: "4 m (apparent)",
      note: "A choir of small fish schooling in the shape of one great fish that does not exist. It sings anyway." },
    { n: 16, id: "aurelume", name: "Aurelume", kind: "creature", zone: "midnight", ess: "bloom", rar: "beacon", lumen: 88, len: "19 m",
      note: "The aurora whale. Surfaces once a generation; the Survey has seen it twice and slept badly both times." },
    { n: 17, id: "coldcrown", name: "Coldcrown", kind: "creature", zone: "abyssal", ess: "frost", rar: "glow", lumen: 33, len: "74 cm",
      note: "Grows a crown of frost-light and holds court on the stone. The court: three sponges and us." },
    { n: 18, id: "mirrormaw", name: "Mirrormaw", kind: "creature", zone: "abyssal", ess: "veil", rar: "glow", lumen: 19, len: "42 cm",
      note: "Sees itself in every meal. The Survey's philosopher, for lack of other candidates." },
    { n: 19, id: "gravebloom", name: "Gravebloom", kind: "creature", zone: "abyssal", ess: "bloom", rar: "pulse", lumen: 52, len: "1.2 m",
      note: "A garden that walks. Plants itself on whale falls and tends what the dark forgets." },
    { n: 20, id: "threnody", name: "Threnody", kind: "creature", zone: "abyssal", ess: "frost", rar: "beacon", lumen: 91, len: "31 m",
      note: "A funeral procession of light, longer than the survey vessel. It is not mourning. We asked." },
    { n: 21, id: "undervolt", name: "Undervolt", kind: "creature", zone: "abyssal", ess: "volt", rar: "drift", lumen: 24, len: "58 cm",
      note: "Sleeps coiled around the old cables, dreaming in current. Bills no one." },
    { n: 22, id: "pressureheart", name: "Pressureheart", kind: "creature", zone: "hadal", ess: "tide", rar: "glow", lumen: 27, len: "21 cm",
      note: "Its shell rings like a bell at depth. The sound arrives before it does, and stays after." },
    { n: 23, id: "nightrose", name: "Nightrose", kind: "creature", zone: "hadal", ess: "ember", rar: "beacon", lumen: 84, len: "6 m",
      note: "Blooms once, at the bottom, for no one. The Survey happened to be there. It closed politely." },
    { n: 24, id: "stillwater", name: "Stillwater", kind: "creature", zone: "hadal", ess: "frost", rar: "drift", lumen: 6, len: "33 cm",
      note: "So calm the water forgets it is there. Our instruments did too, for eleven years." },

    { n: 25, id: "field-fringe", name: "The Sunlit Fringe", kind: "field", zone: "photic", ess: "bloom", rar: "glow", lumen: 70, len: "—",
      note: "Where the light still reaches. Every descent begins by leaving this behind." },
    { n: 26, id: "field-snowfall", name: "Marine Snowfall", kind: "field", zone: "twilight", ess: "frost", rar: "glow", lumen: 20, len: "—",
      note: "The slowest weather on Earth. Everything below is fed by this falling." },
    { n: 27, id: "field-whalefall", name: "The Whale Fall", kind: "field", zone: "abyssal", ess: "bloom", rar: "pulse", lumen: 44, len: "—",
      note: "A giant becomes a city. Rent is free and everyone pays it forward." },
    { n: 28, id: "field-gate", name: "The Hadal Gate", kind: "field", zone: "hadal", ess: "veil", rar: "pulse", lumen: 5, len: "—",
      note: "The trench mouth. The Survey's charts end here; the plates do not." },

    { n: 29, id: "fp-lanternjaw", name: "Lanternjaw", kind: "full", artOf: 5, zone: "twilight", ess: "ember", rar: "pulse", lumen: 41, len: "17 cm",
      note: "Full Plate. The lure at full candle — a courtesy it extends only to the patient." },
    { n: 30, id: "fp-tessellure", name: "Tessellure", kind: "full", artOf: 10, zone: "twilight", ess: "bloom", rar: "pulse", lumen: 47, len: "38 cm",
      note: "Full Plate. Tonight's pattern, never to be repeated. You were there." },
    { n: 31, id: "fp-hollowhymn", name: "Hollowhymn", kind: "full", artOf: 15, zone: "midnight", ess: "veil", rar: "pulse", lumen: 37, len: "4 m (apparent)",
      note: "Full Plate. The whole choir, mid-verse. The great fish almost believes in itself." },
    { n: 32, id: "fp-aurelume", name: "Aurelume", kind: "full", artOf: 16, zone: "midnight", ess: "bloom", rar: "beacon", lumen: 88, len: "19 m",
      note: "Full Plate. The second sighting, uncropped. The curtains of light run edge to edge." },
    { n: 33, id: "fp-threnody", name: "Threnody", kind: "full", artOf: 20, zone: "abyssal", ess: "frost", rar: "beacon", lumen: 91, len: "31 m",
      note: "Full Plate. The procession passes for eleven minutes. This is minute six." },
    { n: 34, id: "fp-nightrose", name: "Nightrose", kind: "full", artOf: 23, zone: "hadal", ess: "ember", rar: "beacon", lumen: 84, len: "6 m",
      note: "Full Plate. The bloom, entire. Printed once per archive, out of respect." },

    { n: 35, id: "as-warden", name: "The Warden", kind: "signature", serial: "AS-01", zone: "hadal", ess: "veil", rar: "signature", lumen: 97, len: "unresolved",
      note: "The trench keeps one law and this is it. Recorded once, by accident, in full." },
    { n: 36, id: "as-first-lantern", name: "First Lantern", kind: "signature", serial: "AS-02", zone: "hadal", ess: "ember", rar: "signature", lumen: 100, len: "unresolved",
      note: "The oldest light in the sea. Every lure that has ever glowed descends from this one." }
  ];

  function byN(n) { for (var i = 0; i < PLATES.length; i++) if (PLATES[i].n === n) return PLATES[i]; return null; }
  function artBase(p) { return p.kind === "full" ? byN(p.artOf).id : p.id; }
  function pad(n) { return (n < 10 ? "0" : "") + n; }

  window.FATHOM = {
    zones: ZONES,
    essences: ESSENCES,
    rarities: RARITIES,
    set: SET,
    plates: PLATES,
    byN: byN,
    byId: function (id) { for (var i = 0; i < PLATES.length; i++) if (PLATES[i].id === id) return PLATES[i]; return null; },
    artBase: artBase,
    pad: pad
  };
})();
