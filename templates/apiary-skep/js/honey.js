/* ==========================================================================
   SKEP — the harvest table
   --------------------------------------------------------------------------
   The kilograms in the table are not typed in. They are this year's run of the
   same model the front page drives, with each day's nectar attributed across
   whichever flows were open that day, in proportion to what each was actually
   giving. So the table cannot drift away from the instrument: change the
   forage calendar in colony.js and the shop changes with it.
   ========================================================================== */

(function () {
  'use strict';
  if (!window.Colony) return;

  var C = window.Colony;
  var res = C.run({});                 /* the ordinary year, nothing done to it */

  /* --- attribute each day's intake across the flows that were open --------- */
  function attribute() {
    var totals = C.FORAGE.map(function () { return 0; });

    for (var d = 0; d < C.DAYS; d++) {
      var got = res.intake[d];
      if (got <= 0) continue;

      /* each open window's share of the day's nectar = its own contribution
         over the sum of all of them, which is exactly how the model built the
         figure in the first place */
      var parts = [], sum = 0;
      for (var f = 0; f < C.FORAGE.length; f++) {
        var w = C.FORAGE[f];
        var b = 0;
        if (d >= w.from && d <= w.to) {
          var t = (d - w.from) / (w.to - w.from);
          b = w.peak * (0.5 - 0.5 * Math.cos(t * Math.PI * 2));
        }
        parts.push(b);
        sum += b;
      }
      if (sum <= 0) continue;
      for (var g = 0; g < parts.length; g++) totals[g] += got * (parts[g] / sum);
    }
    return totals;
  }

  /* Colours are the honeys' own — water-white balsam through to near-black
     ivy. This is the one place on the site where amber is allowed to vary,
     because here it is the product and not a quantity. */
  var JARS = {
    willow:   { tint: '#d9b25a', note: 'Pale, grassy, gone by June. The first jar of the year and never more than a few.', set: 'Sets soft' },
    rape:     { tint: '#f0e6cf', note: 'Almost white, sets hard within days of coming off, and tastes of not very much — which is why it is the one children eat.', set: 'Sets hard, fast' },
    sycamore: { tint: '#c79a3e', note: 'Dark for a spring honey, faintly of toffee. Usually blended into the rape by the bees before we can stop them.', set: 'Sets grainy' },
    hawthorn:{ tint: '#a9762c', note: 'Heavy, almost meaty, an acquired taste that people who acquire it then buy six of.', set: 'Stays runny' },
    clover:   { tint: '#e2bd63', note: 'The honey people mean when they say honey. Clean and sweet with a cut-grass finish.', set: 'Sets fine and pale' },
    lime:     { tint: '#cfd08a', note: 'Green-tinged, sharp, strongly minty. Our best seller and the first to run out.', set: 'Stays runny' },
    balsam:   { tint: '#e8d59a', note: 'Water-white and pear-drop sweet. The bees come home dusted white from it in August.', set: 'Stays runny' },
    ivy:      { tint: '#8c6a2a', note: 'Dark, peppery, sets like concrete. We mostly leave it on the hive — the bees have earned it.', set: 'Sets very hard' }
  };

  var PRICE = { 227: 6.50, 340: 8.50 };

  function render() {
    var body = document.getElementById('harvestBody');
    if (!body) return;

    var totals = attribute();
    var rows = '';
    var grand = 0;

    for (var i = 0; i < C.FORAGE.length; i++) {
      var f = C.FORAGE[i];
      var j = JARS[f.key] || { tint: '#c8860d', note: '', set: '' };
      var kilos = totals[i];
      grand += kilos;

      /* jars, minus what the colony ate and what we left on: the crop is the
         model's harvested total, so scale each flow's gross by that ratio */
      var share = res.summary.harvested > 0 ? (kilos / totals.reduce(function (a, b) { return a + b; }, 0)) : 0;
      var crop = res.summary.harvested * share;
      var jars = Math.floor((crop * 1000) / 340);

      rows += '<tr>' +
        '<td><span class="jar" style="background:' + j.tint + '"></span><strong>' + f.name + '</strong></td>' +
        '<td>' + C.label(f.from) + ' &ndash; ' + C.label(f.to) + '</td>' +
        '<td class="num">' + crop.toFixed(1) + ' kg</td>' +
        '<td class="num">' + (jars > 0 ? jars : '&mdash;') + '</td>' +
        '<td>' + j.set + '</td>' +
        '<td>' + j.note + '</td>' +
      '</tr>';
    }

    body.innerHTML = rows;

    var t = document.getElementById('cropTotal');
    if (t) t.innerHTML = res.summary.harvested.toFixed(1) + '<u>kg</u>';
    var g = document.getElementById('grossTotal');
    if (g) g.innerHTML = grand.toFixed(0) + '<u>kg</u>';
    var e = document.getElementById('eatenTotal');
    if (e) {
      var ate = 0;
      for (var d = 0; d < C.DAYS; d++) ate += res.eaten[d];
      e.innerHTML = ate.toFixed(0) + '<u>kg</u>';
    }
    var jt = document.getElementById('jarTotal');
    if (jt) jt.textContent = Math.floor((res.summary.harvested * 1000) / 340).toLocaleString('en-GB');
  }

  render();
})();
