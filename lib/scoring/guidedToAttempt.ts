import { midiToHz, midiToNote } from "../exercises/music";
import type { ExerciseDescriptor, KeyIteration, NoteEvent } from "../exercises/types";
import type { KeyAttemptResult, NoteScore, NotePitchTrace } from "./types";

// Each Guided "match" requires the user to hold within tolerance for ~300ms.
// At ~50fps that's 15 frames — enough for the coaching engine to treat the
// observation as a real note rather than a clarity-gated outlier.
const SYNTHETIC_FRAMES_PER_MATCH = 15;

/**
 * Convert a Guided pattern's best-per-note signed-cents array into a
 * KeyAttemptResult that the coaching engine can diagnose against.
 *
 * Null entries (notes the user never matched) are emitted as zero-frame
 * NoteScores so `fromKeyAttempts` filters them out without misattributing
 * them to a different note position.
 */
export function buildKeyAttemptFromGuided(
  bestPerNote: readonly (number | null)[],
  tonicMidi: number,
  scaleDegrees: readonly number[],
): KeyAttemptResult {
  const notes: NoteScore[] = scaleDegrees.map((degree, i) => {
    const targetMidi = tonicMidi + degree;
    const cents = bestPerNote[i] ?? null;

    if (cents === null) {
      return {
        targetMidi,
        meanCentsDeviation: 0,
        accuracyPct: 0,
        framesAboveClarity: 0,
      };
    }

    // Single synthesized frame so coaching's pickRepresentative can derive
    // an hz for contrast playback. cents → ratio: 2^(cents/1200).
    const userHz = midiToHz(targetMidi) * Math.pow(2, cents / 1200);
    const trace: NotePitchTrace[] = [
      { tMs: 0, hz: userHz, cents, clarity: 0.95 },
    ];

    return {
      targetMidi,
      meanCentsDeviation: cents,
      // Same ±50¢ rule the standard scorer uses; binary because Guided
      // doesn't expose a frame-level distribution.
      accuracyPct: Math.abs(cents) <= 50 ? 100 : 0,
      framesAboveClarity: SYNTHETIC_FRAMES_PER_MATCH,
      trace,
    };
  });

  const matched = notes.filter((n) => n.framesAboveClarity > 0);
  const meanAccuracyPct =
    matched.length > 0
      ? matched.reduce((s, n) => s + n.accuracyPct, 0) / matched.length
      : 0;
  const meanCentsDeviation =
    matched.length > 0
      ? matched.reduce((s, n) => s + n.meanCentsDeviation, 0) / matched.length
      : 0;

  return {
    tonic: midiToNote(tonicMidi),
    notes,
    meanAccuracyPct,
    meanCentsDeviation,
  };
}

/**
 * Synthesize a minimal KeyIteration[] for the coaching engine's adapter
 * (`fromKeyAttempts`) — it only reads `events` to pick syllables. Timing
 * fields are zeroed because they aren't read on the coaching path.
 */
export function synthesizeGuidedIteration(
  exercise: ExerciseDescriptor,
  tonicMidi: number,
): KeyIteration[] {
  const syllables =
    exercise.syllables.length === 1
      ? Array(exercise.scaleDegrees.length).fill(exercise.syllables[0])
      : exercise.syllables;
  const events: NoteEvent[] = exercise.scaleDegrees.map((deg, i) => ({
    type: "melody",
    midi: tonicMidi + deg,
    noteName: midiToNote(tonicMidi + deg),
    syllable: syllables[i] ?? "",
    startTime: 0,
    duration: 0,
    velocity: 0.85,
  }));
  return [
    {
      tonic: midiToNote(tonicMidi),
      tonicMidi,
      events,
      cueDurationSec: 0,
      melodyStartSec: 0,
      totalDurationSec: 0,
    },
  ];
}

