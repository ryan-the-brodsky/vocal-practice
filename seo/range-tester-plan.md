# `/vocal-range-test` — Standalone Tool Page Plan

**Status:** approved 2026-06-24, not yet implemented
**Builds on:** `seo/static-rendering-architecture.md` (de-gating + static export + island/hydration mechanics — not re-derived here).
**Why this page first:** `seo/keyword-research-2026-06.md` — `vocal range test` = 8,400 US/mo, **KD 6, traffic potential 23,000**, and the SERP is won by **interactive tools** (Tonegym tool page ~20,800 visits/mo at DR 44; Singing Carrots `/range-test` DR 33; mixbutton DR 36 with only 3 refdomains). A DR-3 site with zero backlinks ranks #6. This is the single highest-ROI page, and pitch detection is the app's native strength.

> Authored directly (the background Opus planner stalled at ~25 transcript events and was abandoned; this plan was written from the engine source + the architecture doc).

---

## Route & placement

- File: `app/(marketing)/vocal-range-test.tsx` (the static `(marketing)` group from the architecture doc).
- URL: `/vocal-range-test`. Linked from: marketing/Learn nav, the `/learn/how-to-increase-vocal-range` article, and the app (a "Test your range" entry point).

## Page IA (top → bottom)

1. **Hero** — `<h1>` + one-line value prop + the tool, above the fold. The interactive tool is the hero, not buried under copy (matches winning-SERP intent).
2. **The tool** — `<RangeTesterIsland>` (see below).
3. **How it works** — 3 steps (allow mic → sing low → sing high). Static; powers `HowTo` schema.
4. **Voice types & their ranges** — a static table (bass → soprano with typical low–high notes). Big SEO surface; captures "am I a tenor/alto/soprano" intent and gives the classifier something to reference.
5. **Why warm up in your range** — short copy + CTA into the app.
6. **FAQ** — static; powers `FAQPage` schema.
7. **Related links** — `/vocal-warm-ups`, `/vocal-exercises`, Learn articles.

## On-page SEO

- **`<title>`**: `Free Vocal Range Test — Find Your Range & Voice Type | Vocal Habit`
- **meta description**: ~150 chars, e.g. *"Find your vocal range and voice type free in your browser — sing your lowest and highest notes, no signup. Then practice warm-ups built for your range."*
- **`<h1>`**: `Vocal Range Test`
- **`<h2>`s**: "How to test your vocal range" · "What's my voice type?" · "Voice types and their ranges" · "How accurate is an online vocal range test?" · "Frequently asked questions"
- **JSON-LD** (in static HTML via `expo-router/head`):
  - `SoftwareApplication` — the tool (name, applicationCategory: MultimediaApplication, operatingSystem: Web, offers price 0, free).
  - `HowTo` — the 3 steps.
  - `FAQPage` — the FAQ Q&As.
- **FAQ targets** (real low-KD queries from the research): "What is my vocal range?", "How do I find my vocal range?", "What voice type am I?", "Can you test vocal range online?", "How accurate is this test?". (Cluster: `vocal range test` 8,400, plus voice-type long-tail.)

---

## `<RangeTesterIsland>` — interactive tool

