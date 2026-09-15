/* PELAGIA — the ticket builder: a date, an hour, who is coming, two add-ons, a total. */
(function () {
  'use strict';
  var P = window.PELAGIA;
  var T = P.tickets;
  var $ = function (id) { return document.getElementById(id); };
  var form = $('builder');
  if (!form) return;

  /* ---- dates: today and the next 20 days ---- */
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var dates = [];
  for (var i = 0; i < 21; i++) { var d = new Date(today.getTime() + i * 864e5); dates.push(d); }
  var bDate = $('bDate');
  bDate.innerHTML = dates.map(function (d, i) {
    var label = (i === 0 ? 'Today, ' : i === 1 ? 'Tomorrow, ' : '') + P.fmt(d) + (P.isLate(d) ? ' · After Dark' : '');
    return '<option value="' + P.iso(d) + '">' + label + '</option>';
  }).join('');

  var state = { date: dates[0], slot: null, adult: 2, child: 0, senior: 0, family: 0, rayfeed: 0, backstage: 0 };
  var wantSlot = P.qs('slot');

  /* ---- slots for the chosen day ---- */
  function renderSlots() {
    var d = state.date;
    var late = P.isLate(d);
    $('bDayHours').innerHTML = P.hours.open + ' &ndash; ' + P.closeFor(d) + (late ? ' <span class="muted">· After Dark from 19:00</span>' : '');
    var list = T.slots.slice();
    if (late) list = list.concat(T.lateSlots);
    var now = new Date();
    var isToday = P.iso(d) === P.iso(now);
    var html = list.map(function (s) {
      var gone = isToday && P.mins(s) + 59 < now.getHours() * 60 + now.getMinutes();
      var evening = T.lateSlots.indexOf(s) > -1;
      return '<button class="slotbtn" type="button" data-slot="' + s + '" aria-pressed="false"' + (gone ? ' disabled' : '') + '>' + s + (evening ? '<small>After Dark</small>' : '') + '</button>';
    }).join('');
    $('bSlots').innerHTML = html;
    var avail = list.filter(function (s) { return !(isToday && P.mins(s) + 59 < now.getHours() * 60 + now.getMinutes()); });
    var pick = (wantSlot && avail.indexOf(wantSlot) > -1) ? wantSlot : (avail.indexOf(state.slot) > -1 ? state.slot : (avail.indexOf('13:00') > -1 ? '13:00' : avail[0]));
    wantSlot = '';
    setSlot(pick || null);
  }
  function setSlot(s) {
    state.slot = s;
    $('bSlots').querySelectorAll('.slotbtn').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-slot') === s)); });
    $('bSlotNote').textContent = !s ? 'No slots left today — pick another day.' :
      isEvening() ? 'After Dark: over-twelves only, the bar opens at 19:00, last entry 21:00.' : 'Arrive any time in your hour. Last entry is an hour before closing.';
    renderQty();
  }
  function isEvening() { return state.slot && T.lateSlots.indexOf(state.slot) > -1; }

  /* ---- who is coming ---- */
  var ROWS = [
    ['adult', 'Adult', '13 and over'],
    ['child', 'Child', '3 to 12 · under-threes free'],
    ['senior', 'Senior', '60 and over, with ID'],
    ['family', 'Family bundle', '2 adults + 2 children'],
  ];
  function unitPrice(kind) {
    if (isEvening()) return kind === 'adult' || kind === 'senior' ? T.afterDark : 0;
    return { adult: T.adult, child: T.child, senior: T.senior, family: T.family }[kind];
  }
  function renderQty() {
    var evening = isEvening();
    $('bQty').innerHTML = ROWS.filter(function (r) { return !evening || r[0] === 'adult' || r[0] === 'senior'; }).map(function (r) {
      return '<div class="qty__row"><div><b>' + r[1] + (evening ? ' · After Dark' : '') + '</b><span>' + r[2] + '</span></div>' +
        '<span class="qty__price num">' + P.money(unitPrice(r[0])) + '</span>' +
        '<span class="stepper"><button type="button" data-k="' + r[0] + '" data-d="-1" aria-label="Fewer">−</button><output aria-live="polite">' + state[r[0]] + '</output><button type="button" data-k="' + r[0] + '" data-d="1" aria-label="More">+</button></span></div>';
    }).join('');
    if (evening) { state.child = 0; state.family = 0; }
    renderAddons();
  }
  function renderAddons() {
    var evening = isEvening();
    var ray = P.experiences.filter(function (x) { return x.slug === 'ray-feed'; })[0];
    var back = P.experiences.filter(function (x) { return x.slug === 'backstage'; })[0];
    $('bAddons').innerHTML = evening ? '<p class="muted" style="font-size:14px;padding:10px 0">Experiences run in the daytime; book them on a day slot.</p>' :
      '<label class="check"><input type="checkbox" id="addRay"' + (state.rayfeed ? ' checked' : '') + '><span><b>Ray Bay Feed</b> · 11:30 or 15:00, 25 minutes in the water<small>S$28 a person, ages 5+; we will email a time choice</small></span><span class="qty__price num">' + P.money(ray.price) + '</span></label>' +
      '<label class="check"><input type="checkbox" id="addBack"' + (state.backstage ? ' checked' : '') + '><span><b>Behind the Glass</b> · 14:00, 60 minutes<small>S$68 a person, ages 8+, twelve places a day</small></span><span class="qty__price num">' + P.money(back.price) + '</span></label>';
    total();
  }

  /* ---- total ---- */
  function people() { return state.adult + state.child + state.senior + state.family * 4; }
  function total() {
    var lines = [];
    var sum = 0;
    ROWS.forEach(function (r) {
      var n = state[r[0]]; if (!n) return;
      var p = unitPrice(r[0]) * n; sum += p;
      lines.push(['<b>' + n + ' × ' + r[1] + (isEvening() ? ' (After Dark)' : '') + '</b>', P.money(p)]);
    });
    if (!isEvening()) {
      var heads = people();
      if (state.rayfeed) { var rp = 28 * heads; sum += rp; lines.push(['Ray Bay Feed × ' + heads, P.money(rp)]); }
      if (state.backstage) { var bp = 68 * heads; sum += bp; lines.push(['Behind the Glass × ' + heads, P.money(bp)]); }
    }
    var tix = state.adult + state.child + state.senior + state.family * 4;
    $('sumLines').innerHTML = lines.map(function (l) { return '<div class="summary__line"><span>' + l[0] + '</span><span>' + l[1] + '</span></div>'; }).join('') || '<div class="summary__line"><span>No tickets yet.</span></div>';
    $('sumTotal').textContent = P.money(sum);
    $('sumSave').textContent = P.money(T.gate * tix);
    $('sumHead').innerHTML = P.fmtLong(state.date) + (state.slot ? ' &middot; ' + state.slot : '');
    $('bSubmit').disabled = !state.slot || !tix;
    $('bSubmit').textContent = tix ? 'Pay ' + P.money(sum) + ' and get the tickets' : 'Add a ticket to continue';
    return { sum: sum, tix: tix };
  }

  /* ---- events ---- */
  bDate.addEventListener('change', function () { state.date = P.parse(bDate.value); renderSlots(); });
  $('bSlots').addEventListener('click', function (e) { var b = e.target.closest('.slotbtn'); if (b && !b.disabled) setSlot(b.getAttribute('data-slot')); });
  $('bQty').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-k]'); if (!b) return;
    var k = b.getAttribute('data-k');
    state[k] = Math.max(0, Math.min(10, state[k] + (+b.getAttribute('data-d'))));
    b.parentElement.querySelector('output').textContent = state[k];
    total();
  });
  $('bAddons').addEventListener('change', function (e) {
    if (e.target.id === 'addRay') state.rayfeed = e.target.checked ? 1 : 0;
    if (e.target.id === 'addBack') state.backstage = e.target.checked ? 1 : 0;
    total();
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = $('bName'), email = $('bEmail'), ok = true;
    [name, email].forEach(function (f) {
      var bad = !f.value.trim() || (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.value));
      f.setAttribute('aria-invalid', String(bad)); f.style.borderColor = bad ? 'var(--warn)' : ''; if (bad) ok = false;
    });
    if (!ok) { (name.value.trim() ? email : name).focus(); return; }
    var q = total();
    if (!q.tix || !state.slot) return;
    var ref = 'PA-' + P.iso(state.date).slice(2).replace(/-/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);
    $('sumRef').textContent = ref;
    $('sumDoneText').innerHTML = '<strong>' + q.tix + ' ticket' + (q.tix > 1 ? 's' : '') + '</strong> for <strong>' + P.fmtLong(state.date) + '</strong>, entry from <strong>' + state.slot + '</strong>. ' + P.money(q.sum) + ' paid; the tickets are on their way to ' + P.esc(email.value.trim()) + '.';
    $('summary').hidden = true;
    $('summaryDone').hidden = false;
    $('summaryDone').scrollIntoView({ block: 'nearest' });
  });

  renderSlots();
})();
