// Pure logic for the Vocal Range Test tool. Kept free of React / audio so it's
// unit-testable (cf. clampTonicToVoiceRange in lib/music/voiceRanges.ts).
// Captures a sustained pitch from the postprocessed sample stream and classifies
// a measured low→high range into a voice type.

import { VOICE_RANGES } from "@/lib/music/voiceRanges";
import { midiToNote } from "@/lib/exercises/music";
import type { VoicePart } from "@/lib/exercises/types";

export interface RangeSample {
  midi: number | null;
  cents: number | null;
  clarity: number;
  rmsDb: number;
  timestamp: number; // ms
}

export interface SustainOpts {
  minClarity: number;
  minRmsDb: number;
  stabilityCents: number; // max spread within the hold window
  sustainMs: number; // how long the hold must persist
  minMidi: number; // discard sub-harmonic / noise outliers below this
  maxMidi: number; // discard second-harmonic / noise outliers above this
}

// Range-test wants confidence over coverage; thresholds are stricter than live
// scoring. minMidi/maxMidi (~C2..C6) reject pitchy's octave flips at the extremes.
export const DEFAULT_SUSTAIN_OPTS: SustainOpts = {
  minClarity: 0.9,
  minRmsDb: -45,
  stabilityCents: 75,
  sustainMs: 300,
  minMidi: 36, // C2
  maxMidi: 84, // C6
};

/** Precise MIDI including the within-semitone cents term. */
export function preciseMidi(s: RangeSample): number | null {
  if (s.midi == null) return null;
  return s.midi + (s.cents ?? 0) / 100;
}

/** A sample is usable only if clear, loud enough, and inside the human window. */
export function qualifies(s: RangeSample, opts: SustainOpts): boolean {
  const m = preciseMidi(s);
  if (m == null) return false;
  if (s.clarity < opts.minClarity) return false;
  if (s.rmsDb < opts.minRmsDb) return false;
  const rounded = Math.round(m);
  return rounded >= opts.minMidi && rounded <= opts.maxMidi;
}

/**
 * Given a window of recent qualifying {m, t}, return the confirmed rounded MIDI
 * if the window spans >= sustainMs and all entries sit within stabilityCents of
 * each other; otherwise null.
 */
export function confirmFromWindow(
  win: { m: number; t: number }[],
  opts: SustainOpts,
): number | null {
  if (win.length < 2) return null;
  const span = win[win.length - 1].t - win[0].t;
  if (span < opts.sustainMs) return null;
  const ms = win.map((w) => w.m);
  const lo = Math.min(...ms);
  const hi = Math.max(...ms);
  if ((hi - lo) * 100 > opts.stabilityCents) return null;
  const sorted = [...ms].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  return Math.round(median);
}

/**
 * Rolling detector of a sustained pitch. Feed it samples; `push` returns the
 * confirmed rounded MIDI for the current stable hold (or null while unstable).
 */
export class SustainedPitchTracker {
  private win: { m: number; t: number }[] = [];
  constructor(private opts: SustainOpts = DEFAULT_SUSTAIN_OPTS) {}

  reset(): void {
    this.win = [];
  }

  push(s: RangeSample): number | null {
    if (!qualifies(s, this.opts)) {
      // A dropped frame doesn't immediately clear the hold (brief glitches are
      // common), but a long gap does — handled by the time-window prune below.
      return confirmFromWindow(this.win, this.opts);
    }
    const m = preciseMidi(s) as number;
    this.win.push({ m, t: s.timestamp });
    // Keep only the trailing sustainMs (plus a small margin) of samples.
    const cutoff = s.timestamp - this.opts.sustainMs * 1.5;
    this.win = this.win.filter((w) => w.t >= cutoff);
    return confirmFromWindow(this.win, this.opts);
  }
}

export interface SpanDescription {
  lowMidi: number;
  highMidi: number;
  lowNote: string;
  highNote: string;
  semitones: number;
  octaves: number; // rounded to 1 decimal
}

export function describeSpan(lowMidi: number, highMidi: number): SpanDescription {
  const lo = Math.min(lowMidi, highMidi);
  const hi = Math.max(lowMidi, highMidi);
  const semitones = hi - lo;
  return {
    lowMidi: lo,
    highMidi: hi,
    lowNote: midiToNote(lo),
    highNote: midiToNote(hi),
    semitones,
    octaves: Math.round((semitones / 12) * 10) / 10,
  };
}

export type AppVoicePart = "soprano" | "alto" | "tenor" | "baritone";

const APP_VOICE: Record<VoicePart, AppVoicePart> = {
  soprano: "soprano",
  mezzo: "alto",
  alto: "alto",
  tenor: "tenor",
  baritone: "baritone",
  bass: "baritone",
};

const VOICE_LABEL: Record<VoicePart, string> = {
  soprano: "Soprano",
  mezzo: "Mezzo-soprano",
  alto: "Alto / Contralto",
  tenor: "Tenor",
  baritone: "Baritone",
  bass: "Bass",
};

export interface VoiceClassification {
  voicePart: VoicePart; // best pedagogical fit (6-way)
  label: string;
  appVoicePart: AppVoicePart; // mapped to the app's 4-way picker
  alsoConsider: VoicePart | null; // close runner-up, if any
}

/**
 * Classify a measured low→high range by best fit to the pedagogical comfortable
 * ranges. Deliberately simple + transparent: voice type really depends on
 * tessitura and timbre too, so the UI presents this as "closest to", not a verdict.
 */
export function classifyVoice(lowMidi: number, highMidi: number): VoiceClassification {
  const lo = Math.min(lowMidi, highMidi);
  const hi = Math.max(lowMidi, highMidi);
  const scored = (Object.keys(VOICE_RANGES) as VoicePart[])
    .map((vp) => {
      const r = VOICE_RANGES[vp];
      return { vp, dist: Math.abs(lo - r.lowest) + Math.abs(hi - r.highest) };
    })
    .sort((a, b) => a.dist - b.dist);

  const best = scored[0];
  const runnerUp = scored[1];
  return {
    voicePart: best.vp,
    label: VOICE_LABEL[best.vp],
    appVoicePart: APP_VOICE[best.vp],
    alsoConsider: runnerUp && runnerUp.dist - best.dist <= 3 ? runnerUp.vp : null,
  };
}
