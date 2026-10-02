# AI-slop research: `templates/restaurant-ember-oak/`

Deliberately generic restaurant site (warm palette, still a believable restaurant). Not registered in the hub or sitemap, not pushed. Delete the template folder and this file when the research is done.

## Tells (what a default AI build produces)

**Copy**
- Name pattern "Ember & Oak" (noun & noun); fire emoji as the logo
- "Where Tradition Meets Innovation"; "embark on an unforgettable culinary journey"; "elevating your dining experience"
- "symphony of flavors", "tantalize your taste buds", "dance on your palate", "hidden gem", "made with love"
- "Why Choose Us?" with exactly three emoji cards (Fresh Ingredients / Expert Chefs / Made with Love)
- Em dashes in body copy; "✨ Welcome to…" pill badge above the h1
- Testimonials: three, all 5 stars, "Sarah M. / John D. / Emily R.", all one sentence of praise
- Closing CTA "Ready to Experience the Magic?"
- Placeholder contact data: 123 Main Street, Anytown, (555) 123-4567

**Visual**
- Tailwind-amber palette (#d97706 / #ea580c / #fef3c7), Inter + Playfair Display
- Gradient text on two words of the h1; gradient pill buttons with coloured glow shadow
- Glassmorphism sticky nav (blur + translucency); dark gradient overlay on a full-bleed hero photo
- Rounded-24px white cards, soft shadow, `translateY(-8px)` hover lift on everything
- Stats band (15+ / 50K+ / 100+ / 25), 3-up grid, alternating white/cream sections
- Fade-in-on-scroll applied to every card

## Mistakes baked in (the "AI will get this wrong" list)

1. **Dead hamburger** — button shows at mobile width, has no handler; nav just disappears
2. **Copyright year `© 2024`** — stale training-data year (it is 2026)
3. **Facts contradict each other** — "Founded 2010" vs "15+ years" (it's 16); hours say Mon–Fri open *and* "Closed on Mondays"; Sat–Sun open at 10 AM for a dinner place
4. **Inconsistent price formats** — `$28`, `$34.99`, `$ 26`, `$12.00`
5. **Useless alt text** — "Image", "Restaurant", "Delicious dish" repeated; one `<img>` has no alt at all
6. **`href="#"` everywhere** — Order Online, Learn More, View Full Menu, all footer links, social links, Privacy, Terms
7. **Form with no labels or `name`s, no backend** — placeholder-only inputs; JS just `alert()`s "Thank you for your reservation!" and discards the data (it implies a booking that never happened)
8. **Invented social proof** — 50K customers, 25 awards, fake reviewers
9. **Menu description doesn't match the photo** — "Pan-Seared Salmon" uses a generic plated-dish stock image; "Grilled Ribeye" photo is steak with flowers, "Chef's Signature Dessert" is a stock dessert
10. **Hero text over a busy photo** relying on a dark overlay for contrast; gradient text on top of it
11. **Hotlinked stock images** (Pexels CDN) with no local copies — breaks if the host changes
12. **Generic `<title>`** that is a slogan, meta description stuffed with the same buzzwords
13. **No real content depth** — single page, no actual menu, no allergens, no map, no booking system, no legal/privacy page behind the footer links
14. **Fade-in via JS adds `opacity:0` to content** — nothing is visible if JS fails or before the observer fires

15. **Nav anchor typo** — "Gallery" links to `#galery`, a target that doesn't exist; the click silently does nothing
16. **Broken image** — the Pan-Seared Salmon dish uses a Pexels URL that 404s, so the card shows a hollow box with the alt text "Delicious dish"
17. **Announcement bar under a fixed nav** — "🎉 GRAND OPENING SPECIAL 🎉" bar is covered by the `position: fixed` navbar

18. **Template placeholder left in** — "Welcome to [Restaurant Name]!" in the About copy
19. **Lorem ipsum leftover** — under "Special Offers & Events"
20. **Two `<h1>`s** — hero and About both use h1
21. **Same chef photo three times** — Michael / Sarah / David share one stock image and an identical bio ("With over 20 years of culinary experience…"); the photo is a generic kitchen shot, not a headshot
22. **Fake "As Featured In" strip** — invented press names with a 🏆 label
23. **FAQ that can't open** — "➕" icons on static text, no toggle behaviour
24. **"📍 Map Loading..." box** — a grey placeholder that never loads a map
25. **Cookie banner whose Accept does nothing** (`href="#"`), plus a fixed ⬆️ back-to-top button that overlaps content; both sit over the page on every scroll position
26. **Accidental horizontal scroll** — the decorative blob pokes past the viewport edge (`right: -100px`, no `overflow: hidden` on the hero)
27. **Emoji used as headings' decoration and section icons** (👨‍🍳 🎁 ❓ 🏆 🍷 🔥) instead of real iconography

## Applied from the 925 Studios AI-slop guide

Source: https://www.925studios.co/blog/ai-slop-web-design-guide (six tells)

| Guide tell | How it shows up in the site |
|---|---|
| Inter default | Inter is the only font, with `system-ui` fallbacks; Playfair Display removed, headings inherit Inter |
| Purple-to-blue gradient | `#7c3aed → #3b82f6` on buttons, the h1 gradient words, the announcement bar and the CTA band, laid over the warm palette. This clashes with the amber theme on purpose, which is itself a common AI result |
| Vague aspirational headlines | "Taste the Future of Dining", "Your all-in-one dining destination", "Savor without limits", "Built for the Future of Food", "Building the Future of Flavor", "Dine Without Limits", "Scale your cravings, unlock new flavors" — SaaS headlines on a restaurant |
| Stock imagery / abstract 3D blobs | Diverse-group-toasting stock banner (Pexels 3184193) and blurred violet-to-blue gradient blobs in the hero and CTA |
| Uniform component sizing | One 16px radius on every card, dish, form and image; one 32px padding; equal-height card rows |
| Missing micro-interactions | Buttons have no transition (snap), hover is just opacity .9, and one identical 0.6s fade-up is applied to every block |

Not applied: the guide's plastic AI-illustration tell (no illustrations in the site, only photography and CSS blobs).

## Images

All Pexels (free licence, no attribution required). IDs: 776538, 1581384, 30457533, 28448380, 29138854, 32863869, 88917, 2544829, 37992489. Pexels 29596682 (salmon) returned 404 and was dropped. Hotlinked, not downloaded.
