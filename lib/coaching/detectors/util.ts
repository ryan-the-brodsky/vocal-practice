import type { NoteObservation } from "../engine/types";

export interface WeightedStats {
  mean: number;     // frames-weighted mean of signedCents
  meanAbs: number;  // frames-weighted mean of |signedCents|
  stddev: number;   // unweighted std dev of signedCents (consistency proxy)
  count: number;
}

export function weightedStats(notes: NoteObservation[]): WeightedStats {
  if (notes.length === 0) return { mean: 0, meanAbs: 0, stddev: 0, count: 0 };
  let num = 0;
  let absNum = 0;
  let denom = 0;
  for (const n of notes) {
    const w = Math.max(1, n.framesAboveClarity);
    num += n.signedCents * w;
    absNum += Math.abs(n.signedCents) * w;
    denom += w;
  }
  const mean = denom > 0 ? num / denom : 0;
  const meanAbs = denom > 0 ? absNum / denom : 0;
  // stddev unweighted: equal-vote across notes for consistency factor in ranker.
  const m = notes.reduce((s, n) => s + n.signedCents, 0) / notes.length;
  const variance = notes.reduce((s, n) => s + (n.signedCents - m) * (n.signedCents - m), 0) / notes.length;
  return { mean, meanAbs, stddev: Math.sqrt(variance), count: notes.length };
}

// Returns the MIDI threshold at the top tertile boundary (notes with midi >= this are top tertile).
export function topTertileMidi(notes: NoteObservation[]): number {
  if (notes.length === 0) return Number.POSITIVE_INFINITY;
  const sorted = [...notes].map((n) => n.targetMidi).sort((a, b) => a - b);
  return sorted[Math.floor((sorted.length * 2) / 3)];
}

export function bottomTertileMidi(notes: NoteObservation[]): number {
  if (notes.length === 0) return Number.NEGATIVE_INFINITY;
  const sorted = [...notes].map((n) => n.targetMidi).sort((a, b) => a - b);
  // bottom-tertile cutoff: top of the lowest third
  return sorted[Math.max(0, Math.ceil(sorted.length / 3) - 1)];
}

export function topTertile(notes: NoteObservation[]): NoteObservation[] {
  if (notes.length === 0) return [];
  const cutoff = topTertileMidi(notes);
  return notes.filter((n) => n.targetMidi >= cutoff);
}

export function bottomTertile(notes: NoteObservation[]): NoteObservation[] {
  if (notes.length === 0) return [];
  const cutoff = bottomTertileMidi(notes);
  return notes.filter((n) => n.targetMidi <= cutoff);
}

export function fmtCents(c: number): string {
  const sign = c >= 0 ? "+" : "";
  return `${sign}${Math.round(c)}¢`;
}
