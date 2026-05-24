// Offline pitch-detection eval harness. Walks the local corpus
// (test/fixtures/audio/corpus/*.wav + matching .json sidecar + .f0.json CREPE
// reference) and scores `runOfflinePitch` frame-by-frame against the reference,
// emitting a compact per-take report to stdout and a machine-readable
// scripts/eval-results.json (gitignored).
//
// Usage: npx tsx scripts/eval-corpus.ts [--exercise=<id>] [--baseline]
//
// --baseline pins the detector to the static `PitchPostprocessor` defaults
// (clarity 0.85, median 5, octave-jump 3), ignoring the tempo-aware resolver
// in `lib/pitch/tuning.ts` — useful to A/B the resolver against the old
// behavior. Default mode uses the resolver, applying any explicit
// `scoringHints` overrides on top.
//
// Per-take metrics (over voiced reference frames, after octaveShift correction):
//   - coverage    : fraction of voiced reference frames where the detector
//                   produced any pitch
//   - RPA         : raw pitch accuracy — fraction within ±50¢ of reference F0
//   - RCA         : raw chroma accuracy — same but octave-collapsed
//   - octave-err  : fraction of voiced+correct-chroma frames an exact octave off
//   - mean¢err    : mean absolute cents error on voiced frames (clamped per octave)

import * as fs from "node:fs";
import * as path from "node:path";
import { runOfflinePitch } from "../lib/analyze/framewise";
import { resolveDetectorTuning } from "../lib/pitch/tuning";
import { ANALYZE_CONFIG } from "../lib/analyze/config";
import { getExercise } from "../lib/exercises/library";
import { noteValueToSeconds } from "../lib/exercises/music";
import type { CaptureSidecar } from "../lib/capture/types";
import type { PitchSample } from "../lib/pitch/detector";

const CORPUS_DIR = path.join(__dirname, "..", "test", "fixtures", "audio", "corpus");
const OUT_PATH = path.join(__dirname, "eval-results.json");

interface F0Frame {
  tMs: number;
  f0Hz: number;
  voiced: boolean;
  conf: number;
}
interface F0Sidecar {
  schemaVersion: number;
  stepMs: number;
  frames: F0Frame[];
}

interface TakeResult {
  base: string;
  exerciseId: string;
  voicePart: string;
  startTonic: string;
  tempo: number;
  noteSec: number;
  durationSec: number;
  octaveShift: number;
  voicedFrames: number;
  coverage: number;
  rpa: number;
  rca: number;
  octaveErrRate: number;
  meanAbsCents: number;
  tuning: { clarityThreshold: number; smoothingFrames: number; octaveJumpFrames: number };
}

// Minimal RIFF reader for the 16-bit mono PCM WAV format the in-app capture
// writes (lib/capture/wav.ts). Returns Float32Array in [-1, 1] + sampleRate.
function readWav(filePath: string): { pcm: Float32Array; sampleRate: number } {
  const buf = fs.readFileSync(filePath);
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  if (buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WAVE") {
    throw new Error(`${filePath}: not a RIFF/WAVE file`);
  }
  // Walk chunks starting at offset 12.
  let offset = 12;
  let sampleRate = 0;
  let numChannels = 1;
  let bitsPerSample = 16;
  let dataOffset = -1;
  let dataLength = 0;
  while (offset + 8 <= buf.length) {
    const id = buf.toString("ascii", offset, offset + 4);
    const size = view.getUint32(offset + 4, true);
    if (id === "fmt ") {
      const fmt = view.getUint16(offset + 8, true);
      if (fmt !== 1) throw new Error(`${filePath}: non-PCM format ${fmt}`);
      numChannels = view.getUint16(offset + 10, true);
      sampleRate = view.getUint32(offset + 12, true);
      bitsPerSample = view.getUint16(offset + 22, true);
    } else if (id === "data") {
      dataOffset = offset + 8;
      dataLength = size;
      break;
    }
    offset += 8 + size + (size & 1); // chunks pad to even length
  }
  if (dataOffset < 0) throw new Error(`${filePath}: no data chunk`);
  if (bitsPerSample !== 16) throw new Error(`${filePath}: only 16-bit PCM supported`);
  const sampleCount = dataLength / 2 / numChannels;
  const pcm = new Float32Array(sampleCount);
  for (let i = 0; i < sampleCount; i++) {
    let sum = 0;
    for (let c = 0; c < numChannels; c++) {
      sum += view.getInt16(dataOffset + (i * numChannels + c) * 2, true);
    }
    pcm[i] = sum / numChannels / 0x8000;
  }
  return { pcm, sampleRate };
}

