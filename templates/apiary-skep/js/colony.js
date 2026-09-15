/* ==========================================================================
   SKEP — colony model
   --------------------------------------------------------------------------
   Pure. No DOM, no globals beyond the one namespace, no side effects. Every
   number printed anywhere on this site comes out of run() below, so this file
   is the one place a claim about the bees can be wrong.

   The shape it gets right, in order of how much it matters:

   1. Brood lag. A worker laid today does not fly today. Egg to emergence is
      21 days, so the colony that answers June's nectar flow was laid in May.
      Everything counter-intuitive about beekeeping falls out of this one lag —
      it is why a swarm in May costs you the August crop, and why feeding in
      July is already too late to build for it.
   2. Two lifespans. A summer bee wears her wings out foraging in ~38 days. A
      bee raised in September has never foraged, carries fat-body reserves and
      lives ~165 days: she is the one that has to still be alive in March. A
      colony does not "survive winter" — September's brood does.
   3. Foragers are a subset. The first ~20 days of a worker's life are spent
      inside. Population is not income.

   Deliberately not modelled: drone brood, supersedure, robbing, nosema, and
   varroa as a mite population of its own (it is one viability term on the
   winter cohort). See DESIGN.md, "Known simplifications".
   ========================================================================== */

(function (root) {
  'use strict';

  var DAYS = 365;

  /* --- forage calendar ----------------------------------------------------
     Welsh Marches. `peak` is kg/day at full bloom for FORAGE_BASE foragers.
     Bloom is a raised cosine across the window, not a step: hedgerows do not
     switch on. */
  var FORAGE_BASE = 30000;
  var FORAGE = [
    { key: 'willow',   name: 'Willow & blackthorn', from: 74,  to: 106, peak: 0.42 },
    { key: 'rape',     name: 'Oilseed rape',        from: 108, to: 142, peak: 2.70 },
    { key: 'sycamore', name: 'Sycamore',            from: 116, to: 140, peak: 0.85 },
    { key: 'hawthorn', name: 'Hawthorn',            from: 130, to: 154, peak: 0.95 },
    { key: 'clover',   name: 'White clover',        from: 163, to: 208, peak: 1.45 },
    { key: 'lime',     name: 'Lime',                from: 179, to: 198, peak: 1.90 },
    { key: 'balsam',   name: 'Himalayan balsam',    from: 214, to: 258, peak: 1.65 },
    { key: 'ivy',      name: 'Ivy',                 from: 261, to: 294, peak: 0.72 }
  ];

  function bloom(win, d) {
    if (d < win.from || d > win.to) return 0;
    var t = (d - win.from) / (win.to - win.from);
    return 0.5 - 0.5 * Math.cos(t * Math.PI * 2);
  }

  /* --- queen --------------------------------------------------------------
     Eggs/day. Nothing before February, a slow start on stores alone, peak in
     the third week of May, shut down by early October. Asymmetric on purpose:
     the climb is slower than the fall. */
  function layCurve(d) {
    if (d < 32 || d > 288) return 0;
    var peakDay = 143, v;
    if (d <= peakDay) v = Math.exp(-0.5 * Math.pow((d - peakDay) / 40, 2));
    else              v = Math.exp(-0.5 * Math.pow((d - peakDay) / 44, 2));
    var gate = Math.min(1, (d - 32) / 26) * Math.min(1, (288 - d) / 34);
    return 1820 * v * Math.max(0, gate);
  }

  /* A worker's expected life, by the day she emerged. */
  function lifespanFor(day, winterViability) {
    if (day >= 236 && day <= 306) return Math.round(165 * winterViability);
    if (day > 306) return Math.round(150 * winterViability);
    if (day < 92) return 48;
    return 38;
  }

  /* --- the run ------------------------------------------------------------
     opts: { swarm, split, wetJune, noTreat } — all booleans. */
  function run(opts) {
    opts = opts || {};

    var winterViability = opts.noTreat ? 0.62 : 1;
    var broodSurvival   = opts.noTreat ? 0.86 : 0.93;

    /* A swarm is only possible if you did not pre-empt it with a split. */
    var swarms   = !!opts.swarm && !opts.split;
    var swarmDay = 136;
    var splitDay = 121;

    /* Cohorts indexed by emergence day. Negative days are last autumn's winter
       bees, seeded so they die out through March as spring brood replaces
       them — the annual handover a single population number hides.

       Seeded on the days they actually emerged — 24 Aug to 2 Nov of the year
       before, i.e. days -129 to -59 — rather than "shortly before January".
       That is what puts real attrition into the cluster: carrying a 170-day
       life from a genuine emergence date, the oldest winter bees start dying
       in mid-February and the last are gone by late April, which is exactly
       the handover the spring brood has to outrun. Seed them all at once near
       day zero and the cluster sits flat until spring, which is the bug this
       replaced. */
    var cohorts = [], shares = [], shareSum = 0, SEED_N = 71;
    for (var k = 0; k < SEED_N; k++) {
      var share = Math.exp(-0.5 * Math.pow((k - 36) / 19, 2));
      shares.push(share);
      shareSum += share;
    }
    for (var k2 = 0; k2 < SEED_N; k2++) {
      cohorts.push({
        day: -(59 + k2),                    /* -59 (2 Nov) back to -129 (24 Aug) */
        n: 15500 * shares[k2] / shareSum,   /* normalise, or the cluster is whatever the maths happened to sum to */
        /* Graded, not uniform: the bees that emerged first in August are the
           first to die, from early January onward. A single shared lifespan
           makes the whole cluster expire in one week and leaves January
           perfectly flat, which no overwintering colony ever is. */
        life: Math.round((188 - 54 * (k2 / (SEED_N - 1))) * winterViability)
      });
    }

    var pop      = new Float64Array(DAYS),
        foragers = new Float64Array(DAYS),
        flying   = new Float64Array(DAYS),
        brood    = new Float64Array(DAYS),
        lay      = new Float64Array(DAYS),
        intake   = new Float64Array(DAYS),
        eaten    = new Float64Array(DAYS),
        stores   = new Float64Array(DAYS);

    var store = 16.5;              /* kg left on the hive last autumn */
    var starvedOn = -1, collapsedOn = -1, dead = false;
    var harvested = 0, harvests = [];
    var eggs = new Float64Array(DAYS + 22);

    for (var d = 0; d < DAYS; d++) {

      /* -- queen --
         The seasonal curve is what she *would* lay. What she actually lays is
         capped by the bees available to warm and feed the brood: roughly one
         egg per thirteen workers. This feedback is what makes the model a
         simulation rather than a drawn curve — it is the path by which a swarm
         in May is still visible in the September cluster, because the colony
         that raises the winter bees is the colony the swarm left behind. */
      var prevPop = d > 0 ? pop[d - 1] : 12000;
      /* Below roughly a cupful of bees a colony cannot hold brood temperature
         or defend the box, and it does not come back — so the floor is a latch,
         not a threshold it can cross twice. Without it the untreated case
         "recovers" from 36 bees in March, which is arithmetic, not biology. */
      if (!dead && d > 20 && prevPop < 250) dead = true;
      var L = dead ? 0 : Math.min(layCurve(d), prevPop * 0.077);
      if (swarms && d >= swarmDay && d < swarmDay + 24) L = 0;        /* virgin queen: broodless gap */
      if (opts.split && d >= splitDay && d < splitDay + 9) L *= 0.55; /* checked by the manipulation */
      if (store < 1.2) L = 0;                                         /* no stores, no brood */
      lay[d] = L;
      eggs[d] = L;

      /* -- emergence: laid 21 days ago -- */
      var src = d - 21;
      if (src >= 0 && eggs[src] > 0) {
        cohorts.push({ day: d, n: eggs[src] * broodSurvival, life: lifespanFor(d, winterViability) });
      }

      /* -- the beekeeper's hand -- */
      if (swarms && d === swarmDay) {
        for (var i = 0; i < cohorts.length; i++) cohorts[i].n *= 0.42;  /* the prime swarm leaves */
        store *= 0.78;                                                  /* and fills up before it goes */
      }
      if (opts.split && d === splitDay) {
        for (var j = 0; j < cohorts.length; j++) cohorts[j].n *= 0.74;  /* frames moved to the nuc */
      }

      /* -- census -- */
      var alive = 0, fly = 0;
      for (var c = 0; c < cohorts.length; c++) {
        var co = cohorts[c], age = d - co.day;
        if (age < 0 || age >= co.life) continue;
        alive += co.n;
        if (age >= 20) fly += co.n;          /* house bee for the first 20 days */
      }
      pop[d] = alive;
      foragers[d] = fly;

      /* capped + open brood presently in the box */
      var b = 0;
      for (var e = Math.max(0, d - 20); e <= d; e++) b += eggs[e];
      brood[d] = b;

      /* -- nectar -- */
      var flow = 0;
      for (var f = 0; f < FORAGE.length; f++) flow += FORAGE[f].peak * bloom(FORAGE[f], d);
      var weather = (opts.wetJune && d >= 152 && d <= 182) ? 0.16 : 1;
      var got = flow * (fly / FORAGE_BASE) * weather;
      intake[d] = got;

      /* `foragers` is how many bees are OLD ENOUGH to forage; `flying` is how
         many are actually out. In January those are 15,500 and nil — the
         cluster is full of bees three months past their house-bee weeks with
         nothing whatsoever to fly to. Reporting the first as the second is the
         kind of true-but-wrong figure a beekeeper would spot immediately. */
      flying[d] = (flow > 0.03) ? fly * Math.min(1, weather + 0.1) : 0;

      /* -- consumption: the cluster, plus every mouth in the brood nest -- */
      var use = alive * 3.1e-6 + b * 1.15e-5 + 0.012;
      eaten[d] = use;

      store += got - use;
      if (store <= 0) { store = 0; if (starvedOn < 0 && alive > 40) starvedOn = d; }

      /* -- the crop comes off twice, as each run of flows ends -- */
      if (d === 152 || d === 259) {
        var keep = (d === 152) ? 12 : 19;   /* spring: leave them working stores.
                                               autumn: leave enough to winter on. */
        if (store > keep) {
          var take = store - keep;
          harvested += take;
          harvests.push({ day: d, kg: take });
          store = keep;
        } else {
          harvests.push({ day: d, kg: 0 });
        }
      }

      stores[d] = store;
      if (collapsedOn < 0 && d > 30 && alive < 900) collapsedOn = d;
      if (dead) { lay[d] = 0; brood[d] = 0; }
    }

    var peak = 0, peakDay = 0;
    for (var p = 0; p < DAYS; p++) if (pop[p] > peak) { peak = pop[p]; peakDay = p; }

    return {
      pop: pop, foragers: foragers, flying: flying, brood: brood, lay: lay,
      intake: intake, eaten: eaten, stores: stores, forage: FORAGE,
      summary: {
        peak: Math.round(peak),
        peakDay: peakDay,
        harvested: harvested,
        harvests: harvests,
        springCrop: harvests[0] ? harvests[0].kg : 0,
        autumnCrop: harvests[1] ? harvests[1].kg : 0,
        wintering: stores[DAYS - 1],
        endPop: Math.round(pop[DAYS - 1]),
        starvedOn: starvedOn,
        collapsedOn: collapsedOn,
        survives: pop[DAYS - 1] > 4000 && stores[DAYS - 1] > 7
      }
    };
  }

  /* --- calendar helpers -------------------------------------------------- */
  var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var MLEN   = [31,28,31,30,31,30,31,31,30,31,30,31];

  function monthOf(d) {
    var t = 0;
    for (var m = 0; m < 12; m++) { t += MLEN[m]; if (d < t) return m; }
    return 11;
  }
  function dayStart(m) { var t = 0; for (var i = 0; i < m; i++) t += MLEN[i]; return t; }
  function label(d) {
    var m = monthOf(d);
    return (d - dayStart(m) + 1) + ' ' + MONTHS[m];
  }

  root.Colony = {
    run: run, DAYS: DAYS, FORAGE: FORAGE,
    MONTHS: MONTHS, MLEN: MLEN,
    monthOf: monthOf, dayStart: dayStart, label: label
  };

})(typeof window !== 'undefined' ? window : globalThis);

if (typeof module !== 'undefined' && module.exports) {
  module.exports = (typeof window !== 'undefined' ? window : globalThis).Colony;
}
