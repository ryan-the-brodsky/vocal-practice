// Pedagogical voice ranges and per-voice "passaggio" (register transition)
// regions. Used to validate that exercise descriptors stay within a voice's
// comfortable singing range and that warmups actually exercise the relevant
// register zones — guards against off-by-octave descriptor bugs and copy-paste
// errors between voice-part rows.

import type { VoicePart } from "../exercises/types";
import { noteToMidi } from "../exercises/music";

export interface VoiceRange {
  /** Lowest comfortable note (MIDI). Below this is unrealistic for warmups. */
  lowest: number;
  /** Highest comfortable note (MIDI). Above this is unrealistic for warmups. */
  highest: number;
  /** Mid-passaggio MIDI — the register-transition center this voice should regularly traverse. */
  passaggio: number;
}

// Ranges sourced from common vocal pedagogy texts (Miller, Doscher, Sundberg).
// "Comfortable" upper bound is intentionally generous — extended warmups can
// reach a 4th above the typical tessitura, especially in head voice / falsetto.
// The validator's purpose is to catch off-by-octave bugs and "tenor singing
// in baritone register" style mistakes, not to enforce conservative tessitura.
export const VOICE_RANGES: Record<VoicePart, VoiceRange> = {
  bass:    { lowest: noteToMidi("E2"),  highest: noteToMidi("F4"),  passaggio: noteToMidi("Bb3") },
  baritone:{ lowest: noteToMidi("G2"),  highest: noteToMidi("A4"),  passaggio: noteToMidi("D4")  },
  tenor:   { lowest: noteToMidi("C3"),  highest: noteToMidi("D5"),  passaggio: noteToMidi("F4")  },
  alto:    { lowest: noteToMidi("F3"),  highest: noteToMidi("F5"),  passaggio: noteToMidi("E4")  },
  mezzo:   { lowest: noteToMidi("A3"),  highest: noteToMidi("A5"),  passaggio: noteToMidi("F4")  },
  soprano: { lowest: noteToMidi("C4"),  highest: noteToMidi("C6"),  passaggio: noteToMidi("F#5") },
};

export interface DescriptorRangeIssue {
  voicePart: VoicePart;
  /** "below" / "above" / "no-passaggio" / "step-invalid" / "range-inverted" */
  kind: "below" | "above" | "no-passaggio" | "step-invalid" | "range-inverted";
  message: string;
}

export interface DescriptorLike {
  id: string;
  scaleDegrees: number[];
  voicePartRanges: Partial<Record<VoicePart, { lowest: string; highest: string; step: number }>>;
}

/**
 * Validate that an exercise descriptor's voice-part ranges are pedagogically
 * sensible. Returns a flat list of issues; an empty array means the
 * descriptor passes.
 *
 * Rules:
 *  1. Lowest sung pitch (lowest tonic + min scaleDegree) must be ≥ voice.lowest.
 *  2. Highest sung pitch (highest tonic + max scaleDegree) must be ≤ voice.highest.
 *  3. The exercise must reach within ±5 semitones of the voice's passaggio at
 *     some point during the iteration (otherwise it's not actually warming up
 *     the singer). Exception: SOVT exercises tagged 'sovt' get a wider tolerance
 *     because chest-register lip-trills/ng-sirens deliberately stay low.
 *  4. step > 0 (must modulate).
 *  5. lowest ≤ highest tonic.
 */
