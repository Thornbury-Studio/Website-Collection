# THORNBURY DIGITAL v5 — LIQUID MONOLITH

The studio's own site as a heavy, expensive object. Obsidian `#080808`, liquid
chrome `#e1e1e1`, one ember `#ff2a00`. No blue, no navy, no sepia, no paper, no
brush. Four real pages (`index`, `work`, `studio`, `contact`), vanilla
HTML/CSS/JS, GSAP from jsDelivr, one 2D canvas.

## Palette audit

| Role | Value | Where |
|---|---|---|
| Ground | `#080808` | html, body, canvas clear, wipe |
| Chrome | `#e1e1e1` + 70 / 45 / 18 / 10 / 4.5 % alphas | type, hairlines, grid, glass skin |
| Ember | `#ff2a00` | active-nav square, plate markers, prices, focus ring, 4.5 % of strands, hover on the button |

Nothing else. Shadows are black, highlights are white at low alpha, grid lines
are chrome at low alpha. There is no third hue anywhere in the stylesheet.

## The liquid metal audit (`js/field.js`)

**Attractor.** Thomas, `x' = sin y − b·x`, `y' = sin z − b·y`, `z' = sin x − b·z`,
`b` per world (0.19 on Home). Euler with `dt = 0.02` in one sub-step, 60 sim
steps per second on a fixed-rate accumulator, so speed is identical at any frame
rate.

**Why it is a ribbon, not dust.**

1. *Strands.* 2,600 particles (900 on mobile) are seeded in strands of 24. A
   leader is settled onto the attractor with 240 warm steps, then each follower
   is placed two steps behind the previous one. A strand therefore lies along one
   trajectory and its segments overlap into one continuous string. Chaotic
   divergence is slow at this `b`, so strands stretch and fold rather than scatter.
2. *Segment = velocity.* Every frame each particle draws the segment from its
   previous screen position to its current one. Length is the displacement, so a
   fast stretch draws long, thin and bright and a slow bend draws short, heavy and
   dim: `lineWidth = (2.1 − 1.1·s)·(0.5 + 0.8·d)`, `alpha = (0.16 + 0.3·s)·(0.45 + 0.55·d)`
   with `s = clamp(|v| / 1.3)` and `d` the depth in `[0, 1]`. Round caps close the
   joints between frames.
3. *Wipe.* Before drawing, the canvas is covered with `rgba(8,8,8,0.08)`, so a
   trail decays to 1/e in ~12 frames — a short tail behind a strand that is being
   redrawn anyway. Every 7th frame the wipe is `0.24`: an 8-bit canvas cannot
   subtract less than half a level, so a soft wipe alone leaves a permanent ghost
   a few levels above black; the periodic harder wipe clears that floor.
4. *Metal.* Segments composite with `lighter`. Luminance is
   `0.22 + 0.45·d + 0.6·spec` where `spec = |t̂·L|³` against a fixed key light from
   the upper right — strands aligned with the light flare to white, the rest sit as
   mid chrome, and crossings pool to white the way mercury catches a lamp.
   Buckets of quantised `(kind, luminance, alpha, width)` are stroked as one path
   each, ~150–300 `stroke()` calls per frame instead of 2,600.
5. *Projection.* `Ry(rot)·Rx(tilt)` orthographic, `S = 0.10·min(vw, vh)` px per
   unit, `rot` advances at 0.06 rad/s; the pointer eases ±0.25 rad of yaw and a
   3 % parallax. DPR is capped at 1.5 (1.25 mobile) because fill rate is the cost.

**Interaction law.** `html[data-field]` is `live` on Home and Studio (rAF loop) and
`still` on Work, Services and Contact: the still page pours 54 warm frames in
four at a time and then never touches the canvas again (re-pours on resize). Reduced
motion forces `still` everywhere. The `continuum` direction overrides this and
runs everywhere — see *Moving between pages*.

## Glass under the anti-stacking rule

Glass is `backdrop-filter: blur(16px)` + `mix-blend-mode: overlay`, and it is
applied in exactly three places: the bar, the one hero CTA button, the work
metadata cards. `mix-blend-mode` only blends with what is painted below it in
the *same stacking context*, and the canvas lives in the root context, so:

- `.site` has no `z-index` and no `isolation`.
- The bar is two fixed siblings: `.bar-glass` (blur + overlay, z 30) under `.bar`
  (chrome, z 31). Blending the bar itself would blend its text into black.
- `.gpanel::before` is the blended liquid layer; `.gpanel::after` is the
  unblended skin (edge, tint, highlight); children are `position: relative` so
  they paint above both.
- Every GSAP tween ends with `clearProps`, so no leftover `transform`/`opacity`
  opens a stacking context under a glass.

## The hero, and the handoff

One object, full bleed, and almost nothing else. A cratered moon on a slow
push-in, desaturated into the obsidian/chrome palette, with five pieces of type
on it: a mono kicker, the wordmark, the positioning line, and two buttons. There
were three figures along the bottom edge as well, until a source check found that
none of the three could be sourced — see *Facts, and what happened to the ones
that were not*. No blueprint frame, no reticle, no coordinate
readouts — that scaffolding read as an unfinished tool, not a studio. A hook is a
subject plus restraint; everything that is not the subject is either a word you
need or it is noise. Nothing labels the film any more: the caption that used to
sit in the corner announced it as a stand-in for a Higgsfield shot that was never
going to be a better hook than this one. VIDEO-POLICY's own asset order stops at tier 1 here —
excellent licensed footage already exists, so generating video would be spending
credits to replace something that works. The film is the hero; its licence and
its whole encode live in `IMAGE-CREDITS.md`, which is where a credit belongs.

**The still is the hero; the film is an upgrade to it.** The plate is a
`<picture>` — landscape at 1024×576, portrait at 540×1080 under 760px — and it
is what paints. `js/main.js` attaches the video afterwards, inside
`requestIdleCallback`, and crosses it in only on the `playing` event. Nothing
that can go wrong takes the hero with it: reduced motion never fetches a byte
(verified: `networkState` 0, `src` null), a refused autoplay leaves the still
standing, and a slow connection shows a finished hero while the film arrives.

**The film loops both ways.** The web encode is the strongest 7.5 seconds
followed by the same 7.5 seconds reversed, concatenated into one 448-frame file
(`split` → `reverse` → `concat` in a single ffmpeg pass), with the duplicate
frame trimmed at the turn. A plain `loop` attribute then runs forever with no
cut, because the last frame is one step from the first. Measured: the loop point
reads 32.2 dB PSNR against 32.8 dB for an ordinary frame step, and the turnaround
35.4 dB against 35.3 dB — both seams are indistinguishable from normal motion,
where unrelated frames sit at 13.6 dB.

**A phone gets its own cut of it, not a smaller copy of it.** A 16:9 file behind
a portrait phone spends about seven tenths of every encoded row outside the
viewport, so `video/hero-m.mp4` is a 540×1080 crop of the same graded frames
(`crop=540:1080:420:0` after the `hflip`, chosen by rendering three candidate
windows and looking at them): 0.90 MB against 2.73 MB, every pixel of it on
screen, and the sky-to-limb diagonal falling where the type is not. It is built
by the same split/reverse/concat pass, so it loops the same way — measured on
the mobile encode itself, the loop point reads 40.3 dB against 40.1 dB for an
ordinary frame step and the turnaround 38.6 dB against 38.7 dB, with unrelated
frames at 22.7 dB.

**It does not cut off at the fold.** `.hero-stick` is 165 dvh tall and the hero is
`position: sticky` inside it, which buys 65 dvh of scroll to hand over in. Across
that range a scrubbed timeline dissolves the film to nothing and drifts it back
12%, while the copy lifts and fades sooner — so the moon gives way to the liquid
chrome field that was behind it all along. `autoAlpha` hides the spent hero
rather than leaving a transparent layer over the page catching clicks. Without
GSAP the hero simply un-pins and scrolls away, and the `.film-fade` gradient
still keeps its bottom edge from ending on a hard line.

Two things the lit subject broke, both the same bug in different clothes. The
`overlay` glass on the secondary button brightened against the moon until it
matched the solid primary and the hierarchy vanished — it needs a dark base under
the blend. And `.btn--glass` was losing the cascade to `.btn`, which is declared
later at equal specificity; `.btn.btn--glass` settles it.

## What is in the plates

The five work plates each hold a capture of that case's own site, taken live from
this collection:

| Case | Site |
|---|---|
| Midwater | `templates/film-midwater/` |
| Kiyo 清 | `templates/japanese-restaurant/` |
| Aurel | `templates/watch-atelier/` |
| Loam | `templates/cafe-loam/` |
| Form/01 | `templates/streetwear-form01/` |

On the home page they are **figures, not exhibits** — 148 px wide on a phone,
260 px at 1440 — set in an alternating hairline index where the case name carries
the row at up to 3.8 rem. A screenshot blown up to 800 px blocks the page and
buries the field behind it; at 260 px it reads as a plate in a book, and the
chrome field runs through the whole section. They rest at
`grayscale(.55) brightness(.7)` so a light site sits back inside the monolith,
and return to full colour on hover. The Work page keeps a proper gallery, three
up at ~408 px, where the metadata cards still fit.

Two things make a screenshot survive being framed this way. A two-stop `.scrim`
darkens the top and bottom bands, because three of the five sites are light and
the chrome corner labels would otherwise sit white-on-white. And the metadata
card carries its own `rgba(8,8,8,.5)` base under the `overlay` blend, so the
glass composites over a known ground instead of inverting on a bright plate.
The blueprint ruling is redrawn as a `.grid` overlay above the media, so the
frame still reads as a plate rather than a picture in a box.

## Layout DNA

Massive Archivo (`wdth 92`, weight 800) at `clamp(3.4rem, 9.6vw, 11.5rem)` with
`−0.04em` tracking, against JetBrains Mono metadata at 0.6–0.66rem with Off-White
style quoted labels (“FIG. 00”). Work slots are windows into the liquid:
transparent plates over a blueprint ruling, an outlined index numeral overlapping
the top-left corner, a “Fig. 0N” in the plate's own corner, and a glass metadata
card inside.

**A plate reports nothing it does not know.** Every case used to carry
“X 0486 · Y 0253” in its top-right corner — the plate's own rendered size, which
is the same number on every plate in a grid of equal tracks, so three tiles in a
row read as three identical coordinates. Detail that is caught being decoration
costs more than the absent detail would have, and the site had already learned
this on the hero, where the reticle and the readouts came out for exactly the
same reason. They are gone from the plates too, along with the code that fed
them.

## The mobile composition

390 is not 1440 with the gaps squeezed. Five things are composed again rather
than scaled, and each is a decision a phone forces and a desktop does not.

