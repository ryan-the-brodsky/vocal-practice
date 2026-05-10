// Three-stage postprocessor: clarity gate → median filter → octave-jump constraint.
// Pure TS, no platform dependencies.

import type { PitchSample } from "./detector";

// Convert MIDI note number to Hz (equal temperament, A4=440)
function midiToHz(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// Compute signed cents deviation of hz from the nearest MIDI semitone (-50..+50)
function computeCents(hz: number): { midi: number; cents: number } {
  const midi = Math.round(69 + 12 * Math.log2(hz / 440));
  const cents = 1200 * Math.log2(hz / midiToHz(midi));
  return { midi, cents };
}

// Compute RMS dB from a linear amplitude value (-∞..0 dB)
function rmsLinearToDb(rms: number): number {
  if (rms <= 0) return -Infinity;
  return 20 * Math.log10(rms);
}

// Sort a copy of an array and return the median value
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  // For even-length arrays, average the two middle values
  return sorted.length % 2 === 1
    ? sorted[mid]!
    : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

export class PitchPostprocessor {
  private clarityThreshold: number;
  private readonly smoothingFrames: number;    // ring buffer size for median
  private octaveJumpFrames: number;            // consecutive frames required to accept a jump

  // Ring buffer of accepted (clarity-passed) Hz values for median filtering
  private readonly ringBuf: (number | null)[];
  private ringHead = 0;
  private ringCount = 0;

  // Current stable median Hz (output of median stage)
  private currentMedianHz: number | null = null;

  // Pending octave-jump tracking
  private jumpCandidateHz: number | null = null;
  private jumpCandidateCount = 0;

  private startTimeMs: number | null = null;

  constructor(
    clarityThreshold = 0.85,
    smoothingFrames = 5,
    octaveJumpFrames = 3
  ) {
    this.clarityThreshold = clarityThreshold;
    this.smoothingFrames = smoothingFrames;
    this.octaveJumpFrames = octaveJumpFrames;
    this.ringBuf = new Array<number | null>(smoothingFrames).fill(null);
  }

  /** Call once when the detector starts to anchor timestamp=0. */
  setStartTime(ms: number): void {
    this.startTimeMs = ms;
  }

  /**
   * Push a raw pitchy output frame and receive a fully-processed PitchSample.
   * @param rawHz    - raw Hz from pitchy (or 0/NaN if no pitch)
   * @param clarity  - clarity from pitchy (0..1)
   * @param rmsLinear - RMS amplitude of the frame (0..1)
   * @param timestamp - absolute ms timestamp of the frame
   */
  push(
    rawHz: number,
    clarity: number,
    rmsLinear: number,
    timestamp: number
  ): PitchSample {
    const rmsDb = rmsLinearToDb(rmsLinear);
    const ts = this.startTimeMs !== null ? timestamp - this.startTimeMs : 0;

    // Stage 1: clarity gate — drop frames below threshold
    if (clarity < this.clarityThreshold || rawHz <= 0 || !isFinite(rawHz)) {
      return { hz: null, midi: null, cents: null, clarity, rmsDb, timestamp: ts };
    }

    // Stage 2: octave-jump constraint
    const hz = this.applyOctaveConstraint(rawHz);
    if (hz === null) {
      // Jump candidate is accumulating but not yet confirmed; emit gated null
      return { hz: null, midi: null, cents: null, clarity, rmsDb, timestamp: ts };
    }

    // Push accepted Hz into ring buffer and recompute median
    this.ringBuf[this.ringHead] = hz;
    this.ringHead = (this.ringHead + 1) % this.smoothingFrames;
    if (this.ringCount < this.smoothingFrames) this.ringCount++;

    const filledSlots = this.ringBuf.filter((v): v is number => v !== null);
    this.currentMedianHz = median(filledSlots);

    const medHz = this.currentMedianHz;
    const { midi, cents } = computeCents(medHz);

    return { hz: medHz, midi, cents, clarity, rmsDb, timestamp: ts };
  }

  /** Reset all state (call on stop/restart). */
  reset(): void {
    this.ringBuf.fill(null);
    this.ringHead = 0;
    this.ringCount = 0;
    this.currentMedianHz = null;
    this.jumpCandidateHz = null;
    this.jumpCandidateCount = 0;
    this.startTimeMs = null;
  }

  /** Update clarity threshold at runtime (mirrors PitchDetector.setClarityThreshold). */
  setClarityThreshold(value: number): void {
    this.clarityThreshold = value;
  }

  /** Override the octave-jump confirmation threshold (e.g. 2 for staccato exercises). */
  setOctaveJumpFrames(value: number): void {
    this.octaveJumpFrames = value;
  }

  // Returns accepted Hz or null if the frame is suppressed as an unconfirmed jump
  private applyOctaveConstraint(rawHz: number): number | null {
    if (this.currentMedianHz === null) {
      // No baseline yet; accept the first frame unconditionally
      return rawHz;
    }

    const semitoneDiff =
      Math.abs(12 * Math.log2(rawHz / this.currentMedianHz));

    if (semitoneDiff < 12) {
      // Within one octave of current median — accept immediately
      this.jumpCandidateHz = null;
      this.jumpCandidateCount = 0;
      return rawHz;
    }

    // ≥1 octave jump detected; require octaveJumpFrames consecutive confirmations
    const TOLERANCE = 0.5; // semitones — treat "same candidate" if within 0.5 st
    if (
      this.jumpCandidateHz !== null &&
      Math.abs(12 * Math.log2(rawHz / this.jumpCandidateHz)) < TOLERANCE
    ) {
      this.jumpCandidateCount++;
    } else {
      // New candidate or direction changed
      this.jumpCandidateHz = rawHz;
      this.jumpCandidateCount = 1;
    }

    if (this.jumpCandidateCount >= this.octaveJumpFrames) {
      // Enough consecutive evidence — accept the jump
      const accepted = this.jumpCandidateHz!;
      this.jumpCandidateHz = null;
      this.jumpCandidateCount = 0;
      return accepted;
    }

    return null; // suppress until confirmed
  }
}
