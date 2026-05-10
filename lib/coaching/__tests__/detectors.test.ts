import { DETECTORS } from "../detectors";
import { globalFlat } from "../detectors/globalFlat";
import { globalSharp } from "../detectors/globalSharp";
import { highNoteFlat } from "../detectors/highNoteFlat";
import { highNoteSharp } from "../detectors/highNoteSharp";
import { keyFatigueDrift } from "../detectors/keyFatigueDrift";
import { lowNoteFlat } from "../detectors/lowNoteFlat";
import { phraseEndFlat } from "../detectors/phraseEndFlat";
import { positionConsistent } from "../detectors/positionConsistent";
import { registerMismatch } from "../detectors/registerMismatch";
import type { NoteObservation, SessionInput } from "../engine/types";

function obs(opts: Partial<NoteObservation>): NoteObservation {
  return {
    keyIndex: 0,
    notePosition: 0,
    scaleDegree: 0,
    targetMidi: 60,
    signedCents: 0,
    framesAboveClarity: 10,
    ...opts,
  };
}

function session(notes: NoteObservation[], keyCount = 1): SessionInput {
  return { notes, keyCount };
}

// Build a 5-note pattern across a number of keys with an optional per-position cents fn.
function multiKeyPattern(
  keyCount: number,
  centsFn: (keyIndex: number, notePosition: number) => number,
  baseMidi = 60,
): NoteObservation[] {
  const notes: NoteObservation[] = [];
  for (let k = 0; k < keyCount; k++) {
    for (let p = 0; p < 5; p++) {
      notes.push(
        obs({
          keyIndex: k,
          notePosition: p,
          targetMidi: baseMidi + k * 2 + p,
          signedCents: centsFn(k, p),
        }),
      );
    }
  }
  return notes;
}

describe("DETECTORS array", () => {
  test("contains all 9 detectors in run order", () => {
    expect(DETECTORS).toHaveLength(9);
  });
});

describe("globalSharp", () => {
  test("fires when all notes are clearly sharp", () => {
    const notes = multiKeyPattern(2, () => 30);
    const out = globalSharp(session(notes, 2));
    expect(out).toHaveLength(1);
    expect(out[0].detectorId).toBe("global-sharp");
    expect(out[0].severity).toBeGreaterThan(20);
    expect(out[0].observations).toBe(10);
    expect(out[0].evidenceText).toMatch(/sharp/);
    expect(out[0].evidenceText).toMatch(/10 notes/);
  });

  test("does NOT fire on a near-perfect session", () => {
    const notes = multiKeyPattern(2, (_k, p) => (p % 2 === 0 ? 4 : -3));
    expect(globalSharp(session(notes, 2))).toEqual([]);
  });
});

describe("globalFlat", () => {
  test("fires when all notes are clearly flat", () => {
    const notes = multiKeyPattern(2, () => -30);
    const out = globalFlat(session(notes, 2));
    expect(out).toHaveLength(1);
    expect(out[0].detectorId).toBe("global-flat");
    expect(out[0].severity).toBeLessThan(-20);
    expect(out[0].evidenceText).toMatch(/flat/);
  });

  test("does NOT fire on small random scatter", () => {
    const notes = multiKeyPattern(2, (_k, p) => (p % 2 === 0 ? 8 : -5));
    expect(globalFlat(session(notes, 2))).toEqual([]);
  });
});

describe("highNoteFlat", () => {
  test("fires when top tertile averages >= -25 cents flat", () => {
    // 9 notes, ascending midis; top three get -35 cents.
    const notes: NoteObservation[] = [];
    for (let i = 0; i < 9; i++) {
      notes.push(obs({ keyIndex: 0, notePosition: i, targetMidi: 60 + i, signedCents: i >= 6 ? -35 : 0 }));
    }
    const out = highNoteFlat(session(notes));
    expect(out).toHaveLength(1);
    expect(out[0].detectorId).toBe("high-note-flat");
    expect(out[0].severity).toBeLessThan(-25);
    expect(out[0].evidenceText).toMatch(/high notes/);
  });

  test("does NOT fire when high notes are in tune", () => {
    const notes: NoteObservation[] = [];
    for (let i = 0; i < 9; i++) {
      notes.push(obs({ keyIndex: 0, notePosition: i, targetMidi: 60 + i, signedCents: 5 }));
    }
    expect(highNoteFlat(session(notes))).toEqual([]);
  });
});

describe("highNoteSharp", () => {
  test("fires when top tertile averages > +25 cents sharp", () => {
    const notes: NoteObservation[] = [];
    for (let i = 0; i < 9; i++) {
      notes.push(obs({ keyIndex: 0, notePosition: i, targetMidi: 60 + i, signedCents: i >= 6 ? 35 : 2 }));
    }
    const out = highNoteSharp(session(notes));
    expect(out).toHaveLength(1);
    expect(out[0].detectorId).toBe("high-note-sharp");
    expect(out[0].severity).toBeGreaterThan(25);
  });

  test("does NOT fire on a clean session", () => {
    const notes: NoteObservation[] = [];
    for (let i = 0; i < 9; i++) {
      notes.push(obs({ keyIndex: 0, notePosition: i, targetMidi: 60 + i, signedCents: 0 }));
    }
    expect(highNoteSharp(session(notes))).toEqual([]);
  });
});

