# CREDITS — Longlight

Every photograph on this site is a real frame under the **Unsplash License**
(https://unsplash.com/license: free for commercial and non-commercial use,
no permission needed, attribution not required but given here). Licence
checked at the moment each one was added (DARK.md §2): every search ran with
the `license=free` filter and any `plus.unsplash.com` (Unsplash+) result was
rejected at extraction time. Nothing here is generated, scraped or lifted
from another brand's site.

Each photograph is used **once**. The only intentional reuse is each page's
OpenGraph image, which is that page's own hero (stated in DESIGN.md §7).

Originals (2400 px JPEG from the Unsplash CDN) are cached under `tools/raw/`
(gitignored) and re-derived by `python tools/media.py` into two widths of
WebP and AVIF each. Portrait cards are centre-cropped to 3 : 4, except `guide-3`, which is
cropped to its lower-left so the walker sits above the caption band
(`CROP` in `tools/media.py`); nothing else is cropped.

| File (`img/…`) | Unsplash ID · photographer | Source | Where it is used |
|---|---|---|---|
| `index-hero-*` | `cqbLg3lZEpk` · Kurt Cotoaga | https://unsplash.com/photos/cqbLg3lZEpk | **Home hero**: Cuernos del Paine in first light, Torres del Paine. Also the home page OG image. |
| `card-lyngen-*` | `-rBb2CyPek4` · Anton Lammert | https://unsplash.com/photos/-rBb2CyPek4 | Home, portrait card: snow peaks under cloud, Lyngen Alps |
| `card-dolomites-*` | `ICSRhjP1UBU` · Riccardo Cervia | https://unsplash.com/photos/ICSRhjP1UBU | Home, portrait card: alpenglow on Dolomite spires |
| `card-paine-*` | `SFubVJcCgcQ` · Carter Obasohan | https://unsplash.com/photos/SFubVJcCgcQ | Home, portrait card: the Torres at sunrise |
| `home-journal-1-*` | `wXTW8mycPCM` · Daniel Akselrod | https://unsplash.com/photos/wXTW8mycPCM | Home, journal preview: a doorway at sunrise |
| `home-journal-2-*` | `EcZtopqM4zU` · Michael McKay | https://unsplash.com/photos/EcZtopqM4zU | Home, journal preview: tents below a snow peak at dusk |
| `expeditions-hero-*` | `aeg-rkpXc24` · Samuel Arkwright | https://unsplash.com/photos/aeg-rkpXc24 | **Expeditions hero**: walkers silhouetted against a sunset sky. OG image for that page. |
| `route-lyngen-*` | `LrHwwYXnR6Y` · Hendrik Morkel | https://unsplash.com/photos/LrHwwYXnR6Y | Expeditions: a group crossing a snow slope above the fjord, Lyngen |
| `route-lofoten-*` | `SgwJ1ue1lTU` · Joshua Kettle | https://unsplash.com/photos/SgwJ1ue1lTU | Expeditions: fjords and peaks from above, Lofoten |
| `route-altavia-*` | `v-o7LGC2ivA` · Ben Guernsey | https://unsplash.com/photos/v-o7LGC2ivA | Expeditions: two walkers on a Dolomite trail |
| `route-svaneti-*` | `l4CWG2AP6Bc` · Aleko Kezevadze | https://unsplash.com/photos/l4CWG2AP6Bc | Expeditions: a Svan tower under storm cloud |
| `route-paine-*` | `Dw3APludDpE` · Marc Thunis | https://unsplash.com/photos/Dw3APludDpE | Expeditions: lenticular cloud over the Paine massif |
| `route-faroe-*` | `azEPUeuTKhU` · Georgi Kalaydzhiev | https://unsplash.com/photos/azEPUeuTKhU | Expeditions: Kallur lighthouse, Kalsoy, Faroe Islands |
| `expedition-hero-*` | `nX8OPOeV0YY` · Maty Podrouzek | https://unsplash.com/photos/nX8OPOeV0YY | **Alta Via 1 hero**: evening light on the Sella group, a trail below. OG image for that page. |
| `stage-1-*` | `l3fkqYm1_5E` · Hikerwise.com | https://unsplash.com/photos/l3fkqYm1_5E | Alta Via 1, leg 2: a walker heading for the towers |
| `stage-2-*` | `tqPcU28uUW0` · Mattia Bericchia | https://unsplash.com/photos/tqPcU28uUW0 | Alta Via 1, leg 3: larches and a turquoise lake |
| `stage-3-*` | `72ouJZo2U1A` · Maciej Marko | https://unsplash.com/photos/72ouJZo2U1A | Alta Via 1, leg 4: a rifugio at dusk under the towers |
| `journal-hero-*` | `62W6xShDsJE` · Slava Auchynnikau | https://unsplash.com/photos/62W6xShDsJE | **Journal hero**: tents under stars. OG image for that page. |
| `journal-1-*` | `BmAv53N_puE` · Benjamin Vang | https://unsplash.com/photos/BmAv53N_puE | Journal, lead entry: a lone tree on the fjord at sunset, Lyngen |
| `journal-2-*` | `Pt5sWld1FiM` · Slava Auchynnikau | https://unsplash.com/photos/Pt5sWld1FiM | Journal: walkers on a ridge in cloud, Svaneti |
| `journal-3-*` | `tzVgy5ZAStE` · Davide Sandre | https://unsplash.com/photos/tzVgy5ZAStE | Journal: a lit hut window above the valley lights at night |
| `journal-4-*` | `hSVKBqIPlDI` · Andrew St Lawrence | https://unsplash.com/photos/hSVKBqIPlDI | Journal: green cliffs under dark cloud, Faroe Islands |
| `about-hero-*` | `BxtP30g-g3c` · Timo Wagner | https://unsplash.com/photos/BxtP30g-g3c | **About hero**: peaks in fog at the end of the day. OG image for that page. |
| `guide-1-*` | `npHNLH_xLLI` · Samrat Khadka | https://unsplash.com/photos/npHNLH_xLLI | About, guide portrait |
| `guide-2-*` | `Mv3tk3-71JM` · Justin Buisson | https://unsplash.com/photos/Mv3tk3-71JM | About, guide portrait |
| `guide-3-*` | `GzcI_rMNclY` · Lucas Favre | https://unsplash.com/photos/GzcI_rMNclY | About, guide portrait |
| `enquire-hero-*` | `-Noa043YDX0` · Pascal Debrunner | https://unsplash.com/photos/-Noa043YDX0 | **Enquire hero**: a snow island under a gold sky, northern Norway. OG image for that page. |

The three people on the About page are photographed walkers, not named:
their cards carry a role and a base ("Lead guide · Tromsø"), never a
personal name, so no identity is invented for a real person.

`img/favicon.svg` was drawn for this site (a half-sun on a horizon line).
Hub thumbnail: `/img/expedition-longlight-sm.webp`, a screenshot of the home hero.
