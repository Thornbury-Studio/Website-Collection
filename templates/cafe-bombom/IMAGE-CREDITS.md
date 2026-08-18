# cafe BomBom (Tampines 1) — media provenance & factual sourcing

A **prospective-client preview**, not an authorised production site. The rule
governing every asset:

> **No creative asset belonging to cafe BomBom is used.** No logo, no
> photography, no food or bingsu photography, no graphics, video, illustration,
> promotional artwork, or Facebook/social creative. Their creative work is
> theirs; taking it to win their business would defeat the purpose of the
> pitch. Only publicly available **factual** information is used.

---

## 1. Photography — nine licensed Adobe Stock frames

Licensed **18 August 2026**, all `isGenTech: false` (real photography, not
AI stock), put through one identical grade — a small saturation and contrast
lift with a cool balance, so the set reads as one shoot and the ice reads cold.

| Asset ID | Used as | File(s) |
| --- | --- | --- |
| 296944871 | Hero — strawberry bingsu | `hero-*`, `hero-w-*`, `og-1200` |
| 681685615 | Chocolate bingsu cell | `choc-*` |
| 435192968 | Fruit/mango bingsu cell | `mango-*` |
| 298809091 | Fruit bingsu with sides | `fruit-*` |
| 475646920 | Layered iced latte | `latte-*` |
| 344624385 | Hand holding an iced latte | `hand-*` |
| 326596718 | Macaron strip | `macaron-*` |
| 409982564 | Ice texture band | `ice-*` |
| 532685698 | Condensed-milk pour | `pour-*` |

**Rejected from the shortlist** rather than graded into line: a syrup-drizzle
frame with a cluttered warm background, a second iced latte redundant with the
one kept, and a dense rainbow-macaron grid that read as French patisserie
rather than Korean minimal.

**AI generation was not used for any image.** The brief's asset priority put
real licensed photography first, and it was available and strong, so the
second layer was never needed.

**No image depicts, or is captioned as, cafe BomBom's premises, staff,
customers or exact products.** These are photographs of the *category* —
bingsu, lattes, macarons — chosen to make the offer legible to someone who has
never heard of the business. Every alt text describes only what the photograph
literally shows. There is no fabricated shopfront and no invented interior.

### Built for handover

Every image is a plain `<img>` with `srcset`, explicit `width`/`height` and a
fixed `aspect-ratio` — no CSS background images, no cropping logic, no
layout that depends on a particular photograph. Real cafe BomBom photography
replaces any of these by dropping in files of the same names. Measured layout
shift is **CLS 0**, and it stays 0 with different images because the boxes are
reserved in CSS, not by the files.

### Performance

Measured on an emulated mid-range phone (4 Mbps, 150 ms RTT, 4× CPU slowdown,
cold cache):

| Page | Requests | Transfer | FCP | Load | CLS |
| --- | --- | --- | --- | --- | --- |
| index | 10 | 341 KB | 792 ms | 1.51 s | 0 |
| menu | 7 | 47 KB | 512 ms | 917 ms | 0 |
| visit | 5 | 40 KB | 568 ms | 946 ms | 0 |

Twenty-one WebP variants total 830 KB on disk; nothing exceeds 95 KB. The ice
texture originally exported at 205 KB for a decorative band and was re-encoded
and capped at 900 px — a decorative strip does not get to be the heaviest asset
on a site whose pitch includes speed.

---

## 2. Factual research — sources and dates

Researched **18 August 2026**. Facts only; no descriptive or editorial wording
was reused from any source.

**Verified and used:**

| Fact | Corroboration |
| --- | --- |
| Address `10 Tampines Central 1, Tampines 1, #04-14, Singapore 529536` | Two independent editorial listings agree; mall directory confirms the store |
| Level 4 / unit 14 | Brief + address |
| Hours **daily 11am – 9.30pm** | Two independent sources agree |
| Opened **1 October 2022** | Multiple sources |
| Chain founded **2012 in Daegu**, South Korea | Two sources |
| Singapore outlet is the chain's **first outside Korea** | Editorial coverage of the opening |
| Categories: bingsu, bomcarons, croffles, coffee, lattes, frappes, sodas, yogurt smoothies, cheesecake | Multiple sources |
| "More than fifty drinks" | Later listing (the 2022 coverage said "over 40" — the newer figure is used) |

**Noted discrepancies, deliberately not smoothed over:**

- One aggregator reports **11am–10pm**; two editorial sources report
  **11am–9.30pm**. The corroborated pair is used.
- Chain size is reported as **400+** outlets in 2022 coverage and **500+**
  later. The site therefore says "several hundred", which is true under both.
- Bomcaron flavours differ between sources (Orange and Hojicha appear in one
  listing, Strawberry in another). The five that appear in multiple sources are
  listed as regulars and the rest are described as rotating — which is also how
  the counter actually works.

**⚠ PRICES — INDICATIVE, MUST BE CONFIRMED BEFORE ANY PUBLIC LAUNCH.**

cafe BomBom publishes no price list. Every figure comes from published
editorial coverage of this outlet, and `js/menu-data.js` records the reporting
year against each one in a `src` field.

**Prices have demonstrably moved.** Launch coverage (Oct 2022) reports bingsu
at $7.60; a later listing reports Melon Bingsu at $8.80 and an iced hazelnut
latte at $6.90. The 2022 figures are therefore roughly four years old.

Handling: every figure renders as **"from $X"**, never as a firm price. Every
item with no reported figure renders **"Ask at counter"** rather than carrying
an invented number. Nothing is guessed. All of it sits in one data file, so
replacing the lot with the real counter board is a single edit.

---

## 3. Original work in this template

The wordmark, the mark in the header and favicon, the bento system, the entire
design system, all interface copy and all product descriptions are original to
this template. The business name is used factually to identify the business
being pitched to; no attempt is made to imitate any mark or styling of theirs.

**On Korean text:** the brief asked not to decorate with Korean characters. The
only Korean script on the site is **빙수** (bingsu), shown once beside the
English category name, because it is the actual product name — not ornament.