**The bar gives up its links.** Four destinations at 0.6 rem is a row of targets
nobody wants to aim at, so under 760 px the bar carries the wordmark and one
word, and the navigation becomes a page: a `<dialog>` opened with `showModal()`,
which brings the focus trap, Escape and an inert page behind it for free. Inside,
the studio line sits at the top where the hero's does, and the four destinations
run along the bottom as numbered rows — the name at up to 3.3 rem, a mono
descriptor under it, the current page marked with the same ember square the
desktop nav uses. The Close control stands exactly where Menu was, under the
thumb that opened it. Glass cannot follow it there: a dialog is in the top layer,
where `mix-blend-mode` has nothing painted below it to blend with, so the panel is
solid obsidian over a 22 px backdrop blur instead.

**The hero goes left and bottom-weighted.** Centred type is a desktop luxury; on
a phone the wordmark is the page, so it sits hard against the left gutter at
`calc((100vw - 2 * var(--gutter)) * .157)` — sized against the column rather than
the viewport, because a plain `vw` figure ran it 6 px past the gutter and `.hero`
has `overflow: hidden`, which means the last letter was being shaved rather than
reported. The two buttons go full width and stack, which is the whole lower half
of the composition now that the figure rail has gone: the hero is the wordmark,
the line, two thumb-width buttons, and then the object, uninterrupted to the fold.

**The home index gives each case the whole column.** A 148 px figure beside a
name is a desktop composition, and the alternating left/right that carries it
means nothing in one column. `.entry-body` becomes `display: contents` so the
row's parts can be reordered directly — label, then the plate at full width, then
the name at up to 3 rem under its own picture, then the line. A plate in a book,
which is what the home page calls them.

**The work plates hand their metadata to a bar.** A floating glass card inside a
358 px plate is a card inside a stamp, and it is five `backdrop-filter` layers on
the device least able to pay for them. Under 620 px the card drops its blur and
its blend and becomes a solid rule across the foot of the plate: sector, time and
price, over the scrim that was already darkening that band.

**And the numbers only a phone can get wrong.** Inputs at 16 px so iOS does not
zoom the form; `env(safe-area-inset-*)` on the bar, the hero foot, the menu foot
and the footer; every hit area at 44 px except the inline links
a line-height already constrains. Verified at 320 / 360 / 375 / 390 / 414 / 540 /
768 / 1024 / 1440 across all five pages: `scrollWidth - clientWidth === 0`, 45 of
45.

**One grid trap, found by pixels and not by assertions.** An item given a
definite row but an auto column does not necessarily land in column 1: an
outlined numeral on the studio page resolved into column 2 and printed on top of
its own heading, while every overflow and computed-style check passed. Both
tracks are now stated on every placed item, and the width sweep now also asserts
that no two children of a grid resolve into the same cell. See PATTERNS.md.

## Services, and the rate

The fifth page is the one a studio site usually gets wrong. Three plan cards in a
row is a SaaS pattern, and a reviewer reads it as one before reading a word of
it — so the page is built out of what this site already is: a hairline index.

**The figures are the studio's real published rates**, and only those:
S$500 promotional, up to five pages, three months of free changes; S$800 fixed,
no page limit, one month of free changes. An earlier draft of this page carried
an invented three-tier ledger (S$6,800 / S$22,000 / S$48,000) that read as
plausible and was not true. Nothing on the page states a figure that is not one
of these two — grep it: `S\$[\d,]+` returns exactly `S$500` and `S$800`.

**A small real number is a typographic problem, not a pricing one.** The
invented ledger leaned on big tier names because the prices were big; the real
rates are four hundred times smaller and the honest move is to set *them* as the
display type. The figure runs at `clamp(3.2rem, 7.4vw, 8rem)` with the `S$` in
ember, the rate's name sits under it as a mono label, and the two terms stand to
the right as a labelled pair each. Reading down the terms column is what makes
the trade legible: five pages against no limit, three months of changes against
one — the cheaper rate buys more of our time and less scope, which is the whole
story and is now the shape of the row. On a phone the terms stop being columns
and become a ruled table under the figure.

**This pricing is temporary and the page is built to be swapped, not rebuilt.**
A real service-charge chart is being made and will replace both figures. The
markup carries a comment saying so, and nothing in `css/layout.css` counts
anything: `.ledger` takes any number of `.rate` rows, `.terms` is
`repeat(auto-fit, minmax(9rem, 1fr))` so a row takes one term or four, and
`.rate-fig` is `white-space: nowrap` at a clamped size so the digit count does
not matter. No copy on the page or in its metadata counts the rates either —
the section label is “The rate” and the home teaser reads “the rate is on the
page”, both of which survive a chart with five rows in it.

Section II is what is inside every number. Section III is **what moves it** — a
ruled table of named factors whose right-hand column reads “Quoted”, because a
real modifier price is not known yet and an invented one would be the same
mistake twice; that column is the slot the coming chart drops into. On a phone
each of these is already a stack of ruled rows, so the page needs almost nothing
to become a phone page.

**Section IV is the offer itself, and it carries two chip states.** Ember is
reserved for the exception the charter promises is marked, so a service that is
not published gets the bordered ember chip and a live one gets the same chip in
chrome — the eye lands on the unpublished one without anybody having to read it.
Website Building is Live, Audit is Live · Free for now, and SEO / AEO / GEO is In
development. The last of those is one service with two halves, split by a
hairline and labelled AEO / GEO and SEO, because both bodies of content are real
and neither should be summarised into the other; the “By enquiry” note stays on
the AEO / GEO half, which is the half that is open to a request. The rate above
now says out loud that it prices the first of these and not the other two.

**What we are not the studio for has moved to the studio page**, next to the
charter. It is philosophy, and it was sitting on the page where somebody is
working out what to pay.

**The invented figures outside this page are gone too.** `work.html` used to
price each case from “S$48,000” down to “S$6,800”, and `contact.html` offered
budget bands from “Under S$10k” to “S$60k and up”. Both predated the real rates
and both contradicted them. The eighteen-case rebuild below drops per-case
pricing entirely — with a published rate on the next page there is nothing a
per-case number could honestly say — and the budget select is now a list of the
four real services.

## Facts, and what happened to the ones that were not

The governing rule is the site's own: if a claim stops being true, delete it, do
not soften it. Applied here with `git log -S` as the test — a string that exists
only inside this template, and that entered the repository in the commit that
created this template, was written during the build rather than taken from
anything.

| Claim | Traced to | Now |
|---|---|---|
| “Tanjong Pagar, Singapore” | `f8cbd19`, v5's creation commit; nowhere else in the repo | removed |
| “Taking two projects for Q1 2027” | same commit; also ran as the hero figure “02 · Openings, Q1 2027” | removed, both places |
| “2021 · Founded” | `63c3a4f`, a later v5 build commit; no source anywhere | removed |
| “03 · People” / “Two designers, one engineer” | contradicted by the real headcount | replaced with prose |
| “Mon – Fri, 10:00 – 18:00 SGT” | `f8cbd19`, same class | removed with the contact rebuild — never confirmed, and the rule says an unconfirmed claim does not stand while we wait |
| “SGP · 01°17′N 103°51′E” in the bar and the menu | `f8cbd19` | removed — a coordinate readout nobody asked for, on a page that has a real address in the footer |

Deleting the last two hero figures took the whole `.hero-stats` rail with them,
markup and CSS, because a rail ruled into thirds with one cell in it is not a
design anybody chose. The rail was one of the five decisions the mobile
composition was built on, so the mobile hero is now the wordmark, the line, two
full-width buttons and then the object all the way to the fold — which is closer
to what this hero says about itself anyway. Restoring it is one `git show` away
if real figures ever arrive.

The headcount reads as prose because it has to: around twenty is not a
stat-block figure and rounding it into one would be the invented-figure mistake
in miniature.

## The studio page

Rebuilt on the studio's own facts. Everything that used to be here — three
principles, a four-step process with invented week counts, and a fact list that
said “People: Three” — was plausible and unverified, and the fact list was flatly
wrong: there are around twenty people. The page now carries four sections and
nothing that cannot be checked.

**The charter, verbatim.** Five of the studio's fourteen internal articles, each
a claim followed by the practice that makes it checkable. The words are the
studio's own and not one of them is edited; the only thing design does to the
text is lift “01 —” out as an outlined numeral and set “Practice:” as its own
mono label, which is the same device the pillars use for “Check”. The claims are
set in sentence case at up to 2.4 rem rather than in the caps the rest of the
site uses for headings — they are sentences, and caps would shout them.

Article 03 publishes a claim a reader can test in one keystroke: *turn JavaScript
off and the pages still work*. That was verified before it was published, in a
browser context with JavaScript disabled: all five pages render, no page overflows
at any width, `.hero-copy` sits at opacity 1 (nothing waits on GSAP to become
visible), the hero keeps its still because the film was always an enhancement
attached afterwards, and the footer navigation — five links on every page — is
what carries the site. On a phone with JavaScript off the bar's links stay hidden
and the Menu control is a plain anchor to that footer navigation, which is why it
was built as an `<a href="#site-nav">` rather than a `<button>`.

**The people.** Two named principals in the same hairline index the work uses,
name at up to 3.6 rem with the role in mono at the right margin: Zhang Zhijie,
Founder / CEO; Isaac, Co-Founder / COO. Name and role only — no invented
biography, no invented tenure. Under them, the founding team as a statement:
around twenty people, most of them building their first company, and the practice
that follows from it — no stock photograph of a team stands in for them. That
last one is checkable by looking at the page, which is the point.

**The three pillars are claims with a receipt.** A badge is a picture of a
promise; each pillar here is a claim followed by a mono `CHECK` line naming
something a visitor can go and do, on this site, right now:

| | The claim | What you can go and check |
|---|---|---|
| Security | Every page names the sources it may load from and refuses the rest | The policy is in the head of this page, above the title, and readable |
| Performance | The heavy part arrives after the page is usable; a phone never gets the desktop's file | The home page paints on a 20 kB still; the film follows, from the portrait cut |
| Ownership | Source files, hosting account and email account all go to the client | `css/layout.css` opens as the stylesheet itself — commented, unminified, not generated |

All three are true of this build and were measured or read here, not asserted.
The ownership line is the handover already written down in the repo's own
`AGENT.md`: Vercel account, email account and all source files go to the client,
nothing stays on the agency's side.

**The stack, in the client's terms.** Vercel, Supabase, Resend, OWASP ZAP and
SonarCloud, each with one plain sentence about what it does for the person paying
for the site — where it lives, where it remembers things, what sends the mail,
what checks the finished site, what reads the code. Set as a key: mono names in a
narrow left column, description in the right, which keeps it visibly distinct
from the pillars above it.

