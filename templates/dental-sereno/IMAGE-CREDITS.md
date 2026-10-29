# IMAGE-CREDITS — Sereno Dental

Every photograph on this site is a real photograph under the **Pexels
Licence** (free for commercial use, no attribution required, given here
anyway). Each was previewed at full size before it was chosen, and the
licence was checked on its Pexels page on 2026-10-29 (DARK.md §2). Nothing
is generated, and nothing is taken from the reference site.

Eight photographs. The two treatment rooms, the stool and the man at the
screen are from two photographers' sets of the same navy-and-white clinic,
which is why the rooms read as one place without grading. Sources are
cached at full size under `tools/raw/full/`; `tools/images.json` records
every derived width and byte size. AVIF at quality 58 and WebP at quality
74, no grading.

**One deliberate reuse** (DARK.md §2 asks for the reason to be stated):
the block with the curved stairwell is the one building a visitor has to
recognise, so it appears on the home page's place section and at the top
of the contact page, and nowhere else. No other photograph appears twice.

**On the portraits.** The brief allowed licensed stock portraits or a
typographic list. Round one shipped typographic and the fresh-context
critic named the absence of faces as the largest trust gap on a family
clinic site, so round one placed three licensed portraits; the second
critic judged masked stock faces a weaker answer than real ones and moved
them into one row at the top of the page, which is where they now sit.
They are stock models standing in for invented names, two masked and the
therapist with her mask lowered; a real client replaces them with their
own photographs in the same 4:5 crop. No AI-generated face anywhere. This
is the one page where only real photographs close the gap, and the
hand-off report says so.

| File | Pexels photo · photographer | Used on |
|---|---|---|
| `img/room-*.{avif,webp}` | [6812480](https://www.pexels.com/photo/6812480/) · Pavel Danilyuk — treatment room with a navy chair and a wall clock, cropped 4:5 | `index.html` hero, and the OG card `img/og.jpg` |
| `img/one-*` | [6812461](https://www.pexels.com/photo/6812461/) · Pavel Danilyuk — the second treatment room, chair reclined, cropped 4:5 | `new-patients.html` hero |
| `img/stool-*` | [6812507](https://www.pexels.com/photo/6812507/) · Pavel Danilyuk — navy operator's stool and a mirror, from above | `new-patients.html`, the clinic |
| `img/mirror-*` | [31786500](https://www.pexels.com/photo/31786500/) · Busenur Demirkan — mirror, probe and scalers on grey linen | `treatments.html` hero |
| `img/lim-*` | [4687163](https://www.pexels.com/photo/4687163/) · Polina Zimmerman — a woman in pink scrubs and a surgical mask, cropped 4:5 | `team.html` portrait row, as Dr Celeste Lim |
| `img/pillai-*` | [4269486](https://www.pexels.com/photo/4269486/) · Cedric Fauntleroy — a masked man in scrubs typing at a clinic computer, cropped 4:5 | `team.html`, as Dr Ravin Pillai |
| `img/aisyah-*` | [4269699](https://www.pexels.com/photo/4269699/) · Cedric Fauntleroy — a woman in a surgical cap and scrubs, mask lowered, smiling, cropped 4:5 | `team.html`, as Nur Aisyah |
| `img/block-*` | [36825860](https://www.pexels.com/photo/36825860/) · Kenny Foo — art deco block with a curved stairwell, Tiong Bahru | `index.html` place section and `contact.html` hero (the stated reuse) |
| `img/og.jpg` | Derived: the clock-room photograph beside the wordmark and the hero line, drawn with the site's own typefaces | OpenGraph / Twitter card |
| `img/favicon.svg`, `img/icon-180.png` | Original: a hairline ring with one hand at 45 minutes, the clock from the first-visit section | Favicon, touch icon |

**Removed after the critique rounds** (recorded so nobody re-tries them):
Pexels 3946835 (Andrea Piacquadio; a dentist and assistant over a patient,
faces turned away, the first team-page hero, which the second critic read
as "gloved hands" standing in for the people the page promises), 9062525 (MM Dental; a bright white room that was the first hero,
with a wall radiator under the window, which no Singapore clinic has),
36825859 (Kenny Foo; a Tiong Poh Road block captioned as "two streets
over", which read as an admission that the site had no photograph of its
own building), 5622276 (Gustavo Fring; a gloved hand at the delivery
unit, sourced for the treatments page and never placed).

**Rejected while sourcing:** Pexels 4269265 and 4269268 (a black-and-white
chair that read as a gaming chair), 287237 and 532786 (brown and beige
chairs outside the client's palette), 15613757 and 14235193 (instruments
on black, too dark for a white site), 7800669 and 3952008 (patients'
faces in frame), 17433894 and 38207074 (Tiong Bahru streets with
high-rises dominating the frame), 4687340 and 4687246 (the same model as
4687163, so not a second person), 3881440 and 6627857 (clinicians who
did not fit the names).

Hub thumbnail `../../img/dental-sereno-sm.webp` is a 480×300 downscale of
the home page hero at 1440 px.

## Fonts

- **Source Serif 4** — SIL Open Font License 1.1, © Adobe. Instanced and
  subset here as "Sereno Serif Display"; see `LICENSES.md`.
- **Public Sans** — SIL Open Font License 1.1, © The Public Sans Project
  Authors. Subset and weight-limited here as "Sereno Sans".
