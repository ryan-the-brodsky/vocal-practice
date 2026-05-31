import { autoChunk, reconcileChunkIds } from "../chunker";
import type { ChunkSpec } from "../types";
import type { ExtractedNote, TimeSignature } from "../../analyze/types";

// Synthetic-note builder. Times advance by durationMs; gaps between notes are
// emitted by passing gapMs (silence after this note).
function buildNotes(
  spec: Array<{ scaleDegree: number; durationBeats: number; durationMs: number; gapMs?: number }>,
): ExtractedNote[] {
  const out: ExtractedNote[] = [];
  let cursorMs = 0;
  for (const s of spec) {
    out.push({
      startMs: cursorMs,
      endMs: cursorMs + s.durationMs,
      medianHz: 220,
      medianMidiContinuous: 60 + s.scaleDegree,
      snappedMidi: 60 + s.scaleDegree,
      scaleDegree: s.scaleDegree,
      centsOff: 0,
      durationBeats: s.durationBeats,
      framesUsed: 5,
      outOfKey: false,
    });
    cursorMs = cursorMs + s.durationMs + (s.gapMs ?? 0);
  }
  return out;
}

const TS_4_4: TimeSignature = { num: 4, den: 4 };
const TS_3_4: TimeSignature = { num: 3, den: 4 };
const TS_6_8: TimeSignature = { num: 6, den: 8 };

describe("autoChunk — basic measure math", () => {
  test("empty input returns no chunks", () => {
    expect(autoChunk([], TS_4_4)).toEqual([]);
  });

  test("single note returns one chunk covering it", () => {
    const notes = buildNotes([{ scaleDegree: 0, durationBeats: 1, durationMs: 500 }]);
    const chunks = autoChunk(notes, TS_4_4);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]!.startNoteIdx).toBe(0);
    expect(chunks[0]!.endNoteIdx).toBe(0);
  });

  test("short melody under target stays as one chunk", () => {
    // 4 quarter notes = 4 beats = exactly 1 measure of 4/4. Target 4 measures = 16 beats.
    const notes = buildNotes(
      Array.from({ length: 4 }, () => ({ scaleDegree: 0, durationBeats: 1, durationMs: 500 })),
    );
    const chunks = autoChunk(notes, TS_4_4);
    expect(chunks).toHaveLength(1);
  });

  test("4/4 at 4 measures default cuts after every ~16 beats", () => {
    // 32 quarter notes total = 32 beats. Target 16 → expect 2 chunks roughly equal.
    const notes = buildNotes(
      Array.from({ length: 32 }, () => ({ scaleDegree: 0, durationBeats: 1, durationMs: 500 })),
    );
    const chunks = autoChunk(notes, TS_4_4);
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    expect(chunks[chunks.length - 1]!.endNoteIdx).toBe(31);
  });

  test("3/4 at 4 measures targets 12 beats per chunk", () => {
    // 24 quarter notes = 24 beats. Target 12 → expect 2 chunks.
    const notes = buildNotes(
      Array.from({ length: 24 }, () => ({ scaleDegree: 0, durationBeats: 1, durationMs: 500 })),
    );
    const chunks = autoChunk(notes, TS_3_4);
    expect(chunks).toHaveLength(2);
    expect(chunks[0]!.endNoteIdx + 1).toBe(chunks[1]!.startNoteIdx);
    expect(chunks[chunks.length - 1]!.endNoteIdx).toBe(23);
  });

  test("6/8 normalizes to 3 quarter-equiv beats per measure (target 12 beats at 4 measures)", () => {
    const notes = buildNotes(
      Array.from({ length: 24 }, () => ({ scaleDegree: 0, durationBeats: 1, durationMs: 500 })),
    );
    const chunks = autoChunk(notes, TS_6_8);
    expect(chunks).toHaveLength(2);
  });
});

describe("autoChunk — rest snapping", () => {
  test("snaps backward to a rest end within the lookback window", () => {
    // 18 notes: a gap after note 13 (well into measure 4 of 4/4) should pull
    // the cut from note ~15 (default target) back to note 13.
    const spec = Array.from({ length: 18 }, (_, i) => ({
      scaleDegree: 0,
      durationBeats: 1,
      durationMs: 500,
      gapMs: i === 13 ? 600 : 0, // 600ms gap after note 13
    }));
    const notes = buildNotes(spec);
    const chunks = autoChunk(notes, TS_4_4);
    // The first cut should land at the rest end (note 13) instead of note 15.
    expect(chunks[0]!.endNoteIdx).toBe(13);
    expect(chunks[1]!.startNoteIdx).toBe(14);
  });

  test("phrase break (≥800ms gap) forces an early cut even before target measures", () => {
    // 24 notes total, no measure target reached until beat 16. Insert a 1.5s
    // silence after note 5 (cum beats = 6, well below the 16-beat target).
    // The chunker should cut after note 5 anyway.
    const spec = Array.from({ length: 24 }, (_, i) => ({
      scaleDegree: 0,
      durationBeats: 1,
      durationMs: 500,
      gapMs: i === 5 ? 1500 : 0,
    }));
    const notes = buildNotes(spec);
    const chunks = autoChunk(notes, TS_4_4);
    expect(chunks.length).toBeGreaterThanOrEqual(2);
    expect(chunks[0]!.endNoteIdx).toBe(5);
    expect(chunks[1]!.startNoteIdx).toBe(6);
  });

  test("phrase-break opportunism respects minChunkBeats", () => {
    // Silence after note 0 (cum beats = 1, below minChunkBeats=2) should NOT
    // trigger a phrase-break cut.
    const spec = Array.from({ length: 24 }, (_, i) => ({
      scaleDegree: 0,
      durationBeats: 1,
      durationMs: 500,
      gapMs: i === 0 ? 1500 : 0,
    }));
    const notes = buildNotes(spec);
    const chunks = autoChunk(notes, TS_4_4);
    expect(chunks[0]!.endNoteIdx).toBeGreaterThan(0);
  });

  test("does not snap when no rest is within the lookback window", () => {
    // No gaps anywhere — boundary is exactly at the target measure count.
    const notes = buildNotes(
      Array.from({ length: 20 }, () => ({ scaleDegree: 0, durationBeats: 1, durationMs: 500 })),
    );
    const chunks = autoChunk(notes, TS_4_4);
    // Default cut is at note index 15 (cum 16 beats), no snap.
    expect(chunks[0]!.endNoteIdx).toBe(15);
  });
});

