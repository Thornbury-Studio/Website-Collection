# SEJUK — handoff

**State: complete except for photography.** Every page, script, style and
test is finished and passing. Fifteen images were never generated because
both Gemini image models returned HTTP 429 for the entire build session.

Anyone with a working image generator can finish this in one sitting.
**Deliberately not in the hub gallery or sitemap yet** — see step 4.

---

## What SEJUK is

An equatorial ice house in Singapore: snow-fine shaved milk-ice in local
flavours (pandan, gula melaka, bandung, chendol, kopi tarik), two rooms,
**pickup only**. The commercial spine is a physical fact — an ice lives
about fifteen minutes — so there is no delivery, pickup slots are computed
from actual shave time, and the whole site speaks in weather.

Full design system, colour tokens, type scale and house rules:
[`DESIGN.md`](DESIGN.md).

---

## What is done

| Area | State |
| --- | --- |
| Pages | `index` · `menu` · `pickup` · `house` · `visit` — all built |
| Ordering | Chit → size/add-ons → outlet → computed slot → ticket, persisted |
| Data layer | `js/catalogue.js` is the single source of truth; **no price, total, ready-time or opening hour is hand-typed anywhere** |
| Service clock | `js/service.js` derives open state, closing lines and pickup slots from real hours minus a last-shave cutoff |
| Behaviour tests | 26/26 passing (`gen/harness/behave.html`) |
| Layout | 0 horizontal overflow, 5 pages × 6 widths (320→1440) |
| Contrast | 18/18 pairs pass WCAG AA, tightest 4.94:1 (`gen/audit-contrast.mjs`) |
| Licensed stock | Ice block, condensation, powder snow — graded and shipped in `img/` |

## What is missing

Fifteen generated frames. Everything else waits on them, including the hub
card, whose thumbnail is cut from the hero.

The page markup already references the final filenames, so the moment the
WebP files exist the site is complete — no HTML changes needed.

**A note on `src/`.** Source assets live in `templates/*/src/`, which the
repo gitignores, so that folder is absent from a fresh clone. The four
licensed Adobe Stock originals therefore did not travel with this commit —
only their graded WebP exports in `img/` did. Their Adobe Stock IDs are all
recorded in [`IMAGE-CREDITS.md`](IMAGE-CREDITS.md) if an original is ever
needed again. Generated PNGs belong in `src/` too, for the same reason:
4K frames should not be committed.

---

## Finishing it — four steps

### 1 · Generate the fifteen frames

Prompts are in [`gen/PROMPTS.md`](gen/PROMPTS.md) — each one is complete and
self-contained, with the target filename in its heading.

**The rule that matters:** every prompt opens with an identical STYLE
paragraph and varies only the subject sentence after it. That verbatim
repetition is the only reason eight desserts read as one shoot instead of
eight stock photos. Do not reword it between frames.

Aspect `1:1` for frames 1–12, `16:9` for 13–15. Save PNGs into `src/`
(create the folder — it is gitignored, which is why it isn't in the repo).

Re-roll any frame that shows lettering (frame 12, the bottles, is the usual
offender) or that drifts off the shared bowl/background.

### 2 · Grade and export

```bash
bash gen/grade.sh gen
```

One identical grade pass for every frame — saturation 0.97, contrast 1.03,
cool balance — then WebP at 800/400 (and 1600/2560 for the wide frames).
Partial batches are fine; the script skips what isn't present.

Then build a contact sheet on the page's own frost ground and **reject
frames that break the set** rather than grading them into line:

```bash
bash gen/grade.sh sheet
```

Record any rejects in [`IMAGE-CREDITS.md`](IMAGE-CREDITS.md), which also has
a placeholder line for per-file model attribution that should be filled in.

### 3 · Re-verify

```bash
bash gen/harness/run.sh measure   # overflow / aspect-ratio / reveal sweep
bash gen/harness/run.sh shots     # screenshots at 375 and 1280
node gen/audit-contrast.mjs       # WCAG pairs
```

The measure pass includes an image-sliver check that only becomes meaningful
once real files exist, so it is worth re-running even though it passed empty.
Behaviour suite: load `gen/harness/behave.html` in headless Chrome with
`--allow-file-access-from-files` (see `run.sh` for the exact invocation).

### 4 · Join the hub

Only after the photography looks right. Two files in the repo root.

**a.** Cut a 960×600 thumbnail from the hero into `img/dessert-sejuk-sm.webp`:

```bash
ffmpeg -i templates/dessert-sejuk/img/hero-pour-1600.webp \
  -vf "scale=960:600:force_original_aspect_ratio=increase,crop=960:600" \
  img/dessert-sejuk-sm.webp
```

**b.** Add this card to root `index.html` alongside the other `.card` blocks:

```html
<a class="card reveal" href="templates/dessert-sejuk/index.html">
  <div class="preview preview--shot">
    <div class="chrome"><i></i><i></i><i></i></div>
    <img src="img/dessert-sejuk-sm.webp" alt="The SEJUK homepage: the words &lsquo;Snow, for the equator.&rsquo; beside gula melaka syrup pouring onto a dome of shaved pandan ice." width="480" height="300" loading="lazy" decoding="async">
  </div>
  <div class="card-body">
    <span class="tag">Dessert / Food &amp; Drink</span>
    <h3>SEJUK&deg;</h3>
    <p>An equatorial ice house selling snow-fine shaved milk-ice in Singapore flavours, pickup only, because an ice lives fifteen minutes. The board sizes and stacks each peak in a sheet that prices itself live; the kopitiam chit that follows you between pages computes its own shave time, and pickup slots are generated from each room&rsquo;s real hours minus the last-shave cutoff.</p>
    <span class="card-foot">
      <span class="card-link">View Template
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M13 6l6 6-6 6"/></svg>
      </span>
    </span>
  </div>
</a>
```

**c.** Add these to root `sitemap.xml` — the four indexable pages only.
`pickup.html` is `noindex` and must stay out:

```xml
<url>
  <loc>https://website-collection-zanezhijies-projects.vercel.app/templates/dessert-sejuk/</loc>
  <changefreq>monthly</changefreq>
  <priority>0.8</priority>
</url>
<url>
  <loc>https://website-collection-zanezhijies-projects.vercel.app/templates/dessert-sejuk/menu.html</loc>
  <changefreq>monthly</changefreq>
  <priority>0.7</priority>
</url>
<url>
  <loc>https://website-collection-zanezhijies-projects.vercel.app/templates/dessert-sejuk/house.html</loc>
  <changefreq>monthly</changefreq>
  <priority>0.7</priority>
</url>
<url>
  <loc>https://website-collection-zanezhijies-projects.vercel.app/templates/dessert-sejuk/visit.html</loc>
  <changefreq>monthly</changefreq>
  <priority>0.7</priority>
</url>
```

Leave `portfolio/index.html` alone — the personal portfolio is hand-curated
and new templates never join it automatically.

---

## House conventions this template follows

Worth preserving if you edit it:

- CSP meta on every page, `script-src 'self'`, **zero inline scripts** and
  zero `style="` attributes in source.
- Reveals gate on a `.js-anim` class added by JS, with a hard-timer failsafe
  and a throttled scroll sweep. Injected markup must call the exported
  `SEJUK.ui.rescanReveals()`. Opacity is a static cut and never lives inside
  keyframes.
- One `h1` per page, every image alt-texted, every input labelled.
- Arithmetic promised in copy is computed from the catalogue, never typed,
  so the promise and the charge cannot drift.
