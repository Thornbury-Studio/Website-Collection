# A&E Unisex Salon — design notes & pitch handoff

Built 19 Aug 2026 as a **cold pitch** in *client-preview default mode*: fast to
understand, believable, mobile-first, cheap to produce. Not a flagship
showcase. A&E Unisex Salon has not engaged us and has licensed us nothing;
facts taken, expression not, per `client-preview-copyright-sg` in memory.

## The pitch in one line

They have traded since 2000 and have **no website at all** — just scattered
directory entries, a 232-follower Facebook page and a Google listing. This is
one page that owns their name and makes them easy to find, understand, contact
and visit.

## Scope decision: one page, on purpose

The brief allowed more pages; the business does not need them. A neighbourhood
salon has one customer journey — *search → what do they do → are they open →
how do I get there → contact* — so the whole thing is a single document with
anchor navigation. No invented pages to inflate the apparent job size.

## Cost discipline (what makes this a "default mode" build)

- **No AI image generation. No video.** Six licensed Adobe Stock free-tier
  photographs covered every slot. Credits spent on generation: **zero**.
- **One self-hosted variable font** (Plus Jakarta Sans, 26 KB) serving all five
  weights — no second family, no third-party font request.
- **~90 lines of JavaScript**, no framework, no build step.
- **Mobile critical path: 92 KB across 6 requests.** Whole template on disk,
  including every responsive variant and the OG card: ~406 KB.

## Design

- **Palette.** Warm sand ground (#F7F4EF), deep charcoal-teal ink (#1E2A2C),
  one confident teal accent (#0F6157). Teal was chosen deliberately: the salon
  is *unisex*, and the obvious salon defaults (blush pink, or barber-black-and-
  gold) both gender the page. Teal reads professional and neutral, and the warm
  sand keeps it welcoming rather than clinical. All 17 token pairs audited
  ≥ 4.5:1 (worst 5.11:1).
- **Restraint is the brief.** No parallax, no marquee, no big motion — a
  neighbourhood salon that looks *established and cared for* is the goal, not
  one that looks like an agency demo. Reveals are a single 16px fade-up.
- **Structure.** Hero (with the two conversion actions immediately visible on a
  phone, above the image) → trust strip → services → the salon → hours &
  location → booking band → footer. A fixed Call / WhatsApp / Directions bar
  sits at the bottom of every mobile screen.

## Conversion

Three verified channels, nothing invented:

- **WhatsApp 8898 1794** — their own Facebook page intro invites calling or
  WhatsApp for booking. Read directly in-browser at the source, not from a
  search-engine summary. Wired as `wa.me/6588981794` with a natural pre-filled
  message; the pricing note uses a second, differently-worded prefill.
- **Call 6787 0857** — Google Maps, their Facebook page, and directories.
- **Directions** — Google Maps deep link.

There is **no online booking system**, so none is implied.

## Verified facts and their sources (researched 19 Aug 2026)

| Fact | Source |
|---|---|
| Blk 915 Tampines Street 91, #01-47, Singapore 520915 | ACRA/OpenGov, Google Maps, their Facebook page — all agree |
| Registered 14 April 2000, sole proprietorship, status Live, UEN 52917688B | ACRA/OpenGov |
| SSIC 96021 hairdressing/personal grooming + 47721 retail | ACRA/OpenGov |
| Phone 6787 0857 | Google Maps + Facebook + directories |
| WhatsApp 8898 1794 | Their Facebook page intro (read at source) |
| Mon–Fri 10.00–20.00, Sat & Sun 09.30–19.00 | L'Oréal Professionnel salon finder + directories; Google showed "Closes 8 pm" on a Wednesday, consistent |
| Haircuts, colour, hair care, styling | L'Oréal Professionnel salon-finder listing |
| Listed on the L'Oréal Professionnel salon finder; L'Oréal academy class post 26 Sep 2024 | L'Oréal + their Facebook |
| Under 400 m from Tampines West MRT (DT31) | HDB/property listings for Blk 915 |
| Unisex; Google category "Beauty salon", Facebook category "Barber's" | Google + Facebook |

### Deliberately NOT on the page

- **Prices.** None are published anywhere. Instead of inventing a price list,
  the services section says pricing depends on length and service and the team
  quotes before starting — which converts the gap into a WhatsApp prompt.
- **Stylist names.** A search summary mentioned "Alex and Esther" (and the
  tempting reading that A&E = Alex & Esther) plus a "customers since 2003"
  line. Neither could be confirmed at source, so neither appears.
- **The Google 4.4 rating.** Real as of 19 Aug 2026, but Google's limited view
  did not expose the review count, and a bare star figure with no denominator
  is weak trust signalling that also goes stale. The trust strip uses the
  ACRA-verified 26 years instead. Available to add if the client wants it.
- **"Walk-ins welcome", capacity, staff count, specific colour techniques,**
  or any "best in Tampines" claim.
- **A canonical URL / JSON-LD `url`.** No domain exists yet; a placeholder
  domain would assert something false, so both are omitted.

## Local search foundation

Semantic single-`h1` document with a sensible h2/h3 outline (verified no
heading-level jumps), a descriptive title and meta description naming the
street and service, `HairSalon` JSON-LD carrying the full postal address,
telephone, founding date, `areaServed`, both opening-hours specifications and
four `makesOffer` service entries. The page is `noindex, nofollow` while it is
a preview and is deliberately **not** in `sitemap.xml`; indexing is a switch to
flip if they engage and it goes live on their own domain.

## Security posture

Appropriate to the actual architecture — a static page with no forms, no
cookies, no storage, no third-party requests and no secrets:

- CSP with **no `unsafe-inline`**: `default-src 'self'; img-src 'self' data:;
  script-src 'self'; style-src 'self'; font-src 'self'; base-uri 'self';
  form-action 'self'; object-src 'none'; upgrade-insecure-requests`. Zero
  `style=` attributes and zero inline handlers, verified.
- `frame-ancestors` is intentionally **not** in the meta CSP — browsers ignore
  it there (it logged a console error, which is why it was removed). It belongs
  in the host response headers, along with HSTS,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy` and a
  `Permissions-Policy`, at production.

## Verification notes

Contrast audited computationally (17 pairs, all pass). DOM audit at
320/360/375/414/768/1024/1280: zero horizontal overflow, exactly one `h1`, no
heading-level jumps, every image alt-texted with intrinsic `width`/`height`
(no layout shift), every tap target ≥ 44px, no dead anchors, and every `tel:`,
`wa.me` and Maps link asserted against the verified numbers. Natural-visibility
headless capture (reveals never forced) at 375 and 1280 confirmed reveals fire
on their own and the live pill read "Open now · till 8pm" with Wednesday
highlighted in the hours table. Console is clean on a fresh load.

**One issue found and fixed during QA:** on landscape phones the 60px action
bar consumed a sixth of a 360px-tall viewport. It now collapses to a compact
44px row (icon beside label) under `(orientation: landscape) and
(max-height: 460px)`, with the body padding tracking it — verified at 740×360
and 667×375. Hiding it was rejected: below 860px the header CTA is hidden, so
the bar is the only persistent way to call.
