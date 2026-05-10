# Coaching Redesign Plan

**Status:** Draft / pre-development. To be reviewed and approved before any code changes.

**Companion docs:**
- `vocal-tips-research.md` — the research library this plan operationalizes (Sections 1–4 are the spine of the coaching engine)
- `CLAUDE.md` — stack notes, conventions
- `ROADMAP.md` — high-level cross-app tracker
- `MELODY_IMPORT_PLAN.md` — pattern for plan structure / decision tables

---

## 0. Status

The current coaching feature is being **cut and replaced**. Today's coaching:

- Picks the worst-average note from a session via `lib/coaching/diagnose.ts`
- Asks the user to retry that single note with live mic and "pass" gating
- Iterates via "Find next mistake"

**Why it's failing:** the redo-this-note framing isn't pedagogically what users (or real voice teachers) need. A teacher doesn't say "sing this note again until it's right" — they say "you're flat on high notes because you're collapsing your support; here's what to try." The retry interaction also breaks the post-session flow on small screens and isn't well-served by a single isolated note.

**The replacement:** an algorithmic diagnostic engine that surfaces the *most consistent* issue from a session, looks up the matching symptom + likely causes from `vocal-tips-research.md`, and serves the user **read-only advice** (with voice-teacher-style A/B playback so they can hear the issue). Saveable diagnoses; rotating generic tips when no consistent issue trips.

---

## 1. Goal

After any session (live, historical, or imported), one tap on **Coach this** opens a screen that:

1. Names the **single most consistent pitch issue** detected in plain English with concrete evidence ("Flat on high notes — −34¢ across 6 of 8 high notes")
2. Lets the user **hear** the contrast between what they sang and the target — voice-teacher-style A/B (note alone, phrase alone, both versions)
3. Surfaces **2–3 candidate causes** from the research library (research-honest about ambiguity — Q1 resolved B), each with audible signs, why pitch suffers, and a fix tip
4. Lets the user **bookmark** the diagnosis + cards as a single combined snapshot for later reference
5. When no consistent issue trips, serves a **rotating generic tip** from research §3 (Q2 resolved)
6. Provides a **Saved coaching tips** screen reachable from the coaching surface and from Progress (Q10 resolved)

The screen is read-only — there is no retry, no live mic, no "pass" gating, no "find next mistake" iteration.

---

## 2. Vocabulary

| Term | Meaning |
|---|---|
| **Detector** | Pure-TS function that reads session data and emits 0+ `Diagnosis` records when its symptom pattern is found |
| **Diagnosis** | A single detector firing: detector id, severity, consistency score, observation count, evidence string, focus note pointer |
| **AdviceCard** | One unit in the card library — `symptom` / `cause` / `generic`. Title + soundsLike + whyPitchSuffers + fixTip + tags |
| **DetectorMapping** | Connects a detectorId to one symptom card + ordered candidate cause cards. Section 4 of the research baked in as data |
| **Focus note** | The single most-representative note for a diagnosis. For category diagnoses (e.g. "high-note flat across 6 notes"), picked by `\|cents\| × framesAboveClarity` |
| **Contrast playback** | The voice-teacher A/B playback module: target note, your note, phrase target, phrase your version |
| **SavedCoaching** | A snapshot of a diagnosis + the cards shown + exercise context + timestamp, persisted in AsyncStorage |

---

## 3. The cut

Files / behavior **deleted** in this redesign:

| File / behavior | Action |
|---|---|
| `app/(tabs)/coaching.tsx` retry flow (live mic, scoring against focus note, pass gate) | Remove |
| `app/(tabs)/coaching.tsx` "Find next mistake" button + iteration logic | Remove |
| Child-session save on coaching pass (`parentSessionId`-linked records) | Remove. Coaching no longer creates session records. The roadmap-deferred "Coaching-orphan cleanup" item also goes away — there are no children to orphan |
| `lib/coaching/diagnose.ts` `CoachingTarget` shape, single-target return | Replaced — see §6 |
| `lib/coaching/types.ts` `CoachingTarget`, `CoachingKind` | Replaced |

Files / behavior **kept and repurposed**:

| Item | How it's reused |
|---|---|
| `app/(tabs)/coaching.tsx` route + tab `href: null` setup | Same route; full screen rewrite |
| Post-session CTA on Practice (`app/(tabs)/index.tsx`) | Same button, same navigation; new screen content |
| Tap-a-session-row in Progress (`app/(tabs)/explore.tsx`) | Same affordance; navigates to the new coaching screen |
| `NoteEvent.hzOverride` engine support | Reused by the contrast-playback module |
| `Tone.Transport.scheduleOnce` cancellable playback | Reused |
| `lib/audio/player.{web,native}.ts` | Unchanged |

Files / behavior **kept unchanged** but worth noting:

- The melody-import roadmap's Slice 8 ("Coach this melody" deep-link from imports) becomes part of this stream — imported melodies will use the new coaching engine via the same screen. Tracked in §16 below.

---

## 4. Resolved decisions

All 11 design questions resolved before this draft. Earlier sections reflect these choices.

