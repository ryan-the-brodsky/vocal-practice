import type { NoteEvent } from "../exercises/types";

export interface SequenceHandle {
  stop(): void;
  getCurrentTime(): number;
  getProgress(): number;
}

export interface NoteHandle {
  release(): void;
  isReleased(): boolean;
}

export interface LatencyInfo {
  outputLatencyMs: number;
  baseLatencyMs: number;
}

export interface AudioPlayer {
  init(): Promise<void>;
  isReady(): boolean;
  playNote(noteName: string, durationSec: number, velocity?: number): void;
  playSequence(events: NoteEvent[], startAt?: number): SequenceHandle;
  // Sustain a single note until the returned handle's release() is called.
  // Used by guided mode where the piano holds until the singer matches pitch.
  holdNote(noteName: string, velocity?: number, hzOverride?: number): NoteHandle;
  setMasterVolume(value: number): void;
  getLatencyInfo(): LatencyInfo | null;
  dispose(): Promise<void>;
}
