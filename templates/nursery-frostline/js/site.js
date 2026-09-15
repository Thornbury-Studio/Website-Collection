/* FROSTLINE — shared page behaviour.
   Three things: the break reveal, the scroll-linked rail, and the order
   sheet composer. No dependencies, no CDN. */
(function () {
  'use strict';

  var reduced = window.matchMedia &&
                window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- the break -------------------------------------------------------
     The observer watches each <section>, not the .brk elements inside it,
     for two reasons:

     1. Threshold safety. A .brk element can be taller than the viewport
        (the catalogue preview list is), and such an element can never
        reach a fractional threshold — at 1200 px in a 900 px viewport the
        ratio caps at 0.75, and a taller one caps lower still. Watching
        sections at threshold 0 cannot strand anything.
     2. The motion spec wants one event per viewport. Grouping by section
        makes the stagger read as a single reveal instead of each child
        racing its own observer.

     Note for anyone debugging this: clip-path does NOT hide an element
     from IntersectionObserver. A target clipped to inset(100% 0 0 0)
     still reports isIntersecting: true (with ratio 0.00), so there is no
     deadlock in observing a hidden element — that was checked directly on
     this page, not assumed. If reveals appear stuck in a headless or
     on-demand-painting browser, the cause is frame production: IO
     callbacks are delivered as part of the rendering steps, so a pane that
     only paints when asked will not deliver them until something forces a
     frame. That is a harness artifact, not a page bug.

     If IntersectionObserver is missing, the failsafe shows everything
     immediately rather than leaving the page clipped. */
  function reveals() {
    var items = [].slice.call(document.querySelectorAll('.brk'));
    if (!items.length) return;

    function show(el, i) {
      el.style.setProperty('--brk-d', (Math.min(i, 2) * 0.08) + 's');
      el.classList.add('is-up');
    }

    if (reduced || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-up'); });
      return;
    }

    var groups = new Map();
    items.forEach(function (el) {
      var host = el.closest('section') || el.parentElement || document.body;
      if (!groups.has(host)) groups.set(host, []);
      groups.get(host).push(el);
    });

    /* threshold 0: a section taller than the viewport can never reach a
       high ratio, so any non-zero threshold would strand long sections. */
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        (groups.get(e.target) || []).forEach(show);
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -5% 0px', threshold: 0 });

    groups.forEach(function (kids, host) { io.observe(host); });
  }

  /* --- the rail --------------------------------------------------------
     Scroll-LINKED, not fire-once: the bar reads document progress every
     frame rather than snapping at thresholds. rAF-coalesced so a fast
     wheel does not queue a write per event. */
  function rail() {
    var bar = document.querySelector('.rail i');
    if (!bar || reduced) return;
    var queued = false;

    function paint() {
      queued = false;
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var p = h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0;
      bar.style.height = (p * 100) + 'vh';
    }

    window.addEventListener('scroll', function () {
      if (!queued) { queued = true; requestAnimationFrame(paint); }
    }, { passive: true });
    window.addEventListener('resize', paint);
    paint();
  }

  /* --- order sheet -----------------------------------------------------
     Composes a written order and hands it to the visitor's mail client.
     There is no backend and nothing is submitted anywhere: no cart, no
     payment field, no stored personal data. */
  function orderSheet() {
    var form = document.getElementById('orderForm');
    if (!form) return;

    var out = document.getElementById('sheetOut');
    var send = document.getElementById('sheetSend');
    var copy = document.getElementById('sheetCopy');
    var F = window.FROSTLINE;

    function compose() {
      var d = new FormData(form);
      var want = d.getAll('plant');
      var lines = [
        'ORDER SHEET — FROSTLINE',
        'Bare-root and field-lifted stock',
        '',
        'Name        ' + (d.get('name') || '—'),
        'Delivery    ' + (d.get('town') || '—'),
        'Postcode    ' + (d.get('postcode') || '—'),
        'Lifting     ' + (d.get('window') || '—'),
        ''
      ];

      if (!want.length) {
        lines.push('No stock selected.');
      } else {
        lines.push('STOCK');
        var total = 0;
        want.forEach(function (key) {
          var p = F.stock.filter(function (s) {
            return (s.genus + '-' + s.species) === key;
          })[0];
          if (!p) return;
          var qty = parseInt(d.get('qty-' + key), 10) || 1;
          var line = qty * p.price;
          total += line;
          lines.push(
            '  ' + String(qty).padStart(2, ' ') + ' ×  ' +
            (F.binomial(p) + '                                   ').slice(0, 38) +
            p.rhs + '   £' + line.toFixed(2)
          );
        });
        lines.push('');
        lines.push('  Stock total                                  £' + total.toFixed(2));
        lines.push('  Carriage quoted on lifting, by weight.');
      }

      if (d.get('notes')) {
        lines.push('', 'SITE NOTES', '  ' + String(d.get('notes')).replace(/\n/g, '\n  '));
      }

      lines.push(
        '',
        'Nothing is charged from this sheet. We reply with a lifting date and',
        'a carriage figure, and you pay on despatch.'
      );
      return lines.join('\n');
    }

    function refresh() { if (out) out.textContent = compose(); }

    form.addEventListener('input', refresh);
    form.addEventListener('change', refresh);
    refresh();

    if (send) {
      send.addEventListener('click', function () {
        if (!form.reportValidity()) return;
        var body = encodeURIComponent(compose());
        window.location.href = 'mailto:lifting@frostline.example?subject=' +
          encodeURIComponent('Order sheet') + '&body=' + body;
      });
    }

    if (copy) {
      copy.addEventListener('click', function () {
        var text = compose();
        function done() {
          copy.textContent = 'Copied';
          setTimeout(function () { copy.textContent = 'Copy sheet'; }, 1800);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, done);
        } else if (out) {
          var r = document.createRange();
          r.selectNodeContents(out);
          var sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(r);
          done();
        }
      });
    }
  }

  function init() { reveals(); rail(); orderSheet(); }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
