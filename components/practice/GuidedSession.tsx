import AsyncStorage from "@react-native-async-storage/async-storage";
import { Fonts, Radii, Spacing, Typography } from "@/constants/theme";
import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import MelodyDisplay from "./MelodyDisplay";
import { createAudioPlayer, type AudioPlayer, type NoteHandle } from "@/lib/audio";
import { midiToNote, noteToMidi } from "@/lib/exercises/music";
import type { ExerciseDescriptor, KeyIteration, VoicePart } from "@/lib/exercises/types";
import {
  createPitchDetector,
  type PitchDetector,
  type PitchSample,
} from "@/lib/pitch";
import { snapOctave } from "@/lib/scoring/align";
import type { SessionRecord } from "@/lib/progress";
import {
  buildKeyAttemptFromGuided,
  synthesizeGuidedIteration,
} from "@/lib/scoring/guidedToAttempt";
import { useTheme } from "@/hooks/use-theme";

import { rmsGateFor, toneColor } from "./tone-utils";

// Guided hold-and-match uses base threshold regardless of preset (no melody doubling risk).
const RMS_GATE_DB = rmsGateFor(undefined, true);
import type { Tone as ToneVal } from "./types";

const MATCH_HOLD_MS = 300;
const POST_MATCH_PAUSE_MS = 450;
const CUE_HOLD_MS = 1100;
const CUE_GAP_MS = 200;

const TOLERANCE_STORAGE_KEY = "vocal-training:guided-tolerance:v1";

type ToleranceLevel = "strict" | "normal" | "okay" | "ballpark";

const TOLERANCE_OPTIONS: { id: ToleranceLevel; label: string; cents: number }[] = [
  { id: "strict", label: "Strict", cents: 25 },
  { id: "normal", label: "Normal", cents: 50 },
  { id: "okay", label: "Okay", cents: 75 },
  { id: "ballpark", label: "Ballpark", cents: 100 },
];

function toleranceCents(level: ToleranceLevel): number {
  return TOLERANCE_OPTIONS.find((o) => o.id === level)?.cents ?? 50;
}

type Phase = "idle" | "loading" | "cue" | "listening" | "matched" | "complete";
type RepeatMode = "advance" | "repeat";

interface MatchResult {
  meanCents: number;
  frames: number;
}

// Pitchy's MPM latches onto sub-harmonics on chesty notes — sample.midi can
// land an octave (or two) off. Snap to the nearest octave of the target before
// computing deviation, so live matching tolerates the same errors scoring does.
function centsFromTarget(sample: PitchSample, targetMidi: number): number {
  if (sample.midi == null) return 0;
  const snapped = snapOctave(sample.midi, targetMidi);
  return (snapped - targetMidi) * 100 + (sample.cents ?? 0);
}

