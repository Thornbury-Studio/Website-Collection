# Three's A Crowd — design notes & pitch handoff

Built 18 Aug 2026 as a **cold pitch**: Three's A Crowd has not engaged us and
has licensed us nothing. They run a Shopify store (threesacrowdcafe.com) that
sells pints and cakes well enough — but the café experience around it is where
the preview makes its case. Facts taken, expression not, per
`client-preview-copyright-sg` in project memory.

## The pitch in two sentences

The desserts sell themselves the moment someone sees them — the current site
never really shows them, and keeps the entire in-store menu inside one long
PNG. This preview closes the distance from craving to counter, and rebuilds
the foundation on stricter engineering than the brief's security review found.

## The two-part case

**Customer experience.** Discovery → desire → menu → directions in as few taps
as possible: a fixed mobile quick-bar (Flavours / Menu / Call / Directions), a
flavour board that filters 28 flavours by tier and vegan and searches by
craving, a menu page driven by one data file, a live open/closed pill that
knows Fri–Sat runs later, and a hero that leads with the strongest hook the
café owns — hot waffle, cold scoop.

**Engineering & security.** The brief's internal review flagged a weak
security-header posture on the current site (HTTP Observatory). The preview
does not claim the business is at risk anywhere in its copy — it simply *is*
the stronger implementation:

- CSP with **no `unsafe-inline` anywhere**: `default-src 'self'; img-src
  'self' data:; script-src 'self'; style-src 'self'; font-src 'self';
  base-uri 'self'; form-action 'self'; object-src 'none';
  upgrade-insecure-requests`. Zero inline styles, zero inline event handlers,
  zero third-party requests — fonts are self-hosted latin-subset WOFF2.
- No cookies, no localStorage/sessionStorage, no forms, no secrets — nothing
  client-side to secure badly.
- The JSON-LD blocks are non-executing data (`type="application/ld+json"`),
  outside `script-src`'s executable scope.
- Headers a static page cannot carry in `<meta>` — HSTS,
  `X-Content-Type-Options: nosniff`, `frame-ancestors` (clickjacking),
  `Permissions-Policy`, `Referrer-Policy` as a header — are documented here
  for the host config (Vercel/nginx) at production; `<meta name="referrer">`
  covers referrer policy in the preview meanwhile.
- Performance is part of the same story: system-free font loading (preloaded,
  `display: swap`), responsive WebP everywhere, lazy loading below the fold,
  `fetchpriority=high` on each page's hero only, no JS framework, three small
  hand-written scripts.

## The legal line this build was drawn on

