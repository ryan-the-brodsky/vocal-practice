# Pedagogy Expansion Plan

Implementation plan for M4 ("Pedagogy Expansion") — closes the 10 unshipped PRD exercises, adds direction-reversal toggle, voice-led inversions, and lays the groundwork (engine + scoring + detector) for siren/glissando, dynamics, vowel-shape diagrams, Tier 3/4 detectors, and mic recording. Stylistic mirror of `BULLETPROOFING_PLAN.md`.

---

## Sequencing rationale

The work clusters into three concentric rings. Each ring strictly enables the next; within a ring slices are independently shippable.

**Ring 1 — descriptor-only wins (no engine changes).** Slices 1, 2, 3 ship 7 of the 10 missing exercises, the direction toggle, and voice-led inversions. Zero schema risk; large pedagogical surface in a few hundred LOC. This ring lands the bulk of M4's exercise-count goal and unblocks the routine card with a richer default rotation. **Slice 1 is the recommended starting point** — it's a copy of work already done 8 times, and adding 7 new descriptors immediately broadens the daily routine.

**Ring 2 — engine and scoring extensions.** Slices 4 (dynamics — messa di voce), 5 (siren engine + scoring path), and 6 (vowel-shape diagram). Each requires schema changes; they don't depend on each other but they all depend on the Ring 1 descriptors existing because the diagram is most useful for #17 (vowel modification, in Slice 1) and the siren engine retroactively replaces ng-siren's discrete-note kludge.

**Ring 3 — diagnostic and recording extensions.** Slices 7 (Tier 3 trace-shape detectors), 8 (Tier 4 passaggio detector), and 9 (mic audio capture for "your version"). These read existing scoring data without changing it. Slice 9 is the most architecturally independent and could move to Ring 2 if the user wants it sooner.

**Order I'd actually run them:**
1. Slice 1 (7 trivial exercises)
2. Slice 2 (direction-reversal toggle)
3. Slice 3 (voice-led inversions)
4. Slice 5 (siren engine + scoring) — unblocks Slice 1's tongue-trill and ng-hum already shipped, retroactively cleans up `ng-siren`
5. Slice 4 (dynamics + messa di voce)
6. Slice 6 (vowel-shape diagram, post-MVP per PRD)
7. Slice 7 (Tier 3 trace-shape detectors)
8. Slice 9 (mic recording — independent; can run in parallel)
9. Slice 8 (Tier 4 passaggio detector — needs voice-part wiring everywhere first)

**Highest-leverage low-effort win:** Slice 3 (voice-led chord inversions) — PRD §2 calls it a "10-line function" and it transforms how every chromatic-modulation cue sounds across all 18 exercises with one localized engine change. **Surprising result:** Slice 5 is genuinely smaller than expected because pattern-alignment scoring (`lib/scoring/align.ts`) already does the right thing for sirens — it segments by pitch coherence, not by clock, and the existing `LEGATO_SPLIT_CENTS = 200` config already handles glide-vs-discrete-note discrimination. The "siren engine work" is mostly an audio-side story (continuous Hz playback), not a scoring story.

---

## Decisions the user needs to make before Slice 1

These influence the schema and slicing:

1. **Direction-reversal toggle scope (Slice 2):** per-session UI override only, or per-session AND persistable as a user-default per exercise? Recommended: per-session override; persistence stays implicit (per-exercise tonic memory already covers "where did I leave off").

2. **Vowel-shape diagram visual style (Slice 6):** IPA-symbol chart vs. simple mouth-shape SVG icons vs. lookup-table card with a plain-text mouth description. Recommended: mouth-shape SVG icons (5 cardinal vowels: /i/ee, /e/eh, /a/ah, /o/oh, /u/oo) + a small text caption. Photo-realistic mouth photos add weight (~500 KB per voice gender) and aren't worth it. Sagittal sections are pedagogically the gold standard but stylistically out of place in this app.

3. **Siren-exercise scoring (Slice 5):** does the user want a *score* on a siren, or is it pass/fail "did you cover the pitch range continuously"? Recommended: cover-range scoring. A discrete-segment score doesn't model what's pedagogically interesting on a siren (continuity, range, smoothness across passaggio).

4. **Mic-recording retention (Slice 9):** keep last N recordings, or keep last N days, or keep one-per-coaching-bookmark? Privacy implications on iOS. Recommended: opt-in only, ring buffer of last 5 sessions for "your version" playback, never persisted to coaching bookmarks (per `COACHING_REDESIGN_PLAN.md` §11.2 explicitly excluding audio buffers from saved snapshots).

5. **Bundle-size budget for Slices 4 + 9.** Dynamics needs no new samples but Slice 9 PCM recording adds ~80 KB/min/session. PWA-shell direction (per BULLETPROOFING `Slice 8 deferred`) means iCloud backup isn't an issue. Confirm IndexedDB vs. AsyncStorage for blob storage.

---

## Slice 1 — 7 trivial PRD exercises (descriptor-only) (M · ~8h)

**Bundles PRD #1 (basic lip trill), #3 (tongue trill), #6 (full vowel set), #9 (octave arpeggio), #10 (octave leap on `wee`), #11 (staccato variant), #14 (mum), #16 (9-note scale), #18 (hum).**

### Goal
Add 7 new exercises that share schema with shipped ones — different syllables, different scaleDegrees, but the existing engine handles all of them as-is. Brings the total from 8 → 15. Validates that `library.ts` + `names.ts` registration is the only spread-cost.

### Triage of the 10 PRD-listed unshipped exercises

The ROADMAP M4 says 10 are missing. Reality check against existing descriptors:

