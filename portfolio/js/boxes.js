/* Interactive box field — vanilla port of the React/Framer "background boxes".
   ------------------------------------------------------------------------
   Same visual contract as the original: a skewed lattice of 64x32 cells that
   flash a random colour the instant the pointer enters and fade back over two
   seconds, with a drawn plus at every other intersection.

   Three deliberate departures, because this repo ships static files with no
   framework and no build step:

   1. The original hard-codes 150 x 100 = 15 000 nodes. Here the count is
      derived from the viewport, so a 1600px screen builds roughly 900 cells
      and a phone builds ~250.
   2. Framer's per-cell `whileHover` becomes one CSS transition plus a single
      delegated pointerover listener that randomises a custom property. One
      listener for the whole field instead of one motion component per cell.
   3. The palette is this site's neon set rather than Tailwind's -300 ramp.

   The field is decorative: the container is aria-hidden in the markup, and
   nothing here is required for the page to be read or navigated. */

(function () {
  'use strict';

  var host = document.getElementById('boxes');
  if (!host) return;

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* this site's inks, at the intensity a flashed cell wants */
  var COLORS = [
    'rgb(34 232 255)',   /* cyan   */
    'rgb(255 46 166)',   /* magenta*/
    'rgb(184 255 60)',   /* lime   */
    'rgb(139 92 255)',   /* violet */
    'rgb(96 245 214)',   /* aqua   */
    'rgb(255 122 60)'    /* ember  */
  ];

  var CELL_W = 64, CELL_H = 32;
  var built = 0;

  function build() {
    /* The lattice is skewed and scaled, so it has to be built larger than the
       viewport to still cover it at the corners. 1.9x on each axis is the
       smallest factor that leaves no gap at 21:9. */
    var vw = window.innerWidth, vh = Math.min(window.innerHeight, 1100);
    var cols = Math.ceil((vw * 1.9) / CELL_W);
    var rows = Math.ceil((vh * 1.9) / CELL_H);

    /* Hard ceiling: past this the paint cost stops being worth the effect. */
    cols = Math.min(cols, 46);
    rows = Math.min(rows, 30);

    var total = cols * rows;
    if (total === built) return;      /* nothing meaningful changed */
    built = total;

    var frag = document.createDocumentFragment();
    for (var i = 0; i < cols; i++) {
      var col = document.createElement('div');
      col.className = 'bx-col';
      for (var j = 0; j < rows; j++) {
        var cell = document.createElement('div');
        cell.className = (i % 2 === 0 && j % 2 === 0) ? 'bx bx--plus' : 'bx';
        col.appendChild(cell);
      }
      frag.appendChild(col);
    }
    host.textContent = '';
    host.appendChild(frag);
  }

  /* One listener for the field. The cell keeps whatever colour it was last
     given; CSS does the instant-on and the two-second fade. */
  if (!reduced) {
    host.addEventListener('pointerover', function (e) {
      var t = e.target;
      if (!t || t.className.indexOf('bx') !== 0) return;
      t.style.setProperty('--flash', COLORS[(Math.random() * COLORS.length) | 0]);
    });
  }

  build();

  var t;
  window.addEventListener('resize', function () {
    clearTimeout(t);
    t = setTimeout(build, 220);
  });
})();
