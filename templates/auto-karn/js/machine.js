/* KARN machine sheet — trio, ledger, spec bars, conditions. All computed. */
(function () {
  'use strict';
  var K = window.KN;
  var slug = document.body.getAttribute('data-machine');
  var v = K.fleet[slug];
  if (!v) return;

  var sc = document.body.getAttribute('data-sector');
  var cond = K.conditions[sc];

  /* inline condition tags */
  document.querySelectorAll('[data-cond-inline]').forEach(function (el) {
    el.textContent = cond.temp + '°C · WIND ' + cond.wind + ' · ' + (cond.open ? 'OPEN' : 'HOLD');
  });
  document.querySelectorAll('[data-cond-cap]').forEach(function (el) {
    el.textContent = 'TODAY ' + (cond.open ? 'OPEN' : 'ON HOLD') + ' · WIND ' + cond.wind;
  });

  /* ---------- the trio: three headline figures, computed ---------- */

  var trio = document.querySelector('[data-trio]');
  if (trio) {
    var cells = [
      { l: 'VMAX' + (K.perf.vmaxLimited(v) ? ' · LTD' : ' · AERO'), v: Math.round(K.perf.vmax(v)), u: 'KM/H' },
      { l: '0–100', v: K.perf.t100(v).toFixed(1), u: 'S' },
      v.battery
        ? { l: 'RANGE', v: Math.round(K.perf.range(v)), u: 'KM' }
        : { l: 'POWER/MASS', v: Math.round(K.perf.pw(v)), u: 'KW/T' }
    ];
    cells.forEach(function (c) {
      var d = document.createElement('div');
      d.className = 'cell';
      d.innerHTML = '<span class="hudt hudt-dim">' + c.l + '</span><br><span class="v">' + c.v + ' <sub>' + c.u + '</sub></span>';
      trio.appendChild(d);
    });
  }

  /* ---------- the ledger: primitives declared, results computed ---------- */

  var ledger = document.querySelector('[data-ledger]');
  if (ledger) {
    function row(label, val, computed) {
      var d = document.createElement('div');
      d.className = 'lrow';
      d.innerHTML = '<span class="hudt-dim">' + label + '</span><span class="lv' + (computed ? ' computed' : '') + '">' + val + '</span>';
      ledger.appendChild(d);
    }
    row('POWERTRAIN', v.engine, false);
    row('MASS, DRY', K.fmt.kg(v.m), false);
    row('POWER', K.fmt.kw(v.kw), false);
    row('TORQUE', v.nm + ' NM', false);
    row('DRAG AREA CdA', v.cda.toFixed(2) + ' M²', false);
    if (v.cla) row('LIFT AREA ClA', '−' + v.cla.toFixed(1) + ' M²', false);
    if (v.battery) row('BATTERY', v.battery + ' KWH · ' + v.whkm + ' WH/KM', false);
    row('DRIVE · TYRE', v.drive + ' · ' + v.tyre.toUpperCase(), false);
    row('POWER / MASS', K.fmt.pw(K.perf.pw(v)), true);
    row('0–100 KM/H', K.fmt.s(K.perf.t100(v)), true);
    row('TOP SPEED' + (K.perf.vmaxLimited(v) ? ' (LIMITED)' : ' (AERO)'), K.fmt.kmh(K.perf.vmax(v)), true);
    if (v.cla) {
      row('DOWNFORCE AT 250', K.fmt.kn(K.perf.downforceAt(v, 250)), true);
      row('DOWNFORCE = WEIGHT', K.fmt.kmh(K.perf.crossoverKmh(v)), true);
    }
    if (v.battery) row('RANGE, COMPUTED', K.fmt.km(K.perf.range(v)), true);
  }

  /* ---------- spec bars vs fleet maxima ---------- */

  var bars = document.querySelector('[data-specbars]');
  if (bars) {
    var all = Object.keys(K.fleet).map(function (k) { return K.fleet[k]; });
    var maxV = Math.max.apply(null, all.map(function (x) { return K.perf.vmax(x); }));
    var maxPw = Math.max.apply(null, all.map(function (x) { return K.perf.pw(x); }));
    var minT = Math.min.apply(null, all.map(function (x) { return K.perf.t100(x); }));
    var maxNm = Math.max.apply(null, all.map(function (x) { return x.nm; }));

    function bar(label, valTxt, frac, cy) {
      var d = document.createElement('div');
      d.className = 'specbar';
      d.innerHTML =
        '<div class="sb-line"><span class="hudt-dim">' + label + '</span><span class="sb-v">' + valTxt + '</span></div>' +
        '<div class="rail"><div class="fill' + (cy ? ' cy' : '') + '" data-w="' + Math.round(frac * 100) + '"></div></div>';
      bars.appendChild(d);
    }
    bar('TOP SPEED', K.fmt.kmh(K.perf.vmax(v)), K.perf.vmax(v) / maxV, false);
    bar('LAUNCH (INVERSE 0–100)', K.fmt.s(K.perf.t100(v)), minT / K.perf.t100(v), false);
    bar('POWER / MASS', K.fmt.pw(K.perf.pw(v)), K.perf.pw(v) / maxPw, false);
    bar('TORQUE', v.nm + ' NM', v.nm / maxNm, true);
    if (v.cla) bar('DOWNFORCE @250', K.fmt.kn(K.perf.downforceAt(v, 250)), 1, true);
    if (v.battery) bar('RANGE', K.fmt.km(K.perf.range(v)), 1, true);

    // animate the fills once visible
    var fills = bars.querySelectorAll('.fill');
    var fire = function () {
      fills.forEach(function (f) { f.style.width = f.getAttribute('data-w') + '%'; });
    };
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { fire(); io.disconnect(); } });
      }, { threshold: 0.3 });
      io.observe(bars);
      // backstop: never leave the bars empty if IO stalls
      setTimeout(fire, 2500);
    } else { fire(); }
  }
}());
