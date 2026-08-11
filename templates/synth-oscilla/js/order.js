/* ============================================================================
   OSCILLA — checkout
   ----------------------------------------------------------------------------
   Totals come from the same basket functions the drawer uses, so the set
   saving promised on the range page is the saving applied here. Shipping is
   the only figure added, and it is shown before it is charged.
   ========================================================================== */
(function (O) {
  'use strict';

  var U = O.ui, $ = U.$;
  var SHIP = { dom: 0, eu: 38, world: 64 };
  var SHIP_L = { dom: 'Free', eu: '$38.00', world: '$64.00' };

  function ship() { return SHIP[$('#fCountry').value] || 0; }

  function paint() {
    if (!$('#doneState').hidden) return;
    var lines = O.basket.read();
    var has = lines.length > 0;
    $('#emptyState').hidden = has;
    $('#fullState').hidden = !has;
    if (!has) return;

    $('#orderLines').innerHTML = lines.map(function (l) {
      var it = O.byId(l.id);
      return '<div class="bline oline">' +
          (it.img
            ? '<img class="bline__img" src="img/' + U.esc(it.img) + '" width="62" height="62" loading="lazy" decoding="async" alt="">'
            : '<span class="bline__img" aria-hidden="true"></span>') +
          '<div><p class="bline__n">' + U.esc(it.name) + '</p>' +
          '<p class="bline__p">' + U.esc(it.code) + ' · ' + O.money(it.price) + ' each</p></div>' +
          '<span class="step-n">' +
            '<button type="button" data-dec="' + it.id + '" aria-label="One fewer ' + U.esc(it.name) + '">&minus;</button>' +
            '<b class="u-num">' + l.qty + '</b>' +
            '<button type="button" data-inc="' + it.id + '" aria-label="One more ' + U.esc(it.name) + '">+</button>' +
          '</span>' +
        '</div>';
    }).join('');

    var sub = O.basket.subtotal(lines), disc = O.basket.discount(lines), bundles = O.basket.bundlesIn(lines);
    $('#sumRows').innerHTML =
      '<div class="sumrow">' +
      '<span>' + O.basket.count(lines) + ' item' + (O.basket.count(lines) === 1 ? '' : 's') +
      '</span><b class="u-num">' + O.money(sub) + '</b></div>';

    var save = $('#sumSave');
    save.hidden = !disc;
    $('#sumSaveL').textContent = bundles > 1 ? bundles + ' set savings' : 'Set saving';
    $('#sumSaveV').textContent = '−' + O.money(disc);

    $('#sumShip').textContent = SHIP_L[$('#fCountry').value];
    $('#sumTotal').textContent = O.money(O.basket.total(lines) + ship());
  }

  document.addEventListener('oscilla:basket', paint);
  $('#fCountry').addEventListener('change', function () {
    paint();
    U.toast('Shipping set to ' + SHIP_L[$('#fCountry').value] + '.');
  });

  /* -- validation ------------------------------------------------------------ */
  var FIELDS = { '#fName': '#eName', '#fEmail': '#eEmail', '#fAddr': '#eAddr' };
  Object.keys(FIELDS).forEach(function (id) {
    var el = $(id), err = $(FIELDS[id]);
    el.addEventListener('input', function () {
      el.setAttribute('aria-invalid', 'false'); err.hidden = true;
    });
  });

  function fail(el, err, bad) {
    err.hidden = !bad;
    el.setAttribute('aria-invalid', bad ? 'true' : 'false');
    return bad;
  }

  function validate() {
    var bad = null;
    if (fail($('#fName'), $('#eName'), $('#fName').value.trim().length < 2)) bad = bad || '#fName';
    if (fail($('#fEmail'), $('#eEmail'), !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test($('#fEmail').value.trim()))) bad = bad || '#fEmail';
    if (fail($('#fAddr'), $('#eAddr'), $('#fAddr').value.trim().length < 10)) bad = bad || '#fAddr';
    return bad;
  }

  $('#orderForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var lines = O.basket.read();
    if (!lines.length) return;
    var bad = validate();
    if (bad) {
      var el = $(bad);
      el.focus();
      el.scrollIntoView({ block: 'center', behavior: U.reduce ? 'auto' : 'smooth' });
      U.toast('A couple of fields need attention.', 'warn');
      return;
    }

    var btn = $('#sendBtn'), label = $('#sendLabel');
    btn.setAttribute('data-busy', '1');
    label.textContent = 'Booking a slot…';

    var sub = O.basket.subtotal(lines), disc = O.basket.discount(lines);
    var s = ship(), total = O.basket.total(lines) + s;
    var names = lines.map(function (l) { return l.qty + '× ' + O.byId(l.id).name; }).join(', ');

    setTimeout(function () {
      btn.removeAttribute('data-busy');
      label.textContent = 'Place the order';

      $('#doneRef').textContent = 'OS-' + String(2200 + Math.floor(Math.random() * 6000));
      $('#doneP').textContent = 'Thank you, ' + $('#fName').value.trim() + '. ' + names +
        ' — your build slot is booked and we will write to ' + $('#fEmail').value.trim() +
        ' with a date when it goes on the bench. Nothing has been charged.';
      $('#doneFacts').innerHTML =
        '<div><dt>Instruments</dt><dd>' + U.esc(names) + '</dd></div>' +
        '<div><dt>Subtotal</dt><dd>' + O.money(sub) + '</dd></div>' +
        (disc ? '<div><dt>Set saving</dt><dd>−' + O.money(disc) + '</dd></div>' : '') +
        '<div><dt>Shipping</dt><dd>' + SHIP_L[$('#fCountry').value] + '</dd></div>' +
        '<div><dt>Total, invoiced later</dt><dd>' + O.money(total) + '</dd></div>';

      O.basket.clear();
      $('#orderState').hidden = true;
      $('#doneState').hidden = false;
      window.scrollTo({ top: 0, behavior: U.reduce ? 'auto' : 'smooth' });
    }, 850);
  });

  U.init();
  paint();
})(window.OSCILLA);
