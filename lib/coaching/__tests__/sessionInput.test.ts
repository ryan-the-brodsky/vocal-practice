import type { ExtractedNote, MelodyAnalysis } from "../../analyze/types";
import { fromMelodyAnalysis } from "../engine/sessionInput";

function note(opts: Partial<ExtractedNote>): ExtractedNote {
  return {
    startMs: 0,
    endMs: 500,
    medianHz: 440,
    medianMidiContinuous: 69,
    snappedMidi: 69,
    scaleDegree: 0,
    centsOff: 0,
    durationBeats: 1,
    framesUsed: 10,
    outOfKey: false,
    ...opts,
  };
}

function analysis(notes: ExtractedNote[]): MelodyAnalysis {
  return {
    notes,
    perScaleDegree: [],
    glaring: null,
    tonic: "A",
    mode: "major",
    tempoBpm: 120,
    durationSec: 5,
    warnings: [],
  };
}

describe("fromMelodyAnalysis", () => {
  test("maps each ExtractedNote to a NoteObservation in order", () => {
    const a = analysis([
      note({ snappedMidi: 60, scaleDegree: 0, centsOff: -10, framesUsed: 8, syllable: "do" }),
      note({ snappedMidi: 64, scaleDegree: 4, centsOff: 5, framesUsed: 12, syllable: "mi" }),
      note({ snappedMidi: 67, scaleDegree: 7, centsOff: -25, framesUsed: 15, syllable: "sol" }),
    ]);
    const input = fromMelodyAnalysis(a);
    expect(input.notes).toHaveLength(3);
    expect(input.keyCount).toBe(1);
    expect(input.notes[0]).toEqual({
      keyIndex: 0,
      notePosition: 0,
      scaleDegree: 0,
      targetMidi: 60,
      signedCents: -10,
      framesAboveClarity: 8,
      syllable: "do",
    });
    expect(input.notes[1].notePosition).toBe(1);
    expect(input.notes[1].targetMidi).toBe(64);
    expect(input.notes[1].signedCents).toBe(5);
    expect(input.notes[2].scaleDegree).toBe(7);
    expect(input.notes[2].framesAboveClarity).toBe(15);
  });

  test("clamps framesUsed to at least 1 so detectors always have a non-zero weight", () => {
    const a = analysis([note({ framesUsed: 0 })]);
    const input = fromMelodyAnalysis(a);
    expect(input.notes[0].framesAboveClarity).toBe(1);
  });

  test("empty analysis produces an empty notes array but valid SessionInput", () => {
    const input = fromMelodyAnalysis(analysis([]));
    expect(input.notes).toEqual([]);
    expect(input.keyCount).toBe(1);
  });

  test("preserves missing syllables as undefined", () => {
    const a = analysis([note({ syllable: undefined })]);
    const input = fromMelodyAnalysis(a);
    expect(input.notes[0].syllable).toBeUndefined();
  });
});
