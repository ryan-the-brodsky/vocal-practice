import type {
  AccompanimentSpec,
  ExerciseDescriptor,
  KeyIteration,
  NoteEvent,
  VoicePart,
  AccompanimentPreset,
} from "./types";
import { ACCOMPANIMENT_PRESETS } from "./types";
import {
  midiToNote,
  noteToMidi,
  noteValueToSeconds,
  triadFromRoot,
  voicingInWindow,
} from "./music";

export interface PlanInput {
  exercise: ExerciseDescriptor;
  voicePart: VoicePart;
  bpmOverride?: number;
  startTonicOverride?: string;
  endTonicOverride?: string;
  cueDurationBeatsOverride?: number;
  // When set, overrides the descriptor's accompaniment unless lockAccompaniment is true.
  accompanimentPreset?: AccompanimentPreset;
  // 'tonic-only': emit cue as normal, but suppress all during-pattern accompaniment.
  guidance?: "full" | "tonic-only";
  // When false, no lead-in clicks are inserted (user turned off click track).
  clickTrackEnabled?: boolean;
}

const DEFAULT_VELOCITY = {
  melody: 0.95,
  accompaniment: 0.6,
  cue: 0.75,
  tick: 0.45,
};

const LEAD_IN_BEATS = 2;

// Classical's V7→I cue already establishes the entry beat; skip clicks for it.
function shouldAddLeadIn(preset: AccompanimentPreset | undefined): boolean {
  return preset !== "classical";
}

export function planExercise(input: PlanInput): KeyIteration[] {
  const { exercise, voicePart } = input;
  const range = exercise.voicePartRanges[voicePart];
  if (!range) {
    throw new Error(
      `Exercise ${exercise.id} has no key range for voice part ${voicePart}`,
    );
  }

  const bpm = input.bpmOverride ?? exercise.tempo;
  const beatSec = 60 / bpm;
  const noteSec = noteValueToSeconds(exercise.noteValue, bpm);
  const noteSecs = resolveNoteSecs(exercise, bpm, noteSec);

  const lowest = noteToMidi(input.startTonicOverride ?? range.lowest);
  const highest = noteToMidi(input.endTonicOverride ?? range.highest);
  const step = range.step;

  const direction = exercise.direction ?? "ascending";
  const tonics: number[] = [];
  if (direction === "descending") {
    for (let m = highest; m >= lowest; m -= step) tonics.push(m);
  } else {
    for (let m = lowest; m <= highest; m += step) tonics.push(m);
    if (direction === "both") {
      // Walk back down through the same keys (excluding the top to avoid duplicate)
      for (let i = tonics.length - 2; i >= 0; i--) tonics.push(tonics[i]);
    }
  }

  return tonics.map((tonicMidi) =>
    planSingleKey(input, tonicMidi, beatSec, noteSecs),
  );
}

// Per-note durations in seconds. Honors descriptor.durations (beats) when
// present and length matches scaleDegrees; otherwise uniform fallback.
function resolveNoteSecs(
  exercise: ExerciseDescriptor,
  bpm: number,
  noteSec: number,
): number[] {
  const n = exercise.scaleDegrees.length;
  const d = exercise.durations;
  if (d && d.length === n) {
    const beatSec = 60 / bpm;
    return d.map((beats) => beats * beatSec);
  }
  return Array.from({ length: n }, () => noteSec);
}

/** Resolve which AccompanimentSpec to use, respecting preset overrides and guidance mode. */
function resolveAccompaniment(input: PlanInput): AccompanimentSpec {
  const { exercise, accompanimentPreset, guidance } = input;
  const base: AccompanimentSpec =
    accompanimentPreset && !exercise.lockAccompaniment
      ? ACCOMPANIMENT_PRESETS[accompanimentPreset]
      : exercise.accompaniment;
  // tonic-only: keep cue settings but silence the during-pattern accompaniment.
  if (guidance === "tonic-only") {
    return { ...base, pattern: "none", doubleMelody: false };
  }
  return base;
}

