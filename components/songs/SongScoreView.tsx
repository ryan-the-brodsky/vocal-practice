// Multi-line wrapped staff for the Song Editor. Renders the full melody with
// real note values (whole / half / quarter / eighth / sixteenth) + explicit
// rest glyphs between notes that have a silence gap. Each row carries its
// own clef + key signature prefix and is packed greedily by cumulative width.
//
// NOT a reuse of MelodyDisplay (single-row infinite scroll). NOT a real
// notation engine — we approximate to the nearest standard note value and
// skip beaming, dotted notes, and ties.

import { Fonts, Radii, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import {
  keySignatureFor,
  spellMidiInKey,
  staffStepFor,
  type KeySignature,
  type Letter,
  TREBLE_SHARP_STEPS,
  TREBLE_FLAT_STEPS,
  BASS_SHARP_STEPS,
  BASS_FLAT_STEPS,
} from "@/lib/music/keySignature";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, StyleSheet, Text, TextInput, View } from "react-native";
import Svg, { Ellipse, G, Line, Text as SvgText } from "react-native-svg";

import type { ChunkSpec } from "@/lib/songs/types";

export interface ScoreNote {
  midi: number;
  durationBeats: number;
  /** Silence (beats) AFTER this note. 0 when the next note follows immediately. */
  restAfterBeats: number;
  syllable?: string;
}

export interface SongScoreViewProps {
  notes: ScoreNote[];
  chunks: ChunkSpec[];
  tonicMidi: number;
  /** Pixel budget per row. Defaults to 720, fits a typical desktop column. */
  targetRowWidth?: number;
  /** Web-only: called when a divider is dragged. boundaryIdx is the index of
   *  the chunk that starts at the divider (always ≥ 1). newStartNoteIdx is the
   *  pre-clamped target. The parent should clamp + reconcile. */
  onBoundaryDragMove?: (boundaryIdx: number, newStartNoteIdx: number) => void;
  /** Called when an inline-edited segment label commits. */
  onLabelRename?: (chunkIdx: number, name: string) => void;
}

// ── Constants ─────────────────────────────────────────────────────────────
const STAFF_LINE_SPACING = 8;
const STAFF_HEIGHT = STAFF_LINE_SPACING * 4;
const ROW_TOP_PAD = STAFF_LINE_SPACING * 6;   // headroom for chunk labels + ledger lines + stems
const ROW_BOTTOM_PAD = STAFF_LINE_SPACING * 5;
const ROW_HEIGHT = STAFF_HEIGHT + ROW_TOP_PAD + ROW_BOTTOM_PAD;
const NOTEHEAD_RX = 5.2;
const NOTEHEAD_RY = 4;
const STEM_THICKNESS = 1.2;
const STEM_LENGTH = STAFF_LINE_SPACING * 3.2; // ~one octave worth of staff space
const REST_MIN_VISIBLE_BEATS = 1 / 16; // anything ≥ a 16th-rest is drawn

const CLEF_FONT_SIZE = STAFF_LINE_SPACING * 4.6;
const KEY_ACCIDENTAL_FONT_SIZE = STAFF_LINE_SPACING * 3.2;
const NOTE_ACCIDENTAL_FONT_SIZE = STAFF_LINE_SPACING * 3.0;
const KEY_ACCIDENTAL_WIDTH = STAFF_LINE_SPACING * 1.1;
const CLEF_WIDTH = STAFF_LINE_SPACING * 3.2;
const PREFIX_GAP = STAFF_LINE_SPACING * 1.4;
const NOTEHEAD_FONT_SIZE = STAFF_LINE_SPACING * 4;
const REST_FONT_SIZE = STAFF_LINE_SPACING * 4;
const FLAG_FONT_SIZE = STAFF_LINE_SPACING * 4;

// SMuFL glyphs
const GLYPH = {
  trebleClef: "",
  bassClef: "",
  sharp: "",
  flat: "",
  natural: "",
  noteheadBlack: "",
  noteheadHalf: "",
  noteheadWhole: "",
  restWhole: "",
  restHalf: "",
  restQuarter: "",
  rest8th: "",
  rest16th: "",
  flag8thUp: "",
  flag8thDown: "",
  flag16thUp: "",
  flag16thDown: "",
};

