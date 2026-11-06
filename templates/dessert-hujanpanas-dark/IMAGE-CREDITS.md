# Hujan Panas — image and footage provenance

Hujan Panas is an **invented business**. Its address, phone number, email, prices, hours, quantities, the October sales count and every claim in the copy are original to this template. Nothing on the site is AI-generated, scraped from another site, or drawn to depict an object: every bowl, kueh and hand is a licensed photograph or film clip. The rain streaks and the chart are abstract graphics made in code.

All media comes from **Pexels**, downloaded on 2026-11-06 without an account, under the **Pexels License** (https://www.pexels.com/license/): free for commercial use, no attribution required; not to be sold unaltered, not to imply endorsement, identifiable people not shown in a bad light, not used as a trademark. Each clip's resolution was checked on its public file listing (3840x2160, 4096x2160 or 2160x3840); the masters are never committed (`tools/encode.sh` and `tools/stills.py` rebuild everything from them).

## Footage (10 clips, all 4K masters)

H.264, no audio, one grade per family (`tools/encode.sh`). Hero clips at 2160 / 1080 / 720; the rest at 1080 / 720 (steam and street also at 2160). Vertical rungs are named by the short side.

| File(s) | Pexels id, creator, master | Cut used | Placed |
|---|---|---|---|
| `video/sun-*` | [33894516](https://www.pexels.com/video/33894516/), Evgenij Mikhailov, 3840x2160 60p | 0.5 s, 8 s at 30p | Now, Panas and Hujan panas (desktop): sun through palm fronds |
| `video/sunv-*` | [36828507](https://www.pexels.com/video/36828507/), MikeGz, 2160x3840 | 2 s, 8 s | Now, Panas (phone) |
| `video/leaves-*` | [4926166](https://www.pexels.com/video/4926166/), ROMAN ODINTSOV, 4096x2160 | 0 s, 8 s, cropped to 16:9 | Now, Hujan and Redup (desktop): rain on banana leaves |
| `video/railv-*` | [27590740](https://www.pexels.com/video/27590740/), Arun kachhwaha, 2160x3840 60p | 0 s, 8 s at 30p | Now, Hujan and Hujan panas (phone): rain dripping off a railing |
| `video/street-*` | [14744294](https://www.pexels.com/video/14744294/), mohd hasan, 3840x2160 | 1 s, 8 s | Now, downpour (desktop): heavy rain on a Southeast Asian street |
| `video/skyv-*` | [34909100](https://www.pexels.com/video/34909100/), Saugat Shrestha, 2160x3840 | 4 s, 10 s | Now, downpour and Redup (phone): rain over a Singapore skyline |
| `video/steam-*` | [9694805](https://www.pexels.com/video/9694805/), cottonbro studio, 4096x2160 | 2 s, 12 s | Warm end, behind the run: soft smoke on black, used as steam |
| `video/vatv-*` | [34705708](https://www.pexels.com/video/34705708/), Umar Saudagar, 2160x3840 | 0 s, 8 s | Pot, 07:10. **The clip is milk stirred in a large vat**; it stands in for the soy milk pot and the caption describes the shop's step, not the clip |
| `video/coconutv-*` | [27811423](https://www.pexels.com/video/27811423/), Thanh-Thang Phan, 2160x3840 | whole 5.4 s | Pot, 10:00: a woman grating coconut at a market stall |
| `video/housesv-*` | [32548044](https://www.pexels.com/video/32548044/), Calvin Seng, 2160x3840 | 0 s, 8.4 s | Visit: Peranakan shophouses, Singapore |

## Photographs (13)

Resized to 640 / 1280 wide AVIF and WebP by `tools/stills.py`. Posters (`img/p-*`) are the first graded frame of each clip above.

| File(s) | Pexels id, creator | Placed |
|---|---|---|
| `img/tangyuan-*` | [36865965](https://www.pexels.com/photo/36865965/), Jauhar Musthofal Qulub | board line, warm run (ginger syrup) |
| `img/tangyuan-spoon-*` | [36865956](https://www.pexels.com/photo/36865956/), Jauhar Musthofal Qulub | warm run, first plate |
| `img/pulut-*` | [1204228](https://www.pexels.com/photo/1204228/), Cats Coming | board line, warm run |
| `img/greenbean-*` | [36211530](https://www.pexels.com/photo/36211530/), Firman Marek_Brew | board line, warm run |
| `img/tauhuay-*` | [5652186](https://www.pexels.com/photo/5652186/), Kai-Chieh Chan | board line, cool end |
| `img/chengtng-*` | [9656084](https://www.pexels.com/photo/9656084/), Clara Ho | board line, cool end |
| `img/ondeh-*` | [35685622](https://www.pexels.com/photo/35685622/), Henny Wiyanti | board line, kueh tray |
| `img/akk-*` | [38085663](https://www.pexels.com/photo/38085663/), 天 天 | board line |
| `img/akk-steamer-*` | [38085666](https://www.pexels.com/photo/38085666/), 天 天 | kueh tray |
| `img/akk-green-*` | [37025302](https://www.pexels.com/photo/37025302/), Afiqah Ct | kueh tray |
| `img/kueh-plate-*` | [37866295](https://www.pexels.com/photo/37866295/), Dwi Setyo | board line, kueh tray |
| `img/pandan-kueh-*` | [16734292](https://www.pexels.com/photo/16734292/), Jimmy Liao | kueh tray |
| `img/rain-street-*` | [39523506](https://www.pexels.com/photo/39523506/), 小和尚 温柔的 | Visit: rain on a Singapore street |

Reuse, stated on purpose: the photograph at the head of the board is whichever dish ranks highest among those with a photograph, so it repeats a plate shown further down; the board is the index of the page.

`img/og.jpg` and `img/hub-thumb.webp` are captures of this page's own hero (leaves clip above, live layout). `img/favicon.svg` and `img/icon-180.png` are two flat half-discs drawn for this template.

## The scout (Gate 0), what was rejected and why

Searched: Pexels video (about 60 queries: tau huay, douhua, soy pudding, sweet soup, red bean soup, black sticky rice, mung bean, kueh, ondeh ondeh, pandan, coconut milk, hawker centre, kopitiam, steam, rain and heat terms), Pexels photos (33 queries), Mixkit (rain, steam, soup, coconut, dessert), Coverr (rain, Asian dessert, soup, coconut, steam), Pixabay (Asian dessert), Adobe Stock (preview only, free tier shown by the connector; nothing licensed).

- **No free 4K clip of the actual desserts exists** in these libraries: no tau huay being scooped, no tau suan, cheng tng, pulut hitam or kueh being made in 4K. The desserts are carried by photographs; the films carry the weather and the morning's work.
- Rejected Pexels clips: 5337013/5337020/5337023 (Korean tofu stew, savoury), 13426752 and 10200308 (savoury Chinese soups), 6843717 (gloved hand pouring black glaze, reads as ceramics), 12058561 (bun dough, too big for tang yuan), 7235045 (white pearls, reads as decor), 36280445/36021178/37186115/37186409 (Filipino street vendors and kitchen, read as another cuisine), 31613020 (Javanese serabi), 32736684 (mung beans macro, kept in reserve, not used), 8051335/8051346 (Indian home soup), 30243431 (rustic ceiling fan, encoded then cut: read as generic), 8676982 (ice into a glass, encoded then cut after the first critic round: grey and not a dessert), 2881969 (tea poured into a blue-and-white bowl, used for the ginger syrup, cut after the second round: a critic read it as tea), 4929836/4926168 (second-best banana leaf takes).
- Rejected photographs: 31985803 (labelled red bean soup, but a savoury Indonesian sop kacang merah with tomato), 36039542 (real stall signage), 33212602 (Vietnamese chè), 36547527 (rawon, savoury).
- Mixkit: tropical rain and a sunshower clip exist (25375, 6806) but the 4K file is behind the site's download flow; the 1080/720 previews were not good enough to replace Pexels 4K. Coverr: no fit, and a large share of its results are AI-generated. Pixabay: no relevant 4K; mixed AI and 3D results. Adobe Stock (preview): only a zongzi clip (210097954), not on this menu.
