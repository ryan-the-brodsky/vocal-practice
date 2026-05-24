// Sidecar JSON schema for the dev-only raw-audio corpus. Everything an offline
// eval harness needs to replay a recording AND align it to expected targets.

import type { VoicePart } from "@/lib/exercises/types";

export interface CaptureSidecar {
  exerciseId: string;
  voicePart: VoicePart;
  /** First iteration's tonic, as a note string (e.g. "C3"). */
  startTonic: string;
  tempo: number;

  sampleRate: number;
  durationMs: number;
  /** ISO timestamp of when the recording was finalized. */
  capturedAt: string;

  /** When the piano/exercise audio began, relative to the start of the WAV
   *  recording (detector/capture start first, piano starts a bit later). */
  audioStartOffsetMs: number;

  /** Per-key-iteration tonic + startTime (seconds, relative to audio start). */
  keyStarts: { tonic: string; startTime: number }[];

  /** Per key iteration, the planned melody MIDI note numbers — keeps the corpus
   *  self-contained even if descriptors change later. */
  expectedTargets: { tonic: string; midi: number[] }[];

  /** Optional free-text take label. */
  note?: string;
  /** App git short SHA when trivially available. */
  appCommit?: string;
  /** Octaves the take was sung relative to `expectedTargets` (score against
   *  `expectedTargets + octaveShift*12`). Inferred from CREPE for the first 8 takes. */
  octaveShift?: number;
}
