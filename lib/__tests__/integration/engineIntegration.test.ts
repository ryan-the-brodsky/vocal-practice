// Integration tests stitching SessionTracker → Scorer → alignAndScore → diagnoseSession.
// Synthetic PitchSample[] flows through the real engine end-to-end; no audio I/O.
// Each scenario asserts both the per-key scoring shape AND the resulting Diagnosis ranking.

import { SessionTracker, type KeyStartInfo } from "@/lib/session/tracker";
import { buildKeyIterations, melodyMidisFromIteration } from "@/test/fixtures/keyIterations";
import {
  samplesFromMidiSequence,
  falseStart,
  type SynthOptions,
} from "@/test/fixtures/pitchSamples";
import { fromKeyAttempts } from "@/lib/coaching/engine/sessionInput";
import { diagnoseSession } from "@/lib/coaching/engine/diagnose";
import type { KeyIteration } from "@/lib/exercises/types";
import type { PitchSample } from "@/lib/pitch/detector";
import type { KeyAttemptResult } from "@/lib/scoring/types";
import type { Diagnosis } from "@/lib/coaching/engine/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildKeyStarts(iters: KeyIteration[]): KeyStartInfo[] {
  let t = 0;
  return iters.map((iter) => {
    const start = t;
    t += iter.totalDurationSec;
    return { tonic: iter.tonic, startTime: start };
  });
}

interface PerKeyOpts extends SynthOptions {
  /** Use the falseStart preset (100ms low-clarity wobble before melody). */
  useFalseStart?: boolean;
}

function samplesForKey(
  iter: KeyIteration,
  keyStartSec: number,
  opts: PerKeyOpts = {},
): PitchSample[] {
  const melodyEvents = iter.events.filter((e) => e.type === "melody");
  const melody = melodyEvents.map((e) => e.midi);
  const leadInMs = iter.melodyStartSec * 1000;
  // Match the engine's planned per-note duration so total melody time fits the iter window.
  const plannedNoteMs = (melodyEvents[0]?.duration ?? 0.5) * 1000;
  const { useFalseStart, ...synth } = opts;
  const synthOpts: SynthOptions = { perNoteMs: plannedNoteMs, ...synth };
  const raw = useFalseStart ? falseStart(melody, synthOpts) : samplesFromMidiSequence(melody, synthOpts);
  const offsetMs = keyStartSec * 1000 + leadInMs;
  // 20ms safety against floating-point boundary races between keys.
  const overflowMs = (keyStartSec + iter.totalDurationSec) * 1000 - 20;
  return raw
    .map((s) => ({ ...s, timestamp: s.timestamp + offsetMs }))
    .filter((s) => s.timestamp < overflowMs)
    .sort((a, b) => a.timestamp - b.timestamp);
}

interface ScenarioResult {
  keyAttempts: KeyAttemptResult[];
  diagnoses: Diagnosis[];
}

function runScenario(iters: KeyIteration[], perKey: PerKeyOpts[]): ScenarioResult {
  const keyStarts = buildKeyStarts(iters);
  const tracker = new SessionTracker(iters, keyStarts, 0, 0);
  for (let i = 0; i < iters.length; i++) {
    for (const s of samplesForKey(iters[i]!, keyStarts[i]!.startTime, perKey[i] ?? {})) {
      tracker.pushSample(s);
    }
  }
  const keyAttempts = tracker.finalize();
  const sessionInput = fromKeyAttempts(keyAttempts, iters);
  const diagnoses = diagnoseSession(sessionInput);
  return { keyAttempts, diagnoses };
}

// ---------------------------------------------------------------------------
// Scenarios
// ---------------------------------------------------------------------------