function planSingleKey(
  input: PlanInput,
  tonicMidi: number,
  beatSec: number,
  noteSecs: number[],
): KeyIteration {
  const { exercise } = input;
  const acc = resolveAccompaniment(input);
  const events: NoteEvent[] = [];

  // 1. Cue (played before melody). Routes through buildCue() so all five cue types
  // in the descriptor (and preset overrides) are honoured.
  const cueBeats =
    input.cueDurationBeatsOverride ??
    acc.cueDurationBeats ??
    1;
  const cueDurationSec = Math.max(1.0, cueBeats * beatSec);
  const cueEvents = buildCue(acc.cueType, tonicMidi, cueDurationSec);
  events.push(...cueEvents);

  // Lead-in: N short tonic clicks between cue and melody so the singer knows when to enter.
  const clickEnabled = input.clickTrackEnabled !== false;
  const addLeadIn = clickEnabled && shouldAddLeadIn(input.accompanimentPreset);
  const leadInDurationSec = addLeadIn ? LEAD_IN_BEATS * beatSec : 0;

  if (addLeadIn) {
    // Tonic one octave up so it sits above the cue chord and is clearly audible.
    const tickMidi = tonicMidi >= 60 ? tonicMidi : tonicMidi + 12;
    for (let i = 0; i < LEAD_IN_BEATS; i++) {
      events.push({
        type: "tick",
        noteName: midiToNote(tickMidi),
        midi: tickMidi,
        startTime: cueDurationSec + i * beatSec,
        duration: 0.08,
        velocity: DEFAULT_VELOCITY.tick,
      });
    }
  }

  // Small breath between lead-in (or cue) and first melody note.
  const melodyStart = cueDurationSec + leadInDurationSec + 0.15;

  // 2. Melody — cumulative onsets so per-note durations work.
  const noteOffsets: number[] = [];
  let cursor = 0;
  for (let i = 0; i < noteSecs.length; i++) {
    noteOffsets.push(cursor);
    cursor += noteSecs[i];
  }
  const melodyDurationSec = cursor;
  exercise.scaleDegrees.forEach((degree, i) => {
    const midi = tonicMidi + degree;
    const startTime = melodyStart + noteOffsets[i];
    events.push({
      type: "melody",
      noteName: midiToNote(midi),
      midi,
      startTime,
      duration: noteSecs[i] * 0.95,
      velocity: DEFAULT_VELOCITY.melody,
      syllable:
        exercise.syllables.length === 1
          ? exercise.syllables[0]
          : exercise.syllables[i] ?? exercise.syllables[exercise.syllables.length - 1],
      isTarget: true,
    });
  });

  // 3. Accompaniment (parallel to melody), using resolved spec
  const accompEvents = buildAccompaniment(
    acc,
    exercise,
    tonicMidi,
    melodyStart,
    melodyDurationSec,
    noteSecs,
    noteOffsets,
  );
  events.push(...accompEvents);

  return {
    tonic: midiToNote(tonicMidi),
    tonicMidi,
    events,
    totalDurationSec: melodyStart + melodyDurationSec,
    melodyStartSec: melodyStart,
    cueDurationSec,
  };
}

function buildCue(
  cueType: ExerciseDescriptor["accompaniment"]["cueType"],
  tonicMidi: number,
  cueDurationSec: number,
): NoteEvent[] {
  if (cueType === "none" || cueDurationSec === 0) return [];

  const cueOctave = tonicMidi >= 60 ? tonicMidi : tonicMidi + 12;

  if (cueType === "tonic-hold") {
    // Sustained tonic — default fallback (same as legacy buildTonicHoldCue behaviour).
    return [
      {
        type: "cue",
        noteName: midiToNote(cueOctave),
        midi: cueOctave,
        startTime: 0,
        duration: cueDurationSec * 0.95,
        velocity: DEFAULT_VELOCITY.cue,
      },
    ];
  }

  if (cueType === "ding") {
    return [
      {
        type: "cue",
        noteName: midiToNote(cueOctave),
        midi: cueOctave,
        startTime: 0,
        duration: cueDurationSec * 0.9,
        velocity: DEFAULT_VELOCITY.cue,
      },
    ];
  }

  if (cueType === "block") {
    const triad = triadFromRoot(cueOctave - 12, "major").concat(cueOctave);
    return triad.map((midi) => ({
      type: "cue" as const,
      noteName: midiToNote(midi),
      midi,
      startTime: 0,
      duration: cueDurationSec * 0.9,
      velocity: DEFAULT_VELOCITY.cue,
    }));
  }

  if (cueType === "bell") {
    // Arpeggiated 1-3-5-1 ending on starting pitch (the singer's tonic).
    const root = cueOctave - 12;
    const arpeggio = [root, root + 4, root + 7, cueOctave];
    const each = cueDurationSec / arpeggio.length;
    return arpeggio.map((midi, i) => ({
      type: "cue" as const,
      noteName: midiToNote(midi),
      midi,
      startTime: i * each,
      duration: each * 0.9,
      velocity: DEFAULT_VELOCITY.cue,
    }));
  }

  if (cueType === "v7") {
    // V7 of new key, then I — compressed into cueDurationSec, half each.
    const dominantRoot = tonicMidi - 5; // perfect 5th below new tonic
    const v7 = [dominantRoot, dominantRoot + 4, dominantRoot + 7, dominantRoot + 10];
    const i = triadFromRoot(tonicMidi, "major").concat(tonicMidi + 12);
    const half = cueDurationSec / 2;
    return [
      ...v7.map((midi) => ({
        type: "cue" as const,
        noteName: midiToNote(midi),
        midi,
        startTime: 0,
        duration: half * 0.9,
        velocity: DEFAULT_VELOCITY.cue,
      })),
      ...i.map((midi) => ({
        type: "cue" as const,
        noteName: midiToNote(midi),
        midi,
        startTime: half,
        duration: half * 0.9,
        velocity: DEFAULT_VELOCITY.cue,
      })),
    ];
  }

  return [];
}

