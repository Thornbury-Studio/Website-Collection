/* CHALKLINE — the hero plan.

   The plan is baked into the HTML, so it is there before this runs and
   every room already answers hover through CSS. This adds the three
   things CSS can't: a slow tour that fills one room at a time until the
   visitor touches the plan, a sheet row that follows the active room,
   and touch handling — on a phone the first tap previews the room and
   the second tap follows the link. */

(function (root, doc) {
  'use strict';

  var stage = doc.getElementById('heroPlan');
  if (!stage) return;
  var rooms = Array.prototype.slice.call(stage.querySelectorAll('.room'));
  var rows = Array.prototype.slice.call(doc.querySelectorAll('.sheet tr[data-room]'));
  var hint = doc.getElementById('planHint');
  if (!rooms.length) return;

  var reduce = root.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var tourable = rooms.filter(function (r) { return r.classList.contains('has-photo'); });
  var active = null, timer = null, i = -1, touched = false;

  function setActive(room) {
    if (active === room) return;
    if (active) active.classList.remove('is-on');
    active = room;
    if (room) room.classList.add('is-on');
    var id = room ? room.getAttribute('data-room') : null;
    rows.forEach(function (tr) { tr.classList.toggle('is-on', tr.getAttribute('data-room') === id); });
  }

  function step() {
    i = (i + 1) % tourable.length;
    setActive(tourable[i]);
  }

  function stopTour() {
    if (timer) { clearInterval(timer); timer = null; }
    if (hint) hint.hidden = true;
  }

  /* the tour: one room every 2.6 s, starting after the plan has drawn */
  if (tourable.length) {
    if (reduce) {
      setActive(tourable[0]);
    } else {
      setTimeout(function () {
        if (touched) return;
        step();
        timer = setInterval(step, 2600);
      }, 1500);
    }
  }

  rooms.forEach(function (room) {
    room.addEventListener('pointerenter', function (e) {
      if (e.pointerType === 'touch') return;
      touched = true; stopTour(); setActive(room);
    });
    room.addEventListener('focus', function () { touched = true; stopTour(); setActive(room); });

    /* touch: first tap previews, second tap follows the link */
    var lastType = 'mouse';
    room.addEventListener('pointerdown', function (e) { lastType = e.pointerType; });
    room.addEventListener('click', function (e) {
      if (lastType !== 'touch') return;
      touched = true; stopTour();
      if (active !== room) { e.preventDefault(); setActive(room); }
    });
  });

  stage.addEventListener('pointerleave', function (e) {
    if (e.pointerType === 'touch') return;
    /* keep the last room lit; a plan with nothing lit reads as broken */
  });

  /* sheet rows light their room too */
  rows.forEach(function (tr) {
    tr.addEventListener('pointerenter', function () {
      var id = tr.getAttribute('data-room');
      var room = rooms.filter(function (r) { return r.getAttribute('data-room') === id; })[0];
      if (room) { touched = true; stopTour(); setActive(room); }
    });
  });

})(window, document);
