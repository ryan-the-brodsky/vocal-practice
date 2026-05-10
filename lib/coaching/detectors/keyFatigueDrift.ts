import {
  KEY_FATIGUE_MIN_KEYS,
  KEY_FATIGUE_MIN_R2,
  KEY_FATIGUE_MIN_SLOPE,
} from "../engine/config";
import type { Diagnosis, NoteObservation } from "../engine/types";
import type { Detector } from "./types";

export const keyFatigueDrift: Detector = (input) => {
  if (input.keyCount < KEY_FATIGUE_MIN_KEYS) return [];

  const byKey = new Map<number, NoteObservation[]>();
  for (const n of input.notes) {
    const arr = byKey.get(n.keyIndex) ?? [];
    arr.push(n);
    byKey.set(n.keyIndex, arr);
  }
  if (byKey.size < KEY_FATIGUE_MIN_KEYS) return [];

  const xs: number[] = [];
  const ys: number[] = [];
  const sortedKeys = [...byKey.keys()].sort((a, b) => a - b);
  for (const k of sortedKeys) {
    const arr = byKey.get(k)!;
    const meanAbs = arr.reduce((s, n) => s + Math.abs(n.signedCents), 0) / arr.length;
    xs.push(k);
    ys.push(meanAbs);
  }
  const { slope, r2 } = linearRegression(xs, ys);
  if (slope <= KEY_FATIGUE_MIN_SLOPE) return [];
  if (r2 < KEY_FATIGUE_MIN_R2) return [];

  // Last two keys' mean abs cents for the evidence string.
  const lastTwo = ys.slice(-2);
  const lastTwoMean = lastTwo.reduce((s, v) => s + v, 0) / lastTwo.length;

  // stddev across per-key meanAbs (proxy for consistency of the trend).
  const overallMean = ys.reduce((s, v) => s + v, 0) / ys.length;
  const variance = ys.reduce((s, v) => s + (v - overallMean) * (v - overallMean), 0) / ys.length;
  const stddev = Math.sqrt(variance);

  const d: Diagnosis = {
    detectorId: "key-fatigue-drift",
    severity: slope,
    observations: input.notes.length,
    stddev,
    signedMeanCents: undefined,
    evidenceText: `Your accuracy degrades as you go up — last 2 keys averaged ${Math.round(lastTwoMean)}¢ off`,
  };
  return [d];
};

function linearRegression(xs: number[], ys: number[]): { slope: number; r2: number } {
  const n = xs.length;
  if (n < 2) return { slope: 0, r2: 0 };
  const meanX = xs.reduce((s, v) => s + v, 0) / n;
  const meanY = ys.reduce((s, v) => s + v, 0) / n;
  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  const slope = denX > 0 ? num / denX : 0;
  const r = denX > 0 && denY > 0 ? num / Math.sqrt(denX * denY) : 0;
  return { slope, r2: r * r };
}
