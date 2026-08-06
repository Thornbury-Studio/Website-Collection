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
| `img/orbit/f000–f079.webp` | 80-frame camera orbit around the unit | image-to-video from master (8 s, 720p), frames extracted with ffmpeg |

The orbit sequence drives the "Hardware" section: the frames are drawn to a canvas and scrubbed
by scroll position, because seeking a real `<video>` snaps to keyframes and stutters. 80 frames
at 1080 px wide total ~1.7 MB, lazy-loaded only when the section approaches.

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
