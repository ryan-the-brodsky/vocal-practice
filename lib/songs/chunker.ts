// Pure-TS chunker. Splits a melody into ~targetMeasures-long chunks, snapping
// boundaries to rest gaps when possible. Also exposes reconcileChunkIds which
// applies the stable-ID overlap policy when chunk boundaries are edited.

import type { ExtractedNote, TimeSignature } from "../analyze/types";
import { beatsPerMeasure } from "../analyze/types";
import type { ChunkSpec } from "./types";

const DEFAULT_TARGET_MEASURES = 4;
/** Gap between consecutive notes (ms) that counts as a "rest" worth snapping to. */
const REST_THRESHOLD_MS = 200;
/** When snapping to a rest, look back at most this many beats. */
const REST_SNAP_LOOKBACK_BEATS = 2;
/** Long-rest threshold (ms): any gap this long forces a phrase boundary even
 *  if the running chunk hasn't reached `targetMeasures` of beats yet. */
const PHRASE_REST_MS = 800;
/** Minimum beats per chunk when phrase-rest cuts trigger early — keeps tiny
 *  fragments from splintering. */
const MIN_CHUNK_BEATS = 2;

export interface ChunkerOptions {
  targetMeasures?: number;
  restThresholdMs?: number;
  restSnapLookbackBeats?: number;
  phraseRestMs?: number;
  minChunkBeats?: number;
}

/** Find indices i where notes[i+1].startMs - notes[i].endMs > threshold. */
function findRestEnds(notes: ExtractedNote[], thresholdMs: number): Set<number> {
  const out = new Set<number>();
  for (let i = 0; i < notes.length - 1; i++) {
    const gap = notes[i + 1]!.startMs - notes[i]!.endMs;
    if (gap > thresholdMs) out.add(i);
  }
  return out;
}

/** Indices i where the gap notes[i+1].startMs - notes[i].endMs ≥ threshold.
 *  These are treated as obvious phrase breaks worth cutting on even before
 *  the running chunk reaches its target measure count. */
function findPhraseEnds(notes: ExtractedNote[], thresholdMs: number): Set<number> {
  const out = new Set<number>();
  for (let i = 0; i < notes.length - 1; i++) {
    const gap = notes[i + 1]!.startMs - notes[i]!.endMs;
    if (gap >= thresholdMs) out.add(i);
  }
  return out;
}

/** Cumulative beats AT THE END of each note (length === notes.length). */
function cumulativeBeats(notes: ExtractedNote[]): number[] {
  const out: number[] = new Array(notes.length);
  let acc = 0;
  for (let i = 0; i < notes.length; i++) {
    acc += notes[i]!.durationBeats;
    out[i] = acc;
  }
  return out;
}

/**
 * Auto-chunk a melody. Always produces at least one chunk covering all notes
 * (even when the melody is very short or has just one note).
 *
 * Names are placeholder ("Chunk N"); IDs are minted via mintUuid. For an edit
 * flow, run reconcileChunkIds(oldChunks, newChunks) afterward to preserve IDs.
 */
export function autoChunk(
  notes: ExtractedNote[],
  timeSig: TimeSignature,
  opts: ChunkerOptions = {},
): ChunkSpec[] {
  if (notes.length === 0) return [];

  const targetMeasures = opts.targetMeasures ?? DEFAULT_TARGET_MEASURES;
  const restThresholdMs = opts.restThresholdMs ?? REST_THRESHOLD_MS;
  const restSnapLookbackBeats = opts.restSnapLookbackBeats ?? REST_SNAP_LOOKBACK_BEATS;
  const phraseRestMs = opts.phraseRestMs ?? PHRASE_REST_MS;
  const minChunkBeats = opts.minChunkBeats ?? MIN_CHUNK_BEATS;
  const targetBeats = targetMeasures * beatsPerMeasure(timeSig);

  const restEnds = findRestEnds(notes, restThresholdMs);
  const phraseEnds = findPhraseEnds(notes, phraseRestMs);
  const cum = cumulativeBeats(notes);

  const boundaries: number[] = []; // last-note-index of each closed chunk

  let chunkStartIdx = 0;
  let chunkStartCumBeats = 0;

  for (let i = 0; i < notes.length - 1; i++) {
    const beatsSoFar = cum[i]! - chunkStartCumBeats;
    // (a) Phrase-break opportunism: any long silence after this note triggers
    //     a cut, as long as the running chunk has at least minChunkBeats.
    // (b) Measure target: when beats reach targetBeats, cut (with rest-snap).
    const isPhraseEnd = phraseEnds.has(i) && beatsSoFar >= minChunkBeats;
    const reachedTarget = beatsSoFar >= targetBeats;
    if (!isPhraseEnd && !reachedTarget) continue;

    let cutIdx = i;
    if (!isPhraseEnd) {
      // Measure target: try to snap backward to a rest end (musical alignment).
      let bestRestIdx = -1;
      for (let j = i; j >= chunkStartIdx; j--) {
        const beatsBack = cum[i]! - (cum[j]! ?? 0);
        if (beatsBack > restSnapLookbackBeats) break;
        if (restEnds.has(j)) { bestRestIdx = j; break; }
      }
      if (bestRestIdx >= 0) cutIdx = bestRestIdx;
    }
    // Phrase-end cuts always fire exactly at the note before the long silence.

    boundaries.push(cutIdx);
    chunkStartIdx = cutIdx + 1;
    chunkStartCumBeats = cum[cutIdx]!;
  }

  // Materialize chunks
  const chunks: ChunkSpec[] = [];
  let start = 0;
  for (let i = 0; i < boundaries.length; i++) {
    const end = boundaries[i]!;
    chunks.push({
      id: mintUuid(),
      name: `Segment ${chunks.length + 1}`,
      startNoteIdx: start,
      endNoteIdx: end,
    });
    start = end + 1;
  }
  // Final tail chunk
  if (start <= notes.length - 1) {
    chunks.push({
      id: mintUuid(),
      name: `Segment ${chunks.length + 1}`,
      startNoteIdx: start,
      endNoteIdx: notes.length - 1,
    });
  }

  return chunks;
}

