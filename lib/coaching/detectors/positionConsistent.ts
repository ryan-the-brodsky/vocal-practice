import { THRESHOLD_POSITION_ABS_CENTS } from "../engine/config";
import type { Diagnosis, NoteObservation } from "../engine/types";
import type { Detector } from "./types";
import { weightedStats } from "./util";

const ORDINAL = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th"];

const MIN_KEYS = 3;

export const positionConsistent: Detector = (input) => {
  const byPos = new Map<number, NoteObservation[]>();
  for (const n of input.notes) {
    const arr = byPos.get(n.notePosition) ?? [];
    arr.push(n);
    byPos.set(n.notePosition, arr);
  }

  let best: { position: number; stats: ReturnType<typeof weightedStats>; notes: NoteObservation[] } | null = null;
  for (const [pos, arr] of byPos.entries()) {
    const distinctKeys = new Set(arr.map((n) => n.keyIndex)).size;
    if (distinctKeys < MIN_KEYS) continue;
    const stats = weightedStats(arr);
    if (stats.meanAbs <= THRESHOLD_POSITION_ABS_CENTS) continue;
    if (!best || stats.meanAbs > best.stats.meanAbs) {
      best = { position: pos, stats, notes: arr };
    }
  }
  if (!best) return [];

  const ord = ORDINAL[best.position] ?? `${best.position + 1}th`;
  const direction = best.stats.mean >= 0 ? "sharp" : "flat";
  const magnitude = Math.round(Math.abs(best.stats.mean));
  const distinctKeys = new Set(best.notes.map((n) => n.keyIndex)).size;

  const d: Diagnosis = {
    detectorId: "position-consistent",
    severity: best.stats.meanAbs,
    observations: best.notes.length,
    stddev: best.stats.stddev,
    signedMeanCents: best.stats.mean,
    evidenceText: `Your ${ord} note was ${magnitude}¢ ${direction} across ${distinctKeys} keys`,
    focusNoteHints: best.notes.map((n) => ({ keyIndex: n.keyIndex, notePosition: n.notePosition })),
  };
  return [d];
};
