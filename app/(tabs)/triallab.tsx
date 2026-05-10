// Trill Lab — testing playground for pitch detection on lip-trill audio.
// Plays a piano-cued 5-note scale, records the user trilling along, then
// scores each of 5 estimators against the time-aligned target schedule.
// No live coloring during playback — results are computed once after the
// pattern completes (mirrors the production capture-then-score model).
// Web-only.

import { PitchDetector as PitchyDetector } from "pitchy";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Fonts, Radii, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

import { createAudioPlayer, type AudioPlayer, type SequenceHandle } from "@/lib/audio";
import type { NoteEvent } from "@/lib/exercises/types";
import { midiToNote, noteToMidi } from "@/lib/exercises/music";
import { PitchPostprocessor } from "@/lib/pitch/postprocess";

const FFT_SIZE = 4096;

// Scale: do re mi fa sol — 5 ascending degrees
const SCALE_DEGREES = [0, 2, 4, 5, 7];
const SYLLABLES = ["do", "re", "mi", "fa", "sol"];
const NOTE_DUR_SEC = 0.5;     // half-second per note (slow enough to trill cleanly)
const CUE_DUR_SEC = 1.0;      // 1-second tonic cue before melody starts
const TAIL_MS = 600;          // mic stays open this long after the last note
// Inner-window crop to skip attack/release transients when scoring per-note.
// Same idea as production: skip the first 20% and last 20% of a note window.
const NOTE_WINDOW_INNER_FRAC = 0.6;
const ON_PITCH_CENTS = 50;

// Reject any detection below this frequency. Lip-flap rate is ~25–40 Hz —
// without this floor, pitchy locks onto the buzz periodicity on high notes.
const MIN_DETECT_HZ = 70;

/**
 * Snap a detected continuous MIDI to within ±6 semitones of the target by
 * shifting whole octaves. Handles up to ±5 octaves of sub/super-harmonic
 * latching (pitchy on lip trills can drop 3+ octaves to the lip-flap rate).
 */
function snapToTargetOctave(detectedMidi: number, targetMidi: number): number {
  let m = detectedMidi;
  let guard = 0;
  while (m - targetMidi > 6 && guard < 10) { m -= 12; guard++; }
  while (targetMidi - m > 6 && guard < 10) { m += 12; guard++; }
  return m;
}

function hzToMidiContinuous(hz: number): number {
  return 69 + 12 * Math.log2(hz / 440);
}

function median(values: number[]): number {
  if (values.length === 0) return NaN;
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}

interface Reading {
  hz: number | null;
  midi: number | null; // continuous (not rounded)
}

interface Estimator {
  name: string;
  description: string;
  push(buf: Float32Array, sampleRate: number, timestamp: number): Reading;
  reset(): void;
}

// 1. Production baseline — pitchy + PitchPostprocessor (clarity 0.85)
class ProductionEstimator implements Estimator {
  name = "Production";
  description = "pitchy clarity ≥ 0.85, 5-frame median, octave guard (current default)";
  private detector: PitchyDetector<Float32Array> | null = null;
  private post = new PitchPostprocessor(0.85, 5, 3);

  push(buf: Float32Array, sr: number, ts: number): Reading {
    if (!this.detector) this.detector = PitchyDetector.forFloat32Array(buf.length);
    this.post.setStartTime(ts - 1);
    const [rawHz, clarity] = this.detector.findPitch(buf, sr);
    let rms = 0;
    for (let i = 0; i < buf.length; i++) rms += buf[i]! * buf[i]!;
    rms = Math.sqrt(rms / buf.length);
    // Floor: ignore the lip-flap rate (~25–40 Hz)
    const filteredHz = rawHz >= MIN_DETECT_HZ ? rawHz : 0;
    const sample = this.post.push(filteredHz, clarity, rms, ts);
    return { hz: sample.hz, midi: sample.hz !== null ? hzToMidiContinuous(sample.hz) : null };
  }

  reset(): void { this.post.reset(); }
}

