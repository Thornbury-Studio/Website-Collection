/* Generates the dish illustrations for the Bai He menu template.
   Run: node tools/gen-plates.js plates.json

   Original drawings from computed geometry — no stock photography anywhere in
   this template. That is a deliberate design choice as much as a licensing one:
   the SAME artwork has to work at 120px on a menu card and at 46px arranged on
   the round table, and it has to sit on a white page without the muddy edges a
   cut-out photograph brings. Flat top-down vector does both.

   Each dish is emitted as a <symbol> so a single definition can be referenced
   by <use> from the card and again from every copy on the table. */

const P = {
  rim: '#e0d9cd', line: '#c9c0b1', ink: '#2a2621',
  porcelain: '#fffdfa', shadow: '#efe9df',
  red: '#c8443c', deepred: '#9c3a2f', jade: '#4a7c64',
  green: '#7ba05b', leaf: '#5f8c48', gold: '#d4a53a',
  brown: '#96603c', darkbrown: '#6d4227', cream: '#f3e6cf',
  pink: '#e8a99a', white: '#fbf7f1', chili: '#c0392b'
};

const r1 = n => Math.round(n * 10) / 10;

/* A round plate: broad rim, shallow well. */
const plate = inner =>
  `<circle cx="60" cy="60" r="47" fill="${P.porcelain}" stroke="${P.rim}" stroke-width="1.6"/>` +
  `<circle cx="60" cy="60" r="37" fill="none" stroke="${P.line}" stroke-width="0.9" opacity=".65"/>` + inner;

/* A bowl reads deeper: a heavier outer ring and a visible inner wall. */
const bowl = (inner, wellFill = P.porcelain) =>
  `<circle cx="60" cy="60" r="45" fill="${P.porcelain}" stroke="${P.rim}" stroke-width="1.8"/>` +
  `<circle cx="60" cy="60" r="38" fill="${P.shadow}" opacity=".55"/>` +
  `<circle cx="60" cy="60" r="34" fill="${wellFill}" stroke="${P.line}" stroke-width="0.8"/>` + inner;

/* Bamboo steamer: slats across the well, banded rim. */
const steamer = inner =>
  `<circle cx="60" cy="60" r="47" fill="#e8d6b4" stroke="#c9ab7e" stroke-width="2"/>` +
  `<circle cx="60" cy="60" r="39" fill="#f2e6cd" stroke="#cdb083" stroke-width="1.2"/>` +
  [0, 1, 2, 3, 4].map(i =>
    `<line x1="${25 + i * 0.5}" y1="${40 + i * 10}" x2="${95 - i * 0.5}" y2="${40 + i * 10}" stroke="#d9c095" stroke-width="0.9" opacity=".8"/>`
  ).join('') + inner;

/* scatter: deterministic pseudo-random specks, so runs are reproducible */
function scatter(n, cx, cy, rad, seed, fn) {
  let s = '', k = seed;
  for (let i = 0; i < n; i++) {
    k = (k * 9301 + 49297) % 233280;
    const a = (k / 233280) * Math.PI * 2;
    k = (k * 9301 + 49297) % 233280;
    const d = Math.sqrt(k / 233280) * rad;
    s += fn(r1(cx + Math.cos(a) * d), r1(cy + Math.sin(a) * d), i);
  }
  return s;
}

const dishes = {};

/* 小食 — prawn & chive dumplings in a steamer */
dishes.dumpling = steamer(
  [[60, 44], [44, 68], [76, 68]].map(([x, y]) =>
    `<g><path d="M${x - 13},${y + 4} Q${x},${y - 14} ${x + 13},${y + 4} Q${x},${y + 11} ${x - 13},${y + 4} Z" ` +
    `fill="${P.white}" stroke="#dfd2bb" stroke-width="1.1"/>` +
    `<path d="M${x - 8},${y + 1} Q${x - 4},${y - 5} ${x},${y + 1} Q${x + 4},${y - 5} ${x + 8},${y + 1}" ` +
    `fill="none" stroke="#cfc0a6" stroke-width="1"/>` +
    `<circle cx="${x}" cy="${y + 3}" r="2.4" fill="${P.jade}" opacity=".55"/></g>`).join('')
);

