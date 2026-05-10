import type { VoicePart } from "../exercises/types";

// ---------------------------------------------------------------------------
// Scoring-type stubs (must remain structurally compatible with lib/scoring/types.ts)
// ---------------------------------------------------------------------------

export interface NotePitchTrace {
  tMs: number;
  hz: number;
  cents: number;
  clarity: number;
}

export interface NoteScore {
  targetMidi: number;
  meanCentsDeviation: number;
  accuracyPct: number;
  framesAboveClarity: number;
  samplesInWindow?: number;     // stripped at save time, present only during live scoring
  trace?: NotePitchTrace[];
}

export interface KeyAttemptResult {
  tonic: string;
  notes: NoteScore[];
  meanAccuracyPct: number;
  meanCentsDeviation: number;
}

// ---------------------------------------------------------------------------
// Session types
// ---------------------------------------------------------------------------

export interface CoachingFocus {
  keyTonic: string;
  noteIndex: number;
  targetMidi: number;
}

export interface SessionRecord {
  id: string;
  startedAt: number;        // ms since epoch
  completedAt: number | null; // null while in progress
  exerciseId: string;
  voicePart: VoicePart;
  tempo: number;            // BPM actually used (may differ from exercise default)
  keyAttempts: KeyAttemptResult[];
  totalDurationMs: number | null;
  notes?: string;           // optional user-entered note
  // deprecated (retry-coaching cut in 2026-05 redesign) — stripped at save time
  parentSessionId?: string;
  coachingFocus?: CoachingFocus;
}

export interface SessionSummary {
  count: number;
  totalDurationMs: number;
  meanAccuracyPct: number;
  meanCentsDeviation: number;
  exercisesPracticed: string[];
}

export interface ExerciseProgress {
  exerciseId: string;
  sessionsCount: number;
  bestKey: string | null;          // highest tonic reached with accuracy >= threshold (default 70%)
  recentMeanAccuracy: number;      // average over the last 5 sessions
  trend: { date: string; meanAccuracyPct: number }[]; // chronological
}