| PRD # | Name | Status / triage | This slice? |
|---|---|---|---|
| #1 | Basic lip trill on 5-note scale | Schema-equivalent to #2 Rossini lip trill. Just narrower scaleDegrees `[0,2,4,5,7,5,4,2,0]` and SOVT-relaxed range. | ✅ |
| #3 | Tongue trill on scale or arpeggio | Schema-equivalent to #2 Rossini lip trill on the same scaleDegrees but `syllables: ["rrr", ...]`. SOVT scoring hints. | ✅ |
| #6 | 5-note scale on full vowel set | We *have* mee-may-mah-moh-moo (it's #6 in the PRD; it shipped). Triage: the only "full vowel set" not yet covered would be IPA `/i/-/e/-/a/-/o/-/u/` with IPA syllables shown. **Not actually missing** — this is rendered. ROADMAP wording is misleading. **Skip.** |
| #9 | Octave arpeggio | We have `goog-octave-arpeggio` (PRD #13 SLS). PRD #9 is the *generic* `1-3-5-8-5-3-1` on free-vowel choice. Add as `octave-arpeggio-vowels`. | ✅ |
| #10 | Octave leap with sustain | We have `octave-leap-wow`. PRD also calls out `wee-eee` as the canonical syllable. Add `octave-leap-wee` as a variant — useful for chest-mix testing on a different vowel. | ✅ |
| #11 | Staccato arpeggio | We have `staccato-arpeggio` on `hee`. PRD also calls out `ha-ha-ha`. Add `staccato-arpeggio-ha` as a variant if the user wants vowel-rotation; **flag as optional** because it's just a syllable swap and 15 exercises is plenty. **Skip unless explicitly wanted.** |
| #12 | Messa di voce | **Heavy** — needs dynamics. Defer to Slice 4. | ❌ |
| #14 | Mum arpeggio (SLS) | Schema-equivalent to `goog-octave-arpeggio` with `syllables: ["mum", ...]` and gentler tempo. | ✅ |
| #16 | 9-note scale (octave+1) | New scaleDegrees `[0,2,4,5,7,9,11,12,11,9,7,5,4,2,0]`. PRD says `I → V (top half) → I` accompaniment — but our v1 spec is a single block I per pattern. Pragmatic approach: ship as `nine-note-scale` with `accompaniment.pattern: "blockChordOnDownbeat"` and accept the V chord on the top half is a v2 polish. | ✅ |
| #17 | Vowel modification | Pattern is `1-3-5-8` with vowel shift across the rising sequence. Just a syllable list `["ee", "ih", "eh", "ah"]` against scaleDegrees `[0,4,7,12]` — descriptor-only. Most useful when paired with Slice 6's diagram, but the descriptor itself is trivial. | ✅ |
| #18 | Hum on pitch / scale | Schema-equivalent to descending-five-to-one but `syllables: ["mmm", ...]`. SOVT-relaxed scoring hints. | ✅ |

