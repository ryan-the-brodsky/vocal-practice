# Vocal Training — Roadmap

Personal vocal-warmup app. Goal: pitch detection + accuracy scoring with piano accompaniment, on TestFlight (iOS) with web as a free byproduct.

---

## Current State

### Audio Playback
- **Web**: Tone.Sampler + hosted Salamander samples (streaming from tonejs.github.io). Fully functional — real piano, multi-voice, cancellable via Tone.Transport. Sample coverage is good (every 3rd key across A1–A6).
- **Native iOS**: Salamander samples (8-note subset, ~668 KB) bundled in `assets/salamander/`, decoded once on init via `decodeAudioData`, played through `AudioBufferSourceNode` with `playbackRate` pitch-shift (capped to ±6 semitones from nearest sample). Code is in place; not yet validated on a real device.
- Accompaniment engine supports 6 patterns: `none`, `blockChordOnDownbeat`, `sustainedChord`, `doubledMelody`, `rootOctaveDrone`, `openFifthDrone`, `rhythmicStab`. All four cue types (ding/block/bell/v7) plus `tonic-hold` are now wired through `buildCue()` — the descriptor's `cueType` is honored at runtime.
- Five accompaniment presets (Classical / Studio / Beginner / Lip-trill / Drone) selectable from the Practice screen; locked exercises (Rossini lip trill, Ng siren) ignore preset overrides via `lockAccompaniment: true`. Default preset on first render is now `classical` (V7 cue, no melody doubling).
- **Lead-in clicks** between cue and melody (2 audible ticks at the prevailing tempo) so the user has a beat to enter on. Suppressed automatically on the Classical preset (V7 → I already cues entry). Disable globally via the "Click track" Switch in the Practice screen settings (persisted at `vocal-training:settings:click-track-enabled`).
- `holdNote` (used by Guided mode) works on both platforms.

### Pitch Detection
- **Web**: `getUserMedia` → `AnalyserNode` → pitchy MPM. Fully functional.
- **Native iOS**: `react-native-audio-api` `AudioRecorder.onAudioReady` → pitchy. Implemented and should work; not yet validated on a real device because no dev build has been generated.
- Postprocessor: clarity gate (0.85), 5-frame median filter, octave-jump constraint (default 3-frame hold; descriptors with `scoringHints.octaveJumpFrames` override per-exercise — Goog octave arpeggio, octave leap on `wow`, and staccato arpeggio use 2 frames). `setOctaveJumpFrames(n)` on the detector lets the screen swap this when the active exercise changes.
- **Dynamic RMS gate** via `rmsGateFor(preset, headphonesConfirmed)` — base −45 dB, +6 dB bias on melody-doubling presets (Beginner / Studio / Lip-trill), +6 dB bias if the user said no to the headphones modal. Range: −45 to −33 dB. Replaces the old constant.
- **Headphones modal**: blocks Start until the user confirms whether they're wearing headphones. Persists once per app session (module-level + AsyncStorage at `vocal-training:settings:headphones-confirmed-session`, cleared on unmount). Saying "Continue without" bumps the RMS gate to compensate for piano-bleed.

### Scoring
- `Scorer`: per-note accumulator with **onset-detection-driven eval window**. The window starts at the singer's actual entry (first 3 consecutive clarity-passed frames within `[start, start + 1.5·dur]`), not the piano's nominal start. Width = `max(150 ms, dur · 0.6)` so staccato/arpeggio exercises stay scorable. Falls back to a static `[start + 0.2·dur + 50ms, start + 0.8·dur + 50ms]` window if no onset is detected.
- `DEFAULT_LATENCY_COMPENSATION_MS = 50` (was 250). Onset detection absorbs the vocal reaction time; the constant is now just pipeline delay used by the fallback path.
- Adjacent-note overlap handled scorer-side: samples that fall in two consecutive notes' candidate windows route to the note whose nominal center is closest in time.
- `SessionTracker`: routes pitch samples to per-key Scorers, produces live `SessionTrackerSnapshot` for UI.
- `KeyAttemptResult` includes per-note `NoteScore` with `meanCentsDeviation`, `accuracyPct`, and a `trace` (up to 200 frames of `{tMs, hz, cents, clarity}`).

