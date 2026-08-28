# AGENT.md

Reference doc for any agent working in this repo. Two questions only: why this
exists, and where things live. For code-level rules see [CLAUDE.md](CLAUDE.md),
[PRODUCT.md](PRODUCT.md), [PATTERNS.md](PATTERNS.md), [VIDEO-POLICY.md](VIDEO-POLICY.md).

## Why

This repo is a **sales instrument**, not a portfolio of screenshots. The pitch to a
prospective client is: don't imagine what your site could look like — click into a
fully working one right now. Every template is a real, deployed, self-contained site.
Nothing here is a mockup.

It serves two audiences from two different pages, and they must not be conflated:

- **Hub** (root [index.html](index.html)) — "mother website." The agency's full
  catalog, every template it can build from. This is the sales floor: a customer
  browses it, picks the template closest to their business, and that becomes the
  starting point for their actual site.
- **Personal portfolio** ([portfolio/](portfolio/)) — Zane's own curated best-of,
  capped at ~6. A different audience (studios/employers judging Zane, not customers
  shopping for a site). New templates never auto-join this — see
  [[portfolio-vs-hub-curation]] in memory.

## Where everything is

| Path | What |
|---|---|
| `index.html` | Hub gallery — every shipped template, the sales catalog |
| `sitemap.xml`, `robots.txt` | SEO for the hub |
| `templates/<slug>/` | One child site each, fully self-contained: `index.html` + `css/` + `js/` + `img/`. No shared build, no bundler. |
| `portfolio/` | Zane's personal curated subset — edit only on explicit request |
| `variants/` | Alternate visual treatments of the hub itself (arcade material range: cabinet, phosphor, vector, etc.) |
| `PRODUCT.md` | Product truth for the *personal portfolio* — catalog, audience, brand pin, banned claims |
| `PATTERNS.md` | Reusable code patterns that keep getting re-broken per template (e.g. marquee true-loop) |
| `CLAUDE.md` | Content policy — no demo/fictional/AI disclaimers inside child-site copy |
| `VIDEO-POLICY.md` | AI video credit conservation — plan once, generate once, source-priority order before spending video credits |
| `.env` | `GEMINI_API_KEY` for template imagery (nano-banana) — local to this machine, gitignored |
| `~/.claude/projects/.../memory/` | Cross-session knowledge: build recipe, image-gen usage, verification traps, multi-machine sync notes |

## Commit & push policy

A **one-shot prompt targeted at the website-template collection** — "build me a
[theme] showcase template", "add a new child site for X" — is pushed to `main`
immediately by default once the build is verified in a real browser. No separate
"should I push?" confirmation step for this specific case: build, verify, commit,
push, report the result.

This default is narrow on purpose:
- It covers **new template creation** in `templates/<slug>/` plus its hub/sitemap
  registration — the repeatable, low-risk, reviewable-after-the-fact unit of work
  this repo exists to produce.
- It does **not** cover edits to already-shipped templates, hub/homepage
  restructuring, deleting or renaming templates, `middleware.js`/client-preview
  gating, force-pushes, or anything the standard safety rules already require
  confirmation for. Those still ask first.
- If the user's prompt is exploratory ("what if we tried…", "sketch a few
  directions") rather than a build instruction, treat it as the normal
  ask-before-acting default — this rule is for the "just build it" case.

## Client delivery workflow (proposed)

This repo builds and hosts the **showcase templates only**. Once a customer buys, the
actual client build happens on its own separate side (own repo/tab, own imagery
licensing, own legal pages) — out of scope for this project.

1. Customer browses the hub, picks the closest-fit template.
2. Claude builds the customer's actual site from that template — real business facts,
   real copy, real imagery, not a demo. (Happens on the client's own side, not here.)
3. Codex pass — bug check + fact check (catalogue arithmetic, claims, broken links).
4. SonarCloud — security/quality gate.
5. Ship to client: full handover — **Vercel account, email account, and all source
   files** go to the client. They own the site outright after delivery, nothing
   stays on the agency's side.

**Not wired up yet:** no Codex or SonarCloud integration exists in this repo today —
step 3 and 4 are process, not tooling, until someone connects them (SonarQube MCP is
available in this environment but has no project configured here).

**Worth deciding before this runs for a real client:**
- Client sites need real facts (address, hours, pricing) fact-checked against what
  the customer actually supplied — Codex's fact-check pass should diff against a
  source-of-truth brief, not just internal consistency.
- `CLAUDE.md`'s "no disclaimers in child-site copy" rule is written for *this repo's*
  showcase templates; it says nothing about the separate client-site project.
