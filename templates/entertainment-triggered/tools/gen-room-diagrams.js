/* Generates the room diagrams (SVG) for the Triggered Games concept redesign —
   one per game room, inlined into index.html.
   Run: node tools/gen-room-diagrams.js rooms.json

   These are ORIGINAL drawings built from computed geometry. Nothing is traced,
   screenshotted or derived from the venue's own renders. What they do mirror is
   the real *layout* of each room — five hoops in a row, a honeycomb of buttons,
   a central pillar — because a diagram showing the wrong room is worse than no
   diagram at all. The layout is fact about a physical space; the drawing is ours.

   Projection: a three-wall diorama box in mild perspective (front edge wider
   than back), which is how the venue frames its own rooms, rather than the
   45-degree corner view used in the first pass. Everything is positioned by
   bilinear interpolation inside a wall quad, so no shape needs its own
   transform matrix. */

const FY = 214, BY = 126;      // floor edge y: front, back
const FX0 = 28, FX1 = 292;     // floor x span at the front
const BX0 = 86, BX1 = 234;     // floor x span at the back
const BTOP = 48, FTOP = 110;   // wall top y: at back, at front

const r1 = n => Math.round(n * 10) / 10;
const pts = a => a.map(p => `${r1(p[0])},${r1(p[1])}`).join(' ');
const lerp = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];

/* Quads are TL, TR, BR, BL. quadPt(q, s, t): s = 0..1 left to right,
   t = 0..1 top to bottom (on the floor: back to front). */
const quadPt = (q, s, t) => lerp(lerp(q.TL, q.TR, s), lerp(q.BL, q.BR, s), t);
const quadPoly = q => pts([q.TL, q.TR, q.BR, q.BL]);

const floor     = { TL: [BX0, BY],   TR: [BX1, BY],   BR: [FX1, FY], BL: [FX0, FY] };
const backWall  = { TL: [BX0, BTOP], TR: [BX1, BTOP], BR: [BX1, BY], BL: [BX0, BY] };
const leftWall  = { TL: [FX0, FTOP], TR: [BX0, BTOP], BR: [BX0, BY], BL: [FX0, FY] };
const rightWall = { TL: [BX1, BTOP], TR: [FX1, FTOP], BR: [FX1, FY], BL: [BX1, BY] };

/* Floor rows bunch toward the back — that is what sells the depth. */
const depth = k => Math.pow(k, 1.3);

function floorCell(row, col, rows, cols) {
  const t0 = depth(row / rows), t1 = depth((row + 1) / rows);
  const s0 = col / cols, s1 = (col + 1) / cols;
  return [quadPt(floor, s0, t0), quadPt(floor, s1, t0),
          quadPt(floor, s1, t1), quadPt(floor, s0, t1)];
}

/* The back wall faces us square-on; the side walls foreshorten toward the back,
   so anything mounted on them shrinks as it recedes. */
const wallScale = (q, s) =>
  q === backWall ? 1 : (q === leftWall ? 0.68 + 0.32 * (1 - s) : 0.68 + 0.32 * s);

const C = {
  wallBack: '#2b1f4d', wallLeft: '#241a40', wallRight: '#1b1432',
  floor: '#241b42', line: '#3b2c66',
  white: '#e8e6f5', cyan: '#3ad2f0', magenta: '#ff3ea0', yellow: '#ffd93d',
  ball: '#ff7a2f'
};

/* Flat fills read as flat vector art no matter how correct the geometry is.
   What makes a surface look like a surface is light falling across it, so every
   plane gets a gradient, every corner gets ambient occlusion, every lit object
   gets a bloom halo, and the floor reflects the wall like the venue's glossy
   floors actually do.

   `lit` is the subset of the room that emits light. It appears three times —
   mirrored into the floor, blurred for bloom, and crisp on top — so it is
   defined once and referenced by <use>, and `inner` marks where the crisp copy
   belongs with a %LIT% token. Emitting it three times literally tripled the
   page weight for no visual gain. */
