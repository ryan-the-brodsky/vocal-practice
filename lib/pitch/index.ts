// Platform-agnostic barrel export for the pitch-detection module.
//
// Expo Metro resolves platform extensions at bundle time:
//   detector.web.ts    → web
//   detector.native.ts → iOS / Android
//
// TypeScript checks against detector.ts (which declares the factory stub).
// At runtime Metro substitutes the correct platform implementation.

export type {
  PitchSample,
  PitchListener,
  PitchDetector,
  PitchDetectorOptions,
} from "./detector";

// Factory: Metro resolves detector.web.ts / detector.native.ts automatically
export { createPitchDetector } from "./detector";

export { PitchPostprocessor } from "./postprocess";
