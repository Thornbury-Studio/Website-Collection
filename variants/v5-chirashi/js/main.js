/* ZANE — CHIRASHI. Variant 05.
   Zero dependencies. One authored motion: blocks arrive out of register and
   snap into it, the way a sheet does coming off a press. No sound. */

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- the press ------------------------------------------------------- */
  function initPress() {
    if (reduced || !('IntersectionObserver' in window)) return;

    var blocks = document.querySelectorAll(
      '.title, .howto li, .stamps li, .coupon, .feature, .spec, .band'
    );
    blocks.forEach(function (b) { b.classList.add('ontoplate'); });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e, n) {
        if (!e.isIntersecting) return;
        /* a short stagger so a row lands like a row, not all at once */
        var delay = Math.min(n, 5) * 45;
        setTimeout(function () { e.target.classList.add('is-set'); }, delay);
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });

    blocks.forEach(function (b) { io.observe(b); });

    /* observers never fire in a backgrounded tab — never leave the sheet blank */
    setTimeout(function () {
      blocks.forEach(function (b) { b.classList.add('is-set'); });
    }, 2400);
  }

  /* ---- section marker on the top band ---------------------------------- */
  function initNav() {
    if (!('IntersectionObserver' in window)) return;
    var links = Array.prototype.slice.call(document.querySelectorAll('.top__nav a'));
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) {
          a.setAttribute('aria-current',
            a.getAttribute('href') === '#' + en.target.id ? 'true' : 'false');
        });
      });
    }, { rootMargin: '-20% 0px -65% 0px' });
    ['titles', 'howto', 'specs', 'order'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) io.observe(el);
    });
  }

  /* ---- 1-6 opens a title, the way a flyer's numbers imply -------------- */
  function initKeys() {
    var links = Array.prototype.slice.call(document.querySelectorAll('.title a'));
    if (!links.length) return;
    document.addEventListener('keydown', function (e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      var t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      var n = parseInt(e.key, 10);
      if (n >= 1 && n <= links.length) {
        e.preventDefault();
        links[n - 1].focus();
        links[n - 1].scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
      }
    });
  }

  /* ---- the coupon ------------------------------------------------------ */
  function initForm() {
    var form = document.getElementById('orderForm');
    var out = document.getElementById('orderOut');
    if (!form || !out) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = form.elements.email, brief = form.elements.brief;
      if (!email.value.trim() || email.validity.typeMismatch) {
        out.dataset.state = 'error';
        out.textContent = 'That address will not reach me — check it and send again.';
        email.focus(); return;
      }
      if (!brief.value.trim()) {
        out.dataset.state = 'error';
        out.textContent = 'The brief is blank. One line is plenty.';
        brief.focus(); return;
      }
      out.dataset.state = 'ok';
    out.textContent = 'Thanks — please contact us directly to continue.';
    });
  }

  initPress();
  initNav();
  initKeys();
  initForm();
})();
