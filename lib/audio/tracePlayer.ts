import type { NotePitchTrace } from "../scoring/types";
import type { SequenceHandle } from "./player";

export interface TracePlayer {
  init(): Promise<void>;
  isReady(): boolean;
  playTrace(trace: NotePitchTrace[], startAtSec?: number): SequenceHandle;
  dispose(): Promise<void>;
}
