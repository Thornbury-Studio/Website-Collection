/* ============================================================================
   SALTFIELD — room page
   ----------------------------------------------------------------------------
   Reads ?r= from the URL, renders the room, and quotes live as dates change.
   "Hold these dates" writes the hold and answers with a toast + the header
   pip; it never pretends to be a booking.
   ========================================================================== */
(function (S) {
  'use strict';

  var U = S.ui;
  var params = new URLSearchParams(location.search);
  var room = S.byId(params.get('r'));

  var detail = U.$('#detail'), notFound = U.$('#notFound');

  if (!room) {
    if (notFound) notFound.hidden = false;
    U.init(); U.reveals();
    return;
  }
  detail.hidden = false;

  /* -- fill the page ------------------------------------------------------- */
  document.title = room.name + ' — SALTFIELD';
  U.$('#crumb').textContent = 'No. ' + room.no;
  U.$('#rName').innerHTML = U.esc(room.name);
  U.$('#rLine').textContent = room.line;
  var img = U.$('#rImg');
  img.src = 'img/' + room.img;
  img.alt = room.alt;
  U.$('#rCap').textContent = room.name + ', ' + room.floor.toLowerCase();
  U.$('#rCap2').textContent = room.sqm + ' m² · sleeps ' + room.sleeps;
  U.$('#rDetails').innerHTML = room.details.map(function (d) {
    return '<li>' + U.esc(d) + '</li>';
  }).join('');
  U.$('#rFacts').textContent = room.bed + ' · ' + room.bath + ' · ' + room.outlook + ' outlook';

  /* -- dates + live quote --------------------------------------------------
     The min attributes keep the native pickers honest; the quote function is
     the same one the booking page charges from. */
  var inEl = U.$('#qIn'), outEl = U.$('#qOut');
  var t = S.today0();
  inEl.min = U.isoDay(t);
  outEl.min = U.isoDay(new Date(t.getFullYear(), t.getMonth(), t.getDate() + S.minNights));

  var hold = S.hold.read();
  if (hold && hold.room === room.id) {
    inEl.value = hold.in || '';
    outEl.value = hold.out || '';
  }

  var lastQuote = null;

  function paint() {
    var rows = U.$('#qRows'), why = U.$('#qWhy');
    var totalRow = U.$('#qTotalRow'), total = U.$('#qTotal'), btn = U.$('#qHold');
    var q = S.quote(room.id, inEl.value, outEl.value);
    lastQuote = q.ok ? q : null;

    if (!q.ok) {
      rows.innerHTML = '';
      // an untouched form isn't an error — only speak once they've started
      why.textContent = (inEl.value || outEl.value) ? q.why : '';
      totalRow.hidden = true;
      btn.disabled = true;
      return;
    }
    why.textContent = '';
    rows.innerHTML = q.lines.map(function (b) {
      return '<p class="qcard__row"><b>' + b.nights + (b.nights === 1 ? ' night' : ' nights') +
             ' · ' + U.esc(b.label) + '</b><span class="u-num">' + b.nights + ' × ' +
             S.money(b.perNight) + '</span></p>';
    }).join('') +
    '<p class="qcard__row"><b>Shore levy 9%</b><span class="u-num">' + S.money(q.tax) + '</span></p>';
    total.textContent = S.money(q.total);
    totalRow.hidden = false;
    btn.disabled = false;
  }

  inEl.addEventListener('input', paint);
  outEl.addEventListener('input', paint);

  /* keep the leave floor one min-stay past the chosen arrival */
  inEl.addEventListener('change', function () {
    var d = S.parseDay(inEl.value);
    if (d) outEl.min = U.isoDay(new Date(d.getFullYear(), d.getMonth(), d.getDate() + S.minNights));
  });

  /* -- hold ----------------------------------------------------------------- */
  U.$('#qHold').addEventListener('click', function () {
    if (!lastQuote) return;
    S.hold.write({ room: room.id, in: inEl.value, out: outEl.value });
    var label = U.$('#qHoldLabel');
    label.textContent = 'Held — take your time';
    U.toast(room.name + ' held, ' + U.fmtDay(lastQuote.in) + ' to ' + U.fmtDay(lastQuote.out) +
            '. It’s waiting on the booking page.');
    setTimeout(function () { label.textContent = 'Hold these dates'; }, 2600);
  });

  paint();
  U.init();
  U.reveals();
})(window.SALTFIELD);
