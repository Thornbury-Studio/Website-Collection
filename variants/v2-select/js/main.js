/* ZANE — SELECT. Variant 02.
   Zero dependencies. The roster is a real listbox: mouse, keyboard and
   screen readers all drive the same selection. No sound, ever. */

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var roster  = document.getElementById('roster');
  var wrap    = document.getElementById('cardWrap');
  if (!roster || !wrap) return;

  var options = Array.prototype.slice.call(roster.querySelectorAll('[role="option"]'));
  var cards   = Array.prototype.slice.call(wrap.querySelectorAll('.card'));
  var cols    = 3;
  var index   = Math.max(0, options.findIndex(function (o) {
    return o.getAttribute('aria-selected') === 'true';
  }));

  /* --------------------------------------------------------------------- */
  function fillBars(card) {
    var bars = card.querySelectorAll('.bar i');
    if (reduced) {
      bars.forEach(function (b) { b.style.setProperty('--fill', '1'); });
      return;
    }
    bars.forEach(function (b) { b.style.setProperty('--fill', '0'); });
    // one frame later so the transition has a start value to run from
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        bars.forEach(function (b) { b.style.setProperty('--fill', '1'); });
      });
    });
    // rAF is parked in a background tab; make sure the bars still end up full
    setTimeout(function () {
      bars.forEach(function (b) { b.style.setProperty('--fill', '1'); });
    }, 900);
  }

  function select(i, focusRoster) {
    index = (i + options.length) % options.length;
    var id = options[index].dataset.id;

    options.forEach(function (o, n) {
      o.setAttribute('aria-selected', n === index ? 'true' : 'false');
    });
    roster.setAttribute('aria-activedescendant', options[index].id);

    cards.forEach(function (c) {
      var on = c.dataset.card === id;
      c.hidden = !on;
      c.classList.toggle('is-on', on);
      if (on) fillBars(c);
    });

    if (focusRoster) roster.focus({ preventScroll: true });
  }

  /* ---- mouse ---------------------------------------------------------- */
  options.forEach(function (o, n) {
    o.addEventListener('click', function () { select(n); });
    o.addEventListener('mouseenter', function () { select(n); });
  });

  /* ---- keyboard: the roster behaves like the grid it looks like -------- */
  roster.addEventListener('keydown', function (e) {
    var handled = true;
    switch (e.key) {
      case 'ArrowRight': select(index + 1, true); break;
      case 'ArrowLeft':  select(index - 1, true); break;
      case 'ArrowDown':  select(index + cols, true); break;
      case 'ArrowUp':    select(index - cols, true); break;
      case 'Home':       select(0, true); break;
      case 'End':        select(options.length - 1, true); break;
      case 'Enter':
      case ' ': {
        var link = cards[index] && cards[index].querySelector('.fight');
        if (link) link.click();
        break;
      }
      default: handled = false;
    }
    if (handled) e.preventDefault();
  });

  /* ---- 1-6 anywhere on the page --------------------------------------- */
  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    var n = parseInt(e.key, 10);
    if (n >= 1 && n <= options.length) {
      e.preventDefault();
      select(n - 1);
      document.getElementById('select').scrollIntoView({
        behavior: reduced ? 'auto' : 'smooth', block: 'start'
      });
    }
  });

  /* ---- HUD timer: counts down once, then rests. Decoration with a stop. */
  (function () {
    var el = document.querySelector('.hud__timer');
    if (!el || reduced) return;
    var v = 99;
    var t = setInterval(function () {
      v -= 1;
      el.textContent = v < 10 ? '0' + v : String(v);
      if (v <= 90) clearInterval(t);
    }, 900);
  })();

  /* ---- contact ---------------------------------------------------------- */
  (function () {
    var form = document.getElementById('ctaForm');
    var out  = document.getElementById('ctaStatus');
    if (!form || !out) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = form.elements.email, brief = form.elements.brief;
      if (!email.value.trim() || email.validity.typeMismatch) {
        out.dataset.state = 'error';
        out.textContent = 'That email will not reach me. Check it and try again.';
        email.focus(); return;
      }
      if (!brief.value.trim()) {
        out.dataset.state = 'error';
        out.textContent = 'Say what we are building, even in one line.';
        brief.focus(); return;
      }
      out.dataset.state = 'ok';
      out.textContent = 'Demo form — no mailbox wired up yet. Copy your note and send it over.';
    });
  })();

  fillBars(cards[index]);
})();
