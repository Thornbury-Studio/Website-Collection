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

/* Every room in the venue has a scoreboard.
   Drawn as a parallelogram in the wall's own plane rather than an upright rect.
   A rect centred near a slanted wall edge pokes out past it on the descending
   side, which is exactly what these were doing. Built from wall coordinates it
   is flush by construction and cannot escape the wall. */
function screen(wall, u, v, w = 0.13, h = 0.09) {
  const q = (du, dv) => wall(u + du, v + dv);
  const face = [q(-w, -h), q(w, -h), q(w, h), q(-w, h)];
  const bar = (dv, len) => pts([q(-w * 0.66, dv), q(-w * 0.66 + len, dv),
                                q(-w * 0.66 + len, dv + 0.02), q(-w * 0.66, dv + 0.02)]);
  return `<g><polygon points="${pts(face)}" fill="#0c1428" stroke="#4de0ff" stroke-width="1"/>` +
    `<polygon class="scr" points="${bar(-0.035, w * 1.32)}" fill="#4de0ff" opacity=".8"/>` +
    `<polygon class="scr" points="${bar(0.015, w * 0.72)}" fill="#4de0ff" opacity=".45"/></g>`;
}

/* Lit eye panels. Hide & Seek has these on its walls, and they suit the game far
   better than a neutral light batten — they blink on hover. */
function eyes(specs) {
  const xy = p => `${r1(p[0])},${r1(p[1])}`;
  return specs.map(([wall, u, v, w, h], i) => {
    const L = wall(u - w, v), R = wall(u + w, v);
    const T = wall(u, v - h), B = wall(u, v + h), Cc = wall(u, v);
    return `<g class="eye" style="--i:${i}">` +
      `<path d="M${xy(L)} Q${xy(T)} ${xy(R)} Q${xy(B)} ${xy(L)} Z" fill="#0e2a33" stroke="${C.ice}" stroke-width="1.3"/>` +
      `<circle class="pupil" cx="${r1(Cc[0])}" cy="${r1(Cc[1])}" r="2.8" fill="${C.ice}"/></g>`;
  }).join('');
}

/* The raised ball platform along the base of the wall in the hoops and hexa
   rooms — in the real rooms the balls live on this, not loose on the floor.
   Sized in floor squares so it lines up with the seams: FLOOR_SQ * 2 spans two
   of the squares visible on the floor. */
const FLOOR_SQ = D / 5;
function trough(depth, h, accent) {
  const top = [P(0, h, 0), P(W, h, 0), P(W, h, depth), P(0, h, depth)];
  const front = [P(0, h, depth), P(W, h, depth), P(W, 0, depth), P(0, 0, depth)];
  const lip = [P(0, h, depth), P(W, h, depth), P(W, h - 2.4, depth), P(0, h - 2.4, depth)];
  /* Top face is deliberately lighter than the floor: at two squares deep this
     is a sizeable deck, and matching the floor tone made it read as a flat
     painted band rather than something raised. */
  return poly(front, '#150d29') + poly(top, '#372a63') + poly(lip, accent, 'opacity=".6"');
}

/* Balls sitting in that gutter. */
function gutterBalls(n, depth, h, rad, col) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const p = P((i + 0.5) / n * W, h, depth * 0.5);
    s += `<circle cx="${r1(p[0])}" cy="${r1(p[1] - rad * 0.55)}" r="${rad}" fill="${col}"/>` +
      `<circle cx="${r1(p[0] - rad * 0.32)}" cy="${r1(p[1] - rad * 0.95)}" r="${r1(rad * 0.3)}" fill="#fff" opacity=".4"/>`;
  }
  return s;
}

/* Faint seams across the floor. Without them a plain floor is a flat gradient
   wedge and the room loses the sense of a surface receding away from you. */
function floorSeams(n = 5) {
  let s = '<g stroke="#31255a" stroke-width=".8" opacity=".65" fill="none">';
  for (let i = 1; i < n; i++) {
    const a = flr(i / n, 0), b = flr(i / n, 1);
    const c = flr(0, i / n), d = flr(1, i / n);
    s += `<line x1="${r1(a[0])}" y1="${r1(a[1])}" x2="${r1(b[0])}" y2="${r1(b[1])}"/>`;
    s += `<line x1="${r1(c[0])}" y1="${r1(c[1])}" x2="${r1(d[0])}" y2="${r1(d[1])}"/>`;
  }
  return s + '</g>';
}
const seamFloor = id => poly(floorQuad, `url(#${id}-f)`) + floorSeams();

