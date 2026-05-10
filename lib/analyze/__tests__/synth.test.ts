import { ACCOMPANIMENT_PRESETS } from "../../exercises/types";
import { estimateTempo, toExerciseDescriptor } from "../synth";
import type { ExtractedNote, MelodyAnalysis } from "../types";

function note(scaleDegree: number, snappedMidi: number, durationBeats = 0.5): ExtractedNote {
  return {
    startMs: 0,
    endMs: 250,
    medianHz: 440,
    medianMidiContinuous: snappedMidi,
    snappedMidi,
    scaleDegree,
    centsOff: 0,
    durationBeats,
    framesUsed: 12,
    outOfKey: false,
  };
}

function makeAnalysis(notes: ExtractedNote[], overrides: Partial<MelodyAnalysis> = {}): MelodyAnalysis {
  return {
    notes,
    perScaleDegree: [],
    glaring: null,
    tonic: "C4",
    mode: "major",
    tempoBpm: 88,
    durationSec: notes.length > 0 ? notes[notes.length - 1]!.endMs / 1000 : 0,
    warnings: [],
    ...overrides,
  };
}

describe("toExerciseDescriptor", () => {
  test("round-trips scaleDegrees / durations / tempo from analysis", () => {
    // C major scale: 1 2 3 4 5 4 3 1 — scaleDegrees relative to C4 (60)
    const notes: ExtractedNote[] = [
      note(0, 60, 0.5),
      note(2, 62, 0.5),
      note(4, 64, 0.5),
      note(5, 65, 0.5),
      note(7, 67, 1.0),
      note(5, 65, 0.5),
      note(4, 64, 0.5),
      note(0, 60, 1.0),
    ];
    const analysis = makeAnalysis(notes);
    const { descriptor } = toExerciseDescriptor(analysis, {
      name: "Imported scale",
      voicePart: "tenor",
    });

    expect(descriptor.scaleDegrees).toEqual([0, 2, 4, 5, 7, 5, 4, 0]);
    expect(descriptor.durations).toEqual([0.5, 0.5, 0.5, 0.5, 1.0, 0.5, 0.5, 1.0]);
    expect(descriptor.tempo).toBe(88);
    expect(descriptor.syllables).toEqual(["", "", "", "", "", "", "", ""]);
    expect(descriptor.tags).toEqual(["imported"]);
  });

  test("default voice-part range starts at the analysis tonic", () => {
    const analysis = makeAnalysis([note(0, 60), note(7, 67)]);
    const { descriptor } = toExerciseDescriptor(analysis, {
      name: "test",
      voicePart: "baritone",
    });
    expect(descriptor.voicePartRanges.baritone).toBeDefined();
    expect(descriptor.voicePartRanges.baritone!.lowest).toBe("C4");
    // 5 semitones above C4 = F4
    expect(descriptor.voicePartRanges.baritone!.highest).toBe("F4");
  });

  test("major mode → classical accompaniment by default", () => {
    const analysis = makeAnalysis([note(0, 60), note(4, 64), note(7, 67)]);
    const { descriptor } = toExerciseDescriptor(analysis, {
      name: "happy",
      voicePart: "tenor",
    });
    expect(descriptor.accompaniment).toEqual(ACCOMPANIMENT_PRESETS.classical);
  });

  test("chromatic mode → drone accompaniment by default", () => {
    const analysis = makeAnalysis([note(0, 60), note(1, 61), note(2, 62)], {
      mode: "chromatic",
    });
    const { descriptor } = toExerciseDescriptor(analysis, {
      name: "chromo",
      voicePart: "tenor",
    });
    expect(descriptor.accompaniment).toEqual(ACCOMPANIMENT_PRESETS.drone);
  });

  test(">30% out-of-key notes in major mode → drone fallback with warning", () => {
    const oof: ExtractedNote = { ...note(1, 61), outOfKey: true };
    const oof2: ExtractedNote = { ...note(6, 66), outOfKey: true };
    const inKey = note(0, 60);
    // 2 of 3 are out-of-key (66%).
    const analysis = makeAnalysis([inKey, oof, oof2]);
    const { descriptor, warnings } = toExerciseDescriptor(analysis, {
      name: "messy",
      voicePart: "tenor",
    });
    expect(descriptor.accompaniment).toEqual(ACCOMPANIMENT_PRESETS.drone);
    expect(warnings.length).toBeGreaterThan(0);
  });

  test("user-supplied accompaniment override beats the mode-aware default", () => {
    const analysis = makeAnalysis([note(0, 60)]);
    const { descriptor } = toExerciseDescriptor(analysis, {
      name: "x",
      voicePart: "tenor",
      accompaniment: "studio",
    });
    expect(descriptor.accompaniment).toEqual(ACCOMPANIMENT_PRESETS.studio);
  });

  test("syllables: string repeats; array passes through; mismatch throws", () => {
    const analysis = makeAnalysis([note(0, 60), note(2, 62), note(4, 64)]);
    const { descriptor: d1 } = toExerciseDescriptor(analysis, {
      name: "a",
      voicePart: "tenor",
      syllables: "ah",
    });
    expect(d1.syllables).toEqual(["ah", "ah", "ah"]);

    const { descriptor: d2 } = toExerciseDescriptor(analysis, {
      name: "b",
      voicePart: "tenor",
      syllables: ["mee", "may", "mah"],
    });
    expect(d2.syllables).toEqual(["mee", "may", "mah"]);

    expect(() =>
      toExerciseDescriptor(analysis, {
        name: "c",
        voicePart: "tenor",
        syllables: ["only-one"],
      }),
    ).toThrow();
  });
});

describe("estimateTempo", () => {
  test("median 0.34 s @ eighth note → 88 BPM", () => {
    // 60 / (0.34 * 2) ≈ 88.2 → rounds to 88
    const { bpm, warning } = estimateTempo([0.34, 0.34, 0.34, 0.34, 0.34]);
    expect(bpm).toBe(88);
    expect(warning).toBeUndefined();
  });

  test("very long notes fall outside [60, 180] and default to 88 with a warning", () => {
    // 60 / (1.0 * 2) = 30 BPM → out of range.
    const { bpm, warning } = estimateTempo([1.0, 1.0, 1.0]);
    expect(bpm).toBe(88);
    expect(warning).toBeDefined();
  });

  test("empty input returns default with warning", () => {
    const { bpm, warning } = estimateTempo([]);
    expect(bpm).toBe(88);
    expect(warning).toBeDefined();
  });
});
