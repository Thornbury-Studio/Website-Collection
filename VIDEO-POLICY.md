# AI video generation & credit conservation policy

AI video generation is expensive. Treat video-generation credits as a limited
production budget — real numbers in [[higgsfield-credit-budget]] (memory):
video runs **~48 credits/clip** against a **~1000/month** plan, vs. **~2
credits** for a still image. Video is ~25-30x a still.

These rules apply to **all future AI video generation tasks** in this repo
(and any client-site work spun out of it) unless the user explicitly says
something equivalent to *"ignore the video credit rules and generate freely."*
A large budget, a premium benchmark, or a request for higher quality does
**not** by itself disable this policy — say a client project is worth
SGD $50,000, it still follows these rules unless explicitly overridden.

The objective is **not** to generate many candidates and pick the best one.
The objective is:

> **PLAN → GENERATE ONCE → INSPECT → KEEP IF GOOD**

Never burn credits through blind iteration.

## Asset decision order

Work down this list; stop at the first tier that produces an excellent result.

1. **Existing legally usable video.** Search first — Adobe Stock or another
   reputable, commercially-licensed library (see [[client-preview-copyright-sg]]
   for the licensing rules this repo already follows for stills). If excellent
   footage already exists, use it. Do not generate AI video unnecessarily.
2. **Existing legally usable image.** If video isn't available but excellent
   photography exists, ask whether the design actually needs motion. A strong
   still with good web-native motion (CSS parallax, masking, scroll-driven
   transforms) can beat spending credits on video.
3. **Generated image.** If nothing sourceable fits, generate the static
   keyframe first and perfect it — subject, composition, environment,
   lighting, materials, colours, framing, aspect ratio — before attempting
   video. Image generation is far cheaper than repeatedly correcting mistakes
   through video generation. Follow [[nano-banana-usage]] for the image-gen
   path itself.
4. **Image-to-video.** Prefer this for AI video wherever appropriate. Animate
   the *approved* source frame with controlled motion, once it's locked.
5. **Text-to-video.** Only when there's a strong reason the prior tiers can't
   produce the required result. Not the default.

## Before every paid video generation

Define these internally before pressing generate:

- **Subject** — exactly what is visible.
- **Composition** — subject position; what's foreground vs. background.
- **Camera** — one specific, named movement (see Camera rule below).
- **Lighting** — direction, colour temperature, reflections/highlights.
- **Environment** — exactly where the scene is.
- **Motion** — what moves, what stays still.
- **Duration** — only the length genuinely required.
- **Aspect ratio** — determined by the final destination, not guessed.
- **Continuity** — what absolutely cannot change during the shot.

## Prompt structure

Concrete visual instructions, in this order: **Subject → Environment →
Composition → Lighting → Camera → Subject Motion → Environmental Motion →
Constraints.**

Avoid vague intent-words — "make it cinematic," "make it beautiful," "make it
epic," "make it premium." Translate the intent into actual visual properties
instead (e.g. not "premium," but "soft top-down key light, brushed-metal
reflections, shallow depth of field").

## Camera rule

Prefer controlled, single-intent movement: slow dolly forward, slow tracking
shot, controlled lateral slide, gentle orbit, locked camera, gradual crane,
slow push-in, deliberate pull-back.

Avoid unless the creative requirement genuinely justifies the extra
generation risk: chaotic 360° movement, multiple impossible camera
transitions, extreme rapid rotations, unnecessary drone acrobatics, or
simultaneous complex camera *and* subject movement. Complex motion increases
failure probability.

## Physics rule

Avoid unnecessarily complex physical interactions — video models struggle
with hands manipulating complicated objects, liquid transfer, complex
collisions, multiple interacting vehicles, mechanical transformations,
complicated crowds, objects entering/exiting each other, or physically
precise sequences. Simplify the shot whenever the same visual objective can
be reached more reliably a simpler way.

## Text rule

Do not ask the video model to generate important readable text. Brand names,
UI, product names, signs, and typography get added afterward through web
design, compositing, or editing — not by re-rolling video generations to fix
malformed AI typography.

## Vehicle rule

For cars, motorcycles, and other vehicles, visual continuity is critical.
Prefer **approved static vehicle design → image-to-video** over repeatedly
asking text-to-video to reinvent the same vehicle. Protect from changing
mid-shot: headlights, wheels, body panels, proportions, mirrors, suspension,
exhaust, paint, seat, branding, mechanical structure. Simple camera movement
around a consistent machine beats spectacular motion where the vehicle
mutates between frames.

## Generation count

Default: generate **one** carefully planned candidate, then inspect it.

- If it succeeds — **stop generating.** Do not generate alternatives just
  because credits remain.
- If it fails — identify the *exact* failure (wheel geometry changed, camera
  moved too fast, subject left frame, lighting flickered, vehicle
  transformed, composition too tight, etc.) and change only what's needed to
  fix that. Do not randomly rewrite the whole prompt.

## Resolution strategy

Don't default to maximum resolution during experimentation when the
platform's workflow allows economical validation first. But also don't build
a workflow that needs repeated expensive upscaling when a high-quality final
generation is clearly the better call. Choose by total expected credit cost.

## Duration strategy

Generate the shortest useful duration — not 10 seconds when the site needs 4.
A web hero can create a much longer *perceived* experience for free through
looping, reversing, scroll control, editing, transitions, speed adjustment,
or hold frames, without buying extra generated seconds.

## Web engineering before regeneration

Before regenerating a video because it "doesn't work on the website," check
whether the fix is actually cropping, CSS positioning, masks, overlays,
colour grading, playback speed, reversing, looping, editing, responsive
framing, poster frames, transitions, or compositing. Don't spend generation
credits on problems frontend engineering solves for free.

## Exception

These rules stay active by default. They may only be bypassed on an explicit
instruction equivalent to *"ignore the video credit rules and generate
freely."*

## Core principle

Treat every AI-video generation like a production shoot that costs money.
Think first. Frame first. Use stills to validate the visual direction.
Animate approved imagery whenever possible. Generate once. Inspect. Only
regenerate with a specific reason. The goal is not maximum generation — it's
maximum usable quality per credit.
