# SEJUK — manual image generation sheet

15 frames. Each prompt below is **complete and self-contained** — copy one
whole block, paste, generate, save with the exact filename given.

## Setup

**Where:** Google AI Studio (`aistudio.google.com`) → model
`nano-banana-pro-preview` (best) or `gemini-3.1-flash-image` (fallback).
The Gemini consumer app works too but gives you less control over aspect
ratio and resolution.

**Settings per frame:**

| Setting | Value |
| --- | --- |
| Aspect ratio | `1:1` for frames 1–12, `16:9` for frames 13–15 |
| Resolution | 2K or 4K if offered. 1024×1024 is the usable floor |
| Output | PNG |

**Save to:** `templates/dessert-sejuk/src/` (create it — it is gitignored) with the **exact** filename in
each heading — the grade script and the HTML both look for these names.

## The three rules

1. **Never edit the STYLE paragraph.** It is identical in all 15 prompts on
   purpose. Changing a word in one frame makes that frame look like a
   different shoot, and it shows instantly in a grid.
2. **If lettering appears** (gibberish text on a bowl, a label, a menu
   board) — regenerate. The ban is already in the prompt, but models slip.
3. **If the background drifts** warm/beige or the bowl changes shape,
   regenerate that frame. Consistency of bowl + background is the whole
   effect.

Re-rolls converge fast if you name the fix, e.g. append
`The bowl must be BRUSHED STAINLESS STEEL, footed, no pattern.`

---

# FRAMES 1–8 · The ices (aspect 1:1)

---

## 1 → save as `gunung-pandan.png`

STYLE: professional food photography for a modern Singapore ice house. The subject sits on a seamless pale frost-blue studio background, soft diffused cold daylight from the upper right, one soft shadow falling to the lower left, a gentle cool backlight rim tracing the subject's edge. Shot on a 100mm macro lens at f/8, eye-level three-quarter view, subject centered with generous bare margin on all sides. Fine beads of condensation on every cold surface. Colours are true and appetising, whites clean and neutral, no colour cast, crisp fine detail in the ice texture. NO text, NO numbers, NO logos, NO labels, NO written characters anywhere in the frame.

Subject: a tall snow-fine dome of pale green pandan milk ice served in a footed brushed stainless-steel ice-kacang bowl beaded with condensation, thick dark amber palm-sugar syrup running slowly down its slopes and pooling at the rim, toasted coconut flakes scattered across the peak, one soft spoonful of pale-green coconut custard sliding down one side.

---

## 2 → save as `bandung-monsoon.png`

STYLE: professional food photography for a modern Singapore ice house. The subject sits on a seamless pale frost-blue studio background, soft diffused cold daylight from the upper right, one soft shadow falling to the lower left, a gentle cool backlight rim tracing the subject's edge. Shot on a 100mm macro lens at f/8, eye-level three-quarter view, subject centered with generous bare margin on all sides. Fine beads of condensation on every cold surface. Colours are true and appetising, whites clean and neutral, no colour cast, crisp fine detail in the ice texture. NO text, NO numbers, NO logos, NO labels, NO written characters anywhere in the frame.

Subject: a tall snow-fine dome of rose-pink milk ice served in a footed brushed stainless-steel ice-kacang bowl beaded with condensation, tiny translucent basil seeds clinging to the slopes like rain droplets, a thin ribbon of sweetened milk crowning the peak.

---

## 3 → save as `malt-avalanche.png`

STYLE: professional food photography for a modern Singapore ice house. The subject sits on a seamless pale frost-blue studio background, soft diffused cold daylight from the upper right, one soft shadow falling to the lower left, a gentle cool backlight rim tracing the subject's edge. Shot on a 100mm macro lens at f/8, eye-level three-quarter view, subject centered with generous bare margin on all sides. Fine beads of condensation on every cold surface. Colours are true and appetising, whites clean and neutral, no colour cast, crisp fine detail in the ice texture. NO text, NO numbers, NO logos, NO labels, NO written characters anywhere in the frame.

Subject: a tall snow-fine dome of deep cocoa-brown malted milk ice served in a footed brushed stainless-steel ice-kacang bowl beaded with condensation, chunks of dark chocolate rubble tumbling down one slope, a wide stripe of sweetened condensed milk poured over the summit and running toward the rim.

---

## 4 → save as `chendol-glacier.png`

STYLE: professional food photography for a modern Singapore ice house. The subject sits on a seamless pale frost-blue studio background, soft diffused cold daylight from the upper right, one soft shadow falling to the lower left, a gentle cool backlight rim tracing the subject's edge. Shot on a 100mm macro lens at f/8, eye-level three-quarter view, subject centered with generous bare margin on all sides. Fine beads of condensation on every cold surface. Colours are true and appetising, whites clean and neutral, no colour cast, crisp fine detail in the ice texture. NO text, NO numbers, NO logos, NO labels, NO written characters anywhere in the frame.

Subject: a tall snow-fine dome of pure white coconut ice served in a footed brushed stainless-steel ice-kacang bowl beaded with condensation, short soft green pandan jelly noodles draped around the base, glossy slow-cooked dark red beans clustered at one side, dark amber palm-sugar syrup running from the peak.

