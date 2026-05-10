// Post-pattern alignment scoring: buffer all samples for a key, then find N
// stable pitch segments, match them to the expected note targets via DP
// alignment, and produce one NoteScore per target.

import type { PitchSample } from "../pitch/detector";
import type { NoteScore, NotePitchTrace } from "./types";

// ±50¢ in-tune threshold
const ACCURACY_CENTS_WINDOW = 50;

// Defaults — overridable per-exercise via AlignConfig
const DEFAULT_SEG_MIN_FRAMES = 5;
const DEFAULT_SEG_MIN_DURATION_MS = 80;
const DEFAULT_PITCH_COHERENCE_CENTS = 75;
const DEFAULT_SILENCE_GAP_MS = 150;
const DEFAULT_FALSE_START_MAX_DURATION_MS = 200;
const DEFAULT_FALSE_START_NEIGHBOR_GAP_MS = 150;

const FALSE_START_PITCH_TOLERANCE_MIDI = 1.0; // semitones

// Mid-segment legato-slur split threshold
const LEGATO_SPLIT_CENTS = 200;

// DP alignment penalties (in semitones — same unit as pitch distance cost)
const PENALTY_SKIP_TARGET = 6;
const PENALTY_SKIP_SEGMENT = 6;

// At least this fraction of targets must be matched; else treat as ungradable
const MIN_MATCH_FRACTION = 0.4;

// Defensive cap on per-note trace length
const MAX_TRACE_FRAMES = 200;

export interface AlignConfig {
  segMinFrames?: number;
  segMinDurationMs?: number;
  pitchCoherenceCents?: number;
  silenceGapMs?: number;
  falseStartMaxDurationMs?: number;
  falseStartNeighborGapMs?: number;
}

interface ResolvedAlignConfig {
  segMinFrames: number;
  segMinDurationMs: number;
  pitchCoherenceCents: number;
  silenceGapMs: number;
  falseStartMaxDurationMs: number;
  falseStartNeighborGapMs: number;
}

function resolveConfig(c?: AlignConfig): ResolvedAlignConfig {
  return {
    segMinFrames: c?.segMinFrames ?? DEFAULT_SEG_MIN_FRAMES,
    segMinDurationMs: c?.segMinDurationMs ?? DEFAULT_SEG_MIN_DURATION_MS,
    pitchCoherenceCents: c?.pitchCoherenceCents ?? DEFAULT_PITCH_COHERENCE_CENTS,
    silenceGapMs: c?.silenceGapMs ?? DEFAULT_SILENCE_GAP_MS,
    falseStartMaxDurationMs: c?.falseStartMaxDurationMs ?? DEFAULT_FALSE_START_MAX_DURATION_MS,
    falseStartNeighborGapMs: c?.falseStartNeighborGapMs ?? DEFAULT_FALSE_START_NEIGHBOR_GAP_MS,
  };
}

function midiToHz(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function centsDiff(hz: number, targetMidi: number): number {
  return 1200 * Math.log2(hz / midiToHz(targetMidi));
}

// Snap octave errors from pitchy's harmonic confusion
function snapOctave(rawMidi: number, targetMidi: number): number {
  const diff = rawMidi - targetMidi;
  if (diff >= 10.5 && diff <= 13.5) return rawMidi - 12;
  if (diff <= -10.5 && diff >= -13.5) return rawMidi + 12;
  if (diff >= 22.5 && diff <= 25.5) return rawMidi - 24;
  if (diff <= -22.5 && diff >= -25.5) return rawMidi + 24;
  return rawMidi;
}

export interface ScoredFrame {
  tMs: number;        // ms since segment start
  hz: number;         // octave-snapped Hz (snapped against segment median at scoring time)
  snappedMidi: number;
  centsVsMedian: number;  // deviation from segment's running median
  clarity: number;
}

export interface Segment {
  startMs: number;
  endMs: number;
  medianPitchMidi: number;  // median over all frames' raw (pre-target-snap) MIDI
  frames: ScoredFrame[];
}

// Continuous MIDI from Hz (not rounded)
function hzToMidiContinuous(hz: number): number {
  return 69 + 12 * Math.log2(hz / 440);
}

// Running median over an array of numbers (recomputed each append — fine for
// segment sizes of ≤200 frames)
function arrayMedian(values: number[]): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}

/**
 * Pass 1: Walk samples in chronological order and split into contiguous
 * pitch-stable runs. Only clarity-passed (hz !== null) frames are accepted;
 * runs are broken by silence gaps, large pitch jumps, or mid-segment slurs.
 * Frames before leadInEndMs are discarded.
 */
