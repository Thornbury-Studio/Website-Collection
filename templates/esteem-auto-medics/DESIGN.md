# Esteem Auto Medics — design notes & client-review handoff

Built 28 Aug 2026 as a **client-review prototype** for a real, engaged client
(not a cold pitch): Esteem Auto Medics Pte. Ltd., the automotive workshop at
Sin Ming AutoCare. It supersedes the old draft site in the client's own repo
(`sengchun75-stack/eamworkshop-website`), which stays untouched — this preview
lives only behind this repo's Client Preview gate until the client signs off.
Source brief: `C:\School\Personal\Company\Client\EME\EAM_Rebuild_Discovery_And_Fable_Plan.md`.

## The strategic move

The old site led with accident repair and buried PPF in fifth place; the
client's outreach says PPF is the business priority. This build inverts that:
**PPF owns the first viewport**, and accident repair / claims / spray / servicing
support the trust story ("a full workshop behind the film") instead of
competing with it.

## Packages are vehicle categories, not coverage tiers

**Corrected 29 Aug 2026.** The first pass modelled the three PPF options as
coverage tiers (front / mid / full), which was wrong. The three options are
**vehicle categories**:

| Category | Covers |
|---|---|
| Sedan / Hatchback | Saloons, hatchbacks, compact coupés |
| SUV / MPV | Larger panels, taller doors |
| Sports / Supercar | Complex aero, deep curves, delicate finishes |

**Icon redesign (29 Aug 2026, second pass).** The first icon set (enlarged to
98px so three near-identical wedges would at least be distinguishable) still
read as generic — three copies of the same rounded arch with barely different
roofline curvature. Redrawn from scratch with real proportional differences,
each on a shared 120×46 grid so silhouettes compare fairly:

- **Sedan/Hatchback** — a 26-unit hood into a 22-unit flat roof, fastback
  backlight, one door-shutline tick.
- **SUV/MPV** — a short 6-unit hood into the longest roof plateau (52 units)
  and a near-vertical tailgate — reads instantly as boxy/tall against the
  other two.
