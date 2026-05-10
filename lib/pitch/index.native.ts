import { createPitchDetector as realCreate } from "./detector.native";
import type { PitchDetector, PitchDetectorOptions } from "./detector";

export type {
  PitchSample,
  PitchListener,
  PitchDetector,
  PitchDetectorOptions,
} from "./detector";

let factory: (opts?: PitchDetectorOptions) => PitchDetector = realCreate;

export const createPitchDetector = (opts?: PitchDetectorOptions): PitchDetector => factory(opts);

export const __setPitchDetectorFactory = (
  f: (opts?: PitchDetectorOptions) => PitchDetector
): void => {
  factory = f;
};
export const __resetPitchDetectorFactory = (): void => {
  factory = realCreate;
};

export { PitchPostprocessor } from "./postprocess";
