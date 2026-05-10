import type { PitchDetector, PitchListener, PitchSample } from "../detector";
import { sniffMicrophone } from "../sniff";

interface FakeDetector extends PitchDetector {
  emit: (sample: PitchSample) => void;
  startCalls: number;
  stopCalls: number;
}

function makeFakeDetector(opts: { failStart?: boolean } = {}): FakeDetector {
  const listeners = new Set<PitchListener>();
  const detector: FakeDetector = {
    startCalls: 0,
    stopCalls: 0,
    async start() {
      detector.startCalls += 1;
      if (opts.failStart) throw new Error("Permission denied");
    },
    async stop() {
      detector.stopCalls += 1;
    },
    isActive() {
      return detector.startCalls > detector.stopCalls;
    },
    on(listener: PitchListener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    setClarityThreshold() {},
    setOctaveJumpFrames() {},
    emit(sample) {
      for (const l of listeners) l(sample);
    },
  };
  return detector;
}

describe("sniffMicrophone", () => {
  it("returns ok=true with the rmsDb of the first emitted sample", async () => {
    const detector = makeFakeDetector();
    const promise = sniffMicrophone(() => detector, 500);
    // Wait a tick so detector.start() resolves and the listener subscribes.
    await Promise.resolve();
    detector.emit({
      hz: 220,
      midi: 57,
      cents: 0,
      clarity: 0.95,
      rmsDb: -22,
      timestamp: 12,
    });
    const result = await promise;

    expect(result.ok).toBe(true);
    expect(result.rmsDb).toBe(-22);
    expect(detector.stopCalls).toBe(1);
  });

  it("returns ok=false with the start error when the detector rejects", async () => {
    const detector = makeFakeDetector({ failStart: true });
    const result = await sniffMicrophone(() => detector, 200);

    expect(result.ok).toBe(false);
    expect(result.rmsDb).toBeNull();
    expect(result.error).toBe("Permission denied");
    // start() rejected — we never called stop(), so no cleanup needed.
    expect(detector.stopCalls).toBe(0);
  });

  it("returns ok=false on timeout when no sample arrives", async () => {
    jest.useFakeTimers();
    try {
      const detector = makeFakeDetector();
      const promise = sniffMicrophone(() => detector, 100);
      // start() is async — flush the microtask before advancing timers.
      await Promise.resolve();
      jest.advanceTimersByTime(150);
      const result = await promise;

      expect(result.ok).toBe(false);
      expect(result.rmsDb).toBeNull();
      expect(result.error).toMatch(/timeout/i);
      expect(detector.stopCalls).toBe(1);
    } finally {
      jest.useRealTimers();
    }
  });
});
