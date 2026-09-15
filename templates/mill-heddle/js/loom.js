/* HEDDLE — the loom beside the home page.

   THE ONE IDEA

   The page is the cloth. Scroll down and the loom weaves: every pixel the
   page moves is a pixel of cloth wound onto the beam, ten pixels to a pick
   on a wide screen, four on a phone. Scroll up and it unweaves, because the
   pick is where you left it. There is no timer and no easing — the mapping
   is direct, so it is still honest when motion is off.

   The loom reads whichever draft the page is currently talking about: each
   section names a cloth, and hovering a card names one too. Switching a
   draft re-threads the notation but leaves every pick already woven exactly
   as it was, so by the foot of the page the beam holds a sampler — a length
   of everything the visitor looked at, in the order they looked. The
   enquiry form sends that sampler with the message. A real loom cannot
   re-thread itself in half a second; this one can, and the copy says so.

   HOW IT DRAWS

   Picks live in a ring buffer one drawdown tall, one pick per row. A frame
   paints only the picks that are new (usually one) and then blits the ring
   onto the visible canvas in at most two pieces. Ten thousand picks of
   scrolling cost the same as ten. The notation — threading, tie-up,
   treadling, the two colour strips — is drawn fresh each frame; it is a few
   hundred small rectangles.

   Two modes, one buffer. On a wide screen the loom is a column: threading
   across the top, tie-up top right, treadling down the right, the cloth
   falling away from the fell. On a phone it is a band across the top of the
   page with the fell at the right-hand edge, and the notation is left off,
   because a phone is a poor place to read a threading. The band is the same
   ring drawn through a rotated transform. */