**Net:** 7 new descriptors (#1, #3, #9, #10-wee, #14, #16, #17, #18). #6 and #12 are skipped per triage.

### Changes

| Item | Files |
|---|---|
| 7 JSON descriptors | `data/exercises/basic-lip-trill.json`, `tongue-trill.json`, `octave-arpeggio-vowels.json`, `octave-leap-wee.json`, `mum-arpeggio.json`, `nine-note-scale.json`, `vowel-modification.json`, `hum-pitch.json` |
| Library registration | `lib/exercises/library.ts` — 7 new imports added to the array |
| Static name map | `lib/exercises/names.ts` — 7 new id→name entries |
| Routine defaults review | `app/(tabs)/explore.tsx` — `DEFAULT_ROUTINE` may want one of the new exercises in rotation. Optional. |

For each descriptor, the pattern follows the shipped ones:
- `id`, `name`, `pedagogy` (3-sentence pedagogical blurb mirroring the 8 shipped)
- `scaleDegrees`, `syllables`, `noteValue`, `tempo` from the PRD table
- `voicePartRanges` audited against `lib/music/voiceRanges.ts` validator (passaggio crossing required for non-SOVT, +2 SOVT-relaxed for trills/hums)
- `accompaniment` per PRD column (block I, doubled melody, drone, etc.)
- `direction: "both"` default; descriptors that PRD specifies as ascending-only stay `"ascending"`
- `tags` aligned to existing taxonomy
- `scoringHints` only when needed (SOVT exercises lower clarity threshold and widen pitch coherence; trills wider; staccato `octaveJumpFrames: 2`)

### Tests

- `lib/exercises/__tests__/library.audit.test.ts` — already runs `validateDescriptorRanges()` against every descriptor; new ones must pass without modifying the validator. SOVT exemption applies to basic lip trill, tongue trill, hum.
- `lib/exercises/__tests__/engine.regression.test.ts.snap` — refresh with `npm test -- -u` once new exercises are added; review the diff.
- `lib/music/__tests__/voiceRanges.test.ts` snapshot of out-of-native-cap entries — soprano peaks may extend the snapshot. Locked in PR diff.
- 1 component-test sanity check that `<EXERCISE_NAMES>` exposes all 15 ids — extend the existing audit test in `lib/exercises/__tests__/`.

### Done criteria
- 15 exercises in the picker; each has voice-part chips for soprano/alto/tenor/baritone.
- `npm test && tsc --noEmit` clean. Test count ~380 → ~388 (+8 schema-audit assertions across new exercises).
- Validator (`validateDescriptorRanges`) passes for all 15 with appropriate SOVT flags.
- Manual smoke: each exercise loads, plays, the cue fires, the syllables render in the strip.

### Risks
- **Hidden duplication.** `#11 staccato-arpeggio-ha` was triaged out; if the user *does* want it, it's 15 minutes of work but bloats the picker.
- **#16 9-note-scale on `nine-note-scale`** has a 15-degree scaleDegrees array; the syllable strip and staff display will need to gracefully handle longer melodies. Probably fine — they already handle 11-degree Rossini — but verify on 1024px web.
- **PRD vs. shipped tonic ranges drift.** The PRD's tenor C3→F3 ascent for #16 lands the top at F4 — but our shipped tenor passaggio crossing standard is +2 above F4. Decision: bump tenor highest from F3 to G3 so the top tonic crosses the passaggio.

---

## Slice 2 — Direction-reversal toggle (S · ~3h)

**Bundles ROADMAP M4 row "Direction-reversal toggle per exercise."**

### Goal
Per-session UI control to override `descriptor.direction` ascending vs. ascending+descending. PRD §1: Riggs/SLS skips descent on stretch exercises; Miller/classical reverses symmetrically. Today the field exists in the schema but isn't user-adjustable.

### Background
`engine.ts:65` reads `exercise.direction ?? "ascending"`. `PlanInput` already accepts overrides for `bpmOverride`, `startTonicOverride`, `endTonicOverride`, `cueDurationBeatsOverride`, `accompanimentPreset`, `guidance`, `clickTrackEnabled`. **Adding `directionOverride?: Direction` is one field on the existing type and one read in the planner** — call site changes are localized to the Practice screen.

### Changes

| Item | Files |
|---|---|
| Type extension | `lib/exercises/types.ts` — no change (PlanInput is in `engine.ts`) |
| PlanInput field | `lib/exercises/engine.ts` — add `directionOverride?: Direction` to `PlanInput`; in `planExercise()` use `directionOverride ?? exercise.direction ?? "ascending"`. Single read site. |
| Settings cluster icon | `app/(tabs)/index.tsx` — add a 5th icon button to the settings cluster for "Direction" with a 3-state toggle (Ascending / Descending / Both). Persist per-exercise selection in `vocal-training:exercise-direction:v1` (parallel to per-exercise tonic memory). |
| Default behavior | When user hasn't set an override, fall through to descriptor's `direction`. The toggle UI shows the current effective direction with the descriptor's value as a "(default)" hint. |

### UX detail
Three states because some exercises only make pedagogical sense in one direction (descending-five-to-one is *meant* to be descending). Force the user-override to be valid by clamping: if the descriptor has `"descending"`, the toggle is disabled with a tooltip explaining why. SOVT/range-stretch exercises (#2, #4, #5, #16) default to `"ascending"` per PRD; the user can override to `"both"` if they want.

### Tests

- `lib/exercises/__tests__/engine.test.ts` — new test asserting `planExercise({ ..., directionOverride: "both" })` produces both halves regardless of descriptor's `direction`.
- `lib/exercises/__tests__/engine.test.ts` — assert `directionOverride: "ascending"` on a `direction: "both"` descriptor produces ascending-only.
- Component test for the settings cluster icon: opening the toggle, selecting "Both", verifying that subsequent `planExercise` calls receive `directionOverride: "both"`.
- Persistence round-trip via the same pattern as `lib/settings/voicePart.ts` — new `lib/settings/exerciseDirection.ts`.

### Done criteria
- New "Direction" icon in the settings cluster on Practice; tooltip + popover show 3 options.
- Per-exercise selection persists across cold launches.
- `goog-octave-arpeggio` (descriptor `"both"`) → toggle to "ascending" → engine generates only the ascending key sequence.
- `descending-five-to-one-nay` (descriptor `"descending"`) → toggle is disabled with explanatory tooltip.
- Test count ~388 → ~395.

### Risks
- **Settings cluster real estate.** The cluster already has 4 icons (Accompaniment / Guidance / Demo / Click-track). A 5th may push the row over on small mobile widths. Mitigation: collapse on mobile to a "more options" expander; on desktop ride alongside.
- **Tonic memory interaction.** When direction switches from "both" to "ascending" mid-progression, the saved tonic might be in the descending half — clamp it to the highest tonic of the new direction.

---

## Slice 3 — Voice-led chord inversions (S · ~4h)

**Bundles ROADMAP M4 row "Voice-led chord inversions between keys" + PRD §2 "Most apps just reset to root position in each new key."**

### Goal
The 10-line function PRD §2 calls out: when planning the per-key chord, choose the inversion of the new I whose top note is closest by half-step to the previous voicing's top note. Produces stepwise upper-voice motion across modulations and sounds dramatically more like a real accompanist.

### Background
`lib/exercises/engine.ts:308` calls `voicingInWindow(tonicMidi, chordWindowLow, "major")` to pick a chord voicing. This function is in `lib/exercises/music.ts`. Today every key's chord is independently planned from the tonic MIDI — which is why the chromatic ascent sounds blocky.

The voice-leading rule (Bertalot, Vaccai-tradition):
- Build the major triad: root, root+4, root+7
- Three possible inversions (each shifted up by 12): root-position `[r, r+4, r+7]`, first inversion `[r+4, r+7, r+12]`, second inversion `[r+7, r+12, r+16]`
- Pick the inversion whose top note is closest in semitones to the previous key's top note
- Constrained to the `chordWindowLow..chordWindowLow+24` band so it stays in piano-friendly tessitura
- The first key has no predecessor, so use root-position as the seed

### Changes

| Item | Files |
|---|---|
| New function | `lib/exercises/music.ts` — add `pickVoiceLedInversion(prevTopMidi: number | null, tonicMidi: number, chordWindowLow: number, quality: "major" \| "minor"): number[]`. Pure function, no side effects. |
| Engine plumbing | `lib/exercises/engine.ts` — `planExercise` already iterates tonics in order; thread a `prevTopMidi` accumulator across `planSingleKey` calls. Pass into `buildAccompaniment` → use new function instead of `voicingInWindow` for `blockChordOnDownbeat` and `sustainedChord` and `rhythmicStab`. |
| Tonic-hold cue voicing | `engine.ts:240` — `buildCue` for `block` and `v7` cue types should also use voice-leading: cue chord's top voice walks with the modulation. Less critical but consistent. |
| Drone exclusions | `rootOctaveDrone`, `openFifthDrone`, and `doubledMelody` are unaffected — their voicings are fixed by definition. |
| Reset on direction switch | When `direction: "both"`, the descending half's first chord can either continue from the top or reset. Recommended: continue (creates a satisfying coming-back-down arc). |

### Pseudocode

```
function pickVoiceLedInversion(prevTopMidi, tonicMidi, low, quality):
  triad = [tonicMidi, tonicMidi+4, tonicMidi+7]   // or 3 if minor
  // Generate three inversions in the chord window
  candidates = []
  for shift in [0, +12, +24]:
    voicing = triad.map(n => n + shift)
    if voicing[0] >= low and voicing[2] <= low + 30:
      candidates.push(voicing)
  if prevTopMidi == null: return candidates[0]      // seed
  // Pick candidate whose top note is closest to prevTopMidi
  return candidates.reduce((best, v) =>
    abs(v[2] - prevTopMidi) < abs(best[2] - prevTopMidi) ? v : best
  )
```

### Tests

- `lib/exercises/__tests__/music.test.ts` — new tests:
  - First key (no predecessor) returns root-position
  - Ascent C → C# → D: top notes form stepwise motion (≤2 semitones between consecutive tops)
  - When all candidates are equidistant, prefers root-position
  - Voice-led top across 7 keys never jumps more than 2 semitones
- `lib/exercises/__tests__/engine.test.ts` — new test asserting that `planExercise` for a 7-key ascent produces NoteEvents whose top accompaniment voice walks stepwise.
- `lib/exercises/__tests__/engine.regression.test.ts.snap` — refresh; review the diff to confirm voicings changed in the expected way.

### Done criteria
- Voicings ascend stepwise across modulations on Standard / Studio / Classical presets.
- Manual A/B: play the 5-note-scale through 7 keys before/after — the after sounds noticeably more "accompanist-like."
- Test count ~395 → ~402.

### Risks
- **Snapshot churn.** Almost every shipped exercise's regression snapshot will change (different chord MIDIs). Mitigation: refresh snapshots in the same PR; review every changed snapshot to confirm the new MIDIs are correct.
- **Top-note collision with melody.** PRD §2 warns the chord top should not land on the sung melody note (creates beat frequencies). The `chordWindowLow = max(36, tonicMidi - 14)` constraint partly handles this, but voice-led inversions can drift the top up close to the singer's range. Add a check: if `voicing[2] >= tonicMidi - 2`, reject and pick the next candidate down.
- **Bundled samples.** Web Salamander has full coverage; native is sparse — voice-leading may push notes into pitch-shift artifact zones. Verify against the bundled sample list in `lib/audio/player.native.ts`.

---

## Slice 4 — Dynamics + messa di voce (M · ~10h)

**Bundles PRD #12 (messa di voce) — explicitly NOT in Slice 1 because it requires dynamics control.**

### Goal
Add support for note-level dynamics (pp / mp / mf / f / ff) and crescendo/decrescendo curves on individual notes. Ship `messa-di-voce` as the first exercise that uses it: sustain on tonic, pp→ff→pp over 6–8 seconds.

### Background
Today `NoteEvent.velocity` is a single 0..1 scalar. The web/native players pass it directly to `triggerAttackRelease(noteName, duration, time, velocity)`. Tone.js supports dynamic velocity ramping via `gain.gain.linearRampToValueAtTime` — but our current `Tone.Sampler` invocation is a one-shot trigger with fixed velocity at attack. The piano sampler can't dynamically swell *after* attack (sampler envelopes are sample-property-driven, not real-time).

**Pedagogically pragmatic approach:** model the messa di voce on the user's *singing* trajectory, not the piano accompaniment. The piano is a sustained chord; the user sings sustained; the *signal* is the user's RMS curve. Score a messa di voce as "did you produce a pp→ff→pp envelope." The descriptor describes the target dynamic curve; the scoring layer evaluates it. This lets us defer Tone-side dynamic ramping (a separate hard problem) and ships a real exercise.

### Changes

| Item | Files |
|---|---|
| Schema extension | `lib/exercises/types.ts` — `NoteEvent` gains optional `dynamicCurve?: DynamicCurve`; new type `interface DynamicCurve { from: Dynamic; to: Dynamic; via?: Dynamic; durationFraction?: [number, number] }` |
| Dynamic enum | `type Dynamic = "pp" \| "p" \| "mp" \| "mf" \| "f" \| "ff"` mapping to RMS thresholds (e.g. pp = -45 dB, ff = -10 dB) |
| Descriptor extension | `ExerciseDescriptor` gains optional `dynamicCurve` at the descriptor level (applies to all melody notes; messa-di-voce is one note so it's fine) |
| New scorer | `lib/scoring/dynamics.ts` — `evaluateDynamicCurve(samples: PitchSample[], target: DynamicCurve, durationMs: number): { score: 0..1, evidence: { peakRmsDb, swellShape, peakTimingFraction } }` |
| Engine emits velocity hint | `engine.ts` — when a note has `dynamicCurve`, emit `velocity` as the *peak* velocity, the rest is informational metadata |
| Piano accompaniment | Sustained chord with `pattern: "sustainedChord"` — already shipped. No piano-side dynamic change needed in v1. |
| New descriptor | `data/exercises/messa-di-voce.json` — single note `[0]`, syllable `["ah"]`, sustained 6 seconds, `dynamicCurve: { from: "pp", to: "pp", via: "ff", durationFraction: [0, 0.5, 1] }`, `accompaniment.pattern: "sustainedChord"` |
| Live RMS UI | `components/practice/MessaDiVoceMeter.tsx` — visual swell meter showing user's RMS over time vs. target curve. Shows green when on-curve. |
| Coaching detector | `lib/coaching/detectors/dynamicShape.ts` — fires when the messa di voce evidence shows asymmetric swell or peak timing >0.6 (singer crescendoed too late) |

### Tests

- `lib/scoring/__tests__/dynamics.test.ts` — synthetic samples representing pp→ff→pp; assert `score > 0.85`. Asymmetric ramp; assert lower score with specific evidence. Flat-RMS singer; assert near-zero score.
- `lib/exercises/__tests__/library.audit.test.ts` — `messa-di-voce` passes voice-range validation as a single-note SOVT-equivalent exercise.
- Component test for MessaDiVoceMeter renders curve correctly given samples.
- 1 integration test in `lib/__tests__/integration/` driving a synthetic messa di voce session through the Tracker → dynamics scorer → diagnose pipeline.

### Done criteria
- `messa-di-voce.json` selectable in the Practice picker.
- Sustained chord plays; swell meter renders user's RMS vs. target.
- Per-note breakdown shows a "swell shape" panel with the achieved curve.
- Coaching detector fires for asymmetric or late-peak swells.
- Test count ~402 → ~412.

### Risks
- **RMS-as-dynamics is approximate.** True vocal dynamics involve subglottal pressure, vocal-fold thickness changes, and resonance — RMS is a proxy. For warmup purposes this is fine.
- **Mic gain confusion.** A user singing softly close to the mic and loudly far from it will produce identical RMS. Add a calibration note: "Stay the same distance from the mic during messa di voce." Could add a one-time "set max comfortable RMS" calibration in the headphones modal flow.
- **Pp threshold collides with the RMS gate.** The gate today rejects samples below -45 dB to suppress piano spillover. Pp on messa di voce *is* -45 dB. Mitigation: temporarily lower the gate during messa di voce to -55 dB (descriptor flag `scoringHints.minRmsDb`).

---

## Slice 5 — Siren / glissando engine + scoring (L · ~14h)

**Bundles PRD #4 + #5 (siren patterns, currently faked via 3 discrete notes in `ng-siren.json`).**

### Goal
Real continuous-pitch playback for siren exercises. Replaces today's 3-discrete-note kludge. Adds `glide: true` flag on `NoteEvent` that the player interpolates between adjacent notes. Updates scoring to handle continuous-pitch traces (which the existing `align.ts` segmenter already does correctly).

### Background — what already works
- **Scoring already handles continuous traces correctly.** `align.ts` walks samples chronologically, checks pitch coherence vs. running median (`pitchCoherenceCents`, default 75), and breaks segments when pitch shifts beyond the band. A siren's continuous glide produces *one long segment* with high pitch variance — which the segmenter would currently reject as "incoherent." Solution: a per-exercise `pitchCoherenceCents: 1200` on sirens lets the whole glide pass as a single segment.
- **The real problem is audio playback.** `engine.ts` emits discrete `NoteEvent`s with `startTime` and `duration`. The audio player calls `triggerAttackRelease(noteName, duration, time, velocity)` per event. There's no continuous-pitch primitive.

### Approach: keep discrete events, add `glide: true` flag
Most pedagogically faithful. Don't add a new event type — extend `NoteEvent` with `glide?: boolean`. When set, the audio player interprets the event as the *target* of a glide *from* the previous melody event. The engine emits a sparse set of waypoints (1-5 in a siren); the player interpolates between them.

### Web implementation (Tone.js)
`Tone.Sampler` doesn't have a glide primitive. Two options:
1. **`Tone.Synth` with portamento.** Easy, but a synth tone is awful for a piano-warmup app.
2. **Hold a single note, ramp playbackRate at the AudioBufferSource layer.** This is what we already do on native (`AudioBufferSourceNode + playbackRate`). On web we'd bypass `Tone.Sampler` for siren events and use a raw AudioBufferSource with `playbackRate.linearRampToValueAtTime`. About 30 lines.

Alternative (recommended for v1): **don't render the siren on piano at all.** PRD §1 lists the accompaniment for #4 sirens as "Drone on tonic, or no accompaniment." Sirens are a singer-pitch-glide exercise; the accompaniment doesn't need to glide. So: emit a tonic drone for accompaniment, and render the siren melody as **silent waypoints** for visual UI (syllable-strip "current target" pointer slides). Singer hears a drone, sees a moving dot, glides up and back. Engine doesn't have to *play* a glide — it just has to *display* one. **This is a 100-line change, not a 1000-line one.**

### Changes (recommended path)

| Item | Files |
|---|---|
| Schema extension | `lib/exercises/types.ts` — add `glide?: boolean` on `NoteEvent`, and `silentTarget?: boolean` to mark a note as visual-only (no audio playback). |
| Engine | `engine.ts` — when descriptor has `tags: ["siren"]` or a new `noteValue: "glide"` flag, emit melody events with `silentTarget: true` and continuous waypoints between them based on `scaleDegrees`. |
| Audio player | `player.{web,native}.ts` — skip events flagged `silentTarget`. |
| Visual gliding pointer | `components/practice/SirenTargetPointer.tsx` — interpolates the active note position over time during a glide. Mounted in `SyllableDisplay` as an alternate display when descriptor has `tags: ["siren"]`. |
| Scoring config override | `align.ts` — descriptor scoringHints already pipe through; `pitchCoherenceCents: 1200` on sirens allows the whole glide to register as one continuous segment. New scoring metric: range-coverage. |
| Range-coverage scorer | `lib/scoring/sirenScore.ts` — `scoreSirenRange(samples, expectedDegrees, tonicMidi)` — returns `{ rangeCovered: 0..1, smoothness: 0..1, peakHz, troughHz }` |
| New / replacement descriptors | `data/exercises/ng-siren.json` rewritten with `tags: ["siren"]`; new `data/exercises/oo-siren.json` per PRD #4. |
| Coaching detector | `lib/coaching/detectors/sirenRangeShort.ts` — fires when the user covered <60% of the expected range. |

### Tests

- `lib/scoring/__tests__/sirenScore.test.ts` — synthetic samples representing a clean octave glide; assert `rangeCovered > 0.95`. Half-coverage glide; assert `rangeCovered ≈ 0.5`. Discrete (no glide); assert lower smoothness score.
- `lib/exercises/__tests__/engine.test.ts` — assert siren descriptors emit melody events with `silentTarget: true`.
- Component test that `SirenTargetPointer` interpolates visually correctly given a time fraction.

### Done criteria
- `ng-siren` renders as a continuous gliding pointer over a drone, not 3 discrete piano notes.
- Per-note breakdown is replaced for sirens with a range-coverage card.
- Coaching detector fires when range is short.
- Test count ~412 → ~422.

### Risks
- **The "silent target" design is unconventional.** Singer might expect the piano to play the glide. Mitigation: small explainer shown before first siren session; only on first encounter.
- **Trace data is huge for a 6-second siren.** ~300 samples at 50 fps. `MAX_TRACE_FRAMES = 200` in `align.ts` already caps this. Decimate during the segmenter pass.
- **Goes against `LEGATO_SPLIT_CENTS = 200`.** A siren glide will trip the legato-split heuristic, breaking it into many segments. The override `pitchCoherenceCents: 1200` plus the new `siren` tag bypassing legato-split logic handles this. Add a `scoringHints.disableLegatoSplit?: boolean`.

### Why this isn't recommended for this product (a partial answer)
PRD lists sirens as #4 and #5 — both pedagogical staples. But: **the user is solo-practicing, not comparing against a class**, the existing 3-discrete-note `ng-siren` already exercises range-stretching at the level needed for daily SOVT warmup, and a true gliding visualization is a significant UI investment. **My recommendation: triage Slice 5 to "do later, or skip if the user finds the discrete `ng-siren` adequate."** Build Slices 1, 2, 3 first; revisit Slice 5 only if the user is dissatisfied with `ng-siren` after several weeks of dogfooding.

---

## Slice 6 — Vowel-shape diagram (M · ~6h)

**Bundles PRD's "post-MVP" callout: vowel-shape diagram alongside syllable strip; high pedagogical value for #17 (vowel modification, shipping in Slice 1).**

### Goal
Render a small mouth/IPA diagram next to each syllable in the active strip. Shape changes as the user sings through different vowels in a vowel-modification exercise. Integrates with the syllable strip without disrupting the karaoke layout.

### Research: what's pedagogically meaningful

Three tiers of vowel visualization, in order of pedagogical sophistication:

1. **IPA chart (formal).** The official IPA vowel chart positions vowels by tongue height (high/low) and frontness (front/back). Pedagogically gold-standard but requires knowing IPA. A quick 4-position chart (4 cardinals: /i/ /a/ /u/ /ɑ/) is intuitive even without IPA training.

2. **Mouth-shape SVG icons (pragmatic).** Front-view simplified mouth shapes — narrow round /u/, wide rectangular /a/, narrow flat /i/. Voice teachers use diagrams like these in Lader/LoVetri training materials. Easy for a singer to mimic.

3. **Sagittal section (Miller / Doscher).** Side-view of the vocal tract showing tongue position, soft-palate position, pharyngeal width. The "real" diagram. But it's anatomy-heavy and stylistically out of place in an app that otherwise looks like Apple Music.

**Recommendation: Tier 2 — mouth-shape SVG icons.** 5 cardinal vowels (/i/ee, /e/eh, /a/ah, /o/oh, /u/oo) plus a "default" no-shape state. Each is a single 24×24 SVG. The active syllable's vowel resolves to one of these via a lookup. 

### Mapping syllables to vowels

```
Syllable → vowel detection:
  ends in /i/ or /e/ (mee, may, hee, nee) → /i/ or /e/
  ends in /a/ (mah, nah, ya) → /a/
  ends in /o/ or /au/ (moh, oh, wow) → /o/
  ends in /u/ (moo, goog, oo) → /u/
  trill / ng / hum / mum → no diagram
  vowel-modification syllables ("ee", "ih", "eh", "ah") → respective shapes
```

A simple regex/lookup table in `lib/exercises/vowelShape.ts`. Falls back to "no shape" for ambiguous cases.

### When to show the diagram

Three options:
- **Always** — adds visual noise to every exercise. Reject.
- **On tap** — user taps the syllable to see the shape. Discoverable but unused. Reject.
- **Only on vowel-modification exercises** — descriptor opt-in via `tags: ["vowel-modification"]` or new descriptor field `showVowelDiagram: boolean`. Recommended.

### Changes

| Item | Files |
|---|---|
| Vowel detection | `lib/exercises/vowelShape.ts` — `getVowelShape(syllable: string): VowelShape \| null` |
| 5 SVG icons | `components/VowelShapeIcon.tsx` — single component, props `shape: "i" \| "e" \| "a" \| "o" \| "u"`, renders 24×24 SVG |
| Syllable-strip integration | `components/SyllableDisplay.tsx` — when descriptor has `showVowelDiagram: true`, render `<VowelShapeIcon>` above the active syllable. Mounted as an absolutely-positioned overlay. |
| Descriptor flag | `lib/exercises/types.ts` — add `showVowelDiagram?: boolean` to `ExerciseDescriptor`. |
| Apply to vowel-modification descriptors | `data/exercises/vowel-modification.json` (Slice 1) — `showVowelDiagram: true` |

### Tests

- `lib/exercises/__tests__/vowelShape.test.ts` — 8 lookup cases.
- Snapshot test on `<VowelShapeIcon>` for each of the 5 vowels.
- Component test on `<SyllableDisplay>` rendering the icon when the descriptor flag is set.

### Done criteria
- `vowel-modification` exercise shows a shape morphing /i/ → /e/ → /a/ as the user progresses through the pattern.
- Other exercises (5-note scale, lip trills) don't show the icon.
- Test count ~422 → ~430.

### Risks
- **Pedagogically partial.** The icons are simplified — they show *front-view mouth* but not *tongue position* (which is the more important pedagogical distinction). Acceptable for a personal warmup app; not for a teaching app.
- **Layout regression.** Floating icon above an active syllable. The active syllable already scales 2× (per CLAUDE.md). Verify on small mobile widths.
- **Internationalization.** Hard-coded English-syllable lookup. Won't matter for personal use.

### Why this might *not* be recommended
A vowel diagram is a "feels educational but barely changes practice outcomes" feature. Voice teachers help with vowel modification by *listening* and *describing in real-time* — a static icon is a thin substitute. **My recommendation: defer Slice 6 indefinitely unless the user explicitly asks for it after dogfooding `vowel-modification`.** Time spent on Slice 7 (Tier 3 detectors) gives the user actionable feedback per session, which is more useful than a static visual.

---

## Slice 7 — Tier 3 coaching detectors: trace-shape (M · ~10h)

**Bundles `COACHING_REDESIGN_PLAN.md` §17 deferred Tier 3 detectors: scoop, drift, wobble.**

### Goal
Add three detectors that read the per-frame `NotePitchTrace[]` already attached to `NoteScore` during live scoring. Surfaces signal that the existing Tier 1/2 detectors miss because they only look at single per-note `meanCentsDeviation`.

### Background — the data is already there
`lib/scoring/types.ts` `NoteScore` has `trace?: NotePitchTrace[]` — up to 200 frames per note with `{tMs, hz, cents, clarity}`. The trace is **stripped at save time** by `trimSessionForStorage()` (`lib/progress/storage.ts`). So Tier 3 detectors are **only available during live coaching**, never on historical sessions.

The trace already flows through `fromKeyAttempts` into the `SessionInput.notes[].trace?` field (`lib/coaching/engine/types.ts:40`). Detectors can already consume it. Only the detector implementations are missing.

### The three detectors

| ID | Pattern detected | Detection logic | Evidence |
|---|---|---|---|
| `scoop` | Note starts under target by ≥40¢, then settles to ≤25¢ within the first 30% of the note | Walk trace; first frames after `tMs ≥ 50` should be flat-then-flat. If first quartile mean is <-40 and last quartile mean is between -25 and +25, fires. | "Scooping into 4 of 7 notes — average start is −60¢ flat" |
| `drift` | Pitch shifts monotonically by ≥30¢ over the note's duration | Linear regression of cents vs. tMs across the trace; abs(slope) × duration > 30¢ AND \|R²\| > 0.5 | "Drifting flat across sustains — average drift −35¢ per note" |
| `wobble` | Cyclic pitch oscillation > ±15¢ at 4-8 Hz (vibrato is fast, wobble is slow) | FFT or autocorrelation on the cents trace; peak frequency ∈ [4, 8] Hz; amplitude > 15¢. | "Wobble on held notes — ±20¢ at 5 Hz" |

### Detection robustness
- **Scoop**: only fire on notes ≥250ms (shorter notes are inherently scoopy due to attack transients).
- **Drift**: only fire on notes ≥400ms (need enough frames for meaningful regression).
- **Wobble**: only fire on notes ≥600ms (need 3+ wobble cycles).
- All three: minimum 3 qualifying notes per session before firing — single instances aren't pedagogically actionable.

### Changes

| Item | Files |
|---|---|
| Three detector files | `lib/coaching/detectors/{scoop,drift,wobble}.ts` |
| Trace utilities | `lib/coaching/detectors/util.ts` — add `firstQuartileMean(trace)`, `lastQuartileMean(trace)`, `linearRegression(trace)`, `dominantFrequency(trace)` |
| Detector registry | `lib/coaching/detectors/index.ts` — add three new detectors to `DETECTORS` array |
| 3 new symptom cards | `lib/coaching/library/cards.ts` — extend the existing 6 symptom cards with `s/scoop`, `s/wobble`, `s/drift`. (`s/scoop` and `s/wobble` exist already from C2 — verify this and reuse.) |
| 3 new mappings | `lib/coaching/library/mappings.ts` — `scoop → s/scoop` (causes: c/audiation, c/insufficient-appoggio, c/poor-breath-support); `drift → s/flat` (causes: c/poor-breath-support, c/insufficient-appoggio); `wobble → s/wobble` (causes: c/throat-tension, c/over-blowing, c/jaw-tension) |
| Config | `lib/coaching/engine/config.ts` — add Tier 3 thresholds: `SCOOP_MIN_CENTS_INITIAL`, `DRIFT_MIN_DURATION_MS`, `WOBBLE_FREQ_MIN_HZ`, etc. |

### Tests

- `lib/coaching/detectors/__tests__/scoop.test.ts` — synthetic NoteObservation with traces; assert detector fires on canonical scoop pattern, doesn't fire on flat trace.
- Same for `drift.test.ts` and `wobble.test.ts`.
- Integration test driving a synthetic session with intentional scoops through Tracker → align → diagnoseSession → assert top diagnosis is `scoop`.
- `lib/coaching/__tests__/mappings.test.ts` — assert all three new mappings reference cards that exist.

### Done criteria
- Three new detectors firing in the live-coaching path.
- Manual smoke: a session with deliberate scoops produces a `scoop` diagnosis with cause cards and audio playback.
- Test count ~430 → ~445.

### Risks
- **Trace data only on live sessions.** Saved sessions don't have traces (storage strip). So Tier 3 detectors *cannot* fire on historical sessions. UX implication: a session viewed via "Coach this" from the Progress tab will *only* return Tier 1/2 detections. Acceptable but should be documented in the Coaching screen empty-state copy.
- **FFT in JS for wobble.** No FFT library is currently imported. Pitchy isn't suitable. Use either: (a) a 32-line autocorrelation implementation in `util.ts`, (b) `dsp.js` (~30 KB), (c) skip wobble for v1 and ship just scoop + drift. Recommended (a) — autocorrelation is sufficient for 4-8 Hz oscillation detection on a ~600-frame trace.
- **Trace truncation.** `align.ts` caps at `MAX_TRACE_FRAMES = 200`. At 50 fps that's 4 seconds. Drift detection on a 6-second messa-di-voce note would be partially truncated. Mitigation: bump `MAX_TRACE_FRAMES` to 400 once Slice 4 lands.
- **Scoop is the highest-leverage of the three.** Drift and wobble are pedagogically subtle and may over-fire. Recommend shipping scoop alone first, observing, then adding drift, then wobble.

### Recommendation
Ship `scoop` alone in this slice. Defer drift and wobble until 4 weeks of scoop-only data shows the architecture is sound. Reduces risk and ships value faster.

---

## Slice 8 — Tier 4 coaching detector: passaggio break (L · ~12h)

**Bundles `COACHING_REDESIGN_PLAN.md` §17 deferred Tier 4 detector: passaggio.**

### Goal
Detect when a singer has a "register break" near their passaggio (Miller's primo passaggio). Symptoms: dramatic pitch instability or full octave-error specifically in the 2-semitone band centered on the voice's passaggio. Surfaces a coaching diagnosis that no other detector can.

### Background — what is passaggio detection?
- `lib/music/voiceRanges.ts` already defines per-voice passaggio MIDIs (tenor F4, baritone D4, soprano F#5, alto E4).
- A "register break" acoustically manifests as one of:
  1. **Octave flip** — pitchy locks to the second harmonic, producing a -1200¢ error. We already mitigate via octave-snap-against-target. So a *post-snap* octave-error in the passaggio zone is a real break.
  2. **Clarity drop** — vocal-fold contact becomes irregular, pitchy can't lock; the trace shows clarity dipping below 0.5 right at the passaggio note.
  3. **Formant shift** — register transition shifts the spectrum. Detectable via FFT (out of scope; pitchy is fundamental-only).
  4. **Sudden ±200¢ pitch jump within a note** — full register flip mid-note.

### Detection logic
Combine signals 1, 2, and 4 — all available from existing pitch + scoring data, no new audio analysis needed.

```
For each note where targetMidi within ±2 semitones of voice.passaggio:
  Frame counts:
    octaveFlipFrames = trace.filter(f => abs(f.cents) > 600).length
    clarityDropFrames = trace.filter(f => f.clarity < 0.5).length
    pitchJumpDetected = max consecutive cents-delta > 300
  
  If (octaveFlipFrames > 5) OR (clarityDropFrames > trace.length * 0.4) OR pitchJumpDetected:
    qualifyingPassaggioNotes.push(note)

If qualifyingPassaggioNotes.length >= 2:
  fire `passaggio-break` diagnosis
```

### Voice-part dependency
**Critical:** the detector needs `voicePart` to know where to look. `SessionInput.voicePart` is already plumbed through `fromKeyAttempts` (when the live session has it) — but historical `SessionRecord`s also need to carry voice part. Already do: `SessionRecord.voicePart` (`lib/progress/types.ts:42`). So this works for historical sessions too, *if* the trace data is available — which per Slice 7's note, it isn't on saved sessions. So passaggio detection is also live-only.

### Changes

| Item | Files |
|---|---|
| Detector | `lib/coaching/detectors/passaggioBreak.ts` |
| Update sessionInput | `lib/coaching/engine/sessionInput.ts` — `fromKeyAttempts` already populates `voicePart` from the calling site. Verify in PR. |
| Hardcoded zone widths | `lib/coaching/engine/config.ts` — `PASSAGGIO_ZONE_SEMITONES = 2`, `PASSAGGIO_QUALIFYING_NOTES_MIN = 2` |
| Symptom card | `lib/coaching/library/cards.ts` — `s/passaggio` exists already (per cards.ts:59). Verify content matches new detector evidence. |
| Mapping | `lib/coaching/library/mappings.ts` — `passaggio-break → s/passaggio` (causes: `c/no-mix`, `c/pulled-chest`, `c/insufficient-tilt`, `c/vowel-modification`) |
| User-facing advice | The existing `s/passaggio` card already says "Bridge early — start lightening tone and rounding the vowel two or three notes before the break, with a slight twang and a stable larynx." Per `cards.ts:65`. Reuse as-is. |

### Tests

- `lib/coaching/detectors/__tests__/passaggioBreak.test.ts` — synthetic tenor session with traces showing octave-flip on F4 and Gb4; assert detector fires. Same session for soprano (passaggio at F#5); same exercise data should NOT fire (different voice part). Voice-part edge: an `unknown` voice part — detector returns empty. Confirms voice-part-conditional behavior.
- Integration test: a 5-note scale that crosses tenor passaggio with a deliberate F4 break — top diagnosis should be `passaggio-break`.

### Done criteria
- Passaggio detector firing on tenor/baritone/soprano/alto sessions independently.
- Tied to actual session voice part — not the descriptor's default.
- Test count ~445 → ~452.

### Risks
- **Live-only.** Same as Slice 7 — historical sessions don't have traces.
- **False positives on the high-tonic-iteration final keys.** Above-passaggio notes have inherent register-coordination challenges; the detector should distinguish "user has a register break" from "user is having a hard time at their range top." Mitigation: only fire when the evidence is *specifically in the passaggio zone* (±2 semitones), not anywhere in the upper third.
- **Passaggio table is per-voice but not per-individual.** A given user's passaggio may differ by ±2 semitones from the table values. For personal use, this is fine; for a multi-user app, the user would need to calibrate. Not in scope.

---

## Slice 9 — Mic audio recording for "your version" playback (L · ~16h)

**Bundles ROADMAP M2 row "Sung-pitch audio playback (record actual mic audio, not just Hz substitution)."**

### Goal
Capture the user's actual sung audio during practice and play it back as "your version" in the coaching screen. Currently "your version" reconstructs pitch via `hzOverride` on the sampler — which sounds like piano, not voice.

### Background
**Current state:** `lib/coaching/playback.ts` builds `NoteEvent[]` with `hzOverride = focus.medianHz`. The audio player plays Salamander piano at that frequency. It's pitch-faithful but timbre-incorrect (it sounds like piano, not voice).

**Goal:** capture raw mic audio during practice → store per-note clips → play back the user's actual voice in coaching.

### Architecture options

**Option A: PCM in IndexedDB (web)** + **Documents directory (iOS)**
- Web: `MediaRecorder` API on the existing `MediaStream`; encode to webm/opus (~16 KB/s); store as Blob in IndexedDB.
- iOS: `react-native-audio-api` `AudioRecorder` already provides PCM; encode via native AAC (~16 KB/s) to Documents directory.
- Storage: ~1 MB per 60-sec session × 5 sessions × 7 days = 35 MB ring buffer. Fits comfortably.

**Option B: Continuous capture, no clip splitting**
- Capture full session as one file. Coaching playback knows the timestamp range of each note from the session record's `KeyAttempt` start times.
- Simpler storage (one file per session, not per note).
- Slightly harder coaching UX (playback needs to seek into the file).

**Recommended: Option B** — simpler. The `align.ts` pass already knows the per-segment timestamps; we just need to record those timestamps into the session record and seek the recording to them.

### Changes

| Item | Files |
|---|---|
| Recording subsystem | `lib/recording/recorder.{ts,web.ts,native.ts}` — interface + platform-specific implementations |
| Session-level recording | `lib/session/tracker.ts` — track recording start time on session start; provide stop() that returns the blob URI |
| Clip resolution | `lib/recording/clipResolver.ts` — given a session record + note position, return `{ uri, startMs, endMs }` |
| Storage backend | `lib/recording/storage.ts` — IndexedDB on web, FileSystem on native; ring-buffer pruning to keep last 5 sessions |
| Settings flag | New "Record mic" toggle in Practice settings cluster (off by default per privacy) |
| Per-app-session permission | First time user toggles on, show a one-time consent modal explaining storage + retention |
| Coaching playback rewrite | `lib/coaching/playback.ts` — when a recording exists for the session, "your version" plays the actual recording clip; falls back to `hzOverride` if no recording. |
| New audio player method | `lib/audio/player.ts` interface — `playClip(uri: string, startMs: number, endMs: number): SequenceHandle` |
| Web playback | `player.web.ts` — uses `<audio>` element seek-and-play |
| Native playback | `player.native.ts` — uses `react-native-audio-api`'s AudioBufferSourceNode with offset/duration |

### Storage cost (concrete numbers)
- Opus 16 KB/s × 60s = 960 KB per 1-min session
- Ring buffer of 5 sessions = ~5 MB
- Web IndexedDB has no hard limit; iOS Documents dir is bounded by app sandbox (multi-GB)
- **Verdict: storage is not a concern.**

### Privacy surface
- Mic permission already exists for pitch detection. Adding *recording* doesn't require a *new* permission, but it changes the data model.
- New consent modal first time user toggles "Record mic" on.
- Recordings never leave device. Document this in DESIGN.md or in the toggle's tooltip.
- iOS will show the orange microphone indicator during practice anyway.

### Tests

- `lib/recording/__tests__/recorder.test.ts` — fake MediaRecorder, drive a synthetic stream, assert blob comes out with the expected duration and size.
- `lib/recording/__tests__/clipResolver.test.ts` — given session record with key timestamps, resolve clip URI for a focus note.
- Component test: coaching screen's "your version" button plays recorded clip when one exists, falls back to hzOverride otherwise.
- Storage test: after 5+1 sessions, ring buffer evicts the oldest.

### Done criteria
- Toggle "Record mic" on Practice settings; consent modal shows once.
- After a session, "Coach this" → coaching screen → "your version" plays the user's actual voice (not piano).
- Storage caps at 5 sessions; oldest evicted automatically.
- Test count ~452 → ~462.

### Risks
- **iOS file storage portability.** Needs `expo-file-system` (already a dep). PWA Note: PWAs can persist to IndexedDB but iOS Safari has 7-day inactivity eviction. If user moves to PWA path (per BULLETPROOFING Slice 8), this is a real concern. Add an eviction-detection probe at app start.
- **MediaRecorder Safari quirks.** iOS Safari supports MediaRecorder as of iOS 14.3 with some encoding limitations. Test on real devices.
- **Sample rate mismatch.** Recording at 48 kHz but playback through a 44.1 kHz audio context can cause audible pitch shift. Use the same audio context for record + playback.

---

## Out of scope (deliberate deferrals)

- **#11 staccato-arpeggio-ha syllable variant** — minor. Reopen if the user wants vowel-rotation across staccato.
- **#6 5-note-scale on full IPA vowel set** — already shipped as `five-note-scale-mee-may-mah`. ROADMAP wording was misleading.
- **Sagittal-section vocal-tract diagrams** (Slice 6 alternative) — overkill for personal use.
- **Real-time piano-side dynamic ramping** for messa di voce (Slice 4) — Tone.Sampler limitation; using user RMS is sufficient.
- **Multi-user voice-part calibration** for Slice 8's passaggio detector — single-user app.
- **Cloud / iCloud backup** of recorded audio — not in scope per BULLETPROOFING's web-only direction.
- **Custom-exercise authoring UI** — already in M5 backlog; not pedagogy-expansion-shaped.
- **Tone.js dynamic playback for siren** — Slice 5's "silent target" approach sidesteps it. Reopen only if the silent-target UI is unsatisfying.
- **A/B testing detector thresholds** — listed in `COACHING_REDESIGN_PLAN.md` §18 parking lot.
- **Per-individual passaggio calibration** — single-user app.

---

## Tracking

As each slice ships, add a one-line entry to ROADMAP.md under M4. Update CLAUDE.md's "What works" section and the architecture file-tree comment block as needed (e.g. when `lib/recording/` lands). Don't batch — doc updates ship with the slice, per existing convention.

When all slices land, this plan can be deleted and folded into ROADMAP.md.
