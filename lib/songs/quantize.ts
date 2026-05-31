// Quantize a melody to a 16th-note grid and emit a measure-aware sequence of
// notes/rests suitable for engraving. Each run of same-pitched cells (or rest
// cells) is decomposed into one or more standard durations and split across
// barlines into tied notes.
//
// V1 simplifications: 16th-grid only (no triplets), greedy largest-fit duration
// decomposition (may produce off-beat groupings on syncopated rhythms; revisit
// when real pieces expose the rough spots).

import type { TimeSignature } from "../analyze/types";

/** One input note. Durations in beats: durationBeats = how long held, then
 *  restAfterBeats of silence before the next note's onset. */
export interface QInputNote {
  midi: number;
  durationBeats: number;
  restAfterBeats: number;
  syllable?: string;
}

/** Duration codes consumed by the renderer. "d" suffix = dotted, "r" suffix =
 *  rest. The renderer maps these to VexFlow `StaveNote`/`Dot`/`new StaveNote
 *  with rest=true` accordingly. */
export type DurationCode =
  | "w" | "hd" | "h" | "qd" | "q" | "8d" | "8" | "16"
  | "wr" | "hdr" | "hr" | "qdr" | "qr" | "8dr" | "8r" | "16r";

export interface QOutNote {
  kind: "note";
  midi: number;
  duration: DurationCode;
  /** True if this note is a CONTINUATION of a tied chain (no fresh attack). */
  tiedFromPrev: boolean;
  /** True if the next item should be drawn as a tied continuation. */
  tiedToNext: boolean;
  /** Index of the originating input QInputNote (shared across tied pieces). */
  originNoteIdx: number;
  /** Set on the FIRST token of a fresh-attack note run; tied continuations
   *  carry no syllable so the lyric reads under each new attack. */
  syllable?: string;
}
export interface QOutRest {
  kind: "rest";
  duration: DurationCode;
}
export type QOutItem = QOutNote | QOutRest;

export interface QMeasure {
  items: QOutItem[];
}

export interface QuantizedMelody {
  measures: QMeasure[];
  beatsPerMeasure: number;
}

const GRID_BEATS = 0.25; // 16th-note grid (one cell = 1/4 of a quarter beat)

const STD_NOTE_DURATIONS: { code: DurationCode; cells: number }[] = [
  { code: "w",   cells: 16 },
  { code: "hd",  cells: 12 },
  { code: "h",   cells: 8 },
  { code: "qd",  cells: 6 },
  { code: "q",   cells: 4 },
  { code: "8d",  cells: 3 },
  { code: "8",   cells: 2 },
  { code: "16",  cells: 1 },
];
const STD_REST_DURATIONS: { code: DurationCode; cells: number }[] =
  STD_NOTE_DURATIONS.map((d) => ({ code: (d.code + "r") as DurationCode, cells: d.cells }));

function snapToGrid(beats: number): number {
  return Math.round(beats / GRID_BEATS) * GRID_BEATS;
}

type Cell =
  | { kind: "note"; midi: number; startsRun: boolean; originNoteIdx: number; syllable?: string }
  | { kind: "rest" };

/** Flatten input notes onto a 16th-grid tape. Each input note occupies
 *  consecutive cells (first carries `startsRun=true`, the rest false). Cells
 *  not touched by any note are rests. */
function buildTape(notes: QInputNote[]): Cell[] {
  let totalBeats = 0;
  for (const n of notes) totalBeats += n.durationBeats + n.restAfterBeats;
  const totalCells = Math.max(0, Math.round(snapToGrid(totalBeats) / GRID_BEATS));
  const tape: Cell[] = new Array(totalCells);
  for (let i = 0; i < totalCells; i++) tape[i] = { kind: "rest" };

  let beat = 0;
  for (let i = 0; i < notes.length; i++) {
    const n = notes[i]!;
    const startBeat = snapToGrid(beat);
    const dur = Math.max(GRID_BEATS, snapToGrid(n.durationBeats));
    const startCell = Math.round(startBeat / GRID_BEATS);
    const endCell = Math.min(totalCells, startCell + Math.round(dur / GRID_BEATS));
    for (let c = startCell; c < endCell; c++) {
      const isFirst = c === startCell;
      tape[c] = {
        kind: "note",
        midi: n.midi,
        startsRun: isFirst,
        originNoteIdx: i,
        ...(isFirst && n.syllable ? { syllable: n.syllable } : {}),
      };
    }
    beat += n.durationBeats + n.restAfterBeats;
  }
  return tape;
}