| # | Decision | Summary |
|---|---|---|
| Q1 | Multi-cause | Show 1 symptom + 2–3 candidate causes (research-honest about ambiguity) |
| Q2 | Generic rotation | Empty state rotates a Section 3 tip; congratulates the user |
| Q3 | Combined snapshot | Bookmarks save the whole diagnosis + cards as one unit (no separate "favorites cards" list) |
| Q4 | Coaching-only generics | Section 3 tips appear only inside coaching's empty state. No daily tip-of-day, no browseable list (yet) |
| Q5 | Parking lot | Recurring-issue insights deferred until session-level data informs the design |
| Q6 | Existing access points | Post-session CTA + Progress session row. Screen behavior changes; entry points don't |
| Q7 | Tier 3 deferred | Trace-shape detectors (scoop, drift, wobble) — defer to v2 |
| Q8 | Tier 4 deferred | Passaggio detector — defer to v2 |
| Q9 | Cheat-sheet ordering | Candidate causes ranked per research §4. Personalization-by-history deferred |
| Q10 | Two access points to one list | Saved button on every coaching screen + "Saved coaching tips" row at bottom of Progress |
| Q11 | Voice-teacher playback | Keep playback but redesign as 4-variant A/B contrast with focus highlight (§10) |

---

## 5. User flows

### 5.1 Post-session coaching (Practice)

1. User finishes a Standard or Guided session
2. Existing post-session card surfaces "Coach this" CTA (unchanged)
3. Tap → coaching screen opens with the session as input
4. Detection engine runs synchronously (cheap; pure TS over already-collected scoring data)
5. Top diagnosis renders (or empty-state generic tip if nothing trips)
6. User reads, plays the contrast playback, bookmarks if useful, dismisses

### 5.2 Historical session coaching (Progress → session row)

1. User taps a session row in Progress's recent-sessions list
2. Coaching screen opens with `?sessionId=` route param (existing)
3. Same render as 5.1 — engine reads from the persisted `SessionRecord`
4. Same UX

### 5.3 Saved coaching tips

1. User taps **Saved** button on any coaching screen, OR taps "Saved coaching tips" row at the bottom of Progress
2. Saved tips list opens — newest first, each row shows date + exercise + symptom headline
3. Tap a row → expand to show the full snapshot (diagnosis evidence + symptom card + cause cards as they were when saved)
4. Swipe-to-delete or explicit delete button

### 5.4 Imported-melody coaching (out-of-MVP for melody import; in-scope for this redesign)

The melody-import roadmap Slice 8 is the deep-link from review/Progress for an imported melody → coaching. The new engine consumes the import's `MelodyAnalysis` directly (it has `notes[].centsOff`, `framesUsed`, etc — same shape detectors need). Tracked as Slice C5 below.

---

## 6. Architecture

```
session data (KeyAttemptResult[] OR MelodyAnalysis)
        │
        ▼
   ┌─────────────────────────────────────────┐
   │  Detector pipeline (lib/coaching/detect)│
   │  Each detector reads session data,      │
   │  emits 0+ Diagnosis records             │
   └─────────────────────────────────────────┘
        │
        ▼
   ┌─────────────────────────────────────────┐
   │  Ranker — sorts by                       │
   │  severity × ln(N+1) × consistencyFactor │
   └─────────────────────────────────────────┘
        │
        ▼
   ┌─────────────────────────────────────────┐
   │  Top diagnosis → DetectorMapping         │
   │  → AdviceCard[] (1 symptom + 2-3 causes) │
   └─────────────────────────────────────────┘
        │
        ▼
   ┌─────────────────────────────────────────┐
   │  Coaching screen renders:                │
   │  • headline (symptom + evidence)         │
   │  • contrast playback panel               │
   │  • candidate causes (collapsible)        │
   │  • bookmark, saved, more tips            │
   └─────────────────────────────────────────┘
```

### 6.1 Module layout

```
lib/coaching/
  types.ts                # Diagnosis, AdviceCard, DetectorMapping, SavedCoaching
  index.ts                # public API: diagnose(), pickRepresentative(), buildPlayback()
  diagnose.ts             # orchestrator — runs detectors, ranks, returns top Diagnosis + cards
  rank.ts                 # priority scoring formula, in one file for tunability
  representative.ts       # pick the focus note for a Diagnosis
  playback.ts             # build NoteEvent[] for the 4 contrast-playback variants
  savedStorage.ts         # AsyncStorage CRUD for SavedCoaching[]
  rotation.ts             # generic-tip rotation (last-shown id persisted)
  detectors/
    types.ts              # Detector interface
    index.ts              # exports DETECTORS array (run order)
    globalSharp.ts
    globalFlat.ts
    highNoteFlat.ts
    highNoteSharp.ts
    lowNoteFlat.ts
    registerMismatch.ts
    phraseEndFlat.ts
    positionConsistent.ts
    keyFatigueDrift.ts
  library/
    cards.ts              # ADVICE_CARDS — symptoms, causes, generics from research §1/§2/§3
    mappings.ts           # DETECTOR_MAPPINGS — research §4 baked in

components/coaching/
  CoachingScreen.tsx      # the body (currently `app/(tabs)/coaching.tsx`)
  DiagnosisHeadline.tsx
  EvidenceLine.tsx
  ContrastPlayback.tsx    # 4-button A/B with focus highlight
  CauseCardList.tsx       # collapsible cards
  CauseCard.tsx
  EmptyStateTip.tsx       # rotating §3 tip
  BookmarkButton.tsx
  SavedTipsList.tsx       # the saved screen
  SavedTipRow.tsx

app/(tabs)/coaching.tsx   # thin wrapper around CoachingScreen
```