export function segment(samples: PitchSample[], leadInEndMs: number, config?: AlignConfig): Segment[] {
  const cfg = resolveConfig(config);
  const segments: Segment[] = [];

  // Working state for the current open segment
  let openFrames: (PitchSample & { contMidi: number })[] = [];
  let lastClarityPassedMs: number | null = null;
  let runningMidis: number[] = [];

  function closeSegment() {
    if (openFrames.length === 0) return;
    const median = arrayMedian(runningMidis);
    const startMs = openFrames[0]!.timestamp;
    const endMs = openFrames[openFrames.length - 1]!.timestamp;
    const scored: ScoredFrame[] = openFrames.map((f) => ({
      tMs: f.timestamp - startMs,
      hz: f.hz!,
      snappedMidi: f.contMidi,   // target-snap applied later per matched target
      centsVsMedian: (f.contMidi - median) * 100,
      clarity: f.clarity,
    }));
    segments.push({ startMs, endMs, medianPitchMidi: median, frames: scored });
    openFrames = [];
    runningMidis = [];
  }

  for (const s of samples) {
    if (s.timestamp < leadInEndMs) continue;

    const passed = s.hz !== null && s.clarity >= 0.85;

    if (!passed) {
      // Check if the silence gap is long enough to close the segment
      if (openFrames.length > 0 && lastClarityPassedMs !== null) {
        const gapMs = s.timestamp - lastClarityPassedMs;
        if (gapMs >= cfg.silenceGapMs) closeSegment();
      }
      continue;
    }

    const contMidi = hzToMidiContinuous(s.hz!);
    lastClarityPassedMs = s.timestamp;

    if (openFrames.length === 0) {
      // Start new segment
      openFrames.push({ ...s, contMidi });
      runningMidis.push(contMidi);
      continue;
    }

    const currentMedian = arrayMedian(runningMidis);

    // Check mid-segment legato slur: consecutive-frame pitch jump > LEGATO_SPLIT_CENTS
    const prevMidi = openFrames[openFrames.length - 1]!.contMidi;
    const frameJumpCents = Math.abs(contMidi - prevMidi) * 100;
    if (frameJumpCents > LEGATO_SPLIT_CENTS) {
      closeSegment();
      openFrames.push({ ...s, contMidi });
      runningMidis.push(contMidi);
      continue;
    }

    // Check coherence: pitch outside the configured band from running median → close and start new
    const deviationCents = Math.abs(contMidi - currentMedian) * 100;
    if (deviationCents > cfg.pitchCoherenceCents) {
      closeSegment();
      openFrames.push({ ...s, contMidi });
      runningMidis.push(contMidi);
      continue;
    }

    openFrames.push({ ...s, contMidi });
    runningMidis.push(contMidi);
  }

  closeSegment();
  return segments;
}

/**
 * Pass 2: Drop micro-segments and false starts (a short segment immediately
 * before a longer neighbor at a similar pitch is likely a pre-entry wobble).
 */
export function filterSegments(segments: Segment[], config?: AlignConfig): Segment[] {
  const cfg = resolveConfig(config);
  // First drop segments below the hard minimums
  const coarse = segments.filter(
    (s) =>
      s.frames.length >= cfg.segMinFrames &&
      s.endMs - s.startMs >= cfg.segMinDurationMs,
  );

  // Then drop false starts
  return coarse.filter((seg, i) => {
    const dur = seg.endMs - seg.startMs;
    if (dur >= cfg.falseStartMaxDurationMs) return true; // long enough to keep

    // Look at adjacent segments to see if this is a pre-entry wobble
    for (let j = 0; j < coarse.length; j++) {
      if (j === i) continue;
      const neighbor = coarse[j]!;
      const neighborDur = neighbor.endMs - neighbor.startMs;
      if (neighborDur <= dur) continue; // neighbor not longer

      const gap = Math.min(
        Math.abs(seg.startMs - neighbor.endMs),
        Math.abs(neighbor.startMs - seg.endMs),
      );
      if (gap > cfg.falseStartNeighborGapMs) continue;

      const pitchDiff = Math.abs(seg.medianPitchMidi - neighbor.medianPitchMidi);
      if (pitchDiff <= FALSE_START_PITCH_TOLERANCE_MIDI) return false; // drop
    }
    return true;
  });
}

/**
 * Pass 3: DP alignment of M filtered segments against N expected targets.
 * Returns an array of length N; each slot is either the matched Segment or null.
 *
 * When M === N: simple 1:1 zip by temporal order.
 * Otherwise: Needleman-Wunsch DP with semitone-distance cost + gap penalties.
 * If too few targets are matched, returns a null-filled array (ungradable).
 */
