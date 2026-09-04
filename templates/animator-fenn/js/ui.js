/* MARLOWE FENN — shared chrome: stepped reveals, the in-page nav marker,
   the commissions form and the footer year. */

(function (root, doc) {
  'use strict';

  function $(s, c) { return (c || doc).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); }

  /* ---- reveals ----------------------------------------------------------- */

  function initReveals() {
    var items = $$('.rev');
    if (!items.length) return;

    if (!root.IntersectionObserver ||
        root.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      items.forEach(function (el) { el.classList.add('in'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
    items.forEach(function (el) { io.observe(el); });

    /* IntersectionObserver only runs as part of the browser's rendering
       steps, so a throttled or never-composited tab can leave an element
       observed but never notified — and an unfired reveal is content stuck at
       opacity zero, which is a far worse outcome than no animation. This
       sweep runs off the scroll input instead. */
    function sweep() {
      for (var i = 0; i < items.length; i++) {
        var el = items[i];
        if (el.classList.contains('in')) continue;
        if (el.getBoundingClientRect().top < root.innerHeight * 0.9) {
          el.classList.add('in');
          io.unobserve(el);
        }
      }
    }
    root.addEventListener('scroll', sweep, { passive: true });
    root.addEventListener('resize', sweep);

    sweep();
    root.addEventListener('load', sweep);

    /* The failsafe, and the only rule that actually matters here: a reveal is
       decoration, but an unfired reveal is content stuck at opacity zero.
       Between IntersectionObserver (which needs the rendering loop), the
       scroll sweep (which needs a scroll event) and a deep link like /#work
       (which scrolls without firing one, after load, at a moment no listener
       is told about), there are too many ways for the trigger to be missed to
       enumerate them. So nothing stays hidden past a deadline: whatever has
       not revealed itself in three seconds is shown regardless. */
    setTimeout(function () {
      items.forEach(function (el) { el.classList.add('in'); });
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
    var form = $('#commission');
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

      if (!name.value.trim()) { bad(name, 'Needed, so I know who I am replying to.'); ok = false; first = name; }
      /* Deliberately permissive. The only real test of an address is sending
         to it; anything stricter mostly rejects valid addresses. */
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) {
        bad(email, 'That address looks incomplete.'); ok = false; first = first || email;
      }
      if (brief.value.trim().length < 12) {
        bad(brief, 'A sentence about the piece is plenty.'); ok = false; first = first || brief;
      }
      if (!ok) { first.focus(); return; }

      var note = $('#sent');
      note.textContent = 'Thank you — that has arrived. I read commissions on Mondays ' +
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

  function start() { initReveals(); initNav(); initForm(); initYear(); }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start);
  else start();

})(window, document);
