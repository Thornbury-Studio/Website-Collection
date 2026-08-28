/* ═══════════════════════════════════════════════════════════════════════════
   boot — the only script that runs before first paint.

   It exists as a file rather than an inline <script> because this template's
   CSP has no 'unsafe-inline'. Three jobs: mark the document as scripted (which
   is what holds scroll until the instrument is composed), record whether this
   is a touch device so the hero can ask for a drag instead of a move, and arm
   a watchdog so a failed WebGL context or a model that never arrives falls
   back to readable text instead of an indefinitely locked page.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  var doc = document.documentElement;
  doc.classList.add("js");

  if (matchMedia("(pointer: coarse)").matches) doc.classList.add("touch");

  /* Generous: a 3MB model over a slow connection is not a failure. This only
     catches the genuine dead ends — no WebGL, a decoder that never resolves,
     a throw before archive.js can report for itself. */
  setTimeout(function () {
    if (!window.__AI) doc.classList.add("no-3d");
  }, 20000);
})();
