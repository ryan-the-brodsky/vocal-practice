import { describe, expect, it } from "@jest/globals";
import { resolveDetectorTuning } from "../tuning";

describe("resolveDetectorTuning", () => {
  it("returns sustained defaults for long notes (>= 0.30 s)", () => {
    const t = resolveDetectorTuning({ noteSec: 0.5 });
    expect(t).toEqual({ clarityThreshold: 0.85, smoothingFrames: 5, octaveJumpFrames: 3 });
  });

  it("returns sustained defaults exactly at the threshold (0.30 s)", () => {
    const t = resolveDetectorTuning({ noteSec: 0.30 });
    expect(t).toEqual({ clarityThreshold: 0.85, smoothingFrames: 5, octaveJumpFrames: 3 });
  });

  it("returns the fast profile for short notes (< 0.30 s)", () => {
    const t = resolveDetectorTuning({ noteSec: 0.20 });
    expect(t.clarityThreshold).toBeLessThan(0.85);
    expect(t.octaveJumpFrames).toBeLessThan(3);
  });

  it("returns the fast profile for very short notes", () => {
    const t = resolveDetectorTuning({ noteSec: 0.10 });
    expect(t.clarityThreshold).toBeLessThan(0.85);
    expect(t.octaveJumpFrames).toBeLessThan(3);
  });

  it("explicit scoringHints win on the sustained path", () => {
    const t = resolveDetectorTuning({
      noteSec: 0.7,
      hints: { clarityThreshold: 0.55, octaveJumpFrames: 2, smoothingFrames: 7 },
    });
    expect(t).toEqual({ clarityThreshold: 0.55, smoothingFrames: 7, octaveJumpFrames: 2 });
  });

  it("explicit scoringHints win on the fast path", () => {
    const t = resolveDetectorTuning({
      noteSec: 0.15,
      hints: { clarityThreshold: 0.90 },
    });
    expect(t.clarityThreshold).toBe(0.90);
    // Other knobs still get the fast profile.
    expect(t.octaveJumpFrames).toBeLessThan(3);
  });

  it("partial hints fill missing fields from the resolved base", () => {
    const t = resolveDetectorTuning({
      noteSec: 0.20,
      hints: { octaveJumpFrames: 2 },
    });
    expect(t.octaveJumpFrames).toBe(2);
    // clarity + smoothing still from FAST base
    expect(t.clarityThreshold).toBeLessThan(0.85);
  });

  it("falls back to sustained defaults for invalid noteSec", () => {
    const t = resolveDetectorTuning({ noteSec: 0 });
    expect(t.clarityThreshold).toBe(0.85);
    const t2 = resolveDetectorTuning({ noteSec: -1 });
    expect(t2.clarityThreshold).toBe(0.85);
  });
});
