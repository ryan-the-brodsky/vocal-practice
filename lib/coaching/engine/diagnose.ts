import { DETECTORS } from "../detectors";
import { priorityScore } from "./rank";
import type { Diagnosis, SessionInput } from "./types";

export function diagnoseSession(input: SessionInput): Diagnosis[] {
  const all: Diagnosis[] = [];
  for (const detector of DETECTORS) {
    for (const d of detector(input)) all.push(d);
  }
  all.sort((a, b) => priorityScore(b) - priorityScore(a));
  return all;
}
