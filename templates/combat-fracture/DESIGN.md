# FRACTURE — design notes

A 3D flagship for an underground fight-night promotion (bare-knuckle-adjacent,
all fighters fictional). The site's surface is a fractured concrete plane, and
the one rule that separates it from its neighbours: **nothing glides. It snaps.**

## Concept

carnival-null already owns "continuous room turning around you" and
festival-voltflood owns "everything hangs off one clock." FRACTURE's chaos
mechanism is neither: it is **impact-triggered**. One debris field of ~1,400
instanced concrete/glass fragments holds still — jagged, settled, dead quiet —
until scroll crosses a section threshold. Then a shockwave: the camera kicks,
the entire field violently re-forms into the next composition, a
chromatic-aberration hit slices the frame, and the field holds jagged again
until the next impact. There is no scroll-proportional tweening of the field
at all (that register belongs to PARALLAX's porcelain morph). Between impacts
scroll only loads a STRESS meter in the HUD; the surface waits.

The pointer is a punch input, not a parallax sway: moving it shoves nearby
debris off its targets on stiff springs; clicking (tapping on touch) lands an
impulse that blows a real crater in whatever the wall has become, with camera
recoil, a CA blip and an opt-in synthesized thud.

## The six formations

Every impact re-targets all ~1,400 instances to a new composition. Leftover
instances always go to a visible scatter shell, never to scale zero, so **no
impact can produce an empty frame mid-flight** — the PARALLAX vessel-morph
timing bug is structurally impossible here (verified numerically: ≥94% of
instances stay inside an extended frustum at every point of a re-formation).

| act | formation | how it's built |
|---|---|---|
| 0 HERO | the cracked wall | tight aligned tiles, six crack polylines; only fragments within 1.3 units of a crack are disturbed, so the fracture lines read as lines. Framing radii are set tighter than the wall so the surface bleeds past every viewport edge |
| 1 THE CARD | two masses about to collide | canvas-rasterised opposing wedges — the "versus" as composition, after a literal "VS" glyph sealed into "V8" (debris closes narrow apertures; straight-stroke shapes only) |
| 2 TAPE | a raised fist | canvas silhouette; finger gaps widened until they survive one cell of fragment bleed |
| 3 THE PIT | the fight cage | parametric octagon: 8 posts, two perimeter bands, sparse face mesh, floor scatter |
| 4 TICKETS | the card numeral 09 | canvas-rasterised Big Shoulders 900, re-rasterised on `document.fonts.ready` |
| 5 CODA | rubble | three gaussian mounds on the ground plane |

Raster sampling: glyph bounding box (not the canvas) is normalised to world
width; fragments are sized to the 3-px sampling pitch so letterforms stay
legible; cells are shuffled deterministically so layers interleave.

## Palette

Hard-differentiated from both 3D neighbours — no gilt/sodium/mercury, no
acid/flood neon. Raw combat:

| token | hex | role |
|---|---|---|
| `--slab` | `#0B0B0D` | page ground |
| `--pit` | `#060607` | deepest dark (mast, list band) |
| `--chalk` | `#F2EFE8` | type — floodlight white, never pure |
| `--dust` | `#A7A3AC` | muted copy (checked ≥7:1 on slab) |
| `--blood` | `#D22F2F` | impact, tags, CTA (large/bold use only) |
| `--blood-t` | `#F07373` | small red text (contrast-safe tint) |
| `--bruise` | `#8B7BC7` | the one violet accent — division labels, fill light |
| `--bruise-d` | `#4F4670` | violet at low volume (bars, WebGL fill) |

Debris castes: concrete greys ~93%, glass violet ~5%, blood-marked ~2%. The
first art-direction pass had 22% coloured fragments and read as confetti;
the wall only reads as a wall when the flat regions are genuinely flat,
aligned and grey.

## Type

- **Big Shoulders Display** 600–900 — the compressed grotesk for fight-card
  display and the in-debris numeral. Neither neighbour uses it.
- **Barlow** — body (Archivo belongs to carnival-null/voltflood/PARALLAX).
- **JetBrains Mono** — HUD, records, rules, the ledger, the STRESS meter
  (`▓░` block glyphs render natively in it).

## Technique (`js/main.js`, three@0.180 ES module)

- Three `InstancedMesh` groups (slab/shard/splinter — jagged extruded prisms)
  share one `ShaderMaterial`: two hand-rolled directional lights (cool
  floodlight key, bruise-violet fill), rim + glint, per-instance tint/caste
  attributes, and an impact-heat term that flushes fragments blood-red near
  the strike point. **Do not declare `attribute mat4 instanceMatrix` in a
  ShaderMaterial on an InstancedMesh** — three injects it; declaring it again
  is a GLSL redefinition that kills the program.
- Impact flight: per-instance stagger + duration, easeOutBack whip with
  in-flight jitter that decays to a hard stop; between impacts a settled
  bitmap short-circuits the per-instance loop, so holds cost almost nothing.
  Instances store their **displayed** position, so a shockwave fired
  mid-punch captures shoved debris where it actually is.
- Punch physics: offset + velocity per instance, stiff spring return
  (k = 15, c = 6), impulses radial from the unprojected pointer on the z = 0
  plane.
- Post: one fullscreen composite pass (scene renders to a multisampled RT) —
  radial CA + glitch-band slicing scaled by `uShock`, decaying flash, grain,
  vignette, one manual gamma. Colour management off; scene colours converted
  once via `convertSRGBToLinear`. Far cheaper than carnival-null's four-pass
  bloom chain and enough for this register.
- Camera per act is computed from the formation's framing radii into whatever
  area the DOM panel leaves free (36% edge share on desktop, 52% bottom sheet
  on mobile) — no hand-tuned lookAt magic numbers survived contact with real
  aspect ratios.
- Camera kick: direction vector × `exp(-5.2t)` envelope × a two-sine jag,
  plus a small FOV punch and roll. Panels are centred with the CSS
  `translate` property so the impact-jolt `transform` animation composes
  instead of wiping the centring.
- Quality ladder: DPR 1.5 → MSAA off → DPR 1.2, latching, stepping when the
  measured frame mean exceeds 26 ms. Measured on the reference machine:
  **0.25 ms CPU per full update+render at N = 1400** — the field could be an
  order of magnitude denser before the CPU noticed.
- `window.FX` exposes act, forms, meshes, camera, `fire()`, `punchAt()` and a
  synchronous `bench()` — the verification harness drives all of it.

## Sound

Opt-in, synthesized live, no samples: impact = sine body drop (85→26 Hz)
plus a band-passed noise crack; punches get a smaller hit. No clock — there
is nothing to sync to, sounds fire when the surface is hit. Default off.

## Safety

Impacts are user-driven, debounced (220 ms) and single-transient — no
sustained strobing, no full-luminance flashes (the post flash tops out at
+0.2 and decays in ~200 ms; DOM jolts are transform-only).
`prefers-reduced-motion` (live-tracked): re-formations become 1.15 s
crossfade tweens, no kick/CA/flash/tremor/audio, panels fade instead of
hard-cutting, no forced holds.

## Fallback chain (each verified in a real browser, not assumed)

- **No JS** — every walk element is gated on `html.js`; the page is the
  static fight sheet (masthead + SVG crack art, card, tape, rules, tickets,
  ledger, SMS form).
- **CDN blocked** — `js/boot.js` (classic script) folds to the sheet if
  `window.FRACTURE_READY` never appears within 6 s.
- **No WebGL2** — renderer construction throws, caught, folds immediately.
- **`webglcontextlost`** — same fold.

Mobile is its own composition (verified at 390 px): formations frame into
the top half, panels become full-width notched bottom sheets with their own
scroll, tap = punch, N = 820, DPR ≤ 1.75, MSAA off.

## Content truth

Every fighter, record, venue and past card is original fiction for this
showcase. Zero external creative assets — the entire visual system is
procedural; the only binaries in the folder are the og card and hub
thumbnail, which are screenshots of the site itself.

## Open items

- The glass caste could refract (screen-space distortion behind glass
  fragments) if this template ever gets an elevation pass.
- The punch could leave persistent damage per formation (dented targets)
  instead of springing back — deliberate restraint for now, the spring reads
  better against the snap register.
