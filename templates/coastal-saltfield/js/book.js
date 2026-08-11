/* ============================================================================
   SALTFIELD — booking page
   ----------------------------------------------------------------------------
   The quote here comes from the same S.quote() the room page shows, so the
   promise and the charge can never drift apart. Validation answers field by
   field; the submit takes a moment on purpose (the house checks its ledger)
   and the button says so while it does.
   ========================================================================== */
(function (S) {
  'use strict';

  var U = S.ui;
  var picked = null;

  /* -- guests fit -----------------------------------------------------------
     Declared before the room picker because pick() consults it — the hold
     restore below runs pick() during initial script evaluation. */
  var guestsEl = U.$('#fGuests');
  function guestsCheck() {
    var hint = U.$('#guestsHint');
    var over = picked && +guestsEl.value > S.byId(picked).sleeps;
    hint.hidden = !over;
    guestsEl.setAttribute('aria-invalid', over ? 'true' : 'false');
    return !over;
  }

  /* -- room picker ---------------------------------------------------------- */
  function segHTML(r) {
    return '<button class="roomseg__b" type="button" role="radio" aria-checked="false" data-room="' + r.id + '">' +
        '<img src="img/' + U.esc(r.img) + '" width="56" height="42" loading="lazy" decoding="async" alt="">' +
        '<span><b>' + U.esc(r.name) + '</b>' +
        '<span>Sleeps ' + r.sleeps + ' · from ' + S.money(Math.round(r.rate * S.seasons.low.mult)) + '/night</span></span>' +
      '</button>';
  }

  var seg = U.$('#roomSeg');
  seg.innerHTML = S.rooms.map(segHTML).join('');

  function pick(id, silent) {
    picked = S.byId(id) ? id : null;
    U.$$('.roomseg__b', seg).forEach(function (b) {
      b.setAttribute('aria-checked', String(b.getAttribute('data-room') === picked));
    });
    var e = U.$('#eRoom'); if (e) e.hidden = true;
    guestsCheck();
    paint();
    if (!silent && picked) U.toast(S.byId(picked).name + ' it is.');
  }

  seg.addEventListener('click', function (e) {
    var b = e.target.closest('.roomseg__b');
    if (b) pick(b.getAttribute('data-room'));
  });

  /* -- dates ---------------------------------------------------------------- */
  var inEl = U.$('#fIn'), outEl = U.$('#fOut');
  var t0 = S.today0();
  inEl.min = U.isoDay(t0);
  outEl.min = U.isoDay(new Date(t0.getFullYear(), t0.getMonth(), t0.getDate() + S.minNights));

  inEl.addEventListener('change', function () {
    var d = S.parseDay(inEl.value);
    if (d) outEl.min = U.isoDay(new Date(d.getFullYear(), d.getMonth(), d.getDate() + S.minNights));
  });

  /* -- arriving with a hold -------------------------------------------------
     The hold placed on a room page pre-fills everything and says so, once. */
  var hold = S.hold.read();
  if (hold) {
    pick(hold.room, true);
    if (hold.in) inEl.value = hold.in;
    if (hold.out) outEl.value = hold.out;
    var r = S.byId(hold.room);
    if (r) U.toast('Your hold is here: ' + r.name +
      (hold.in ? ', ' + U.fmtDay(S.parseDay(hold.in)) : '') +
      (hold.out ? ' to ' + U.fmtDay(S.parseDay(hold.out)) : '') + '.');
  }

  guestsEl.addEventListener('change', function () { guestsCheck(); paint(); });

  /* -- live sum ------------------------------------------------------------- */
  var lastQuote = null;

  function paint() {
    var rows = U.$('#sumRows'), why = U.$('#sumWhy');
    var totalRow = U.$('#sumTotalRow'), total = U.$('#sumTotal');
    var q = picked ? S.quote(picked, inEl.value, outEl.value) : { ok: false, why: 'Pick a room and dates — the figure appears as you go.' };
    lastQuote = q.ok ? q : null;

    var eDates = U.$('#eDates');
    if (eDates && (inEl.value || outEl.value)) {
      var dateProblem = !q.ok && picked && inEl.value && outEl.value;
      eDates.hidden = !dateProblem;
      if (dateProblem) eDates.textContent = q.why;
      inEl.setAttribute('aria-invalid', dateProblem ? 'true' : 'false');
      outEl.setAttribute('aria-invalid', dateProblem ? 'true' : 'false');
    }

    if (!q.ok) {
      rows.innerHTML = '';
      why.textContent = q.why;
      totalRow.hidden = true;
      return;
    }
    why.textContent = '';
    rows.innerHTML =
      '<p class="qcard__row"><b>' + U.esc(q.room.name) + '</b><span class="u-num">' +
        U.fmtDay(q.in) + ' → ' + U.fmtDay(q.out) + '</span></p>' +
      q.lines.map(function (b) {
        return '<p class="qcard__row"><b>' + b.nights + (b.nights === 1 ? ' night' : ' nights') +
               ' · ' + U.esc(b.label) + '</b><span class="u-num">' + b.nights + ' × ' +
               S.money(b.perNight) + '</span></p>';
      }).join('') +
      '<p class="qcard__row"><b>Lodging</b><span class="u-num">' + S.money(q.lodging) + '</span></p>' +
      '<p class="qcard__row"><b>Shore levy 9%</b><span class="u-num">' + S.money(q.tax) + '</span></p>';
    total.textContent = S.money(q.total);
    totalRow.hidden = false;
  }

  inEl.addEventListener('input', paint);
  outEl.addEventListener('input', paint);

  /* -- field-level validation ---------------------------------------------- */
  function fail(el, errEl, on, msg) {
    if (msg && on) errEl.textContent = msg;
    errEl.hidden = !on;
    el.setAttribute('aria-invalid', on ? 'true' : 'false');
    return on;
  }

  var FIELDS = { '#fName': '#eName', '#fEmail': '#eEmail' };
  Object.keys(FIELDS).forEach(function (id) {
    var el = U.$(id), err = U.$(FIELDS[id]);
    el.addEventListener('input', function () {
      el.setAttribute('aria-invalid', 'false');
      err.hidden = true;
    });
  });

  function validate() {
    var bad = null;

    if (!picked) {
      U.$('#eRoom').hidden = false;
      bad = bad || '#roomSeg';
    }
    var q = picked ? S.quote(picked, inEl.value, outEl.value) : null;
    if (picked && (!q || !q.ok)) {
      var e = U.$('#eDates');
      e.textContent = (q && q.why) || 'Pick both dates.';
      e.hidden = false;
      bad = bad || '#fIn';
    }
    if (!guestsCheck()) bad = bad || '#fGuests';

    var name = U.$('#fName'), email = U.$('#fEmail');
    if (fail(name, U.$('#eName'), name.value.trim().length < 2)) bad = bad || '#fName';
    if (fail(email, U.$('#eEmail'), !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim()))) bad = bad || '#fEmail';

    return bad;
  }

  /* -- submit ---------------------------------------------------------------
     A deliberate beat of "checking the ledger" so the guest sees the house
     answer, then the confirmation. The pending state is honest UI, not a fake
     network call — nothing leaves the page. */
  U.$('#bookForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var bad = validate();
    if (bad) {
      var el = U.$(bad);
      if (el) {
        el.focus({ preventScroll: false });
        el.scrollIntoView({ block: 'center', behavior: U.reduce ? 'auto' : 'smooth' });
      }
      U.toast('A couple of things need attention above.', 'warn');
      return;
    }

    var btn = U.$('#sendBtn'), label = U.$('#sendLabel');
    btn.setAttribute('data-busy', '1');
    label.textContent = 'Checking the ledger…';

    var q = lastQuote;
    setTimeout(function () {
      btn.removeAttribute('data-busy');
      label.textContent = 'Ask the house';

      var ref = 'SF–' + String(1400 + Math.floor(Math.random() * 8000)).padStart(4, '0');
      U.$('#doneRef').textContent = ref;
      U.$('#doneP').textContent = 'Thank you, ' + U.$('#fName').value.trim() + '. ' +
        q.room.name + ' is pencilled in for you, and a note is on its way to ' +
        U.$('#fEmail').value.trim() + '. The house confirms within the day — usually by supper.';
      U.$('#doneFacts').innerHTML =
        '<div><dt>Room</dt><dd class="u-num">' + U.esc(q.room.name) + ' · No. ' + q.room.no + '</dd></div>' +
        '<div><dt>Nights</dt><dd class="u-num">' + q.nights + ' · ' + U.fmtDay(q.in) + ' → ' + U.fmtDay(q.out) + '</dd></div>' +
        '<div><dt>Guests</dt><dd class="u-num">' + U.$('#fGuests').value + '</dd></div>' +
        '<div><dt>Lodging</dt><dd class="u-num">' + S.money(q.lodging) + '</dd></div>' +
        '<div><dt>Shore levy</dt><dd class="u-num">' + S.money(q.tax) + '</dd></div>' +
        '<div><dt>To settle at the house</dt><dd class="u-num">' + S.money(q.total) + '</dd></div>';

      S.hold.clear();
      U.$('#bookState').hidden = true;
      U.$('#doneState').hidden = false;
      window.scrollTo({ top: 0, behavior: U.reduce ? 'auto' : 'smooth' });
    }, 900);
  });

  paint();
  U.init();
  U.reveals();
})(window.SALTFIELD);
