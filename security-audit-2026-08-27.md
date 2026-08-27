# Security Audit — Website Collection (session delta: PARALLAX + Lab + LOAM credit)

**Date:** 2026-08-27
**Project:** `C:\School\Personal\Sides\Website-Collection` ([production](https://website-collection-zanezhijies-projects.vercel.app), verified live against a fresh preview: `https://website-collection-7brglgxay-zanezhijies-projects.vercel.app`)
**Checklist source:** `C:\School\Personal\Company\SECURITY.md` (v9, read live for this run)

> **This is an automated first-pass code review, not a substitute for the human
> sign-off record in the Vibe-Code Guardrails tool's Tech Guardrails tab, and not
> a substitute for a professional security review at Tier 4.** A clean result
> below means "nothing found by inspection," never "this is provably secure."
> Items marked "cannot verify statically" genuinely need a human/live action —
> they are not passes.

**Scope note — this is a *delta* audit, not a from-scratch one.** A full Tier-2
audit of this project already exists at [security-audit-2026-08-16.md](security-audit-2026-08-16.md)
and covers the site's real security surface in depth: the Supabase-backed
password gate, `middleware.js`, and `/api/*`. `git diff 46936e1..HEAD --name-only`
confirms **zero files under `api/`, `middleware.js`, or `db/` changed in this
session** — that surface is untouched, so this report doesn't re-litigate it and
defers to the 08-16 report for it. What *did* change this session, and what this
report actually inspects: the new `templates/exhibition-parallax/` (PARALLAX, a
static WebGL child site), the new `lab/` R&D hub (9 static category pages +
3 experiments), a footer-credit addition on `templates/cafe-loam/`, and the hub
`index.html`/`sitemap.xml` wiring for both. All of it is now pushed to `main`
(commits `6b6b237`, `fb411f5`, `73d179f`, `c161728`) and deployed to a verified
Vercel preview; production promotion is a pending human action (see Bottom line).

---

## Standing rules

| Rule | Status | Evidence |
|---|---|---|
| 1 — No payment data / payment-driven fulfilment | ✅ Clear | Grepped every file touched this session for card-input shapes, Stripe Elements, `payment.?intent` — zero hits. PARALLAX's one form (`#notify`, an email capture) calls `e.preventDefault()` and never submits anywhere — no network call, no storage, purely a client-side "held" message. |
| 2 — Client owns every account | N/A | This is the agency's own showcase repo, not a client project — no external client account exists to violate this rule. GitHub (`ZaneZhiJie/Website-Collection`) and Vercel (`zanezhijies-projects`) are the agency's own. |
| 3 — Tier 4 declined/reviewed | ✅ Clear | See tier determination below — this session's additions are Tier 1 (no auth, no data, no payments). The site as a whole is Tier 2 (pre-existing, per the 08-16 audit), unaffected by this session. |

**No standing rule forces DO NOT DEPLOY.**

---

## Tier & site profile — this session's additions

**Tier 1** — "Marketing site, portfolio... No login, no payments, no user data
beyond a contact form." PARALLAX and the Lab are both fully static HTML/CSS/JS
with no server-side logic of their own.

- **Auth/login:** absent in the new content. (The site overall has one, at
  `/portfolio` and `/client-preview/*` — pre-existing, unchanged, out of scope.)
- **Database with user data:** absent — no Supabase/fetch calls anywhere in the
  new files (grepped for `fetch(`, `URLSearchParams`, `supabase` — zero hits).
- **Payments:** absent.
- **Public forms:** PARALLAX has one (`#notify`) — inert by design, see Rule 1
  evidence above. No data collected, so no PDPA exposure (A11).
- **File uploads:** absent.
- **Webhooks:** absent.
- **AI/LLM calls (runtime):** absent — PARALLAX loads Three.js from jsdelivr for
  rendering only, no AI API calls anywhere.
- **Native mobile:** absent.

Scope for this tier: Emergency Minimum Review + D1/D1a/D2/D3/D4 + A1, A2, A11 +
the four Domain B items. This report covers that full subset for the new
content, not a shortcut subset of it.

---

## Domain A — Not easy to hack

### A1. AI-agent & supply chain hygiene
- ✅ **Done** — Read `CLAUDE.md`, `AGENT.md`, `PATTERNS.md`, `PRODUCT.md` at the
  start of this session (before any tool use) as if a stranger wrote them —
  legitimate third-person project docs, no text addressed to "you" the AI,
  nothing resembling an injected instruction. Confirmed again for this audit
  pass: none of the files added this session (`DESIGN.md`, the Lab pages) claim
  to be tool-generated or contain agent-directed text.
- ➖ **N/A** — no MCP-configuration files were touched this session.

### A2. Secrets & environment config
- ✅ **Done** — Grepped every file changed since the last audit's commit
  (`git diff 46936e1..HEAD --name-only`, 61 files) for `sk_live_`, `sk_test_`,
  `AKIA[0-9A-Z]{16}`, `ghp_`, `glpat-`, `xoxb-`, `postgresql://user:pass@...`,
  bare `Bearer <token>` — zero hits.
- ✅ **Done** — No `.env` files committed this session; `.gitignore`/`.vercelignore`
  both still exclude `.env*` (confirmed by reading `.vercelignore` directly).
- ➖ **N/A** — no `NEXT_PUBLIC_`/build-time-inlined variables exist in the new
  static content (no build step for these pages).

### A11. Compliance & legal basics
- ✅ **Done (by design)** — PARALLAX's notify form collects nothing (see Rule 1
  above): no PDPA obligation is created because no personal data is transmitted
  or stored anywhere. Confirmed by reading the full submit handler.
- ➖ **N/A** — nothing else in this session's additions collects personal data.

*(A3–A10 not applicable — no auth, no database writes, no file uploads, no
payments, no AI calls, no mobile app in anything added this session.)*

---

## Domain B — Not easy to download/clone

- ➖ **N/A** — no proprietary business logic (pricing, scoring) exists in
  PARALLAX or the Lab; both are showcase/portfolio content by design, and this
  repo's own `CLAUDE.md` policy is that templates are meant to be viewed openly.
- ✅ **Done** — no right-click-disable or devtools-blocking scripts added.
- ✅ **Done** — no source maps shipped (no build step; the raw, readable
  `main.js` is the actual served file, which is consistent with how every other
  template in this repo ships).

---

## Domain C — Handles traffic without failing

- ✅ **Done** — Static/prerendered content served directly by Vercel's CDN, same
  as every other template; no server-rendering-per-request anywhere in the new
  pages.
- ✅ **Done** — PARALLAX's WebGL render loop is client-side compute only (no
  server cost per visitor); confirmed 165fps vsync-capped at every act via
  direct CDP measurement against the live preview during this session, so a
  visitor's browser — not the server — carries the cost.
