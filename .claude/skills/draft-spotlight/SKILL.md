---
name: draft-spotlight
description: >-
  Phase 3 (draft) of the artist-spotlight pipeline. Given the research brief + the drill menu + hero-image +
  fact-check verdicts, assemble the spotlight article as content/artist-profiles/<slug>.draft.md — frontmatter
  + the page anatomy + the inline island markers + internal cross-links + share row. Use when the orchestrator
  has the fan-out artifacts and needs the draft assembled. Draft-only — writes a .draft.md, never publishes.
metadata:
  version: 1.0.0
---

# Draft Spotlight — assemble the article

**Phase 3 (after research + fan-out).** Inputs: the `artist-research` brief, the `spotlight-drills` menu,
the `spotlight-hero-image` output, and the `content-fact-check` verdicts. Output:
`content/artist-profiles/<slug>.draft.md`. Apply the fact-check verdicts as you write (keep SUPPORTED, soften
OVERSTATED, cut REFUTED). Voice = `seo/content-style-guide.md`. **Draft-only.**

## Island marker grammar (the route's SpotlightBody expands these)
```
[[COACH-VIDEO id=<ytid> by="<channel>" title="…"]]     -> YouTube embed (one per coach source)
[[DRILL exerciseId=<native id> key="<key>"]]           -> in-article exercise + "Add to routine"
[[SHARE]]                                               -> share row
```
**Never embed `[[RANGE-TESTER]]` in a spotlight** (the renderer still supports it for other page types).
The embedded `[[DRILL]]`s are the article's lead magnet into the app — pointing readers to the range
tester dilutes that. Don't link to /vocal-range-test from spotlight prose either.
Markers sit on their own line. Keep **list items + bold/italic on a single line** (the renderer folds wrapped
list continuations, but don't rely on it for emphasis spanning a wrap).

## Frontmatter (scalars the generator reads + audit metadata)
```yaml
title, seoTitle, slug, category: artist-profile, mode, artist, song?,
targetKeywords[], coachSources[], candidateDrills[], relatedArticles[],
heroImage, ogImage, heroHeadline, heroAlt, heroCredit, heroCreditLicense,
heroCreditLicenseUrl, heroCreditSourceUrl, metaDescription, status: draft, published, updated
```
Set `heroImage`/`ogImage`/`heroHeadline` + the `heroAlt`/`heroCredit*` block from the hero-image worker
(the credit block is REQUIRED for CC-sourced photos — see `spotlight-hero-image`);
`candidateDrills`/`relatedArticles`/`coachSources` from the brief + drill menu.

## Body anatomy (lead with specs)
1. **`# H1`** = `<Artist>'s Vocal Range and Voice Type, Explained` (one H1).
2. **Lead** — one-line answer: range in notes (hedged) + voice-type label (approximate) + a human hook.
3. **`[[SHARE]]`** near the top (no range tester — see the marker rule above).
4. **`## <Artist>'s vocal range`** — incl. the exact span people search; range ≠ voice type.
5. **`## What voice type is <Artist>?`** — approximate/overlapping, CCM framing.
6. **`## What the coaches say`** — the consolidated analysis with a `[[COACH-VIDEO]]` per source (credited);
   agreements as conclusions, disagreements surfaced. (Technique artists: heavier; tone artists: lighter.)
7. **`## Practice it`** — the candidate `[[DRILL]]`s (keep-the-ones-that-fit framing); bespoke = NEEDS VALIDATION.
8. **`## Go deeper`** — the `relatedArticles` block (REQUIRED — the spotlight → cluster bridge).
9. **`## Common mistakes / sing it safely`** — health-honest + current medical disclaimer.
10. **FAQ** + **Sources** (verified only + coach credits) + a "not affiliated with <artist>" line.

## Internal-linking rule (REQUIRED)
The **first time** each technique is named in prose, link it inline to its Learn article (the brief's
`techniqueArticleMap`) with natural anchor text — plus the `## Go deeper` block. This builds topical authority
+ crawl paths. Never leave a technique unlinked on first mention.

## Output
Write `content/artist-profiles/<slug>.draft.md`; run `npm run profiles:gen`. Return `{ draftPath, slug }` to
the orchestrator. Do not publish, wire routes, or commit.