**No absolute security claim appears anywhere on the page**, by design. ZAP
“checks the finished site for known issues”; SonarCloud “flags the patterns that
are known to cause trouble later”; and the note under the table says plainly that
neither makes a site unbreakable, that nothing does, and that what they mean is
that the known problems have been looked for with public tools the reader is free
to point at the site themselves. Asserted: the rendered page matches none of
`unhackable | impenetrable | 100% secure | bulletproof | guaranteed`.

**The charter is followed immediately by what we are not the studio for**, which
arrived from the services page: a claim about how the studio thinks belongs
beside the articles that set out how it thinks, not in the middle of a price.

**Article 04 used to point at nothing, and now does not.** Its practice line
says Optimization and SEO are marked in development on every page they appear on,
“including the one selling them” — and for one round neither service existed
anywhere in this template, so a reader who went to check found nothing. Both now
sit inside SEO / AEO / GEO in section IV of the services page, behind a bordered
ember chip reading “In development”, with “By enquiry” attached to the AEO / GEO
half because that half is open to a real request while the other is not. The
services page is the only place on this site that lists what is on offer, so it
is the only place the marking is owed. The chip is a bordered chip rather than a word in the copy on purpose: a
promise that something is marked has to be visible before it is read, and the
section sits on `sec--solid` ground so the field can never compete with it.

## Contact details

`contact@thornburystudio.com`, `+65 8805 6769`, and WhatsApp on the same number.
The address appears in the footer and the mobile menu of all five pages and at
the head of the contact page; the phone appears in all three of those places; the
WhatsApp link (`https://wa.me/6588056769`, opened in a new tab with
`rel="noopener noreferrer"`) appears once, on the contact page. `tel:`, `mailto:`
and `wa.me` all fail `routable()` in `js/bg.js` — it requires a same-origin
`*.html` path — so the router hands them to the browser untouched.

## Doing the claim instead of printing it

Three of this site's own assertions are things a visitor could go and check, and
a printed instruction to go and check them is weaker than the check itself. All
three now happen on the page. The sentence stays beside each one, so nothing is
lost when JavaScript is not there to perform it.

**The switch, at charter article 03.** “Every effect on this site can be
switched off” is a button that switches them off. It throws the same junction
`prefers-reduced-motion` already throws — `html.rm`, `TBPage.reduced`, the
field's still policy — so nothing had to learn about it twice, and the page is
torn down and rebuilt through the exact path `bg.js` uses for a navigation
rather than through a second code path that could drift. Measured across the
throw: `html.rm` on, the canvas stops (`field.active()` false), ScrollTriggers
6 → 0, the hero film pauses and drops its `src`, both switches read Off, and
`<main>` still holds 6,199 characters with all five footer links live. Throwing
it back rebuilds every one of those. It is in every footer as well, because a
visitor who turns the site still on one page should not have to find their way
back here to turn it on again.

**The policy, at the security pillar.** The block is not a transcription. It is
`meta[http-equiv="Content-Security-Policy"]`, read out of this document at load
and split at its semicolons into ten directives. Change the header and the page
changes with it; there is nothing to keep in sync.

**The stylesheet, at the ownership pillar.** The excerpt is `css/layout.css`,
fetched from the file it describes, showing its own first ten lines — which
happen to be the comment explaining the glass rule, so the claim “commented and
readable” is demonstrated by the thing being quoted. The line count and the byte
count under it are measured off what came back, not typed in.

## Answering back

**Scroll is felt in the object.** Scroll speed becomes a push on the attractor's
yaw — sampled once per frame, never per event, above a 0.4 px/ms threshold and
capped at 0.30 rad/s, decaying with a ~0.36 s half life. A fast flick down the
page measured eight impulses and 1.44 rad/s of accumulated push; a slow read
produces none. It costs nothing: no extra draw, one multiply per frame.

**Hover states move rather than recolour.** The home figures lift 7 px out of
the index. Every plate's corner ticks open from 16 px to 26 px on approach. The
outlined index numeral on a work case rises and its stroke brightens. Nav and
footer links draw a rule under themselves from the left. The submit arrow
travels. One deliberate exception: **the work plates are never transformed**,
because the glass metadata card lives inside one and a transformed ancestor
would take its blend away — the stacking-context rule above, enforced as a
hover decision.

**And one paragraph became a line.** The honest sentence under the stack — that
nothing makes a site unbreakable and nobody can promise it — was the most
quotable thing on the page and was set as a footnote. Same words, now a
pull-quote at up to 2.9 rem with the qualifier beneath it.

## Two grid bugs this pass, one of them shipped

The audit that came out of the last one — assert no two children of a grid
resolve into the same cell — was not strong enough. It catches collisions; it
does not catch an item that is merely in the *wrong* cell. All three new blocks
landed in the numeral column, because an auto-placed item beside explicitly
placed siblings goes wherever auto-placement puts it.

The stronger rule, now the one that runs: **flag any grid child still resolving
to `auto` while a sibling in the same grid is explicitly placed.** That found
all three immediately — and one more that had been shipped since the template
was built. `#brief-note`, the contact form's sent state, sat between
`.form` (`1 / span 7`) and `.aside` (`9 / -1`) with no placement of its own, so
on submit it rendered **277 px wide** in the one leftover column. It takes the
form's track now: 751 px at 1440, full width on a phone. Nobody had submitted
the form in a browser before; every layout check passed the whole time, because
the element is `hidden` until the moment it breaks.

## The Team band

Four people from a licensed photograph, drawn as three populations of points and
lines. The technique underneath is the classic Codrops / Mamboleoo one — draw the
image into an offscreen 2D canvas, walk its pixels on a stride, emit points — but
what is walked is not the photograph.

**The reference, and what studying it settled.** The band is aimed at the “Our
Team” canvas on horizonsymmetry.com. Reading it closely changed this file more
than any amount of shader work would have: its canvas samples a single
4400×2456 pre-rendered artwork of the particle figures, the wave and the
starfield. Its dimensionality was authored in 3D long before a browser saw it.
There is no `.glb`, no point-cloud file and no runtime trace — one
`drawArrays(POINTS)` over an image. A photograph cannot match that completely: a
monocular depth estimate gives a shell seen from one side, not a body. What it
*can* match is the register, and the register came from one decision.

**Throw the photograph away.** Nothing in `js/figure.js` samples colour. The
build keeps only the shape of the subjects and the direction their surface faces
— normal.x and normal.y in R and G, depth in B, all in one
`img/team-pack.webp`; the albedo file that used to sit beside it is deleted.
Every point is lit from the normal alone:

```
lit = 0.17 + 0.60 * lambert + 0.88 * fresnel
```

The fresnel term is deliberately the louder of the two. A silhouette that burns
while the interior falls away is what separates a *volume* from a *sheet*, and
it is the single thing that reads as three-dimensional at a glance. It also
takes faces, clothing, pattern and identity off the page with the colour: nobody
in the source photograph is recognisable, because none of them is drawn. The
previous attempt shaded by photographic luminance and looked, in the boss's
word, *messy* — a cluttered room rendered as dust, because brightness made a
chair back as bright as a shoulder.

**Thickness.** A depth shell is still infinitely thin. Each point is displaced
along its own normal by a random offset (±0.03 world units, ±0.025 on a phone)
before it is written, so the cloud has a skin with depth in it and the rim stops
reading as a cut edge.

**The normal goes through `normalMatrix`.** The key light stays fixed in the
room while the form turns under it — which is the whole reason a rotation reads
as a rotation and not as a slide.

**The wave is lines, not dots.** Its law is the Thomas attractor `js/field.js`
already integrates, and its constants are *read* at run time from the studio
page's own world in `js/bg.js` — `TBBg.presets.studio.world`, b 0.205, ext 4.4,
seed 11 — rather than copied, so there is one source of truth. Strands are
seeded the way the field seeds them: a leader settled with 240 warm steps at
`dt = 0.02`, then samples emitted as line-segment *pairs* so a strand is a
continuous curve rather than a queue of dots. 150 strands of 38 on a desktop,
90 of 26 on a phone, flattened into a shallow sheet at the base and drifted
sideways in the vertex shader, wrapping, with both ends faded so the wrap is
never seen.

**What was reused and what was not.** The law and its constants, yes. The
renderer, no, and it could not be: `field.js` draws to a 2D canvas through its
own fixed full-viewport camera and exposes no way to hand positions to another
scene. Sharing the generator is the honest half.

**The starfield is the third population.** A sparse slab of 520 points behind
both (260 on a phone), each twinkling out of phase so the slab never reads as a
printed screen. The reference has this layer, and it is what gives the other two
somewhere to sit.

**Where it sits, and why not closer.** A full-bleed band *after* the team
section rather than inside it. Beside the copy it would read as an illustration
of “around twenty people”, which it is not; one band down it reads as the
transition into what we build on, which is what it is. The copy above it now
says how the two facts sit together rather than leaving them adjacent: no stock
photograph stands in for anyone, the figures below are geometry lifted from a
licensed photograph, no face is drawn, and nobody in it works here.

**Three draw calls, and the CPU does almost nothing.** Scatter, staggered
assembly, idle drift and the pointer push all happen in vertex shaders; per
frame the CPU reads one bounding rect and writes a handful of uniforms.
Assembly is tied to the band's own travel through the viewport, so the figures
gather as you arrive and let go as you leave. The pointer opens a local dimple
with a bright rim — an early pass used a 0.85-unit radius against a 2.45-unit
figure and punched a crater straight through it; it is 0.34 now.

**Closing the last twenty per cent would take real geometry.** The reference's
smoothness is not a shader the browser is running — it is a 3D scene that was
lit and rendered before export. Matching it fully means building the figures as
geometry rather than deriving them from a photograph. The Blender MCP is
connected and that is the route if it is wanted; it is a different job from this
one, not a tuning pass on this one.

**It is the first thing cut, exactly as article 02 says.** Nothing is fetched
until the band is within 400 px of the viewport, and nothing is fetched at all
without WebGL, under reduced motion, or with the effects switch off — verified:
under `prefers-reduced-motion` the band computes `display: none` and the network
log is empty. That matters because three.js is the heaviest thing on the site by
a distance: **736 kB** uncompressed for the effect, of which 720 kB is three
(`three.module.min.js` 339 kB + `three.core.min.js` 381 kB, the second pulled by
a relative specifier so no import map is needed under this CSP). `figure.js` is
10 kB and the photograph is 6 kB. None of it touches first paint on any page.

**Disposal is the part that had to be right.** `<main>` is swapped on every
navigation, so a context left behind would be a context leaked, and browsers
allow about sixteen. Teardown disposes the geometry, the material and the
renderer and then calls `forceContextLoss()`. Instrumented over five studio →
work → studio round trips: contexts created 2, 3, 4, 5, 6 against contexts lost
1, 2, 3, 4, 5 — exactly one alive at any moment, one canvas in the DOM
throughout, and no “too many active WebGL contexts” warning. The WebGL support
probe is now answered once per document and its context released immediately;
before that it was a real context created on every page swap.

