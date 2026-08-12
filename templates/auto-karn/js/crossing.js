/* KARN crossing — today's legs, the comparator, the manifest. */
(function () {
  'use strict';
  var K = window.KN;
  var ORDER = ['monolit', 'serra', 'brekka', 'nokt', 'varde'];
  var LEGS = [
    { sc: 'SC-01', slug: 'monolit', when: 'DAWN', what: 'the salt, before the wind wakes' },
    { sc: 'SC-02', slug: 'serra', when: 'MORNING', what: 'the Ring, rubber going in' },
    { sc: 'SC-03', slug: 'brekka', when: 'MIDDAY', what: 'the dunes, ash still cold' },
    { sc: 'SC-05', slug: 'varde', when: 'AFTERNOON', what: 'the Works, skin off' },
    { sc: 'SC-04', slug: 'nokt', when: 'DUSK', what: 'the Kyst Road, lights coming on' }
  ];

  /* ---------- today's legs ---------- */

  var dateEl = document.querySelector('[data-legs-date]');
  if (dateEl) dateEl.textContent = 'MODEL DATE · ' + new Date().toISOString().slice(0, 10);

  var legs = document.getElementById('legsHost');
  if (legs) {
    LEGS.forEach(function (leg) {
      var v = K.fleet[leg.slug];
      var c = K.conditions[leg.sc];
      var d = document.createElement('div');
      d.className = 'lrow';
      d.innerHTML =
        '<span><span class="hudt-cy">' + leg.when + '</span> · ' + leg.sc + ' · ' +
        '<a href="' + leg.slug + '.html">' + v.code + ' ' + v.name + '</a> ' +
        '<span class="hudt-dim">— ' + leg.what + '</span></span>' +
        '<span class="lv ' + (c.open ? '' : 'hudt-sig') + '">' +
        c.temp + '°C · WIND ' + c.wind + ' · ' + (c.open ? 'OPEN' : 'HOLD') + '</span>';
      legs.appendChild(d);
    });
  }

  /* ---------- the comparator ---------- */

  var pickHost = document.getElementById('pickHost');
  var vsHost = document.getElementById('vsHost');
  var picked = [];

  // garage first, then URL ?m=, then nothing
  var garage = K.garage.list().filter(function (s) { return ORDER.indexOf(s) !== -1; });
  picked = garage.slice(0, 2);
  var qm = new URLSearchParams(location.search).get('m');
  if (qm && K.fleet[qm] && picked.indexOf(qm) === -1) {
    picked.unshift(qm);
    picked = picked.slice(0, 2);
  }

  function paintPicks() {
    pickHost.querySelectorAll('.pick').forEach(function (b) {
      b.setAttribute('aria-pressed', picked.indexOf(b.getAttribute('data-slug')) !== -1 ? 'true' : 'false');
    });
  }

  function vsCol(slug) {
    var v = K.fleet[slug];
    var all = ORDER.map(function (k) { return K.fleet[k]; });
    var maxV = Math.max.apply(null, all.map(function (x) { return K.perf.vmax(x); }));
    var maxPw = Math.max.apply(null, all.map(function (x) { return K.perf.pw(x); }));
    var minT = Math.min.apply(null, all.map(function (x) { return K.perf.t100(x); }));
    var maxNm = Math.max.apply(null, all.map(function (x) { return x.nm; }));
    function bar(label, valTxt, frac, cy) {
      return '<div class="specbar">' +
        '<div class="sb-line hudt"><span class="hudt-dim">' + label + '</span><span class="sb-v">' + valTxt + '</span></div>' +
        '<div class="rail"><div class="fill' + (cy ? ' cy' : '') + '" data-w="' + Math.round(frac * 100) + '"></div></div></div>';
    }
    return '<div class="vs-col">' +
      '<p class="hudt hudt-cy">' + v.sector + '</p>' +
      '<p class="vs-name">' + v.code + ' ' + v.name + '</p>' +
      '<p class="hudt hudt-dim">' + v.role.toUpperCase() + '</p>' +
      '<div class="vs-img"><img src="img/' + slug + '-hero.webp" alt="' + v.code + ' ' + v.name + '." width="1600" height="900" loading="lazy" decoding="async"></div>' +
      '<div class="specbars">' +
      bar('TOP SPEED', K.fmt.kmh(K.perf.vmax(v)), K.perf.vmax(v) / maxV, false) +
      bar('LAUNCH (INVERSE 0–100)', K.fmt.s(K.perf.t100(v)), minT / K.perf.t100(v), false) +
      bar('POWER / MASS', K.fmt.pw(K.perf.pw(v)), K.perf.pw(v) / maxPw, false) +
      bar('TORQUE', v.nm + ' NM', v.nm / maxNm, true) +
      '</div>' +
      '<p class="hudt mt-14"><a href="' + slug + '.html">FULL SHEET →</a></p>' +
      '</div>';
  }

  function paintVs() {
    if (picked.length < 2) {
      vsHost.innerHTML = '<div class="vs-empty hudt hudt-dim">PICK TWO MACHINES ABOVE — THE SHEET FILLS ITSELF' +
        (picked.length === 1 ? '<br>ONE CHOSEN: ' + K.fleet[picked[0]].name : '') + '</div>';
      return;
    }
    vsHost.innerHTML = vsCol(picked[0]) + vsCol(picked[1]);
    // fire the bars on next frame so the transition runs
    requestAnimationFrame(function () {
      setTimeout(function () {
        vsHost.querySelectorAll('.fill').forEach(function (f) {
          f.style.width = f.getAttribute('data-w') + '%';
        });
      }, 60);
    });
  }

  if (pickHost && vsHost) {
    ORDER.forEach(function (slug) {
      var v = K.fleet[slug];
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'pick';
      b.setAttribute('data-slug', slug);
      b.setAttribute('aria-pressed', 'false');
      b.textContent = v.code + ' ' + v.name;
      b.addEventListener('click', function () {
        var i = picked.indexOf(slug);
        if (i !== -1) picked.splice(i, 1);
        else {
          picked.push(slug);
          if (picked.length > 2) picked.shift();
        }
        paintPicks(); paintVs();
      });
      pickHost.appendChild(b);
    });
    paintPicks(); paintVs();
  }

  /* ---------- the manifest ---------- */

  var form = document.getElementById('bookForm');
  var noted = document.getElementById('bookNoted');
  if (form) {
    // preselect seat from ?m=
    if (qm && K.fleet[qm]) {
      var seat = document.getElementById('fSeat');
      if (seat) seat.value = qm;
    }
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
        n = parseInt(localStorage.getItem('karn.manifest.v1') || '0', 10) + 1;
        localStorage.setItem('karn.manifest.v1', String(n));
      } catch (e) { n = 1; }
      var ref = 'KRN-' + new Date().getFullYear() + '-' + String(320 + n);
      noted.innerHTML = 'ENTERED IN THE MANIFEST AS <span class="ref">' + ref + '</span>. ' +
        'A HUMAN — USUALLY THE PERSON WHO RUNS THE CROSSING — REPLIES WITHIN TWO DAYS WITH ' +
        'CANDIDATE DATES AND THE WEATHER CAVEATS. THE PENINSULA DECIDES; WE NEGOTIATE.';
      noted.hidden = false;
      form.querySelectorAll('input, textarea, select, button[type="submit"]').forEach(function (el) { el.disabled = true; });
      noted.scrollIntoView({ behavior: K.reduced ? 'auto' : 'smooth', block: 'nearest' });
    });
  }
}());
