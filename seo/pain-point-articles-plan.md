# Pain-point article backlog — Learn section

**Status:** plan / handoff spec (2026-08-26). Not yet assigned to mining agents.

## Thesis

Our Learn library over-indexes on **technique nomenclature** — ~10 of 22 articles are titled with
vocabulary a worried beginner would never type (`sovt-exercises`, `vocal-resonance-exercises`,
`vibrato-exercises`, `mix-voice-exercises`), chasing tiny volumes (30–150). The true user-focused
surface is the **pain-point question**: how a frustrated singer actually phrases the problem to Google
*and to ChatGPT* — "why does my voice crack," "why do I sing flat," "why do I sound bad when I record
myself." We have exactly **one** so far (`why-does-my-voice-crack`, shipped 2026-08-24) and it's the template.

**Most of this backlog is remix, not net-new research.** The physiology, the fixes, and the verified
citations already live in our existing academic articles + `vocal-tips-research.md`. The mining agents
should **scaffold from existing content first** — reframe "here is the SOVT technique" into "here is why
your voice does the scary thing, and the SOVT fix" — and only add new sourcing where a claim isn't
already covered. Elevating pain-point questions to first-class keyword targets **adds to**, doesn't
replace, the technique/how-to keywords.

Why this matters now: ChatGPT + Copilot (our only citing engines, both Bing-backed) surface "why does X
happen" questions extremely well, and question-framed pages are what they quote. See
`seo/keyword-research-2026-06.md` + the Bing-indexation work — getting these indexed is the unlock.

## Backlog (prioritized)

Volumes marked **TBD** need an Ahrefs pull (`keywords-explorer-*`); the CSV (`seo/keywords-2026-06.csv`)
is technique/how-to framed and doesn't carry most of these question phrasings.

| # | Working title (the worried-beginner question) | Slug | Target keyword | Symptom → cause (`vocal-tips-research.md`) | Remix source(s) | Embed exercise | Why it gets cited |
|---|---|---|---|---|---|---|---|
| 1 | Why Can't I Sing High Notes Without Cracking or Straining? | why-cant-i-sing-high-notes | "why can't i sing high notes" / "how to sing high notes without straining" | §1 the break; chest pulled too high; late bridging | head-voice-exercises + mix-voice-exercises + why-does-my-voice-crack (sibling) | `ng-siren` / `bub-mix-voice` | Top emotional query; reuses voice-crack research |
| 2 | Why Do I Sing Flat? (And How to Stop Going Flat on High Notes) | why-do-i-sing-flat | "why do i sing flat" / "singing flat" | §1 singing flat — **collapsing breath support is #1 cause** | breathing-exercises-for-singing + tips §breath/closure | `messa-di-voce` / `rossini-lip-trill` | #1 mechanical complaint; direct remix |
| 3 | Why Does My Voice Sound Bad When I Record It? | why-does-my-recorded-voice-sound-bad | "why does my voice sound bad on recording" / "sound bad when i sing but good in my head" | (bone conduction — not a §1 symptom) | how-to-practice-singing (already carries the bone-conduction citation) + how-to-improve-singing-voice | — (link to range test) | Huge curiosity search; citation already in-repo |
| 4 | Why Do I Sing Sharp? | why-do-i-sing-sharp | "why do i sing sharp" | §1 singing sharp; over-blowing, high larynx, jaw clench | how-to-sing-in-tune + tips §larynx/breath | `goog-octave-arpeggio` / `chest-voice-mum` (dopey mum) | Pairs with #2 (sharp/flat axis) |
| 5 | Why Does My Voice Shake or Wobble When I Sing? | why-does-my-voice-shake | "why does my voice shake when i sing" | §1 pitch wobble; weak closure + loose support | vibrato-exercises + breathing-exercises-for-singing | `straight-tone-vibrato` | Distinct scary symptom; cheap remix |
| 6 | Why Do I Run Out of Breath When I Sing? | why-do-i-run-out-of-breath-singing | "why do i run out of breath when singing" | §2 poor breath support / appoggio | breathing-exercises-for-singing (near-direct reframe) | `messa-di-voce` | Beginner staple; one-source remix |
| 7 | Why Can't I Stay on Pitch / Sing in Tune? | why-cant-i-sing-in-tune | "why can't i sing in tune" / "why do i sing off key" | §1 pitch inconsistency between registers | how-to-sing-in-tune + pitch-training-for-singers | `five-note-scale` | Question-frames our two pitch articles |
| 8 | Why Is My Singing Voice So Breathy / Weak? | why-is-my-voice-breathy | "why is my voice breathy when i sing" | §2 insufficient cord closure (breathy) | chest-voice-exercises + tips §cord closure | `belt-nyah-descending` (nay) / `bub-mix-voice` | Clear symptom → closure fix |
| 9 | Why Does My Voice Flip Into Falsetto? | why-does-my-voice-flip | "why does my voice flip into falsetto" | §1 the break; abrupt flip to falsetto | head-voice-exercises + why-does-my-voice-crack | `head-voice-vwohm` / `ng-siren` | Sibling of #1/voice-crack |
| 10 | Why Do I Sound Nasal When I Sing? | why-do-i-sound-nasal | "why do i sound nasal when i sing" | §2 soft palate not lifted (caveat: some twang is good) | vocal-resonance-exercises + tips §resonance | `ng-siren` (ng→ah) | Reframes our jargon resonance article |
| 11 | Why Does My Voice Get Tired or Hoarse When I Sing? | why-does-my-voice-get-tired | "why does my voice get tired when i sing" | §3 hydration & vocal health; over-pressing | vocal-warm-ups-for-beginners + tips §hydration | `rossini-lip-trill` (cooldown) | Health-intent; must stay current-guidance |
| 12 | Why Do I Scoop Up to Notes? | why-do-i-scoop-when-singing | "why do i scoop when singing" | §1 scooping / aspirate onset | how-to-sing-in-tune + tips §onset | `staccato` / nay | Niche but exact-match, cheap remix |

