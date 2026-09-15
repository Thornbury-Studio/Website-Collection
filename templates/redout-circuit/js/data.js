/* REDOUT — the season, as data.
 *
 * Every figure the pages print is derived from this file at load time:
 * standings are summed from round results, gaps are differences of those sums,
 * the pilot grid the reaction test ranks you against is the reaction column
 * below, and every lap split the comparison tool draws comes out of one
 * seeded pace model. Nothing on the site is typed twice, so nothing can
 * disagree with itself.
 */
window.REDOUT = (function () {
  'use strict';

  var TEAMS = {
    kestrel:    { name: 'Kestrel',      base: 'Manchester' },
    ninefalls:  { name: 'Nine Falls',   base: 'Lisbon' },
    ferro:      { name: 'Ferro',        base: 'Turin' },
    ashiron:    { name: 'Ash & Iron',   base: 'Rotterdam' },
    tramontane: { name: 'Tramontane',   base: 'Marseille' },
    baltic:     { name: 'Baltic Wire',  base: 'Gdańsk' },
    monsoon:    { name: 'Monsoon',      base: 'Singapore' },
    kanda:      { name: 'Kanda',        base: 'Tokyo' }
  };

  /* reaction: seconds from tone to throttle, season average.
   * pace: multiplier on the circuit base lap; below 1 is quick.
   * line: how they fly, in the commentator's words. */
  var PILOTS = [
    { num: 1,  first: 'Sunniva',  last: 'Aakre',     code: 'AAK', nat: 'NOR', team: 'kestrel',    reaction: 0.161, pace: 0.984, since: 2022, line: 'Reigning champion. Flies the tightest line in the field and never looks like she is trying.' },
    { num: 7,  first: 'Inês',     last: 'Cardoso',   code: 'CAR', nat: 'PRT', team: 'ninefalls',  reaction: 0.146, pace: 0.981, since: 2023, line: 'Fastest off the tone in the league. Wins from the front or crashes trying, no third option.' },
    { num: 11, first: 'Dario',    last: 'Vescovi',   code: 'VES', nat: 'ITA', team: 'ferro',      reaction: 0.188, pace: 0.990, since: 2021, line: 'Four seasons in, still the best in dirty air. Passes where the gap has already closed.' },
    { num: 14, first: 'Teodor',   last: 'Lindqvist', code: 'LIN', nat: 'SWE', team: 'kestrel',    reaction: 0.204, pace: 0.996, since: 2024, line: 'Second-year pilot. Brakes later than anyone into the split gate and has the DNFs to prove it.' },
    { num: 19, first: 'Wen Jia',  last: 'Ho',        code: 'HOW', nat: 'SGP', team: 'monsoon',    reaction: 0.172, pace: 0.993, since: 2023, line: 'Came up through the Jurong indoor series. Dead smooth on the sticks, brutal on the last lap.' },
    { num: 22, first: 'Malik',    last: 'Osei',      code: 'OSE', nat: 'GHA', team: 'ashiron',    reaction: 0.179, pace: 0.997, since: 2022, line: 'The field’s best qualifier who has never won a final. This is the season that is supposed to change.' },
    { num: 23, first: 'Ana',      last: 'Ferraz',    code: 'FER', nat: 'BRA', team: 'tramontane', reaction: 0.213, pace: 1.002, since: 2024, line: 'Freestyle background. Takes gates inverted when a line calls for it, which it usually does not.' },
    { num: 27, first: 'Kacper',   last: 'Zieliński', code: 'ZIE', nat: 'POL', team: 'baltic',     reaction: 0.168, pace: 0.992, since: 2021, line: 'Home crowd at the Drydock. Six podiums in three seasons at Gdańsk and nowhere else.' },
    { num: 31, first: 'Rúben',    last: 'Tavares',   code: 'TAV', nat: 'PRT', team: 'ninefalls',  reaction: 0.222, pace: 1.004, since: 2023, line: 'Cardoso’s team-mate and her opposite: patient, tidy, points every weekend.' },
    { num: 34, first: 'Hana',     last: 'Kobayashi', code: 'KOB', nat: 'JPN', team: 'kanda',      reaction: 0.157, pace: 0.994, since: 2022, line: 'Flies the lowest of anyone through the tunnel sections, and has the scuffed canopy to show for it.' },
    { num: 40, first: 'Lukas',    last: 'Brandt',    code: 'BRA', nat: 'DEU', team: 'ashiron',    reaction: 0.238, pace: 1.008, since: 2021, line: 'Builds his own frames. Heaviest quad on the grid and does not care what you think about it.' },
    { num: 44, first: 'Priya',    last: 'Raman',     code: 'RAM', nat: 'IND', team: 'monsoon',    reaction: 0.197, pace: 1.001, since: 2024, line: 'Rookie of the year last season. Still learning to lose, which is the last thing you learn.' },
    { num: 51, first: 'Noor',     last: 'El-Sayed',  code: 'ELS', nat: 'EGY', team: 'tramontane', reaction: 0.209, pace: 1.006, since: 2023, line: 'Best pilot in the field at rebuilding between heats. Has finished races on three arms.' },
    { num: 58, first: 'Jonas',    last: 'Meyer',     code: 'MEY', nat: 'CHE', team: 'ferro',      reaction: 0.231, pace: 1.010, since: 2022, line: 'Never quick on Saturday, never out of the points on Sunday.' },
    { num: 63, first: 'Ola',      last: 'Nowak',     code: 'NOW', nat: 'POL', team: 'baltic',     reaction: 0.218, pace: 1.012, since: 2024, line: 'Second year. Crashed out of every round of her first season and came back anyway.' },
    { num: 77, first: 'Ren',      last: 'Takahashi', code: 'TAK', nat: 'JPN', team: 'kanda',      reaction: 0.184, pace: 0.999, since: 2021, line: 'Oldest pilot on the grid at thirty-one. Two rounds from retiring, allegedly, for the third year running.' }
  ];

  /* Finish order of every completed round. 16 entries; anything after the
   * `dnf` marker did not finish and scores nothing. */
  var DNF = 'dnf';
  var ROUNDS = [
    { n: 1, key: 'rotterdam', tz: 'Europe/Amsterdam',  city: 'Rotterdam',  venue: 'Gasworks Hall',    country: 'NLD', date: '2026-04-18T20:00:00+02:00', gates: 12, length: 612, base: 44.9,
      finish: [7, 1, 27, 11, 34, 19, 22, 31, 14, 77, 44, 58, 51, DNF, 23, 40, 63],
      course: [[8,30],[22,12],[40,8],[58,14],[72,28],[88,22],[92,40],[80,52],[62,48],[46,56],[28,52],[12,46]] },
    { n: 2, key: 'marseille', tz: 'Europe/Paris',  city: 'Marseille',  venue: 'Silo 9',           country: 'FRA', date: '2026-05-16T20:00:00+02:00', gates: 12, length: 588, base: 43.4,
      finish: [1, 7, 34, 19, 27, 11, 77, 22, 23, 44, 31, 51, 40, DNF, 14, 58, 63],
      course: [[10,48],[14,22],[30,10],[50,14],[64,6],[84,12],[90,30],[78,44],[88,56],[66,54],[44,52],[26,56]] },
    { n: 3, key: 'gdansk', tz: 'Europe/Warsaw',     city: 'Gdańsk',     venue: 'Drydock 4',        country: 'POL', date: '2026-06-13T20:00:00+02:00', gates: 12, length: 640, base: 46.2,
      finish: [11, 27, 7, 1, 19, 22, 34, 14, 63, 31, 77, 58, 44, DNF, 40, 23, 51],
      course: [[6,20],[24,8],[44,12],[52,30],[40,44],[56,54],[76,50],[92,36],[84,16],[70,26],[64,44],[20,50]] },
    { n: 4, key: 'manchester', tz: 'Europe/London', city: 'Manchester', venue: 'Cold Store',       country: 'GBR', date: '2026-07-18T20:00:00+01:00', gates: 12, length: 596, base: 44.1,
      finish: [7, 34, 1, 14, 11, 19, 27, 44, 77, 22, 31, 23, 40, 51, DNF, 58, 63],
      course: [[12,12],[36,8],[60,12],[86,10],[92,32],[74,40],[58,30],[42,38],[26,30],[10,40],[24,54],[52,56]] },
    { n: 5, key: 'turin', tz: 'Europe/Rome',      city: 'Turin',      venue: 'Foundry Shed',     country: 'ITA', date: '2026-09-05T20:00:00+02:00', gates: 12, length: 624, base: 45.3,
      finish: [1, 11, 7, 19, 34, 22, 27, 77, 31, 14, 51, 44, 58, 63, DNF, 23, 40],
      course: [[8,44],[10,18],[28,8],[48,16],[70,8],[90,18],[82,38],[66,48],[48,40],[34,52],[52,58],[22,56]] },
    { n: 6, key: 'lisbon', tz: 'Europe/Lisbon',     city: 'Lisbon',     venue: 'Cement Hall',      country: 'PRT', date: '2026-10-03T20:00:00+01:00', gates: 12, length: 632, base: 45.6,
      course: [[6,36],[16,12],[38,6],[56,16],[74,6],[92,14],[88,34],[72,44],[54,36],[38,46],[54,56],[20,54]] },
    { n: 7, key: 'singapore', tz: 'Asia/Singapore',  city: 'Singapore',  venue: 'Jurong Slipway',   country: 'SGP', date: '2026-11-07T20:00:00+08:00', gates: 12, length: 604, base: 44.4,
      course: [[10,14],[34,10],[56,8],[80,14],[92,30],[80,46],[62,40],[48,52],[30,44],[14,52],[26,30],[42,26]] },
    { n: 8, key: 'tokyo', tz: 'Asia/Tokyo',      city: 'Tokyo',      venue: 'Shinagawa Depot',  country: 'JPN', date: '2026-12-05T19:00:00+09:00', gates: 12, length: 660, base: 47.1,
      course: [[8,50],[6,24],[22,8],[46,12],[70,6],[92,12],[90,34],[74,50],[56,44],[40,56],[24,44],[38,30]] }
  ];

  /* Points by finishing position. A DNF is worth nothing, which is the point. */
  var POINTS = [25, 20, 16, 13, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0];

  /* Gate weights: how much of the lap each gate costs, relative. Twelve of
   * them sum to twelve so the base lap survives. The heavy ones are the
   * hairpin and the two tunnels; the light ones are the straights. */
  var GATE_W = [1.18, 0.86, 0.92, 1.10, 0.78, 1.24, 0.96, 0.88, 1.14, 0.82, 1.06, 1.06];

  var TICKETS = [
    { key: 'gateside', name: 'Gate-side', price: 48,  seat: 'Standing, at the rail', includes: ['Rail position on the split-gate straight', 'Live timing on the venue screens', 'Paddock open after the final'] },
    { key: 'pitlane',  name: 'Pit lane',  price: 95,  seat: 'Standing, pit side',    includes: ['Everything gate-side', 'Pit lane access between heats', 'Practice session on Friday night', 'Team radio on the venue app'] },
    { key: 'box',      name: 'Pilot’s box', price: 220, seat: 'Seated, goggle feed', includes: ['Everything pit lane', 'Reserved seat above the start gate', 'Any pilot’s goggle feed, live, on your own headset', 'Bar and food, all night'] }
  ];
  var SEASON_PASS = 640; /* eight rounds of pit lane, if you bought them one at a time, cost more than this */

  /* ------------------------------------------------------------------ */

  function byNum(num) {
    for (var i = 0; i < PILOTS.length; i++) if (PILOTS[i].num === num) return PILOTS[i];
    return null;
  }

  function roundByKey(key) {
    for (var i = 0; i < ROUNDS.length; i++) if (ROUNDS[i].key === key) return ROUNDS[i];
    return null;
  }

  function status(round, now) {
    now = now || new Date();
    var t = new Date(round.date).getTime();
    if (round.finish) return 'done';
    if (t - now.getTime() < -6 * 3600 * 1000) return 'done';
    var next = nextRound(now);
    return next && next.key === round.key ? 'next' : 'soon';
  }

  function nextRound(now) {
    now = now || new Date();
    for (var i = 0; i < ROUNDS.length; i++) {
      if (!ROUNDS[i].finish && new Date(ROUNDS[i].date).getTime() > now.getTime() - 6 * 3600 * 1000) return ROUNDS[i];
    }
    return null;
  }

  function completedRounds() {
    var out = [];
    for (var i = 0; i < ROUNDS.length; i++) if (ROUNDS[i].finish) out.push(ROUNDS[i]);
    return out;
  }

  /* Result of one pilot in one round: { pos, pts, dnf } */
  function result(round, num) {
    if (!round.finish) return null;
    var dnf = false, pos = 0;
    for (var i = 0; i < round.finish.length; i++) {
      var f = round.finish[i];
      if (f === DNF) { dnf = true; continue; }
      if (!dnf) pos++;
      if (f === num) return dnf ? { pos: null, pts: 0, dnf: true } : { pos: pos, pts: POINTS[pos - 1] || 0, dnf: false };
    }
    return null;
  }

  function winner(round) {
    return round.finish ? byNum(round.finish[0]) : null;
  }

  /* Standings after every completed round. Ties break on wins, then on
   * podiums, then on best finish, then on the lower number — the league's
   * own sporting regulations, article 9. */
  function standings() {
    var done = completedRounds();
    var rows = PILOTS.map(function (p) {
      var pts = 0, wins = 0, podiums = 0, dnfs = 0, best = 99, results = [];
      done.forEach(function (r) {
        var res = result(r, p.num);
        results.push(res);
        if (!res) return;
        pts += res.pts;
        if (res.dnf) { dnfs++; return; }
        if (res.pos === 1) wins++;
        if (res.pos <= 3) podiums++;
        if (res.pos < best) best = res.pos;
      });
      return { pilot: p, pts: pts, wins: wins, podiums: podiums, dnfs: dnfs, best: best, results: results };
    });
    rows.sort(function (a, b) {
      return (b.pts - a.pts) || (b.wins - a.wins) || (b.podiums - a.podiums) || (a.best - b.best) || (a.pilot.num - b.pilot.num);
    });
    rows.forEach(function (row, i) {
      row.pos = i + 1;
      row.gap = rows[0].pts - row.pts;
      row.interval = i === 0 ? 0 : rows[i - 1].pts - row.pts;
    });
    return rows;
  }

  /* ---- pace model -------------------------------------------------- */

  /* Deterministic noise in [-1, 1) from three small integers. Same inputs,
   * same lap, on every machine, forever. */
  function noise(a, b, c) {
    var h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0;
    h = (h ^ (h >>> 13)) * 1274126177 | 0;
    h = h ^ (h >>> 16);
    return ((h >>> 0) % 20000) / 10000 - 1;
  }

  /* Gate splits for a pilot's best lap of a round, in seconds.
   * Returns { splits: [12], cum: [12], total }. */
  function lap(pilot, round) {
    var splits = [], cum = [], t = 0;
    for (var g = 0; g < round.gates; g++) {
      var w = GATE_W[g % GATE_W.length];
      var s = (round.base / round.gates) * w * pilot.pace * (1 + noise(pilot.num, round.n, g) * 0.028);
      s = Math.round(s * 1000) / 1000;
      splits.push(s);
      t += s;
      cum.push(Math.round(t * 1000) / 1000);
    }
    return { splits: splits, cum: cum, total: Math.round(t * 1000) / 1000 };
  }

  /* Best lap of a round across the field, and who set it. */
  function fastestLap(round) {
    var best = null;
    PILOTS.forEach(function (p) {
      var l = lap(p, round);
      if (!best || l.total < best.lap.total) best = { pilot: p, lap: l };
    });
    return best;
  }

  /* Season fastest lap: the quickest of the completed rounds' fastest laps. */
  function seasonFastest() {
    var best = null;
    completedRounds().forEach(function (r) {
      var f = fastestLap(r);
      if (!best || f.lap.total < best.lap.total) best = { round: r, pilot: f.pilot, lap: f.lap };
    });
    return best;
  }

  /* Season DNF rate: every classified DNF over every start. */
  function dnfRate() {
    var starts = 0, dnfs = 0;
    completedRounds().forEach(function (r) {
      var after = false;
      r.finish.forEach(function (f) {
        if (f === DNF) { after = true; return; }
        starts++;
        if (after) dnfs++;
      });
    });
    return { starts: starts, dnfs: dnfs, rate: starts ? dnfs / starts : 0 };
  }

  /* Reaction grid: pilots sorted quickest first. */
  function reactionGrid() {
    return PILOTS.slice().sort(function (a, b) { return a.reaction - b.reaction; });
  }

  /* Format helpers shared by every page. */
  function fmtTime(s, dp) {
    dp = dp == null ? 3 : dp;
    if (s == null || isNaN(s)) return '—';
    return s.toFixed(dp);
  }
  /* Dates print in the venue's own time zone: a round in Lisbon is on the
   * 3rd wherever the reader is sitting. */
  function fmtDate(iso, opts, tz) {
    var d = new Date(iso);
    var o = {};
    var src = opts || { day: '2-digit', month: 'short' };
    for (var k in src) o[k] = src[k];
    if (tz) o.timeZone = tz;
    return d.toLocaleDateString('en-GB', o).replace('.', '');
  }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function roundCode(round) { return 'R' + pad2(round.n); }
  function money(eur) { return '€' + eur; }

  return {
    teams: TEAMS, pilots: PILOTS, rounds: ROUNDS, points: POINTS, tickets: TICKETS, seasonPass: SEASON_PASS,
    gateWeights: GATE_W,
    byNum: byNum, roundByKey: roundByKey, status: status, nextRound: nextRound, completedRounds: completedRounds,
    result: result, winner: winner, standings: standings, lap: lap, fastestLap: fastestLap, seasonFastest: seasonFastest,
    dnfRate: dnfRate, reactionGrid: reactionGrid,
    fmtTime: fmtTime, fmtDate: fmtDate, pad2: pad2, roundCode: roundCode, money: money
  };
})();
