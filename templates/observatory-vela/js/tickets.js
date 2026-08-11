/* VELA — the basket. Every figure comes from VELA.basket.totals(), so the line
   items, the member saving and the amount due are the same arithmetic the rest
   of the site quotes. */
(function (root, doc) {
  'use strict';

  var VELA = root.VELA, R = root.VelaRender;
  if (!VELA || !R) return;

  function el(id) { return doc.getElementById(id); }

  /* ---- lines ------------------------------------------------------------- */

  function renderLines() {
    var host = el('basketBody');
    if (!host) return;
    var t = VELA.basket.totals();

    if (!t.lines.length) {
      host.innerHTML = '<div class="empty"><p>Your basket is empty.</p>' +
        '<p class="btn-row"><a class="btn" href="whats-on.html">See what&rsquo;s on</a></p></div>';
      return;
    }

    host.innerHTML = t.lines.map(function (l) {
      return '<div class="line" data-sku="' + R.esc(l.sku) + '">' +
        '<div><span class="line__title">' + R.esc(l.title) + '</span>' +
          (l.meta ? '<br><span class="line__meta">' + R.esc(l.meta) + '</span>' : '') +
          '<div class="line__ctl">' +
            '<span class="stepper">' +
              '<button type="button" data-step="-1" data-sku="' + R.esc(l.sku) +
                '" aria-label="One fewer ' + R.esc(l.title) + '">&minus;</button>' +
              '<output aria-label="Quantity">' + l.qty + '</output>' +
              '<button type="button" data-step="1" data-sku="' + R.esc(l.sku) +
                '" aria-label="One more ' + R.esc(l.title) + '">+</button>' +
            '</span>' +
            '<button class="link-quiet" type="button" data-remove="' + R.esc(l.sku) +
              '">Remove</button>' +
          '</div>' +
        '</div>' +
        '<div class="line__sum">' + VELA.money(l.unit * l.qty) +
          '<br><span class="line__meta">' + VELA.money(l.unit) + ' each</span></div>' +
        '</div>';
    }).join('');
  }

  /* ---- admission buttons ------------------------------------------------- */

  function renderAdmission() {
    var host = el('admissionAdd');
    if (!host) return;
    host.innerHTML = VELA.tickets.admission
      .filter(function (t) { return t.price > 0; })
      .map(function (t) {
        return '<div class="line"><div><span class="line__title">' + R.esc(t.label) +
          '</span><br><span class="line__meta">' + R.esc(t.note) + '</span></div>' +
          '<div class="line__sum">' + VELA.money(t.price) +
          '<br><button class="btn btn--sm" type="button" data-admission="' + R.esc(t.id) +
          '">Add</button></div></div>';
      }).join('');
  }

  /* ---- totals ------------------------------------------------------------ */

  function renderTotals() {
    var host = el('totals');
    if (!host) return;
    var t = VELA.basket.totals();
    var rows = [];

    if (!t.lines.length) { host.innerHTML = ''; return; }

    rows.push(row('Subtotal', VELA.money(t.gross)));
    if (t.saving > 0) {
      rows.push(row('Member discount (' +
        Math.round(VELA.tickets.memberDiscount * 100) + '%)',
        '&minus;' + VELA.money(t.saving), 'totals__row--save'));
    }
    rows.push(row('Total', VELA.money(t.total), 'totals__row--sum'));

    host.innerHTML = rows.join('') +
      '<label class="field bay--half"><span>' +
      '<input type="checkbox" id="memberCheck"' + (VELA.basket.isMember() ? ' checked' : '') +
      '> I am already a VELA member</span></label>';

    var chk = el('memberCheck');
    if (chk) {
      chk.addEventListener('change', function () { VELA.basket.setMember(chk.checked); });
    }

    var block = el('checkoutBlock');
    if (block) block.hidden = false;
  }

  function row(label, value, cls) {
    return '<div class="totals__row' + (cls ? ' ' + cls : '') + '"><span>' + label +
      '</span><span>' + value + '</span></div>';
  }

  /* ---- join prompt ------------------------------------------------------- */

  /* Only shown when joining today would actually cost the visitor less than
     paying full price — otherwise it is just an upsell pretending to be help. */
  function renderJoin() {
    var host = el('joinPrompt');
    if (!host) return;
    var t = VELA.basket.totals();
    var cheapest = VELA.membership.reduce(function (a, b) {
      return b.price < a.price ? b : a;
    });

    if (t.member || t.wouldSave <= 0) { host.hidden = true; host.innerHTML = ''; return; }

    var admissionInBasket = t.lines.reduce(function (n, l) {
      return n + (l.kind === 'ticket' && /^adm-/.test(l.sku) ? l.unit * l.qty : 0);
    }, 0);
    var totalBenefit = t.wouldSave + admissionInBasket;
    var net = cheapest.price - totalBenefit;

    host.hidden = false;
    host.innerHTML = '<div class="note bay--half"><p><strong>' +
      (net <= 0
        ? 'Joining today would cost you less than this basket does.'
        : 'Membership would take ' + VELA.money(totalBenefit) + ' off this visit.') +
      '</strong></p><p>' + R.esc(cheapest.label) + ' membership is ' +
      VELA.money(cheapest.price) + ' for a year. It covers admission for you every visit and ' +
      Math.round(VELA.tickets.memberDiscount * 100) + '% off every session &mdash; ' +
      (net <= 0
        ? 'on this basket alone you would be ' + VELA.money(-net) + ' ahead.'
        : 'so it pays for itself after about ' +
          Math.max(2, Math.ceil(cheapest.price / Math.max(1, totalBenefit))) + ' visits like this one.') +
      '</p><p class="btn-row"><button class="btn btn--sm btn--signal" type="button" ' +
      'data-join="' + R.esc(cheapest.id) + '">Add ' + R.esc(cheapest.label) +
      ' membership</button> <a class="btn btn--sm btn--ghost" href="membership.html">' +
      'Compare tiers</a></p></div>';
  }

  /* ---- events ------------------------------------------------------------ */

  doc.addEventListener('click', function (e) {
    var t = e.target;
    if (!t.closest) return;

    var step = t.closest('[data-step]');
    if (step) {
      var sku = step.getAttribute('data-sku');
      var line = VELA.basket.lines().filter(function (l) { return l.sku === sku; })[0];
      if (line) VELA.basket.setQty(sku, line.qty + parseInt(step.getAttribute('data-step'), 10));
      return;
    }

    var rm = t.closest('[data-remove]');
    if (rm) { VELA.basket.remove(rm.getAttribute('data-remove')); return; }

    var add = t.closest('[data-admission]');
    if (add) {
      var id = add.getAttribute('data-admission');
      var tk = VELA.tickets.admission.filter(function (x) { return x.id === id; })[0];
      if (tk) {
        VELA.basket.add({
          sku: 'adm-' + tk.id, title: tk.label + ' admission', meta: tk.note,
          unit: tk.price, qty: 1, kind: 'ticket'
        });
      }
      return;
    }

    var join = t.closest('[data-join]');
    if (join) {
      var mid = join.getAttribute('data-join');
      var m = VELA.membership.filter(function (x) { return x.id === mid; })[0];
      if (m) {
        VELA.basket.add({
          sku: 'mem-' + m.id, title: m.label + ' membership',
          meta: 'One year from purchase', unit: m.price, qty: 1,
          kind: 'membership', discountable: false
        });
      }
    }
  });

  function paint() {
    renderLines();
    renderTotals();
    renderJoin();
  }

  function boot() {
    renderAdmission();
    paint();
    root.addEventListener('vela:basket', paint);

    var form = el('checkoutForm');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var name = el('cName'), email = el('cEmail');
        if (!name.value.trim() || !email.value.trim() || !email.checkValidity()) {
          (name.value.trim() ? email : name).focus();
          return;
        }
        var t = VELA.basket.totals();
        var done = el('checkoutDone');
        form.hidden = true;
        done.hidden = false;
        done.innerHTML = '<div class="note"><p><strong>Nearly there, ' +
          R.esc(name.value.trim().split(' ')[0]) + '.</strong></p>' +
          '<p>We are handing you to our payment provider for ' + VELA.money(t.total) +
          '. Your tickets will be emailed to ' + R.esc(email.value.trim()) +
          ' as soon as that completes, along with directions and what to wear &mdash; it is ' +
          'six degrees colder on the fell than in the car park.</p>' +
          '<p class="btn-row"><a class="btn btn--sm btn--ghost" href="visit.html">' +
          'Read the visitor notes</a></p></div>';
        done.focus();
      });
    }
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window, document);
