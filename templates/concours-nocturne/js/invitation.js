/* NOCTURNE — the invitation request. Evenings are computed (the next two
   first-Saturdays), validation speaks in the house's voice, and a granted
   request persists in nocturne.invitation.v1 so a returning visitor finds
   their request held, not forgotten. */
(function () {
  'use strict';
  var N = window.NOC;
  var $ = function (id) { return document.getElementById(id); };
  var KEY = 'nocturne.invitation.v1';
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  function firstSaturday(offsetMonths) {
    var d = new Date();
    d.setMonth(d.getMonth() + offsetMonths, 1);
    while (d.getDay() !== 6) d.setDate(d.getDate() + 1);
    return d;
  }
  function fmt(d) { return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear(); }

  var evenings = [firstSaturday(1), firstSaturday(2)];
  var sel = $('invEvening');
  sel.innerHTML = evenings.map(function (d, i) {
    return '<option value="' + i + '">' + fmt(d) + ' — gates 19:30</option>';
  }).join('');

  var guests = 1;
  Array.prototype.forEach.call(document.querySelectorAll('.guests button'), function (b) {
    b.addEventListener('click', function () {
      guests = Math.min(4, Math.max(1, guests + parseInt(b.getAttribute('data-d'), 10)));
      $('invGuests').textContent = guests;
      document.querySelector('.guests button[data-d="-1"]').disabled = guests === 1;
      document.querySelector('.guests button[data-d="1"]').disabled = guests === 4;
    });
  });

  function check(input, fn, msg) {
    var field = input.closest('.field');
    var err = field.querySelector('.field-err');
    if (!fn(input.value)) { field.classList.add('err'); err.textContent = msg; return false; }
    field.classList.remove('err'); err.textContent = '';
    return true;
  }

  function held(rec) {
    var noted = $('invNoted');
    noted.hidden = false;
    noted.innerHTML = 'The desk holds your request — <span class="code">' + rec.code + '</span> — for ' +
      rec.evening + ', ' + rec.guests + (rec.guests > 1 ? ' guests' : ' guest') +
      '. An answer reaches ' + rec.email + ' within the week. Rosettes you pin between now and then travel with the request.';
  }

  /* a returning visitor finds the request held */
  try {
    var prior = JSON.parse(localStorage.getItem(KEY));
    if (prior && prior.code) {
      held(prior);
      $('invForm').querySelector('button[type="submit"]').disabled = true;
      $('invName').value = prior.name;
      $('invEmail').value = prior.email;
    }
  } catch (e) { /* fresh visitor */ }

  $('invForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var nm = $('invName'), em = $('invEmail');
    var ok = true;
    ok = check(nm, function (v) { return v.trim().length >= 2; }, 'The desk cannot address an empty envelope.') && ok;
    ok = check(em, function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }, 'That address will not survive the post — check it.') && ok;
    if (!ok) return;
    var hash = 5381;
    var s = nm.value + em.value + sel.value;
    for (var i = 0; i < s.length; i++) hash = ((hash << 5) + hash + s.charCodeAt(i)) >>> 0;
    var rec = {
      code: 'NCT-' + (hash % 9000 + 1000),
      name: nm.value.trim(), email: em.value.trim(),
      evening: fmt(evenings[+sel.value]), guests: guests,
      pins: (N.pins || []).slice(),
      at: new Date().toISOString()
    };
    try { localStorage.setItem(KEY, JSON.stringify(rec)); } catch (err) { /* private mode */ }
    held(rec);
    this.querySelector('button[type="submit"]').disabled = true;
    $('invNoted').scrollIntoView({ behavior: N.reduced ? 'auto' : 'smooth', block: 'center' });
  });

  N.paintPins();
  N.rise();
})();
