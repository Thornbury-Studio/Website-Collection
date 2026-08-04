/* Generates original isometric room diagrams (SVG) for the Triggered Games
   concept redesign — one per game room. Pure computed geometry; nothing is
   traced from or copied out of the real venue's artwork. */

const B = [160, 80], L = [20, 152], R = [300, 152];
const N = 4;
const u = [(L[0] - B[0]) / N, (L[1] - B[1]) / N];   // back corner -> left wall
const v = [(R[0] - B[0]) / N, (R[1] - B[1]) / N];   // back corner -> right wall
const H = 66;                                        // wall height

const uLen = Math.hypot(u[0], u[1]);
const vLen = Math.hypot(v[0], v[1]);
const uU = [u[0] / uLen, u[1] / uLen];
const vU = [v[0] / vLen, v[1] / vLen];

const r1 = n => Math.round(n * 10) / 10;
const pts = a => a.map(p => `${r1(p[0])},${r1(p[1])}`).join(' ');

function cell(i, j) {
  const p0 = [B[0] + i * u[0] + j * v[0], B[1] + i * u[1] + j * v[1]];
  return [p0, [p0[0] + u[0], p0[1] + u[1]],
          [p0[0] + u[0] + v[0], p0[1] + u[1] + v[1]],
          [p0[0] + v[0], p0[1] + v[1]]];
}

const F = [B[0] + N * u[0] + N * v[0], B[1] + N * u[1] + N * v[1]];
const leftWall  = [L, B, [B[0], B[1] - H], [L[0], L[1] - H]];
const rightWall = [R, B, [B[0], B[1] - H], [R[0], R[1] - H]];

/* place something on a wall: t = steps along the wall from the back corner,
   h = height above the floor */
const onLeft  = (t, h) => [B[0] + t * u[0], B[1] + t * u[1] - h];
const onRight = (t, h) => [B[0] + t * v[0], B[1] + t * v[1] - h];
const mLeft  = c => `matrix(${r1(uU[0])} ${r1(uU[1])} 0 -1 ${r1(c[0])} ${r1(c[1])})`;
const mRight = c => `matrix(${r1(vU[0])} ${r1(vU[1])} 0 -1 ${r1(c[0])} ${r1(c[1])})`;

function hexPts(r) {
  const a = [];
  for (let k = 0; k < 6; k++) {
    const ang = (Math.PI / 180) * (60 * k + 30);
    a.push([r * Math.cos(ang), r * Math.sin(ang)]);
  }
  return pts(a);
}

/* An isometric block standing on floor cell (i,j). Both visible side faces get
   their own value so it reads as a solid object rather than an outline. */
function block(i, j, h, accent) {
  const [p0, p1, p2, p3] = cell(i, j);
  const up = p => [p[0], p[1] - h];
  return `<g class="blk">` +
    `<polygon points="${pts([p1, p2, up(p2), up(p1)])}" fill="#2b2148"/>` +
    `<polygon points="${pts([p2, p3, up(p3), up(p2)])}" fill="#1b1430"/>` +
    `<polygon points="${pts([up(p0), up(p1), up(p2), up(p3)])}" fill="#3a2d60"/>` +
    `<polyline points="${pts([up(p1), up(p2), up(p3)])}" fill="none" stroke="${accent}" stroke-width="1.6" opacity=".95"/>` +
    `<line x1="${r1(p2[0])}" y1="${r1(p2[1])}" x2="${r1(up(p2)[0])}" y2="${r1(up(p2)[1])}" stroke="${accent}" stroke-width="1.2" opacity=".5"/>` +
    `</g>`;
}

