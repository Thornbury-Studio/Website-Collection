# AUREON — design record

Recorded from the built pages (2026-08-09), ground truth over intention.

## World

A private golf club's member platform as **the member's engraved ephemera** — locker
plates, bag tags, serials. Everything the club issues (a tee time, a table, a concierge
request) comes back as a numbered, tagged artifact. Five pages: Member Home (`index`),
Book a Round (`book`), My Game (`game`), The Club (`club`), Concierge (`concierge`).
Register: private members' club / luxury hotel; never a sports app.

## Tokens (css/style.css `:root`)

- Ground: `#F7F5F1` warm linen; `#FCFBF9` card; `#EDE9E1` soft stone.
- Ink: `#26272A` graphite; `#5E5C57` secondary; `#6E6B64` faint (≥4.5:1 kept).
- Champagne: `#C2A878` / deep `#A8905F` / light `#EADFC8` — decorative rules, dots,
  selected tints only, never body text. Hairlines `#DFDAD0` / `#EAE6DE`.
- Error (functional only): `#9C4F3B`. No green, no purple, nothing saturated.
- Shadows soft and offset; borders hairline; radii 4–6px.

## Type

- **Marcellus** — inscriptional capitals: headings, plate titles, tag titles, big numerals.
- **Albert Sans** (380–520) — the club's hand: body, UI, controls.
- **Fragment Mono** — serials (`№ 0212`), steps, data labels, times, conditions.

## Components

- **Plate**: card with one champagne top rule (`.plate::before`), Marcellus head +
  mono serial on a hairline. The page grammar everywhere.
- **Tag**: issued artifact — punched hole (champagne ring), engraved title, meta,
  ribbed champagne end. Confirmations render as tags.
- **Chips**: quiet pill actions; `is-done` settles champagne when anticipated.
- **Tee sheet**: day chips + slot grid; taken slots show `———` (names stay private),
  starter's holds disabled. Deterministic availability seeded from the date.
- **The manifest**: sticky folio that writes itself as the form changes; issue button
  gates on completeness.
- **Anticipation row**: post-issue chips — calendar (.ics real download), one-click
  lunch add, guest note to clipboard, conditions.
- **Ledger** (concierge): requests persist with serial + Received state.

## Signature motion (one authored moment)

**Engraving** — confirmation text settles letter-by-letter (`.engrave` spans, 28 ms
stagger). Supporting: busy buttons with spinner + label change, toasts, tag settle.
All honor `prefers-reduced-motion`. No marquee, no scroll-driven motion — the club
does not hurry.

## Data & persistence

`aureon.booking.v1`, `aureon.rsvp.v1`, `aureon.table.v1`, `aureon.requests.v1`.
Member Home reads the last issued booking; greeting and bay availability derive from
the client clock. Charts are value-true (handicap eases downward).

## Imagery

One champagne-mist world in a Gemini reference chain (see img/IMAGE-CREDITS.md):
course master 21:9, lounge, dining, lockers, practice bay, green, recovery room.

## Boundaries

Self-contained multi-page template; shared `css/style.css` + `js/main.js` (modules keyed
by `body[data-page]`), zero dependencies, CSP `script-src 'self'`. Direction contract in
index.html's opening body comment (seed a397e08a).
