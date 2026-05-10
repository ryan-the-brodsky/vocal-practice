import { createAudioPlayer as realCreate } from "./player.native";
import type { AudioPlayer } from "./player";

let factory: () => AudioPlayer = realCreate;

export const createAudioPlayer = (): AudioPlayer => factory();

export const __setAudioPlayerFactory = (f: () => AudioPlayer): void => {
  factory = f;
};
export const __resetAudioPlayerFactory = (): void => {
  factory = realCreate;
};

export type { AudioPlayer, NoteHandle, SequenceHandle } from "./player";
export type { TracePlayer } from "./tracePlayer";
export { createTracePlayer } from "./tracePlayer.native";
