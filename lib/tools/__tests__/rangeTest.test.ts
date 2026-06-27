import { noteToMidi } from "@/lib/exercises/music";
import {
  centsFromTarget,
  classifyVoice,
  confirmFromWindow,
  DEFAULT_SUSTAIN_OPTS,
  DEFAULT_WALK_BOUNDS,
  describeSpan,
  onMatch,
  onTapOut,
  preciseMidi,
  qualifies,
  startWalk,
  SustainedPitchTracker,
} from "@/lib/tools/rangeTest";

const sample = (over: Partial<Parameters<typeof qualifies>[0]> = {}) => ({
  midi: 60,
  cents: 0,
  clarity: 0.95,
  rmsDb: -30,
  timestamp: 0,
  ...over,
});

describe("preciseMidi", () => {
  it("folds cents into the midi value", () => {
    expect(preciseMidi(sample({ midi: 60, cents: 50 }))).toBeCloseTo(60.5);
    expect(preciseMidi(sample({ midi: 60, cents: -25 }))).toBeCloseTo(59.75);
  });
  it("returns null when no pitch", () => {
    expect(preciseMidi(sample({ midi: null }))).toBeNull();
  });
});

describe("qualifies", () => {
  const o = DEFAULT_SUSTAIN_OPTS;
  it("accepts a clear, loud, in-window sample", () => {
    expect(qualifies(sample(), o)).toBe(true);
  });
  it("rejects low clarity", () => {
    expect(qualifies(sample({ clarity: 0.5 }), o)).toBe(false);
  });
  it("rejects quiet samples", () => {
    expect(qualifies(sample({ rmsDb: -60 }), o)).toBe(false);
  });
  it("rejects out-of-window pitches (octave-error guard)", () => {
    expect(qualifies(sample({ midi: 20 }), o)).toBe(false); // below C2
    expect(qualifies(sample({ midi: 96 }), o)).toBe(false); // above C6
  });
});

describe("confirmFromWindow", () => {
  const o = DEFAULT_SUSTAIN_OPTS;
  it("confirms a steady hold spanning >= sustainMs", () => {
    expect(confirmFromWindow([{ m: 60, t: 0 }, { m: 60.1, t: 350 }], o)).toBe(60);
  });
  it("returns null when the hold is too short", () => {
    expect(confirmFromWindow([{ m: 60, t: 0 }, { m: 60, t: 100 }], o)).toBeNull();
  });
  it("returns null when the spread exceeds stabilityCents", () => {
    // 60 -> 61 is 100 cents, above the 75c default
    expect(confirmFromWindow([{ m: 60, t: 0 }, { m: 61, t: 400 }], o)).toBeNull();
  });
});

describe("SustainedPitchTracker", () => {
  it("confirms a sustained note after enough stable frames", () => {
    const t = new SustainedPitchTracker();
    let confirmed: number | null = null;
    for (let i = 0; i <= 8; i++) {
      confirmed = t.push(sample({ midi: 57, cents: 5, timestamp: i * 50 }));
    }
    expect(confirmed).toBe(57);
  });
  it("does not confirm jittery input", () => {
    const t = new SustainedPitchTracker();
    let confirmed: number | null = null;
    const wild = [57, 64, 50, 69, 55];
    wild.forEach((m, i) => {
      confirmed = t.push(sample({ midi: m, timestamp: i * 50 }));
    });
    expect(confirmed).toBeNull();
  });
});

describe("describeSpan", () => {
  it("computes notes, semitones, and octaves", () => {
    const d = describeSpan(noteToMidi("C3"), noteToMidi("C5"));
    expect(d.lowNote).toBe("C3");
    expect(d.highNote).toBe("C5");
    expect(d.semitones).toBe(24);
    expect(d.octaves).toBe(2);
  });
  it("orders low/high regardless of argument order", () => {
    const d = describeSpan(noteToMidi("C5"), noteToMidi("C3"));
    expect(d.lowNote).toBe("C3");
    expect(d.highNote).toBe("C5");
  });
});

