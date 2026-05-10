# Song Import & Practice — Forward Roadmap

Forward-looking roadmap for the song-import feature stream. Companion to:

- **`MELODY_IMPORT_PLAN.md`** — design spec + resolved decisions (the *what* and *why*). Mostly historical now that MVP shipped, but still authoritative for the design contract.
- **`ROADMAP.md` §Melody Import Slices** — single-line status tracker for the whole app. This doc owns the *details* of Slices 5+; flip the statuses there when slices ship.
- **`prd-guidance-for-vocal-app.md`** — pedagogy reference. Consult when adding features that affect what's musically possible/desirable.

## Status as of 2026-05-08

**MVP shipped (Slices 1–4):** users can import a clean vocal stem on web, set tonic + mode + voice + tempo, see per-scale-degree intonation diagnosis on a review surface, save the cleaned melody as an `ExerciseDescriptor`, and practice it through the existing engine. Imported exercises appear in the Practice picker with an "Imported" pill and in the Progress tab's per-exercise list. Engine honors per-note `durations` (in beats) when present, falls back to uniform `noteValue` when absent.

**Pipeline reuse:** `lib/analyze/*` drives pitchy framewise over a decoded `Float32Array`, runs samples through the existing `PitchPostprocessor`, and segments via the existing `lib/scoring/align.ts` primitives — no parallel pipeline, full reuse.

**Open:** Slices 5–8 (subset practice, native parity, note editor, coaching deep-link), then post-MVP features.

---

## How this roadmap is structured

Each slice is independently shippable. Each entry includes:

- **Goal** — one-sentence outcome
- **Why now** — what user pain or capability gap it closes
- **UX** — concrete user-facing flow
- **Implementation** — files touched, key types, reuse points
- **Dependencies** — what must already be true
- **Risks** — known failure modes
- **Done looks like** — observable acceptance criteria
- **Open questions** — decisions deferred to slice kickoff

Order is suggested, not strict. Slice priorities should be reassessed after dogfooding lessons from Slice 6 (native parity) — real-device usage will surface which of 5/7/8 is most felt.

---

## Active backlog — MVP follow-on

### Slice 5 — Subset practice

**Goal:** let the user pick a contiguous range of an imported melody and practice that range as a transient or pinned exercise.

**Why now:** an imported chorus or song is often longer than a useful warmup. The most common ask after "import a song" is "now let me drill bars 9–12." Without subset practice, every reuse is a re-import. (Resolved Q6: F3 — session-only by default with opt-in pinning.)

**UX:**

1. From Progress, expand an imported exercise's card. The placeholder Slice 4 left renders the analysis surfaces (timeline + per-degree stats); subset practice adds an interactive range slider over the timeline.
2. User drags the in/out handles to pick notes, e.g. `[5..12]`.
3. Stats update to *show only* the selected range's per-degree breakdown (notes outside the slice dim).
4. Tap **Practice this range** → the existing Practice flow opens with a transient sliced descriptor. No persistence.
5. Optionally, **Save slice as new exercise** prompts a name and writes a permanent `StoredExtractedExercise` for the slice.

**Implementation:**

- New: `components/import/RangeSlider.tsx` — replaces the `<RangeSliderPlaceholder/>` Slice 4 stubbed. Two-thumb slider over the timeline; emits `[startIdx, endIdx]`.
- New: `lib/exercises/slice.ts` — pure transform `sliceDescriptor(d, startIdx, endIdx) → ExerciseDescriptor`. Slices `scaleDegrees`, `syllables`, `durations` arrays in lockstep. Generates a transient `id` like `${original.id}#slice-${startIdx}-${endIdx}` for ephemeral use; for "Save as new" the user-supplied name produces a fresh id.
- Modify: `app/(tabs)/explore.tsx` — wire the range slider into the imported expanded card. On "Practice this range" → call the same picker → Practice flow with a transient descriptor injected (likely via a route param or a small global "transient exercise override" store).
- Modify: `app/(tabs)/index.tsx` — when launched with a transient descriptor override, use it instead of looking up by id. Display the parent name + range badge in the picker (`Imported melody — bars 5–12`).
- Reuse: `saveUserExercise` from `lib/exercises/userStore.ts` for pinning. The "Save as new" flow opens a tiny SaveSheet variant (just name + accompaniment dropdown — voice and tonic come from the parent).

