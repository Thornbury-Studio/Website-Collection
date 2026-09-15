/* ==========================================================================
   CRANSLEY SIGNAL WORKS — the interlocking.

   One rule generates the whole frame's behaviour in both directions:

     A lever may move (either way) only if, in the RESULTING state, every
     reversed lever's conditions are still satisfied — its own included.

   That single rule produces everything a tappet frame does: a signal cannot
   be pulled over unset points; points cannot be moved under a cleared
   signal; a facing point lock cannot be restored while the signal it
   released is off. Nothing here is a special case except the facing point
   lock itself, which holds its points in whichever position it found them
   (bothWays) rather than in one nominated position.
   ========================================================================== */
(function () {
  'use strict';

  /* ---- the locking table -------------------------------------------------
     req      : conditions that must hold for this lever to stand REVERSE
     bothWays : levers this one holds still in EITHER position while reverse
  ------------------------------------------------------------------------ */
  var LEVERS = [
    { n: 1,  c: 'dist',  fn: 'Down Distant',
      desc: 'Caution signal for the down road. Comes off only when every stop signal ahead of it is off.',
      req: ['2R', '6R'] },

    { n: 2,  c: 'stop',  fn: 'Down Home — Main',
      desc: 'Stop signal at the country end, reading from the down main into the down platform road.',
      req: ['17R', '4R', '5N'] },

    { n: 3,  c: 'stop',  fn: 'Down Home — Loop',
      desc: 'The short arm on the same bracket, reading from the down main into the down loop.',
      req: ['17R', '4R', '5R'] },

    { n: 4,  c: 'fpl',   fn: 'Facing point lock, No. 5', short: 'the facing point lock',
      desc: 'Drives a bolt through the switch rails of No. 5. Nothing may read over facing points until this is bolted.',
      req: [], bothWays: [5] },

    { n: 5,  c: 'pts',   fn: 'Points — down loop entry',
      desc: 'Facing points for down trains. Normal for the platform road, reverse for the loop.',
      req: [] },

    { n: 6,  c: 'stop',  fn: 'Down Starter',
      desc: 'Stop signal at the platform end, giving a down train the section beyond the junction.',
      req: ['8N'] },

    { n: 7,  c: 'stop',  fn: 'Down Loop Starter',
      desc: 'Stop signal at the loop exit, returning a train from the loop to the down main.',
      req: ['8R'] },

    { n: 8,  c: 'pts',   fn: 'Points — down loop exit',
      desc: 'Trailing points where the loop rejoins the down main. No facing lock needed; nothing runs over them facing.',
      req: [] },

    { n: 9,  c: 'spare', fn: 'Spare',
      desc: 'White plate. The frame was built with two spare levers and the railway has never needed either.',
      req: ['never'] },

    { n: 10, c: 'pts',   fn: 'Ground disc — yard to up main',
      desc: 'Shunt signal releasing a movement out of the goods yard onto the up main.',
      req: ['11R', '13N', '14N'] },

    { n: 11, c: 'pts',   fn: 'Points — up yard',
      desc: 'Trailing connection from the up main into the goods yard.',
      req: [] },

    { n: 12, c: 'pts',   fn: 'Ground disc — up main to yard',
      desc: 'Shunt signal for a movement setting back off the up main into the yard.',
      req: ['11R', '13N', '14N'] },

    { n: 13, c: 'stop',  fn: 'Up Home',
      desc: 'Stop signal protecting the yard connection, reading into the up platform road.',
      req: ['11N', '10N', '12N'] },

    { n: 14, c: 'stop',  fn: 'Up Starter',
      desc: 'Stop signal at the far end of the up platform, over the crossing and into the section.',
      req: ['17R', '11N', '10N', '12N'] },

    { n: 15, c: 'dist',  fn: 'Up Distant',
      desc: 'Caution signal for the up road, slotted behind both up stop signals.',
      req: ['13R', '14R'] },

    { n: 16, c: 'gate',  fn: 'Level crossing gates',
      desc: 'Wheel-worked gates on the B4368. Pull to swing them across the road and open the railway.',
      req: [] },

    { n: 17, c: 'gate',  fn: 'Gate bolt & wicket lock',
      desc: 'Bolts the gates in the road position and locks the pedestrian wickets. No home or starter comes off until this is in.',
      req: ['16R'] },

    { n: 18, c: 'spare', fn: 'Spare',
      desc: 'White plate. Left in the frame in 1897 for a goods loop that was surveyed, costed and never built.',
      req: ['never'] }
  ];

  var COLOUR_NAME = {
    stop: 'Stop signal', dist: 'Distant signal', pts: 'Points / shunt',
    fpl: 'Facing point lock', gate: 'Gate gear', spare: 'Spare'
  };

  /* ---- diagram wiring ---- */
  var SIGNALS = [1, 2, 3, 6, 7, 13, 14, 15];
  var DISCS   = [10, 12];
  var POINTS  = [5, 8, 11];

  var TASKS = [
    { id: 'a', need: [17, 4, 5, 3], note: 'Down stopper accepted into the loop.' },
    { id: 'b', need: [8, 7],        note: 'Loop to down main, section given.' },
    { id: 'c', need: [11, 12],      note: 'Yard pilot set back into the yard.' }
  ];

  var byN = {};
  LEVERS.forEach(function (l) { byN[l.n] = l; l.rev = false; l.bothWays = l.bothWays || []; });

  var frameEl    = document.getElementById('leverFrame');
  var diagram    = document.getElementById('diagram');
  var regBody    = document.getElementById('regBody');
  var detail     = document.getElementById('plateDetail');
  var restoreBtn = document.getElementById('restore');
  var taskEls    = {};
  var buttons    = {};
  var clock      = 9 * 60 + 14;
  var doneTasks  = {};

  if (!frameEl || !diagram) return;

  /* ------------------------------------------------------------------
     The rule.
     ------------------------------------------------------------------ */
  function holds(cond, state) {
    if (cond === 'never') return false;
    var n = parseInt(cond, 10);
    var want = cond.charAt(cond.length - 1) === 'R';
    return state[n] === want;
  }

  /* Returns null if the movement is allowed, or the number of the lever
     that is holding it. */
  function blockedBy(lever, toReverse) {
    var i, m;

    /* a facing point lock holds its points in either position */
    for (i = 0; i < LEVERS.length; i++) {
      m = LEVERS[i];
      if (m.rev && m.n !== lever.n && m.bothWays.indexOf(lever.n) !== -1) return m.n;
    }

    /* build the state this movement would produce */
    var next = {};
    LEVERS.forEach(function (l) { next[l.n] = l.rev; });
    next[lever.n] = toReverse;

    /* every reversed lever's conditions must survive it — itself included */
    if (toReverse) {
      for (i = 0; i < lever.req.length; i++) {
        if (!holds(lever.req[i], next)) {
          return lever.req[i] === 'never' ? 0 : parseInt(lever.req[i], 10);
        }
      }
    }
    for (i = 0; i < LEVERS.length; i++) {
      m = LEVERS[i];
      if (!next[m.n] || m.n === lever.n) continue;
      for (var j = 0; j < m.req.length; j++) {
        if (!holds(m.req[j], next)) return m.n;
      }
    }
    return null;
  }

  /* ------------------------------------------------------------------
     Build the frame
     ------------------------------------------------------------------ */
  function build() {
    LEVERS.forEach(function (l) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'lever';
      b.dataset.n = String(l.n);
      b.dataset.c = l.c;
      b.setAttribute('aria-pressed', 'false');
      b.setAttribute('aria-label', 'Lever number ' + l.n + ', ' + l.fn + '. Normal.');

      b.innerHTML =
        '<span class="lever-stack" aria-hidden="true">' +
          '<span class="lever-arm"><span class="grip"></span></span>' +
          '<span class="lever-pivot"></span>' +
        '</span>' +
        '<span class="plate"><span class="pnum">' + l.n + '</span></span>' +
        '<span class="lever-label">' + l.fn +
          '<span class="lever-sub">' + COLOUR_NAME[l.c] + '</span>' +
        '</span>' +
        '<span class="lever-state">Normal</span>';

      b.addEventListener('click', function () { pull(l.n); });
      b.addEventListener('mouseenter', function () { showPlate(l); });
      b.addEventListener('focus', function () { showPlate(l); });

      frameEl.appendChild(b);
      buttons[l.n] = b;
    });

    document.querySelectorAll('.task').forEach(function (t) { taskEls[t.dataset.task] = t; });

    log('—', '', 'Box opened. Frame standing normal, gates across the railway.');
    syncDiagram();
  }

  /* ------------------------------------------------------------------
     Pull / restore
     ------------------------------------------------------------------ */
  function pull(n) {
    var l = byN[n];
    var b = buttons[n];
    var toReverse = !l.rev;
    var block = blockedBy(l, toReverse);

    if (block !== null) {
      b.classList.remove('locked');
      void b.offsetWidth;
      b.classList.add('locked');
      window.setTimeout(function () { b.classList.remove('locked'); }, 700);

      if (block === 0) {
        log(time(), n, 'No. ' + n + ' is a spare. It works nothing.', 'refused');
      } else {
        var who = byN[block].short || byN[block].fn.toLowerCase();
        log(time(), n, (toReverse ? 'Pull' : 'Put back') + ' refused — locked by No. ' + block +
          ' (' + who + ').', 'refused');
      }
      showPlate(l, block);
      return;
    }

    l.rev = toReverse;
    b.setAttribute('aria-pressed', toReverse ? 'true' : 'false');
    b.setAttribute('aria-label', 'Lever number ' + n + ', ' + l.fn + '. ' + (toReverse ? 'Reverse.' : 'Normal.'));
    b.querySelector('.lever-state').textContent = toReverse ? 'Reverse' : 'Normal';

    log(time(), n, (toReverse ? 'Pulled — ' : 'Put back — ') + (l.short || l.fn.toLowerCase()) + '.');
    syncDiagram();
    showPlate(l);
    checkTasks();
  }

  /* ------------------------------------------------------------------
     Diagram
     ------------------------------------------------------------------ */
  function syncDiagram() {
    SIGNALS.forEach(function (n) {
      var g = diagram.querySelector('#sig-' + n);
      if (g) g.classList.toggle('off', byN[n].rev);
    });
    DISCS.forEach(function (n) {
      var g = diagram.querySelector('#sig-' + n);
      if (g) g.classList.toggle('off', byN[n].rev);
    });
    POINTS.forEach(function (n) {
      var g = diagram.querySelector('#pt-' + n);
      if (!g) return;
      var rev = byN[n].rev;
      var ln = g.querySelector('.leg-n'), lr = g.querySelector('.leg-r');
      if (ln) ln.classList.toggle('set', !rev);
      if (lr) lr.classList.toggle('set', rev);
    });
    var gates = diagram.querySelector('#gates');
    if (gates) {
      gates.classList.toggle('across', byN[16].rev);
      gates.classList.toggle('bolted', byN[17].rev);
    }
  }

  /* ------------------------------------------------------------------
     Plate detail strip
     ------------------------------------------------------------------ */
  function showPlate(l, block) {
    var released = l.req.filter(function (c) { return c !== 'never'; });
    var lockLine;

    if (l.req.indexOf('never') !== -1) {
      lockLine = 'Works nothing. Locks nothing.';
    } else {
      var locks = LEVERS.filter(function (m) {
        return m.n !== l.n && (m.bothWays.indexOf(l.n) !== -1 ||
          m.req.some(function (c) { return parseInt(c, 10) === l.n; }));
      }).map(function (m) { return m.n; });

      lockLine =
        (released.length
          ? 'Released by <b>' + released.map(function (c) {
              return 'No. ' + parseInt(c, 10) + ' ' + (c.slice(-1) === 'R' ? 'reverse' : 'normal');
            }).join('</b>, <b>') + '</b>. '
          : 'Free to pull at any time. ') +
        (locks.length ? 'Affects No. ' + locks.join(', ') + '.' : '');
      if (l.bothWays.length) lockLine += ' Holds No. ' + l.bothWays.join(', ') + ' in either position.';
    }

    detail.innerHTML =
      '<div class="pd-head">' +
        '<span class="pd-n">No. ' + l.n + '</span>' +
        '<span class="pd-fn">' + l.fn + '</span>' +
        '<span class="pd-state" data-s="' + (l.rev ? 'reverse' : 'normal') + '">' +
          (l.rev ? 'Reverse' : 'Normal') + '</span>' +
        (typeof block === 'number' && block > 0
          ? '<span class="pd-state" data-s="normal" style="border-color:var(--stop);color:var(--stop)">Locked by ' + block + '</span>'
          : '') +
      '</div>' +
      '<p class="pd-body">' + l.desc + '</p>' +
      '<p class="pd-lock">' + lockLine + '</p>';
  }

  /* ------------------------------------------------------------------
     Register book
     ------------------------------------------------------------------ */
  function time() {
    clock += 1;
    var h = Math.floor(clock / 60) % 24, m = clock % 60;
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }

  function log(t, n, text, cls) {
    var li = document.createElement('li');
    if (cls) li.className = cls;
    li.innerHTML = '<span class="t">' + t + '</span><span class="n">' + (n || '') + '</span><span class="e">' + text + '</span>';
    regBody.appendChild(li);
    regBody.scrollTop = regBody.scrollHeight;
    while (regBody.children.length > 80) regBody.removeChild(regBody.firstChild);
  }

  /* ------------------------------------------------------------------
     Tasks
     ------------------------------------------------------------------ */
  function checkTasks() {
    TASKS.forEach(function (t) {
      var el = taskEls[t.id];
      if (!el) return;
      var set = t.need.every(function (n) { return byN[n].rev; });
      el.classList.toggle('done', set);
      el.querySelector('.task-s').textContent = set
        ? 'Set — levers ' + t.need.join(', ')
        : 'Not set';
      if (set && !doneTasks[t.id]) {
        doneTasks[t.id] = true;
        log(time(), '', t.note, 'done-row');
      } else if (!set) {
        doneTasks[t.id] = false;
      }
    });
  }

  /* ------------------------------------------------------------------
     Restore the frame
     ------------------------------------------------------------------ */
  if (restoreBtn) {
    restoreBtn.addEventListener('click', function () {
      LEVERS.forEach(function (l) {
        l.rev = false;
        var b = buttons[l.n];
        b.setAttribute('aria-pressed', 'false');
        b.setAttribute('aria-label', 'Lever number ' + l.n + ', ' + l.fn + '. Normal.');
        b.querySelector('.lever-state').textContent = 'Normal';
      });
      doneTasks = {};
      syncDiagram();
      checkTasks();
      log(time(), '', 'Frame put back. All levers normal.');
    });
  }

  build();
}());