- **Taken (facts):** name as plain text; both outlet addresses (Tampines
  802/#01-11 S520802 primary; 50 Race Course Rd S218562 secondary); hours
  incl. last orders; MRT exits (Tampines West Exit A, Little India Exit E);
  email hi@threesacrowdcafe.com; the full in-store menu with prices from
  their own published Tampines menu graphic; the 28-flavour board with
  tier-derived prices from their live store; free-delivery-over-$89; their
  own halal-certified claim; The Good Crowd parentage; Instagram handle.
- **Not taken (expression):** their logo, photography, menu-graphic design,
  site copy, or social creative. All copy here is written from scratch; the
  three-scoop mark is an original drawing; imagery is licensed stock or
  generated concept work (`IMAGE-CREDITS.md`).

## Design

- **Palette.** Warm milk ground (#FAF4EA), deep cocoa ink (#33241A), burnt
  caramel action (#9E4A16), pistachio secondary (#55683F). The identity IS
  the product physics — every headline can split hot (caramel) against cold
  (pistachio). Deliberately not pastel, deliberately not beige-café: chunky
  Bricolage Grotesque display over Schibsted Grotesk text, a CSS marquee
  ticker (CRISP OUTSIDE · CHEWY INSIDE · HOT WAFFLE · COLD GELATO), evening
  photography because dessert here happens after dinner. All 23 token pairs
  audited ≥ 4.5:1 (worst 4.94:1).
- **Structure.** Four pages: home, flavours, menu, visit. Flavours gets its
  own page because 28 flavours is the brief's "enjoyable to explore" surface;
  it stays readable — plain cards, tier chips, search — not an experimental UI.
- **Honesty mechanisms.** `js/menu-data.js` is the single source of truth.
  Tier prices exist once (TIERS) and every scoop/pint/affogato figure on any
  page fills from it via `data-tier`/`data-kind`; item prices via
  `data-price`. `price: null` renders "At the counter" (House Cake). The
  flavour board says the cabinet rotates rather than promising today's tins.

## Ordering / conversion decisions

- **No WhatsApp.** The brief asks for a WhatsApp journey only if a current
  official channel can be verified. None exists anywhere public — their site,
  menu graphic and listings offer phone, email and the Shopify store. One
  candidate number found mid-research turned out to be a hash inside a
  Shopify script filename (`autosizes-84416378.js`) — exactly why the
  verify-first rule exists. Conversion therefore routes to real channels:
  **Order pints online** (their live store, linked prominently), **Call**
  (6702 0700 — see flag below), **Directions** (Google Maps deep link),
  **Email** (events/hire).
- The "Order pints" CTA links to their existing store on purpose: the pitch
  is "we make your existing machinery work harder", not "replace everything".

## Verified facts and their sources (researched 18 Aug 2026)

| Fact | Source | Confidence |
|---|---|---|
| Tampines address + postal + MRT exit | Their Visit Us page | Solid |
| Hours (Sun–Thu 11–22:30 LO 22:00; Fri–Sat 11–23:00 LO 22:30) | Their Visit Us page; OpenRice matches | Solid |
| In-store menu + all prices | Their published Tampines menu graphic ("2025" edition, fetched from their CDN 18 Aug 2026) | Solid |
| 28 flavours + pint prices + vegan marks | Their live Shopify products.json | Solid — snapshot of a rotating range |
| Tier mapping (pint $16/$20/$22 → scoop $4.50/$5.50/$6) | Menu graphic tiers × store pint prices | Solid |
| Email hi@threesacrowdcafe.com | Their menu graphic | Solid |
| Halal-certified | Their own site (footer mark + events meta) | Their claim, stated as they state it — MUIS directory not independently checked |
| The Good Crowd Pte Ltd, GST 201922892W | Their menu graphic | Solid |
| Free delivery > $89 | Their site banner | Solid |
| **Phone 6702 0700** | OpenRice + FoodAdvisor only — NOT on their own site | **Confirm with client before production** |
| 50RC outlet address + MRT | Their Visit Us page | Solid |

### Confirm with the client before this goes anywhere near live

1. **The phone number** (6702 0700) — two directories agree but their own site
   never publishes it. If they have an official WhatsApp line, the quick-bar
   Call slot becomes the WhatsApp CTA the brief wanted.
2. **Flavour snapshot** — the 28-flavour board mirrors their store on 18 Aug
   2026; it rotates, and the client should own the update cadence (one line in
   `menu-data.js` per flavour).
3. **Halal wording** — repeated from their site; confirm current cert status.
4. **Lasagna availability** and House Cake range vary by day per their menu's
   own "check counter" notes — kept vague on purpose.

## Verification notes

Contrast audited computationally (23 pairs, all ≥ 4.5:1). DOM audit at
320/375/414/768/1024/1280 per page: zero horizontal overflow, one h1, every
image alt-texted, tap targets ≥ 42px, all `data-price`/`data-tier` fills
verified filled. Flavour filters exercised in-browser (Special → 5, Vegan → 2,
search, empty state), menu filters (Waffles → 8, deep link
`#group-savoury`), sheet nav open/close with correct aria. Natural-visibility
headless pass (no forced reveal classes) at 375 and 1280 confirmed reveals
fire on their own, the pill computed the correct SGT day-split state, and the
fixed quick-bar renders inside a real 375×812 viewport. Page weight: home
transfers ~350KB on a phone (hero + 4 lazy cards), fonts 123KB self-hosted;
their current in-store menu PNG alone is ~2MB.
