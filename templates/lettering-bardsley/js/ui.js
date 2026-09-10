/* NELL BARDSLEY — shared chrome: the wipes, the in-page nav marker, the
   commissions form and the footer year. */

(function (root, doc) {
  'use strict';

  function $(s, c) { return (c || doc).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); }

  /* ---- the wipes ---------------------------------------------------------
     Ink is laid, never faded: everything here travels a clip-path rather
     than an opacity. Which means the failure mode is worse than a missing
     fade — an unfired wipe is content clipped to zero width — so the
     deadline below is not optional. */

  function initWipes() {
    var items = $$('.wipe');
    if (!items.length) return;

    /* clip-path finishes at inset(0 0 0 0), which still clips at the border
       box. Anything that overflows afterwards — a focus ring, a hover shift
       — would be cut off, so the clip is dropped entirely once the
       transition has run. */
    function settle(el) {
      el.classList.add('in');
      setTimeout(function () { el.classList.add('done'); }, 1400);
    }

    if (!root.IntersectionObserver ||
        root.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      items.forEach(function (el) { el.classList.add('in', 'done'); });
      return;
    }

    /* A small stagger inside each section, so a heading and its lede arrive
       as two strokes rather than one block. Set as a custom property because
       the transition-delay belongs to the stylesheet's timing, not here. */
    var seen = new WeakMap();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var host = en.target.closest('section') || doc.body;
        var n = seen.get(host) || 0;
        seen.set(host, n + 1);
        en.target.style.setProperty('--d', Math.min(n, 4) * 90 + 'ms');
        settle(en.target);
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.04 });
    items.forEach(function (el) { io.observe(el); });

    /* IntersectionObserver runs as part of the browser's rendering steps, so
       a throttled or never-composited tab can leave an element observed and
       never notified. This sweep runs off the scroll input instead. */
    function sweep() {
      for (var i = 0; i < items.length; i++) {
        var el = items[i];
        if (el.classList.contains('in')) continue;
        if (el.getBoundingClientRect().top < root.innerHeight * 0.92) {
          settle(el);
          io.unobserve(el);
        }
      }
    }
    root.addEventListener('scroll', sweep, { passive: true });
    root.addEventListener('resize', sweep);
    root.addEventListener('load', sweep);
    sweep();

    /* The rule that actually matters: a wipe is decoration, but an unfired
       wipe is content clipped out of existence. Between IntersectionObserver
       (needs the rendering loop), the scroll sweep (needs a scroll event)
       and a deep link like /#faces (which scrolls after load without firing
       one), there are more ways to miss the trigger than are worth
       enumerating. So nothing stays clipped past a deadline. */
    setTimeout(function () {
      items.forEach(function (el) { el.classList.add('in', 'done'); });
    }, 3000);
  }

  /* ---- in-page nav marker ------------------------------------------------ */

  function initNav() {
    var links = $$('.top nav a[href^="#"]');
    if (!links.length) return;
    var targets = links
      .map(function (a) { return { a: a, el: doc.getElementById(a.getAttribute('href').slice(1)) }; })
      .filter(function (t) { return t.el; });
    if (!targets.length) return;

    var queued = false;
    function mark() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () {
        queued = false;
        /* The section whose top has most recently passed a third of the
           viewport is the one being read. */
        var line = root.innerHeight / 3;
        var current = null;
        targets.forEach(function (t) {
          if (t.el.getBoundingClientRect().top <= line) current = t;
        });
        targets.forEach(function (t) {
          if (t === current) t.a.setAttribute('aria-current', 'true');
          else t.a.removeAttribute('aria-current');
        });
      });
    }
    root.addEventListener('scroll', mark, { passive: true });
    mark();
  }

  /* ---- commissions ------------------------------------------------------- */

  function initForm() {
    var form = $('#commissionForm');
    if (!form) return;

    function bad(input, msg) {
      var f = input.closest('.field');
      f.classList.add('field--bad');
      input.setAttribute('aria-invalid', 'true');
      var e = $('.field__err', f);
      if (e) e.textContent = msg;
    }
    function clear(input) {
      var f = input.closest('.field');
      f.classList.remove('field--bad');
      input.removeAttribute('aria-invalid');
      var e = $('.field__err', f);
      if (e) e.textContent = '';
    }

    $$('input, textarea', form).forEach(function (el) {
      el.addEventListener('input', function () { clear(el); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = $('#c-name'), email = $('#c-email'), brief = $('#c-brief');
      var ok = true, first = null;

      if (!name.value.trim()) { bad(name, 'Needed, so I know who I am writing back to.'); ok = false; first = name; }
      /* Deliberately permissive. The only real test of an address is sending
         to it; anything stricter mostly rejects valid addresses. */
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
        bad(email, 'That address looks incomplete.'); ok = false; first = first || email;
      }
      if (brief.value.trim().length < 12) {
        bad(brief, 'The words and a rough size is plenty to start.'); ok = false; first = first || brief;
      }
      if (!ok) { first.focus(); return; }

      var note = $('#sent');
      note.textContent = 'Thank you — that has arrived. I answer commissions on Thursdays ' +
        'and reply to all of them, including the ones I have to turn down.';
      note.hidden = false;
      form.reset();
      note.setAttribute('tabindex', '-1');
      note.focus();
    });
  }

  function initYear() {
    $$('[data-year]').forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  function start() { initWipes(); initNav(); initForm(); initYear(); }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start);
  else start();

})(window, document);