/**
 * Reconcile new chunk boundaries with old chunks' IDs + names.
 * For each new chunk, find the old chunk whose note-index overlap is ≥ 50%
 * of the new chunk's range — reuse its id + name. Otherwise mint fresh.
 *
 * Each old ID is used at most once, even when multiple new chunks have ≥50%
 * overlap (the closer match wins by overlap fraction).
 */
export function reconcileChunkIds(
  oldChunks: ChunkSpec[],
  newChunks: Omit<ChunkSpec, "id" | "name">[],
): ChunkSpec[] {
  const usedOldIds = new Set<string>();
  // For each new chunk, compute the best old-chunk match by overlap fraction.
  type Match = { newIdx: number; oldId: string; oldName: string; frac: number };
  const matches: Match[] = [];
  newChunks.forEach((nc, ni) => {
    const ncSize = nc.endNoteIdx - nc.startNoteIdx + 1;
    let best: Match | null = null;
    for (const oc of oldChunks) {
      const lo = Math.max(nc.startNoteIdx, oc.startNoteIdx);
      const hi = Math.min(nc.endNoteIdx, oc.endNoteIdx);
      const overlap = Math.max(0, hi - lo + 1);
      const frac = overlap / ncSize;
      if (frac >= 0.5 && (!best || frac > best.frac)) {
        best = { newIdx: ni, oldId: oc.id, oldName: oc.name, frac };
      }
    }
    if (best) matches.push(best);
  });
  // Resolve conflicts: each old id at most once. Higher overlap wins.
  matches.sort((a, b) => b.frac - a.frac);
  const newIdxToOld = new Map<number, { id: string; name: string }>();
  for (const m of matches) {
    if (usedOldIds.has(m.oldId)) continue;
    if (newIdxToOld.has(m.newIdx)) continue;
    usedOldIds.add(m.oldId);
    newIdxToOld.set(m.newIdx, { id: m.oldId, name: m.oldName });
  }
  // Emit reconciled chunks with default names for unmatched.
  return newChunks.map((nc, ni) => {
    const carry = newIdxToOld.get(ni);
    return {
      id: carry?.id ?? mintUuid(),
      name: carry?.name ?? `Segment ${ni + 1}`,
      startNoteIdx: nc.startNoteIdx,
      endNoteIdx: nc.endNoteIdx,
    };
  });
}

/** RFC4122 v4. Uses crypto.randomUUID when available, otherwise a Math.random fallback. */
function mintUuid(): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c: any = typeof crypto !== "undefined" ? crypto : null;
  if (c && typeof c.randomUUID === "function") return c.randomUUID();
  // Math.random fallback — not cryptographically secure; only used in tests / older runtimes.
  const hex = (n: number) => n.toString(16).padStart(2, "0");
  const b = new Uint8Array(16);
  for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
  b[6] = (b[6]! & 0x0f) | 0x40;
  b[8] = (b[8]! & 0x3f) | 0x80;
  return (
    Array.from(b.slice(0, 4), hex).join("") + "-" +
    Array.from(b.slice(4, 6), hex).join("") + "-" +
    Array.from(b.slice(6, 8), hex).join("") + "-" +
    Array.from(b.slice(8, 10), hex).join("") + "-" +
    Array.from(b.slice(10, 16), hex).join("")
  );
}
