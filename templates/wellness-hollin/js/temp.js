/* HOLLIN — the page temperature.
   HOLLIN.setTemp(T) writes the whole look of the page at T °C onto <html>
   (colours, display-type width and weight) from HOLLIN.at(T), the same
   function tools/build.mjs used to bake css/temps.css. It also updates every
   [data-temp-readout] and, only when the stage changes, the aria-live mirror,
   whose numbers come from the same HOLLIN data. */
(function () {
  var H = window.HOLLIN;
  if (!H) return;
  var root = document.documentElement;
  var meta = document.querySelector('meta[name="theme-color"]');
  var readouts = [].slice.call(document.querySelectorAll('[data-temp-readout]'));
  var labels = [].slice.call(document.querySelectorAll('[data-temp-label]'));
  var live = document.getElementById('temp-live');
  var VARS = ['ground', 'ground2', 'ink', 'dim', 'accent', 'field', 'err'];
  var lastStage = null, lastText = '', lastLight = null;

  /* Which room the number belongs to: halfway between neighbouring stages. */
  function stageAt(T) {
    var s = H.stage;
    if (T >= (s.hot.temp + s.rinse.temp) / 2) return 'hot';
    if (T >= (s.rinse.temp + s.plunge.temp) / 2) return 'rinse';
    return 'plunge';
  }
  H.stageAt = stageAt;

  function readout(T) {
    readouts.forEach(function (el) {
      var span = el.querySelector('[data-bake]') || el;
      var txt = span.getAttribute('data-bake-fmt') === '1' ? T.toFixed(1) : String(Math.round(T));
      if (span.textContent !== txt) span.textContent = txt;
    });
  }
  H.readout = readout;

  H.setTemp = function (T) {
    var a = H.at(T), st = root.style;
    for (var i = 0; i < VARS.length; i++) st.setProperty('--' + VARS[i], a[VARS[i]]);
    st.setProperty('--wdth', a.wdth.toFixed(1));
    st.setProperty('--wght', String(Math.round(a.wght)));
    st.setProperty('--heat-k', ((a.T - H.stage.plunge.temp) / (H.stage.hot.temp - H.stage.plunge.temp)).toFixed(3));
    if (a.light !== lastLight) {
      lastLight = a.light;
      st.colorScheme = a.light ? 'light' : 'dark';
      root.setAttribute('data-light', a.light ? '1' : '0');
    }
    var text = a.T.toFixed(1);
    if (text !== lastText) { lastText = text; readout(a.T); }
    var stage = stageAt(a.T);
    if (stage !== lastStage) {
      var first = lastStage === null;
      lastStage = stage;
      var s = H.stage[stage];
      labels.forEach(function (el) { el.textContent = s.name; });
      if (meta) meta.setAttribute('content', a.ground);
      /* Announce stage changes only, never every tenth of a degree. */
      if (live && !first) live.textContent = 'Page temperature ' + s.temp + ' degrees: ' + s.name.toLowerCase() + '.';
    }
    return a;
  };
})();
