// Per-scale-degree aggregation + most-glaring rule (mirrors lib/coaching/diagnose.ts
// in spirit but operates on the flat ExtractedNote[] shape rather than per-key results).

import { midiToNote } from "../exercises/music";
import { ANALYZE_CONFIG } from "./config";
import type {
  AnalysisMode,
  ExtractedNote,
  MelodyAnalysis,
  MelodyGlaring,
  ScaleDegreeStats,
} from "./types";

const ORDINAL = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"];

const MAJOR_LABELS = ["1", "♭2", "2", "♭3", "3", "4", "♯4", "5", "♭6", "6", "♭7", "7"];
// Natural minor — degrees 3, 6, 7 are flat by default; chromatic alterations get accidentals
const MINOR_LABELS = ["1", "♭2", "2", "3", "♯3", "4", "♯4", "5", "6", "♯6", "7", "♯7"];

function pcToDiatonicLabel(pc: number, mode: AnalysisMode): string {
  const idx = ((pc % 12) + 12) % 12;
  if (mode === "minor") return MINOR_LABELS[idx]!;
  // major + chromatic both render with major-relative accidentals
  return MAJOR_LABELS[idx]!;
}

function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  let s = 0;
  for (const x of xs) s += x;
  return s / xs.length;
}

function variance(xs: number[]): number {
  if (xs.length === 0) return 0;
  const m = mean(xs);
  let s = 0;
  for (const x of xs) s += (x - m) * (x - m);
  return s / xs.length;
}

export interface DiagnoseParams {
  tonic: string;
  mode: AnalysisMode;
  tempoBpm: number;
  warnings?: string[];
}

export function diagnoseMelody(
  notes: ExtractedNote[],
  params: DiagnoseParams,
): MelodyAnalysis {
  const perScaleDegree = aggregateByPitchClass(notes, params.mode);
  const glaring = pickGlaring(perScaleDegree, notes, params.mode);

  return {
    notes,
    perScaleDegree,
    glaring,
    tonic: params.tonic,
    mode: params.mode,
    tempoBpm: params.tempoBpm,
    durationSec: notes.length > 0 ? notes[notes.length - 1]!.endMs / 1000 : 0,
    warnings: params.warnings ?? [],
  };
}

function aggregateByPitchClass(
  notes: ExtractedNote[],
  mode: AnalysisMode,
): ScaleDegreeStats[] {
  const byPc = new Map<number, ExtractedNote[]>();
  for (const n of notes) {
    const pc = ((n.scaleDegree % 12) + 12) % 12;
    if (!byPc.has(pc)) byPc.set(pc, []);
    byPc.get(pc)!.push(n);
  }
  return Array.from(byPc.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([pc, ns]) => {
      const cents = ns.map((n) => n.centsOff);
      const inTune = ns.filter(
        (n) => Math.abs(n.centsOff) <= ANALYZE_CONFIG.hitRateWindowCents,
      ).length;
      return {
        scaleDegree: pc,
        diatonicLabel: pcToDiatonicLabel(pc, mode),
        occurrences: ns.length,
        meanCentsOff: mean(cents),
        hitRatePct: ns.length > 0 ? (100 * inTune) / ns.length : 0,
        variance: variance(cents),
      };
    });
}

function pickGlaring(
  perScaleDegree: ScaleDegreeStats[],
  notes: ExtractedNote[],
  mode: AnalysisMode,
): MelodyGlaring | null {
  // Consistent error: scale degree with mean |centsOff| above threshold and low hit rate.
  let bestConsistent: ScaleDegreeStats | null = null;
  for (const s of perScaleDegree) {
    if (s.occurrences < ANALYZE_CONFIG.consistentMinOccurrences) continue;
    if (Math.abs(s.meanCentsOff) <= ANALYZE_CONFIG.consistentMeanAbsCentsThreshold) continue;
    if (s.hitRatePct >= ANALYZE_CONFIG.consistentHitRatePctThreshold) continue;
    if (!bestConsistent || Math.abs(s.meanCentsOff) > Math.abs(bestConsistent.meanCentsOff)) {
      bestConsistent = s;
    }
  }

  if (bestConsistent) {
    const direction = bestConsistent.meanCentsOff > 0 ? "sharp" : "flat";
    const magnitude = Math.round(Math.abs(bestConsistent.meanCentsOff));
    const label = bestConsistent.diatonicLabel;
    const summary = `You're consistently ${direction} on the ${label} (${signed(bestConsistent.meanCentsOff)}¢ across ${bestConsistent.occurrences} instance${bestConsistent.occurrences === 1 ? "" : "s"})`;
    void magnitude;
    return {
      kind: "consistent",
      scaleDegree: bestConsistent.scaleDegree,
      summary,
    };
  }

  // Outlier fallback: pick the single note with the largest |centsOff| over threshold.
  let worstIdx = -1;
  let worstAbs = -Infinity;
  for (let i = 0; i < notes.length; i++) {
    const abs = Math.abs(notes[i]!.centsOff);
    if (abs > worstAbs) {
      worstAbs = abs;
      worstIdx = i;
    }
  }
  if (worstIdx >= 0 && worstAbs > ANALYZE_CONFIG.outlierMinAbsCents) {
    const n = notes[worstIdx]!;
    const direction = n.centsOff > 0 ? "sharp" : "flat";
    const magnitude = Math.round(Math.abs(n.centsOff));
    const noteName = midiToNote(n.snappedMidi);
    const ord = ORDINAL[worstIdx] ?? `${worstIdx + 1}th`;
    const summary = `Your ${ord} note (${noteName}) was ${direction} by ${magnitude}¢. Let's drill it.`;
    void mode;
    return { kind: "outlier", noteIndex: worstIdx, summary };
  }

  return null;
}

function signed(cents: number): string {
  const r = Math.round(cents);
  return r >= 0 ? `+${r}` : `${r}`;
}