---

## 5 → save as `soursop-squall.png`

STYLE: professional food photography for a modern Singapore ice house. The subject sits on a seamless pale frost-blue studio background, soft diffused cold daylight from the upper right, one soft shadow falling to the lower left, a gentle cool backlight rim tracing the subject's edge. Shot on a 100mm macro lens at f/8, eye-level three-quarter view, subject centered with generous bare margin on all sides. Fine beads of condensation on every cold surface. Colours are true and appetising, whites clean and neutral, no colour cast, crisp fine detail in the ice texture. NO text, NO numbers, NO logos, NO labels, NO written characters anywhere in the frame.

Subject: a tall dome of pale ivory soursop ice with a coarse sparkling granita texture served in a footed brushed stainless-steel ice-kacang bowl beaded with condensation, two halves of a small round green calamansi lime resting on the peak, clear pale juice glistening between the ice crystals.

---

## 6 → save as `mango-sticky-peak.png`

STYLE: professional food photography for a modern Singapore ice house. The subject sits on a seamless pale frost-blue studio background, soft diffused cold daylight from the upper right, one soft shadow falling to the lower left, a gentle cool backlight rim tracing the subject's edge. Shot on a 100mm macro lens at f/8, eye-level three-quarter view, subject centered with generous bare margin on all sides. Fine beads of condensation on every cold surface. Colours are true and appetising, whites clean and neutral, no colour cast, crisp fine detail in the ice texture. NO text, NO numbers, NO logos, NO labels, NO written characters anywhere in the frame.

Subject: a tall snow-fine dome of white coconut milk ice served in a footed brushed stainless-steel ice-kacang bowl beaded with condensation, generous cubes of deep golden ripe mango stacked on the summit, a scatter of toasted puffed rice, pale golden salted coconut caramel running down two slopes.

---

## 7 → save as `kopi-tarik-summit.png`

STYLE: professional food photography for a modern Singapore ice house. The subject sits on a seamless pale frost-blue studio background, soft diffused cold daylight from the upper right, one soft shadow falling to the lower left, a gentle cool backlight rim tracing the subject's edge. Shot on a 100mm macro lens at f/8, eye-level three-quarter view, subject centered with generous bare margin on all sides. Fine beads of condensation on every cold surface. Colours are true and appetising, whites clean and neutral, no colour cast, crisp fine detail in the ice texture. NO text, NO numbers, NO logos, NO labels, NO written characters anywhere in the frame.

Subject: a tall snow-fine dome of coffee-brown milk ice served in a footed brushed stainless-steel ice-kacang bowl beaded with condensation, small golden butter-toast cubes stacked against the base, a generous ribbon of sweetened condensed milk pulled across the peak.

---

## 8 → save as `lychee-kacang.png`

STYLE: professional food photography for a modern Singapore ice house. The subject sits on a seamless pale frost-blue studio background, soft diffused cold daylight from the upper right, one soft shadow falling to the lower left, a gentle cool backlight rim tracing the subject's edge. Shot on a 100mm macro lens at f/8, eye-level three-quarter view, subject centered with generous bare margin on all sides. Fine beads of condensation on every cold surface. Colours are true and appetising, whites clean and neutral, no colour cast, crisp fine detail in the ice texture. NO text, NO numbers, NO logos, NO labels, NO written characters anywhere in the frame.

Subject: a tall snow-fine dome of blush-white lychee ice served in a footed brushed stainless-steel ice-kacang bowl beaded with condensation, whole peeled translucent lychees and cubes of dark grass jelly arranged at the base, pale soft palm seeds tucked between them, thin ruby-red syrup traced over the peak.

---

# FRAMES 9–11 · The warm counter (aspect 1:1)

---

## 9 → save as `ondeh-mochi.png`

STYLE: professional food photography for a modern Singapore ice house. The subject sits on a seamless pale frost-blue studio background, soft diffused cold daylight from the upper right, one soft shadow falling to the lower left, a gentle cool backlight rim tracing the subject's edge. Shot on a 100mm macro lens at f/8, eye-level three-quarter view, subject centered with generous bare margin on all sides. Fine beads of condensation on every cold surface. Colours are true and appetising, whites clean and neutral, no colour cast, crisp fine detail in the ice texture. NO text, NO numbers, NO logos, NO labels, NO written characters anywhere in the frame.

Subject: three glossy round pandan-green glutinous rice cakes rolled in fine grated coconut served on a small warm-grey stoneware plate, one broken open with dark liquid palm sugar flowing out, a faint wisp of steam rising.

---

## 10 → save as `gula-waffle.png`

STYLE: professional food photography for a modern Singapore ice house. The subject sits on a seamless pale frost-blue studio background, soft diffused cold daylight from the upper right, one soft shadow falling to the lower left, a gentle cool backlight rim tracing the subject's edge. Shot on a 100mm macro lens at f/8, eye-level three-quarter view, subject centered with generous bare margin on all sides. Fine beads of condensation on every cold surface. Colours are true and appetising, whites clean and neutral, no colour cast, crisp fine detail in the ice texture. NO text, NO numbers, NO logos, NO labels, NO written characters anywhere in the frame.