(function (root, doc) {
  'use strict';

  var W = root.WEAVE;
  if (!W) return;

  var RESERVE = 8;   /* rows kept for the threading, columns for the tie-up: the
                        fell line must not move when a four-shaft cloth follows
                        an eight-shaft one */
  var INK = '#1E1B17', RULE = 'rgba(30,27,23,.16)', RULE2 = 'rgba(30,27,23,.32)', RULE_IDLE = 'rgba(30,27,23,.06)', FELL = '#B23A2B';

  function createLoom(canvas, mode, hooks) {
    var ctx = canvas.getContext('2d');
    var animates = doc.documentElement.classList.contains('js-anim');
    var cellCss = mode === 'band' ? 4 : 10;

    var box = null, s = 8, r = 1;
    var geom = null;           /* layout in device pixels */
    var ring = doc.createElement('canvas'), rctx = ring.getContext('2d');
    var R = 0;                 /* rows in the ring */
    var slotPick = null, slotDraft = null;
    var pickDraft = new Uint8Array(4096);
    var assignedUpTo = -1;
    var active = 0, prev = 0, tSwitch = -1e9;
    var drafts = [], maskList = [];
    var L0 = 0;
    var lastN = -1, raf = 0, alive = true;

    for (var i = 0; i < W.CLOTHS.length; i++) {
      drafts.push(W.fromCloth(W.CLOTHS[i]));
      maskList.push(W.masks(drafts[i]));
    }

    function layout() {
      box = W.sizeTo(canvas);
      if (!box) return false;
      r = box.r;
      s = Math.max(2, Math.round(cellCss * r));
      var g = {};
      if (mode === 'band') {
        g.ends = Math.ceil(box.h / s);
        g.rows = Math.ceil(box.w / s) + 2;
        g.fell = 0;
        /* in cloth space: ends across, the band's width along the cloth */
        g.clip = [0, 0, g.ends * s, box.w];
        L0 = box.w;
      } else {
        g.strip = Math.round(5 * r);
        g.gap = Math.round(7 * r);
        var col = RESERVE * s;                       /* tie-up and treadling width */
        g.ends = Math.floor((box.w - g.gap - col - g.gap - g.strip) / s);
        if (g.ends < 8) g.ends = 8;
        g.xT = g.ends * s + g.gap;                   /* tie-up / treadling x */
        g.xW = g.xT + col + g.gap;                   /* weft colour strip x */
        g.yTop = g.strip + g.gap;                    /* threading rows */
        g.fell = g.yTop + RESERVE * s + g.gap;       /* the cloth starts here */
        g.rows = Math.ceil((box.h - g.fell) / s) + 2;
        g.clip = [0, g.fell, g.ends * s, box.h - g.fell];
        L0 = box.h - g.fell;
      }
      geom = g;
      R = g.rows + 2;
      ring.width = g.ends * s;
      ring.height = R * s;
      slotPick = new Int32Array(R);
      slotDraft = new Uint8Array(R);
      for (var k = 0; k < R; k++) slotPick[k] = -1;
      return true;
    }

    function ensure(n) {
      if (n < pickDraft.length) return;
      var bigger = new Uint8Array(Math.max(n + 1024, pickDraft.length * 2));
      bigger.set(pickDraft);
      pickDraft = bigger;
    }

    function slot(p) { return (R - (p % R)) % R; }

    function paintSlot(p) {
      var sl = slot(p), d = pickDraft[p];
      if (slotPick[sl] === p && slotDraft[sl] === d) return;
      W.paintRow(rctx, drafts[d], maskList[d], p, 0, sl * s, s, geom.ends);
      W.fibre(rctx, 0, sl * s, geom.ends * s, s, 0.12);
      slotPick[sl] = p;
      slotDraft[sl] = d;
    }

    /* threading and tie-up, with the re-threading wave when a draft changes */
    function notation(now) {
      var g = geom, ends = g.ends;
      var dN = drafts[active], dO = drafts[prev];
      var t = now - tSwitch;
      var inset = Math.max(1, Math.round(s * 0.16));
      var i, k, f;
      ctx.lineWidth = 1;

      /* threading grid: S rows, bottom-aligned in the reserve. The loom has
         eight shafts; the ones a four-shaft cloth leaves idle are ruled
         faintly, so the fell stays put and the idle shafts read as idle. */
      var S = dN.shafts, T = dN.tieup.length;
      var yRows = g.yTop + (RESERVE - S) * s;
      W.grid(ctx, 0, g.yTop, ends, RESERVE, s, RULE_IDLE);
      W.grid(ctx, g.xT, g.yTop, RESERVE, RESERVE, s, RULE_IDLE);
      W.grid(ctx, 0, yRows, ends, S, s, RULE);
      W.grid(ctx, g.xT, yRows, T, S, s, RULE2);
      W.grid(ctx, g.xT, g.fell, T, g.rows, s, RULE);

      /* warp colour strip, just above the shafts in use */
      var yStrip = yRows - g.gap - g.strip;
      for (i = 0; i < ends; i++) {
        f = animates ? clamp((t - i * 5) / 220) : 1;
        if (f < 1) { ctx.fillStyle = W.warpHex(dO, i); ctx.fillRect(i * s, yStrip, s, g.strip); }
        if (f > 0) { ctx.globalAlpha = f; ctx.fillStyle = W.warpHex(dN, i); ctx.fillRect(i * s, yStrip, s, g.strip); ctx.globalAlpha = 1; }
      }

      for (i = 0; i < ends; i++) {
        f = animates ? clamp((t - i * 5) / 220) : 1;
        var shN = W.shaftAt(dN, i), shO = W.shaftAt(dO, i);
        if (f < 1 && shO < dO.shafts) {
          ctx.globalAlpha = 1 - f;
          ctx.fillStyle = INK;
          ctx.fillRect(i * s + inset, g.yTop + (RESERVE - 1 - shO) * s + inset, s - 2 * inset, s - 2 * inset);
        }
        if (f > 0) {
          ctx.globalAlpha = f;
          ctx.fillStyle = INK;
          ctx.fillRect(i * s + inset, g.yTop + (RESERVE - 1 - shN) * s + inset, s - 2 * inset, s - 2 * inset);
        }
        ctx.globalAlpha = 1;
      }

      /* tie-up */
      f = animates ? clamp((t - 120) / 240) : 1;
      var mN = maskList[active], mO = maskList[prev];
      for (var tr = 0; tr < RESERVE; tr++) for (k = 0; k < RESERVE; k++) {
        var on = tr < T && W.raised(mN[tr], k), was = tr < mO.length && W.raised(mO[tr], k);
        if (!on && !was) continue;
        var a = on && was ? 1 : (on ? f : 1 - f);
        if (a <= 0) continue;
        ctx.globalAlpha = a;
        ctx.fillStyle = INK;
        ctx.fillRect(g.xT + tr * s + inset, g.yTop + (RESERVE - 1 - k) * s + inset, s - 2 * inset, s - 2 * inset);
      }
      ctx.globalAlpha = 1;
    }

    function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

    function frame() {
      raf = 0;
      if (!alive || !geom) return;
      var now = root.performance ? root.performance.now() : Date.now();
      var sy = root.pageYOffset || doc.documentElement.scrollTop || 0;
      if (sy < 0) sy = 0;
      var L = L0 + sy * r;
      var n = Math.floor(L / s);
      var frac = L - n * s;
      ensure(n + 2);
      if (assignedUpTo > n) assignedUpTo = n;
      while (assignedUpTo < n) { assignedUpTo++; pickDraft[assignedUpTo] = active; }

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, box.w, box.h);

      var g = geom;
      var count = Math.min(n + 1, g.rows);     /* picks on screen, newest first */
      var top = g.fell + frac - s;             /* the pick being beaten in */
      var p;

      /* make sure every visible pick is in the ring */
      for (p = n; p > n - count; p--) paintSlot(p);

      ctx.save();
      if (mode === 'band') ctx.setTransform(0, 1, -1, 0, box.w, 0);
      ctx.beginPath();
      ctx.rect(g.clip[0], g.clip[1], g.clip[2], g.clip[3]);
      ctx.clip();
      var s0 = slot(n);
      var first = Math.min(count, R - s0);
      ctx.drawImage(ring, 0, s0 * s, ring.width, first * s, 0, top, ring.width, first * s);
      if (count > first) {
        ctx.drawImage(ring, 0, 0, ring.width, (count - first) * s, 0, top + first * s, ring.width, (count - first) * s);
      }
      ctx.restore();

      if (mode !== 'band') {
        notation(now);
        /* treadling marks and the weft strip, one row per visible pick */
        var inset = Math.max(1, Math.round(s * 0.16));
        for (p = n; p > n - count; p--) {
          var d = drafts[pickDraft[p]];
          var y = top + (n - p) * s;
          if (y + s < g.fell) continue;
          var entry = d.treadling[p % d.treadling.length];
          ctx.fillStyle = INK;
          for (var k = 0; k < entry.length; k++) {
            ctx.fillRect(g.xT + entry[k] * s + inset, Math.max(y, g.fell) + inset, s - 2 * inset, s - 2 * inset - Math.max(0, g.fell - y));
          }
          ctx.fillStyle = W.weftHex(d, p);
          var yy = Math.max(y, g.fell);
          ctx.fillRect(g.xW, yy, g.strip, s - (yy - y));
        }
        /* the fell */
        ctx.fillStyle = FELL;
        ctx.fillRect(0, g.fell - Math.round(r), g.ends * s, Math.max(1, Math.round(1.5 * r)));
      } else {
        ctx.fillStyle = FELL;
        ctx.fillRect(box.w - Math.max(1, Math.round(1.5 * r)), 0, Math.max(1, Math.round(1.5 * r)), box.h);
      }

      if (n !== lastN) {
        lastN = n;
        if (hooks && hooks.onPick) hooks.onPick(n);
      }
      if (animates && now - tSwitch < 220 + g.ends * 5 + 60) schedule();
    }

    function schedule() {
      if (!raf && alive) raf = root.requestAnimationFrame(frame);
    }

    function setDraft(idx) {
      if (idx === active || idx < 0 || idx >= drafts.length) return;
      prev = active;
      active = idx;
      tSwitch = root.performance ? root.performance.now() : Date.now();
      if (hooks && hooks.onDraft) hooks.onDraft(idx);
      schedule();
    }

    function sampler() {
      var out = [];
      var n = Math.min(assignedUpTo, pickDraft.length - 1);
      for (var p = 0; p <= n; p++) {
        var d = pickDraft[p];
        if (out.length && out[out.length - 1].idx === d) out[out.length - 1].picks++;
        else out.push({ idx: d, id: W.CLOTHS[d].id, name: W.CLOTHS[d].name, picks: 1 });
      }
      return out;
    }

    function resize() {
      if (!alive) return;
      if (layout()) { lastN = -1; schedule(); }
    }

    function destroy() {
      alive = false;
      if (raf) root.cancelAnimationFrame(raf);
      root.removeEventListener('scroll', schedule);
      root.removeEventListener('resize', resize);
    }

    root.addEventListener('scroll', schedule, { passive: true });
    root.addEventListener('resize', resize);
    if (root.ResizeObserver) {
      var ro = new root.ResizeObserver(function () { resize(); });
      ro.observe(canvas);
    }
    resize();

    return {
      setDraft: setDraft, sampler: sampler, resize: resize, destroy: destroy, schedule: schedule,
      active: function () { return active; },
      picks: function () { return lastN < 0 ? 0 : lastN; },
      ends: function () { return geom ? geom.ends : 0; },
      cell: function () { return cellCss; },
      mode: mode
    };
  }

  root.HEDDLE_LOOM = { create: createLoom };
})(window, document);
