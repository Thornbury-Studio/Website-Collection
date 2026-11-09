# CREDITS — Hollin

Every photograph on this site is a real frame under the **Unsplash License**
(https://unsplash.com/license: free for commercial and non-commercial use, no
permission needed, attribution not required but given here). Licence checked
on each photo's own page at the moment it was added, 2026-11-09 (DARK.md §2):
every one read "Free to use under the Unsplash License"; Unsplash+ results
were excluded. Nothing here is generated, scraped or lifted from another
brand's site.

Each photograph is used **once**. The only intentional reuse is each inner
page's OpenGraph image, which is that page's own hero (DESIGN.md §7).

Originals (2400 px JPEG from the Unsplash CDN) are cached under `tools/raw/`
(gitignored) and re-derived by `python tools/media.py` into two widths of WebP
and AVIF each. The condensation frame (`home-turn`) gets a light blur and a
lower quality setting, because its fine beading otherwise made it the heaviest
file on the site; the portrait towel frame is centre-cropped to 3 : 4; the two
crops below remove a maker's mark; `visit-hero` is cut from its portrait
original to a 3 : 2 band around the lamps. Nothing else is altered beyond scaling.

Five frames come from the Unsplash accounts of two real sauna-equipment makers
(HUUM, Auroom Wellness), published there under the same free licence. Two of
the HUUM originals show the maker's mark (on a heater, and on a stone basket),
so `rounds-hero` and `rounds-hot` are cropped to leave it out of frame (`CROP`
in `tools/media.py`); checked by eye on every crop used. Hollin does not name
or claim any equipment brand.

| File (`img/…`) | Unsplash ID · photographer | Source | Where it is used |
|---|---|---|---|
| `home-heat-*` | `6eTBDTexZpM` · HUUM | https://unsplash.com/photos/6eTBDTexZpM | Home, the hot room: water ladled onto sauna stones |
| `home-turn-*` | `SW8sKEBvbts` · Anton Darius | https://unsplash.com/photos/SW8sKEBvbts | Home, the rinse: condensation on glass |
| `home-cold-*` | `0fN21zv8yYo` · Vidar Nordli-Mathisen | https://unsplash.com/photos/0fN21zv8yYo | Home, the plunge: a man swimming in a channel cut in ice (Norway) |
| `home-street-*` | `Jh8vI2ubVgg` · Amir Hossein | https://unsplash.com/photos/Jh8vI2ubVgg | Home, closing band: a street at night in falling snow |
| `rounds-hero-*` | `XSpVeZvDg_w` · HUUM | https://unsplash.com/photos/XSpVeZvDg_w | **The Rounds hero**: a man in a dark, steamy sauna. OG image for that page. |
| `rounds-hot-*` | `tYVKTELSptU` · HUUM | https://unsplash.com/photos/tYVKTELSptU | The Rounds, hot room: steam off the stones |
| `rounds-cold-*` | `U9NE20ql_io` · Gin Majka | https://unsplash.com/photos/U9NE20ql_io | The Rounds, cold plunge: swimmers in a pool cut in ice (Maine, USA) |
| `rounds-rest-*` | `Yr27GeesjZU` · Auroom Wellness | https://unsplash.com/photos/Yr27GeesjZU | The Rounds, rest room: wooden loungers |
| `sessions-hero-*` | `IXHVsu6n5vA` · Auroom Wellness | https://unsplash.com/photos/IXHVsu6n5vA | **Sessions hero**: a modern wooden sauna room. OG image for that page. |
| `sessions-room-*` | `DeYbNYGucjk` · JosephAli Music | https://unsplash.com/photos/DeYbNYGucjk | Sessions, private room: a small empty sauna with one light |
| `visit-hero-*` | `OpkZfKoYHFE` · Josh Hild | https://unsplash.com/photos/OpkZfKoYHFE | **Visit hero**: a snowy riverside path at night (Minneapolis). OG image for that page. |
| `visit-towel-*` | `yCWXIm26SFA` · Taylor Ulmer | https://unsplash.com/photos/yCWXIm26SFA | Visit, what to bring: a towel hanging in a sauna |
| `guestbook-hero-*` | `zBS1TDsPwIw` · Janek Valdsalu | https://unsplash.com/photos/zBS1TDsPwIw | **Guest Book hero**: an icy bay at dusk with a city on the far shore (Tallinn Bay). OG image for that page. |

The people in these photographs are not named and are not presented as Hollin
staff or guests. The three notes on the Guest Book page are labelled sample
content and carry no names.

Made for this site (not photographs): `img/field-*.webp` (stills of the site's
own shader), `img/og-home.webp` and `img/hub-thumb.webp` (screenshots of the
home hero), `img/favicon.svg`.