describe("lowNoteFlat", () => {
  test("fires when bottom tertile is flat", () => {
    const notes: NoteObservation[] = [];
    for (let i = 0; i < 9; i++) {
      notes.push(obs({ keyIndex: 0, notePosition: i, targetMidi: 60 + i, signedCents: i <= 2 ? -35 : 2 }));
    }
    const out = lowNoteFlat(session(notes));
    expect(out).toHaveLength(1);
    expect(out[0].detectorId).toBe("low-note-flat");
    expect(out[0].severity).toBeLessThan(-25);
  });

  test("does NOT fire when low notes are in tune", () => {
    const notes: NoteObservation[] = [];
    for (let i = 0; i < 9; i++) {
      notes.push(obs({ keyIndex: 0, notePosition: i, targetMidi: 60 + i, signedCents: 4 }));
    }
    expect(lowNoteFlat(session(notes))).toEqual([]);
  });
});

describe("registerMismatch", () => {
  test("fires when chest is sharp and head is flat with sufficient gap", () => {
    const notes: NoteObservation[] = [];
    // 9 notes ascending; bottom tertile +25, top tertile -25 -> gap = 50
    for (let i = 0; i < 9; i++) {
      let cents = 0;
      if (i <= 2) cents = 25;
      else if (i >= 6) cents = -25;
      notes.push(obs({ keyIndex: 0, notePosition: i, targetMidi: 60 + i, signedCents: cents }));
    }
    const out = registerMismatch(session(notes));
    expect(out).toHaveLength(1);
    expect(out[0].detectorId).toBe("register-mismatch");
    expect(out[0].severity).toBeGreaterThanOrEqual(40);
    expect(out[0].evidenceText).toMatch(/chest/);
    expect(out[0].evidenceText).toMatch(/head/);
  });

  test("does NOT fire when both registers drift the same direction", () => {
    const notes: NoteObservation[] = [];
    for (let i = 0; i < 9; i++) {
      const cents = i <= 2 ? 25 : i >= 6 ? 30 : 5;
      notes.push(obs({ keyIndex: 0, notePosition: i, targetMidi: 60 + i, signedCents: cents }));
    }
    expect(registerMismatch(session(notes))).toEqual([]);
  });
});

describe("phraseEndFlat", () => {
  test("fires when last note of each key is consistently flat", () => {
    // 4 keys, 5 notes each; last note per key (position 4) at -30
    const notes = multiKeyPattern(4, (_k, p) => (p === 4 ? -30 : 0));
    const out = phraseEndFlat(session(notes, 4));
    expect(out).toHaveLength(1);
    expect(out[0].detectorId).toBe("phrase-end-flat");
    expect(out[0].observations).toBe(4);
    expect(out[0].evidenceText).toMatch(/last note/);
  });

  test("does NOT fire when phrase ends are in tune", () => {
    const notes = multiKeyPattern(4, () => 0);
    expect(phraseEndFlat(session(notes, 4))).toEqual([]);
  });
});

describe("positionConsistent", () => {
  test("fires when one position is off across multiple keys", () => {
    const notes = multiKeyPattern(4, (_k, p) => (p === 2 ? -45 : 0));
    const out = positionConsistent(session(notes, 4));
    expect(out).toHaveLength(1);
    expect(out[0].detectorId).toBe("position-consistent");
    expect(out[0].evidenceText).toMatch(/3rd note/);
    expect(out[0].evidenceText).toMatch(/4 keys/);
  });

  test("does NOT fire when positions are clean across keys", () => {
    const notes = multiKeyPattern(4, () => 5);
    expect(positionConsistent(session(notes, 4))).toEqual([]);
  });
});

describe("keyFatigueDrift", () => {
  test("fires when accuracy degrades linearly across keys", () => {
    // 6 keys; mean abs cents grows by ~10 per key from 5 to 55.
    const notes: NoteObservation[] = [];
    for (let k = 0; k < 6; k++) {
      const c = 5 + k * 10;
      for (let p = 0; p < 4; p++) {
        notes.push(obs({ keyIndex: k, notePosition: p, targetMidi: 60 + p, signedCents: c }));
      }
    }
    const out = keyFatigueDrift(session(notes, 6));
    expect(out).toHaveLength(1);
    expect(out[0].detectorId).toBe("key-fatigue-drift");
    expect(out[0].severity).toBeGreaterThan(5);
    expect(out[0].evidenceText).toMatch(/last 2 keys/);
  });

  test("does NOT fire when keys are flat-line in accuracy", () => {
    const notes: NoteObservation[] = [];
    for (let k = 0; k < 6; k++) {
      for (let p = 0; p < 4; p++) {
        notes.push(obs({ keyIndex: k, notePosition: p, targetMidi: 60 + p, signedCents: 5 }));
      }
    }
    expect(keyFatigueDrift(session(notes, 6))).toEqual([]);
  });
});
