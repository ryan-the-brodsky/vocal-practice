import * as Tone from "tone";
import type { NotePitchTrace } from "../scoring/types";
import type { SequenceHandle } from "./player";
import type { TracePlayer } from "./tracePlayer";

const RELEASE_TAIL_SEC = 0.18;

export class WebTracePlayer implements TracePlayer {
  private osc: Tone.Oscillator | null = null;
  private envelope: Tone.AmplitudeEnvelope | null = null;
  private gain: Tone.Gain | null = null;
  private ready = false;

  async init(): Promise<void> {
    if (this.ready) return;
    await Tone.start();
    this.gain = new Tone.Gain(0.6).toDestination();
    this.envelope = new Tone.AmplitudeEnvelope({
      attack: 0.04,
      decay: 0.1,
      sustain: 1.0,
      release: RELEASE_TAIL_SEC,
    }).connect(this.gain);
    this.osc = new Tone.Oscillator({ frequency: 440, type: "triangle" }).connect(this.envelope);
    this.osc.start();
    this.ready = true;
  }

  isReady(): boolean {
    return this.ready;
  }

  playTrace(trace: NotePitchTrace[], startAtSec = 0): SequenceHandle {
    if (!this.osc || !this.envelope) throw new Error("TracePlayer not initialized");
    const transport = Tone.getTransport();
    if (transport.state !== "started") transport.start();

    const t0 = transport.seconds + Math.max(0.05, startAtSec);
    const ids: number[] = [];
    let stopped = false;

    if (trace.length === 0) {
      // Nothing to play — return an inert handle.
      return makeInertHandle();
    }

    const osc = this.osc;
    const env = this.envelope;
    const lastTMs = trace[trace.length - 1].tMs;
    const totalDur = lastTMs / 1000 + RELEASE_TAIL_SEC;

    // Schedule the per-frame frequency set first; setValueAtTime holds the last
    // frequency through any gaps.
    for (const frame of trace) {
      const at = t0 + frame.tMs / 1000;
      const id = transport.scheduleOnce((time) => {
        osc.frequency.setValueAtTime(frame.hz, time);
      }, at);
      ids.push(id);
    }

    // Trigger envelope at start, release after the last frame.
    ids.push(
      transport.scheduleOnce((time) => {
        osc.frequency.setValueAtTime(trace[0].hz, time);
        env.triggerAttack(time);
      }, t0),
    );
    ids.push(
      transport.scheduleOnce((time) => {
        env.triggerRelease(time);
      }, t0 + lastTMs / 1000),
    );

    return {
      stop: () => {
        if (stopped) return;
        stopped = true;
        for (const id of ids) transport.clear(id);
        env.triggerRelease();
      },
      getCurrentTime: () => Math.max(0, transport.seconds - t0),
      getProgress: () =>
        totalDur > 0 ? Math.min(1, (transport.seconds - t0) / totalDur) : 0,
    };
  }

  async dispose(): Promise<void> {
    this.osc?.stop();
    this.osc?.dispose();
    this.envelope?.dispose();
    this.gain?.dispose();
    this.osc = null;
    this.envelope = null;
    this.gain = null;
    this.ready = false;
  }
}

export function createTracePlayer(): TracePlayer {
  return new WebTracePlayer();
}

function makeInertHandle(): SequenceHandle {
  return {
    stop: () => {},
    getCurrentTime: () => 0,
    getProgress: () => 1,
  };
}
