/* Generates the room diagrams (SVG) for the Triggered Games concept redesign —
   one per game room, inlined into index.html.
   Run: node tools/gen-room-diagrams.js rooms.json

   ORIGINAL drawings from computed geometry. Nothing traced, screenshotted or
   derived from the venue's own renders. Each room shows the one thing that
   room actually is — a lit floor, a wall of buttons, a pillar, a row of hoops,
   a honeycomb — and nothing else.

   Projection: a real axonometric camera. Points are given in 3D room space and
   projected, rather than being placed inside flat 2D quads. The two ground axes
   use *different* angles (18 deg and 36 deg) so the box is asymmetric — a
   symmetric, straight-on box reads flat no matter how well it is shaded, which
   is what sank the previous pass. Walls carry visible thickness at the top rim,
   which is the other cue that says "solid object" rather than "drawing".

   Style: deliberately between realistic and abstract. Simple geometry, one
   accent colour per room drawn from the site palette, lighting doing the work. */

const AX = 18 * Math.PI / 180;   // width axis, heading right-and-down
const AZ = 36 * Math.PI / 180;   // depth axis, heading left-and-down
const KX = [Math.cos(AX), Math.sin(AX)];
const KZ = [-Math.cos(AZ), Math.sin(AZ)];

const W = 132, D = 116, H = 68, T = 6;   // room width, depth, wall height, wall thickness
const OX = 144, OY = 104;                // where the back corner lands on canvas

const r1 = n => Math.round(n * 10) / 10;
const P = (x, y, z) => [
  OX + x * KX[0] + z * KZ[0],
  OY + x * KX[1] + z * KZ[1] - y
];
const pts = a => a.map(p => `${r1(p[0])},${r1(p[1])}`).join(' ');
const poly = (a, fill, extra = '') => `<polygon points="${pts(a)}" fill="${fill}" ${extra}/>`;

/* Surface parameterisations. u runs along the surface, v runs down from the
   top of a wall; both are 0..1 so callers never touch room dimensions. */
const wallR = (u, v) => P(u * W, (1 - v) * H, 0);          // wall behind the x axis
const wallL = (u, v) => P(0, (1 - v) * H, u * D);          // wall behind the z axis
const flr = (u, w) => P(u * W, 0, w * D);

const floorQuad = [flr(0, 0), flr(1, 0), flr(1, 1), flr(0, 1)];
const wallRQuad = [wallR(0, 0), wallR(1, 0), wallR(1, 1), wallR(0, 1)];
const wallLQuad = [wallL(0, 0), wallL(1, 0), wallL(1, 1), wallL(0, 1)];
/* Top rims — horizontal, so they catch the most light and give the walls mass. */
const rimR = [P(0, H, 0), P(W, H, 0), P(W, H, -T), P(0, H, -T)];
const rimL = [P(0, H, 0), P(0, H, D), P(-T, H, D), P(-T, H, 0)];

const C = {
  rim: '#4a3a78', rimSide: '#2a2048',
  hot: '#ff2d6f', volt: '#c9ff3d', flame: '#ff8a1f', ice: '#4de0ff',
  tileOff: '#241c44'
};

function floorCell(i, j, n, m) {
  return [flr(i / n, j / m), flr((i + 1) / n, j / m),
          flr((i + 1) / n, (j + 1) / m), flr(i / n, (j + 1) / m)];
}

/* Lit skirting where each wall meets the floor. Reads as the room's own light
   source, which is what justifies the gradients on every other surface. */
const skirt = accent =>
  poly([wallR(0, 0.95), wallR(1, 0.95), wallR(1, 1), wallR(0, 1)], accent, 'opacity=".42"') +
  poly([wallL(0, 0.95), wallL(1, 0.95), wallL(1, 1), wallL(0, 1)], accent, 'opacity=".26"');

/* `lit` is drawn three times — mirrored in the floor, blurred for bloom, and
   crisp. It is defined once and referenced by <use>; `inner` marks where the
   crisp copy belongs with %LIT%. */
