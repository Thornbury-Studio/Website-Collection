/* MARLOWE FENN — the exposure sheet.

   An exposure sheet (a dope sheet) is the page an animator shoots from: one
   numbered row per frame of film, and a column saying which drawing sits on
   that frame. Here the scroll position is the playhead. The head stays put
   and the paper advances under it, the way it does on a peg bar, and the
   stage renders whatever drawing the head is sitting on.

   The sheet is GENERATED from the same model that draws the ball — the
   contact and apex rows are found by looking at the physics, not typed in.
   If the timing changes, the paperwork changes with it, because a dope sheet
   that disagrees with the footage is worse than no dope sheet.

   Why a bouncing ball: it is the first exercise every animator is given, and
   it is still the one that shows whether someone can time. It also earns the
   stepped rendering honestly — the reason it reads as animation rather than
   as a tween is that the drawings are held. */

(function (root, doc) {
  'use strict';

  var FRAMES = 48;         /* 2 seconds at 24fps */
  var RATE = 24;
  var G = 16;              /* normalised units per second squared */
  var R = 0.052;           /* ball radius, in stage-height units */
  var APEXES = [0.86, 0.53, 0.33, 0.20, 0.13, 0.08];

  /* ---- the model --------------------------------------------------------

     A sequence of parabolic arcs with a 0.62 coefficient of restitution. The
     first segment is only the falling half of an arc, because the ball enters
     already dropping. Everything the sheet says about the shot is read back
     out of this. */

  function build() {
    var segs = [], t = 0, i;
    /* Opening fall: half an arc from the first apex. */
    var d0 = Math.sqrt(2 * APEXES[0] / G);
    segs.push({ t0: 0, dur: d0, h: APEXES[0], half: true });
    t = d0;
    for (i = 1; i < APEXES.length; i++) {
      var dur = 2 * Math.sqrt(2 * APEXES[i] / G);
      segs.push({ t0: t, dur: dur, h: APEXES[i], half: false });
      t += dur;
    }

    /* Contact times are the boundaries between segments. */
    var contacts = [];
    for (i = 0; i < segs.length; i++) contacts.push(segs[i].t0 + segs[i].dur);

    var frames = [];
    for (var f = 0; f < FRAMES; f++) {
      var time = f / RATE;
      var y = 0, vy = 0;
      for (i = 0; i < segs.length; i++) {
        var s = segs[i];
        if (time < s.t0 || time > s.t0 + s.dur) continue;
        var lt = time - s.t0;
        if (s.half) {
          /* falling from apex h */
          y = s.h - 0.5 * G * lt * lt;
          vy = -G * lt;
        } else {
          var v0 = Math.sqrt(2 * G * s.h);
          y = v0 * lt - 0.5 * G * lt * lt;
          vy = v0 - G * lt;
        }
        break;
      }
      if (y < 0) y = 0;

      /* Distance, in frames, to the nearest ground contact. This is what an
         animator marks on the sheet, and it is what drives squash. */
      var near = Infinity;
      for (i = 0; i < contacts.length; i++) {
        var d = Math.abs(time - contacts[i]) * RATE;
        if (d < near) near = d;
      }

      frames.push({ y: y, vy: vy, near: near });
    }

    /* Label the rows that matter: contacts, and the apex of each arc. */
    var apexFrames = {};
    for (i = 1; i < segs.length; i++) {
      apexFrames[Math.round((segs[i].t0 + segs[i].dur / 2) * RATE)] = 'apex';
    }
    for (i = 0; i < contacts.length; i++) {
      var cf = Math.round(contacts[i] * RATE);
      if (cf < FRAMES) apexFrames[cf] = 'contact';
    }
    for (var k = 0; k < frames.length; k++) {
      var tag = apexFrames[k];
      frames[k].label = tag === 'contact' ? 'contact · squash'
                      : tag === 'apex'    ? 'apex · hold'
                      : (k === 0 ? 'ball enters frame' : '');
    }
    return frames;
  }

  var MODEL = build();

  /* ---- drawing ----------------------------------------------------------- */

  function pose(f) {
    var m = MODEL[f];
    var sy = 1, sx = 1;
    /* Squash within a frame of contact, softening over the next. This is
       drawn, not simulated — the ball never actually penetrates the floor.
       Volume is held: whatever one axis loses the other gains. */
    /* Contact squash. The first pass used 0.68, which on a ball this size
       came out as a pancake rather than a bounce — with volume preserved a
       0.68 squash is also a 1.47 stretch sideways, and the two compound. */
    if (m.near <= 1) sy = 0.76;
    else if (m.near <= 2) sy = 0.90;
    else {
      /* Stretch with vertical speed. The apex hang comes free from the
         physics — the ball spends more frames near the top than anywhere
         else, which is the whole reason this exercise is taught. */
      var speed = Math.min(1, Math.abs(m.vy) / 5.2);
      sy = 1 + 0.24 * speed;
    }
    sx = 1 / sy;
    return { y: m.y, sx: sx, sy: sy };
  }

  function Stage(canvas) {
    this.c = canvas;
    this.ctx = canvas.getContext('2d');
    this.w = 0; this.h = 0;
  }

  Stage.prototype.size = function () {
    var r = this.c.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return false;
    var dpr = Math.min(root.devicePixelRatio || 1, 2);
    this.w = r.width; this.h = r.height;
    this.c.width = Math.round(r.width * dpr);
    this.c.height = Math.round(r.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return true;
  };

  Stage.prototype.draw = function (frame, onion) {
    if (!this.size()) return;
    var ctx = this.ctx, w = this.w, h = this.h;
    var css = getComputedStyle(doc.documentElement);
    var paper = css.getPropertyValue('--paper').trim() || '#cfcfcf';
    var rule = css.getPropertyValue('--rule-2').trim() || '#3a3a3a';

    ctx.clearRect(0, 0, w, h);

    /* Ground: the ball travels left to right across the plate over the shot. */
    var groundY = h * 0.84;
    ctx.strokeStyle = rule;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w * 0.06, groundY + 0.5);
    ctx.lineTo(w * 0.94, groundY + 0.5);
    ctx.stroke();

    var rad = R * h * 1.8;

    function place(f) {
      var p = pose(f);
      return {
        p: p,
        x: w * (0.10 + (f / (FRAMES - 1)) * 0.80),
        cy: groundY - p.y * h * 0.74 - rad * p.sy
      };
    }

    function ball(f, alpha, filled) {
      var s = place(f);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(s.x, s.cy);
      ctx.scale(s.p.sx, s.p.sy);
      ctx.beginPath();
      ctx.arc(0, 0, rad, 0, Math.PI * 2);
      if (filled) { ctx.fillStyle = paper; ctx.fill(); }
      else {
        ctx.strokeStyle = paper;
        ctx.lineWidth = 1 / Math.max(s.p.sx, s.p.sy);
        ctx.stroke();
      }
      ctx.restore();
    }

    /* Shadow first. Painting it after the ball put a grey band across the
       ball's lower edge, because the shadow ellipse overlaps the contact
       position by design. Order matters more than opacity here. */
    var now = place(frame);
    ctx.save();
    ctx.globalAlpha = 0.10 + 0.28 * (1 - Math.min(1, now.p.y / 0.9));
    ctx.fillStyle = paper;
    ctx.beginPath();
    ctx.ellipse(now.x, groundY + 2, rad * (1.0 + now.p.y * 1.8), rad * 0.20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    /* Onion skin: the two drawings before this one, as outlines. It is the
       tool an animator actually works with, and it makes the holds legible in
       a still frame — two ghosts on the same spot IS the hold. */
    if (onion) {
      for (var k = 2; k >= 1; k--) {
        var pf = frame - k * 2;
        if (pf >= 0) ball(pf, 0.30 / k, false);
      }
    }

    ball(frame, 1, true);
  };

  /* ---- wiring ------------------------------------------------------------ */

  function init() {
    var track = doc.getElementById('xsTrack');
    var canvas = doc.getElementById('stage');
    var rowsEl = doc.getElementById('sheetRows');
    var scrollEl = doc.getElementById('sheetScroll');
    var frameEl = doc.getElementById('stageFrame');
    if (!track || !canvas || !rowsEl || !scrollEl) return;

    /* Rows are written from the model so the paperwork cannot drift from the
       footage. Drawing numbers are recomputed whenever the rate changes. */
    var html = '';
    for (var f = 0; f < FRAMES; f++) {
      html += '<div class="sheet__row" data-f="' + f + '">' +
                '<span>' + (f + 1 < 10 ? '0' : '') + (f + 1) + '</span>' +
                '<span class="dr"></span>' +
                '<span class="act">' + MODEL[f].label + '</span>' +
              '</div>';
    }
    rowsEl.innerHTML = html;
    var rows = Array.prototype.slice.call(rowsEl.children);

    var stage = new Stage(canvas);
    var twos = true;
    var onion = true;
    var last = -1;

    function drawingFor(f) { return twos ? Math.floor(f / 2) : f; }

    function paintRates() {
      for (var f = 0; f < FRAMES; f++) {
        var d = drawingFor(f) + 1;
        rows[f].querySelector('.dr').textContent = (d < 10 ? '0' : '') + d;
        /* On twos, the first frame of each pair is where the drawing changes;
           that is the row a printed sheet rules more heavily. */
        rows[f].setAttribute('data-key', (twos ? (f % 2 === 0) : true) ? '1' : '0');
      }
    }

    function render(frame) {
      if (frame === last) return;
      last = frame;
      var shown = twos ? Math.floor(frame / 2) * 2 : frame;
      stage.draw(shown, onion);
      if (frameEl) {
        frameEl.textContent = 'FR ' + (frame + 1 < 10 ? '0' : '') + (frame + 1) +
                              ' / DR ' + (drawingFor(frame) + 1);
      }
      for (var i = 0; i < rows.length; i++) {
        rows[i].setAttribute('data-on', i === frame ? '1' : '0');
      }
      /* Advance the paper so the current row sits under the fixed head. */
      var rowH = rows[0].getBoundingClientRect().height || 24;
      var boxH = scrollEl.getBoundingClientRect().height;
      rowsEl.style.transform =
        'translateY(' + (boxH / 2 - rowH / 2 - frame * rowH).toFixed(1) + 'px)';
    }

    function progress() {
      var r = track.getBoundingClientRect();
      var span = r.height - root.innerHeight;
      if (span <= 0) return 0;
      var p = -r.top / span;
      return p < 0 ? 0 : p > 1 ? 1 : p;
    }

    var queued = false;
    function onScroll() {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () {
        queued = false;
        render(Math.min(FRAMES - 1, Math.floor(progress() * FRAMES)));
      });
    }

    doc.getElementById('rateOnes').addEventListener('click', function () {
      twos = false; setRates(this);
    });
    doc.getElementById('rateTwos').addEventListener('click', function () {
      twos = true; setRates(this);
    });
    function setRates(btn) {
      doc.getElementById('rateOnes').setAttribute('aria-pressed', String(!twos));
      doc.getElementById('rateTwos').setAttribute('aria-pressed', String(twos));
      paintRates();
      last = -1;
      onScroll();
    }

    var onionBtn = doc.getElementById('rateOnion');
    onionBtn.addEventListener('click', function () {
      onion = !onion;
      onionBtn.setAttribute('aria-pressed', String(onion));
      last = -1;
      onScroll();
    });

    paintRates();
    root.addEventListener('scroll', onScroll, { passive: true });
    root.addEventListener('resize', function () { last = -1; onScroll(); });
    render(0);
    onScroll();
  }

  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init);
  else init();

})(window, document);
