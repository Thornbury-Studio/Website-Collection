/* LATENT. — page scaffolding: smooth scroll, and every photograph on the
   page coming up the way a print does in the tray (flat and pale first,
   shadows next, full contrast last) as it scrolls into view. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var yearEl = document.querySelector('[data-year]');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  var figs = Array.prototype.slice.call(document.querySelectorAll('.develop'));
  if (reduced) return;

  document.documentElement.classList.add('js');

  var hasGsap = window.gsap && window.ScrollTrigger;
  var lenis = null;

  if (window.Lenis) {
    lenis = new window.Lenis({ duration: 1.1, anchors: { offset: -64 } });
    window.lenis = lenis;
    if (hasGsap) {
      lenis.on('scroll', window.ScrollTrigger.update);
      window.gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      window.gsap.ticker.lagSmoothing(0);
    } else {
      var loop = function (t) { lenis.raf(t); requestAnimationFrame(loop); };
      requestAnimationFrame(loop);
    }
  }

  if (hasGsap) {
    var gsap = window.gsap;
    gsap.registerPlugin(window.ScrollTrigger);
    figs.forEach(function (fig) {
      // induction first, then the image builds: the same curve as the bench's developer
      gsap.fromTo(fig, { '--dev': 0 }, {
        '--dev': 1, ease: 'power2.in',
        scrollTrigger: { trigger: fig, start: 'top 92%', end: 'top 40%', scrub: 0.6 }
      });
    });
    gsap.utils.toArray('.h2').forEach(function (h) {
      gsap.from(h, {
        y: 24, opacity: 0, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: h, start: 'top 88%', once: true }
      });
    });
  } else if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.style.transition = '--dev 1.6s';
        en.target.style.setProperty('--dev', '1');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -15% 0px' });
    figs.forEach(function (f) { io.observe(f); });
  } else {
    document.documentElement.classList.remove('js');
  }
})();