function hzToMidi(hz: number): number {
  return 69 + 12 * Math.log2(hz / 440);
}

// Find the nearest detector sample to a target timestamp (in ms).
function nearestSample(samples: PitchSample[], targetMs: number): PitchSample | null {
  if (samples.length === 0) return null;
  // The samples are roughly 10ms-hopped and monotonic in timestamp; do a
  // bounded scan from the previous index (caller passes hint).
  let lo = 0;
  let hi = samples.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    const t = samples[mid]!.timestamp;
    if (t < targetMs) lo = mid + 1;
    else hi = mid;
  }
  const cand = samples[lo]!;
  const prev = lo > 0 ? samples[lo - 1]! : cand;
  return Math.abs(prev.timestamp - targetMs) < Math.abs(cand.timestamp - targetMs) ? prev : cand;
}

function scoreTake(
  pcm: Float32Array,
  sampleRate: number,
  sidecar: CaptureSidecar,
  f0: F0Sidecar,
  base: string,
  baselineMode: boolean,
): TakeResult | null {
  const exercise = getExercise(sidecar.exerciseId);
  // Per-note seconds — for tempo-aware detector tuning.
  let noteSec = 0.5;
  if (exercise) {
    try {
      noteSec = noteValueToSeconds(exercise.noteValue, exercise.tempo);
    } catch {
      /* unknown noteValue — use default */
    }
  }
  const hints = exercise?.scoringHints;
  const tuning = baselineMode
    ? {
        // Static defaults — match PitchPostprocessor's constructor + ANALYZE_CONFIG.
        // Explicit scoringHints still win (matches pre-resolver behavior).
        clarityThreshold: hints?.clarityThreshold ?? 0.85,
        smoothingFrames: 5,
        octaveJumpFrames: hints?.octaveJumpFrames ?? 3,
      }
    : resolveDetectorTuning({ noteSec, hints });

  // Run framewise pitch with the resolved tuning. (We pass the resolved values
  // directly rather than letting runOfflinePitch resolve them, so --baseline
  // can A/B against the static defaults using the same call shape.)
  // Detector and CREPE reference both look at the same WAV starting at t=0,
  // so the timestamps from both line up without any offset.
  const samples = runOfflinePitch(pcm, sampleRate, {
    clarityThreshold: tuning.clarityThreshold,
    smoothingFrames: tuning.smoothingFrames,
    octaveJumpFrames: tuning.octaveJumpFrames,
  });

  const octaveShift = sidecar.octaveShift ?? 0;
  // Both the detector and the CREPE reference observe the same WAV audio,
  // so they are on the same pitch axis — octaveShift (sung vs notated) is a
  // scoring-engine concern, not a framewise-eval one. Apply zero shift.
  let voiced = 0;
  let covered = 0;
  let withinSemitone = 0;
  let withinChroma = 0;
  let voicedCorrectChromaButOctaveOff = 0;
  let voicedCorrectChroma = 0;
  let absCentsSum = 0;
  let absCentsN = 0;

  // Pre-compute reference midi where voiced.
  for (const frame of f0.frames) {
    if (!frame.voiced || frame.f0Hz <= 0) continue;
    voiced++;
    const refMidi = hzToMidi(frame.f0Hz);
    const sample = nearestSample(samples, frame.tMs);
    if (!sample || sample.hz == null || sample.midi == null) continue;
    covered++;
    // Detector's reported MIDI in continuous semitones (midi + within-semitone cents).
    const detMidi = sample.midi + (sample.cents ?? 0) / 100;
    const centsDiff = (detMidi - refMidi) * 100;
    const absCents = Math.abs(centsDiff);

    // Pitch within ±50¢
    if (absCents <= 50) withinSemitone++;
    // Chroma (octave-collapsed): fold to [-50, 50] cents in a chroma sense
    // — equivalent to wrapping semitone diff mod 12 to [-6, 6).
    const semi = detMidi - refMidi;
    let semiMod = semi - 12 * Math.round(semi / 12); // nearest-octave-wrapped, in [-6, 6]
    const absCentsChroma = Math.abs(semiMod) * 100;
    if (absCentsChroma <= 50) {
      withinChroma++;
      // Was the chroma-correct frame an exact octave away from the pitch match?
      if (absCents > 50) voicedCorrectChromaButOctaveOff++;
      voicedCorrectChroma++;
    }
    // Mean abs cents over chroma-residual (clamps octave errors out — that's the
    // standard MIR convention so a single sub-harmonic frame doesn't dominate).
    absCentsSum += absCentsChroma;
    absCentsN++;
  }

  if (voiced === 0) {
    console.warn(`[eval] ${base}: no voiced reference frames, skipping`);
    return null;
  }

  return {
    base,
    exerciseId: sidecar.exerciseId,
    voicePart: sidecar.voicePart,
    startTonic: sidecar.startTonic,
    tempo: sidecar.tempo,
    noteSec,
    durationSec: sidecar.durationMs / 1000,
    octaveShift,
    voicedFrames: voiced,
    coverage: covered / voiced,
    rpa: withinSemitone / voiced,
    rca: withinChroma / voiced,
    octaveErrRate: voicedCorrectChroma > 0 ? voicedCorrectChromaButOctaveOff / voicedCorrectChroma : 0,
    meanAbsCents: absCentsN > 0 ? absCentsSum / absCentsN : 0,
    tuning,
  };
}

