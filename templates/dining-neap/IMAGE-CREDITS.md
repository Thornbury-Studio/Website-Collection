# NEAP — image & video credits

All photography and film licensed from Adobe Stock (free tier, standard
license), verified `isGenTech: false` at search time. Full-resolution
originals downloaded via licensed URLs; never search thumbnails.

Every frame was graded through one identical pass before export
(ffmpeg: `eq=saturation=0.84:contrast=1.02`, cool colour-balance shift
`rs=-0.03 bs=+0.035 rm=-0.02 bm=+0.02`, lifted-black curve
`0/0.03 0.55/0.53 1/0.97`), then scaled with lanczos and lightly
sharpened. Video additionally: 24 fps, audio stripped.

## Shipped

| File(s) | Adobe Stock ID | Description |
| --- | --- | --- |
| `img/hero-water-{800,1600,2560,3840}.webp` | 436314178 | Deep blue ocean water texture — the 4K hero |
| `img/oysters-{800,1600,2560}.webp` | 628399302 | Opened oysters, lemon, ice on grey concrete |
| `img/scallops-{800,1600,2560}.webp` | 1721026966 | Raw scallops in shell on dark green ground |
| `img/herbs-{800,1600,2560}.webp` | 257945412 | Garden herbs on dark granite |
| `img/dorado-{800,1600,2560}.webp` | 635381345 | Whole dorade on ice, pale blue concrete |
| `img/salmon-{800,1600,2560}.webp` | 388168177 | Salmon cut on dark ice |
| `img/haddock-{800,1600,2560}.webp` | 286542201 | Whole haddock bedded in ice |
| `video/fish-4k.mp4`, `img/fish-poster-4k.webp` | 539764457 | School of silver fish churning at the surface — center-cropped to 3840×1440 at native pixel density (cropped, never scaled), 24 fps H.264. No WebM: VP9 macroblocks on this churn at any web-sane bitrate, so the single clean H.264 is served to every browser |

## Licensed but not shipped

| Adobe Stock ID | Description | Why rejected |
| --- | --- | --- |
| 251094534 | Sea urchin roe in a ceramic bowl | Warm yellow cast broke the graded set; rejected at the contact-sheet stage rather than forced into line |

## Moon glyphs & favicon

Drawn in code (`js/tide.js`) from computed lunar phase; no image assets.