export function matchToTargets(
  segments: Segment[],
  targets: number[],
): (Segment | null)[] {
  const M = segments.length;
  const N = targets.length;
  const result: (Segment | null)[] = new Array(N).fill(null);

  if (N === 0) return result;
  if (M === 0) return result;

  // Fast path: exact count match — zip 1:1 (segments already in temporal order)
  if (M === N) {
    for (let i = 0; i < N; i++) result[i] = segments[i]!;
    return result;
  }

  // DP alignment. dp[i][j] = min cost to align first i segments with first j targets.
  // i indexes segments (0..M), j indexes targets (0..N).
  const dp: number[][] = Array.from({ length: M + 1 }, () =>
    new Array(N + 1).fill(Infinity),
  );
  dp[0]![0] = 0;
  // Skip leading targets (unsung) — each costs PENALTY_SKIP_TARGET
  for (let j = 1; j <= N; j++) dp[0]![j] = j * PENALTY_SKIP_TARGET;
  // Skip leading segments (extra noise) — each costs PENALTY_SKIP_SEGMENT
  for (let i = 1; i <= M; i++) dp[i]![0] = i * PENALTY_SKIP_SEGMENT;

  for (let i = 1; i <= M; i++) {
    for (let j = 1; j <= N; j++) {
      const matchCost =
        Math.abs(segments[i - 1]!.medianPitchMidi - targets[j - 1]!);
      const align = dp[i - 1]![j - 1]! + matchCost;
      const skipSeg = dp[i - 1]![j]! + PENALTY_SKIP_SEGMENT;  // extra segment
      const skipTgt = dp[i]![j - 1]! + PENALTY_SKIP_TARGET;   // missed target
      dp[i]![j] = Math.min(align, skipSeg, skipTgt);
    }
  }

  // Traceback
  const matched = new Set<number>(); // target indices matched
  let i = M, j = N;
  while (i > 0 || j > 0) {
    if (i === 0) { j--; continue; }
    if (j === 0) { i--; continue; }
    const matchCost =
      Math.abs(segments[i - 1]!.medianPitchMidi - targets[j - 1]!);
    const vAlign = dp[i - 1]![j - 1]! + matchCost;
    const vSkipSeg = dp[i - 1]![j]! + PENALTY_SKIP_SEGMENT;
    const vSkipTgt = dp[i]![j - 1]! + PENALTY_SKIP_TARGET;
    const best = Math.min(vAlign, vSkipSeg, vSkipTgt);
    if (best === vAlign) {
      result[j - 1] = segments[i - 1]!;
      matched.add(j - 1);
      i--; j--;
    } else if (best === vSkipSeg) {
      i--;
    } else {
      j--;
    }
  }

  // Reliability gate
  const minRequired = Math.max(1, Math.ceil(N * MIN_MATCH_FRACTION));
  if (matched.size < minRequired) return new Array(N).fill(null);

  return result;
}

/**
 * Top-level orchestrator. Buffers all PitchSamples for one key, segments them,
 * filters false starts, matches to targets, and produces one NoteScore per target.
 *
 * @param samples      All PitchSamples received during this key (key-relative timestamps).
 * @param targets      Expected MIDI pitches in pattern order.
 * @param leadInEndMs  Samples before this timestamp are discarded (cue + lead-in ticks).
 * @param syllables    For trace labelling only; not used in scoring math.
 */
export function alignAndScore(
  samples: PitchSample[],
  targets: number[],
  leadInEndMs: number,
  _syllables: string[],
  config?: AlignConfig,
): NoteScore[] {
  const segs = segment(samples, leadInEndMs, config);
  const filtered = filterSegments(segs, config);
  const matched = matchToTargets(filtered, targets);

  return matched.map((seg, tIdx) => {
    const targetMidi = targets[tIdx]!;

    if (seg === null) {
      // Unmatched target — return empty NoteScore (renders as "—")
      return {
        targetMidi,
        meanCentsDeviation: 0,
        accuracyPct: 0,
        framesAboveClarity: 0,
        samplesInWindow: 0,
        trace: [],
      };
    }

    let weightedCentsSum = 0;
    let totalWeight = 0;
    let accurateFrames = 0;
    const trace: NotePitchTrace[] = [];

    for (const f of seg.frames) {
      // Apply per-target octave snap: snap the frame's continuous MIDI against
      // this target so that harmonic errors are corrected relative to the target.
      const snapped = snapOctave(f.snappedMidi, targetMidi);
      const scoringHz = snapped === f.snappedMidi ? f.hz : midiToHz(snapped);
      const cents = centsDiff(scoringHz, targetMidi);

      weightedCentsSum += cents * f.clarity;
      totalWeight += f.clarity;
      if (Math.abs(cents) <= ACCURACY_CENTS_WINDOW) accurateFrames++;

      if (trace.length < MAX_TRACE_FRAMES) {
        trace.push({
          tMs: f.tMs,
          hz: scoringHz,
          cents,
          clarity: f.clarity,
        });
      }
    }

    const framesAboveClarity = seg.frames.length;
    const meanCentsDeviation = totalWeight > 0 ? weightedCentsSum / totalWeight : 0;
    const accuracyPct =
      framesAboveClarity > 0 ? (accurateFrames / framesAboveClarity) * 100 : 0;

    return {
      targetMidi,
      meanCentsDeviation,
      accuracyPct,
      framesAboveClarity,
      samplesInWindow: framesAboveClarity,
      trace,
    };
  });
}
