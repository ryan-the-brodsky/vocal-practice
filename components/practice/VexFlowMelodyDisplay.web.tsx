// VexFlow renderer for the Practice / Coaching / Guided karaoke surface when
// the active exercise is a song chunk. Single-segment, no editor overlays,
// with an active-note highlight driven by `activeNoteIdx`. Falls back to the
// home-grown MelodyDisplay on native (see sibling .tsx).

import { useTheme } from "@/hooks/use-theme";
import {
  keySignatureFor,
  spellMidiInKey,
  type KeySignature,
} from "@/lib/music/keySignature";
import { quantizeMelody, type DurationCode, type QOutItem } from "@/lib/songs/quantize";
import type { TimeSignature } from "@/lib/songs/types";
import { useEffect, useMemo, useRef } from "react";
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

export interface VexFlowMelodyDisplayProps {
  notes: { midi: number; durationBeats: number; restAfterBeats: number; syllable?: string }[];
  tonicMidi: number;
  timeSignature: TimeSignature;
  activeNoteIdx: number;
  targetRowWidth?: number;
}

// ── shared mini-helpers (mirror VexFlowScore.web) ─────────────────────────

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

function chooseClef(notes: { midi: number }[]): "treble" | "bass" {
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

interface BuiltMeasure {
  notes: StaveNote[];
  midis: (number | null)[];
  bases: ("w" | "h" | "q" | "8" | "16")[];
  isAttack: boolean[];
  originNoteIdxs: (number | null)[];
  ties: Array<{ from: number; to: number }>;
}

function buildMeasure(
  items: QOutItem[],
  clef: "treble" | "bass",
  sig: KeySignature,
  activeOriginIdx: number,
  activeColor: string,
): BuiltMeasure {
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
      if (it.originNoteIdx === activeOriginIdx && !it.tiedFromPrev) {
        sn.setStyle({ fillStyle: activeColor, strokeStyle: activeColor });
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

// ── Component ─────────────────────────────────────────────────────────────

export default function VexFlowMelodyDisplay({
  notes,
  tonicMidi,
  timeSignature,
  activeNoteIdx,
  targetRowWidth = 800,
}: VexFlowMelodyDisplayProps) {
  const { colors } = useTheme();
  const containerRef = useRef<View>(null);

  const quantized = useMemo(() => quantizeMelody(
    notes.map((n) => ({
      midi: n.midi,
      durationBeats: n.durationBeats,
      restAfterBeats: n.restAfterBeats,
      ...(n.syllable ? { syllable: n.syllable } : {}),
    })),
    timeSignature,
  ), [notes, timeSignature]);

  const sig = useMemo(() => keySignatureFor(tonicMidi), [tonicMidi]);
  const clef = useMemo(() => chooseClef(notes), [notes]);
  const keySigStr = useMemo(() => vexKeySignature(sig), [sig]);
  const timeSigStr = `${timeSignature.num}/${timeSignature.den}`;

  useEffect(() => {
    const el = containerRef.current as unknown as HTMLDivElement | null;
    if (!el) return;
    el.innerHTML = "";
    if (notes.length === 0) return;

    const ROW_PAD_X = 12;
    const STAVE_LINE_HEIGHT = 100;
    const MEASURE_BASE = 60;
    const PER_NOTE = 36;
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

    const totalHeight = rows.length * STAVE_LINE_HEIGHT + 30;
    const renderer = new Renderer(el, Renderer.Backends.SVG);
    renderer.resize(targetRowWidth, totalHeight);
    const ctx = renderer.getContext();
    ctx.setFillStyle(colors.textPrimary);
    ctx.setStrokeStyle(colors.textPrimary);

    let y = 10;
    for (let r = 0; r < rows.length; r++) {
      const measureIndices = rows[r]!;
      let x = ROW_PAD_X;
      const drawnInRow: { stave: Stave; built: BuiltMeasure; isFirstInRow: boolean; measureIdx: number }[] = [];

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

        const built = buildMeasure(quantized.measures[mi]!.items, clef, sig, activeNoteIdx, colors.accent);

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

        drawnInRow.push({ stave, built, isFirstInRow, measureIdx: mi });
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
        const lastNoteInLeft = leftBuilt.notes[leftBuilt.notes.length - 1];
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
  }, [quantized, sig, clef, keySigStr, timeSigStr, timeSignature, notes.length, targetRowWidth, colors.textPrimary, colors.accent, activeNoteIdx]);

  return <View ref={containerRef} style={{ overflow: "hidden" }} />;
}
