// WCAG contrast audit for every text/ground pair SEJUK uses.
function lum(hex) {
  const c = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16) / 255);
  const f = (v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function ratio(a, b) {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}
function blend(top, alpha, under) {
  const t = top.replace("#", ""), u = under.replace("#", "");
  const mix = [0, 2, 4].map((i) => {
    const tv = parseInt(t.slice(i, i + 2), 16), uv = parseInt(u.slice(i, i + 2), 16);
    return Math.round(alpha * tv + (1 - alpha) * uv).toString(16).padStart(2, "0");
  });
  return "#" + mix.join("");
}

const C = {
  frost: "#f2f5f6", frost2: "#e9eef0", paper: "#fbfdfd", ink: "#10222e",
  ink2: "#3d525e", sirap: "#c8203e", sirapInk: "#a51730", open: "#0e6e53",
  frostOnInk: "#eef3f5", dimOnInk: "#b9c6cd", white: "#ffffff", bandKick: "#ff5c77",
};

const pairs = [
  ["body text — ink on frost", C.ink, C.frost, 4.5],
  ["muted — ink-2 on frost", C.ink2, C.frost, 4.5],
  ["muted — ink-2 on frost-2 (chip hover)", C.ink2, C.frost2, 4.5],
  ["card text — ink on paper", C.ink, C.paper, 4.5],
  ["card muted — ink-2 on paper", C.ink2, C.paper, 4.5],
  ["kicker — sirap on frost", C.sirap, C.frost, 4.5],
  ["kicker — sirap on paper", C.sirap, C.paper, 4.5],
  ["btn — white on sirap", C.white, C.sirap, 4.5],
  ["btn hover — white on sirap-ink", C.white, C.sirapInk, 4.5],
  ["field error — sirap-ink on paper", C.sirapInk, C.paper, 4.5],
  ["closed day — sirap-ink on paper", C.sirapInk, C.paper, 4.5],
  ["band text — frost-on-ink on ink", C.frostOnInk, C.ink, 4.5],
  ["band muted / ticker — dim-on-ink on ink", C.dimOnInk, C.ink, 4.5],
  ["band kicker — #ff5c77 on ink", C.bandKick, C.ink, 4.5],
  ["chip selected — paper on ink", C.paper, C.ink, 4.5],
  ["open line label — open on frost (if ever text)", C.open, C.frost, 4.5],
  ["hero temp chip — white on ink@0.62 over frost", C.white, blend(C.ink, 0.62, C.frost), 4.5],
  ["card flag — frost-on-ink on ink", C.frostOnInk, C.ink, 4.5],
];

let bad = 0;
for (const [name, fg, bg, need] of pairs) {
  const r = ratio(fg, bg);
  const ok = r >= need;
  if (!ok) bad++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${r.toFixed(2)}:1  (need ${need})  ${name}`);
}
process.exit(bad ? 1 : 0);