/* Vertical light battens on the left wall — depth cue plus something for the
   hover sweep to travel along. Positions are explicit rather than evenly
   spaced so a room can leave a gap where its scoreboard sits. */
function battens(positions) {
  return positions.map((u, i) => {
    const p = wallL(u, 0.42);
    return `<rect class="cell" style="--i:${i}" x="${r1(p[0] - 1.6)}" y="${r1(p[1] - 11)}" width="3.2" height="22" rx="1.6"/>`;
  }).join('');
}

/* Lit skirting where each wall meets the floor. Reads as the room's own light
   source, which is what justifies the gradients on every other surface. */
const skirt = accent =>
  poly([wallR(0, 0.95), wallR(1, 0.95), wallR(1, 1), wallR(0, 1)], accent, 'opacity=".42"') +
  poly([wallL(0, 0.95), wallL(1, 0.95), wallL(1, 1), wallL(0, 1)], accent, 'opacity=".26"');

/* `lit` is drawn three times — mirrored in the floor, blurred for bloom, and
   crisp. The two decorative copies are <use> references to a single definition,
   but the CRISP copy is emitted as real markup at the %LIT% marker.
   That split is deliberate and load-bearing: a <use> instance does NOT pick up
   CSS rules that match the referenced original. Verified directly — the
   original's computed fill was green while its instances rendered black. So
   anything that has to respond to hover (the hoop rig, the pulsing tiles and
   buttons) must be a real element, not an instance. The decorative copies never
   animate, so they stay cheap. */
function shell(id, accent, inner, lit = '', floorFill = '', off = C.tileOff) {
  const litUse = lit ? `<use href="#${id}-lit"/>` : '';
  if (lit && !inner.includes('%LIT%')) throw new Error(id + ': inner is missing its %LIT% marker');
  const REFL = 0.42;
  /* --rm / --off drive the hover "wake" animation in style.css: dormant
     fittings run up to the room's accent in a staggered sweep, so hovering a
     card visibly starts something happening inside the room. */
  return `<svg class="room-art" style="--rm:${accent};--off:${off}" viewBox="0 28 320 196" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">` +
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
    inner.replace('%LIT%', lit) +
    /* rims last so their lit top edges sit above the wall fills */
    poly(rimR, C.rim) + poly(rimL, C.rim) +
    `<rect x="0" y="28" width="320" height="196" fill="url(#${id}-vig)"/>` +
    `</svg>`;
}

const rooms = {};

/* 1 — Floor Is Lava: a lit floor, and nothing else. */
{
  const N = 6, M = 6;
  const on = new Set(['1,1', '3,0', '0,3', '2,3', '4,2', '5,4', '2,5', '4,5']);
  let g = '';
  let n = 0;
  for (let i = 0; i < N; i++)
    for (let j = 0; j < M; j++) {
      if (on.has(`${i},${j}`)) continue;
      g += `<polygon class="cell" style="--i:${(i + j) % 8}" points="${pts(floorCell(i, j, N, M))}" stroke="#150f2c" stroke-width="1"/>`;
      n++;
    }
  let hot = '';
  for (const k of on) {
    const [i, j] = k.split(',').map(Number);
    hot += poly(floorCell(i, j, N, M), C.hot, 'class="t-lava" stroke="#150f2c" stroke-width="1"');
  }
  rooms.lava = shell('lava', C.hot,
    skirt(C.hot) + battens([0.14, 0.38, 0.62, 0.86]) + screen(wallR, 0.5, 0.26) + '%LIT%', hot,
    poly(floorQuad, `url(#lava-f)`) + g);
}

/* 2 — Press It!: a sparse grid of buttons, three of them live. */
{
  const live = (p) => `<circle class="b-on" cx="${r1(p[0])}" cy="${r1(p[1])}" r="3.6" fill="${C.volt}"/>`;
  const dead = (p, i) => `<circle class="cell" style="--i:${i}" cx="${r1(p[0])}" cy="${r1(p[1])}" r="3.4"/>`;
  let off = '', on = '';
  const liveR = new Set(['1,0', '3,2', '2,1']), liveL = new Set(['0,1', '2,3']);
  for (let u = 0; u < 4; u++)
    for (let v = 0; v < 4; v++) {
      const pr = wallR(0.16 + u * 0.225, 0.2 + v * 0.19);
      liveR.has(`${u},${v}`) ? (on += live(pr)) : (off += dead(pr, (u + v) % 6));
      if (u < 3) {
        const pl = wallL(0.2 + u * 0.26, 0.22 + v * 0.19);
        liveL.has(`${u},${v}`) ? (on += live(pl)) : (off += dead(pl, (u + v + 2) % 6));
      }
    }
  /* Unlit buttons are lighter here than in other rooms: they are physical
     buttons covering the walls and are the entire point of the room, so they
     have to be legible when dark. At the shared --off they vanished and the
     room looked empty. */
  rooms.press = shell('press', C.volt, skirt(C.volt) + off + '%LIT%', on,
    seamFloor('press'), '#4b3e7a');
}

