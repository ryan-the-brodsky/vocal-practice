// Web pitch detector: getUserMedia → pitchy (MPM) → PitchPostprocessor.
// Detection is driven by an AudioWorklet whose process() runs on the audio
// rendering thread, so sampling keeps going when the tab is backgrounded
// (requestAnimationFrame is paused for hidden tabs — the old loop froze there).
// A RAF/AnalyserNode loop remains as a fallback for browsers without AudioWorklet.
// AudioContext is lazy-created on start() to comply with autoplay policy.

import { PitchDetector as PitchyDetector } from "pitchy";
import type {
  PitchDetector,
  PitchDetectorOptions,
  PitchListener,
  PitchSample,
} from "./detector";
import { PitchPostprocessor } from "./postprocess";

// Worklet that forwards each render quantum of mic PCM to the main thread.
// Posting frames (not pitch results) keeps pitchy on the main thread, so the
// existing pitchy import chain doesn't need to be bundled into the worklet.
const CAPTURE_WORKLET_SRC = `
class PitchCaptureProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0];
    if (input && input[0] && input[0].length) {
      this.port.postMessage(input[0].slice());
    }
    return true;
  }
}
registerProcessor('pitch-capture-processor', PitchCaptureProcessor);
`;

export function createPitchDetector(opts: PitchDetectorOptions = {}): PitchDetector {
  const fftSize = opts.fftSize ?? 4096;
  const clarityThreshold = opts.clarityThreshold ?? 0.85;
  const smoothingFrames = opts.smoothingFrames ?? 5;
  const octaveJumpFrames = opts.octaveJumpFrames ?? 3;

  const listeners = new Set<PitchListener>();
  const postprocessor = new PitchPostprocessor(clarityThreshold, smoothingFrames, octaveJumpFrames);

  let audioContext: AudioContext | null = null;
  let stream: MediaStream | null = null;
  let workletNode: AudioWorkletNode | null = null;
  let rafId: number | null = null;
  let active = false;

  // Dev-only raw capture: a continuous ScriptProcessor tap on the same source.
  let rawCaptureEnabled = false;
  let captureNode: ScriptProcessorNode | null = null;
  let captureChunks: Float32Array[] = [];
  let captureSampleRate = 0;

  // Rolling time-domain window (most recent fftSize samples) + the hop counter
  // that throttles detection to ~60 Hz to match the cadence the postprocessor
  // was tuned against. Explicit ArrayBuffer (not SharedArrayBuffer) for DOM types.
  let timeDomainBuf: Float32Array<ArrayBuffer> | null = null;
  let pitchyDetector: PitchyDetector<Float32Array> | null = null;
  let hopSamples = 0;
  let samplesSinceEmit = 0;

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

  // Run one detection over the current fftSize window and emit the result.
  function runDetection(): void {
    const [rawHz, clarity] = pitchyDetector!.findPitch(
      timeDomainBuf!,
      audioContext!.sampleRate   // read dynamically — Safari may use 48 kHz
    );
    const rms = computeRms(timeDomainBuf!);
    emit(postprocessor.push(rawHz, clarity, rms, performance.now()));
  }

  // AudioWorklet path: append the incoming quantum to the rolling window, then
  // detect once we've accumulated a hop's worth of new samples.
  function onWorkletFrame(frame: Float32Array): void {
    if (!active) return;
    const n = frame.length;
    if (n >= fftSize) {
      timeDomainBuf!.set(frame.subarray(n - fftSize));
    } else {
      timeDomainBuf!.copyWithin(0, n);
      timeDomainBuf!.set(frame, fftSize - n);
    }
    samplesSinceEmit += n;
    if (samplesSinceEmit >= hopSamples) {
      samplesSinceEmit -= hopSamples;
      runDetection();
    }
  }

  // Fallback path: poll the AnalyserNode via requestAnimationFrame (frozen when
  // the tab is hidden, but only reached when AudioWorklet is unavailable).
  function poll(analyser: AnalyserNode): void {
    if (!active) return;
    analyser.getFloatTimeDomainData(timeDomainBuf!);
    runDetection();
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

      // Raw capture: tap the same source with a continuous ScriptProcessor so
      // every sample is recorded gap-free.
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
      hopSamples = Math.max(1, Math.round(audioContext.sampleRate / 60));
      samplesSinceEmit = 0;

      postprocessor.reset();
      postprocessor.setStartTime(performance.now());
      active = true;

      if (audioContext.audioWorklet) {
        const blob = new Blob([CAPTURE_WORKLET_SRC], { type: "application/javascript" });
        const url = URL.createObjectURL(blob);
        try {
          await audioContext.audioWorklet.addModule(url);
        } finally {
          URL.revokeObjectURL(url);
        }
        workletNode = new AudioWorkletNode(audioContext, "pitch-capture-processor");
        workletNode.port.onmessage = (e) => onWorkletFrame(e.data as Float32Array);
        source.connect(workletNode);
        // Connect to destination so the node is pulled; process() writes no
        // output, so the graph stays silent (no mic echo).
        workletNode.connect(audioContext.destination);
      } else {
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = fftSize;
        analyser.smoothingTimeConstant = 0; // pitchy does its own smoothing
        source.connect(analyser);
        rafId = requestAnimationFrame(() => poll(analyser));
      }
    },

    async stop(): Promise<void> {
      if (!active) return;
      active = false;

      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }

      if (workletNode) {
        workletNode.port.onmessage = null;
        workletNode.disconnect();
        workletNode = null;
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
      samplesSinceEmit = 0;
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
