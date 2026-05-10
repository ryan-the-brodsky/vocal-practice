// Shared interface and factory stub for the platform-specific decoder.
// Metro picks decode.web.ts / decode.native.ts via filename suffix.

export interface DecodedAudio {
  pcm: Float32Array;
  sampleRate: number;
}

// Web accepts Blob/File; native accepts a file URI string. Either platform may
// also accept a raw ArrayBuffer for in-memory decoding.
export type DecodeInput = Blob | ArrayBuffer | string;

export declare function decodeFile(input: DecodeInput): Promise<DecodedAudio>;
