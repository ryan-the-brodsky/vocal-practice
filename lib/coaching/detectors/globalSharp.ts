import {
  COVERAGE_MIN,
  COVERAGE_MIN_ABS_CENTS,
  MIN_OBSERVATIONS_GLOBAL,
  THRESHOLD_GLOBAL_CENTS,
} from "../engine/config";
import type { Diagnosis } from "../engine/types";
import type { Detector } from "./types";
import { fmtCents, weightedStats } from "./util";

export const globalSharp: Detector = (input) => {
  const notes = input.notes;
  if (notes.length < MIN_OBSERVATIONS_GLOBAL) return [];
  const stats = weightedStats(notes);
  if (stats.mean <= THRESHOLD_GLOBAL_CENTS) return [];

  const supporting = notes.filter((n) => n.signedCents > 0 && Math.abs(n.signedCents) >= COVERAGE_MIN_ABS_CENTS);
  const coverage = supporting.length / notes.length;
  if (coverage < COVERAGE_MIN) return [];

  const d: Diagnosis = {
    detectorId: "global-sharp",
    severity: stats.mean,
    observations: notes.length,
    stddev: stats.stddev,
    signedMeanCents: stats.mean,
    evidenceText: `${fmtCents(stats.mean)} sharp on average across ${notes.length} notes`,
  };
  return [d];
};