function shell(id, inner, lit = '', floorFill = '') {
  const litUse = lit ? `<use href="#${id}-lit"/>` : '';
  if (lit && !inner.includes('%LIT%')) throw new Error(id + ': inner is missing its %LIT% marker');
  const REFL = 0.45;   // how far the reflection is squashed
  return `<svg class="room-art" viewBox="0 34 320 192" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">` +
    `<defs>` +
      /* wall gradients: dark at the ceiling, warming toward the lit skirting */
      `<linearGradient id="${id}-gb" x1="0" y1="0" x2="0" y2="1">` +
        `<stop offset="0" stop-color="#150e28"/><stop offset=".55" stop-color="#2b1f4d"/><stop offset="1" stop-color="#4b3084"/></linearGradient>` +
      `<linearGradient id="${id}-gl" x1="0" y1="0" x2="1" y2="0">` +
        `<stop offset="0" stop-color="#332455"/><stop offset="1" stop-color="#180f2e"/></linearGradient>` +
      `<linearGradient id="${id}-gr" x1="1" y1="0" x2="0" y2="0">` +
        `<stop offset="0" stop-color="#241a42"/><stop offset="1" stop-color="#130c24"/></linearGradient>` +
      /* pool of light on the floor */
      `<radialGradient id="${id}-pool" cx=".5" cy=".18" r=".85">` +
        `<stop offset="0" stop-color="#b06cff" stop-opacity=".30"/><stop offset="1" stop-color="#b06cff" stop-opacity="0"/></radialGradient>` +
      /* corner ambient occlusion */
      `<linearGradient id="${id}-ao" x1="0" y1="0" x2="0" y2="1">` +
        `<stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>` +
      `<radialGradient id="${id}-vig" cx=".5" cy=".5" r=".72">` +
        `<stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient>` +
      `<filter id="${id}-bloom" x="-50%" y="-50%" width="200%" height="200%">` +
        `<feGaussianBlur stdDeviation="3.4"/></filter>` +
      `<filter id="${id}-soft" x="-50%" y="-50%" width="200%" height="200%">` +
        `<feGaussianBlur stdDeviation="1.6"/></filter>` +
      `<clipPath id="${id}-fc"><polygon points="${quadPoly(floor)}"/></clipPath>` +
      `<linearGradient id="${id}-fade" x1="0" y1="0" x2="0" y2="1">` +
        `<stop offset="0" stop-color="#fff" stop-opacity=".40"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
      `<mask id="${id}-fm"><rect x="0" y="${BY}" width="320" height="${FY - BY + 10}" fill="url(#${id}-fade)"/></mask>` +
      (lit ? `<g id="${id}-lit">${lit}</g>` : '') +
    `</defs>` +
    `<polygon points="${quadPoly(leftWall)}" fill="url(#${id}-gl)"/>` +
    `<polygon points="${quadPoly(rightWall)}" fill="url(#${id}-gr)"/>` +
    `<polygon points="${quadPoly(backWall)}" fill="url(#${id}-gb)"/>` +
    /* ceiling shadow down the top of each wall */
    `<polygon points="${quadPoly(backWall)}" fill="url(#${id}-ao)" opacity=".8"/>` +
    (floorFill || `<polygon points="${quadPoly(floor)}" fill="${C.floor}"/>`) +
    `<polygon points="${quadPoly(floor)}" fill="url(#${id}-pool)"/>` +
    /* the wall's lit fittings, mirrored and faded into the floor */
    (lit ? `<g clip-path="url(#${id}-fc)" mask="url(#${id}-fm)" filter="url(#${id}-soft)">` +
           `<g transform="translate(0 ${r1(BY * (1 + REFL))}) scale(1 ${-REFL})">${litUse}</g></g>` : '') +
    (lit ? `<g filter="url(#${id}-bloom)" opacity=".85">${litUse}</g>` : '') +
    inner.replace('%LIT%', litUse) +
    /* corner edges above the fills, then a vignette to seat it in the card */
    `<g fill="none" stroke="${C.line}" stroke-width="1.2" opacity=".75">` +
    `<polyline points="${pts([[FX0, FTOP], [BX0, BTOP], [BX1, BTOP], [FX1, FTOP]])}"/>` +
    `<line x1="${BX0}" y1="${BTOP}" x2="${BX0}" y2="${BY}"/>` +
    `<line x1="${BX1}" y1="${BTOP}" x2="${BX1}" y2="${BY}"/></g>` +
    `<rect x="0" y="34" width="320" height="192" fill="url(#${id}-vig)"/>` +
    `</svg>`;
}

/* Every room in the venue has a wall-mounted display. */
function screen(q, s, t, w = 16, h = 10) {
  const c = quadPt(q, s, t), k = wallScale(q, s);
  return `<g><rect x="${r1(c[0] - w * k / 2)}" y="${r1(c[1] - h * k / 2)}" width="${r1(w * k)}" height="${r1(h * k)}" ` +
    `rx="1.4" fill="#0d1830" stroke="#4de0ff" stroke-width="1"/>` +
    `<rect x="${r1(c[0] - w * k / 2 + 1.8)}" y="${r1(c[1] - h * k / 2 + 1.8)}" width="${r1(w * k - 3.6)}" height="${r1(1.5 * k)}" fill="#4de0ff" opacity=".75"/></g>`;
}

/* Lit skirting running along the base of the walls. */
function skirt() {
  const band = (q, col) => {
    const a = quadPt(q, 0, 0.93), b = quadPt(q, 1, 0.93);
    const c = quadPt(q, 1, 1), d = quadPt(q, 0, 1);
    return `<polygon points="${pts([a, b, c, d])}" fill="${col}" opacity=".55"/>`;
  };
  return band(backWall, '#c060ff') + band(leftWall, '#a24ee0') + band(rightWall, '#8f42c9');
}

/* A row of balls resting on the floor against the back wall. */
function ballRow(n = 13, t = 0.05) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const c = quadPt(floor, (i + 0.5) / n, t);
    s += `<circle cx="${r1(c[0])}" cy="${r1(c[1])}" r="3.1" fill="${C.ball}"/>` +
         `<circle cx="${r1(c[0] - 0.8)}" cy="${r1(c[1] - 0.9)}" r="1" fill="#ffc9a0" opacity=".8"/>`;
  }
  return s;
}

const plainFloor = (fill = C.floor, rows = 5, cols = 7) => {
  let s = '';
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      s += `<polygon points="${pts(floorCell(r, c, rows, cols))}" fill="${fill}" stroke="#31255a" stroke-width=".8"/>`;
  return s;
};

const rooms = {};

/* 1 — Floor Is Lava: a grid of lit LED floor tiles. The real floor is white
   with cyan / magenta / yellow patches, not molten orange. */
{
  const ROWS = ['..11..22', '.1122.2.', '33..11..', '.3.221..', '..33.11.', '2...33..'];
  const map = { '.': C.white, '1': C.cyan, '2': C.magenta, '3': C.yellow };
  let g = '';
  for (let r = 0; r < ROWS.length; r++)
    for (let c = 0; c < 8; c++)
      g += `<polygon class="t-lava" points="${pts(floorCell(r, c, ROWS.length, 8))}" ` +
           `fill="${map[ROWS[r][c]]}" stroke="#1a1430" stroke-width="1"/>`;
  let strips = '';
  for (let i = 0; i < 6; i++) {
    const a = quadPt(backWall, 0.08 + i * 0.17, 0.30);
    strips += `<rect x="${r1(a[0] - 1.4)}" y="${r1(a[1] - 5)}" width="2.8" height="10" rx="1.4" fill="${C.magenta}" opacity=".8"/>`;
  }
  rooms.lava = shell('lava', skirt() + '%LIT%' + screen(backWall, 0.5, 0.14), strips, g);
}

/* 2 — Press It!: dense button fields covering the walls, bright floor. */
{
  const cols = [C.magenta, C.cyan, C.yellow, C.white];
  const pick = (r, c) => cols[(r * 5 + c * 3) % 4];
  let dots = '';
  for (let r = 0; r < 6; r++)
    for (let c = 0; c < 12; c++) {
      const p = quadPt(backWall, 0.05 + c * 0.0818, 0.16 + r * 0.115);
      const on = (r * 12 + c) % 3 === 0;
      dots += `<circle class="${on ? 'b-on' : ''}" cx="${r1(p[0])}" cy="${r1(p[1])}" r="2.4" fill="${on ? pick(r, c) : '#4b3a7a'}"/>`;
    }
  [leftWall, rightWall].forEach(q => {
    for (let r = 0; r < 5; r++)
      for (let c = 0; c < 4; c++) {
        const s = 0.12 + c * 0.22, p = quadPt(q, s, 0.18 + r * 0.14);
        const on = (r + c) % 3 === 0;
        dots += `<circle class="${on ? 'b-on' : ''}" cx="${r1(p[0])}" cy="${r1(p[1])}" r="${r1(2.2 * wallScale(q, s))}" ` +
                `fill="${on ? pick(r, c) : '#423270'}"/>`;
      }
  });
  rooms.press = shell('press', skirt() + '%LIT%' + screen(backWall, 0.5, 0.05),
    dots, plainFloor('#d9d6ee'));
}

/* 3 — Hide & Seek: lit cylindrical pillars standing in the room to break
   sightlines. A circle on this floor projects to an axis-aligned ellipse. */
{
  const pillar = (s, t, rad, h, col) => {
    const b = quadPt(floor, s, t);
    const rx = rad * 1.5, ry = rad * 0.62;
    return `<g><ellipse cx="${r1(b[0])}" cy="${r1(b[1] + 2)}" rx="${r1(rx * 1.15)}" ry="${r1(ry)}" fill="#150f2b" opacity=".5"/>` +
      `<rect x="${r1(b[0] - rx)}" y="${r1(b[1] - h)}" width="${r1(rx * 2)}" height="${r1(h)}" fill="${col}"/>` +
      `<ellipse cx="${r1(b[0])}" cy="${r1(b[1])}" rx="${r1(rx)}" ry="${r1(ry)}" fill="${col}"/>` +
      `<ellipse class="b-on" cx="${r1(b[0])}" cy="${r1(b[1] - h)}" rx="${r1(rx)}" ry="${r1(ry)}" fill="#f6f2ff"/></g>`;
  };
  let acc = '';
  for (let i = 0; i < 5; i++) {
    const p = quadPt(backWall, 0.12 + i * 0.19, 0.28);
    acc += `<rect x="${r1(p[0] - 1.3)}" y="${r1(p[1] - 6)}" width="2.6" height="12" rx="1.3" fill="${C.cyan}" opacity=".55"/>`;
  }
  rooms.hide = shell('hide', skirt() + '%LIT%' + screen(backWall, 0.5, 0.09) +
    pillar(0.28, 0.40, 8.5, 42, '#bdb2e6') +
    pillar(0.68, 0.70, 11, 54, '#e6dffa'), acc, plainFloor());
}

/* 4 — Hoops Madness: five hoops in a row on the back wall, balls on the floor. */
{
  let h = '';
  for (let i = 0; i < 5; i++) {
    const s = 0.13 + i * 0.185;
    const bp = quadPt(backWall, s, 0.32);
    const rp = quadPt(backWall, s, 0.50);
    const col = [C.magenta, C.cyan, C.magenta, C.yellow, C.magenta][i];
    h += `<g><rect x="${r1(bp[0] - 9)}" y="${r1(bp[1] - 7)}" width="18" height="14" rx="1.6" fill="#160f2c" stroke="${col}" stroke-width="1.6"/>` +
      `<rect x="${r1(bp[0] - 4.5)}" y="${r1(bp[1] - 3.5)}" width="9" height="7" fill="${col}" opacity=".38"/>` +
      `<ellipse class="hoop" cx="${r1(rp[0])}" cy="${r1(rp[1])}" rx="6.5" ry="2.4" fill="none" stroke="${C.ball}" stroke-width="1.8"/></g>`;
  }
  rooms.hoops = shell('hoops', skirt() + screen(backWall, 0.5, 0.07) + '%LIT%' + ballRow(), h, plainFloor());
}

/* 5 — Hexa Blasts: a honeycomb cluster of buttons on the back wall. */
{
  const layout = [4, 5, 5, 4];               // rows that form the rounded cluster
  const lit = new Set(['0-1', '1-0', '1-3', '2-2', '3-1', '3-3']);
  const tint = ['#ffd93d', C.white, C.cyan];
  let cluster = '';
  layout.forEach((n, r) => {
    for (let c = 0; c < n; c++) {
      const s = 0.5 + (c - (n - 1) / 2) * 0.105;
      const p = quadPt(backWall, s, 0.19 + r * 0.125);
      const on = lit.has(`${r}-${c}`);
      const col = on ? tint[(r + c) % 3] : C.magenta;
      cluster += `<g><circle cx="${r1(p[0])}" cy="${r1(p[1])}" r="6.6" fill="#2a1240" stroke="#ff5cb0" stroke-width="1"/>` +
        `<circle class="${on ? 'hx-on' : ''}" cx="${r1(p[0])}" cy="${r1(p[1])}" r="4.8" fill="${col}" opacity="${on ? 1 : .78}"/></g>`;
    }
  });
  rooms.hexa = shell('hexa', skirt() + '%LIT%' + ballRow(11, 0.06) + screen(rightWall, 0.4, 0.26), cluster, plainFloor());
}

/* 6 — Combos: not a room — two rooms booked back to back. */
{
  const mini = (dx, scale, accent) => {
    const m = p => [r1(160 + (p[0] - 160) * scale + dx), r1(132 + (p[1] - 150) * scale)];
    const q = o => pts([m(o.TL), m(o.TR), m(o.BR), m(o.BL)]);
    return `<g><polygon points="${q(leftWall)}" fill="${C.wallLeft}"/>` +
      `<polygon points="${q(rightWall)}" fill="${C.wallRight}"/>` +
      `<polygon points="${q(backWall)}" fill="${C.wallBack}"/>` +
      `<polygon points="${q(floor)}" fill="${C.floor}"/>` +
      /* only the skirting carries the accent — a fully tinted floor made these
         read as two coloured slabs rather than two rooms */
      `<polygon points="${pts([m(quadPt(backWall, 0, 0.9)), m(quadPt(backWall, 1, 0.9)), m([BX1, BY]), m([BX0, BY])])}" fill="${accent}" opacity=".8"/>` +
      `<polyline points="${pts([m([FX0, FTOP]), m([BX0, BTOP]), m([BX1, BTOP]), m([FX1, FTOP])])}" fill="none" stroke="${accent}" stroke-width="1.5"/>` +
      `<g fill="none" stroke="${accent}" stroke-width="1" opacity=".45">` +
      `<line x1="${m([BX0, BTOP])[0]}" y1="${m([BX0, BTOP])[1]}" x2="${m([BX0, BY])[0]}" y2="${m([BX0, BY])[1]}"/>` +
      `<line x1="${m([BX1, BTOP])[0]}" y1="${m([BX1, BTOP])[1]}" x2="${m([BX1, BY])[0]}" y2="${m([BX1, BY])[1]}"/></g></g>`;
  };
  rooms.combo =
    `<svg class="room-art" viewBox="0 34 320 192" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">` +
    mini(-74, 0.5, '#ff3ea0') + mini(74, 0.5, '#c9ff3d') +
    `<g stroke="#f4f2ff" stroke-width="3" stroke-linecap="round" opacity=".85">` +
    `<line x1="160" y1="118" x2="160" y2="142"/><line x1="148" y1="130" x2="172" y2="130"/></g></svg>`;
}

require('fs').writeFileSync(process.argv[2], JSON.stringify(rooms, null, 1));
console.log(Object.entries(rooms).map(([k, s]) => `${k}: ${s.length} chars`).join('\n'));
