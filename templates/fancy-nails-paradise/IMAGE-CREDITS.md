# FANCY NAILS PARADISE — media provenance & factual sourcing

This is a **prospective-client preview**, not an authorised production site for
the business. It was built to show the owner what a professional site could look
like, so the rule that governs every asset here is simple:

> **Nothing creative belonging to Fancy Nails Paradise is used.**
> No logo, no photography, no video, no graphics, no illustrations, no marketing
> creative, no website or social-media visual assets. Their creative work is
> theirs, and taking it to win their business would defeat the point of the
> pitch. Only publicly available **factual** information is used.

---

## 1. Photography — all licensed Adobe Stock

Seven frames, licensed through Adobe Stock on **18 August 2026**, graded through
one identical pass (slight desaturation, gentle shadow lift, a whisper of warmth
toward the porcelain page ground) so that seven photographers read as one shoot.

| Asset ID | Used as | File(s) |
| --- | --- | --- |
| 762232141 | Hero — hands on a pale blue surface | `hero-*`, `hero-sq-*`, `og-1200` |
| 417312986 | Full-width band behind the booking copy | `band-*` |
| 407668797 | Service card — Manicure & Pedicure | `s-french-*` |
| 660417449 | Service card — Express | `s-natural-*` |
| 470675687 | Service card — Gel & Gelish, Nail Art | `s-gel-*` |
| 493885939 | Service card — Pedicure | `s-pedi-*` |
| 395489121 | Service card — Extensions | `s-art-*` |

**Deliberately excluded from the shortlist:** two frames with harsh dark or
saturated magenta grounds that broke the soft set, and one isolated-on-white
pedicure frame that read as obviously generic stock. Rejected rather than graded
into line.

**No image here depicts Fancy Nails Paradise, its premises, its staff, its
customers or its work, and none is captioned as if it did.** Every alt text
describes only what the photograph literally shows ("a hand with short, buffed
natural nails"), never "our work" or "our salon". There is no fabricated
interior shot and no invented team photo — deliberately, because those are the
two claims a preview must not make.

**AI generation was not used for any image on this site.** Real licensed
photography was available and strong, so the sourcing order was never exhausted.

### Designed for handover

Every photograph is a plain `<img>` with `srcset`, a fixed `aspect-ratio` and
`object-fit: cover` — no CSS background images, no cropping logic, no
image-dependent layout maths. Replacing the preview photography with the
client's own is a matter of dropping in files of the same names. Nothing in the
design depends on a specific photograph, so the site survives whichever handover
route the client chooses: their existing photos with permission, professionally
edited versions of them, or a new shoot.

---

## 2. Factual research — sources and dates

All researched **17–18 August 2026**. Facts only; no descriptive or editorial
wording was reused.

**Verified and used:**

| Fact | Source |
| --- | --- |
| Name, address `139 Tampines St 11, #01-56, Singapore 521139` | Fresha listing, Waze, editorial listings — all agree |
| Phone `9778 5712` / `+65 9778 5712` | Fresha, editorial listings |
| Hours: **daily 10am–8pm** | Fresha and two independent editorial listings agree |
| Service categories (acrylic, dip powder, gel extensions, gel, manicure, mani+pedi, men's manicure, men's pedicure, nail art, nail extensions, nail polish, pedicure) | The salon's own publicly listed service categories on Fresha |
| Nearest MRT: Tampines West, ~12 min walk | thesmartlocal heartland-nail-salons listing |

**⚠ Prices — INDICATIVE, must be confirmed with the owner before launch.**

The salon publishes no price list of its own. These came from published
Singapore editorial round-ups and are the figures each source states:

| Service | Price | Corroboration |
| --- | --- | --- |
| Express Manicure | $10 | thesmartlocal |
| Express Pedicure | $15 | thesmartlocal |
| Express Gelish Manicure | $25 | thesmartlocal, twice, in two separate articles |
| Manicure | $25 | dailyvanity |
| Pedicure | $35 | dailyvanity |

Sources **disagree** in one place: one round-up lists "Express Gelish Manicure
$25" while another lists a plain "Manicure $25", so it is not certain whether
those are the same item under two names. Every price is therefore rendered as
**"from $X"**, and every service with no corroborated figure renders as **"Ask
in salon"** rather than carrying an invented number. Nothing on this site is a
guessed price.

These are editorial figures of uncertain vintage. **They must be replaced with
the owner's real current price board before this site is shown publicly** —
a wrong price on a live salon site costs the salon money and trust. They live in
one file, `js/services-data.js`, so correcting them is a single edit.

---

## 3. Original work in this template

The wordmark, the nail-shape mark in the header and favicon, the entire design
system, all interface copy and all service descriptions are original to this
template. The salon's name is used factually to identify the business being
pitched to; no attempt is made to imitate any mark or styling of theirs.
