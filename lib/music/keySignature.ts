// Music theory: derive a major-key signature from a tonic MIDI, and figure out
// per-note "spelling" (which letter + accidental a given MIDI is rendered as)
// in that key. Used by the staff-notation renderer to draw key-sig glyphs once
// next to the clef and suppress per-note accidentals when the key sig already
// establishes them.
//
// Convention: warmup exercises are major-mode. We pick the standard sharps-or-
// flats spelling for each pitch class:
//   C, G, D, A, E, B, F#  → sharps (0..6)
//   F, Bb, Eb, Ab, Db     → flats (1..5)
// F# is treated as 6 sharps (not Gb's 6 flats) — singers' modulating warmups
// almost always prefer sharps in the "white-to-black" direction.

export type AccidentalType = "sharp" | "flat" | "natural";
export type Letter = "C" | "D" | "E" | "F" | "G" | "A" | "B";

export interface KeySignatureAccidental {
  letter: Letter;
  type: "sharp" | "flat";
}

export interface KeySignature {
  /** Tonic letter (e.g. "F", "Bb" → still "B" with flat in spelling). */
  tonicLetter: Letter;
  /** Sharps if positive, flats if negative, 0 for C major. */
  accidentalCount: number;
  /** Letters that are altered, in conventional order (sharps: F-C-G-D-A-E-B; flats: B-E-A-D-G-C-F). */
  accidentals: KeySignatureAccidental[];
  /** Quick lookup: is this letter altered in the key, and how? */
  alteredLetters: Partial<Record<Letter, "sharp" | "flat">>;
}

const SHARP_ORDER: Letter[] = ["F", "C", "G", "D", "A", "E", "B"];
const FLAT_ORDER: Letter[] = ["B", "E", "A", "D", "G", "C", "F"];

// pitchClass → { tonicLetter, accidentalCount } using the standard major-key spelling.
const PITCH_CLASS_TO_KEY: Record<number, { tonicLetter: Letter; accidentalCount: number }> = {
  0: { tonicLetter: "C", accidentalCount: 0 },
  1: { tonicLetter: "D", accidentalCount: -5 },  // Db major (5 flats)
  2: { tonicLetter: "D", accidentalCount: 2 },   // D major (2 sharps)
  3: { tonicLetter: "E", accidentalCount: -3 },  // Eb major (3 flats)
  4: { tonicLetter: "E", accidentalCount: 4 },   // E major (4 sharps)
  5: { tonicLetter: "F", accidentalCount: -1 },  // F major (1 flat)
  6: { tonicLetter: "F", accidentalCount: 6 },   // F# major (6 sharps)
  7: { tonicLetter: "G", accidentalCount: 1 },   // G major (1 sharp)
  8: { tonicLetter: "A", accidentalCount: -4 },  // Ab major (4 flats)
  9: { tonicLetter: "A", accidentalCount: 3 },   // A major (3 sharps)
  10: { tonicLetter: "B", accidentalCount: -2 }, // Bb major (2 flats)
  11: { tonicLetter: "B", accidentalCount: 5 },  // B major (5 sharps)
};

export function keySignatureFor(tonicMidi: number): KeySignature {
  const pc = ((tonicMidi % 12) + 12) % 12;
  const { tonicLetter, accidentalCount } = PITCH_CLASS_TO_KEY[pc];

  const altered: KeySignatureAccidental[] = [];
  const alteredLetters: Partial<Record<Letter, "sharp" | "flat">> = {};

  if (accidentalCount > 0) {
    for (let i = 0; i < accidentalCount; i++) {
      const letter = SHARP_ORDER[i];
      altered.push({ letter, type: "sharp" });
      alteredLetters[letter] = "sharp";
    }
  } else if (accidentalCount < 0) {
    for (let i = 0; i < -accidentalCount; i++) {
      const letter = FLAT_ORDER[i];
      altered.push({ letter, type: "flat" });
      alteredLetters[letter] = "flat";
    }
  }

  return { tonicLetter, accidentalCount, accidentals: altered, alteredLetters };
}

const SHARP_PC_TO_LETTER: { letter: Letter; sharp: boolean }[] = [
  { letter: "C", sharp: false }, // 0
  { letter: "C", sharp: true },  // 1
  { letter: "D", sharp: false }, // 2
  { letter: "D", sharp: true },  // 3
  { letter: "E", sharp: false }, // 4
  { letter: "F", sharp: false }, // 5
  { letter: "F", sharp: true },  // 6
  { letter: "G", sharp: false }, // 7
  { letter: "G", sharp: true },  // 8
  { letter: "A", sharp: false }, // 9
  { letter: "A", sharp: true },  // 10
  { letter: "B", sharp: false }, // 11
];

