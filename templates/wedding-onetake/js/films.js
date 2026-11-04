/* Films page: each preview loads only when asked for (button, or hover on a
   mouse), plays muted, and stops when it leaves the screen. Nothing plays
   by itself under reduced motion. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var boxes = Array.prototype.slice.call(document.querySelectorAll('[data-preview]'));

  boxes.forEach(function (box) {
    var v = box.querySelector('video');
    var btn = box.querySelector('button');
    var set = function (on) {
      box.classList.toggle('is-playing', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.textContent = on ? 'Pause preview' : 'Play preview';
    };
    var play = function () {
      if (!v.src) { v.src = v.getAttribute('data-src'); v.preload = 'auto'; }
      var p = v.play();
      if (p && p.then) p.then(function () { set(true); }, function () { set(false); }); else set(true);
    };
    var stop = function () { v.pause(); set(false); };
    btn.addEventListener('click', function () { if (v.paused) play(); else stop(); });
    if (hover && !reduce) {
      box.addEventListener('mouseenter', play);
      box.addEventListener('mouseleave', stop);
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { if (!en[0].isIntersecting && !v.paused) stop(); }, { threshold: 0.1 }).observe(box);
    }
  });
})();
