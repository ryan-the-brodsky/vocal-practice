// Build SessionRecord fixtures for Progress / Coaching screen tests.

import type {
  KeyAttemptResult,
  NoteScore,
  SessionRecord,
} from "@/lib/progress/types";
import type { VoicePart } from "@/lib/exercises/types";

export interface SeedNoteOptions {
  targetMidi: number;
  meanCentsDeviation?: number;
  accuracyPct?: number;
  framesAboveClarity?: number;
}

export interface SeedKeyAttemptOptions {
  tonic: string;
  notes: SeedNoteOptions[];
}

export interface SeedSessionOptions {
  id?: string;
  startedAt?: number;
  completedAt?: number | null;
  exerciseId: string;
  voicePart?: VoicePart;
  tempo?: number;
  attempts: SeedKeyAttemptOptions[];
  notes?: string;
}

export function makeNoteScore(opts: SeedNoteOptions): NoteScore {
  return {
    targetMidi: opts.targetMidi,
    meanCentsDeviation: opts.meanCentsDeviation ?? 0,
    accuracyPct: opts.accuracyPct ?? 100,
    framesAboveClarity: opts.framesAboveClarity ?? 30,
  };
}

export function makeKeyAttempt(opts: SeedKeyAttemptOptions): KeyAttemptResult {
  const notes = opts.notes.map(makeNoteScore);
  const meanAccuracyPct = notes.reduce((s, n) => s + n.accuracyPct, 0) / Math.max(1, notes.length);
  const meanCentsDeviation = notes.reduce((s, n) => s + n.meanCentsDeviation, 0) / Math.max(1, notes.length);
  return {
    tonic: opts.tonic,
    notes,
    meanAccuracyPct,
    meanCentsDeviation,
  };
}

let idCounter = 0;
function nextId(): string {
  idCounter += 1;
  return `test-session-${idCounter}-${Date.now()}`;
}

export function seedSessionRecord(opts: SeedSessionOptions): SessionRecord {
  const startedAt = opts.startedAt ?? Date.now();
  const keyAttempts = opts.attempts.map(makeKeyAttempt);
  return {
    id: opts.id ?? nextId(),
    startedAt,
    completedAt: opts.completedAt === undefined ? startedAt + 60_000 : opts.completedAt,
    exerciseId: opts.exerciseId,
    voicePart: opts.voicePart ?? "tenor",
    tempo: opts.tempo ?? 90,
    keyAttempts,
    totalDurationMs: 60_000,
    notes: opts.notes,
  };
}

/** Quick "in-tune" five-note session at a single tonic. */
export function inTuneFiveNoteSession(exerciseId = "five-note-scale-mee-may-mah"): SessionRecord {
  return seedSessionRecord({
    exerciseId,
    attempts: [
      {
        tonic: "C3",
        notes: [60, 62, 64, 66, 67].map((m) => ({
          targetMidi: m,
          meanCentsDeviation: 2,
          accuracyPct: 96,
        })),
      },
    ],
  });
}