function fmtPct(x: number): string {
  return `${(x * 100).toFixed(1)}%`;
}
function fmtPct1(x: number): string {
  return `${(x * 100).toFixed(1)}`;
}
function pad(s: string, n: number): string {
  return s.length >= n ? s : s + " ".repeat(n - s.length);
}

function main(): void {
  const args = process.argv.slice(2);
  const exerciseFilter = args.find((a) => a.startsWith("--exercise="))?.slice("--exercise=".length);
  const baselineMode = args.includes("--baseline");

  if (!fs.existsSync(CORPUS_DIR)) {
    console.error(`Corpus directory not found: ${CORPUS_DIR}`);
    process.exit(1);
  }

  const files = fs.readdirSync(CORPUS_DIR).filter((f) => f.endsWith(".wav")).sort();
  const results: TakeResult[] = [];

  for (const wavName of files) {
    const base = wavName.replace(/\.wav$/, "");
    if (exerciseFilter && !base.startsWith(`${exerciseFilter}__`)) continue;

    const wavPath = path.join(CORPUS_DIR, wavName);
    const jsonPath = path.join(CORPUS_DIR, `${base}.json`);
    const f0Path = path.join(CORPUS_DIR, `${base}.f0.json`);
    if (!fs.existsSync(jsonPath)) {
      console.warn(`[eval] missing sidecar for ${wavName}, skipping`);
      continue;
    }
    if (!fs.existsSync(f0Path)) {
      console.warn(`[eval] missing .f0.json for ${wavName}, skipping`);
      continue;
    }
    const sidecar: CaptureSidecar = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    const f0: F0Sidecar = JSON.parse(fs.readFileSync(f0Path, "utf8"));
    const { pcm, sampleRate } = readWav(wavPath);
    if (sampleRate !== sidecar.sampleRate) {
      console.warn(`[eval] ${base}: sidecar sampleRate ${sidecar.sampleRate} != WAV ${sampleRate}`);
    }
    try {
      const r = scoreTake(pcm, sampleRate, sidecar, f0, base, baselineMode);
      if (r) results.push(r);
    } catch (e) {
      console.error(`[eval] ${base}: ${(e as Error).message}`);
    }
  }

  console.log(`mode: ${baselineMode ? "baseline (static defaults)" : "tempo-aware resolver"}`);

  // Print a tidy table grouped by exercise.
  console.log("");
  console.log(
    pad("exercise", 32) +
      pad("tonic", 6) +
      pad("noteSec", 9) +
      pad("cov%", 8) +
      pad("RPA%", 8) +
      pad("RCA%", 8) +
      pad("oct-err%", 10) +
      pad("mean¢", 7),
  );
  console.log("-".repeat(88));
  for (const r of results) {
    console.log(
      pad(r.exerciseId, 32) +
        pad(r.startTonic, 6) +
        pad(r.noteSec.toFixed(3), 9) +
        pad(fmtPct1(r.coverage), 8) +
        pad(fmtPct1(r.rpa), 8) +
        pad(fmtPct1(r.rca), 8) +
        pad(fmtPct1(r.octaveErrRate), 10) +
        pad(r.meanAbsCents.toFixed(1), 7),
    );
  }
  console.log("");

  fs.writeFileSync(
    OUT_PATH,
    JSON.stringify(
      {
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        mode: baselineMode ? "baseline" : "tempo-aware",
        analyzeConfig: ANALYZE_CONFIG,
        takes: results,
      },
      null,
      2,
    ),
  );
  console.log(`Wrote ${OUT_PATH} (${results.length} takes)`);
}

main();
