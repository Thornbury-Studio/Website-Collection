# cafe BomBom — design notes

Prospective-client preview for the Korean dessert café at Tampines 1, Level 4.
Asset rules, factual sourcing and performance figures: [`IMAGE-CREDITS.md`](IMAGE-CREDITS.md).

## The user this is built for

Someone already standing inside Tampines 1, on a phone, with roughly thirty
seconds to decide whether to go up to Level 4. That person is the whole design
brief. They need, in order: *what is this*, *what should I get*, *what does it
cost*, *which floor*, *is it open*, *how do I get there*.

So the home page answers all six **before the first image**. The eyebrow gives
the floor and unit, the h1 gives the category, the lede gives the provenance,
and the live open/closed pill sits directly beneath — all above the fold on a
375px screen. The bingsu photography starts immediately after. Operational
information is never buried underneath the visual experience, which is the
usual failure of a food site that leads with a full-bleed hero.

A sticky **Menu / Directions** bar sits in the thumb zone on every page. Those
are the only two actions that matter in a mall.

## The pitch

Not "Facebook is bad" — social discovery works fine for them. The point is that
a person who finds them on social has nowhere to *arrive*. A timeline cannot
answer "what does a bingsu cost" in one tap. This site can, and does it in
**47 KB** on the menu page.

## Visual system — a two-temperature bento

The brief offered HOT/COLD, DARK/LIGHT, COFFEE/DESSERT as possibilities. Rather
than decorating with that idea, the grid is built from it:

- cold cells sit on `--frost` and carry bingsu
- warm cells sit on `--cream` and carry coffee
- two `--ink` cells and one `--berry` cell anchor the dark/loud end

**Hierarchy is enforced by span, not decoration.** A page of identical rounded
rectangles is exactly the failure mode a bento brief invites, so: the hero cell
spans the full grid on a phone and becomes 2×2 on desktop; stat cells are small
and typographic with no image at all; the macaron strip is a 3:1 band; and the
scrolling ticker deliberately breaks the grid entirely, running full-bleed
between two bento sections.

The images were exported at deliberately varied aspect ratios (1:1, 4:5, 4:3,
3:1, 3:2, 21:9) because in a bento the pictures have to supply the rhythm. A
grid of squares would have flattened it regardless of the CSS.

Palette: `--snow` / `--frost` / `--cream` surfaces, near-black `--ink`, one
confident `--berry` red. Type is Space Grotesk (geometric, precise, youthful)
over Inter. No serif — that keeps it modern-Seoul rather than European
editorial.

Contrast was solved rather than eyeballed. Two tokens needed work:
`--ink-3 #586069` (6.21 / 5.70 / 5.68 across the three surfaces) and
`--berry #C42239` (5.62 / 5.16 / 5.15, white-on-berry 5.78, so it is safe as a
filled button).

**Korean text.** The brief warned against decorative hangul. The only Korean on
the site is 빙수 beside the English word "Bingsu" — the actual product name,
shown once, in a lighter weight, as a label rather than ornament.

## Mobile first, literally

`css/style.css` has **no `max-width` media query**. Base rules describe the
phone; desktop layers on at 720px and 1040px. The bento is 2 columns on a
phone so the rhythm survives, 4 at 720px, and re-proportions at 1040px where
the hero becomes a 2×2 block with supporting cells beside it.

## Mobile QA

Five viewports — 375, 390, 430, 344 and landscape 844×390 — with
`pointer: coarse` and `hover: none` genuinely emulated (`setDeviceMetricsOverride`
alone leaves those at desktop values and silently disables every touch rule).

Checked: overflow, tap targets, type floor, image slivers and broken images,
reveal completion, sticky bar clearance against `env(safe-area-inset-bottom)`,
drawer open/close with body-scroll locking and scroll restoration, search field
sizing, and a bento-specific assertion that no cell collapses below 120px.

First run: **10/15**, failing the type floor on the home page (eyebrow at
11.84px, where it carries a full address line). Raised the whole label scale
above 12px. Second run: **15/15 clean**.

One defect the automated pass could not catch was found by looking at the
screenshots: several bento cells are `<a>` elements and every caption inside
them was underlined, because `.cell` never reset `text-decoration`. Fixed with
`a.cell { text-decoration: none }`. Worth remembering that a passing harness is
not the same as a correct page.

## Performance

Measured, not asserted — on 4 Mbps / 150 ms RTT / 4× CPU throttle, cold cache:
home 341 KB and FCP 792 ms, menu 47 KB, visit 40 KB, and **CLS 0 on all three**.

Discipline that produced it: WebP throughout at tuned per-image quality, every
image carrying explicit dimensions and `aspect-ratio` (which is what makes CLS
zero), `loading="lazy"` on everything below the hero, `fetchpriority="high"`
plus a `preload` on the hero only, `defer` on all scripts, two font families at
three weights total with `display=swap`, and no framework — the menu page's
entire interactive layer is two small files.

## What the client would decide

- **Real prices.** The most important handover item; the shown figures are
  editorial and up to four years old. One file to change.
- **Real photography.** Deliberately a file-swap, not a redesign.
- Whether to add online ordering. The site currently converts to *visit* —
  menu, price, floor, directions — which is what a mall café actually needs.