export default function GuidedSession({
  exercise,
  voicePart,
  onPatternComplete,
}: {
  exercise: ExerciseDescriptor;
  voicePart: VoicePart;
  /** Fires when a pattern finishes and bestPerNote has been finalized. The
   *  Practice screen routes the resulting record through the existing
   *  Log/Discard + Coaching CTA flow. iterations is a synthesized stub the
   *  coaching engine's `fromKeyAttempts` adapter consumes for syllables. */
  onPatternComplete?: (record: SessionRecord, iterations: KeyIteration[]) => void;
}) {
  const { colors, scheme } = useTheme();
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("advance");
  const [tolerance, setTolerance] = useState<ToleranceLevel>("normal");
  const [noteIndex, setNoteIndex] = useState(0);
  const [matchProgress, setMatchProgress] = useState(0);
  const [latestSample, setLatestSample] = useState<PitchSample | null>(null);
  const [currentTonicMidi, setCurrentTonicMidi] = useState<number | null>(null);
  const [matchesThisNote, setMatchesThisNote] = useState(0);
  const [lastMatchCents, setLastMatchCents] = useState<number | null>(null);
  // Best signed-cents per note index for the completed pattern. null entries = not yet reached.
  const [bestPerNoteArr, setBestPerNoteArr] = useState<(number | null)[]>([]);

  const playerRef = useRef<AudioPlayer | null>(null);
  const detectorRef = useRef<PitchDetector | null>(null);
  const detectorUnsubRef = useRef<(() => void) | null>(null);
  const noteHandleRef = useRef<NoteHandle | null>(null);
  const abortRef = useRef<{ aborted: boolean }>({ aborted: false });
  const repeatModeRef = useRef<RepeatMode>(repeatMode);
  const toleranceRef = useRef<ToleranceLevel>(tolerance);
  // Captured at the start of each pattern so the synthesized SessionRecord
  // carries an accurate startedAt.
  const patternStartedAtRef = useRef<number>(0);

  useEffect(() => {
    repeatModeRef.current = repeatMode;
  }, [repeatMode]);

  useEffect(() => {
    toleranceRef.current = tolerance;
  }, [tolerance]);

  // Restore persisted tolerance once on mount.
  useEffect(() => {
    AsyncStorage.getItem(TOLERANCE_STORAGE_KEY)
      .then((v) => {
        if (v && TOLERANCE_OPTIONS.some((o) => o.id === v)) {
          setTolerance(v as ToleranceLevel);
        }
      })
      .catch(() => {});
  }, []);

  function handleSetTolerance(next: ToleranceLevel) {
    setTolerance(next);
    AsyncStorage.setItem(TOLERANCE_STORAGE_KEY, next).catch(() => {});
  }

  const range = exercise.voicePartRanges[voicePart];
  const startTonicMidi = useMemo(
    () => (range ? noteToMidi(range.lowest) : null),
    [range],
  );

  const syllables = useMemo(() => {
    if (exercise.syllables.length === 1) {
      return Array(exercise.scaleDegrees.length).fill(exercise.syllables[0]);
    }
    return [...exercise.syllables];
  }, [exercise]);

  const activeTonicMidi = currentTonicMidi ?? startTonicMidi;
  const targetMidi =
    activeTonicMidi != null && phase !== "idle" && phase !== "loading"
      ? activeTonicMidi + exercise.scaleDegrees[noteIndex]
      : null;

  // Highest valid tonic in the configured range; null if no range.
  const highestTonicMidi = useMemo(
    () => (range ? noteToMidi(range.highest) : null),
    [range],
  );
  const stepSemis = range?.step ?? 1;
  const canAdvanceTonic =
    currentTonicMidi != null &&
    highestTonicMidi != null &&
    currentTonicMidi + stepSemis <= highestTonicMidi;
  const nextTonicMidi = canAdvanceTonic ? (currentTonicMidi as number) + stepSemis : null;

  useEffect(() => {
    return () => {
      abortRef.current.aborted = true;
      detectorUnsubRef.current?.();
      noteHandleRef.current?.release();
      detectorRef.current?.stop().catch(() => {});
      playerRef.current?.dispose().catch(() => {});
    };
  }, []);

  async function handleStart() {
    if (phase !== "idle" && phase !== "complete") return;
    if (startTonicMidi == null) {
      setError(`This exercise has no ${voicePart} range defined.`);
      return;
    }
    setError(null);
    setPhase("loading");
    setNoteIndex(0);
    setMatchProgress(0);
    setMatchesThisNote(0);
    setLastMatchCents(null);
    setBestPerNoteArr([]);
    setCurrentTonicMidi(startTonicMidi);
    abortRef.current = { aborted: false };

    try {
      if (!playerRef.current) playerRef.current = createAudioPlayer();
      if (!detectorRef.current) detectorRef.current = createPitchDetector();

      await playerRef.current.init();
      await detectorRef.current.start();

      detectorUnsubRef.current = detectorRef.current.on(setLatestSample);

      await runGuided(startTonicMidi);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg !== "aborted") setError(msg);
      await teardown();
      setPhase("idle");
    }
  }

  async function handleNextTonic() {
    if (!canAdvanceTonic || nextTonicMidi == null) return;
    setError(null);
    setNoteIndex(0);
    setMatchProgress(0);
    setMatchesThisNote(0);
    setLastMatchCents(null);
    setBestPerNoteArr([]);
    setCurrentTonicMidi(nextTonicMidi);
    abortRef.current = { aborted: false };
    try {
      // Player + detector are still alive from the prior pattern; just run again.
      await runGuided(nextTonicMidi);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg !== "aborted") setError(msg);
      await teardown();
      setPhase("idle");
    }
  }

  async function handleStop() {
    abortRef.current.aborted = true;
    noteHandleRef.current?.release();
    noteHandleRef.current = null;
    await teardown();
    setPhase("idle");
    setMatchProgress(0);
  }

  async function teardown() {
    detectorUnsubRef.current?.();
    detectorUnsubRef.current = null;
    await detectorRef.current?.stop().catch(() => {});
  }

  async function runGuided(tonicMidi: number) {
    const player = playerRef.current;
    const detector = detectorRef.current;
    if (!player || !detector) return;

    patternStartedAtRef.current = Date.now();

    // Cue
    setPhase("cue");
    const cueHandle = player.holdNote(midiToNote(tonicMidi), 0.55);
    noteHandleRef.current = cueHandle;
    await delay(CUE_HOLD_MS);
    if (abortRef.current.aborted) {
      cueHandle.release();
      throw new Error("aborted");
    }
    cueHandle.release();
    noteHandleRef.current = null;
    await delay(CUE_GAP_MS);
    if (abortRef.current.aborted) throw new Error("aborted");

    // Pattern loop
    let i = 0;
    // Track best attempt per note index across reps (smallest absolute cents).
    const bestPerNote: (number | null)[] = Array(exercise.scaleDegrees.length).fill(null);

    while (i < exercise.scaleDegrees.length && !abortRef.current.aborted) {
      setNoteIndex(i);
      setMatchProgress(0);
      setPhase("listening");

      const target = tonicMidi + exercise.scaleDegrees[i];
      const handle = player.holdNote(midiToNote(target), 0.85);
      noteHandleRef.current = handle;

      const matchResult = await waitForMatch(detector, target);
      if (abortRef.current.aborted) {
        handle.release();
        throw new Error("aborted");
      }

      handle.release();
      noteHandleRef.current = null;
      setLastMatchCents(matchResult.meanCents);

      // Track best (smallest absolute cents) across all reps for this note.
      const prevBest = bestPerNote[i];
      if (prevBest == null || Math.abs(matchResult.meanCents) < Math.abs(prevBest)) {
        bestPerNote[i] = matchResult.meanCents;
      }

      setPhase("matched");
      setMatchesThisNote((c) => c + 1);
      await delay(POST_MATCH_PAUSE_MS);
      if (abortRef.current.aborted) throw new Error("aborted");

      if (repeatModeRef.current === "advance") {
        i++;
        setMatchesThisNote(0);
      }
      // In repeat mode i stays the same — the loop replays this note.
    }

    if (!abortRef.current.aborted) {
      setBestPerNoteArr([...bestPerNote]);

      // Synthesize a SessionRecord so Practice can run this through the same
      // Log/Discard + Coaching CTA flow as Standard mode.
      if (onPatternComplete) {
        const attempt = buildKeyAttemptFromGuided(
          bestPerNote,
          tonicMidi,
          exercise.scaleDegrees,
        );
        const iterations = synthesizeGuidedIteration(exercise, tonicMidi);
        const startedAt = patternStartedAtRef.current;
        const record: SessionRecord = {
          id:
            typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : `g-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          startedAt,
          completedAt: Date.now(),
          exerciseId: exercise.id,
          voicePart,
          tempo: exercise.tempo,
          keyAttempts: [attempt],
          totalDurationMs: Date.now() - startedAt,
        };
        onPatternComplete(record, iterations);
      }
    }

    if (!abortRef.current.aborted) setPhase("complete");
    // No teardown here — keep player + detector alive so Next-Tonic can reuse them.
  }

  function waitForMatch(detector: PitchDetector, target: number): Promise<MatchResult> {
    return new Promise((resolve) => {
      let matchStart: number | null = null;
      let centsSum = 0;
      let frames = 0;
      let active = true;

      const unsub = detector.on((sample) => {
        if (!active) return;
        setLatestSample(sample);

        if (abortRef.current.aborted) {
          finish();
          return;
        }

        if (sample.midi == null || (sample.rmsDb ?? -100) < RMS_GATE_DB) {
          matchStart = null;
          centsSum = 0;
          frames = 0;
          setMatchProgress(0);
          return;
        }

        const cents = centsFromTarget(sample, target);
        const tol = toleranceCents(toleranceRef.current);
        if (Math.abs(cents) <= tol) {
          if (matchStart == null) {
            matchStart = sample.timestamp;
            centsSum = cents;
            frames = 1;
          } else {
            centsSum += cents;
            frames += 1;
          }
          const dur = sample.timestamp - matchStart;
          setMatchProgress(Math.min(1, dur / MATCH_HOLD_MS));
          if (dur >= MATCH_HOLD_MS) {
            finish();
            return;
          }
        } else {
          matchStart = null;
          centsSum = 0;
          frames = 0;
          setMatchProgress(0);
        }
      });

      function finish() {
        if (!active) return;
        active = false;
        unsub();
        resolve({ meanCents: frames > 0 ? centsSum / frames : 0, frames });
      }
    });
  }

  const tolCents = toleranceCents(tolerance);

  const liveCents =
    latestSample?.midi != null && targetMidi != null
      ? centsFromTarget(latestSample, targetMidi)
      : null;

  const liveTone: ToneVal =
    liveCents == null
      ? "idle"
      : Math.abs(liveCents) <= tolCents
        ? "good"
        : Math.abs(liveCents) <= tolCents * 1.6
          ? "warn"
          : "bad";

  const liveLabel = describeLive(latestSample, targetMidi, phase, tolCents, lastMatchCents);

  const targetNoteName = targetMidi != null ? midiToNote(targetMidi) : "—";
  const isRunning = phase !== "idle" && phase !== "complete";
  const tonicLabel = activeTonicMidi != null ? midiToNote(activeTonicMidi) : "—";
  const lastLabel =
    lastMatchCents != null
      ? `${signed(lastMatchCents)}¢`
      : "—";

  return (
    <View style={styles.container}>
      <GuidedSection title="Mode controls" colors={colors}>
        <View style={styles.repeatRow}>
          {(["advance", "repeat"] as RepeatMode[]).map((m) => {
            const active = repeatMode === m;
            return (
              <Pressable
                key={m}
                onPress={() => setRepeatMode(m)}
                style={[
                  styles.repeatChip,
                  {
                    backgroundColor: active ? colors.accentMuted : colors.bgSurface,
                    borderColor: active ? colors.accent : colors.borderSubtle,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.repeatChipText,
                    { color: active ? colors.accent : colors.textSecondary, fontFamily: Fonts.bodyMedium },
                  ]}
                >
                  {m === "advance" ? "Advance after match" : "Repeat same note"}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={[styles.subtle, { color: colors.textSecondary, fontFamily: Fonts.body }]}>
          {repeatMode === "advance"
            ? "Match the held note to advance through the pattern."
            : "Stay on the same note and drill it. Toggle to advance when ready."}
        </Text>
      </GuidedSection>

      <GuidedSection title={`Close-enough threshold · ±${tolCents}¢`} colors={colors}>
        <View style={styles.tolRow}>
          {TOLERANCE_OPTIONS.map((o) => {
            const active = tolerance === o.id;
            return (
              <Pressable
                key={o.id}
                onPress={() => handleSetTolerance(o.id)}
                style={[
                  styles.tolChip,
                  {
                    backgroundColor: active ? colors.accentMuted : colors.bgSurface,
                    borderColor: active ? colors.accent : colors.borderSubtle,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tolChipLabel,
                    { color: active ? colors.accent : colors.textSecondary, fontFamily: Fonts.bodyMedium },
                  ]}
                >
                  {o.label}
                </Text>
                <Text
                  style={[
                    styles.tolChipCents,
                    { color: active ? colors.accent : colors.textTertiary, fontFamily: Fonts.mono },
                  ]}
                >
                  ±{o.cents}¢
                </Text>
              </Pressable>
            );
          })}
        </View>
      </GuidedSection>

      <View style={[styles.heroCard, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle }]}>
        <Text style={[styles.heroLabel, { color: colors.textTertiary, fontFamily: Fonts.body }]}>
          Sing this note
        </Text>
        <Text style={[styles.heroNote, { color: colors.textPrimary, fontFamily: Fonts.display }]}>
          {targetNoteName}
        </Text>
        <Text style={[styles.heroSyllable, { color: colors.textSecondary, fontFamily: Fonts.display }]}>
          {targetMidi != null ? syllables[noteIndex] ?? "" : "—"}
        </Text>
        <View style={[styles.matchBarTrack, { backgroundColor: colors.borderSubtle }]}>
          <View
            style={[
              styles.matchBarFill,
              {
                width: `${Math.round(matchProgress * 100)}%`,
                backgroundColor: matchProgress >= 1 ? colors.success : colors.success + "77",
              },
            ]}
          />
        </View>
        <Text style={[styles.liveLabel, { color: toneColor(liveTone, scheme), fontFamily: Fonts.bodyMedium }]}>
          {liveLabel}
        </Text>
      </View>

      <MelodyDisplay
        notes={
          activeTonicMidi != null
            ? exercise.scaleDegrees.map((deg, i) => ({
                midi: activeTonicMidi + deg,
                syllable: syllables[i] ?? "",
              }))
            : syllables.map((s) => ({ midi: 60, syllable: s }))
        }
        currentIndex={isRunning ? noteIndex : -1}
        noteProgress={matchProgress}
        tonicMidi={activeTonicMidi ?? undefined}
        size="compact"
      />

      <View style={styles.statRow}>
        <SmallStat label="Tonic" value={tonicLabel} colors={colors} />
        <SmallStat label="Note" value={`${noteIndex + 1}/${exercise.scaleDegrees.length}`} colors={colors} />
        <SmallStat label="Reps" value={`${matchesThisNote}`} colors={colors} />
        <SmallStat label="Last" value={lastLabel} colors={colors} />
      </View>

      {error && <Text style={[styles.error, { color: colors.error, fontFamily: Fonts.body }]}>{error}</Text>}
      {phase === "complete" && (
        <>
          <Text style={[styles.complete, { color: colors.success, fontFamily: Fonts.bodySemibold }]}>
            {canAdvanceTonic
              ? `Pattern complete — ready for ${midiToNote(nextTonicMidi as number)}.`
              : "Pattern complete — top of range."}
          </Text>
          {bestPerNoteArr.length > 0 && (
            <View style={styles.noteBreakdown}>
              {syllables.map((syl, idx) => {
                const cents = bestPerNoteArr[idx];
                return (
                  <NoteBreakdownCell
                    key={idx}
                    syllable={syl}
                    cents={cents}
                    tolCents={tolCents}
                    colors={colors}
                  />
                );
              })}
            </View>
          )}
        </>
      )}

      <View style={styles.actions}>
        {phase === "idle" && (
          <Pressable
            style={[styles.btn, { backgroundColor: colors.accent, minHeight: 44 }]}
            onPress={handleStart}
          >
            <Text style={[styles.btnText, { color: colors.canvas, fontFamily: Fonts.bodySemibold }]}>
              Start guided
            </Text>
          </Pressable>
        )}
        {phase === "complete" && (
          <View style={styles.completeRow}>
            <Pressable
              style={[
                styles.btn,
                styles.flex1,
                {
                  backgroundColor: canAdvanceTonic ? colors.accent : colors.textTertiary,
                  opacity: canAdvanceTonic ? 1 : 0.5,
                  minHeight: 44,
                },
              ]}
              onPress={handleNextTonic}
              disabled={!canAdvanceTonic}
            >
              <Text style={[styles.btnText, { color: colors.canvas, fontFamily: Fonts.bodySemibold }]}>
                {canAdvanceTonic
                  ? `Next tonic ↑ ${midiToNote(nextTonicMidi as number)}`
                  : "Top of range"}
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.btn,
                styles.flex1,
                {
                  backgroundColor: colors.bgSurface,
                  borderWidth: 1,
                  borderColor: colors.borderStrong,
                  minHeight: 44,
                },
              ]}
              onPress={handleStop}
            >
              <Text style={[styles.btnText, { color: colors.textPrimary, fontFamily: Fonts.bodySemibold }]}>
                Done
              </Text>
            </Pressable>
          </View>
        )}
        {isRunning && (
          <Pressable
            style={[styles.btn, { backgroundColor: colors.error, minHeight: 44 }]}
            onPress={handleStop}
          >
            <Text style={[styles.btnText, { color: colors.canvas, fontFamily: Fonts.bodySemibold }]}>
              {phase === "loading" ? "Loading…" : "Stop"}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function describeLive(
  sample: PitchSample | null,
  targetMidi: number | null,
  phase: Phase,
  tolCents: number,
  lastMatchCents: number | null,
): string {
  if (phase === "idle") return "Ready when you are";
  if (phase === "loading") return "Loading…";
  if (phase === "cue") return "Listen to the tonic";
  if (phase === "matched") {
    return lastMatchCents != null
      ? `Matched ✓ ${signed(lastMatchCents)}¢`
      : "Matched ✓";
  }
  if (phase === "complete") return "Pattern complete";
  if (!sample || sample.midi == null || (sample.rmsDb ?? -100) < RMS_GATE_DB) {
    return "Sing along to the held note…";
  }
  if (targetMidi == null) return "—";
  const cents = centsFromTarget(sample, targetMidi);
  const abs = Math.abs(cents);
  if (abs <= tolCents) return "Holding match…";
  if (abs < 60) return `Slightly ${cents > 0 ? "sharp" : "flat"} (${signed(cents)}¢)`;
  if (abs < 100) return `${cents > 0 ? "Sharp" : "Flat"} by ${Math.round(abs)}¢`;
  const semitones = Math.round(cents / 100);
  return `${Math.abs(semitones)} semi ${semitones > 0 ? "above" : "below"} target`;
}

function signed(n: number): string {
  const r = Math.round(n);
  if (r > 0) return `+${r}`;
  if (r < 0) return `−${Math.abs(r)}`;
  return "0";
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type ThemeColors = ReturnType<typeof useTheme>["colors"];

function GuidedSection({
  title,
  children,
  colors,
}: {
  title: string;
  children: React.ReactNode;
  colors: ThemeColors;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionH, { color: colors.textTertiary, fontFamily: Fonts.bodySemibold }]}>
        {title}
      </Text>
      {children}
    </View>
  );
}

function SmallStat({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: ThemeColors;
}) {
  return (
    <View style={[styles.smallStat, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle }]}>
      <Text style={[styles.smallStatLabel, { color: colors.textTertiary, fontFamily: Fonts.body }]}>
        {label}
      </Text>
      <Text style={[styles.smallStatValue, { color: colors.textPrimary, fontFamily: Fonts.display }]}>
        {value}
      </Text>
    </View>
  );
}

function NoteBreakdownCell({
  syllable,
  cents,
  tolCents,
  colors,
}: {
  syllable: string;
  cents: number | null;
  tolCents: number;
  colors: ThemeColors;
}) {
  const abs = cents != null ? Math.abs(cents) : null;
  const bg =
    abs == null       ? colors.bgSurface
    : abs <= tolCents       ? colors.success + "22"
    : abs <= tolCents * 2   ? colors.warning + "22"
    :                         colors.error + "22";
  const textColor =
    abs == null       ? colors.textTertiary
    : abs <= tolCents       ? colors.success
    : abs <= tolCents * 2   ? colors.warning
    :                         colors.error;
  return (
    <View style={[styles.breakdownCell, { backgroundColor: bg }]}>
      <Text style={[styles.breakdownSyllable, { color: colors.textPrimary, fontFamily: Fonts.bodyMedium }]}>
        {syllable}
      </Text>
      <Text style={[styles.breakdownCents, { color: textColor, fontFamily: Fonts.mono }]}>
        {cents != null ? `${signed(cents)}¢` : "—"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.md },
  section: { gap: Spacing["2xs"] },
  sectionH: {
    fontSize: Typography.xs.size,
    lineHeight: Typography.xs.lineHeight,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  subtle: {
    fontSize: Typography.sm.size,
    lineHeight: Typography.sm.lineHeight,
  },
  repeatRow: { flexDirection: "row", gap: Spacing.xs },
  repeatChip: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radii.md,
    borderWidth: 1,
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
  },
  repeatChipText: {
    fontSize: Typography.sm.size,
    lineHeight: Typography.sm.lineHeight,
  },
  tolRow: { flexDirection: "row", gap: Spacing.xs },
  tolChip: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: Radii.md,
    borderWidth: 1,
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
  },
  tolChipLabel: {
    fontSize: Typography.sm.size,
    lineHeight: Typography.sm.lineHeight,
  },
  tolChipCents: {
    fontSize: Typography.xs.size,
    lineHeight: Typography.xs.lineHeight,
    marginTop: Spacing["3xs"],
  },
  heroCard: {
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    alignItems: "center",
    gap: Spacing.sm,
  },
  heroLabel: {
    fontSize: Typography.xs.size,
    lineHeight: Typography.xs.lineHeight,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  heroNote: {
    fontSize: Typography['3xl'].size,
    lineHeight: Typography['3xl'].lineHeight,
    letterSpacing: -2,
  },
  heroSyllable: {
    fontSize: Typography.lg.size,
    lineHeight: Typography.lg.lineHeight,
    marginTop: -Spacing["2xs"],
  },
  matchBarTrack: {
    width: "100%",
    height: Spacing.xs,
    borderRadius: Radii.sm,
    overflow: "hidden",
    marginTop: Spacing.xs,
  },
  matchBarFill: { height: "100%", borderRadius: Radii.sm },
  liveLabel: {
    fontSize: Typography.md.size,
    lineHeight: Typography.md.lineHeight,
  },
  statRow: { flexDirection: "row", gap: Spacing.xs },
  smallStat: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.md,
    borderWidth: 1,
    alignItems: "center",
  },
  smallStatLabel: {
    fontSize: Typography.xs.size,
    lineHeight: Typography.xs.lineHeight,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  smallStatValue: {
    fontSize: Typography.lg.size,
    lineHeight: Typography.lg.lineHeight,
  },
  actions: { marginTop: Spacing.xs },
  btn: { paddingVertical: Spacing.md, borderRadius: Radii.md, alignItems: "center" },
  completeRow: { flexDirection: "row", gap: Spacing.sm },
  flex1: { flex: 1 },
  error: {
    fontSize: Typography.sm.size,
    lineHeight: Typography.sm.lineHeight,
  },
  complete: {
    fontSize: Typography.sm.size,
    lineHeight: Typography.sm.lineHeight,
  },
  btnText: {
    fontSize: Typography.md.size,
    lineHeight: Typography.md.lineHeight,
  },
  noteBreakdown: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
    marginTop: Spacing["2xs"],
  },
  breakdownCell: {
    alignItems: "center",
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radii.md,
    minWidth: 44,
  },
  breakdownSyllable: {
    fontSize: Typography.sm.size,
    lineHeight: Typography.sm.lineHeight,
  },
  breakdownCents: {
    fontSize: Typography.xs.size,
    lineHeight: Typography.xs.lineHeight,
    marginTop: Spacing["3xs"],
  },
});
