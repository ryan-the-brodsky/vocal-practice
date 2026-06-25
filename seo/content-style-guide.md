# Content Style Guide — Voice, Tone & Fact-Checking

**Read this before writing any Learn article, tool page, or marketing copy.** It is the verbal counterpart to `DESIGN.md` (visual). Pairs with `seo/keyword-research-2026-06.md` (what to write about), `seo/learning-library-plan.md` (article roadmap + embedded-exercise pattern), and `seo/static-rendering-architecture.md` (how content gets indexed).

---

## The voice: "Jeff Nippard for singing"

Model the evidence-based fitness educator **Jeff Nippard**, translated to vocal training:

- **Well-informed and specific.** Show real command of the material. Use the correct terms (passaggio, tessitura, SOVT, mix) and define each on first use.
- **Science-backed, honest about the evidence.** Cite when it strengthens a point. Distinguish "studies show" from "teachers generally find" from "this is one method's view." Don't dress up opinion as data.
- **Non-dogmatic / non-tribal.** Don't pledge allegiance to one method (SLS vs. Estill vs. CVT vs. classical). When schools genuinely disagree, **say so** and sketch the camps in a sentence. Surfacing disagreement *builds* trust; hiding it erodes it.
- **Empowering, not prescriptive.** Give readers enough to make their own informed decision rather than one "right way." "Here's what's happening and the main approaches" beats "do exactly this."
- **Calm and plain.** No hype, no exclamation points, no "unlock / supercharge / secret / game-changer." Confident, not salesy.
- **Practical.** Tie every bit of theory to what the singer actually does with their voice.

## Tone rules

**Do**
- Hedge in proportion to the evidence: "often," "many singers," "tends to," "one common approach."
- Attribute contested claims: "classical pedagogy leans on covering, while many contemporary methods favor lightening earlier."
- Define jargon inline the first time it appears.
- Favor concrete over abstract, short sentences over long.
- Acknowledge individual variation and day-to-day change.

**Don't**
- State one method's recipe as universal fact. *(We shipped "modify vowels EE→IH/AH→UH" as consensus — it's a classical recipe and belting does the opposite. Fixed in review.)*
- Use "consensus / everyone agrees / the only way" unless it is genuinely uncontested.
- Add hype, fluff, or filler ("in today's fast-paced world," rhetorical-question intros).
- Moralize or shame the reader.
- Give medical advice; route health concerns to professionals with **current** guidance.
- Reproduce the AI-slop patterns blacklisted in `DESIGN.md` — they apply to copy too (generic openers, empty symmetry).

## Fact-checking & sourcing — MANDATORY

Any substantive factual, scientific, physiological, or health claim must be **adversarially fact-checked before publishing**.

- **Process:** draft → spawn adversarial fact-checker subagent(s) told to *refute* (not confirm) each claim and verify it against authoritative sources with web access → keep what is SUPPORTED, soften what is OVERSTATED, fix or cut what is REFUTED → record the verdicts.
- **Use ≥2 independent lenses** (e.g., voice-science/acoustics + applied-pedagogy) so blind spots don't correlate. One pass is not enough.
- **Never fabricate** a citation, statistic, author, institution, or date. If you cannot verify it, mark it uncertain and do not publish it as fact.
- **Cite only sources that survived verification** — real, checkable references (author/institution + URL or DOI).
- **Health claims must reflect current clinical guidance.** (Lesson: hoarseness referral is **4 weeks** per the AAO-HNS 2018 guideline, not the folk "2 weeks" we first wrote.)
- **Record verdicts + sources** in a per-page `*-content-sources.md` — use `seo/range-tester-content-sources.md` as the template.
- **Operational note:** background subagents in this environment have stalled before delivering their final message. Recover their verdicts from the agent transcripts if needed, and always confirm you actually have the results before shipping. Don't treat "I spawned a checker" as "it was checked."

## Domain guardrails (this product)

- **CCM, not opera.** This is a contemporary-commercial-music app (pop, rock, R&B, country, musical-theater belt) — see `DESIGN.md`. Frame technique for CCM. When you cite classical norms (e.g., voice-type ranges), **label them as classical/choral conventions** and note CCM uses them loosely.
- **Voice type ≠ range.** Always present voice-type labels as approximate, heavily overlapping, and dependent on tessitura, timbre, and passaggio location — not just the highest and lowest notes.
- **Respect the methods as real but distinct.** Estill, Complete Vocal Technique (Cathrine Sadolin), Speech Level Singing (Seth Riggs), Somatic Voicework; classical references Miller/Doscher; science Titze/NCVS, Sundberg. Don't conflate them or imply they agree more than they do. Their evidence bases also differ — note that where it matters.

## Structure & SEO (works with the static-rendering setup)

- Ranking content (prose, headings, FAQ) lives in **static HTML**; interactive widgets are **hydrated islands** (see `static-rendering-architecture.md`). Never bury substance inside a client-only component.
- One `<h1>` = the target keyword in natural phrasing. `<h2>`s from real query variants (`seo/keyword-research-2026-06.md`).
- Include an FAQ mapping real questions; emit `FAQPage` / `Article` / `HowTo` JSON-LD via `expo-router/head` using the **child-string** form `<script type="application/ld+json">{JSON.stringify(...)}</script>` (the `dangerouslySetInnerHTML` form does NOT flush to static HTML).
- Embed the matching live exercise where one exists (the master-stroke pattern, `learning-library-plan.md`).
- End health-adjacent pages with a brief, current, non-alarmist medical disclaimer.

## New-article checklist

- [ ] Voice matches this guide (specific, non-dogmatic, no hype)
- [ ] Jargon defined on first use
- [ ] Genuine disagreements surfaced, not flattened into false consensus
- [ ] Every substantive claim adversarially fact-checked (≥2 lenses); verdicts recorded in a `*-content-sources.md`
- [ ] Sources real and verified; none fabricated; health claims reflect current guidance
- [ ] CCM framing; classical norms explicitly labeled as such
- [ ] Static-HTML content + per-route `<head>` + JSON-LD; embedded exercise if one applies
- [ ] `DESIGN.md` tokens only; no hex/spacing/font literals

---

### Worked example (the range-test page)

`/vocal-range-test` is the reference implementation of this guide. See how it: surfaces the classical-vs-CCM disagreement on the passaggio and on vowel modification instead of picking a side; labels the voice-type table as classical/choral and approximate; carries a current (4-week) medical disclaimer; and lists only verified sources. The review that produced it is in `seo/range-tester-content-sources.md`.
