export type VoicePart =
  | "tenor"
  | "baritone"
  | "bass"
  | "alto"
  | "soprano"
  | "mezzo";

export type AccompanimentPattern =
  | "blockChordOnDownbeat"
  | "doubledMelody"
  | "rootOctaveDrone"
  | "openFifthDrone"
  | "rhythmicStab"
  | "sustainedChord"
  | "none";

export type CueType = "none" | "ding" | "block" | "bell" | "v7" | "tonic-hold";

export type Direction = "ascending" | "descending" | "both";

// Five PRD-defined presets (§2). When set on PlanInput, overrides the descriptor's
// accompaniment block unless the descriptor has lockAccompaniment: true.
export type AccompanimentPreset =
  | "classical"   // block I chord, no doubling, V7 cue — most musical
  | "studio"      // block I chord, melody doubled on top, bell cue
  | "beginner"    // doubled melody throughout, ding cue
  | "lip-trill"   // doubled melody only (no chord), ding cue
  | "drone";      // open-fifth LH drone only, no cue

export const ACCOMPANIMENT_PRESETS: Record<AccompanimentPreset, AccompanimentSpec> = {
  classical: { pattern: "blockChordOnDownbeat", doubleMelody: false, cueType: "v7", cueDurationBeats: 2 },
  studio:    { pattern: "blockChordOnDownbeat", doubleMelody: true,  cueType: "bell", cueDurationBeats: 1 },
  beginner:  { pattern: "doubledMelody",        doubleMelody: true,  cueType: "ding", cueDurationBeats: 1 },
  "lip-trill": { pattern: "doubledMelody",      doubleMelody: true,  cueType: "ding", cueDurationBeats: 1 },
  drone:     { pattern: "openFifthDrone",       doubleMelody: false, cueType: "none" },
};

export interface KeyRange {
  lowest: string;
  highest: string;
  step: number;
}

export interface AccompanimentSpec {
  pattern: AccompanimentPattern;
  doubleMelody: boolean;
  cueType: CueType;
  cueDurationBeats?: number;
  voicing?: "close" | "open";
}

export interface ScoringHints {
  /** Pitchy clarity gate, 0..1. Default 0.85; lower for SOVT/lip-trill (noisy buzz). */
  clarityThreshold?: number;
  /** Consecutive frames required to accept an octave jump. Default 3; set to 2 for staccato/arpeggio. */
  octaveJumpFrames?: number;
  /** Min frames per stable segment in alignment. Default 5; lower for fast notes. */
  segMinFrames?: number;
  /** Min duration (ms) per stable segment. Default 80; lower for fast notes. */
  segMinDurationMs?: number;
  /** Within-segment pitch coherence band (cents). Default 75; widen for trills (~200). */
  pitchCoherenceCents?: number;
  /** Silence-gap that closes a segment (ms). Default 150; shorter for fast tempos. */
  silenceGapMs?: number;
  /** Segments shorter than this are eligible for false-start filtering. Default 200. */
  falseStartMaxDurationMs?: number;
  /** Distance to a longer neighbor that triggers false-start filtering (ms). Default 150. */
  falseStartNeighborGapMs?: number;
}

export interface ExerciseDescriptor {
  id: string;
  name: string;
  pedagogy: string;
  scaleDegrees: number[];
  syllables: string[];
  noteValue: string;
  tempo: number;
  voicePartRanges: Partial<Record<VoicePart, KeyRange>>;
  accompaniment: AccompanimentSpec;
  // When true, AccompanimentPreset overrides on PlanInput are ignored.
  lockAccompaniment?: boolean;
  direction?: Direction;
  tags?: string[];
  scoringHints?: ScoringHints;
  // Per-note durations in beats relative to descriptor.tempo. When present,
  // length must equal scaleDegrees.length and overrides noteValue.
  durations?: number[];
}

export type NoteEventType = "melody" | "accompaniment" | "cue" | "tick";

export interface NoteEvent {
  type: NoteEventType;
  noteName: string;
  midi: number;
  startTime: number;
  duration: number;
  velocity: number;
  syllable?: string;
  isTarget?: boolean;
  // When set, the audio player should play this exact frequency (in Hz)
  // instead of noteName. Used to substitute the user's actual sung pitch
  // into a coaching playback so the wrong note is audible on the same piano tone.
  hzOverride?: number;
}

export interface KeyIteration {
  tonic: string;
  tonicMidi: number;
  events: NoteEvent[];
  totalDurationSec: number;
  /** Seconds from iteration start when the melody (first singer note) begins. */
  melodyStartSec: number;
  /** Seconds from iteration start when the cue ends. */
  cueDurationSec: number;
}
