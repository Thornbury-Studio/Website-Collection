/* NOON enquiry — the chosen floor's line is computed from the registry,
   and the floor list follows the chosen building. ?b= and ?f= arrive from
   building sheets. */
(function () {
  'use strict';
  var N = window.NN;

  var q = new URLSearchParams(location.search);
  var bSel = document.getElementById('fBldg');
  var fSel = document.getElementById('fFloor');
  var line = document.getElementById('chosenLine');

  function fillFloors(slug, pickId) {
    while (fSel.options.length > 1) fSel.remove(1);
    var b = N.buildings[slug];
    if (!b) { paintLine(); return; }
    b.floors.forEach(function (f) {
      if (f.state !== 'available') return;
      var o = document.createElement('option');
      o.value = f.id;
      o.textContent = f.id + ' · ' + f.name + ' · ' + f.area + ' m²';
      if (pickId && pickId === f.id) o.selected = true;
      fSel.appendChild(o);
    });
    paintLine();
  }

  function paintLine() {
    var b = N.buildings[bSel.value];
    if (!b) {
      line.textContent = 'Nothing chosen yet — pick a building below, or leave it to us and describe the light you need.';
      return;
    }
    var f = null;
    b.floors.forEach(function (x) { if (x.id === fSel.value) f = x; });
    if (!f) {
      var open = b.floors.filter(function (x) { return x.state === 'available'; }).length;
      line.textContent = b.name + ' · ' + open + ' floor' + (open === 1 ? '' : 's') + ' open · from €' + b.rate + '/m²·mo';
      return;
    }
    var sunH = N.sun.directHours(f.walls || b.walls);
    line.textContent = b.name + ' · ' + f.id + ' ' + f.name + ' · ' + f.area + ' m² · ' +
      Math.round(f.glaze * 100) + '% glass · ' +
      (sunH < 0.05 ? 'steady light' : N.fmt.hours(sunH) + ' direct today') + ' · ' +
      N.fmt.eur(N.rent(b, f)) + '/mo';
  }

  bSel.addEventListener('change', function () { fillFloors(bSel.value); });
  fSel.addEventListener('change', paintLine);

  if (q.get('b') && N.buildings[q.get('b')]) {
    bSel.value = q.get('b');
    fillFloors(q.get('b'), q.get('f'));
  } else {
    paintLine();
  }

  /* ---------- the book ---------- */

  var form = document.getElementById('enqForm');
  var noted = document.getElementById('enqNoted');

  function bad(id, is) {
    document.getElementById(id).closest('.field').classList.toggle('bad', is);
    return is;
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var name = document.getElementById('fName');
    var mail = document.getElementById('fMail');
    var msg = document.getElementById('fMsg');
    var anyBad = bad('fName', !name.value.trim());
    anyBad = bad('fMail', !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail.value.trim())) || anyBad;
    anyBad = bad('fMsg', !msg.value.trim()) || anyBad;
    if (anyBad) {
      var firstBad = form.querySelector('.field.bad input, .field.bad textarea');
      if (firstBad) firstBad.focus();
      return;
    }
    var n = 0;
    try {
      n = parseInt(localStorage.getItem('noon.book.v1') || '0', 10) + 1;
      localStorage.setItem('noon.book.v1', String(n));
    } catch (e) { n = 1; }
    var ref = 'NN-' + new Date().getFullYear() + '-' + String(140 + n);
    var first = name.value.trim().split(/\s+/)[0];
    noted.innerHTML = '';
    var refEl = document.createElement('span');
    refEl.className = 'ref';
    refEl.textContent = ref;
    noted.appendChild(document.createTextNode('Entered in the book as '));
    noted.appendChild(refEl);
    noted.appendChild(document.createTextNode('. Thank you, ' + first +
      ' — a person from the house replies within two working days, with the survey for the floor attached.'));
    noted.hidden = false;
    form.querySelectorAll('input, textarea, select, button[type="submit"]').forEach(function (el) { el.disabled = true; });
    noted.scrollIntoView({ behavior: N.reduced ? 'auto' : 'smooth', block: 'nearest' });
  });
}());
