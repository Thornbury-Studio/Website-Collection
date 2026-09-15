/* ==========================================================================
   SKEP — binding the model to the page
   --------------------------------------------------------------------------
   colony.js does the biology and knows nothing about the DOM. This file does
   the DOM and knows nothing about bees. The only thing crossing between them
   is the result object from Colony.run().
   ========================================================================== */

(function () {
  'use strict';

  /* Reveals first, and unconditionally. boot.js has already set .js-anim,
     which holds every .rev section at opacity 0 until something adds .is-in —
     so if we bailed out here on a missing model, the whole page would stay
     invisible rather than merely losing its instrument. The reveal must not
     depend on anything that can fail. */
  revealAll();

  if (!window.Colony) return;          /* model missing: leave the static page alone */

  var C = window.Colony;
  var DAYS = C.DAYS;

  /* The population chart is scaled to a FIXED ceiling, not to each run's own
     maximum. Auto-scaling would redraw a swarmed colony at the same height as
     a strong one and quietly destroy the comparison the whole instrument
     exists to make. */
  var POP_CEIL = 70000;
  var CHART_W = 700, CHART_H = 190;

  var opts  = { swarm: false, split: false, wetJune: false, noTreat: false };
  var res   = C.run(opts);
  var day   = 0;

  var $ = function (id) { return document.getElementById(id); };
  var el = {
    pop: $('rdPop'), fly: $('rdFly'), brood: $('rdBrood'), stores: $('rdStores'),
    stamp: $('dayStamp'), range: $('dayRange'), months: $('monthScale'),
    honey: $('honeyFill'), broodFill: $('broodFill'), beeField: $('beeField'),
    hiveState: $('hiveState'),
    popArea: $('popArea'), popLine: $('popLine'), flyLine: $('flyLine'),
    playhead: $('playhead'), popGrid: $('popGrid'),
    forage: $('forage'),
    crop: $('vCrop'), peak: $('vPeak'), cluster: $('vCluster'),
    note: $('vNote'), verdict: $('verdict'),
    dock: $('scrubDock'), spacer: $('scrubSpacer')
  };

  var ev = {
    swarm: $('evSwarm'), split: $('evSplit'), wetJune: $('evWet'), noTreat: $('evNoTreat')
  };

  /* --- formatting ------------------------------------------------------- */

  function comma(n) { return Math.round(n).toLocaleString('en-GB'); }
  function kg(n, dp) { return n.toFixed(dp === undefined ? 1 : dp); }
  function unit(v, u) { return v + '<u>' + u + '</u>'; }

  /* --- one-time furniture ------------------------------------------------ */

  function buildMonths() {
    if (!el.months) return;
    var html = '';
    for (var m = 0; m < 12; m++) html += '<span data-m="' + m + '">' + C.MONTHS[m] + '</span>';
    el.months.innerHTML = html;
  }

  function buildForage() {
    if (!el.forage) return;
    var html = '';
    for (var i = 0; i < C.FORAGE.length; i++) {
      var f = C.FORAGE[i];
      var left = (f.from / DAYS) * 100;
      var w = ((f.to - f.from) / DAYS) * 100;
      html += '<div class="forage-row" data-f="' + i + '">' +
                '<span class="forage-name">' + f.name + '</span>' +
                '<span class="bar"><i style="left:' + left.toFixed(2) + '%;width:' + w.toFixed(2) + '%"></i></span>' +
              '</div>';
    }
    el.forage.insertAdjacentHTML('beforeend', html);
  }

  /* Bees scattered inside the skep. Deterministic, so the field does not
     reshuffle on every repaint — only how many of them are shown changes. */
  function buildBees() {
    if (!el.beeField) return;
    var seed = 20260916, out = '';
    function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
    for (var i = 0; i < 150; i++) {
      var y = 60 + rnd() * 330;
      /* the skep narrows toward the crown: keep the scatter inside the walls */
      var t = (y - 40) / 370;
      var halfW = 40 + 106 * Math.min(1, Math.pow(t, 0.62));
      var x = 180 + (rnd() * 2 - 1) * halfW;
      var r = 1.7 + rnd() * 1.5;
      out += '<ellipse cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) +
             '" rx="' + r.toFixed(1) + '" ry="' + (r * 0.72).toFixed(1) + '"/>';
    }
    el.beeField.innerHTML = out;
  }

  function buildGrid() {
    if (!el.popGrid) return;
    var g = '';
    [20000, 40000, 60000].forEach(function (v) {
      var y = CHART_H - (v / POP_CEIL) * CHART_H;
      g += '<line x1="0" y1="' + y.toFixed(1) + '" x2="' + CHART_W + '" y2="' + y.toFixed(1) +
           '" stroke="#f2ebdd" stroke-width="1" opacity="0.1"/>';
    });
    for (var m = 1; m < 12; m++) {
      var x = (C.dayStart(m) / DAYS) * CHART_W;
      g += '<line x1="' + x.toFixed(1) + '" y1="0" x2="' + x.toFixed(1) + '" y2="' + CHART_H +
           '" stroke="#f2ebdd" stroke-width="1" opacity="0.07"/>';
    }
    el.popGrid.innerHTML = g;
  }

  /* --- chart paths ------------------------------------------------------- */

  function seriesPath(arr, close) {
    var d = '', i, x, y;
    for (i = 0; i < DAYS; i++) {
      x = (i / (DAYS - 1)) * CHART_W;
      y = CHART_H - Math.min(1, arr[i] / POP_CEIL) * CHART_H;
      d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1);
    }
    if (close) d += 'L' + CHART_W + ' ' + CHART_H + 'L0 ' + CHART_H + 'Z';
    return d;
  }

  function drawChart() {
    if (el.popLine) el.popLine.setAttribute('d', seriesPath(res.pop, false));
    if (el.popArea) el.popArea.setAttribute('d', seriesPath(res.pop, true));
    if (el.flyLine) el.flyLine.setAttribute('d', seriesPath(res.flying, false));
  }

  /* --- the per-day paint -------------------------------------------------- */

  function paintDay() {
    var p = res.pop[day], f = res.flying[day], b = res.brood[day], s = res.stores[day];

    if (el.pop)    el.pop.textContent = comma(p);
    if (el.fly)    el.fly.textContent = comma(f);
    if (el.brood)  el.brood.textContent = comma(b);
    if (el.stores) el.stores.innerHTML = unit(kg(s), 'kg');

    if (el.stamp) el.stamp.textContent = C.label(day);
    if (el.range) {
      el.range.setAttribute('aria-valuetext',
        C.label(day) + ' — ' + comma(p) + ' bees, ' + kg(s) + ' kilograms of stores');
    }

    /* honey arch fills from the crown down */
    if (el.honey) {
      var h = Math.min(1, s / 26) * 172;
      el.honey.setAttribute('y', '40');
      el.honey.setAttribute('height', h.toFixed(1));
    }

    /* brood nest */
    if (el.broodFill) {
      var bt = Math.min(1, b / 38000);
      el.broodFill.setAttribute('rx', (112 * Math.sqrt(bt)).toFixed(1));
      el.broodFill.setAttribute('ry', (86 * Math.sqrt(bt)).toFixed(1));
    }

    /* how many bees are drawn */
    if (el.beeField) {
      var show = Math.round(Math.min(1, p / POP_CEIL) * 150);
      var kids = el.beeField.childNodes;
      for (var i = 0; i < kids.length; i++) {
        kids[i].setAttribute('display', i < show ? 'inline' : 'none');
      }
    }

    /* month highlight */
    if (el.months) {
      var nowM = C.monthOf(day);
      var spans = el.months.children;
      for (var m = 0; m < spans.length; m++) {
        spans[m].classList.toggle('is-now', m === nowM);
      }
    }

    /* playhead */
    if (el.playhead) {
      var x = (day / (DAYS - 1)) * CHART_W;
      el.playhead.setAttribute('x1', x.toFixed(1));
      el.playhead.setAttribute('x2', x.toFixed(1));
    }

    /* what is actually in bloom today */
    if (el.forage) {
      var rows = el.forage.querySelectorAll('.forage-row');
      for (var r = 0; r < rows.length; r++) {
        var fo = C.FORAGE[r];
        rows[r].classList.toggle('is-open', day >= fo.from && day <= fo.to);
      }
    }

    /* a plain-language state for the hive caption */
    if (el.hiveState) {
      var state;
      if (p < 400) state = 'Lost';
      else if (b < 500) state = 'Clustered — no brood';
      else if (res.intake[day] > 0.8) state = 'On the flow';
      else if (b > 20000) state = 'Building';
      else state = 'Ticking over';
      el.hiveState.textContent = state;
    }
  }

  /* --- the whole-year paint ----------------------------------------------- */

  function paintRun() {
    var s = res.summary;

    if (el.crop)    el.crop.innerHTML = unit(kg(s.harvested), 'kg');
    if (el.peak)    el.peak.textContent = comma(s.peak);
    if (el.cluster) el.cluster.textContent = comma(s.endPop);

    /* chapter plates, read off the same run */
    var low = Infinity, lowDay = 0;
    for (var i = 0; i < 200; i++) if (res.pop[i] < low) { low = res.pop[i]; lowDay = i; }
    var best = 0;
    for (var j = 0; j < DAYS; j++) if (res.intake[j] > best) best = res.intake[j];

    set('pSpringLow', comma(low));
    set('pSpringLowDay', C.label(lowDay));
    set('pPeak', comma(s.peak));
    setHTML('pBestDay', unit(kg(best), 'kg'));
    setHTML('pCrop', unit(kg(s.harvested), 'kg'));

    if (el.verdict) el.verdict.classList.toggle('is-lost', !s.survives);
    if (el.note) el.note.innerHTML = verdictText(s);

    drawChart();
    paintDay();
  }

  function set(id, v)     { var n = $(id); if (n) n.textContent = v; }
  function setHTML(id, v) { var n = $(id); if (n) n.innerHTML = v; }

  /* The sentence under the numbers. It names the mechanism, not the outcome —
     the outcome is already on screen in kilograms. */
  function verdictText(s) {
    var base = C.run({ swarm: false, split: false, wetJune: false, noTreat: false }).summary.harvested;
    var lost = base - s.harvested;
    var bits = [];

    if (!s.survives) {
      return '<strong>The colony is lost.</strong> The mites were never treated, so the bees raised in ' +
             'September went into the cluster already worn out. They died through January and there was ' +
             'no brood to replace them &mdash; a colony does not starve here, it simply runs out of ' +
             'September.';
    }

    if (opts.swarm && !opts.split) {
      bits.push('The prime swarm took more than half the bees on 16 May and left a virgin queen who did ' +
                'not lay for three weeks. Nothing emerged from that gap until late June &mdash; which is ' +
                'precisely the fortnight of lime the crop depends on.');
    }
    if (opts.split) {
      bits.push('Taking the split first cost some bees deliberately and in April rather than accidentally ' +
                'in May, so the queen never stopped laying and the colony was still on its feet for the lime.');
    }
    if (opts.wetJune) {
      bits.push('The wet June shut the hedge for a month at the top of the flow. The bees were there; the ' +
                'nectar was not.');
    }
    if (!opts.swarm && !opts.split && !opts.wetJune && !opts.noTreat) {
      bits.push('An ordinary year, left alone: the colony built on willow and rape, took the clover and ' +
                'the lime, and made about what this hedge makes.');
    }

    var tail = '';
    if (lost > 0.4) {
      tail = ' <strong>' + kg(lost) + 'kg</strong> of that is what the decision cost, against the same ' +
             'colony in the same year with nothing done to it.';
    }
    return bits.join(' ') + tail;
  }

  /* --- events ------------------------------------------------------------- */

  function rerun() {
    res = C.run(opts);
    paintRun();
  }

  function bindEvent(btn, key) {
    if (!btn) return;
    btn.addEventListener('click', function () {
      opts[key] = !opts[key];
      btn.setAttribute('aria-pressed', opts[key] ? 'true' : 'false');

      /* A split is a pre-emption: you cannot both take one and let it swarm.
         Reflect that in the control rather than silently ignoring it in the
         model, so the page never shows a pressed button doing nothing. */
      if (key === 'split' && opts.split && opts.swarm) {
        opts.swarm = false;
        ev.swarm.setAttribute('aria-pressed', 'false');
      }
      if (key === 'swarm' && opts.swarm && opts.split) {
        opts.split = false;
        ev.split.setAttribute('aria-pressed', 'false');
      }
      rerun();
    });
  }

  /* --- scrubber ----------------------------------------------------------- */

  if (el.range) {
    el.range.addEventListener('input', function () {
      day = parseInt(el.range.value, 10) || 0;
      paintDay();
    });
  }

  /* --- reveal ------------------------------------------------------------- */

  function revealAll() {
    var items = document.querySelectorAll('.rev');
    if (!('IntersectionObserver' in window) || document.documentElement.classList.contains('no-motion')) {
      for (var i = 0; i < items.length; i++) items[i].classList.add('is-in');
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    for (var j = 0; j < items.length; j++) io.observe(items[j]);
  }

  /* --- the phone's control bar --------------------------------------------
     On a narrow screen the scrubber pins to the bottom of the viewport while
     the instrument is on screen, so the thumb is not covering the hive it is
     driving. The spacer keeps the same height in the flow, or the section
     collapses by the dock's height the moment it goes fixed. */
  function dock() {
    if (!el.dock || !el.spacer || !('IntersectionObserver' in window)) return;
    var rig = document.getElementById('year');
    if (!rig) return;

    var inView = false;

    function apply() {
      var narrow = window.matchMedia('(max-width: 900px)').matches;
      var on = narrow && inView;
      el.dock.classList.toggle('is-pinned', on);
      el.spacer.classList.toggle('is-on', on);
    }

    new IntersectionObserver(function (entries) {
      inView = entries[0].isIntersecting;
      apply();
    }, { threshold: 0, rootMargin: '-64px 0px -40% 0px' }).observe(rig);

    window.addEventListener('resize', apply);
  }

  /* --- go ------------------------------------------------------------------ */

  buildMonths();
  buildForage();
  buildBees();
  buildGrid();

  bindEvent(ev.swarm, 'swarm');
  bindEvent(ev.split, 'split');
  bindEvent(ev.wetJune, 'wetJune');
  bindEvent(ev.noTreat, 'noTreat');

  paintRun();

  dock();

})();
