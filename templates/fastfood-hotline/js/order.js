/* ============================================================================
   HOTLINE — order page
   ----------------------------------------------------------------------------
   The arithmetic here is the same arithmetic the box builder promised: box
   savings come from HOTLINE.bag.discount(), not from a second copy of the rule.
   Validation is real — a bad mobile or an out-of-radius postcode stops the
   submit and moves focus to the field that failed.
   ========================================================================== */
(function (H) {
  'use strict';

  var U = H.ui, $ = U.$;
  var DELIVERY_FEE = 4.00;
  var mode = 'collect';

  /* Delivery covers the districts around the counter. Singapore postcodes are
     six digits and the first two are the sector. */
  var SECTORS = ['20', '21', '30', '31', '32', '33'];

  /* -- render ------------------------------------------------------------- */

  function paint() {
    var lines = H.bag.read();
    var empty = $('#emptyState'), order = $('#orderState'), done = $('#doneState');
    if (done && !done.hidden) return;                 // confirmation is showing; leave it

    var has = lines.length > 0;
    if (empty) empty.hidden = has;
    if (order) order.hidden = !has;
    if (!has) return;

    var box = $('#orderLines');
    if (box) box.innerHTML = lines.map(function (l) {
      var it = H.byId(l.id);
      return '<div class="oline">' +
          (it.img ? '<img class="oline__img" src="img/' + U.esc(it.img) + '" width="88" height="88" loading="lazy" decoding="async" alt="">'
                  : '<span class="oline__img oline__img--none" aria-hidden="true"><i>' + U.esc(it.no) + '</i></span>') +
          '<div class="oline__t">' +
            '<p class="oline__n">' + U.esc(it.name) + '</p>' +
            '<p class="oline__d">' + H.money(it.price) + ' each' + (it.heat ? ' · heat ' + it.heat + '/5' : '') + '</p>' +
          '</div>' +
          '<span class="step">' +
            '<button type="button" data-dec="' + it.id + '" aria-label="One fewer ' + U.esc(it.name) + '">&minus;</button>' +
            '<b class="u-num">' + l.qty + '</b>' +
            '<button type="button" data-inc="' + it.id + '" aria-label="One more ' + U.esc(it.name) + '">+</button>' +
          '</span>' +
          '<span class="oline__p u-num">' + H.money(it.price * l.qty) + '</span>' +
          '<button class="oline__x" type="button" data-rm="' + it.id + '" aria-label="Remove ' + U.esc(it.name) + '">&times;</button>' +
        '</div>';
    }).join('');

    var rows = $('#sumRows');
    if (rows) rows.innerHTML =
      '<p class="sum__row"><span>' + H.bag.count(lines) + ' item' + (H.bag.count(lines) === 1 ? '' : 's') +
      '</span><b class="u-num">' + H.money(H.bag.total(lines)) + '</b></p>';

    var boxes = H.bag.boxesIn(lines), save = H.bag.discount(lines);
    var saveRow = $('#sumSave');
    if (saveRow) {
      saveRow.hidden = !boxes;
      var l = $('#sumSaveL'), v = $('#sumSaveV');
      if (l) l.textContent = boxes === 1 ? 'Box saving' : boxes + ' box savings';
      if (v) v.textContent = '−' + H.money(save);
    }

    var feeRow = $('#sumFeeRow'), fee = mode === 'deliver' ? DELIVERY_FEE : 0;
    if (feeRow) feeRow.hidden = mode !== 'deliver';

    var tot = $('#sumTotal');
    if (tot) tot.textContent = H.money(H.bag.payable(lines) + fee);

    var pay = $('#sumPay');
    if (pay) pay.textContent = mode === 'deliver' ? 'Pay the rider on arrival' : 'Pay at the counter';

    var closed = $('#sumClosed');
    if (closed) closed.hidden = H.service().open;
  }

  /* -- fulfilment --------------------------------------------------------- */

  function segment() {
    U.$$('.seg__b').forEach(function (b) {
      b.addEventListener('click', function () {
        mode = b.getAttribute('data-mode');
        U.$$('.seg__b').forEach(function (x) {
          x.setAttribute('aria-checked', String(x === b));
        });
        var deliver = mode === 'deliver';
        var addr = $('#addrField'), post = $('#postField');
        if (addr) addr.hidden = !deliver;
        if (post) post.hidden = !deliver;
        paint();
      });
    });
  }

  /* -- validation --------------------------------------------------------- */

  function fail(id, errId, on) {
    var f = $(id), e = $(errId);
    if (e) e.hidden = !on;
    if (f) f.setAttribute('aria-invalid', on ? 'true' : 'false');
    return on;
  }

  function validate() {
    var bad = null;

    var name = ($('#fName').value || '').trim();
    if (fail('#fName', '#eName', name.length < 2)) bad = bad || '#fName';

    var phone = ($('#fPhone').value || '').replace(/\s|-/g, '');
    if (fail('#fPhone', '#ePhone', !/^[89]\d{7}$/.test(phone))) bad = bad || '#fPhone';

    if (mode === 'deliver') {
      var addr = ($('#fAddr').value || '').trim();
      if (fail('#fAddr', '#eAddr', addr.length < 6)) bad = bad || '#fAddr';

      var post = ($('#fPost').value || '').trim();
      var ok = /^\d{6}$/.test(post) && SECTORS.indexOf(post.slice(0, 2)) > -1;
      if (fail('#fPost', '#ePost', !ok)) bad = bad || '#fPost';
    } else {
      fail('#fAddr', '#eAddr', false);
      fail('#fPost', '#ePost', false);
    }
    return bad;
  }

  /* -- submit ------------------------------------------------------------- */

  function eta() {
    var base = mode === 'deliver' ? 25 : 12;
    return base + '—' + (base + (mode === 'deliver' ? 15 : 6)) + ' min';
  }

  function submit(e) {
    e.preventDefault();
    var bad = validate();
    if (bad) {
      var el = $(bad);
      if (el) { el.focus(); el.scrollIntoView({ block: 'center', behavior: U.reduce ? 'auto' : 'smooth' }); }
      return;
    }

    var lines = H.bag.read();
    if (!lines.length) return;

    var fee = mode === 'deliver' ? DELIVERY_FEE : 0;
    var payable = H.bag.payable(lines) + fee;
    var no = '#' + (4472 + Math.floor(Math.random() * 400));
    var name = ($('#fName').value || '').trim();

    var doneNo = $('#doneNo'); if (doneNo) doneNo.textContent = no;
    var doneP = $('#doneP');
    if (doneP) {
      doneP.textContent = (mode === 'deliver'
        ? 'Thanks ' + name + '. A rider will bring it over in about ' + eta() + '. '
        : 'Thanks ' + name + '. It will be boxed and waiting in about ' + eta() + '. ')
        + 'We will text ' + ($('#fPhone').value || '').trim() + ' when it is ready.';
    }

    var grid = $('#doneLines');
    if (grid) {
      grid.innerHTML = lines.map(function (l) {
        var it = H.byId(l.id);
        return '<p class="done__line"><b>' + l.qty + '×</b> ' + U.esc(it.name) +
               '<i></i><span class="u-num">' + H.money(it.price * l.qty) + '</span></p>';
      }).join('') +
      '<p class="done__line done__line--tot"><b>To pay</b><i></i><span class="u-num">' +
      H.money(payable) + '</span></p>';
    }

    H.bag.clear();
    $('#orderState').hidden = true;
    $('#emptyState').hidden = true;
    $('#doneState').hidden = false;
    window.scrollTo({ top: 0, behavior: U.reduce ? 'auto' : 'smooth' });
  }

  /* -- go ----------------------------------------------------------------- */

  document.addEventListener('click', function (e) {
    var rm = e.target.closest('[data-rm]');
    if (rm) H.bag.remove(rm.getAttribute('data-rm'));
  });
  document.addEventListener('hotline:bag', paint);

  // clear an error the moment the field is being corrected
  var FIELDS = {
    '#fName':  '#eName',
    '#fPhone': '#ePhone',
    '#fAddr':  '#eAddr',
    '#fPost':  '#ePost'
  };
  Object.keys(FIELDS).forEach(function (id) {
    var el = $(id), err = $(FIELDS[id]);
    if (!el) return;
    el.addEventListener('input', function () {
      el.setAttribute('aria-invalid', 'false');
      if (err) err.hidden = true;
    });
  });

  var form = $('#orderForm');
  if (form) form.addEventListener('submit', submit);

  segment();
  U.initBag();
  U.initStatus();
  paint();
})(window.HOTLINE);