/* 小食 — smacked cucumber */
dishes.cucumber = bowl(
  [[52, 52, -18], [68, 56, 24], [56, 68, 8], [70, 70, -32], [60, 60, 48]].map(([x, y, rot]) =>
    `<g transform="rotate(${rot} ${x} ${y})">` +
    `<rect x="${x - 9}" y="${y - 5}" width="18" height="10" rx="3.5" fill="#cfe0b4" stroke="${P.leaf}" stroke-width="1"/>` +
    `<rect x="${x - 6}" y="${y - 2.5}" width="12" height="5" rx="2" fill="#eaf3dc"/></g>`).join('') +
  scatter(7, 60, 60, 26, 11, (x, y) => `<circle cx="${x}" cy="${y}" r="1.3" fill="${P.chili}" opacity=".75"/>`)
);

/* 小食 — salt & pepper squid */
dishes.squid = plate(
  [[48, 52], [68, 50], [58, 66], [74, 66], [45, 68]].map(([x, y], i) =>
    `<g><circle cx="${x}" cy="${y}" r="${8 - (i % 2)}" fill="${P.cream}" stroke="#d8c49c" stroke-width="1.2"/>` +
    `<circle cx="${x}" cy="${y}" r="${3.4 - (i % 2) * 0.4}" fill="${P.porcelain}" stroke="#ddcaa6" stroke-width="0.8"/></g>`).join('') +
  scatter(9, 60, 60, 28, 7, (x, y, i) => i % 3 === 0
    ? `<path d="M${x},${y} l3.5,1.5 l-3.5,1.5 Z" fill="${P.red}" opacity=".8"/>`
    : `<circle cx="${x}" cy="${y}" r="1.1" fill="${P.ink}" opacity=".5"/>`)
);

/* 主菜 — steamed sea bass, ginger & spring onion */
dishes.seabass = plate(
  `<ellipse cx="60" cy="60" rx="30" ry="12" fill="#f0ece4" stroke="#d5cbb9" stroke-width="1.2"/>` +
  `<path d="M88,60 l10,-8 v16 Z" fill="#eae4d8" stroke="#d5cbb9" stroke-width="1.2"/>` +
  `<circle cx="38" cy="57" r="2" fill="${P.ink}" opacity=".65"/>` +
  `<path d="M46,54 Q60,49 76,55" fill="none" stroke="#d9cfbc" stroke-width="1"/>` +
  [[52, 60], [64, 62], [74, 58]].map(([x, y]) =>
    `<rect x="${x - 7}" y="${y - 1.6}" width="14" height="3.2" rx="1.6" fill="${P.green}" opacity=".9"/>`).join('') +
  [[57, 55], [70, 65]].map(([x, y]) =>
    `<ellipse cx="${x}" cy="${y}" rx="4" ry="2" fill="${P.gold}" opacity=".8"/>`).join('')
);

/* 主菜 — red-braised pork belly */
dishes.porkbelly = bowl(
  [[52, 54], [68, 54], [60, 64], [46, 66], [74, 66]].map(([x, y]) =>
    `<g><rect x="${x - 8}" y="${y - 7}" width="16" height="14" rx="2.5" fill="${P.brown}"/>` +
    `<rect x="${x - 8}" y="${y - 2.5}" width="16" height="4" fill="${P.cream}" opacity=".65"/>` +
    `<rect x="${x - 8}" y="${y - 7}" width="16" height="3" rx="1.5" fill="${P.darkbrown}"/></g>`).join('') +
  `<ellipse cx="60" cy="76" rx="20" ry="5" fill="${P.darkbrown}" opacity=".35"/>`,
  '#f6ede0'
);

/* 主菜 — mapo tofu */
dishes.mapo = bowl(
  `<circle cx="60" cy="60" r="30" fill="#d8523f" opacity=".75"/>` +
  [[50, 52], [66, 50], [58, 62], [72, 62], [48, 68], [64, 72]].map(([x, y], i) =>
    `<rect x="${x - 6}" y="${y - 6}" width="12" height="12" rx="1.5" fill="${P.white}" ` +
    `opacity="${0.9 - (i % 3) * 0.08}" stroke="#e8ddcb" stroke-width="0.7"/>`).join('') +
  scatter(10, 60, 60, 25, 3, (x, y) => `<circle cx="${x}" cy="${y}" r="1.4" fill="${P.deepred}" opacity=".85"/>`) +
  `<path d="M46,74 q6,-3 12,0" fill="none" stroke="${P.green}" stroke-width="2" stroke-linecap="round"/>`,
  '#e4694f'
);