Subject: a golden-brown crisp rectangular waffle strip brushed with a dark glossy palm-sugar butter glaze served on a small warm-grey stoneware plate, glaze dripping from one corner, a small pool of glaze beside it.

---

## 11 → save as `tang-yuan.png`

STYLE: professional food photography for a modern Singapore ice house. The subject sits on a seamless pale frost-blue studio background, soft diffused cold daylight from the upper right, one soft shadow falling to the lower left, a gentle cool backlight rim tracing the subject's edge. Shot on a 100mm macro lens at f/8, eye-level three-quarter view, subject centered with generous bare margin on all sides. Fine beads of condensation on every cold surface. Colours are true and appetising, whites clean and neutral, no colour cast, crisp fine detail in the ice texture. NO text, NO numbers, NO logos, NO labels, NO written characters anywhere in the frame.

Subject: three smooth white glutinous rice balls floating in clear pale amber ginger soup in a small warm-grey stoneware bowl, thin curls of young ginger on the surface, a faint wisp of steam rising.

---

# FRAME 12 · Take-home (aspect 1:1)

---

## 12 → save as `syrup-bottles.png`

> Watch this one closely for lettering — bottles invite labels. The labels
> must stay **completely blank**.

STYLE: professional food photography for a modern Singapore ice house. The subject sits on a seamless pale frost-blue studio background, soft diffused cold daylight from the upper right, one soft shadow falling to the lower left, a gentle cool backlight rim tracing the subject's edge. Shot on a 100mm macro lens at f/8, eye-level three-quarter view, subject centered with generous bare margin on all sides. Fine beads of condensation on every cold surface. Colours are true and appetising, whites clean and neutral, no colour cast, crisp fine detail in the ice texture. NO text, NO numbers, NO logos, NO labels, NO written characters anywhere in the frame.

Subject: three identical tall slim glass bottles standing in a row, filled with deep amber syrup, deep green syrup and deep rose-red syrup, each sealed with a plain black cap and wearing a completely blank kraft-paper label band, condensation beading on the glass.

---

# FRAMES 13–15 · Wide frames (aspect 16:9)

---

## 13 → save as `hero-pour.png` — **the homepage hero, spend re-rolls here**

STYLE: professional food photography for a modern Singapore ice house. The subject sits on a seamless pale frost-blue studio background, soft diffused cold daylight from the upper right, one soft shadow falling to the lower left, a gentle cool backlight rim tracing the subject's edge. Shot on a 100mm macro lens at f/8, eye-level three-quarter view, subject centered with generous bare margin on all sides. Fine beads of condensation on every cold surface. Colours are true and appetising, whites clean and neutral, no colour cast, crisp fine detail in the ice texture. NO text, NO numbers, NO logos, NO labels, NO written characters anywhere in the frame.

Subject: a wide close macro of thick dark amber palm-sugar syrup pouring in one thin unbroken ribbon from a small brushed-steel jug onto the peak of a tall snow-fine dome of pale green pandan ice, fine ice crystals catching the cold backlight, a few droplets suspended mid-air around the point of impact.

---

## 14 → save as `sharing-spoons.png`

STYLE: professional food photography for a modern Singapore ice house. The subject sits on a seamless pale frost-blue studio background, soft diffused cold daylight from the upper right, one soft shadow falling to the lower left, a gentle cool backlight rim tracing the subject's edge. Shot on a 100mm macro lens at f/8, eye-level three-quarter view, subject centered with generous bare margin on all sides. Fine beads of condensation on every cold surface. Colours are true and appetising, whites clean and neutral, no colour cast, crisp fine detail in the ice texture. NO text, NO numbers, NO logos, NO labels, NO written characters anywhere in the frame.

Subject: two long-handled steel dessert spoons held by two different people's hands reaching from opposite sides, breaking simultaneously into the slopes of one very large dome of rose-pink shaved ice in a wide steel bowl, small flakes of ice scattering mid-air.

---

## 15 → save as `ice-texture.png`

STYLE: professional food photography for a modern Singapore ice house. The subject sits on a seamless pale frost-blue studio background, soft diffused cold daylight from the upper right, one soft shadow falling to the lower left, a gentle cool backlight rim tracing the subject's edge. Shot on a 100mm macro lens at f/8, eye-level three-quarter view, subject centered with generous bare margin on all sides. Fine beads of condensation on every cold surface. Colours are true and appetising, whites clean and neutral, no colour cast, crisp fine detail in the ice texture. NO text, NO numbers, NO logos, NO labels, NO written characters anywhere in the frame.

Subject: a full-frame extreme macro of finely shaved snow-like ice, thin curled translucent ribbons and sparkling crystals filling the entire frame edge to edge, faint cool blue shadow in the crevices.

---

# When you're done

Drop all PNGs in `templates/dessert-sejuk/src/` and tell me. I then run:

```bash
bash gen/grade.sh gen
```

which crops, applies the one shared grade pass, and exports WebP at 800/400
(plus 1600/2560 for the wide frames). Partial batches are fine — the script
skips what isn't there, so you can hand me frames as they come.
