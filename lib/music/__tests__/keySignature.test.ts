import {
  keySignatureFor,
  spellMidiInKey,
  staffStepFor,
  TREBLE_SHARP_STEPS,
  TREBLE_FLAT_STEPS,
} from "../keySignature";

describe("keySignatureFor", () => {
  it("C major: 0 accidentals", () => {
    const k = keySignatureFor(60); // C4
    expect(k.tonicLetter).toBe("C");
    expect(k.accidentalCount).toBe(0);
    expect(k.accidentals).toEqual([]);
    expect(k.alteredLetters).toEqual({});
  });

  it("G major: 1 sharp (F#)", () => {
    const k = keySignatureFor(67); // G4
    expect(k.tonicLetter).toBe("G");
    expect(k.accidentalCount).toBe(1);
    expect(k.accidentals).toEqual([{ letter: "F", type: "sharp" }]);
    expect(k.alteredLetters.F).toBe("sharp");
  });

  it("D major: 2 sharps (F#, C#)", () => {
    const k = keySignatureFor(62); // D4
    expect(k.accidentalCount).toBe(2);
    expect(k.accidentals.map((a) => a.letter)).toEqual(["F", "C"]);
  });

  it("A major: 3 sharps (F#, C#, G#)", () => {
    const k = keySignatureFor(69); // A4
    expect(k.accidentalCount).toBe(3);
    expect(k.accidentals.map((a) => a.letter)).toEqual(["F", "C", "G"]);
  });

  it("E major: 4 sharps", () => {
    const k = keySignatureFor(64);
    expect(k.accidentalCount).toBe(4);
    expect(k.accidentals.map((a) => a.letter)).toEqual(["F", "C", "G", "D"]);
  });

  it("B major: 5 sharps", () => {
    const k = keySignatureFor(71);
    expect(k.accidentalCount).toBe(5);
    expect(k.accidentals.map((a) => a.letter)).toEqual(["F", "C", "G", "D", "A"]);
  });

  it("F# major: 6 sharps", () => {
    const k = keySignatureFor(66); // F#4
    expect(k.accidentalCount).toBe(6);
    expect(k.accidentals.map((a) => a.letter)).toEqual(["F", "C", "G", "D", "A", "E"]);
  });

  it("F major: 1 flat (Bb)", () => {
    const k = keySignatureFor(65); // F4
    expect(k.tonicLetter).toBe("F");
    expect(k.accidentalCount).toBe(-1);
    expect(k.accidentals).toEqual([{ letter: "B", type: "flat" }]);
    expect(k.alteredLetters.B).toBe("flat");
  });

  it("Bb major: 2 flats (Bb, Eb)", () => {
    const k = keySignatureFor(70); // Bb4
    expect(k.accidentalCount).toBe(-2);
    expect(k.accidentals.map((a) => a.letter)).toEqual(["B", "E"]);
  });

  it("Eb major: 3 flats", () => {
    const k = keySignatureFor(63); // Eb4
    expect(k.accidentalCount).toBe(-3);
    expect(k.accidentals.map((a) => a.letter)).toEqual(["B", "E", "A"]);
  });

  it("Ab major: 4 flats", () => {
    const k = keySignatureFor(68); // Ab4
    expect(k.accidentalCount).toBe(-4);
    expect(k.accidentals.map((a) => a.letter)).toEqual(["B", "E", "A", "D"]);
  });

  it("Db major: 5 flats", () => {
    const k = keySignatureFor(61); // Db4
    expect(k.accidentalCount).toBe(-5);
    expect(k.accidentals.map((a) => a.letter)).toEqual(["B", "E", "A", "D", "G"]);
  });
});

describe("spellMidiInKey", () => {
  it("D major spells F# without an accidental glyph (handled by key sig)", () => {
    const k = keySignatureFor(62);  // D major
    const sp = spellMidiInKey(66, k); // F#4
    expect(sp.letter).toBe("F");
    expect(sp.accidentalGlyph).toBeNull();
  });

  it("D major spells F natural with a natural sign (overrides key sig)", () => {
    const k = keySignatureFor(62);  // D major
    const sp = spellMidiInKey(65, k); // F4 natural
    expect(sp.letter).toBe("F");
    expect(sp.accidentalGlyph).toBe("natural");
  });

  it("C major spells F# with a sharp (chromatic, key sig has nothing)", () => {
    const k = keySignatureFor(60);
    const sp = spellMidiInKey(66, k);
    expect(sp.letter).toBe("F");
    expect(sp.accidentalGlyph).toBe("sharp");
  });

  it("Bb major spells Bb without a glyph", () => {
    const k = keySignatureFor(70);  // Bb major
    const sp = spellMidiInKey(70, k); // Bb4
    expect(sp.letter).toBe("B");
    expect(sp.accidentalGlyph).toBeNull();
  });

  it("Bb major spells B natural with a natural sign", () => {
    const k = keySignatureFor(70);
    const sp = spellMidiInKey(71, k); // B4
    expect(sp.letter).toBe("B");
    expect(sp.accidentalGlyph).toBe("natural");
  });

  it("Bb major spells C as natural with no glyph (C is unaltered in key)", () => {
    const k = keySignatureFor(70);
    const sp = spellMidiInKey(72, k); // C5
    expect(sp.letter).toBe("C");
    expect(sp.accidentalGlyph).toBeNull();
  });

  it("Eb major spells Eb without a glyph", () => {
    const k = keySignatureFor(63);  // Eb major
    const sp = spellMidiInKey(63, k);
    expect(sp.letter).toBe("E");
    expect(sp.accidentalGlyph).toBeNull();
  });

  it("F# major spells F# without a glyph", () => {
    const k = keySignatureFor(66);  // F# major
    const sp = spellMidiInKey(66, k);
    expect(sp.letter).toBe("F");
    expect(sp.accidentalGlyph).toBeNull();
  });

  it("octave is preserved across spelling", () => {
    const k = keySignatureFor(60);
    expect(spellMidiInKey(60, k).octave).toBe(4); // C4
    expect(spellMidiInKey(72, k).octave).toBe(5); // C5
    expect(spellMidiInKey(48, k).octave).toBe(3); // C3
  });
});

describe("staffStepFor", () => {
  it("E4 on treble clef is step 0 (bottom line)", () => {
    expect(staffStepFor("E", 4, "E", 4)).toBe(0);
  });

  it("F5 on treble clef is step 8 (top line)", () => {
    expect(staffStepFor("F", 5, "E", 4)).toBe(8);
  });

  it("C5 on treble clef is step 5 (3rd space)", () => {
    expect(staffStepFor("C", 5, "E", 4)).toBe(5);
  });

  it("G2 on bass clef is step 0", () => {
    expect(staffStepFor("G", 2, "G", 2)).toBe(0);
  });

  it("F3 on bass clef is step 6 (4th line)", () => {
    expect(staffStepFor("F", 3, "G", 2)).toBe(6);
  });
});

describe("Key-signature staff positions", () => {
  it("treble sharp steps are conventional", () => {
    expect(TREBLE_SHARP_STEPS).toEqual({ F: 8, C: 5, G: 9, D: 6, A: 3, E: 7, B: 4 });
  });

  it("treble flat steps are conventional", () => {
    expect(TREBLE_FLAT_STEPS).toEqual({ B: 4, E: 7, A: 3, D: 6, G: 2, C: 5, F: 1 });
  });
});
