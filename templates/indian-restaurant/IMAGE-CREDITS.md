# KESAR — image provenance

KESAR is a **fictional restaurant**. The name (केसर, "saffron"), the address, the menu and all
copy are original to this template. No real restaurant's identity, dishes or prices are used.
Prices are plausible-London, invented.

## Photography — licensed Adobe Stock (free tier)

All 33 photographs were searched, licensed and downloaded on **8 August 2026** through the
Adobe Stock connector, free-tier assets only (license state `just_purchased`). Every asset was
checked to be `isGenTech: false` — nothing here is AI-generated, and nothing is scraped.

Every frame runs through one identical local grade (Pillow: +4% saturation, +6% contrast,
+1% brightness, warm channel shift) — gentler than THE BRASS OX's pass because Indian food
photography already arrives saturated. Dishes are cropped **4:3 landscape** at 800 px; the hero
is 1920 × 1080 and the dawat photo 1600 × 1000.

| File | Adobe Stock ID | Used as |
|---|---|---|
| img/hero.webp | 648458346 | Hero — mixed grill board |
| img/dawat.webp | 275393147 | The Dawat — full veg thali |
| img/t1-samosa.webp | 115656916 | Vegetable Samosa |
| img/t2-bhaji.webp | 496469064 | Onion Bhaji |
| img/t3-paneertikka.webp | 475653018 | Paneer Tikka |
| img/t4-chickentikka.webp | 476237328 | Chicken Tikka |
| img/t5-seekh.webp | 260193455 | Seekh Kebab |
| img/t6-tandoori.webp | 115600511 | Tandoori Chicken |
| img/c1-butterchicken.webp | 486460283 | Butter Chicken |
| img/c2-tikkamasala.webp | 163903090 | Chicken Tikka Masala |
| img/c3-roganjosh.webp | 544678489 | Lamb Rogan Josh |
| img/c4-vindaloo.webp | 280339773 | Lamb Vindaloo |
| img/c5-palak.webp | 357931365 | Palak Paneer |
| img/c6-chana.webp | 459955006 | Chana Masala |
| img/c7-dal.webp | 482428800 | Dal Makhani |
| img/c8-kofta.webp | 384495225 | Malai Kofta |
| img/c9-prawn.webp | 463480172 | Goan Prawn Curry |
| img/b1-chickenbiryani.webp | 362618356 | Chicken Biryani |
| img/b2-lambbiryani.webp | 466421933 | Lamb Biryani |
| img/b3-vegbiryani.webp | 248578010 | Vegetable Biryani |
| img/b4-jeera.webp | 364441661 | Jeera Rice |
| img/n1-naan.webp | 216033904 | Plain Naan |
| img/n2-garlicnaan.webp | 315430970 | Garlic Naan |
| img/n3-roti.webp | 287545704 | Tandoori Roti |
| img/n4-breadbasket.webp | 433446648 | Bread Basket |
| img/s1-raita.webp | 450056412 | Cucumber Raita |
| img/s2-papadum.webp | 533199704 | Papadum & Chutneys |
| img/s3-chutney.webp | 391748913 | Chutney & Pickle Tray |
| img/d1-gulabjamun.webp | 335082798 | Gulab Jamun |
| img/d2-kulfi.webp | 141767918 | Kesar Pista Kulfi |
| img/dr1-lassi.webp | 326176634 | Mango Lassi |
| img/dr2-chai.webp | 453358105 | Masala Chai |
| — | 167245195 | Licensed but unused — segmented canteen-tray thali, not hero material |

Two sourcing notes. The seekh kebab photograph is catalogued as "lula kebab" — the Caucasus
name for the same minced-lamb skewer — and reads correctly as seekh. The kulfi photograph is
catalogued as *kesar* badam pista kulfi, which is why the dessert carries the house name.

## What is real and what is not

The ordering flow is a working demonstration. The order lives in localStorage
(`kesar.order.v1`), the modifier arithmetic is exact to the penny (spice picks, portion
upgrades, side add-ons, per-table feasts), validation is real — UK mobile numbers, E1/E2/E3
delivery postcodes, card format and future expiry — and the submit goes nowhere. The Apple Pay
and Google Pay buttons are visual stand-ins that never open a payment sheet. The confirmation
panel says all of this out loud.
