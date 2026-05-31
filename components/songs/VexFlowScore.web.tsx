// VexFlow-based score view (web only). Renders the imported melody with
// proper note values, beaming, barlines, ties, accidentals, and key/time sig.
// Also paints per-segment chunk dividers + web pointer-drag handles for
// boundary editing.

import { Radii, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import {
  keySignatureFor,
  spellMidiInKey,
  type KeySignature,
} from "@/lib/music/keySignature";
import { quantizeMelody, type DurationCode, type QOutItem } from "@/lib/songs/quantize";
import type { ChunkSpec, TimeSignature } from "@/lib/songs/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import {
  Accidental,
  Annotation,
  Beam,
  Dot,
  Formatter,
  Renderer,
  Stave,
  StaveNote,
  StaveTie,
  Stem,
  Voice,
} from "vexflow";

import { CHUNK_PALETTE, type ScoreNote } from "./SongScoreView";

export interface VexFlowScoreProps {
  notes: ScoreNote[];
  chunks: ChunkSpec[];
  tonicMidi: number;
  timeSignature: TimeSignature;
  targetRowWidth?: number;
  onBoundaryDragMove?: (boundaryIdx: number, newStartNoteIdx: number) => void;
  /** Map from each entry in `notes` back to the original song.allNotes index.
   *  When omitted, identity mapping (notes are 1:1 with the song). */
  originalIndexMap?: number[];
}

// ── Pitch / duration plumbing ─────────────────────────────────────────────

interface DurationParts {
  base: "w" | "h" | "q" | "8" | "16";
  dotted: boolean;
  rest: boolean;
}
function parseDuration(code: DurationCode): DurationParts {
  const rest = code.endsWith("r");
  const trimmed = rest ? code.slice(0, -1) : code;
  const dotted = trimmed.endsWith("d");
  const base = (dotted ? trimmed.slice(0, -1) : trimmed) as DurationParts["base"];
  return { base, dotted, rest };
}

function midiToVexKey(midi: number, sig: KeySignature): { key: string; acc: "#" | "b" | "n" | null } {
  const spelling = spellMidiInKey(midi, sig);
  const key = `${spelling.letter.toLowerCase()}/${spelling.octave}`;
  const acc =
    spelling.accidentalGlyph === "sharp" ? "#"
    : spelling.accidentalGlyph === "flat" ? "b"
    : spelling.accidentalGlyph === "natural" ? "n"
    : null;
  return { key, acc };
}

function chooseClef(notes: ScoreNote[]): "treble" | "bass" {
  if (notes.length === 0) return "treble";
  const mean = notes.reduce((s, n) => s + n.midi, 0) / notes.length;
  return mean >= 60 ? "treble" : "bass";
}

const MAJOR_KEY_BY_FIFTHS: Record<number, string> = {
  [-7]: "Cb", [-6]: "Gb", [-5]: "Db", [-4]: "Ab", [-3]: "Eb", [-2]: "Bb", [-1]: "F",
  [0]: "C",
  [1]: "G", [2]: "D", [3]: "A", [4]: "E", [5]: "B", [6]: "F#", [7]: "C#",
};
function vexKeySignature(sig: KeySignature): string {
  return MAJOR_KEY_BY_FIFTHS[sig.accidentalCount] ?? "C";
}

// ── Build VexFlow tickables ───────────────────────────────────────────────

interface BuiltMeasure {
  notes: StaveNote[];
  midis: (number | null)[];
  bases: ("w" | "h" | "q" | "8" | "16")[];
  /** True iff the note at this index is the first attack of an origin note
   *  (i.e., not a tied continuation and not a rest). Drag handles snap to
   *  attack notes only. */
  isAttack: boolean[];
  /** Originating input-note index per StaveNote (null for rests). */
  originNoteIdxs: (number | null)[];
  /** Intra-measure ties as (fromIdx, toIdx) pairs. */
  ties: Array<{ from: number; to: number }>;
}

