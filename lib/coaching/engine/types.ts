import type { NotePitchTrace } from "../../scoring/types";
import type { VoicePart } from "../../exercises/types";

export type AdviceCategory =
  | "larynx"
  | "breath"
  | "closure"
  | "resonance"
  | "registration"
  | "tilt"
  | "warmup"
  | "hydration"
  | "posture"
  | "audiation"
  | "practice"
  | "belt"
  | "mix"
  | "intonation";

export type AdviceCardKind = "symptom" | "cause" | "generic";

export interface AdviceCard {
  id: string;
  kind: AdviceCardKind;
  category: AdviceCategory;
  title: string;
  soundsLike?: string;
  whyPitchSuffers?: string;
  fixTip: string;
  tags: string[];
}

export interface NoteObservation {
  keyIndex: number;
  notePosition: number;        // index within pattern
  scaleDegree: number;          // semitones from tonic
  targetMidi: number;
  signedCents: number;          // mean of meanCentsDeviation
  framesAboveClarity: number;
  trace?: NotePitchTrace[];
  syllable?: string;
}

export interface SessionInput {
  notes: NoteObservation[];
  exerciseId?: string;
  voicePart?: VoicePart;
  keyCount: number;
}

export interface FocusNoteHint {
  keyIndex: number;
  notePosition: number;
}

export interface Diagnosis {
  detectorId: string;
  severity: number;              // signed cents or domain-specific scale (see detectors)
  observations: number;          // count of supporting observations
  stddev: number;                // within-group std dev of cents (used by ranker)
  evidenceText: string;
  signedMeanCents?: number;
  focusNoteHints?: FocusNoteHint[];
}

export interface DetectorMapping {
  detectorId: string;
  symptomCardId: string | null;
  candidateCauseCardIds: string[];
}

export interface SavedCoaching {
  id: string;
  savedAt: number;
  exerciseId?: string;
  exerciseName?: string;
  sessionId?: string;
  diagnosis: {
    detectorId: string;
    severity: number;
    observations: number;
    evidenceText: string;
    signedMeanCents?: number;
  };
  symptomCard?: AdviceCard;
  causeCards: AdviceCard[];
}
