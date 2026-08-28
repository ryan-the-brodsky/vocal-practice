# VoSci content audit: tone, citation depth, and where we out-breadth them

**Date:** 2026-08-27. All 31 articles on voicescience.org/learn/articles/ fetched and parsed with one script;
our 25 `content/learn/*.md` measured with the same script for an apples-to-apples read. Jargon/1k = hits per
1,000 words on a fixed list of ~30 voice-science terms (formant, adduction, subglottal, passaggio, CT/TA,
closed quotient, SOVT, audiation, solfège...). Reference list extracted to
`seo/data/vosci-references-2026-08-27.md`. Ryan's framing that motivated this: he is leaving the lane, but his
content stays indexed and will keep drawing citations against us, so we must out-breadth and out-cite it
while keeping the free tools as the combination that wins.

## 1. The comparison, measured

| | VoSci "Science-Based Guides" (16, Mar-Apr 2026) | VoSci opinion posts (15, 2022-24) | **Vocal Habit Learn (25)** |
|---|---|---|---|
| Total words | 22,317 | 17,890 | **49,050** |
| Avg words/article | 1,394 | 1,192 | **1,962** |
| Avg sentence length (words) | **15.1** | 18.1 | 19.9 |
| Jargon per 1,000 words | **16.9** | 12.5 | 24.7 |
| Reference-list entries | 47 (7 of 16 guides have **zero**) | 26 (22 of them in one straw article) | **116** |
| Inline author-year citations | 20 | 0 | **91** |
| Links into an interactive tool | 28 | 0 | embedded exercises on most pages |
| FAQ blocks | most guides | none | 12 of 25 |
| Bylines | Josh Manuel, dated | dated | none |

Two findings that cut against the easy story:

**His prose is plainer than ours.** Shorter sentences (15 vs 20 words) and a third less jargon. The guides open
with a hook sentence and a myth to knock down ("Breathe from your diaphragm. Sometimes, that's the wrong
answer.") and move fast. Ryan's read that he missed his audience is right about the **tools** (settings-first
modal, "Audiate", no feedback), not about the writing. Our articles are the ones that read denser; the
resonance and range articles are at 40-55 jargon/1k. Worth a pass with the style guide's plain-language rule.

**Our sourcing is much deeper.** 116 listed sources and 91 inline attributions across 25 articles versus 47
and 20 across his 16 guides, and 7 of his guides, including "What Is Belting? How to Belt Safely, According to
Science" (27.5 jargon/1k, 0 references) and "What Is Head Voice? The Voice Science Explanation" (0
references), carry the "science" label with no citations at all. Of his 73 reference entries, 21 sit in one
2023 article about singing straws. On the mechanism the playbook memory describes (self-sourcing paragraphs
with inline attribution), we already beat him. His citations come from breadth and the tool, not from depth.

**Where he is genuinely better:** breadth (31 articles + 200 lexicon terms + 168 lessons vs our 25 + 3
spotlights + 1 tool page), the guide-to-tool links (14 in the practice guide alone), and one positioning
argument aimed straight at us.

## 2. The argument aimed at us

"How to Sing in Tune: The Science-Based Guide" (audiation ×16) has a section titled "Why Most Apps Miss the
Point": singing in tune is a perception and audiation problem, so pitch-feedback apps train the wrong thing.
He cites Gordon 2012, Watts 2003, Estis 2011, Edmonds & Howard 2025. Our `how-to-sing-in-tune` already
carries Bottalico 2016 and Reed 2024 (auditory imagery predicts accuracy under altered feedback), so we hold
the counter-evidence. We should answer this directly in that article and in `pitch-training-for-singers`:
feedback and audiation are not rivals, external pitch feedback is how a beginner calibrates the internal map,
and the research on feedback *frequency* (Steinhauer & Eichhorn 2025, in his own list) is about scheduling
feedback, not removing it. That is a "surfaces genuine disagreement" section the style guide asks for, and
it names the strongest competing view instead of ignoring it.

## 3. Topic map: his coverage vs ours

**He has, we lack (build candidates, in priority order):**
1. **Vocal methods compared** (SLS / Estill / CVT / bel canto): his best-sourced guide (9 refs); a classic
   "which should I pick" question with a recommendation-shaped answer. High citation potential.
2. **The passaggio** as its own explainer (we cover it inside mix/high-notes articles).
3. **Vocal health 101** (hydration, medications, reflux, when to see an ENT): his has 0 refs; ours would have
   Stachler 2018 and the laryngology literature. Careful: health-adjacent, keep it non-clinical.
4. **Head voice explained** and **mix voice explained** as concept pages (we have the exercise pages; the
   "what is X" query is separate and he owns it with 0 references).
5. **Legato / phrasing** (we have nothing on musicianship beyond agility).
6. **Voice types explained** and **what a range test measures** (our tool page carries the FAQ; a standalone
   explainer would double the entry points).
7. **Ear training / intervals** for singers (tonedear proves tool-only gets nothing; a text page plus our
   pitch-matching exercise would).