describe("autoChunk — coverage invariants", () => {
  test("chunks are contiguous and cover all notes", () => {
    const notes = buildNotes(
      Array.from({ length: 50 }, () => ({ scaleDegree: 0, durationBeats: 1, durationMs: 500 })),
    );
    const chunks = autoChunk(notes, TS_4_4);
    expect(chunks[0]!.startNoteIdx).toBe(0);
    for (let i = 1; i < chunks.length; i++) {
      expect(chunks[i]!.startNoteIdx).toBe(chunks[i - 1]!.endNoteIdx + 1);
    }
    expect(chunks[chunks.length - 1]!.endNoteIdx).toBe(notes.length - 1);
  });

  test("each chunk gets a unique id", () => {
    const notes = buildNotes(
      Array.from({ length: 50 }, () => ({ scaleDegree: 0, durationBeats: 1, durationMs: 500 })),
    );
    const ids = autoChunk(notes, TS_4_4).map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("reconcileChunkIds — stable-id overlap policy", () => {
  function chunk(id: string, name: string, start: number, end: number): ChunkSpec {
    return { id, name, startNoteIdx: start, endNoteIdx: end };
  }

  test("preserves id when overlap ≥ 50%", () => {
    const oldChunks: ChunkSpec[] = [
      chunk("a", "Chunk 1", 0, 9),
      chunk("b", "Chunk 2", 10, 19),
    ];
    // First boundary moved by 2 notes — first chunk now [0,7], second [8,19].
    const newRanges = [
      { startNoteIdx: 0, endNoteIdx: 7 },   // overlaps a [0..7] = 8 of 8 = 100%
      { startNoteIdx: 8, endNoteIdx: 19 },  // overlaps b [10..19] = 10 of 12 = 83%
    ];
    const reconciled = reconcileChunkIds(oldChunks, newRanges);
    expect(reconciled[0]!.id).toBe("a");
    expect(reconciled[0]!.name).toBe("Chunk 1");
    expect(reconciled[1]!.id).toBe("b");
    expect(reconciled[1]!.name).toBe("Chunk 2");
  });

  test("splitting one old chunk: one new chunk inherits, rest get fresh ids", () => {
    // Old chunk fully contains every new chunk → all new chunks have 100%
    // overlap of their own range, so they all "want" the old id. Conflict
    // resolution gives it to the first; others get fresh ids + default names.
    const oldChunks: ChunkSpec[] = [
      chunk("a", "First", 0, 19),
    ];
    const newRanges = [
      { startNoteIdx: 0, endNoteIdx: 6 },
      { startNoteIdx: 7, endNoteIdx: 12 },
      { startNoteIdx: 13, endNoteIdx: 19 },
    ];
    const reconciled = reconcileChunkIds(oldChunks, newRanges);
    const inheritedCount = reconciled.filter((c) => c.id === "a").length;
    expect(inheritedCount).toBe(1);
    expect(new Set(reconciled.map((c) => c.id)).size).toBe(3);
    const inheritedIdx = reconciled.findIndex((c) => c.id === "a");
    expect(reconciled[inheritedIdx]!.name).toBe("First");
    for (let i = 0; i < reconciled.length; i++) {
      if (i === inheritedIdx) continue;
      expect(reconciled[i]!.name).toMatch(/^Segment \d+$/);
    }
  });

  test("mints fresh ids when overlap < 50% (boundary moved past midpoint)", () => {
    // Old chunk [0,9] (10 notes). New chunk [5,14] overlaps [5,9] = 5/10 of new = 50% — exactly the threshold, matches.
    // New chunk [6,15] overlaps [6,9] = 4/10 of new = 40% < 50% — mints fresh.
    const oldChunks: ChunkSpec[] = [chunk("a", "First", 0, 9)];
    const matches = reconcileChunkIds(oldChunks, [{ startNoteIdx: 5, endNoteIdx: 14 }]);
    expect(matches[0]!.id).toBe("a");
    const noMatch = reconcileChunkIds(oldChunks, [{ startNoteIdx: 6, endNoteIdx: 15 }]);
    expect(noMatch[0]!.id).not.toBe("a");
    expect(noMatch[0]!.name).toBe("Segment 1");
  });

  test("each old id is reused at most once (conflict tiebreak by overlap)", () => {
    const oldChunks: ChunkSpec[] = [
      chunk("a", "Old A", 0, 9),
    ];
    // Two new chunks both overlap >=50% of a's range. Higher-overlap wins.
    const newRanges = [
      { startNoteIdx: 0, endNoteIdx: 4 },   // 5/5 = 100% of new = 5 frames matched
      { startNoteIdx: 5, endNoteIdx: 9 },   // 5/5 = 100% of new = 5 frames matched
    ];
    const reconciled = reconcileChunkIds(oldChunks, newRanges);
    const idsUsed = reconciled.map((c) => c.id);
    expect(idsUsed.filter((id) => id === "a")).toHaveLength(1);
    expect(new Set(idsUsed).size).toBe(2);
  });
});
