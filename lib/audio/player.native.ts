// Salamander grand piano for iOS/Android via react-native-audio-api.
// Samples are bundled in assets/salamander/ and decoded once on init().
// For notes without an exact sample, we pitch-shift the nearest buffer via
// playbackRate = 2^(semitoneOffset/12), capped to ±6 semitones per sample.

import {
  AudioContext,
  AudioBuffer,
  AudioBufferSourceNode,
  GainNode,
} from "react-native-audio-api";
import { midiToHz } from "../exercises/music";
import type { NoteEvent } from "../exercises/types";
import type { AudioPlayer, LatencyInfo, NoteHandle, SequenceHandle } from "./player";

// Each entry: [midi, require()] — Metro resolves the static require at build time.
const SAMPLE_ENTRIES: Array<[number, number]> = [
  [33, require("../../assets/salamander/A1.mp3") as number], // A1  midi=33
  [36, require("../../assets/salamander/C2.mp3") as number], // C2  midi=36
  [45, require("../../assets/salamander/A2.mp3") as number], // A2  midi=45
  [48, require("../../assets/salamander/C3.mp3") as number], // C3  midi=48
  [57, require("../../assets/salamander/A3.mp3") as number], // A3  midi=57
  [60, require("../../assets/salamander/C4.mp3") as number], // C4  midi=60
  [69, require("../../assets/salamander/A4.mp3") as number], // A4  midi=69
  [72, require("../../assets/salamander/C5.mp3") as number], // C5  midi=72
];

// Pitch-shift is capped so we never stretch more than ±6 semitones from a sample.
const MAX_SEMITONE_SHIFT = 6;

interface SampleBuffer {
  midi: number;
  buffer: AudioBuffer;
}

interface ActiveSource {
  src: AudioBufferSourceNode;
  env: GainNode;
}

export class NativeAudioPlayer implements AudioPlayer {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private masterVolume = 0.85;
  private ready = false;
  private samples: SampleBuffer[] = [];
  private active: ActiveSource[] = [];

  async init(): Promise<void> {
    if (this.ready) return;
    this.ctx = new AudioContext();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.masterVolume;
    this.master.connect(this.ctx.destination);

    // Decode all samples in parallel; filter out any that fail (graceful degradation).
    const results = await Promise.allSettled(
      SAMPLE_ENTRIES.map(async ([midi, assetId]) => {
        const buf = await this.ctx!.decodeAudioData(assetId);
        return { midi, buffer: buf } as SampleBuffer;
      }),
    );
    this.samples = results
      .filter((r): r is PromiseFulfilledResult<SampleBuffer> => r.status === "fulfilled")
      .map((r) => r.value);

    this.ready = true;
  }

  isReady(): boolean {
    return this.ready;
  }

  playNote(noteName: string, durationSec: number, velocity = 0.85): void {
    if (!this.ctx) throw new Error("AudioPlayer not initialized");
    const midi = midiFromName(noteName);
    this.triggerNote(midi, this.ctx.currentTime, durationSec, velocity);
  }

  playSequence(events: NoteEvent[], startAt = 0): SequenceHandle {
    if (!this.ctx) throw new Error("AudioPlayer not initialized");
    const ctx = this.ctx;
    const t0 = ctx.currentTime + Math.max(0.05, startAt);
    const snapshot: ActiveSource[] = [];

    for (const e of events) {
      const midi = e.hzOverride != null ? hzToMidi(e.hzOverride) : e.midi;
      const srcs = this.triggerNote(midi, t0 + e.startTime, e.duration, e.velocity);
      snapshot.push(...srcs);
    }

    const totalDur = events.reduce(
      (m, e) => Math.max(m, e.startTime + e.duration),
      0,
    );

    let stopped = false;
    return {
      stop: () => {
        if (stopped) return;
        stopped = true;
        const now = ctx.currentTime;
        for (const { src, env } of snapshot) {
          try {
            env.gain.cancelScheduledValues(now);
            env.gain.setValueAtTime(0, now);
            src.stop(now + 0.01);
          } catch { /* already stopped */ }
        }
      },
      getCurrentTime: () => Math.max(0, ctx.currentTime - t0),
      getProgress: () =>
        totalDur > 0 ? Math.min(1, (ctx.currentTime - t0) / totalDur) : 0,
    };
  }

