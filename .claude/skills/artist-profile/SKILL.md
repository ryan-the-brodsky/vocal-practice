---
name: artist-profile
description: >-
  Build a draft "Artist Spotlight" (or single-song) content profile for vocalhabit.com from
  embeddable YouTube vocal-coach sources. Use when the user says "artist-profile <name>",
  "song-profile <song>", "do an artist spotlight on <artist>", or wants to research how coaches
  break down a singer's range/voice-type/technique and turn it into a draft article with an
  embedded coach video + range tester + exercise. Discovers + transcribes coach videos
  (scripts/yt-extract.sh), consolidates multi-coach advice, cross-references the local research
  bank, and stages a draft for human review. Draft-only — never publishes or commits.
metadata:
  version: 1.0.0
---

# Artist / Song Profile — coach-sourced spotlight builder

Turn `artist-profile <artist>` or `song-profile <song>` into a **draft** spotlight article built
on **embeddable YouTube vocal-coach sources**, supplemented by our own verified research bank and
an embedded practice exercise. This is the MVP of the plan in
`seo/artist-spotlight-partnerships-plan.md` — **direct YT embeds only, no recutting/clipping, no
outreach/commissioning yet.**

**Read first:** `seo/artist-spotlight-partnerships-plan.md` (the strategy + page anatomy) and
`seo/content-style-guide.md` (voice + the MANDATORY adversarial fact-check). Both govern this skill.

**Hard rules**
- **Draft-only.** Write to `content/artist-profiles/<slug>.draft.md`. Do **not** write into
  `content/learn/` (that renders), do **not** touch `index.json`, do **not** commit, do **not** publish.
- **Embed, don't re-host.** Use the coach's video via a standard YouTube embed (`embed_url`). Do not
  download, recut, or repost their footage. Credit + link every coach.
- **Specs over copy-them.** Lead with vocal **range** + **voice type** (where the search volume is);
  "how to sing like" / technique is a secondary section and only carries weight for *technique* artists.
- **Hedge + source every claim.** Range/voice-type numbers are contested and inflated online — present
  as approximate/overlapping, attribute, and run the fact-check gate before declaring the draft done.

---

## Inputs

- `artist-profile <Artist Name> [— angle]` — full spotlight (range + voice type + signature move).
- `song-profile <Song> [by <Artist>]` — same pipeline, scoped to one song's vocal demands
  (the coach "how to sing <song>" videos are usually richer for this).

If the artist/song is ambiguous or you need the angle (e.g. "the bridge belt" vs "the whistle"),
ask one clarifying question, then proceed.

---

## The tool — `scripts/yt-extract.sh` (key-free; bootstraps its own venv)

```bash
# 1) discover candidate coach videos (uses yt-dlp search — no API key)
bash scripts/yt-extract.sh search "vocal coach <artist> vocal range" --n 8
bash scripts/yt-extract.sh search "<artist> vocal analysis" --n 8
bash scripts/yt-extract.sh search "how to sing like <artist>" --n 8     # technique artists
bash scripts/yt-extract.sh search "how to sing <song> <artist>" --n 8   # song-profile

# 2) pull metadata + transcript for the promising ones (--json for machine output)
bash scripts/yt-extract.sh batch <url|id> <url|id> ... --json
bash scripts/yt-extract.sh transcript <url|id> --segments   # timestamps, for locating the exercise
```

Each `transcript`/`batch` record returns:
`{ id, url, embed_url, title, channel, channel_url, transcript: { available, kind(auto|manual),
language, word_count, duration_s, text, segments? } }`. Videos with captions disabled return
`available:false` — **skip them** (we need the words). Prefer `manual` captions over `auto` when both exist.

---

## Workflow

### 1. Discover + vet sources
Run 2–4 `search` angles (above). From the results, pick **3–6 credible coach videos** (a real vocal
coach/teacher, not a fan reaction or lyric video; analysis/how-to format). Pull their transcripts with
`batch ... --json`. Keep the ones with usable captions. Record for each: `title`, `channel`,
`channel_url`, `url`, `embed_url`, `word_count`.

> Embeddability caveat: most public videos allow embedding, but some disable it. Flag each chosen video
> as **"confirm embed allowed"** for the human — we don't hard-verify embed permission in the tool.

