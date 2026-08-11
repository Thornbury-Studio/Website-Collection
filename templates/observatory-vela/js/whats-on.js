/* VELA — the programme page: filters, and the two price tables, both written
   from the catalogue so they cannot disagree with the checkout. */
(function (root, doc) {
  'use strict';

  var VELA = root.VELA, R = root.VelaRender;
  if (!VELA || !R) return;

  var state = { kind: 'all', days: 7 };

  function groupPress(selector, attr, onPick) {
    var btns = Array.prototype.slice.call(doc.querySelectorAll(selector));
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        btns.forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        onPick(b.getAttribute(attr));
      });
    });
  }

  function render() {
    var host = doc.getElementById('programme');
    var count = doc.getElementById('programmeCount');
    if (!host) return;

    var now = Date.now();
    var all = VELA.programme(state.days).filter(function (s) {
      return s.startsAt.getTime() > now;
    });
    var shown = state.kind === 'all'
      ? all
      : all.filter(function (s) { return s.kind === state.kind; });

    R.remember(shown);
    host.innerHTML = R.listHTML(shown);

    if (count) {
      var scopes = state.kind === 'all' ? 'sessions' : 'matching sessions';
      count.textContent = shown.length + ' ' + scopes + ' in the next ' + state.days + ' days';
      /* Say why the list is short rather than leaving a gap. */
      if (state.kind === 'telescope' && !shown.length) {
        count.textContent += ' — the sky does not reach astronomical darkness on any of them.';
      }
    }
  }

  function priceTables() {
    var adm = doc.querySelector('#admissionTable tbody');
    if (adm) {
      adm.innerHTML = VELA.tickets.admission.map(function (t) {
        return '<tr><td>' + R.esc(t.label) + '</td><td class="u-mut">' + R.esc(t.note) +
          '</td><td class="n">' + (t.price === 0 ? 'Free' : VELA.money(t.price)) + '</td></tr>';
      }).join('');
    }

    var ses = doc.querySelector('#sessionTable tbody');
    if (ses) {
      var t = VELA.tickets;
      var rows = [
        ['Dome show', 'With same-day admission', t.domeShow.withAdmission],
        ['Dome show', 'On its own', t.domeShow.standalone],
        ['Telescope night', '2½ hours, 24 places, weather-dependent', t.telescopeNight],
        ['Solar session', '1 hour on the terrace, light months', t.solarSession],
        ['Fell Lecture', 'Monthly, first Thursday', t.lecture]
      ];
      ses.innerHTML = rows.map(function (r) {
        return '<tr><td>' + r[0] + '</td><td class="u-mut">' + r[1] +
          '</td><td class="n">' + VELA.money(r[2]) + '</td></tr>';
      }).join('');
    }

    var pct = doc.getElementById('memberPct');
    if (pct) pct.textContent = Math.round(VELA.tickets.memberDiscount * 100) + '%';
  }

  function boot() {
    groupPress('[data-filter]', 'data-filter', function (v) { state.kind = v; render(); });
    groupPress('[data-days]', 'data-days', function (v) {
      state.days = parseInt(v, 10) || 7;
      render();
    });
    priceTables();
    render();
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', boot);
  else boot();
})(window, document);