  holdNote(noteName: string, velocity = 0.85, hzOverride?: number): NoteHandle {
    if (!this.ctx || !this.master) throw new Error("AudioPlayer not initialized");
    const ctx = this.ctx;
    const midi = hzOverride != null ? hzToMidi(hzOverride) : midiFromName(noteName);
    const startTime = ctx.currentTime;

    const sample = this.nearestSample(midi);
    if (!sample) {
      // No samples loaded — silent stub that satisfies the interface.
      let released = false;
      return { release: () => { released = true; }, isReleased: () => released };
    }

    const { src, env } = this.buildSource(sample, midi, startTime, velocity, true);
    this.active.push({ src, env });

    let released = false;
    return {
      release: () => {
        if (released) return;
        released = true;
        const now = ctx.currentTime;
        env.gain.cancelScheduledValues(now);
        env.gain.setValueAtTime(env.gain.value, now);
        env.gain.linearRampToValueAtTime(0, now + 0.12);
        try { src.stop(now + 0.15); } catch { /* already stopped */ }
      },
      isReleased: () => released,
    };
  }

  setMasterVolume(value: number): void {
    this.masterVolume = Math.max(0, Math.min(1, value));
    if (this.master && this.ctx) {
      this.master.gain.linearRampToValueAtTime(
        this.masterVolume,
        this.ctx.currentTime + 0.05,
      );
    }
  }

  // rn-audio-api does not expose outputLatency / baseLatency
  getLatencyInfo(): LatencyInfo | null {
    return null;
  }

  async dispose(): Promise<void> {
    if (this.ctx) {
      const now = this.ctx.currentTime;
      for (const { src } of this.active) {
        try { src.stop(now); } catch { /* noop */ }
      }
      await this.ctx.close();
    }
    this.active = [];
    this.samples = [];
    this.ctx = null;
    this.master = null;
    this.ready = false;
  }

  // Schedules a note event and returns the created sources (for cancel tracking).
  private triggerNote(
    midi: number,
    startTime: number,
    duration: number,
    velocity: number,
  ): ActiveSource[] {
    const sample = this.nearestSample(midi);
    if (!sample) return [];
    const voice = this.buildSource(sample, midi, startTime, velocity, false);
    const attack = 0.015;
    const release = Math.min(0.10, duration * 0.25);
    const sustain = Math.max(0.01, duration - attack - release);

    voice.env.gain.setValueAtTime(0, startTime);
    voice.env.gain.linearRampToValueAtTime(velocity, startTime + attack);
    voice.env.gain.setValueAtTime(velocity, startTime + attack + sustain);
    voice.env.gain.linearRampToValueAtTime(0, startTime + duration);

    voice.src.start(startTime);
    // Allow natural decay; stop a little after to free resources.
    try { voice.src.stop(startTime + duration + 0.05); } catch { /* noop */ }

    this.active.push(voice);
    return [voice];
  }

  // Constructs an AudioBufferSourceNode wired to master but does NOT call start().
  // `hold` = true leaves the envelope open (caller handles release).
  private buildSource(
    sample: SampleBuffer,
    targetMidi: number,
    startTime: number,
    velocity: number,
    hold: boolean,
  ): ActiveSource {
    const ctx = this.ctx!;
    const master = this.master!;

    const src = ctx.createBufferSource();
    src.buffer = sample.buffer;

    // Pitch-shift via playbackRate: clamp to ±MAX_SEMITONE_SHIFT.
    const semitoneOffset = Math.max(
      -MAX_SEMITONE_SHIFT,
      Math.min(MAX_SEMITONE_SHIFT, targetMidi - sample.midi),
    );
    src.playbackRate.value = Math.pow(2, semitoneOffset / 12);

    const env = ctx.createGain();
    env.gain.value = 0;

    if (hold) {
      // Attack only; caller triggers release.
      env.gain.setValueAtTime(0, startTime);
      env.gain.linearRampToValueAtTime(velocity, startTime + 0.015);
      src.start(startTime);
    }

    src.connect(env);
    env.connect(master);

    return { src, env };
  }

  private nearestSample(midi: number): SampleBuffer | null {
    if (this.samples.length === 0) return null;
    return this.samples.reduce((best, s) =>
      Math.abs(s.midi - midi) < Math.abs(best.midi - midi) ? s : best,
    );
  }
}

export function createAudioPlayer(): AudioPlayer {
  return new NativeAudioPlayer();
}

function midiFromName(name: string): number {
  const NAME_TO_PC: Record<string, number> = {
    C: 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3, E: 4,
    F: 5, "F#": 6, Gb: 6, G: 7, "G#": 8, Ab: 8, A: 9,
    "A#": 10, Bb: 10, B: 11,
  };
  const m = /^([A-Ga-g])([#b]?)(-?\d+)$/.exec(name.trim());
  if (!m) throw new Error(`Invalid note name: ${name}`);
  const pc = NAME_TO_PC[m[1].toUpperCase() + m[2]];
  return (parseInt(m[3], 10) + 1) * 12 + pc;
}

function hzToMidi(hz: number): number {
  return Math.round(69 + 12 * Math.log2(hz / 440));
}