## Performance

Measured with Chrome DevTools traces and rAF sampling, desktop at 1440 and a
4x-CPU-throttled phone at 390.

| | Before | After |
|---|---|---|
| Field cost per frame | 12 ms, every frame | ~6 ms, every other frame |
| LCP (4x throttle, mobile) | 1,281 ms | 379 ms |
| Long tasks on Work at load | one at 78 ms | none |
| Page transfer | 4,544 kB | 2,918 kB |
| Lighthouse accessibility | 93 | 100 |

CLS was 0.00 throughout.

**The phone stopped paying the desktop's bill.** A first load at 390 px now
transfers 1,125 kB against the desktop's 2,867 kB, because the portrait encode is
0.90 MB where the landscape one is 2.73 MB and the portrait still is 20 kB where
the landscape one is 35 kB. None of it is on the critical path any more: the film
is fetched in `requestIdleCallback` once the page is up, so what competes with
first paint is a 20 kB still.

**The field was quadratic in disguise.** `flush()` walked a `Map` of *every*
bucket key ever created, decoding the key and testing `arr.length` for each,
including thousands that were empty — so per-frame cost grew with the number of
distinct (luminance, alpha, width) combinations the run had ever produced. It now
records only the keys touched this frame in an `Int32Array` and walks that.
Buckets are reusable `Float64Array`s with their own fill counts, because plain
arrays reset with `length = 0` churned their backing store and left a 5% tail of
18 ms frames. Euler runs one sub-step at the same `dt` instead of two, halving
the `Math.sin` count with no visible change to the trajectory.

**Then it stopped drawing when nobody can see it.** The field paints at 30 fps
while physics stays at 60 — it is a slow ambient drift and the wipe is doubled to
keep the trail the same length in wall-clock terms. It is switched off entirely
while the hero film is opaque, driven from the handoff's `onUpdate`, and on Home
that means it does no work at all until the first scroll.

**Startup.** Seeding 2,600 particles and pouring the first frames costs ~23 ms,
so the field starts in `requestIdleCallback` rather than on the critical path;
that alone removed the only long task on Work. Still pages pour 54 frames four
at a time instead of 84 twelve at a time, so no single task runs long.

**What did not work.** Moving GSAP off the critical path required hiding the hero
copy until it arrived, and an `opacity: 0` element does not count as painted —
LCP went from 1.28 s to 3.33 s. The 47 kB library stays in the head, deliberately.

## Moving between pages

Navigation used to be a hard cut: the browser tore the canvas down, the next page
built a new one from a different seed, and the background blinked. Every page is
still a real HTML file, but same-directory links are now intercepted and only
`<main>` is swapped (`js/bg.js`), so the canvas survives and the background can
carry a thought across the navigation. Anything unexpected — a modified click, a
cross-origin URL, a failed fetch — falls back to a real navigation.

`<main>` fades and lifts on the way out and back in, identically in every
direction, so the only thing being compared is what happens behind it. The
opacity lives in a class and never on the element at rest: an element at
`opacity < 1` is a stacking context, and the glass inside `<main>` can only blend
with the canvas from the root one.

**Seven directions are built, plus the hard cut as a control**, and every one
carries the cost it measured. Rest is a paired canvas-on/canvas-off frame-time
difference over five rounds at 1440×900 (canvas 2138×1350 at dpr 1.5, 2,600
particles): 6.06 ms idle, 8.25 ms running, i.e. ~0.25 s of extra main thread per
second, ~8 ms on each of 30 painted frames. Swap is total `PerformanceObserver`
longtask time across four navigations, median of four.

| | What it is | Rest | Swap |
|---|---|---|---|
| `off` | A real browser navigation. The control. | — | a full page load |
| `continuum` | One world, never reseeded. The camera travels to the next page's viewpoint over 1.35 s and the key light moves with it. | canvas on every page, ~0.25 s/s | no long task |
| `chapters` | A different world per page — its own `b`, density and seed — frozen and cross-dissolved over the new one across 1 s. | free — still pages stay still | no long task |
| `pour` | The frozen frame is torn off by a procedural front: a per-band noise offset behind a bright edge. No asset. | free | no long task |
| `film` | A looping video plate instead of the field, reframed per page. | video decoding the whole time you read, 2.7 MB | no long task |
| `law` | **b itself eases between pages.** No reseed, no ghost, no transition layer at all: the strands stay the strands and the tangle reshapes into the next page's attractor. | canvas on every page, ~0.25 s/s | no long task |
| `inkcut` | The same job as `pour` with the shape **filmed instead of computed** — a real ink stroke used as a luma matte. | free, 87 kB clip | no long task |
| `refract` | Not a wipe: an **image-space distortion**. A filmed liquid-metal ripple read at 36×20 displaces the frozen frame cell by cell along its luminance gradient. | free, 155 kB clip | **0.56 s of long tasks, worst 159 ms** |

None of them has an on-device phone number, and every label says so rather than
guessing.

**E is B's idea reached by A's means.** `b` is continuous in the vector field, so
easing it while the integrator runs reshapes the existing trajectories rather
than replacing them — measured going 0.190 → 0.155 on a smoothstep over 1.5 s,
with no ghost canvas ever created. It is the only direction that gives each page
its own attractor without ever cutting.

**F answers a question C raises.** Both erase the same frozen frame; one front is
a sum of three sines, the other is a brush. The filmed one costs about what the
computed one does because the key is an SVG `feColorMatrix
type="luminanceToAlpha"` drawn straight into the ghost with `destination-out`,
which is one GPU draw, not a pixel loop. It feature-detects by erasing with black
— luminance 0 must erase nothing — and falls back to the plain dissolve if the
filter is not honoured.

**G is the expensive one and says so.** 720 `drawImage` calls a frame for 1.15 s
is real work, and it is the only direction that produces a long task at all.
Cells overlap by 38% because the seam between two differently-displaced cells is
what makes a grid read as shards instead of as liquid.

**What actually cost the most was not the effect.** Reseeding 2,600 particles in
one frame measured 212 ms and dominated every per-page-world direction. It is now
a job spread over six frames from inside the rAF loop, which is invisible under a
ghost and took B, C and F to zero long tasks. The DOM swap itself was never the
problem: teardown 3–6 ms, re-init 5–12 ms, `ScrollTrigger.refresh()` under 2 ms.

The ghost is one frozen copy of the canvas laid over it, which is what lets the
live field become the next page — reseed included — with nothing visible. The
tear needs no second buffer because the front only ever advances: the bright edge
drawn at one frame's position is erased by the next frame's cut.

**Camera and world per page.** `continuum` moves only the camera, so all five
pages are the same tangle seen from five places: Home centred and wide, Work
pushed in 1.42× and off-axis with the light swung to the left, Services between
those two at 1.12× with the light almost straight down, Studio pulled back under
a 1.18 rad tilt, Contact close and low. `chapters` and `pour` change the
attractor itself — Home 0.190, Work 0.155 (large and restless), Services 0.172,
Studio 0.205 (near the edge of chaos, orderly loops), Contact 0.130 at 60 %
density (wide, slow, sparse). `b` sets size and speed as well as character, so each world
carries the extent and velocity normal measured for it; the projection divides by
extent so a looser attractor cannot outgrow the frame.

**Reduced motion overrides every direction.** No mode is allowed to wake the
field: `wake()` re-pours a still frame instead, `fieldPolicy` forces `still`, the
content fade is skipped, the camera snaps, the tear is not drawn and the film
plate does not autoplay. Verified: zero painted frames while idle and zero
ScrollTriggers, in all four directions.

**Direction D is built but not qualified.** It reuses the licensed moon loop that
is already in the repo — no video was generated for it and no credits were spent.
It is in the switcher so it can be judged by clicking, but this exact pattern was
already killed once in this project for mobile cost, and nothing here answers
that: a desktop screenshot is not a phone. It should not be treated as a
contender without a real on-device measurement.

**All footage is sourced, none generated.** `video/ink.mp4` and `video/warp.mp4`
were found on Pixabay under the Content License and graded for the job they do —
a matte and a displacement source, neither of them shown as a picture. See
`IMAGE-CREDITS.md` for the search, the encode and why each is as small as it is.

## The direction that shipped

**A. CONTINUUM.** One world, never reseeded; the camera travels to the next
page's viewpoint over 1.35 s and the key light travels with it. Judged by
clicking through all eight on the deployed site and chosen on how it looks,
which is the only thing a switcher was ever for.

The dev switcher is gone — `js/dev-bg-switcher.js`, its four script tags and its
ember styling. `sessionStorage` is no longer consulted either, so there is no
input to `setMode` at all and `DEFAULT` is simply the site. The six alternatives
stay implemented in `js/bg.js` with the costs they measured, because that
comparison is the argument for the one that ships; nothing selects between them
at run time, and none of them costs anything while CONTINUUM is running.

## The pass that took the empty right-hand half out

Five separate notes, one cause: several rows on this site were built as a left
column with nothing beside it, and the eye had to travel down the gutter to read
them.

**The charter runs on three tracks now**, not two. The outlined numeral, then
the claim as a headline in its own column, then the argument and its practice
line beside it. The claim used to sit on top of its own paragraph in a 62 ch
measure with the right half of a 1440 px page blank; it is a headline and a body
and they belong side by side. Below 1080 px it falls back to the two-track form
it had, and below 760 px it stacks. The heading spans all three rows of its
column so a short claim does not float away from a long argument.

**Team is a two-track band.** The two named principals on the left in the same
hairline index the work uses, the sentence about everyone else on the right.
They are one thought; they were stacked.

**The bar lost its coordinate readout** — `SGP · 01°17′N 103°51′E`, in the top
right of all five pages and again in the menu. It was invented at build time
(`f8cbd19`) and it is the kind of detail that reads as decoration pretending to
be data, which is exactly what the work index was fixed for earlier in this log.
Removing it left the bar as two elements under `justify-content: space-between`,
which would have thrown the nav hard right, so the bar is a three-track grid
now: `1fr auto 1fr`, the nav on the centre line whether or not anything sits
beside it. The placements are scoped to `.bar`, because `.mark` and `.menu-btn`
appear inside the menu panel too.

**The footer is on one line.** Its five items were five different baselines: the
links carried a 2.75 rem tap target and the plain text did not, so each sat where
its own box put it. It is `align-items: center` with the tap target on every
child — measured, all four items now share a centre line to the pixel.

**The effects switch left the footer.** It is a claim the charter makes, not a
site setting, and it had ended up as small print under everything. It lives in
two places now: beside charter article 03, which is the article that promises
it, and in the menu panel, one reach from any page. Article 03's placement is
unchanged; the footer copy is simply gone.

