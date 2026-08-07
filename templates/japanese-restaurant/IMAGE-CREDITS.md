# KIYO 清 — image provenance

KIYO is a **fictional restaurant**; the brand, name, seal and all copy are original to this
template. No real restaurant's identity, menu or prices are used.

## Photography — licensed Adobe Stock (free tier)

All 31 photos were searched, licensed and downloaded on **7 August 2026** through the Adobe
Stock connector, free-tier assets only (`pricing: "free"`, license state `just_purchased`).
Nothing is scraped and nothing is AI-generated in this template.

Because the set spans many photographers, every image was passed through one identical local
grade (Pillow: −4% saturation, +3% contrast, +2% brightness, slight warm channel shift) and
cropped square at 640 px so the menu reads as one kitchen. The hero is 1920 × 1080.

| File | Adobe Stock ID | Used as |
|---|---|---|
| img/hero.webp | 276961420 | Hero — izakaya spread |
| img/m01-tonkotsu.webp | 175510291 | Tonkotsu Ramen |
| img/m02-spicymiso.webp | 260196623 | Spicy Miso Ramen |
| img/m03-shoyu.webp | 297689263 | Shoyu Ramen |
| img/m04-katsucurry.webp | 481677371 | Chicken Katsu Curry |
| img/m05-gyudon.webp | 549965773 | Gyudon |
| img/m06-butadon.webp | 327174055 | Butadon |
| img/m07-unagi.webp | 373714639 | Unagi Don |
| img/m08-bento.webp | 229303328 | Teriyaki Salmon Bento |
| img/m09-sushi.webp | 251577264 | Sushi Moriawase |
| img/m10-veganramen.webp | 531101732 | Garden Miso Ramen |
| img/s01-edamame.webp | 312998849 | Edamame |
| img/s02-gyoza.webp | 546101348 | Pork Gyoza |
| img/s03-takoyaki.webp | 284794436 | Takoyaki |
| img/s04-agedashi.webp | 367832151 | Agedashi Tofu |
| img/s05-karaage.webp | 396076866 | Chicken Karaage |
| img/d01-matchaice.webp | 158999416 | Matcha Ice Cream |
| img/d02-daifuku.webp | 402949634 | Ichigo Daifuku |
| img/d03-taiyaki.webp | 272249211 | Taiyaki |
| img/d04-sesame.webp | 197399744 | Black Sesame Ice Cream |
| img/d05-sorbet.webp | 362566209 | Shiso-Lime Sorbet |
| img/k01-junmai.webp | 203967124 | Junmai Sake |
| img/k02-nigori.webp | 175204706 | Nigori Sake |
| img/k03-umeshu.webp | 335075392 | Umeshu |
| img/k04-highball.webp | 571721200 | Toki Highball |
| img/k05-matchalatte.webp | 264520389 | Matcha Latte |
| img/k06-icedmatcha.webp | 263152031 | Iced Matcha |
| img/k07-hojicha.webp | 901832087 | Hojicha Latte |
| img/k08-sencha.webp | 379934188 | Sencha |
| img/k09-ramune.webp | 1569014199 | Ramune |
| img/k10-lager.webp | 450075934 | Kura Lager |

Two menu names were chosen to match their photos honestly rather than the other way round:
the sorbet photo is lemon-lime, so the dish is "Shiso-Lime Sorbet" (not yuzu), and the black
sesame photo is an ice cream, so the dessert is "Black Sesame Ice Cream" (not a mousse).

## The checkout

The ordering flow is a demonstration: the cart is real (localStorage), validation is real,
the totals are real arithmetic — and the submit goes nowhere. The Apple Pay / Google Pay
buttons are visual stand-ins that never open a payment sheet, the card fields check format
only, and the confirmation screen says all of this out loud.
