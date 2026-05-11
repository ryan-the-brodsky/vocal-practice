// Scorer: buffer-and-finalize model.
// Samples accumulate during a key; finalize() calls alignAndScore() to produce
// NoteScores without any real-time eval-window logic or latency sensitivity.

import type { PitchSample } from "../pitch/detector";
import type { NoteEvent } from "../exercises/types";
import type { KeyAttemptResult, NoteScore } from "./types";
import { alignAndScore, type AlignConfig } from "./align";

// ±50¢ is the "in tune" threshold for accuracy percentage
const ACCURACY_CENTS_WINDOW = 50;

export class Scorer {
  private readonly targets: NoteEvent[];
  private readonly leadInEndMs: number;
  private readonly syllables: string[];
  private readonly alignConfig?: AlignConfig;
  private readonly buffer: PitchSample[] = [];

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

  /** Append one pitch sample. Timestamp must be key-relative (ms).
   *  Stored raw — octave-error correction happens in alignAndScore() against
   *  each segment's matched target, where the temporally-correct reference is
   *  known. (Snapping per-sample against the globally-nearest target picked
   *  the wrong reference when a note's sub-harmonic landed nearer a different
   *  scale degree.) */
  append(sample: PitchSample): void {
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
