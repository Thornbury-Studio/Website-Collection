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

## The ownable device: one coverage map, three jobs

A single top-down car, drawn once in SVG (`js/coverage.js`, 15 paintable
panels + glass), carries the whole site:

1. **Hero (index)** — interactive package comparison: tabs A/B/C light up the
   panels each tier wraps, with a live "8 of 15 panels wrapped" caption. The
   three packages are *seen*, not just listed, within the first viewport.
2. **Services** — the same three coverage shapes side by side, next to a
   film-layer stack diagram.
3. **Tracker & staff console** — the same car becomes the live job map:
   panels being worked on pulse gold on the customer's tracking page and on
   every job card in the console. The marketing device and the product device
   are the same device, which is what makes it feel like one system.

Panel keys are shared between `coverage.js` and the job records in
`store.js` (`areas`), so a job's work areas render on the identical geometry
everywhere.

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

## Facts: confirmed vs deliberately unconfirmed

Confirmed (business card + discovery plan + old brief): registered name,
UEN 202614412G (inc. 01 Apr 2026), the Sin Ming address with both units,
phone 9692 4113, Shawn Chen (Operations Manager), Google Maps link,
the five services, 20+ years shareholder experience, the two divisions.

**Prototype-safe but needing production confirmation:** that 9692 4113 is
WhatsApp-enabled (taken from the card; flagged in the old brief — every
`wa.me` link builds from one constant in `js/ui.js` and `js/contact.js`).

**Shipped as designed "being finalised" states, never invented:** PPF package
names (neutral A/B/C with `Name TBC` chips), prices ("$ —"), inclusions
beyond the coverage split, film brand, warranty terms, opening hours, email.
The dashed gold `.tbc` chip is the single visual for all of these — it reads
as a product state, not a broken slot. The three coverage *shapes*
(front guard / full front / full body) are industry-standard tiers used so the
comparison demonstrates the mechanism; final scope is the client's call.

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
- Functional: tier tabs (5/8/15 panels), tracker lookup (plate and
  dash/case-insensitive job ref, error state), admin advance/note/photo-set,
  and the cross-tab live sync — advance in console, tracker updated in the
  other tab without reload.
- `[hidden] { display: none !important }` shipped after the gate's `hidden`
  attribute lost to `.gate { display: grid }` — the exact trap in
  `headless-verification-traps`.

## If the client engages: launch checklist

1. Confirm PPF package names, prices, inclusions, film brand, warranty —
   replace the `.tbc` states (all in `index.html` + `services.html`).
2. Confirm WhatsApp line; hours + email into `contact.html` and footers.
3. Real workshop photography to replace the licensed stock set (keep the
   grade pipeline in `IMAGE-CREDITS.md`).
4. Vector logo files to replace the card crops and interim favicon.
5. Decide tracker/console future: keep as flat demo for the pitch, or build
   the real backend (auth, job DB, photo upload) per `App Req.docx` scope.
6. Remove `noindex`, add canonical + JSON-LD (`AutoRepair`), move to the
   client's own domain/repo with host security headers.