## The vendor row, and the line that makes it safe

Studio's *What sits behind the site* names five real companies, and five real
logos read as a claimed partnership unless something says otherwise. The
disclaimer is not optional dressing: **“Platforms we build on — not partners,
sponsors or endorsements.”** It sits directly under the section's own subhead,
above the first row.

The marks are the vendors' own published files, taken from the vendors' own brand
pages, vendored under `img/marks/` and served same-origin — the CSP's
`img-src 'self' data:` would block a hotlink anyway, and an SVG loaded through
`<img>` cannot run script. Nothing is redrawn, recoloured, cropped or traced.
Where a vendor publishes a dark-background variant, that is the one taken;
choosing between a vendor's own variants is not modifying the mark. Full
provenance, per file, is in `IMAGE-CREDITS.md`.

The one judgement call is size. Three of the five are wordmarks and two are
icon-plus-wordmark lockups whose lettering is roughly half the box height, so a
single CSS height made ZAP and SonarQube Cloud illegible next to Resend.
They are matched on the height of the *lettering* instead — 34 px against 21 px,
uniform scale only — which puts all five on one optical line. The `dt` column
widened from 10 rem to 11.5 rem to hold them.

Two names to raise rather than change quietly: the row says **OWASP ZAP**, but
the project's current official mark reads *ZAP by Checkmarx*, and **SonarCloud**
is now published as *SonarQube Cloud*. The shipped artwork is current and the
`alt` text names what the artwork actually says; the visible copy is left as
briefed, because renaming a service on a client-facing page is a content call.

**Sourcing note.** The brief pointed at `components/ui/platform-marks.tsx` in
`Thornbury_Main_Site` as the component that already solved this. That repository
is not on this machine, so the component could not be read. The *discipline* it
describes — official marks, unmodified, served same-origin, not redrawn or
recoloured — is what was followed, and it is written down here so the next pass
can diff it against the real component.

## Contact, rebuilt

The old page was a form in seven columns with a contact rail in the last four,
under a hero whose subhead sat on the far right at a different height: a lot of
travel and two half-empty halves.

**The three ways in come first, across the full measure.** Email, phone,
WhatsApp, each as a large link with one line under it saying what it is for.
Most people who open a contact page already know what they want to say; the form
is for the ones who would rather write it down, and it now sits under a heading
that says so.

**The brief is a two-track row**: on the left, *three answers make the first
reply useful* as a statement and then three numbered lines saying which three;
on the right, the form. Every child of that grid is placed explicitly —
`.brief-say` 1/5, `.form` 6/-1, `.note` 6/-1 on row 2 — because an auto-placed
child beside placed siblings is exactly how `#brief-note` once shipped 277 px
wide. Below 900 px all three take the full width in order.

**Two facts changed, both of them for the same reason.** The budget select
offered “Under S$10k” to “S$60k and up”, which contradicts the published rate on
the page next door. It is now *What you need*, listing the four real services and
nothing that is not on the Services page, with the two unlaunched ones marked
*in development* in the option text itself. Beside it, the rate is stated in the
copy rather than asked for: S$500 promotional and S$800 fixed, with a link to
where they are set out. And **“Mon – Fri, 10:00 – 18:00 SGT” is gone** — it
traced to the same creation commit as Tanjong Pagar and Q1 2027, nobody has
confirmed it, and the standing rule is that an unconfirmed claim does not stay
up while we wait for one. If those hours are real, they are one line to put back.

The mobile menu also described the studio as “Three people, one room”, which the
real headcount retired several passes ago. It says “How the studio works” now.

## The Team band, second pass: glass

The band sits on the site's persistent canvas, and the liquid field was drawing
straight through the point cloud. Two line drawings at the same brightness fight
wherever they cross, and no amount of tuning the cloud fixes a background that is
also a line drawing.

So the band became glass: `backdrop-filter: blur(26px) saturate(1.15)
brightness(.72)` over a `rgba(8,8,8,.62)` ground. The field is still there and
still moving — the band is not a black box cut into the page — but it is now
*behind*, the way depth of field puts a room behind a subject. Two details make
it work rather than half-work: `isolation: isolate`, so the filter composites
against the fixed canvas instead of the section's own paint, and an
`@supports not` fallback that raises the flat tint to 88% where the filter is
unavailable, so the band is never accidentally transparent.

## The team, expanded

The brief said to source this from the studio's own site. **There is nothing to
source.** thornburystudio.com has no About or Team page — its navigation is
Design / Audit / Optimization / SEO, and the only other route is `/privacy`.
There are no published biographies, no headcount, no founding date.

So the section is built from facts that are already published somewhere real,
and nothing else: the two principals and “around twenty” as already agreed, plus
four answers under them — where we are, what we actually do, how we are
structured, what we will not do. The first of those takes its substance from the
studio's own privacy page, which states that this is a Singapore studio and that
the PDPA governs what a client sends. That is a fact with a source, which is the
only kind this page carries. If real biographies ever exist, they drop into the
same block.

## Security became a comparison, and Ownership learned to speak

Two notes, one cause: both sections were written for someone who already knows
what a content security policy is.

**Security is now “A studio, or one freelancer.”** Six rows, a real `<table>`
with a row header on every row, comparing the things that actually decide a
project: who answers at 2am, what happens before a deploy, what you are quoted,
what happens if it ends, the scope, and what is on offer. It opens by conceding
the point — *a good freelancer can do every line below, and plenty do it well* —
because a comparison that pretends otherwise is not worth reading. The
difference it claims is structural, not about talent. On a phone the three
columns become one stacked card per row, each answer labelled by a generated
`::before`, because three columns of prose do not fit 390 px.

**Ownership now says what a client gets, in the words the studio's own site
uses**, followed by the four things by name: repository, hosting account,
domain, mailbox. Its check is no longer a technical instruction but a usable
one — *ask any studio to put that list in writing before you sign*. Performance
became “Speed” and its check is *open this site on a bad connection*.

**Neither live proof was thrown away.** The self-reading content security policy
and the stylesheet fetched from itself both still run, folded into a
`<details>` marked *for your developer*. They are excellent and they are for
about one reader in fifty; that reader can open the drawer.

## The rig

Eight platforms, and the old shape was eight name/paragraph rows — a wall. The
brief's own idea, built: marks only, four down each side, one readout between
them, and nothing printed until you ask for it.

**It upgrades from a plain list.** The markup ships as a `<dl>` of eight names
and eight one-line descriptions, complete and readable with no JavaScript at
all. `js/rig.js` hides that list, reveals the console, and moves half the tiles
into the second rail. Charter article 03 is not decoration: the page loses
nothing if this file never arrives.

**Two effects, chosen to say two different things.** The platform name arrives
as particles, sampled from the word itself the way the Team band samples a
photograph — the same technique one dimension simpler, on a 2D canvas, so it
costs no WebGL context and no library. The description *decodes*: each character
cycles through a glyph set before it settles, left to right. One says “being
assembled”, the other says “being read out”. Under reduced motion or with
effects off, both are simply absent and the text is just there — verified by
clicking a tile and reading the line 120 ms later, with no scramble in it.

**Three details that were not optional.** Hover previews are suppressed for
`pointerType === 'touch'`, or a tap would run the decode twice. Arrow keys move
between tiles, because eight buttons in two rails is a control, not a list of
links. And `destroy()` puts the markup back exactly as it shipped — tiles
returned to the first rail, rails re-hidden, list revealed — because the effects
switch tears this module down and mounts it again through the same path, and a
mount that found four tiles against eight rows would refuse to run and leave the
section showing neither the console nor the list. Verified across an off/on
cycle: 4 and 4, list hidden, readout live, no errors.

**Copy.** The lead line used to say *five services do the work*, which is wrong
about who does the work. It now reads: **we** do the work, and these are the
platforms it runs on. Every description is one line. Three platforms were added
— Cloudflare, Upstash and Sentry — and the Sentry line is what makes the
comparison table's 2am row true.

## Work: eighteen sites, and no prices

The page carried five cases with invented per-case pricing. It now carries
eighteen, each a capture of a site that is actually deployed in this collection,
and each plate is a link that opens it. That is the claim the studio's own site
makes — *nothing above is a screenshot or a mockup* — and it is now literally
checkable here.

**Chosen, not scraped.** The collection's hub carries a `data-tier` on every
card, which is what its “most advanced” sort runs on. The eleven non-Thornbury
tier-5 sites all went in, plus the four remaining sites the real studio site
already shows publicly, plus three tier-4 sites picked to fill categories the
first fifteen left empty — SaaS, instruments, fitness. Thornbury's own six
templates are excluded: a studio's work page is not the place to show the studio.

**Per-case pricing is gone.** With a published rate one page away, a per-case
number can only either contradict it or be invented. Each plate carries its
sector and a *Live — open it* label that turns ember on hover.

**The grid has a rhythm rather than a tile wall.** Twelve tracks and a nine-item
unit that repeats exactly twice across eighteen: 7/5, then 4/4/4, then 5/7, then
6/6. Four different row shapes, and no plate ever sits directly under one the
same width. Two columns below 1000 px, one below 620.

Each tagline is that site's own hero line, read off the capture — *Run yourself
even*, *One customer. One clean record.*, *Renovation you can see before you
sign.* — rather than a description written about it from outside.

## Verification

Playwright MCP against `http://localhost:8123/templates/thornbury-digital-v5/`
(1440×900 and 390×844; real frames only while the window is frontmost, ~1 fps
when occluded). Two rules the harness forces. Finish intros with
`gsap.globalTimeline.getChildren(false, true, true)` — *immediate* children only,
skipping anything with a `scrollTrigger`: walking the nested tweens completes the
hero handoff as well, which hides the hero and produces a capture of an empty
page. And run the width sweep in an exact-width iframe, because that is the only
place `scrollWidth - clientWidth` is trustworthy.

Checked this pass: console clean across all five pages and across a router
navigation; `scrollWidth - clientWidth === 0` at nine widths × five pages;
one `<main>` and one `<dialog>` after a swap, with `data-page`, `document.title`
and the meta description all following; `TBBg.mode()` ‘continuum’ with no
`sessionStorage` input and a `services` preset present; zero `[data-w]`,
`[data-h]` and `.pc-tr` nodes remaining; the wordmark inside its column at 320 /
360 / 375 / 390 / 414 / 430 / 600 / 760 with 1–24 px of slack; the phone serving
`poster-hero-m.webp` and `hero-m.mp4` and the desktop serving the landscape pair;
reduced motion fetching no video at all; and every hit area ≥ 44 px except the
skip link and the inline links a line-height constrains.

**Not verified here:** no on-device phone measurement. The mobile numbers above
are transfer sizes and layout geometry under device emulation at 390×844, not a
handset. `serve.mjs` binds every interface, so the same build can be opened from
a phone on the LAN.