- **Sports/Supercar** — a 49-unit hood (nearly double the sedan's) into the
  shortest, lowest cabin, wheels pushed to the extreme ends for a short-
  overhang stance, plus a front splitter lip and a rear spoiler — both drawn
  as strokes that start *on* the main body path rather than floating beside
  it, which is what stopped them reading as debris.

That's what let the icons go back down to a **compact 72×28px** — the size
the client actually preferred — without losing category legibility: the
distinction now lives in hood length, roofline height and wheelbase, not in
icon size.

**Coverage is a separate, orthogonal choice** — front end, high-impact panels,
or full body — and every coverage level is available on every category. The
quote is then a function of exact model, coverage, film brand, paint condition
and fitting work. Nothing in the UI implies a category has a fixed panel count
or maps to a front/mid/rear split.

This split is enforced in the data model: `js/coverage.js` exports `COVERAGE`
(three levels with indicative panel sets), and the vehicle category lives
separately on job records and in the enquiry form. There is no "Package A/B/C"
anywhere in the prototype.

## The ownable device: one coverage map, three jobs

A single top-down car, drawn once in SVG (`js/coverage.js`, 15 paintable
panels + glass), carries the whole site:

1. **Hero (index)** — interactive coverage explainer: tabs switch between
   front end / high impact / full body and the panels light up, with a caption
   naming what that level protects. Coverage is *seen* in the first viewport;
   the vehicle categories are the package cards directly below.
2. **Services** — the same three coverage shapes side by side under a
   "coverage levels — choose on top of your vehicle category" caption, beside
   the category pills and the film-layer stack diagram.
3. **Tracker & staff console** — the same car becomes the live job map:
   panels being worked on pulse gold on the customer's tracking page and on
   every job card in the console. The marketing device and the product device
   are the same device, which is what makes it feel like one system.

Panel keys are shared between `coverage.js` and the job records in
`store.js` (`areas`), so a job's work areas render on the identical geometry
everywhere.

## Spray paint visualiser (`js/paint.js`)

A consultation aid for the Level 4 spray division, showing the workshop does
full colour changes, not just repair paint.

**The subject is a body panel, not a car.** A first attempt drew a side-profile
car; it read as a cartoon configurator and cost the page credibility, so it was
replaced with a **full-bleed crop of a curved panel under booth lighting** —
which is what a painter actually assesses a colour on. The crop runs off every
edge on purpose: an outlined panel floating in the frame reads as a
lozenge-shaped object, while a crop reads as a section of a much larger car.

Curvature is carried by the surface, not the silhouette:

- a **character crease** splits the panel into an upper plane angled toward the
  ceiling and a lower plane falling away from it, each with its own gradient;
- **ceiling strip reflections** are drawn twice — a wide halo and a tight core —
  because that pairing is what separates a wet clearcoat from a chalky one;
- **metallic flake** is greyscale fractal noise blended over the coat;
- a **panel shut line** at the trailing edge says "body panel", not "swatch";
- a booth **vignette** keeps it lit from above rather than evenly flooded.

Selecting a finish lays the new coat down behind an SVG mask whose gradient
rect is animated on rAF, so the boundary **feathers like spray** instead of
snapping like a background swap. A spray fan rides the leading edge with a
wet-edge flash just behind it, and a booth light travels the fresh clearcoat
once the coat lands. Finish is a look, not just a colour: each carries `sheen`
and `flake` values, and sheen also drives the strip blur — so satin black
scatters the ceiling strips wide and matte while pearl white holds them tight.
`prefers-reduced-motion` swaps instantly.

Still deliberately **drawn, not photographic** — it shows the finish family
honestly rather than implying a render of the customer's own car. Both
placements carry a concept-preview disclaimer; the fuller one states that
colour is confirmed against a sprayed test card under booth light.

- **Homepage** — compact teaser (four finishes, icon-only swatches) in the
  supporting-services band, linking through to the full tool.
- **Services `#colour`** — full interaction: six finishes with names and
  finish specs, larger stage, full disclaimer.

**Performance note:** the flake must be rendered into a 128px `<pattern>` tile.
Running `feTurbulence` across the whole 900×300 panel re-rasterises on paint
and is far too expensive; the tile is cached and repeated instead.

## Live customer/admin prototype (frontend-only, by design)

`js/store.js` is one client-side store (localStorage + CustomEvent + the
cross-tab `storage` event) with four seeded jobs. `track.html` reads it;
`admin.html` writes it. Advancing a stage or posting a note in the console
updates the owner's tracking page in another tab in real time — the exact
"admin updates flow to the customer" concept the client asked about,
demonstrated with zero backend. The console gate accepts any staff ID/PIN:
it is scene-setting for the prototype; real authentication is a launch task
on the client's infrastructure (per the discovery plan: no production backend
in the first pass).

Sample plates (SGX1234A etc.) are deliberately generic-but-plausible; the
tracker offers them as one-tap chips so the client can explore without typing.

## Brand: anchored to their card, not a template look

