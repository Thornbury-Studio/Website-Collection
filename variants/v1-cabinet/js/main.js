/* ZANE — CABINET. Variant 01.
   Zero dependencies. Nothing here blocks first paint, nothing plays sound. */

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* -----------------------------------------------------------------------
     Power-on reveal. Content is visible by default; the class is only added
     when the observer is actually available, so a failed script leaves a
     readable page rather than a blank one.
     ----------------------------------------------------------------------- */
  function initReveal() {
    if (reduced || !('IntersectionObserver' in window)) return;

    var targets = document.querySelectorAll('.sect, .attract');
    targets.forEach(function (el) { el.classList.add('reveal'); });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('is-on');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.04 });

    targets.forEach(function (el) { io.observe(el); });

    /* A backgrounded tab never fires the observer (and rAF is parked there
       too), so nothing would ever un-blur. Hard fallback. */
    setTimeout(function () {
      targets.forEach(function (el) { el.classList.add('is-on'); });
    }, 2200);
  }

  /* -----------------------------------------------------------------------
     Health-bar meters fill once, when their panel first comes into view.
     ----------------------------------------------------------------------- */
  function initMeters() {
    var list = document.getElementById('meters');
    if (!list) return;
    var bars = list.querySelectorAll('.meter i');

    function fill() { bars.forEach(function (b) { b.style.setProperty('--fill', '1'); }); }

    if (reduced || !('IntersectionObserver' in window)) { fill(); return; }

    bars.forEach(function (b) { b.style.setProperty('--fill', '0'); });
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { fill(); io.disconnect(); }
    }, { threshold: 0.3 });
    io.observe(list);
    setTimeout(fill, 2600);
  }

  /* -----------------------------------------------------------------------
     Control deck: mark the active key, and lean the joystick the way the
     screen is moving. One rAF-free scroll handler, throttled by the observer.
     ----------------------------------------------------------------------- */
  function initPanel() {
    var keys = Array.prototype.slice.call(document.querySelectorAll('.key[data-sect]'));
    var stick = document.getElementById('stick');
    if (!keys.length) return;

    var sections = keys
      .map(function (k) { return document.getElementById(k.dataset.sect); })
      .filter(Boolean);

    function setCurrent(id) {
      keys.forEach(function (k) {
        k.setAttribute('aria-current', k.dataset.sect === id ? 'true' : 'false');
      });
    }

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) setCurrent(e.target.id); });
      }, { rootMargin: '-30% 0px -55% 0px' });
      sections.forEach(function (s) { io.observe(s); });
    }

    if (stick && !reduced) {
      var last = window.scrollY, idle;
      var knob = stick.querySelector('i');
      window.addEventListener('scroll', function () {
        var y = window.scrollY;
        var dir = y > last ? 1 : -1;
        last = y;
        knob.style.transform = 'translate(-50%,' + (dir * 5) + 'px)';
        clearTimeout(idle);
        idle = setTimeout(function () { knob.style.transform = 'translate(-50%,0)'; }, 220);
      }, { passive: true });
    }
  }

  /* -----------------------------------------------------------------------
     Number keys 1-4 work the deck, the way the cabinet implies they would.
     Ignored while typing.
     ----------------------------------------------------------------------- */
  function initKeys() {
    var map = { '1': 'select', '2': 'stats', '3': 'scores', '4': 'coin' };
    document.addEventListener('keydown', function (e) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      var t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      var id = map[e.key];
      if (!id) return;
      var el = document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      el.setAttribute('tabindex', '-1');
      el.focus({ preventScroll: true });
    });
  }

  /* -----------------------------------------------------------------------
     Coin slot. There is no backend here, so the form says so plainly rather
     than pretending to have sent something.
     ----------------------------------------------------------------------- */
  function initForm() {
    var form = document.getElementById('coinForm');
    var out = document.getElementById('coinStatus');
    if (!form || !out) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = form.elements.email;
      var brief = form.elements.brief;

      if (!email.value.trim() || email.validity.typeMismatch) {
        out.dataset.state = 'error';
        out.textContent = 'Need a valid email before the coin drops.';
        email.focus();
        return;
      }
      if (!brief.value.trim()) {
        out.dataset.state = 'error';
        out.textContent = 'Tell me what we are building.';
        brief.focus();
        return;
      }
      out.dataset.state = 'ok';
      out.textContent = 'Demo form — not wired to a mailbox yet. Copy your note and email it.';
    });
  }

  initReveal();
  initMeters();
  initPanel();
  initKeys();
  initForm();
})();
