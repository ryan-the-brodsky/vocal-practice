# PR 2 — Pure-TS Unit Coverage for the Untested Critical Layers

This document is a self-contained plan for the next slice of the Automated Testing Foundation. PR 1 (test infra + DI seams + fixtures) shipped on 2026-05-09; this PR adds unit coverage for the five pure-TS files that are critical to scoring/coaching correctness but currently have zero direct tests.

The full multi-PR plan with rationale, slicing, and risk register lives at `~/.claude/plans/glistening-wiggling-hamming.md` (read it before starting if you want the broader context). This document extracts only what's needed to execute PR 2 without further coordination.

---

## Context (read first)

- The repo is at `/Users/ryanbrodsky/Documents/programming/ai-ai-ai/vocal-training/`.
- **Read CLAUDE.md** — project conventions, current state, and the test-status section spell out what's covered and what isn't.
- **Read ROADMAP.md** — the canonical feature ledger.
- The app is an Expo + React Native + web vocal-warmup tool. Audio is central, but PR 2 touches none of it — every file in scope is pure TypeScript with no platform globals.
- Suite today: **252 tests / 18 suites / 2 Jest projects** (`unit` ts-jest Node + `component` jest-expo jsdom), all green. `tsc --noEmit` clean.

## Existing test infrastructure to leverage

Don't reinvent these. Import them.

| Helper | Location | What it does |
|---|---|---|
| `samplesFromMidiSequence(targets, opts)` | `test/fixtures/pitchSamples.ts` | Synthesizes a realistic `PitchSample[]` stream (50 fps, clarity ~0.92, monotonic ms). |
| `inTune(targets, opts)` / `flat(targets, cents, opts)` / `sharp` / `octaveOff(targets, idx, opts)` / `falseStart(targets, opts)` / `silence(durationMs)` | same file | Convenience wrappers on `samplesFromMidiSequence` with named scenarios. |
| `buildKeyIterations({ exerciseId, voicePart, startTonicMidi, endTonicMidi, accompanimentPreset, bpmOverride })` | `test/fixtures/keyIterations.ts` | Calls real `WarmupEngine.plan()` — fixtures stay schema-aligned with the engine. |
| `melodyMidisFromIteration(iter)` | same file | Pulls melody MIDIs from a `KeyIteration.events` (filters `type === "melody"`). |
| `seedSessionRecord({ exerciseId, voicePart, attempts, ... })` | `test/fixtures/sessions.ts` | `SessionRecord` builder for storage/coaching tests. |
| `inTuneFiveNoteSession(exerciseId?)` | same file | Quick "good run" `SessionRecord`. |
| `installFakeAudio()` / `installFakePitch()` | `test/setup-component.ts` | Component-test only. Not needed for PR 2 — these all run in the `unit` project. |

## What goes in this PR

Five files, ~70 new tests, ~810 LOC of test code. All files live under the `unit` project and use the existing ts-jest config (no jest-expo, no jsdom, no React).

Tests go under each lib's `__tests__/` directory matching the existing pattern (e.g. `lib/scoring/__tests__/align.test.ts`).

### File 1 — `lib/scoring/align.ts` (385 LOC, 0 tests today → ~25 tests, ~250 LOC)

**Highest-priority file in this PR.** This is the core scoring algorithm: a Needleman-Wunsch DP alignment that matches stable pitch segments to expected MIDI targets, with false-start filtering and per-exercise tolerances. It's the heart of how the app grades a singer's accuracy and the file most likely to break on a refactor.

Read the full file before writing tests. Key functions to test (all exported or testable via the public `alignAndScore`):
- `segment(samples, leadInEndMs, config)` — splits a `PitchSample[]` into stable pitch runs.
- `filterSegments(segments, config)` — drops micro-segments and false starts.
- `matchToTargets(segments, targets)` — DP alignment: produces one segment-or-null per target.
- `alignAndScore(samples, targets, leadInEndMs, syllables, config)` — public entry.

**Test scenarios:**

`segment()`:
- empty input → `[]`
- all-silence (`hz: null`) → `[]`
- single sustained pitch → 1 segment, correct median MIDI
- gap < `silenceGapMs` → 1 segment (gap is bridged)
- gap ≥ `silenceGapMs` → 2 segments
- legato slur > 200¢ frame-jump → splits into 2 segments
- coherence violation > `pitchCoherenceCents` from running median → splits
- lead-in samples (`timestamp < leadInEndMs`) discarded
- clarity-failed frames don't extend the segment

