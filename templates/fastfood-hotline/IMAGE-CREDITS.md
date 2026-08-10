# HOTLINE — image provenance

HOTLINE is a **fictional business**. The name, the address on Jalan Besar, the menu, the
prices, the heat scale and all copy are original to this template. No real restaurant's
identity, dishes or prices are used. Prices are plausible-Singapore, invented.

## Photography — licensed Adobe Stock (free tier)

All ten photographs were searched, licensed and downloaded on **10 August 2026** through the
Adobe Stock connector, free-tier assets only. Every asset was checked to be `isGenTech: false`
— nothing here is AI-generated, and nothing is scraped. Originals ranged 2917–7360 px on the
long edge; all were downsampled from the full-resolution licensed file, never from a
search thumbnail.

### The grade

The set was chosen for a single ground — near-black studio sweep or dark slate — because a
run of photographs only reads as one shoot when the *ground* matches, not merely the subject.
Bright-background and prop-heavy candidates were licensed, reviewed and rejected for that
reason (listed below).

Every frame then runs through one identical pass (Pillow): warm channel shift
(R ×1.045, B ×0.945), contrast ×1.10, saturation ×1.06, brightness ×0.99, plus a soft vignette
toward the page ink so a photograph on a black sweep dissolves into the layout instead of
sitting in a visible box. Product frames are cropped 4:3 at 1200 px; the hero is 4:5 at
1500 px and the bands are wide crops at 1800–2400 px.

| File | Adobe Stock ID | Used as |
|---|---|---|
| img/hero-stack.webp | 354669129 | Hero — The Double, studio on black with reflection |
| img/band-basket.webp | 270101407 | "Closes at four" band — basket of chicken and fries |
| img/ed-spread.webp | 289309322 | Menu page band — grouped stacks on a dark counter |
| img/p-hotline.webp | 429983402 | No. 01 The Hotline — glazed chicken in a dark pan |
| img/p-halfbird.webp | 410063201 | No. 02 Half Bird — soy-glazed chicken, overhead |
| img/p-popcorn.webp | 313604006 | No. 03 Popcorn — stacked bites on black |
| img/p-classic.webp | 410055825 | No. 04 The Double — burger on black, vertical |
| img/p-smoke.webp | 274075296 | No. 05 Smoke Stack — burger on a board, low light |
| img/p-late.webp | 561357975 | No. 06 The Late One — close crop, bacon and cheese |
| img/p-fries.webp | 488338816 | No. 07 House Fries — fries on dark slate |

`img/fastfood-hotline-sm.webp` in the repository root is a screenshot of this template's own
homepage, used as its card in the hub gallery.

### Licensed, reviewed, not shipped

Free-tier licences carry no credit cost, so these were pulled to compare and then set aside.
Recorded here so the licensing history matches what is in the folder.

| Adobe Stock ID | Why it was not used |
|---|---|
| 157223254 | "OPEN 24 HOURS" neon. Shot well, but the sign contradicts the brand's 17:00–04:00 hours — it was briefly in the layout and pulled for that reason. |
| 341485773 · 478132848 · 387071444 | Bright and warm-wood grounds; broke the run of darks. |
| 405019623 · 650028265 · 512650725 | White studio grounds; would have needed cutting out to sit on the ink page. |
| 341002153 | Seoul neon street — magenta and blue dominant, fought the red/amber palette. |
| 222388007 | Red gingham basket; a different world from this one. |
| 239193036 | Bright white and pale wood. |

## What is real and what is not

The ordering flow is a working demonstration. The bag lives in localStorage
(`hotline.bag.v1`) and survives navigation across all three pages. The arithmetic is exact to
the cent: the box rule (one main + one side + one dip + one drink = −$3.00) is computed from
the bag itself in `HOTLINE.bag.discount()`, so the saving the box builder promises is the same
saving the checkout applies, however the items got there. Validation is real — Singapore
mobile format, and delivery restricted to postcode sectors 20–21 and 30–33. Trading hours,
the status pip and the last-orders countdown all derive from one `service()` function against
the visitor's own clock. The submit goes nowhere: it renders a confirmation and clears the
bag. There are no card fields anywhere — the counter takes payment on collection or delivery.