function shell(id, accent, inner, lit = '', floorFill = '') {
  const litUse = lit ? `<use href="#${id}-lit"/>` : '';
  if (lit && !inner.includes('%LIT%')) throw new Error(id + ': inner is missing its %LIT% marker');
  const REFL = 0.42;
  return `<svg class="room-art" viewBox="0 28 320 196" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">` +
    `<defs>` +
      `<linearGradient id="${id}-r" x1="0" y1="0" x2="0" y2="1">` +
        `<stop offset="0" stop-color="#191130"/><stop offset="1" stop-color="#33245c"/></linearGradient>` +
      `<linearGradient id="${id}-l" x1="0" y1="0" x2="0" y2="1">` +
        `<stop offset="0" stop-color="#160f2c"/><stop offset="1" stop-color="#2a1f4e"/></linearGradient>` +
      `<linearGradient id="${id}-f" x1="0" y1="0" x2="0" y2="1">` +
        `<stop offset="0" stop-color="#241b46"/><stop offset="1" stop-color="#150f2c"/></linearGradient>` +
      /* Kept deliberately faint. At any real strength this pool floods the whole
         floor with the accent and the room stops reading as a room. */
      `<radialGradient id="${id}-pool" cx=".42" cy=".08" r=".8">` +
        `<stop offset="0" stop-color="${accent}" stop-opacity=".10"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient>` +
      `<radialGradient id="${id}-vig" cx=".5" cy=".48" r=".7">` +
        `<stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></radialGradient>` +
      `<filter id="${id}-bloom" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3.2"/></filter>` +
      `<filter id="${id}-soft" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.5"/></filter>` +
      `<clipPath id="${id}-fc"><polygon points="${pts(floorQuad)}"/></clipPath>` +
      `<linearGradient id="${id}-fade" x1="0" y1="0" x2="0" y2="1">` +
        `<stop offset="0" stop-color="#fff" stop-opacity=".34"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>` +
      `<mask id="${id}-fm"><rect x="0" y="${r1(P(0, 0, 0)[1] - 4)}" width="320" height="150" fill="url(#${id}-fade)"/></mask>` +
      (lit ? `<g id="${id}-lit">${lit}</g>` : '') +
    `</defs>` +
    /* wall thickness first: the outer sliver sits behind everything */
    poly(rimL, C.rimSide) + poly(rimR, C.rimSide) +
    poly(wallLQuad, `url(#${id}-l)`) +
    poly(wallRQuad, `url(#${id}-r)`) +
    (floorFill || poly(floorQuad, `url(#${id}-f)`)) +
    poly(floorQuad, `url(#${id}-pool)`) +
    (lit ? `<g clip-path="url(#${id}-fc)" mask="url(#${id}-fm)" filter="url(#${id}-soft)">` +
           `<g transform="translate(0 ${r1(P(0, 0, 0)[1] * (1 + REFL))}) scale(1 ${-REFL})">${litUse}</g></g>` : '') +
    (lit ? `<g filter="url(#${id}-bloom)" opacity=".8">${litUse}</g>` : '') +
    inner.replace('%LIT%', litUse) +
    /* rims last so their lit top edges sit above the wall fills */
    poly(rimR, C.rim) + poly(rimL, C.rim) +
    `<rect x="0" y="28" width="320" height="196" fill="url(#${id}-vig)"/>` +
    `</svg>`;
}

const rooms = {};

/* 1 — Floor Is Lava: a lit floor, and nothing else. */
{
  const N = 5, M = 5;
  const on = new Set(['1,1', '3,0', '0,3', '2,3', '4,2']);
  let g = '';
  for (let i = 0; i < N; i++)
    for (let j = 0; j < M; j++)
      g += poly(floorCell(i, j, N, M), C.tileOff, 'stroke="#150f2c" stroke-width="1"');
  let hot = '';
  for (const k of on) {
    const [i, j] = k.split(',').map(Number);
    hot += poly(floorCell(i, j, N, M), C.hot, 'class="t-lava" stroke="#150f2c" stroke-width="1"');
  }
  rooms.lava = shell('lava', C.hot, skirt(C.hot) + '%LIT%', hot,
    poly(floorQuad, `url(#lava-f)`) + g);
}

/* 2 — Press It!: a sparse grid of buttons, three of them live. */
{
  const dot = (p, col, cls) =>
    `<circle ${cls} cx="${r1(p[0])}" cy="${r1(p[1])}" r="3.6" fill="${col}"/>`;
  let off = '', on = '';
  const liveR = new Set(['1,0', '2,2']), liveL = new Set(['0,1']);
  for (let u = 0; u < 3; u++)
    for (let v = 0; v < 3; v++) {
      const pr = wallR(0.2 + u * 0.3, 0.24 + v * 0.22);
      const pl = wallL(0.24 + u * 0.28, 0.26 + v * 0.22);
      /* Unlit buttons still have to be visible or the grid — the whole point of
         this room — disappears into the wall. */
      (liveR.has(`${u},${v}`) ? (on += dot(pr, C.volt, 'class="b-on"')) : (off += dot(pr, '#453a72')));
      (liveL.has(`${u},${v}`) ? (on += dot(pl, C.volt, 'class="b-on"')) : (off += dot(pl, '#382d61')));
    }
  rooms.press = shell('press', C.volt, skirt(C.volt) + off + '%LIT%', on);
}