`detectors/` is intentionally split file-per-detector — each is small, testable in isolation, and the `DETECTORS` array is the single registration point.

---

## 7. Detector catalog (v1)

Each detector is a pure function: `(session: SessionInput) => Diagnosis[]`. `SessionInput` is a normalized shape that abstracts over both `KeyAttemptResult[]` (live + historical) and `MelodyAnalysis` (imports).

```ts
interface SessionInput {
  notes: NoteObservation[];          // every clarity-passed note across all keys
  exerciseId?: string;
  voicePart?: VoicePart;
  keyCount: number;                  // for key-fatigue detector
}

interface NoteObservation {
  keyIndex: number;
  notePosition: number;              // index within pattern
  scaleDegree: number;               // semitones from tonic
  targetMidi: number;
  signedCents: number;               // mean of meanCentsDeviation
  framesAboveClarity: number;
  trace?: NotePitchTrace[];          // optional; Tier 3 detectors will need it
  syllable?: string;
}
```

### Tier 1 — pitch-direction (always run)

| ID | Fires when | Severity | Evidence string |
|---|---|---|---|
| `global-sharp` | `meanSigned(allNotes) > +20¢ AND coverage ≥ 60% with \|cents\| ≥ 10¢ AND obs ≥ 6` | mean signed cents | "+22¢ sharp on average across 11 notes" |
| `global-flat` | `meanSigned(allNotes) < −20¢ AND coverage ≥ 60% AND obs ≥ 6` | mean signed cents | "−27¢ flat across 9 notes" |
| `high-note-flat` | `meanSigned(topTertileByMidi) < −25¢ AND obs ≥ 3` | mean signed cents | "−34¢ flat across 6 of 8 high notes" |
| `high-note-sharp` | `meanSigned(topTertileByMidi) > +25¢ AND obs ≥ 3` | mean signed cents | "+28¢ sharp across 5 high notes" |
| `low-note-flat` | `meanSigned(bottomTertileByMidi) < −25¢ AND obs ≥ 3` | mean signed cents | "−30¢ flat across 4 low notes" |
| `register-mismatch` | `sign(top) ≠ sign(bottom) AND \|top − bottom\| ≥ 40¢` | gap in cents | "+25¢ sharp on chest, −20¢ flat on head" |

### Tier 2 — position / context

| ID | Fires when | Severity | Evidence string |
|---|---|---|---|
| `phrase-end-flat` | last note(s) of pattern across keys: `meanSigned ≤ −20¢ AND obs ≥ 3 keys` | mean signed cents | "−24¢ flat on the last note of every key" |
| `position-consistent` | per-position weighted mean `\|cents\| > 30¢` across `≥ 3 keys` | mean abs cents | "Your 5th note was −38¢ flat across 4 keys" |
| `key-fatigue-drift` | linear regression of mean abs cents vs. keyIndex with positive slope `> 5¢/key AND R² > 0.5 AND keys ≥ 4` | slope cents/key | "Your accuracy degrades as you go up — last 2 keys averaged 25¢ off" |

### Tier 3 / Tier 4 — deferred

Not implemented in v1. Stub detector files exist but are commented out in the `DETECTORS` array. Re-enable when:
- v1 has been used on real sessions and the gap is felt (Tier 3 signals like scoops and drift are noticeable in user feedback)
- Voice-part wiring is reliable everywhere (Tier 4 passaggio detector)

### Ranking formula (`lib/coaching/rank.ts`)

```ts
function priorityScore(d: Diagnosis): number {
  const consistencyFactor = 1 / (1 + (d.stddev ?? 30) / 30);
  return Math.abs(d.severity) * Math.log(d.observations + 1) * consistencyFactor;
}
```

Higher = more important. Top diagnosis becomes the headline; #2 and #3 (if they trip) go in the collapsed "Other findings" section.

---

## 8. Card library structure

```ts
interface AdviceCard {
  id: string;                          // "c/poor-breath-support"
  kind: "symptom" | "cause" | "generic";
  category: AdviceCategory;
  title: string;                       // "Poor breath support"
  soundsLike?: string;                 // §2 "Symptoms" line, plain English
  whyPitchSuffers?: string;            // §2 "Why pitch suffers" line
  fixTip: string;                      // §2 "Fix" line — the actionable quote
  tags: string[];
}

type AdviceCategory =
  | "larynx" | "breath" | "closure" | "resonance"
  | "registration" | "tilt"
  | "warmup" | "hydration" | "posture"
  | "audiation" | "practice" | "belt" | "mix" | "intonation";
```

