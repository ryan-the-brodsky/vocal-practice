// Sidecar JSON schema for in-app song recordings (song-import pipeline).
// Parallel to CaptureSidecar (exercise corpus) but without the exercise-specific
// timing/targets fields — songs are free-form melodies, no preplanned pattern.

import type { VoicePart } from "@/lib/exercises/types";
import type { AnalysisMode } from "@/lib/analyze";

export interface SongSidecar {
  kind: "song";
  schemaVersion: 1;
  songName: string;
  voicePart: VoicePart;
  /** User-provided key center (e.g. "C4"). */
  tonic: string;
  mode: AnalysisMode;
  /** Optional BPM override; absent = let analyzeFile auto-estimate. */
  tempoBpm?: number;
  sampleRate: number;
  durationMs: number;
  /** ISO timestamp of when the recording was finalized. */
  capturedAt: string;
  /** Optional free-text take label. */
  note?: string;
}
