# HOYT'S — image provenance

HOYT'S is a **fictional gym** built as a portfolio template. The name, the address, the
schedule, the prices and every person's name are invented. The people in the photographs are
stock models, not the "coaches" they are captioned as — the roster was written to match what
the photographs actually show.

## Photography — licensed Adobe Stock (free tier)

All 7 photographs were searched, licensed and downloaded on **8 August 2026** through the
Adobe Stock connector, free-tier assets only (license state `just_purchased`). Every asset was
checked to be `isGenTech: false` — nothing here is AI-generated, and nothing is scraped.

Instead of a colour grade, every photograph is printed as a **two-colour riso-style duotone**
(Pillow: grayscale, +18% contrast, then `ImageOps.colorize` mapping shadows to ink `#1A1511`,
midtones to red `#C13A28`, highlights to paper `#F5F1E8`). Seven very different source photos
come out looking like one print run — that is the whole trick of the template.

| File | Adobe Stock ID | Used as |
|---|---|---|
| img/hero.webp | 244947159 | Hero — bagwork by the window |
| img/strength.webp | 480053040 | The floor — "The racks" |
| img/boxer.webp | 201058353 | The floor — "The bags" |
| img/yoga.webp | 386158457 | The floor — "The quiet room" |
| img/coach-frank.webp | 251297595 | Frank Hoyt Jr. |
| img/coach-marcus.webp | 431003092 | Dana Okafor |
| img/coach-mei.webp | 330482715 | Mei Lin |

A sourcing note: the photo used for "Dana Okafor" was catalogued as a male trainer but is
clearly a woman with crossed arms — the coach was written as Dana accordingly, rather than
forcing the caption to fit the catalogue.

## What is real and what is not

The weekly timetable is data-driven (33 classes across seven days), the **Today** column is
computed from the visitor's actual clock, and the type filters dim rather than hide so the
shape of the week stays visible. There is no booking flow on purpose — a gym like this one
takes sign-ups at the desk, and the site says so. The phone number is a 555 number.
