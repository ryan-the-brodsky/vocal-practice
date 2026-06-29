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

→ ASSEMBLE: npm run profiles:gen · confirm hero image + sources file exist · STAGE for preview (§3e)
```

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
