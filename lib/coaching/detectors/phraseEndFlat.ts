import { MIN_OBSERVATIONS_TIER_GROUP, THRESHOLD_GLOBAL_CENTS } from "../engine/config";
import type { Diagnosis, NoteObservation } from "../engine/types";
import type { Detector } from "./types";
import { fmtCents, weightedStats } from "./util";

// "Phrase end" = highest notePosition observed within each key.
export const phraseEndFlat: Detector = (input) => {
  const byKey = new Map<number, NoteObservation[]>();
  for (const n of input.notes) {
    const arr = byKey.get(n.keyIndex) ?? [];
    arr.push(n);
    byKey.set(n.keyIndex, arr);
  }
  const enders: NoteObservation[] = [];
  for (const arr of byKey.values()) {
    let maxPos = -Infinity;
    for (const n of arr) if (n.notePosition > maxPos) maxPos = n.notePosition;
    for (const n of arr) if (n.notePosition === maxPos) enders.push(n);
  }
  if (enders.length < MIN_OBSERVATIONS_TIER_GROUP) return [];
  const stats = weightedStats(enders);
  if (stats.mean >= -THRESHOLD_GLOBAL_CENTS) return [];

  const d: Diagnosis = {
    detectorId: "phrase-end-flat",
    severity: stats.mean,
    observations: enders.length,
    stddev: stats.stddev,
    signedMeanCents: stats.mean,
    evidenceText: `${fmtCents(stats.mean)} flat on the last note of every key`,
    focusNoteHints: enders.map((n) => ({ keyIndex: n.keyIndex, notePosition: n.notePosition })),
  };
  return [d];
};