function shell(id, extraDefs = '') {
  return {
    open: `<svg class="room-art" viewBox="0 4 320 230" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">` +
          `<defs>` +
          `<radialGradient id="${id}-pool" cx=".5" cy=".5" r=".5">` +
          `<stop offset="0" stop-color="#ff2d6f" stop-opacity=".20"/>` +
          `<stop offset="1" stop-color="#ff2d6f" stop-opacity="0"/></radialGradient>` +
          extraDefs + `</defs>`,
    /* walls first, then a soft pool of light on the floor for depth */
    walls: `<polygon points="${pts(leftWall)}" fill="#1c1533"/>` +
           `<polygon points="${pts(rightWall)}" fill="#130f26"/>` +
           `<polyline points="${pts([[L[0], L[1] - H], [B[0], B[1] - H], [R[0], R[1] - H]])}" fill="none" stroke="#3a2d60" stroke-width="1.4"/>` +
           `<line x1="${B[0]}" y1="${B[1]}" x2="${B[0]}" y2="${B[1] - H}" stroke="#3a2d60" stroke-width="1.4"/>`,
    pool: `<ellipse cx="${r1((B[0] + F[0]) / 2)}" cy="${r1((B[1] + F[1]) / 2)}" rx="140" ry="70" fill="url(#${id}-pool)"/>`,
    close: `</svg>`
  };
}

function floorGrid(cellFn) {
  let s = '';
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) s += cellFn(i, j, cell(i, j));
  return s;
}
const plainFloor = () => floorGrid((i, j, c) =>
  `<polygon points="${pts(c)}" fill="#191330" stroke="#2a2145" stroke-width="1.1"/>`);

/* ------------------------------------------------------------------ */
const rooms = {};

/* 1 — Floor Is Lava: molten floor, a scatter of safe tiles, two hovering. */
{
  const id = 'lava';
  const defs = `<linearGradient id="${id}-g" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="#ff2d6f"/><stop offset="1" stop-color="#ff8a1f"/></linearGradient>`;
  const s = shell(id, defs);
  const safe = new Set(['1,1', '0,3', '3,2']);
  let body = s.walls;
  body += floorGrid((i, j, c) => safe.has(`${i},${j}`)
    ? `<polygon class="t-safe" points="${pts(c)}" fill="#191428" stroke="#c9ff3d" stroke-width="1.5"/>`
    : `<polygon class="t-lava" points="${pts(c)}" fill="url(#${id}-g)" stroke="#0a0812" stroke-width="1.8"/>`);
  const hover = (i, j, lift) => {
    const c = cell(i, j).map(p => [p[0], p[1] - lift]);
    return `<polygon points="${pts(cell(i, j))}" fill="#07060d" opacity=".28"/>` +
           `<polygon class="t-float" points="${pts(c)}" fill="#191428" stroke="#c9ff3d" stroke-width="1.6"/>`;
  };
  body += hover(2, 1, 24) + hover(1, 3, 15);
  rooms[id] = s.open + body + s.close;
}

/* 2 — Press It!: buttons across both walls, a few lit at any moment. */
{
  const id = 'press';
  const s = shell(id);
  let body = s.walls + s.pool + plainFloor();
  const ON = '#ff2d6f', OFF = '#3d3159';
  const bank = (m, on, list) => list.map(([t, h, lit]) => {
    const col = lit ? ON : OFF;
    return `<g transform="${m(on(t, h))}">` +
      (lit ? `<circle r="15" fill="${ON}" opacity=".18"/>` : '') +
      `<circle class="${lit ? 'b-on' : 'b-off'}" r="7.5" fill="${col}"/>` +
      `<circle r="11" fill="none" stroke="${col}" stroke-width="1.3" opacity=".7"/></g>`;
  }).join('');
  body += bank(mLeft, onLeft, [[0.75, 44, 1], [1.6, 21, 0], [2.4, 47, 0], [3.2, 24, 1]]);
  body += bank(mRight, onRight, [[0.8, 23, 0], [1.7, 46, 1], [2.5, 20, 0], [3.25, 43, 0]]);
  rooms[id] = s.open + body + s.close;
}

