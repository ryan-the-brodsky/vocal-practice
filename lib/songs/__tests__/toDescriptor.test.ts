import { chunkToDescriptor } from "../toDescriptor";
import { parseChunkId } from "../types";
import type { ChunkSpec, StoredSong } from "../types";
import type { ExtractedNote } from "../../analyze/types";
import { planExercise } from "../../exercises/engine";

function note(scaleDegree: number, startMs: number, endMs: number, durationBeats: number, syllable?: string): ExtractedNote {
  return {
    startMs,
    endMs,
    medianHz: 220,
    medianMidiContinuous: 60 + scaleDegree,
    snappedMidi: 60 + scaleDegree,
    scaleDegree,
    centsOff: 0,
    durationBeats,
    framesUsed: 5,
    outOfKey: false,
    ...(syllable ? { syllable } : {}),
  };
}

function makeSong(allNotes: ExtractedNote[], chunks: ChunkSpec[]): StoredSong {
  return {
    id: "song-test-1",
    name: "Test Song",
    voicePart: "tenor",
    tonic: "C4",
    mode: "major",
    tempoBpm: 120,
    timeSignature: { num: 4, den: 4 },
    accompaniment: "drone",
    allNotes,
    chunks,
    source: { importedAt: Date.now(), durationSec: 10 },
  };
}

describe("chunkToDescriptor", () => {
  test("produces a single-iteration plan (locked key)", () => {
    const notes = [
      note(0, 0, 500, 1),
      note(4, 500, 1000, 1),
      note(7, 1000, 1500, 1),
    ];
    const chunk: ChunkSpec = { id: "c1", name: "Verse 1", startNoteIdx: 0, endNoteIdx: 2 };
    const song = makeSong(notes, [chunk]);
    const descriptor = chunkToDescriptor(song, chunk);
    const iters = planExercise({ exercise: descriptor, voicePart: "tenor" });
    expect(iters).toHaveLength(1);
    expect(iters[0]!.tonic).toBe("C4");
  });

  test("synthetic id has parseable {songId, chunkId}", () => {
    const notes = [note(0, 0, 500, 1)];
    const chunk: ChunkSpec = { id: "abc-xyz", name: "n", startNoteIdx: 0, endNoteIdx: 0 };
    const song = makeSong(notes, [chunk]);
    const desc = chunkToDescriptor(song, chunk);
    const parsed = parseChunkId(desc.id);
    expect(parsed).toEqual({ songId: "song-test-1", chunkId: "abc-xyz" });
  });

  test("scaleDegrees + durations come from the slice", () => {
    const notes = [
      note(0, 0, 500, 1),
      note(2, 500, 1000, 0.5),
      note(4, 1000, 1500, 1.5),
    ];
    const chunk: ChunkSpec = { id: "c1", name: "n", startNoteIdx: 1, endNoteIdx: 2 };
    const song = makeSong(notes, [chunk]);
    const desc = chunkToDescriptor(song, chunk);
    expect(desc.scaleDegrees).toEqual([2, 4]);
    expect(desc.durations).toEqual([0.5, 1.5]);
  });

  test("internal rest surfaces in restsAfter (beats), durations stay note-only", () => {
    // tempo 120 bpm → beatSec = 0.5s. Notes 0-500ms (1 beat), then 500ms gap,
    // then 1000-1500ms (1 beat). Gap → restsAfter[0] = 1 beat. Durations stay
    // at the actual sung lengths.
    const notes = [
      note(0, 0, 500, 1),
      note(4, 1000, 1500, 1),
    ];
    const chunk: ChunkSpec = { id: "c1", name: "n", startNoteIdx: 0, endNoteIdx: 1 };
    const song = makeSong(notes, [chunk]);
    const desc = chunkToDescriptor(song, chunk);
    expect(desc.durations).toEqual([1, 1]);
    expect(desc.restsAfter).toEqual([1, 0]);
  });

  test("no gaps → no restsAfter on the descriptor at all", () => {
    const notes = [
      note(0, 0, 500, 1),
      note(4, 500, 1000, 1),
    ];
    const chunk: ChunkSpec = { id: "c1", name: "n", startNoteIdx: 0, endNoteIdx: 1 };
    const song = makeSong(notes, [chunk]);
    const desc = chunkToDescriptor(song, chunk);
    expect(desc.restsAfter).toBeUndefined();
  });

  test("empty syllables when none provided; carries through when present", () => {
    const notes = [
      note(0, 0, 500, 1, "mee"),
      note(2, 500, 1000, 1),
    ];
    const chunk: ChunkSpec = { id: "c1", name: "n", startNoteIdx: 0, endNoteIdx: 1 };
    const song = makeSong(notes, [chunk]);
    const desc = chunkToDescriptor(song, chunk);
    expect(desc.syllables).toEqual(["mee", ""]);
  });

  test("uses step=1 defensively (engine would infinite-loop on step=0)", () => {
    const notes = [note(0, 0, 500, 1)];
    const chunk: ChunkSpec = { id: "c1", name: "n", startNoteIdx: 0, endNoteIdx: 0 };
    const song = makeSong(notes, [chunk]);
    const desc = chunkToDescriptor(song, chunk);
    const range = desc.voicePartRanges.tenor!;
    expect(range.step).toBe(1);
    expect(range.lowest).toBe(range.highest);
  });
});
