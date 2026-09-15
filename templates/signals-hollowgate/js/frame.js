/* ============================================================================
   HOLLOWGATE — the frame, and the locking that governs it.
   ----------------------------------------------------------------------------
   A signal box frame is not a row of switches. Tappet locking is a mechanical
   argument: every lever, when it is pulled, physically holds a set of other
   levers where they stand, and it cannot itself be pulled until the levers it
   depends on are already standing correctly. The consequence is the thing
   worth building — you do not get told off for setting a wrong route, you are
   simply unable to set one.

   Almost all of that behaviour comes out of one list per lever: `needs`. Read
   it forwards and it says what must be standing before this lever will move.
   Read it backwards and it says what this lever holds while it is reverse. In
   a real frame those are the same bars of steel, which is why they are the
   same array here, and why the locking table on frame.html is generated from
   this file rather than typed out beside it.

   One relationship refuses to be mutual, and it is worth the second field. A
   facing point lock is a bolt: while 5 is reverse the points it locks cannot
   move at all — but the points do not lock the bolt back, or you could never
   bolt points that were lying reverse. That is `locks`: a one-way hold, read
   from the locking lever outwards.

   Lever colours are the Railway Clearing House code, unchanged since the 1890s:
     red    stop signal        amber  distant signal
     black  points             blue   facing point lock
     brown  gate lever         white  spare
   ========================================================================= */