/* 3 — Hide & Seek: obstacles that break line of sight. Back to front. */
{
  const id = 'hide';
  const s = shell(id);
  let body = s.walls + s.pool + plainFloor();
  body += block(0, 1, 30, '#ff2d6f');
  body += block(1, 3, 22, '#c9ff3d');
  body += block(3, 1, 38, '#ff8a1f');
  rooms[id] = s.open + body + s.close;
}

/* 4 — Hoops Madness: ring targets at mixed heights. */
{
  const id = 'hoops';
  const s = shell(id);
  let body = s.walls + s.pool + plainFloor();
  const ring = (m, c, col, r) =>
    `<g transform="${m(c)}"><circle r="${r + 5}" fill="${col}" opacity=".10"/>` +
    `<circle class="hoop" r="${r}" fill="none" stroke="${col}" stroke-width="3.2"/></g>`;
  body += ring(mLeft, onLeft(1.05, 41), '#ff2d6f', 14);
  body += ring(mLeft, onLeft(2.75, 27), '#c9ff3d', 11);
  body += ring(mRight, onRight(1.15, 27), '#ff8a1f', 11);
  body += ring(mRight, onRight(2.85, 42), '#ff2d6f', 14);
  rooms[id] = s.open + body + s.close;
}

/* 5 — Hexa Blasts: hex panels tiling both walls, several lit. */
{
  const id = 'hexa';
  const s = shell(id);
  let body = s.walls + s.pool + plainFloor();
  const hp = hexPts(13);
  const panel = (m, on, t, h, lit) => {
    const col = lit ? '#c9ff3d' : '#332a4f';
    return `<g transform="${m(on(t, h))}">` +
      (lit ? `<polygon points="${hexPts(19)}" fill="#c9ff3d" opacity=".14"/>` : '') +
      `<polygon class="${lit ? 'hx-on' : 'hx-off'}" points="${hp}" fill="${col}" ` +
      `stroke="${lit ? '#e2ff8a' : '#453765'}" stroke-width="1.3"/></g>`;
  };
  // staggered two-row grid on each wall
  const rows = [[18, [0.7, 1.75, 2.8]], [46, [1.2, 2.3, 3.35]]];
  const litL = new Set(['0-1', '1-2']), litR = new Set(['1-0', '0-2']);
  rows.forEach(([h, ts], ri) => ts.forEach((t, ci) => {
    body += panel(mLeft, onLeft, t, h, litL.has(`${ri}-${ci}`));
    body += panel(mRight, onRight, t, h, litR.has(`${ri}-${ci}`));
  }));
  rooms[id] = s.open + body + s.close;
}

/* 6 — Combos: not a room, a booking shape. Two floors joined by a plus. */
{
  const id = 'combo';
  const dia = (cx, cy, w, h, accent) =>
    `<polygon points="${cx},${cy - h / 2} ${cx + w / 2},${cy} ${cx},${cy + h / 2} ${cx - w / 2},${cy}" ` +
    `fill="#191330" stroke="${accent}" stroke-width="1.6"/>` +
    `<polygon points="${cx},${cy - h / 2 + 9} ${cx + w / 2 - 16},${cy} ${cx},${cy + h / 2 - 9} ${cx - w / 2 + 16},${cy}" ` +
    `fill="${accent}" opacity=".16"/>`;
  rooms[id] =
    `<svg class="room-art" viewBox="0 4 320 230" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">` +
    dia(88, 130, 132, 74, '#ff2d6f') + dia(232, 130, 132, 74, '#c9ff3d') +
    `<g stroke="#f4f2ff" stroke-width="2.6" stroke-linecap="round" opacity=".8">` +
    `<line x1="160" y1="118" x2="160" y2="142"/><line x1="148" y1="130" x2="172" y2="130"/></g>` +
    `</svg>`;
}

require('fs').writeFileSync(process.argv[2], JSON.stringify(rooms, null, 1));
console.log(Object.entries(rooms).map(([k, s]) => `${k}: ${s.length} chars`).join('\n'));
