import { PitchPostprocessor } from "../postprocess";

describe("PitchPostprocessor — clarity gate", () => {
  it("emits hz: null when clarity < threshold", () => {
    const pp = new PitchPostprocessor(0.85);
    const out = pp.push(440, 0.5, 0.1, 0);
    expect(out.hz).toBeNull();
    expect(out.midi).toBeNull();
    expect(out.cents).toBeNull();
    // clarity is preserved on the emitted sample even when gated
    expect(out.clarity).toBe(0.5);
  });

  it("emits hz: null when rawHz <= 0 even with high clarity", () => {
    const pp = new PitchPostprocessor(0.85);
    expect(pp.push(0, 0.95, 0.1, 0).hz).toBeNull();
    expect(pp.push(-100, 0.95, 0.1, 0).hz).toBeNull();
  });

  it("emits hz: null when rawHz is NaN or Infinity", () => {
    const pp = new PitchPostprocessor(0.85);
    expect(pp.push(NaN, 0.95, 0.1, 0).hz).toBeNull();
    expect(pp.push(Infinity, 0.95, 0.1, 0).hz).toBeNull();
  });

  it("rmsDb is reported in dB, with -Infinity for zero linear amplitude", () => {
    const pp = new PitchPostprocessor(0.85);
    const out = pp.push(440, 0.95, 0, 0);
    expect(out.rmsDb).toBe(-Infinity);
    const out2 = pp.push(440, 0.95, 0.1, 20);
    // 20·log10(0.1) = -20 dB
    expect(out2.rmsDb).toBeCloseTo(-20, 6);
  });
});

describe("PitchPostprocessor — median filter", () => {
  it("a single outlier among 5 stable frames does not shift the median", () => {
    const pp = new PitchPostprocessor(0.85, 5, 3);
    // Establish 5 stable frames of 220 Hz (A3). Ring fills with 220.
    for (let i = 0; i < 5; i++) {
      const s = pp.push(220, 0.95, 0.1, i * 20);
      expect(s.hz).toBeCloseTo(220, 1);
    }
    // 1 outlier at 233 Hz (~1 semitone up — within octave gate so it lands in median).
    const out = pp.push(233, 0.95, 0.1, 100);
    // Sorted ring: [220,220,220,220,233] → median is the middle 220.
    expect(out.hz).toBeCloseTo(220, 1);
  });

  it("3 consecutive outliers shift the median to the new pitch", () => {
    const pp = new PitchPostprocessor(0.85, 5, 3);
    for (let i = 0; i < 5; i++) pp.push(220, 0.95, 0.1, i * 20);
    pp.push(233, 0.95, 0.1, 100); // sorted ring still 5×220 → 1×233
    pp.push(233, 0.95, 0.1, 120); // 3×220 → 2×233 → median = 220
    const out = pp.push(233, 0.95, 0.1, 140);
    // Ring now has 2×220, 3×233. Sorted middle = 233.
    expect(out.hz).toBeCloseTo(233, 1);
  });

  it("midi/cents on the output are computed from the median, not the raw input", () => {
    const pp = new PitchPostprocessor(0.85, 5, 3);
    // First sample also passes octave gate (no baseline), then median = first sample.
    const out = pp.push(440, 0.95, 0.1, 0);
    expect(out.hz).toBeCloseTo(440, 1);
    expect(out.midi).toBe(69);  // A4
    expect(out.cents).toBeCloseTo(0, 1);
  });
});

describe("PitchPostprocessor — octave-jump constraint", () => {
  it("accepts the very first frame unconditionally (no baseline yet)", () => {
    const pp = new PitchPostprocessor(0.85, 5, 3);
    const out = pp.push(880, 0.95, 0.1, 0); // any pitch, no prior baseline
    expect(out.hz).toBeCloseTo(880, 1);
  });

  it("requires octaveJumpFrames consecutive same-pitch frames to accept a >=12 semitone jump", () => {
    const pp = new PitchPostprocessor(0.85, 5, 3);
    pp.push(220, 0.95, 0.1, 0);    // baseline established at 220 (A3)
    pp.push(220, 0.95, 0.1, 20);
    // Jumping to 440 (exactly 12 semitones up) — gate engages.
    expect(pp.push(440, 0.95, 0.1, 40).hz).toBeNull();  // candidate, count=1
    expect(pp.push(440, 0.95, 0.1, 60).hz).toBeNull();  // count=2
    // Third confirmation: jump accepted, sample passes through median filter.
    expect(pp.push(440, 0.95, 0.1, 80).hz).not.toBeNull();
  });

  it("a different candidate pitch resets the confirmation count", () => {
    const pp = new PitchPostprocessor(0.85, 5, 3);
    pp.push(220, 0.95, 0.1, 0);
    pp.push(220, 0.95, 0.1, 20);
    // Start a 440 candidate (count=1).
    expect(pp.push(440, 0.95, 0.1, 40).hz).toBeNull();
    // Switch to 880 (different pitch, outside 0.5-st tolerance) → candidate resets.
    expect(pp.push(880, 0.95, 0.1, 60).hz).toBeNull();
    // Now go back to 440 — count restarts at 1.
    expect(pp.push(440, 0.95, 0.1, 80).hz).toBeNull();   // count=1
    expect(pp.push(440, 0.95, 0.1, 100).hz).toBeNull();  // count=2
    expect(pp.push(440, 0.95, 0.1, 120).hz).not.toBeNull(); // count=3 → accept
  });
});

describe("PitchPostprocessor — live config setters", () => {
  it("setOctaveJumpFrames lowers the confirmation requirement live", () => {
    const pp = new PitchPostprocessor(0.85, 5, 3);
    pp.push(220, 0.95, 0.1, 0); // baseline
    pp.setOctaveJumpFrames(2);
    expect(pp.push(440, 0.95, 0.1, 20).hz).toBeNull();  // count=1
    expect(pp.push(440, 0.95, 0.1, 40).hz).not.toBeNull(); // count=2 ≥ 2 → accept
  });

  it("setClarityThreshold lets less-confident frames through after the call", () => {
    const pp = new PitchPostprocessor(0.85);
    expect(pp.push(440, 0.7, 0.1, 0).hz).toBeNull(); // gated by clarity
    pp.setClarityThreshold(0.6);
    expect(pp.push(440, 0.7, 0.1, 20).hz).not.toBeNull();
  });
});

describe("PitchPostprocessor — reset & timestamps", () => {
  it("setStartTime normalizes pushed timestamps to detector-relative ms", () => {
    const pp = new PitchPostprocessor();
    pp.setStartTime(1000);
    const out = pp.push(440, 0.95, 0.1, 1234);
    expect(out.timestamp).toBe(234);
  });

  it("reset() clears median, jump candidate, and start time so the next frame is unconditional", () => {
    const pp = new PitchPostprocessor(0.85, 5, 3);
    pp.setStartTime(1000);
    pp.push(220, 0.95, 0.1, 1100);
    pp.push(220, 0.95, 0.1, 1120);
    pp.reset();
    // After reset, the first frame is accepted regardless of distance from prior baseline.
    const out = pp.push(880, 0.95, 0.1, 0);
    expect(out.hz).toBeCloseTo(880, 1);
    // startTimeMs is also cleared → ts falls back to 0.
    expect(out.timestamp).toBe(0);
  });
});
