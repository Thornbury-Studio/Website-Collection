/* ARDVREN — lodge configurator: lodge + plot + cladding + options → total. */
(function () {
  'use strict';

  var A = window.ARDVREN;
  var form = document.getElementById('configForm');
  if (!form || !A) return;

  var LODGES = {
    bothy: { name: 'The Bothy', price: 212000, charred: 8400, area: 58, pic: 'img/lodge-bothy.webp' },
    pine:  { name: 'The Pine',  price: 298000, charred: 11200, area: 86, pic: 'img/lodge-pine.webp' },
    ridge: { name: 'The Ridge', price: 395000, charred: 14600, area: 124, pic: 'img/lodge-ridge.webp' }
  };
  var PLOTS = {
    woodland: { name: 'Woodland plot', from: 148000 },
    ridge:    { name: 'Ridge plot',    from: 172000 },
    lochside: { name: 'Lochside plot', from: 236000 }
  };
  var EXTRAS = {
    stove: { name: '5 kW wood-burning stove', price: 3650 },
    deck:  { name: 'Deck, another four metres', price: 6200 },
    boot:  { name: 'Boot room and store', price: 9800 },
    pv:    { name: '4 kW solar and battery', price: 11900 },
    sauna: { name: 'Shore sauna', price: 24500, lochsideOnly: true }
  };

  var sumTitle = document.getElementById('sumTitle');
  var sumLines = document.getElementById('sumLines');
  var sumTotal = document.getElementById('sumTotal');
  var charredPrice = document.getElementById('charredPrice');
  var sumPic = document.getElementById('sumPic');
  var sumCap = document.getElementById('sumCap');
  var saunaInput = form.querySelector('input[value="sauna"]');

  function checked(name) {
    var el = form.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : null;
  }

  function state() {
    var lodge = LODGES[checked('lodge')] || LODGES.pine;
    var plot = PLOTS[checked('plot')] || PLOTS.woodland;
    var cladding = checked('cladding') || 'natural';
    var extras = [];
    form.querySelectorAll('input[name="extra"]:checked').forEach(function (el) {
      if (!el.disabled && EXTRAS[el.value]) extras.push(EXTRAS[el.value]);
    });
    return { lodge: lodge, plot: plot, cladding: cladding, extras: extras };
  }

  function total(s) {
    var t = s.lodge.price + s.plot.from + (s.cladding === 'charred' ? s.lodge.charred : 0);
    s.extras.forEach(function (x) { t += x.price; });
    return t;
  }

  function line(label, value) {
    return '<li><span>' + A.esc(label) + '</span><span>' + A.esc(value) + '</span></li>';
  }

  function render() {
    var s = state();

    // The shore sauna needs a shore.
    var lochside = checked('plot') === 'lochside';
    if (saunaInput) {
      saunaInput.disabled = !lochside;
      if (!lochside) saunaInput.checked = false;
    }
    if (charredPrice) charredPrice.textContent = '+' + A.money(s.lodge.charred);

    s = state();
    sumTitle.textContent = s.lodge.name + ' on a ' + s.plot.name.toLowerCase();

    var html = line(s.lodge.name + ', turnkey', A.money(s.lodge.price));
    html += line(s.plot.name + ', from', A.money(s.plot.from));
    html += line(s.cladding === 'charred' ? 'Charred larch cladding' : 'Natural larch cladding', s.cladding === 'charred' ? A.money(s.lodge.charred) : 'included');
    s.extras.forEach(function (x) { html += line(x.name, A.money(x.price)); });
    sumLines.innerHTML = html;
    sumTotal.textContent = A.money(total(s));
    if (sumPic && sumPic.getAttribute('src') !== s.lodge.pic) {
      sumPic.setAttribute('src', s.lodge.pic);
      sumPic.alt = s.lodge.name;
    }
    if (sumCap) sumCap.textContent = s.lodge.name + ' · ' + s.lodge.area + ' m² · ' + (s.cladding === 'charred' ? 'charred' : 'natural') + ' larch';
  }

  form.addEventListener('change', render);

  // Deep link from the home page or a lodge sheet: lodges.html?lodge=ridge
  var pre = A.qs('lodge');
  if (pre && LODGES[pre]) {
    var el = form.querySelector('input[name="lodge"][value="' + pre + '"]');
    if (el) el.checked = true;
  }
  render();

  /* ---- send ---- */
  var name = document.getElementById('cfName');
  var email = document.getElementById('cfEmail');
  function validate(input) {
    var ok = input.type === 'email' ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim()) : input.value.trim().length > 1;
    input.closest('.field').classList.toggle('field--err', !ok);
    return ok;
  }
  [name, email].forEach(function (i) {
    i.addEventListener('input', function () { if (i.closest('.field').classList.contains('field--err')) validate(i); });
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = validate(name);
    ok = validate(email) && ok;
    if (!ok) {
      (form.querySelector('.field--err input') || name).focus();
      return;
    }
    var s = state();
    var extras = s.extras.map(function (x) {
      // lower-case a leading capital ("Deck" → "deck") but leave "5 kW" and "4 kW" alone
      return /^[A-Z][a-z]/.test(x.name) ? x.name.charAt(0).toLowerCase() + x.name.slice(1) : x.name;
    });
    var text = s.lodge.name + ' in ' + (s.cladding === 'charred' ? 'charred' : 'natural') + ' larch on a ' + s.plot.name.toLowerCase() +
      (extras.length ? ', with ' + extras.join(', ') : '') + ' — ' + A.money(total(s)) + ' — sent to ' + email.value.trim() + '.';
    document.getElementById('cfSentText').textContent = text;
    document.getElementById('sendFields').hidden = true;
    document.getElementById('cfSubmit').parentElement.hidden = true;
    var sent = document.getElementById('cfSent');
    sent.hidden = false;
    sent.setAttribute('tabindex', '-1');
    sent.focus();
  });
})();
