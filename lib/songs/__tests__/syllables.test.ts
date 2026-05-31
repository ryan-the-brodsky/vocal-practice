import { parseSyllables, zipSyllablesToNotes } from "../syllables";
import type { ExtractedNote } from "../../analyze/types";

function note(scaleDegree: number, startMs: number, endMs: number, durationBeats: number): ExtractedNote {
  return {
    startMs,
    endMs,
    medianHz: 220,
    medianMidiContinuous: 60 + scaleDegree,
    snappedMidi: 60 + scaleDegree,
    scaleDegree,
    centsOff: 0,
    durationBeats,
    framesUsed: 5,
    outOfKey: false,
  };
}

describe("parseSyllables", () => {
  test("empty string → []", () => {
    expect(parseSyllables("")).toEqual([]);
  });

  test("whitespace-only → []", () => {
    expect(parseSyllables("   \n\t ")).toEqual([]);
  });

  test("splits on whitespace", () => {
    expect(parseSyllables("love you")).toEqual(["love", "you"]);
  });

  test("hyphenated word → multi-syllable", () => {
    expect(parseSyllables("for-ev-er")).toEqual(["for", "ev", "er"]);
  });

  test("strips trailing punctuation", () => {
    expect(parseSyllables("love, you.")).toEqual(["love", "you"]);
  });

  test("contractions stay intact (one syllable)", () => {
    expect(parseSyllables("don't stop")).toEqual(["don't", "stop"]);
  });

  test("mix of hyphens + punctuation", () => {
    expect(parseSyllables("love you for-ev-er!")).toEqual(["love", "you", "for", "ev", "er"]);
  });

  test("collapses runs of whitespace", () => {
    expect(parseSyllables("love   you")).toEqual(["love", "you"]);
  });

  test("ignores empty hyphen segments", () => {
    expect(parseSyllables("foo--bar")).toEqual(["foo", "bar"]);
  });
});

describe("zipSyllablesToNotes", () => {
  test("empty lyrics → notes returned unchanged with identity map", () => {
    const notes = [note(0, 0, 500, 1), note(2, 500, 1000, 1)];
    const result = zipSyllablesToNotes([], notes);
    expect(result.notes).toEqual(notes);
    expect(result.originalIndexMap).toEqual([0, 1]);
  });

  test("syllableCount === noteCount → 1:1 zip, no splits", () => {
    const notes = [note(0, 0, 500, 1), note(2, 500, 1000, 1)];
    const result = zipSyllablesToNotes(["la", "la"], notes);
    expect(result.notes.length).toBe(2);
    expect(result.notes.map((n) => n.syllable)).toEqual(["la", "la"]);
    expect(result.originalIndexMap).toEqual([0, 1]);
    // Durations untouched
    expect(result.notes.map((n) => n.durationBeats)).toEqual([1, 1]);
  });

  test("3 syllables, 2 notes with one long → bisect the long one", () => {
    // Second note is twice as long → bisects.
    const notes = [note(0, 0, 500, 1), note(2, 500, 1500, 2)];
    const result = zipSyllablesToNotes(["love", "you", "more"], notes);
    expect(result.notes.length).toBe(3);
    expect(result.notes.map((n) => n.syllable)).toEqual(["love", "you", "more"]);
    expect(result.originalIndexMap).toEqual([0, 1, 1]);
    // Long note bisected: durations should be 1, 1, 1; startMs aligned.
    expect(result.notes[1]!.durationBeats).toBe(1);
    expect(result.notes[2]!.durationBeats).toBe(1);
    expect(result.notes[2]!.startMs).toBe(1000);
  });

  test("5 syllables, 2 notes → longest bisects three times", () => {
    // First note dur 1, second dur 4. Need to bisect from 2 → 5 = 3 splits.
    // Splits always target the current longest, so it whittles down the dur-4.
    const notes = [note(0, 0, 500, 1), note(2, 500, 2500, 4)];
    const result = zipSyllablesToNotes(["a", "b", "c", "d", "e"], notes);
    expect(result.notes.length).toBe(5);
    expect(result.notes.map((n) => n.syllable)).toEqual(["a", "b", "c", "d", "e"]);
    // Original index map: first comes from idx 0, rest all from idx 1.
    expect(result.originalIndexMap).toEqual([0, 1, 1, 1, 1]);
    // After 3 splits on a dur-4 note: 1+1+1+1 (split → 2,2 → 2,1,1 → 1,1,1,1).
    expect(result.notes.slice(1).map((n) => n.durationBeats)).toEqual([1, 1, 1, 1]);
  });

  test("syllableCount < noteCount → trailing notes get empty syllable", () => {
    const notes = [note(0, 0, 500, 1), note(2, 500, 1000, 1), note(4, 1000, 1500, 1)];
    const result = zipSyllablesToNotes(["la"], notes);
    expect(result.notes.length).toBe(3);
    expect(result.notes.map((n) => n.syllable)).toEqual(["la", "", ""]);
    expect(result.originalIndexMap).toEqual([0, 1, 2]);
  });

  test("ties on longest favor the earliest note (stable)", () => {
    // Both notes dur 1. Adding one syllable → split the FIRST.
    const notes = [note(0, 0, 500, 1), note(2, 500, 1000, 1)];
    const result = zipSyllablesToNotes(["a", "b", "c"], notes);
    expect(result.notes.length).toBe(3);
    expect(result.originalIndexMap).toEqual([0, 0, 1]);
  });

  test("hyphenated 'for-ev-er' on a single sustained note → 3 notes", () => {
    const notes = [note(0, 0, 1500, 3)];
    const result = zipSyllablesToNotes(["for", "ev", "er"], notes);
    expect(result.notes.length).toBe(3);
    expect(result.notes.map((n) => n.syllable)).toEqual(["for", "ev", "er"]);
    expect(result.originalIndexMap).toEqual([0, 0, 0]);
    // Total durations sum back to the original 3 beats.
    const sum = result.notes.reduce((s, n) => s + n.durationBeats, 0);
    expect(sum).toBeCloseTo(3, 6);
  });

  test("splits preserve scaleDegree + snappedMidi on every child", () => {
    const notes = [note(7, 0, 1000, 2)];
    const result = zipSyllablesToNotes(["a", "b"], notes);
    expect(result.notes.every((n) => n.scaleDegree === 7)).toBe(true);
    expect(result.notes.every((n) => n.snappedMidi === 67)).toBe(true);
  });
});
