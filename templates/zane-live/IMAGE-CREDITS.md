# Image credits — Zan.e

Every photograph on this page is a still from Zan.e's own Douyin posts,
supplied by the account holder for use on this site. No stock, no AI-generated
imagery, no third-party photography.

| File | Source | Used for |
|---|---|---|
| `img/cue-b-{sm,lg}.webp` | Zan.e Douyin post cover (1080×1920) | Hero phone frame |
| `img/cue-a-{sm,lg}.webp` | Zan.e Douyin post cover (1080×1920) | "Why watch" still — weekly log |
| `img/cue-c-{sm,lg}.webp` | Zan.e Douyin post cover (1080×1920) | "Why watch" still — check-in |
| `img/og-1200.webp` | Screenshot of this page's own hero | Open Graph card |
| `img/favicon.svg` | Drawn for this site | Favicon |
| `../../img/zane-live-sm.webp` | Screenshot of this page's own hero | Hub gallery card |

The unprocessed originals and the grading script live in `src/`, which is
gitignored repo-wide and excluded from deploys — local build tooling, not part
of the committed or served site. Only the graded `.webp` output ships.

## Processing

`src/grade.sh` is the whole pipeline. Each frame is cropped to a fixed aspect,
**exposure-normalised toward one shared mean luma (96)**, then pushed through a
single identical grade — cool, contrasty, desaturated, lightly grained — so
three separate phone shoots read as one set on the near-black page. Frames are
emitted at their own native crop width rather than a uniform size, so a tight
crop is never upscaled.

Crops were chosen partly to exclude third-party gym branding that appeared in
two of the source frames; no gym, brand or sponsor is implied anywhere on the
page.

## Fonts

- **Archivo** (variable, weight 100–900 + width 62–125%) — SIL Open Font License.
- **IBM Plex Mono** 400/500 — SIL Open Font License.

Both are self-hosted from `fonts/`; no font CDN is contacted.