**Dependencies:** Slices 1–4 (all shipped). No new infrastructure.

**Risks:**

- Per-degree stats panel needs to respect the selected range without recomputing analysis. The aggregator in `lib/analyze/diagnose.ts` works on `ExtractedNote[]`; passing a sliced array gives correct stats. Verify the saved descriptor still carries the original full `analysis` blob (not the sliced one) so re-opening the parent shows the full diagnosis.
- Slicing across a phrase boundary may lose musical context (e.g. an imported melody that resolves to tonic on the last note becomes "unresolved" if the last note is sliced off). Acceptable — that's the user's choice — but consider showing a hint when the slice doesn't end on degree 0 or 7.

**Done looks like:**

- User imports a 16-note melody.
- In Progress, drags the range slider to `[5..12]`.
- Stats panel updates to show only those 8 notes' diagnostic breakdown.
- Tap "Practice this range" → existing engine plays just those 8 notes with the descriptor's accompaniment, scoring works normally.
- Tap "Save slice as new exercise" → name it "Bridge phrase" → it appears in Practice picker as a separate entry, parent unchanged.

**Open questions:**

- **Slice across pattern direction reversal?** Imported melodies default to `direction: "ascending"` so this isn't a concern in MVP, but if a user later edits the direction to `both`, slicing becomes ambiguous. Defer until a user hits it.
- **Range slider granularity** — snap to note boundaries (always) or allow sub-note (no — useless for practice).

---

### Slice 6 — Native parity (iOS)

**Goal:** the import flow works end-to-end on the iOS dev build.

**Why now:** the project's stated north star is TestFlight (per CLAUDE.md). The MVP shipped web-first because file-picker UX is simpler there; native is non-negotiable for the real product. Decoupled from Slice 5/7 because validation needs an iOS dev build (Slice A in the main ROADMAP) which is partly out-of-band manual work.

**UX:** identical to web. The native file picker (system "Files" / iCloud / on-device storage) replaces the web `<input type="file">`. Same form, same review, same save.

**Implementation:**

