/* HEDDLE — one file under all three pages, everything guarded on presence.

     1. the header (drawer)
     2. reveals — a rise, once, never re-run
     3. the draft written out beside each cloth on the range page
     4. the enquiry, which composes a message and hands it to a mail client
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

  /* -- 3. the drafts ---------------------------------------------------- */

  var draftCache = {};
  function draftFor(id) {
    if (!draftCache[id] && W.BY_ID[id]) draftCache[id] = W.fromCloth(W.BY_ID[id]);
    return draftCache[id];
  }

  var notations = doc.querySelectorAll('canvas.notation[data-cloth]');
  function paintAll() {
    for (var k = 0; k < notations.length; k++) {
      var d = draftFor(notations[k].getAttribute('data-cloth'));
      if (d) W.renderNotation(notations[k], d, { ends: parseInt(notations[k].getAttribute('data-ends'), 10) || 32 });
    }
  }
  if (notations.length) {
    paintAll();
    var repaintTimer;
    root.addEventListener('resize', function () {
      clearTimeout(repaintTimer);
      repaintTimer = setTimeout(paintAll, 120);
    });
  }

  /* -- 4. the enquiry -------------------------------------------------- */

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
      var href = 'mailto:cloth@heddle.scot?subject=' + encodeURIComponent('Cloth enquiry: ' + clothName) +
                 '&body=' + encodeURIComponent(lines.join('\n'));
      note.hidden = false;
      note.textContent = 'Your mail client should open with the enquiry written out. If it does not, write to cloth@heddle.scot and mention ' + clothName + '.';
      root.location.href = href;
    });
  }
})(window, document);
