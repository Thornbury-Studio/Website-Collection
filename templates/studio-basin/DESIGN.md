# STUDIO-BASIN — port of Thornbury Studio's real flagship build

This is not a new concept invented for this collection. It is a **port** of a
real client project — `Company Website\Thornbury_WebGL_Foundation`, a
Next.js + Three.js/TSL build that went through its own multi-round design and
performance-verification process on its own repo. This file documents the
port decision; see that project's own `DESIGN.md` for the full creative and
technical history of BASIN and the site system (kills, references, phone-gate
evidence chains).

## Naming collision — flagged, not silent

This repo already has three unrelated fictional concepts named "Thornbury
Digital" (`thornbury-digital-v2`, `-v4`, `-v5`) — coincidental same name, no
relation to the real client. To avoid a fourth near-identical "Thornbury"
card on the hub, this template's **slug and hub card title are `studio-basin`
/ "BASIN — Thornbury Studio"**, and the hub card copy says explicitly that it
is not the v2/v4/v5 concepts. The site's own pages still say "Thornbury"
(that's the real client's name) — only the *catalog entry* is disambiguated.

## The port decision

**Decision: hand-port to this repo's own flat HTML/CSS/JS pattern, keeping
BASIN's real TSL/WebGPU shader graph verbatim (transpiled, not rewritten).
Not a Next static export, not a rebuild-in-spirit-only.**

Three options existed:

1. **`next export` / static output.** Rejected. Next's static output still
   assumes Next's own client bootstrap (RSC payloads, router chunks) even
   with zero server features used — it does not produce the "one `index.html`
   + `css/` + `js/`, no bundler" shape this repo requires, and would add a
   large dead-weight JS payload for a page that needs none of it.
2. **Rebuild the hero from scratch in the collection's native idiom**
   (e.g. following `thornbury-digital-v5`'s own canvas2D Thomas-attractor
   as a template). Rejected for THIS task specifically — the brief was to
   **port** the real build and explicitly "not lose BASIN's real behaviour
   (WebGPU/WebGL2 fallback, real performance)." A canvas2D reimplementation
   would be a strictly weaker, different object — throwing away exactly the
   verified TSL shader graph, the CPU-sim/GPU-render split, and the
   phone-measured 60fps that make BASIN what it is. (Convergent-but-separate
   fact worth recording: v5 independently arrived at a Thomas attractor too —
   pure coincidence of two projects reaching for the same chaos-made-visible
   idea, not a shared source.)
3. **Hand-port to flat HTML/CSS/JS, source code carried over as directly as
   possible.** Chosen. The site pages were already close to this repo's
   idiom in spirit (light client interactivity, no server dependency); the
   hero's actual value is runtime behaviour, so that behaviour needed to
   survive intact.

### How the port was actually done

- **`basin-scene.ts` → `js/basin-scene.js`**: transpiled with `tsc
  --target ES2020 --module ES2020` (type-erasure only, zero logic changes),
  then two import specifiers restored to bare `"three/webgpu"` /
  `"three/tsl"` (see below). Diffed by eye against the source; the sim math,
  shader graph, DPR policy, and resize-jitter guard are unchanged.
- **Three.js's WebGPU/TSL build needs an import map**, not a bare CDN URL
  like this repo's other 3D templates (`horology-eon-v2` etc.) use for the
  classic `three.module.js` build. `three.tsl.js` itself does
  `import { TSL } from 'three/webgpu'` internally — a bare specifier that
  only resolves via the npm package's own `exports` map, which a plain
  `<script type="module">` cannot do without help. Fix: an inline
  `<script type="importmap">` in every page's `<head>` mapping `three`,
  `three/webgpu`, and `three/tsl` to the pinned jsDelivr build
  (`three@0.185.1`), matching how three.js's own docs recommend consuming
  the WebGPURenderer from a CDN. Verified working: BASIN renders live via
  WebGPU in a real (non-headless-flag) browser, console clean.
- **`BasinHero.tsx` → `js/basin-mount.js`**: the React state (status,
  perf-meter visibility) became direct DOM writes; the WebGPU-then-WebGL2
  retry logic, the fresh-canvas-per-attempt rule, and the
  scroll-off-screen `IntersectionObserver` pause are all preserved exactly.
- **`app/basin/basin.css` + `app/(site)/site.css` → `css/style.css`**:
  concatenated, with `var(--font-fraunces)` / `var(--font-geist-mono)`
  (next/font indirection) replaced by real family names loaded via a
  Google Fonts `<link>` (Fraunces variable incl. the `opsz` axis, Geist
  Mono) instead of `next/font/google`. One thing the port caught that the
  Next build's route-scoped CSS had silently relied on: the root
  `app/globals.css` reset (`* { box-sizing:border-box; margin:0 }`,
  `a { text-decoration:none }`) is NOT part of `site.css` — it lives at
  the Next app root and applies globally there. Ported explicitly at the
  top of `style.css`; without it every nav link rendered underlined by
  browser default.
- **`Reveal.tsx` / `Marquee.tsx` / `InkCursor.tsx` / `SiteEntrance.tsx` /
  `PerfProbe.tsx` → `js/site.js`**: straightforward vanilla ports (no
  React state — direct class toggles / DOM writes). The marquee is
  **not** a literal port of `Marquee.tsx` (which only duplicates its
  items once, sized for a wide desktop viewport) — it is rebuilt on this
  repo's own **true-loop marquee pattern** from `PATTERNS.md` (runtime
  clone-to-cover-container + detach-before-resize), because the source
  component would visibly run out and reset on narrower viewports.
- **Media**: all real captures and the one generated image carry over
  unchanged from `public/media/` — nothing was regenerated for this port.

### CSP

`script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net` (jsDelivr for
Three.js + the inline import map), `style-src` + `font-src` for Google
Fonts, `img-src 'self' data:`, `media-src 'self'` for the two `.mp4`
captures — same shape as this repo's other 3D templates
(`horology-eon-v2`), extended with `media-src` for video.

## Verified (real browser, not assumed)

- Console clean on all five pages (`index.html`, `work.html`,
  `services.html`, `studio.html`, `contact.html`) — zero errors/warnings.
- BASIN live via WebGPU (`data-status="live"`, canvas present and sized),
  matching the source project pixel-for-pixel in a side-by-side screenshot.
- WebGL2 fallback path exercised (`?forcegl`) against the source build
  before porting; the ported `basin-scene.js` and its retry logic are
  the unmodified source logic, so the fallback carries over.
- `?perf` on-device meter carried over from the source's manual-only
  standing rule (see the source project's own `DESIGN.md` — no watcher,
  no auto-chain, ever, for phone verification).

## Not ported

- The dev-only `/api/phone-perf` endpoint, `?report` auto-chain, and the
  background-watcher measurement harness — all were **deleted from the
  source project itself** as a standing rule (see source `DESIGN.md`,
  "Phone verification is manual"). Nothing to port; `?perf` is the whole
  mechanism, matching that rule exactly.
- Phase 2f/2f-b's density pass (marquee, proof-sheet wall, statement
  panels) and the energy layer (entrance lift, ink cursor, kinetic type,
  scroll-driven parallax) — all ported, since they'd already shipped in
  the source by the time this port was requested.
