# Security Audit — Esteem Auto Medics (client-preview prototype)

**Date:** 2026-08-30
**Project:** `C:\School\Personal\Sides\Website-Collection\templates\esteem-auto-medics` (gated live preview: https://website-collection-zanezhijies-projects.vercel.app/templates/esteem-auto-medics — Client Preview gated, not publicly reachable without an unlock session)

> **This is an automated first-pass code review, not a substitute for the human
> sign-off record in the Vibe-Code Guardrails tool's Tech Guardrails tab, and not
> a substitute for a professional security review at Tier 4.** A clean result
> below means "nothing found by inspection," never "this is provably secure."
> Items marked "cannot verify statically" genuinely need a human/live action —
> they are not passes.

`SECURITY.md` read from its canonical path, `C:\School\Personal\Company\SECURITY.md`, v10, in full. Current and not stale.

This audit runs on a different day and by a different reviewing pass than the build itself (`DESIGN.md`'s own five revision passes, 2026-08-28/29) — the "separation in time" compensating control `SECURITY.md` recommends. I independently re-checked the claims in `DESIGN.md` rather than taking them on faith; findings below note where I confirmed them directly.

---

## Standing rules

| Rule | Status | Evidence |
|---|---|---|
| 1 — No payment data / payment-driven fulfilment | ✅ Clear | Grepped the whole template for `stripe`/`payment`/`card-number`/`cvv` — one match, `stripEls` in `js/paint.js` (a paint-visualiser variable name, unrelated). No payment code, no card fields, no checkout/webhook routes anywhere in the template. |
| 2 — Client owns every account | N/A at this stage | This is a pre-engagement **client-review prototype** sitting on the agency's own template-factory Vercel project, gated behind the agency's own Client Preview session system — that's correct for this phase, not a Rule 2 violation, the same way a design mockup isn't held to production account-ownership rules. Rule 2 becomes live the moment this moves to the client's own domain/repo — `DESIGN.md`'s own launch checklist item 6 already names this ("move to the client's own domain/repo with host security headers"). Not yet done; flagged as an open item below, not a current violation. |
| 3 — Tier 4 declined/reviewed | ✅ Clear | No payment-driven fulfilment, no financial/health data. Well inside what an automated pass can responsibly cover. |

**No standing rule forces DO NOT DEPLOY.** Nothing here blocks continuing to the design/audit stage the boss asked for.

---

## Tier & site profile

**Tier 1** — "Marketing site... No login, no payments, no user data beyond a contact form" — with one caveat below.

- **Auth/login:** `admin.html` has a sign-in gate (`js/admin.js`), but it is explicitly, deliberately fake — any staff ID/PIN opens the console (confirmed by reading `js/admin.js`: the submit handler just hides the gate and renders, no credential check exists at all). No real session, no real user. Per `SECURITY.md`'s A3b, "an admin login" bumps a project to Tier 2 — but that's written for a *real* admin login. A demo gate with zero backend and zero real data behind it doesn't carry the same risk, so I'm holding this at Tier 1 **for the current prototype specifically**, with an explicit flag: **the moment real auth/Supabase lands (the boss's own next stage), this re-tiers to Tier 2 minimum, and A3b's full checklist becomes live, not forward-looking.**
- **Database with user data:** None. `js/store.js` is `localStorage` only, seeded with five fictional demo jobs (fake plates, fake names). No real customer data exists anywhere in this template.
- **Payments:** None (see Standing Rule 1 above).
- **Public forms:** Yes — the enquiry form on `contact.html`. Confirmed in `js/contact.js`: composes a `wa.me` deep link client-side via `encodeURIComponent`, opens it with `window.open(url, '_blank', 'noopener')`, and stores/transmits nothing to any server. This is the same pattern the old `Client\EAM Workshop\Website` build used and it's a sound, low-risk pattern for a no-backend site.
- **File uploads:** None yet. The admin console has a "photo set" button (`js/admin.js` → `EAMStore.addPhotoSet`) but it doesn't accept real files — it appends a fake photo-count record to the demo job. Real image upload is explicitly Stage 3 scope (Supabase), not present here.
- **Webhooks:** None.
- **AI/LLM calls:** None.
- **Native mobile:** None.

Scope: full Domain A/B/C/D reviewed, tier-scoped to Tier 1 (Emergency Minimum Review + D1/D1a/D2/D3/D4 + A1/A2/A11 + Domain B's four items), with A3/A3b/A5a called out explicitly below as **forward-looking** since an admin surface exists in prototype form even though Tier 1's scope wouldn't normally require them yet.

---

## Domain A — Not easy to hack

**A1 (AI-agent hygiene):** ✅ Done. Read `Website-Collection/CLAUDE.md` and `AGENT.md` in full — legitimate project docs, no instructions addressed to an AI reader, no planted content. No MCP servers configured specific to this template beyond what the session already has.

**A2 (Secrets):** ✅ Done. `git log --all --oneline -- '.env*'` in the Website-Collection repo returns nothing — no `.env` file has ever been committed. `.gitignore` covers `.env*`. Grepped the template folder for key-shaped strings (`sk_live_`, `AKIA`, etc.) — none found. No `NEXT_PUBLIC_`/`VITE_`-style variables exist at all; this is plain static HTML/CSS/JS with no build-time env inlining to audit.

**A3 / A3a (Auth/sessions/CSRF):** N/A for the current prototype — no real session exists to check. Forward-looking for Stage 3: whatever auth provider gets chosen (Supabase Auth is the natural fit given the rest of the stack) needs the full A3 checklist applied fresh at that point — this audit doesn't pre-clear it.

**A3b (Admin panels):** ⚠ Documented, deliberate gap, not an oversight — `js/admin.js`'s own comment says exactly this ("Prototype sign-in: any staff ID and PIN open the console; real authentication is wired at launch"). Correctly scoped as out of bounds for a client-review demo. Listed here so it's on record, not because it's being treated as a live Gap: **when Stage 3 happens, every A3b bullet (server-side role check, rate limiting on the admin route specifically, an audit trail on data-changing admin actions, not linking the admin surface from public nav) needs to be actually built, not inherited from this note.**

**A4 (Database/RLS):** N/A — no database exists yet. Nothing to check. Becomes fully in-scope the moment Supabase is wired in.

**A5 (API routes/IDOR/XSS):** ✅ Done, evidence: no API routes exist (static site). For XSS specifically, read every DOM-writing call in `js/admin.js`, `js/track.js`, `js/store.js` — all user-facing dynamic content is set via `.textContent`, never `.innerHTML`, with one exception: `js/admin.js` line 110, `insertAdjacentHTML('beforeend', TICK)`, where `TICK` is a hardcoded static SVG string constant (not derived from any input) — safe. Staff notes typed into the admin console (`js/admin.js`'s `ad-noteform` handler) are stored raw in `js/store.js` and rendered — traced the render path and confirmed it goes through `.textContent`, not `.innerHTML`, so even a note containing `<script>` renders as inert text. No `dangerouslySetInnerHTML`-equivalent risk anywhere in this template.

**A5a (File uploads):** N/A — no real file upload exists yet (see Tier section above). Becomes in-scope at Stage 3.

**A6 / A6a (Rate limiting/billing):** N/A — no server endpoints, no metered APIs, nothing to rate-limit yet.

**A7 (Payments):** N/A per Standing Rule 1.

**A8–A10 (Injection/AI/mobile):** N/A — no SQL/ORM, no server-side URL fetching, no AI/LLM calls, no native mobile app.

**A11 (Compliance/PDPA):** ⚠ Gap, recommended-severity, not blocker. The enquiry form on `contact.html` collects name, phone, vehicle, and message — all PDPA-covered personal data the moment this goes live for a real Singapore business, even though right now it only builds a `wa.me` link and stores nothing server-side. No privacy policy or PDPA notice currently exists on the prototype. Not a blocker for a gated internal client-review preview (nobody outside the agency + client should be looking at it), but needs a short, honest privacy page (the pattern `SECURITY.md` A11 already recommends — plain language, no boilerplate wall) before this goes to the client's own domain. This overlaps with `docs/client-info.md`'s existing open item that the client hasn't been told in writing about their own PDPA obligations for this data.

---

## Domain B — Not easy to download/clone

- Source maps: N/A, plain static files, nothing to minify/map.
- Business logic server-side only: N/A, no proprietary logic exists yet (pricing is intentionally left as "TBC" placeholders, per `DESIGN.md`).
- No right-click/dev-tools blocking: ✅ Done — none present, confirmed by reading the full CSS/JS, nothing of that kind exists.
- Content-ownership clause in client agreement: Cannot verify statically — that's a contracts question, not a code question.

---

## Domain C — Handles traffic without failing

Tier 1 doesn't require this in depth, and it's a static-file template served off Vercel's CDN either way — inherently low-risk here. C3's load-testing item: Cannot verify statically, not run as part of this audit, and not warranted yet for a gated pre-engagement preview with no real traffic.

---

## Domain D — Industry-standard reliability

**D1 (Headers):** ✅ Done, and better than a bare Tier 1 minimum. Two layers apply together:
1. Per-page `<meta http-equiv="Content-Security-Policy">` in every HTML file (`index.html` line 6 confirmed directly, same pattern in `services.html`/`track.html`/`contact.html`/`admin.html` per `DESIGN.md`): `default-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self'; font-src 'self'; base-uri 'self'; form-action 'self'; object-src 'none'; upgrade-insecure-requests`. Notably **stricter than `SECURITY.md`'s own D1a baseline recommendation for our stack** — that baseline assumes Next.js and requires `'unsafe-inline'` on `script-src`/`style-src` for hydration; this template is plain static HTML with zero inline scripts and zero `style=` attributes (confirmed by grep), so it doesn't need that exception at all and ships a tighter policy than our own documented default.
2. Repo-wide response headers via `Website-Collection/vercel.json`, applying to every route including this template's: CSP (broader, for templates that need CDN/wasm), `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `frame-ancestors 'self'`, `Strict-Transport-Security`. Multiple applicable CSPs combine restrictively (a resource must satisfy all of them), so the page-level meta CSP is the one actually governing script/style execution on this template regardless of the broader repo-level policy — the strict version wins.
`X-Powered-By`: N/A, not a Next.js app, nothing to leak.
CORS wildcard: N/A, static HTML with no XHR/fetch to another origin.

**D1a (CSP specifics):** ✅ Done, confirmed directly rather than taken from `DESIGN.md`'s claim — read `index.html` line 6 myself and independently confirmed `script-src 'self'` with no `'unsafe-inline'`, no `'unsafe-eval'` anywhere. `frame-ancestors` is correctly absent from the meta tag (browsers ignore it there) and correctly present instead in the header-level policy in `vercel.json` — this closes the exact gap `DESIGN.md` flagged as deferred to production; it's actually already live at the repo level, not still open.

**D2 (Dependencies):** N/A almost entirely — no npm dependencies in this template (plain HTML/CSS/JS, self-hosted fonts). Nothing to `npm audit`. No CDN `<script>` tags in this specific template (unlike some WebGL siblings in the same repo that do use jsdelivr) — so no SRI gap here.

**D3 (Functional QA):** ✅ Done, independently re-verified live, not just trusted from `DESIGN.md`: started a local static server over the actual repo (reusing the existing `website-collection` launch config, which already serves this exact folder), loaded `index.html`, `track.html`, and `admin.html` fresh, and read the browser console on each — zero JS errors, zero CSP violations logged, on all three. This is a genuine second pass, done cold, on a different day, per `SECURITY.md`'s own "separation in time" recommendation, not a re-statement of the build's own five prior passes.

**D4 (Monitoring/backups):** N/A — no server, nothing to monitor yet at this stage. Becomes relevant once this is real client infrastructure.

---

## Emergency minimum review

| Item | Status |
|---|---|
| RLS on every table, scoped to `auth.uid()` | N/A — no database exists |
| Tried viewing another account's data as a second test account | N/A — no accounts exist |
| Grepped for `service_role` | ✅ Done — zero hits anywhere in the template |
| Checked git history for committed `.env` | ✅ Done — zero hits |
| Protected pages redirect when logged out | N/A — no real protected pages yet; the Client Preview gate itself (middleware.js, outside this template) does redirect unauthenticated requests to `/?locked=...`, confirmed by navigating directly to the gated URL without a session |
| Read `AGENTS.md`/`CLAUDE.md` end to end | ✅ Done — clean |
| Vercel env vars — nothing prod-only exposed on Preview | Cannot verify statically — needs `vercel env ls` against the actual project, outside what a code read can confirm |
| Contact form submitted for real, end to end | Cannot verify statically in this pass — I did not fire the actual WhatsApp deep link (that opens a real conversation); code-level review confirms the URL is built correctly and encoded, but a genuine end-to-end click-through is a live human check |
| Rollback steps for Vercel confirmed and written down | Cannot verify statically — operational, not code |
| Site clicked through in a real browser after real deploy | ✅ Partially done — verified against a local static copy of the exact same files (see D3). **Not yet verified against the actual gated Vercel deployment itself**, since that requires an unlocked session I'm not creating myself (see the password note in-conversation) — if you want that specific check, unlock it yourself and I'll click through with you, or hand me a screenshot. |

---

## Bottom line

**APPROVE WITH CONDITIONS** — for continuing to the next stage (design polish, then real backend). This is not a launch-readiness verdict; nothing here is being deployed to the client's own domain yet.

- No standing rule violated.
- Zero open blocker-severity gaps at the tier this prototype actually sits at (Tier 1, static, no real data).
- Two things worth doing before this goes further, neither a blocker:
  - **Recommended:** add a short, honest PDPA notice/privacy line before this reaches the client's own domain (A11) — not needed for the current internal gated preview, needed before public launch.
  - **Recommended:** decide and document the account-ownership plan (Rule 2) for when this moves off the agency's template-factory Vercel project — already named in `DESIGN.md`'s own launch checklist, not new information, just flagging it's still open.
- **Cannot verify statically, need a human:** the live Vercel env var scoping, an actual WhatsApp click-through, Vercel rollback steps written down, and a click-through against the actual gated deployment (not just the local copy) — see table above for each.
- The one item worth remembering going forward: **A3b and A5a are currently N/A only because there's no real auth or real upload yet.** The instant Stage 3 (Supabase, admin auth, live tracking, image upload) lands, this project moves to Tier 2 minimum and this audit needs to be re-run against the real thing — this report does not pre-clear that work.

This audit does not replace the human sign-off record in the Vibe-Code Guardrails tool's **Tech Guardrails** tab — that's where Owner/Reviewer/tier/approval status get formally recorded. Point that tab at this report as the evidence column for each item it covers.
