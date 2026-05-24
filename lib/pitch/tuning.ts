// Tempo-aware pitch-detector tuning resolver.
//
// pitchy MPM + `PitchPostprocessor` defaults (clarity 0.85, median window 5,
// octave-jump confirm 3) are tuned for sustained mid-tempo notes (>=0.5 s).
// On fast exercises (goog-octave-arpeggio at tempo 150, 8n => ~0.2 s/note)
// each note barely outlives the median ramp-up + clarity gate, dropping
// coverage from ~95% to ~75%. This resolver scales those three knobs from the
// exercise's per-note seconds.
//
// Used by:
//   - lib/analyze/framewise.ts (offline harness: scripts/eval-corpus.ts)
//   - app/(tabs)/index.tsx + components/practice/GuidedSession.tsx (live)
//
// Explicit ScoringHints fields always win — staccato/octave-leap descriptors
// that already set octaveJumpFrames=2 keep that exact value.

import type { ScoringHints } from "../exercises/types";

export interface DetectorTuning {
  clarityThreshold: number;
  smoothingFrames: number;
  octaveJumpFrames: number;
}

export interface ResolveDetectorTuningInput {
  /** Seconds per expected note. Pass `noteValueToSeconds(noteValue, tempo)`. */
  noteSec: number;
  hints?: ScoringHints;
}

// Defaults below match `PitchPostprocessor`'s constructor defaults and
// `ANALYZE_CONFIG`'s offline defaults. Sustained-note path => unchanged.
const SUSTAINED = { clarityThreshold: 0.85, smoothingFrames: 5, octaveJumpFrames: 3 };
// Fast-note path => more transient-friendly. Validated against the eval
// corpus on goog-octave-arpeggio (noteSec 0.20 s) — coverage 75/80 -> 87/91 %,
// RPA 71/76 -> 81/85 %, mean¢err on par with baseline. Median window stays at
// 5 (smoothing helps the noisier admitted frames); the wins are clarity 0.85
// -> 0.65 (a 0.20 s note loses ~30 ms of attack to the 0.85 gate, the bulk of
// the coverage hit) and octaveJumpFrames 3 -> 1 (instant acceptance of the
// 0->12->0 octave leap so neither edge of the leap drops 30 ms of frames).
const FAST = { clarityThreshold: 0.65, smoothingFrames: 5, octaveJumpFrames: 1 };
// Threshold below which "fast" applies. Anything above 0.30 s gets the
// sustained-note defaults; in between we step (no interpolation — kept simple
// so the live path's exact value is predictable without the noteSec value).
const FAST_NOTE_SEC = 0.30;

export function resolveDetectorTuning(
  input: ResolveDetectorTuningInput,
): DetectorTuning {
  const { noteSec, hints } = input;
  const base = noteSec > 0 && noteSec < FAST_NOTE_SEC ? FAST : SUSTAINED;
  return {
    clarityThreshold: hints?.clarityThreshold ?? base.clarityThreshold,
    smoothingFrames: hints?.smoothingFrames ?? base.smoothingFrames,
    octaveJumpFrames: hints?.octaveJumpFrames ?? base.octaveJumpFrames,
  };
}
