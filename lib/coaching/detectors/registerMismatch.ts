import { MIN_OBSERVATIONS_TIER_GROUP, REGISTER_MISMATCH_GAP_CENTS } from "../engine/config";
import type { Diagnosis } from "../engine/types";
import type { Detector } from "./types";
import { bottomTertile, fmtCents, topTertile, weightedStats } from "./util";

export const registerMismatch: Detector = (input) => {
  const top = topTertile(input.notes);
  const bot = bottomTertile(input.notes);
  if (top.length < MIN_OBSERVATIONS_TIER_GROUP || bot.length < MIN_OBSERVATIONS_TIER_GROUP) return [];
  const ts = weightedStats(top);
  const bs = weightedStats(bot);
  // Sign mismatch with sufficient gap.
  if (Math.sign(ts.mean) === Math.sign(bs.mean)) return [];
  const gap = Math.abs(ts.mean - bs.mean);
  if (gap < REGISTER_MISMATCH_GAP_CENTS) return [];

  const chestSide = bs.mean > 0 ? "sharp" : "flat";
  const headSide = ts.mean > 0 ? "sharp" : "flat";
  // Chest = bottom tertile, head = top tertile in this CCM-style mapping.
  const evidenceText = `${fmtCents(bs.mean)} ${chestSide} on chest, ${fmtCents(ts.mean)} ${headSide} on head`;

  const d: Diagnosis = {
    detectorId: "register-mismatch",
    severity: gap,
    observations: top.length + bot.length,
    stddev: (ts.stddev + bs.stddev) / 2,
    signedMeanCents: ts.mean,
    evidenceText,
  };
  return [d];
};
