import { MIN_OBSERVATIONS_TIER_GROUP, THRESHOLD_GROUP_CENTS } from "../engine/config";
import type { Diagnosis } from "../engine/types";
import type { Detector } from "./types";
import { fmtCents, topTertile, weightedStats } from "./util";

export const highNoteSharp: Detector = (input) => {
  const top = topTertile(input.notes);
  if (top.length < MIN_OBSERVATIONS_TIER_GROUP) return [];
  const stats = weightedStats(top);
  if (stats.mean <= THRESHOLD_GROUP_CENTS) return [];

  const sharpCount = top.filter((n) => n.signedCents > 0).length;
  const d: Diagnosis = {
    detectorId: "high-note-sharp",
    severity: stats.mean,
    observations: top.length,
    stddev: stats.stddev,
    signedMeanCents: stats.mean,
    evidenceText: `${fmtCents(stats.mean)} sharp across ${sharpCount} high notes`,
    focusNoteHints: top
      .filter((n) => n.signedCents > 0)
      .map((n) => ({ keyIndex: n.keyIndex, notePosition: n.notePosition })),
  };
  return [d];
};
