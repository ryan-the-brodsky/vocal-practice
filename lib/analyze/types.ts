// Analysis result types for the offline melody-import pipeline.

export type AnalysisMode = "major" | "minor" | "chromatic";

export interface ExtractedNote {
  startMs: number;
  endMs: number;
  medianHz: number;
  // Pre-snap continuous MIDI from the segment median pitch
  medianMidiContinuous: number;
  // Post key-snap MIDI (integer)
  snappedMidi: number;
  // Semitones from tonic; can be negative or >11
  scaleDegree: number;
  // Signed cents: snappedMidi vs medianMidiContinuous
  centsOff: number;
  durationBeats: number;
  syllable?: string;
  framesUsed: number;
  // True when the in-key snap exceeded the chromatic-fallback tolerance
  outOfKey: boolean;
}

export interface ScaleDegreeStats {
  // Pitch class within the octave (0..11), in semitones from tonic
  scaleDegree: number;
  diatonicLabel: string;
  occurrences: number;
  meanCentsOff: number;
  // % of notes for this degree within ±25¢
  hitRatePct: number;
  variance: number;
}

export interface MelodyGlaring {
  kind: "consistent" | "outlier";
  // Set when kind === "consistent"
  scaleDegree?: number;
  // Set when kind === "outlier"
  noteIndex?: number;
  summary: string;
}

export interface MelodyAnalysis {
  notes: ExtractedNote[];
  perScaleDegree: ScaleDegreeStats[];
  glaring: MelodyGlaring | null;
  tonic: string;
  mode: AnalysisMode;
  tempoBpm: number;
  durationSec: number;
  // Non-fatal warnings to surface in the review UI (e.g. tempo fallback)
  warnings: string[];
  // Optional meter; user-supplied at song import. No auto-detection.
  timeSignature?: TimeSignature;
}

/** Supported time signatures (v1: only these three). */
export interface TimeSignature {
  num: 4 | 3 | 6;
  den: 4 | 8;
}

/** Beats per measure in quarter-note units. Matches durationBeats's unit
 *  (set by `keysnap.ts` as `(durationMs/1000) * (tempoBpm/60)`). */
export function beatsPerMeasure(ts: TimeSignature): number {
  return ts.num * (4 / ts.den);
}