const FLAT_PC_TO_LETTER: { letter: Letter; flat: boolean }[] = [
  { letter: "C", flat: false }, // 0
  { letter: "D", flat: true },  // 1 → Db
  { letter: "D", flat: false }, // 2
  { letter: "E", flat: true },  // 3 → Eb
  { letter: "E", flat: false }, // 4
  { letter: "F", flat: false }, // 5
  { letter: "G", flat: true },  // 6 → Gb
  { letter: "G", flat: false }, // 7
  { letter: "A", flat: true },  // 8 → Ab
  { letter: "A", flat: false }, // 9
  { letter: "B", flat: true },  // 10 → Bb
  { letter: "B", flat: false }, // 11
];

/**
 * Spell a MIDI note in the context of a key signature, returning its
 * staff letter, octave, and what accidental glyph (if any) should be
 * drawn next to the notehead.
 *
 * Rules:
 *   - If the key signature already alters this letter the right way, no glyph.
 *   - If the note is a chromatic alteration of an in-key letter, render
 *     a sharp/flat/natural to override the key sig.
 *   - If the note is the in-key letter, no glyph.
 */
export interface NoteSpelling {
  letter: Letter;
  octave: number;
  accidentalGlyph: AccidentalType | null;
}

export function spellMidiInKey(midi: number, sig: KeySignature): NoteSpelling {
  const pc = ((midi % 12) + 12) % 12;
  const useFlats = sig.accidentalCount < 0;
  const table = useFlats ? FLAT_PC_TO_LETTER : SHARP_PC_TO_LETTER;
  const entry = table[pc];
  const letter = entry.letter;
  const naturalNote = !("sharp" in entry ? entry.sharp : false) && !("flat" in entry ? entry.flat : false);
  const isAltered = ("sharp" in entry && entry.sharp) || ("flat" in entry && entry.flat);

  // Octave from MIDI: C0 = MIDI 12 (cf. midiToNote convention C4 = MIDI 60).
  // The letter we chose may shift the octave — e.g. Cb is technically the
  // letter B of the prior octave. For our spelling table we never spell across
  // such a boundary (Cb isn't in our flats table — only Bb), so this stays simple.
  const octave = Math.floor(midi / 12) - 1;

  // Determine glyph based on key sig context.
  const keyAlt = sig.alteredLetters[letter];
  let accidentalGlyph: AccidentalType | null = null;

  if (isAltered) {
    // Note IS chromatically altered in absolute terms. Glyph appears unless
    // the key sig already establishes the same alteration on this letter.
    const noteAlteration: "sharp" | "flat" = useFlats ? "flat" : "sharp";
    if (keyAlt === noteAlteration) {
      accidentalGlyph = null; // Key sig handles it.
    } else {
      accidentalGlyph = noteAlteration;
    }
  } else if (naturalNote) {
    // Natural pitch class. If the key sig WOULD alter this letter, we need a natural sign.
    if (keyAlt) {
      accidentalGlyph = "natural";
    }
  }

  return { letter, octave, accidentalGlyph };
}

const LETTER_INDEX: Record<Letter, number> = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };

/**
 * Compute the staff step (half-spaces from the clef's bottom line) for a
 * given letter+octave on a clef whose bottom line is at (bottomLetter, bottomOctave).
 */
export function staffStepFor(letter: Letter, octave: number, bottomLetter: Letter, bottomOctave: number): number {
  return (octave - bottomOctave) * 7 + (LETTER_INDEX[letter] - LETTER_INDEX[bottomLetter]);
}

// ---------------------------------------------------------------------------
// Standard staff positions for key-signature glyphs (steps from clef bottom line)
// ---------------------------------------------------------------------------

export const TREBLE_SHARP_STEPS: Record<Letter, number> = {
  F: 8, C: 5, G: 9, D: 6, A: 3, E: 7, B: 4,
};
export const TREBLE_FLAT_STEPS: Record<Letter, number> = {
  B: 4, E: 7, A: 3, D: 6, G: 2, C: 5, F: 1,
};
export const BASS_SHARP_STEPS: Record<Letter, number> = {
  F: 6, C: 3, G: 7, D: 4, A: 1, E: 5, B: 2,
};
export const BASS_FLAT_STEPS: Record<Letter, number> = {
  B: 2, E: 5, A: 1, D: 4, G: 0, C: 3, F: -1,
};
