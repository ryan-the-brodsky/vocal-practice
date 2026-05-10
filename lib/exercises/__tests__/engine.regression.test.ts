import { exerciseLibrary } from "../library";
import { planExercise, flattenIterations } from "../engine";
import { noteValueToSeconds } from "../music";
import type { ExerciseDescriptor, NoteEvent, VoicePart } from "../types";

// Regression guard for the durations? schema extension. The 8 bundled
// descriptors do not declare durations, so they exercise the fallback path —
// the resulting NoteEvent stream must match the pre-extension behaviour.

function eachVoicePart(ex: ExerciseDescriptor): VoicePart[] {
  return Object.keys(ex.voicePartRanges) as VoicePart[];
}

function approxEq(a: number, b: number, eps = 1e-9) {
  return Math.abs(a - b) <= eps;
}

describe("engine durations fallback — pre-extension parity", () => {
  test("the 8 bundled descriptors do not declare durations", () => {
    expect(exerciseLibrary).toHaveLength(8);
    for (const ex of exerciseLibrary) {
      expect(ex.durations).toBeUndefined();
    }
  });

  for (const ex of exerciseLibrary) {
    for (const voicePart of eachVoicePart(ex)) {
      test(`${ex.id} (${voicePart}): melody onsets and durations match uniform noteValue`, () => {
        const noteSec = noteValueToSeconds(ex.noteValue, ex.tempo);
        const iterations = planExercise({ exercise: ex, voicePart });
        expect(iterations.length).toBeGreaterThan(0);

        for (const iter of iterations) {
          const melody = iter.events.filter((e) => e.type === "melody");
          expect(melody).toHaveLength(ex.scaleDegrees.length);

          // Every melody note has duration = noteSec * 0.95
          for (const m of melody) {
            expect(approxEq(m.duration, noteSec * 0.95)).toBe(true);
          }

          // Onsets are uniform: melody[i].startTime - melody[0].startTime = i * noteSec
          const t0 = melody[0].startTime;
          melody.forEach((m, i) => {
            expect(approxEq(m.startTime - t0, i * noteSec)).toBe(true);
          });

          // Pitches: melody[i].midi = tonicMidi + scaleDegrees[i]
          melody.forEach((m, i) => {
            expect(m.midi).toBe(iter.tonicMidi + ex.scaleDegrees[i]);
          });

          // melodyStartSec exposed by the engine matches the first melody note's startTime.
          expect(approxEq(iter.melodyStartSec, melody[0].startTime)).toBe(true);
        }
      });

      test(`${ex.id} (${voicePart}): doubled-melody accompaniment (when present) matches melody onsets`, () => {
        const noteSec = noteValueToSeconds(ex.noteValue, ex.tempo);
        const iterations = planExercise({ exercise: ex, voicePart });
        for (const iter of iterations) {
          const acc = iter.events.filter((e) => e.type === "accompaniment");
          // Engine emits doubled-melody only for the doubledMelody pattern (descriptor or preset).
          if (ex.accompaniment.pattern !== "doubledMelody") continue;
          expect(acc).toHaveLength(ex.scaleDegrees.length);
          acc.forEach((a, i) => {
            expect(approxEq(a.duration, noteSec * 0.9)).toBe(true);
            // Doubled an octave above the melody note
            expect(a.midi).toBe(iter.tonicMidi + ex.scaleDegrees[i] + 12);
          });
        }
      });
    }
  }
});

describe("engine durations override — opt-in path", () => {
  test("descriptor.durations replaces uniform noteValue when length matches", () => {
    const base = exerciseLibrary.find((e) => e.id === "five-note-scale-mee-may-mah")!;
    const customDurations = base.scaleDegrees.map((_, i) => (i % 2 === 0 ? 1 : 0.5));
    const overridden: ExerciseDescriptor = { ...base, durations: customDurations };

    const beatSec = 60 / overridden.tempo;
    const expectedSecs = customDurations.map((b) => b * beatSec);

    const [iter] = planExercise({ exercise: overridden, voicePart: "tenor" });
    const melody = iter.events.filter((e: NoteEvent) => e.type === "melody");
    expect(melody).toHaveLength(overridden.scaleDegrees.length);

    let cursor = 0;
    melody.forEach((m, i) => {
      const expectedStart = iter.melodyStartSec + cursor;
      expect(approxEq(m.startTime, expectedStart)).toBe(true);
      expect(approxEq(m.duration, expectedSecs[i] * 0.95)).toBe(true);
      cursor += expectedSecs[i];
    });
  });

  test("durations of wrong length is ignored — falls back to noteValue", () => {
    const base = exerciseLibrary.find((e) => e.id === "five-note-scale-mee-may-mah")!;
    const broken: ExerciseDescriptor = {
      ...base,
      durations: [1, 2, 3], // length 3, not scaleDegrees.length
    };
    const noteSec = noteValueToSeconds(broken.noteValue, broken.tempo);
    const [iter] = planExercise({ exercise: broken, voicePart: "tenor" });
    const melody = iter.events.filter((e: NoteEvent) => e.type === "melody");
    melody.forEach((m, i) => {
      expect(approxEq(m.duration, noteSec * 0.95)).toBe(true);
      if (i > 0) {
        expect(approxEq(m.startTime - melody[0].startTime, i * noteSec)).toBe(true);
      }
    });
  });
});

describe("engine event-stream snapshot — locks all 8 descriptors", () => {
  // Round to 6 decimals so float drift across machines doesn't trip the snapshot.
  function round(n: number): number {
    return Math.round(n * 1e6) / 1e6;
  }
  function normalizeEvent(e: NoteEvent) {
    return {
      type: e.type,
      midi: e.midi,
      noteName: e.noteName,
      startTime: round(e.startTime),
      duration: round(e.duration),
      velocity: round(e.velocity),
      syllable: e.syllable,
      isTarget: e.isTarget,
    };
  }

  for (const ex of exerciseLibrary) {
    for (const voicePart of eachVoicePart(ex)) {
      test(`${ex.id} (${voicePart}) flattened plan`, () => {
        const iterations = planExercise({ exercise: ex, voicePart });
        const { events, totalDurationSec } = flattenIterations(iterations);
        expect({
          totalDurationSec: round(totalDurationSec),
          eventCount: events.length,
          events: events.map(normalizeEvent),
        }).toMatchSnapshot();
      });
    }
  }
});
