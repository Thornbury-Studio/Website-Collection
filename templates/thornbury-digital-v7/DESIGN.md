# THORNBURY DIGITAL v7 — OPEN ALL NIGHT

The studio's site as Singapore at closing time. The premise is the honest one:
a website is the only shopfront that never closes. Thornbury builds the ones
worth keeping lit. So the site is a walk: you arrive on a dark street where
one row of shophouses is still glowing, the sign strikes on, and you step
inside a lit kopitiam where the actual selling happens.

## Why this, after v4/v5/v6

- v4 (47) was a paper showroom — flat editorial chrome around framed work.
- v5 (38) was an obsidian void with one accent — the AI-default dark site.
- v6 (61→52) was a pinned desert film — ambient autoplay video, since banned.

v7 refuses all three shapes: the dark ground is never empty (it is a street,
photographed), there is no ambient video anywhere, and the page's light comes
from many temperatures at once — tungsten eaves, fluorescent tube-white,
signage red, hawker-centre teal — the actual palette of Singapore at 3am,
which no previous version touched.

## Two surfaces

1. **The street** (`--soot #0e0b07`, warm asphalt black) — hero and footer.
   Carries the photography and the ignition. Never appears as bare black:
   type furniture or photograph at all times.
2. **The shop** (`--laminate #f0e9d8`, fluorescent-lit laminate) — everything
   between. Menu-board services, real prices, work. Ink `#1a140c`.

Accents are small marks only, never planes, never touching copy:
`--sign-red #e2402b` (the 24-HR pilot dot, chips), `--tungsten #ffc36b`
(glow halos, focus rings), `--jade #1f5e50` (interior tags, tile marks).

## The one motion idea: lights come on

Nothing fades, slides, parallaxes or scrubs. Things are OFF, then they are
ON, the way a fluorescent tube starts: two uneven half-strikes, then hold.

- Load (≈1.25s total): the red pilot dot is already lit → the photograph
  warms up in three abrupt exposure steps (a sodium lamp, not a crossfade) →
  THORNBURY strikes, then DIGITAL → the small furniture snaps on, staggered.
- Scroll: sections strike on once, instantly, via IntersectionObserver.
- Hover: a light goes on (one-step brightness), nothing glides.
- `prefers-reduced-motion`: everything is simply already lit.
- No JS = everything lit (pre-reveal state exists only inside
  `@media (scripting: enabled)`).

Fixed authored states only — on and off. No computed in-betweens, per the
standing v6 lesson.

## Typography

- **League Gothic** (variable, wdth) — the signage voice. Wordmark, section
  signs, menu headers, chips. All caps, tight, huge.
- **Instrument Sans** — the plain-spoken counter voice. Body, captions,
  numbers. Nothing else. Two families, no mono (the receipt-mono chip is an
  AI tell by now).

## Photography (all real, all Singapore, Pexels license)

- Hero: Alec Doualetas — shophouse row at night, one doorway glowing.
  The plate blends left into the soot ground so street and page are one
  continuous dark, with the wordmark set in the darkness. Not a split hero,
  not a background film. Mobile gets its own crop built around the doorway.
- Interior: Alec Doualetas — Maxwell Food Centre at night, teal trusses,
  fans, lit stalls, half the tables still full. Same photographer as the
  hero, so the grade holds without correction.
- Threshold (reserve): Richard L — red Chinatown shopfront, door open.

Full sources in IMAGE-CREDITS.md. No AI imagery anywhere in v1. If a later
section genuinely needs a shot nothing sourceable covers, VIDEO-POLICY.md
applies: plan once, generate once, inspect.

## Facts

The only price anywhere is the real published rate: S$500 promotional /
S$800 fixed. The menu board carries that one honest row; everything else on
the board describes, it does not price. No invented clients, metrics or
testimonials. Local time in the header is the real clock (Asia/Singapore).

## State

Full site: home (hero → shop → work tease → street footer), work, services,
studio, contact; hub card + sitemap registered. After the checkpoint, the
hero→shop transition was rebuilt on Josh's gap report: the standalone
threshold section is gone, the WE'RE OPEN / PUSH decal lives on the hero
itself (always lit, load furniture — never dependent on a scroll strike),
and `.shop` starts at the hero's exact bottom edge (gap measured 0px at
seven viewports, 1366×768 through 2560×1440 and three phones).

Work page shows only true things: PARALLAX and BASIN as live captures of the
actual sites, the client build as a dashed in-the-kitchen ghost (no invented
specifics), and the collection hub as "the shelf". Contact form is front-end
only (chit-style sent state); no invented email/phone anywhere.

Still deliberately open: the phone perf pass (own stage, manual link only),
bounded hover-motion on work cards if ever wanted (VIDEO-POLICY applies).
