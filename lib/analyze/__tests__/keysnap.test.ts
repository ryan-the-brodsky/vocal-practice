import type { Segment } from "../../scoring/align";
import { snapToKey } from "../keysnap";
import { noteToMidi } from "../../exercises/music";

function seg(medianPitchMidi: number, startMs = 0, endMs = 250): Segment {
  return {
    startMs,
    endMs,
    medianPitchMidi,
    frames: [],
  };
}

describe("snapToKey", () => {
  const tonic = noteToMidi("C4"); // 60

  test("snaps in-tune C-major scale to its diatonic degrees", () => {
    const segs = [
      seg(60.04), // C4
      seg(62.0),  // D4
      seg(64.0),  // E4
      seg(65.0),  // F4
      seg(67.0),  // G4
      seg(69.0),  // A4
      seg(71.0),  // B4
      seg(72.0),  // C5
    ];
    const notes = snapToKey(segs, tonic, "major", { tempoBpm: 88 });
    expect(notes.map((n) => n.snappedMidi)).toEqual([60, 62, 64, 65, 67, 69, 71, 72]);
    expect(notes.map((n) => n.scaleDegree)).toEqual([0, 2, 4, 5, 7, 9, 11, 12]);
    // First note has +4¢ deviation; rest are dead-on.
    expect(notes[0]!.centsOff).toBeCloseTo(4, 0);
    for (let i = 1; i < notes.length; i++) {
      expect(notes[i]!.centsOff).toBeCloseTo(0, 5);
    }
  });

  test("flat-3rd that lies near both ♭3 (chromatic) and 3 (diatonic) snaps to the in-key degree", () => {
    // 63.6 ≈ 60¢ flat of E4 (64.0) and 40¢ sharp of E♭4 (63.0).
    // E♭ is out of C major; E is in. The in-key snap distance is 40¢ <
    // ANALYZE_CONFIG.outOfKeyToleranceCents (70¢), so it stays in-key.
    const segs = [seg(63.6)];
    const notes = snapToKey(segs, tonic, "major", { tempoBpm: 88 });
    expect(notes[0]!.snappedMidi).toBe(64);
    expect(notes[0]!.outOfKey).toBe(false);
    // centsOff = (continuous - snapped) * 100 = (63.6 - 64) * 100 = -40
    expect(notes[0]!.centsOff).toBeCloseTo(-40, 5);
  });

  test("out-of-key escape: a clearly chromatic ♭5 snaps to the chromatic semitone", () => {
    // F♯4 = 66.0; not in C major. Closest in-key is F (65) at 100¢ — beyond the 70¢ tolerance.
    const segs = [seg(66.0)];
    const notes = snapToKey(segs, tonic, "major", { tempoBpm: 88 });
    expect(notes[0]!.snappedMidi).toBe(66);
    expect(notes[0]!.outOfKey).toBe(true);
    expect(notes[0]!.scaleDegree).toBe(6);
  });

  test("voice-leading tiebreak prefers the in-key candidate closer to the previous snapped note", () => {
    // A natural minor scale: tonic = A3 (57); in-key pcs from tonic = [0,2,3,5,7,8,10].
    // Continuous pitch 60.5 sits exactly between B3 (59) and C4 (60) and D4 (62)?
    // Let's pick a cleaner case: previous note is C4 (60), current continuous is 65.5.
    // Possible in-key candidates: F4 (65) at 50¢ and E4 (64) at 150¢ → only F is within tiebreak,
    // so this case has no ambiguity. We need a case where two in-key candidates
    // are within ~30¢ of the continuous pitch.
    //
    // Use tonic=C4 in C major; continuous 71.6 is 60¢ from B4 (71) and 40¢
    // from C5 (72). Without voice-leading the nearer C5 wins; with previous
    // snapped = G4 (67), B4 is musically closer (|71-67|=4 vs |72-67|=5).
    const tonicC = noteToMidi("C4");
    const prev = seg(67.0); // G4
    const cur = seg(71.6);
    const notes = snapToKey([prev, cur], tonicC, "major", {
      tempoBpm: 88,
      voiceLeadingTiebreakCents: 30,
    });
    expect(notes[1]!.snappedMidi).toBe(71);

    // Sanity check: the tiebreak is what flipped the choice. Drop the previous
    // note out of the picture and the rounder picks C5 (72) directly.
    const aloneNotes = snapToKey([cur], tonicC, "major", { tempoBpm: 88 });
    expect(aloneNotes[0]!.snappedMidi).toBe(72);
  });
});