### Cards to author (~50 total)

**Symptom cards (6)** — direct from research §1:
`s/sharp`, `s/flat`, `s/scoop`, `s/wobble`, `s/register-mismatch`, `s/passaggio`

**Cause cards (17)** — direct from research §2:
`c/high-larynx`, `c/low-larynx`, `c/tongue-tension`, `c/jaw-tension`, `c/throat-tension`,
`c/poor-breath-support`, `c/over-blowing`, `c/insufficient-appoggio`,
`c/insufficient-closure`, `c/excessive-closure`,
`c/vowel-modification`, `c/soft-palate`,
`c/no-mix`, `c/pulled-chest`, `c/pulling-into-mix`,
`c/insufficient-tilt`, `c/excessive-tilt`

**Generic tip cards (~28)** — broken out from research §3 (split each section into 4–6 self-contained one-or-two-sentence cards):
- `g/warmup-1..6`
- `g/hydration-1..7`
- `g/posture-1..5`
- `g/audiation-1..6`
- `g/practice-1..7`
- `g/belt-1..6`
- `g/mix-1..6`
- `g/intonation-1..6`

(Exact counts adjust during authoring; aim for one tip per atomic idea.)

### Authoring rules

- **Verbatim where possible** — the research is well-written; copy fix-tip quotes as-is unless they need RN-string sanitization (e.g. smart quotes)
- **No emoji**, no markdown in card bodies (the UI handles formatting)
- **`tags`** include both detection-relevant tags (`flat`, `breath`, `high-note`) and reading-relevant tags (`belt`, `passaggio`) for future filtering
- **One short comment** per card if a non-obvious nuance needs noting

---

## 9. DetectorMapping (research §4 baked in)

Direct table:

```ts
const DETECTOR_MAPPINGS: DetectorMapping[] = [
  {
    detectorId: "global-sharp",
    symptomCardId: "s/sharp",
    candidateCauseCardIds: ["c/over-blowing", "c/high-larynx", "c/jaw-tension", "c/excessive-closure"],
  },
  {
    detectorId: "global-flat",
    symptomCardId: "s/flat",
    candidateCauseCardIds: ["c/poor-breath-support", "c/insufficient-closure", "c/soft-palate"],
  },
  {
    detectorId: "high-note-flat",
    symptomCardId: "s/flat",
    candidateCauseCardIds: ["c/pulled-chest", "c/vowel-modification", "c/soft-palate", "c/low-larynx"],
  },
  {
    detectorId: "high-note-sharp",
    symptomCardId: "s/sharp",
    candidateCauseCardIds: ["c/over-blowing", "c/high-larynx", "c/insufficient-tilt"],
  },
  {
    detectorId: "low-note-flat",
    symptomCardId: "s/flat",
    candidateCauseCardIds: ["c/insufficient-closure", "c/poor-breath-support"],
  },
  {
    detectorId: "register-mismatch",
    symptomCardId: "s/register-mismatch",
    candidateCauseCardIds: ["c/no-mix", "c/pulled-chest", "c/vowel-modification"],
  },
  {
    detectorId: "phrase-end-flat",
    symptomCardId: "s/flat",
    candidateCauseCardIds: ["c/poor-breath-support", "c/insufficient-appoggio"],
  },
  {
    detectorId: "position-consistent",
    symptomCardId: null,                                    // no clean symptom mapping; surface as raw evidence
    candidateCauseCardIds: ["c/poor-breath-support", "c/vowel-modification"],
  },
  {
    detectorId: "key-fatigue-drift",
    symptomCardId: "s/flat",                                // most fatigue manifests as flat
    candidateCauseCardIds: ["c/poor-breath-support", "c/insufficient-appoggio"],
  },
];
```

Show the **first 2 candidate cause cards by default**; an "Other possibilities" affordance reveals the rest.

The `null` symptomCardId on `position-consistent` is intentional — that detector finds a specific note, not a category, and the UI just renders the evidence with no symptom blurb (e.g. "Your 5th note was consistently flat across 4 keys").

---

## 10. Voice-teacher contrast playback

The most-felt UX gap. Lives in `components/coaching/ContrastPlayback.tsx` plus `lib/coaching/playback.ts` (event construction).

### 10.1 Picking the focus note (for category diagnoses)

```ts
function pickRepresentative(diagnosis: Diagnosis, observations: NoteObservation[]): NoteObservation {
  // Highest-confidence most-egregious instance:
  return observations
    .filter(matchesDetector(diagnosis))
    .reduce((best, n) => {
      const score = Math.abs(n.signedCents) * Math.log(n.framesAboveClarity + 1);
      return score > scoreOf(best) ? n : best;
    });
}
```

For single-note diagnoses (`position-consistent`, `key-fatigue-drift` if applicable), the focus is determined by the detector itself.

### 10.2 The four playback variants

Each plays through the existing audio player + `Tone.Transport`:

```ts
type PlaybackVariant =
  | "target-note"          // single note: target MIDI, on focus syllable
  | "your-note"            // single note: hzOverride = focus.medianHz, same syllable
  | "phrase-target"        // full key iteration as written
  | "phrase-your-version"; // full key iteration with focus note's hzOverride
```

