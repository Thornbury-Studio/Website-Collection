/* ============================================================================
   HOLLOWGATE — page behaviour.
   The interlocking itself lives in frame.js; this file only wires it to the
   levers, the diagram and the plate that answers back, and does the ordinary
   jobs a page has: a drawer, a reveal, a form, a year.
   ========================================================================= */

(function () {
  'use strict';

  var doc = document;
  var anim = doc.documentElement.classList.contains('js-anim');
  function $(sel, root) { return (root || doc).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || doc).querySelectorAll(sel)); }

  /* --- drawer ------------------------------------------------------------ */

  var burger = $('#burger'), drawer = $('#drawer');
  if (burger && drawer) {
    burger.addEventListener('click', function () {
      var open = burger.getAttribute('aria-expanded') === 'true';
      burger.setAttribute('aria-expanded', String(!open));
      drawer.setAttribute('data-open', String(!open));
    });
    $$('a', drawer).forEach(function (a) {
      a.addEventListener('click', function () {
        burger.setAttribute('aria-expanded', 'false');
        drawer.setAttribute('data-open', 'false');
      });
    });
  }

  /* --- reveals ----------------------------------------------------------- */

  var targets = $$('.reveal, .head');
  if (anim && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    targets.forEach(function (t) { io.observe(t); });
  } else {
    targets.forEach(function (t) { t.classList.add('in'); });
  }

  /* --- the year ---------------------------------------------------------- */

  $$('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });

  /* --- enquiry forms ----------------------------------------------------- */

  $$('form[data-enquiry]').forEach(function (form) {
    var sent = $('.sent', form);
    if (sent) sent.hidden = true;
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      if (!sent) return;
      sent.hidden = false;
      sent.setAttribute('tabindex', '-1');
      sent.focus();
    });
  });

  /* ======================================================================
     THE FRAME
     ====================================================================== */

  var H = window.HOLLOWGATE;
  var frameEl = $('#frame');
  if (!H) return;

  /* the generated locking table — present on both pages that show one */
  $$('[data-locking-table]').forEach(function (tbody) {
    var heldBy = {};
    H.LEVERS.forEach(function (L) {
      L.needs.forEach(function (c) {
        (heldBy[c[0]] = heldBy[c[0]] || []).push(L.n + ' ' + c[1]);
      });
      (L.locks || []).forEach(function (m) {
        (heldBy[m] = heldBy[m] || []).push(L.n + ' both');
      });
    });
    H.LEVERS.forEach(function (L) {
      var tr = doc.createElement('tr');
      tr.setAttribute('data-row', String(L.n));
      var holds = L.needs.map(function (c) { return c[0] + ' ' + c[1]; })
        .concat((L.locks || []).map(function (m) { return m + ' both'; })).join(' · ');
      tr.innerHTML =
        '<td class="n"><span class="sw" style="background:' + swatch(L.colour) + '"></span>' + L.n + '</td>' +
        '<td>' + esc(L.fn) + '</td>' +
        '<td>' + (holds || '<span class="free">free</span>') + '</td>' +
        '<td>' + (heldBy[L.n] ? heldBy[L.n].join(' · ') : '<span class="free">free</span>') + '</td>';
      tbody.appendChild(tr);
    });
  });

  function swatch(c) {
    return { red: '#C3242E', amber: '#E3A82A', blue: '#3A7AB8',
             brown: '#7C5533', black: '#23292B', white: '#F4F1E6' }[c] || '#888';
  }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  if (!frameEl) return;

  var state = H.blankState();
  var levers = $$('.lever', frameEl);
  var answer = $('#answer'), answerLine = $('#answer-line'), answerWhy = $('#answer-why');
  var busy = false;

  levers.forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (busy) return;
      pull(parseInt(btn.getAttribute('data-n'), 10));
    });
  });

  function pull(n) {
    var res = H.attempt(state, n);
    hot(null);
    if (!res.ok) {
      refuse(n);
      if (res.by !== n) refuse(res.by);
      hot(res.by);
      say('refused', res.text, res.note);
      return;
    }
    state[n] = res.to;
    paint();
    var r = H.reading(state);
    say(r.state, r.text, r.note);
  }

  function refuse(n) {
    var btn = frameEl.querySelector('.lever[data-n="' + n + '"]');
    if (!btn || !anim) return;
    btn.classList.remove('refuse');
    void btn.offsetWidth;
    btn.classList.add('refuse');
    setTimeout(function () { btn.classList.remove('refuse'); }, 420);
  }

  function hot(n) {
    $$('[data-locking-table] tr').forEach(function (tr) {
      tr.setAttribute('data-hot', String(tr.getAttribute('data-row') === String(n)));
    });
  }

  function say(kind, text, note) {
    if (!answer) return;
    answer.setAttribute('data-state', kind);
    answerLine.textContent = text;
    answerWhy.textContent = note;
  }

  /* --- painting the diagram and the shelf -------------------------------- */

  function cls(sel, name, on) {
    var el = doc.querySelector(sel);
    if (el) el.classList.toggle(name, !!on);
  }

  function paint() {
    levers.forEach(function (btn) {
      var n = parseInt(btn.getAttribute('data-n'), 10);
      var rev = state[n] === 'R';
      btn.setAttribute('aria-pressed', String(rev));
      $('.lever-state', btn).textContent = rev ? 'R' : 'N';
    });

    [1, 2, 7, 8, 9, 10, 12].forEach(function (n) {
      cls('#arm' + n, 'off', state[n] === 'R');
    });

    cls('#pt4-main', 'set', state[4] === 'N');
    cls('#pt4-main', 'off', state[4] === 'R');
    cls('#pt4-branch', 'set', state[4] === 'R');
    cls('#pt4-branch', 'off', state[4] === 'N');
    cls('#pt6', 'set', state[6] === 'R');
    cls('#pt6', 'off', state[6] === 'N');
    cls('#pt15', 'set', state[15] === 'R');
    cls('#pt15', 'off', state[15] === 'N');

    cls('#gate-a', 'shut', state[14] === 'R');
    cls('#gate-b', 'shut-r', state[14] === 'R');

    var r = H.routes(state);
    cls('#route-down', 'on', r.down);
    cls('#route-quarry', 'on', r.quarry);
    cls('#route-up', 'on', r.up);

    shelf('down', r.down || r.quarry ? 'amber' : '', r.quarry ? 'Line clear · branch' : (r.down ? 'Line clear' : 'Normal'));
    shelf('up', r.up ? 'amber' : '', r.up ? 'Line clear' : 'Normal');
    shelf('fpl', state[5] === 'R' ? 'blue' : '', state[5] === 'R' ? 'Bolted' : 'Free');
    shelf('gate', state[13] === 'R' ? 'amber' : 'red',
      state[13] === 'R' ? 'Across road · bolted'
        : (state[14] === 'R' ? 'Across road · not bolted' : 'Across the line'));
  }

  function shelf(key, lit, text) {
    var pip = $('#pip-' + key), txt = $('#txt-' + key);
    if (pip) pip.setAttribute('data-lit', lit);
    if (txt) txt.textContent = text;
  }

  /* --- put the frame back ------------------------------------------------ */

  var restore = $('#btn-restore');
  if (restore) {
    restore.addEventListener('click', function () {
      var order = H.restoreOrder(state);
      if (!order.length) {
        say('normal', 'Frame already normal', 'Nothing to put back.');
        return;
      }
      hot(null);
      if (!anim) {
        order.forEach(function (n) { state[n] = 'N'; });
        paint();
        say('normal', 'Frame normal', 'Sixteen levers standing, every signal at danger.');
        return;
      }
      busy = true;
      var i = 0;
      var tick = setInterval(function () {
        state[order[i]] = 'N';
        paint();
        say('part', 'Putting back · lever ' + order[i],
          'The locking decides this order, not the signalman: a lever can only go back when nothing that is still reverse depends on it. ' +
          (i + 1) + ' of ' + order.length + '.');
        if (++i >= order.length) {
          clearInterval(tick);
          busy = false;
          var r = H.reading(state);
          say(r.state, r.text, r.note);
        }
      }, 230);
    });
  }

  paint();
  var start = H.reading(state);
  say(start.state, start.text, start.note);
})();
