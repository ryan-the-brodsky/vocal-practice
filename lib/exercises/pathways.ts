// Growth paths — curated, ordered collections of exercises by goal. NOT gated:
// the order is a suggestion, every exercise is always available, and there is no
// "graduate when X" mastery lock (we lack the aggregate data to stratify that
// honestly yet). Progress = streaks + completions + per-exercise accuracy, shown
// against the path. Grounded in EXERCISE_TAXONOMY_RESEARCH.md (foundations ->
// mix -> range -> agility).
import type { Capability } from "./capabilities";

export interface Pathway {
  id: string;
  name: string;
  /** One-line "what this path develops". */
  description: string;
  /** Primary capability the path develops (for grouping/iconography). */
  focus: Capability;
  /** Suggested practice order — NOT a gated sequence. */
  exerciseIds: string[];
}

export const PATHWAYS: readonly Pathway[] = [
  {
    id: "daily-foundations",
    name: "Daily Foundations",
    description: "Wake the voice up, set a clean onset, and even out your vowels — a balanced everyday warm-up.",
    focus: "warmup-sovt",
    exerciseIds: [
      "rossini-lip-trill",
      "nay-1-3-5-3-1",
      "five-note-scale-mee-may-mah",
    ],
  },
  {
    id: "build-your-mix",
    name: "Build Your Mix",
    description: "Blend chest and head into one connected voice through the bridge.",
    focus: "mix",
    exerciseIds: ["goog-octave-arpeggio", "bub-mix-voice"],
  },
  {
    id: "open-your-range",
    name: "Open Your Range",
    description: "Connect registers and extend smoothly through the passaggio into head voice.",
    focus: "range-passaggio",
    exerciseIds: ["ng-siren", "octave-leap-wow", "head-voice-vwohm"],
  },
  {
    id: "agility-and-release",
    name: "Agility & Release",
    description: "Build fast, accurate control and a relaxed descent for runs and riffs.",
    focus: "agility",
    exerciseIds: ["staccato-arpeggio", "descending-five-to-one-nay"],
  },
];

export function getPathway(id: string): Pathway | undefined {
  return PATHWAYS.find((p) => p.id === id);
}

export interface PathwayProgress {
  total: number;
  practiced: number; // exercises with at least one ever-logged session
  doneToday: number;
}

// Progress against a path, computed from predicates the caller supplies (keeps
// this module free of any storage/stats dependency).
export function pathwayProgress(
  pathway: Pathway,
  everPracticed: (exerciseId: string) => boolean,
  doneToday: (exerciseId: string) => boolean,
): PathwayProgress {
  return {
    total: pathway.exerciseIds.length,
    practiced: pathway.exerciseIds.filter(everPracticed).length,
    doneToday: pathway.exerciseIds.filter(doneToday).length,
  };
}
