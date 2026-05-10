// MelodyAnalysis → ExerciseDescriptor. Mode-aware accompaniment default with
// an opt-in user override; tempo estimated from median note duration.

import {
  ACCOMPANIMENT_PRESETS,
  type AccompanimentPreset,
  type AccompanimentSpec,
  type ExerciseDescriptor,
  type KeyRange,
  type VoicePart,
} from "../exercises/types";
import { midiToNote, noteToMidi } from "../exercises/music";
import { ANALYZE_CONFIG } from "./config";
import type { MelodyAnalysis } from "./types";

export interface SynthOptions {
  name: string;
  voicePart: VoicePart;
  // Either a single value to repeat across all notes, or an explicit per-note
  // array (must match notes.length). Undefined → empty syllables array.
  syllables?: string[] | string;
  // Override the mode-aware default. Accepts a preset name or a full spec.
  accompaniment?: AccompanimentPreset | AccompanimentSpec;
  // Optional id override; default derived from name + timestamp.
  id?: string;
}

export interface SynthResult {
  descriptor: ExerciseDescriptor;
  // Tempo & accompaniment fallback warnings, surfaced for the review UI.
  warnings: string[];
}

export function toExerciseDescriptor(
  analysis: MelodyAnalysis,
  opts: SynthOptions,
): SynthResult {
  const warnings: string[] = [];
  const tempoBpm = analysis.tempoBpm;
  const scaleDegrees = analysis.notes.map((n) => n.scaleDegree);
  const durations = analysis.notes.map((n) => n.durationBeats);
  const syllables = expandSyllables(opts.syllables, scaleDegrees.length);

  const tonicMidi = noteToMidi(analysis.tonic);
  const range: KeyRange = {
    lowest: midiToNote(tonicMidi),
    highest: midiToNote(tonicMidi + ANALYZE_CONFIG.defaultRangeSemitonesAbove),
    step: 1,
  };

  const accompaniment = resolveAccompaniment(opts.accompaniment, analysis, warnings);

  const descriptor: ExerciseDescriptor = {
    id: opts.id ?? makeId(opts.name),
    name: opts.name,
    pedagogy: `Imported melody. Tonic ${analysis.tonic}, ${analysis.mode}.`,
    scaleDegrees,
    syllables,
    // Kept for back-compat; ignored by the engine when durations is present.
    noteValue: "8n",
    tempo: Math.round(tempoBpm),
    voicePartRanges: { [opts.voicePart]: range },
    accompaniment,
    direction: "ascending",
    tags: ["imported"],
    durations,
  };

  return { descriptor, warnings };
}

// Estimate BPM from the median note duration assumed to be an eighth note.
// Falls back to ANALYZE_CONFIG.tempoEstimationDefault outside the [60, 180] band.
export function estimateTempo(
  durationSeconds: number[],
): { bpm: number; warning?: string } {
  if (durationSeconds.length === 0) {
    return { bpm: ANALYZE_CONFIG.tempoEstimationDefault, warning: "No notes detected; using default tempo." };
  }
  const med = medianNumber(durationSeconds);
  if (med <= 0) {
    return { bpm: ANALYZE_CONFIG.tempoEstimationDefault, warning: "Could not estimate tempo from durations; using default." };
  }
  const raw = 60 / (med * 2);
  const rounded = Math.round(raw / 4) * 4;
  if (rounded < ANALYZE_CONFIG.tempoMinBpm || rounded > ANALYZE_CONFIG.tempoMaxBpm) {
    return {
      bpm: ANALYZE_CONFIG.tempoEstimationDefault,
      warning: `Estimated tempo ${rounded} BPM outside [${ANALYZE_CONFIG.tempoMinBpm}, ${ANALYZE_CONFIG.tempoMaxBpm}]; defaulting to ${ANALYZE_CONFIG.tempoEstimationDefault} BPM.`,
    };
  }
  return { bpm: rounded };
}

function resolveAccompaniment(
  override: SynthOptions["accompaniment"],
  analysis: MelodyAnalysis,
  warnings: string[],
): AccompanimentSpec {
  if (override) {
    if (typeof override === "string") return ACCOMPANIMENT_PRESETS[override];
    return override;
  }
  // Mode-aware default per Q9 (I2).
  if (analysis.mode === "chromatic") return ACCOMPANIMENT_PRESETS.drone;

  const total = analysis.notes.length;
  const outOfKeyCount = analysis.notes.filter((n) => n.outOfKey).length;
  const fraction = total > 0 ? outOfKeyCount / total : 0;
  if (fraction > ANALYZE_CONFIG.chromaticFallbackFraction) {
    warnings.push(
      `${Math.round(fraction * 100)}% of notes fell outside the ${analysis.mode} key — defaulted to drone accompaniment.`,
    );
    return ACCOMPANIMENT_PRESETS.drone;
  }
  return ACCOMPANIMENT_PRESETS.classical;
}

function expandSyllables(
  syllables: SynthOptions["syllables"],
  count: number,
): string[] {
  if (Array.isArray(syllables)) {
    if (syllables.length !== count) {
      throw new Error(
        `Syllables array length (${syllables.length}) must equal note count (${count})`,
      );
    }
    return syllables;
  }
  if (typeof syllables === "string") {
    return new Array<string>(count).fill(syllables);
  }
  return new Array<string>(count).fill("");
}

function medianNumber(xs: number[]): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}

function makeId(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `imported-${slug || "melody"}-${Date.now().toString(36)}`;
}
