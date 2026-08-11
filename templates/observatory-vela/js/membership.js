/* VELA — membership. The tiers, the comparison grid and the break-even line are
   all written from the same catalogue the basket charges against. */
(function (root, doc) {
  'use strict';

  var VELA = root.VELA, R = root.VelaRender;
  if (!VELA || !R) return;

  function tiers() {
    var host = doc.getElementById('tiers');
    if (!host) return;
    host.innerHTML = VELA.membership.map(function (m, i) {
      return '<div class="card reveal' + (i ? ' reveal--d' + Math.min(i, 3) : '') + '">' +
        '<div class="card__body">' +
          '<span class="tag' + (m.id === 'family' ? ' tag--solid' : '') + '">' +
            (m.people === 1 ? 'One person' : 'Up to ' + m.people + ' people') + '</span>' +
          '<h3>' + R.esc(m.label) + '</h3>' +
          '<p class="session__price">' + VELA.money(m.price) + '<span>a year</span></p>' +
          '<ul class="prose">' + m.perks.map(function (p) {
            return '<li>' + R.esc(p) + '</li>';
          }).join('') + '</ul>' +
          '<span class="card__foot"><button class="btn btn--sm" type="button" data-tier="' +
            R.esc(m.id) + '">Join</button></span>' +
        '</div></div>';
    }).join('');
  }

  /* How many ordinary visits a membership has to replace before it pays for
     itself — computed, because if a price changes this sentence must change
     with it. */
  function breakEven() {
    var out = doc.getElementById('breakEven');
    if (!out) return;
    var adult = VELA.tickets.admission.filter(function (t) { return t.id === 'adult'; })[0];
    var show = VELA.tickets.domeShow.withAdmission;
    var individual = VELA.membership.filter(function (m) { return m.id === 'individual'; })[0];
    var perVisit = adult.price + show - Math.round(show * VELA.tickets.memberDiscount);
    var visits = Math.ceil(individual.price / perVisit);
    out.innerHTML = 'An adult ticket with a dome show costs ' +
      VELA.money(adult.price + show) + '. As a member the same visit costs ' +
      VELA.money(Math.round(show * (1 - VELA.tickets.memberDiscount))) +
      ', so Individual membership at ' + VELA.money(individual.price) +
      ' pays for itself on your <b>' + ordinal(visits) + '</b> visit.';
  }

  function ordinal(n) {
    var s = ['th', 'st', 'nd', 'rd'], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  function compare() {
    var table = doc.getElementById('compare');
    if (!table) return;
    var head = table.querySelector('thead tr');
    var body = table.querySelector('tbody');

    head.innerHTML = '<th scope="col">&nbsp;</th>' + VELA.membership.map(function (m) {
      return '<th scope="col">' + R.esc(m.label) + '</th>';
    }).join('');

    var pct = Math.round(VELA.tickets.memberDiscount * 100) + '%';
    var rows = [
      ['Price a year', VELA.membership.map(function (m) { return VELA.money(m.price); })],
      ['People covered', VELA.membership.map(function (m) { return String(m.people); })],
      ['Free admission', VELA.membership.map(function () { return 'Yes'; })],
      ['Discount on sessions', VELA.membership.map(function () { return pct; })],
      ['Priority booking', VELA.membership.map(function () { return '2 weeks'; })],
      ['Guest passes a year', VELA.membership.map(function (m) {
        return m.id === 'individual' ? '—' : '2';
      })],
      ['Members&rsquo; observing night', VELA.membership.map(function (m) {
        return m.id === 'individual' ? '—' : 'Yes';
      })],
      ['Young astronomers&rsquo; mornings', VELA.membership.map(function (m) {
        return m.id === 'family' || m.id === 'patron' ? 'Included' : '—';
      })],
      ['A night on the 1.2 m', VELA.membership.map(function (m) {
        return m.id === 'patron' ? 'Yes' : '—';
      })]
    ];

    body.innerHTML = rows.map(function (r) {
      return '<tr><th scope="row">' + r[0] + '</th>' +
        r[1].map(function (v) { return '<td class="num">' + v + '</td>'; }).join('') + '</tr>';
    }).join('');
  }

  doc.addEventListener('click', function (e) {
    var btn = e.target.closest ? e.target.closest('[data-tier]') : null;
    if (!btn) return;
    var m = VELA.membership.filter(function (x) {
      return x.id === btn.getAttribute('data-tier');
    })[0];
    if (!m) return;
    VELA.basket.add({
      sku: 'mem-' + m.id, title: m.label + ' membership',
      meta: 'One year from purchase', unit: m.price, qty: 1,
      kind: 'membership', discountable: false
    });
    var was = btn.textContent;
    btn.textContent = 'Added';
    root.setTimeout(function () { btn.textContent = was; }, 1400);
  });

  function boot() { tiers(); breakEven(); compare(); }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window, document);
