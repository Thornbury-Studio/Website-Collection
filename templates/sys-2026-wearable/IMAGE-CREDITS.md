# SYS-2026 — media provenance

Every image and video on this page was generated for this template on **6 August 2026**.
Nothing is licensed stock, nothing is a still from a film or game, and no third-party
copyrighted artwork is used.

## The device

SYS-2026 is an **original design**. It borrows a *concept* — one rugged instrument worn on the
forearm that replaces a bag of separate tools — that the *Fallout* games and series popularised
with the Pip-Boy. It is not a reproduction of that device, does not use its name, shape,
markings, logos, or interface, and is not affiliated with or endorsed by Bethesda Softworks or
Amazon Studios. The page carries a small "inspired by" note stating exactly this.

The brand mark (`SYS-2026`) is hand-drawn SVG in `index.html` — a chamfered plate around a
screen aperture with a signal trace. It is original to this template.

## Generation

**Tool:** Higgsfield MCP
**Image model:** `nano_banana_2` (Google), 2K, text-to-image for the master shot and
image-to-image for the rest
**Video model:** `seedance_2_0` (Bytedance), 720p, 5 s, silent, driven from a start frame

The first render (`device-master.webp`) established the industrial design. Every subsequent
image passed it back as a reference so the chassis, dial, toggle rail, gauge, grille, sensor pod
and strap stay identical across the set. Prompts explicitly asked for **no legible text, no
lettering and no logos** anywhere in frame.

| File | Shot | Source |
|---|---|---|
| `img/device-master.webp` | Three-quarter on a steel workbench | text-to-image (master) |
| `img/hero-wrist.webp` | Worn on a forearm, studio, screen lit | image-to-image from master |
| `img/detail-dial.webp` | Macro: knurled dial, toggles, gauge | image-to-image from master |
| `img/detail-screen.webp` | Macro: scratched glass over phosphor | image-to-image from master |
| `img/field-dusk.webp` | Hiker on a forest road at blue hour | image-to-image from master |
| `img/teardown.webp` | Overhead knolled component flat-lay | image-to-image from master |
| `img/profile-edge.webp` | Side profile, seam and strap lug | image-to-image from master |
| `video/hero-dial.mp4` | A hand turns the dial, studio | image-to-video from `hero-wrist` |
| `video/field-dusk.mp4` | Wrist tilts to read, mist drifts | image-to-video from `field-dusk` |
| `img/view-rear.webp` | Rear three-quarter: heat-sink spine, cable collar | image-to-image from master |
| `img/view-underside.webp` | Underside: biometric sensor puck, gasket line | image-to-image from master |
| `img/view-cartridge.webp` | Cartridge half-ejected from its bay | image-to-image from master |

### The orbit that was cut

The first build of the "Hardware" section scrubbed an 80-frame AI camera-orbit video
(image-to-video from the master, 720p) on a canvas. It was removed after review — for two
reasons that reinforce each other. The frames were 720p stretched across a ~1240 px stage,
which read as soft at any zoom. And image-to-video cannot hold a rigid object's geometry
through a revolution: partway around, the dial migrated from the right flank to front-centre,
the toggle rail morphed into a different plate, and the grille swapped sides — the camera was
orbiting a device that did not stay the same device.

The section now cuts between **six locked-off stills**, one per component callout — screen
macro, teardown flat-lay, front three-quarter, rear three-quarter, underside, cartridge bay —
each generated image-to-image from the same master and checked against it by hand before
shipping. A still can be QA'd; a video frame in the middle of a morph cannot be fixed. The six
views total ~680 KB against the orbit's 2.4 MB across 80 requests, and the canvas scrub loop
went with it — the crossfade is two CSS properties.

## Post-processing

PNG renders were resized and re-encoded to WebP locally with Pillow (quality 78–82,
`method=6`). Seven images total **657 KB**.

Both MP4s were rewritten so the `moov` atom sits ahead of `mdat` ("faststart"). As delivered
the metadata was at the end of the file, which forces a browser to download the whole clip
before it can show a single frame. Chunk offsets in `stco` were shifted accordingly. Codec is
H.264, 1280 × 720, 5.04 s, no audio track. Both are `preload="none"` and only start when
scrolled into view.

## Figures

Every specification on the page — runtimes, tolerances, dimensions, prices — is **invented**.
The numbers were chosen to be internally consistent with each other and plausible for the
components described, not measured from anything. The "What's real, and what isn't" section
says which capabilities correspond to technology that genuinely exists and which do not.
