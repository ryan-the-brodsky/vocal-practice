import { createAudioPlayer as realCreate } from "./player.web";
import type { AudioPlayer } from "./player";

let factory: () => AudioPlayer = realCreate;

export const createAudioPlayer = (): AudioPlayer => factory();

// Test seam — do not import in feature code.
export const __setAudioPlayerFactory = (f: () => AudioPlayer): void => {
  factory = f;
};
export const __resetAudioPlayerFactory = (): void => {
  factory = realCreate;
};

export type { AudioPlayer, NoteHandle, SequenceHandle } from "./player";
export type { TracePlayer } from "./tracePlayer";
export { createTracePlayer } from "./tracePlayer.web";