`filterSegments()`:
- micro-segment below `segMinFrames` dropped
- below `segMinDurationMs` dropped
- false-start (short, near a longer neighbor at same pitch) dropped
- false-start with neighbor at different pitch kept (it's a real note attempt)
- standalone short segment with no neighbor kept

`matchToTargets()`:
- `M === N` zips 1:1
- `M > N` (extra noise segment) skips one
- `M < N` (missed target) returns nulls in the correct slots
- pitch-distance cost picks correct alignment when temporal order is ambiguous
- reliability gate (matched fraction < 0.4) → all-nulls

`alignAndScore()` end-to-end:
- synthesized `[60, 64, 67, 72, 76]` perfectly in tune → all 5 NoteScores >95% accuracy, |meanCents| < 5
- same melody flat by 50¢ → ~50% accuracy, meanCents ≈ −50
- octave-off note 2 → snapped via `snapOctave()`, scored within ±50¢ at the correct target
- trace truncated at `MAX_TRACE_FRAMES`

**Use `samplesFromMidiSequence` and presets liberally** — they produce realistic input.

### File 2 — `lib/pitch/postprocess.ts` (173 LOC, 0 tests → ~12 tests, ~150 LOC)

`PitchPostprocessor` runs three filters in series: clarity gate, median filter, octave-jump constraint. Pure TS, no platform deps.

**Tests:**
- **Clarity gate**: clarity < threshold → `hz: null` regardless of rawHz; raw `hz <= 0` or `NaN` → null.
- **Median filter**: 5 stable frames followed by a single outlier → median doesn't track the outlier; 3 outliers in a row do shift the median.
- **Octave-jump constraint**: first sample after `reset()` accepted unconditionally; jump > 12 semitones requires `octaveJumpFrames` confirmations to accept; new candidate within tolerance increments the count; deviation from candidate resets the count.
- **Live config**: `setOctaveJumpFrames(n)` updates active state mid-stream; `setClarityThreshold(v)` likewise; `reset()` clears all internal state.

### File 3 — `lib/exercises/music.ts` (59 LOC → ~10 tests, ~80 LOC)

Music-theory primitives: note-name → MIDI conversion, durations, triad voicing.

**Tests:**
- `noteToMidi("C-1")` through `noteToMidi("B9")` round-trip via `midiToNote(noteToMidi(x)) === x` for every semitone in range
- both sharp ("F#4") and flat ("Gb4") names accepted; rejects malformed names with throw
- negative octaves work (the engine uses MIDI 0..127, rough range C-1..G9)
- `noteValueToSeconds` covers `1n`, `2n`, `4n`, `8n`, `16n`, `32n`, dotted (`4.`, `8.`), triplet (`4t`, `8t`), throws on unknown
- `triadFromRoot(60, "major")` returns `[60, 64, 67]`; minor returns `[60, 63, 67]`
- `voicingInWindow` lifts a triad's root into a target octave from below and from above

### File 4 — `lib/session/tracker.ts` (138 LOC, 0 tests → ~10 tests, ~150 LOC)

`SessionTracker`: routes `PitchSample[]` to per-key `Scorer` instances, finalizes prior-key Scorers when crossing a key boundary, produces live `SessionTrackerSnapshot` for the UI.

**Tests:**
- Constructs one `Scorer` per `KeyIteration`
- `pushSample(s)` routes to the correct key's Scorer based on `sessionRelMs` against `keyStarts`
- Crossing a key boundary finalizes the prior key's Scorer
- Samples with `sessionRelMs < 0` ignored
- `pushSample` after `finalize()` is a no-op
- `getSnapshot(t)` returns running per-key means
- `finalize()` drops keys with no scored frames from the result
- Latency-offset on the Tracker shifts cosmetic display but does NOT affect what samples buffer into which key (CLAUDE.md convention — verify this is preserved)

**Driving input:** synthesize a `KeyIteration[]` via `buildKeyIterations`, then synthesize a `PitchSample[]` via `samplesFromMidiSequence` with timestamps that span multiple key boundaries.

### File 5 — `lib/progress/stats.ts` (277 LOC, 0 tests → ~12 tests, ~180 LOC)

Already has persistence tests in `lib/progress/__tests__/storage.test.ts` (don't duplicate). PR 2 covers the stats-only functions:

- `summarizeSessions(sessions, opts?)` — empty → zeroed summary; `sinceMs` cutoff filters older sessions out
- `progressForExercise(sessions, exerciseId, opts?)` — best-key picks highest tonic crossing accuracy threshold (default 70); `recentMeanAccuracy` averages last 5 sessions; trend grouped by date in chronological order
- `thisWeekSummary(sessions, nowMs)` — boundary at start-of-week; ignores last week
- `bestKeyPerExercise(sessions)` — per-exercise highest qualifying tonic; missing exercise → null
- `bestSessionAccuracy(sessions, exerciseId)` — highest single-session mean accuracy; empty → null

Use `seedSessionRecord` and `inTuneFiveNoteSession` from `test/fixtures/sessions.ts` to build inputs. For multi-session tests, set `startedAt` explicitly to control date grouping.

---

## Coverage gates

After PR 2 lands, add a `coverageThreshold` block to `jest.config.js` (the file's `projects` array doesn't accept it; put it on the top-level config):

```js
coverageThreshold: {
  "lib/scoring/**":           { lines: 90, branches: 85 },
  "lib/pitch/postprocess.ts": { lines: 90 },
  "lib/session/tracker.ts":   { lines: 85 },
  "lib/exercises/music.ts":   { lines: 90 },
  "lib/progress/stats.ts":    { lines: 80 },
}
```

Don't gate components, app/, or other lib files in this PR — those land in PR 4. Run `npm test -- --coverage --selectProjects unit` to verify the gates pass.

## Out of scope (do NOT do these in PR 2)

- Component tests / jsdom / `@testing-library/react-native` — that's PR 4.
- Engine integration tests (`lib/__tests__/integration/engineIntegration.test.ts` with 5 canonical scenarios) — that's PR 3.
- Playwright E2E or WAV fixtures — that's PR 5.
- GitHub Actions CI workflow — that lands in PR 4.
- Refactoring `align.ts`, `postprocess.ts`, etc. to be "more testable" — they're already testable as-is. If a function feels hard to test, write the test against the public API rather than restructuring the code.
- Adding new test-fixture helpers unless absolutely necessary. The existing five (`samplesFromMidiSequence`, presets, `buildKeyIterations`, `melodyMidisFromIteration`, `seedSessionRecord`, `inTuneFiveNoteSession`) cover everything PR 2 needs.

## Verification — what "done" looks like

- `npm test` passes ~322 tests (252 today + ~70 new) across 22-23 suites.
- `npm test -- --coverage --selectProjects unit` reports the gates above as met.
- `npx tsc --noEmit` clean.
- Suite runtime stays under 60s on a warm cache.
- Each scenario test produces a printable summary (assertion message or `console.error` on failure showing exactly which intermediate value drifted) so an agent diagnosing a PR-3-or-later regression can pinpoint the layer.
- Update `ROADMAP.md` and `CLAUDE.md` to mark PR 2 shipped (replace "PR 2 (open — next)" with "PR 2 (shipped DATE)" and update test count). Per project convention these go in the same PR, not as a follow-up.

## Risks / things to watch

1. **`align.ts` is the file most likely to surface real bugs as you write tests.** If a test that should pass with realistic input fails, the bug might be in `align.ts` — not your test. Investigate before "fixing" the test. Check the `trace` field of the failing `NoteScore` to see what segments were detected.
2. **`postprocess.ts` median filter has a subtle "first N samples" warm-up behavior.** Don't assume the filter starts smoothing on sample 1 — read the implementation.
3. **`tracker.ts` uses `performance.now()` style timestamps**, not wall-clock. The fixtures already use sample.timestamp in ms-from-detector-start; this matches what the real detector emits.
4. **`stats.ts` has date-bucketing logic.** Set fixed `startedAt` values in test sessions; never rely on `Date.now()` in tests.
5. **Snapshots:** prefer assertion-based tests over snapshots for this layer. The existing `engine.regression.test.ts.snap` is a useful pattern for "lock the entire NoteEvent stream" but is overkill for unit tests of small functions. Reserve snapshots for the integration tests in PR 3.
