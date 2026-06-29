---
name: content-fact-check
description: >-
  Adversarial fact-check for any Vocal Habit content (artist spotlights AND Learn articles). Given a set of
  factual / scientific / physiological / health claims, refute each with ≥2 independent lenses, verify
  against authoritative sources, and emit per-claim verdicts (SUPPORTED / OVERSTATED / REFUTED) with verified
  sources. Use as the quality gate before any content is declared done, or when asked to "fact-check <claims>".
  Never fabricates a citation. Drafting only.
metadata:
  version: 1.0.0
---

# Content Fact-Check — the quality gate

**Phase 2 worker + final gate.** The MANDATORY adversarial check from `seo/content-style-guide.md`,
extracted so it's reusable across spotlights *and* Learn articles. Input: the claims (from the research
brief's `specClaims` + any technique/health claims in the draft). Output: per-claim verdicts + verified
sources, written to a `*-content-sources.md` file.

## Process
1. **Refute, don't confirm.** For every substantive factual / scientific / physiological / health claim, try
   to **disprove** it. Default to skeptical.
2. **≥2 independent lenses.** Use at least two non-correlated angles (e.g. **voice-science/acoustics** +
   **applied-pedagogy**) so blind spots don't line up. One pass is not enough.
3. **Verify against authoritative sources** (web access). Keep **SUPPORTED**, soften **OVERSTATED**, fix/cut
   **REFUTED**.
4. **Never fabricate** a citation, statistic, author, institution, or date. If you can't verify it, mark it
   uncertain and it does **not** ship as fact.
5. **Health claims = current clinical guidance.** (e.g. hoarseness referral is **4 weeks**, AAO-HNS 2018 —
   not the folk "2 weeks".)
6. **Domain rules:** voice-type labels are approximate/overlapping (range ≠ voice type); inflated
   "N-octave range" myths are a credibility trap — attribute + hedge, never assert.

## Output
A `seo/spotlight-<slug>-content-sources.md` (template: `seo/range-tester-content-sources.md`) with a verdict
table: `| claim | verdict | treatment in draft | source(s) |`, plus the verified reference URLs and any
open items for human validation. Return `{ verdicts: [...], sourcesFile, mustFix: [...] }`.

**Operational note:** if you farm this to a sub-subagent, confirm you actually have its results before
declaring done — "I spawned a checker" ≠ "it was checked."