## The final walkthrough

The night-before pass: the whole site read on a desktop and at phone width,
with the hero and the field left exactly as they were. Six changes, four of
them subtractions.

**A promise nobody made is gone.** “We reply within two working days” — in the
contact page's description, its Open Graph line, its subhead and its sent
state — traced to `f8cbd19`, the creation commit, the same class as Tanjong
Pagar and the office hours before it. The studio's own site states no reply
time. The page now says what is true: a person reads it and replies.

**The years on the home figures were invented.** Fig. 01–05 carried “· 2025”,
“· 2024”, “· 2026”; every one of the five sites entered this repository in
August 2026. The spans and their rule are gone; the meta line is figure and
sector, nothing else — a plate reports nothing it does not know.

**“All five” said eighteen.** The home index's link to Work still counted the
original five cases.

**Four services, two chips, on every page that counts them.** The studio page
says “Four services. Two of them marked in development”, and its charter
promised that both are marked “on every page they appear on, including the
one selling them” — while the services page showed three entries and one chip,
and the practice line named *Optimization*, a word that appeared on no page.
Section IV now lists AEO / GEO and SEO as the two entries they already were in
everything but markup, each behind its own bordered ember chip, with the
“by enquiry” note staying on the AEO / GEO half that earned it. The practice
line names them as the page names them. The contact form's service list is
those four and “Not sure yet”; “Google Business Pack — in development” is gone
from it, because it appeared nowhere else on this site and nowhere on the
studio's own, and an option in a form is still a claim of a service.
thornburystudio.com publishes exactly four — Design, Audit, Optimization
(Soon), SEO (Soon) — which is the count this site now matches.

**Six “Quoted”s were a column of decoration.** Section III's right-hand column
read the same word six times, and the lead line already says every one of
these is quoted against the site it goes into. The labels are gone and
`.mods li` is one track; the figure column returns on its own (`li:has(.fig)`)
for any row the coming chart gives a figure to, so the slot is still real — it
is just not printed empty.

**The rig's marks were smudges at rest.** At opacity .34 and brightness .62 the
second rail — Resend, Sentry, ZAP, SonarQube Cloud — could not be read without
hovering, and a phone has no hover. Rest is now .6, grey, brightness .9:
legible, with the chosen mark the only thing in colour, which is the hierarchy
the rig was built to have. The pull-quote under it said “None of the last
two”, pointing at the foot of a list the rig no longer shows; it names ZAP and
SonarCloud.

**Verified.** Playwright at 1440×900 and 390×844, all five pages, after a
scroll-through so every reveal has fired: console clean; `scrollWidth −
clientWidth = 0` on all ten; four `.devs` entries with two development chips
and two live; zero `.fig`, zero `.yr`; no “two working days” and no “Google
Business” in rendered text; the contact sent-state at 751 px on the desktop
and 343 px at phone width; the rig's resting marks computing to opacity .6 and
`grayscale(1) brightness(.9)`; and no grid child left on `auto` beside a
placed sibling in the two grids this pass touched.

**A capture trap worth writing down.** Full-page Playwright captures of Work
showed up to fourteen plates as empty blueprint grids. Every one of those
images was `complete` with a natural width: the occluded Playwright window
renders almost no frames during a scripted scroll, so lazy images never reach
the intersection observer, while the ScrollTriggers — which listen to the
scroll event — do fire and reveal an empty plate. A viewport-level capture at
the plate's own scroll position shows the image. Judge plates from viewport
captures, never from a full-page one.

**Phone.** No handset is attached to the build machine and it has no adb. A
LAN server with byte-range support (iOS Safari will not play the hero film
without it, and `serve.mjs` sends none) and a probe page that measures all
five pages on the device and posts the numbers back were stood up at
`192.168.10.185:8130` for this pass. The first handset run — Android 10, Chrome 152, 406 × 760 CSS px, dpr 3, coarse
pointer, on 4G — arrived before the directive was stripped and measured an
unstyled page, which is how the trap above was found. The styled run came from an iPhone
on iOS 18.7 (Safari, 430 × 721 CSS px, dpr 3, coarse pointer, no hover) at
05:42 UTC on 7 Sep 2026: all five pages at zero horizontal overflow with
Archivo loaded and JavaScript running; the field active at 61 fps on Home and
on Studio; the wordmark's right edge at 385 px in a 430 px viewport, 30 px
inside the gutter; the rig mounted with its resting marks computing to opacity
.6; no hit target under 44 px; page loads of 1,044 ms for Home (first, with the
CDN fonts and GSAP) and 329–564 ms for the other four. The phone was served
`poster-hero-m.webp` and never asked for `hero-m.mp4`: the probe's iframe
carries no `allow="autoplay"`, iOS refused the play, and the still stood —
the fallback this hero was built for, observed on a real handset rather than
asserted. The Team band had not mounted within the probe's wait and is
unmeasured here.

## Refinement: glass under every band, the switch as a row, and a Privacy page

Better, not bigger. Two clashes the boss could point at, a copy pass, and one
page the site owed itself. The hero and the field are untouched.

**Every band the field ran through is glass now.** The Team band had already
solved this — `backdrop-filter: blur(26px) saturate(1.15) brightness(.72)`
over `rgba(8,8,8,.62)` with `isolation: isolate` — and Speed / Ownership,
the home index, the services inclusions, “what we are not the studio for”,
every “Next” teaser and the whole Work grid were still sitting on the sharp
strands. The treatment is `.sec--rule` itself now, so every non-solid band
gets it and nothing has to opt in. The field is still there and still moving
behind all of them; it is background. The only glass panels inside one of
these bands are the work plates' metadata cards, which carry their own dark
base and now blend with the blurred field rather than the sharp one — a known
ground either way, and on a phone the card is solid anyway. The page-heads
stay clear: the display heading over the strands is the one place a still
page shows the object, and it is the one idea on that screen.

**The switch is a row of the index, not a control in a sentence.** Article
03's practice line still says every effect can be switched off; the switch
itself has left the paragraph. It sits after the fifth article as its own
ruled row — a mono label, one sentence, and a switch with a 46 × 22 px track
that is the point of the row — and it throws the same junction it always did.
The menu panel keeps its copy of the button. Measured: throw it and `html.rm`
is on, both switches read Off, ScrollTriggers 7 → 0, the field inactive;
throw it back and all of it returns.

**Copy.** Where a paragraph could be one sentence without losing its fact, it
is: the Approach sub, the Services subhead and rates note, the section IV
sub, the “by enquiry” note, the Work subhead, the brief's first line, the
team sentence, all four answers in the studio key, and both pillars with
their checks. The charter articles are the studio's own words and were not
touched.

**Privacy.** `privacy.html`, linked from the © line of every footer and from
the studio key's “Where we are”, and from nowhere in the navigation. Every
line of it describes what this build actually does — checked, not asserted:
no script on the site sets a cookie or touches storage (`grep` for
`localStorage|sessionStorage|document.cookie` returns nothing); the only third
parties a page contacts are the ones the CSP allows, so the page names Google
Fonts and jsDelivr and says what they see; Resend, Vercel, the PDPA, the
one-email retention and the access / correction / deletion route are the
studio's own published policy (thornburystudio.com/privacy, dated 26 August
2026). The page is dated the day it was written, because the date has to be
the date the site last behaved differently. It routes like every other page
(`data-page="privacy"`, still field; `bg.js` falls back to the home
viewpoint for a page it has no preset for, which is fine for a page most
visitors never open), and it is in the sitemap at a yearly cadence.

**Small things found on the way.** The three footer links measured 13 px
tall and now measure 44, like every other target on the site.

**Verified.** Playwright at 1440 × 900 and 390 × 844 across all six pages:
console clean; zero horizontal overflow; every `.sec--rule` computing the
blur, the tint and `isolation: isolate`; the Privacy link present in all six
footers; the router swapping studio → privacy with one `<main>`, the title
and `data-page` following; the switch row throwing and restoring as above.
No phone opened the LAN probe against this build inside the window this pass
stayed open for, so the handset numbers above are from the previous build; the
glass bands and the switch row are measured only in Playwright at 390 px here,
and the frame-rate cost of a full-viewport blur over the live field on a phone
is the one number this pass still owes.

## Three pieces: the layered transition, the second look, and a 4K backdrop

The field is untouched. Three things around it changed.

**The transition has two layers, at two rates.** Navigation used to be a
300 ms class fade with 14 px of lift, run *before* the camera started to move:
sequential, and it read as a cut. Now the page's words are a plate over the
liquid, and the plate has its own motion: on the way out it sinks — recedes to
.962, softens to 10 px of blur, drops 2 vh and goes — in half a second on
`power2.in`, while the camera underneath starts its own 1.35 s travel at the
same instant. Once the plate has gone, the next one rises out of the same
depth over .78 s on `power3.out` and lands before the camera does. Foreground
fast and decisive, background slow and continuous; the two rates are what
make it read as layers instead of a crossfade, and nothing else moves: a
routed arrival no longer stacks the page-head intro on top (`intro: false`
after a swap), so the plate rising *is* the arrival. The swap itself waits for
both layers — the mode says when the background is ready to commit, the
plate says when it has gone — so neither is cut short. Blur only on a pointer
device above phone width; a phone's plate sinks without it. Every inline
value is cleared at the end, so at rest `<main>` is not a stacking context
and the glass inside it still blends from the root. Without GSAP the old
class fade stands in.

Judged from scrubbed frames rather than a live window (the harness renders
about one frame a second): exit at .12 / .25 / .38 / .5 s and enter at .08 /
.2 / .4 / .78 s, driven through `gsap.globalTimeline.time()` with the timeline
paused. The two layers do not fight, because only one plate moves at a time
and the field's motion is continuous underneath it. Measured at rest after a
navigation: `main` carries no `style` attribute, one `<main>`, `data-page`
following. What this pass could not measure is the feel of the timing at 60
fps; the numbers are the design, not a recording.