8. **Are online singing lessons good?** and **do practice apps work?**: recommendation-shaped, chat-native.
9. **Voice change in boys / teen singers** (parents ask chatbots; his has 4 refs).
10. **Breathing physiology** (we have exercises; he has the "four types of breathing" explainer).

**We have, he lacks:** every pain-point "why" article (voice crack, sing flat, recorded voice, high notes),
the identity questions (can anyone / tone-deaf / adult), the timed warm-up routines (5 min, 10 min,
beginners), resonance, agility, vibrato, chest voice, pitch training, range-increase exercises, and the
artist spotlights. That is the beginner lane, and it matches his stated exit from it.

**Overlap to out-write:** practice, sing in tune, belting, breathing, warm-ups, SOVT/straws, head voice,
mix voice, higher notes, range. On each of these we are already longer and better sourced; the fix is the
title/framing audit already queued (question-led titles, "free" resource framing) plus a plain-language pass.

## 4. The lexicon is the breadth lever

His 200 lexicon terms are 200-word definitions with `DefinedTerm` JSON-LD and no citations, and they are his
top Google pages (voice frequency range, voice crack, contralto, belting, mezzo-soprano, faucial pillars). A
Vocal Habit glossary of 100-150 terms, each with one primary source and a link to the exercise that trains
it, would match his breadth at a fraction of the article cost and beat his entries on sourcing. Generate the
term list from our own articles' bolded concepts plus his lexicon index; fact-check in batches.

## 5. Reference mining

58 deduped scholarly references extracted (file above), grouped by the article they came from and mapped to
the Vocal Habit article they would feed. Richest clusters: SOVT/straw phonation (21 papers: Titze, Dargin &
Searl, Andrade, Guzman, Kaneko, Pozzali's systematic review), belting physiology (Bourne & Garnier 2012/2016,
Estill 1988, Schutte & Miller 1993), motor learning for practice (Duke 2009, Maas 2008, Steinhauer & Eichhorn
2025), pitch perception (Watts 2003, Estis 2011, Lester-Smith 2023), range/voice type (Lamarche 2010, Johnson
& Kempster 2011, Rast 2023), CVT/Estill research (McGlashan 2017, Thuesen 2017, Leppävuori 2021), and the
boys' voice-change literature (Cooksey 1977, Hollien 2012, Willis & Kenny 2007). Rule stands: locate, read,
verify, then cite the paper; never VoSci.

## 6. Plan

1. Answer the "apps miss the point" argument in `how-to-sing-in-tune` and `pitch-training-for-singers` (this week; no new research needed, the counter-sources are already in those articles).
2. Plain-language pass on the five densest articles (resonance 54.5, range 41.1, chest 39.2, SOVT 39.0, belting 37.9 jargon/1k).
3. Ship the glossary (100-150 `DefinedTerm` pages) as the breadth play.
4. New articles in the §3 order, starting with vocal methods compared and vocal health 101, each mined from the reference file and fact-checked.
5. Keep the tools free and embedded on every page; that is the half of the combination he is now withdrawing from.
| # | date | title | words | avg sentence | jargon/1k | refs | inline cites | tool links |
|---|---|---|---|---|---|---|---|---|
| 1 | 2022/01 | I Am Biased | 742 | 17.3 | 1.3 | 4 | 0 | 0 |
| 2 | 2023/06 | Are Online Singing Lessons Good? | 844 | 17.6 | 1.2 | 0 | 0 | 0 |
| 3 | 2023/06 | Opinion: Modes, Mix Voice, Head Voice… What? | 1607 | 21.8 | 43.6 | 0 | 0 | 0 |
| 4 | 2023/06 | The Vocal Athlete: Part 1 | 930 | 18.1 | 12.9 | 0 | 0 | 0 |
| 5 | 2023/06 | The Vocal Athlete: Part 2 | 1188 | 15.9 | 3.4 | 0 | 0 | 0 |
| 6 | 2023/06 | The Vocal Athlete: Part 3 | 899 | 18.6 | 3.3 | 0 | 0 | 0 |
| 7 | 2023/07 | Why We Should Do Interval Training | 463 | 17.1 | 8.6 | 0 | 0 | 0 |
| 8 | 2023/11 | Decoding Vocal Jargon: A Comprehensive Resource for Vocali | 663 | 21.3 | 16.6 | 0 | 0 | 0 |
| 9 | 2023/11 | How ChatGPT Thinks You Teach Singing | 4388 | 17.4 | 14.6 | 0 | 0 | 0 |
| 10 | 2023/11 | Read Before Using Singing Straws | 1618 | 13.8 | 45.7 | 22 | 0 | 0 |
| 11 | 2023/11 | The Importance of Ear Training in Singing | 648 | 17.5 | 10.8 | 0 | 0 | 0 |
| 12 | 2023/11 | The Lifelong Symphony: How Learning an Instrument Enriches | 857 | 18.6 | 3.5 | 0 | 0 | 0 |
| 13 | 2024/04 | You Should Use A Practice App In Your Studio | 1121 | 17.8 | 2.7 | 0 | 0 | 0 |
| 14 | 2024/08 | 5 Ways to Strengthen Your Head Voice | 1154 | 16.2 | 17.3 | 0 | 0 | 0 |
| 15 | 2024/11 | Voice Types Explained: A Beginner's Guide to Vocal Classif | 768 | 23.2 | 2.6 | 0 | 0 | 0 |
| 16 |  | How to Breathe While Singing: What the Science Shows | 1327 | 17.1 | 25.6 | 3 | 0 | 0 |
| 17 |  | How to Belt: A Science-Based Guide to Safe Belting | 1387 | 11.9 | 18.0 | 5 | 1 | 0 |
| 18 |  | How to Practice Singing: The Science-Based Guide | 1458 | 13.9 | 3.4 | 7 | 12 | 14 |
| 19 |  | How to Sing Higher Notes: The Science-Based Guide | 1702 | 12.8 | 19.4 | 4 | 0 | 3 |
| 20 |  | How to Sing in Tune: The Science-Based Guide | 1851 | 14.2 | 14.6 | 7 | 1 | 6 |
| 21 |  | How to Sing Legato: Smooth, Connected Phrasing | 972 | 12.3 | 2.1 | 0 | 0 | 0 |
| 22 |  | How to Find Your Vocal Range: What a Range Test Actually T | 1751 | 15.4 | 6.3 | 4 | 1 | 4 |
| 23 |  | Male Belt: What It Is and How to Find It | 979 | 12.4 | 18.4 | 4 | 1 | 0 |
| 24 |  | How to Sing in Mixed Voice: It's Not a Register | 1156 | 14.1 | 18.2 | 0 | 0 | 1 |
| 25 |  | Singing Preparation: Expanding the Vocal Warm-Up Repertoir | 1146 | 19.8 | 16.6 | 0 | 0 | 0 |
| 26 |  | The Passaggio: A Zone of Choices | 881 | 14.6 | 27.2 | 0 | 0 | 0 |
| 27 |  | Vocal Health 101: The Path to a Healthy Voice | 1040 | 18.6 | 3.8 | 0 | 0 | 0 |
| 28 |  | SLS, EVT, CVT, and Bel Canto: Which Vocal Method Is Right  | 1569 | 18.2 | 35.1 | 9 | 2 | 0 |
| 29 |  | Voice Change in Boys: The Parent & Teacher Guide | 1538 | 18.3 | 15.0 | 4 | 2 | 0 |
| 30 |  | What Is Belting? How to Belt Safely, According to Science | 1961 | 13.4 | 27.5 | 0 | 0 | 0 |
| 31 |  | What Is Head Voice? The Voice Science Explanation | 1599 | 14.6 | 20.0 | 0 | 0 | 0 |
## 7. Addenda (Ryan, same day)

