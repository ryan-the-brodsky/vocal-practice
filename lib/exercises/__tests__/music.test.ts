import {
  noteToMidi,
  midiToNote,
  midiToHz,
  hzToMidi,
  noteValueToSeconds,
  triadFromRoot,
  voicingInWindow,
} from "../music";

describe("noteToMidi / midiToNote", () => {
  it("anchors the standard reference points (C-1 = 0, C0 = 12, C4 = 60, A4 = 69)", () => {
    expect(noteToMidi("C-1")).toBe(0);
    expect(noteToMidi("C0")).toBe(12);
    expect(noteToMidi("C4")).toBe(60);
    expect(noteToMidi("A4")).toBe(69);
  });

  it("round-trips midiToNote(noteToMidi(x)) === x for every sharp-spelled semitone in 0..127", () => {
    // midiToNote always emits sharp-spelled names; restrict round-trip check to the sharp set.
    const SHARP_PCS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    for (let m = 0; m < 128; m++) {
      const name = midiToNote(m);
      expect(noteToMidi(name)).toBe(m);
      const pc = m % 12;
      expect(name.startsWith(SHARP_PCS[pc]!)).toBe(true);
    }
  });

  it("accepts both sharp and enharmonic flat spellings", () => {
    expect(noteToMidi("F#4")).toBe(noteToMidi("Gb4"));
    expect(noteToMidi("D#3")).toBe(noteToMidi("Eb3"));
    expect(noteToMidi("A#2")).toBe(noteToMidi("Bb2"));
    expect(noteToMidi("G#5")).toBe(noteToMidi("Ab5"));
    expect(noteToMidi("C#1")).toBe(noteToMidi("Db1"));
  });

  it("throws on malformed names", () => {
    expect(() => noteToMidi("H4")).toThrow(/Invalid note name/);
    expect(() => noteToMidi("C")).toThrow(/Invalid note name/);
    expect(() => noteToMidi("")).toThrow(/Invalid note name/);
    expect(() => noteToMidi("c#x")).toThrow(/Invalid note name/);
  });

  it("supports negative octaves down to C-1", () => {
    expect(noteToMidi("C-1")).toBe(0);
    expect(noteToMidi("B-1")).toBe(11);
    expect(midiToNote(0)).toBe("C-1");
    expect(midiToNote(11)).toBe("B-1");
  });

  it("midiToHz/hzToMidi anchor on A4 = 440 Hz", () => {
    expect(midiToHz(69)).toBeCloseTo(440, 6);
    expect(hzToMidi(440)).toBeCloseTo(69, 6);
    // Round-trip through arbitrary midi
    for (const m of [12, 36, 60, 72, 84]) {
      expect(hzToMidi(midiToHz(m))).toBeCloseTo(m, 6);
    }
  });
});

describe("noteValueToSeconds", () => {
  it("scales straight values inversely with bpm (60 bpm = 1s/quarter)", () => {
    expect(noteValueToSeconds("4n", 60)).toBeCloseTo(1, 6);
    expect(noteValueToSeconds("4n", 120)).toBeCloseTo(0.5, 6);
    expect(noteValueToSeconds("4n", 90)).toBeCloseTo(60 / 90, 6);
  });

  it("covers whole, half, eighth, sixteenth, thirty-second", () => {
    expect(noteValueToSeconds("1n", 60)).toBeCloseTo(4, 6);
    expect(noteValueToSeconds("2n", 60)).toBeCloseTo(2, 6);
    expect(noteValueToSeconds("8n", 60)).toBeCloseTo(0.5, 6);
    expect(noteValueToSeconds("16n", 60)).toBeCloseTo(0.25, 6);
    expect(noteValueToSeconds("32n", 60)).toBeCloseTo(0.125, 6);
  });

  it("dotted values are 1.5× the base", () => {
    expect(noteValueToSeconds("4.", 60)).toBeCloseTo(1.5, 6);
    expect(noteValueToSeconds("8.", 60)).toBeCloseTo(0.75, 6);
    expect(noteValueToSeconds("2.", 60)).toBeCloseTo(3, 6);
  });

  it("triplet values are 2/3× the base", () => {
    expect(noteValueToSeconds("4t", 60)).toBeCloseTo(2 / 3, 6);
    expect(noteValueToSeconds("8t", 60)).toBeCloseTo(1 / 3, 6);
  });

  it("throws on unknown values", () => {
    expect(() => noteValueToSeconds("3n", 60)).toThrow(/Unknown note value/);
    expect(() => noteValueToSeconds("", 60)).toThrow(/Unknown note value/);
  });
});

describe("triadFromRoot", () => {
  it("major triad = root, +4, +7 semitones", () => {
    expect(triadFromRoot(60, "major")).toEqual([60, 64, 67]);
    expect(triadFromRoot(67, "major")).toEqual([67, 71, 74]);
  });

  it("minor triad = root, +3, +7 semitones", () => {
    expect(triadFromRoot(60, "minor")).toEqual([60, 63, 67]);
    expect(triadFromRoot(57, "minor")).toEqual([57, 60, 64]);
  });

  it("defaults to major when quality omitted", () => {
    expect(triadFromRoot(60)).toEqual([60, 64, 67]);
  });
});

describe("voicingInWindow", () => {
  it("lifts a low root into the target octave window from below", () => {
    // Root C3 (48), low window starts at C4 (60) → should bump up to C4
    expect(voicingInWindow(48, 60)).toEqual([60, 64, 67]);
  });

  it("drops a high root into the target window from above", () => {
    // Root C5 (72), low window starts at C4 (60) → should drop to C4
    expect(voicingInWindow(72, 60)).toEqual([60, 64, 67]);
  });

  it("leaves a root that's already in [low, low+12) untouched", () => {
    expect(voicingInWindow(60, 60)).toEqual([60, 64, 67]);
    expect(voicingInWindow(67, 60)).toEqual([67, 71, 74]); // G in [C4..C5)
  });

  it("respects the chord quality argument", () => {
    expect(voicingInWindow(48, 60, "minor")).toEqual([60, 63, 67]);
  });
});
