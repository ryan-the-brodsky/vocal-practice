import { planExercise } from "../engine";
import type { ExerciseDescriptor } from "../types";

function descriptor(overrides: Partial<ExerciseDescriptor> = {}): ExerciseDescriptor {
  return {
    id: "test-rests",
    name: "Test rests",
    pedagogy: "",
    scaleDegrees: [0, 4, 7],
    durations: [1, 1, 1],
    syllables: ["a", "b", "c"],
    noteValue: "8n",
    tempo: 120, // beatSec = 0.5
    voicePartRanges: { tenor: { lowest: "C4", highest: "C4", step: 1 } },
    accompaniment: { pattern: "none", doubleMelody: false, cueType: "none" },
    direction: "ascending",
    ...overrides,
  };
}

describe("engine — restsAfter on descriptor", () => {
  test("rests shift subsequent melody onsets by the rest's beat value", () => {
    // restsAfter = [0.5, 1, 0] at 120bpm → 0.25s, 0.5s of silence
    const ex = descriptor({ restsAfter: [0.5, 1, 0] });
    const [iter] = planExercise({ exercise: ex, voicePart: "tenor" });
    expect(iter).toBeDefined();
    const melody = iter!.events.filter((e) => e.type === "melody");
    expect(melody).toHaveLength(3);
    const t0 = melody[0]!.startTime;
    // Note 1: at t0 + 1 beat (note 0 duration) + 0.5 beat (rest after 0) = +0.75s
    expect(melody[1]!.startTime).toBeCloseTo(t0 + 0.5 + 0.25, 5);
    // Note 2: + 0.5s (note 1) + 0.5s (rest after 1) from note 1 = t0 + 0.75 + 0.5 + 0.5
    expect(melody[2]!.startTime).toBeCloseTo(t0 + 0.5 + 0.25 + 0.5 + 0.5, 5);
  });

  test("emits a 'rest' event between melody notes for each non-zero entry", () => {
    const ex = descriptor({ restsAfter: [0.5, 0, 0] });
    const [iter] = planExercise({ exercise: ex, voicePart: "tenor" });
    const rests = iter!.events.filter((e) => e.type === "rest");
    expect(rests).toHaveLength(1);
    expect(rests[0]!.duration).toBeCloseTo(0.25, 5); // 0.5 beats × 0.5s/beat
  });

  test("zero-length entries emit no rest events", () => {
    const ex = descriptor({ restsAfter: [0, 0, 0] });
    const [iter] = planExercise({ exercise: ex, voicePart: "tenor" });
    const rests = iter!.events.filter((e) => e.type === "rest");
    expect(rests).toHaveLength(0);
  });

  test("ignores restsAfter when length doesn't match scaleDegrees (defensive)", () => {
    const ex = descriptor({ restsAfter: [0.5, 1] }); // length 2, scaleDegrees length 3
    const [iter] = planExercise({ exercise: ex, voicePart: "tenor" });
    const rests = iter!.events.filter((e) => e.type === "rest");
    expect(rests).toHaveLength(0);
    // Melody onsets should match the no-rest case (uniform spacing).
    const melody = iter!.events.filter((e) => e.type === "melody");
    const dt1 = melody[1]!.startTime - melody[0]!.startTime;
    const dt2 = melody[2]!.startTime - melody[1]!.startTime;
    expect(dt1).toBeCloseTo(dt2, 5);
  });

  test("scorer-relevant target list unaffected by rest events", () => {
    // The scoring/tracker filters by type === 'melody'. Rest events must NOT
    // appear in that filter's output.
    const ex = descriptor({ restsAfter: [0.5, 0.5, 0] });
    const [iter] = planExercise({ exercise: ex, voicePart: "tenor" });
    const targets = iter!.events.filter((e) => e.type === "melody");
    expect(targets).toHaveLength(3); // exactly the three melody notes
    expect(targets.every((e) => e.midi > 0)).toBe(true);
  });
});
