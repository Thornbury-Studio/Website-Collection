/* HEDDLE — one file under all three pages, everything guarded on presence.

     1. the header (drawer)
     2. reveals — a rise, once, never re-run
     3. every swatch and notation canvas on the page, painted from its draft
     4. the loom beside the home page: which cloth it weaves, and the readout
     5. the enquiry, which composes a message and hands it to a mail client
        with the sampler the loom wove while the visitor read
*/
(function (root, doc) {
  'use strict';

  var W = root.WEAVE;
  var html = doc.documentElement;
  var animates = html.classList.contains('js-anim');

  /* -- 1. header ------------------------------------------------------- */

  var burger = doc.getElementById('burger');
  var drawer = doc.getElementById('drawer');
  function setNav(open) {
    if (!burger || !drawer) return;
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    drawer.setAttribute('data-open', open ? 'true' : 'false');
  }
  if (burger && drawer) {
    burger.addEventListener('click', function () {
      setNav(burger.getAttribute('aria-expanded') !== 'true');
    });
    drawer.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') setNav(false);
    });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setNav(false);
    });
  }

  /* -- 2. reveals ------------------------------------------------------ */

  /* Hidden state is opacity and a translate, never a clip: an element hidden
     with clip-path has an intersection rectangle of zero area and the
     observer never fires. Observed, not scroll-driven — scroll events are
     coalesced, and anchor jumps and find-in-page move the page without one. */
  var reveals = doc.querySelectorAll('.reveal');
  if (!animates || !('IntersectionObserver' in root)) {
    for (var i = 0; i < reveals.length; i++) reveals[i].classList.add('in');
  } else {
    var io = new IntersectionObserver(function (entries) {
      for (var e = 0; e < entries.length; e++) {
        if (!entries[e].isIntersecting) continue;
        entries[e].target.classList.add('in');
        io.unobserve(entries[e].target);
      }
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.03 });
    for (var j = 0; j < reveals.length; j++) io.observe(reveals[j]);
  }

  if (!W) return;

  /* -- 3. swatches ----------------------------------------------------- */

  var draftCache = {};
  function draftFor(id) {
    if (!draftCache[id] && W.BY_ID[id]) draftCache[id] = W.fromCloth(W.BY_ID[id]);
    return draftCache[id];
  }

  var swatches = doc.querySelectorAll('canvas.swatch[data-cloth]');
  var notations = doc.querySelectorAll('canvas.notation[data-cloth]');
  function paintAll() {
    var k, d;
    for (k = 0; k < swatches.length; k++) {
      d = draftFor(swatches[k].getAttribute('data-cloth'));
      if (d) W.renderCloth(swatches[k], d, parseFloat(swatches[k].getAttribute('data-cell')) || 6);
    }
    for (k = 0; k < notations.length; k++) {
      d = draftFor(notations[k].getAttribute('data-cloth'));
      if (d) W.renderNotation(notations[k], d, { ends: parseInt(notations[k].getAttribute('data-ends'), 10) || 32 });
    }
  }
  if (swatches.length || notations.length) {
    paintAll();
    var repaintTimer;
    root.addEventListener('resize', function () {
      clearTimeout(repaintTimer);
      repaintTimer = setTimeout(paintAll, 120);
    });
  }

  /* -- 4. the loom ----------------------------------------------------- */

  var colCanvas = doc.getElementById('loomColumn');
  var bandCanvas = doc.getElementById('loomBand');
  var loom = null;

  if (colCanvas && bandCanvas) {
    var wide = root.matchMedia('(min-width: 1040px)');
    var nameEls = doc.querySelectorAll('.loom-name');
    var pickEls = doc.querySelectorAll('.loom-pick');
    var endsEls = doc.querySelectorAll('.loom-ends');
    var structEls = doc.querySelectorAll('.loom-structure');
    var editLink = doc.getElementById('loomEdit');
    var samplerNote = doc.getElementById('samplerNote');
    var idxOf = {};
    for (var c = 0; c < W.CLOTHS.length; c++) idxOf[W.CLOTHS[c].id] = c;

    function setText(list, text) {
      for (var k = 0; k < list.length; k++) if (list[k].textContent !== text) list[k].textContent = text;
    }

    function onDraft(idx) {
      var cloth = W.CLOTHS[idx];
      setText(nameEls, cloth.name);
      setText(structEls, cloth.structure);
      if (editLink) editLink.href = 'draft.html?cloth=' + cloth.id;
      var label = 'The loom, weaving ' + cloth.name;
      colCanvas.setAttribute('aria-label', label + ': threading across the top, tie-up top right, treadling down the right, and the cloth below the fell');
      bandCanvas.setAttribute('aria-label', label);
    }

    function onPick(n) {
      setText(pickEls, n.toLocaleString('en-GB'));
      if (loom) setText(endsEls, String(loom.ends()));
      if (samplerNote && loom) {
        var seg = loom.sampler();
        if (seg.length > 1) {
          var parts = [];
          for (var k = 0; k < seg.length; k++) parts.push(seg[k].name + ' ' + seg[k].picks);
          samplerNote.textContent = 'While you read, the loom wove a sampler of ' + seg.length + ' cloths, ' + n.toLocaleString('en-GB') + ' picks: ' + parts.join(', ') + '. It goes with the enquiry.';
        }
      }
    }

    /* Which cloth is the page talking about. Sections carry a default; a card
       under the reading line beats its section; a card under the pointer
       beats everything. Resolved from the geometry on each scroll frame, so
       an anchor jump lands on the right cloth too. */
    var targets = doc.querySelectorAll('[data-draft], .cloth-card[data-cloth]');
    var hover = -1;
    var raf = 0;

    function resolve() {
      raf = 0;
      if (!loom) return;
      if (hover >= 0) { loom.setDraft(hover); return; }
      var line = root.innerHeight * (wide.matches ? 0.42 : 0.5);
      var pick = -1, best = -1;
      for (var k = 0; k < targets.length; k++) {
        var rect = targets[k].getBoundingClientRect();
        if (rect.top > line || rect.bottom <= line) continue;
        var id = targets[k].getAttribute('data-draft') || targets[k].getAttribute('data-cloth');
        if (idxOf[id] === undefined) continue;
        /* the deepest element wins; two cards side by side both hold the
           line, and the first in reading order is the one being read */
        var depth = 0, el = targets[k];
        while (el.parentElement) { depth++; el = el.parentElement; }
        if (depth > best) { best = depth; pick = idxOf[id]; }
      }
      if (pick >= 0) loom.setDraft(pick);
    }
    function ask() { if (!raf) raf = root.requestAnimationFrame(resolve); }

    function build() {
      if (loom) loom.destroy();
      var mode = wide.matches ? 'column' : 'band';
      loom = root.HEDDLE_LOOM.create(mode === 'column' ? colCanvas : bandCanvas, mode, { onDraft: onDraft, onPick: onPick });
      onDraft(loom.active());
      ask();
    }

    if (root.HEDDLE_LOOM) {
      build();
      if (wide.addEventListener) wide.addEventListener('change', build);
      else if (wide.addListener) wide.addListener(build);
      root.addEventListener('scroll', ask, { passive: true });
      root.addEventListener('resize', ask);

      var cards = doc.querySelectorAll('.cloth-card[data-cloth]');
      for (var q = 0; q < cards.length; q++) {
        (function (card) {
          var idx = idxOf[card.getAttribute('data-cloth')];
          if (idx === undefined) return;
          function on() { hover = idx; ask(); }
          function off() { hover = -1; ask(); }
          card.addEventListener('mouseenter', on);
          card.addEventListener('mouseleave', off);
          card.addEventListener('focusin', on);
          card.addEventListener('focusout', off);
        })(cards[q]);
      }
    }
  }

  /* -- 5. the enquiry -------------------------------------------------- */

  var form = doc.getElementById('enquiry');
  if (form) {
    var clothSel = doc.getElementById('fCloth');
    var wanted = /[?&]cloth=([a-z]+)/.exec(root.location.search);
    if (wanted && clothSel) {
      for (var o = 0; o < clothSel.options.length; o++) {
        if (clothSel.options[o].value === wanted[1]) { clothSel.selectedIndex = o; break; }
      }
    }
    var note = doc.getElementById('enquiryNote');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = (doc.getElementById('fName').value || '').trim();
      var email = (doc.getElementById('fEmail').value || '').trim();
      var metres = doc.getElementById('fMetres').value;
      var use = doc.getElementById('fFor');
      var msg = (doc.getElementById('fMsg').value || '').trim();
      var clothName = clothSel.options[clothSel.selectedIndex].text;

      if (!name || !email || email.indexOf('@') < 1) {
        note.hidden = false;
        note.textContent = 'A name and an email address are the two things we need back.';
        return;
      }

      var lines = [
        'Cloth: ' + clothName,
        'Metres: ' + metres,
        'For: ' + use.options[use.selectedIndex].text,
        'From: ' + name + ' <' + email + '>',
        '',
        msg || '(no message)'
      ];
      if (loom) {
        var seg = loom.sampler();
        if (seg.length) {
          var parts = [];
          for (var k = 0; k < seg.length; k++) parts.push(seg[k].name + ' ' + seg[k].picks);
          lines.push('', 'Sampler woven while reading (' + loom.picks().toLocaleString('en-GB') + ' picks): ' + parts.join(', '));
        }
      }
      var href = 'mailto:cloth@heddle.scot?subject=' + encodeURIComponent('Cloth enquiry: ' + clothName) +
                 '&body=' + encodeURIComponent(lines.join('\n'));
      note.hidden = false;
      note.textContent = 'Your mail client should open with the enquiry written out. If it does not, write to cloth@heddle.scot and mention ' + clothName + '.';
      root.location.href = href;
    });
  }
})(window, document);
