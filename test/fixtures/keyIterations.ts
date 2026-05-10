// Fixture builders that call the real WarmupEngine, so KeyIteration shape stays
// schema-aligned with the engine when descriptors change.

import { planExercise } from "@/lib/exercises/engine";
import type { KeyIteration, VoicePart, AccompanimentPreset } from "@/lib/exercises/types";
import { getExercise } from "@/lib/exercises/library";
import { midiToNote } from "@/lib/exercises/music";

export interface BuildKeyIterationsInput {
  exerciseId: string;
  voicePart?: VoicePart;
  /** When omitted, plans the full descriptor range. */
  startTonicMidi?: number;
  endTonicMidi?: number;
  accompanimentPreset?: AccompanimentPreset;
  bpmOverride?: number;
}

export function buildKeyIterations(input: BuildKeyIterationsInput): KeyIteration[] {
  const exercise = getExercise(input.exerciseId);
  if (!exercise) {
    throw new Error(`Test fixture: unknown exercise id "${input.exerciseId}"`);
  }
  return planExercise({
    exercise,
    voicePart: input.voicePart ?? "tenor",
    startTonicOverride: input.startTonicMidi !== undefined ? midiToNote(input.startTonicMidi) : undefined,
    endTonicOverride: input.endTonicMidi !== undefined ? midiToNote(input.endTonicMidi) : undefined,
    accompanimentPreset: input.accompanimentPreset ?? "studio",
    bpmOverride: input.bpmOverride,
  });
}

/** Pull the melody MIDIs out of a KeyIteration (in event order). */
export function melodyMidisFromIteration(it: KeyIteration): number[] {
  return it.events.filter((e) => e.type === "melody").map((e) => e.midi);
}
