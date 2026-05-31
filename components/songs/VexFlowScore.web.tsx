// VexFlow-based score view (web only). Renders the imported melody with
// proper note values, beaming, barlines, ties, accidentals, and key/time sig.
// Replaces the home-grown SongScoreView for users who opt into the new
// notation engine.

import { Radii, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import {
  keySignatureFor,
  spellMidiInKey,
  type KeySignature,
} from "@/lib/music/keySignature";
import { quantizeMelody, type DurationCode, type QOutItem } from "@/lib/songs/quantize";
import type { ChunkSpec, TimeSignature } from "@/lib/songs/types";
import { useEffect, useMemo, useRef } from "react";
import { View } from "react-native";
import {
  Accidental,
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

import type { ScoreNote } from "./SongScoreView";

export interface VexFlowScoreProps {
  notes: ScoreNote[];
  chunks: ChunkSpec[];           // unused in v1 prototype (segment overlays TBD)
  tonicMidi: number;
  timeSignature: TimeSignature;
  targetRowWidth?: number;
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

// VexFlow key-signature strings: major key names. We pick the major name whose
// accidental count matches our derived KeySignature (treating modal pieces as
// the parent major — close enough for v1).
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
  /** MIDI per note index (null for rests). Used for beam-group stem direction. */
  midis: (number | null)[];
  /** VexFlow base duration per index ('w'/'h'/'q'/'8'/'16'), for grouping. */
  bases: ("w" | "h" | "q" | "8" | "16")[];
  /** Pairs of (fromIndex, toIndex) within `notes` that should be tied. */
  ties: Array<{ from: number; to: number }>;
}
function buildMeasure(items: QOutItem[], clef: "treble" | "bass", sig: KeySignature): BuiltMeasure {
  const notes: StaveNote[] = [];
  const midis: (number | null)[] = [];
  const bases: ("w" | "h" | "q" | "8" | "16")[] = [];
  const ties: Array<{ from: number; to: number }> = [];
  let tiePending = false;

  for (const it of items) {
    const dp = parseDuration(it.duration);
    if (it.kind === "rest") {
      const sn = new StaveNote({
        clef,
        keys: [clef === "treble" ? "b/4" : "d/3"], // rest position is cosmetic
        duration: `${dp.base}r`,
      });
      if (dp.dotted) Dot.buildAndAttach([sn], { all: true });
      notes.push(sn);
      midis.push(null);
      bases.push(dp.base);
      tiePending = false;
    } else {
      const { key, acc } = midiToVexKey(it.midi, sig);
      const sn = new StaveNote({ clef, keys: [key], duration: dp.base });
      if (acc) sn.addModifier(new Accidental(acc), 0);
      if (dp.dotted) Dot.buildAndAttach([sn], { all: true });
      notes.push(sn);
      midis.push(it.midi);
      bases.push(dp.base);
      const myIdx = notes.length - 1;
      if (tiePending) ties.push({ from: myIdx - 1, to: myIdx });
      tiePending = it.tiedToNext;
    }
  }

  applyStemDirections(notes, midis, bases, clef);
  return { notes, midis, bases, ties };
}

/** Set each note's stem direction so beam groups share one direction (by the
 *  group's mean pitch). Unbeamable notes (quarters and longer, or rests) get
 *  their own per-pitch direction. Mirrors standard engraving convention. */
function applyStemDirections(
  notes: StaveNote[],
  midis: (number | null)[],
  bases: ("w" | "h" | "q" | "8" | "16")[],
  clef: "treble" | "bass",
): void {
  const middleMidi = clef === "treble" ? 71 : 50; // B4 / D3
  const isBeamable = (i: number) => midis[i] !== null && (bases[i] === "8" || bases[i] === "16");

  // First pass: per-note default direction by its own pitch.
  for (let i = 0; i < notes.length; i++) {
    const m = midis[i];
    if (m === null) continue;
    notes[i]!.setStemDirection(m >= middleMidi ? Stem.DOWN : Stem.UP);
  }

  // Second pass: unify stems within each contiguous beamable run.
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

// ── Component ─────────────────────────────────────────────────────────────

export default function VexFlowScore({
  notes,
  tonicMidi,
  timeSignature,
  targetRowWidth = 1000,
}: VexFlowScoreProps) {
  const { colors } = useTheme();
  const containerRef = useRef<View>(null);

  const quantized = useMemo(() => {
    const qNotes = notes.map((n) => ({
      midi: n.midi,
      durationBeats: n.durationBeats,
      restAfterBeats: n.restAfterBeats,
    }));
    return quantizeMelody(qNotes, timeSignature);
  }, [notes, timeSignature]);

  const sig = useMemo(() => keySignatureFor(tonicMidi), [tonicMidi]);
  const clef = useMemo(() => chooseClef(notes), [notes]);
  const keySigStr = useMemo(() => vexKeySignature(sig), [sig]);
  const timeSigStr = `${timeSignature.num}/${timeSignature.den}`;

  useEffect(() => {
    // containerRef on web is a raw <div>. Clear and remount the VexFlow SVG on
    // every render — VexFlow has no incremental API and rerender cost is fine.
    const el = containerRef.current as unknown as HTMLDivElement | null;
    if (!el) return;
    el.innerHTML = "";
    if (notes.length === 0) return;

    // Layout: pack measures across rows with a target row width. Each measure
    // gets a baseline width plus a per-note allotment so dense measures don't
    // crowd. The first measure of each row carries the clef + key + time sig.
    const ROW_PAD_X = 12;
    const STAVE_LINE_HEIGHT = 110; // vertical spacing between staves
    const MEASURE_BASE = 60;       // minimum width of a measure
    const PER_NOTE = 38;           // approximate horizontal budget per tickable
    const PREFIX_WIDTH = 100;      // extra width on first measure of each row

    const measureWidths = quantized.measures.map((m, idx) => {
      const base = MEASURE_BASE + m.items.length * PER_NOTE;
      return idx === 0 ? base + PREFIX_WIDTH : base;
    });

    // Pack measures into rows so each row's total width ≤ targetRowWidth - 2*pad.
    const rows: number[][] = []; // arrays of measure indices
    {
      const innerBudget = targetRowWidth - ROW_PAD_X * 2;
      let cur: number[] = [];
      let curW = 0;
      for (let i = 0; i < quantized.measures.length; i++) {
        // First measure in a row carries the prefix; subsequent measures don't.
        const isFirstInRow = cur.length === 0;
        const w = isFirstInRow ? measureWidths[i]! : measureWidths[i]! - PREFIX_WIDTH * 0; // already 0 prefix
        const adjusted = isFirstInRow ? w : Math.max(MEASURE_BASE, w);
        if (curW + adjusted > innerBudget && cur.length > 0) {
          rows.push(cur);
          cur = [];
          curW = 0;
        }
        cur.push(i);
        curW += isFirstInRow ? w : adjusted;
      }
      if (cur.length > 0) rows.push(cur);
    }

    const totalHeight = rows.length * STAVE_LINE_HEIGHT + 40;
    const renderer = new Renderer(el, Renderer.Backends.SVG);
    renderer.resize(targetRowWidth, totalHeight);
    const ctx = renderer.getContext();
    ctx.setFillStyle(colors.textPrimary);
    ctx.setStrokeStyle(colors.textPrimary);

    let y = 10;
    for (let r = 0; r < rows.length; r++) {
      const measureIndices = rows[r]!;
      let x = ROW_PAD_X;
      const drawnInRow: { stave: Stave; built: BuiltMeasure }[] = [];

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

        let beams: Beam[] = [];
        if (built.notes.length > 0) {
          // Generate beams BEFORE the voice draws — the beam constructor marks
          // its member notes as beamed, which suppresses their individual flags.
          beams = Beam.generateBeams(built.notes, { maintainStemDirections: true });

          const voice = new Voice({
            numBeats: timeSignature.num,
            beatValue: timeSignature.den,
          }).setStrict(false);
          voice.addTickables(built.notes);
          new Formatter().joinVoices([voice]).format([voice], width - (isFirstInRow ? PREFIX_WIDTH : 20));

          voice.draw(ctx, stave);
          for (const beam of beams) beam.setContext(ctx).draw();
        }

        drawnInRow.push({ stave, built });
        x += width;
      });

      // Draw ties within each measure (cross-measure ties handled separately).
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

      // Cross-measure ties: connect the last note of measure N with the first
      // note of measure N+1 when the source ran a tied chain across the bar.
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

      y += STAVE_LINE_HEIGHT;
    }
  }, [quantized, sig, clef, keySigStr, timeSigStr, timeSignature, notes.length, targetRowWidth, colors.textPrimary]);

  return (
    <View
      ref={containerRef}
      style={{
        backgroundColor: colors.bgSurface,
        borderRadius: Radii.md,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        padding: Spacing.sm,
        overflow: "hidden",
      }}
    />
  );
}

export { CHUNK_PALETTE } from "./SongScoreView";
