This project inherits C:\School\Personal\Company\DESIGN-SYSTEM\DARK.md (relative: ../../../../DESIGN-SYSTEM/DARK.md). Below are this project's own tokens and brand-specific rules.

# DESIGN.md — Circle Take

Dark engine. Built 2026-11-03.

## 1. Overview & identity

**Circle Take** is a Singapore wedding film studio. On a film set's camera
report, the take the director wants kept is circled; a wedding gives you one
take, and the studio's job is to make sure it is the circled one. The line
is "You only get one take." (A web search on 2026-11-03 found wedding film
businesses called One Take in Delhi and Italy, none in Singapore, and no
business at all called Circle Take; the working title was changed to avoid
the collision.)

**The one idea: the page is the edit.** A single 34-second film, cut from
seven real 4K clips of one wedding under one grade, sits fixed behind the
page. Scrolling is the playhead. Each cut in the film starts a section, so
the film's timeline (the reel at the bottom of the screen) is also the
page's navigation: click a cut and the page shuttles through the film to it.
A timecode in the header counts the way an edit suite does (01:00:00:00,
frames at 24 fps). Every motion graphic serves that idea and nothing else:
the slate, the timecode, the playhead, the cut markers, and the grease-pencil
circle that marks the current take.

| Cut | Starts | Shot | Section |
|---|---|---|---|
| 00 | 0:00 | the dress, waiting under the arch | Slate (hero) |
| 01 | 3.5 s | shutters thrown open | Films |
| 02 | 8.5 s | the walk to the aisle | How a day is covered |
| 03 | 14.0 s | the first look | Backup: recorded twice |
| 04 | 19.0 s | the recessional, petals | Prices |
| 05 | 24.0 s | the toast | Delivery dates |
| 06 | 29.0 s | through the car window | Enquire |

**The unstated need (DARK.md §1a).** A couple booking a once-only day is
afraid of three things: a missed moment, a price they cannot see, and a film
that never arrives. Each has its own cut: "Nothing gets filmed twice, so
everything is recorded twice" (two cameras, dual cards, two audio sources,
two drives, a third shooter on call); a price table with real ranges and
what moves them; a dated delivery list counted from the wedding day.

## 2. Colors

| Token | Hex | Use | Contrast on #0d0b09 |
|---|---|---|---|
| black | `#0d0b09` | page, film leader | — |
| panel | `#13110e` | fields, price table | — |
| ink | `#efe7da` | headings, body on dark | 16.0:1 |
| ink-2 | `#b1a796` | secondary copy, ledes | 8.3:1 |
| ink-3 | `#8a8174` | mono labels only | 5.1:1 |
| mark | `#ee5d3c` | grease pencil: circles, timecode label, cut labels, playhead, focus ring, primary button | 5.9:1 |
| mark-text | `#ff8a6e` | the same pencil when it is small text over film: cut labels, times, ×2, "most couples book this" | 8.5:1 |
| on-mark | `#160805` | text on the mark button | 5.9:1 on mark (7.4:1 on hover `#ff7556`) |
| error | `#ff8a6e` | form errors | 8.5:1 |

Text over film always sits on dark ground, checked against the real pixels
in screenshots (2026-11-04), not against the CSS: on desktop the scrim holds
0.9 across the text column before it fades; on phones every word, the hero
included, sits on a ground that fades in 56–60 px above the first line, so
the film shows above the copy and never behind it. The dress in the hero
used to sit under the intro paragraph (3.4:1); it is now 7.9:1.

## 3. Typography

- **Archivo** (variable, width 62–100, weight 300–800, 31 KB subset). Width
  is the expressive axis: the h1 and h2 are condensed (62–66%) and heavy,
  body is normal width. No second display face.
- **IBM Plex Mono** 400 for everything an edit suite would print: timecode,
  cut labels, slate field names, times of day, table headers.
- h1 `clamp(3.4rem, 1.4rem + 7.4vw, 9.4rem)`, line-height 0.86. h2
  `clamp(2.3rem, 1.3rem + 2.9vw, 4.3rem)`. Body 17 px / 1.6.

## 4. Layout & spacing

- Desktop: one text column on the left (`min(540px, 40vw)`, prices
  `min(860px, 58vw)`), the film owning the right. Each section opens with
  42vh of film before its panel, so every cut gets screen time.
- Phones (≤ 900 px): the film is a 9:16 crop made per shot around the
  subject (`PX` in `tools/film.sh`), each section opens with 78svh of film,
  and the panel fades up out of it on a near-solid ground. The price table
  becomes three stacked package blocks (≤ 700 px).
- The cut points on the page are measured, not fixed: a cut lands when its
  panel rises into the lower fifth of the screen (`measure()` in
  `js/edit.js`).

## 5. Elevation & depth

Depth is the film itself. No shadows, no glass. Two bands keep copy from
running through chrome: the header turns solid once scrolled, the reel
sits on a dark gradient band. A static SVG grain (7%) sits over the film.