Implementation reuse: `NoteEvent.hzOverride` already exists. For `phrase-your-version`, take the iteration's `events[]`, find the index matching the focus note, set `hzOverride = focus.medianHz`. Schedule via `Tone.Transport.scheduleOnce` (cancellable per CLAUDE.md convention).

### 10.3 Multi-example cycling

For category diagnoses with `≥3` qualifying observations:
- Default focus = top representative
- "**+ More examples**" affordance cycles through the next 2 most-egregious instances
- Each tap re-renders the playback panel with the new focus note

### 10.4 Visual focus highlight

A small syllable strip or note-ladder shows the pattern; the focus syllable is bolded and underlined; during playback, the **currently-playing note pulses** so the user can correlate audio with visual position.

Reuse `components/SyllableDisplay.tsx` if its existing pattern fits; otherwise a small `<FocusStrip>` purpose-built component (~40 lines).

### 10.5 UI shape

```
┌─────────────────────────────────────────────┐
│  Listen                                     │
│                                             │
│   [Target note]   [Your note]               │
│                                             │
│   [Phrase, target]   [Phrase, your version] │
│                                             │
│   syllable strip with focus highlight       │
│                                             │
│   + More examples (2)                       │
└─────────────────────────────────────────────┘
```

Tapping any button cancels in-flight playback and starts the new one.

---

## 11. Storage & bookmarks

```ts
interface SavedCoaching {
  id: string;                            // generated
  savedAt: number;                       // epoch ms
  exerciseId?: string;
  exerciseName?: string;                 // denormalized for offline display if exercise is deleted
  sessionId?: string;
  diagnosis: {
    detectorId: string;
    severity: number;
    observations: number;
    evidenceText: string;                // pre-rendered string; survives library updates
    signedMeanCents?: number;
  };
  symptomCard?: AdviceCard;              // snapshot — see §11.1
  causeCards: AdviceCard[];              // snapshot
}
```

Storage key: `vocal-training:coaching:saved:v1`. Pattern after `lib/progress/storage.ts`.

### 11.1 Why snapshot the cards?

The library will evolve. If we just store card IDs, a saved tip from 6 months ago could load with edited fix-tip text the user never saw. Snapshot the cards at save time — the saved tip is a frozen artifact. Storage cost is trivial (~1 KB per snapshot).

### 11.2 What does NOT get saved

