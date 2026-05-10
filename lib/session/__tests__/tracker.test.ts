import { SessionTracker, type KeyStartInfo } from "../tracker";
import { samplesFromMidiSequence, inTune } from "@/test/fixtures/pitchSamples";
import { midiToNote, noteToMidi } from "@/lib/exercises/music";
import type { KeyIteration, NoteEvent } from "@/lib/exercises/types";
import type { PitchSample } from "@/lib/pitch/detector";

// ---------------------------------------------------------------------------
// Hand-built KeyIteration fixtures keep tests focused on routing behavior.
// ---------------------------------------------------------------------------

interface MakeIterOpts {
  tonic: string;
  melodyMidis: number[];
  cueDurSec?: number;
  perNoteSec?: number;
}

function makeIter({
  tonic,
  melodyMidis,
  cueDurSec = 1,
  perNoteSec = 0.5,
}: MakeIterOpts): KeyIteration {
  const events: NoteEvent[] = melodyMidis.map((m, i) => ({
    type: "melody",
    noteName: midiToNote(m),
    midi: m,
    startTime: cueDurSec + i * perNoteSec,
    duration: perNoteSec,
    velocity: 0.95,
    syllable: `s${i}`,
  }));
  return {
    tonic,
    tonicMidi: noteToMidi(tonic),
    events,
    totalDurationSec: cueDurSec + melodyMidis.length * perNoteSec,
    melodyStartSec: cueDurSec,
    cueDurationSec: cueDurSec,
  };
}

function buildKeyStarts(iters: KeyIteration[]): KeyStartInfo[] {
  let t = 0;
  return iters.map((it) => {
    const start = t;
    t += it.totalDurationSec;
    return { tonic: it.tonic, startTime: start };
  });
}

/** Synthesize samples that land inside key i's melody window. */
function samplesForKey(
  iters: KeyIteration[],
  keyStarts: KeyStartInfo[],
  keyIdx: number,
  melodyMidis: number[],
  opts: { centsOffset?: number; perNoteMs?: number } = {},
): PitchSample[] {
  const keyStartMs = keyStarts[keyIdx]!.startTime * 1000;
  const leadInMs = iters[keyIdx]!.melodyStartSec * 1000;
  // shift each timestamp into session-relative time
  const raw = samplesFromMidiSequence(melodyMidis, {
    perNoteMs: opts.perNoteMs ?? 500,
    centsOffset: opts.centsOffset ?? 0,
  });
  return raw.map((s) => ({ ...s, timestamp: s.timestamp + keyStartMs + leadInMs }));
}

// ---------------------------------------------------------------------------

const KEY_A = makeIter({ tonic: "C3", melodyMidis: [48, 50, 52, 53, 55] });
const KEY_B = makeIter({ tonic: "C#3", melodyMidis: [49, 51, 53, 54, 56] });
const KEY_C = makeIter({ tonic: "D3", melodyMidis: [50, 52, 54, 55, 57] });

describe("SessionTracker — construction & routing", () => {
  it("constructs one Scorer per KeyIteration; finalize returns one KeyAttemptResult per scored key", () => {
    const iters = [KEY_A, KEY_B];
    const keyStarts = buildKeyStarts(iters);
    const tracker = new SessionTracker(iters, keyStarts, 0, 0);

    for (const s of samplesForKey(iters, keyStarts, 0, [48, 50, 52, 53, 55])) {
      tracker.pushSample(s);
    }
    for (const s of samplesForKey(iters, keyStarts, 1, [49, 51, 53, 54, 56])) {
      tracker.pushSample(s);
    }

    const completed = tracker.finalize();
    expect(completed.length).toBe(2);
    expect(completed[0]!.tonic).toBe("C3");
    expect(completed[1]!.tonic).toBe("C#3");
  });

  it("routes samples to the correct key by sessionRelMs against keyStarts", () => {
    const iters = [KEY_A, KEY_B];
    const keyStarts = buildKeyStarts(iters);
    const tracker = new SessionTracker(iters, keyStarts, 0, 0);

    // All samples for key 0 (in tune): expect ~100% accuracy on key 0.
    for (const s of samplesForKey(iters, keyStarts, 0, [48, 50, 52, 53, 55])) {
      tracker.pushSample(s);
    }
    // All samples for key 1 (50¢ flat): expect lower accuracy on key 1.
    for (const s of samplesForKey(iters, keyStarts, 1, [49, 51, 53, 54, 56], { centsOffset: -50 })) {
      tracker.pushSample(s);
    }

    const completed = tracker.finalize();
    expect(completed[0]!.meanAccuracyPct).toBeGreaterThan(90);
    expect(completed[1]!.meanAccuracyPct).toBeLessThan(50);
  });

  it("crossing a key boundary finalizes the prior key's Scorer (visible via snapshot)", () => {
    const iters = [KEY_A, KEY_B];
    const keyStarts = buildKeyStarts(iters);
    const tracker = new SessionTracker(iters, keyStarts, 0, 0);

    for (const s of samplesForKey(iters, keyStarts, 0, [48, 50, 52, 53, 55])) {
      tracker.pushSample(s);
    }
    // Mid-stream: only key 0 has samples → no completed keys yet (still "current").
    expect(tracker.getSnapshot(2.0).completedKeys.length).toBe(0);

    // Push first sample for key 1 — boundary cross finalizes key 0.
    const firstBSample = samplesForKey(iters, keyStarts, 1, [49])[0]!;
    tracker.pushSample(firstBSample);
    const snap = tracker.getSnapshot(KEY_A.totalDurationSec + 1.5);
    expect(snap.completedKeys.length).toBe(1);
    expect(snap.completedKeys[0]!.tonic).toBe("C3");
    expect(snap.currentKeyIndex).toBe(1);
  });
});