// 2. Loose clarity gate
class LoosePitchyEstimator implements Estimator {
  name = "Loose pitchy";
  description = "pitchy clarity ≥ 0.30, 5-frame median";
  private detector: PitchyDetector<Float32Array> | null = null;
  private buf: number[] = [];

  push(buffer: Float32Array, sr: number): Reading {
    if (!this.detector) this.detector = PitchyDetector.forFloat32Array(buffer.length);
    const [hz, clarity] = this.detector.findPitch(buffer, sr);
    if (clarity < 0.3 || !hz || !isFinite(hz) || hz < MIN_DETECT_HZ) return { hz: null, midi: null };
    this.buf.push(hz);
    if (this.buf.length > 5) this.buf.shift();
    const m = median(this.buf);
    return { hz: m, midi: hzToMidiContinuous(m) };
  }

  reset(): void { this.buf = []; }
}

// 3. Mode-of-window — pitchy raw, modal MIDI semitone over 250ms
class ModeOfWindowEstimator implements Estimator {
  name = "Mode-of-window";
  description = "pitchy raw (no clarity gate), modal MIDI semitone over last 250 ms";
  private detector: PitchyDetector<Float32Array> | null = null;
  private samples: { ts: number; midi: number }[] = [];
  private windowMs = 250;

  push(buffer: Float32Array, sr: number, ts: number): Reading {
    if (!this.detector) this.detector = PitchyDetector.forFloat32Array(buffer.length);
    const [hz] = this.detector.findPitch(buffer, sr);
    if (hz >= MIN_DETECT_HZ && isFinite(hz)) {
      this.samples.push({ ts, midi: Math.round(hzToMidiContinuous(hz)) });
    }
    const cutoff = ts - this.windowMs;
    while (this.samples.length > 0 && this.samples[0]!.ts < cutoff) this.samples.shift();
    if (this.samples.length === 0) return { hz: null, midi: null };
    const counts = new Map<number, number>();
    for (const s of this.samples) counts.set(s.midi, (counts.get(s.midi) ?? 0) + 1);
    let bestMidi = NaN, bestCount = -1;
    for (const [m, c] of counts) {
      if (c > bestCount) { bestCount = c; bestMidi = m; }
    }
    return { hz: 440 * Math.pow(2, (bestMidi - 69) / 12), midi: bestMidi };
  }

  reset(): void { this.samples = []; }
}

// 4. Heavy median
class HeavyMedianEstimator implements Estimator {
  name = "Heavy median";
  description = "pitchy clarity ≥ 0.40, 15-frame median";
  private detector: PitchyDetector<Float32Array> | null = null;
  private buf: number[] = [];

  push(buffer: Float32Array, sr: number): Reading {
    if (!this.detector) this.detector = PitchyDetector.forFloat32Array(buffer.length);
    const [hz, clarity] = this.detector.findPitch(buffer, sr);
    if (clarity < 0.4 || !hz || !isFinite(hz) || hz < MIN_DETECT_HZ) return { hz: null, midi: null };
    this.buf.push(hz);
    if (this.buf.length > 15) this.buf.shift();
    const m = median(this.buf);
    return { hz: m, midi: hzToMidiContinuous(m) };
  }

  reset(): void { this.buf = []; }
}

// 5. YIN — the de Cheveigné/Kawahara difference-function detector. More robust
//    to noise/buzz than pitchy MPM in a lot of cases, and computationally similar.
//    threshold=0.15 (slightly looser than the canonical 0.10) to admit lip-trill
//    spectra that are imperfectly periodic.
class YinEstimator implements Estimator {
  name = "YIN";
  description = "YIN difference-function pitch detector (threshold 0.15) + 5-frame median";
  private threshold = 0.15;
  private smoothBuf: number[] = [];

