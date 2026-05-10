// Wraps the live scorer's segment + filterSegments primitives with offline-tuned
// thresholds (slightly stricter — no DP-anchor to rescue ambiguous segments).

import type { PitchSample } from "../pitch/detector";
import { segment, filterSegments, type Segment, type AlignConfig } from "../scoring/align";
import { ANALYZE_CONFIG } from "./config";

export type { Segment } from "../scoring/align";

export function extractSegments(
  samples: PitchSample[],
  overrides: AlignConfig = {},
): Segment[] {
  const cfg: AlignConfig = {
    segMinFrames: overrides.segMinFrames ?? ANALYZE_CONFIG.segMinFrames,
    segMinDurationMs: overrides.segMinDurationMs ?? ANALYZE_CONFIG.segMinDurationMs,
    pitchCoherenceCents: overrides.pitchCoherenceCents ?? ANALYZE_CONFIG.pitchCoherenceCents,
    silenceGapMs: overrides.silenceGapMs ?? ANALYZE_CONFIG.silenceGapMs,
    falseStartMaxDurationMs: overrides.falseStartMaxDurationMs ?? ANALYZE_CONFIG.falseStartMaxDurationMs,
    falseStartNeighborGapMs: overrides.falseStartNeighborGapMs ?? ANALYZE_CONFIG.falseStartNeighborGapMs,
  };
  const raw = segment(samples, 0, cfg);
  return filterSegments(raw, cfg);
}
