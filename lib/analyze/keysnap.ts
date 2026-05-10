// Diatonic key snapping with chromatic-fallback escape and a voice-leading
// tiebreak that runs as a second pass once neighbors are known. Pure TS.

import { midiToHz } from "../exercises/music";
import type { Segment } from "../scoring/align";
import { ANALYZE_CONFIG } from "./config";
import type { AnalysisMode, ExtractedNote } from "./types";

const MAJOR_PCS: readonly number[] = [0, 2, 4, 5, 7, 9, 11];
const MINOR_PCS: readonly number[] = [0, 2, 3, 5, 7, 8, 10]; // natural minor
const CHROMATIC_PCS: readonly number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

export function allowedPitchClasses(mode: AnalysisMode): readonly number[] {
  return mode === "major" ? MAJOR_PCS : mode === "minor" ? MINOR_PCS : CHROMATIC_PCS;
}

export interface KeysnapOptions {
  outOfKeyToleranceCents?: number;
  voiceLeadingTiebreakCents?: number;
  tempoBpm: number;
}

interface SnapPick {
  midi: number;
  distCents: number;
  // Other in-key candidates within voiceLeadingTiebreakCents of the best
  altMidis: number[];
}

// Find the nearest in-key MIDI to a continuous (decimal) MIDI. Iterates a window
// around continuousMidi and picks the closest pitch whose tonic-relative pitch
// class is allowed. Records near-equivalent alternates for the voice-leading pass.
function pickNearestInKey(
  continuousMidi: number,
  tonicMidi: number,
  allowed: readonly number[],
  tiebreakCents: number,
): SnapPick {
  const center = Math.round(continuousMidi);
  let best = center;
  let bestDist = Infinity;
  const candidates: { midi: number; distCents: number }[] = [];
  for (let m = center - 12; m <= center + 12; m++) {
    const tonicRelativePc = (((m - tonicMidi) % 12) + 12) % 12;
    if (!allowed.includes(tonicRelativePc)) continue;
    const distCents = Math.abs(continuousMidi - m) * 100;
    candidates.push({ midi: m, distCents });
    if (distCents < bestDist) {
      bestDist = distCents;
      best = m;
    }
  }
  const alts = candidates
    .filter((c) => c.midi !== best && c.distCents - bestDist <= tiebreakCents)
    .map((c) => c.midi);
  return { midi: best, distCents: bestDist, altMidis: alts };
}

export function snapToKey(
  segments: Segment[],
  tonicMidi: number,
  mode: AnalysisMode,
  opts: KeysnapOptions,
): ExtractedNote[] {
  const allowed = allowedPitchClasses(mode);
  const tolerance = opts.outOfKeyToleranceCents ?? ANALYZE_CONFIG.outOfKeyToleranceCents;
  const tiebreak = opts.voiceLeadingTiebreakCents ?? ANALYZE_CONFIG.voiceLeadingTiebreakCents;
  const tempoBpm = opts.tempoBpm;

  // Pass 1: pick nearest-in-key (or chromatic fallback) for each segment.
  type Stage1 = {
    seg: Segment;
    continuousMidi: number;
    snapped: number;
    outOfKey: boolean;
    ambiguous: boolean;
    altMidis: number[];
  };
  const stage1: Stage1[] = segments.map((seg) => {
    const continuousMidi = seg.medianPitchMidi;
    const pick = pickNearestInKey(continuousMidi, tonicMidi, allowed, tiebreak);
    if (pick.distCents > tolerance) {
      // Out-of-key escape: snap to nearest chromatic semitone.
      return {
        seg,
        continuousMidi,
        snapped: Math.round(continuousMidi),
        outOfKey: true,
        ambiguous: false,
        altMidis: [],
      };
    }
    return {
      seg,
      continuousMidi,
      snapped: pick.midi,
      outOfKey: false,
      ambiguous: pick.altMidis.length > 0,
      altMidis: pick.altMidis,
    };
  });

  // Pass 2: voice-leading tiebreak. For any segment where multiple in-key snaps
  // were within tiebreak range, prefer the candidate closest to the previous
  // snapped note. Only applies to in-key (non-fallback) entries.
  for (let i = 1; i < stage1.length; i++) {
    const cur = stage1[i]!;
    if (cur.outOfKey || !cur.ambiguous) continue;
    const prev = stage1[i - 1]!;
    const candidates = [cur.snapped, ...cur.altMidis];
    let best = cur.snapped;
    let bestSpread =
      Math.abs(best - prev.snapped) +
      // Tie-break-on-tie: prefer candidate closer to the continuous pitch.
      Math.abs(cur.continuousMidi - best) * 0.001;
    for (const cand of candidates) {
      const spread =
        Math.abs(cand - prev.snapped) +
        Math.abs(cur.continuousMidi - cand) * 0.001;
      if (spread < bestSpread) {
        bestSpread = spread;
        best = cand;
      }
    }
    cur.snapped = best;
  }

  // Materialize ExtractedNote[]
  return stage1.map(({ seg, continuousMidi, snapped, outOfKey }) => {
    const centsOff = (continuousMidi - snapped) * 100;
    const durationMs = seg.endMs - seg.startMs;
    const durationBeats = (durationMs / 1000) * (tempoBpm / 60);
    return {
      startMs: seg.startMs,
      endMs: seg.endMs,
      medianHz: midiToHz(continuousMidi),
      medianMidiContinuous: continuousMidi,
      snappedMidi: snapped,
      scaleDegree: snapped - tonicMidi,
      centsOff,
      durationBeats,
      framesUsed: seg.frames.length,
      outOfKey,
    };
  });
}
