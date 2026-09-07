/* Thornbury Digital v5 — js/reveal.js
   The second look, made literal. Two renders of one composition: the surface a
   visitor sees, and the structure underneath it. A round window follows the
   pointer and shows the structure only where you are actually looking — a
   cover, not a crossfade — and inside that window the structure assembles:
   leader lines draw out to their anchors and the labels resolve out of noise,
   through the same decoder the platform rig already uses. The annotations are
   real elements, not pixels: an SVG for the lines, spans for the words.

   The window is a radial-gradient mask on the structure layer, driven by three
   custom properties. One rAF loop lerps the window toward the pointer while
   anything is moving and then stops; nothing allocates per frame. The window
   lags the pointer a little and breathes open on arrival, so it reads as a
   lens being moved over the page rather than a cursor with a hole in it.

   Touch: a tap opens the window under the finger and a second tap closes it.
   Keyboard: the stage is focusable; focus opens the window at the centre and
   the arrow keys move it. Under reduced motion or with effects off this module
   is never mounted, and the band is the surface and its sentence. */

import { decoder } from './rig.js';

export function mount(stage) {
  var under = stage.querySelector('.reveal-under');
  if (!under) return null;
  var lines = [].slice.call(stage.querySelectorAll('.reveal-lines path'));
  var labels = [].slice.call(stage.querySelectorAll('.reveal-label'));

  var box = stage.getBoundingClientRect();
  var tx = box.width * 0.5, ty = box.height * 0.5;   /* where the window is going */
  var x = tx, y = ty, r = 0, tr = 0;                 /* where it is */
  var raf = 0, alive = true, open = false;
  var fine = matchMedia('(hover: hover)').matches;
  var timers = [], undo = [];

  /* each leader line learns its own length once, so a CSS transition can draw
     it from nothing to all of it and back */
  lines.forEach(function (p) {
    var L = p.getTotalLength();
    p.style.setProperty('--len', L.toFixed(1));
  });

  function radiusFor() { return Math.min(box.width, box.height) * (fine ? 0.36 : 0.42); }
  function measure() { box = stage.getBoundingClientRect(); }
  function write() {
    under.style.setProperty('--rx', x.toFixed(1) + 'px');
    under.style.setProperty('--ry', y.toFixed(1) + 'px');
    under.style.setProperty('--rr', r.toFixed(1) + 'px');
  }
  function tick() {
    raf = 0;
    if (!alive) return;
    x += (tx - x) * 0.16;
    y += (ty - y) * 0.16;
    r += (tr - r) * 0.12;
    write();
    if (Math.abs(tx - x) > 0.3 || Math.abs(ty - y) > 0.3 || Math.abs(tr - r) > 0.3) raf = requestAnimationFrame(tick);
    else { x = tx; y = ty; r = tr; write(); }
  }
  function wake() { if (!raf && alive) raf = requestAnimationFrame(tick); }
  function aim(cx, cy) { tx = cx - box.left; ty = cy - box.top; }

  /* the structure assembles: lines first, each label a beat after its line */
  function assemble() {
    clearWords();
    stage.classList.add('is-looking');
    labels.forEach(function (el, i) {
      timers.push(setTimeout(function () {
        undo[i] = decoder(el, el.getAttribute('data-text') || '', false);
      }, 240 + i * 150));
    });
  }
  function clearWords() {
    timers.forEach(clearTimeout);
    timers.length = 0;
    undo.forEach(function (u) { if (u) u(); });
    undo.length = 0;
    labels.forEach(function (el) { el.textContent = ''; });
  }
  function disassemble() {
    stage.classList.remove('is-looking');
    clearWords();
  }

  function openAt(cx, cy) {
    measure();
    aim(cx, cy);
    if (!open) { x = tx; y = ty; r = 0; assemble(); }   /* opens where you arrived */
    open = true;
    tr = radiusFor();
    wake();
  }
  function close() {
    if (!open) return;
    open = false;
    tr = 0;
    disassemble();
    wake();
  }

  stage.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'touch') openAt(e.clientX, e.clientY); });
  stage.addEventListener('pointermove', function (e) {
    if (e.pointerType === 'touch') return;
    if (!open) openAt(e.clientX, e.clientY); else { aim(e.clientX, e.clientY); wake(); }
  }, { passive: true });
  stage.addEventListener('pointerleave', function (e) { if (e.pointerType !== 'touch') close(); });
  stage.addEventListener('pointercancel', close);
  stage.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'touch') return;
    if (open) close(); else openAt(e.clientX, e.clientY);
  });
  stage.addEventListener('focus', function () {
    measure();
    openAt(box.left + box.width * 0.5, box.top + box.height * 0.5);
  });
  stage.addEventListener('blur', close);
  stage.addEventListener('keydown', function (e) {
    if (!open) return;
    var step = box.width * 0.06;
    if (e.key === 'ArrowLeft') tx -= step;
    else if (e.key === 'ArrowRight') tx += step;
    else if (e.key === 'ArrowUp') ty -= step;
    else if (e.key === 'ArrowDown') ty += step;
    else if (e.key === 'Escape') { close(); return; }
    else return;
    e.preventDefault();
    tx = Math.max(0, Math.min(box.width, tx));
    ty = Math.max(0, Math.min(box.height, ty));
    wake();
  });
  addEventListener('resize', measure);

  stage.classList.add('is-live');
  write();

  return {
    destroy: function () {
      alive = false;
      if (raf) cancelAnimationFrame(raf);
      disassemble();
      stage.classList.remove('is-live');
      removeEventListener('resize', measure);
      under.style.removeProperty('--rx');
      under.style.removeProperty('--ry');
      under.style.removeProperty('--rr');
    }
  };
}
