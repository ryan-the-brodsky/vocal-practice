import type { DetectorMapping } from "../engine/types";

// Direct transcription of plan §9 — research §4 baked in.
export const DETECTOR_MAPPINGS: DetectorMapping[] = [
  {
    detectorId: "global-sharp",
    symptomCardId: "s/sharp",
    candidateCauseCardIds: ["c/over-blowing", "c/high-larynx", "c/jaw-tension", "c/excessive-closure"],
  },
  {
    detectorId: "global-flat",
    symptomCardId: "s/flat",
    candidateCauseCardIds: ["c/poor-breath-support", "c/insufficient-closure", "c/soft-palate"],
  },
  {
    detectorId: "high-note-flat",
    symptomCardId: "s/flat",
    candidateCauseCardIds: ["c/pulled-chest", "c/vowel-modification", "c/soft-palate", "c/low-larynx"],
  },
  {
    detectorId: "high-note-sharp",
    symptomCardId: "s/sharp",
    candidateCauseCardIds: ["c/over-blowing", "c/high-larynx", "c/insufficient-tilt"],
  },
  {
    detectorId: "low-note-flat",
    symptomCardId: "s/flat",
    candidateCauseCardIds: ["c/insufficient-closure", "c/poor-breath-support"],
  },
  {
    detectorId: "register-mismatch",
    symptomCardId: "s/register-mismatch",
    candidateCauseCardIds: ["c/no-mix", "c/pulled-chest", "c/vowel-modification"],
  },
  {
    detectorId: "phrase-end-flat",
    symptomCardId: "s/flat",
    candidateCauseCardIds: ["c/poor-breath-support", "c/insufficient-appoggio"],
  },
  {
    detectorId: "position-consistent",
    symptomCardId: null,
    candidateCauseCardIds: ["c/poor-breath-support", "c/vowel-modification"],
  },
  {
    detectorId: "key-fatigue-drift",
    symptomCardId: "s/flat",
    candidateCauseCardIds: ["c/poor-breath-support", "c/insufficient-appoggio"],
  },
];

export const DETECTOR_MAPPINGS_BY_ID: Record<string, DetectorMapping> = DETECTOR_MAPPINGS.reduce(
  (acc, m) => {
    acc[m.detectorId] = m;
    return acc;
  },
  {} as Record<string, DetectorMapping>,
);
