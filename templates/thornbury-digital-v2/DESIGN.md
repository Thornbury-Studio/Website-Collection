# THORNBURY DIGITAL v2 — DETONATION CORE

The studio's own site, rebuilt as a detached, aggressive identity. Void black,
acid lime, cyber magenta, glass. No corporate blue, no sepia, no paragraphs.
Four real pages (`index`, `work`, `studio`, `contact`) that share one persistent
WebGL entity; navigation tweens the camera instead of reloading the document.

## 1 · Deconstruct & critique

What "modern web design" does, and what it costs:

| Cliché | Why it fails | What this build does instead |
|---|---|---|
| Hero → 3 features → testimonials → CTA | Layout is a funnel template; the brand is interchangeable | Four chapters named for what they do to the viewer: STRIKE, FEED, PROTOCOL, TRANSMIT |
| A 3D blob that floats and does nothing | Motion without consequence reads as a screensaver | The entity is an instrument. Cursor **acceleration** detonates it; scroll **velocity** shears it; it re-assembles. Stillness → violence → recovery is the story |
| Fade-up-20px reveals on everything | Same easing on every element flattens hierarchy into noise | Headlines physically decompress on a real variable **width axis** (Archivo `wdth` 62 → 118) while rising out of a mask; blocks get one plain reveal; nothing else fades |
| Gradient wallpaper as "colour" | Colour becomes decoration, so it means nothing | Lime is signal (fracture light, edges, the wipe), magenta is heat (rim, plasma skin, impact vignette). Neither is ever a background |
| Glass cards as ornament | Blur without content behind it is just grey | Glass exists only where copy must be read over the live canvas: the HUD, the process frames, the case panel, the brief form |
| Centered everything | Symmetry is calm; this brand is not | Type pinned to edges and overlapping the entity with `difference`; tiles on a 12-column grid with deliberate offsets and one negative margin |
| Cursor dot for its own sake | Adds nothing the arrow didn't | The ring reads intent (label: OPEN / SEND / CORE), and every interactive element pulls toward it |
| `href` → white flash → re-init | Every page starts the animation from zero | One canvas, one entity; the router swaps `<main>` behind a lime wipe while the camera moves to that page's state |

## 2 · Concept synthesis

**A · Overdrive Organism** — one noise-deformed sphere breathing in the void;
cursor speed inflates the noise; Voronoi cracks glow. Biological, warm, calm.
Rejected: calm is the wrong emotion; it becomes wallpaper in ten seconds.

**B · Signal Storm** — no solid body; sixty thousand GPU particles form the
wordmark through curl fields and blow apart under the cursor. Typographic swarm.
Rejected: it is pretty, and everybody has seen particle text.

**C · Detonation Core** — a black-glass icosahedral core wrapped in a magenta
plasma skin. The skin is a particle layer sampled from the surface; cursor
acceleration detonates it outward with turbulence, then it re-assembles like
filings on a magnet. Scroll delta shears the whole assembly and drives RGB
split in post. Voronoi plates on the core flash lime at detonation.

**Chosen: C.** It has an arc — tension and release — which is what makes an
interaction emotional rather than decorative, and it makes the two brand
colours physical: lime is fracture light, magenta is heat.

## 3 · Architectural map

### Entity (`js/engine.js`, three r180, plain WebGL2 `ShaderMaterial`)

