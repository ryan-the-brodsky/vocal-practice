import type { NotePitchTrace } from "../scoring/types";
import type { SequenceHandle } from "./player";
import type { TracePlayer } from "./tracePlayer";

// Stub matching the deferred-iOS pattern of player.native.ts.
// AudioParam.setValueAtTime is available in react-native-audio-api 0.11.7,
// so the real impl mirrors WebTracePlayer using OscillatorNode directly.
class NativeTracePlayerStub implements TracePlayer {
  async init(): Promise<void> {}
  isReady(): boolean {
    return false;
  }
  playTrace(_trace: NotePitchTrace[], _startAtSec?: number): SequenceHandle {
    throw new Error("TracePlayer not yet implemented on native — use the web build for coaching playback.");
  }
  async dispose(): Promise<void> {}
}

export function createTracePlayer(): TracePlayer {
  return new NativeTracePlayerStub();
}