- ⚠️ **Cannot verify statically** — C3 load testing was not performed against
  the live deployment; this is a portfolio-traffic site, not expecting a launch
  spike, and this item is routinely "cannot verify" at this tier per the
  template's own guidance.

---

## Domain D — Industry-standard reliability

### D1. Headers, infra & deployment
- ✅ **Done** — Verified via `curl -I` against the live preview URL: security
  headers present and correct (`Content-Security-Policy`, `Referrer-Policy`,
  `Permissions-Policy`, `X-Content-Type-Options` implied by Vercel defaults,
  no `X-Powered-By` header present).
- ⚠️ **Gap (Recommended, pre-existing, not introduced this session)** —
  `Access-Control-Allow-Origin: *` is present on both the new pages and the
  pre-existing `index.html` — confirmed identical on both via `curl -I`, so
  this is Vercel's CDN default on static content site-wide, not something this
  session's changes caused. Matches the exact documented D1 finding from the
  08-16 ZAP scan on the sibling Thornbury project (same root cause: Vercel's
  CDN adds this by default; zero-cost fix is an explicit override in
  `vercel.json`'s `headers()`). Confirmed it does **not** appear on the actual
  `/api/session` route (checked directly) — the authenticated-endpoint case the
  rule is really about is clean. Worth fixing on a future pass; not a blocker
  for static, credential-free pages.

### D1a. Content-Security-Policy, practically
- ✅ **Done** — PARALLAX's per-page CSP meta tag and the global `vercel.json`
  header both explicitly list `script-src 'self' 'unsafe-inline'
  https://cdn.jsdelivr.net` (checked both directly) — no silent `default-src`
  fallback trap, the exact incident D1a warns about. Both `style-src` and
  `script-src` carry `'unsafe-inline'` explicitly.
- ✅ **Done — live click-through performed, per D1a/D3's explicit requirement.**
  Not inferred from a successful deploy or a curl of the HTML: drove the actual
  live preview URL over CDP, clicked "Enter Exhibit 00", confirmed the WebGL
  engine booted (`window.__parallax === true`), the no-3D fallback did **not**
  trigger, and zero console errors or warnings after the fix below. Same check
  run against `/lab/index.html` — zero errors.
- ✅ **Done (found and fixed this session)** — the live check initially surfaced
  six `THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already
  non-indexed` console warnings on PARALLAX. Not a security issue (harmless,
  cosmetic, no user-facing effect), but real and verifiable, so fixed rather
  than left: removed the redundant `.toNonIndexed()` call
  (`templates/exhibition-parallax/js/main.js`), re-verified against a local
  rebuild — zero console output — then committed (`c161728`) and pushed.
- ➖ **N/A** — `connect-src` needs no new entries; PARALLAX makes zero runtime
  network calls (no analytics, no monitoring SDK, no fetch of any kind).

### D2. Dependencies & build supply chain
- ✅ **Done** — PARALLAX's one dependency (`three@0.180.0`) is loaded from
  `cdn.jsdelivr.net` with a version-pinned URL (not `@latest`), matching this
  repo's own existing pattern (`pulse-ai-analytics`, `gym-service` use the same
  jsdelivr-pinned-version approach for GSAP). No SRI hash is attached to the
  `<script type="module">` import — **flagging as the one genuinely open item
  this pass found.**