**File:** `components/tools/RangeTesterIsland.tsx`. Static placeholder during SSG (heading + "how it works" + a "▶ Start the test" affordance so there's real HTML); lazy-loads the engine on Start (per architecture doc §6).

### Engine reuse (confirmed signatures)
- `createPitchDetector(opts?)` from `lib/pitch` → `PitchDetector`:
  - `start(): Promise<void>` (calls `getUserMedia`), `stop()`, `on(listener)` → unsubscribe, `setClarityThreshold(v)`.
  - listener gets `PitchSample { hz, midi, cents, clarity, rmsDb, timestamp }`.
- `lib/exercises/music.ts`: `midiToNote(midi)` for display, `noteToMidi`, `midiToHz`.
- `lib/music/voiceRanges.ts`: `VOICE_RANGES` (bass/baritone/tenor/alto/mezzo/soprano → `{ lowest, highest, passaggio }` in MIDI) for classification.
- `lib/pitch/micError.ts` for permission/denied/no-device error states + recovery copy (reuse the app's existing handling).

### UX flow
1. **Idle** → "Start the test" (primary CTA). On click: `detector.start()`; on failure render the `micError` recovery card.
2. **Step 1 — "Sing your LOWEST comfortable note"** — prompt to glide down and hold. Live feedback: current detected note (via `midiToNote`) + a "hold steady…" indicator. Capture the lowest qualifying MIDI (see capture logic).
3. **Step 2 — "Sing your HIGHEST comfortable note"** — glide up and hold; capture the highest qualifying MIDI.
4. **Result** — "Your range: **{lowNote} – {highNote}**" + span ("{n} notes, ~{x} octaves") + **voice type** + a one-line explanation. Offer **Redo** (extremes are error-prone) and a per-note confirm.
5. **CTA** — "Practice warm-ups built for your range" → deep-link into the app with the classified voice part preselected.

### Capture logic (robust low/high)
- Subscribe via `detector.on()`. Set `setClarityThreshold` high for confidence (~0.9 — we want certainty, not coverage).
- Accept a sample into min/max tracking only if: `clarity ≥ 0.9` **and** `rmsDb > ~ -45` **and** the pitch is **sustained** — held within ±75¢ for ≥ ~300 ms (reuse the segment-stability idea from `lib/scoring/align.ts`: ≥ stable window before counting). This rejects transients, breath, and glitch frames.
- Track running `minMidi` / `maxMidi` over qualifying sustained pitches per step.
- **Octave-error guard (the key risk):** pitchy's MPM latches sub-harmonics on low chesty notes (reports an octave low) and second-harmonics up high — and a range test lives exactly at those extremes (this is the documented limitation in CLAUDE.md). Mitigations:
  - Clamp accepted MIDI to a human-plausible window (~C2–C6, MIDI 36–84); discard outliers.
  - In the "lowest" step prefer the *stable floor after a downward glide*; in the "highest" step the *stable ceiling after an upward glide* — direction-consistency filters the spurious octave flips.
  - Show the captured note and let the user confirm/redo; never present a silent guess.
- This min/max tracking is net-new (~small); it does not need `align.ts`/`Scorer` (no target pattern), just the postprocessed sample stream + a stability gate.

### Voice-type classification
- Given measured `(low, high)`, choose the `VOICE_RANGES` entry whose `[lowest, highest]` best fits — e.g. minimize `|low - range.lowest| + |high - range.highest|`, or pick the range with greatest overlap. Present the best fit plus a note that adjacent types overlap (ranges aren't crisp).
- The page exposes 6 pedagogical types (bass…soprano); the **app's voice picker is 4** (soprano/alto/tenor/baritone). For the CTA deep-link, map `mezzo → alto`, `bass → baritone`.
- Keep the method transparent in the result copy ("based on your lowest and highest notes") — honesty also helps E-E-A-T / AI-answer citations.

### Hydration & weight (per architecture doc)
- Static placeholder renders in HTML; `tone`/`pitchy`/`react-native-audio-api` load only after Start via lazy `import()`.
- Guard `getUserMedia`/`AudioContext` behind `typeof window !== 'undefined'` and inside the Start handler so SSG doesn't throw.
- DESIGN.md tokens only (no hex/spacing/font literals).

---

## QA / acceptance

- [ ] `dist/vocal-range-test.html` contains (view-source/`curl`, not devtools): the `<h1>`, the how-it-works steps, the voice-type table, and the FAQ text; a unique populated `<title>` + meta description.
- [ ] JSON-LD (`SoftwareApplication` + `HowTo` + `FAQPage`) validates in Rich Results Test.
- [ ] Marketing route does NOT ship the heavy audio bundle on initial load; engine loads on Start (check network/bundle).
- [ ] Mic-denied / no-device path renders the `micError` recovery card.
- [ ] Capture sanity: known ranges classify correctly; sub-harmonic octave flips at extremes are rejected or correctable via Redo; results clamp to the human window.
- [ ] CTA deep-links into the app with the right voice part preselected (incl. mezzo→alto, bass→baritone).
- [ ] DESIGN.md compliance; `tsc --noEmit` + `npm test` clean. Add a component test for the classifier + capture-gate logic (pure functions — extract `classifyVoice(low, high)` and the stability gate so they're unit-testable, per the repo's "extract testable form" convention, cf. `clampTonicToVoiceRange`).

## Risks & open questions

- **Octave errors at range extremes** — the #1 risk; the direction-consistency + sustained-stability + human-window guards above are the mitigation, but expect to tune thresholds on real voices. Consider a quick "confirm this is right" step.
- **Mic on mobile Safari** — needs HTTPS (vocalhabit.com is fine) + a user gesture (the Start button satisfies this).
- **Classification ambiguity** — overlapping ranges mean borderline voices; present a primary type without over-claiming.
- **Result persistence** — optionally save the detected range/voice part to the app's existing storage so the CTA pre-fills and a returning user skips re-testing (reuse `userStore`-style persistence). Decide if v1 persists or just deep-links.
- **Shared "lite" player** — the CTA can either deep-link to the full app or, later, the range result could seed the onboarding voice step. v1: deep-link with voice part param.