const STD_DURATIONS = [1 / 16, 1 / 8, 1 / 4, 1 / 2, 1, 2, 4] as const;
type StdDuration = (typeof STD_DURATIONS)[number];

const NOTE_WIDTH_BY_VALUE: Record<number, number> = {
  [1 / 16]: 22,
  [1 / 8]: 28,
  [1 / 4]: 38,
  [1 / 2]: 52,
  [1]: 68,
  [2]: 92,
  [4]: 120,
};
const REST_WIDTH_BY_VALUE: Record<number, number> = {
  [1 / 16]: 20,
  [1 / 8]: 24,
  [1 / 4]: 30,
  [1 / 2]: 40,
  [1]: 54,
  [2]: 78,
  [4]: 96,
};

const CHUNK_PALETTE = [
  "#B45A1F",
  "#3C7C99",
  "#7F4E91",
  "#3F7050",
  "#A53B3B",
  "#806730",
];
export { CHUNK_PALETTE };

// ── Helpers ───────────────────────────────────────────────────────────────

function pickNoteValue(beats: number): StdDuration {
  if (beats <= 0) return STD_DURATIONS[0]!;
  let best: StdDuration = STD_DURATIONS[0]!;
  let bestDist = Infinity;
  for (const d of STD_DURATIONS) {
    const dist = Math.abs(Math.log2(beats / d));
    if (dist < bestDist) {
      bestDist = dist;
      best = d;
    }
  }
  return best;
}

interface ClefSpec {
  kind: "treble" | "bass";
  bottomLetter: Letter;
  bottomOctave: number;
}
const TREBLE: ClefSpec = { kind: "treble", bottomLetter: "E", bottomOctave: 4 };
const BASS: ClefSpec = { kind: "bass", bottomLetter: "G", bottomOctave: 2 };

function chooseClef(midis: number[]): ClefSpec {
  if (midis.length === 0) return TREBLE;
  const mean = midis.reduce((s, m) => s + m, 0) / midis.length;
  return mean >= 60 ? TREBLE : BASS;
}

function staffStepToY(step: number): number {
  const bottomY = ROW_TOP_PAD + STAFF_HEIGHT;
  return bottomY - step * (STAFF_LINE_SPACING / 2);
}

function clefBaselineY(): number {
  return staffStepToY(0);
}

function keySignatureSteps(clef: ClefSpec, sig: KeySignature): number[] {
  const usingFlats = sig.accidentalCount < 0;
  const table = clef.kind === "treble"
    ? (usingFlats ? TREBLE_FLAT_STEPS : TREBLE_SHARP_STEPS)
    : (usingFlats ? BASS_FLAT_STEPS : BASS_SHARP_STEPS);
  return sig.accidentals.map((a) => table[a.letter]);
}

function prefixWidthFor(sig: KeySignature | null): number {
  const accCount = sig ? Math.abs(sig.accidentalCount) : 0;
  return CLEF_WIDTH + accCount * KEY_ACCIDENTAL_WIDTH + PREFIX_GAP;
}

function ledgerLinesFor(step: number): number[] {
  const ys: number[] = [];
  if (step >= 10) {
    for (let s = 10; s <= step; s += 2) ys.push(staffStepToY(s));
  }
  if (step <= -2) {
    for (let s = -2; s >= step; s -= 2) ys.push(staffStepToY(s));
  }
  return ys;
}

function noteheadGlyph(value: StdDuration): string {
  if (value >= 4) return GLYPH.noteheadWhole;
  if (value >= 2) return GLYPH.noteheadWhole;
  if (value >= 1) return GLYPH.noteheadHalf; // half note
  return GLYPH.noteheadBlack; // quarter, eighth, sixteenth — all filled
}

function hasStem(value: StdDuration): boolean {
  return value <= 2; // whole has no stem
}

function flagsForValue(value: StdDuration): number {
  if (value === 1 / 8) return 1;
  if (value === 1 / 16) return 2;
  return 0;
}

function restGlyph(value: StdDuration): string {
  if (value >= 4) return GLYPH.restWhole;
  if (value >= 2) return GLYPH.restWhole;
  if (value >= 1) return GLYPH.restHalf;
  if (value >= 1 / 2) return GLYPH.restQuarter; // half note rest doesn't exist for our table — closest is quarter
  if (value >= 1 / 4) return GLYPH.restQuarter;
  if (value >= 1 / 8) return GLYPH.rest8th;
  return GLYPH.rest16th;
}

