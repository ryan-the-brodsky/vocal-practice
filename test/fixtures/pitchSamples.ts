// Synthetic PitchSample[] generator for tests. Models realistic pitchy output:
// 50 frames/sec, clarity ~0.92 ± noise, rmsDb ~-20 ± noise, monotonic timestamps.
// All audio I/O is bypassed — feed these directly into Tracker/Scorer/alignAndScore.

import type { PitchSample } from "@/lib/pitch/detector";

export interface SynthOptions {
  /** Frames per second. Default 50 (matches pitchy on a 4096-sample FFT @ ~16ms RAF). */
  frameRate?: number;
  /** ms of silence before the melody begins. Default 0. */
  leadInMs?: number;
  /** ms per note. Default 600. */
  perNoteMs?: number;
  /** Cents offset applied to every note (e.g. -50 = sing flat). Default 0. */
  centsOffset?: number;
  /** Per-note cents offsets (overrides centsOffset for matching index). */
  perNoteCents?: (number | undefined)[];
  /** Index of a note where to inject an octave-down error (singer hits target - 12). */
  octaveDownAt?: number;
  /** Vibrato amplitude in cents (sinusoidal at 5 Hz). Default 0. */
  vibratoCents?: number;
  /** Linear cents drift across the whole melody (start..end). Default 0. */
  driftCents?: number;
  /** Override the default ~0.92 clarity. */
  clarity?: number;
  /** Override the default ~-20 dB RMS. */
  rmsDb?: number;
  /** Number of inter-note silence frames inserted between notes. Default 0. */
  gapFramesBetweenNotes?: number;
}

const DEFAULT_FRAME_RATE = 50;
const DEFAULT_PER_NOTE_MS = 600;
const DEFAULT_CLARITY = 0.92;
const DEFAULT_RMS_DB = -20;

function midiToHz(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function detunedHz(targetMidi: number, cents: number): number {
  return midiToHz(targetMidi) * Math.pow(2, cents / 1200);
}

/** Build a stream of silent samples with monotonic timestamps. */
function silenceFrames(startMs: number, durationMs: number, frameRate: number): PitchSample[] {
  const out: PitchSample[] = [];
  const stepMs = 1000 / frameRate;
  for (let t = 0; t < durationMs; t += stepMs) {
    out.push({
      hz: null,
      midi: null,
      cents: null,
      clarity: 0,
      rmsDb: -60,
      timestamp: startMs + t,
    });
  }
  return out;
}

/**
 * samplesFromMidiSequence — synthesize a PitchSample[] for a sequence of target MIDIs.
 * Each note is held for perNoteMs at frameRate frames/sec, with optional detuning.
 */
export function samplesFromMidiSequence(
  targets: number[],
  opts: SynthOptions = {},
): PitchSample[] {
  const frameRate = opts.frameRate ?? DEFAULT_FRAME_RATE;
  const stepMs = 1000 / frameRate;
  const perNoteMs = opts.perNoteMs ?? DEFAULT_PER_NOTE_MS;
  const leadInMs = opts.leadInMs ?? 0;
  const baseCents = opts.centsOffset ?? 0;
  const clarity = opts.clarity ?? DEFAULT_CLARITY;
  const rmsDb = opts.rmsDb ?? DEFAULT_RMS_DB;
  const vibrato = opts.vibratoCents ?? 0;
  const drift = opts.driftCents ?? 0;
  const gapFrames = opts.gapFramesBetweenNotes ?? 0;

  const out: PitchSample[] = [];

  if (leadInMs > 0) {
    out.push(...silenceFrames(0, leadInMs, frameRate));
  }

  let cursorMs = leadInMs;
  const totalMelodyMs = targets.length * perNoteMs;

  targets.forEach((rawTarget, noteIdx) => {
    const target = opts.octaveDownAt === noteIdx ? rawTarget - 12 : rawTarget;
    const noteCents = opts.perNoteCents?.[noteIdx] ?? baseCents;

    const framesPerNote = Math.max(1, Math.round(perNoteMs / stepMs));
    for (let f = 0; f < framesPerNote; f++) {
      const t = cursorMs + f * stepMs;
      const progress = (t - leadInMs) / Math.max(1, totalMelodyMs);
      const driftAt = drift * progress;
      const vibratoAt = vibrato * Math.sin(2 * Math.PI * 5 * (t / 1000));
      const cents = noteCents + driftAt + vibratoAt;
      const hz = detunedHz(target, cents);
      // midi rounded to nearest semitone, cents = signed deviation
      const midi = Math.round(target + cents / 100);
      const remainderCents = (target * 100 + cents) - midi * 100;
      out.push({
        hz,
        midi,
        cents: remainderCents,
        clarity,
        rmsDb,
        timestamp: t,
      });
    }
    cursorMs += perNoteMs;

    if (gapFrames > 0 && noteIdx < targets.length - 1) {
      for (let g = 0; g < gapFrames; g++) {
        out.push({
          hz: null,
          midi: null,
          cents: null,
          clarity: 0,
          rmsDb: -60,
          timestamp: cursorMs + g * stepMs,
        });
      }
      cursorMs += gapFrames * stepMs;
    }
  });

  return out;
}

// ---------------------------------------------------------------------------
// Convenience presets
// ---------------------------------------------------------------------------

export const inTune = (targets: number[], opts: SynthOptions = {}): PitchSample[] =>
  samplesFromMidiSequence(targets, opts);

export const flat = (targets: number[], cents = 50, opts: SynthOptions = {}): PitchSample[] =>
  samplesFromMidiSequence(targets, { ...opts, centsOffset: -Math.abs(cents) });

export const sharp = (targets: number[], cents = 50, opts: SynthOptions = {}): PitchSample[] =>
  samplesFromMidiSequence(targets, { ...opts, centsOffset: Math.abs(cents) });

export const octaveOff = (targets: number[], idx: number, opts: SynthOptions = {}): PitchSample[] =>
  samplesFromMidiSequence(targets, { ...opts, octaveDownAt: idx });

export const silence = (durationMs: number, frameRate = DEFAULT_FRAME_RATE): PitchSample[] =>
  silenceFrames(0, durationMs, frameRate);

/** False-start: brief 100ms wobble on the first target before the real attack. */
export function falseStart(targets: number[], opts: SynthOptions = {}): PitchSample[] {
  const frameRate = opts.frameRate ?? DEFAULT_FRAME_RATE;
  const stepMs = 1000 / frameRate;
  const wobbleMs = 100;
  const leadIn = opts.leadInMs ?? 0;
  const wobbleSamples: PitchSample[] = [];
  const wobbleFrames = Math.max(2, Math.round(wobbleMs / stepMs));
  for (let f = 0; f < wobbleFrames; f++) {
    const t = leadIn + f * stepMs;
    wobbleSamples.push({
      hz: detunedHz(targets[0] - 3, 30),
      midi: targets[0] - 3,
      cents: 30,
      clarity: 0.55,
      rmsDb: -28,
      timestamp: t,
    });
  }
  // Then a brief silence, then the real melody (offset its lead-in).
  const main = samplesFromMidiSequence(targets, {
    ...opts,
    leadInMs: leadIn + wobbleMs + 80,
  });
  return [...wobbleSamples, ...main];
}
