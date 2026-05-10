// iOS pitch detector using react-native-audio-api v0.11.7
//
// Implementation choice: AudioRecorder.onAudioReady callback path (JS thread).
// WorkletProcessingNode in 0.11.7 has an essentially empty TypeScript declaration
// (just `class WorkletProcessingNode extends AudioNode {}`), which makes it
// unsafe to rely on for cross-version compatibility. The onAudioReady callback
// path is fully documented, delivers Float32Array PCM buffers, and runs pitchy
// on the JS thread via setInterval-style delivery — adequate for 50-120 ms
// latency targets. Switch to WorkletProcessingNode when its API stabilises.
//
// Buffer size: we request fftSize samples per callback. If the device delivers
// smaller buffers we accumulate them; if larger we slice and process window-sized
// chunks. AudioContext is created on start() (must follow a user gesture on iOS).

import { AudioContext, AudioRecorder } from "react-native-audio-api";
import { PitchDetector as PitchyDetector } from "pitchy";
import type {
  PitchDetector,
  PitchDetectorOptions,
  PitchListener,
  PitchSample,
} from "./detector";
import { PitchPostprocessor } from "./postprocess";

// Default sample rate hint; AudioContext may override based on hardware
const DEFAULT_SAMPLE_RATE = 44100;

export function createPitchDetector(opts: PitchDetectorOptions = {}): PitchDetector {
  const fftSize = opts.fftSize ?? 4096;
  const clarityThreshold = opts.clarityThreshold ?? 0.85;
  const smoothingFrames = opts.smoothingFrames ?? 5;
  const octaveJumpFrames = opts.octaveJumpFrames ?? 3;

  const listeners = new Set<PitchListener>();
  const postprocessor = new PitchPostprocessor(clarityThreshold, smoothingFrames, octaveJumpFrames);

  let audioContext: AudioContext | null = null;
  let recorder: AudioRecorder | null = null;
  let active = false;

  // Accumulation buffer for sub-fftSize deliveries
  let accumBuf = new Float32Array(fftSize);
  let accumCount = 0;

  let pitchyDetector: PitchyDetector<Float32Array> | null = null;
  let actualSampleRate = DEFAULT_SAMPLE_RATE;
  let startTimeMs = 0;

  function emit(sample: PitchSample): void {
    listeners.forEach((fn) => fn(sample));
  }

  function computeRms(buf: Float32Array, len: number): number {
    let sum = 0;
    for (let i = 0; i < len; i++) {
      sum += buf[i]! * buf[i]!;
    }
    return Math.sqrt(sum / len);
  }

  // Process a full fftSize window from the accumulation buffer
  function processWindow(): void {
    const [rawHz, clarity] = pitchyDetector!.findPitch(accumBuf, actualSampleRate);
    const rms = computeRms(accumBuf, fftSize);
    const sample = postprocessor.push(rawHz, clarity, rms, Date.now());
    emit(sample);
  }

  return {
    async start(): Promise<void> {
      if (active) return;

      // AudioContext must be created after a user gesture on iOS
      audioContext = new AudioContext();
      actualSampleRate = audioContext.sampleRate;

      pitchyDetector = PitchyDetector.forFloat32Array(fftSize);
      accumBuf = new Float32Array(fftSize);
      accumCount = 0;

      recorder = new AudioRecorder();
      startTimeMs = Date.now();

      postprocessor.reset();
      postprocessor.setStartTime(startTimeMs);

      // onAudioReady delivers PCM Float32Array buffers from the mic
      recorder.onAudioReady(
        {
          sampleRate: actualSampleRate,
          bufferLength: fftSize,  // hint; device may deliver different sizes
          channelCount: 1,
        },
        (event) => {
          if (!active) return;

          const channelData = event.buffer.getChannelData(0);
          let srcOffset = 0;
          let remaining = channelData.length;

          // Consume the incoming data in fftSize-aligned chunks
          while (remaining > 0) {
            const space = fftSize - accumCount;
            const toCopy = Math.min(space, remaining);

            accumBuf.set(channelData.subarray(srcOffset, srcOffset + toCopy), accumCount);
            accumCount += toCopy;
            srcOffset += toCopy;
            remaining -= toCopy;

            if (accumCount === fftSize) {
              processWindow();
              accumCount = 0;
            }
          }
        }
      );

      recorder.start();
      active = true;
    },

    async stop(): Promise<void> {
      if (!active) return;
      active = false;

      recorder?.clearOnAudioReady();
      recorder?.stop();
      recorder = null;

      await audioContext?.close();
      audioContext = null;

      pitchyDetector = null;
      accumCount = 0;
      postprocessor.reset();
    },

    isActive(): boolean {
      return active;
    },

    on(listener: PitchListener): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    setClarityThreshold(value: number): void {
      postprocessor.setClarityThreshold(value);
    },

    setOctaveJumpFrames(value: number): void {
      postprocessor.setOctaveJumpFrames(value);
    },
  };
}
