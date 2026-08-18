# Image credits — Professor Brawn Café preview

**No creative asset belonging to Professor Brawn / Autism Resource Centre
(Singapore) is used in this template.**

This template originally shipped built entirely from first-party material
recovered from profbrawn.com.sg. That was replaced wholesale on **18 August
2026** to bring it in line with the client-preview asset rule the rest of the
collection follows: a prospecting preview may use a business's **facts**, never
its **creative work**. Their photography, logo, mascot and brand artwork are
theirs, and winning their business by displaying their own assets back to them
would defeat the purpose of the pitch.

The business name is still used, factually, to identify the business the
preview is for. Nothing imitates their logo, crest, mascot or brand styling.

---

## 1. Photography — licensed Adobe Stock

Thirteen licensed sources cover seventeen image slots through different crops.
Every output matches the **exact pixel dimensions of the file it replaced**,
because the markup carries hard-coded `width`/`height` attributes — changing
them would have reintroduced layout shift. One identical grade pass, warmed
slightly toward the template's parchment ground (`#faf4e6`), so thirteen
photographers read as one café.

| Asset ID | Used for | File(s) |
| --- | --- | --- |
| 367861467 | Battered fish & chips | `fish-chips-*` |
| 840580751 | Steak & eggs | `steak-eggs-*` |
| 523019696 | Vegetarian spaghetti | `veg-spaghetti-*` |
| 313433625 | Hero dish flat-lay | `table-*` |
| 710727425 | Monthly special (lamb) | `promo-lamb-*` |
| 204148163 | Weekday lunch bowls | `promo-bowls-*` |
| 250311612 | Mocktail of the month | `promo-mocktail-*` |
| 387342176 | Café dining room | `amk-dining-*`, `crest-brick-*` |
| 651466993 | Bright dining room | `ev-dining-*` |
| 172168562 | Wood-panelled café interior | `ev-lounge-*`, `banners-*` |
| 310824298 | Café counter, people out of focus | `counter-pano-*`, `ev-counter-*` |
| 695534281 | Table set for a private booking | `chamber-*` |
| 142772444 | Long communal table | `venue-table-*` |

**A first pass used one café source for all four interior slots and the same
room appeared four times down the page** — it read as a stock set instantly.
Three further interiors were licensed so no room repeats.

**Counter shots deliberately keep people incidental or out of focus.**
Professor Brawn is an inclusive café whose team is central to its mission;
a stock photograph of an identifiable barista presented in that context would
imply it depicts their staff. It does not, and the alt text never says so.

**Alt text was rewritten for every replaced image.** The originals described
the client's own photographs — "a table of Professor Brawn dishes", "team
members at a Professor Brawn counter", "purple chairs", a wall reading "A
Social Enterprise". After the swap those were false statements, and false alt
text is worse than none. Each now describes only what its photograph literally
shows, and none claims to depict Professor Brawn's premises, team or plating.

**AI generation was not used.** Licensed photography covered every slot, so the
fallback was never needed.

## 2. Marks — original to this template

| File | What it is |
| --- | --- |
| `crest.svg` | Original shield mark: a PB monogram over a fork and quill, in the template's plum and gold. The fork for the kitchen, the quill for the school campuses the cafés sit on. |
| `crest-mono.svg` | Single-colour silhouette of the same shield, used as a CSS mask for the watermark treatment. |
| `logo.svg` | Original horizontal lockup — the shield plus a type wordmark. |
| `favicon.png` | Rendered from `crest.svg`. |

These replace `logo.webp`, `crest.webp`, `crest-mono.svg` and `favicon.png`,
all of which were the client's registered brand artwork.

**Deliberately not a character mark.** Their mascot is a cartoon professor
drawn by a child on the autism spectrum. It is both protected artwork and
meaningful to the organisation, so it is neither reused nor imitated — the
replacement is a typographic shield that could not be mistaken for it.

## 3. Removed rather than replaced

Some assets cannot honestly be swapped for stock:

| Removed | Why |
| --- | --- |
| `prof-story.webp` | The mascot illustration — a child's artwork. Removed, not imitated. |
| `enabling-mark-300.webp` | The Enabling Mark (Platinum) is a **third-party certification mark**. We cannot reproduce it and must not invent a substitute. |
| `order-grab.webp`, `order-oddle.webp` | GrabFood and Oddle Eats button artwork — **other companies' trademarks**. The partners are now named in plain text, which is ordinary nominative use; their artwork is not reproduced. |
| `opening-pathlight-*`, `opening-ev-*` | Documentary photographs of real opening ceremonies with identifiable guests. Substituting stock would fabricate a record of a real event. The dates survive as text datelines. |

## 4. Still to verify before any production use

- Menu data in `js/menu-data.js` was transcribed from the client's official menu
  PDFs. It is **factual data**, which the asset rule permits, but it should be
  re-checked against the current PDFs before launch.
- The live-site discrepancies recorded in the original audit (closed outlets
  still listed in PDFs, an outdated Tampines photo and alt text) remain worth
  flagging to the client as findings.
