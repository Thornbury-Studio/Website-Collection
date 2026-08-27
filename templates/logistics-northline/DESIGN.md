# NORTHLINE SYSTEMS — design document

Fictional enterprise showcase: logistics intelligence for manufacturers —
see, predict and reroute global supply chains before delays get expensive.
Business-friendly 3D structure test: practical, premium, conversion-capable.

## The one visual idea

**A living network board.** Not a globe, not a dashboard toy: a tilted
dark instrument plane carrying a dot-matrix world (Natural Earth 110m,
public domain, baked to a 240×120 grid), lane arcs, port/factory nodes,
vessels in motion and two pulsing risk zones. The same catalogue that
draws the scene fills the interface panels, so hovering an exception row
pulses its node and hovering a node highlights its rows. Software, not
cinema.

## Structure (operating room, one dense page)

1. **First viewport** — split: light chrome column (kicker, headline,
   sub, CTAs, four KPIs) beside the full-height dark screen with the
   living map and an exception feed docked on it.
2. **Proof band** — operating scale in mono: TEU in motion, lanes under
   watch, ports modelled, forecast window.
3. **Operations room** — segmented control switching three designed
   consoles: Exceptions, Lane confidence, Reroute planner. All HTML,
   same data, dark screen styling.
4. **Capability modules** — four rows with small inline SVG instruments:
   Visibility, Prediction, Rerouting, Exception monitoring. Concrete
   copy: delay exposure, port congestion, dwell, lane confidence,
   forecast window.
5. **Outcomes** — measured numbers with a methodology footnote,
   integration list (EDI 214/315, AIS, ERP), compliance chips.
6. **Final CTA** — a working session on the buyer's own lanes; short
   form with JS confirmation.

## Visual system

- Light warm-porcelain chrome `#f3f2ee` + ink `#17191b`; instrument
  screens in near-black `#0d1014`. The light/dark split is the identity:
  a control room, not a dark-mode SaaS site.
- Semaphore only: green `#1f9d61`, amber `#b97a0a`, red `#bf3f22` —
  no decorative gradients, no glass, no purple.
- Type: Geist (chrome) + Geist Mono (data, timestamps, chips).
- Hairline tables, status chips, bar-in-cell confidence, event rows.

## 3D rules

three.js 0.180 module via jsdelivr (house CSP pattern), DPR-capped,
paused off-screen, cursor parallax only (no scroll cinematics), reduced
motion honoured, and a full static fallback panel if WebGL/module fails.
Mobile gets fewer dots, no vessels animation cut, and the feed stacked
under the screen — a portable operations brief.

## Credibility rules

No revolution copy. Every claim is a number with a unit and a window.
The fictional client set stays unnamed ("a tier-one automotive OEM").
Compliance chips (SOC 2 II, ISO 27001) as furniture, not headlines.