## 6. Components & states

- **Reel** — seven clips sized by shot length; mark-coloured progress line
  per clip; the current clip's label is circled (SVG stroke drawn in 0.6 s);
  a playhead with the mark triangle. Links are real anchors; with JS they
  shuttle through the film and then focus the section heading.
- **Slate** — the hero's production slate (Prod / Roll / Scene / Take). The
  take number is circled on load.
- **Price table** — an edit-decision-list style table; Full Day column
  tinted and labelled "Most couples book this".
- **Enquiry** — names and date required, inline errors with `role=alert`,
  builds a WhatsApp message (`wa.me`) and keeps the mailto link in sync.
  Nothing is sent by the page itself.
- **Films page** — five rows, poster first; a six-second muted preview
  loads only on the button (or hover with a mouse), pauses off screen.
- **Focus** — 2 px mark outline, 3 px offset, everywhere.

## 7. Weight and the film ladder

| File | Size | Who gets it |
|---|---|---|
| `video/edit-p720.mp4` | 6.0 MB | phones held upright (9:16 crop) |
| `video/edit-720.mp4` | 7.7 MB | small landscape screens, Save-Data, 2G/3G |
| `video/edit-1080.mp4` | 15.5 MB | most desktops and laptops |
| `video/edit-2160.mp4` | 44.5 MB | ≥ 1680 CSS px wide and ≥ 2880 device px, a link not measured under 5 Mbps |

All H.264 High, 24 fps, no B-frames, GOP 8 (1080/720) or 4 (2160): the page
seeks on every scroll frame and a seek costs up to one GOP of decoding.
The film is fetched whole into a blob after the first view (phones: on the
first touch or scroll, or 3.5 s after load; desktops: 1.5 s after load), so
every seek is local. Until it is ready, the cut's own still stands in.
`?rung=2160|1080|720|p720` pins a rung for testing.

## 8. Do's and don'ts

- **Do** move the cut points in `tools/film.sh` and `SHOTS` in
  `js/edit.js` together; the printed "Cut 0n · 01:00:…" labels are baked
  from `SHOTS` at runtime, so they follow.
- **Do** keep every clip from one wedding in the edit. A cut to a different
  couple breaks the one-film idea.
- **Don't** add AI-generated footage or stills of any kind, or a second
  moving thing on the page. The film is the motion.
- **Don't** name the people on screen or attribute quotes to them (Pexels
  licence: no implied endorsement).
- **Don't** let the reel or header go transparent over copy.
- Reduced motion (and no JS): no film is fetched; the hero still stays, the
  sections read as a plain list, and the reel is a static index.

## 9. Verification and critique history

Verified 2026-11-03/04 in headless Chrome over CDP (`tools/shot.mjs`,
screenshots kept outside the repo) at 1440x900, 390x844 and 2560x1440, plus
reduced motion: no console errors, no horizontal overflow, no targets under
24 px, one h1 and no heading jumps on both pages, keyboard order header →
reel → hero actions with a visible 2 px focus ring, Enter on a reel cut lands
on its section with focus on its heading. Scrub test (90 scroll steps at
~60 Hz): every seek completes; 1080p median 0–6 ms, 2160p (GOP 4) median
9 ms, p90 49 ms. An earlier 2160p encode at GOP 12 skipped half its seeks
(p90 99 ms) and was replaced.

Fresh-context critic (DARK.md §6), screenshots only, references
film-midwater and crater:
- **Round 1: 6.5/10.** Largest gap: the copy described a Singapore day
  (gatecrash, tea ceremony, banquet) over footage of a garden wedding, so
  each cut contradicted its own text. Fix: "How a day is covered" now walks
  the day actually on screen, hour by hour, shot by shot; the Singapore day
  is stated once, as what we also cover. No free library had a consistent
  4K series of a Singapore Chinese wedding day to re-cut from (checked
  Pexels, Pixabay, Mixkit; Asian results were posed bridal fashion shoots or
  phone footage). Also fixed: circles that missed their marks, a numbered
  ×1–×5 list (now ×2 and +1, which mean something), the films page header,
  a see-through mobile reel, and delivery laid out as a horizontal ruler on
  wide screens so the sections stop repeating one shape.
- **Round 2: 7/10.** Desktop beat both references; mobile lost to
  film-midwater. Largest gap: on phones the film vanished under a heavy
  scrim after the hero. Fix: on phones each cut opens on 70svh of clear
  film with only its label and heading over it; the reading starts on solid
  ground beneath (`--ground`, set from the heading's position). Stopped
  there, per the two-round cap.
- Open, not fixed: the three-tier price table still reads as a familiar
  pattern; the mobile hero is denser than film-midwater's; real footage of
  a Singapore wedding day (from the client) is the one change that would
  close the footage-to-market gap.
