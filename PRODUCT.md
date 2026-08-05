# PRODUCT.md

## What this is

A personal portfolio site for **Zane**, a web designer/developer who builds original,
self-contained website templates. The portfolio's job is to make a visitor believe Zane can
design and build a distinctive, working site — by handing them working sites, not screenshots.

The unique mechanism: **every project in the portfolio is a live, hand-built site in this same
repo**, reachable in one click. Nothing is a mockup. Nothing needs a build step.

## Audience and scene

Prospective clients and studios browsing on a desktop, at work, with a dozen other portfolios
open in adjacent tabs. They have seconds. They are looking for a reason to keep this tab.

## The catalog (product truth — all verifiable, none invented)

| Name | Slug | What it is | Technical signature |
|---|---|---|---|
| MERIDIAN PARTNERS | `business-corporate` | Multi-page consulting firm site | Multi-page IA, restrained typographic system |
| FORGE | `gym-service` | Animation-driven gym site | GSAP + ScrollSmoother + Three.js + Web Audio |
| OBLIK | `ecommerce-design-store` | Design-object store | Product grid, cart UX, editorial product pages |
| PULSE | `pulse-ai-analytics` | AI-analytics landing page | Cinematic scroll assembly, particle field |
| EMBER | `restaurant-food` | Wood-fire restaurant | Zero dependencies; one rAF loop drives canvas embers, parallax, heat gauge |
| TRIGGERED | `entertainment-triggered` | Concept redesign of a real Singapore game centre | Three.js lava grid + peak/off-peak price calculator. Unofficial — carries a disclaimer |

Facts that may be stated as stats: 6 templates shipped · 0 build steps · 0 CSS frameworks ·
every template self-contained (`index.html` + `css/` + `js/` + `img/`) · deployed to GitHub
Pages and Vercel.

## Claims that must NOT be invented

Client names, revenue, years of experience, awards, testimonials, headcount, hire rates,
availability dates, pricing. If a surface wants one, it ships as a clearly marked placeholder.

## Constraints

- Static HTML/CSS/JS. No build step, no framework. Each surface is `index.html` + `css/style.css`
  + `js/main.js` + `img/`.
- CSP meta on every page; `script-src` scoped to `'self'` plus named CDN hosts, never a wildcard.
- Full SEO/OG metadata set, matching the other templates in this repo.
- No third-party copyrighted content. Imagery is either free-license, AI-generated with approval,
  or — here — screenshots of this repo's own templates.

## Brand commitments (user-pinned, 2026-08-05)

The portfolio's visual world is pinned to **Retro Arcade / Cyber HUD**. Required devices: HUD
overlay, scanlines, neon accent on a dark ground, pixel grid, player stats, joystick/keyboard
prompt, high-score table, health bar, buttons that read as arcade action keys. Navigation must
stay obvious. Banned: slow loading animations, tiny type, any sound that plays unprompted.

The pin fixes the *world*, not one rendition of it: the arcade's full material range — printed
cabinet art, 16-bit screen UI, monochrome phosphor, vector-beam graphics, flyer print — is all
in play.