### Locked priority — volumes pulled from Ahrefs (US, 2026-08-26)

All KD **0** (easy to rank). Volumes are low individually — these are long-tail *question* queries whose
value is AI-answer retrieval + easy ranking, not raw search — with one standout anchor.

| Rank | Article | Best keyword | Vol | KD |
|---|---|---|---|---|
| **1** | Why Can't I Sing High Notes Without Straining/Cracking | **how to sing high notes without straining** | **200** | 0 |
| **2** | Why Does My Recorded Voice Sound Bad | why does my voice sound bad on recording | 30 | 0 |
| **3** | Why Do I Sing Flat | why do i sing flat | 20 | 0 |
| 4 | Why Does My Voice Shake When I Sing | why does my voice shake when i sing | 20 | — |
| 5 | Why Do I Run Out of Breath When I Sing | why do i run out of breath when singing | 20 | — |
| 6 | Why Can't I Sing in Tune | why can't i sing in tune / why do i sing off key | 10 | 0 |
| — | sharp / tired / breathy / falsetto-flip / nasal / scoop | (various) | ~0 | — |

**Anchor insight:** article #1 folds the emotional "why can't I sing high notes / why do I crack" angle into
**"how to sing high notes without straining" (vol 200)** — by far the biggest target and the one to ship first.
The ~0-volume rows (sharp, tired, breathy, falsetto-flip, nasal, scoop) are secondary — fold them as sections
inside sibling articles rather than standalone pages until AI-retrieval justifies breaking them out.

**Ship-first batch (in production):** #1 high notes/straining, #2 recorded voice, #3 sing flat.

## Reuse / remix map — "a lot of this is reframing what we have"

