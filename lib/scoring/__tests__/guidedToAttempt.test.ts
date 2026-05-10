import { exerciseLibrary } from "@/lib/exercises/library";
import { noteToMidi } from "@/lib/exercises/music";
import { buildKeyAttemptFromGuided, synthesizeGuidedIteration } from "../guidedToAttempt";

const FIVE_NOTE = exerciseLibrary.find((e) => e.id === "five-note-scale-mee-may-mah")!;
const G3 = noteToMidi("G3");

describe("buildKeyAttemptFromGuided", () => {
  it("maps each best-cents value into a NoteScore with the correct targetMidi", () => {
    const result = buildKeyAttemptFromGuided(
      [-15, +5, -30, +10, -8, 0, -5, +12, -20],
      G3,
      FIVE_NOTE.scaleDegrees,
    );

    expect(result.tonic).toBe("G3");
    expect(result.notes).toHaveLength(FIVE_NOTE.scaleDegrees.length);

    for (let i = 0; i < FIVE_NOTE.scaleDegrees.length; i++) {
      expect(result.notes[i].targetMidi).toBe(G3 + FIVE_NOTE.scaleDegrees[i]);
    }
  });

  it("passes signedCents through to meanCentsDeviation", () => {
    const cents = [-60, +60, 0, -25, +50, -50, 0, -30, +30];
    const result = buildKeyAttemptFromGuided(cents, G3, FIVE_NOTE.scaleDegrees);

    for (let i = 0; i < cents.length; i++) {
      expect(result.notes[i].meanCentsDeviation).toBe(cents[i]);
    }
  });

  it("scores notes within ±50¢ as 100% accuracy and outside as 0%", () => {
    const result = buildKeyAttemptFromGuided(
      [-49, +49, -50, -51, +51, 0, -25, +25, +75],
      G3,
      FIVE_NOTE.scaleDegrees,
    );

    expect(result.notes[0].accuracyPct).toBe(100); // -49
    expect(result.notes[1].accuracyPct).toBe(100); // +49
    expect(result.notes[2].accuracyPct).toBe(100); // -50 (boundary inclusive)
    expect(result.notes[3].accuracyPct).toBe(0);   // -51
    expect(result.notes[4].accuracyPct).toBe(0);   // +51
    expect(result.notes[5].accuracyPct).toBe(100); // 0
    expect(result.notes[6].accuracyPct).toBe(100); // -25
    expect(result.notes[7].accuracyPct).toBe(100); // +25
    expect(result.notes[8].accuracyPct).toBe(0);   // +75
  });

  it("attaches a single-frame trace at the user's actual hz so coaching playback can derive medianHz", () => {
    const result = buildKeyAttemptFromGuided(
      [-100, 0, +100, 0, 0, 0, 0, 0, 0],
      G3,
      FIVE_NOTE.scaleDegrees,
    );

    // -100¢ on G3 (~196 Hz) should land halfway down toward F#3 (~185 Hz).
    const note0Trace = result.notes[0].trace;
    expect(note0Trace).toBeDefined();
    expect(note0Trace).toHaveLength(1);
    expect(note0Trace![0].cents).toBe(-100);
    expect(note0Trace![0].clarity).toBeGreaterThan(0.9);

    // 0¢ trace hz should equal the target's hz (within float epsilon).
    const note1Trace = result.notes[1].trace!;
    expect(Math.abs(note1Trace[0].hz - 220)).toBeLessThan(1); // A3 ≈ 220 Hz (G3 + 2 semitones)
  });

  it("emits zero-frame NoteScores for null entries so fromKeyAttempts filters them out", () => {
    const cents = [-15, null, +20, null, 0, null, -10, null, +5];
    const result = buildKeyAttemptFromGuided(cents, G3, FIVE_NOTE.scaleDegrees);

    expect(result.notes[1].framesAboveClarity).toBe(0);
    expect(result.notes[3].framesAboveClarity).toBe(0);
    expect(result.notes[5].framesAboveClarity).toBe(0);
    expect(result.notes[7].framesAboveClarity).toBe(0);

    // Non-null entries get a positive frame count.
    expect(result.notes[0].framesAboveClarity).toBeGreaterThan(0);
    expect(result.notes[8].framesAboveClarity).toBeGreaterThan(0);
  });

  it("computes meanAccuracyPct and meanCentsDeviation across only the matched notes", () => {
    // 4 matched notes: 0, +20, -20, +40 → mean cents = 10. All within ±50 → mean accuracy 100%.
    // 5 unmatched (null) → ignored.
    const cents = [0, null, +20, null, -20, null, +40, null, null];
    const result = buildKeyAttemptFromGuided(cents, G3, FIVE_NOTE.scaleDegrees);

    expect(result.meanCentsDeviation).toBeCloseTo((0 + 20 - 20 + 40) / 4, 6);
    expect(result.meanAccuracyPct).toBe(100);
  });
});

describe("synthesizeGuidedIteration", () => {
  it("produces a single iteration with one melody event per scale degree", () => {
    const [iter] = synthesizeGuidedIteration(FIVE_NOTE, G3);
    expect(iter.tonic).toBe("G3");
    expect(iter.tonicMidi).toBe(G3);
    const melodyEvents = iter.events.filter((e) => e.type === "melody");
    expect(melodyEvents).toHaveLength(FIVE_NOTE.scaleDegrees.length);
  });

  it("broadcasts a single-element syllable list across all scale degrees", () => {
    // No shipped exercise uses a 1-element syllable list (each note has its own
    // entry in production), but the broadcast path is the documented contract.
    const synthetic: typeof FIVE_NOTE = {
      ...FIVE_NOTE,
      id: "synthetic-broadcast",
      syllables: ["la"],
      scaleDegrees: [0, 2, 4, 5, 7],
    };
    const [iter] = synthesizeGuidedIteration(synthetic, G3);
    const melody = iter.events.filter((e) => e.type === "melody");
    expect(melody).toHaveLength(5);
    for (const ev of melody) {
      expect(ev.syllable).toBe("la");
    }
  });

  it("attaches per-position syllables when the exercise defines a per-note set", () => {
    const [iter] = synthesizeGuidedIteration(FIVE_NOTE, G3);
    const melody = iter.events.filter((e) => e.type === "melody");
    for (let i = 0; i < melody.length; i++) {
      expect(melody[i].syllable).toBe(FIVE_NOTE.syllables[i]);
    }
  });
});