/* 主菜 — kung pao chicken */
dishes.kungpao = plate(
  [[50, 54], [64, 52], [56, 64], [70, 64], [46, 66]].map(([x, y]) =>
    `<rect x="${x - 6}" y="${y - 5}" width="12" height="10" rx="3" fill="#d99a4e" stroke="#b97e38" stroke-width="0.9"/>`).join('') +
  scatter(8, 60, 60, 26, 23, (x, y) => `<circle cx="${x}" cy="${y}" r="2.6" fill="${P.cream}" stroke="#d3bb92" stroke-width="0.8"/>`) +
  [[72, 50, 20], [44, 58, -30], [66, 74, 60]].map(([x, y, rot]) =>
    `<g transform="rotate(${rot} ${x} ${y})"><rect x="${x - 8}" y="${y - 2}" width="16" height="4" rx="2" fill="${P.red}"/></g>`).join('')
);

/* 蔬菜 — gai lan with garlic */
dishes.gailan = plate(
  [[46, 20], [56, -6], [66, 12], [74, -14]].map(([x, rot], i) =>
    `<g transform="rotate(${rot} ${x + 8} 60)">` +
    `<rect x="${x}" y="42" width="7" height="34" rx="3.5" fill="${P.green}"/>` +
    `<path d="M${x + 3.5},44 q-11,-7 -3,-14 q9,4 3,14 Z" fill="${P.leaf}"/>` +
    `<path d="M${x + 3.5},50 q11,-6 4,-13 q-9,5 -4,13 Z" fill="${P.leaf}" opacity=".85"/></g>`).join('') +
  scatter(9, 60, 66, 22, 41, (x, y) => `<circle cx="${x}" cy="${y}" r="2" fill="${P.cream}" stroke="#d9c9a5" stroke-width="0.7"/>`)
);

/* 主食 — yangzhou fried rice */
dishes.friedrice = bowl(
  `<circle cx="60" cy="60" r="28" fill="#f6e7c8"/>` +
  scatter(46, 60, 60, 26, 5, (x, y, i) => {
    const c = [P.gold, '#f7c948', P.pink, P.green, '#f6e7c8'][i % 5];
    return `<rect x="${x}" y="${y}" width="3.4" height="2.2" rx="1.1" fill="${c}" opacity=".95"/>`;
  })
);

/* 主食 — dan dan noodles */
dishes.dandan = bowl(
  `<circle cx="60" cy="60" r="30" fill="#e6a24a" opacity=".5"/>` +
  [22, 17, 12].map((r, i) =>
    `<circle cx="60" cy="60" r="${r}" fill="none" stroke="#f0d9a8" stroke-width="4" opacity="${0.95 - i * 0.08}"/>`).join('') +
  `<circle cx="60" cy="60" r="26" fill="none" stroke="#c0392b" stroke-width="2.4" opacity=".55"/>` +
  `<circle cx="60" cy="55" r="7" fill="${P.darkbrown}" opacity=".9"/>` +
  `<path d="M50,74 q7,-4 14,0" fill="none" stroke="${P.green}" stroke-width="2.2" stroke-linecap="round"/>` +
  scatter(8, 60, 62, 22, 17, (x, y) => `<circle cx="${x}" cy="${y}" r="1.3" fill="${P.deepred}" opacity=".8"/>`),
  '#f2c98a'
);

/* 甜品 — egg tarts */
dishes.eggtart = plate(
  [[50, 56], [72, 62]].map(([x, y]) =>
    `<g><circle cx="${x}" cy="${y}" r="15" fill="${P.cream}" stroke="#d8bd8c" stroke-width="1.3"/>` +
    `<circle cx="${x}" cy="${y}" r="11.5" fill="#f4c65a" stroke="#e0ac3c" stroke-width="1"/>` +
    `<ellipse cx="${x - 3}" cy="${y - 4}" rx="3.5" ry="2.2" fill="#f9dd94" opacity=".8"/></g>`).join('')
);

/* 甜品 — mango sago */
dishes.mangosago = bowl(
  `<circle cx="60" cy="60" r="30" fill="#f6c04a"/>` +
  scatter(24, 60, 60, 26, 29, (x, y) => `<circle cx="${x}" cy="${y}" r="2.1" fill="${P.white}" opacity=".9"/>`) +
  [[52, 52], [68, 58], [58, 68]].map(([x, y]) =>
    `<path d="M${x - 6},${y + 3} q6,-9 12,-3 q-6,6 -12,3 Z" fill="#f7a83c" stroke="#e08f27" stroke-width="0.8"/>`).join(''),
  '#fbd979'
);

const out = {};
for (const k in dishes) {
  out[k] = `<symbol id="p-${k}" viewBox="0 0 120 120">${dishes[k]}</symbol>`;
}
require('fs').writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
console.log(Object.keys(out).length + ' plates: ' +
  Object.entries(out).map(([k, v]) => `${k}(${v.length})`).join(' '));