### Coaching
- **Engine** (`lib/coaching/engine/*`): 9 detectors (global sharp/flat, high-note flat/sharp, low-note flat, register mismatch, phrase-end flat, position-consistent, key-fatigue drift) emit ranked `Diagnosis[]`; ranker scores by `severity × ln(N+1) × consistencyFactor`. Adapters in `sessionInput.ts` accept both `KeyAttemptResult[]` (live + historical sessions) and `MelodyAnalysis` (imported melodies).
- **Card library** (`lib/coaching/library/cards.ts`): 72 advice cards transcribed from `vocal-tips-research.md` — 6 symptoms (§1), 17 causes (§2), 49 generic tips (§3). `DETECTOR_MAPPINGS` table baked from research §4.
- **Contrast playback** (`lib/coaching/playback.ts`): 4 variants — target note alone, your note alone, full phrase as target, full phrase with your version's pitch substituted via `NoteEvent.hzOverride`.
- **Saved coaching tips** (`lib/coaching/savedStorage.ts`): AsyncStorage at `vocal-training:coaching:saved:v1`. Each save is a snapshot — diagnosis evidence + symptom card + cause cards frozen at save time so library updates don't drift past saves.
- **Generic-tip rotation** (`lib/coaching/rotation.ts`): round-robin with persisted last-shown id; powers the empty-state "Today's tip" surface.
- `CoachingScreen` (`app/(tabs)/coaching.tsx`): read-only diagnosis screen. Loads via `?sessionId=` (live or historical) or `?exerciseId=` (imported melody). Renders headline + evidence + contrast-playback panel + symptom card + 2-3 candidate causes + "Other findings"/"Other possibilities" expanders + bookmark. Empty state rotates a generic tip. **No retry, no live mic, no child-session persistence** — those were cut in the May 2026 redesign.
- `SavedTipsList` (`app/coaching-saved.tsx`): browseable list of bookmarked diagnoses; reachable from any coaching screen and from a "Saved coaching tips" row at the bottom of Progress.
- `GuidedSession` (`components/practice/GuidedSession.tsx`): note-by-note hold-and-match mode with configurable tolerance (±25/50/75/100¢), advance-or-repeat toggle, tonic advancement through the key range.
- Practice screen links to coaching after a session.

### UI
- Practice screen: exercise picker (chips), voice-part picker, Standard/Guided mode toggle.
- **Settings cluster**: 4 icon buttons (Accompaniment / Guidance / Demo / Click-track) with hover-tooltip on web and long-press popover on native. Tap to open inline expanders with the actual options. Responsive: stacks below picks on mobile <640 px, rides alongside picks column on desktop. Disabled mid-session.
- **Per-exercise tonic memory**: `Map<"exerciseId|voicePart", tonicMidi>` in component state. Switching exercises restores each exercise's last-reached tonic; defaults to range lowest for first visits. Voice-part swap clamps out-of-range tonics. RESET icon button (with tooltip) above the note chips returns the current exercise to its starting tonic.
- Lead-in countdown: a large 3-2-1 number replaces the syllable strip in the hero card during the lead-in window between cue and melody (driven off transport time, hidden once melody starts).
- Headphones modal: blocking dialog before the first Start of an app session — Yes (no RMS bias) / Continue without (RMS gate biased up to compensate for piano bleed).
- **Timing diagnostics panel** (collapsed by default, in standard-mode body): manual latency-offset slider (−500 to +500 ms, step 10), +/− buttons, output/base latency probe display, persisted to AsyncStorage at `vocal-training:settings:latency-offset-ms`. Slider takes effect on the current Tracker instance — no session restart.
- **Calibrate Latency** button inside the diagnostics panel: plays the Five-Note Scale on the user's voice-part lowest tonic, the user sings along, the system measures per-note onset offsets (reuses `ONSET_FRAME_THRESHOLD = 3` and clarity ≥ 0.85 from the scoring module), drops high+low outliers, takes the median, displays "Detected offset: X ms (from Y of 9 notes)" with Apply/Cancel. Reliability gate: ≥5 of 9 notes must produce a valid onset.
- **Per-note results breakdown in completed-keys list**: each completed key now renders a chip strip below its summary line, one chip per syllable in the pattern with signed cents value, color-coded green (≤50¢) / amber (≤100¢) / red (>100¢). Notes with no samples in their eval window render as `—`, not a misleading `0¢`. Shared `<NoteResultsStrip>` at `components/practice/NoteResultsStrip.tsx`.
- Standard mode: karaoke syllable strip (2× scale + underline on active), coaching banner (plain-English cents deviation), tuning meter, per-note chips, completed-keys list with plain-English summaries, progress bar, tonic/key counter.
- Coaching screen (post May 2026 redesign): read-only diagnosis surface. Headline + evidence line, voice-teacher 4-variant contrast playback with focus-note highlight, "What this sounds like" symptom blurb, collapsible candidate-cause cards, bookmark/saved entry points. No retry UI.
- Guided session: hero card with note name and syllable, match-progress bar, live feedback label, tonic/note/reps/last-cents stat row. On pattern complete, a **per-note results breakdown** appears: one chip per syllable in the pattern showing the best signed-cents value achieved on that note position, color-coded green/amber/red against the user's threshold (`tolCents` / `2×tolCents`).
- Progress tab (replaced the old `explore.tsx` scaffold): **Today's routine** card at top (configurable 4-default exercise checklist with edit modal), weekly summary card, per-exercise list with last-practiced date, best key, **best-ever session accuracy**, and tap-to-expand **sparkline trend** (vanilla View-based, no chart library), recent sessions list (up to 20) where each row taps to expand into per-key + per-note breakdown chips with a **Coach this** button that loads that historical session into the coaching screen. Empty state when no sessions exist.
- No dark-mode theming applied to practice/coaching/progress screens (uses hardcoded colors); scaffold components have `useColorScheme` but it's unused in the app's core screens.

### Persistence
- `SessionRecord` stored via `AsyncStorage` at `vocal-training:sessions:v1`. Includes `parentSessionId` and `coachingFocus` for coaching child sessions.
- `lib/progress/stats.ts`: `summarizeSessions`, `progressForExercise` (trend, best-key), `thisWeekSummary`, `bestKeyPerExercise`, `rollingAccuracy` — all implemented and now surfaced via the Progress tab.

