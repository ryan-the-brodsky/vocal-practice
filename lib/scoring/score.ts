// Scorer: buffer-and-finalize model.
// Samples accumulate during a key; finalize() calls alignAndScore() to produce
// NoteScores without any real-time eval-window logic or latency sensitivity.

import type { PitchSample } from "../pitch/detector";
import type { NoteEvent } from "../exercises/types";
import type { KeyAttemptResult, NoteScore } from "./types";
import { alignAndScore, type AlignConfig } from "./align";

// ±50¢ is the "in tune" threshold for accuracy percentage
const ACCURACY_CENTS_WINDOW = 50;

// Snap a detected continuous MIDI to the correct octave when pitchy latches
// onto a sub/super-harmonic.  Tolerances: ±150¢ around ±12 or ±24 semitones.
export function snapOctave(sampleMidi: number, targetMidi: number): number {
  const diff = sampleMidi - targetMidi;
  if (diff >= 10.5 && diff <= 13.5) return sampleMidi - 12;
  if (diff <= -10.5 && diff >= -13.5) return sampleMidi + 12;
  if (diff >= 22.5 && diff <= 25.5) return sampleMidi - 24;
  if (diff <= -22.5 && diff >= -25.5) return sampleMidi + 24;
  return sampleMidi;
}

export class Scorer {
  private readonly targets: NoteEvent[];
  private readonly leadInEndMs: number;
  private readonly syllables: string[];
  private readonly alignConfig?: AlignConfig;
  private readonly buffer: PitchSample[] = [];

  /** How many frames were octave-snapped during this key — for debug inspection. */
  octaveSnapsApplied = 0;

  constructor(
    targets: NoteEvent[],
    leadInEndMs: number,
    syllables: string[] = [],
    alignConfig?: AlignConfig,
  ) {
    this.targets = targets.filter((n) => n.type === "melody" && n.duration > 0);
    this.leadInEndMs = leadInEndMs;
    this.syllables = syllables;
    this.alignConfig = alignConfig;
  }

  /** Append one pitch sample. Timestamp must be key-relative (ms). */
  append(sample: PitchSample): void {
    // Pre-apply octave snap against each potential target so the buffer holds
    // already-corrected pitches.  We snap against the nearest target midi to
    // avoid bias toward a specific note position.
    if (sample.hz !== null && this.targets.length > 0) {
      const rawMidi = 69 + 12 * Math.log2(sample.hz / 440);
      // Find nearest target by semitone distance
      let nearestMidi = this.targets[0]!.midi;
      let minDist = Math.abs(rawMidi - nearestMidi);
      for (const t of this.targets) {
        const d = Math.abs(rawMidi - t.midi);
        if (d < minDist) { minDist = d; nearestMidi = t.midi; }
      }
      const snapped = snapOctave(rawMidi, nearestMidi);
      if (snapped !== rawMidi) {
        this.octaveSnapsApplied++;
        const snappedHz = 440 * Math.pow(2, (snapped - 69) / 12);
        this.buffer.push({ ...sample, hz: snappedHz });
        return;
      }
    }
    this.buffer.push(sample);
  }

  /**
   * Live snapshot: returns a partial NoteScore per target using the buffer
   * accumulated so far.  Runs a quick alignAndScore on current buffer so the
   * per-note chip strip updates during playback.
   */
  getNoteSnapshots(): NoteScore[] {
    if (this.buffer.length === 0 || this.targets.length === 0) {
      return this.targets.map((t) => ({
        targetMidi: t.midi,
        meanCentsDeviation: 0,
        accuracyPct: 0,
        framesAboveClarity: 0,
        samplesInWindow: 0,
        trace: [],
      }));
    }
    const targetMidis = this.targets.map((t) => t.midi);
    return alignAndScore(this.buffer, targetMidis, this.leadInEndMs, this.syllables, this.alignConfig);
  }

  /** Finalize: run full alignment and produce the KeyAttemptResult. */
  finalize(tonic: string): KeyAttemptResult {
    const targetMidis = this.targets.map((t) => t.midi);
    const notes =
      targetMidis.length > 0
        ? alignAndScore(this.buffer, targetMidis, this.leadInEndMs, this.syllables, this.alignConfig)
        : [];

    const scoredNotes = notes.filter((n) => (n.samplesInWindow ?? 0) > 0);
    const meanAccuracyPct =
      scoredNotes.length > 0
        ? scoredNotes.reduce((s, n) => s + n.accuracyPct, 0) / scoredNotes.length
        : 0;
    const meanCentsDeviation =
      scoredNotes.length > 0
        ? scoredNotes.reduce((s, n) => s + n.meanCentsDeviation, 0) / scoredNotes.length
        : 0;

    return { tonic, notes, meanAccuracyPct, meanCentsDeviation };
  }
}

// Re-export so external callers that import ACCURACY_CENTS_WINDOW don't break.
export { ACCURACY_CENTS_WINDOW };