### 2. Consolidate the coaches (the core value)
Read the transcripts and synthesize, in our voice:
- **Where coaches agree** → the "clear conclusions" (these become the confident claims).
- **Where they disagree** → surface it honestly (the style guide *rewards* showing disagreement).
- The **specific vocal facts** each coach asserts about this artist: range (notes), voice type,
  the signature move, the common pitfalls. Attribute non-obvious claims to the coach who said it.

### 3. Cross-reference the local research bank (supplement = our added value)
Tie the coaches' takes to **our** verified material so the page is more than a transcript digest:
- `content/learn/*.md` — 21 fact-checked articles (e.g. `head-voice-exercises`, `mix-voice-exercises`,
  `belting-exercises`, `how-to-increase-vocal-range`, `how-to-sing-in-tune`). Reuse their **verified
  `references:`** and link to them internally.
- `seo/keyword-research-2026-06.md` + the plan — for the target keywords + internal-link targets
  (`/vocal-range-test`, the relevant `/learn/...`).
- `lib/exercises/capabilities.ts` — the capability blurbs ("what this builds").

### 4. Propose a candidate-drill MENU for in-draft selection (native-first — see plan §3d)
Do **not** pre-pick the final drills. Propose a **menu of 4–6 candidate drills** so the human approves the
keepers **in-context within the draft** (ideally on the preview domain, §3e) — no back-and-forth. Bias to
**existing native exercises** (reuse-first; most artist signatures are already covered) and include 1–2
**bespoke** proposals only when a move genuinely isn't covered. For each candidate give: `exerciseId`,
one-line **what it drills**, **origin** (reuse | bespoke), a **suggested start key** matching the song, and
**why this artist** (tie it to a specific coach point from step 2). Each renders an `<EmbeddedExercise>` +
an **"Add to routine"** affordance (the conversion hook: same-origin, appends the id to
`vocal-training:routine:v1` and deep-links into the app). **Native ids are required** — the routine + the
embed both resolve by id, so an article-local "custom import" can't deliver the one-tap CTA. The human picks
2–3 to keep; the rest are dropped at approval. Available ids:
`agility-run, belt-arpeggio-mah, belt-nyah-descending, bub-mix-voice, chest-descent-mah,
chest-voice-mum, descending-five-to-one-nay, five-note-scale-mee-may-mah, goog-octave-arpeggio,
head-voice-vwohm, high-belt-wee, hum-warmup, messa-di-voce, nay-1-3-5-3-1, ng-siren, octave-leap-wow,
passaggio-leap-and-back, rossini-lip-trill, staccato-arpeggio, staccato-onset,
stepwise-passaggio-ascent, straight-tone-vibrato`.
Rough map: belts → `belt-arpeggio-mah`/`high-belt-wee`; runs/agility → `agility-run`/`staccato-arpeggio`;
register leaps → `octave-leap-wow`/`passaggio-leap-and-back`; head voice → `head-voice-vwohm`;
mix → `bub-mix-voice`/`goog-octave-arpeggio`; range-building → `stepwise-passaggio-ascent`.