- **breathing-exercises-for-singing** (+ tips §breath) → feeds #2 flat, #5 wobble, #6 out-of-breath. *Biggest single cluster — one academic article seeds ~4 pain-point pages.*
- **head-voice + mix-voice-exercises** (+ voice-crack) → #1 high notes, #9 falsetto flip.
- **how-to-sing-in-tune + pitch-training-for-singers** → #4 sharp, #7 in-tune, #12 scoop.
- **chest-voice-exercises** (+ tips §closure) → #8 breathy.
- **vibrato-exercises** → #5 wobble. **vocal-resonance-exercises** → #10 nasal.
- **how-to-practice-singing** (bone-conduction citation) + **how-to-improve-singing-voice** → #3 recorded voice.
- **vocal-warm-ups-for-beginners** (+ tips §hydration) → #11 tired/hoarse.

## Handoff spec — for the deep-research article-mining agents

Each agent is assigned **one backlog row** and receives: the row + its named remix source article(s) +
the mapped `vocal-tips-research.md` section. It must:

1. **Scaffold from the remix sources first** — pull the physiology, the fixes, and the *already-verified*
   citations from the existing article(s); reframe into the pain-point question narrative (symptom → why
   it happens → the fix → the embedded exercise). Add new sourcing only for claims not already covered.
2. **Produce a draft `.md`** matching the voice-crack frontmatter schema exactly:
   `title`, `seoTitle`, `slug`, `category`, `tags`, `embeddedExerciseId` (must be a REAL exercise id),
   `targetKeyword`, `volume` (TBD→pull in Ahrefs), `kd`, `intent`, `metaDescription`, `references`.
3. **Follow `seo/content-style-guide.md`** — the "Jeff Nippard for singing" voice; surface real
   disagreement; non-dogmatic; no operatic/bel-canto framing (CCM only).
4. **NON-NEGOTIABLE gate — the `content-fact-check` skill runs before any draft is "done":** ≥2
   refutation-oriented lenses per factual/physiological/health claim, verified sources only, **never
   fabricate a citation**, health claims must be current. Per-page verdicts land in a
   `seo/<slug>-content-sources.md` (same pipeline as `seo/voice-cracks-content-sources.md`).
5. Embedded-exercise SEO rule: prose/headings/FAQ in static HTML; the exercise is the hydrated island.
   Author a `## FAQ` block (→ `FAQPage` JSON-LD via `lib/seo/faq.ts`).

## Keyword-strategy note

Pain-point **question** phrasing becomes a first-class target set alongside the existing technique/how-to
keywords — not a replacement. The mining seam is `vocal-tips-research.md` §1 (the symptom library), which
maps cleanly to "why does X happen" titles that both worried beginners and LLMs gravitate to. Pull real
volumes/KD for each row via Ahrefs before finalizing priority; the CSV won't have most of these.

## What actually gets us cited (Bing Webmaster Tools AI Performance, 2026-08-26)

Ground-truth check against Bing (the index behind ChatGPT + Copilot) reframes this plan:
- **The citation driver today is "free / online / beginner learn-to-sing" intent**, not technique or symptom
  queries. Top grounding queries: "learn to sing online free" (44 cites, 23.7% share), "best free online
  singing course" (20), "free singing lessons for beginners" (19), "learn to sing" (8).
- **Top cited pages:** the `/learn/` hub (124), `/learn/sovt-exercises` (40), homepage (21), artist spotlights
  (freddie-mercury 19, chappell-roan ~10). Pain-point/technique articles mostly aren't cited *yet* — sovt is
  the lone exception.
- **Implication for these articles:** (1) each pain-point article should reinforce the proven angle — free,
  beginner-friendly, "here's the fix and a free tool to practice it" — and link up to the `/learn/` hub, which
  is the asset LLMs already trust. (2) The win is *opening a new citation surface* (symptom queries), so
  phrasing should match how people ask an assistant, not academic titles.
- **Indexation gotcha (proven on voice-crack):** IndexNow discovery ≠ Bing crawl for brand-new URLs — voice-crack
  sat "Discovered but not crawled" for 2 days until a manual **Request Indexing** in BWT. **Add "Request
  Indexing in Bing Webmaster Tools" as the final step of every new-article publish**, not just an IndexNow ping.
