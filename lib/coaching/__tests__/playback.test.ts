import { buildContrastPlayback, type FocusNote } from "../playback";
import type { NoteEvent } from "../../exercises/types";

function melodyEvent(overrides: Partial<NoteEvent> & Pick<NoteEvent, "midi" | "noteName" | "startTime">): NoteEvent {
  return {
    type: "melody",
    duration: 0.5,
    velocity: 0.8,
    syllable: "ah",
    ...overrides,
  } as NoteEvent;
}

function nonMelody(type: NoteEvent["type"], startTime: number, midi = 60): NoteEvent {
  return {
    type,
    midi,
    noteName: "C4",
    startTime,
    duration: 0.25,
    velocity: 0.6,
  };
}

describe("buildContrastPlayback", () => {
  const baseFocus: FocusNote = {
    positionInIteration: 0,
    targetMidi: 67,
    medianHz: 440,
    syllable: "sol",
  };

  test("target-note: 1 melody event with correct midi and no hzOverride", () => {
    const out = buildContrastPlayback(baseFocus, [], "target-note");
    expect(out).toHaveLength(1);
    const ev = out[0];
    expect(ev.type).toBe("melody");
    expect(ev.midi).toBe(67);
    expect(ev.noteName).toBe("G4");
    expect(ev.syllable).toBe("sol");
    expect(ev.isTarget).toBe(true);
    expect(ev.hzOverride).toBeUndefined();
    expect(ev.startTime).toBe(0);
    expect(ev.duration).toBe(1.0);
  });

  test("your-note: medianHz=523.25 (~C5) -> midi=72, hzOverride=523.25", () => {
    const focus: FocusNote = {
      positionInIteration: 0,
      targetMidi: 67,
      medianHz: 523.25,
      syllable: "sol",
    };
    const out = buildContrastPlayback(focus, [], "your-note");
    expect(out).toHaveLength(1);
    const ev = out[0];
    expect(ev.type).toBe("melody");
    expect(ev.midi).toBe(72);
    expect(ev.noteName).toBe("C5");
    expect(ev.hzOverride).toBe(523.25);
    expect(ev.isTarget).toBe(false);
    expect(ev.syllable).toBe("sol");
  });

  test("phrase-target: returns equivalent events; mutating output does not mutate input", () => {
    const input: NoteEvent[] = [
      nonMelody("cue", 0, 60),
      melodyEvent({ midi: 60, noteName: "C4", startTime: 1 }),
      melodyEvent({ midi: 62, noteName: "D4", startTime: 1.5 }),
    ];
    const out = buildContrastPlayback(baseFocus, input, "phrase-target");
    expect(out).toEqual(input);
    expect(out).not.toBe(input);
    out[0].startTime = 999;
    out[1].midi = 0;
    expect(input[0].startTime).toBe(0);
    expect(input[1].midi).toBe(60);
  });

  test("phrase-your-version: position=2 in 5 melody events sets hzOverride only on 3rd melody event", () => {
    const input: NoteEvent[] = [
      nonMelody("cue", 0, 55),
      melodyEvent({ midi: 60, noteName: "C4", startTime: 1.0 }),
      nonMelody("accompaniment", 1.0, 60),
      melodyEvent({ midi: 62, noteName: "D4", startTime: 1.5 }),
      nonMelody("tick", 1.5),
      melodyEvent({ midi: 64, noteName: "E4", startTime: 2.0 }),
      melodyEvent({ midi: 65, noteName: "F4", startTime: 2.5 }),
      melodyEvent({ midi: 67, noteName: "G4", startTime: 3.0 }),
      nonMelody("accompaniment", 3.0, 67),
    ];
    const focus: FocusNote = {
      positionInIteration: 2,
      targetMidi: 64,
      medianHz: 329.63,
      syllable: "mi",
    };
    const out = buildContrastPlayback(focus, input, "phrase-your-version");
    expect(out).toHaveLength(input.length);

    const melodyIndices = out
      .map((ev, i) => (ev.type === "melody" ? i : -1))
      .filter((i) => i >= 0);
    expect(melodyIndices).toHaveLength(5);

    // 3rd melody (index 2) gets hzOverride
    expect(out[melodyIndices[2]].hzOverride).toBe(329.63);
    // others have no hzOverride
    [0, 1, 3, 4].forEach((k) => {
      expect(out[melodyIndices[k]].hzOverride).toBeUndefined();
    });

    // non-melody events unchanged
    out.forEach((ev, i) => {
      if (ev.type !== "melody") {
        expect(ev).toEqual(input[i]);
      }
    });

    // input untouched
    expect(input[melodyIndices[2]].hzOverride).toBeUndefined();
  });

  test("phrase-your-version: out-of-range position returns clone with no hzOverride", () => {
    const input: NoteEvent[] = [
      melodyEvent({ midi: 60, noteName: "C4", startTime: 0 }),
      melodyEvent({ midi: 62, noteName: "D4", startTime: 0.5 }),
      nonMelody("cue", 0.5, 60),
    ];
    const focus: FocusNote = {
      positionInIteration: 99,
      targetMidi: 60,
      medianHz: 261.63,
      syllable: "do",
    };
    const out = buildContrastPlayback(focus, input, "phrase-your-version");
    expect(out).toHaveLength(input.length);
    out.forEach((ev) => {
      expect(ev.hzOverride).toBeUndefined();
    });
    expect(out).not.toBe(input);
  });
});