**🪙 The goldmine — coach-demonstrated exercises (FLAG, don't fabricate):** if a transcript shows a coach
teaching a *specific* drill (a lip-trill on the chorus, a 5-tone on "ee", an octave slide), capture the
quote + timestamp (`--segments`) and add a **`NEEDS VALIDATION`** note proposing a new descriptor. **Do not
invent a `data/exercises` descriptor from video alone** — pure-audio derivation is unreliable. Leave it for
the human to validate and author. List these prominently in the handoff.

### 5. Draft the profile
Write `content/artist-profiles/<slug>.draft.md`. Frontmatter mirrors the learn schema plus profile fields:

```yaml
---
title: "<Artist>'s Vocal Range and Voice Type, Explained"
seoTitle: "<Artist> Vocal Range & Voice Type | Vocal Habit"
slug: <artist-kebab>
category: artist-profile
mode: artist            # or: song
artist: "<Artist>"
song: "<Song>"          # song-profile only
targetKeywords: ["<artist> vocal range", "<artist> voice type", "how to sing like <artist>"]
candidateDrills:          # 4–6 proposed; human keeps 2–3 at approval. Each renders embed + "Add to routine"
  - { exerciseId: <native id>, label: "<what it drills>", origin: reuse, key: "<suggested start key>", why: "<coach point>" }
  - { exerciseId: <native id>, label: "<…>", origin: reuse, key: "<…>", why: "<…>" }
  - { exerciseId: <native id>, label: "<…>", origin: reuse, key: "<…>", why: "<…>" }
  # - { exerciseId: <proposed-new-id>, label: "<…>", origin: bespoke, status: NEEDS_VALIDATION, why: "<…>" }
coachSources:
  - { channel: "<name>", url: "<watch url>", embedUrl: "<embed url>", captions: "manual|auto", confirmEmbed: true }
metaDescription: "<140–155 chars, target term + 'test your range free in your browser'>"
references: [ <verified citations carried from the local bank / coach-cited science> ]
status: draft
updated: <YYYY-MM-DD>
---
```

Body = the page anatomy from the plan (§3a):
1. **Lead** — one-line answer: range in notes (hedged) + voice-type label (approximate).
2. **`## <Artist>'s vocal range`** — incl. the exact span people search; note `→ embed /vocal-range-test
   ("test your range against <artist>'s")`.
3. **`## What voice type is <Artist>?`** — approximate/overlapping; CCM framing; classical labels labeled as such.
4. **`## What the coaches say`** — the consolidated analysis with **inline YouTube embeds** for each source
   (use the `embed_url`), each credited + linked. Agreements as conclusions; disagreements surfaced.
5. **`## Practice it — drills for <artist>'s <technique>`** — render the **candidate-drill menu** (step 4):
   each candidate as an `<EmbeddedExercise exerciseId="…" />` + **"Add to routine"** button
   (same-origin → `vocal-training:routine:v1`) + its label/why/suggested-key. Head the section
   **"Candidate drills — keep the ones that fit"** so the human approves in-context (on the preview domain).
   Reused drills are live immediately; bespoke ones render a `NEEDS VALIDATION` callout (don't fabricate the
   descriptor — the human authors it).
6. **`## Common mistakes / sing it safely`** — health-honest; route risky belt/whistle to the disclaimer.
7. **FAQ** — real queries ("What is <artist>'s vocal range?", "What voice type is <artist>?") for `FAQPage` JSON-LD.
8. **Sources** — verified only + the coach credits. Current medical disclaimer if belt/whistle/scream-adjacent.

### 6. Quality gate (MANDATORY — from the style guide)
Before declaring the draft done, run the **adversarial fact-check with ≥2 refutation lenses**
(voice-science/acoustics + applied-pedagogy) over every **range / voice-type / health** claim. Keep what's
SUPPORTED, soften what's OVERSTATED, cut/fix what's REFUTED. **Never fabricate a citation.** Record verdicts +
verified sources in `seo/spotlight-<slug>-content-sources.md` (template: `seo/range-tester-content-sources.md`).
Voice-type/range claims must be hedged; inflated "N-octave range" myths are a credibility trap. Confirm you
actually have the checker's results — "I spawned a checker" ≠ "it was checked."

### 7. Hand off for review (stop here)
Do **not** publish, wire a route, or commit. Present:
- the draft path `content/artist-profiles/<slug>.draft.md`,
- the **coach source shortlist** (channel · url · captions · "confirm embed allowed"),
- the chosen **embedded exercise** + any **`NEEDS VALIDATION` coach drills** to author,
- the **fact-check verdict file** path,
- 2–3 open questions (voice-part default for the embed, which coach video leads, etc.).

The human reviews, validates the flagged exercises, confirms embeds, then decides to build the
`artist-profile` route + promote the draft into the rendered pipeline.

---

## Notes
- One coach video is fine to start; 3–6 is better for honest consolidation. Quality of coach > quantity.
- For **tone artists** (Adele, Sinatra) the profile is mostly the two spec sections + range tester; demote
  "signature move / how to sing like". For **technique artists** (Ariana, Mariah, Chappell Roan, rock
  screamers) those sections carry keyword + social weight. (See plan §3a / §1c.)
- This skill is the manual/MVP form of the henchmen "spotlight" agent (plan §7). Same draft-only,
  approval-gated spirit — the human gates are: confirm sources/embeds → validate exercises → publish.
