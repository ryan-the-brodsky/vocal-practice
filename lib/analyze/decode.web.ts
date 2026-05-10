// Web decoder: uses the browser's AudioContext.decodeAudioData and downmixes to mono.

import { ANALYZE_CONFIG } from "./config";
import type { DecodeInput, DecodedAudio } from "./decode";

export async function decodeFile(input: DecodeInput): Promise<DecodedAudio> {
  const arrayBuf = await toArrayBuffer(input);
  // OfflineAudioContext would let us pin the sample rate, but pitchy handles
  // arbitrary rates fine — no reason to resample.
  const ac = new AudioContext();
  let decoded: AudioBuffer;
  try {
    decoded = await ac.decodeAudioData(arrayBuf);
  } finally {
    // Close eagerly; the PCM is already extracted.
    void ac.close();
  }

  if (decoded.duration > ANALYZE_CONFIG.maxFileDurationSec) {
    throw new Error(
      `Audio file too long (${Math.round(decoded.duration)}s); max is ${ANALYZE_CONFIG.maxFileDurationSec}s.`,
    );
  }

  const pcm = downmixToMono(decoded);
  return { pcm, sampleRate: decoded.sampleRate };
}

async function toArrayBuffer(input: DecodeInput): Promise<ArrayBuffer> {
  if (input instanceof ArrayBuffer) return input;
  if (typeof Blob !== "undefined" && input instanceof Blob) {
    return await input.arrayBuffer();
  }
  if (typeof input === "string") {
    // URL fetch path — useful for hosted fixtures during dev/QA.
    const res = await fetch(input);
    if (!res.ok) throw new Error(`Failed to fetch audio: ${res.status}`);
    return await res.arrayBuffer();
  }
  throw new Error("Unsupported decode input on web (expected File/Blob/ArrayBuffer/URL).");
}

function downmixToMono(buf: AudioBuffer): Float32Array {
  const n = buf.numberOfChannels;
  if (n === 1) {
    // Defensive copy: the AudioBuffer's channel data is reused by the engine.
    return new Float32Array(buf.getChannelData(0));
  }
  const len = buf.length;
  const out = new Float32Array(len);
  const channels: Float32Array[] = [];
  for (let c = 0; c < n; c++) channels.push(buf.getChannelData(c));
  for (let i = 0; i < len; i++) {
    let sum = 0;
    for (let c = 0; c < n; c++) sum += channels[c]![i]!;
    out[i] = sum / n;
  }
  return out;
}
