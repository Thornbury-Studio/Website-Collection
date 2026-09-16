# FIRST CRACK — design notes

A specialty coffee roastery in Singapore that sells direct to the door:
six single-origin bags roasted every Thursday, bagged the same afternoon,
delivered by Saturday, with a subscription. Two pages: the shop
(`index.html`) and the origins (`origins.html`), plus a cart that lives
on both.

## The device, and the trap

The reference pins were all one technique: a blurred contextual photo, a
real frosted panel over it, a product or a price floating in front. That
is the site's default structure, used for the nav, the hero, the product
grid, the pricing, the notes and the cart. It was not copied as a layout;
it was taken as a rule and then given the two things the pins do not
have.

**The meter.** Glass on a photograph goes muddy the moment the tint,
blur and text colour are fixed by hand for one background and then
reused over another. Here every panel with `data-meter` reads the plate
behind it at runtime: the plate image (or a clip's poster) is drawn to a
96-pixel canvas, the panel's rectangle is mapped onto it honouring
`object-fit: cover`, and the mean and standard deviation of relative
luminance under the panel are taken. From the mean, the panel solves for
the tint alpha that makes its *secondary* text colour clear 4.6:1 against
the composite (`alpha × tint + (1 − alpha) × background`), which puts the
headline well past 7:1; a busy background (high deviation) adds up to
0.14 of alpha and up to 14px of blur. Mode, light or dark glass, is an
art-directed choice per section (`data-plate="light|dark"`) so the page
keeps its rhythm; alpha and blur are never chosen by hand. The panel
writes the result to its own custom properties, so the CSS stays a
single `.glass` rule.

**The cutouts.** The bags are licensed product photographs with the
background removed by Adobe's service, cropped and exported with alpha.
The printed label is HTML laid over the bag, so every bag carries the
real roast date, the origin, the process and the roast-level dots, and
changes when the data does.

## The mechanic: the roast curve

Bean temperature over a thirteen-minute roast, drawn from thirteen anchor
points through a Catmull-Rom spline: charge at 190 °C, turning point at
1:30, drying and Maillard stages shaded, and **first crack** marked at
8:40 and 196 °C with a slow pulse, because it is the moment every roaster
listens for. The roast-level control, Light, Medium, Dark, moves the
*drop*: the live stroke is clipped at the drop time and the rest of the
profile is left ghosted as the roast that did not happen. The
development window from first crack to drop is shaded, and the readouts
tween: drop time and temperature, development time and its share of the
roast, weight lost, and what the cup tastes like.

The chart is a playhead. Pointer or keyboard moves a marker along the
curve, eased with a small lag, and a glass tip reads time, temperature,
rate of rise and stage. Hovering a level previews its drop before it is
chosen. Arrow keys step ten seconds, Shift steps a minute, `F` jumps to
first crack, `End` to the drop. The chosen level is stored and shared:
the bag grid rings the bags roasted at that level and says how many, the
subscription's roaster's pick is priced from them, and the origins page
tags them.

## Interaction

| Surface | What it does |
|---|---|
| Buttons | Lift 1px with a shadow on hover, the arrow slides, press scales to .97 in 60 ms |
| Segmented controls | A thumb slides between options on a spring curve; options scale on press |
| Product cards | The card lifts 4px; the bag rises 10px and turns 1.5°, its shadow widens and fades, the label goes with it |
| Add | Squashes, turns cherry, reads *Added* for 1.4 s; the bag count pops |
| Quantity | Presses scale to .85 |
| The cart | Slides in over a veil in 720 ms; Escape closes it; focus moves to the close button and back |
| Week strip | Days lift 2px on hover; today is ringed |

Under `prefers-reduced-motion` the clips do not load and posters stand,
the bags do not float, the first-crack pulse stops, the curve clips and
markers move without transition, reveals are instant, and the playhead
snaps.

## Type

**Fraunces** at its largest optical size, soft axis at 40, wonk on, for
every headline, italic for the turn in the sentence. **Archivo** talks,
and at 118–125% width in capitals it is the bag-label voice: origins,
eyebrows, nav, the strip. **IBM Plex Mono** measures: prices, dates,
times, temperatures, the roast log.

## Colour

Bean (`#1E1410`), roast, husk, latte, crema and paper are one coffee
scale. The one accent is cherry (`#C43A2C`), the colour of the fruit the
bean comes from, kept for first crack, the recommended ring, the bag
count and the window on the resting bar. The plates are graded warm and
a little under-saturated so green coffee, kraft paper, a cooling tray and
a morning cup read as one room.

## Data

`js/data.js` is the business: six bags with origin, producer, process,
variety, altitude, cupping notes, roast level, drop time and price; the
curve anchors; the three levels; the weekly schedule (cutoff Wednesday
18:00, roast Thursday, ship Friday, door Saturday); shipping and the
subscription discount; three notes; the last roast log. The hero, the
labels, the strip, the countdown, the cart and the subscription all
compute from it. Every date on the site is derived from the current
date, so the labels say the next real roast day.

## Verification

Headless Chrome over CDP. Both pages swept at 320 / 375 / 414 / 768 /
1024 / 1440 / 1920 for horizontal overflow and console errors. The chart
was hovered and driven by keyboard and the tip read back; a level was
clicked and the readouts, the recommended cards and the subscription
price checked; a bag was added, the subscription started, the cart
opened, and the order captured through the `firstcrack:order` event so
no mail client opened. The reduced-motion path was rendered with the
media feature emulated.
