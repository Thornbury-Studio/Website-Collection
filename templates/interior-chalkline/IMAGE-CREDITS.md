# Image credits — CHALKLINE

Every photograph in `img/` was generated for this template on 4 Sep 2026
with Google Gemini `nano-banana-pro-preview` (2K, 16:9) through the direct
API, and converted to WebP at 1600 px and 800 px with ffmpeg. No stock
photography and no third-party imagery was used. Higgsfield was not used
(balance was 2.3 credits); Gemini cost nothing beyond the account's plan.

## Method

- One STYLE block held verbatim across every "after" frame (24 mm at eye
  level, straight verticals, aluminium-framed windows, soft afternoon
  light, matte, light oak / white / walnut / matte black / off-white
  quartz), varying only the subject sentence. This is what makes twelve
  rooms read as one photographer's set.
- Each "before" was generated from its own "after" passed as the reference
  image, with the instruction to hold the exact camera position, lens,
  windows and walls and change only the condition. All twelve pairs landed
  first try; zero re-rolls in the whole set of 27.
- Prompts forbade text, logos and numbers. The showroom's pinboard and the
  site-visit plan are drawn as linework only, checked at 1:1.

## Files

| File | Subject | Prompt source |
|---|---|---|
| a-living, a-kitchen, a-master, a-mbath, a-study, a-cbath, a-entry | Tampines 4-room resale, finished | text-to-image |
| a-*-before | same rooms, 1990s resale condition | image-to-image from the matching after |
| b-living, b-kitchen (+ -before) | Punggol 5-room BTO; before is the bare handover state | as above |
| c-living, c-kitchen (+ -before) | Tiong Bahru 3-room walk-up with retained terrazzo | as above |
| d-living (+ -before) | Bartley 3-bedroom condominium | as above |
| s-site | hands, A3 plan, blue chalk line on screed | text-to-image |
| s-showroom | the Tai Seng studio | text-to-image |
| s-materials | material flat-lay with a chalk reel | text-to-image |
| og.webp | crop of a-living | derived |

Prompt sheets are kept outside the repo. Each `-1600` file is the display
master; `-800` serves phones and the hero plan's room fills.