### Notation
- **MelodyDisplay** (`components/practice/MelodyDisplay.tsx`): SVG staff (5 lines) + noteheads aligned in shared columns above the syllable strip, replacing the bare syllable list on Practice / Guided / Coaching surfaces. Clef chosen per-render from mean MIDI (≥60 → treble with bottom line E4, else bass with bottom line G2). Ledger lines for notes outside the staff. Uses `react-native-svg` (web + native). Syllable font sizes bumped one Typography tier in `SyllableDisplay.tsx`.
- **Real clef + key-signature glyphs** (2026-05-09 follow-up): bundled BravuraText (SMuFL music font, SIL OFL) at `assets/fonts/BravuraText.{otf,woff2}`, registered via `expo-font` with `Platform.select` (WOFF2 on web because Chrome's font sanitizer rejects Bravura's OTF; OTF on iOS). `metro.config.js` adds `woff2` as a Metro asset extension.
- **`lib/music/keySignature.ts`** — pure music-theory module: `keySignatureFor(tonicMidi)` returns the major-key signature via circle of fifths (C/G/D/A/E/B/F# → sharps; F/Bb/Eb/Ab/Db → flats); `spellMidiInKey()` chooses the right letter and decides whether to draw an accidental on the notehead (suppress when the key sig handles it; draw a natural sign when overriding). Standard staff-step lookups for treble/bass × sharp/flat. **28 unit tests** in `lib/music/__tests__/keySignature.test.ts`.
- MelodyDisplay now renders treble (U+E050) and bass (U+E062) clefs as proper SMuFL glyphs at the staff's left edge, followed by the key signature in the conventional zigzag pattern, with on-note accidentals only when the note breaks from the key signature.

### Automated Testing (Foundation for Agentic Dev) — PR 1 Shipped
- **Status:** PR 1 of 5 from the testing plan at `~/.claude/plans/glistening-wiggling-hamming.md` is shipped. Suite is 202 tests / 18 suites / 2 projects all green. PRs 2–5 still open (see Slice E below).
- Jest split into two projects: `unit` (ts-jest, Node) for pure-TS tests; `component` (jest-expo/web, jsdom) for React Native + Expo component tests. Babel config (`babel.config.js`) added for `babel-preset-expo`. `setupFilesAfterEnv` wires up the component setup file.
- DI seam landed at `lib/audio/index.{ts,native.ts}` and `lib/pitch/index.{ts,native.ts}`: factory variable + `__set/__resetAudioPlayerFactory` and `__set/__resetPitchDetectorFactory`. Production callers unchanged.
- `test/setup-component.ts` — `installFakeAudio()` + `installFakePitch()` test helpers (recording spies + listener fan-out), plus standard mocks for Reanimated, AsyncStorage, expo-haptics, Tone (via `test/mocks/tone.ts`).
- `test/fixtures/pitchSamples.ts` — synthesizer for `PitchSample[]` traces with realistic shape (50 fps, clarity ~0.92, monotonic ts). Presets: `inTune`, `flat`, `sharp`, `octaveOff`, `falseStart`, `silence`. This is the workhorse fixture that lets us drive the entire pitch → tracker → scorer → diagnose pipeline without audio I/O.
- `test/fixtures/keyIterations.ts` — calls real `WarmupEngine.plan()` so fixtures stay schema-aligned with the engine.
- `test/fixtures/sessions.ts` — `SessionRecord` builders (`seedSessionRecord`, `inTuneFiveNoteSession`).
- 7 smoke tests verify the wiring (5 unit + 2 component); 28 keySignature tests landed alongside the staff-notation work.

### Exercise Library
- 8 JSON descriptors in `data/exercises/`: Rossini lip trill, five-note scale (mee-may-mah), Goog octave arpeggio, Nay 1-3-5-3-1, Ng siren, octave leap (wow), staccato arpeggio, descending 5-to-1. Matches the PRD's recommended v1 set.

### Platform Support
- Web: fully working. SPA only (`web.output: "single"` due to tslib SSR bug — not worth fixing for personal use).
- iOS: `app.json` has mic permission, `UIBackgroundModes: ["audio"]`, and the `react-native-audio-api` plugin configured. Piano implementation is in place (Salamander buffers + decodeAudioData). No dev build has been generated yet (`npx expo prebuild && npx expo run:ios` is the next step) and the implementation hasn't been validated on real hardware.

### Gaps
- iOS dev build not yet generated; Salamander player + native pitch detector both unvalidated on a real device.
- No standalone Library tab (Progress tab covers history + best-key but not a pedagogy-first browser of all 8 exercises).
- No session prune/delete — AsyncStorage accumulates indefinitely (coaching saved-tips list also grows unboundedly).
- Octave errors on male voice >=A3 possible despite postprocessor (pitchy MPM inherent limitation).
- Web still depends on the external Salamander CDN; native is bundled but web is not.

---

## Roadmap

### M1: iOS-Ready MVP

What you need before putting this on your phone via TestFlight.

| Item | Why | Size | Status |
|---|---|---|---|
| Generate dev build (`npx expo prebuild && npx expo run:ios`) | Nothing works on device without a custom native build — Expo Go can't load react-native-audio-api | S | open |
| Bundle Salamander MP3 subset into `assets/salamander/` | Native player sounds like a toy; Salamander is the UX delta that makes daily practice feel right | M | shipped — 8 notes, 668 KB |
| Swap `NativeAudioPlayer` to `AudioBufferSourceNode + decodeAudioData` | Required to play the bundled samples on iOS | M | shipped |
| Validate pitch detector on a real iPhone | The `AudioRecorder.onAudioReady` path is coded but untested on device — buffer size, sample rate, and callback timing all need a real-hardware sanity check | S | open |
| TestFlight submission (provisioning profile, EAS build config) | Delivery mechanism | S | open |
| Fix RMS gate calibration on device | The −45 dB threshold was tuned on web; iOS mic gain may differ — validate and adjust | S | open |

### M2: Coaching Depth

The coaching screen (`coaching.tsx`) already implements the core targeted-replay loop. This milestone expands it.

| Item | Why | Size | Status |
|---|---|---|---|
| Per-note results breakdown after Guided pattern | User wanted to review how close they got on each note in the pattern *after* finishing — live per-attempt feedback during the exercise was distracting and not actionable | S | shipped |
| Demo playback before first tonic | User couldn't internalize an exercise's pattern just from descriptor names — playing it through once on the first key before recording orients them | S | shipped |
| Guidance toggle (Full / Tonic-only) | Advanced practice removes the piano so the singer performs from memory; PRD §1 framing | S | shipped |
| Cents formula fix across 4 sites | `(sample.midi - target) * 100` was missing the within-semitone `+ sample.cents` term, causing all recorded cents to collapse to 0 and Strict/Normal/Okay/Ballpark thresholds to behave identically | S | shipped |
| Lead-in countdown + click-track (Standard sync Fix #1) | User had no orienting beat between cue and melody and was entering 200–400 ms late, putting their stable pitch outside the eval window | S | shipped |
| Onset-detection eval window + tempo-aware width (Standard sync Fixes #2 + #4) | Static 250 ms latency offset assumed perfect entry; staccato exercises had 114 ms windows that were essentially unscorable | M | shipped |
| Headphones modal + per-preset RMS gate (Standard sync Fix #3) | Doubled-melody piano was bleeding into mic and pitchy was locking onto the piano signal, literally analyzing the wrong note | S | shipped |
| Settings cluster icon row | 6 inline chip groups + 2 switches were eating vertical space; consolidated to 4 icons with tooltips and inline expanders | M | shipped |
| Per-exercise tonic memory + RESET button | Switching exercises lost or mishandled the user's position; they wanted exercise-scoped progress and a clear way to start over | M | shipped |
| Timing diagnostics panel (POC 1) | Sync remained badly broken after F+H/G — full-semitone errors suggest browser audio output/input latency is shifting the system's note timeline 100–300 ms ahead of singer reality. POC adds a real-time offset slider so we can find the magic number per-device | S | shipped |
| Per-note breakdown per completed key (Standard mode) | Single-line summaries weren't actionable — needed per-syllable cents to see which note in the pattern was off. Mirrors Guided's pattern-complete view via shared `NoteResultsStrip` component | S | shipped |
| Sing-along calibration (POC 2 variant) | Manual slider proved the theory (440 ms detected on user's hardware); calibration automates it. Captures the full perceived loop including reaction time — beats loopback which would only measure hardware | M | shipped |
| Octave-snap against musical target | Pitchy octave-errors on high tenor notes (Descending 5-to-1 reaches G4) producing −1000¢ across every note. Snap any sample 10.5–13.5 (or 22.5–25.5) semitones away to the nearest octave; uses the target as musical context the postprocessor doesn't have | S | shipped |
| **Pattern-alignment scoring (architecture refactor)** | Sync remained brittle even after octave-snap because the system was time-routing samples instead of using musical context. Replaced real-time eval-window scoring with buffer-then-align: capture all samples per key, segment into stable runs, DP-match to expected pattern, score each segment against its matched target. Eliminates per-exercise tempo sensitivity and the global latency-offset dependency for scoring | L | shipped |
| Opt-in session logging (regimen sprint slice 1) | Auto-save was polluting history with dev-test sessions. After Standard session ends, "Log session" + optional note / "Discard" UI; sessions only persist when explicitly logged | S | shipped |
| Best-ever per exercise (regimen slice 2) | Surfaces highest-ever single-session mean accuracy per exercise on the Progress list. Helps the user see whether they're improving | S | shipped |
| Sparkline trend per exercise (regimen slice 3) | Replaced text date/accuracy table with a 200×40 inline View-based sparkline (last 30 logged sessions, dashed line at all-time average). No chart library | M | shipped |
| Today's routine card (regimen slice 4) | New top-of-Progress card with 4 default exercises, daily completion checklist, edit modal (Modal pageSheet) for routine config, frequency setting (daily / 3x-weekly / weekly) preserved for future | M | shipped |
| Session inspection + coaching deep-link (regimen slice 5) | Recent-sessions rows now tap-to-expand into per-key + per-note chip breakdown; "Coach this" button on each loads that historical session into the coaching screen via `?sessionId=` route param. Closes the original A-D backlog Slice B | S | shipped |
| Cue-type selection actually wired to runtime | `buildCue()` exists in engine.ts but was bypassed; the V7 cue is a genuine pedagogical differentiator (PRD §2) | M | shipped |
| Sung-pitch audio playback (record actual mic audio, not just Hz substitution) | "Your version" currently reconstructs the pitch via oscillator/sampler — hearing your actual voice vs. the target is more informative | L | open |
| Coaching entry point from session history, not just post-session CTA | Now that Progress tab exists, you should be able to re-coach any past session | S | open |
| Tuning meter on coaching screen | Present during retry but missing from the coaching screen — copy from practice index | S | open |
| Multi-mistake drill queue | After passing one target, automatically load the next without manual "Find next mistake" tap | S | open |
| Pass threshold config | Hard-coded at 70% accuracy + ±25¢ mean; expose as a setting | S | open |

### M3: Progress & Library

The data model and stat functions exist; this milestone surfaces them.

| Item | Why | Size | Status |
|---|---|---|---|
| Replace `explore.tsx` placeholder with a Progress tab | Zero UI exists for the persistence layer despite full backend (stats.ts, storage.ts) | M | shipped |
| Session history list | Show past sessions with date, exercise, key count, mean accuracy | S | shipped (recent sessions section, last 20) |
| Per-exercise trend (text-based) | `rollingAccuracy` and `progressForExercise` wired to expandable date/accuracy table per exercise | M | shipped (text table; no chart library) |
| Best-key badge per exercise | `bestKeyPerExercise` shown on each exercise row | S | shipped |
| Weekly summary card | `thisWeekSummary` shown at top of Progress tab | S | shipped |
| Library tab (exercise browser) | Standalone tab listing all 8 exercises with pedagogy description, tags, PRD reference — distinct from Progress's "what you've practiced" framing | S | open |
| Per-exercise trend chart (visual) | Text table works; a real line/bar chart would be more glanceable | M | open |
| Session deletion / prune policy | AsyncStorage sessions accumulate indefinitely | S | open |
| Coaching deep-link from session history | Tap a past session → jump into a coaching session against its weakest note | S | open |

### M4: Pedagogy Expansion

PRD defines 18 exercises; 8 are shipped. This milestone closes the gap and adds practice modalities.

| Item | Why | Size | Status |
|---|---|---|---|
| Accompaniment preset selector (Classical / Studio / Beginner / Lip-trill / Drone) | PRD §2 names this as a "clear differentiator" | M | shipped |
| V7 cue option wired to user setting | Strongest pitch lift for chromatic modulation | S | shipped (via cue-type wiring + Classical preset) |
| Add remaining 10 PRD exercises (#1 basic lip trill, #3 tongue trill, #6 full vowel set, #9 octave arpeggio, #10 octave leap, #11 staccato, #12 messa di voce, #14 mum, #16 9-note scale, #17 vowel modification, #18 hum) | PRD §1 table; these cover range-expansion, agility, and dynamics gaps | M | open |
| Direction-reversal toggle per exercise | PRD §1: Riggs/SLS often skips the descent on stretch exercises; Miller/classical reverses symmetrically. `direction` field exists in descriptor schema but isn't user-adjustable | S | open |
| Siren / glissando exercise type | Requires continuous-glide pitch events, not discrete notes — engine changes needed | L | open |
| Vowel-shape diagram alongside syllable strip | PRD mentions this as post-MVP; useful for /ae/→/ah/ vowel modification exercises | L | open |
| Voice-led chord inversions between keys | PRD §2: "10-line function" that makes chromatic ascent sound like a real accompanist | S | open |

### Backlog / Nice-to-Have

- Android build (architecture supports it; just needs EAS config and testing)
- Metronome / tempo control per-session (schema has `tempo`; UI doesn't expose it)
- Custom exercise authoring (JSON editor or form-based)
- Mic-level indicator on practice screen
- Dark mode for practice/coaching screens (scaffold has the hook, app ignores it)
- Haptic feedback on note match in Guided mode
- iCloud / local file backup of session records (AsyncStorage is not backed up by default)
- Share-session summary (for a voice teacher or accountability partner)
- Watch app (glanceable current note and tuning meter)

---

## Melody Import Slices

Tracks the slicing in `MELODY_IMPORT_PLAN.md` §11. Lets a user import a sung clip, get a per-note diagnosis, and save the cleaned melody as a first-class exercise.

| Slice | Scope | Status |
|---|---|---|
| 1 — Schema extension | `durations?: number[]` on `ExerciseDescriptor`; engine honors per-note when present, falls back to `noteValue` | shipped |
| 2 — Analyze pipeline | `lib/analyze/{decode,framewise,segment,keysnap,diagnose,synth,types,config}.ts` — internal capability, no UI | shipped |
| 3 — Import screen + review | `<ImportModal>` mounted from Practice "+" affordance and Progress "+ Add imported melody" row; `components/import/{ImportModal,ImportForm,MelodyTimeline,PerDegreeTable,GlaringHeadline,SaveSheet,ImportProgressOverlay}.tsx`; full file → analyze → review → save flow on web; Practice picker switches to async `getAllExercises()` and auto-selects new imports | shipped |
| 4 — User library + Progress integration | `lib/exercises/userStore.ts` AsyncStorage CRUD; `library.ts` exposes async `getAllExercises`/`getExerciseAsync` merging built-in + user; Progress tab gets "+ Add imported melody" row, "Imported" pill, and placeholder expanded-card sections (timeline / per-degree stats / range / edit-delete) for Slices 5/7 to fill | shipped |
| 5 — Subset practice | Range slider on imported-exercise detail; transient sliced descriptor; "Save as new exercise" pin | open |
| 6 — Native parity | `decode.native.ts`, `expo-document-picker` on iOS | open |
| 7 — Note editor + trim | Per-note edit panel; trim handles; re-synthesis | open |
| 8 — Coaching deep-link | "Coach this melody" CTA from import review + Progress imported expanded card | shipped (folded into Coaching Redesign Slice C5) |

---

## Coaching Redesign Slices

Tracks the slicing in `COACHING_REDESIGN_PLAN.md` §16. Replaced the retry-this-note coaching with an algorithmic diagnosis + research-backed advice library + voice-teacher contrast playback + bookmarkable saved tips.

| Slice | Scope | Status |
|---|---|---|
| C1 — Detector engine + card library | `lib/coaching/engine/*` (types, config, rank, representative, sessionInput, diagnose orchestrator); `lib/coaching/detectors/*` (9 v1 detectors — globalSharp/Flat, highNote Flat/Sharp, lowNoteFlat, registerMismatch, phraseEndFlat, positionConsistent, keyFatigueDrift); `lib/coaching/library/cards.ts` (72 cards from research §1/§2/§3); `lib/coaching/library/mappings.ts` (research §4 baked in). 4 test suites | shipped |
| C2 + C4 — Screen rewrite + saved tips storage + UI | Cut retry/find-next-mistake/child-session-save. New `components/coaching/{DiagnosisHeadline,EvidenceLine,ContrastPlayback,CauseCard,CauseCardList,EmptyStateTip,BookmarkButton,SavedTipRow,SavedTipsList}.tsx`. New `lib/coaching/{savedStorage,rotation}.ts`. New `app/coaching-saved.tsx`. Old `lib/coaching/diagnose.ts` + `types.ts` deleted. Progress tab gets "Saved coaching tips" row | shipped |
| C3 — Voice-teacher contrast playback | `lib/coaching/playback.ts` builds `NoteEvent[]` for 4 variants (target-note, your-note, phrase-target, phrase-your-version) using `hzOverride`. Pure functions, consumed by `<ContrastPlayback>` in C2 | shipped |
| C5 — Imports coaching deep-link | `coaching.tsx` accepts `?exerciseId=` and uses `fromMelodyAnalysis` adapter; ImportModal post-save "Coach this melody" CTA; Progress imported expanded-card "Coach this melody" button | shipped |

Tier 3 (trace-shape: scoop / drift / wobble) and Tier 4 (passaggio) detectors deferred per `COACHING_REDESIGN_PLAN.md` §17. Recurring-issue insights and personalized cause ordering parking lot until session-level data informs the design.

---

## Sprint-Ready Slices

The previous batch (Slices 1–4: iOS native piano, Progress tab, cue+presets, per-attempt history) all shipped on 2026-05-05. Below is the next batch — pick any subset to dispatch to a sub-agent swarm.

### Slice A: iOS Dev Build + On-Device Validation (M1 finisher)

**Scope:** Generate the iOS dev build, install on the user's iPhone, validate that (a) Salamander samples play correctly through the new `player.native.ts`, (b) `react-native-audio-api`'s `AudioRecorder.onAudioReady` actually produces usable PCM frames at the expected sample rate and buffer size, (c) the −45 dB RMS gate is sane on iOS mic gain (likely needs adjustment).

**Known native bug to fix as part of this slice:** `lib/pitch/detector.native.ts:82` anchors the postprocessor's start time to `Date.now()` while `app/(tabs)/index.tsx:182` captures `detectorStartMsRef = performance.now()`. These are different clocks — on iOS RN the gap can be many minutes since boot, so samples will route into the wrong key entirely. Fix: change the native side to `performance.now()` to match web.

**Files touched:**
- `ios/` (generated by `npx expo prebuild`) — committed for reproducibility
- `lib/pitch/detector.native.ts` — clock fix above; possibly buffer/sample-rate adjustments
- Possibly `app/(tabs)/index.tsx` if the RMS gate threshold needs to be different on native

**Done looks like:** App runs on the user's iPhone, plays piano (not beep), pitch detection scores notes accurately, no obvious latency or dropout issues. RMS gate threshold tuned per-platform if needed. This slice is partly manual — sub-agent does the prebuild + code adjustments; user validates IRL.

---

### Slice B: Coaching Deep-Link from Session History (M2 + M3)

**Scope:** From the Progress tab's recent-sessions list, tap any past session to jump into a coaching session against its weakest note. Today coaching is only reachable as a post-session CTA on the Practice screen.

**Files touched:**
- `app/(tabs)/explore.tsx` — make session rows tappable; on tap, navigate to coaching with the session ID as a route param
- `app/(tabs)/coaching.tsx` — accept a `sessionId` route param; if present, load that session from storage and run `diagnoseSession` against it instead of using the live in-memory session
- `app/(tabs)/_layout.tsx` — coaching is currently `href: null`; keep that, but verify navigation via `router.push` works with a hidden tab

**Done looks like:** From Progress, tap a session from yesterday → coaching screen opens diagnosing that session's worst note → "Correct version" / "Your version" / Retry all work as on a fresh post-session flow.

---

### Slice C: Coaching Polish (Tuning Meter + Multi-Mistake Queue) (M2)

**Scope:** Two small additive improvements to the coaching screen, bundled because they're both ≤30 lines and touch the same file.

**Files touched:**
- `app/(tabs)/coaching.tsx` — (1) import and render the existing `TuningMeter` component during the retry phase, (2) after passing one focus-note target, automatically advance to the next mistake from `diagnoseSession`'s ranked list instead of requiring "Find next mistake" tap. Keep the manual button as an escape hatch.
- `lib/coaching/diagnose.ts` — verify it returns a ranked list (not just the top mistake); if not, expand to `diagnoseSessionAll(): DiagnosisCandidate[]` and add a `next()` API

**Done looks like:** Coaching feels like a continuous drill — pass a note, the next-worst note loads automatically with a tuning meter visible during retry. No manual stepping unless you want to skip ahead.

---

### Slice E: Automated Testing Foundation (M5 — Agentic Autonomy Prereq)

**Scope:** Build a comprehensive test pyramid so an agent's "green build" is a trustworthy signal for autonomous code development. Plan lives in detail at `~/.claude/plans/glistening-wiggling-hamming.md`. Five PRs, ~70 hrs total. **Current state: PR 1 shipped (202 tests / 18 suites passing). PR 2 is the highest-leverage next slice.**

| PR | Status | Hrs | Outcome |
|---|---|---|---|
| **PR 1** | ✅ shipped 2026-05-09 | ~14 | Test infra + DI seams + fixtures. Jest projects split (unit/component), `lib/audio` + `lib/pitch` registry pattern, `test/fixtures/*` synthesizer + scenario builders, `test/setup-component.ts` with `installFakeAudio()` / `installFakePitch()`, smoke tests in both projects. 202 tests / 18 suites passing (existing 150 + 5 fixture smokes + 2 component smokes + 28 keySignature unit tests). |
| **PR 2** | open — next | 12–16 | Pure-TS unit coverage for the 4 untested critical files: `lib/scoring/align.ts` (~25 tests, 0 today), `lib/pitch/postprocess.ts` (~12, 0 today), `lib/session/tracker.ts` (~10, 0 today), `lib/progress/stats.ts` (~12, 0 today). `lib/exercises/music.ts` (~10, 0 today) — small but completes the math layer. Coverage gates enforced (>90% line on `lib/scoring/**`, `lib/pitch/postprocess.ts`). |
| **PR 3** | open | 6–8 | Engine integration tests in `lib/__tests__/integration/engineIntegration.test.ts` — 5 canonical scenarios driven through real `SessionTracker` + `Scorer` + `alignAndScore` + `diagnoseSession` with synthetic `PitchSample[]`. Scenarios: in-tune scale across 2 keys; globally flat 60¢; high-note octave error on octave-leap; false-start wobble; key-fatigue drift. |
| **PR 4** | open | 16–24 | Component tests (jest-expo + RTL) for Practice happy path, Coaching deep-link, Progress tab tap-to-coach. GitHub Actions CI workflow with typecheck + jest (loose component coverage gate at 50%). |
| **PR 5** | open | 12–16 | Playwright E2E. WAV fixture pipeline (`scripts/synth-wav.ts` → `test/fixtures/audio/*.wav`). 5 critical-path scenarios with Chromium `--use-file-for-fake-audio-capture`. Audio output verified by spying on `Tone.Sampler.prototype.triggerAttackRelease` via `page.addInitScript` (Tone.Offline doesn't work with Sampler). CI extended to install Chromium and run `npm run test:e2e`. |
| **Phase 5** | deferred behind Slice A | 4–6 | Maestro iOS smoke flows (4 nav-only YAMLs under `.maestro/`). Not CI-gated — manual TestFlight remains the audio-validation line. Gated on the iOS dev build landing in Slice A. |

**Done looks like:** `npm test && npm run test:e2e` is a green-or-broken signal an agent can trust. PR 2 is the next sprint, since unblocking `align.ts` refactors is the biggest agent-leverage win.

**Carryover from PR 1 to address in PR 2 or follow-up:**
- Obsolete snapshot at `lib/exercises/__tests__/__snapshots__/engine.regression.test.ts.snap` (1 entry) — likely orphaned by the staff-notation work or a prior refactor. Decide: refresh with `npm test -- -u` if behavior is intentional, or restore the missing test. Currently warns on every test run.
- `@testing-library/jest-native` is deprecated (replaced by RTL v12.4+ built-in matchers). Remove this dep when component tests land in PR 4.
- `jest-expo@55.0.17` is one minor ahead of Expo SDK 54's expected `~54.0.17` — works fine but emits a "best compatibility" warning on dev-server start. Can be downgraded if it causes friction.

---

### Slice D: Four More PRD Exercises + Direction-Reversal Toggle (M4)

**Scope:** Add four high-value PRD exercises (octave arpeggio #9, octave leap on `wee` #10, messa di voce #12, mum sirens #14) as JSON descriptors. Add a per-session "ascending only / ascending + descending" toggle that uses the existing `direction` field on the descriptor.

**Files touched:**
- `data/exercises/octave-arpeggio.json`, `octave-leap-wee.json`, `messa-di-voce.json`, `mum-sirens.json` — new descriptors
- `lib/exercises/library.ts` — register the four new files
- `lib/exercises/names.ts` — add the four new id→name entries
- `app/(tabs)/index.tsx` — add a "Direction" toggle (Ascending / Both ways) that overrides the descriptor's `direction`
- `lib/exercises/engine.ts` and/or `types.ts` — confirm `PlanInput` carries a `directionOverride` field; add if missing

**Done looks like:** Four new exercises selectable from the Practice picker, each with appropriate accompaniment patterns and PRD-faithful pedagogy. Direction toggle changes whether each key iterates the descending half of the pattern.

## Standard-Mode Sync — Resolved Architecturally

Long arc to the right answer. The full sequence:

1. **E/F/G/H** (lead-in countdown, onset-detection eval window, headphones gate, tempo-aware window) — improved but didn't solve. Errors still 9–12% with full-semitone misroutings.
2. **POC 1** (manual latency-offset slider) confirmed the theory — a +440 ms global offset brought Five-Note Scale errors into a realistic 50–100¢ range on the user's hardware.
3. **Sing-along calibration** automated POC 1 — captures full perceived loop including reaction time.
4. **Octave-snap-against-target** rescued pitchy's subharmonic latching on high notes (Descending 5-to-1 reaches G4).
5. **But** — the calibration was exercise-specific. 440 ms didn't transfer to Descending 5-to-1 (different tempo, longer notes). User pointed out the conceptual flaw: the system has the full pattern and the full pitch trace; it shouldn't need to time-align them in real-time. Just sort and match.
6. **Pattern-alignment scoring** (`lib/scoring/align.ts`) is the architectural fix. Buffers samples per key, segments into stable pitch runs, DP-matches to expected pattern, scores each matched segment against its target. Eliminates per-exercise tempo sensitivity. Latency offset is now purely cosmetic (live banner display).

**What stays useful:** the calibration UI and the latency slider still tune the live "On pitch ✓" banner alignment, which is a UX nicety. They no longer affect scoring accuracy.

**Open questions:**
- Live per-note feedback during the pattern (vs. post-pattern only) — currently chips appear after the pattern completes. The user previously said they prefer post-pattern; revisit if that changes.
- Adjacent same-pitch notes in a pattern (currently no exercise has them) — alignment would collapse them into one segment. Add splitting heuristics if/when an exercise needs it.
- Per-preset latency-offset defaults — moot for scoring now, but might still help banner cosmetics.

## Standard-Mode Sync Fixes (shipped 2026-05-05)

Opus-led pipeline analysis identified that the user complaints "I don't know what to sing" and "it's not analyzing the right note" shared one root cause. All four fixes shipped in one orchestration session:

- **Slice E (shipped)** — Lead-in countdown + audible 2-beat click-track between cue and melody. Suppressed on Classical preset (V7 → I already cues entry). Visual 3-2-1 in hero card. Toggleable.
- **Slice F (shipped)** — Onset-detection eval window in `lib/scoring/score.ts`. Window starts at the singer's actual entry (3 consecutive clarity-passed frames within `1.5·dur`), not the piano's. Static fallback if no onset detected. `DEFAULT_LATENCY_COMPENSATION_MS` dropped 250 → 50 ms.
- **Slice G (shipped)** — `HeadphonesBanner` promoted to a Start-blocking modal (per-app-session, persisted). `rmsGateFor(preset, headphonesConfirmed)` replaces the constant; +6 dB bias on melody-doubling presets and on the no-headphones path. Default preset now `classical`.
- **Slice H (shipped)** — Tempo-aware eval window: `width = max(150 ms, dur · 0.6)`. `scoringHints.octaveJumpFrames: 2` on octave-leap exercises (`goog-octave-arpeggio`, `octave-leap-wow`, `staccato-arpeggio`). Adjacent-note overlap resolved scorer-side by routing each sample to the closest nominal note center.

---

## Open Questions

1. **Bundle vs. stream Salamander samples?** PRD recommends bundling the 8-note subset (~5 MB). The hosted CDN works on web but requires network on device and is a single point of failure. Decision: bundle for native (M1), keep streaming for web.

2. **EAS build vs. local `expo run:ios`?** EAS Build is easier for TestFlight submission but requires an Expo account and build minutes. Local `run:ios` is faster to iterate but requires Xcode and a connected device. For a personal app, local prebuild + Xcode archive is probably simpler for the first submission.

3. **Mic audio recording for "Your version" playback (M2)?** The current "Your version" reconstruction is approximate (median Hz from trace, played via sampler). Recording actual PCM audio during practice for playback is more useful but adds storage complexity and a privacy surface. Decide before building Slice 2 of coaching.

4. **Session storage longevity?** AsyncStorage has no size limit enforcement and sessions accumulate indefinitely. Add a prune policy (e.g., keep last 90 days or 500 sessions) before shipping M3.

5. **Single-user only or multi-profile?** Currently all state is keyed to a single AsyncStorage namespace. If a second person (e.g., a voice teacher) ever wants to use the app, the model needs a profile layer. For personal use this is not needed, but it's a breaking schema change to add later.

6. **`react-native-audio-api` version lock?** Currently pinned at `0.11.7` to avoid a `0.12+` iOS audio session breaking change. Monitor Software Mansion's changelog before any Expo SDK upgrade — this pin will drift.
