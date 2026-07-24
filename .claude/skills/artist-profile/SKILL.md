---
name: artist-profile
description: >-
  Orchestrator for building a draft "Artist Spotlight" (or single-song) content profile for vocalhabit.com
  from embeddable YouTube vocal-coach sources. Use when the user says "artist-profile <name>",
  "song-profile <song>", or "do an artist spotlight on <artist>". Conducts a research-first pipeline —
  research → parallel fan-out (drills · hero image · fact-check) → draft → edit — by delegating each phase to
  focused subskills/subagents, then stages the draft for human review. Draft-only — never publishes or commits.
metadata:
  version: 2.0.0
---

# Artist Profile — the orchestrator

Conduct the pipeline; **don't do the mechanical work yourself.** Sequence the phases, fan out the independent
ones to subagents running focused subskills, assemble the result, and stop at the human gates. This is the
manual/interactive form of the henchmen "spotlight" background agent (plan §7); the deterministic form is
`.claude/workflows/artist-spotlight.js`.

**Read once:** `seo/artist-spotlight-partnerships-plan.md` (strategy + page anatomy §3) and
`seo/content-style-guide.md` (voice + fact-check). **Mode:** `artist-profile <Artist>` → full spotlight;
`song-profile <Song>` → single-song scope (`mode: song`, lead the per-song "how to sing" sources).

## The pipeline

```
PHASE 1 · RESEARCH  (sequential, BLOCKING — everything depends on the brief)
  └─ subskill: artist-research  →  the research brief (coach sources, consolidation, range/voice-type,
                                    technique→article map, artistClass, specClaims)

PHASE 2 · FAN-OUT  (PARALLEL — independent given the brief; spawn together, await all)
  ├─ subskill: spotlight-drills        →  candidate-drill menu (native-first)
  ├─ subskill: spotlight-hero-image    →  hero/OG image + rightsBasis
  └─ subskill: content-fact-check      →  per-claim verdicts + sources file

PHASE 3 · DRAFT  (sequential — barrier; needs all Phase-2 outputs)
  └─ subskill: draft-spotlight  →  content/artist-profiles/<slug>.draft.md (applies the fact-check verdicts)

PHASE 4 · EDIT  (sequential, loop-until-pass)
  └─ skill: editorial-critic (anti-slop + voice) — iterate the draft until it passes

PHASE 5 · RENDERED QA  (browser-driven, BLOCKING before staging — see "Rendered QA pass" below)
  └─ Build the site, open the real /artists/<slug> page, scroll it top to bottom, and fix what only
     shows up when rendered: raw markers/markdown syntax, dead or disabled embeds, a soft hero image.

→ ASSEMBLE: npm run profiles:gen · confirm hero image + sources file exist · STAGE for preview (§3e)
```

## Rendered QA pass (Phase 5) — REQUIRED before you stage

A markdown lint and the anti-slop scanner both read the *source*; neither sees what the page actually
renders. Real defects have shipped past source-only checks (raw `[[…]]`/`[text](url)` leaking as text,
a coach embed the creator had disabled, a blurry hero). So build the page and scroll the whole thing:

```
EXPO_PUBLIC_INCLUDE_DRAFTS=1 npx expo export --platform web   # NB: `expo start` SSR-throws on a tone import; export instead
npx serve dist -l 8080                                         # or any static server
# then drive claude-in-chrome to /artists/<slug>, scroll top→bottom, screenshot the hero + each embed
```

Walk this checklist on the RENDERED page (not the .md):
- **No raw syntax leaking.** Zero `[[…]]` island markers, zero `[text](url)` link source, zero stray
  `**`/`*`. If any show, a marker or link didn't expand (classic cause: a link nested in **bold**);
  fix it, never ship brackets.
- **Every coach embed plays.** A "Video unavailable" / "Watch on YouTube" box means the creator turned
  embedding off: cut that `[[COACH-VIDEO]]` and keep the coach as a text citation in Sources.
- **Hero is crisp at full width.** Soft / pixelated / upscaled means go back to `spotlight-hero-image`
  for a higher-res source before staging. Judge it at hero size on the page, not as a thumbnail.
- **Every `[[DRILL]]` resolves.** Mini-player + "Add to routine" present; the exercise id maps to a
  real exercise (no blank card).
- **Links + structure.** Internal technique links point to real /learn/ slugs; "Go deeper" block is
  present; exactly one H1; FAQ intact.

Screenshot the hero and each embed into the handoff so the human review starts from evidence.

**How to run the fan-out (interactive):** spawn the three Phase-2 workers in **one message** (parallel
`Agent` calls), each pointed at its subskill with the research brief as input; await all three before drafting.
Phase 1 and Phases 3–4 are sequential. Don't start the draft until drills + hero + fact-check are all back.

## Cross-cutting guardrails (apply in every phase)
- **Draft-only.** Output is `content/artist-profiles/<slug>.draft.md` (+ hero image + sources file). Never
  write to `content/learn/`, never wire routes, never commit, never publish.
- **Specs over copy-them.** Lead with range + voice type; "how to sing like"/technique is secondary and
  artist-dependent.
- **Hedge + source.** Range/voice-type claims are approximate, attributed, never hard fact. Run the fact-check.
- **Rights.** Coach videos are **embedded** (not re-hosted/clipped). Hero image is rights-guarded (never a
  scraped celebrity photo). No implied artist endorsement.
- **CCM framing**, DESIGN.md tokens, never fabricate a citation.

## Human gates (the only human touches)
1. **Pick the artist/song** (you may propose from Ahrefs trends). 2. **Approve on the preview** (try the drills
on a phone, keep 2–3, confirm coach embeds + hero-image rights). 3. **Publish** (promote `status` + drop the
draft suffix; author any kept bespoke drill). The orchestrator never crosses these.

## Handoff
Present: the draft path, the coach-source shortlist (confirm-embed), the candidate drills (+ any NEEDS
VALIDATION), the hero image + rightsBasis, the fact-check verdict file, and 2–3 open questions.
