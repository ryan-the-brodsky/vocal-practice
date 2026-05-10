// Unit-project smoke test: proves Jest projects split + ts-jest still work,
// and that the fixture infrastructure imports + runs cleanly.

import { samplesFromMidiSequence, inTune, flat, octaveOff } from "../../test/fixtures/pitchSamples";
import { buildKeyIterations, melodyMidisFromIteration } from "../../test/fixtures/keyIterations";

describe("test infrastructure smoke", () => {
  it("samplesFromMidiSequence emits ~30 frames per 600 ms note at 50 fps", () => {
    const samples = samplesFromMidiSequence([60, 64, 67]);
    // 3 notes * 600 ms / 20 ms per frame ≈ 90 frames
    expect(samples.length).toBeGreaterThanOrEqual(85);
    expect(samples.length).toBeLessThanOrEqual(95);
    // Timestamps must be strictly monotonic.
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i].timestamp).toBeGreaterThan(samples[i - 1].timestamp);
    }
  });

  it("inTune produces samples whose midi rounds to each target", () => {
    const targets = [60, 64, 67];
    const samples = inTune(targets);
    // Every sample's midi must be one of the targets (no octave drift, no detune).
    samples.forEach((s) => {
      expect(targets).toContain(s.midi);
    });
  });

  it("flat shifts samples ~50 cents below target", () => {
    const samples = flat([60], 50);
    // Mid-stream sample (skip vibrato edges) — cents should be ≈ -50.
    const mid = samples[Math.floor(samples.length / 2)];
    // After cents-collapse, a -50¢ note centers on midi 60 with cents -50,
    // OR rounds to midi 59 with cents +50. Either is a valid representation.
    const isFlatRepresentation =
      (mid.midi === 60 && mid.cents !== null && mid.cents <= -45) ||
      (mid.midi === 59 && mid.cents !== null && mid.cents >= 45);
    expect(isFlatRepresentation).toBe(true);
  });

  it("octaveOff drops the targeted note an octave", () => {
    const samples = octaveOff([60, 72], 1);
    // First note centers on midi 60; second should round to midi 60 (was 72, dropped 12).
    const firstNoteSamples = samples.slice(0, samples.length / 2);
    const secondNoteSamples = samples.slice(samples.length / 2);
    const firstMidis = new Set(firstNoteSamples.map((s) => s.midi));
    const secondMidis = new Set(secondNoteSamples.map((s) => s.midi));
    expect(firstMidis.has(60)).toBe(true);
    expect(secondMidis.has(60)).toBe(true);
    expect(secondMidis.has(72)).toBe(false);
  });

  it("buildKeyIterations + melodyMidisFromIteration round-trip an exercise", () => {
    const iterations = buildKeyIterations({
      exerciseId: "five-note-scale-mee-may-mah",
      voicePart: "tenor",
      startTonicMidi: 48, // C3
      endTonicMidi: 48,
    });
    expect(iterations.length).toBeGreaterThan(0);
    const midis = melodyMidisFromIteration(iterations[0]);
    expect(midis.length).toBeGreaterThan(0);
    // Every melody midi should be within ±36 semitones of the tonic.
    midis.forEach((m) => {
      expect(Math.abs(m - iterations[0].tonicMidi)).toBeLessThan(36);
    });
  });
});