(function (global) {
  'use strict';

  /* --- the roll of levers ------------------------------------------------ */

  var LEVERS = [
    { n: 1,  colour: 'red',   kind: 'stop',
      fn: 'Down Home',
      detail: 'Protects the junction against a Down train running in from Thrushmoor Bank.',
      needs: [[9, 'N'], [13, 'R']] },

    { n: 2,  colour: 'amber', kind: 'distant',
      fn: 'Down Distant',
      detail: 'Cannot be cleared until every stop signal in advance of it is already off. Last off, first back.',
      needs: [[1, 'R'], [7, 'R']] },

    { n: 3,  colour: 'white', kind: 'spare',
      fn: 'Spare',
      detail: 'Left in the frame when the Down Goods Loop was lifted in 1962. The numbering was never closed up.',
      needs: [] },

    { n: 4,  colour: 'black', kind: 'points',
      fn: 'Points 4 — Quarry Branch junction',
      detail: 'Normal for the Down Main, reverse for the Quarry Branch. Facing points, so they carry a lock.',
      needs: [] },

    { n: 5,  colour: 'blue',  kind: 'lock',
      fn: 'Facing point lock on 4',
      detail: 'Drives a bolt through the stretcher bar so the blades cannot creep under a train. Reverse to bolt, whichever way 4 is lying.',
      needs: [], locks: [4] },

    { n: 6,  colour: 'black', kind: 'points',
      fn: 'Points 6 — crossover',
      detail: 'Down Main to Up Main, used for engine movements and for the Sunday engineer possessions.',
      needs: [] },

    { n: 7,  colour: 'red',   kind: 'stop',
      fn: 'Down Main Starting',
      detail: 'Sends a Down train on towards Calderfoot over the main leg of 4.',
      needs: [[4, 'N'], [5, 'R'], [8, 'N'], [13, 'R']] },

    { n: 8,  colour: 'red',   kind: 'stop',
      fn: 'Quarry Branch Starting',
      detail: 'Sends a Down train up the branch over the reverse leg of 4. Cannot stand off at the same time as 7.',
      needs: [[4, 'R'], [5, 'R'], [7, 'N'], [13, 'R']] },

    { n: 9,  colour: 'red',   kind: 'stop',
      fn: 'Up Home',
      detail: 'Reads in from Calderfoot. Opposed to 1, so the two can never be off together.',
      needs: [[1, 'N'], [13, 'R']] },

    { n: 10, colour: 'amber', kind: 'distant',
      fn: 'Up Distant',
      detail: 'The Up counterpart of 2, and bound by the same rule about the signals in advance of it.',
      needs: [[9, 'R'], [12, 'R']] },

    { n: 11, colour: 'white', kind: 'spare',
      fn: 'Spare',
      detail: 'Was the Up Goods Loop home until 1962. Nothing is connected to it now.',
      needs: [] },

    { n: 12, colour: 'red',   kind: 'stop',
      fn: 'Up Starting',
      detail: 'Sends an Up train away towards Thrushmoor Bank, clear of the crossover.',
      needs: [[6, 'N'], [13, 'R']] },

    { n: 13, colour: 'brown', kind: 'gate',
      fn: 'Gate lock — Hollowgate Lane',
      detail: 'Bolts the gates where they stand. Every running signal in the frame waits on this lever.',
      needs: [[14, 'R']] },

    { n: 14, colour: 'brown', kind: 'gate',
      fn: 'Gate stop lock',
      detail: 'Frees the gate wheel so the gates can be swung off the railway and across the road.',
      needs: [] },

    { n: 15, colour: 'black', kind: 'points',
      fn: 'Points 15 — goods shed siding',
      detail: 'Trailing points off the Up Main into the goods shed. Locked by 12 while an Up train is signalled away.',
      needs: [[12, 'N']] },

    { n: 16, colour: 'white', kind: 'spare',
      fn: 'Spare',
      detail: 'Cut out when the water column was removed. Painted white and left standing.',
      needs: [] }
  ];

  var BY_N = {};
  LEVERS.forEach(function (L) { L.locks = L.locks || []; BY_N[L.n] = L; });

  /* --- the locking itself ------------------------------------------------ */

  function blankState() {
    var s = {};
    LEVERS.forEach(function (L) { s[L.n] = 'N'; });
    return s;
  }

  function word(pos) { return pos === 'R' ? 'reverse' : 'normal'; }
  function name(n) { return n + ' (' + BY_N[n].fn.replace(/ —.*$/, '') + ')'; }

  /* Every lever that is reverse and that names `n` in its needs list is
     physically holding `n` where it stands. This is the backwards reading of
     the same table, and it is the whole of the release logic. */
  function holders(state, n) {
    var out = [];
    LEVERS.forEach(function (L) {
      if (state[L.n] !== 'R') return;
      L.needs.forEach(function (c) { if (c[0] === n) out.push([L.n, c[1]]); });
    });
    return out;
  }

  /* Can lever `n` move out of where it is? Returns either {ok:true,to:…} or a
     refusal carrying the lever that refused and a sentence saying why. */
  function attempt(state, n) {
    var L = BY_N[n];
    var to = state[n] === 'N' ? 'R' : 'N';

    if (L.kind === 'spare') {
      return { ok: false, by: n, to: to,
        text: n + ' is a spare lever',
        note: L.detail };
    }

    /* a bolt: one-way, and it pins the lever it locks in both directions */
    for (var b = 0; b < LEVERS.length; b++) {
      var B = LEVERS[b];
      if (state[B.n] !== 'R' || B.locks.indexOf(n) < 0) continue;
      return { ok: false, by: B.n, to: to,
        text: n + ' is bolted by ' + B.n + ' reverse',
        note: 'Lever ' + name(B.n) + ' is reverse, so the blades of ' + n +
              ' are bolted and cannot move either way until it is put back.' };
    }

    var held = holders(state, n);
    for (var i = 0; i < held.length; i++) {
      if (held[i][1] !== to) {
        return { ok: false, by: held[i][0], to: to,
          text: n + ' is held by ' + held[i][0] + ' reverse',
          note: 'Lever ' + name(held[i][0]) + ' is reverse, and while it is, it holds ' +
                n + ' ' + word(held[i][1]) + '. Put ' + held[i][0] + ' back first.' };
      }
    }

    /* A signal can always be replaced to danger, so its own conditions are
       only tested on the way out. Points are a movement in both directions,
       so they are tested both ways — which is what makes a facing point lock
       behave like a bolt rather than like a sequence. */
    if (to === 'R' || L.kind === 'points') {
      for (var j = 0; j < L.needs.length; j++) {
        var c = L.needs[j], want = c[1], at = state[c[0]];
        if (at !== want) {
          return { ok: false, by: c[0], to: to,
            text: n + ' is locked by ' + c[0] + ' ' + word(at),
            note: 'Lever ' + name(n) + ' will not move until ' + name(c[0]) +
                  ' stands ' + word(want) + '.' };
        }
      }
    }
    return { ok: true, to: to };
  }

  /* --- what the frame is currently saying -------------------------------- */

  function routes(s) {
    var gates = s[13] === 'R' && s[14] === 'R';
    return {
      gates:  gates,
      down:   gates && s[5] === 'R' && s[4] === 'N' && s[7] === 'R' && s[1] === 'R',
      quarry: gates && s[5] === 'R' && s[4] === 'R' && s[8] === 'R' && s[1] === 'R',
      up:     gates && s[6] === 'N' && s[9] === 'R' && s[12] === 'R'
    };
  }

  function reading(s) {
    var r = routes(s);
    var pulled = LEVERS.filter(function (L) { return s[L.n] === 'R'; }).length;

    if (r.down && s[2] === 'R') return { state: 'set',
      text: 'Route set · Down Main · distant off',
      note: 'Signals 1, 7 and 2 are off over the main leg of 4, bolted by 5, with the gates across the road. A Down train has a clear run through the junction to Calderfoot.' };
    if (r.down) return { state: 'set',
      text: 'Route set · Down Main to Calderfoot',
      note: 'The stop signals are off but 2 is still on, so the driver gets a caution at the distant and is expecting to be checked. Pull 2 to give a clear run.' };
    if (r.quarry) return { state: 'set',
      text: 'Route set · Down Quarry Branch',
      note: 'Points 4 are reverse and bolted by 5, and 8 is off for the branch. The Down Distant cannot be cleared for this route — 2 reads for the main only, which is the point of a distant.' };
    if (r.up && s[10] === 'R') return { state: 'set',
      text: 'Route set · Up Main · distant off',
      note: '9, 12 and 10 are off with the crossover normal. An Up train runs straight through towards Thrushmoor Bank.' };
    if (r.up) return { state: 'set',
      text: 'Route set · Up Main to Thrushmoor Bank',
      note: 'The stop signals are off for the Up road. 10 will follow once the frame allows it.' };
    if (pulled === 0) return { state: 'normal',
      text: 'Frame normal',
      note: 'Every lever is standing in the frame and every signal is at danger. Start with 14, then 13 — nothing that moves a train will answer until the gates are across the road and bolted.' };
    return { state: 'part',
      text: pulled + ' ' + (pulled === 1 ? 'lever' : 'levers') + ' reverse · no route set',
      note: 'Nothing on the ground gives a driver permission to move yet. A route needs the gates, the facing point lock, and both the home and the starting signal for one direction.' };
  }

  /* --- restoring the frame, in the only order the locking allows ---------- */

  function restoreOrder(state) {
    var sim = {}, order = [], guard = 0, moved, i, L;
    for (i in state) sim[i] = state[i];
    while (guard++ < 80) {
      moved = false;
      for (i = LEVERS.length - 1; i >= 0; i--) {
        L = LEVERS[i];
        if (sim[L.n] !== 'R') continue;
        if (attempt(sim, L.n).ok) { sim[L.n] = 'N'; order.push(L.n); moved = true; }
      }
      if (!moved) break;
    }
    return order;
  }

  global.HOLLOWGATE = {
    LEVERS: LEVERS,
    byNumber: function (n) { return BY_N[n]; },
    blankState: blankState,
    holders: holders,
    attempt: attempt,
    routes: routes,
    reading: reading,
    restoreOrder: restoreOrder,
    word: word
  };
})(window);