// ── Render units ──────────────────────────────────────────────────────────

interface NoteUnit {
  kind: "note";
  width: number;
  noteIdx: number;
  midi: number;
  value: StdDuration;
  syllable?: string;
}
interface RestUnit {
  kind: "rest";
  width: number;
  value: StdDuration;
}
type RenderUnit = NoteUnit | RestUnit;

function buildUnits(notes: ScoreNote[]): RenderUnit[] {
  const out: RenderUnit[] = [];
  notes.forEach((n, i) => {
    const v = pickNoteValue(n.durationBeats);
    out.push({
      kind: "note",
      width: NOTE_WIDTH_BY_VALUE[v]!,
      noteIdx: i,
      midi: n.midi,
      value: v,
      syllable: n.syllable,
    });
    if (n.restAfterBeats >= REST_MIN_VISIBLE_BEATS) {
      const rv = pickNoteValue(n.restAfterBeats);
      out.push({ kind: "rest", width: REST_WIDTH_BY_VALUE[rv]!, value: rv });
    }
  });
  return out;
}

function packRows(units: RenderUnit[], budget: number): RenderUnit[][] {
  const rows: RenderUnit[][] = [];
  let cur: RenderUnit[] = [];
  let curW = 0;
  for (const u of units) {
    if (curW + u.width > budget && cur.length > 0) {
      rows.push(cur);
      cur = [];
      curW = 0;
    }
    cur.push(u);
    curW += u.width;
  }
  if (cur.length > 0) rows.push(cur);
  return rows;
}

function chunkIndexForNote(noteIdx: number, chunks: ChunkSpec[]): number {
  for (let i = 0; i < chunks.length; i++) {
    if (noteIdx >= chunks[i]!.startNoteIdx && noteIdx <= chunks[i]!.endNoteIdx) return i;
  }
  return -1;
}

// ── Component ─────────────────────────────────────────────────────────────

interface PositionedUnit {
  unit: RenderUnit;
  x: number;
}
interface DividerInfo {
  chunkIdx: number;        // chunk index that STARTS at this divider
  x: number;               // pixel left position within the row
  isFirstOnRow: boolean;   // true if this is the row's first chunk-start label
}

