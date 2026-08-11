/* VELA — the all-sky map.

   An azimuthal equidistant projection, the same one a paper planisphere uses:
   the zenith at the centre, the horizon as the rim, and distance from centre
   proportional to angle down from overhead. North is up and east is on the
   left, because the chart is meant to be held up against the sky rather than
   laid on a table.

   Everything drawn is computed from the catalogue and the clock. The Milky Way
   is the real galactic plane transformed into equatorial coordinates, not a
   painted smudge. */
(function (root, doc) {
  'use strict';

  var Sky = root.Sky;

  /* The bright stars whose colour is obvious to the eye. Everything else is
     drawn white — inventing a spectral type for 200 stars would be decoration
     pretending to be data. */
  var WARM = ['betelgeuse', 'antares', 'aldebaran', 'arcturus', 'gacrux', 'mirach',
    'rasalgethi', 'alphard', 'menkent', 'suhail', 'eltanin', 'kochab', 'dubhe',
    'pollux', 'hamal', 'diphda', 'enif', 'scheat', 'mira', 'zaurak', 'avior',
    'atria', 'tiaki', 'algieba', 'edasich', 'unukalhai', 'tejat', 'rasalas',
    'menkar', 'almach', 'aludra', 'wezen'];
  var COOL = ['rigel', 'spica', 'achernar', 'hadar', 'acrux', 'mimosa', 'alnilam',
    'alnitak', 'mintaka', 'bellatrix', 'regulus', 'adhara', 'shaula', 'alkaid',
    'algol', 'elnath', 'peacock', 'alnair', 'nunki', 'dschubba', 'acrab',
    'mirzam', 'saiph', 'lesath', 'girtab', 'delvel', 'regor', 'imai', 'zetper'];

  function build(canvas, opts) {
    if (!canvas || !Sky || !root.VELA_STARS) return null;

    var cat = root.VELA_STARS;
    var site = opts.site;
    var ctx = canvas.getContext('2d');
    var state = {
      offsetMinutes: 0,
      showFigures: true,
      showLabels: true,
      limit: 5.0,
      hover: null
    };

    /* index the catalogue once */
    var byId = {};
    cat.stars.forEach(function (r) {
      byId[r[0]] = { id: r[0], name: r[1], ra: r[2], dec: r[3], mag: r[4], bayer: r[5] };
    });
    var warm = {}, cool = {};
    WARM.forEach(function (k) { warm[k] = 1; });
    COOL.forEach(function (k) { cool[k] = 1; });

    /* The galactic plane, sampled once in equatorial coordinates. */
    var milky = [];
    for (var l = 0; l < 360; l += 2) {
      for (var b = -14; b <= 14; b += 2.5) {
        var p = Sky.galacticToEquatorial(l, b);
        milky.push({ ra: p.ra, dec: p.dec, w: Math.exp(-(b * b) / 90) });
      }
    }

    var W = 0, H = 0, R = 0, cx = 0, cy = 0, dpr = 1;
    var plotted = [];   /* what is currently on screen, for hit testing */

    function theme() {
      var cs = getComputedStyle(doc.documentElement);
      var get = function (n, fb) { return (cs.getPropertyValue(n) || fb).trim(); };
      return {
        ground: get('--night', '#0b0d11'),
        rule: get('--night-rule', '#262b34'),
        star: get('--star', '#ffffff'),
        warm: get('--star-warm', '#ffd9a8'),
        cool: get('--star-cool', '#b9d4ff'),
        text: get('--on-night', '#eae6dd'),
        mut: get('--on-night-mut', '#9aa1ad'),
        plot: get('--plot', '#d9483a')
      };
    }

    function resize() {
      var box = canvas.getBoundingClientRect();
      if (!box.width) return false;
      dpr = Math.min(root.devicePixelRatio || 1, 2);
      W = Math.round(box.width);
      H = Math.round(box.height || box.width);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      R = Math.min(W, H) / 2 - Math.max(14, Math.min(W, H) * 0.045);
      cx = W / 2;
      cy = H / 2;
      return true;
    }

    /* Horizon coordinates to canvas pixels. North up, east left. */
    function project(alt, az) {
      var r = (90 - alt) / 90 * R;
      return {
        x: cx - r * Math.sin(az * Math.PI / 180),
        y: cy - r * Math.cos(az * Math.PI / 180)
      };
    }

    function when() {
      return new Date(Date.now() + state.offsetMinutes * 60000);
    }

    function draw() {
      if (!W && !resize()) return;
      var t = theme();
      var now = when();
      var lst = Sky.lst(now, site.longitude);
      var lat = site.latitude;
      plotted = [];

      ctx.clearRect(0, 0, W, H);

      /* sky disc */
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = t.ground;
      ctx.fill();
      ctx.clip();

      /* Milky Way */
      milky.forEach(function (m) {
        var h = Sky.toHorizon(m.ra, m.dec, lat, lst);
        if (h.altitude <= 0) return;
        var p = project(h.altitude, h.azimuth);
        ctx.globalAlpha = 0.10 * m.w;
        ctx.fillStyle = t.star;
        ctx.beginPath();
        ctx.arc(p.x, p.y, R * 0.028, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      /* altitude rings at 30 and 60 degrees */
      ctx.strokeStyle = t.rule;
      ctx.lineWidth = 1;
      [30, 60].forEach(function (alt) {
        ctx.beginPath();
        ctx.arc(cx, cy, (90 - alt) / 90 * R, 0, Math.PI * 2);
        ctx.stroke();
      });

      /* constellation figures */
      if (state.showFigures) {
        ctx.strokeStyle = t.rule;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.9;
        Object.keys(cat.figures).forEach(function (name) {
          cat.figures[name].forEach(function (seg) {
            var a = byId[seg[0]], b2 = byId[seg[1]];
            if (!a || !b2) return;
            var ha = Sky.toHorizon(a.ra, a.dec, lat, lst);
            var hb = Sky.toHorizon(b2.ra, b2.dec, lat, lst);
            /* Both ends must be up, otherwise the segment would cut a chord
               straight across the disc through the ground. */
            if (ha.altitude <= 1 || hb.altitude <= 1) return;
            var pa = project(ha.altitude, ha.azimuth);
            var pb = project(hb.altitude, hb.azimuth);
            ctx.beginPath();
            ctx.moveTo(pa.x, pa.y);
            ctx.lineTo(pb.x, pb.y);
            ctx.stroke();
          });
        });
        ctx.globalAlpha = 1;
      }

      /* stars */
      cat.stars.forEach(function (row) {
        var s = byId[row[0]];
        if (s.mag > state.limit) return;
        var h = Sky.toHorizon(s.ra, s.dec, lat, lst);
        if (h.altitude <= 0) return;
        var p = project(h.altitude, h.azimuth);
        var rad = Math.max(R * 0.0035, (5.6 - s.mag) * R * 0.0042);
        ctx.fillStyle = warm[s.id] ? t.warm : (cool[s.id] ? t.cool : t.star);
        ctx.globalAlpha = Math.min(1, 0.45 + (5.6 - s.mag) * 0.18);
        ctx.beginPath();
        ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        plotted.push({
          x: p.x, y: p.y, r: Math.max(rad, 7), kind: 'star',
          name: s.name || s.bayer, sub: s.bayer,
          mag: s.mag, alt: h.altitude, az: h.azimuth, ra: s.ra, dec: s.dec
        });
        /* Label only the named stars that are bright and well clear of the
           horizon, or the map turns into a wall of type. */
        if (state.showLabels && s.name && s.mag < 1.9 && h.altitude > 12) {
          ctx.fillStyle = t.mut;
          ctx.font = '500 ' + Math.max(9, R * 0.032) + 'px ui-monospace, monospace';
          ctx.textAlign = 'left';
          ctx.fillText(s.name, p.x + rad + 4, p.y + 3);
        }
      });

      /* planets, then the Moon on top */
      var d = Sky.dayNumber(now);
      Sky.planets(now).forEach(function (pl) {
        if (pl.magnitude > 5.6) return;
        var h = Sky.toHorizon(pl.ra, pl.dec, lat, lst);
        if (h.altitude <= 0) return;
        var p = project(h.altitude, h.azimuth);
        var rad = Math.max(R * 0.006, (5.6 - pl.magnitude) * R * 0.0038);
        ctx.beginPath();
        ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
        ctx.fillStyle = t.plot;
        ctx.fill();
        ctx.strokeStyle = t.plot;
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, rad + 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
        plotted.push({
          x: p.x, y: p.y, r: Math.max(rad, 9), kind: 'planet',
          name: pl.name, sub: 'planet', mag: pl.magnitude,
          alt: h.altitude, az: h.azimuth, ra: pl.ra, dec: pl.dec
        });
        if (state.showLabels && h.altitude > 8) {
          ctx.fillStyle = t.plot;
          ctx.font = '500 ' + Math.max(9, R * 0.032) + 'px ui-monospace, monospace';
          ctx.textAlign = 'left';
          ctx.fillText(pl.name, p.x + rad + 5, p.y + 3);
        }
      });

      var mn = Sky.moon(d);
      var mh = Sky.toHorizon(mn.ra, mn.dec, lat, lst);
      if (mh.altitude > 0) {
        var mp = project(mh.altitude, mh.azimuth);
        var mr = Math.max(6, R * 0.022);
        /* Draw the lit fraction rather than a plain disc: a 4% crescent and a
           full moon mean very different things for an observing night. */
        ctx.save();
        ctx.translate(mp.x, mp.y);
        ctx.fillStyle = t.rule;
        ctx.beginPath();
        ctx.arc(0, 0, mr, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = t.warm;
        ctx.beginPath();
        ctx.arc(0, 0, mr, -Math.PI / 2, Math.PI / 2, !mn.waxing);
        var k = (1 - 2 * mn.illuminated) * mr;
        ctx.ellipse(0, 0, Math.abs(k), mr, 0, Math.PI / 2, -Math.PI / 2,
          mn.illuminated > 0.5 ? !mn.waxing : !!mn.waxing);
        ctx.fill();
        ctx.restore();
        plotted.push({
          x: mp.x, y: mp.y, r: mr + 5, kind: 'moon', name: 'Moon',
          sub: Sky.moonPhaseName(mn.phase) + ', ' + Math.round(mn.illuminated * 100) + '% lit',
          mag: null, alt: mh.altitude, az: mh.azimuth, ra: mn.ra, dec: mn.dec
        });
      }

      ctx.restore();

      /* rim and cardinal points */
      ctx.strokeStyle = t.mut;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = t.mut;
      ctx.font = '500 ' + Math.max(10, R * 0.045) + 'px ui-monospace, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      [['N', 0], ['E', 90], ['S', 180], ['W', 270]].forEach(function (c) {
        var a = c[1] * Math.PI / 180;
        var rr = R + Math.max(10, R * 0.055);
        ctx.fillText(c[0], cx - rr * Math.sin(a), cy - rr * Math.cos(a));
      });

      /* hover marker */
      if (state.hover) {
        ctx.strokeStyle = t.plot;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(state.hover.x, state.hover.y, Math.max(10, state.hover.r + 5), 0, Math.PI * 2);
        ctx.stroke();
      }

      if (opts.onDraw) opts.onDraw(now, state);
    }

    /* ---- interaction ----------------------------------------------------- */

    var tip = opts.tip || null;

    function hitTest(px, py) {
      var best = null, bestD = Infinity;
      for (var i = 0; i < plotted.length; i++) {
        var o = plotted[i];
        var dx = o.x - px, dy = o.y - py;
        var d2 = dx * dx + dy * dy;
        if (d2 < o.r * o.r && d2 < bestD) { bestD = d2; best = o; }
      }
      return best;
    }

    function showTip(o) {
      if (!tip) return;
      if (!o) { tip.hidden = true; return; }
      var lines = ['<b>' + o.name + '</b>'];
      if (o.sub && o.sub !== o.name) lines.push(o.sub);
      lines.push('alt ' + o.alt.toFixed(1) + '&deg; &middot; ' + Sky.compass(o.az) +
        ' ' + o.az.toFixed(0) + '&deg;');
      lines.push(Sky.raToHms(o.ra) + ' ' + Sky.decToDms(o.dec));
      if (o.mag !== null && o.mag !== undefined) lines.push('mag ' + o.mag.toFixed(2));
      tip.innerHTML = lines.join('<br>');
      tip.hidden = false;
      tip.style.left = o.x + 'px';
      tip.style.top = o.y + 'px';
    }

    function pointerAt(e) {
      var box = canvas.getBoundingClientRect();
      var pt = e.touches ? e.touches[0] : e;
      return { x: pt.clientX - box.left, y: pt.clientY - box.top };
    }

    canvas.addEventListener('pointermove', function (e) {
      var p = pointerAt(e);
      var o = hitTest(p.x, p.y);
      if (o !== state.hover) {
        state.hover = o;
        showTip(o);
        draw();
      }
      canvas.style.cursor = o ? 'crosshair' : 'default';
    });
    canvas.addEventListener('pointerleave', function () {
      state.hover = null;
      showTip(null);
      draw();
    });

    /* Keyboard route to the same information, so the map is not mouse-only. */
    var focusIndex = -1;
    canvas.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'Enter') return;
      e.preventDefault();
      var named = plotted.filter(function (o) { return o.kind !== 'star' || o.mag < 2.2; });
      if (!named.length) return;
      if (e.key === 'ArrowRight') focusIndex = (focusIndex + 1) % named.length;
      else if (e.key === 'ArrowLeft') focusIndex = (focusIndex - 1 + named.length) % named.length;
      state.hover = named[Math.max(0, focusIndex)];
      showTip(state.hover);
      draw();
      if (opts.onFocus) opts.onFocus(state.hover);
    });

    var rt;
    root.addEventListener('resize', function () {
      root.clearTimeout(rt);
      rt = root.setTimeout(function () { resize(); draw(); }, 150);
    });
    root.addEventListener('vela:vision', draw);

    /* The sky turns fifteen degrees an hour; once a minute is generous. */
    root.setInterval(function () { if (state.offsetMinutes === 0) draw(); }, 60000);

    resize();
    draw();

    return {
      draw: draw,
      state: state,
      set: function (k, v) { state[k] = v; draw(); },
      /* Everything above the horizon right now, brightest first — used by the
         page to write the "what is up" list without duplicating the maths. */
      visible: function (limit) {
        var now = when();
        var lstNow = Sky.lst(now, site.longitude);
        var out = [];
        cat.stars.forEach(function (row) {
          if (row[4] > (limit || 2.0) || !row[1]) return;
          var h = Sky.toHorizon(row[2], row[3], site.latitude, lstNow);
          if (h.altitude <= 10) return;
          out.push({ name: row[1], bayer: row[5], mag: row[4],
            alt: h.altitude, az: h.azimuth, kind: 'star' });
        });
        Sky.planets(now).forEach(function (pl) {
          if (pl.magnitude > 5.6) return;
          var h = Sky.toHorizon(pl.ra, pl.dec, site.latitude, lstNow);
          if (h.altitude <= 5) return;
          out.push({ name: pl.name, bayer: 'planet', mag: pl.magnitude,
            alt: h.altitude, az: h.azimuth, kind: 'planet' });
        });
        return out.sort(function (a, b) { return a.mag - b.mag; });
      }
    };
  }

  root.SkyMap = { build: build };
})(window, document);