- `lib/analyze/decode.native.ts` is already written (uses `react-native-audio-api`'s `decodeAudioData` + `expo-file-system` for URI → ArrayBuffer). Validate it on real WAV/MP3/M4A files.
- `components/import/ImportForm.tsx` already lazy-imports `expo-document-picker` on the native path. Validate.
- Test codec coverage: `react-native-audio-api@0.11.7`'s decoder may have gaps. Document the supported list (likely WAV, MP3, M4A, AAC; unclear for OGG/FLAC). Surface unsupported formats with a friendly error.
- Profile pipeline performance on-device: a 2-minute file × ~10 ms hop = ~12,000 frames through pitchy. Measure JS-thread cost. If it blocks UI noticeably, add periodic `await new Promise(r => setTimeout(r, 0))` yields every N frames in `runOfflinePitch`.
- Validate the existing native pitch detector clock fix is unaffected (the offline path doesn't use the native detector at all — it uses pitchy directly — so this should be moot).

**Dependencies:** Slice A from main ROADMAP (iOS dev build). Slices 1–4.

**Risks:**

- Codec support gaps in `react-native-audio-api`. If common iPhone-recorded formats (AAC in M4A) don't decode, this slice gets harder. Mitigation: fall back to a pure-JS decoder for the missing format, or constrain MVP-native to WAV/MP3.
- Performance on older iOS devices. Pitchy in JS is fine on M1+; iPhone XR-era hardware may need the periodic-yield approach above.
- File access on iOS is permission-gated. `expo-document-picker` handles the picker UI; verify the returned URI is readable via `expo-file-system` without a separate permission grant.
- React-native-audio-api's `decodeAudioData` may not handle all sample rates. Test 22.05k, 44.1k, 48k.

**Done looks like:**

- iOS dev build installed on the user's iPhone.
- User taps "+ Import" on Practice → system file picker opens → picks a vocal MP3 from iCloud Drive → fills form → Analyze → review → save.
- The new exercise appears in the Practice picker, plays correctly, scores correctly through the live mic.
- Performance: analyze finishes in <30 seconds for a 2-minute clip on the user's hardware.

**Open questions:**

- **Should imported audio be cached locally?** For "Coach this melody" (Slice 8) and live "your version" comparisons, having the original PCM helps. But it's storage-heavy. Probably defer until a feature actually needs it.
- **Bundle size impact** of the native deps — `expo-document-picker` is small; `react-native-audio-api` already in stack. No expected concerns.

---

### Slice 7 — Note editor + trim

**Goal:** user can correct mis-detected notes (drop false segments, change snapped pitch, edit duration, set syllables) and trim silent/cough intros and tails before saving.

**Why now:** the segmenter is good but not perfect. Vibrato can over-split sustained notes. False starts can sneak past the filter. Pitch latching can put a note an octave off. Without an editor, the user's only recourse is to re-record or accept a wrong descriptor. With it, imports become trustworthy.

**UX:**

1. In the review surface (already in place from Slice 3), the timeline gains **trim handles** at both ends. Drag inward to crop intro/outro silence.
2. Tap any note → `<NoteEditPanel>` opens (slide-in from the right or modal):
   - **Pitch** — dropdown of nearby in-key options (currently snapped, ±1 step in scale, ±octave) plus chromatic override
   - **Duration** — relative multiplier (`0.5×`, `1×`, `2×`) — discourages absolute editing since it'd break beat-relative semantics
   - **Syllable** — text input with vowel-cycle quick-buttons (mee/may/mah/moh/moo)
   - **Drop note** — removes from the array
3. **Bulk syllable apply** — a button at the top of the review surface that sets all syllables to a chosen pattern (mee/may/mah cycle, single vowel, etc.)
4. Edits update the descriptor preview live; per-degree stats and glaring banner refresh. Save uses the edited array.

**Implementation:**

- New: `components/import/NoteEditPanel.tsx` — slide-in or modal panel; takes a single `ExtractedNote` and emits an edited copy or a delete signal.
- New: `components/import/TrimHandles.tsx` — overlay on the timeline; persists in/out indices.
- New: `lib/analyze/edit.ts` — pure transforms over `ExtractedNote[]`: `applyTrim(notes, inIdx, outIdx)`, `editNote(notes, idx, patch)`, `dropNote(notes, idx)`, `applySyllablePattern(notes, pattern)`. Re-runs `diagnoseMelody` on the edited array.
- Modify: `components/import/ImportModal.tsx` — review state holds the edited `notes` separately from the original `analysis.notes`; on save, synth uses the edited array.
- Modify: `components/import/MelodyTimeline.tsx` — already supports tap-to-select; just wire the panel.

**Dependencies:** Slice 3 (review surface). Independent of Slices 5/6/8.

**Risks:**

- Re-running `diagnoseMelody` on every edit may feel laggy. Debounce to ~150 ms or only refresh stats on explicit "Refresh diagnosis" tap.
- Syllable count must equal `scaleDegrees.length`. Drop-note paths must keep arrays in lockstep.
- Edits to pitch don't change the original `medianHz` field — keep both: the snapped pitch is what gets saved into the descriptor; the original median stays in `ExtractedNote.medianHz` so the user can "revert" or so the diagnosis (cents-off vs. snapped) remains meaningful.
- Trim handles vs. timeline scrolling — make sure dragging a handle doesn't accidentally pan the view.

**Done looks like:**

- User imports a melody with one obviously-wrong segment (octave error) and a coughing intro.
- Drags the in-trim handle past the cough.
- Taps the wrong note → opens panel → picks the in-key octave-down option → confirms.
- Saves. The descriptor reflects the trimmed/edited state.
- Practice plays the corrected melody.

**Open questions:**

- **Undo/redo?** Worth it given the editor's purpose. Probably yes — local history stack on the modal state, no need to persist.
- **Original-vs-edited toggle** — let the user A/B compare? Probably worth a simple "Reset note" per-row button rather than a full toggle.

---

### Slice 8 — Coaching deep-link

**Goal:** from the review surface and from the imported-exercise detail in Progress, launch the coaching screen against the import's worst note.

**Why now:** the diagnosis already identifies a glaring mistake. The coaching screen exists for live sessions and for historical sessions (Slice B from main ROADMAP). Imports are a third source — the natural integration is to make every imported melody coach-able the same way.

**UX:**

1. On the review surface (post-analyze), a primary CTA: **Coach this melody**. Currently a `TODO Slice 8` placeholder.
2. On the imported-exercise detail in Progress (Slice 4 left a placeholder), the same CTA on the expanded card.
3. Tapping launches the coaching screen with the imported descriptor preloaded and the worst-degree note as the focus target.
4. "Correct version" plays the original snapped pitch on piano (drives the existing player).
5. "Your version" plays the user's actual sung pitch from the analysis (synthesis substitutes the original `medianHz` into the piano sequence — same approach the existing coaching screen uses for live sessions).
6. Retry runs against that target with live mic + scoring.
7. "Find next mistake" iterates through the ranked list of glaring notes.

**Implementation:**

- Modify: `app/(tabs)/coaching.tsx` — accept a new route param `exerciseId` (in addition to existing `sessionId`). When `exerciseId` points to a user-imported exercise, load the descriptor and synthesize a coaching session from `analysis.glaring` + `analysis.notes`:
  - Build a synthetic "session-like" object: `{ targetMidi, meanCentsDeviation, accuracyPct, trace }` per note, mirroring `NoteScore`
  - The most-glaring note becomes the active focus; "Find next mistake" iterates the ranked list
- New: `lib/coaching/fromAnalysis.ts` — adapter `analysisToCoachingSession(analysis): CoachingSession`. Maps `ExtractedNote[]` + `glaring` into the shape `coaching.tsx` consumes.
- Modify: `components/import/ImportModal.tsx` — replace the `TODO Slice 8` placeholder with a real button that navigates to `/coaching?exerciseId={id}` after save (or before save with the analysis injected; choose based on whether unsaved imports should be coachable — recommend yes, since Save → Coach → realize it's wrong → Edit → Re-save is a worse loop).
- Modify: `app/(tabs)/explore.tsx` — replace the `<EditDeleteRow/>`-adjacent placeholder with a "Coach this melody" button that does the same navigation.
- Reuse: `lib/coaching/diagnose.ts` and the existing coaching machinery; the new adapter just produces compatible inputs.

**Dependencies:** Slices 1–4. Independent of 5/6/7. Some overlap with main-ROADMAP Slice B (coaching deep-link from session history) — the underlying coaching screen extension is similar; coordinate with that slice if running concurrently.

**Risks:**

- The coaching screen currently expects real-session inputs (per-frame trace data). The analysis has `notes[].framesUsed` but doesn't preserve the raw frame trace per note. Either:
  - Extend `ExtractedNote` to carry a `trace: NotePitchTrace[]` (similar to `NoteScore.trace`) — minor `lib/analyze/keysnap.ts` change to keep frames around
  - Or have the adapter generate a synthetic trace from `medianHz` (constant trace) — coaching's "Your version" playback uses median anyway, so this might suffice
- "Your version" playback for imports plays the user's sung pitch substituted into the piano sequence. The existing coaching path uses recorded mic audio when available; for imports, only the snapped median is available unless we also cache the original audio buffer (out of scope for this slice).
- Imports without a glaring (all in-tune) should disable the "Coach this" CTA with a friendly message.

**Done looks like:**

- User imports a melody, sees "consistent flat 3rd (-34¢, 4 instances)" in the glaring banner.
- Taps "Coach this melody" → coaching screen opens with the 3rd as the active focus.
- "Correct version" plays the right pitch, "Your version" plays their flat version, retry runs live scoring against the right pitch.
- "Find next mistake" advances to the next-worst note from the analysis.

**Open questions:**

- **Frame trace preservation** — is the constant-from-median trace good enough, or do we extend `ExtractedNote`? Decide at slice kickoff after looking at how `coaching.tsx` consumes traces.
- **Coachable-without-saving?** Recommend yes (lower friction); confirm with user during slice planning.

---

## Post-MVP backlog

### Live-record path (next major arc, resolved Q10: J2)

**Goal:** record a clip in-app, run it through the same offline pipeline.

**Why this is next:** the offline pipeline is already written to take any complete buffer. Live-record just adds a recording surface in front. Lessons from Slice 6 (native parity) directly inform recording UX (mic gain, clipping behavior, codec choices).

**UX:**

- In the Import modal, add a tab/segmented-control: **Upload** (current) / **Record** (new).
- Record tab shows a level meter, countdown-in toggle (3-2-1 click), optional metronome (uses the user-supplied tempo or a default), record button.
- Tap record → live PCM accumulates → tap stop → review surface shows up identical to upload.
- Save / discard / re-record options.

**Implementation:**

- Web: `MediaStreamAudioSourceNode` + `ScriptProcessorNode` (or AudioWorklet) → accumulating `Float32Array`.
- Native: `react-native-audio-api`'s `AudioRecorder` (already used by the live pitch detector) to write a buffer instead of streaming.
- New: `lib/analyze/decode.ts` extends to accept an in-memory `{pcm, sampleRate}` directly without re-decoding.
- New: `components/import/RecordTab.tsx` — record button, level meter, countdown.
- Permission flow: web `getUserMedia`; native handled by Expo permissions.
- Reuse: existing live-detector mic permission (already prompted on Practice's first session).

**Risks:**

- Mic gain varies wildly across devices. May need an auto-gain-control toggle.
- Clipping kills pitch detection. Surface a clipping warning in the level meter.
- Long recordings (5+ min) on mobile may exhaust memory. Cap at 600s like file imports; warn at 5 min.
- "Re-record" UX — accidentally discarding 3 minutes of singing is rage-inducing. Confirm dialog before overwriting.
- Click track audible to mic during recording. Either (a) require headphones for record mode, (b) stop the click as soon as the user starts singing, or (c) live-cancel the click via reference subtraction. (a) is simplest; (c) is overkill for v1.

**Done looks like:** user opens Import → Record → counts in → sings → stop → reviews → saves. Quality matches uploaded files.

**Open questions to resolve at slice kickoff:**

- Click track during recording: optional, default off, or required?
- Save raw PCM alongside the saved exercise for "Your version" playback in coaching? Storage cost of ~15 MB per minute of mono float32. AsyncStorage isn't the right home — would need expo-file-system. Defer unless coaching's median-only playback proves inadequate.
- Headphones requirement: mirror the existing `<HeadphonesModal>` gate, or stricter for record mode?

---

### Auto tonic detection (resolved Q3: deferred)

**Goal:** don't make the user pick the tonic. Pre-fill the form with a best-guess key; user overrides if wrong.

**Implementation:** Krumhansl-Schmuckler key profiles. Compute pitch-class histogram from the analysis's `ExtractedNote[]` (each note weighted by duration). Correlate against 24 canonical major/minor profiles. Pick the highest-correlation key.

- New: `lib/analyze/keyDetect.ts` — pure TS, ~50 lines.
- Modify: `components/import/ImportForm.tsx` — after first-pass auto-snap with a tentative tonic (or a pre-analysis pitch-histogram pass), pre-fill the form. User confirms or overrides.

**Risk:** ~80–90% accurate on clean monophonic vocals. Common failure: relative-minor confusion (C major mistaken for A minor). Form override is the escape hatch.

**Why post-MVP:** users tend to know their key. Only worth the complexity if real-world usage shows users frequently entering wrong tonics or asking "what key was that?"

---

### Vibrato-aware HMM segmentation

**Goal:** stop over-splitting sustained notes with wide vibrato.

**Implementation:** replace the stable-segment heuristic in `lib/scoring/align.ts` with a Viterbi over semitone states. Each frame picks a state; smoothing penalty discourages rapid state changes. Vibrato within ±50¢ of a state stays in that state.

**Risk:** changing `align.ts` affects live scoring too. Either:
- Add a vibrato-tolerant variant exposed only to offline analysis, or
- Migrate live scoring to the same algorithm and verify no regression on existing exercises.

**Why post-MVP:** the current heuristic-with-coherence-band works fine for warmup-style melodies. Wait for actual user complaints before re-engineering.

---

### SwiftF0 / CREPE pitch-tracker upgrade

**Goal:** handle noisier inputs (room recordings, less-clean stems) than pitchy can.

**Implementation:** SwiftF0 ONNX (95k params, 42× faster than CREPE) via `onnxruntime-react-native`. Works in Expo with prebuild + custom dev client. Bundles a ~400 KB ONNX model.

- New: `lib/analyze/framewise.swiftf0.ts` — alternative implementation of `runOfflinePitch`.
- Setting: opt-in toggle "Neural pitch tracker (more accurate, slower)" in user prefs.
- Validation: A/B against pitchy on the same fixtures.

**Why post-MVP:** pitchy's quality on clean stems is already good enough. SwiftF0 matters when users start importing live recordings (room reverb, handling noise). Likely correlates with the live-record slice — if recordings are noisy, this becomes immediately useful.

---

### Source separation (Demucs WASM)

**Goal:** accept polyphonic recordings (full songs with backing tracks) and isolate the vocal before analysis.

**Implementation:** Demucs WASM build. Adds a pre-decode step. Heavy: ~30 MB model, 10–30 seconds processing for a 2-minute clip.

**Why post-MVP:** out of scope for the project's "vocal warmup" framing. Worth revisiting only if users start asking for "import a song from Spotify"-style flows.

---

### Mic audio recording for true "your version" playback

**Goal:** when coaching against an imported melody, "Your version" plays back the actual recorded audio rather than a synthesized substitution.

**Implementation:** during analysis, save the original PCM buffer (or a compressed version) to expo-file-system. `coaching.tsx` and the `analysisToCoachingSession` adapter (Slice 8) use the recording when available, fall back to synthesis when not.

**Storage cost:** ~15 MB/min raw float32, ~1 MB/min as 64 kbps MP3. Compress on save.

**Why post-MVP:** depends on coaching adapter (Slice 8) being shipped first, and on user feedback that synthesized "Your version" feels inadequate.

---

## Future / aspirational

These haven't been scoped — listed for visibility, not commitment.

- **Vowel-shape diagram overlay** during practice for imported melodies, deriving vowel from spectral envelope per segment
- **Multi-key transposition** at import time — pre-generate the descriptor in N keys and let the user pick
- **Phrase markers** — let the user mark phrase boundaries during edit; engine plays a breath rest at each
- **Lyric-aware imports** — paste lyrics, auto-align syllables to detected notes
- **Voice-led chord inversions** in synthesized accompaniment for imports
- **Siren / glissando exercise type** as an explicit descriptor variant — the current pipeline forces every input into discrete notes; sirens want continuous-pitch analysis
- **Cloud sync** of imported exercises across devices (currently AsyncStorage-only, per-device)

---

## Conventions

- Each slice ships with: code + tests + ROADMAP.md status flip + (if user-facing) a manual smoke-test note in the slice summary
- Update this doc when a slice's open questions are resolved or its scope shifts
- When a slice ships, move its detail to a "Shipped" section here (eventually) and keep a one-liner summary for traceability
- New backlog ideas go into "Future / aspirational" until scoped into a slice with the structured fields above
- Keep `MELODY_IMPORT_PLAN.md` as the historical design contract — only edit if a resolved decision changes (rare)