export default function SongScoreView({
  notes,
  chunks,
  tonicMidi,
  targetRowWidth = 720,
  onBoundaryDragMove,
  onLabelRename,
}: SongScoreViewProps) {
  const { colors } = useTheme();

  const { rows, clef, sig, prefixWidth, rowWidth } = useMemo(() => {
    const midis = notes.map((n) => n.midi);
    const clef = chooseClef(midis);
    const sig = keySignatureFor(tonicMidi);
    const prefixWidth = prefixWidthFor(sig);
    const innerBudget = Math.max(80, targetRowWidth - prefixWidth - Spacing.md * 2);
    const units = buildUnits(notes);
    const rows = packRows(units, innerBudget);
    const widestInner = rows.reduce(
      (m, r) => Math.max(m, r.reduce((s, u) => s + u.width, 0)),
      0,
    );
    const rowWidth = prefixWidth + Math.max(widestInner, 80) + Spacing.md * 2;
    return { rows, clef, sig, prefixWidth, rowWidth };
  }, [notes, tonicMidi, targetRowWidth]);

  const notesStartX = Spacing.md + prefixWidth;

  const layout = useMemo<{ items: PositionedUnit[]; dividers: DividerInfo[] }[]>(() => {
    return rows.map((row) => {
      let xCursor = notesStartX;
      const items: PositionedUnit[] = [];
      const dividers: DividerInfo[] = [];
      let firstNoteSeen = false;
      row.forEach((u) => {
        const x = xCursor;
        items.push({ unit: u, x });
        if (u.kind === "note") {
          const ci = chunkIndexForNote(u.noteIdx, chunks);
          if (ci >= 0 && chunks[ci]!.startNoteIdx === u.noteIdx) {
            dividers.push({ chunkIdx: ci, x, isFirstOnRow: !firstNoteSeen });
          }
          firstNoteSeen = true;
        }
        xCursor += u.width;
      });
      return { items, dividers };
    });
  }, [rows, chunks, notesStartX]);

  const isWeb = Platform.OS === "web";
  const [editingChunkIdx, setEditingChunkIdx] = useState<number | null>(null);
  const [draftName, setDraftName] = useState("");
  const dragStateRef = useRef<{
    boundaryIdx: number;
    rowEl: HTMLElement;
    rowIdx: number;
    cleanup: () => void;
  } | null>(null);
  const [dragBoundary, setDragBoundary] = useState<number | null>(null);

  const stopDrag = useCallback(() => {
    if (dragStateRef.current) {
      dragStateRef.current.cleanup();
      dragStateRef.current = null;
    }
    setDragBoundary(null);
  }, []);

  // Snap a row-local x to the nearest note idx in that row.
  const noteIdxAtRowX = useCallback(
    (rowIdx: number, rowX: number): number | null => {
      const row = layout[rowIdx];
      if (!row) return null;
      let best: number | null = null;
      let bestDist = Infinity;
      for (const it of row.items) {
        if (it.unit.kind !== "note") continue;
        const cx = it.x + it.unit.width / 2;
        const d = Math.abs(cx - rowX);
        if (d < bestDist) { bestDist = d; best = it.unit.noteIdx; }
      }
      return best;
    },
    [layout],
  );

  const beginDrag = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, rowIdx: number, boundaryIdx: number) => {
      if (!onBoundaryDragMove) return;
      const overlay = e.currentTarget;
      const rowEl = overlay.parentElement as HTMLElement | null;
      if (!rowEl) return;
      e.preventDefault();
      try { overlay.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      const onMove = (ev: PointerEvent) => {
        const rect = rowEl.getBoundingClientRect();
        const localX = ev.clientX - rect.left;
        const noteIdx = noteIdxAtRowX(rowIdx, localX);
        if (noteIdx != null) onBoundaryDragMove(boundaryIdx, noteIdx);
      };
      const onUp = () => stopDrag();
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
      dragStateRef.current = {
        boundaryIdx,
        rowEl,
        rowIdx,
        cleanup: () => {
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onUp);
          window.removeEventListener("pointercancel", onUp);
        },
      };
      setDragBoundary(boundaryIdx);
    },
    [onBoundaryDragMove, noteIdxAtRowX, stopDrag],
  );

  useEffect(() => {
    return () => { stopDrag(); };
  }, [stopDrag]);

  const beginRename = useCallback(
    (chunkIdx: number) => {
      const c = chunks[chunkIdx];
      if (!c) return;
      setDraftName(c.name);
      setEditingChunkIdx(chunkIdx);
    },
    [chunks],
  );

  const commitRename = useCallback(() => {
    if (editingChunkIdx == null) return;
    const trimmed = draftName.trim();
    const c = chunks[editingChunkIdx];
    if (c && trimmed && trimmed !== c.name && onLabelRename) {
      onLabelRename(editingChunkIdx, trimmed);
    }
    setEditingChunkIdx(null);
  }, [editingChunkIdx, draftName, chunks, onLabelRename]);

  if (notes.length === 0) {
    return (
      <View style={[styles.container, { width: targetRowWidth }]}>
        <Text style={{ color: colors.textTertiary, fontFamily: Fonts.body }}>No notes to display.</Text>
      </View>
    );
  }

  const staffStartX = Spacing.md;
  const clefX = staffStartX + CLEF_WIDTH * 0.15;
  const sigStartX = staffStartX + CLEF_WIDTH;

  return (
    <View style={[styles.container, { width: rowWidth }]}>
      {layout.map((rowLayout, rowIdx) => {
        // Hide the SVG label for any chunk being inline-renamed so the overlay
        // input doesn't double up with stale text.
        const labelDividers = rowLayout.dividers.filter((d) => d.chunkIdx !== editingChunkIdx);
        return (
        <View key={rowIdx} style={{ width: rowWidth, height: ROW_HEIGHT, position: "relative" }}>
          <Svg width={rowWidth} height={ROW_HEIGHT}>
            {/* Staff lines */}
            {[0, 1, 2, 3, 4].map((i) => {
              const y = ROW_TOP_PAD + i * STAFF_LINE_SPACING;
              return (
                <Line
                  key={`s${i}`}
                  x1={staffStartX}
                  x2={rowWidth - Spacing.md}
                  y1={y}
                  y2={y}
                  stroke={colors.borderStrong}
                  strokeWidth={1}
                />
              );
            })}

            {/* Clef */}
            <SvgText
              x={clefX}
              y={clefBaselineY()}
              fontFamily="BravuraText"
              fontSize={CLEF_FONT_SIZE}
              fill={colors.textPrimary}
            >
              {clef.kind === "treble" ? GLYPH.trebleClef : GLYPH.bassClef}
            </SvgText>

            {/* Key signature */}
            {sig.accidentals.length > 0 && keySignatureSteps(clef, sig).map((step, i) => {
              const x = sigStartX + i * KEY_ACCIDENTAL_WIDTH + KEY_ACCIDENTAL_WIDTH * 0.5;
              const y = staffStepToY(step);
              const glyph = sig.accidentals[i]!.type === "sharp" ? GLYPH.sharp : GLYPH.flat;
              return (
                <SvgText
                  key={`k${i}`}
                  x={x}
                  y={y}
                  fontFamily="BravuraText"
                  fontSize={KEY_ACCIDENTAL_FONT_SIZE}
                  fill={colors.textPrimary}
                  textAnchor="middle"
                >
                  {glyph}
                </SvgText>
              );
            })}

            {/* Render units */}
            {rowLayout.items.map((it, idx) => {
              const u = it.unit;
              const cx = it.x + u.width / 2;
              if (u.kind === "rest") {
                return (
                  <SvgText
                    key={`u${idx}`}
                    x={cx}
                    y={staffStepToY(4)}
                    fontFamily="BravuraText"
                    fontSize={REST_FONT_SIZE}
                    fill={colors.textSecondary}
                    textAnchor="middle"
                  >
                    {restGlyph(u.value)}
                  </SvgText>
                );
              }
              const spelling = spellMidiInKey(u.midi, sig);
              const step = staffStepFor(spelling.letter, spelling.octave, clef.bottomLetter, clef.bottomOctave);
              const cy = staffStepToY(step);
              const ledgers = ledgerLinesFor(step);
              const accGlyph = spelling.accidentalGlyph
                ? (spelling.accidentalGlyph === "sharp" ? GLYPH.sharp
                  : spelling.accidentalGlyph === "flat" ? GLYPH.flat
                  : GLYPH.natural)
                : null;
              const chunkIdx = chunkIndexForNote(u.noteIdx, chunks);
              const chunkColor =
                chunkIdx >= 0 ? CHUNK_PALETTE[chunkIdx % CHUNK_PALETTE.length]! : colors.textPrimary;

              const isChunkStart = chunkIdx > 0 && chunks[chunkIdx]!.startNoteIdx === u.noteIdx;
              const dividerX = it.x;

              const stemUp = step <= 4;
              const stemX = stemUp ? cx + NOTEHEAD_RX - STEM_THICKNESS / 2 : cx - NOTEHEAD_RX + STEM_THICKNESS / 2;
              const stemTopY = stemUp ? cy - STEM_LENGTH : cy;
              const stemBotY = stemUp ? cy : cy + STEM_LENGTH;

              return (
                <G key={`u${idx}`}>
                  {isChunkStart && (
                    <Line
                      x1={dividerX}
                      x2={dividerX}
                      y1={ROW_TOP_PAD - 6}
                      y2={ROW_TOP_PAD + STAFF_HEIGHT + 6}
                      stroke={chunkColor}
                      strokeWidth={dragBoundary === chunkIdx ? 3 : 2}
                    />
                  )}
                  {ledgers.map((ly, k) => (
                    <Line
                      key={`l${k}`}
                      x1={cx - NOTEHEAD_RX - 3}
                      x2={cx + NOTEHEAD_RX + 3}
                      y1={ly}
                      y2={ly}
                      stroke={colors.borderStrong}
                      strokeWidth={1}
                    />
                  ))}
                  {accGlyph && (
                    <SvgText
                      x={cx - NOTEHEAD_RX - 4}
                      y={cy + 2}
                      fontFamily="BravuraText"
                      fontSize={NOTE_ACCIDENTAL_FONT_SIZE}
                      fill={chunkColor}
                      textAnchor="end"
                    >
                      {accGlyph}
                    </SvgText>
                  )}
                  {u.value >= 1 ? (
                    <SvgText
                      x={cx}
                      y={cy + NOTEHEAD_RY}
                      fontFamily="BravuraText"
                      fontSize={NOTEHEAD_FONT_SIZE}
                      fill={chunkColor}
                      textAnchor="middle"
                    >
                      {noteheadGlyph(u.value)}
                    </SvgText>
                  ) : (
                    <Ellipse cx={cx} cy={cy} rx={NOTEHEAD_RX} ry={NOTEHEAD_RY} fill={chunkColor} />
                  )}
                  {hasStem(u.value) && (
                    <Line
                      x1={stemX}
                      x2={stemX}
                      y1={stemTopY}
                      y2={stemBotY}
                      stroke={chunkColor}
                      strokeWidth={STEM_THICKNESS}
                    />
                  )}
                  {flagsForValue(u.value) > 0 && (
                    <SvgText
                      x={stemX}
                      y={stemUp ? stemTopY + FLAG_FONT_SIZE * 0.3 : stemBotY}
                      fontFamily="BravuraText"
                      fontSize={FLAG_FONT_SIZE}
                      fill={chunkColor}
                      textAnchor="start"
                    >
                      {flagsForValue(u.value) === 1
                        ? (stemUp ? GLYPH.flag8thUp : GLYPH.flag8thDown)
                        : (stemUp ? GLYPH.flag16thUp : GLYPH.flag16thDown)}
                    </SvgText>
                  )}
                </G>
              );
            })}

            {/* Labels for chunk starts on this row (skipped for the chunk being renamed). */}
            {labelDividers.map((d) => (
              <SvgText
                key={`lbl${d.chunkIdx}`}
                x={d.x + 4}
                y={ROW_TOP_PAD - 10}
                fontFamily={Fonts.bodySemibold}
                fontSize={Typography.xs.size}
                fill={CHUNK_PALETTE[d.chunkIdx % CHUNK_PALETTE.length]!}
              >
                {chunks[d.chunkIdx]!.name}
              </SvgText>
            ))}
          </Svg>

          {isWeb && rowLayout.dividers.map((d) => {
            const isInterior = d.chunkIdx > 0;
            const labelLeft = d.x + 4;
            const labelTop = ROW_TOP_PAD - 22;
            return (
              <View key={`ov-${d.chunkIdx}`}>
                {isInterior && onBoundaryDragMove && (
                  // @ts-ignore — react-native-web passes through raw DOM elements at runtime.
                  <div
                    onPointerDown={(e: React.PointerEvent<HTMLDivElement>) => beginDrag(e, rowIdx, d.chunkIdx)}
                    style={{
                      position: "absolute",
                      left: d.x - 6,
                      top: ROW_TOP_PAD - 8,
                      width: 12,
                      height: STAFF_HEIGHT + 16,
                      cursor: "ew-resize",
                      zIndex: 5,
                      background: dragBoundary === d.chunkIdx ? "rgba(168,106,36,0.18)" : "transparent",
                    }}
                    aria-label={`Drag boundary for ${chunks[d.chunkIdx]!.name}`}
                  />
                )}
                {editingChunkIdx === d.chunkIdx ? (
                  <View style={{ position: "absolute", left: labelLeft, top: labelTop, zIndex: 10, minWidth: 140 }}>
                    <TextInput
                      autoFocus
                      value={draftName}
                      onChangeText={setDraftName}
                      onBlur={commitRename}
                      onSubmitEditing={commitRename}
                      style={{
                        backgroundColor: colors.bgSurface,
                        color: colors.textPrimary,
                        fontFamily: Fonts.bodySemibold,
                        fontSize: Typography.xs.size,
                        lineHeight: Typography.xs.lineHeight,
                        borderWidth: 1,
                        borderColor: colors.accent,
                        borderRadius: Radii.sm,
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                      }}
                    />
                  </View>
                ) : (
                  onLabelRename && (
                    // @ts-ignore — react-native-web passes through raw DOM elements at runtime.
                    <div
                      onClick={(e: React.MouseEvent) => { e.stopPropagation(); beginRename(d.chunkIdx); }}
                      style={{
                        position: "absolute",
                        left: labelLeft,
                        top: labelTop,
                        width: 160,
                        height: 18,
                        cursor: "text",
                        zIndex: 4,
                      }}
                      aria-label={`Rename ${chunks[d.chunkIdx]!.name}`}
                      title="Click to rename"
                    />
                  )
                )}
              </View>
            );
          })}
        </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: Radii.md, gap: Spacing.xs },
});