describe("centsFromTarget", () => {
  it("is zero when on the target", () => {
    expect(centsFromTarget(60, 0, 60)).toBe(0);
  });
  it("folds the within-semitone cents term", () => {
    expect(centsFromTarget(60, -20, 60)).toBe(-20);
  });
  it("snaps an octave error toward the target (pitchy sub-harmonic)", () => {
    // Detector reports C3 (48) while singing C4 (60) — should snap to ~0 cents.
    expect(centsFromTarget(48, 0, 60)).toBe(0);
  });
  it("returns null when there is no pitch", () => {
    expect(centsFromTarget(null, 0, 60)).toBeNull();
  });
});

describe("guided walk", () => {
  const b = DEFAULT_WALK_BOUNDS;

  it("starts descending from the anchor (middle C)", () => {
    const s = startWalk();
    expect(s.phase).toBe("descend");
    expect(s.target).toBe(60);
    expect(s.lowMidi).toBeNull();
    expect(s.highMidi).toBeNull();
  });

  it("records a match and steps down a semitone", () => {
    const s = onMatch(startWalk());
    expect(s.phase).toBe("descend");
    expect(s.target).toBe(59);
    expect(s.lowMidi).toBe(60);
    expect(s.highMidi).toBe(60);
  });

  it("tap-out while descending switches to ascending from anchor+1", () => {
    let s = onMatch(startWalk()); // matched 60, now at 59
    s = onTapOut(s); // can't reach 59
    expect(s.phase).toBe("ascend");
    expect(s.target).toBe(61);
    expect(s.lowMidi).toBe(60); // floor stays at the last matched note
  });

  it("tap-out while ascending finishes the walk", () => {
    let s = onMatch(startWalk()); // 60 matched
    s = onTapOut(s); // -> ascend at 61
    s = onMatch(s); // 61 matched -> 62
    s = onTapOut(s); // can't reach 62 -> done
    expect(s.phase).toBe("done");
    expect(s.lowMidi).toBe(60);
    expect(s.highMidi).toBe(61);
  });

  it("the anchor seeds the high end even if the singer can't ascend at all", () => {
    let s = onMatch(startWalk()); // 60 matched (low=high=60)
    s = onTapOut(s); // -> ascend at 61
    s = onTapOut(s); // can't reach 61 -> done
    expect(s.phase).toBe("done");
    expect(s.lowMidi).toBe(60);
    expect(s.highMidi).toBe(60);
  });

  it("auto-switches to ascending when it reaches the floor", () => {
    const bounds = { anchor: 60, floor: 58, ceiling: 84 };
    let s = startWalk(bounds); // target 60
    s = onMatch(s, bounds); // -> 59
    s = onMatch(s, bounds); // -> 58
    s = onMatch(s, bounds); // 58 matched, next 57 < floor -> ascend
    expect(s.phase).toBe("ascend");
    expect(s.target).toBe(61);
    expect(s.lowMidi).toBe(58);
  });

  it("finishes when it reaches the ceiling while ascending", () => {
    const bounds = { anchor: 60, floor: 36, ceiling: 62 };
    let s = startWalk(bounds);
    s = onTapOut(s, bounds); // -> ascend at 61
    s = onMatch(s, bounds); // 61 -> 62
    s = onMatch(s, bounds); // 62 matched, next 63 > ceiling -> done
    expect(s.phase).toBe("done");
    expect(s.highMidi).toBe(62);
  });

  it("never mutates the input state", () => {
    const s = startWalk();
    const before = { ...s };
    onMatch(s);
    onTapOut(s);
    expect(s).toEqual(before);
  });

  it("anchors at middle C by default", () => {
    expect(b.anchor).toBe(60);
  });
});

describe("classifyVoice", () => {
  it("classifies a high female range as soprano", () => {
    const v = classifyVoice(noteToMidi("C4"), noteToMidi("C6"));
    expect(v.voicePart).toBe("soprano");
    expect(v.appVoicePart).toBe("soprano");
  });
  it("classifies a low male range as bass and maps it to baritone for the app", () => {
    const v = classifyVoice(noteToMidi("E2"), noteToMidi("E4"));
    expect(v.voicePart).toBe("bass");
    expect(v.appVoicePart).toBe("baritone");
  });
  it("classifies a tenor range", () => {
    const v = classifyVoice(noteToMidi("C3"), noteToMidi("C5"));
    expect(v.voicePart).toBe("tenor");
  });
});