- Full `KeyAttemptResult[]` traces — the diagnosis already carries `evidenceText` and `signedMeanCents`; raw traces are ephemeral
- Audio buffers — there are none in v1 (live mic doesn't record)

---

## 12. UI surfaces

### 12.1 Coaching screen layout

```
┌───────────────────────────────────────────────────┐
│  ← Back                              ☆ Saved      │
├───────────────────────────────────────────────────┤
│                                                   │
│  Drifting flat on high notes                      │ ← DiagnosisHeadline
│  −34¢ flat across 6 of 8 high notes               │ ← EvidenceLine
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │  Listen [target note] [your note]          │ │ ← ContrastPlayback (§10)
│  │  [phrase target] [phrase your version]     │ │
│  │  syllable strip                            │ │
│  │  + More examples (2)                       │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  What this sounds like                            │
│  Notes start under pitch and droop at the top…   │ ← symptomCard.soundsLike
│                                                   │
│  Likely causes                                    │
│  ▶ Pulling chest into mix range                  │ ← CauseCardList (collapsed)
│  ▶ Vowel not modifying on ascent                 │
│                                                   │
│  ▼ Other possibilities (1)                        │ ← rest of candidate causes
│                                                   │
│  ▼ Other findings (2)                             │ ← diagnoses #2 and #3 if any
│                                                   │
│  [ ★ Bookmark ]                                   │
│                                                   │
└───────────────────────────────────────────────────┘
```

### 12.2 Empty state (no detector trips)

```
┌───────────────────────────────────────────────────┐
│  ← Back                              ☆ Saved      │
├───────────────────────────────────────────────────┤
│                                                   │
│  Solid session — no consistent issues found       │
│                                                   │
│  Today's tip                                      │
│  ┌─────────────────────────────────────────────┐ │
│  │  Hear the note before you sing it…          │ │ ← rotating §3 card
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  [ ★ Save tip ]                                   │
│                                                   │
└───────────────────────────────────────────────────┘
```

### 12.3 Saved coaching tips screen

```
┌───────────────────────────────────────────────────┐
│  ← Back                                           │
│  Saved coaching tips                              │
├───────────────────────────────────────────────────┤
│  2026-05-08  Five-Note Scale                      │
│  Drifting flat on high notes              [▼]    │
├───────────────────────────────────────────────────┤
│  2026-05-06  Octave Leap "Wow"                    │
│  Sharp on high notes                      [▼]    │
├───────────────────────────────────────────────────┤
│  2026-05-04  (general tip)                        │
│  Hear the note before you sing it         [▼]    │
└───────────────────────────────────────────────────┘
```

Tap a row → expand to show the full snapshot inline. Long-press or trailing button → delete.

Reachable from:
- **Saved** button on every coaching screen (top-right)
- **Saved coaching tips** row at the bottom of Progress's per-exercise list

---

## 13. Tunable parameters & defaults

| Param | Default | Rationale |
|---|---|---|
| `MIN_OBSERVATIONS_GLOBAL` | 6 | Tier 1 globals need enough signal |
| `MIN_OBSERVATIONS_TIER_GROUP` | 3 | High/low/register groups need at least 3 obs |
| `THRESHOLD_GLOBAL_CENTS` | 20 | Mean signed cents floor for tier 1 globals |
| `THRESHOLD_GROUP_CENTS` | 25 | Mean signed cents floor for high/low/register tertiles |
| `THRESHOLD_POSITION_ABS_CENTS` | 30 | Position-consistent floor (absolute) |
| `KEY_FATIGUE_MIN_KEYS` | 4 | Need 4+ keys for a credible regression |
| `KEY_FATIGUE_MIN_R2` | 0.5 | Avoid spurious slopes |
| `COVERAGE_MIN` | 0.6 | 60% of clarity-passed notes must support the global direction |
| `MAX_CANDIDATE_CAUSES_DEFAULT` | 2 | Show top 2; rest behind "Other possibilities" |
| `MAX_OTHER_FINDINGS` | 2 | Show diagnoses #2 and #3 below top |
| `EMPTY_STATE_THRESHOLD` | none of the above trips | Show generic-tip rotation |

All in `lib/coaching/config.ts` for one-place tuning.

---

## 14. Edge cases

| Case | Behavior |
|---|---|
| Session with too few clarity-passed notes (≤3 total) | Empty state with a "we didn't get enough audio to give meaningful coaching — try with headphones / in a quieter room" message; no rotating tip |
| All notes within ±15¢ | Empty state with congrats + rotating tip |
| Multiple detectors fire with similar priority | Top wins; rest go in "Other findings" |
| Imported melody with no `framesUsed` data | Detectors that need frame counts use `framesUsed = 1` fallback; observation gets less weight in ranking |
| User deletes the exercise after saving a coaching snapshot | Snapshot still renders fine — `exerciseName` is denormalized in `SavedCoaching` |
| Saved snapshot whose detector has been removed from the library | Snapshot still renders — cards are snapshotted; detector logic isn't re-run |
| Library card content updated after a save | Saved snapshot continues showing old text (intentional — see §11.1) |
| Voice-part-aware text needed (e.g. "above F4") but voice part is unknown | Use generic phrasing ("on high notes") |
| Contrast playback tapped during another playback | Cancel current, start new; mirror existing player conventions |

---

## 15. Testing strategy

### 15.1 Unit tests — detectors

For each detector, build a synthetic `SessionInput` that:
- Plants the symptom (e.g. for `high-note-flat`, 6 notes in the top tertile averaging −30¢)
- Asserts the detector fires with the expected severity / observations / evidence
- Asserts a control session with random small deviations does NOT trip the detector

### 15.2 Unit tests — ranking

Construct multiple diagnoses with known severity/observations/stddev; assert rank order matches the formula.

### 15.3 Unit tests — DetectorMapping

For each detector ID, assert there's a mapping; for each card ID referenced, assert the card exists in the library.

### 15.4 Integration tests

End-to-end synthetic session → detector pipeline → ranked diagnoses → top diagnosis selected → mapped card list → assert the card IDs match the cheat-sheet expectation.

### 15.5 Saved storage tests

CRUD round-trip; snapshot fidelity (saved card content equals what was in the library at save time even after library mutation).

### 15.6 Manual QA scenarios

- Run a deliberately flat session on the five-note scale → expect `global-flat` or `high-note-flat`
- Run an octave-leap exercise reaching for high notes → expect `high-note-sharp` or `high-note-flat` depending on push style
- Run a session with one bad note in the same position across multiple keys → expect `position-consistent`
- Run a long session where the user tires by key 5 → expect `key-fatigue-drift`
- Run an in-tune session → expect empty state + rotating tip

---

## 16. Slicing for delivery

Each slice is independently shippable. MVP = C1 + C2. C3–C5 are increments.

### Slice C1 — Detector engine + card library + tests
- New: `lib/coaching/detectors/*` (9 detectors), `lib/coaching/diagnose.ts` (refactored), `lib/coaching/rank.ts`, `lib/coaching/config.ts`
- New: `lib/coaching/types.ts` (Diagnosis, AdviceCard, DetectorMapping, SavedCoaching)
- New: `lib/coaching/library/cards.ts` — all ~50 cards from research
- New: `lib/coaching/library/mappings.ts` — DetectorMapping table from §4
- New: `lib/coaching/representative.ts` — focus-note picker
- Tests per §15.1–§15.3
- **Ships with:** internal capability only. No UI change yet. Old `app/(tabs)/coaching.tsx` still uses old `diagnose()` until C2

### Slice C2 — Coaching screen redesign + cut old retry
- Modify: `app/(tabs)/coaching.tsx` — replace retry UI with diagnosis + cards UI driven by C1's pipeline
- New: `components/coaching/{DiagnosisHeadline,EvidenceLine,CauseCardList,CauseCard,EmptyStateTip,BookmarkButton}.tsx`
- Cut: retry flow, "find next mistake," child-session creation, related state
- Generic tip rotation in empty state — `lib/coaching/rotation.ts` (in-memory rotation; persistence in C5)
- **Ships with:** users see the new screen. Bookmark button is present but storage lands in C4 (button is wired; persists to a no-op until then OR ships with storage as a single slice — see C4 note)

### Slice C3 — Voice-teacher contrast playback
- New: `lib/coaching/playback.ts` — variant builders
- New: `components/coaching/ContrastPlayback.tsx`, possibly `<FocusStrip>`
- Modify: `CoachingScreen` to embed contrast playback
- Tests: variant playback produces correct `NoteEvent[]` (especially `hzOverride` placement)
- **Ships with:** the audio side of the credibility win

### Slice C4 — Saved tips storage + UI
- New: `lib/coaching/savedStorage.ts` — AsyncStorage CRUD
- New: `components/coaching/{SavedTipsList,SavedTipRow}.tsx`
- Modify: `CoachingScreen` Bookmark button — wire to storage
- Modify: `CoachingScreen` Saved button — opens list
- Modify: `app/(tabs)/explore.tsx` — "Saved coaching tips" row at bottom of per-exercise list
- **Ships with:** persistence + browse. Note — in practice C2 + C4 may want to be one slice to avoid "ships with broken bookmark" — see §16.1

### Slice C5 — Imported-melody coaching deep-link
- New: `lib/coaching/fromAnalysis.ts` — adapter `MelodyAnalysis` → `SessionInput`
- Modify: `app/(tabs)/coaching.tsx` — accept `?exerciseId=` route param for imports; read analysis blob from `userStore`
- Modify: `components/import/ImportModal.tsx` — replace the existing `TODO Slice 8` placeholder with a real "Coach this melody" button
- Modify: imported expanded card on Progress — same button
- This is melody-import roadmap Slice 8, retitled and folded into this stream
- **Ships with:** end-to-end coaching for imports

### 16.1 Practical slicing note

C2 ships a Bookmark button that doesn't persist would be a frustrating intermediate state. Two options:
- **(a)** Ship C2 + C4 as one combined slice
- **(b)** Hide the Bookmark button in C2 (feature flag or just not render); enable in C4

Recommend (a) — the bookmark UI is small and the storage even smaller. One slice. Tracked in the roadmap as a single C2+C4 entry.

### 16.2 Suggested wave plan

- **Wave 1 (parallel — disjoint scopes):** C1 (engine + library + tests), C3 (playback module — pure functions only, no UI yet)
- **Wave 2 (sequential after Wave 1):** C2 + C4 combined (screen rewrite + storage + bookmark + saved tips list)
- **Wave 3 (after Wave 2):** C5 (imports deep-link)

C3's playback module can be built before the screen exists because its surface is pure: input = `Diagnosis` + `SessionInput` → output = `NoteEvent[]` per variant. The screen wires it up in C2.

---

## 17. Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Detectors over-fire (every session shows a "diagnosis" even when in tune) | Medium | Conservative thresholds in §13; monitor empty-state rate during dogfooding |
| Detectors under-fire (clearly off sessions show empty state) | Medium | Lower thresholds gradually; manual QA scenarios in §15.6 are the early warning |
| Cheat-sheet ordering is wrong for a particular detector (top cause is rarely the real cause for *this* user) | Medium | Q9 confines us to research-canonical ordering for v1; data collection over time + Q5 personalization will fix in v2 |
| Card content goes stale (research updates, terminology drifts) | Low | Library is in code; updates ship like any other change. Saved snapshots are immutable per §11.1 |
| Contrast playback is laggy on web | Low | Tone.Transport scheduling is already proven in the project |
| Bookmark snapshot list grows unboundedly | Low | Add a delete affordance from row long-press in C4. Pruning is a v2 concern |
| User confusion when symptom card is `null` (position-consistent) | Low | UI handles `null` by skipping the symptom blurb and rendering raw evidence; QA in §15.6 |
| Voice-part-aware copy needed for some symptoms but voice-part is unknown | Low | Generic copy; future enhancement to specialize when known |

---

## 18. Future / parking lot

- **Tier 3 detectors** — scoop, drifting sharp/flat on sustains, wobble. Highest pedagogical value-add. Implementation pattern in §7
- **Tier 4 detector — passaggio** — needs voice-part wiring everywhere, hardcoded passaggio-zone table per voice part
- **Recurring-issue insights (Q5 deferred)** — over multiple sessions, surface "your most-flagged issue this month is `c/poor-breath-support`"; deep-dive content path
- **Personalization of candidate cause ordering (Q9 deferred)** — re-rank causes by historical detector → cause flagged-helpful rates per user
- **Daily tip-of-day on Practice (Q4 deferred)** — surface a §3 tip on the Practice home, not just inside coaching
- **Tip browseable library (Q4 deferred)** — flat list of all §3 tips for casual reading
- **A/B threshold experimentation** — log which detector fired for which session, surface as analytics; tune thresholds based on user feedback ("this advice was useful")
- **Card-helpful feedback** — "Was this useful? 👍 / 👎" buttons on cards; train ranking
- **Voice-part-aware cause text** — "above your F4 break" instead of "on high notes" when voice part is known
- **Live-during-session coaching hints** — surface cause-pointer mid-session if a detector fires repeatedly within a few keys (probably annoying; needs UX care)

---

## 19. Definition of done (MVP = Slices C1 + C2+C4 combined)

- A user finishes a session → taps "Coach this" → sees a plain-English diagnosis with concrete cents evidence, two candidate causes, and a fix tip, OR sees an empty-state with a rotating §3 tip
- The user can bookmark the diagnosis + cards as a single saved snapshot
- The user can open Saved coaching tips from the coaching screen Saved button OR from Progress's bottom row
- The old retry / "find next mistake" / child-session-save behavior is gone
- All 9 v1 detectors pass unit tests; ranking + mapping pass unit tests; saved storage round-trips
- `npx tsc --noEmit` clean; full test suite passes including engine regression, analyze tests, and new coaching tests

C3 (contrast playback) and C5 (imports deep-link) are done-done. MVP can ship without them — but C3 is strongly desired to make diagnoses *credible* per Q11 discussion, and C5 closes the imports loop. Recommend C3 lands within MVP timeline.

---

## 20. Living references

- Update `ROADMAP.md` with a "Coaching Redesign" tracker showing C1–C5 status as each lands
- Each slice lands with: code + tests + ROADMAP flip + (if user-facing) a manual smoke-test note
- This doc is the source of truth for resolved decisions; if a decision changes during implementation, update §4 here first

---

## 21. Design polish — deferred until DESIGN.md exists

A `/plan-design-review` pass on 2026-05-09 rated this plan **5/10** on design completeness and recommended deferring the full review until `/design-consultation` produces a project-wide `DESIGN.md`. The structural design work in §10–§14 is solid; the gaps are all visual-system gaps that share one upstream cause.

When `DESIGN.md` exists, re-run `/plan-design-review` against this plan to land:

| Gap | What's missing | Where it shows up in shipped code |
|---|---|---|
| Typography | No font family, size scale, weights named | `app/(tabs)/coaching.tsx` uses bare `fontSize: 24/14/13/12/11`, `fontWeight: 700/600/400`, no `fontFamily` (defaults to OS) |
| Color tokens | `#4338ca`, `#fafafa`, `#fff`, `#eee`, `#111/#333/#666/#888` scattered as hex literals | All coaching components |
| Spacing scale | `gap`, `padding` values pulled from the air (10, 12, 14, 18, 20) | All coaching components |
| Motion specs | §10.4 says "pulses during playback" — no duration, easing, opacity range | `ContrastPlayback.tsx` syllable-strip highlight |
| Accessibility | Touch targets under 44px (back button is 4px tall padding); no contrast targets; only one `accessibilityLabel`; no keyboard nav | `coaching.tsx`, `BookmarkButton.tsx`, expandable cause cards |
| Responsive | Plan assumes phone layout. App runs on web at full viewport — coaching column will look stretched at ≥1024px with no max-width | Whole screen |
| AI slop check | Stacked rounded card pattern + indigo accent + centered everything is the SaaS-template default. Plan never evaluated against the OpenAI/CCM design rules | `otherCard`, `EmptyStateTip`, `SavedTipRow`, `CauseCard` |

### Existing design vocabulary worth aligning to (when the redesign happens)
- Indigo `#4338ca` is already the project accent (Practice CTAs, Progress)
- Off-white `#fafafa` canvas, `#fff`-on-`#eee`-border card pattern
- `<NoteResultsStrip>` (`components/practice/NoteResultsStrip.tsx`) — green/amber/red chip pattern that the diagnosis evidence line could reuse
- `<SyllableDisplay>` (`components/SyllableDisplay.tsx`) — karaoke strip with active-syllable scaling. `ContrastPlayback`'s focus strip should extend this, not reinvent it
- `<HeadphonesModal>` — established blocking-sheet pattern (could inform the saved-tips screen on tablet/desktop)

### Voice-teacher metaphor — visual reinforcement gap
The plan's §10 contrast playback is a strong conceptual win. The shipped buttons are styled as generic primary/secondary. A real voice teacher's value isn't 4 buttons; it's *attention*. Future polish: lean the visual treatment into the metaphor (e.g. the focus note feels held / spotlit, the buttons feel like asks rather than chrome) once the design system is in place to support it.

---

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | — |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 0 | — | — |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | DEFERRED | initial 5/10; user chose to run `/design-consultation` first to establish DESIGN.md anchor before reviewing individual plans. 7 gap categories captured in §21 above for re-run after DESIGN.md exists. |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

**VERDICT:** DESIGN REVIEW DEFERRED — run `/design-consultation` to establish a project-wide design system, then re-run `/plan-design-review` against this plan to apply named tokens to the §21 gaps. Eng review still recommended before any further coaching-related work ships.
