# Melody Import & Diagnosis — Implementation Plan

**Status:** Draft / pre-development. To be reviewed and approved before any code changes.

**Companion docs:** `CLAUDE.md` (stack overview), `ROADMAP.md` (shipped/next), `prd-guidance-for-vocal-app.md` (pedagogy).

---

## 0. Goal

Let a user import (or eventually live-record) a sung clip, declare the **target key/tonic**, and have the app:

1. Extract the **intended melody** as a sequence of notes snapped to that key
2. Surface a **per-note / per-scale-degree intonation diagnosis** (where the singer is consistently flat/sharp, where they're glaring-off)
3. Save the cleaned melody as a **first-class exercise** the user can practice in the existing engine — the whole song or any subset — with the existing accompaniment / guidance / scoring stack
4. Re-use the current pitch postprocessor and segmentation primitives end-to-end so we don't build a parallel pipeline

The same engine must, in a v2 slice, accept a **live-recorded buffer** (record → stop → analyze) without architectural change.

---

## 1. Vocabulary

| Term | Meaning in this plan |
|---|---|
| **Online / streaming** | Process a sliding window of mic frames as they arrive — what the live tracker does today |
| **Offline** | Process a complete buffer that already exists. The buffer can come from a file picker *or* from a live recording that has finished |
| **Stem** | A clean isolated vocal track. Source separation is **out of scope** — we assume the input is already mono vocal |
| **Tonic** | The "1" of the key, e.g. C in C major; supplied by the user as `"C4"`-style note name |
| **Scale degree (in code)** | Semitones from tonic (matches existing `ExerciseDescriptor.scaleDegrees`) |
| **Diatonic scale degree (in UX)** | "1, 2, 3, 4, 5, 6, 7" — what users hear and read |
| **Segment** | A contiguous run of clarity-passed pitch frames within a coherence band — the building block of note detection. Defined in `lib/scoring/align.ts` |
| **Extracted note** | One segment after key-snapping: `{ midi, scaleDegree, durationMs, centsOff, syllableHint }` |
| **ExerciseDescriptor** | The existing JSON schema in `lib/exercises/types.ts`. Source of truth for any practiceable melody |

---

## 2. User-facing flows

### 2.1 Primary flow: import → review → save → practice

1. User opens **Import** screen (entry point: new "+" or "Import" affordance on the Practice tab; placement TBD in §11)
2. User picks an audio file (web `<input type=file>`; native `expo-document-picker`)
3. User confirms / selects:
   - **Tonic** (e.g. `C4`) — required
   - **Mode** (major / minor / chromatic) — default major
   - **Tempo** — default auto-estimated, override allowed
   - **Voice part** — defaults from existing app setting; used for synthesized exercise's `voicePartRanges`
4. App runs the offline pipeline (§4–§7), shows a **review surface** with:
   - Waveform (optional v1.5) or simple time-axis strip
   - Detected notes overlaid as boxes labelled with diatonic degree + cents-off
   - Per-scale-degree summary table
   - "Most-glaring" headline diagnosis (re-uses `lib/coaching/diagnose.ts` shape)
5. User can:
   - **Trim** — drag handles to set the in/out points; everything outside is dropped
   - **Edit a note** — change snapped pitch, duration multiplier, or syllable for any single note (correct mis-segmentation)
   - **Drop a note** — remove a false segment
   - **Set syllables** — bulk apply a vowel/consonant pattern, or type per-note
6. User taps **Save as exercise**:
   - Names it (default: filename or "Imported melody — {date}")
   - Picks a default accompaniment preset
   - App writes a `StoredExtractedExercise` to AsyncStorage and adds it to the library
7. User lands on the new exercise in Practice with the standard Standard/Guided modes available

### 2.2 Subset practice

From the saved exercise's detail view:

- **Range selector** — pick a contiguous subrange of the pattern (e.g. notes 5–12)
- App constructs a transient sliced descriptor `{ ...stored, scaleDegrees: stored.scaleDegrees.slice(i,j), syllables: stored.syllables.slice(i,j) }` and runs Practice against that. No new persistence; selection is session-local.
- A "Save as new exercise" affordance lets the user pin a slice as its own entry.

### 2.3 Existing-flow integrations

- **Coaching screen** should be reachable from the review surface (post-import) and from any saved-exercise session, identical to existing built-in exercises.
- **Progress tab** lists imported exercises in the same per-exercise list as built-ins, distinguished only by an "imported" tag.
- **Routine** (Today's routine) — imported exercises selectable as routine items.

---

## 3. Data model additions

### 3.1 Reuse, don't fork

`ExerciseDescriptor` is already key-independent (`scaleDegrees` are semitones from tonic). An extracted melody fits this schema natively. **Do not** introduce a parallel "imported melody" type.

### 3.2 The two real schema problems

**Problem A — per-note durations.** The current schema has one `noteValue` for the whole exercise. Imported melodies will have varying durations. Two options:

- **Option A1 (preferred): extend the schema with an optional `durations` field.**
  ```ts
  // in lib/exercises/types.ts
  export interface ExerciseDescriptor {
    // ... existing fields ...
    /** Per-note duration in beats. When present, takes precedence over noteValue.
     *  Length must equal scaleDegrees.length. Beat = quarter note at descriptor tempo. */
    durations?: number[];
  }
  ```
  Update `lib/exercises/engine.ts` to honor `durations` when present, fall back to `noteValue` when absent. All 8 existing JSONs continue to work unchanged. **This is the only invasive engine change in the whole plan** — worth doing once cleanly.

- **Option A2: quantize to uniform `noteValue`.** Pick the median note duration, snap everything to it, lose rhythmic fidelity. Cheap but produces robot-march renderings of any melody with varied rhythm. Not recommended for v1; acceptable as a fallback if A1 is non-trivial.

**Decision (Q1, resolved):** A1. Tracked as Slice 1 below.

**Problem B — storage path.** Existing exercises are bundled JSON imported by `lib/exercises/library.ts`. We can't write new bundle files at runtime.

- **Solution:** add a runtime store `vocal-training:exercises:user:v1` in AsyncStorage holding `StoredExtractedExercise[]`. Extend `library.ts` to merge bundled + user-stored at lookup time:
  ```ts
  // lib/exercises/library.ts (refactor)
  export function getAllExercises(): ExerciseDescriptor[] { ... merges built-in + storage ... }
  export async function saveUserExercise(d: ExerciseDescriptor): Promise<void> { ... }
  export async function deleteUserExercise(id: string): Promise<void> { ... }
  ```
  Document the "JSON descriptors are SoT" convention extension: bundled JSON is SoT for built-ins; AsyncStorage is SoT for user-imported. Loaders return `ExerciseDescriptor` either way.

### 3.3 New analysis types

```ts
// lib/analyze/types.ts
export interface ExtractedNote {
  startMs: number;
  endMs: number;
  medianHz: number;
  medianMidiContinuous: number;     // pre-snap, decimal MIDI
  snappedMidi: number;              // post key-snap
  scaleDegree: number;              // semitones from tonic, can be negative or >11
  centsOff: number;                 // signed deviation: snappedMidi vs medianMidiContinuous
  durationBeats: number;            // computed from tempo
  syllable?: string;                // user-editable; default empty
  framesUsed: number;               // for confidence display
}

export interface ScaleDegreeStats {
  scaleDegree: number;              // 0..11
  diatonicLabel: string;            // "3", "♭7", etc — derived from mode
  occurrences: number;
  meanCentsOff: number;
  hitRatePct: number;               // % within ±25¢
  variance: number;
}

export interface MelodyAnalysis {
  notes: ExtractedNote[];
  perScaleDegree: ScaleDegreeStats[];
  glaring: {                        // mirrors lib/coaching/diagnose.ts shape
    kind: "consistent" | "outlier";
    scaleDegree?: number;
    noteIndex?: number;
    summary: string;                // "You're consistently flat on the 3rd (-34¢ across 4 instances)"
  } | null;
  tonic: string;
  mode: "major" | "minor" | "chromatic";
  tempoBpm: number;
  durationSec: number;
}
```

### 3.4 Persisted shape

```ts
// lib/exercises/userStore.ts
export interface StoredExtractedExercise {
  descriptor: ExerciseDescriptor;   // valid against the existing schema
  source: {
    importedAt: number;             // epoch ms
    sourceFilename?: string;
    durationSec: number;
  };
  analysis?: MelodyAnalysis;        // keep so the diagnosis is replayable later
}
```

---

## 4. Pipeline architecture

```
                            ┌─────────────────────────────────────────────┐
                            │                                             │
File picker / live record ──▶│  decode → Float32Array PCM @ sampleRate    │  Stage A: Ingestion
                            │                                             │
                            └────────────────────┬────────────────────────┘
                                                 ▼
                            ┌─────────────────────────────────────────────┐
                            │  framewise pitchy + RMS → raw frames        │  Stage B: Pitch tracking
                            │  → PitchPostprocessor → PitchSample[]        │     (reuses lib/pitch/postprocess.ts)
                            └────────────────────┬────────────────────────┘
                                                 ▼
                            ┌─────────────────────────────────────────────┐
                            │  segment() + filterSegments()                │  Stage C: Segmentation
                            │  (reuses lib/scoring/align.ts primitives)    │
                            └────────────────────┬────────────────────────┘
                                                 ▼
                            ┌─────────────────────────────────────────────┐
                            │  snap each segment to in-key semitone        │  Stage D: Key snapping
                            │  + voice-leading tiebreak                    │
                            └────────────────────┬────────────────────────┘
                                                 ▼
                            ┌─────────────────────────────────────────────┐
                            │  per-scale-degree aggregation                │  Stage E: Diagnosis
                            │  + most-glaring rule (reuses diagnose shape) │
                            └────────────────────┬────────────────────────┘
                                                 ▼
                            ┌─────────────────────────────────────────────┐
                            │  ExtractedNote[] → ExerciseDescriptor        │  Stage F: Synthesis
                            └────────────────────┬────────────────────────┘
                                                 ▼
                            ┌─────────────────────────────────────────────┐
                            │  Review UI → Save → user library             │  Stage G/H: UX + persist
                            └─────────────────────────────────────────────┘
```

### 4.1 Module layout

```
lib/analyze/
  types.ts          # ExtractedNote, MelodyAnalysis, ScaleDegreeStats
  decode.ts         # decodeFile(file) → { pcm: Float32Array, sampleRate: number }
                    #   — platform split: decode.web.ts uses AudioContext.decodeAudioData
                    #     decode.native.ts uses react-native-audio-api decodeAudioData
  framewise.ts      # runOfflinePitch(pcm, sampleRate, opts) → PitchSample[]
                    #   — drives pitchy in a tight loop, feeds PitchPostprocessor,
                    #     emits the same PitchSample[] the live tracker produces
  segment.ts        # extractNotes(samples, opts) → Segment[] using align.ts primitives
                    #   — re-exports segment+filterSegments with a config that
                    #     does NOT match against expected targets
  keysnap.ts        # snapToKey(segments, tonicMidi, mode) → ExtractedNote[]
                    #   — pure, no audio dependencies
  diagnose.ts       # diagnoseMelody(notes, mode) → MelodyAnalysis
                    #   — calls into lib/coaching/diagnose.ts for shared "most-glaring" logic
  synth.ts          # toExerciseDescriptor(notes, opts) → ExerciseDescriptor
                    #   — generates id, default range, scaleDegrees, durations
  index.ts          # re-exports + analyzeFile(file, params) top-level orchestrator
```

`lib/exercises/userStore.ts` for AsyncStorage-backed user library (§3.2).

`lib/exercises/library.ts` updated to merge built-in + user.

`lib/exercises/engine.ts` updated to honor `durations` (§3.2 problem A).

---

## 5. Stage detail

### 5.1 Stage A — Ingestion

**Web (`lib/analyze/decode.web.ts`)**:
```ts
const arrBuf = await file.arrayBuffer();
const ac = new AudioContext();
const decoded = await ac.decodeAudioData(arrBuf);
const pcm = decoded.numberOfChannels === 1
  ? decoded.getChannelData(0)
  : downmixToMono(decoded);
return { pcm, sampleRate: decoded.sampleRate };
```

**Native (`lib/analyze/decode.native.ts`)** uses `react-native-audio-api`'s `AudioContext.decodeAudioData` (already in the stack at `0.11.7`). Same shape. File URIs from `expo-document-picker` need to be read via `expo-file-system` first to get an ArrayBuffer.

**Mono downmix** — average L+R. No high-pass/low-pass filtering at this stage.

**Length cap** — reject files >10 minutes for v1 (UX guardrail; pipeline runs per-frame so it's not a hard limit).

### 5.2 Stage B — Offline framewise pitch tracking

Drive pitchy directly over the PCM (don't reuse `detector.web.ts`/`detector.native.ts` — those wrap live mic streams). The shared logic is the postprocessor.

```ts
// lib/analyze/framewise.ts
import { PitchDetector as Pitchy } from "pitchy";
import { PitchPostprocessor } from "../pitch/postprocess";

const FRAME_SIZE = 2048;
const HOP_SIZE = 441;   // ~10 ms at 44.1 kHz

export function runOfflinePitch(
  pcm: Float32Array,
  sampleRate: number,
  opts?: { clarityThreshold?: number; octaveJumpFrames?: number }
): PitchSample[] {
  const pitchy = Pitchy.forFloat32Array(FRAME_SIZE);
  const post = new PitchPostprocessor(
    opts?.clarityThreshold ?? 0.85,
    5,
    opts?.octaveJumpFrames ?? 3,
  );
  post.setStartTime(0);

  const samples: PitchSample[] = [];
  for (let i = 0; i + FRAME_SIZE <= pcm.length; i += HOP_SIZE) {
    const window = pcm.subarray(i, i + FRAME_SIZE);
    const [hz, clarity] = pitchy.findPitch(window, sampleRate);
    const rms = computeRms(window);
    const tMs = (i / sampleRate) * 1000;
    samples.push(post.push(hz ?? 0, clarity, rms, tMs));
  }
  return samples;
}
```

**Critical correctness notes:**

- `pitchy.findPitch` returns `[hz, clarity]`. `hz` is `0`/`NaN` when no pitch detected — `PitchPostprocessor.push` handles this.
- Frame size 2048 + hop 441 at 44.1 kHz mirrors the live detector's effective resolution. If input is 22 kHz, scale hop accordingly to keep ~10 ms.
- **No RMS noise gate at this stage.** The live system gates against piano spillover; an offline file is assumed to be a clean stem. We rely on pitchy's clarity score alone. If we later analyze noisy room recordings, add a configurable RMS gate at the segment-filter step, not here.
- **Resampling:** if input sample rate is exotic (e.g. 48 kHz from phone mics, 22.05 kHz from compressed audio), pass it straight to `pitchy.findPitch(window, sampleRate)`. Pitchy handles it. Do not resample the PCM.

### 5.3 Stage C — Segmentation

Use `segment()` and `filterSegments()` from `lib/scoring/align.ts` directly. They're pure and only require a `PitchSample[]` plus a config.

```ts
// lib/analyze/segment.ts
import { segment, filterSegments } from "../scoring/align";

export function extractSegments(samples: PitchSample[]): Segment[] {
  const cfg = {
    segMinFrames: 8,             // ~80 ms (offline can be stricter than live)
    segMinDurationMs: 100,       // bump from live default of 80 ms
    pitchCoherenceCents: 80,     // slightly looser for vibrato
    silenceGapMs: 120,
    falseStartMaxDurationMs: 180,
    falseStartNeighborGapMs: 150,
  };
  const raw = segment(samples, /*leadInEndMs=*/ 0, cfg);
  return filterSegments(raw, cfg);
}
```

**Why these defaults differ from live scoring:**
- Live scoring already knows the expected pattern, so it can rescue ambiguous segments via DP. Offline has no such anchor — needs slightly stricter minimums to avoid vibrato-induced micro-segments masquerading as separate notes.
- `pitchCoherenceCents: 80` (vs. 75 live) gives sustained notes with vibrato a little more room before splitting.

**Skip the DP-match step entirely.** Offline extraction emits the filtered segments as the inferred melody. There is no "expected" pattern.

**Open question:** should mid-segment legato slurs (>200¢ frame jump) split into two notes, as `align.ts` currently does? **Default: yes** — preserves musical phrases like "C... D" sung as a slur. Configurable per-import if the user reports over-splitting.

### 5.4 Stage D — Key snapping

```ts
// lib/analyze/keysnap.ts
const MAJOR_PCS = [0, 2, 4, 5, 7, 9, 11];
const MINOR_PCS = [0, 2, 3, 5, 7, 8, 10];   // natural minor
const CHROMATIC = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

export function snapToKey(
  segments: Segment[],
  tonicMidi: number,
  mode: "major" | "minor" | "chromatic",
  opts?: { outOfKeyToleranceCents?: number; tempoBpm: number }
): ExtractedNote[] {
  const allowed = mode === "major" ? MAJOR_PCS : mode === "minor" ? MINOR_PCS : CHROMATIC;
  const tolerance = opts?.outOfKeyToleranceCents ?? 70;

  return segments.map((seg, i) => {
    const continuousMidi = seg.medianPitchMidi;
    const inKeySnap = nearestInKeyMidi(continuousMidi, tonicMidi, allowed);
    const inKeyDistCents = Math.abs(continuousMidi - inKeySnap) * 100;

    // Out-of-key escape: if too far from any in-key option, snap to nearest semitone (chromatic)
    const snapped = inKeyDistCents > tolerance ? Math.round(continuousMidi) : inKeySnap;

    // Voice-leading tiebreak (apply on second pass once we know neighbors)
    const centsOff = (continuousMidi - snapped) * 100;
    const durationMs = seg.endMs - seg.startMs;
    const durationBeats = (durationMs / 1000) * (opts.tempoBpm / 60);

    return {
      startMs: seg.startMs,
      endMs: seg.endMs,
      medianHz: midiToHz(continuousMidi),
      medianMidiContinuous: continuousMidi,
      snappedMidi: snapped,
      scaleDegree: snapped - tonicMidi,
      centsOff,
      durationBeats,
      framesUsed: seg.frames.length,
    };
  });
}
```

**Voice-leading tiebreak (v1 scope, resolved Q4):** when two in-key snap candidates are within ~30¢ of the continuous pitch, pick the one closer to the *previous snapped* note. Implemented as a second pass over the snapped sequence. Reduces zigzag artifacts on adjacent notes that sit on the boundary between two scale tones (e.g. between scale degrees 6 and ♭7 in natural minor).

**Octave handling:** `nearestInKeyMidi` operates on absolute MIDI, so octave is naturally preserved. A user singing low and the snap producing `scaleDegree = -5` (the 5th below tonic) is fine — `ExerciseDescriptor.scaleDegrees` allows arbitrary integers.

**Confidence:** `framesUsed` lets the UI dim low-confidence notes (<5 frames after filtering). The user can drop or hand-correct them in review.

### 5.5 Stage E — Diagnosis

```ts
// lib/analyze/diagnose.ts
export function diagnoseMelody(
  notes: ExtractedNote[],
  mode: "major" | "minor" | "chromatic"
): MelodyAnalysis {
  // Group by pitch class within the octave for "scale degree" stats
  const byPc = new Map<number, ExtractedNote[]>();
  for (const n of notes) {
    const pc = ((n.scaleDegree % 12) + 12) % 12;
    if (!byPc.has(pc)) byPc.set(pc, []);
    byPc.get(pc)!.push(n);
  }

  const perScaleDegree: ScaleDegreeStats[] = [...byPc.entries()].map(([pc, ns]) => ({
    scaleDegree: pc,
    diatonicLabel: pcToDiatonicLabel(pc, mode),
    occurrences: ns.length,
    meanCentsOff: mean(ns.map(n => n.centsOff)),
    hitRatePct: 100 * ns.filter(n => Math.abs(n.centsOff) <= 25).length / ns.length,
    variance: variance(ns.map(n => n.centsOff)),
  }));

  // Re-use the most-glaring rule from coaching/diagnose.ts
  const glaring = pickGlaring(perScaleDegree, notes);

  return {
    notes,
    perScaleDegree,
    glaring,
    tonic: opts.tonic,
    mode,
    tempoBpm: opts.tempoBpm,
    durationSec: notes.length ? notes[notes.length - 1]!.endMs / 1000 : 0,
  };
}
```

**`pickGlaring` rule** mirrors `lib/coaching/diagnose.ts`:

- **Consistent error:** scale degree with mean |centsOff| > 20¢ AND occurrences ≥ 2 AND hitRate < 60% → "consistent flat/sharp on degree X"
- **Outlier:** the single note with largest |centsOff| if no consistent error exists
- **Null** if everything is within ±15¢ — congratulate the user

### 5.6 Stage F — Synthesis

```ts
// lib/analyze/synth.ts
export function toExerciseDescriptor(
  analysis: MelodyAnalysis,
  opts: {
    name: string;
    voicePart: VoicePart;
    syllables?: string[];        // length === notes.length, or single value to repeat, or undefined
    accompaniment?: AccompanimentSpec;
  }
): ExerciseDescriptor {
  const id = makeId(opts.name);
  const scaleDegrees = analysis.notes.map(n => n.scaleDegree);
  const durations = analysis.notes.map(n => n.durationBeats);
  const syllables = expandSyllables(opts.syllables, scaleDegrees.length);

  // Default voice range = single starting tonic (the imported one), step 1
  const range: KeyRange = {
    lowest: midiToNoteName(noteNameToMidi(analysis.tonic)),
    highest: midiToNoteName(noteNameToMidi(analysis.tonic) + 5), // 6 keys up
    step: 1,
  };

  return {
    id,
    name: opts.name,
    pedagogy: `Imported melody. Tonic ${analysis.tonic}, ${analysis.mode}.`,
    scaleDegrees,
    syllables,
    noteValue: "8n",                    // ignored when durations is set; kept for compat
    tempo: Math.round(analysis.tempoBpm),
    voicePartRanges: { [opts.voicePart]: range },
    accompaniment: opts.accompaniment ?? defaultAccompanimentForMode(analysis),
    direction: "ascending",
    tags: ["imported"],
    durations,                          // requires §3.2 schema extension
  };
}
```

**Tempo estimation** (when not user-supplied): take the median note duration in seconds, assume it's an eighth note → `bpm = 60 / (median * 2)`. Round to the nearest 4 BPM. If the resulting BPM is outside `[60, 180]`, default to 88 and surface a warning.

**Mode-aware accompaniment default (resolved Q9: I2 + I3):**
- `major` → `ACCOMPANIMENT_PRESETS.classical` (block I + V7 cue)
- `minor` → `ACCOMPANIMENT_PRESETS.classical` (still works in minor; preset voicing is built from descriptor tonic + mode at runtime)
- `chromatic` OR a major/minor analysis where `>30%` of notes hit the chromatic-fallback escape → `ACCOMPANIMENT_PRESETS.drone` (open-fifth drone, no cue — the safest choice when the melody doesn't respect a key)

The save sheet exposes this as a dropdown pre-filled with the mode-aware default; the user can override before saving (I3).

**Range default:** 6 keys up from the original tonic (matches existing exercises like the five-note scale). User can edit on save.

---

## 6. Reuse map

| Existing file | Role | Modification |
|---|---|---|
| `lib/pitch/postprocess.ts` | Clarity gate, median, octave-jump | None — used as-is |
| `lib/scoring/align.ts` | `segment()`, `filterSegments()` | None — used as-is via re-export |
| `lib/coaching/diagnose.ts` | Most-glaring rule | Extract pure helper into `lib/coaching/glaring.ts`; reuse from analyze |
| `lib/exercises/types.ts` | `ExerciseDescriptor` | **Add optional `durations: number[]`** |
| `lib/exercises/engine.ts` | Plan exercise → events | **Honor `durations` when present** |
| `lib/exercises/library.ts` | Built-in lookup | **Refactor: merge built-in + user-store** |
| `lib/exercises/music.ts` | `noteToMidi`, `midiToNote`, etc | None — reuse |
| `lib/progress/storage.ts` | AsyncStorage patterns | Pattern reuse for `userStore.ts` |
| `app/(tabs)/index.tsx` | Practice screen | Picks up imported exercises automatically once `library.ts` merges |
| `app/(tabs)/coaching.tsx` | Coaching | Works against any descriptor — no change |
| `app/(tabs)/explore.tsx` | Progress | Imported exercises appear automatically |

---

## 7. UI surfaces

### 7.1 Import surface (resolved Q2: B2 + B3) — modal off Practice

Primary entry: a "+" affordance next to the exercise picker on Practice (`app/(tabs)/index.tsx`) opens an import modal layered over the Practice screen. On save, the modal dismisses and Practice's selected exercise updates to the new import.

Secondary entry: an "Add imported melody" row at the top of the Progress tab's exercise list (`app/(tabs)/explore.tsx`) opens the same modal — discoverability backstop for users browsing their library.

Both routes mount the same `<ImportModal>`. Expected components:

- `ImportPicker` — file input + tonic/mode/voice/tempo form
- `MelodyReview` — the editable timeline + per-degree stats
- `MelodyEditor` — per-note edit panel
- `SaveSheet` — name + accompaniment selection

### 7.2 New components

```
components/import/
  ImportForm.tsx          # tonic/mode/voice/tempo inputs
  MelodyTimeline.tsx      # horizontal note strip, click-to-select
  NoteEditPanel.tsx       # selected-note edit form
  PerDegreeTable.tsx      # mean cents-off, hit rate, occurrences per degree
  GlaringHeadline.tsx     # one-line summary banner (re-skin of CoachingBanner)
  RangeSlider.tsx         # for subset practice
  ImportProgressOverlay.tsx
```

Reuse existing `NoteResultsStrip`, `TuningMeter`, etc. wherever they fit.

### 7.3 Practice & Progress integration (resolved Q5, Q6, Q7)

**Practice flow unchanged.** Once the descriptor is saved and `library.ts` merges, the existing exercise picker shows imported items with an "Imported" pill next to the name.

**Imported-exercise detail view (Q7: G1)** lives inside Progress's existing per-exercise expanded card (`app/(tabs)/explore.tsx`). Built-in exercises keep their current expanded content. Imported exercises additionally surface:

- **Timeline strip** with note names per Q5 (`D5`, `E5`, `F5`...) — visualizes the extracted melody chronologically
- **Per-scale-degree stats table** with diatonic labels per Q5 (`3rd: -34¢ avg, 4 occurrences, 50% in-tune`) — the diagnosis surface
- **Range slider (Q6: F3)** for subset practice — session-only by default
- **Edit / delete** affordances
- **"Save slice as new exercise"** — only visible when a subrange is selected (Q6 opt-in pinning)
- **"Coach this melody"** deep-link (post-MVP, Slice 8)

**Subset practice (Q6: F3):** the user picks a range with the slider, taps Practice, and a transient sliced descriptor runs (no persistence). Pinning a slice is explicit via "Save slice as new exercise" — keeps the library lean by default.

---

## 8. Tunable parameters & defaults

| Param | Default | Source | Notes |
|---|---|---|---|
| `FRAME_SIZE` | 2048 | framewise.ts | Mirrors live |
| `HOP_SIZE` | 441 (~10 ms @ 44.1 kHz) | framewise.ts | Scale with sampleRate |
| Clarity threshold | 0.85 | postprocessor | Same as live default |
| `octaveJumpFrames` | 3 | postprocessor | Per-import override |
| `segMinDurationMs` | 100 | analyze/segment | +20 ms over live |
| `pitchCoherenceCents` | 80 | analyze/segment | +5 over live (vibrato) |
| `silenceGapMs` | 120 | analyze/segment | -30 ms (offline = stricter) |
| `outOfKeyToleranceCents` | 70 | keysnap | Beyond → snap chromatic |
| `confidenceMinFrames` | 5 | UI | Below this, dim the note |
| `tempoEstimationDefault` | 88 BPM | synth | Fallback when out of range |
| `defaultMode` | major | UI | User can override |
| `maxFileDurationSec` | 600 | decode | UX guardrail |

All thresholds belong in `lib/analyze/config.ts` so they're tweakable in one place.

---

## 9. Edge cases & failure modes

| Case | Behavior |
|---|---|
| File is silent / mostly noise | Stage C produces zero segments → review screen shows empty state with message "No singing detected" |
| File is polyphonic / has accompaniment | Out of scope. Surface a warning: "For best results, import a clean isolated vocal." Don't refuse — pitchy will still produce something for the loudest pitch |
| User-supplied tonic clashes badly with detected pitches | Most snapping ends up "out of key" → chromatic fallback dominates → result is still useful, but show a banner: "Tonic mismatch suspected — verify or auto-detect" |
| Vibrato wide enough to split a note | Accept some over-splitting in v1; user merges in editor. Future: implement vibrato-aware HMM |
| Two segments, same pitch, < 60 ms gap (breath/restrike) | Merge in a post-pass if pitch-diff < 50¢ AND gap < 60ms. Configurable |
| Detected pitches cluster < 5 distinct semitones | Likely a single sustained note or speech-like prosody. Surface "low pitch variation" warning |
| Pitchy octave latching (male voice ≥ A3) | Postprocessor's octave-jump constraint catches most. Keep an eye on extracted `medianMidiContinuous` outliers — flag any segment whose median is >12 st from neighbors |
| File can't be decoded | `decodeFile` rejects with "Unsupported format". Show user the supported list (mp3/wav/m4a/ogg/flac on web; native subset depends on `react-native-audio-api`) |
| Web sampleRate ≠ 44.1 kHz | Pitchy handles arbitrary sample rates. Adjust `HOP_SIZE` to keep ~10 ms |
| File is stereo with hard-panned vocal | Mono downmix preserves the vocal but at -3 dB. Acceptable. Document |
| User edits a note's pitch outside the original key | Allow it — the snap-to-key is a guide, not a constraint |
| Native: large file (~100 MB WAV) blocks UI | Run pipeline off the JS thread? Not trivial in RN. v1 ships with a progress overlay and accepts up to 10 min. v2: Web Workers on web; threaded ONNX on native if we move off pitchy |

---

## 10. Testing strategy

### 10.1 Unit tests

- `keysnap.ts` — synthetic `Segment[]` with known pitches → assert correct scale-degree assignment, especially edge cases (exact ¼-tone, just-out-of-key, octave wraparound)
- `synth.ts` — round-trip `MelodyAnalysis` → `ExerciseDescriptor` → engine plan → assert event count and pitch sequence
- `diagnose.ts` — synthetic notes with planted "consistent flat 3rd" → assert glaring detection
- `library.ts` — built-in + user merge, dedup by id, delete

### 10.2 Golden-file integration tests

Bundle 3 short reference WAVs in `assets/test-fixtures/`:
- `clean-major-scale.wav` (synthesized vocal singing C major scale on `mee`)
- `slightly-flat-third.wav` (same, with the 3rd 30¢ flat)
- `glaring-wrong-fifth.wav` (5th sung as ♭5 by ~80¢)

Pipeline runs end-to-end, asserts the diagnosis matches expected (with tolerance).

### 10.3 Manual QA fixtures

A folder `qa-recordings/` (gitignored) where the user can drop personal singing samples and run them through. Build a "verbose mode" toggle on the Import screen that prints all intermediate stages (raw frames, segments, snapped notes) to console for debugging.

### 10.4 Engine regression

Add a test that runs all 8 existing exercises through `engine.ts` with the new `durations`-aware code path, asserting the event sequence is identical to the pre-refactor output. Catches Problem A regressions.

---

## 11. Slicing for delivery

Each slice is independently shippable. Slices 1–4 are the MVP; 5–8 are polish.

### Slice 1 — Schema extension (foundation)
- Add `durations?: number[]` to `ExerciseDescriptor`
- Update `engine.ts` to honor it, falling back to `noteValue`
- Engine regression test (§10.4)
- **Ships with:** zero user-facing change. Just opens the door.

### Slice 2 — Analyze pipeline (no UI)
- `lib/analyze/{decode,framewise,segment,keysnap,diagnose,synth,types,config}.ts`
- Unit + golden tests (§10.1, 10.2)
- Expose `analyzeFile` from `lib/analyze/index.ts`
- **Ships with:** internal capability only. Hand-test in a debug screen or REPL.

### Slice 3 — Import screen + review (web first)
- `app/(tabs)/import.tsx` (or modal — decide in §12)
- `components/import/*` — picker form, timeline, per-degree table, glaring banner
- Connects file → analyze → review → save → user library
- Web only initially (file picker semantics simpler)
- **Ships with:** fully functional import on web. iOS in slice 6.

### Slice 4 — User library + Practice integration
- `lib/exercises/userStore.ts` (AsyncStorage)
- `library.ts` merges built-in + user
- Imported exercises appear in Practice picker, Progress list, Routine selector
- **Ships with:** full end-to-end happy path. User can import, save, practice.

### Slice 5 — Subset practice
- Range slider on the imported-exercise detail view
- Slice descriptor at session start
- "Save as new exercise" affordance for a slice
- **Ships with:** the "practice the chorus" use case.

### Slice 6 — Native parity
- `decode.native.ts` using `react-native-audio-api`
- `expo-document-picker` integration
- **Ships with:** iOS works. Validate after the iOS dev build (`Slice A` from ROADMAP) is in place.

### Slice 7 — Note editor + trim
- `NoteEditPanel` for per-note edits (pitch, duration, syllable, drop)
- Trim handles on the timeline
- Re-run synthesis after edits
- **Ships with:** users can correct mis-detection.

### Slice 8 — Coaching deep-link
- "Coach this melody" CTA from the review surface jumps into coaching against the imported exercise's worst note
- **Ships with:** parity with built-in exercises' coaching flow.

### Future slices (out of MVP — ordered by intended priority)
- **Live-record path (Q10: J2 — first post-MVP slice)** — record → stop → reuse the same offline pipeline. Add UX surface (record button, level monitor, save/discard prompt). Validation lessons from the file path inform the design
- **Auto tonic detection (Q3: deferred)** — Krumhansl-Schmuckler key profiles. Lower priority; users have shown willingness to type a tonic
- **Vibrato-aware HMM segmentation** — only if v1 over-splits sustained notes in real usage
- **SwiftF0 / CREPE upgrade** — for noisy stems where pitchy under-performs
- **Source separation (Demucs WASM)** — for non-stem inputs (currently out of scope)

---

## 12. Resolved decisions

All ten open questions from the prior draft have been resolved with the user. Earlier sections have been updated to reflect these choices; this table is the canonical index.

| # | Decision | Summary | Detail anchor |
|---|---|---|---|
| Q1 | A1 | Add optional `durations: number[]` to `ExerciseDescriptor`. Engine honors when present; falls back to `noteValue`. | §3.2, §5.6, §11 Slice 1 |
| Q2 | B2 + B3 | Primary "+" affordance opens import modal from Practice; quiet "Add imported melody" entry on Progress's exercise list. | §7.1 |
| Q3 | C1 | Manual tonic + mode entry. No auto-detect for MVP. Krumhansl-Schmuckler deferred. | §5.4, §11 Future |
| Q4 | D1 | Voice-leading tiebreak ships in v1: when two in-key candidates are within ~30¢, pick the one closer to the previous snapped note. | §5.4 |
| Q5 | E3 | Per-degree stats use diatonic labels (`3rd`, `♭7`); note timeline uses note names (`D5`, `E5`). Each surface uses what reads best for its job. | §5.5, §7.3 |
| Q6 | F3 | Subset slicing is session-only by default. Opt-in "Save as new exercise" affordance lets users pin slices they want to keep. | §7.3, §11 Slice 5 |
| Q7 | G1 | Imported-exercise detail extends Progress's existing expanded per-exercise card with timeline + analysis stats + range slider + edit/delete. Built-in cards unchanged. | §7.3 |
| Q8 | H1 | `durations` are in beats, relative to descriptor `tempo`. Conversion at extraction: `durationBeats = (durationMs / 1000) * (tempoBpm / 60)`. | §5.6 |
| Q9 | I2 + I3 | Save sheet exposes accompaniment dropdown, pre-filled by mode-aware default (major/minor → `classical`; chromatic or >30% out-of-key → `drone`). User can override. | §5.6, §7.3 |
| Q10 | J2 | File-import in MVP. Live-record deferred to first post-MVP slice once file path is validated on real recordings. | §11 Future |

---

## 13. Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| pitchy mis-tracks low male voices on imports | Medium | Postprocessor + octave-snap-against-target already mitigate. v2 escape: SwiftF0 ONNX |
| Native decode quirks (codec gaps in `react-native-audio-api`) | Medium | Restrict native imports to wav/mp3/m4a in v1; document |
| `durations` schema change breaks built-in JSON | Low | Field is optional; engine falls back. Regression test guards |
| AsyncStorage user library balloons over time | Low | Add delete from Progress in the same UI as built-in session prune |
| User confusion: imported exercise doesn't sound like the recording | Medium | Synthesized playback uses piano, not voice; surface this in review ("Listen — this is your melody on piano. Does this match what you intended?") |
| Vibrato-induced over-segmentation makes review tedious | Medium | Tighter `segMinDurationMs` + post-merge same-pitch neighbors. Editor lets users fix. Watch in QA |
| Mis-detected tempo produces weird durations | High | Always show estimated tempo on save with an editable field. Default to 88 if out of range |

---

## 14. Definition of done (MVP = slices 1–4)

- A user on web can:
  - Pick a clean vocal WAV/MP3
  - Set tonic + mode + voice + tempo (or accept defaults)
  - See an extracted melody with per-note diagnosis
  - Save as a named exercise
  - Find it in the Practice picker
  - Run a Standard or Guided session against it with all existing features (accompaniment, scoring, coaching)
  - See it in Progress
- The 8 built-in exercises behave identically to before (engine regression test passes)
- The pipeline is fully deterministic for a given input — running twice yields byte-identical `ExerciseDescriptor`
- Unit + golden tests in §10 pass

Native parity (slice 6) is done-done. MVP can ship web-only.

---

## 15. Living references

- `prd-guidance-for-vocal-app.md` §4 (pitch detection caveats), §3 (exercise table conventions)
- `CLAUDE.md` — stack, conventions, testing surface
- `ROADMAP.md` — slice tracking. Each slice above should land as a roadmap entry once approved.
- Research notes (in conversation): `pYIN` / `CREPE` / `SwiftF0` / `Basic Pitch` comparison, intonation cents thresholds
