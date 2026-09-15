/* FROSTLINE — the hardiness gate.
   Beth Chatto's "right plant, right place" as arithmetic. Four controls
   describe a site; every plant in catalogue.js is assessed against it and
   lands in one of three columns. The third column is shown, not hidden,
   with the reason it failed.

   Nothing in the output is written copy. The headline, the tally, every
   reason string and the recommendation are all derived from the stock data
   and the current site — including the part where our own two showpiece
   plants fall into the death column and the page says so. */
(function () {
  'use strict';

  var gate = document.getElementById('gate');
  if (!gate || !window.FROSTLINE) return;

  var F = window.FROSTLINE;

  var site = {
    min: -12,
    aspect: 'S',
    exposed: true,
    soil: 'moist',
    ph: 'neutral'
  };

  var els = {
    temp:    document.getElementById('gTemp'),
    tempOut: document.getElementById('gTempOut'),
    verdict: document.getElementById('gVerdict'),
    tally:   document.getElementById('gTally'),
    thrive:  document.getElementById('gThrive'),
    survive: document.getElementById('gSurvive'),
    fail:    document.getElementById('gFail')
  };

  var ASPECT_NAME = { N: 'north', E: 'east', S: 'south', W: 'west' };

  function ratingBand(rhs) {
    var f = F.floor[rhs];
    return rhs === 'H7'
      ? 'below −20 °C'
      : 'to −' + Math.abs(f) + ' °C';
  }

  function entry(plant, verdict) {
    var li = document.createElement('li');
    li.className = 'entry';
    if (plant.flagship) li.setAttribute('data-flagship', 'true');

    var nm = document.createElement('span');
    nm.className = 'nm';

    var bi = document.createElement('em');
    bi.className = 'bi';
    bi.textContent = F.binomial(plant);
    nm.appendChild(bi);

    var rate = document.createElement('span');
    rate.className = 'h-rating';
    rate.textContent = plant.rhs;
    rate.title = 'RHS hardiness ' + plant.rhs + ' — hardy ' + ratingBand(plant.rhs);
    nm.appendChild(rate);

    var why = document.createElement('span');
    why.className = 'why';
    why.textContent = verdict.reason;

    li.appendChild(nm);
    li.appendChild(why);
    return li;
  }

  /* The headline. Every branch is a real statement about the current site,
     and the flagship branch is the one that costs us a sale. */
  function headline(sorted, flagsDown) {
    var t = sorted.thrive.length, s = sorted.survive.length, f = sorted.fail.length;
    var n = F.stock.length;
    var best = sorted.thrive.slice().sort(function (a, b) {
      return b.v.headroom - a.v.headroom;
    })[0];

    var lines = [];

    if (f === 0) {
      lines.push('Everything we grow will live on this site.');
      lines.push('You have easy ground — spend the budget on quantity and repetition, not on rarity.');
    } else if (t === 0) {
      lines.push('Nothing in the list actually thrives here.');
      lines.push('Every plant that survives does so with a fault against it. Fix the site before you buy: '
        + (site.exposed ? 'a hedge or a fence on the windward side will move more plants into the first column than any amount of money will.'
                        : 'drainage first, then shelter.'));
    } else {
      lines.push(t + ' of ' + n + ' will thrive on this site. ' + f + ' will die on it.');
      if (best) {
        lines.push('The one to plant first is ' + F.binomial(best.p) + ' — '
          + best.v.headroom + ' °C colder than it needs and untroubled by '
          + (site.exposed ? 'open ground' : 'your aspect') + '.');
      }
    }

    if (flagsDown.length) {
      lines.push(flagsDown.length === 2
        ? 'Both of the plants we are best known for — ' + F.binomial(flagsDown[0])
          + ' and ' + F.binomial(flagsDown[1])
          + ' — are in the third column. At −' + Math.abs(site.min)
          + ' °C they are annuals wearing a perennial’s price. Do not let us sell them to you.'
        : F.binomial(flagsDown[0]) + ', which is the plant we sell most of, is in the third column. '
          + 'At −' + Math.abs(site.min) + ' °C it will not come back. Buy it if you want one summer of it, not because we listed it.');
    }

    return lines;
  }

  function render() {
    var sorted = { thrive: [], survive: [], fail: [] };
    var flagsDown = [];

    F.stock.forEach(function (p) {
      var v = F.assess(p, site);
      sorted[v.rank === 'thrive' ? 'thrive' : v.rank === 'survive' ? 'survive' : 'fail']
        .push({ p: p, v: v });
      if (v.rank === 'fail' && p.flagship) flagsDown.push(p);
    });

    /* order each column hardest-first so the reading order carries meaning:
       most margin at the top of thrive, worst failure at the top of fail */
    sorted.thrive.sort(function (a, b) { return b.v.headroom - a.v.headroom; });
    sorted.survive.sort(function (a, b) { return b.v.headroom - a.v.headroom; });
    sorted.fail.sort(function (a, b) { return a.v.headroom - b.v.headroom; });

    [['thrive', els.thrive], ['survive', els.survive], ['fail', els.fail]]
      .forEach(function (pair) {
        var list = pair[1];
        if (!list) return;
        list.textContent = '';
        if (!sorted[pair[0]].length) {
          var none = document.createElement('li');
          none.className = 'col-empty';
          none.textContent = '— none';
          list.appendChild(none);
          return;
        }
        sorted[pair[0]].forEach(function (r) {
          list.appendChild(entry(r.p, r.v));
        });
      });

    if (els.verdict) {
      els.verdict.textContent = '';
      headline(sorted, flagsDown).forEach(function (text, i) {
        var p = document.createElement('p');
        if (i === 0) p.className = 't-sub';
        else p.className = 'dim';
        p.textContent = text;
        els.verdict.appendChild(p);
      });
    }

    if (els.tally) {
      els.tally.innerHTML = '';
      [['thrive', sorted.thrive.length, 'Thrives'],
       ['survive', sorted.survive.length, 'Survives'],
       ['fail', sorted.fail.length, 'Dies here']].forEach(function (t) {
        var span = document.createElement('span');
        var b = document.createElement('b');
        b.className = 'n-' + t[0];
        b.textContent = String(t[1]);
        span.appendChild(b);
        span.appendChild(document.createTextNode(' ' + t[2]));
        els.tally.appendChild(span);
      });
    }

    gate.setAttribute('data-site',
      site.min + '|' + site.aspect + '|' + (site.exposed ? 'exposed' : 'lee') +
      '|' + site.soil + '|' + site.ph);
  }

  /* Name the LOWEST RHS rating that will survive this site — not the band
     the number falls inside, which is off by one step and was contradicting
     the columns underneath it. A site reaching −12 °C needs H5 (hardy to
     −15); H4 only reaches −10 and dies. Bounds are the published RHS
     ratings: H3 to −5, H4 to −10, H5 to −15, H6 to −20, H7 below −20. */
  function tempLabel(v) {
    var band = v >= -5  ? 'H3 — half hardy'
             : v >= -10 ? 'H4 — average winter'
             : v >= -15 ? 'H5 — cold winter'
             : v >= -20 ? 'H6 — very cold winter'
             : 'H7 — very hardy only';
    return '−' + Math.abs(v) + ' °C · ' + band;
  }

  if (els.temp) {
    els.temp.value = String(site.min);
    if (els.tempOut) els.tempOut.textContent = tempLabel(site.min);
    els.temp.addEventListener('input', function () {
      site.min = parseInt(els.temp.value, 10);
      if (els.tempOut) els.tempOut.textContent = tempLabel(site.min);
      render();
    });
  }

  /* segmented controls — each group writes one key on `site` */
  [].slice.call(gate.querySelectorAll('.seg')).forEach(function (seg) {
    var key = seg.getAttribute('data-key');
    seg.addEventListener('click', function (ev) {
      var btn = ev.target.closest('button');
      if (!btn || !seg.contains(btn)) return;
      var val = btn.getAttribute('data-val');

      if (key === 'exposed') {
        site.exposed = val === 'exposed';
      } else {
        site[key] = val;
      }

      [].slice.call(seg.querySelectorAll('button')).forEach(function (b) {
        b.setAttribute('aria-pressed', String(b === btn));
      });
      render();
    });
  });

  render();
})();