function buildMeasure(items: QOutItem[], clef: "treble" | "bass", sig: KeySignature): BuiltMeasure {
  const notes: StaveNote[] = [];
  const midis: (number | null)[] = [];
  const bases: ("w" | "h" | "q" | "8" | "16")[] = [];
  const isAttack: boolean[] = [];
  const originNoteIdxs: (number | null)[] = [];
  const ties: Array<{ from: number; to: number }> = [];
  let tiePending = false;

  for (const it of items) {
    const dp = parseDuration(it.duration);
    if (it.kind === "rest") {
      const sn = new StaveNote({
        clef,
        keys: [clef === "treble" ? "b/4" : "d/3"],
        duration: `${dp.base}r`,
      });
      if (dp.dotted) Dot.buildAndAttach([sn], { all: true });
      notes.push(sn);
      midis.push(null);
      bases.push(dp.base);
      isAttack.push(false);
      originNoteIdxs.push(null);
      tiePending = false;
    } else {
      const { key, acc } = midiToVexKey(it.midi, sig);
      const sn = new StaveNote({ clef, keys: [key], duration: dp.base });
      if (acc) sn.addModifier(new Accidental(acc), 0);
      if (dp.dotted) Dot.buildAndAttach([sn], { all: true });
      if (it.syllable) {
        const ann = new Annotation(it.syllable);
        ann.setVerticalJustification(Annotation.VerticalJustify.BOTTOM);
        sn.addModifier(ann, 0);
      }
      notes.push(sn);
      midis.push(it.midi);
      bases.push(dp.base);
      isAttack.push(!it.tiedFromPrev);
      originNoteIdxs.push(it.originNoteIdx);
      const myIdx = notes.length - 1;
      if (tiePending) ties.push({ from: myIdx - 1, to: myIdx });
      tiePending = it.tiedToNext;
    }
  }

  applyStemDirections(notes, midis, bases, clef);
  return { notes, midis, bases, isAttack, originNoteIdxs, ties };
}

function applyStemDirections(
  notes: StaveNote[],
  midis: (number | null)[],
  bases: ("w" | "h" | "q" | "8" | "16")[],
  clef: "treble" | "bass",
): void {
  const middleMidi = clef === "treble" ? 71 : 50;
  const isBeamable = (i: number) => midis[i] !== null && (bases[i] === "8" || bases[i] === "16");

  for (let i = 0; i < notes.length; i++) {
    const m = midis[i];
    if (m === null) continue;
    notes[i]!.setStemDirection(m >= middleMidi ? Stem.DOWN : Stem.UP);
  }

  let i = 0;
  while (i < notes.length) {
    if (!isBeamable(i)) { i++; continue; }
    let j = i + 1;
    while (j < notes.length && isBeamable(j)) j++;
    if (j - i >= 2) {
      let sum = 0;
      let count = 0;
      for (let k = i; k < j; k++) {
        const m = midis[k];
        if (m !== null) { sum += m; count++; }
      }
      const mean = count > 0 ? sum / count : middleMidi;
      const dir = mean >= middleMidi ? Stem.DOWN : Stem.UP;
      for (let k = i; k < j; k++) notes[k]!.setStemDirection(dir);
    }
    i = j;
  }
}

// ── Layout overlay types ──────────────────────────────────────────────────

interface AttackPos {
  x: number;             // absolute x within the wrapper
  originNoteIdx: number; // input-note index this attack represents
}
interface RowLayout {
  rowIdx: number;
  staveTop: number;      // y of the stave's top line
  staveBottom: number;   // y of the stave's bottom line
  attacks: AttackPos[];  // ordered left → right across the row
}
interface DividerLayout {
  chunkIdx: number;      // chunk index that STARTS at this divider (≥ 1 for drag)
  rowIdx: number;
  x: number;
  yTop: number;
  yBot: number;
}
interface SceneLayout {
  rows: RowLayout[];
  dividers: DividerLayout[];
  totalWidth: number;
  totalHeight: number;
}

// ── Component ─────────────────────────────────────────────────────────────

