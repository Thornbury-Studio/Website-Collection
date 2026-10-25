# Image credits

| File | What it is | Source | Licence |
|---|---|---|---|
| `img/lily-1600.webp`, `img/lily-900.webp` | The hero lily. Cropped to 4:3 and resized; the backdrop is flattened to a single colour (chroma matte) and metadata dropped. | Photograph "A single yellow lily on a black background" by Pedro Vit, Unsplash, published 2024-11-21, 4032 x 3024 px. https://unsplash.com/photos/a-single-yellow-lily-on-a-black-background-lKGNlIqjxY4 | Unsplash Licence (https://unsplash.com/license): free for commercial use, no attribution required. Credited here anyway. |
| `img/lily-relief.png` | Baked depth and surface-normal map of the photograph above. R = depth, G and B = normal. | Derived from the photograph with Depth Anything V2 Small (Apache-2.0, `onnx-community/depth-anything-v2-small`). See `tools/bake.mjs`. | Apache-2.0 model output; derivative of the photograph under the Unsplash Licence. |
| `img/og.jpg`, `img/logo-512.png`, `img/apple-touch-icon.png`, `img/favicon.svg` | Social card, logo mark and icons. | Made in this project from the photograph and the fonts below (`tools/social.html`). | Same as their sources. |
| `../../img/pontil-pistil-sm.webp` | Hub thumbnail: a screenshot of this site. | This project. | n/a |

No video, no generated imagery, no hand-built geometry. The flower in every state is the one photograph; the glass and scan states are computed from its depth map, not modelled.

Every image has been re-encoded from the source JPEG, so no EXIF, XMP or C2PA data from the original file is carried over. Checked with `tools/check-meta.mjs`.