function buildAccompaniment(
  acc: AccompanimentSpec,
  exercise: ExerciseDescriptor,
  tonicMidi: number,
  startTime: number,
  durationSec: number,
  noteSecs: number[],
  noteOffsets: number[],
): NoteEvent[] {
  const events: NoteEvent[] = [];

  // Choose chord voicing in piano-friendly window: a third to a sixth below the
  // singer's tonic (PRD's note that the chord should not land on the melody).
  const chordWindowLow = Math.max(36, tonicMidi - 14);
  const chord = voicingInWindow(tonicMidi, chordWindowLow, "major");
  const lhRoot = tonicMidi - 24 < 24 ? tonicMidi - 12 : tonicMidi - 24;

  switch (acc.pattern) {
    case "none":
      break;

    case "blockChordOnDownbeat":
    case "sustainedChord": {
      chord.forEach((midi) => {
        events.push({
          type: "accompaniment",
          noteName: midiToNote(midi),
          midi,
          startTime,
          duration: durationSec * 0.98,
          velocity: DEFAULT_VELOCITY.accompaniment,
        });
      });
      events.push({
        type: "accompaniment",
        noteName: midiToNote(lhRoot),
        midi: lhRoot,
        startTime,
        duration: durationSec * 0.98,
        velocity: DEFAULT_VELOCITY.accompaniment,
      });
      break;
    }

    case "doubledMelody": {
      exercise.scaleDegrees.forEach((degree, i) => {
        const midi = tonicMidi + degree + 12; // octave above singer
        events.push({
          type: "accompaniment",
          noteName: midiToNote(midi),
          midi,
          startTime: startTime + noteOffsets[i],
          duration: noteSecs[i] * 0.9,
          velocity: DEFAULT_VELOCITY.accompaniment,
        });
      });
      break;
    }

    case "rootOctaveDrone": {
      [lhRoot, lhRoot + 12].forEach((midi) => {
        events.push({
          type: "accompaniment",
          noteName: midiToNote(midi),
          midi,
          startTime,
          duration: durationSec * 0.98,
          velocity: DEFAULT_VELOCITY.accompaniment * 0.7,
        });
      });
      break;
    }

    case "openFifthDrone": {
      [lhRoot, lhRoot + 7, lhRoot + 12].forEach((midi) => {
        events.push({
          type: "accompaniment",
          noteName: midiToNote(midi),
          midi,
          startTime,
          duration: durationSec * 0.98,
          velocity: DEFAULT_VELOCITY.accompaniment * 0.7,
        });
      });
      break;
    }

    case "rhythmicStab": {
      exercise.scaleDegrees.forEach((_, i) => {
        chord.forEach((midi) => {
          events.push({
            type: "accompaniment",
            noteName: midiToNote(midi),
            midi,
            startTime: startTime + noteOffsets[i],
            duration: noteSecs[i] * 0.4,
            velocity: DEFAULT_VELOCITY.accompaniment,
          });
        });
      });
      break;
    }
  }

  return events;
}

// Flatten a list of KeyIterations into a single ordered NoteEvent stream with
// absolute timestamps and a key-rest pause between iterations.
export function flattenIterations(
  iterations: KeyIteration[],
  restBetweenSec = 0.5,
): { events: NoteEvent[]; totalDurationSec: number; keyStarts: { tonic: string; startTime: number }[] } {
  const events: NoteEvent[] = [];
  const keyStarts: { tonic: string; startTime: number }[] = [];
  let cursor = 0;
  for (const iter of iterations) {
    keyStarts.push({ tonic: iter.tonic, startTime: cursor });
    for (const e of iter.events) {
      events.push({ ...e, startTime: cursor + e.startTime });
    }
    cursor += iter.totalDurationSec + restBetweenSec;
  }
  return { events, totalDurationSec: cursor, keyStarts };
}
