// Per-segment audio preview helper. Builds a melody-only descriptor (no cue,
// no accompaniment, no lead-in clicks) so the user hears the bare segment.

import type { AudioPlayer, SequenceHandle } from "../audio";
import { flattenIterations, planExercise } from "../exercises/engine";
import type { ExerciseDescriptor } from "../exercises/types";
import { chunkToDescriptor } from "./toDescriptor";
import type { ChunkSpec, StoredSong } from "./types";

/**
 * Build the chunk's synthetic descriptor, then strip its accompaniment + cue
 * so playback is melody only. Returns the bare descriptor used for preview.
 */
export function melodyOnlyDescriptor(song: StoredSong, chunk: ChunkSpec): ExerciseDescriptor {
  const base = chunkToDescriptor(song, chunk);
  return {
    ...base,
    accompaniment: { pattern: "none", doubleMelody: false, cueType: "none" },
  };
}

/**
 * Play the chunk's melody once on the given player. Caller is responsible for
 * stopping any previously returned SequenceHandle. Returns null if there's
 * nothing to play (empty chunk).
 */
export function previewChunk(
  player: AudioPlayer,
  song: StoredSong,
  chunk: ChunkSpec,
): SequenceHandle | null {
  const desc = melodyOnlyDescriptor(song, chunk);
  if (desc.scaleDegrees.length === 0) return null;
  const iters = planExercise({
    exercise: desc,
    voicePart: song.voicePart,
    clickTrackEnabled: false,
  });
  const flat = flattenIterations(iters, 0);
  if (flat.events.length === 0) return null;
  return player.playSequence(flat.events);
}