**The second look, made literal.** A full-bleed band on Studio between the
charter and “what we are not the studio for”: two renders of one composition
— a black hole and its wireframe schematic, supplied by the studio at
4096×2288 — with the schematic masked to a round window that follows the
pointer (`js/reveal.js`, a radial-gradient mask driven by three custom
properties, one rAF loop that lerps and then stops). Inside the window the
structure assembles rather than appears: four leader lines draw themselves
(each an SVG path with a dash the length of the line, offset to nothing,
transitioned to zero, 150 ms apart) to anchors on the geometry, and the four
labels — *Event Horizon (Rₛ)*, *Orbital Mesh Trace (w/ Force Vectors)*,
*Einstein Ring Contour*, *Red Trace Filament Path* — resolve out of noise
through the rig's own decoder, now exported from `js/rig.js` rather than
built twice. The schematic had been generated with those labels baked in and
they were stripped before upscaling on purpose; they are live elements now,
positioned as percentages of the image, so the pair can be swapped for any
other pair that shares a composition. The stage keeps the image's own aspect
and never exceeds `140vh`, so the whole composition is always on screen; on a
phone it runs 120 % wide, because the image's edges are black and a
postage-stamp black hole is not the point. Leaving the band retracts the
lines and blanks the labels, so re-entering assembles them again. Touch: a
tap opens the window, a second tap closes it. Keyboard: the stage is
focusable, focus opens the window at the centre, the arrow keys move it,
Escape closes it. Under reduced motion or with effects off the module never
mounts and the band is the surface and its sentence. The caption says what
it is — article 03, made literal — and nothing more.

Measured: the module mounts on approach (`is-live`), the window opens to
253 px at 1440 and follows the pointer, all four `stroke-dashoffset`s reach 0
and all four labels resolve to their full text, and leaving resets radius to
0 and every label to empty. Phone width: the stage at 450 px in a 390 px
viewport with zero page overflow.

**The hero backdrop is a ferrofluid, in 4K.** The moon was an HD master and
the brief asked for a genuinely 4K backdrop. Twenty-odd candidates from Pexels
were read off contact sheets; the rendered loops (black ribbons, metallic
cubes, floating spheres) were passed over for the same reason the computed
backgrounds were killed on v6 — a visitor cannot attribute them to anything
real — and the one that stayed is a real macro of ferrofluid in super slow
motion (Pexels 16296848, Film Composite, 3840×2160): liquid metal on black
under one light, which is this site's own material. Cut like the moon was —
forward then reversed so the loop never cuts, 358 frames at 24 fps — graded
to chrome and served in three tiers: 1080p (4.67 MB) for desktops, 1440p
(6.92 MB) from 1800 px, and a 1080×1920 portrait crop (2.74 MB) for phones,
the crop chosen from three renders so the brightest highlight sits top-right,
away from the wordmark. A ferrofluid is all specular detail and costs about
twice what the moon did; the still is still what the page ships, and the film
is still attached from `requestIdleCallback`. Every reference carries `?v=2`.
The hub card was re-captured from the new hero. Full encode in
`IMAGE-CREDITS.md`.

Verified: at 1440 the hero plays `hero.mp4?v=2` at 1920×1080, at 1920 it
plays `hero-lg.mp4?v=2` at 2560×1440, at 390 it plays `hero-m.mp4?v=2` at
1080×1920 over `poster-hero-m.webp?v=2`; console clean; zero overflow.

**Decided against, and why.** A generated pair of my own for the reveal:
Gemini's prepaid credits were exhausted mid-pass and no other generator is
wired to this machine, so a real fallback was built first — a live site from
the Work page as the surface, its actual DOM drawn as a schematic underneath —
and then retired the moment the studio's own pair arrived, because the brief
named that pair. The Kiyo pair is not in the repository.

## The hero backdrop, third time: the Moon, from NASA

The ferrofluid was well made and did not land: an abstract macro reads as
texture, not as a thing, and the first reaction was confusion. The brief came
back asking for a real space subject with instant recognition and scale, from
NASA's public-domain archives before any stock.

**What was found.** NASA's image library and the Scientific Visualization
Studio, searched for moon, 4K, libration. Four real candidates: Earth from the
ISS (jsc2021m000138, genuine 4K) — grand, but a horizon rather than one
object, and blue and white on a site that has no third hue; the 2016 Mercury
transit in 4K — a sun that reads as a moon once it is grey; the Tour of the
Moon 4K Redux (SVS 4619) — camera flyovers, which is surface again; and Moon
Phase and Libration, 2026 (SVS 5587) — the whole disc, rendered from Lunar
Reconnaissance Orbiter data at the Moon's true phase, libration and apparent
size for every hour of the year, on black, in a plain unlabelled 4K cut.

**Why it won.** It is the one clear object the brief asked for, it is real
data rather than an artist's moon, it is monochrome by nature so the palette
costs it nothing, and it is public domain with a credit line NASA asks for
and gets. It is also what this site's hero was before any of this: a moon,
low in frame, with the wordmark standing in the sky above it — now at 4K and
from the source rather than a stock render.

**The cut.** A 20 s byte-range pull around the September full moon instead of
the 300 MB file; the fullest frame (highest mean luminance) taken as centre;
48 frames either side — two days each way, so no terminator ever shows —
played forward then backward: 190 frames at 24 fps, 7.9 s, seamless. The disc
is composed low in the encode itself (540 px of black padded above the 4K
frame, then cropped back to 16:9) so its top edge sits at a third of the
frame; the CSS no longer has to push the picture around, and the only motion
it adds is a 28 s push-in on the GPU. The portrait cut scales the frame to
1400 wide and keeps the middle 1080 columns, so a phone gets the whole disc at
about two thirds of its width with the type above it, not a crop of the
surface. Three tiers, posters from each first frame, `?v=3` everywhere.

| Tier | Size |
|---|---|
| 1080p, desktops | 1.36 MB |
| 1440p, from 1800 px | 1.88 MB |
| Portrait, phones | 0.73 MB |

**Verified.** Playwright: at 1440 the hero plays `hero.mp4?v=3` at 1920×1080,
at 1920 `hero-lg.mp4?v=3` at 2560×1440, at 390 `hero-m.mp4?v=3` at 1080×1920
over `poster-hero-m.webp?v=3`; every tier reports 7.92 s and 190 frames; the
push-in computes as the running animation; console clean; zero overflow. Seam:
the loop point measures 40.1 dB PSNR against 44.2 dB for an ordinary frame
step — one hour of libration apart either way, indistinguishable in motion.
Posters: 59 kB landscape, 45 kB portrait. The hub card was re-captured.

**On the phone.** An iPhone 14 Pro Max on the LAN (iOS 18.7 Safari, 430 × 721
CSS px, dpr 3, coarse pointer) ran the probe against this build at 08:26 UTC
on 7 Sep 2026: all six pages at zero horizontal overflow with the stylesheet
and JavaScript live; the hero served `poster-hero-m.webp?v=3` first and then
played `hero-m.mp4?v=3` at 1080 × 1920 — the probe's iframe now allows
autoplay, so this is the film actually running on a handset; the field active
at 60 fps on Home over the glass bands and 61 fps on Studio; the rig mounted
with its marks resting at .6; the wordmark's right edge 30 px inside the
gutter; no hit target under 44 px; Home in 319 ms and the other five pages in
85–152 ms over Wi-Fi. The Team band did not mount inside the probe's wait, so
its cost on a phone is still the one number this log does not have.

## One system, six cases, and the receipt

The boss's correction: nothing is cut. Five effects stay, and the direction
is to make them read as one synced system. Three things followed from that,
plus the case pages and the studio's own security record.

**The Team band has its ground.** The reference under this band carries three
populations — the body fill, a flowing ground layer, a sparse ambient — and
this one had the figures, a faint strand sheet and the starfield. It now has a
fourth draw call, `GROUND_VERT` in `js/figure.js`: 8,400 particles on the
floor plane (3,200 on a phone), more than half of them standing where the
figures stand and the rest receding, drifting across the frame under two
crossing swells, each drawn as a trail from where it was 0.7 s ago to where it
is — so length is velocity, which is the law the liquid field on every page
already obeys. Crests are brighter than troughs; the sheet thins into the
distance and at the edges; the pointer lifts a dimple in it. The old strand
sheet steps back to gain .46 and stays.

**The scroll pushes both objects.** The field's yaw impulse — sampled once per
frame, above 0.4 px/ms, decaying with a ~0.36 s half-life — now also pushes
the ground's drift speed, through the same sample in `js/main.js`
(`figureHandle.impulse`, at 2.4× the field's radians per second in floor
units). A flick down the studio page turns the ground's trails into bright
streaks that settle back on the same curve the field settles on. The band's
pointer now eases with the second look's constants (.16 position, .12
radius), so the lens on one and the dimple on the other move alike. Phones
cap the band at pixel ratio 1.25.

**Six cases open here.** Midwater, Loam, Null Carnival, Candela, Ephemeris
and Chalkline each have a page — `case-<slug>.html` — with the site's plate, a
line to open the live site (secondary, not the click), what it is, six
decisions in the charter's own three-track shape with a mono *Check* line
where the log gives a receipt, four measured figures, and the next case.
Every sentence is taken from that build's own `DESIGN.md`; the four with no
log (Kiyo, Aurel, Form/01 and the rest of the eighteen) keep their plates and
open the real thing. Home's Midwater and Loam entries go to their cases. The
router treats a case page as Work (`markNav`), the pages carry
`data-page="case-…"` and a still field, and they are in the sitemap.

**The security record, where it earns trust.** From the studio's own
`SECURITY.md` (v9, 26 August 2026): a content security policy that omitted
`script-src` fell back to `default-src` and blocked every inline script on
the production site — the build passed, the review passed, the pages rendered,
and nothing could be clicked for about seven hours until a person opened it
in a browser. It is on the studio page as *Article 05, in practice*, the row
after the switch, in plain words with the date; it is the reason the
comparison table's *before anything goes live* row now ends with a person
clicking through the live deploy. And Rule 2 — the client creates and owns
every account (domain, hosting, payment provider, business profile,
analytics, mailbox) and the studio takes delegated, revocable access, with
error monitoring and rate limiting the two named exceptions because they are
shared plumbing — is now the Ownership pillar's own paragraph, replacing the
generic one.

**Verified.** Playwright at 1440 and 390: all six case pages at zero
overflow, console clean, six decisions and four measurements each, plate
loaded, Work marked current in the bar and the footer; no grid child left on
`auto` beside a placed sibling in the decisions, the measured key or the next
teaser; Work → case and case → next case both swapping through the router with
one `<main>` and no inline style left at rest; the Team band mounting with the
ground drawn, 50,093 figure points, at 96 fps on the desktop harness.
The band's cost on a real phone is measured by the LAN probe, which now scrolls the band into view, waits nine seconds for three.js to build, and samples the frame rate; no handset opened it inside the window this pass stayed open for, so the band's phone frame rate is still the one number this log owes; the last handset run (08:26 UTC, before the ground layer existed) had the page itself at 61 fps on Studio with the band not yet mounted.

## Who we are: the band is the section

The Team band was a cool effect sitting near a technical caption. It is the
"who we are" section now, and the words and the figures share one stage.