- **Marketing copy is AI-written and not de-slopped.** `/tools/practice-paths/` ran through our anti-slop
  scanner: 620 words, **9 em dashes (14.5 per 1,000 words)**, plus the usual "actually" intensifiers and
  "all sequenced in the right order" cadence. The March-April 2026 guides are the same generation of copy.
  Our zero-em-dash gate is a visible differentiator to anyone (or any model) that has learned the tell.
- **Support/feedback widget:** Help Scout Beacon ("Send a message": name, subject, email, message, image
  upload; "We're a small team, but we aim to reply within 1 business day"). Cleaner than our Google Form
  pill; this is the parked feedback-form improvement, and Beacon or an equivalent (Crisp, Chatwoot) is the
  pattern to copy: in-page, no redirect, promises a reply window.
- **Why take Practice Paths down if it runs in the browser?** It doesn't only run in the browser. It is the
  paid product: accounts, Stripe subscriptions with auto-renew obligations, per-user performance history,
  the adaptive engine keyed to that history, Sentry/PostHog, and a support promise of one business day from
  a paid team. The page says "currently unavailable while we adjust the singer experience," and the Terms
  (updated 2026-08-24) still list Practice Paths and "Studio features" as paid. Most likely reading: it is
  being repackaged for the teacher/studio audience (teacher assigns paths, sees student progress) rather
  than retired; taking it offline stops new consumer subscriptions and support load during the rework. The
  seven stateless tools stay up precisely because they cost him nothing.

## 8. Result of the plain-language pass (2026-08-27, same day)

All 25 articles edited by per-article Opus agents and verified by per-article Sonnet agents (50 agents, 0
errors). Corpus averages: words/sentence **19.9 → 14.0** (VoSci guides: 15.1), jargon per 1,000 words
**24.7 → 9.7** (VoSci: 16.9), total length 49,046 → 52,378 (+7%, definitions added on first use). Every
article's Sources block, frontmatter (except `updated:`), FAQ headings and exercise markers were confirmed
byte-identical to HEAD by the verifier; body prose carries zero em dashes. We are now plainer than his
guides *and* still 2-4x deeper in citations. Follow-ups: replace the three VoSci lexicon citations in our own
Sources with primary papers; trim four over-long metaDescriptions; answer the "apps miss the point"
argument in `how-to-sing-in-tune` (not part of this pass, it adds a claim and needs the fact-check gate).
