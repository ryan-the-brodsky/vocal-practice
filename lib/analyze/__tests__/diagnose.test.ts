import { diagnoseMelody } from "../diagnose";
import type { ExtractedNote } from "../types";

function n(scaleDegree: number, snappedMidi: number, centsOff: number): ExtractedNote {
  return {
    startMs: 0,
    endMs: 250,
    medianHz: 440,
    medianMidiContinuous: snappedMidi + centsOff / 100,
    snappedMidi,
    scaleDegree,
    centsOff,
    durationBeats: 0.5,
    framesUsed: 12,
    outOfKey: false,
  };
}

describe("diagnoseMelody", () => {
  test("planted consistent flat 3rd surfaces as a 'consistent' glaring on degree 4 (the major 3rd pc)", () => {
    // C-major scale sung 4 times; every E is ~35¢ flat, all other notes dead-on.
    const notes: ExtractedNote[] = [];
    for (let pass = 0; pass < 4; pass++) {
      notes.push(
        n(0, 60, 0),
        n(2, 62, 1),
        n(4, 64, -35),
        n(5, 65, 0),
        n(7, 67, 2),
      );
    }
    const a = diagnoseMelody(notes, { tonic: "C4", mode: "major", tempoBpm: 88 });
    expect(a.glaring).not.toBeNull();
    expect(a.glaring!.kind).toBe("consistent");
    // Major 3rd has scaleDegree 4 (semitones from tonic).
    expect(a.glaring!.scaleDegree).toBe(4);
    expect(a.glaring!.summary.toLowerCase()).toContain("flat");
  });

  test("everything in tune → glaring is null", () => {
    const notes: ExtractedNote[] = [
      n(0, 60, 1),
      n(2, 62, -2),
      n(4, 64, 3),
      n(7, 67, -4),
    ];
    const a = diagnoseMelody(notes, { tonic: "C4", mode: "major", tempoBpm: 88 });
    expect(a.glaring).toBeNull();
  });

  test("single bad note (no consistent pattern) → 'outlier' glaring", () => {
    const notes: ExtractedNote[] = [
      n(0, 60, 0),
      n(2, 62, 0),
      n(4, 64, 0),
      n(5, 65, 0),
      n(7, 67, 80), // 80¢ sharp, far from the rest
    ];
    const a = diagnoseMelody(notes, { tonic: "C4", mode: "major", tempoBpm: 88 });
    expect(a.glaring).not.toBeNull();
    expect(a.glaring!.kind).toBe("outlier");
    expect(a.glaring!.noteIndex).toBe(4);
  });

  test("perScaleDegree aggregates correctly", () => {
    // Two G's in tune (cents 0 and 4); one F flat by -25; one C in tune.
    const notes: ExtractedNote[] = [
      n(0, 60, 0),
      n(7, 67, 0),
      n(7, 67, 4),
      n(5, 65, -25),
    ];
    const a = diagnoseMelody(notes, { tonic: "C4", mode: "major", tempoBpm: 88 });
    const byPc = new Map(a.perScaleDegree.map((s) => [s.scaleDegree, s]));
    expect(byPc.get(7)!.occurrences).toBe(2);
    expect(byPc.get(7)!.meanCentsOff).toBeCloseTo(2, 5);
    expect(byPc.get(5)!.occurrences).toBe(1);
    expect(byPc.get(5)!.meanCentsOff).toBeCloseTo(-25, 5);
    // Hit rate window is 25¢ — the -25 is ON the boundary (inclusive), so 100%.
    expect(byPc.get(5)!.hitRatePct).toBe(100);
  });
});