describe("Engine integration", () => {
  it("Scenario 1 — perfect five-note scale across 2 keys → high accuracy, no significant diagnoses", () => {
    // five-note-scale-mee-may-mah has direction "both" — tighten to a 2-key window.
    const iters = buildKeyIterations({
      exerciseId: "five-note-scale-mee-may-mah",
      voicePart: "tenor",
      startTonicMidi: 55, // G3
      endTonicMidi: 56,   // G#3
    });
    const used = iters.slice(0, 2); // ascending portion: 2 keys
    expect(used.map((i) => i.tonic)).toEqual(["G3", "G#3"]);

    const { keyAttempts, diagnoses } = runScenario(used, [{}, {}]);

    expect(keyAttempts.length).toBe(2);
    for (const k of keyAttempts) {
      expect(k.meanAccuracyPct).toBeGreaterThan(95);
      expect(Math.abs(k.meanCentsDeviation)).toBeLessThan(10);
    }
    // No mean-cents-driven diagnosis should fire on a clean trace. positionConsistent
    // requires ≥3 keys; keyFatigueDrift requires ≥4. With 2 keys, only the global /
    // tertile detectors are eligible — and all should pass on |mean| < threshold.
    const meaningful = diagnoses.filter(
      (d) => d.detectorId !== "position-consistent" && Math.abs(d.severity) > 20,
    );
    if (meaningful.length > 0) {
      // eslint-disable-next-line no-console
      console.error("Scenario 1 unexpected diagnoses:", meaningful);
    }
    expect(meaningful).toEqual([]);
  });

  it("Scenario 2 — Goog octave arpeggio 60¢ flat → meanCents ≈ -60, top diagnosis is global-flat", () => {
    const iters = buildKeyIterations({
      exerciseId: "goog-octave-arpeggio",
      voicePart: "tenor",
      startTonicMidi: 50, // D3
      endTonicMidi: 52,   // E3
    });
    const used = iters.slice(0, 3);
    expect(used.length).toBe(3);

    const { keyAttempts, diagnoses } = runScenario(
      used,
      used.map(() => ({ centsOffset: -60 })),
    );

    expect(keyAttempts.length).toBe(3);
    for (const k of keyAttempts) {
      for (const n of k.notes) {
        expect(n.framesAboveClarity).toBeGreaterThan(0);
        expect(n.meanCentsDeviation).toBeCloseTo(-60, 0);
      }
      expect(k.meanAccuracyPct).toBeLessThan(50);
    }

    expect(diagnoses.length).toBeGreaterThan(0);
    expect(diagnoses[0]!.detectorId).toBe("global-flat");
    expect(diagnoses[0]!.severity).toBeCloseTo(-60, 0);
  });

  it("Scenario 3 — octave-leap with high note 60¢ flat → top diagnosis is high-note-flat or register-mismatch", () => {
    const iters = buildKeyIterations({
      exerciseId: "octave-leap-wow",
      voicePart: "tenor",
      startTonicMidi: 50, // D3
      endTonicMidi: 52,   // E3
    });
    // direction "both" → 5 iterations. All produce a [low, high, low] pattern.
    expect(iters.length).toBe(5);

    const perKey: PerKeyOpts[] = iters.map(() => ({
      // Pattern is [tonic, tonic+12, tonic]. Flat the upper note only.
      perNoteCents: [0, -60, 0],
    }));
    const { keyAttempts, diagnoses } = runScenario(iters, perKey);

    expect(keyAttempts.length).toBe(5);
    // High note (position 1) should be ~60¢ flat on every key; low notes in tune.
    for (const k of keyAttempts) {
      expect(k.notes[1]!.meanCentsDeviation).toBeCloseTo(-60, 0);
      expect(Math.abs(k.notes[0]!.meanCentsDeviation)).toBeLessThan(10);
      expect(Math.abs(k.notes[2]!.meanCentsDeviation)).toBeLessThan(10);
    }

    expect(diagnoses.length).toBeGreaterThan(0);
    expect(["high-note-flat", "register-mismatch"]).toContain(diagnoses[0]!.detectorId);
  });

  it("Scenario 4 — false-start wobble is filtered; scores match the perfect-trace baseline", () => {
    const iters = buildKeyIterations({
      exerciseId: "five-note-scale-mee-may-mah",
      voicePart: "tenor",
      startTonicMidi: 55,
      endTonicMidi: 55,
    });
    const used = iters.slice(0, 1); // exactly one key
    expect(used.length).toBe(1);

    const baseline = runScenario(used, [{}]);
    const wobbly = runScenario(used, [{ useFalseStart: true }]);

    expect(wobbly.keyAttempts.length).toBe(baseline.keyAttempts.length);
    expect(wobbly.keyAttempts[0]!.meanAccuracyPct).toBeGreaterThan(80);
    // The wobble should not pollute scoring — accuracy stays within 5% of baseline.
    expect(
      Math.abs(
        wobbly.keyAttempts[0]!.meanAccuracyPct - baseline.keyAttempts[0]!.meanAccuracyPct,
      ),
    ).toBeLessThan(5);
  });

  it("Scenario 5 — accuracy drift across 4 ascending keys → top diagnosis is key-fatigue-drift", () => {
    const iters = buildKeyIterations({
      exerciseId: "five-note-scale-mee-may-mah",
      voicePart: "tenor",
      startTonicMidi: 55, // G3
      endTonicMidi: 58,   // A#3 — 4 ascending keys
    });
    const used = iters.slice(0, 4);
    expect(used.map((i) => i.tonic)).toEqual(["G3", "G#3", "A3", "A#3"]);

    // Offsets chosen so:
    //  - globalFlat's coverage check fails (only 1/4 keys is flat ≥ 10¢ — 9/36 = 0.25 < 0.6 threshold)
    //  - keyFatigueDrift's linear-regression slope + r² clear the gates
    //  - keyFatigueDrift outranks competing detectors (highNoteFlat / phraseEndFlat) on
    //    severity × ln(N+1) × consistencyFactor.
    const offsets = [0, 0, 0, -150];
    const { diagnoses } = runScenario(used, offsets.map((c) => ({ centsOffset: c })));

    expect(diagnoses.length).toBeGreaterThan(0);
    expect(diagnoses[0]!.detectorId).toBe("key-fatigue-drift");
  });
});
