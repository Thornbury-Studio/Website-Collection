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

**Still carrying invented figures, outside this page:** `work.html` prices each
case (“From S$48,000” down to “S$6,800”) and `contact.html` offers budget bands
from “Under S$10k” to “S$60k and up”. Both predate the real rates and both now
contradict them. They are left standing only because the case content is being
replaced from the studio's real writeups in a separate pass.

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
| “Mon – Fri, 10:00 – 18:00 SGT” | `f8cbd19`, same class | **still standing, unconfirmed** |

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
The address appears in the footer and the mobile menu of all five pages and in
the contact page's aside; the phone appears in all three of those places; the
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
