import type { Diagnosis } from "./types";

// Higher = more important. See plan §7.
export function priorityScore(d: Diagnosis): number {
  const consistencyFactor = 1 / (1 + (d.stddev ?? 30) / 30);
  return Math.abs(d.severity) * Math.log(d.observations + 1) * consistencyFactor;
}