export function validateDescriptorRanges(
  descriptor: DescriptorLike,
  opts: { sovt?: boolean } = {},
): DescriptorRangeIssue[] {
  const issues: DescriptorRangeIssue[] = [];
  const minDeg = Math.min(...descriptor.scaleDegrees);
  const maxDeg = Math.max(...descriptor.scaleDegrees);
  // To "traverse the passaggio" the highest sung pitch (at the highest tonic
  // iteration) must reach AT LEAST passaggio - belowTolerance. For SOVT
  // exercises (lip trills, sirens) chest-only is fine, so the tolerance is
  // wide. Catches the canonical bug: tenor warmup that peaks at D4 (chest)
  // and never crosses the F4 passaggio.
  const belowTolerance = opts.sovt ? 12 : 1;

  for (const [vp, range] of Object.entries(descriptor.voicePartRanges)) {
    if (!range) continue;
    const voice = vp as VoicePart;
    const limits = VOICE_RANGES[voice];
    if (!limits) continue;

    let lowMidi: number;
    let highMidi: number;
    try {
      lowMidi = noteToMidi(range.lowest);
      highMidi = noteToMidi(range.highest);
    } catch (e) {
      issues.push({
        voicePart: voice,
        kind: "range-inverted",
        message: `${descriptor.id} ${voice}: invalid note name (${(e as Error).message})`,
      });
      continue;
    }

    if (range.step <= 0) {
      issues.push({
        voicePart: voice,
        kind: "step-invalid",
        message: `${descriptor.id} ${voice}: step must be > 0 (got ${range.step})`,
      });
    }

    if (lowMidi > highMidi) {
      issues.push({
        voicePart: voice,
        kind: "range-inverted",
        message: `${descriptor.id} ${voice}: lowest (${range.lowest}=${lowMidi}) > highest (${range.highest}=${highMidi})`,
      });
      continue;
    }

    const lowestSung = lowMidi + minDeg;
    const highestSung = highMidi + maxDeg;

    // SOVT lip-trills/sirens stretch beyond the singer's full-voice range
    // because the closed-mouth airflow restraint reduces vocal-fold strain;
    // give them an extra whole step on each end before flagging.
    const overshoot = opts.sovt ? 2 : 0;

    if (lowestSung < limits.lowest - overshoot) {
      issues.push({
        voicePart: voice,
        kind: "below",
        message: `${descriptor.id} ${voice}: lowest sung pitch ${lowestSung} (tonic ${range.lowest} + min degree ${minDeg}) is below ${voice} comfortable lowest ${limits.lowest}`,
      });
    }
    if (highestSung > limits.highest + overshoot) {
      issues.push({
        voicePart: voice,
        kind: "above",
        message: `${descriptor.id} ${voice}: highest sung pitch ${highestSung} (tonic ${range.highest} + max degree ${maxDeg}) is above ${voice} comfortable highest ${limits.highest}`,
      });
    }

    // Does the highest tonic iteration reach AT LEAST as high as
    // passaggio - belowTolerance? For non-SOVT exercises this is tight (1 st)
    // — the warmup must actually cross the register transition.
    const reachesPassaggio = highestSung >= limits.passaggio - belowTolerance;
    if (!reachesPassaggio) {
      issues.push({
        voicePart: voice,
        kind: "no-passaggio",
        message: `${descriptor.id} ${voice}: highest sung pitch ${highestSung} never reaches passaggio ${limits.passaggio} (top tonic ${range.highest} only peaks ${limits.passaggio - highestSung} st below it)`,
      });
    }
  }

  return issues;
}

/**
 * Clamp a saved tonic MIDI to the [lowest, highest] inclusive range of a
 * voice part for a given exercise. If the saved value is out of range,
 * returns the lowest tonic (matching the screen's "default to lowest" UX).
 *
 * Extracted from `app/(tabs)/index.tsx`'s startTonicMidi memo so the clamping
 * is unit-testable and shared between Standard / Guided / future surfaces.
 */
export function clampTonicToVoiceRange(
  savedTonicMidi: number,
  range: { lowest: string; highest: string },
): number {
  let low: number, high: number;
  try {
    low = noteToMidi(range.lowest);
    high = noteToMidi(range.highest);
  } catch {
    return savedTonicMidi;
  }
  if (savedTonicMidi < low || savedTonicMidi > high) return low;
  return savedTonicMidi;
}
