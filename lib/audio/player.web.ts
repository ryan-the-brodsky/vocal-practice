import * as Tone from "tone";
import type { NoteEvent } from "../exercises/types";
import type { AudioPlayer, LatencyInfo, NoteHandle, SequenceHandle } from "./player";

const SALAMANDER_BASE = "https://tonejs.github.io/audio/salamander/";

const SAMPLE_MAP: Record<string, string> = {
  A1: "A1.mp3",
  C2: "C2.mp3",
  "D#2": "Ds2.mp3",
  "F#2": "Fs2.mp3",
  A2: "A2.mp3",
  C3: "C3.mp3",
  "D#3": "Ds3.mp3",
  "F#3": "Fs3.mp3",
  A3: "A3.mp3",
  C4: "C4.mp3",
  "D#4": "Ds4.mp3",
  "F#4": "Fs4.mp3",
  A4: "A4.mp3",
  C5: "C5.mp3",
  "D#5": "Ds5.mp3",
  "F#5": "Fs5.mp3",
  A5: "A5.mp3",
  C6: "C6.mp3",
  "D#6": "Ds6.mp3",
  "F#6": "Fs6.mp3",
  A6: "A6.mp3",
};

export class WebAudioPlayer implements AudioPlayer {
  private sampler: Tone.Sampler | null = null;
  private gain: Tone.Gain | null = null;
  private masterVolume = 0.85;
  private ready = false;

  async init(): Promise<void> {
    if (this.ready) return;
    await Tone.start();
    this.gain = new Tone.Gain(this.masterVolume).toDestination();
    this.sampler = new Tone.Sampler({
      urls: SAMPLE_MAP,
      baseUrl: SALAMANDER_BASE,
      release: 1,
    }).connect(this.gain);
    await Tone.loaded();
    this.ready = true;
  }

  isReady(): boolean {
    return this.ready;
  }

  playNote(noteName: string, durationSec: number, velocity = 0.85): void {
    if (!this.sampler) throw new Error("AudioPlayer not initialized");
    this.sampler.triggerAttackRelease(noteName, durationSec, undefined, velocity);
  }

  playSequence(events: NoteEvent[], startAt = 0): SequenceHandle {
    if (!this.sampler) throw new Error("AudioPlayer not initialized");
    const sampler = this.sampler;
    const transport = Tone.getTransport();

    // Schedule against Tone.Transport so we can cancel pending events on stop.
    // Transport time runs continuously once started; offset by current transport seconds.
    if (transport.state !== "started") transport.start();
    const t0 = transport.seconds + Math.max(0.05, startAt);
    const ids: number[] = [];
    let stopped = false;

    for (const e of events) {
      const pitch: string | number = e.hzOverride ?? e.noteName;
      const id = transport.scheduleOnce((time) => {
        sampler.triggerAttackRelease(pitch, e.duration, time, e.velocity);
      }, t0 + e.startTime);
      ids.push(id);
    }

    const totalDur = events.reduce(
      (m, e) => Math.max(m, e.startTime + e.duration),
      0,
    );

    return {
      stop: () => {
        if (stopped) return;
        stopped = true;
        // Cancel any pending Transport events that haven't fired yet.
        for (const id of ids) transport.clear(id);
        // Cut any notes currently sounding.
        sampler.releaseAll();
      },
      getCurrentTime: () => Math.max(0, transport.seconds - t0),
      getProgress: () =>
        totalDur > 0
          ? Math.min(1, (transport.seconds - t0) / totalDur)
          : 0,
    };
  }

  holdNote(noteName: string, velocity = 0.85, hzOverride?: number): NoteHandle {
    if (!this.sampler) throw new Error("AudioPlayer not initialized");
    const sampler = this.sampler;
    const pitch: string | number = hzOverride ?? noteName;
    let released = false;
    sampler.triggerAttack(pitch, undefined, velocity);
    return {
      release: () => {
        if (released) return;
        released = true;
        sampler.triggerRelease(pitch);
      },
      isReleased: () => released,
    };
  }

  setMasterVolume(value: number): void {
    this.masterVolume = Math.max(0, Math.min(1, value));
    if (this.gain) this.gain.gain.rampTo(this.masterVolume, 0.05);
  }

  getLatencyInfo(): LatencyInfo | null {
    try {
      const ctx = Tone.getContext().rawContext as AudioContext;
      return {
        outputLatencyMs: (ctx.outputLatency ?? 0) * 1000,
        baseLatencyMs: (ctx.baseLatency ?? 0) * 1000,
      };
    } catch {
      return null;
    }
  }

  async dispose(): Promise<void> {
    this.sampler?.dispose();
    this.gain?.dispose();
    this.sampler = null;
    this.gain = null;
    this.ready = false;
  }
}

export function createAudioPlayer(): AudioPlayer {
  return new WebAudioPlayer();
}