- ⚠️ **Gap (Recommended)** — no Subresource Integrity hash on the Three.js
  `import` in `templates/exhibition-parallax/js/main.js`. SRI is not
  straightforward to apply to an ES module `import` statement the way it is to
  a classic `<script src>` tag (there's no `integrity` attribute for module
  imports) — the practical fix would be self-hosting a pinned copy of the
  three.js build inside the template's own `js/` folder instead of importing
  from a CDN, which the D2 checklist explicitly names as a mitigation
  ("fewer [third-party scripts] is better; server-side/self-hosted
  alternatives are better still"). Not done this session — noted as follow-up,
  not a blocker: jsdelivr is a well-established CDN already trusted elsewhere
  in this exact repo, and the risk (a jsdelivr compromise serving a malicious
  three.js build) is real but low-probability and consistent with an
  already-accepted repo-wide pattern, not a new risk this session introduced.

### D3. Functional QA
- ✅ **Done** — Every CTA/link in PARALLAX resolves (`#catalogue`, `#works`,
  `#artists`, `#visit`, `#tickets` anchors all confirmed present and reachable
  during the full walkthrough this session).
- ✅ **Done** — Mobile tested at a real 390×844 viewport via CDP device
  emulation (not just a resized desktop window) — confirmed act-by-act with
  screenshots earlier in this session.
- ✅ **Done** — Reduced-motion tested (`prefers-reduced-motion: reduce`
  emulated) — engine boots, drift/breathing disabled, scroll still drives the
  walk, confirmed via CDP.
- ✅ **Done** — CDN-blocked fallback tested directly (`Network.setBlockedURLs`
  on `*jsdelivr*`) — page correctly folds to the plain catalogue within the
  8-second watchdog, gate is hidden, page remains scrollable.
- ✅ **Done** — No-JS fallback tested directly (`Emulation.setScriptExecutionDisabled`)
  — catalogue renders correctly, gate stays hidden via the `<noscript>` rule.
- ✅ **Done — the site was actually clicked in a real browser after the real
  deploy**, satisfying this item's own explicit requirement: verified against
  the live Vercel preview (not just localhost) after every code change this
  session, including the fix made during this audit.
- ⚠️ **Cannot verify statically** — cross-browser testing (a second real engine,
  e.g. Safari) was not performed; all verification this session used headless
  Chrome via CDP.

### D4. Monitoring, backups & incident response
- ➖ **N/A for this session's additions** — no new server-side code was added
  that could error in a way monitoring would catch; PARALLAX and the Lab are
  static pages with client-side-only JS. The repo's existing Sentry/monitoring
  posture (if any) is unchanged and out of scope per the 08-16 audit.

---

## Emergency minimum review

| Item | Status |
|---|---|
| RLS on every table, scoped to `auth.uid()` | Unchanged this session — see 08-16 audit |
| Logged in as low-privilege account, tried cross-account access | N/A — no new auth surface added |
| Grepped repo for `service_role` | ✅ Done — zero hits in any file touched this session |
| Checked git history for committed `.env` | ✅ Done — `git diff 46936e1..HEAD` touches no `.env*` file |
| Protected pages redirect when logged out | N/A — no new protected pages added |
| Read `AGENTS.md`/`CLAUDE.md` end to end | ✅ Done — see A1 above |
| Vercel env vars checked | ➖ Not touched this session, no new env vars introduced |
| Contact form submitted end to end | ✅ Done — PARALLAX's notify form tested; correctly shows a "held" state and, by design, transmits nothing (see Rule 1) |
| Vercel rollback steps confirmed | ✅ Confirmed — `vercel rollback` / redeploying a prior deployment ID is standard Vercel CLI, unchanged by this session |
| Live site clicked through in a real browser after real deploy | ✅ Done — see D1a/D3 above, performed multiple times this session including after the fix |

---

## Bottom line

**APPROVE WITH CONDITIONS**

- No standing rule is violated.
- **Zero open blocker-severity gaps.** Everything applicable at this content's
  tier (1) either passed with direct evidence or was found and fixed live
  during this audit (the console-warning cleanup).
- **Cannot verify statically:** C3 load testing (not expected to matter at this
  traffic profile); cross-browser testing beyond Chrome.
- **Recommended-severity gaps, both pre-existing patterns rather than new
  risk:** site-wide wildcard CORS on static content (D1, confirmed identical
  on old and new pages — a future pass, not urgent); no SRI on the jsdelivr
  Three.js import (D2, consistent with this repo's existing un-SRI'd jsdelivr
  usage elsewhere, not a regression).
- **Production promotion is a pending human action**, not a code gap: `vercel
  deploy --prod` was blocked by the Claude Code auto-mode permission
  classifier (a hard-to-reverse, shared-system action correctly gated behind
  explicit confirmation) — the verified preview is ready to promote whenever
  you run it yourself.

This audit does not replace the human sign-off record in the Vibe-Code
Guardrails tool's **Tech Guardrails** tab — that's where Owner/Reviewer/tier/
approval status get formally recorded. It also does not re-cover the site's
real security surface (the Supabase-backed password gate, `/api/*`,
`middleware.js`) — that surface is untouched this session and remains governed
by [security-audit-2026-08-16.md](security-audit-2026-08-16.md).

---

## A note outside the checklist: repo state during this audit

While this audit was in progress, a new untracked directory,
`templates/horology-eon/`, appeared in the working tree — file timestamps
place it roughly 2 minutes before this note, i.e. actively being written by
another concurrent session (`website-collection-fe`, started 17 minutes prior
per `ListAgents`), not a stale leftover. It was **not** touched, staged, or
committed by this session — left exactly as found, per the standing rule to
never commit or overwrite another session's in-progress work. Not a security
finding, but directly relevant to "are all agents idle": at least one was
not, at the time this audit ran.
