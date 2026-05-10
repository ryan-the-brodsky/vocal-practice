// Native decoder: react-native-audio-api's AudioContext.decodeAudioData on the
// ArrayBuffer obtained from a file URI via expo-file-system's File.arrayBuffer().

import { AudioContext } from "react-native-audio-api";
import { File } from "expo-file-system";
import { ANALYZE_CONFIG } from "./config";
import type { DecodeInput, DecodedAudio } from "./decode";

export async function decodeFile(input: DecodeInput): Promise<DecodedAudio> {
  const arrayBuf = await toArrayBuffer(input);
  const ctx = new AudioContext();
  try {
    const decoded = await ctx.decodeAudioData(arrayBuf);
    if (decoded.duration > ANALYZE_CONFIG.maxFileDurationSec) {
      throw new Error(
        `Audio file too long (${Math.round(decoded.duration)}s); max is ${ANALYZE_CONFIG.maxFileDurationSec}s.`,
      );
    }
    const pcm = downmixToMono(decoded);
    return { pcm, sampleRate: decoded.sampleRate };
  } finally {
    await ctx.close().catch(() => undefined);
  }
}

async function toArrayBuffer(input: DecodeInput): Promise<ArrayBuffer> {
  if (input instanceof ArrayBuffer) return input;
  if (typeof input === "string") {
    // expo-document-picker returns file:// URIs; File handles them transparently.
    const file = new File(input);
    return await file.arrayBuffer();
  }
  // Blob path is uncommon on RN but ArrayBuffer-coercible if it does appear.
  if (typeof Blob !== "undefined" && input instanceof Blob) {
    return await input.arrayBuffer();
  }
  throw new Error("Unsupported decode input on native (expected URI/ArrayBuffer).");
}

interface NativeDecodedBuffer {
  numberOfChannels: number;
  length: number;
  getChannelData(c: number): Float32Array;
}

function downmixToMono(buf: NativeDecodedBuffer): Float32Array {
  const n = buf.numberOfChannels;
  if (n === 1) return new Float32Array(buf.getChannelData(0));
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
