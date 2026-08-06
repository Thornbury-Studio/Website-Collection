/* =====================================================================
   THE BRASS OX — ordering flow.
   No dependencies. The board renders from OX_MENU; the ticket lives in
   localStorage. Checkout validates like production and submits nowhere.
   ===================================================================== */
(function () {
  'use strict';

  var MENU = window.OX_MENU || [];
  var byId = {};
  MENU.forEach(function (m) { byId[m.id] = m; });

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (id) { return document.getElementById(id); };
  var money = function (c) { return '$' + (c / 100).toFixed(2); };
  var plain = function (c) { return (c / 100).toFixed(2); };

  var TAX = 0.1025;          // Chicago restaurant tax, near enough
  var DELIVERY = 590;

  /* ==================================================================
     1. Build the board
     ================================================================== */

  var TAGS = {
    vegetarian: ['veg', 'Veg'],
    'gluten-free': ['gf', 'GF'],
    spicy: ['spicy', 'Spicy']
  };

  function tagRow(tags) {
    return tags.map(function (t) {
      var d = TAGS[t];
      return d ? '<span class="tag ' + d[0] + '">' + d[1] + '</span>' : '';
    }).join('');
  }

  function render() {
    var slots = {};
    [].slice.call(document.querySelectorAll('.cards[data-cat]')).forEach(function (el) {
      slots[el.getAttribute('data-cat')] = el;
    });
    MENU.forEach(function (m) {
      var slot = slots[m.cat];
      if (!slot) return;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'dish';
      b.setAttribute('data-id', m.id);
      b.setAttribute('data-tags', m.tags.join(' '));
      b.setAttribute('aria-label', m.name + ', ' + money(m.price) + ', choose options');
      b.innerHTML =
        '<span class="dish-shot">' +
          '<img src="' + m.img + '" alt="" width="800" height="600" loading="lazy" decoding="async">' +
          (m.weight ? '<span class="dish-weight">' + m.weight + '</span>' : '') +
          '<span class="dish-plus" aria-hidden="true">+</span>' +
        '</span>' +
        '<span class="dish-body">' +
          '<span class="dish-line">' +
            '<span class="dish-name">' + m.name + '</span>' +
            '<span class="dish-dots" aria-hidden="true"></span>' +
            '<span class="dish-price">' + money(m.price) + '</span>' +
          '</span>' +
          '<span class="dish-desc">' + m.desc + '</span>' +
          (m.tags.length ? '<span class="dish-tags">' + tagRow(m.tags) + '</span>' : '') +
        '</span>';
      b.addEventListener('click', function () { openBuilder(m.id); });
      slot.appendChild(b);
    });
  }
  render();

  /* ==================================================================
     2. Rail: scrollspy + filters
     ================================================================== */

  var railLinks = [].slice.call(document.querySelectorAll('.rail-nav a'));
  var courses = [].slice.call(document.querySelectorAll('.course'));

  function markRail(cat) {
    railLinks.forEach(function (a) {
      a.classList.toggle('is-active', a.getAttribute('data-cat') === cat);
    });
  }

  window.addEventListener('scroll', function () {
    var line = window.scrollY + 180;
    var cur = 'starters';
    courses.forEach(function (c) { if (c.offsetTop <= line) cur = c.id.replace('c-', ''); });
    markRail(cur);
  }, { passive: true });

  var pills = [].slice.call(document.querySelectorAll('.pill'));
  var railLive = $('railLive');

  pills.forEach(function (p) {
    p.addEventListener('click', function () {
      pills.forEach(function (o) {
        var on = o === p;
        o.classList.toggle('is-on', on);
        o.setAttribute('aria-pressed', String(on));
      });
      var f = p.getAttribute('data-filter');
      var shown = 0, total = 0;
      [].slice.call(document.querySelectorAll('.dish')).forEach(function (el) {
        total++;
        var tags = (el.getAttribute('data-tags') || '').split(' ');
        var hit = f === 'all' ||
                  tags.indexOf(f) !== -1 ||
                  tags.indexOf(f + '-option') !== -1;
        el.classList.toggle('is-dim', !hit);
        if (hit) shown++;
      });
      if (railLive) {
        railLive.textContent = f === 'all'
          ? 'Showing all ' + total + ' dishes.'
          : shown + ' of ' + total + ' dishes match ' + p.textContent.trim() + '.';
      }
    });
  });

  /* ==================================================================
     3. Builder
     ================================================================== */

  var builder = $('builder'), scrim = $('itemScrim'), bForm = $('bForm');
  var qty = 1, current = null, lastFocus = null;

  function openBuilder(id) {
    var m = byId[id];
    if (!m) return;
    current = m;
    qty = 1;
    $('bQty').textContent = '1';
    $('bImg').src = m.img;
    $('bTitle').textContent = m.name;
    $('bDesc').textContent = m.desc;
    var w = $('bWeight');
    w.hidden = !m.weight;
    if (m.weight) w.textContent = m.weight;

    bForm.innerHTML = m.mods.map(function (g, gi) {
      var name = 'g' + gi;
      if (g.type === 'pick') {
        return '<fieldset class="grp"><legend>' + g.name + '<small>choose one</small></legend>' +
          '<div class="seg">' + g.options.map(function (o, oi) {
            return '<label><input type="radio" name="' + name + '" value="' + oi + '"' +
              (oi === 0 ? ' checked' : '') + '><span>' + o[0] +
              (o[1] ? '<em>' + (o[1] > 0 ? '+' : '−') + '$' + Math.abs(o[1] / 100).toFixed(2) + '</em>' : '') +
              '</span></label>';
          }).join('') + '</div></fieldset>';
      }
      return '<fieldset class="grp"><legend>' + g.name + '<small>optional</small></legend>' +
        '<div class="adds">' + g.options.map(function (o, oi) {
          return '<label><input type="checkbox" name="' + name + '" value="' + oi + '">' +
            '<span class="a-name">' + o[0] + '</span>' +
            '<span class="a-cost">' + (o[1] ? '+$' + (o[1] / 100).toFixed(2) : 'free') + '</span></label>';
        }).join('') + '</div></fieldset>';
    }).join('');

    bForm.addEventListener('change', priceBuilder);
    priceBuilder();

    lastFocus = document.activeElement;
    scrim.hidden = false;
    builder.hidden = false;
    document.body.style.overflow = 'hidden';
    $('builderX').focus();
  }

  function readBuilder() {
    if (!current) return { picked: [], delta: 0 };
    var picked = [], delta = 0;
    current.mods.forEach(function (g, gi) {
      [].slice.call(bForm.querySelectorAll('[name="g' + gi + '"]:checked')).forEach(function (inp) {
        var o = g.options[+inp.value];
        // a default radio choice is noise on a ticket; a doneness never is
        var isDoneness = /cook it/i.test(g.name);
        if (g.type === 'add' || +inp.value !== 0 || isDoneness) picked.push(o[0]);
        delta += o[1];
      });
    });
    return { picked: picked, delta: delta };
  }

  function priceBuilder() {
    if (!current) return;
    var r = readBuilder();
    $('bPrice').textContent = money((current.price + r.delta) * qty);
  }

  $('bPlus').addEventListener('click', function () { qty = Math.min(qty + 1, 20); $('bQty').textContent = qty; priceBuilder(); });
  $('bMinus').addEventListener('click', function () { qty = Math.max(qty - 1, 1); $('bQty').textContent = qty; priceBuilder(); });

  function closeBuilder() {
    builder.hidden = true;
    scrim.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) { lastFocus.focus(); lastFocus = null; }
  }
  $('builderX').addEventListener('click', closeBuilder);
  scrim.addEventListener('click', closeBuilder);

  $('bAdd').addEventListener('click', function () {
    if (!current) return;
    var r = readBuilder();
    addLine(current.id, qty, r.picked, current.price + r.delta);
    closeBuilder();
    flash(current.name + ' → on the ticket');
  });

  /* ==================================================================
     4. The ticket
     ================================================================== */

  var KEY = 'brassox.ticket.v1';
  var ticket = [];
  try { ticket = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { ticket = []; }
  ticket = ticket.filter(function (l) { return byId[l.id]; });

  function save() { try { localStorage.setItem(KEY, JSON.stringify(ticket)); } catch (e) {} }

  function addLine(id, n, mods, unit) {
    var sig = id + '|' + mods.join(',');
    var line = ticket.filter(function (l) { return l.sig === sig; })[0];
    if (line) line.n += n;
    else ticket.push({ sig: sig, id: id, n: n, mods: mods, unit: unit });
    save();
    paint(true);
  }

  function count() { return ticket.reduce(function (a, l) { return a + l.n; }, 0); }
  function sub() { return ticket.reduce(function (a, l) { return a + l.unit * l.n; }, 0); }

  var bar = $('ticketbar');

  function paint(bump) {
    var n = count(), s = sub(), tax = Math.round(s * TAX);

    $('mastCheckN').hidden = n === 0;
    $('mastCheckN').textContent = n;
    bar.hidden = n === 0;
    $('ticketbarN').textContent = n;
    $('ticketbarTotal').textContent = money(s);
    if (bump && !reduced && n) {
      bar.classList.remove('is-bump');
      void bar.offsetWidth;
      bar.classList.add('is-bump');
    }

    $('checkLines').innerHTML = ticket.map(function (l, i) {
      var m = byId[l.id];
      return '<li class="cl">' +
        '<span class="cl-name">' + m.name + '</span>' +
        '<span class="cl-cost">' + plain(l.unit * l.n) + '</span>' +
        (l.mods.length ? '<span class="cl-mods">' + l.mods.join(' / ') + '</span>' : '') +
        '<span class="cl-qty">' +
          '<button type="button" data-dec="' + i + '" aria-label="One fewer ' + m.name + '">&minus;</button>' +
          '<output aria-live="polite">' + l.n + '</output>' +
          '<button type="button" data-inc="' + i + '" aria-label="One more ' + m.name + '">+</button>' +
        '</span></li>';
    }).join('');

    $('checkEmpty').hidden = n !== 0;
    $('checkSums').hidden = n === 0;
    $('checkClear').hidden = n === 0;
    $('toCheckout').disabled = n === 0;
    $('sumSub').textContent = plain(s);
    $('sumTax').textContent = plain(tax);
    $('sumTotal').textContent = plain(s + tax);
  }

  $('checkLines').addEventListener('click', function (ev) {
    var inc = ev.target.getAttribute('data-inc');
    var dec = ev.target.getAttribute('data-dec');
    if (inc !== null) ticket[+inc].n = Math.min(ticket[+inc].n + 1, 20);
    if (dec !== null) {
      ticket[+dec].n--;
      if (ticket[+dec].n <= 0) ticket.splice(+dec, 1);
    }
    if (inc !== null || dec !== null) { save(); paint(false); }
  });

  $('checkClear').addEventListener('click', function () {
    ticket = []; save(); paint(false); flash('Ticket voided');
  });

  // On narrow screens the check lives off-screen; both entry points scroll
  // it into view rather than opening yet another overlay.
  function revealCheck() {
    var el = document.querySelector('.check');
    if (window.innerWidth >= 1080) { el.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' }); return; }
    openPass();
  }
  $('mastCheck').addEventListener('click', revealCheck);
  bar.addEventListener('click', revealCheck);

  /* ==================================================================
     5. Checkout
     ================================================================== */

  var pass = $('pass');
  var payWith = 'card';

  function openPass() {
    if (!count()) return;
    buildTimes();
    paintPass();
    pass.hidden = false;
    document.body.style.overflow = 'hidden';
    $('passBack').focus();
  }
  $('toCheckout').addEventListener('click', openPass);
  $('passBack').addEventListener('click', function () {
    pass.hidden = true;
    document.body.style.overflow = '';
  });

  var when = $('when'), addr = $('addr');
  [].slice.call(document.querySelectorAll('input[name="way"]')).forEach(function (r) {
    r.addEventListener('change', function () {
      when.hidden = r.value !== 'later';
      addr.hidden = r.value !== 'delivery';
      paintPass();
    });
  });

  function buildTimes() {
    var sel = $('whenSel');
    if (sel.options.length) return;
    var t = new Date();
    t.setMinutes(t.getMinutes() + 40);
    t.setMinutes(Math.ceil(t.getMinutes() / 15) * 15, 0, 0);
    for (var i = 0; i < 14; i++) {
      var h = t.getHours(), m = t.getMinutes();
      if (h >= 22) break;
      sel.appendChild(new Option(
        (h % 12 || 12) + ':' + String(m).padStart(2, '0') + ' ' + (h < 12 ? 'AM' : 'PM'), h + ':' + m));
      t.setMinutes(t.getMinutes() + 15);
    }
    if (!sel.options.length) sel.appendChild(new Option('Tomorrow, 4:00 PM', 'tomorrow'));
  }

  var aStreet = $('aStreet'), aZip = $('aZip'), zone = $('zone'), zTimer = null;

  function checkZone() {
    var st = aStreet.value.trim(), z = aZip.value.trim();
    if (!st && !z) { zone.textContent = ''; zone.className = 'zone'; return; }
    var stOk = /^\d+\s+\S+/.test(st);
    var zOk = /^606[0-9]{2}$/.test(z);
    if (stOk && zOk) {
      zone.textContent = '✓ Inside our delivery ring — about 50 minutes tonight.';
      zone.className = 'zone ok';
    } else if (z.length === 5 && !zOk) {
      zone.textContent = 'That ZIP is outside the ring. We run 606xx only.';
      zone.className = 'zone no';
    } else {
      zone.textContent = 'Checking the address…';
      zone.className = 'zone';
    }
  }
  [aStreet, aZip].forEach(function (el) {
    el.addEventListener('input', function () { clearTimeout(zTimer); zTimer = setTimeout(checkZone, 340); });
  });

  function setPay(w) {
    payWith = w;
    $('wApple').setAttribute('aria-pressed', String(w === 'apple'));
    $('wGoogle').setAttribute('aria-pressed', String(w === 'google'));
    $('cardBox').classList.toggle('off', w !== 'card');
    $('payNote').textContent = w === 'card'
      ? 'Demonstration checkout — the card fields check their own format and nothing else. No number you type is sent, stored or charged.'
      : 'Demonstration checkout — in production this opens the ' +
        (w === 'apple' ? 'Apple Pay' : 'Google Pay') + ' sheet. Nothing is charged here.';
  }
  $('wApple').addEventListener('click', function () { setPay(payWith === 'apple' ? 'card' : 'apple'); });
  $('wGoogle').addEventListener('click', function () { setPay(payWith === 'google' ? 'card' : 'google'); });

  $('ccNum').addEventListener('input', function () {
    this.value = this.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  });
  $('ccExp').addEventListener('input', function () {
    var d = this.value.replace(/\D/g, '').slice(0, 4);
    this.value = d.length > 2 ? d.slice(0, 2) + ' / ' + d.slice(2) : d;
  });
  $('ccCvc').addEventListener('input', function () {
    this.value = this.value.replace(/\D/g, '').slice(0, 4);
  });

  function paintPass() {
    var way = document.querySelector('input[name="way"]:checked').value;
    var s = sub(), tax = Math.round(s * TAX), fee = way === 'delivery' ? DELIVERY : 0;

    $('passLines').innerHTML = ticket.map(function (l) {
      var m = byId[l.id];
      return '<li><span>' + l.n + ' × ' + m.name +
        (l.mods.length ? '<span class="pl-mods">' + l.mods.join(' / ') + '</span>' : '') +
        '</span><span>' + money(l.unit * l.n) + '</span></li>';
    }).join('');

    var rows = '<div><dt>Subtotal</dt><dd>' + money(s) + '</dd></div>' +
               '<div><dt>Tax</dt><dd>' + money(tax) + '</dd></div>';
    if (fee) rows += '<div><dt>Delivery</dt><dd>' + money(fee) + '</dd></div>';
    rows += '<div class="t"><dt>Total</dt><dd>' + money(s + tax + fee) + '</dd></div>';
    $('passTot').innerHTML = rows;
    $('passTotal').textContent = money(s + tax + fee);
  }

  function bad(id, errId, msg) {
    var el = $(id);
    el.closest('.f').classList.add('bad');
    $(errId).textContent = msg;
    return el;
  }
  function clearBad() {
    [].slice.call(pass.querySelectorAll('.f.bad')).forEach(function (f) { f.classList.remove('bad'); });
    [].slice.call(pass.querySelectorAll('.err')).forEach(function (e) { e.textContent = ''; });
  }

  $('passForm').addEventListener('submit', function (ev) {
    ev.preventDefault();
    clearBad();
    var way = document.querySelector('input[name="way"]:checked').value;
    var first = null;
    var mark = function (el) { if (!first) first = el; };

    if ($('cName').value.trim().length < 2) mark(bad('cName', 'eName', 'A name for the ticket.'));
    if (!/^[\d\s()+-]{7,}$/.test($('cPhone').value.trim())) mark(bad('cPhone', 'ePhone', 'A number we can text when it is up.'));
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test($('cEmail').value.trim())) mark(bad('cEmail', 'eEmail', 'That email does not look right.'));

    if (way === 'delivery') {
      if (!/^\d+\s+\S+/.test(aStreet.value.trim())) mark(bad('aStreet', 'eStreet', 'Number and street, e.g. 940 West Randolph Street.'));
      if (!/^606[0-9]{2}$/.test(aZip.value.trim())) mark(bad('aZip', 'eZip', 'A Chicago 606xx ZIP.'));
    }

    if (payWith === 'card') {
      if ($('ccNum').value.replace(/\D/g, '').length !== 16) mark(bad('ccNum', 'eCcNum', '16 digits — 4242 4242 4242 4242 works here.'));
      var e = $('ccExp').value.replace(/\D/g, '');
      if (!(e.length === 4 && +e.slice(0, 2) >= 1 && +e.slice(0, 2) <= 12)) mark(bad('ccExp', 'eCcExp', 'MM / YY.'));
      if ($('ccCvc').value.length < 3) mark(bad('ccCvc', 'eCcCvc', '3–4 digits.'));
    }

    if (first) {
      first.focus({ preventScroll: true });
      first.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
      return;
    }

    $('doneNo').textContent = '#' + Math.floor(100 + Math.random() * 900);
    $('doneWhen').textContent = way === 'delivery'
      ? 'On its way to ' + aStreet.value.trim() + ' in about 50 minutes.'
      : way === 'later'
        ? 'Ready for collection at ' + $('whenSel').selectedOptions[0].textContent + '.'
        : 'Ready for collection in about 25 minutes.';
    pass.hidden = true;
    $('done').hidden = false;
    ticket = []; save(); paint(false);
    $('doneBack').focus();
  });

  $('doneBack').addEventListener('click', function () {
    $('done').hidden = true;
    document.body.style.overflow = '';
    window.scrollTo({ top: $('board').offsetTop - 90, behavior: reduced ? 'auto' : 'smooth' });
  });

  document.addEventListener('keydown', function (ev) {
    if (ev.key !== 'Escape') return;
    if (!pass.hidden) { $('passBack').click(); return; }
    if (!builder.hidden) closeBuilder();
  });

  /* ==================================================================
     6. Flash
     ================================================================== */

  var flashEl = $('flash'), flashTimer = null;
  function flash(msg) {
    flashEl.textContent = msg;
    flashEl.hidden = false;
    clearTimeout(flashTimer);
    flashTimer = setTimeout(function () { flashEl.hidden = true; }, 2100);
  }

  paint(false);
})();