The client's business card (supplied 28 Aug 2026, in `src/`) sets the world:
**black / gold / chrome**, tagline **"Quality Care, Every Mile"**, and the
two-division structure — Esteem Auto Medics Pte Ltd on Level 1 (#01-14/15),
Auto Medics Spray Painting Pte Ltd on Level 4 (#04-01). All three appear on
the site; the division logos are cropped from the supplied artwork and sit on
dark via `mix-blend-mode: screen`.

- Tokens: ground `#0B0B0C`, ink `#F4F1EA`, gold `#D9A441`/`#F0C36A`,
  every pair audited ≥ 4.5:1 (worst pass 4.96 after `--dim` was lifted).
- Type: **Archivo variable** (one file, 90 KB, wght+wdth axes) — condensed
  heavy italic uppercase for display, echoing the card's wordmark, normal
  width for body; **IBM Plex Mono** 400/500 for the operational voice
  (plates, stages, labels, prices). All self-hosted.

**Logo crop fixed (29 Aug 2026).** `logo-eam.webp` (header/nav) was cropped
tight enough that the bottom of the "EAM" letterforms and the wrench glyph
were clipped in the shipped file itself — not a CSS/container issue, the
pixels were missing. Re-cropped from `src/card-eam-business.jpg` with a full
margin below every letter's lowest point before the tagline begins; the
tagline variant (`logo-eam-full.webp`, footer/gates) got the same treatment
with margin below "QUALITY CARE, EVERY MILE" too. New aspect ratio is 2.08:1
(was 2.4:1) — every `<img>` referencing either file had its `width`/`height`
attrs updated to match, so there's no layout shift.

## Facts: confirmed vs deliberately unconfirmed

Confirmed (business card + discovery plan + old brief): registered name,
UEN 202614412G (inc. 01 Apr 2026), the Sin Ming address with both units,
phone 9692 4113, Shawn Chen (Operations Manager), Google Maps link,
the five services, 20+ years shareholder experience, the two divisions.

**Prototype-safe but needing production confirmation:** that 9692 4113 is
WhatsApp-enabled (taken from the card; flagged in the old brief — every
`wa.me` link builds from one constant in `js/ui.js` and `js/contact.js`).

**Shipped as designed "being finalised" states, never invented:** per-category
pricing ("$ —"), film brand, warranty terms, exact inclusions, opening hours,
email. The dashed gold `.tbc` chip is the single visual for all of these — it
reads as a product state, not a broken slot. The three coverage levels are
described as what we'd talk through at a walk-around, with the exact panel
list explicitly agreed before film is cut; the indicative panel sets on the
map demonstrate the mechanism, and final scope is the client's call.

No reviews, no testimonials, no year-opened claim, no invented specifics.

## Security posture

Static pages, no server, nothing stored: CSP on every page with
`script-src 'self'`, **no `unsafe-inline` anywhere** (zero inline scripts,
zero `style=` attributes), self-hosted fonts, `img-src 'self' data:`.
`frame-ancestors` intentionally omitted from the meta CSP (browsers ignore it
there) — set it in host headers at production along with HSTS etc.
All pages `noindex, nofollow` and absent from `sitemap.xml` while gated.
The contact form composes a `wa.me` deep link client-side; nothing is
transmitted or stored.

## Verification (28 Aug 2026, chrome-devtools harness over localhost)

- Zero horizontal overflow on all 5 pages × 320/360/375/390/414/768/1024/1280,
  measured **with rendered state** (tracker with a job open, console past the
  gate) and with no `overflow-x: hidden` masking. Three real bugs found and
  fixed this way: the tracker's non-wrapping lookup row, the contact
  `<select>` inflating its grid column, and the photo-doc tiles'
  aspect-ratio transferred min-size.
- Contrast audited computationally on live computed styles (26 pairs).
- Exactly one `h1` per page, no heading-level jumps, every image alt-texted
  with intrinsic dimensions, every input labelled, no dead anchors.
- Functional: coverage tabs, tracker lookup (plate and dash/case-insensitive
  job ref, error state), admin advance/note/photo-set, and the cross-tab live
  sync — advance in console, tracker updated in the other tab without reload.
- `[hidden] { display: none !important }` shipped after the gate's `hidden`
  attribute lost to `.gate { display: grid }` — the exact trap in
  `headless-verification-traps`.

### Second pass (29 Aug 2026) — categories + visualiser

Re-ran the full battery after the corrections. All 5 pages × 9 widths
(320→1440) at zero overflow **in rendered state**, and additionally asserted
nothing sits inside the 24px left gutter. Twelve new colour pairs audited
(worst 5.26:1). One `h1` per page, no heading jumps. No JS errors on any page
after exercising swatches, coverage tabs, tracker lookup and the console gate;
all 19 `wa.me` links across the site assert against the verified number.
Cross-tab sync re-verified on the new Supercar job.

Three real bugs found and fixed in this pass:
- **`.svc-detail` silently killed `.wrap`'s gutter.** Both classes sit on the
  same element and `.svc-detail { padding: 72px 0 }` won on source order, so
  every services section ran flush to the screen edge on mobile. Invisible to
  an overflow sweep — copy at `left: 0` overflows nothing. Now caught by a
  gutter assertion, not just a width one.
- **Paint swatches were 35px tap targets** on the compact teaser; icon-only
  swatches now pad to 44px, and `.btn--sm` gets a 44px floor under 900px since
  the per-category CTAs are the main phone conversion.
- **The mist plume was clipped by the cropped viewBox**, giving a soft
  gradient a hard rectangular top edge. Repositioned inside the window.

Known and left alone: footer link rows are ~16px tall on mobile. Pre-existing
across the template, and fixing it properly means restructuring the footer —
worth doing before launch, out of scope for a content correction.

### Third pass (29 Aug 2026) — panel visualiser + category labels

Categories relabelled to Sedan / Hatchback, SUV / MPV, Sports / Supercar, and
the car illustration in the visualiser replaced with the panel crop described
above. Store key bumped to `eam-jobs-v3` (older blobs are removed on load) so
no reviewer sees stale category names.

Re-verified: 5 pages × 9 widths (320→1440) at zero overflow in rendered state
with the gutter assertion, no JS errors after exercising swatches, coverage
tabs, tracker lookup and the console gate, one `h1` per page with no heading
jumps, every WhatsApp link asserted against the verified number, and the
cross-tab console→tracker sync re-confirmed on the Sports / Supercar job.
Performance traced at 6× CPU throttle: LCP 706 ms, CLS 0.00.

Two verification notes worth keeping:
- **The contrast probe was lying about translucent chips.** Reading
  `backgroundColor` and taking the first three channels treats
  `rgba(217,164,65,0.13)` as opaque gold, which scored the gold-on-gold-ghost
  category pill at 1.36:1 — an alarming false failure. Compositing the alpha
  stack down to the page ground first gives its real 9.89:1. Any future audit
  of this template must composite, or it will chase phantom failures on every
  `--gold-ghost` chip.
- **rAF frame counts from this harness are meaningless** — the driven window is
  occluded, so it reports ~2 fps even with the element under test hidden. It
  briefly looked like the visualiser had tanked the page. Use a performance
  trace for real numbers; the flake tiling fix above came from reasoning about
  filter cost, not from that probe.

### Fourth pass (29 Aug 2026) — logo crop, category icons redrawn

**Header/footer logo was clipping the letterforms.** Not a CSS bug — the
shipped `logo-eam.webp` was cropped tight enough that the bottom of "EAM" and
the wrench glyph were cut off in the file itself. Re-cropped both logo assets
from the source business card with real margin below every letter. Category
icons redrawn per the note above the checklist, back down to a compact 72px.

Re-verified: 5 pages × 9 widths at zero overflow, no JS errors, logo decodes
at its new 880×422 intrinsic size on every page that references it, the
sports-car splitter/spoiler render connected (not floating) at both card and
zoomed scale, and the console→tracker cross-tab sync re-confirmed (advanced
the sedan job from "Film cut & fitted" to "Curing & edge seal" in the console,
confirmed it landed on the tracker in a separate tab).

## If the client engages: launch checklist

1. Confirm per-category PPF pricing, exact inclusions, film brand and warranty
   — replace the `.tbc` states (all in `index.html` + `services.html`).
   Confirm too whether coverage naming should match the workshop's own terms.
2. Confirm which paint finishes the spray division actually offers, so the
   visualiser's six swatches match reality (currently a representative set).
2. Confirm WhatsApp line; hours + email into `contact.html` and footers.
3. Real workshop photography to replace the licensed stock set (keep the
   grade pipeline in `IMAGE-CREDITS.md`).
4. Vector logo files to replace the card crops and interim favicon.
5. Decide tracker/console future: keep as flat demo for the pitch, or build
   the real backend (auth, job DB, photo upload) per `App Req.docx` scope.
6. Remove `noindex`, add canonical + JSON-LD (`AutoRepair`), move to the
   client's own domain/repo with host security headers.
