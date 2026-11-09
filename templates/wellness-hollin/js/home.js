/* HOLLIN home — one scroll value drives the page temperature.
   Each [data-stage] block holds its room's temperature over the middle of
   its height; between blocks the temperature eases from one room to the
   next. The same T goes to HOLLIN.setTemp (palette, type axes, readouts) and
   to the WebGL field. Under reduced motion the temperature steps from room
   to room instead of sliding, and the field shows still posters. */
(function () {
  var H = window.HOLLIN, HOLL = window.HOLL || {};
  if (!H || !H.setTemp) return;
  var root = document.documentElement;
  root.classList.add('live');
  var blocks = [].slice.call(document.querySelectorAll('[data-stage]'));
  var keys = [];

  function measure() {
    var y = window.scrollY || window.pageYOffset;
    keys = [];
    blocks.forEach(function (el) {
      var r = el.getBoundingClientRect(), top = r.top + y, h = r.height;
      var T = H.stage[el.getAttribute('data-stage')].temp;
      keys.push({ y: top + h * 0.22, T: T }, { y: top + h * 0.62, T: T });
    });
  }
  function smooth(k) { return k * k * (3 - 2 * k); }
  function tempAt(probe) {
    if (!keys.length) return H.stage.hot.temp;
    if (probe <= keys[0].y) return keys[0].T;
    for (var i = 0; i < keys.length - 1; i++) {
      var a = keys[i], b = keys[i + 1];
      if (probe <= b.y) {
        if (HOLL.reduced) return probe < (a.y + b.y) / 2 ? a.T : b.T;
        return a.T + (b.T - a.T) * smooth((probe - a.y) / Math.max(1, b.y - a.y));
      }
    }
    return keys[keys.length - 1].T;
  }
  function state(T) { return T >= 64 ? 'hot' : T >= 21 ? 'mid' : 'cold'; }

  var lastT = null, pending = false;
  function update() {
    pending = false;
    var probe = (window.scrollY || window.pageYOffset) + window.innerHeight * 0.5;
    var T = Math.round(tempAt(probe) * 10) / 10;
    if (T === lastT) return;
    lastT = T;
    var a = H.setTemp(T);
    var s = state(T);
    if (root.getAttribute('data-state') !== s) root.setAttribute('data-state', s);
    if (window.HollinField) window.HollinField.set(a);
  }
  function request() { if (!pending) { pending = true; requestAnimationFrame(update); } }

  measure(); lastT = null; update();
  window.addEventListener('scroll', request, { passive: true });
  if (HOLL.lenis) HOLL.lenis.on('scroll', request);
  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { measure(); lastT = null; update(); }, 150); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { measure(); lastT = null; update(); });
  window.addEventListener('load', function () { measure(); lastT = null; update(); });

  /* The shape of a session: the trace draws itself as the rest section arrives. */
  var path = document.querySelector('[data-trace]');
  if (path && window.gsap && window.ScrollTrigger && !HOLL.reduced) {
    gsap.fromTo(path, { strokeDashoffset: 1 }, {
      strokeDashoffset: 0, ease: 'none',
      scrollTrigger: { trigger: path, start: 'top 92%', end: 'top 30%', scrub: 0.6 }
    });
  }
})();
