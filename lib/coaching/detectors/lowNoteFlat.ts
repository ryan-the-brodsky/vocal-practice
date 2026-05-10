import { MIN_OBSERVATIONS_TIER_GROUP, THRESHOLD_GROUP_CENTS } from "../engine/config";
import type { Diagnosis } from "../engine/types";
import type { Detector } from "./types";
import { bottomTertile, fmtCents, weightedStats } from "./util";

export const lowNoteFlat: Detector = (input) => {
  const bot = bottomTertile(input.notes);
  if (bot.length < MIN_OBSERVATIONS_TIER_GROUP) return [];
  const stats = weightedStats(bot);
  if (stats.mean >= -THRESHOLD_GROUP_CENTS) return [];

  const flatCount = bot.filter((n) => n.signedCents < 0).length;
  const d: Diagnosis = {
    detectorId: "low-note-flat",
    severity: stats.mean,
    observations: bot.length,
    stddev: stats.stddev,
    signedMeanCents: stats.mean,
    evidenceText: `${fmtCents(stats.mean)} flat across ${flatCount} low notes`,
    focusNoteHints: bot
      .filter((n) => n.signedCents < 0)
      .map((n) => ({ keyIndex: n.keyIndex, notePosition: n.notePosition })),
  };
  return [d];
};
