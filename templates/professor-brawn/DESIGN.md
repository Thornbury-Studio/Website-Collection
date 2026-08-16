# Professor Brawn Café — redesign notes

Redesign concept for profbrawn.com.sg (Professor Brawn Inclusive Café, a social
enterprise by Autism Resource Centre (Singapore)). All business facts verified
against the live site on 16 Aug 2026; nothing invented. See IMAGE-CREDITS.md
for asset provenance.

## The idea

The brand already owns a wonderful world: a superhero professor crest drawn by
a child on the autism spectrum, house banners on brick, menu sections named
like a course catalogue (Horticulture Studies, Academic Majors, Italian
Electives, Anthropology, Climate Studies), gold cutlery, parchment menus,
magenta counters. The old site hid all of it behind a generic Bootstrap
template. The redesign leans into **"the friendliest faculty in Singapore"** —
a warm collegiate café prospectus — while keeping food first on every page.

Three truths drive every layout, in this order:
1. THE FOOD LOOKS GOOD — real photography leads, dishes above the fold.
2. THE CAFÉ FEELS WELCOMING — parchment warmth, plants, real interiors.
3. THE PEOPLE AND PURPOSE MATTER — the mission is woven through as small
   "faculty" moments (crest seal, staff notes, the origin story), never a
   charity plea. Discovery order: came for food → met the people → understood
   why it matters.

## Pages

- `index.html` — flat-lay hero + instant actions (menu / WhatsApp / directions),
  chef's recommendations, this month's specials, the story teaser, both
  outlets with live open-now status, ordering (GrabFood / Oddle), Art Faculty.
- `menu.html` — the whole menu as a browsable course catalogue built from
  `js/menu-data.js`: outlet toggle (AMK / Tampines), vegetarian filter,
  breakfast window, set-meal arithmetic computed from data, Nutri-Grade on
  drinks, kids' Prodigy menu, dessert, official PDF downloads (live-site URLs).
- `story.html` — 2009 → today timeline (founders' café → 2018 donation of the
  brand to ARC(S) → RI testbed July 2018 → EV bistro Jan 2020 → both closed →
  today's two Pathlight cafés), the mascot origin, E2C job coaches, The Art
  Faculty, Enabling Mark Platinum, press coverage list.
- `visit.html` — both outlets deep: address, hours, WhatsApp, email, parking
  and gate notes, Google Maps directions links, head office. Mobile-first.
- `venue.html` — venue booking: real packages and prices (buffet $55/$65,
  3-course $50, 4-course $60, tea sets $18/$22/$26, wedding sets $88/$68/$68),
  sample menus from the venue PDFs, Cynthia Poh contact, WhatsApp/email CTAs.

## Design system

- Ground: parchment `#FAF4E6` / deep `#F1E5CB`; ink `#33234B` (aubergine).
- Brand: plum `#5B2D86`, berry `#A81C64` (CTAs), brass `#8A6410` (small gold
  text), banner gold `#C9A227` (decorative only), leaf `#2E7D4F` (veg tags),
  navy `#27418F` (enamel-plate rim, used for links on parchment sparingly).
- Dark sections/footer: deep plum `#241536` with parchment text.
- Type: Fraunces (display; collegiate warmth without costume) + Public Sans
  (body/UI). Google Fonts.
- Motifs: pennant-shaped section tags (echo the house banners), double-rule
  "menu card" borders, the monochrome crest as a quiet watermark, a gold seal
  chip reading Smart · Kind · Strong.
- Interactions: reveal-on-scroll with the house failsafe + rescan, sticky
  header with always-visible WhatsApp + Menu, mobile bottom action bar
  (Menu / WhatsApp / Directions), open-now pill computed in Asia/Singapore
  (Mon–Sat & PH 9:00–21:00, last order 20:20, closed Sunday), reduced-motion
  honoured everywhere.

## Photography rules (authenticity)

- Only Professor Brawn's own photography, recovered from profbrawn.com.sg.
  No stock, no generated documentary shots.
- The magenta-counter interiors and `venue-ev-outlet.jpg` appear to show the
  closed Enabling Village bistro → used ONLY in the story/history context,
  never presented as a current outlet.
- AMK gets `pb-outlet-amk.jpg` (confidently AMK). Tampines has no published
  photo anywhere on the live site → its cards use a typographic/crest
  treatment instead of a wrong photo.
- Promo posters (Aug 2026 set) are used as posters, as designed.

## Verified facts that must not drift

- Social enterprise by ARC(S); mission: affordable, good food through an
  inclusive team of different abilities, ages, socio-economic backgrounds.
- Began operations 15 Oct 2009; founders donated brand + know-how to ARC(S)
  in 2018. Mascot created by a child with autism; "smart, kind and strong."
- Outlets today: Ang Mo Kio (5 Ang Mo Kio Ave 10, Pathlight School Campus 1,
  S569739, WhatsApp +65 8129 4029) and Tampines (4 Tampines St 91, Pathlight
  School (Tampines), S528907, WhatsApp +65 8093 7853). RI + EV outlets closed.
- Hours both outlets: Mon–Sat & PH 9am–9pm, last order 8.20pm, closed Sunday.
- Email info@profbrawn.com.sg · venue enquiries Ms Cynthia Poh 9488 4670.
- Ordering: GrabFood + Oddle (links preserved from live site).
- All menu prices subject to 10% service charge + prevailing GST ("++").