describe("SessionTracker — edge cases", () => {
  it("ignores samples with sessionRelMs < 0", () => {
    const iters = [KEY_A];
    const keyStarts = buildKeyStarts(iters);
    // detector started at t=0, audio started at t=2000 — early detector samples have negative session time.
    const tracker = new SessionTracker(iters, keyStarts, 2000, 0);

    // Sample at detector-relative t=500 → sessionRelMs = 0 + 500 - 2000 = -1500 → dropped.
    tracker.pushSample({
      hz: 261.63, midi: 60, cents: 0, clarity: 0.95, rmsDb: -20, timestamp: 500,
    });
    // Now push a real in-window sample for key 0's melody:
    for (const s of samplesForKey(iters, keyStarts, 0, [48, 50, 52, 53, 55])) {
      tracker.pushSample({ ...s, timestamp: s.timestamp + 2000 });
    }

    const completed = tracker.finalize();
    expect(completed.length).toBe(1);
    // The single early-bad sample shouldn't have polluted scoring.
    expect(completed[0]!.meanAccuracyPct).toBeGreaterThan(80);
  });

  it("pushSample after finalize() is a no-op", () => {
    const iters = [KEY_A];
    const keyStarts = buildKeyStarts(iters);
    const tracker = new SessionTracker(iters, keyStarts, 0, 0);

    for (const s of samplesForKey(iters, keyStarts, 0, [48, 50, 52, 53, 55])) {
      tracker.pushSample(s);
    }
    const firstFinalize = tracker.finalize();
    const firstAccuracy = firstFinalize[0]!.meanAccuracyPct;

    // Push a wildly-wrong sample after finalize.
    tracker.pushSample({
      hz: 100, midi: 43, cents: 0, clarity: 0.95, rmsDb: -20, timestamp: 100,
    });
    const secondFinalize = tracker.finalize();
    expect(secondFinalize[0]!.meanAccuracyPct).toBe(firstAccuracy);
  });

  it("finalize() drops keys with no scored frames", () => {
    const iters = [KEY_A, KEY_B];
    const keyStarts = buildKeyStarts(iters);
    const tracker = new SessionTracker(iters, keyStarts, 0, 0);

    // Only feed samples for key 0; key 1 stays empty.
    for (const s of samplesForKey(iters, keyStarts, 0, [48, 50, 52, 53, 55])) {
      tracker.pushSample(s);
    }
    const completed = tracker.finalize();
    expect(completed.length).toBe(1);
    expect(completed[0]!.tonic).toBe("C3");
  });
});

describe("SessionTracker — snapshots", () => {
  it("getSnapshot reflects current key index and reports running mean accuracy after a key completes", () => {
    const iters = [KEY_A, KEY_B];
    const keyStarts = buildKeyStarts(iters);
    const tracker = new SessionTracker(iters, keyStarts, 0, 0);

    // Initial snapshot — nothing pushed yet.
    const initial = tracker.getSnapshot(0);
    expect(initial.currentKeyIndex).toBe(0);
    expect(initial.totalKeys).toBe(2);
    expect(initial.currentTonic).toBe("C3");
    expect(initial.completedKeys.length).toBe(0);
    expect(initial.meanAccuracyPct).toBe(0);

    for (const s of samplesForKey(iters, keyStarts, 0, [48, 50, 52, 53, 55])) {
      tracker.pushSample(s);
    }
    // Push one sample for key 1 to flip the boundary and finalize key 0.
    tracker.pushSample(samplesForKey(iters, keyStarts, 1, [49])[0]!);

    const snap = tracker.getSnapshot(KEY_A.totalDurationSec + 1);
    expect(snap.completedKeys.length).toBe(1);
    expect(snap.meanAccuracyPct).toBeGreaterThan(80);
  });

  it("snapshot's currentNoteIndex advances within the active key", () => {
    const iters = [KEY_A];
    const keyStarts = buildKeyStarts(iters);
    const tracker = new SessionTracker(iters, keyStarts, 0, 0);
    // Note 0 of KEY_A starts at t=1.0, note 1 at t=1.5, note 2 at t=2.0, etc.
    expect(tracker.getSnapshot(1.1).currentNoteIndex).toBe(0);
    expect(tracker.getSnapshot(1.6).currentNoteIndex).toBe(1);
    expect(tracker.getSnapshot(2.6).currentNoteIndex).toBe(3);
  });
});

describe("SessionTracker — three-key pipeline", () => {
  it("finalize covers all three keys when each receives in-tune samples", () => {
    const iters = [KEY_A, KEY_B, KEY_C];
    const keyStarts = buildKeyStarts(iters);
    const tracker = new SessionTracker(iters, keyStarts, 0, 0);

    for (let k = 0; k < iters.length; k++) {
      const midis = iters[k]!.events.filter((e) => e.type === "melody").map((e) => e.midi);
      for (const s of samplesForKey(iters, keyStarts, k, midis)) tracker.pushSample(s);
    }
    const completed = tracker.finalize();
    expect(completed.map((k) => k.tonic)).toEqual(["C3", "C#3", "D3"]);
    for (const key of completed) expect(key.meanAccuracyPct).toBeGreaterThan(80);
  });
});
