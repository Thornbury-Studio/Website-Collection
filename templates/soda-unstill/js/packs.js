/* UNSTILL — the crate builder and basket. Twelve slots, live maths, and the
   totals the checkout charges are the totals the builder showed. */
(function (root, doc) {
  'use strict';

  var U = root.UNSTILL;
  if (!U) return;

  var SIZE = U.pricing.crateSize;
  var mix = { citrus: 0, burn: 0, mood: 0, snap: 0 };

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function count() {
    return mix.citrus + mix.burn + mix.mood + mix.snap;
  }
  function el(id) { return doc.getElementById(id); }

  /* ---- crate render ------------------------------------------------------- */

  function renderCrate() {
    var host = el('crate');
    if (!host) return;
    var slots = [];
    var order = [];
    U.flavors.forEach(function (f) {
      for (var i = 0; i < mix[f.id]; i++) order.push(f.id);
    });
    for (var s = 0; s < SIZE; s++) {
      if (s < order.length) {
        var fid = order[s];
        var f = U.flavor(fid);
        slots.push('<button type="button" class="crate__slot crate__slot--full" ' +
          'data-take="' + fid + '" aria-label="Remove one ' + esc(f.name) + ' from the crate">' +
          '<span class="crate__can crate__can--' + fid + '"></span></button>');
      } else {
        slots.push('<span class="crate__slot" aria-hidden="true"></span>');
      }
    }
    host.innerHTML = slots.join('');

    var hint = el('crateHint');
    var n = count();
    if (hint) {
      hint.textContent = n === 0 ? 'Empty crate. Add cans below, or grab a preset.'
        : n < SIZE ? (SIZE - n) + ' more to fill it — the discount lands on a full crate.'
        : 'Full crate. The discount is on.';
    }
  }

  function renderAdders() {
    var host = el('crateAdders');
    if (!host) return;
    host.innerHTML = U.flavors.map(function (f) {
      return '<button class="btn btn--sm" type="button" data-add="' + f.id + '">' +
        '+ ' + esc(f.name) + '</button>';
    }).join('');
  }

  function renderCrateTotals() {
    var host = el('crateTotals');
    if (!host) return;
    var n = count();
    var singles = U.pricing.can * n;
    var full = n === SIZE;
    var sub = el('subCheck') && el('subCheck').checked;
    var price = full ? (sub ? U.subCratePrice() : U.cratePrice()) : singles;
    var rows = [];
    rows.push(row('Cans so far', n + ' / ' + SIZE));
    rows.push(row('At the single-can price', U.money(singles)));
    if (full) {
      rows.push(row('Full-crate discount (' + Math.round(U.pricing.crateDiscount * 100) + '%)',
        '&minus;' + U.money(singles - U.cratePrice()), 'totals__row--save'));
      if (sub) {
        rows.push(row('Subscription (' + Math.round(U.pricing.subDiscount * 100) + '%)',
          '&minus;' + U.money(U.cratePrice() - U.subCratePrice()), 'totals__row--save'));
      }
    }
    rows.push(row(full ? 'This crate' : 'Fill the crate to unlock the discount',
      full ? U.money(price) : U.money(singles), 'totals__row--sum'));
    host.innerHTML = rows.join('');

    var subHint = el('subHint');
    if (subHint) {
      subHint.textContent = 'A subscribed crate is ' + U.money(U.subCratePrice()) +
        ' — ' + U.money(U.cratePrice() - U.subCratePrice()) +
        ' under the one-off crate, every month, cancellable in one click.';
    }
    var add = el('addCrate');
    if (add) {
      add.disabled = !full;
      add.textContent = full
        ? 'Add crate — ' + U.money(price)
        : 'Fill the crate first';
    }
  }

  function row(label, value, cls) {
    return '<div class="totals__row' + (cls ? ' ' + cls : '') + '"><span>' + label +
      '</span><span class="num">' + value + '</span></div>';
  }

  function paintBuilder() {
    renderCrate();
    renderCrateTotals();
  }

  /* ---- order lines -------------------------------------------------------- */

  function mixLabel(m) {
    return U.flavors.filter(function (f) { return m[f.id] > 0; })
      .map(function (f) { return m[f.id] + '× ' + f.name; }).join(', ');
  }

  function renderOrder() {
    var host = el('basketBody');
    var totals = el('orderTotals');
    if (!host) return;
    var t = U.basket.totals();

    if (!t.lines.length) {
      host.innerHTML = '<div class="empty"><p>No crates yet. The builder above is ' +
        'ready when you are.</p></div>';
      if (totals) totals.innerHTML = '';
      var block0 = el('checkoutBlock');
      if (block0) block0.hidden = true;
      return;
    }

    host.innerHTML = t.lines.map(function (l) {
      return '<div class="line">' +
        '<div><span class="line__title">' +
        (l.kind === 'sub' ? 'Monthly crate' : 'Crate of twelve') + '</span><br>' +
        '<span class="line__meta">' + esc(mixLabel(l.mix)) + '</span>' +
        '<div class="line__ctl">' +
        '<span class="stepper">' +
        '<button type="button" data-step="-1" data-sku="' + esc(l.sku) + '" aria-label="One fewer of this crate">&minus;</button>' +
        '<output aria-label="Quantity">' + l.qty + '</output>' +
        '<button type="button" data-step="1" data-sku="' + esc(l.sku) + '" aria-label="One more of this crate">+</button>' +
        '</span>' +
        '<button class="link-quiet" type="button" data-remove="' + esc(l.sku) + '">Remove</button>' +
        '</div></div>' +
        '<div class="line__sum">' + U.money(l.unit * l.qty) +
        (l.kind === 'sub' ? '<br><span class="line__meta">per month</span>' : '') +
        '</div></div>';
    }).join('');

    if (totals) {
      var rows = [row('Crates', String(t.lines.reduce(function (n, l) { return n + l.qty; }, 0)))];
      if (t.savedVsSingles > 0) {
        rows.push(row('Against single-can prices',
          '&minus;' + U.money(t.savedVsSingles), 'totals__row--save'));
      }
      rows.push(row('Delivery', 'Free', ''));
      rows.push(row('Total', U.money(t.total), 'totals__row--sum'));
      totals.innerHTML = rows.join('');
    }
    var block = el('checkoutBlock');
    if (block) block.hidden = false;
  }

  /* ---- events ------------------------------------------------------------- */

  doc.addEventListener('click', function (e) {
    var t = e.target;
    if (!t.closest) return;

    var add = t.closest('[data-add]');
    if (add && count() < SIZE) {
      mix[add.getAttribute('data-add')]++;
      paintBuilder();
      return;
    }
    var take = t.closest('[data-take]');
    if (take) {
      var fid = take.getAttribute('data-take');
      if (mix[fid] > 0) mix[fid]--;
      paintBuilder();
      return;
    }
    var preset = t.closest('[data-preset]');
    if (preset) {
      var p = preset.getAttribute('data-preset');
      if (p === 'even') mix = { citrus: 3, burn: 3, mood: 3, snap: 3 };
      else if (p === 'clear') mix = { citrus: 0, burn: 0, mood: 0, snap: 0 };
      else { mix = { citrus: 0, burn: 0, mood: 0, snap: 0 }; mix[p] = SIZE; }
      paintBuilder();
      return;
    }
    var step = t.closest('[data-step]');
    if (step) {
      var sku = step.getAttribute('data-sku');
      var line = U.basket.lines().filter(function (l) { return l.sku === sku; })[0];
      if (line) U.basket.setQty(sku, line.qty + parseInt(step.getAttribute('data-step'), 10));
      return;
    }
    var rm = t.closest('[data-remove]');
    if (rm) U.basket.remove(rm.getAttribute('data-remove'));
  });

  function boot() {
    renderAdders();
    paintBuilder();
    renderOrder();

    var sub = el('subCheck');
    if (sub) sub.addEventListener('change', renderCrateTotals);

    var add = el('addCrate');
    if (add) {
      add.addEventListener('click', function () {
        if (count() !== SIZE) return;
        var ok = U.basket.addCrate(
          { citrus: mix.citrus, burn: mix.burn, mood: mix.mood, snap: mix.snap },
          !!(sub && sub.checked));
        if (ok) {
          mix = { citrus: 0, burn: 0, mood: 0, snap: 0 };
          if (sub) sub.checked = false;
          paintBuilder();
        }
      });
    }

    root.addEventListener('unstill:basket', renderOrder);

    var form = el('checkoutForm');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var name = el('cName'), email = el('cEmail'), pc = el('cPostcode');
        var bad = !name.value.trim() ? name
          : (!email.value.trim() || !email.checkValidity()) ? email
          : !pc.value.trim() ? pc : null;
        if (bad) { bad.focus(); return; }
        var t = U.basket.totals();
        form.hidden = true;
        var done = el('checkoutDone');
        done.hidden = false;
        done.innerHTML = '<div class="note"><p><strong>Nearly there, ' +
          esc(name.value.trim().split(' ')[0]) + '.</strong></p>' +
          '<p>Handing you to our payment provider for ' + U.money(t.total) +
          '. Confirmation and tracking go to ' + esc(email.value.trim()) +
          '. The cans will arrive agitated, which is correct.</p></div>';
        done.setAttribute('tabindex', '-1');
        done.focus();
      });
    }
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window, document);
