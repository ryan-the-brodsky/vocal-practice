// Top-level orchestrator + barrel exports for the offline analysis pipeline.

import type { AlignConfig } from "../scoring/align";
import { noteToMidi } from "../exercises/music";
import { ANALYZE_CONFIG } from "./config";
import { decodeFile, type DecodeInput } from "./decode";
import { runOfflinePitch, type OfflinePitchOptions } from "./framewise";
import { extractSegments } from "./segment";
import { snapToKey } from "./keysnap";
import { diagnoseMelody } from "./diagnose";
import { estimateTempo } from "./synth";
import type { AnalysisMode, MelodyAnalysis } from "./types";

export type { DecodedAudio, DecodeInput } from "./decode";
export type {
  ExtractedNote,
  ScaleDegreeStats,
  MelodyAnalysis,
  MelodyGlaring,
  AnalysisMode,
} from "./types";
export { ANALYZE_CONFIG } from "./config";
export { runOfflinePitch } from "./framewise";
export { extractSegments } from "./segment";
export { snapToKey, allowedPitchClasses } from "./keysnap";
export { diagnoseMelody } from "./diagnose";
export { toExerciseDescriptor, estimateTempo } from "./synth";

export interface AnalyzeParams {
  tonic: string;
  mode: AnalysisMode;
  // When omitted, inferred from median note duration.
  tempoBpm?: number;
  pitchOptions?: OfflinePitchOptions;
  segmentOverrides?: AlignConfig;
  outOfKeyToleranceCents?: number;
}

export async function analyzeFile(
  input: DecodeInput,
  params: AnalyzeParams,
): Promise<MelodyAnalysis> {
  const tonicMidi = noteToMidi(params.tonic);
  const { pcm, sampleRate } = await decodeFile(input);

  const samples = runOfflinePitch(pcm, sampleRate, params.pitchOptions);
  const segments = extractSegments(samples, params.segmentOverrides);

  // Estimate tempo from raw segment durations before we have ExtractedNotes;
  // the first pass fills in beats, then we re-snap with the chosen tempo.
  let tempoBpm = params.tempoBpm;
  const warnings: string[] = [];
  if (tempoBpm === undefined) {
    const durations = segments.map((s) => (s.endMs - s.startMs) / 1000);
    const est = estimateTempo(durations);
    tempoBpm = est.bpm;
    if (est.warning) warnings.push(est.warning);
  }

  const notes = snapToKey(segments, tonicMidi, params.mode, {
    outOfKeyToleranceCents: params.outOfKeyToleranceCents ?? ANALYZE_CONFIG.outOfKeyToleranceCents,
    tempoBpm,
  });

  return diagnoseMelody(notes, {
    tonic: params.tonic,
    mode: params.mode,
    tempoBpm,
    warnings,
  });
}