- **Core** — `IcosahedronGeometry(1.25, 48)` (20 on mobile). Vertex: two
  octaves of Ashima simplex (`snoise`, 1.55× and 3.7×), amplitude ×(1 + 2.4·shock),
  a ring ripple `sin(y·18 − t·22)` during shock, and a cursor **dent**
  `−pow(facing, 10)·0.5·push` where `facing = dot(n, uMouseDir)` (the pointer
  unprojected onto the entity's plane, rotated into object space each frame).
  Normals are rebuilt from tangent finite differences (three displacement
  evaluations per vertex) so lighting is correct at any amplitude. Scroll shear
  `x += y·vel·0.32`, `y *= 1 + |vel|·0.22` is applied to all three samples.
- **Fragment** — 3×3×3 **Voronoi** in object space (animated cell centres,
  precision-safe `h33`), `F2 − F1` edges emit lime ×(0.26 + 2.4·shock);
  magenta Fresnel `pow(1 − N·V, 3)`; a Blinn specular at 72; displacement peaks
  glow lime. `uQ` switches Voronoi off on the low tier without a recompile.
- **Skin** — 20 000 `Points` on a Fibonacci sphere (7 000 mobile). Rest
  position follows the first noise octave so they sit on the surface; burst
  moves them `n·b·2.8 + turb·b·1.6` where `turb` is a three-sample noise vector
  and `b = burst·(0.55 + seed·0.9)`. Additive, depth-tested against the core.
- **Void** — NDC quad: lime grid via `fwidth` anti-aliased lines and a dot
  lattice that parallax with the pointer and drift with scroll, a magenta glow
  under the cursor, a slow scan band.
- **Post** — one `WebGLRenderTarget` (MSAA 4 desktop) into a fullscreen pass:
  chromatic aberration `d·(uCA + |vel|·0.01 + shock·0.018)·(1 + 4r²)` plus a
  scroll-directional smear, glitch row slices `step(1 − shock·0.55, h21(row, t))`,
  film grain, scan lines, impact vignette tinted magenta, a lime flash.

### Input model

- **Cursor acceleration** is the trigger, not position. Per frame
  `acc = |Δv| / dt` in viewport-diagonals·s⁻²; impulse
  `max((acc − 18)/90, (speed − 2.6)/4·0.7)` clamped to 1. A slow sweep does
  nothing; a flick detonates. Click/tap = full burst.
- **Scroll velocity** in viewport-heights·s⁻¹, ×0.3, clamped ±1, smoothed
  `1 − e^(−7dt)`. Exposed to CSS as `--vel` / `--vabs` so tiles skew
  (`.dist`) and headings split RGB (`text-shadow` on `.k`).
- **Decays** on true elapsed time: shock `e^(−3.8dt)`, burst `e^(−1.5dt)`
  (slower, so the skin re-assembles after the core has settled), flash `e^(−9dt)`.
- **Quality ladder** samples delivered rAF deltas (skipping > 250 ms so a
  throttled tab can't trigger it); a 120-frame median over 28 ms drops DPR to
  1.25, kills MSAA, halves the skin, and switches Voronoi off. One step, once.

### Views (one entity, four camera states)

| Page | Camera | Entity | Spin |
|---|---|---|---|
| home | (0, 0, 5.4) | centre-right, scale 1 | 0.12 |
| work | (0, 0, 5.4) | far right, back, scale 0.85 | 0.30 |
| studio | (0, 0, 5.4) | centre, scale 1.9 — the plates fill the frame | 0.05 |
| contact | (0, 3.4, 3.6) looking down | low, scale 0.9 | 0.22 |

The router (`js/router.js`) intercepts same-directory `.html` links, fetches
the document, covers the viewport with a lime wipe carrying the page name,
swaps `<main>`, updates title/description/`data-page`, tweens the view with
GSAP `power3.inOut` 1.35 s, reveals, and focuses the new `<main>`. Direct
loads of any page still work; anything unusual falls back to a real navigation.

### GSAP timelines (`js/ui.js`, `js/main.js`)

- **Ignition** (once per session): wordmark chars `wdth` 62 → 125 with a
  0.045 s stagger, the lime line, then chars compress back to 62 and the
  overlay lifts while the core bursts.
- **Kinetic type**: `fromTo` on split chars — `yPercent` 108 → 0,
  `font-variation-settings` `"wdth" 62` → target, letter-spacing 0.02em → −0.04em,
  `expo.out` 1.15 s, 0.016 s stagger — fired once by a ScrollTrigger at
  `top 88%`. A 1.2 s sweep plays anything in-viewport a trigger missed.
- **Magnetic field**: `quickTo` x/y toward the pointer inside a radius of
  half the element plus 56 px; the inner label pulls at half strength; release
  is `elastic.out(1, 0.45)`.
- **Depth parallax**: `[data-depth]` scrubbed from `+d·220` to `−d·220` across
  the viewport (desktop only).
- **Route wipe**: `clip-path: inset()` tweens — `expo.inOut` 0.55 s in,
  0.6 s out — so the label never stretches.

### Fallbacks

`js/boot.js` marks `.js`, `.rm`, `.touch`, and decides whether the intro
plays; a 6 s watchdog folds to `.no-3d` (CSS gradient stage, all type
visible) if the module never reports `TB_READY`. The engine is imported
dynamically, so a blocked CDN still yields a readable, navigable page.
Reduced motion: no intro, no bursts, no shear, no cursor, static type, the
entity drifts at a quarter speed.

## Verification

Chrome DevTools MCP against `http://localhost:8123/templates/thornbury-digital-v2/`
(real frames — virtual-time headless captures freeze eased state). Checked:
console clean, WebGL2 backend live, all four routes swap without reload, the
kinetic reveal reaches its final `wdth`, no horizontal overflow at 320 / 375 /
768 / 1024 / 1440, dialogs open and light-dismiss, the form reaches its sent
state, reduced-motion renders static.
