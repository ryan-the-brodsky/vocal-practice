// Single source of truth for offline-pipeline thresholds (§8 of the import plan).

export const ANALYZE_CONFIG = {
  // Stage A — ingestion
  maxFileDurationSec: 600,

  // Stage B — framewise pitch
  frameSize: 2048,
  // Hop seconds — actual hop in samples scales with sampleRate (~10 ms target)
  hopSeconds: 0.01,
  clarityThreshold: 0.85,
  smoothingFrames: 5,
  octaveJumpFrames: 3,

  // Stage C — segmentation (offline-tuned, looser than live for vibrato)
  segMinFrames: 8,
  segMinDurationMs: 100,
  pitchCoherenceCents: 80,
  silenceGapMs: 120,
  falseStartMaxDurationMs: 180,
  falseStartNeighborGapMs: 150,

  // Stage D — keysnap
  outOfKeyToleranceCents: 70,
  // Two in-key candidates within this distance trigger the voice-leading tiebreak
  voiceLeadingTiebreakCents: 30,

  // Stage E — diagnosis
  consistentMinOccurrences: 2,
  consistentMeanAbsCentsThreshold: 20,
  consistentHitRatePctThreshold: 60,
  outlierMinAbsCents: 30,
  congratsBelowAbsCents: 15,
  hitRateWindowCents: 25,

  // Stage F — synth
  tempoEstimationDefault: 88,
  tempoMinBpm: 60,
  tempoMaxBpm: 180,
  // Out-of-key fraction above which a major/minor analysis falls back to drone
  chromaticFallbackFraction: 0.3,
  // Default voice-part range above the source tonic (matches Five-Note Scale-style 6-key range)
  defaultRangeSemitonesAbove: 5,

  // UI / confidence display
  confidenceMinFrames: 5,
} as const;

export type AnalyzeConfig = typeof ANALYZE_CONFIG;
