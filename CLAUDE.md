# Start here

New session in this repo? Read [AGENT.md](AGENT.md) first — one page, "why
this exists, where things live." It links onward to [PRODUCT.md](PRODUCT.md)
(personal-portfolio catalog/brand truth), [PATTERNS.md](PATTERNS.md) (code
patterns that keep getting re-broken per template), and
[VIDEO-POLICY.md](VIDEO-POLICY.md) (AI video credit policy). This file
(CLAUDE.md) covers content-policy rules only, below.

Also check `~/.claude/projects/.../memory/MEMORY.md` for cross-session
knowledge: build recipe, image-gen usage, verification traps, per-client
facts. It's not in this repo (user-global, not project-checked-in) but it's
the other half of the baseline — read it too, not just this file.

# Default context discipline

Use targeted designer-builder mode by default. This repo has dozens of
self-contained templates, so do not broadly scan the whole collection or spawn
background/subagents unless the user explicitly asks or the task truly needs
parallel work. For new child sites, inspect at most 4 relevant existing
templates before building; for 3D work, prefer `carnival-null`,
`festival-voltflood`, `horology-eon-v2`, and `logistics-northline` first. If
token use grows before implementation, pause and narrow scope.

# Portfolio content policy

For AI video generation tasks, see [VIDEO-POLICY.md](VIDEO-POLICY.md) — credit
conservation policy: plan once, generate once, inspect, only regenerate with a
specific reason. Active by default; only skip on an explicit override.

- The portfolio home page is the single place for collection-level provenance and disclosure.
- Do not add generic “demo,” “fictional,” “portfolio template,” AI-generation, stock-image, copyright, or affiliation disclaimers to child-site pages, metadata, footers, forms, or interface messages.
- Present every child site as a client-facing website. Do not call attention to its construction or provenance in its ordinary copy.
- If a child site has a genuine About page, a concise project-specific disclosure may appear only there when legally necessary.
- Keep disclosures factual and consolidated. Do not state or imply that AI made every part of a site.