/* 3 — Hide & Seek: one pillar. That is the whole room. */
{
  const pillar = (u, w, rad, h) => {
    const b = flr(u, w);
    /* a circle on the floor projects to an ellipse; these axes come from the
       two ground vectors, so it sits in the floor plane rather than floating */
    const rx = rad * (Math.abs(KX[0]) + Math.abs(KZ[0])) / 2;
    const ry = rad * (Math.abs(KX[1]) + Math.abs(KZ[1])) / 2;
    return `<g><ellipse cx="${r1(b[0])}" cy="${r1(b[1])}" rx="${r1(rx * 1.2)}" ry="${r1(ry * 1.1)}" fill="#0b0716" opacity=".75"/>` +
      `<rect x="${r1(b[0] - rx)}" y="${r1(b[1] - h)}" width="${r1(rx * 2)}" height="${r1(h)}" fill="#3b2d68"/>` +
      `<rect x="${r1(b[0] - rx)}" y="${r1(b[1] - h)}" width="${r1(rx * 0.75)}" height="${r1(h)}" fill="#4a3a80"/>` +
      `<ellipse cx="${r1(b[0])}" cy="${r1(b[1])}" rx="${r1(rx)}" ry="${r1(ry)}" fill="#3b2d68"/></g>`;
  };
  const cap = (u, w, rad, h) => {
    const b = flr(u, w);
    const rx = rad * (Math.abs(KX[0]) + Math.abs(KZ[0])) / 2;
    const ry = rad * (Math.abs(KX[1]) + Math.abs(KZ[1])) / 2;
    return `<ellipse class="b-on" cx="${r1(b[0])}" cy="${r1(b[1] - h)}" rx="${r1(rx)}" ry="${r1(ry)}" fill="${C.ice}"/>`;
  };
  /* Three pillars at different depths — one alone read as an empty room, and
     the staggered heights are what make the space feel occupied. */
  rooms.hide = shell('hide', C.ice,
    /* Four to a wall, spaced evenly *along* each wall but at irregular heights
       and sizes. Bunching two together left a hole elsewhere and read as an
       accident rather than as something watching from every corner; the height
       and size variation is what keeps an even spacing from looking like a grid.
       The one at (0.64, 0.58) deliberately fills the gap under the screen. */
    skirt(C.ice) + eyes([
      [wallL, 0.12, 0.32, 0.06, 0.09],
      [wallL, 0.34, 0.70, 0.115, 0.17],
      [wallL, 0.56, 0.20, 0.045, 0.07],
      [wallL, 0.82, 0.56, 0.085, 0.125],
      [wallR, 0.14, 0.46, 0.095, 0.14],
      [wallR, 0.36, 0.74, 0.055, 0.08],
      [wallR, 0.64, 0.58, 0.08, 0.12],
      [wallR, 0.88, 0.30, 0.105, 0.155]
    ]) + screen(wallR, 0.62, 0.2) +
    pillar(0.24, 0.22, 11, 30) + pillar(0.5, 0.46, 15, 42) + pillar(0.78, 0.74, 12, 34) +
    '%LIT%',
    cap(0.24, 0.22, 11, 30) + cap(0.5, 0.46, 15, 42) + cap(0.78, 0.74, 12, 34), seamFloor('hide'));
}