/** Greedy largest-fit decomposition of `cells` into the given duration table. */
function decompose(cells: number, table: { code: DurationCode; cells: number }[]): DurationCode[] {
  const out: DurationCode[] = [];
  let remaining = cells;
  for (const d of table) {
    while (remaining >= d.cells) {
      out.push(d.code);
      remaining -= d.cells;
    }
  }
  return out;
}

type Run =
  | { kind: "note"; midi: number; startCell: number; endCell: number; originNoteIdx: number; syllable?: string }
  | { kind: "rest"; startCell: number; endCell: number };

/** Walk the tape and group consecutive same-pitched note cells into runs;
 *  consecutive rest cells likewise. */
function identifyRuns(tape: Cell[]): Run[] {
  const runs: Run[] = [];
  let i = 0;
  while (i < tape.length) {
    const c = tape[i]!;
    if (c.kind === "rest") {
      let j = i + 1;
      while (j < tape.length && tape[j]!.kind === "rest") j++;
      runs.push({ kind: "rest", startCell: i, endCell: j });
      i = j;
    } else {
      const midi = c.midi;
      const originNoteIdx = c.originNoteIdx;
      const syllable = c.syllable;
      let j = i + 1;
      while (j < tape.length) {
        const cj = tape[j]!;
        if (cj.kind !== "note" || cj.midi !== midi || cj.startsRun) break;
        j++;
      }
      runs.push({ kind: "note", midi, startCell: i, endCell: j, originNoteIdx, ...(syllable ? { syllable } : {}) });
      i = j;
    }
  }
  return runs;
}

export function quantizeMelody(notes: QInputNote[], timeSig: TimeSignature): QuantizedMelody {
  // Normalize "beats per measure" against a quarter-note pulse so 4/4 → 4,
  // 3/4 → 3, 6/8 → 3. Matches how the chunker treats time signatures.
  const beatsPerMeasure = (4 * timeSig.num) / timeSig.den;
  const cellsPerMeasure = Math.max(1, Math.round(beatsPerMeasure / GRID_BEATS));

  const tape = buildTape(notes);
  const runs = identifyRuns(tape);

  const measureCount = Math.max(1, Math.ceil(tape.length / cellsPerMeasure));
  const measures: QMeasure[] = Array.from({ length: measureCount }, () => ({ items: [] }));

  for (const run of runs) {
    let cursor = run.startCell;
    while (cursor < run.endCell) {
      const measureIdx = Math.floor(cursor / cellsPerMeasure);
      const measureEnd = (measureIdx + 1) * cellsPerMeasure;
      const sliceEnd = Math.min(run.endCell, measureEnd);
      const sliceCells = sliceEnd - cursor;
      const isFirstSliceOfRun = cursor === run.startCell;
      const isLastSliceOfRun = sliceEnd === run.endCell;

      if (run.kind === "rest") {
        const codes = decompose(sliceCells, STD_REST_DURATIONS);
        for (const code of codes) {
          measures[measureIdx]!.items.push({ kind: "rest", duration: code });
        }
      } else {
        const codes = decompose(sliceCells, STD_NOTE_DURATIONS);
        codes.forEach((code, k) => {
          const isFirstTokenInSlice = k === 0;
          const isLastTokenInSlice = k === codes.length - 1;
          // Continuation of an existing tie chain unless this is the very first
          // attack of the run (first slice + first token).
          const tiedFromPrev = !(isFirstSliceOfRun && isFirstTokenInSlice);
          // Ties forward unless this is the very last token of the run.
          const tiedToNext = !(isLastSliceOfRun && isLastTokenInSlice);
          // Lyric reads only under the first fresh attack of the run.
          const carriesSyllable = isFirstSliceOfRun && isFirstTokenInSlice;
          measures[measureIdx]!.items.push({
            kind: "note",
            midi: run.midi,
            duration: code,
            tiedFromPrev,
            tiedToNext,
            originNoteIdx: run.originNoteIdx,
            ...(carriesSyllable && run.syllable ? { syllable: run.syllable } : {}),
          });
        });
      }
      cursor = sliceEnd;
    }
  }

  return { measures, beatsPerMeasure };
}
