// Shared interface, types, and factory stub for pitch detection.
// The actual createPitchDetector implementation lives in detector.web.ts /
// detector.native.ts; Metro resolves the correct file at bundle time.
// TypeScript checks against this file, so we declare the factory signature here.

export interface PitchSample {
  hz: number | null;
  midi: number | null;
  cents: number | null;       // signed deviation from nearest semitone, -50..+50
  clarity: number;            // 0..1
  rmsDb: number;              // approx -inf..0
  timestamp: number;          // ms since detector.start()
}

export type PitchListener = (sample: PitchSample) => void;

export interface PitchDetector {
  start(): Promise<void>;
  stop(): Promise<void>;
  isActive(): boolean;
  on(listener: PitchListener): () => void;  // returns unsubscribe fn
  setClarityThreshold(value: number): void;
  setOctaveJumpFrames(value: number): void;
}

export interface PitchDetectorOptions {
  fftSize?: number;           // default 4096
  clarityThreshold?: number;  // default 0.85
  smoothingFrames?: number;   // default 5 — median filter window
  octaveJumpFrames?: number;  // default 3 — frames a jump must persist before accepted
}

// Factory stub — implementation provided by detector.web.ts / detector.native.ts
// Import this from consuming code; Metro resolves to the correct platform file.
export declare function createPitchDetector(opts?: PitchDetectorOptions): PitchDetector;
