# Vocal Training — Project Notes

Personal vocal-warmup app. Goal: pitch detection + accuracy scoring with piano accompaniment for daily warmups, deployable to TestFlight (iOS) with web as a free byproduct.

## Design System

**Always read `DESIGN.md` before making any visual or UI decision.** All font choices, colors, spacing tokens, motion specs, and aesthetic direction are defined there — do not deviate without explicit user approval. If you ship code that uses hex literals, font sizes, or spacing values not defined in DESIGN.md, that is a regression — fix it before declaring done. In QA mode, flag any UI code that doesn't match DESIGN.md.

## Stack

- **Expo SDK 54** (`expo: ~54.0.33`), Expo Router 6, TypeScript strict
- **`react-native-audio-api@0.11.7`** (Software Mansion, pinned — 0.12+ has iOS audio session breaking change)
- **`pitchy@^4.1.0`** for pitch detection (MPM)
- **`tone@^15`** for web piano synthesis (web only — Tone.js does not work on RN per issue #1319)
- **`@react-native-async-storage/async-storage`** for session persistence (web shim → localStorage)
- **Salamander grand piano samples** — web streams from `https://tonejs.github.io/audio/salamander/`; native iOS bundles an 8-note subset (~668 KB) in `assets/salamander/` decoded once on init.

The PRD lives at `prd-guidance-for-vocal-app.md` — authoritative reference for pedagogy, exercise table, accompaniment patterns, pitch-detection caveats. Read it before making music-theoretic changes.

**ROADMAP.md is the source of truth for what's shipped and what's next.** Keep it and this file in sync as part of any feature-slice PR — not as a follow-up.

## Architecture

```
data/exercises/*.json         # 8 starter exercises (JSON descriptors)
assets/salamander/*.mp3       # 8 bundled samples (A1, C2, A2, C3, A3, C4, A4, C5)
lib/exercises/types.ts        # ExerciseDescriptor + NoteEvent + AccompanimentPreset + ACCOMPANIMENT_PRESETS
lib/exercises/music.ts        # noteToMidi, midiToNote, midiToHz, triad voicing
lib/exercises/engine.ts       # WarmupEngine: descriptor → KeyIteration[] → NoteEvent[]; resolveAccompaniment + buildCue (incl. tonic-hold)
lib/exercises/library.ts      # imports the 8 JSONs, helpers
lib/exercises/names.ts        # static id→display-name map (for Progress without JSON imports)
lib/audio/player.ts           # AudioPlayer interface
lib/audio/player.web.ts       # Tone.Sampler + Salamander
lib/audio/player.native.ts    # AudioBufferSourceNode + decodeAudioData on bundled MP3s; ±6 semitone pitch-shift
lib/audio/index.{ts,native.ts} # platform resolver
lib/pitch/detector.ts         # PitchDetector interface
lib/pitch/detector.web.ts     # getUserMedia + AnalyserNode + pitchy
lib/pitch/detector.native.ts  # rn-audio-api AudioRecorder.onAudioReady + pitchy
lib/pitch/postprocess.ts      # clarity gate + median filter + octave-jump constraint
lib/scoring/score.ts          # Scorer: per-key per-note accumulator with eval window
lib/progress/{types,storage,stats,index}.ts  # SessionRecord persistence + summaries
lib/session/tracker.ts        # SessionTracker: routes samples → per-key Scorers
lib/coaching/diagnose.ts      # diagnoseSession: most-consistent or most-glaring mistake from a SessionRecord
components/SyllableDisplay.tsx           # karaoke-style syllable strip (font sizes bumped one Typography tier 2026-05-09)
components/practice/MelodyDisplay.tsx    # SVG staff (BravuraText SMuFL clefs + key sigs) + noteheads aligned with syllables in shared columns
lib/music/keySignature.ts                # major-key signature derivation (circle of fifths) + per-note spelling/accidental decision; 28 tests
assets/fonts/BravuraText.{otf,woff2}     # SMuFL music notation font (SIL OFL); WOFF2 for web (Chrome rejects Bravura's OTF), OTF for iOS native
metro.config.js                          # extends Expo defaults to register woff2 as a Metro asset extension
components/practice/                     # GuidedSession, CoachingBanner, TuningMeter, NoteChip, etc.
app/(tabs)/index.tsx          # Practice screen — Standard/Guided + accompaniment preset chips
app/(tabs)/coaching.tsx       # Coaching screen — diagnosis, your-version playback, retry, multi-mistake iteration
app/(tabs)/explore.tsx        # Progress tab — weekly summary, exercise list, recent sessions

# Test infrastructure (PRs 1–2 of automated-testing slice, 2026-05-09 → 2026-05-10)
test/setup-component.ts       # installFakeAudio() + installFakePitch() helpers; Reanimated/AsyncStorage/Haptics/Tone mocks
test/mocks/tone.ts            # no-op Tone stub used by component project
test/fixtures/pitchSamples.ts # synthetic PitchSample[] — inTune/flat/sharp/octaveOff/falseStart/silence presets
test/fixtures/keyIterations.ts # buildKeyIterations() calls real WarmupEngine.plan() so fixtures stay schema-aligned
test/fixtures/sessions.ts     # seedSessionRecord() + inTuneFiveNoteSession() builders
jest.config.js                # projects: [unit (ts-jest, Node), component (jest-expo/web, jsdom)]; coverageThreshold gates 5 PR-2 files
babel.config.js               # babel-preset-expo for jest-expo (and Metro)
# PR 2 unit suites (added 2026-05-10):
lib/scoring/__tests__/align.test.ts        # 28 tests — segment/filter/match/alignAndScore
lib/pitch/__tests__/postprocess.test.ts    # 14 tests — clarity gate, median filter, octave-jump constraint
lib/session/__tests__/tracker.test.ts      # 9 tests — sample routing, key boundaries, snapshots
lib/progress/__tests__/stats.test.ts       # 15 tests — summarize/progress/thisWeek/bestKey/bestSession/rolling
lib/exercises/__tests__/music.test.ts      # 18 tests — noteToMidi/midiToNote round-trip, durations, triads, voicing
# PR 3 integration suite (added 2026-05-10):
lib/__tests__/integration/engineIntegration.test.ts  # 5 fixture-driven scenarios end-to-end (Tracker → Scorer → align → diagnose)
# PR 4 component-test scaffolding (added 2026-05-10):
app/__tests__/coaching.test.tsx           # 3 cases — flat-session diagnosis + bookmark persistence + error states
app/__tests__/explore.test.tsx            # 3 cases — weekly summary + recent-session "Coach this" router.push
app/__tests__/practice.test.tsx           # describe.skip — Practice deferred until UX audits stabilize the screen
.github/workflows/test.yml                # typecheck + jest CI (Playwright e2e lands in PR 5)
```

**Data flow per sample:**
PitchDetector → postprocessor (clarity/median/octave gate) → screen RMS gate (`-45 dB`) → SessionTracker → per-key Scorer → snapshot → React state

**Audio flow per exercise:**
ExerciseDescriptor + voicePart → `planExercise()` → `KeyIteration[]` → `flattenIterations()` → `NoteEvent[]` → `AudioPlayer.playSequence()` → Tone.Transport.scheduleOnce (cancellable)

## What works

- Practice screen: pick exercise + voice part (tenor/baritone) + Standard/Guided mode. Session settings (accompaniment / guidance / demo / click-track) collapsed to a 4-icon cluster with tooltips + inline expanders, responsive (icons stack on mobile, ride alongside picks on desktop ≥640 px)
- Per-exercise tonic memory: each `(exerciseId, voicePart)` pair remembers its last-reached tonic; RESET button above the note chips snaps current exercise back to range lowest
- Headphones modal: blocks Start until the user confirms once per app session; "Continue without" biases the RMS gate up by 6 dB
- Per-note breakdown chip strip under each completed-key row in Standard mode (shared `<NoteResultsStrip>` component); empty windows render `—` not `0¢`
- Tone.js + hosted Salamander samples on web; bundled Salamander MP3s + `AudioBufferSourceNode` on iOS (code in place; awaiting on-device validation)
- Cue types (`ding` / `block` / `bell` / `v7` / `tonic-hold`) honored at runtime; descriptors with `lockAccompaniment: true` (Rossini lip trill, Ng siren) ignore preset overrides
- Lead-in: 2 audible click-track ticks between cue and melody on every preset except Classical (which already cues entry via V7 → I)
- Live pitch detection via getUserMedia (web) / `AudioRecorder.onAudioReady` (native) + pitchy with PRD-mandated gating (clarity, median filter, octave-jump hold — per-exercise override via `scoringHints.octaveJumpFrames`)
- **Pattern-alignment scoring** (replaced onset-detection on 2026-05-05): samples buffer per key during the pattern; on key end, `lib/scoring/align.ts` detects N stable pitch segments (≥75¢ stable, ≥80 ms duration), filters false starts, then DP-matches segments to expected targets (Needleman-Wunsch with 6-semitone gap penalty). Scoring is musical-context-driven, not time-window-driven — eliminates per-exercise latency calibration sensitivity.
- **Dynamic RMS gate**: `rmsGateFor(preset, headphonesConfirmed)` returns −45 to −33 dB depending on whether the active preset doubles the melody and whether the user confirmed headphones
- Karaoke syllable strip (active scaled 2× and underlined), tuning meter, per-note chips, plain-English coaching banner, per-key summaries
- **Guided mode**: hold-and-match per-note with configurable threshold (±25/50/75/100¢). On pattern complete, a per-note results breakdown shows the best cents achieved on each syllable in the pattern (color-coded vs threshold) — review surface, not live feedback.
- **Coaching screen** (`coaching.tsx`): diagnoses the most-glaring or most-consistent mistake, plays "Correct version" / "Your version" (Hz substitution into the sequence), single-key retry with live scoring, "Find next mistake" iteration, child-session persistence
- **Progress tab** (`explore.tsx`): Today's routine card at top (configurable, 4 defaults, edit modal) → weekly summary card → per-exercise list (last-practiced + best key + best-ever% + tap-to-expand sparkline trend) → recent sessions list (last 20, each tap-to-expand into per-note breakdown chips + "Coach this" button that loads the historical session into coaching via `?sessionId=` route param). Vanilla View-based sparkline; no chart library. Empty state for no data.
- **Opt-in logging** for Standard sessions: "Log session" with optional note / "Discard" UI after each session ends. Coaching child sessions still auto-save.
- Session persistence: SessionRecord at `vocal-training:sessions:v1` (AsyncStorage); coaching child sessions linked via `parentSessionId`. Routine config at `vocal-training:routine:v1`.
- Stop button cancels pending audio events on both platforms
- RMS noise gate (dynamic, see above) prevents piano-spillover from poisoning scores
- Octave-snap-against-target in the scorer rescues pitchy subharmonic latching on high notes (snap if sample is 10.5–13.5 or 22.5–25.5 semitones from target)
- **Staff notation with proper SMuFL clefs + key signatures** above the syllable strip on Practice / Guided / Coaching surfaces (`components/practice/MelodyDisplay.tsx`). SVG-based via `react-native-svg`. Treble vs bass clef chosen by mean MIDI of the displayed melody. Real treble (U+E050) and bass (U+E062) glyphs from BravuraText (SMuFL music font, SIL OFL). Per-key signature derived via circle of fifths from `lib/music/keySignature.ts`; on-note accidentals appear only when the note breaks from the key signature (chromatic alteration → ♯/♭; in-key letter that's enharmonic to a natural → ♮).
- **DI registry pattern** at `lib/audio/index.{ts,native.ts}` and `lib/pitch/index.{ts,native.ts}`: factories can be swapped per-test via `__set/__resetAudioPlayerFactory` and `__set/__resetPitchDetectorFactory` (call sites in feature code unchanged).
- **Automated test pyramid PRs 1–4 shipped**: Jest projects split (unit + component), full fixture infrastructure, smoke tests proving the registry works (PR 1). PR 2 added 86 unit tests for the 5 critical pure-TS files (`lib/scoring/align.ts`, `lib/pitch/postprocess.ts`, `lib/session/tracker.ts`, `lib/exercises/music.ts`, `lib/progress/stats.ts`) with `coverageThreshold` gates. PR 3 added 5 engine integration scenarios at `lib/__tests__/integration/engineIntegration.test.ts` that drive synthetic `PitchSample[]` through the real `SessionTracker → Scorer → alignAndScore → diagnoseSession` pipeline. PR 4 shipped scaffolding-only component-test infrastructure (`@testing-library/react` for DOM queries against jest-expo/web's react-native-web output; expo-router mock + `window.matchMedia` polyfill in `test/setup-component.ts`) plus two real screen tests at `app/__tests__/coaching.test.tsx` and `app/__tests__/explore.test.tsx`; Practice deferred via `describe.skip` until the UX audits stabilize the screen. CI lives at `.github/workflows/test.yml` (typecheck + jest jobs). **350 tests / 27 suites / 2 projects passing (1 skipped).** Verify coverage gates with `npm run test:coverage` (scoped to the unit project — running both projects pulls postprocess.ts coverage down because the component project loads it without exercising methods). PR 5 (Playwright E2E + WAV fixture pipeline) is still open, gated on whether the user wants the full Practice happy path covered before UX has hardened.
- **Voice-range validation** (`lib/music/voiceRanges.ts`): `VOICE_RANGES` table (lowest, highest, passaggio per voice part — Miller / Doscher / Sundberg pedagogy). `validateDescriptorRanges()` checks each exercise's voice-part rows for off-by-octave bugs, copy-paste between voice parts, and whether the highest tonic iteration actually crosses the voice's passaggio (with SOVT exemption for lip-trills/sirens). Library audit asserts every shipped descriptor passes; sanity checks include "tenor and baritone are not byte-identical" and "tenor lowest > baritone lowest". `clampTonicToVoiceRange()` is the extracted testable form of the screen's tonic-memory clamping logic. 17 tests in `lib/music/__tests__/voiceRanges.test.ts`.
- **Audited + bumped ranges across all 8 exercises (2026-05-09):** Original descriptors had tenor parts an octave below typical warmup territory (e.g. five-note-scale tenor C3-G3 peaked at D4 — sounded like a baritone exercise). Final ranges peak at typical tenor warmup levels: narrow-span exercises (5-note scale, nay 1-3-5-3-1, descending 5-1) tenor G3-F4 → peaks D4-C5; octave-span exercises (Goog, octave-leap, ng-siren, staccato) tenor D3-A3 → peaks D4-A4; rossini-lip-trill kept at C3-G3 (SOVT, peaks G4-D5). Baritone parts shifted up symmetrically. Validator gates against off-by-octave regressions (passaggio + 2 minimum; SOVT-relaxed). Engine regression snapshots refreshed.
- **Alto + soprano voice parts added (2026-05-09):** all 8 exercises now define ranges for soprano, alto, tenor, baritone. Voice picker in `app/(tabs)/index.tsx` shows all four chips high-to-low. Audit tests enforce: (a) every descriptor defines all 4 parts; (b) no two voice-part ranges within a descriptor are byte-identical; (c) ranges follow soprano > alto > tenor > baritone by lowest tonic; (d) snapshot of out-of-native-cap peaks (8 soprano peaks at A5 = MIDI 81 are above the F#5 native pitch-shift cap — works fine on web, will produce native artifacts until a higher Salamander sample is bundled in `assets/salamander/`).

## Known limitations / non-yet-done

- **iOS dev build** not yet generated. Needs `npx expo prebuild && npx expo run:ios`. The Salamander player and native pitch detector are coded but unvalidated on real hardware. RMS gate threshold may need per-platform tuning.
- **iOS staff-notation glyph rendering unvalidated.** BravuraText.otf bundles for native, but `react-native-svg`'s `SvgText` with custom `fontFamily` on iOS is unverified. If clefs/accidentals don't render on device, the fallback is to switch to `<Path>` data for the ~5 needed glyphs (treble/bass clef, sharp/flat/natural).
- **Native sample cap of F#5.** All 8 soprano configurations peak at A5 (MIDI 81). The bundled Salamander samples top out at C5; with ±6 semitone pitch-shift the native player can reach F#5 (MIDI 78) cleanly but artifacts above that. Web is unaffected. Resolution: bundle a C6 Salamander sample in `assets/salamander/`. Locked in `voiceRanges.test.ts` snapshot so silent regressions surface in PR diffs.
- **No standalone Library tab** — Progress covers history; a pedagogy-first browser of all 8 exercises (descriptions, PRD references) is still open.
- **No session prune/delete** — AsyncStorage sessions accumulate indefinitely.
- **Web SSR disabled** (`web.output: "single"`) due to a `tslib` interop bug in Metro's SSR pipeline. SPA is fine for this app's purpose anyway.
- **Octave errors** still possible on male voice ≥ A3 — pitchy's MPM algorithm can latch onto the second harmonic. Postprocessor mitigates but doesn't eliminate.
- **`.codeyam/`** directory is legacy (we're not using CodeYam). It's gitignored. Safe to `rm -rf` once the local CodeYam server (port 3111) is stopped.

## Test status (PRs 1–4 shipped — 2026-05-09 → 2026-05-10)

`npm test` → 350 tests / 27 suites / 2 projects (1 skipped) in ~35s. `npm run test:coverage` (scoped to unit project) verifies the configured `coverageThreshold` block. `tsc --noEmit` clean. CI at `.github/workflows/test.yml`.

**Component-test conventions (PR 4):**
- Use `@testing-library/react` (DOM-based) — `jest-expo/web` renders RN through `react-native-web` so the tree is HTML in jsdom; `@testing-library/react-native` v13's react-test-renderer path doesn't see the same nodes.
- Drive `expo-router` via `setMockRouterParams()` / `getMockRouter()` from `test/setup-component.ts`. Reset is automatic in `afterEach`.
- DI fakes via `installFakeAudio()` / `installFakePitch()`. Same auto-reset.
- **UI tests stay deliberately sparse until the UX audits land.** The screens are still in flux — picker chips, settings cluster, modal copy, mode toggles, etc. Tightly-coupled assertions today become next month's churn. Each tested screen file carries a top-of-file `// COMPONENT TEST:` comment naming the test file so edits to rendered text or accessibility labels surface during code review. When you add a new screen test, add the same cross-reference comment.

**What's covered:** the existing pure-TS layers (coaching detectors, exercise planning, session storage, key analysis, melody synthesis, theme constants, key signature theory), 7 smoke tests proving the test infrastructure works (PR 1), 86 unit tests across the 5 PR-2 critical files (`align.ts`, `postprocess.ts`, `tracker.ts`, `stats.ts`, `music.ts`), 5 engine integration scenarios driving the full scoring + diagnosis pipeline (PR 3), and 2 component tests covering Coaching diagnosis + bookmarking and Progress tab navigation (PR 4 at `app/__tests__/coaching.test.tsx` + `app/__tests__/explore.test.tsx`).

**What's NOT covered (by PR):**
- **PR 4 deferred:** Practice screen component tests (`app/__tests__/practice.test.tsx` is a `describe.skip` placeholder with the to-do list embedded; unskip after UX audits).
- **PR 5:** Playwright E2E (5 scenarios) + WAV fixture pipeline + spy on `Tone.Sampler.triggerAttackRelease`.
- **Phase 5 (after Slice A):** Maestro iOS smoke flows (4 nav-only YAMLs).

**Pending cleanups:** obsolete snapshot in `engine.regression.test.ts.snap` (warns every run), `@testing-library/jest-native` is deprecated and should be removed when PR 4 lands, `jest-expo@55.0.17` is one minor ahead of SDK 54's expected version (works fine, emits a warning).

The full plan with rationale, slicing, and risk register is at `~/.claude/plans/glistening-wiggling-hamming.md`. Read that before starting any subsequent PR.

## Run

```bash
npm install
npx expo start --web --port 8081     # web dev — http://localhost:8081
# For phone testing over LAN/HTTPS:
ngrok http 8081                       # then open the https URL on phone Safari
```

Mic access requires HTTPS on iOS Safari, hence ngrok for phone-on-web testing. Once iOS dev build is set up, `expo run:ios` is the better path.

## Conventions

- **JSON descriptors are the source of truth** for exercises, not MIDI files.
- **Engine is pure TS, platform-agnostic.** Audio + pitch adapters are thin wrappers behind interfaces (`AudioPlayer`, `PitchDetector`).
- **Platform resolution** uses Metro's `.web.ts` / `.native.ts` extension lookup. `index.ts` is the web/default entry; `index.native.ts` overrides on iOS/Android.
- **Cents** = 1/100 of a semitone (so 100¢ = 1 piano key). The postprocessor returns `PitchSample` with two fields that must be combined: `midi` (rounded to nearest semitone) + `cents` (signed within-semitone deviation, −50..+50). Deviation from a target MIDI is therefore `(sample.midi - targetMidi) * 100 + (sample.cents ?? 0)`. **Forgetting the `+ sample.cents` term is a silent bug** — pass-detection still works on the right semitone, but every recorded cents value collapses to 0, threshold differences (Strict vs Ballpark) become indistinguishable, and the user can never see how flat or sharp they were within the semitone. Search the codebase for any `(sample.midi - …) * 100` pattern that's missing the cents term.
- **Accuracy %** = fraction of clarity-passed frames within ±50¢ of the target during the inner 60% of the note's duration (skipping attack/release transients).
- **Scoring is post-pattern, not real-time.** During a key, samples accumulate in a buffer; on key end, `alignAndScore()` finds N stable pitch segments, matches them to the expected pattern via DP alignment, and produces N `NoteScore`s. This eliminates per-exercise latency calibration sensitivity — the Tracker has no latency-offset knob; the calibration UI was removed during the pattern-alignment refactor.
- **Tone.Transport** is used for scheduling on web so events can be cancelled by ID — never schedule directly via `triggerAttackRelease(time)` if cancellation matters.
- **Native pitch-shift cap is ±6 semitones** from the nearest sample (`player.native.ts`). Beyond that, decoded `AudioBuffer` artifacts become audible — add a sample, don't widen the cap.
- **Sub-agent worktrees can't see untracked files.** If you spawn agents in `.claude/worktrees/agent-*` and the main repo has substantial uncommitted code, the worktree branches will be empty parallel-universe scaffolds. Either commit first, or run agents directly in the main working tree (only safe when their file scopes don't overlap).
- **DI seam, not `moduleNameMapper`.** Audio + pitch factories are swappable per-test via the registry exports (`__setAudioPlayerFactory`, `__setPitchDetectorFactory`). Use this in component tests (`installFakeAudio()` / `installFakePitch()` in `test/setup-component.ts`); reset auto-runs in `afterEach`. Don't add `jest.mock("@/lib/audio")` to test files — it's no longer needed and conflicts with the registry.
- **Pitch fixtures live in `test/fixtures/pitchSamples.ts`.** When writing a scoring/tracker/diagnose test, prefer `inTune(targets)` / `flat(targets, 50)` / `octaveOff(targets, idx)` / `falseStart(targets)` over hand-rolled `PitchSample[]`. They produce realistic shape (50 fps, clarity 0.92, monotonic timestamps) that matches what a real detector emits.
- **One short comment max** per non-obvious decision. No multi-line docstrings. No "added for X" / "used by Y" notes.

## Active design questions / next features

**Standard-mode sync investigation resolved architecturally.** After E/F/G/H + POC 1 + sing-along calibration + octave-snap, the system was *still* sensitive to per-exercise tempo and global timing offset. The real fix landed as a model change: pattern-alignment scoring (`lib/scoring/align.ts`) — buffer all samples per key, segment, DP-match to expected pattern, score each segment against its musical-context target. The latency-offset slider, the Calibrate button, and `Tracker.setLatencyOffsetMs` were all removed in the post-refactor cleanup; pattern-alignment makes them moot.

See ROADMAP.md §Sprint-Ready Slices for other live candidates:

- Slice A — iOS dev build + on-device validation (M1 finisher; bundles the known native clock-mismatch fix in `detector.native.ts:82`)
- ~~Slice B — Coaching deep-link from session history~~ — shipped as part of regimen-sprint slice 5
- Slice C — Coaching polish (tuning meter + auto-advance) (M2)
- Slice D — Four more PRD exercises + direction-reversal toggle (M4)
- **Coaching-orphan cleanup** (deferred from regimen sprint slice 1) — when a Standard parent is discarded, child coaching sessions tied to it via `parentSessionId` get orphaned in storage. Add a prune pass or change child-session save behavior to mirror the parent's opt-in.

Longer-term: vowel-shape diagram, voice-led chord inversions, siren/glissando exercise type, mic audio recording for true "your version" playback.