**The words are the studio's own.** From `about.ts` on the studio's real site,
verbatim: the opening claim — *Thornbury is new. We would rather you heard it
from us.* — and its two paragraphs; the two principals; *And behind the two of
us*, the founding-team note (around twenty, most building their first company,
none of them a stock photograph); its own footnote (founding team, not
headcount; people named when they are ready and not before); and *Where this
goes* — *We are not trying to become a large agency* — with its paragraph. The
four answers in the key follow, unchanged. The one edit is a pointer: "This is
that document" became "The charter above is that document", because on this
page the charter sits above it.

**Several forms, not one pose.** Four instances now, each its own licensed
photograph traced the same way — shape and surface direction only, no colour,
no face, nobody who works here: the group at the table (the original), a pair
in conversation (Pexels 7652461), one person walking (13474407) and one seen
from behind (7223491, cropped to that figure). Each has its own place in the
room, its own depth and turn, its own idle sway, and a staggered assembly so
the forms gather one after another. They read as the collective in motion,
not as named people doing named jobs, which is how `about.ts` wants it. Two
candidates were dropped because the cut-out kept the furniture they touched;
the relief constant is now fitted per pack to a mean in-plane normal of .62,
where the first pack had been tuned by hand, because it does not travel
between photographs. 114,962 points on a desktop.

**Room, and holding still.** The canvas is sticky for the height of the
section, so the figures hold in view while the copy scrolls past them, and
assembly is keyed to how much of the stage is on screen rather than to its
centre, which a tall section never brings past the viewport's. The copy runs
five of twelve tracks on the left; the ensemble sits to the right; on a phone
the words come first and the ensemble, slid to the middle and smaller, sits
beneath them. Points are smaller on a phone, because the additive cloud
over-exposed at a phone's density.

**Measured.** Playwright: at 1440 the band mounts with 114,962 points, the
canvas pinned at the bar's height while the section scrolls, the copy column
522 px wide, zero overflow, console clean, and the harness's uncapped rAF at
130 fps; at 390 the copy runs full width, the figures fill a 27 rem stage
under it, zero overflow. Playwright's localhost origin had been left at 33 %
browser zoom by something earlier in the session, which made every element
measure three times too wide and every capture black; the harness now uses
127.0.0.1, a separate origin at default zoom — worth remembering.

## Who we are, rebuilt: one stage

Two things were wrong with the last pass, both confirmed by looking at it.

**Why only one figure was there.** Four packs were built; one was visible.
Not a stagger and not a rendering fault: the three new packs had been cropped
and downscaled to keep the harness's frame rate up, and the tracer walked
every pack at a fixed stride of two, so a 257 px-wide pack yielded a tenth of
the points the 900 px original did, on a body the same size in the room. They
were being drawn — as dust. The tracer now aims at a point budget per form
(stride one, thinned by probability to the budget), so every form reads at
about the same density whatever the pack's pixel size; and two of the four
had also been placed under the copy column or off the right edge.

**The forms.** Six now, each a licensed photograph traced to shape and
surface direction only — no colour, no face, nobody who works here — and
each doing something you can name: the group at the table (the original), a
pair in conversation, one walking, one walking with a box (Pexels 7217919),
one behind a camera (8114141), one with a hand raised (4918523). The
seen-from-behind figure came out; a plant-carrier was mated and dropped for
a noisy halo. 108,026 points on a desktop, 48,445 on a phone.

**The composition.** The claim and its two paragraphs open in the flow. Then
the stage takes the full width and holds for three screens of scroll while
four beats of the studio's own words arrive over the figures, one at a time
— *Two principals*; *And behind the two of us*; *Founding team, not
headcount*; *Where this goes* — each a caption tied to the form it answers
to by a leader line that draws in, the same device the second look uses. The
anchors are not guessed: the figure module projects each form's chest
through its own camera after every resize and hands the stage fractions to
the page, which stands each caption above its form, spaces them so none
overlap, and draws the line. The form a beat is about is lit while the
others hold at a steady presence, never absent; by the end all four beats
and all six forms are there together. The closing sentence and the
four-answer key follow in the flow. Without motion, or on a phone, the beats
are a ruled list under the figures and everything is lit alike.

**Measured.** Playwright at 1440: six forms mounted, four captions in a row
with their leaders landing on the forms, first beat in at 12 % of the track
and all four by 72 %, console clean, zero overflow. At 390 (device metrics
override — `setViewportSize` was being ignored by the harness): list mode,
four beats present, 48,445 points, zero overflow. The real-phone frame rate
of this stage is still owed; the probe samples it.

## Who we are, rebuilt again: four steps, one figure each

Rejected once more, for a sharper reason than execution: a particle
silhouette by itself says *a person*, never *what the person is doing*. So
the stage stopped trying to convey generic activity through pose and now
carries the studio's real four-step process from `about.ts`, one form per
step, each captioned with its own step by the same leader-line device.

**The forms.** Each was chosen because the prop is part of the silhouette
— that, not the body, is what made the reference legible. *01 We look before
we draw*: binoculars up (Pexels 9143802). *02 We decide in the open*: a
presenter pointing at a whiteboard on its stand (7869061); the cut-out model
treats the board as background, so the board and its posts are put back into
the matte by polygon before the pack is built. *03 We build it to survive
us*: a figure at a standing desk with both hands on the laptop (5301762),
cut to the figure, the laptop and the desk top, the railing behind removed.
*04 We hand over everything*: two figures with a box changing hands between
them (6818155). All earlier packs are retired; nothing on the stage is
uncaptioned.

**Two things found on the way.** The tracer's point budget assumed 55 % of
every pack lay inside its matte; the binoculars pack is 11 % inside, so it
was getting a fifth of its points — the budget now counts the pixels that are
actually inside. And a desktop stage is three times a phone's height, so the
same points spread three times thinner and read as dust; the figure points
now carry a gain (1.5 on a desktop, 1 on a phone, where the earlier pass had
over-exposed) and a larger desktop point size, and the ensemble sits at .7 so
four props have a lane each with nothing clipped at either edge. The captions
keep their beats, leaders and focus; the step being read is lit, the others
hold. The team narrative — principals, the founding team of around twenty,
not headcount, where this goes — moved out of the stage into the flow below
it, two columns, verbatim as before.

**Measured.** Playwright at 1440: 131,870 points, four forms in a row with
air between them, leaders landing on each, console clean, zero overflow, the
harness's rAF at 60 fps with everything mounted. At 390 (device metrics
override): list mode, 59,710 points, zero overflow.

## Who we are: one scene at a time

The reference, looked at properly at last: its team is never five people
frozen in one frame. It runs three pre-rendered particle artworks as a
sequence — a picture holds, comes apart into a scatter, the next gathers out
of the same cloud while it is still flying — so the team is the same light
rearranging itself into the next thing they do. Zane's note was exactly
that: they appear, then change to another activity. Four forms in a row was
the wrong shape for it.

**The sequence.** The stage is one screen in the flow. It holds a tableau
for about five seconds, then becomes the next one: 01 binoculars up and a
camera held up; 02 one at the board, two listening; 03 hands on the laptop,
the review at the table behind; 04 the box changing hands, one already
carrying it away. The row above the stage captions whichever step is on
stage — its step lit, its sentence open, a leader line to the form it names
and a hairline that fills over the hold — and any step can be chosen from
the row; a choice made mid-change lands after it.

**The change, and why it is not the reference's.** Theirs scatters pixels
of a flat picture. Here every point has a home in the scene that is leaving
and a home in the scene arriving, and it travels between them on its own
arc — lifted, blown across the room in a sweep that runs left to right (and
right to left the next time, so a scene never leaves the way the last one
came), staggered by a hash and by where it stands so the change crosses the
stage as a wave — glowing while it is in the air. Points a scene has no use
for park below the floor, out of frame, and rise out of it when the next
scene needs them. The whole cloud turns a little through each change, which
a flat picture cannot do. One buffer write per change; nothing per frame
but uniforms. The forms remain licensed photographs traced to shape and
surface direction only: no colour, no face, nobody who works here.

**Measured.** Playwright at 1440: 56,073 points in the cloud, the first
change beginning about two seconds after the caption row settled, the
leader redrawn to the arriving form, the chosen step landing on a click,
console clean, zero overflow, the harness's uncapped rAF at 127 fps
through a change. The phone runs the same sequence under a 26 rem stage
with the steps as a list, the one on stage marked.

## The tableau turns, and a phone stops paying the desktop's packs

**The cloud turns.** After the sequence landed, the stage was still a
relief facing the camera. It now has a slow turntable (~0.06 rad/s, the
same rate as the field), the pointer's own yaw and pitch on top of that,
and a swing through each change so a scene never arrives from the angle
the last one left on. Uniforms only; the homes stay where they were
compiled.

**A phone gets its own packs.** The tracer was reading the desktop
photographs on a 390-wide stage and throwing most of the bytes away. Eight
half-size `-sm` cuts now sit next to the desktop packs (587 KB together,
against 1,384 KB). `figure.js` picks the tier from the shorter viewport
edge. Five inner pages that had no `og:image` now share the hero still.

**Verified, this build.** Playwright at 1440 / 390 / 320 on all six
pages: zero overflow, console clean. The band mounts with 56,011 points
at 72 fps on the desktop harness, 25,130 at 390 and 25,193 at 320 (the
harness's uncapped rAF, 157 and 165). Home's field at those widths: 104 /
164 / 163. Chrome at 390, device metrics, after the band had nine seconds
to build: 25,000 points, 113 fps, the 26 rem canvas, step 02 marked, no
overflow. Home at 390 served `hero-m.mp4` playing at 1080 × 1920.

**On the phone.** The same iPhone 14 Pro Max (iOS 18.7 Safari, 430 × 721
css px, dpr 3) opened the LAN probe three times against this build
(13:03, 13:05, 13:08 UTC). Overflow 0 on all six pages; stylesheet,
Archivo and JavaScript live; the band mounted with 25,430 / 25,078 /
24,989 points. Frame rate was 31 fps on Home *and* on Studio with the
band on — the same number, on a page that does not mount the band — so
this is the handset sitting at a 30 Hz cap (Low Power, or the probe
iframe), not the figure's cost. The earlier 08:26 run, before the ground
and the sequence, had this phone at 60 fps on Home and 61 on Studio with
the band not yet mounted. Hit targets, wordmark gutter and platform-mark
rest are unchanged from that run.

## The first viewport, back to the spread form

Commit 4886863 made the field the first viewport in place of the Moon film
— that direction stands — but it also pulled the camera back to .70 and
spent 9,000 strands on the hero with a slower wipe, and the object came out
compact and knotted instead of the dramatic, spread form the field had
before. Reverted those two things only: the home camera is back at zoom
1.00 / ay .50 and js/field.js is back to its pre-4886863 state (2,600
strands on a desktop, 900 on a phone, the old wipe), so the object reads
large and confident again. The hero markup, the type at the lower left and
everything else in that commit are untouched. Playwright at 1440: console
clean, the harness's uncapped rAF at 165 fps.

