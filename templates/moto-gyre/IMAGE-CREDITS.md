# Image & media credits — GYRE

Every machine on this site is an original design generated for this fictional
marque. No real motorcycle manufacturer's vehicle, photograph, footage, logo
or trade dress appears anywhere in it.

## Generation

All seven master frames were generated with **Nano Banana 2 (Google), via
Higgsfield**, at 4K (5504×3072), 19 Aug 2026. One shared STYLE block (studio,
lighting, physics constraints, marque design DNA) was repeated verbatim across
the set with only the subject sentence varying — that is what makes five
different machines read as one marque. The cinematic hero frame was generated
*from the approved APEX stage frame as an image reference* so the hero and the
garage show the same machine.

| Master | Used for |
| --- | --- |
| `stage-apex` | garage stage, rail card, `dna-halo` crop |
| `stage-camber` | garage stage, rail card, `dna-spine` crop |
| `stage-rake` | garage stage, rail card, `dna-swing` crop |
| `stage-trail` | garage stage, rail card |
| `stage-slip` | garage stage, rail card |
| `hero-key` | home hero poster + video keyframe, hub thumbnail |
| `manual-apex` | teardown plate, home teardown teaser |

Detail crops are always cut from the 4K masters, never generated separately,
so a machine cannot drift between its hero and its close-ups.

**Hero video:** one 5-second, 2K image-to-video pass (**MiniMax H3, via
Higgsfield**) from the approved `hero-key` frame — a single slow dolly
push-in, generated once under the repo's `VIDEO-POLICY.md` (plan → generate
once → inspect). The perceived length on the page comes from a ping-pong
encode, not extra generated seconds. Adobe Stock was searched first per the
policy's asset order; existing footage cannot depict a fictional marque's
machine, which is documented here as the tier-1/tier-2 exhaustion rationale.

**Credit spend for the full set** (verified against the account ledger):
~43 credits of images (7 masters + 2 failed jobs + 2 DNA re-rolls at 3
credits per 4K frame) and 20 credits for the single video pass, from a
911-credit balance. No unlimited allowance was used.

## QA pass (why some frames were patched, not re-rolled)

Nano Banana occasionally writes gibberish micro-text onto flat mechanical
faces (brake calipers, side panels). Where the frame was otherwise approved,
those small flat regions were cleaned with targeted `ffmpeg delogo`
rectangles instead of spending credits on re-rolls — invisible at production
display sizes. Frames re-rolled for real failures: the first APEX stage frame
and the first hero frame both drew a slot lamp instead of the marque's
signature ring ("halo"), which is a design-DNA break, not a blemish. Embossed
illegible casting marks on engine cases were left in place — they read as
abstract part markings, which the prompt explicitly allowed.

## One identical grade pass

All dark stage frames: `colortemperature 7600K mix 0.25` + slight contrast,
cooling the set onto the site's ink ground. The bone teardown plate got
contrast only. Exports are WebP: 2200-wide stage frames, 800×600 rail cards,
1200×750 DNA crops, 1920-wide hero poster, 960×600 hub thumbnail.

## Marks

`img/favicon.svg` (the volt halo ring) is original to this template, drawn by
hand as SVG. The GYRE wordmark is plain set type (Archivo) plus that ring —
deliberately not an imitation of any real marque's badge.