export default function VexFlowScore({
  notes,
  chunks,
  tonicMidi,
  timeSignature,
  targetRowWidth = 1000,
  onBoundaryDragMove,
  originalIndexMap,
}: VexFlowScoreProps) {
  const { colors } = useTheme();
  const containerRef = useRef<View>(null);
  const [scene, setScene] = useState<SceneLayout | null>(null);

  const dragStateRef = useRef<{ chunkIdx: number; rowIdx: number; cleanup: () => void } | null>(null);
  const [dragChunkIdx, setDragChunkIdx] = useState<number | null>(null);

  // Map a local notes[] index → originating song.allNotes index (identity when
  // no lyrics expansion happened). Mirrors SongScoreView's contract so drag
  // reports + chunk-start matches stay consistent across both renderers.
  const toOriginal = useCallback(
    (localIdx: number): number => (originalIndexMap ? (originalIndexMap[localIdx] ?? localIdx) : localIdx),
    [originalIndexMap],
  );
  const firstLocalForOriginal = useCallback(
    (original: number): number => {
      if (!originalIndexMap) return original;
      for (let i = 0; i < originalIndexMap.length; i++) {
        if (originalIndexMap[i] === original) return i;
      }
      return -1;
    },
    [originalIndexMap],
  );

  const quantized = useMemo(() => {
    const qNotes = notes.map((n) => ({
      midi: n.midi,
      durationBeats: n.durationBeats,
      restAfterBeats: n.restAfterBeats,
      ...(n.syllable ? { syllable: n.syllable } : {}),
    }));
    return quantizeMelody(qNotes, timeSignature);
  }, [notes, timeSignature]);

  const sig = useMemo(() => keySignatureFor(tonicMidi), [tonicMidi]);
  const clef = useMemo(() => chooseClef(notes), [notes]);
  const keySigStr = useMemo(() => vexKeySignature(sig), [sig]);
  const timeSigStr = `${timeSignature.num}/${timeSignature.den}`;

  // Stable lookup: for each chunk index ≥ 1, the originNoteIdx of its first note.
  const chunkStarts = useMemo(() => {
    const out = new Map<number, number>();
    for (let i = 1; i < chunks.length; i++) {
      out.set(i, chunks[i]!.startNoteIdx);
    }
    return out;
  }, [chunks]);

  const stopDrag = useCallback(() => {
    if (dragStateRef.current) {
      dragStateRef.current.cleanup();
      dragStateRef.current = null;
    }
    setDragChunkIdx(null);
  }, []);

  const noteIdxAtRowX = useCallback(
    (rowIdx: number, rowX: number, sceneSnap: SceneLayout): number | null => {
      const row = sceneSnap.rows[rowIdx];
      if (!row) return null;
      let best: number | null = null;
      let bestDist = Infinity;
      for (const a of row.attacks) {
        const d = Math.abs(a.x - rowX);
        if (d < bestDist) { bestDist = d; best = a.originNoteIdx; }
      }
      return best;
    },
    [],
  );

  const beginDrag = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, chunkIdx: number, rowIdx: number) => {
      if (!onBoundaryDragMove || !scene) return;
      e.preventDefault();
      const overlay = e.currentTarget;
      try { overlay.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      const wrapperEl = (containerRef.current as unknown as HTMLElement | null)?.parentElement
        ?? overlay.parentElement;
      const sceneSnap = scene;
      const onMove = (ev: PointerEvent) => {
        if (!wrapperEl) return;
        const rect = wrapperEl.getBoundingClientRect();
        const localX = ev.clientX - rect.left;
        const localIdx = noteIdxAtRowX(rowIdx, localX, sceneSnap);
        // Drag reports in ORIGINAL-note indices so chunk math stays valid when
        // lyrics have split notes 1:N.
        if (localIdx != null) onBoundaryDragMove(chunkIdx, toOriginal(localIdx));
      };
      const onUp = () => stopDrag();
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
      dragStateRef.current = {
        chunkIdx,
        rowIdx,
        cleanup: () => {
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onUp);
          window.removeEventListener("pointercancel", onUp);
        },
      };
      setDragChunkIdx(chunkIdx);
    },
    [onBoundaryDragMove, scene, noteIdxAtRowX, stopDrag],
  );

  useEffect(() => () => { stopDrag(); }, [stopDrag]);

  useEffect(() => {
    const el = containerRef.current as unknown as HTMLDivElement | null;
    if (!el) return;
    el.innerHTML = "";
    if (notes.length === 0) {
      setScene(null);
      return;
    }

    const ROW_PAD_X = 12;
    const STAVE_LINE_HEIGHT = 110;
    const MEASURE_BASE = 60;
    const PER_NOTE = 38;
    const PREFIX_WIDTH = 100;

    const measureWidths = quantized.measures.map((m, idx) => {
      const base = MEASURE_BASE + m.items.length * PER_NOTE;
      return idx === 0 ? base + PREFIX_WIDTH : base;
    });

    const rows: number[][] = [];
    {
      const innerBudget = targetRowWidth - ROW_PAD_X * 2;
      let cur: number[] = [];
      let curW = 0;
      for (let i = 0; i < quantized.measures.length; i++) {
        const isFirstInRow = cur.length === 0;
        const w = measureWidths[i]!;
        if (curW + w > innerBudget && cur.length > 0) {
          rows.push(cur);
          cur = [];
          curW = 0;
        }
        cur.push(i);
        curW += isFirstInRow ? w : Math.max(MEASURE_BASE, w);
      }
      if (cur.length > 0) rows.push(cur);
    }

    const totalHeight = rows.length * STAVE_LINE_HEIGHT + 40;
    const renderer = new Renderer(el, Renderer.Backends.SVG);
    renderer.resize(targetRowWidth, totalHeight);
    const ctx = renderer.getContext();
    ctx.setFillStyle(colors.textPrimary);
    ctx.setStrokeStyle(colors.textPrimary);

    const rowLayouts: RowLayout[] = [];
    const dividerLayouts: DividerLayout[] = [];

    let y = 10;
    for (let r = 0; r < rows.length; r++) {
      const measureIndices = rows[r]!;
      let x = ROW_PAD_X;
      const drawnInRow: { stave: Stave; built: BuiltMeasure; measureIdx: number; isFirstInRow: boolean }[] = [];

      measureIndices.forEach((mi, posInRow) => {
        const isFirstInRow = posInRow === 0;
        let width = MEASURE_BASE + quantized.measures[mi]!.items.length * PER_NOTE;
        if (isFirstInRow) width += PREFIX_WIDTH;
        const stave = new Stave(x, y, width);
        if (isFirstInRow) {
          stave.addClef(clef).addKeySignature(keySigStr);
          if (r === 0) stave.addTimeSignature(timeSigStr);
        }
        stave.setContext(ctx).draw();

        const built = buildMeasure(quantized.measures[mi]!.items, clef, sig);

        if (built.notes.length > 0) {
          const beams = Beam.generateBeams(built.notes, { maintainStemDirections: true });
          const voice = new Voice({
            numBeats: timeSignature.num,
            beatValue: timeSignature.den,
          }).setStrict(false);
          voice.addTickables(built.notes);
          new Formatter().joinVoices([voice]).format([voice], width - (isFirstInRow ? PREFIX_WIDTH : 20));
          voice.draw(ctx, stave);
          for (const beam of beams) beam.setContext(ctx).draw();
        }

        drawnInRow.push({ stave, built, measureIdx: mi, isFirstInRow });
        x += width;
      });

      for (const { built } of drawnInRow) {
        for (const t of built.ties) {
          new StaveTie({
            firstNote: built.notes[t.from]!,
            lastNote: built.notes[t.to]!,
            firstIndexes: [0],
            lastIndexes: [0],
          }).setContext(ctx).draw();
        }
      }

      for (let k = 0; k + 1 < drawnInRow.length; k++) {
        const leftBuilt = drawnInRow[k]!.built;
        const rightBuilt = drawnInRow[k + 1]!.built;
        const lastIdx = leftBuilt.notes.length - 1;
        const lastNoteInLeft = leftBuilt.notes[lastIdx];
        const firstNoteInRight = rightBuilt.notes[0];
        if (!lastNoteInLeft || !firstNoteInRight) continue;
        const mLeft = quantized.measures[measureIndices[k]!]!;
        const mRight = quantized.measures[measureIndices[k + 1]!]!;
        const leftItem = mLeft.items[mLeft.items.length - 1];
        const rightItem = mRight.items[0];
        if (
          leftItem && leftItem.kind === "note" && leftItem.tiedToNext &&
          rightItem && rightItem.kind === "note" && rightItem.tiedFromPrev &&
          leftItem.midi === rightItem.midi
        ) {
          new StaveTie({
            firstNote: lastNoteInLeft,
            lastNote: firstNoteInRight,
            firstIndexes: [0],
            lastIndexes: [0],
          }).setContext(ctx).draw();
        }
      }

      // Collect attack-note positions for this row.
      const staveSample = drawnInRow[0]?.stave;
      const staveTop = staveSample ? staveSample.getYForLine(0) : y;
      const staveBottom = staveSample ? staveSample.getYForLine(4) : y + 32;
      const attacks: AttackPos[] = [];
      for (const { built } of drawnInRow) {
        for (let i = 0; i < built.notes.length; i++) {
          if (!built.isAttack[i]) continue;
          const oIdx = built.originNoteIdxs[i];
          if (oIdx === null) continue;
          attacks.push({ x: built.notes[i]!.getAbsoluteX(), originNoteIdx: oIdx });
        }
      }
      rowLayouts.push({ rowIdx: r, staveTop, staveBottom, attacks });

      // Find dividers in this row: place a divider at the FIRST local note
      // that maps to the chunk's original startNoteIdx — otherwise lyrics-split
      // notes would re-fire the divider at every split.
      for (let ci = 1; ci < chunks.length; ci++) {
        const startIdx = chunkStarts.get(ci);
        if (startIdx == null) continue;
        const firstLocal = firstLocalForOriginal(startIdx);
        const hit = attacks.find((a) => a.originNoteIdx === firstLocal);
        if (hit) {
          dividerLayouts.push({
            chunkIdx: ci,
            rowIdx: r,
            x: hit.x - 4,
            yTop: staveTop - 8,
            yBot: staveBottom + 8,
          });
        }
      }

      y += STAVE_LINE_HEIGHT;
    }

    setScene({
      rows: rowLayouts,
      dividers: dividerLayouts,
      totalWidth: targetRowWidth,
      totalHeight,
    });
  }, [quantized, sig, clef, keySigStr, timeSigStr, timeSignature, notes.length, targetRowWidth, colors.textPrimary, chunks, chunkStarts, firstLocalForOriginal]);

  return (
    <View
      style={{
        backgroundColor: colors.bgSurface,
        borderRadius: Radii.md,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        padding: Spacing.sm,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <View ref={containerRef} />
      {scene && (
        <View
          style={{
            position: "absolute",
            top: Spacing.sm,
            left: Spacing.sm,
            width: scene.totalWidth,
            height: scene.totalHeight,
            // @ts-ignore — RNW honors `pointerEvents` as DOM style.
            pointerEvents: "box-none",
          }}
        >
          {scene.dividers.map((d) => {
            const color = CHUNK_PALETTE[d.chunkIdx % CHUNK_PALETTE.length]!;
            const isDragging = dragChunkIdx === d.chunkIdx;
            return (
              <View key={`d-${d.chunkIdx}`}>
                {/* Colored visual line */}
                <View
                  style={{
                    position: "absolute",
                    left: d.x,
                    top: d.yTop,
                    width: 2,
                    height: d.yBot - d.yTop,
                    backgroundColor: color,
                    opacity: isDragging ? 1 : 0.85,
                  }}
                />
                {/* Drag hit-target (web only) */}
                {onBoundaryDragMove && (
                  // @ts-ignore — react-native-web passes through raw DOM elements at runtime.
                  <div
                    onPointerDown={(e: React.PointerEvent<HTMLDivElement>) => beginDrag(e, d.chunkIdx, d.rowIdx)}
                    style={{
                      position: "absolute",
                      left: d.x - 6,
                      top: d.yTop - 4,
                      width: 14,
                      height: d.yBot - d.yTop + 8,
                      cursor: "ew-resize",
                      background: isDragging ? "rgba(168,106,36,0.18)" : "transparent",
                    }}
                    aria-label={`Drag boundary ${d.chunkIdx}`}
                  />
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

export { CHUNK_PALETTE } from "./SongScoreView";
