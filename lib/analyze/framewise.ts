// Offline framewise pitch tracking. Drives pitchy in a tight loop over a PCM
// buffer and feeds the same PitchPostprocessor used by the live tracker so the
// downstream segment/score code sees identical sample shapes.

import { PitchDetector as Pitchy } from "pitchy";
import type { PitchSample } from "../pitch/detector";
import { PitchPostprocessor } from "../pitch/postprocess";
import { ANALYZE_CONFIG } from "./config";

export interface OfflinePitchOptions {
  clarityThreshold?: number;
  smoothingFrames?: number;
  octaveJumpFrames?: number;
  frameSize?: number;
  // Override the default ~10 ms hop. Defaults to round(sampleRate * hopSeconds).
  hopSize?: number;
}

export function runOfflinePitch(
  pcm: Float32Array,
  sampleRate: number,
  opts: OfflinePitchOptions = {},
): PitchSample[] {
  const frameSize = opts.frameSize ?? ANALYZE_CONFIG.frameSize;
  const hopSize =
    opts.hopSize ?? Math.max(1, Math.round(sampleRate * ANALYZE_CONFIG.hopSeconds));

  const pitchy = Pitchy.forFloat32Array(frameSize);
  const post = new PitchPostprocessor(
    opts.clarityThreshold ?? ANALYZE_CONFIG.clarityThreshold,
    opts.smoothingFrames ?? ANALYZE_CONFIG.smoothingFrames,
    opts.octaveJumpFrames ?? ANALYZE_CONFIG.octaveJumpFrames,
  );
  post.setStartTime(0);

  const samples: PitchSample[] = [];
  if (pcm.length < frameSize) return samples;

  for (let i = 0; i + frameSize <= pcm.length; i += hopSize) {
    const window = pcm.subarray(i, i + frameSize);
    const [hz, clarity] = pitchy.findPitch(window, sampleRate);
    const rms = computeRms(window);
    const tMs = (i / sampleRate) * 1000;
    // No RMS noise gate at this stage — clean stem assumption per plan §5.2.
    samples.push(post.push(hz ?? 0, clarity, rms, tMs));
  }
  return samples;
}

function computeRms(buf: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < buf.length; i++) sum += buf[i]! * buf[i]!;
  return Math.sqrt(sum / buf.length);
}
