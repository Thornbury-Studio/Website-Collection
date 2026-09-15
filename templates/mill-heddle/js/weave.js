/* HEDDLE — the weave engine. One file shared by every page.

   A draft is four things and nothing else:

     threading   which shaft each warp end is threaded on
     tie-up      which shafts each treadle lifts
     treadling   the order the treadles are pressed, one entry per pick
     colour      the order of yarn shades across the warp and down the weft

   The cloth follows from those by one rule: at end i, pick j, the warp is on
   top if the shaft carrying end i is among the shafts lifted by the treadle
   pressed at pick j. That rule is `raised()` below, and every cloth on the
   site — the loom beside the home page, the cards, the range at length, the
   drafting room — is painted by it. Nothing here is a photograph. */
(function (root, doc) {
  'use strict';

  /* --- the shade card ---------------------------------------------------
     The yarn the mill actually stocks. Names are dye plants or the ground the
     wool came off; hexes are the shades as they read in daylight. */
  var SHADES = [
    { id: 'ecru',    name: 'Ecru',    hex: '#E7E0CF' },
    { id: 'oat',     name: 'Oat',     hex: '#CDBE9B' },
    { id: 'walnut',  name: 'Walnut',  hex: '#4E3B29' },
    { id: 'peat',    name: 'Peat',    hex: '#2B2622' },
    { id: 'madder',  name: 'Madder',  hex: '#B23A2B' },
    { id: 'weld',    name: 'Weld',    hex: '#D3AE3C' },
    { id: 'woad',    name: 'Woad',    hex: '#2F4571' },
    { id: 'moss',    name: 'Moss',    hex: '#5E6C3B' },
    { id: 'heather', name: 'Heather', hex: '#7C5B74' },
    { id: 'slate',   name: 'Slate',   hex: '#7D8185' }
  ];
  var HEX = {};
  for (var si = 0; si < SHADES.length; si++) HEX[SHADES[si].id] = SHADES[si].hex;

  function runs(list) {
    /* ['peat*4','ecru*4'] -> ['peat','peat','peat','peat','ecru',...] */
    var out = [];
    for (var i = 0; i < list.length; i++) {
      var parts = String(list[i]).split('*');
      var n = parts.length > 1 ? parseInt(parts[1], 10) : 1;
      if (!(n > 0)) n = 1;
      if (n > 400) n = 400;
      for (var k = 0; k < n; k++) out.push(parts[0]);
    }
    return out;
  }

  /* 2/2 twill tie-up on four or eight shafts. On eight, each treadle lifts
     two pairs four shafts apart, which is the same 2/2 cloth with an eight
     end diagonal. */
  function twill22(n) {
    var t = [];
    for (var i = 0; i < n; i++) {
      t.push(n === 4 ? [i, (i + 1) % 4] : [i, (i + 1) % 8, (i + 4) % 8, (i + 5) % 8]);
    }
    return t;
  }
  var TABBY = [[0, 2], [1, 3]];
  var POINT8 = [0, 1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2, 1];
  var CABIN = ['woad', 'ecru', 'woad', 'ecru', 'woad', 'ecru', 'woad', 'ecru', 'ecru', 'woad', 'ecru', 'woad', 'ecru', 'woad', 'ecru', 'woad'];
  var GLEN = ['madder*2', 'slate*4', 'ecru*4', 'slate*4', 'ecru*4', 'slate*2', 'ecru*2', 'slate*2', 'ecru*2', 'slate*2', 'ecru*2', 'slate*2', 'ecru*2'];

  /* --- the range ---------------------------------------------------------
     Threading, treadling and colour are given as repeats; the renderers tile
     them across however many ends and picks they have room for. */
  var CLOTHS = [
    {
      id: 'kirkbrae', name: 'Kirkbrae Twill', structure: '2/2 twill',
      shafts: 4, threading: [0, 1, 2, 3], tieup: twill22(4), treadling: [0, 1, 2, 3],
      warp: ['walnut'], weft: ['oat'],
      weight: 410, sett: 22, picks: 20, price: 68, lead: '3 to 4 weeks',
      use: 'Jacketing, trousers, a coat if you are patient',
      finish: 'Milled and raised',
      note: 'The mill’s working cloth. Walnut warp, oat weft: the diagonal reads at arm’s length and goes at three metres, which is the right distance for a jacket to be plain.'
    },
    {
      id: 'ettrick', name: 'Ettrick Herringbone', structure: 'Broken 2/2 twill, 16-end repeat',
      shafts: 4, threading: [0, 1, 2, 3, 0, 1, 2, 3, 1, 0, 3, 2, 1, 0, 3, 2], tieup: twill22(4), treadling: [0, 1, 2, 3],
      warp: ['peat'], weft: ['ecru'],
      weight: 460, sett: 22, picks: 20, price: 74, lead: '3 to 4 weeks',
      use: 'Overcoats, jackets, a bag that will outlast the jacket',
      finish: 'Milled and clear cut',
      note: 'Eight ends up, eight ends down, and a break where they meet so the chevrons do not come to a point. Peat on ecru. The back of the cloth is the same cloth the other way round.'
    },
    {
      id: 'hound', name: 'Hound', structure: '2/2 twill, four and four colour-and-weave',
      shafts: 4, threading: [0, 1, 2, 3], tieup: twill22(4), treadling: [0, 1, 2, 3],
      warp: runs(['peat*4', 'ecru*4']), weft: runs(['peat*4', 'ecru*4']),
      weight: 400, sett: 22, picks: 20, price: 72, lead: '3 to 4 weeks',
      use: 'Jacketing, skirts, one good chair',
      finish: 'Milled and raised',
      note: 'The tooth is not printed and not embroidered. It is what a 2/2 twill does when you give it four dark ends, four light ends, and the same again in the weft. Change either count and it stops being a hound.'
    },
    {
      id: 'shepherd', name: 'Shepherd Check', structure: '2/2 twill, six and six colour-and-weave',
      shafts: 4, threading: [0, 1, 2, 3], tieup: twill22(4), treadling: [0, 1, 2, 3],
      warp: runs(['woad*6', 'ecru*6']), weft: runs(['woad*6', 'ecru*6']),
      weight: 420, sett: 22, picks: 20, price: 72, lead: '3 to 4 weeks',
      use: 'Throws, jackets, the lining of a better coat',
      finish: 'Milled and raised',
      note: 'The same structure as Hound with two more threads in every block, which is enough to turn teeth into a check. Woad and ecru, because that is what the hills wore before anyone thought to sell it.'
    },
    {
      id: 'glen', name: 'Glen', structure: '2/2 twill, four-and-four with two-and-two, madder overcheck',
      shafts: 4, threading: [0, 1, 2, 3], tieup: twill22(4), treadling: [0, 1, 2, 3],
      warp: runs(GLEN), weft: runs(GLEN),
      weight: 400, sett: 24, picks: 22, price: 78, lead: '4 to 5 weeks',
      use: 'Suiting, a waistcoat, trousers that get remarked on',
      finish: 'Clear cut',
      note: 'Two blocks of four-and-four, four blocks of two-and-two, then a pair of madder ends to close the repeat. Thirty-four ends across and thirty-four picks down, and it never looks the same twice.'
    },
    {
      id: 'logcabin', name: 'Log Cabin', structure: 'Plain weave, colour-and-weave',
      shafts: 4, threading: [0, 1, 2, 3], tieup: TABBY, treadling: [0, 1],
      warp: CABIN.slice(), weft: CABIN.slice(),
      weight: 300, sett: 18, picks: 17, price: 58, lead: '3 weeks',
      use: 'Curtains, scarves, a shirt-weight cloth for people who iron',
      finish: 'Scoured and pressed',
      note: 'Plain weave, dark and light alternating, with the order swapped every eight ends and every eight picks. Nothing in the structure changes. The blocks are a colour trick, and it is the oldest trick there is.'
    },
    {
      id: 'rosepath', name: 'Rosepath', structure: 'Rosepath, treadled as drawn in',
      shafts: 4, threading: [0, 1, 2, 3, 0, 3, 2, 1], tieup: twill22(4), treadling: [0, 1, 2, 3, 0, 3, 2, 1],
      warp: ['ecru'], weft: ['madder'],
      weight: 520, sett: 18, picks: 16, price: 64, lead: '3 to 4 weeks',
      use: 'Blankets, a bedcover, the back of a sofa',
      finish: 'Milled and raised, fringed on request',
      note: 'An eight-end threading that turns back on itself. Treadled in the order it is threaded — the mill says as drawn in — it gives the small rose that Scandinavian looms have been giving for three hundred years.'
    },
    {
      id: 'yarrow', name: 'Yarrow Diamond', structure: '8-shaft point twill',
      shafts: 8, threading: POINT8.slice(), tieup: twill22(8), treadling: POINT8.slice(),
      warp: ['moss'], weft: ['oat'],
      weight: 480, sett: 20, picks: 18, price: 70, lead: '4 weeks',
      use: 'Blankets, upholstery, a coat with a lining that means it',
      finish: 'Milled and raised',
      note: 'Fourteen ends to the point on eight shafts, treadled to the same point. Every pick lifts four and drops four; the diamonds are a 2/2 twill folded into itself.'
    }
  ];
  var BY_ID = {};
  for (var ci = 0; ci < CLOTHS.length; ci++) BY_ID[CLOTHS[ci].id] = CLOTHS[ci];

  /* --- drafts ------------------------------------------------------------
     A working draft is a plain object; `fromCloth` copies one out of the
     range so the drafting room can edit it without touching the catalogue. */
  function asList(v) {
    if (v === undefined || v === null) return [];
    return typeof v === 'number' ? [v] : v.slice();
  }

  function fromCloth(c) {
    var d = {
      shafts: c.shafts,
      treadles: c.tieup.length,
      threading: c.threading.slice(),
      tieup: [],
      treadling: [],
      warp: c.warp.slice(),
      weft: c.weft.slice()
    };
    for (var t = 0; t < c.tieup.length; t++) d.tieup.push(c.tieup[t].slice());
    for (var p = 0; p < c.treadling.length; p++) d.treadling.push(asList(c.treadling[p]));
    return d;
  }

  /* Bitmask per treadle of the shafts it lifts. Recomputed by the callers
     whenever a tie-up cell changes; cheap enough to do on every edit. */
  function masks(draft) {
    var m = [];
    for (var t = 0; t < draft.tieup.length; t++) {
      var bits = 0;
      for (var k = 0; k < draft.tieup[t].length; k++) bits |= (1 << draft.tieup[t][k]);
      m.push(bits);
    }
    return m;
  }

  function liftMask(draft, m, j) {
    var entry = draft.treadling[j % draft.treadling.length];
    var bits = 0;
    for (var k = 0; k < entry.length; k++) bits |= (m[entry[k]] || 0);
    return bits;
  }
  function shaftAt(draft, i) { return draft.threading[i % draft.threading.length]; }
  function warpHex(draft, i) { var s = draft.warp[i % draft.warp.length]; return HEX[s] || s; }
  function weftHex(draft, j) { var s = draft.weft[j % draft.weft.length]; return HEX[s] || s; }
  function raised(mask, shaft) { return (mask >> shaft) & 1; }

  /* --- the yarn ----------------------------------------------------------
     One tile per shade, orientation and cell size: a square of colour with a
     rounded-thread gradient across it. Consecutive raised cells along a
     thread share an unshaded edge, so a float reads as one thread, not a row
     of beads. Painting a cloth is then one drawImage per cell. */
  var tiles = {};
  function tile(hex, vertical, s) {
    var key = hex + (vertical ? 'v' : 'h') + s;
    var c = tiles[key];
    if (c) return c;
    c = doc.createElement('canvas');
    c.width = s; c.height = s;
    var g = c.getContext('2d');
    g.fillStyle = hex;
    g.fillRect(0, 0, s, s);
    var grad = vertical ? g.createLinearGradient(0, 0, s, 0) : g.createLinearGradient(0, 0, 0, s);
    grad.addColorStop(0,    'rgba(0,0,0,.46)');
    grad.addColorStop(0.16, 'rgba(0,0,0,.12)');
    grad.addColorStop(0.40, 'rgba(255,255,255,.17)');
    grad.addColorStop(0.60, 'rgba(255,255,255,.05)');
    grad.addColorStop(0.84, 'rgba(0,0,0,.14)');
    grad.addColorStop(1,    'rgba(0,0,0,.46)');
    g.fillStyle = grad;
    g.fillRect(0, 0, s, s);
    tiles[key] = c;
    return c;
  }

  /* Fibre. A small random field drawn over the cloth at low alpha; wool is
     not flat, and without this the cloth reads as a vector illustration. */
  var noiseCanvas = null;
  function noise() {
    if (noiseCanvas) return noiseCanvas;
    var n = doc.createElement('canvas');
    n.width = 96; n.height = 96;
    var g = n.getContext('2d');
    var img = g.createImageData(96, 96);
    var d = img.data;
    var seed = 1234567;
    for (var i = 0; i < d.length; i += 4) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      var v = (seed >> 8) & 255;
      d[i] = d[i + 1] = d[i + 2] = v;
      d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    noiseCanvas = n;
    return n;
  }
  function fibre(ctx, x, y, w, h, alpha) {
    var pat = ctx.createPattern(noise(), 'repeat');
    if (!pat) return;
    ctx.save();
    ctx.globalAlpha = alpha === undefined ? 0.11 : alpha;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = pat;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }

  /* One pick: the weft goes across, and wherever the lifted shafts carry an
     end, that end's warp shows instead. */
  function paintRow(ctx, draft, m, j, x0, y0, s, W) {
    var mask = liftMask(draft, m, j);
    var weft = tile(weftHex(draft, j), false, s);
    for (var i = 0; i < W; i++) {
      if (raised(mask, shaftAt(draft, i))) ctx.drawImage(tile(warpHex(draft, i), true, s), x0 + i * s, y0);
      else ctx.drawImage(weft, x0 + i * s, y0);
    }
  }

  /* --- canvases ----------------------------------------------------------- */
  function dpr() { return Math.min(root.devicePixelRatio || 1, 2); }

  /* Sizes the backing store to the CSS box. Returns null when the element is
     not laid out (display:none, a zero-height parent), the one case where
     drawing would silently produce nothing. */
  function sizeTo(canvas) {
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return null;
    var r = dpr();
    var bw = Math.round(w * r), bh = Math.round(h * r);
    if (canvas.width !== bw) canvas.width = bw;
    if (canvas.height !== bh) canvas.height = bh;
    return { w: bw, h: bh, r: r };
  }

  /* Fills a canvas edge to edge with a cloth at `cellCss` pixels per thread.
     Used by the range cards, the range at length, and the drafting room. */
  function renderCloth(canvas, draft, cellCss) {
    var box = sizeTo(canvas);
    if (!box) return false;
    var ctx = canvas.getContext('2d');
    var s = Math.max(2, Math.round(cellCss * box.r));
    var W = Math.ceil(box.w / s), P = Math.ceil(box.h / s);
    var m = masks(draft);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, box.w, box.h);
    for (var j = 0; j < P; j++) paintRow(ctx, draft, m, j, 0, j * s, s, W);
    fibre(ctx, 0, 0, box.w, box.h);
    return true;
  }

  function grid(ctx, x, y, cols, rows, s, rule) {
    ctx.strokeStyle = rule;
    ctx.beginPath();
    for (var c = 0; c <= cols; c++) { ctx.moveTo(x + c * s + 0.5, y); ctx.lineTo(x + c * s + 0.5, y + rows * s); }
    for (var r = 0; r <= rows; r++) { ctx.moveTo(x, y + r * s + 0.5); ctx.lineTo(x + cols * s, y + r * s + 0.5); }
    ctx.stroke();
  }

  /* The draft as a weaver writes it down: threading across the top, tie-up
     top right, treadling down the right, drawdown as ink squares bottom left.
     Static and cheap; the range page draws one per cloth. */
  function renderNotation(canvas, draft, opts) {
    opts = opts || {};
    var box = sizeTo(canvas);
    if (!box) return false;
    var ctx = canvas.getContext('2d');
    var r = box.r;
    var ink = opts.ink || '#1E1B17', rule = opts.rule || 'rgba(30,27,23,.22)';
    var S = draft.shafts, T = draft.tieup.length;
    var gap = Math.round(6 * r);
    var strip = Math.round(4 * r);
    var ends = opts.ends || 32;
    var s = Math.max(2, Math.floor((box.w - gap * 2 - strip) / (ends + T)));
    var W = ends;
    var P = Math.floor((box.h - strip - gap - S * s - gap) / s);
    if (P < 1) return false;
    var m = masks(draft);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, box.w, box.h);
    var xT = W * s + gap;           /* tie-up and treadling column */
    var yTop = strip + gap;         /* threading rows start here */
    var yDD = yTop + S * s + gap;   /* drawdown / treadling rows start here */
    ctx.lineWidth = Math.max(1, Math.round(r * 0.75));
    var i, j, k, t;
    for (i = 0; i < W; i++) { ctx.fillStyle = warpHex(draft, i); ctx.fillRect(i * s, 0, s, strip); }
    for (j = 0; j < P; j++) { ctx.fillStyle = weftHex(draft, j); ctx.fillRect(xT + T * s + gap, yDD + j * s, strip, s); }
    grid(ctx, 0, yTop, W, S, s, rule);
    grid(ctx, xT, yTop, T, S, s, rule);
    grid(ctx, xT, yDD, T, P, s, rule);
    grid(ctx, 0, yDD, W, P, s, rule);
    ctx.fillStyle = ink;
    var inset = Math.max(1, Math.round(s * 0.14));
    for (i = 0; i < W; i++) {
      var sh = shaftAt(draft, i);
      ctx.fillRect(i * s + inset, yTop + (S - 1 - sh) * s + inset, s - inset * 2, s - inset * 2);
    }
    for (t = 0; t < T; t++) for (k = 0; k < S; k++) {
      if (raised(m[t], k)) ctx.fillRect(xT + t * s + inset, yTop + (S - 1 - k) * s + inset, s - inset * 2, s - inset * 2);
    }
    for (j = 0; j < P; j++) {
      var entry = draft.treadling[j % draft.treadling.length];
      for (k = 0; k < entry.length; k++) ctx.fillRect(xT + entry[k] * s + inset, yDD + j * s + inset, s - inset * 2, s - inset * 2);
      var mask = liftMask(draft, m, j);
      for (i = 0; i < W; i++) if (raised(mask, shaftAt(draft, i))) ctx.fillRect(i * s, yDD + j * s, s, s);
    }
    return true;
  }

  /* --- draft codes ---------------------------------------------------------
     A draft as one line of text, so it can go in an email, a URL or a
     notebook. Shafts and treadles are numbered from one, as a weaver would.

       HEDDLE1|S4|TH:1234|TU:12,23,34,41|TR:1,2,3,4|WP:walnut|WF:oat        */
  function runsOut(list) {
    var out = [], i = 0;
    while (i < list.length) {
      var k = i;
      while (k < list.length && list[k] === list[i]) k++;
      out.push(k - i > 1 ? list[i] + '*' + (k - i) : list[i]);
      i = k;
    }
    return out.join(',');
  }
  function byNum(a, b) { return a - b; }
  function serialize(d) {
    var th = '', tu = [], tr = [], i, k;
    for (i = 0; i < d.threading.length; i++) th += (d.threading[i] + 1);
    for (var t = 0; t < d.tieup.length; t++) {
      var sh = d.tieup[t].slice().sort(byNum), s = '';
      for (k = 0; k < sh.length; k++) s += (sh[k] + 1);
      tu.push(s || '0');
    }
    for (var p = 0; p < d.treadling.length; p++) {
      var e = d.treadling[p].slice().sort(byNum), q = [];
      for (k = 0; k < e.length; k++) q.push(e[k] + 1);
      tr.push(q.length ? q.join('+') : '0');
    }
    return 'HEDDLE1|S' + d.shafts + '|TH:' + th + '|TU:' + tu.join(',') + '|TR:' + tr.join(',') + '|WP:' + runsOut(d.warp) + '|WF:' + runsOut(d.weft);
  }

  function parse(code) {
    if (typeof code !== 'string') return null;
    var parts = code.trim().split('|');
    if (parts[0] !== 'HEDDLE1') return null;
    var d = { shafts: 4, treadles: 4, threading: [], tieup: [], treadling: [], warp: [], weft: [] };
    var i, k, c, v;
    for (i = 1; i < parts.length; i++) {
      var seg = parts[i];
      if (/^S[48]$/.test(seg)) { d.shafts = parseInt(seg.slice(1), 10); continue; }
      var m = /^(TH|TU|TR|WP|WF):(.*)$/.exec(seg);
      if (!m) return null;
      var body = m[2];
      if (m[1] === 'TH') {
        if (!/^[1-8]{1,400}$/.test(body)) return null;
        for (k = 0; k < body.length; k++) d.threading.push(parseInt(body.charAt(k), 10) - 1);
      } else if (m[1] === 'TU') {
        var cells = body.split(',');
        for (k = 0; k < cells.length; k++) {
          if (!/^[0-8]{1,8}$/.test(cells[k])) return null;
          var lift = [];
          for (c = 0; c < cells[k].length; c++) { v = parseInt(cells[k].charAt(c), 10); if (v > 0 && lift.indexOf(v - 1) < 0) lift.push(v - 1); }
          d.tieup.push(lift);
        }
      } else if (m[1] === 'TR') {
        var picks = body.split(',');
        for (k = 0; k < picks.length; k++) {
          if (!/^[0-8](\+[1-8])*$/.test(picks[k])) return null;
          var tr = picks[k].split('+'), e = [];
          for (c = 0; c < tr.length; c++) { v = parseInt(tr[c], 10); if (v > 0 && e.indexOf(v - 1) < 0) e.push(v - 1); }
          d.treadling.push(e);
        }
      } else {
        var shades = runs(body.split(','));
        for (k = 0; k < shades.length; k++) if (!HEX[shades[k]]) return null;
        if (!shades.length) return null;
        d[m[1] === 'WP' ? 'warp' : 'weft'] = shades;
      }
    }
    if (!d.threading.length || !d.tieup.length || !d.treadling.length) return null;
    d.treadles = d.tieup.length;
    if (d.treadles > 8 || d.threading.length > 400 || d.treadling.length > 400) return null;
    for (i = 0; i < d.threading.length; i++) if (d.threading[i] >= d.shafts) return null;
    for (i = 0; i < d.tieup.length; i++) for (k = 0; k < d.tieup[i].length; k++) if (d.tieup[i][k] >= d.shafts) return null;
    for (i = 0; i < d.treadling.length; i++) for (k = 0; k < d.treadling[i].length; k++) if (d.treadling[i][k] >= d.treadles) return null;
    return d;
  }

  /* --- what a weaver checks --------------------------------------------- */

  /* Longest float in each direction over W ends and P picks. A float is a
     run of cells along one thread where it stays on the same face. Over
     five and the cloth snags; the drafting room says so. */
  function floats(draft, W, P) {
    var m = masks(draft);
    var rows = [];
    var j, i, run;
    for (j = 0; j < P; j++) {
      var mask = liftMask(draft, m, j), row = new Uint8Array(W);
      for (i = 0; i < W; i++) row[i] = raised(mask, shaftAt(draft, i));
      rows.push(row);
    }
    var weft = 0, warp = 0;
    for (j = 0; j < P; j++) {
      run = 0;
      for (i = 0; i < W; i++) { if (rows[j][i] === 0) { run++; if (run > weft) weft = run; } else run = 0; }
    }
    for (i = 0; i < W; i++) {
      run = 0;
      for (j = 0; j < P; j++) { if (rows[j][i] === 1) { run++; if (run > warp) warp = run; } else run = 0; }
    }
    return { warp: warp, weft: weft };
  }

  /* Weight of the finished cloth from the sett, for the mill's standard
     2/16 Nm woollen-spun lambswool: 125 tex, so 0.125 g per metre of yarn.
     Take-up and milling add about a tenth. */
  function weight(epc, ppc) {
    return Math.round((epc + ppc) * 100 * 0.125 * 1.1);
  }

  root.WEAVE = {
    SHADES: SHADES, HEX: HEX, CLOTHS: CLOTHS, BY_ID: BY_ID,
    fromCloth: fromCloth, masks: masks, liftMask: liftMask, shaftAt: shaftAt,
    warpHex: warpHex, weftHex: weftHex, raised: raised,
    tile: tile, fibre: fibre, paintRow: paintRow, grid: grid,
    dpr: dpr, sizeTo: sizeTo, renderCloth: renderCloth, renderNotation: renderNotation,
    serialize: serialize, parse: parse, floats: floats, weight: weight, runs: runs
  };
})(window, document);