/* 3 — Hide & Seek: one pillar. That is the whole room. */
{
  const pillar = (u, w, rad, h) => {
    const b = flr(u, w);
    /* a circle on the floor projects to an ellipse; these axes come from the
       two ground vectors, so it sits in the floor plane rather than floating */
    const rx = rad * (Math.abs(KX[0]) + Math.abs(KZ[0])) / 2;
    const ry = rad * (Math.abs(KX[1]) + Math.abs(KZ[1])) / 2;
    return `<g><ellipse cx="${r1(b[0])}" cy="${r1(b[1])}" rx="${r1(rx * 1.2)}" ry="${r1(ry * 1.1)}" fill="#0d0918" opacity=".5"/>` +
      `<rect x="${r1(b[0] - rx)}" y="${r1(b[1] - h)}" width="${r1(rx * 2)}" height="${r1(h)}" fill="#2c2150"/>` +
      `<rect x="${r1(b[0] - rx)}" y="${r1(b[1] - h)}" width="${r1(rx * 0.75)}" height="${r1(h)}" fill="#382a63"/>` +
      `<ellipse cx="${r1(b[0])}" cy="${r1(b[1])}" rx="${r1(rx)}" ry="${r1(ry)}" fill="#2c2150"/></g>`;
  };
  const cap = (u, w, rad, h) => {
    const b = flr(u, w);
    const rx = rad * (Math.abs(KX[0]) + Math.abs(KZ[0])) / 2;
    const ry = rad * (Math.abs(KX[1]) + Math.abs(KZ[1])) / 2;
    return `<ellipse class="b-on" cx="${r1(b[0])}" cy="${r1(b[1] - h)}" rx="${r1(rx)}" ry="${r1(ry)}" fill="${C.ice}"/>`;
  };
  rooms.hide = shell('hide', C.ice,
    skirt(C.ice) + pillar(0.46, 0.42, 15, 40) + '%LIT%',
    cap(0.46, 0.42, 15, 40));
}

/* 4 — Hoops Madness: three hoops on one wall, a few balls below. */
{
  let rig = '', ball = '';
  for (let i = 0; i < 3; i++) {
    const u = 0.22 + i * 0.28;
    const b = wallR(u, 0.34), h = wallR(u, 0.425);
    /* Board as a flat plate with no outline, ring overlapping its lower edge.
       An outlined box with a shape beneath it just reads as a little monitor. */
    rig += `<rect x="${r1(b[0] - 7)}" y="${r1(b[1] - 6)}" width="14" height="11" rx="1.5" fill="${C.flame}" opacity=".28"/>` +
      `<ellipse class="hoop" cx="${r1(h[0])}" cy="${r1(h[1])}" rx="7.5" ry="2.8" fill="none" stroke="${C.flame}" stroke-width="2.2"/>`;
  }
  for (let i = 0; i < 5; i++) {
    const p = flr(0.16 + i * 0.17, 0.12);
    ball += `<circle cx="${r1(p[0])}" cy="${r1(p[1])}" r="4" fill="${C.flame}"/>`;
  }
  rooms.hoops = shell('hoops', C.flame, skirt(C.flame) + '%LIT%' + ball, rig);
}

/* 5 — Hexa Blasts: one honeycomb of seven, two of them live. */
{
  const hex = (cx, cy, r) => {
    const a = [];
    for (let k = 0; k < 6; k++) {
      const t = (Math.PI / 180) * (60 * k + 30);
      a.push([cx + r * Math.cos(t), cy + r * Math.sin(t) * 0.86]);
    }
    return a;
  };
  /* axial honeycomb: centre plus one ring */
  const cells = [[0, 0], [1, 0], [-1, 0], [0.5, 1], [-0.5, 1], [0.5, -1], [-0.5, -1]];
  const live = new Set(['0,0', '-0.5,1']);
  let off = '', on = '';
  cells.forEach(([q, r]) => {
    const p = wallR(0.5 + q * 0.115, 0.42 + r * 0.16);
    const shape = hex(p[0], p[1], 9);
    if (live.has(`${q},${r}`)) on += poly(shape, C.hot, 'class="hx-on"');
    else off += poly(shape, C.tileOff, `stroke="${C.hot}" stroke-width="1" opacity=".85"`);
  });
  rooms.hexa = shell('hexa', C.hot, skirt(C.hot) + off + '%LIT%', on);
}

/* 6 — Combos: not a room. Two rooms booked back to back. */
{
  const mini = (dx, k, accent) => {
    const m = p => [r1(160 + (p[0] - 160) * k + dx), r1(140 + (p[1] - 140) * k)];
    const q = a => pts(a.map(m));
    return `<g><polygon points="${q(rimL)}" fill="${C.rimSide}"/><polygon points="${q(rimR)}" fill="${C.rimSide}"/>` +
      `<polygon points="${q(wallLQuad)}" fill="#191231"/><polygon points="${q(wallRQuad)}" fill="#241a44"/>` +
      `<polygon points="${q(floorQuad)}" fill="#1a1333"/>` +
      `<polygon points="${q([wallR(0, 0.9), wallR(1, 0.9), wallR(1, 1), wallR(0, 1)])}" fill="${accent}" opacity=".75"/>` +
      `<polygon points="${q(rimR)}" fill="${C.rim}"/><polygon points="${q(rimL)}" fill="${C.rim}"/></g>`;
  };
  rooms.combo =
    `<svg class="room-art" viewBox="0 28 320 196" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">` +
    mini(-72, 0.52, C.hot) + mini(72, 0.52, C.volt) +
    `<g stroke="#f4f2ff" stroke-width="3" stroke-linecap="round" opacity=".85">` +
    `<line x1="160" y1="126" x2="160" y2="150"/><line x1="148" y1="138" x2="172" y2="138"/></g></svg>`;
}

require('fs').writeFileSync(process.argv[2], JSON.stringify(rooms, null, 1));
console.log(Object.entries(rooms).map(([k, s]) => `${k}: ${s.length} chars`).join('\n'));
