// Scoring output types for a single key attempt

export interface NotePitchTrace {
  tMs: number;       // ms since the eval window start (NOT key start)
  hz: number;
  cents: number;     // signed cents off target
  clarity: number;   // 0..1
}

export interface NoteScore {
  targetMidi: number;
  meanCentsDeviation: number;   // signed, clarity-weighted average
  accuracyPct: number;          // % of frames within ±50 cents of target
  framesAboveClarity: number;   // samples whose clarity passed the postprocessor
  samplesInWindow?: number;     // total samples examined; stripped at save time, present only during live scoring
  trace?: NotePitchTrace[];     // per-frame capture for replay/coaching; stripped at save time
}

export interface KeyAttemptResult {
  tonic: string;                // e.g. "C3"
  notes: NoteScore[];
  meanAccuracyPct: number;      // average across all notes
  meanCentsDeviation: number;   // average signed deviation across all notes
}
