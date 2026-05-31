// Song storage types — distinct from ExerciseDescriptor.
// A StoredSong is the source of truth; chunks are projected to synthetic
// ExerciseDescriptors on demand (see lib/songs/toDescriptor.ts).

import type { AnalysisMode, ExtractedNote, TimeSignature } from "../analyze/types";
import type { AccompanimentPreset, VoicePart } from "../exercises/types";

export type { TimeSignature };

export interface ChunkSpec {
  /** Stable UUID. Survives boundary edits via reconcileChunkIds when ≥50% overlap. */
  id: string;
  /** User-editable; defaults to "Chunk N". */
  name: string;
  /** Inclusive index into StoredSong.allNotes. */
  startNoteIdx: number;
  /** Inclusive index into StoredSong.allNotes. */
  endNoteIdx: number;
}

export interface StoredSong {
  /** "song-${slug}-${tsBase36}" */
  id: string;
  name: string;
  voicePart: VoicePart;
  tonic: string;
  mode: AnalysisMode;
  tempoBpm: number;
  timeSignature: TimeSignature;
  /** Accompaniment used for every chunk's synthetic descriptor. */
  accompaniment: AccompanimentPreset;
  /** Raw analysis output; preserved so chunk boundaries can be re-derived. */
  allNotes: ExtractedNote[];
  /** Ordered, contiguous, covers all of allNotes. */
  chunks: ChunkSpec[];
  /** Raw lyrics text. Parsed to syllables by `lib/songs/syllables.ts`; held
   *  notes are bisected when syllable count exceeds note count. */
  lyrics?: string;
  source: {
    importedAt: number;
    sourceFilename?: string;
    durationSec: number;
  };
}

/** Prefix for synthetic chunk descriptor IDs. Lets resolvers route chunk lookups. */
export const SONG_CHUNK_ID_PREFIX = "song-";
export const SONG_CHUNK_ID_SEPARATOR = "__chunk-";

export interface ParsedChunkId {
  songId: string;
  chunkId: string;
}

/** Parse a synthetic chunk descriptor ID. Returns null for non-chunk IDs. */
export function parseChunkId(id: string): ParsedChunkId | null {
  if (!id.startsWith(SONG_CHUNK_ID_PREFIX)) return null;
  const sep = id.indexOf(SONG_CHUNK_ID_SEPARATOR);
  if (sep < 0) return null;
  return {
    songId: id.slice(0, sep),
    chunkId: id.slice(sep + SONG_CHUNK_ID_SEPARATOR.length),
  };
}

/** Build a synthetic chunk descriptor ID. */
export function buildChunkId(songId: string, chunkId: string): string {
  return `${songId}${SONG_CHUNK_ID_SEPARATOR}${chunkId}`;
}