  push(buf: Float32Array, sr: number): Reading {
    const minHz = 70, maxHz = 800;
    const N = Math.min(Math.floor(sr / minHz), Math.floor(buf.length / 2));
    const minLag = Math.max(1, Math.floor(sr / maxHz));
    if (N < minLag + 2) return { hz: null, midi: null };

    // Step 1: Squared-difference function
    const d = new Float32Array(N + 1);
    for (let lag = 1; lag <= N; lag++) {
      let sum = 0;
      const limit = buf.length - lag;
      for (let i = 0; i < limit; i++) {
        const diff = buf[i]! - buf[i + lag]!;
        sum += diff * diff;
      }
      d[lag] = sum;
    }

    // Step 2: Cumulative mean normalized difference
    const dp = new Float32Array(N + 1);
    dp[0] = 1;
    let runningSum = 0;
    for (let lag = 1; lag <= N; lag++) {
      runningSum += d[lag]!;
      dp[lag] = runningSum > 0 ? (d[lag]! * lag) / runningSum : 1;
    }

    // Step 3: Find first lag below threshold, then descend to local minimum
    let bestLag = -1;
    for (let lag = minLag; lag <= N - 1; lag++) {
      if (dp[lag]! < this.threshold) {
        let l = lag;
        while (l + 1 <= N && dp[l + 1]! < dp[l]!) l++;
        bestLag = l;
        break;
      }
    }
    if (bestLag < 0) return { hz: null, midi: null };

    // Step 4: Parabolic interpolation around the minimum for sub-sample accuracy
    let refined = bestLag;
    if (bestLag > 1 && bestLag < N) {
      const a = dp[bestLag - 1]!, b = dp[bestLag]!, c = dp[bestLag + 1]!;
      const denom = a - 2 * b + c;
      if (Math.abs(denom) > 1e-9) refined = bestLag + (a - c) / (2 * denom);
    }
    if (refined <= 0) return { hz: null, midi: null };

    const hz = sr / refined;
    this.smoothBuf.push(hz);
    if (this.smoothBuf.length > 5) this.smoothBuf.shift();
    const m = median(this.smoothBuf);
    return { hz: m, midi: hzToMidiContinuous(m) };
  }

  reset(): void { this.smoothBuf = []; }
}

const TONIC_NOTES = ["Bb2", "C3", "C#3", "D3", "Eb3", "E3", "F3", "F#3", "G3"];

interface TargetWindow {
  startMs: number;  // playback-relative
  endMs: number;
  midi: number;
  scaleIdx: number;
}

interface PerNoteResult {
  targetMidi: number;
  samples: number;        // count of detections in inner window
  meanCents: number;      // mean (detected - target) * 100
  accuracyPct: number;    // fraction within ±50¢
  detectedNote: string;   // most common rounded MIDI as note name (or "—")
}

interface SampleRecord { ts: number; midi: number }

interface RowState {
  est: Estimator;
  recorded: SampleRecord[];      // accumulated during a run, playback-relative ts
  results: PerNoteResult[] | null; // populated when scoring runs after the scale ends
}

function newRow(est: Estimator): RowState {
  return { est, recorded: [], results: null };
}

function scoreRow(row: RowState, schedule: TargetWindow[]): PerNoteResult[] {
  return schedule.map((w) => {
    // Inner window: skip attack/release transients
    const innerStart = w.startMs + (w.endMs - w.startMs) * (1 - NOTE_WINDOW_INNER_FRAC) / 2;
    const innerEnd = w.endMs - (w.endMs - w.startMs) * (1 - NOTE_WINDOW_INNER_FRAC) / 2;
    const inWindow = row.recorded.filter((s) => s.ts >= innerStart && s.ts < innerEnd);
    if (inWindow.length === 0) {
      return { targetMidi: w.midi, samples: 0, meanCents: 0, accuracyPct: 0, detectedNote: "—" };
    }
    let sumCents = 0;
    let onPitch = 0;
    const semitoneCounts = new Map<number, number>();
    for (const s of inWindow) {
      // Snap to within ±6 semitones of target (handles sub-harmonic latching
      // beyond the production scorer's ±12/±24 snap range)
      const snapped = snapToTargetOctave(s.midi, w.midi);
      const cents = (snapped - w.midi) * 100;
      sumCents += cents;
      if (Math.abs(cents) <= ON_PITCH_CENTS) onPitch++;
      const semi = Math.round(snapped);
      semitoneCounts.set(semi, (semitoneCounts.get(semi) ?? 0) + 1);
    }
    const meanCents = sumCents / inWindow.length;
    const accuracyPct = (onPitch / inWindow.length) * 100;
    let modalSemi = w.midi, bestC = -1;
    for (const [semi, c] of semitoneCounts) {
      if (c > bestC) { bestC = c; modalSemi = semi; }
    }
    return {
      targetMidi: w.midi,
      samples: inWindow.length,
      meanCents,
      accuracyPct,
      detectedNote: midiToNote(modalSemi),
    };
  });
}

