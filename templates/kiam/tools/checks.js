// Evaluated inside the page by tools/shot.mjs. Returns a plain object of the things a screenshot
// cannot prove: overflow owners, image aspect ratios, grid placement collisions, tap targets,
// missing alt text, heading order.
const r = {};
const W = document.documentElement.clientWidth;

// 1. any element wider than the viewport (pseudo-elements excluded — see scrollWidth above)
r.wide = [...document.querySelectorAll('body *')].filter((el) => {
  const b = el.getBoundingClientRect();
  return b.width > 0 && (b.right > W + 1 || b.left < -1) && getComputedStyle(el).position !== 'fixed';
}).slice(0, 8).map((el) => el.tagName + '.' + el.className + ' ' + Math.round(el.getBoundingClientRect().right));

// 2. images: loaded, alt present, rendered aspect not a sliver
r.images = [...document.images].map((img) => {
  const b = img.getBoundingClientRect();
  return { src: (img.currentSrc || img.src).split('/').pop(), alt: img.alt ? 'ok' : 'MISSING', loaded: img.complete && img.naturalWidth > 0,
    ratio: b.height ? +(b.width / b.height).toFixed(2) : 0 };
});

// 3. grids: a placed child next to an auto child is a bug waiting to be seen (PATTERNS.md)
r.grids = [...document.querySelectorAll('*')].filter((g) => getComputedStyle(g).display === 'grid').map((g) => {
  const kids = [...g.children].filter((c) => { const s = getComputedStyle(c); return s.position !== 'absolute' && s.display !== 'contents'; });
  const placed = kids.filter((c) => getComputedStyle(c).gridColumnStart !== 'auto');
  const cells = {}; let dup = 0;
  kids.forEach((c) => { const s = getComputedStyle(c); const k = s.gridColumnStart + '/' + s.gridRowStart; if (s.gridColumnStart !== 'auto' && s.gridRowStart !== 'auto') { if (cells[k]) dup++; cells[k] = 1; } });
  return { g: g.className.toString().slice(0, 30), kids: kids.length, placed: placed.length, mixed: placed.length > 0 && placed.length !== kids.length, dup };
}).filter((x) => x.mixed || x.dup);

// 4. tap targets under 44px on interactive elements
r.smallTargets = [...document.querySelectorAll('a, button, input, textarea, select')].filter((el) => {
  const b = el.getBoundingClientRect(); return b.width > 0 && (b.height < 24 || (b.height < 44 && b.width < 44));
}).slice(0, 10).map((el) => el.tagName + '.' + el.className + ' ' + Math.round(el.getBoundingClientRect().width) + 'x' + Math.round(el.getBoundingClientRect().height));

// 5. headings order + h1 count
const hs = [...document.querySelectorAll('h1,h2,h3,h4')].map((h) => +h.tagName[1]);
r.h1 = document.querySelectorAll('h1').length;
r.headingJumps = hs.filter((n, i) => i && n > hs[i - 1] + 1).length;

// 6. inputs without labels
r.unlabelled = [...document.querySelectorAll('input, textarea, select')].filter((el) => !el.labels || !el.labels.length).length;

// 7. bottle labels: does the name text overflow its label box?
r.labelOverflow = [...document.querySelectorAll('.bottle')].map((svg) => {
  const box = svg.querySelector('.label').getBBox();
  const over = [...svg.querySelectorAll('.t-name')].filter((t) => { const b = t.getBBox(); return b.x + b.width > box.x + box.width - 4; }).map((t) => t.textContent);
  return over.length ? over.join(', ') : null;
}).filter(Boolean);

return r;
