# Meridian Partners — image provenance

Meridian Partners is an original concept brand. The firm, its clients, the engagements, the
figures quoted and the people named are all created for this project.

## Photography

Five photographs were **generated for this project** on 9 August 2026 via the Gemini API on the
project's own key. The people in them are synthetic and depict no real person.

Consistency was held with a reference chain: the hero was generated first at 2K with
`gemini-3-pro-image`, then each sector image was generated with the hero attached as a style
reference, which held one restrained navy / warm grey / oatmeal / brass palette and the same
soft directional daylight across the set.

| File | Model | Used as |
|---|---|---|
| img/hero-session.webp | gemini-3-pro-image (2K) | Hero — a working session in week two |
| img/case-retail.webp | gemini-2.5-flash-image | Nova Retail Co. engagement |
| img/case-logistics.webp | gemini-2.5-flash-image | Brightpath Logistics engagement |
| img/case-analytics.webp | gemini-2.5-flash-image | Corvus Analytics engagement |
| img/case-food.webp | gemini-2.5-flash-image | Arcadia Foods engagement |

The analytics image was generated twice. The first attempt inherited so much from the reference
that it reproduced the hero's boardroom and its people; it was regenerated with an explicit
instruction that the scene must differ. Only the second version ships.

PNG output was cover-cropped and re-encoded to WebP with Pillow (hero 1600 × 1200 q82, sector
images 880 × 660 q80). Total 282 KB.

## Earlier assets

`img/our-story.jpg` and the four `img/team-*.jpg` portraits are free-licence stock photography
added in an earlier pass, used on the About page.