/* 4 — Hoops Madness: three hoops on one wall, a few balls below. */
{
  /* At rest this is just five dark hoops on a wall — no light at all. The fire
     only exists on hover, when the rings themselves also come on. Colours for
     both states live in style.css so the transition is CSS's to run; the
     gradient is in the room's own defs so the flames inherit nothing from the
     shell. White-hot at the base through orange to a fading tip, like a real
     flame rather than a uniform glow column. */
  let rig = '', ball = '';
  let defs = `<defs><linearGradient id="hoops-flame" x1="0" y1="1" x2="0" y2="0">` +
    `<stop offset="0" stop-color="#fff3c4" stop-opacity=".95"/>` +
    `<stop offset=".4" stop-color="${C.flame}" stop-opacity=".85"/>` +
    `<stop offset="1" stop-color="${C.hot}" stop-opacity="0"/></linearGradient></defs>`;

  /* One tongue of flame: a tapered leaf rising from (cx, cy). */
  const tongue = (cx, cy, w, ht) =>
    `<path d="M${r1(cx - w)},${r1(cy)} Q${r1(cx - w * 0.55)},${r1(cy - ht * 0.55)} ${r1(cx)},${r1(cy - ht)} ` +
    `Q${r1(cx + w * 0.55)},${r1(cy - ht * 0.55)} ${r1(cx + w)},${r1(cy)} Z" fill="url(#hoops-flame)"/>`;

  /* Five, because the room has five and the card copy says five — three left
     the art quietly contradicting the text beside it. */
  for (let i = 0; i < 5; i++) {
    const u = 0.14 + i * 0.18;
    const b = wallR(u, 0.34), h = wallR(u, 0.425);
    /* Three tongues per hoop at different widths and heights, each on its own
       flicker offset, so the fire never looks like one rigid shape. */
    const licks =
      `<g class="lick" style="--f:0">${tongue(h[0] - 2.6, h[1], 3.1, 15)}</g>` +
      `<g class="lick" style="--f:1">${tongue(h[0] + 0.4, h[1] - 1, 3.6, 22)}</g>` +
      `<g class="lick" style="--f:2">${tongue(h[0] + 3, h[1], 2.7, 13)}</g>`;
    /* opacity="0" as an attribute, not just in CSS: the bloom and reflection
       copies are <use> instances that ignore CSS, so without it the flames
       would show as blurred smudges even at rest. CSS still overrides it on the
       real element when the card is hovered. */
    rig += `<g class="hoop-fire" opacity="0" style="--i:${i}">` +
      `<g filter="url(#hoops-bloom)" opacity=".6">${licks}</g>${licks}</g>` +
      /* Board as a flat plate with no outline, ring overlapping its lower edge.
         An outlined box with a shape beneath it just reads as a little monitor.
         Rest colours are attributes so the <use> copies render them; CSS takes
         over on the real element for the hover transition. */
      `<rect class="hoop-plate" x="${r1(b[0] - 6)}" y="${r1(b[1] - 5.5)}" width="12" height="10" rx="1.4" ` +
      `fill="#2a2250" stroke="#574778" stroke-width="1"/>` +
      `<ellipse class="hoop" cx="${r1(h[0])}" cy="${r1(h[1])}" rx="6.4" ry="2.5" fill="none" ` +
      `stroke="#9184b8" stroke-width="2"/>`;
  }
  rig = defs + rig;
  ball = trough(FLOOR_SQ * 2, 11, C.flame) + gutterBalls(8, FLOOR_SQ * 2, 11, 4.2, C.flame);
  rooms.hoops = shell('hoops', C.flame,
    /* Scoreboard goes on the side wall: on the hoop wall it sat straight on top
       of the third hoop. */
    skirt(C.flame) + battens([0.14, 0.86]) + screen(wallL, 0.52, 0.3) + '%LIT%' + ball,
    rig, seamFloor('hoops'));
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
  /* axial honeycomb: centre plus two rings, so it reads as a wall of them */
  const cells = [
    [0, 0], [1, 0], [-1, 0], [0.5, 1], [-0.5, 1], [0.5, -1], [-0.5, -1],
    [2, 0], [-2, 0], [1.5, 1], [-1.5, 1], [1.5, -1], [-1.5, -1], [0, 2], [1, 2], [-1, 2]
  ];
  const live = new Set(['0,0', '-0.5,1', '1.5,-1', '1,2']);
  let off = '', on = '';
  cells.forEach(([q, r], i) => {
    const p = wallR(0.5 + q * 0.098, 0.36 + r * 0.145);
    const shape = hex(p[0], p[1], 8.4);
    if (live.has(`${q},${r}`)) on += poly(shape, C.hot, 'class="hx-on"');
    else off += `<polygon class="cell" style="--i:${i % 7}" points="${pts(shape)}" stroke="${C.hot}" stroke-width="1" opacity=".85"/>`;
  });
  rooms.hexa = shell('hexa', C.hot,
    skirt(C.hot) + off + screen(wallL, 0.5, 0.3, 0.12, 0.09) + '%LIT%' +
    trough(FLOOR_SQ * 2, 10, C.hot) + gutterBalls(9, FLOOR_SQ * 2, 10, 3.4, C.volt),
    on, seamFloor('hexa'));
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
