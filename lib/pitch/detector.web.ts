// Web pitch detector: getUserMedia → AnalyserNode → pitchy (MPM) → PitchPostprocessor
// Uses requestAnimationFrame for the polling loop; AudioContext is lazy-created on start()
// to comply with autoplay policy (must be called after a user gesture).

import { PitchDetector as PitchyDetector } from "pitchy";
import type {
  PitchDetector,
  PitchDetectorOptions,
  PitchListener,
  PitchSample,
} from "./detector";
import { PitchPostprocessor } from "./postprocess";

export function createPitchDetector(opts: PitchDetectorOptions = {}): PitchDetector {
  const fftSize = opts.fftSize ?? 4096;
  const clarityThreshold = opts.clarityThreshold ?? 0.85;
  const smoothingFrames = opts.smoothingFrames ?? 5;
  const octaveJumpFrames = opts.octaveJumpFrames ?? 3;

  const listeners = new Set<PitchListener>();
  const postprocessor = new PitchPostprocessor(clarityThreshold, smoothingFrames, octaveJumpFrames);

  let audioContext: AudioContext | null = null;
  let stream: MediaStream | null = null;
  let rafId: number | null = null;
  let active = false;

  // Dev-only raw capture: a continuous ScriptProcessor tap on the same source.
  let rawCaptureEnabled = false;
  let captureNode: ScriptProcessorNode | null = null;
  let captureChunks: Float32Array[] = [];
  let captureSampleRate = 0;

  // Reuse a single Float32Array for the time-domain buffer (allocated after start()).
  // Explicit ArrayBuffer (not SharedArrayBuffer) so DOM types match.
  let timeDomainBuf: Float32Array<ArrayBuffer> | null = null;
  let pitchyDetector: PitchyDetector<Float32Array> | null = null;

  function emit(sample: PitchSample): void {
    listeners.forEach((fn) => fn(sample));
  }

  // Compute RMS from a Float32Array of PCM samples
  function computeRms(buf: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < buf.length; i++) {
      sum += buf[i]! * buf[i]!;
    }
    return Math.sqrt(sum / buf.length);
  }

  function poll(analyser: AnalyserNode): void {
    if (!active) return;

    analyser.getFloatTimeDomainData(timeDomainBuf!);
    const [rawHz, clarity] = pitchyDetector!.findPitch(
      timeDomainBuf!,
      audioContext!.sampleRate   // read dynamically — Safari may use 48 kHz
    );
    const rms = computeRms(timeDomainBuf!);
    const sample = postprocessor.push(rawHz, clarity, rms, performance.now());
    emit(sample);

    rafId = requestAnimationFrame(() => poll(analyser));
  }

  return {
    async start(): Promise<void> {
      if (active) return;

      // Lazy-create AudioContext on first call (satisfies autoplay policy)
      audioContext = new AudioContext();

      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = fftSize;
      analyser.smoothingTimeConstant = 0; // pitchy does its own smoothing
      source.connect(analyser);

      // Raw capture: tap the same source with a continuous ScriptProcessor so
      // every sample is recorded gap-free (the RAF analyser read overlaps/skips).
      if (rawCaptureEnabled) {
        captureChunks = [];
        captureSampleRate = audioContext.sampleRate;
        captureNode = audioContext.createScriptProcessor(4096, 1, 1);
        captureNode.onaudioprocess = (e) => {
          if (rawCaptureEnabled) {
            captureChunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
          }
          // Silence the output so the mic isn't echoed to the speakers.
          e.outputBuffer.getChannelData(0).fill(0);
        };
        source.connect(captureNode);
        // ScriptProcessor only fires while connected to a destination.
        captureNode.connect(audioContext.destination);
      }

      // Allocate against ArrayBuffer (not SharedArrayBuffer) so DOM type matches.
      timeDomainBuf = new Float32Array(new ArrayBuffer(fftSize * 4));
      pitchyDetector = PitchyDetector.forFloat32Array(fftSize);

      postprocessor.reset();
      postprocessor.setStartTime(performance.now());

      active = true;
      rafId = requestAnimationFrame(() => poll(analyser));
    },

    async stop(): Promise<void> {
      if (!active) return;
      active = false;

      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }

      // Disconnect the capture tap before closing the context. captureChunks /
      // captureSampleRate are kept so getRawCapture() works after stop().
      if (captureNode) {
        captureNode.onaudioprocess = null;
        captureNode.disconnect();
        captureNode = null;
      }

      stream?.getTracks().forEach((t) => t.stop());
      stream = null;

      await audioContext?.close();
      audioContext = null;

      timeDomainBuf = null;
      pitchyDetector = null;
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

    enableRawCapture(): void {
      rawCaptureEnabled = true;
    },

    getRawCapture(): { pcm: Float32Array; sampleRate: number } | null {
      if (!rawCaptureEnabled || captureChunks.length === 0) return null;
      const total = captureChunks.reduce((n, c) => n + c.length, 0);
      const pcm = new Float32Array(total);
      let offset = 0;
      for (const chunk of captureChunks) {
        pcm.set(chunk, offset);
        offset += chunk.length;
      }
      return { pcm, sampleRate: captureSampleRate };
    },
  };
}
