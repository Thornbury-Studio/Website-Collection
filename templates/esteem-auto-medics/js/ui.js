/* Esteem Auto Medics — shared chrome: WhatsApp links, nav, reveals, year. */

(function () {
  'use strict';

  /* One place for the workshop's number. From the business card — confirm the
     line is WhatsApp-enabled before production. */
  var WHATSAPP_NUMBER = '6596924113';

  document.addEventListener('DOMContentLoaded', function () {

    document.querySelectorAll('[data-wa]').forEach(function (a) {
      var msg = a.getAttribute('data-wa') || "Hi Esteem Auto Medics, I'd like to find out more.";
      a.href = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(msg);
      a.target = '_blank';
      a.rel = 'noopener';
    });

    var toggle = document.querySelector('.nav-toggle');
    var nav = document.getElementById('site-nav');
    if (toggle && nav) {
      toggle.addEventListener('click', function () {
        var open = nav.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', String(open));
        document.body.classList.toggle('nav-locked', open);
      });
      nav.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
          nav.classList.remove('is-open');
          toggle.setAttribute('aria-expanded', 'false');
          document.body.classList.remove('nav-locked');
        });
      });
    }

    var header = document.querySelector('.site-header');
    if (header) {
      var onScroll = function () {
        header.classList.toggle('is-scrolled', window.scrollY > 10);
      };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    /* Reveals gate on .js-anim so a stalled observer can never blank the page. */
    var reveals = document.querySelectorAll('.reveal');
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reveals.length && !reduced && 'IntersectionObserver' in window) {
      document.documentElement.classList.add('js-anim');
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -36px 0px' });
      reveals.forEach(function (r) { io.observe(r); });
      setTimeout(function () {
        reveals.forEach(function (r) { r.classList.add('is-in'); });
      }, 2600);
    }

    var year = document.querySelector('[data-year]');
    if (year) year.textContent = String(new Date().getFullYear());
  });
}());
