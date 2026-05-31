// Project a stored song chunk into a synthetic ExerciseDescriptor that the
// existing engine / scoring / coaching pipelines can consume unchanged.
//
// Key choices (per plan):
// - Single iteration: voicePartRanges[vp] = { lowest, highest, step }
//   with lowest === highest. step = 1 defensively (engine `step <= 0` is an
//   infinite loop). tonic is the song's tonic, NOT recomputed per chunk.
// - Internal rests are exposed via `restsAfter[i]` so the engine emits real
//   "rest" NoteEvents and the score can render rest glyphs. No more folding
//   into the preceding note's duration.
// - syllables come from ExtractedNote.syllable when present, else empty strings.
// - scaleDegree is taken straight from ExtractedNote.scaleDegree, so a note an
//   octave above the tonic = 12. The engine adds it to tonicMidi unchanged.

import { ACCOMPANIMENT_PRESETS, type ExerciseDescriptor } from "../exercises/types";
import { buildChunkId, type ChunkSpec, type StoredSong } from "./types";

/** Build a synthetic ExerciseDescriptor for a single chunk. */
export function chunkToDescriptor(song: StoredSong, chunk: ChunkSpec): ExerciseDescriptor {
  const notes = song.allNotes.slice(chunk.startNoteIdx, chunk.endNoteIdx + 1);
  if (notes.length === 0) {
    // Empty chunk — produce a stub descriptor; engine + scoring will tolerate
    // an empty scaleDegrees + durations array.
    return baseDescriptor(song, chunk, [], [], [], []);
  }

  const scaleDegrees: number[] = notes.map((n) => n.scaleDegree);
  const durations: number[] = notes.map((n) => n.durationBeats);
  const syllables: string[] = notes.map((n) => n.syllable ?? "");

  // Per-note silence AFTER (in beats). Last entry is 0 — anything beyond the
  // chunk's final note belongs to the song's outer silence, not this chunk.
  const beatSec = 60 / song.tempoBpm;
  const restsAfter: number[] = new Array<number>(notes.length).fill(0);
  for (let i = 0; i < notes.length - 1; i++) {
    const gapMs = notes[i + 1]!.startMs - notes[i]!.endMs;
    if (gapMs <= 0) continue;
    restsAfter[i] = (gapMs / 1000) / beatSec;
  }

  return baseDescriptor(song, chunk, scaleDegrees, durations, syllables, restsAfter);
}

function baseDescriptor(
  song: StoredSong,
  chunk: ChunkSpec,
  scaleDegrees: number[],
  durations: number[],
  syllables: string[],
  restsAfter: number[],
): ExerciseDescriptor {
  return {
    id: buildChunkId(song.id, chunk.id),
    name: `${song.name} — ${chunk.name}`,
    pedagogy: `Song segment from "${song.name}" (${song.tonic} ${song.mode}).`,
    scaleDegrees,
    syllables,
    noteValue: "8n", // ignored when durations is present
    tempo: song.tempoBpm,
    voicePartRanges: {
      [song.voicePart]: {
        lowest: song.tonic,
        highest: song.tonic,
        step: 1,
      },
    },
    accompaniment: ACCOMPANIMENT_PRESETS[song.accompaniment],
    direction: "ascending",
    tags: ["song", "chunk"],
    durations,
    ...(restsAfter.some((r) => r > 0) ? { restsAfter } : {}),
  };
}