export default function TrialLabScreen() {
  const { colors } = useTheme();
  const [tonicNote, setTonicNote] = useState<string>("D3");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0); // bumps during a run so the "current note" indicator updates

  const tonicMidi = useMemo(() => {
    try { return noteToMidi(tonicNote); } catch { return 50; }
  }, [tonicNote]);

  const scaleEvents = useMemo<NoteEvent[]>(() => {
    const events: NoteEvent[] = [];
    events.push({
      type: "cue",
      noteName: midiToNote(tonicMidi),
      midi: tonicMidi,
      startTime: 0,
      duration: CUE_DUR_SEC,
      velocity: 0.45,
    });
    for (let i = 0; i < SCALE_DEGREES.length; i++) {
      const m = tonicMidi + SCALE_DEGREES[i]!;
      events.push({
        type: "melody",
        noteName: midiToNote(m),
        midi: m,
        startTime: CUE_DUR_SEC + i * NOTE_DUR_SEC,
        duration: NOTE_DUR_SEC,
        velocity: 0.6,
      });
    }
    return events;
  }, [tonicMidi]);

  const buildSchedule = useCallback((): TargetWindow[] => {
    const sched: TargetWindow[] = [];
    for (let i = 0; i < SCALE_DEGREES.length; i++) {
      const startMs = (CUE_DUR_SEC + i * NOTE_DUR_SEC) * 1000;
      sched.push({
        startMs,
        endMs: startMs + NOTE_DUR_SEC * 1000,
        midi: tonicMidi + SCALE_DEGREES[i]!,
        scaleIdx: i,
      });
    }
    return sched;
  }, [tonicMidi]);

  const rowsRef = useRef<RowState[]>([
    newRow(new ProductionEstimator()),
    newRow(new LoosePitchyEstimator()),
    newRow(new ModeOfWindowEstimator()),
    newRow(new HeavyMedianEstimator()),
    newRow(new YinEstimator()),
  ]);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const timeBufRef = useRef<Float32Array<ArrayBuffer> | null>(null);

  const playerRef = useRef<AudioPlayer | null>(null);
  const seqHandleRef = useRef<SequenceHandle | null>(null);
  const playbackStartMsRef = useRef<number>(0);
  const targetScheduleRef = useRef<TargetWindow[]>([]);
  const runningRef = useRef(false);
  const endTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopMic = useCallback(async () => {
    if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (audioCtxRef.current) { await audioCtxRef.current.close(); audioCtxRef.current = null; }
    analyserRef.current = null;
    timeBufRef.current = null;
  }, []);

  const ensureMic = useCallback(async (): Promise<boolean> => {
    if (analyserRef.current) return true;
    if (Platform.OS !== "web") { setError("Trill Lab is web-only for now."); return false; }
    try {
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      streamRef.current = stream;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = FFT_SIZE;
      analyser.smoothingTimeConstant = 0;
      src.connect(analyser);
      analyserRef.current = analyser;
      timeBufRef.current = new Float32Array(new ArrayBuffer(FFT_SIZE * 4));
      return true;
    } catch (e) {
      setError(String(e));
      return false;
    }
  }, []);

  const handleRunScale = useCallback(async () => {
    if (running) return;
    setError(null);
    const ok = await ensureMic();
    if (!ok) return;
    if (!playerRef.current) {
      playerRef.current = createAudioPlayer();
      await playerRef.current.init();
    }

    // Reset estimators + buffers + clear previous results
    for (const r of rowsRef.current) {
      r.est.reset();
      r.recorded = [];
      r.results = null;
    }

    targetScheduleRef.current = buildSchedule();
    playbackStartMsRef.current = performance.now();
    runningRef.current = true;
    setRunning(true);

    seqHandleRef.current = playerRef.current.playSequence(scaleEvents);

    // Recording loop — captures samples but never updates UI per frame.
    const tickFn = () => {
      if (!analyserRef.current || !timeBufRef.current || !runningRef.current) return;
      analyserRef.current.getFloatTimeDomainData(timeBufRef.current);
      const ts = performance.now();
      const sr = audioCtxRef.current?.sampleRate ?? 44100;
      const tRel = ts - playbackStartMsRef.current;
      for (const r of rowsRef.current) {
        const reading = r.est.push(timeBufRef.current, sr, ts);
        if (reading.midi !== null && isFinite(reading.midi)) {
          r.recorded.push({ ts: tRel, midi: reading.midi });
        }
      }
      rafRef.current = requestAnimationFrame(tickFn);
    };
    rafRef.current = requestAnimationFrame(tickFn);

    // Lightweight ticker for the "current scale note" indicator only
    const indicatorInterval = setInterval(() => {
      if (!runningRef.current) { clearInterval(indicatorInterval); return; }
      setTick((x) => (x + 1) % 1000);
    }, 50);

    const last = targetScheduleRef.current[targetScheduleRef.current.length - 1]!;
    const totalMs = last.endMs + TAIL_MS;
    if (endTimerRef.current) clearTimeout(endTimerRef.current);
    endTimerRef.current = setTimeout(() => {
      runningRef.current = false;
      clearInterval(indicatorInterval);
      // Stop frame capture
      if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      // Score every row against the time-aligned schedule
      for (const r of rowsRef.current) {
        r.results = scoreRow(r, targetScheduleRef.current);
      }
      setRunning(false);
      setTick((x) => (x + 1) % 1000); // force a final render
    }, totalMs);
  }, [running, ensureMic, buildSchedule, scaleEvents]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (endTimerRef.current) clearTimeout(endTimerRef.current);
      seqHandleRef.current?.stop();
      void playerRef.current?.dispose();
      void stopMic();
    };
  }, [stopMic]);

  // Current scale-note index for the indicator (only meaningful while running)
  const currentScaleIdx = useMemo(() => {
    void tick;
    if (!runningRef.current) return -1;
    const tRel = performance.now() - playbackStartMsRef.current;
    for (const w of targetScheduleRef.current) {
      if (tRel >= w.startMs && tRel < w.endMs) return w.scaleIdx;
    }
    return -1;
  }, [tick]);

  return (
    <ScrollView
      style={[s.container, { backgroundColor: colors.canvas }]}
      contentContainerStyle={s.content}
    >
      <Text style={[s.h1, { color: colors.textPrimary, fontFamily: Fonts.display }]}>
        Trill Lab
      </Text>
      <Text style={[s.subtle, { color: colors.textSecondary, fontFamily: Fonts.body }]}>
        Piano plays a 5-note ascending scale. Trill along on each note. After the scale
        finishes, each row below shows what that algorithm scored you at — same
        capture-then-score model as production. Compare which estimator best tracks the
        target across the full pattern.
      </Text>

      <View style={s.controlRow}>
        <Text style={[s.label, { color: colors.textTertiary, fontFamily: Fonts.body }]}>Tonic:</Text>
        <View style={s.targetRow}>
          {TONIC_NOTES.map((n) => (
            <Pressable
              key={n}
              onPress={() => setTonicNote(n)}
              style={[
                s.chip,
                { backgroundColor: tonicNote === n ? colors.bgEmphasis : colors.bgSurface,
                  borderColor: tonicNote === n ? colors.borderOnEmphasis : colors.borderSubtle },
              ]}
              disabled={running}
            >
              <Text
                style={[
                  s.chipText,
                  { color: tonicNote === n ? colors.textOnEmphasis : colors.textSecondary,
                    fontFamily: Fonts.bodyMedium },
                ]}
              >
                {n}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={s.buttonRow}>
        <Pressable
          onPress={handleRunScale}
          style={[
            s.bigBtn,
            { backgroundColor: running ? colors.textTertiary : colors.accent },
          ]}
          disabled={running}
        >
          <Text style={[s.bigBtnText, { color: colors.canvas, fontFamily: Fonts.bodyMedium }]}>
            {running ? "Recording…" : "Run scale"}
          </Text>
        </Pressable>
      </View>

      {error && (
        <Text style={[s.error, { color: colors.error, fontFamily: Fonts.body }]}>{error}</Text>
      )}

      <View style={s.scaleStrip}>
        {SCALE_DEGREES.map((d, i) => {
          const m = tonicMidi + d;
          const isActive = i === currentScaleIdx;
          return (
            <View
              key={i}
              style={[
                s.scaleCell,
                { backgroundColor: isActive ? colors.bgEmphasis : colors.bgSurface,
                  borderColor: colors.borderSubtle },
              ]}
            >
              <Text
                style={[
                  s.scaleCellNote,
                  { color: isActive ? colors.textOnEmphasis : colors.textPrimary,
                    fontFamily: Fonts.display },
                ]}
              >
                {midiToNote(m)}
              </Text>
              <Text
                style={[
                  s.scaleCellSyllable,
                  { color: isActive ? colors.textOnEmphasisDim : colors.textTertiary,
                    fontFamily: Fonts.body },
                ]}
              >
                {SYLLABLES[i]}
              </Text>
            </View>
          );
        })}
      </View>

      {rowsRef.current.map((r, i) => (
        <EstimatorRow key={i} row={r} />
      ))}
    </ScrollView>
  );
}

// Returns semantic token keys; callers resolve via useTheme().colors
function centsTokenKeys(abs: number | null): { bgKey: "bgSurface" | "success" | "warning" | "error"; textKey: "textTertiary" | "textPrimary" } {
  if (abs == null) return { bgKey: "bgSurface", textKey: "textTertiary" };
  if (abs <= 50)   return { bgKey: "success",   textKey: "textPrimary" };
  if (abs <= 100)  return { bgKey: "warning",   textKey: "textPrimary" };
  return                  { bgKey: "error",     textKey: "textPrimary" };
}

function signedCents(n: number): string {
  const r = Math.round(n);
  if (r > 0) return `+${r}`;
  if (r < 0) return `−${Math.abs(r)}`;
  return "0";
}

function EstimatorRow({ row }: { row: RowState }) {
  const { colors } = useTheme();
  const results = row.results;

  // Aggregate metrics over scored notes
  const scored = results?.filter((r) => r.samples > 0) ?? [];
  const meanAccuracy = scored.length > 0
    ? scored.reduce((sum, r) => sum + r.accuracyPct, 0) / scored.length
    : null;
  const detectedCount = scored.length;

  return (
    <View
      style={[
        s.estRow,
        { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle },
      ]}
    >
      <View style={s.estRowHeader}>
        <Text style={[s.estName, { color: colors.textPrimary, fontFamily: Fonts.bodySemibold }]}>
          {row.est.name}
        </Text>
        {results && (
          <View style={s.estStatsRight}>
            <Text style={[s.estDetect, { color: colors.textSecondary, fontFamily: Fonts.body }]}>
              {detectedCount}/{results.length} notes detected
            </Text>
            {meanAccuracy !== null && (
              <Text style={[s.estOnTarget, { color: colors.success, fontFamily: Fonts.bodyMedium }]}>
                {meanAccuracy.toFixed(0)}% on-pitch
              </Text>
            )}
          </View>
        )}
      </View>
      <Text style={[s.estDescription, { color: colors.textTertiary, fontFamily: Fonts.body }]}>
        {row.est.description}
      </Text>

      {!results ? (
        <Text style={[s.placeholder, { color: colors.textTertiary, fontFamily: Fonts.body }]}>
          No run yet — tap "Run scale" to record.
        </Text>
      ) : (
        <View style={s.resultStrip}>
          {results.map((r, i) => {
            const hasData = r.samples > 0;
            const abs = hasData ? Math.abs(r.meanCents) : null;
            const { bgKey, textKey } = centsTokenKeys(abs);
            const bg = colors[bgKey];
            const text = colors[textKey];
            return (
              <View key={i} style={[s.resultChip, { backgroundColor: bg }]}>
                <Text style={[s.resultSyllable, { color: text, fontFamily: Fonts.bodyMedium }]}>
                  {SYLLABLES[i]}
                </Text>
                <Text style={[s.resultNote, { color: text, fontFamily: Fonts.mono }]}>
                  {hasData ? r.detectedNote : "—"}
                </Text>
                <Text style={[s.resultCents, { color: text, fontFamily: Fonts.mono }]}>
                  {hasData ? `${signedCents(r.meanCents)}¢` : "—"}
                </Text>
                {hasData && (
                  <Text style={[s.resultPct, { color: text, fontFamily: Fonts.body }]}>
                    {r.accuracyPct.toFixed(0)}%
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

// Static (scheme-invariant) styles — colors applied inline via useTheme()
const s = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.md },
  h1: { fontSize: Typography.xl.size, lineHeight: Typography.xl.lineHeight, marginBottom: Spacing.xs },
  subtle: { fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight, marginBottom: Spacing.md },
  controlRow: { marginBottom: Spacing.sm },
  label: { fontSize: Typography.xs.size, lineHeight: Typography.xs.lineHeight, marginBottom: Spacing['2xs'], textTransform: "uppercase", letterSpacing: 0.5 },
  targetRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs },
  chip: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing['2xs'], borderRadius: Radii.pill, borderWidth: 1 },
  chipText: { fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight },
  buttonRow: { flexDirection: "row", gap: Spacing.xs, marginVertical: Spacing.sm, flexWrap: "wrap" },
  bigBtn: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, borderRadius: Radii.md, alignItems: "center" },
  bigBtnText: { fontSize: Typography.base.size, lineHeight: Typography.base.lineHeight },
  error: { fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight, marginVertical: Spacing.xs },
  scaleStrip: { flexDirection: "row", gap: Spacing['2xs'], marginVertical: Spacing.sm },
  scaleCell: { flex: 1, padding: Spacing.xs, borderRadius: Radii.sm, alignItems: "center", borderWidth: 1 },
  scaleCellNote: { fontSize: Typography.monoMd.size, lineHeight: Typography.monoMd.lineHeight },
  scaleCellSyllable: { fontSize: Typography.xs.size, lineHeight: Typography.xs.lineHeight, marginTop: Spacing['3xs'] },
  estRow: { borderWidth: 1, borderRadius: Radii.md, padding: Spacing.sm, marginBottom: Spacing.xs },
  estRowHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  estName: { fontSize: Typography.base.size, lineHeight: Typography.base.lineHeight },
  estStatsRight: { flexDirection: "row", gap: Spacing.sm, alignItems: "center" },
  estDetect: { fontSize: Typography.xs.size, lineHeight: Typography.xs.lineHeight },
  estOnTarget: { fontSize: Typography.xs.size, lineHeight: Typography.xs.lineHeight },
  estDescription: { fontSize: Typography.xs.size, lineHeight: Typography.xs.lineHeight, marginTop: Spacing['3xs'], marginBottom: Spacing.xs },
  placeholder: { fontSize: Typography.xs.size, lineHeight: Typography.xs.lineHeight, fontStyle: "italic", paddingVertical: Spacing.xs },
  resultStrip: { flexDirection: "row", gap: Spacing.xs, marginTop: Spacing['2xs'] },
  resultChip: { flex: 1, alignItems: "center", paddingVertical: Spacing.xs, paddingHorizontal: Spacing['2xs'], borderRadius: Radii.md },
  resultSyllable: { fontSize: Typography.xs.size, lineHeight: Typography.xs.lineHeight },
  resultNote: { fontSize: Typography.monoMd.size, lineHeight: Typography.monoMd.lineHeight, marginTop: Spacing['3xs'] },
  resultCents: { fontSize: Typography.monoSm.size, lineHeight: Typography.monoSm.lineHeight, marginTop: Spacing['3xs'] },
  resultPct: { fontSize: Typography.xs.size, lineHeight: Typography.xs.lineHeight, marginTop: Spacing['3xs'] },
});
