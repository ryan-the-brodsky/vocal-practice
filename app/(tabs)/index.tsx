import AsyncStorage from "@react-native-async-storage/async-storage";
import { Fonts, Radii, Spacing, Typography } from "@/constants/theme";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, useWindowDimensions, View } from "react-native";
import { useTheme } from "@/hooks/use-theme";

import { IconSymbol } from "@/components/ui/icon-symbol";

import GuidedSession from "@/components/practice/GuidedSession";
import {
  HeadphonesBanner,
  MelodyDisplay,
  NoteResultsStrip,
  Section,
  Stat,
  rmsGateFor,
  summarizeKey,
} from "@/components/practice";
import { createAudioPlayer, type AudioPlayer, type SequenceHandle } from "@/lib/audio";
import {
  ADVICE_CARDS_BY_ID,
  DETECTOR_MAPPINGS_BY_ID,
  diagnoseSession,
  fromKeyAttempts,
} from "@/lib/coaching";
import { flattenIterations, planExercise } from "@/lib/exercises/engine";
import { exerciseLibrary, getAllExercises } from "@/lib/exercises/library";
import { midiToNote, noteToMidi } from "@/lib/exercises/music";
import ImportModal from "@/components/import/ImportModal";
import type {
  AccompanimentPreset,
  ExerciseDescriptor,
  KeyIteration,
  NoteEvent,
  VoicePart,
} from "@/lib/exercises/types";
import {
  createPitchDetector,
  type PitchDetector,
  type PitchSample,
} from "@/lib/pitch";
import { createAsyncStorageStore, type SessionRecord } from "@/lib/progress";
import { SessionTracker, type SessionTrackerSnapshot } from "@/lib/session/tracker";
import { loadVoicePart, saveVoicePart } from "@/lib/settings/voicePart";

const VOICE_PARTS: VoicePart[] = ["soprano", "alto", "tenor", "baritone"];
const MODE_STORAGE_KEY = "vocal-training:mode:v1";
const DEMO_ENABLED_KEY = "vocal-training:settings:demo-enabled";

type Mode = "standard" | "guided";
type Guidance = "full" | "tonic-only";

const sessionStore = createAsyncStorageStore();

export default function PracticeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 640;
  const { colors } = useTheme();
  const [mode, setMode] = useState<Mode>("standard");
  const [exerciseId, setExerciseId] = useState(
    exerciseLibrary.find((e) => e.id === "five-note-scale-mee-may-mah")?.id ??
      exerciseLibrary[0].id,
  );
  // Async-loaded merged list (built-ins + user-imported); refreshed when an import saves.
  const [availableExercises, setAvailableExercises] = useState<ExerciseDescriptor[]>(exerciseLibrary);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [voicePart, setVoicePartState] = useState<VoicePart>("tenor");
  const setVoicePart = useCallback((next: VoicePart) => {
    setVoicePartState(next);
    saveVoicePart(next).catch(() => {});
  }, []);
  const [accompanimentPreset, setAccompanimentPreset] = useState<AccompanimentPreset | undefined>("classical");
  // null = modal not yet answered; true/false set by HeadphonesModal.
  const [headphonesConfirmed, setHeadphonesConfirmed] = useState<boolean | null>(null);
  // Per-exercise tonic memory: key is `${exerciseId}|${voicePart}`, value is tonicMidi.
  const [exerciseTonicMap, setExerciseTonicMap] = useState<Map<string, number>>(new Map());
  const [guidance, setGuidance] = useState<Guidance>("full");
  const [demoEnabled, setDemoEnabled] = useState(true);
  useEffect(() => {
    AsyncStorage.getItem(MODE_STORAGE_KEY)
      .then((v) => {
        if (v === "guided") setMode("guided");
      })
      .catch(() => {});
    AsyncStorage.getItem(DEMO_ENABLED_KEY)
      .then((v) => {
        if (v === "false") setDemoEnabled(false);
      })
      .catch(() => {});
    loadVoicePart()
      .then((vp) => {
        if (vp) setVoicePartState(vp);
      })
      .catch(() => {});
    getAllExercises()
      .then((list) => setAvailableExercises(list))
      .catch(() => setAvailableExercises(exerciseLibrary));
  }, []);

  const handleImportSaved = useCallback(async (newId: string) => {
    try {
      const list = await getAllExercises();
      setAvailableExercises(list);
      // Auto-select the freshly-imported exercise.
      if (list.some((e) => e.id === newId)) setExerciseId(newId);
    } catch {
      setAvailableExercises(exerciseLibrary);
    }
  }, []);

  function handleSetMode(next: Mode) {
    setMode(next);
    AsyncStorage.setItem(MODE_STORAGE_KEY, next).catch(() => {});
  }

  function handleSetDemoEnabled(val: boolean) {
    setDemoEnabled(val);
    AsyncStorage.setItem(DEMO_ENABLED_KEY, String(val)).catch(() => {});
  }

  const [status, setStatus] = useState<"idle" | "loading" | "demo" | "playing" | "stopping">("idle");
  const [error, setError] = useState<string | null>(null);
  const [latestSample, setLatestSample] = useState<PitchSample | null>(null);
  const [currentTarget, setCurrentTarget] = useState<NoteEvent | null>(null);
  const [noteProgress, setNoteProgress] = useState(0);
  const [progress, setProgress] = useState(0);
  const [snapshot, setSnapshot] = useState<SessionTrackerSnapshot | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [coachingCta, setCoachingCta] = useState<{ sessionId: string; previewText: string } | null>(null);
  // Pending session awaiting user's Log/Discard decision. Not persisted until logged.
  const [pendingSession, setPendingSession] = useState<SessionRecord | null>(null);
  const [loggedMessage, setLoggedMessage] = useState<string | null>(null);
  // Beats remaining until melody starts (null when not in lead-in window).
  const [leadInCountdown, setLeadInCountdown] = useState<number | null>(null);

  const playerRef = useRef<AudioPlayer | null>(null);
  const detectorRef = useRef<PitchDetector | null>(null);
  const detectorUnsubRef = useRef<(() => void) | null>(null);
  const sequenceHandleRef = useRef<SequenceHandle | null>(null);
  const demoHandleRef = useRef<SequenceHandle | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const trackerRef = useRef<SessionTracker | null>(null);
  const sessionStartMsRef = useRef<number>(0);
  const audioStartMsRef = useRef<number>(0);
  const detectorStartMsRef = useRef<number>(0);
  const iterationsRef = useRef<KeyIteration[]>([]);
  // Per-exercise session-end state. Switching exercises stashes the current
  // exercise's bucket here and rehydrates the destination's, so each exercise
  // keeps its own snapshot / pending log / coaching CTA independently.
  const exerciseSessionsRef = useRef<
    Map<string, {
      snapshot: SessionTrackerSnapshot | null;
      pendingSession: SessionRecord | null;
      coachingCta: { sessionId: string; previewText: string } | null;
    }>
  >(new Map());
  // Resolved when the user taps "Skip demo" during the demo phase.
  const demoSkipRef = useRef<(() => void) | null>(null);
  // Set to true when Stop is pressed during the demo phase so handleStart can abort.
  const demoAbortedRef = useRef(false);

  const exercise = useMemo(
    () =>
      availableExercises.find((e) => e.id === exerciseId) ??
      exerciseLibrary.find((e) => e.id === exerciseId) ??
      exerciseLibrary[0],
    [availableExercises, exerciseId],
  );

  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      detectorUnsubRef.current?.();
      detectorRef.current?.stop().catch(() => {});
      playerRef.current?.dispose().catch(() => {});
    };
  }, []);

  const supportsVoicePart = exercise.voicePartRanges[voicePart] !== undefined;

  /** Map key for per-exercise tonic memory. */
  const tonicMapKey = `${exerciseId}|${voicePart}`;

  /** Default (lowest) tonic MIDI for the current exercise + voice part. */
  const defaultTonicMidi = useMemo((): number | null => {
    const range = exercise.voicePartRanges[voicePart];
    if (!range) return null;
    try { return noteToMidi(range.lowest); } catch { return null; }
  }, [exercise, voicePart]);

  /** The tonic MIDI this session will start from (saved or default). Clamped to valid range. */
  const startTonicMidi = useMemo((): number | null => {
    if (defaultTonicMidi === null) return null;
    const range = exercise.voicePartRanges[voicePart]!;
    let saved = exerciseTonicMap.get(tonicMapKey) ?? defaultTonicMidi;
    // Clamp if voice part changed and saved tonic is now out of range.
    const low = defaultTonicMidi;
    let high = low;
    try { high = noteToMidi(range.highest); } catch { /* keep low */ }
    if (saved < low || saved > high) saved = low;
    return saved;
  }, [exerciseTonicMap, tonicMapKey, defaultTonicMidi, exercise, voicePart]);

  /** Reset current exercise back to its range's lowest tonic and clear any
   *  in-flight session state so the next run starts from a clean slate. */
  const handleResetTonic = useCallback(() => {
    if (status !== "idle") return;
    setExerciseTonicMap((prev) => {
      const next = new Map(prev);
      next.delete(tonicMapKey);
      return next;
    });
    setSnapshot(null);
    setPendingSession(null);
    setCoachingCta(null);
    setSavedMessage(null);
    setLoggedMessage(null);
  }, [status, tonicMapKey]);

  /** Switch to a different exercise, preserving each exercise's own session-end state. */
  const handleExerciseChange = useCallback((newId: string) => {
    if (newId === exerciseId) return;
    exerciseSessionsRef.current.set(exerciseId, { snapshot, pendingSession, coachingCta });
    const slice = exerciseSessionsRef.current.get(newId);
    setSnapshot(slice?.snapshot ?? null);
    setPendingSession(slice?.pendingSession ?? null);
    setCoachingCta(slice?.coachingCta ?? null);
    setError(null);
    setSavedMessage(null);
    setLoggedMessage(null);
    setExerciseId(newId);
  }, [exerciseId, snapshot, pendingSession, coachingCta]);

  async function handleStart() {
    if (status !== "idle") return;
    if (!supportsVoicePart) {
      setError(`This exercise has no ${voicePart} range defined.`);
      return;
    }
    setError(null);
    setSavedMessage(null);
    setCoachingCta(null);
    setPendingSession(null);
    setLoggedMessage(null);
    setStatus("loading");

    try {
      if (!playerRef.current) playerRef.current = createAudioPlayer();
      if (!detectorRef.current) detectorRef.current = createPitchDetector();

      await playerRef.current.init();

      // Demo: play first-tonic pattern once (no mic, no scoring) so user hears it.
      // Always use guidance:'full' so the demo shows the complete accompaniment
      // regardless of the user's performance guidance setting (tonic-only, etc.).
      demoAbortedRef.current = false;
      // Capture startTonicMidi here so both demo and session use the same snapshot.
      const sessionStartTonic = startTonicMidi;
      const startTonicNote = sessionStartTonic !== null ? midiToNote(sessionStartTonic) : undefined;
      if (demoEnabled) {
        const demoIter = planExercise({
          exercise,
          voicePart,
          accompanimentPreset,
          guidance: "full",
          // Demo always plays the session's starting tonic, then stops there.
          startTonicOverride: startTonicNote,
          endTonicOverride: startTonicNote ?? exercise.voicePartRanges[voicePart]!.lowest,
        });
        const demoFlat = flattenIterations(demoIter, 0);
        const demoHandle = playerRef.current.playSequence(demoFlat.events);
        demoHandleRef.current = demoHandle;
        setStatus("demo");

        // Wait for demo to finish or for the user to skip (via demoSkipRef).
        await new Promise<void>((resolve) => {
          const pollId = setInterval(() => {
            if (demoHandle.getProgress() >= 1) {
              clearInterval(pollId);
              demoSkipRef.current = null;
              demoHandleRef.current = null;
              resolve();
            }
          }, 80);
          demoSkipRef.current = () => {
            clearInterval(pollId);
            demoHandle.stop();
            demoHandleRef.current = null;
            demoSkipRef.current = null;
            resolve();
          };
        });

        // If Stop was pressed during demo, bail out (handleStop already set state).
        if (demoAbortedRef.current) return;
        setStatus("loading");
      }

      // Apply per-exercise pitch-detector tuning before starting capture.
      // Defaults track the postprocessor's defaults (0.85 / 3) so non-trill
      // exercises behave identically.
      const hints = exercise.scoringHints;
      detectorRef.current.setClarityThreshold(hints?.clarityThreshold ?? 0.85);
      detectorRef.current.setOctaveJumpFrames(hints?.octaveJumpFrames ?? 3);

      await detectorRef.current.start();
      detectorStartMsRef.current = performance.now();

      const iterations = planExercise({
        exercise,
        voicePart,
        accompanimentPreset,
        guidance,
        clickTrackEnabled: true,
        startTonicOverride: startTonicNote,
      });
      iterationsRef.current = iterations;
      const flat = flattenIterations(iterations, 1.0);

      audioStartMsRef.current = performance.now();
      sessionStartMsRef.current = Date.now();
      const handle = playerRef.current.playSequence(flat.events);
      sequenceHandleRef.current = handle;

      const tracker = new SessionTracker(
        iterations,
        flat.keyStarts,
        audioStartMsRef.current,
        detectorStartMsRef.current,
        hints,
      );
      trackerRef.current = tracker;

      const rmsGate = rmsGateFor(accompanimentPreset, headphonesConfirmed ?? false);
      detectorUnsubRef.current = detectorRef.current.on((sample) => {
        setLatestSample(sample);
        if (sample.rmsDb >= rmsGate) tracker.pushSample(sample);
      });

      setStatus("playing");

      tickRef.current = setInterval(() => {
        const t = handle.getCurrentTime();
        const p = handle.getProgress();
        setProgress(p);

        let activeTarget: NoteEvent | null = null;
        for (const e of flat.events) {
          if (e.type !== "melody") continue;
          if (t >= e.startTime && t < e.startTime + e.duration) {
            activeTarget = e;
            break;
          }
        }
        setCurrentTarget(activeTarget);

        if (activeTarget) {
          const np = Math.min(
            1,
            Math.max(0, (t - activeTarget.startTime) / activeTarget.duration),
          );
          setNoteProgress(np);
        } else {
          setNoteProgress(0);
        }

        // Compute lead-in countdown: beats remaining until melody starts for the current key.
        let countdown: number | null = null;
        const beatSec = 60 / exercise.tempo;
        for (let ki = 0; ki < flat.keyStarts.length; ki++) {
          const ks = flat.keyStarts[ki];
          const iter = iterations[ki];
          if (!iter) continue;
          const keyT = t - ks.startTime; // time within this key iteration
          if (keyT >= iter.cueDurationSec && keyT < iter.melodyStartSec) {
            countdown = Math.max(1, Math.ceil((iter.melodyStartSec - keyT) / beatSec));
            break;
          }
        }
        setLeadInCountdown(countdown);

        setSnapshot(tracker.getSnapshot(t));

        if (p >= 1) handleStop().catch(() => {});
      }, 80);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setStatus("idle");
    }
  }

  async function handleStop() {
    // Handle Stop during demo phase: signal abort and let handleStart clean up.
    if (demoSkipRef.current) {
      demoAbortedRef.current = true;
      demoSkipRef.current();
      setStatus("idle");
      return;
    }
    // Guard with refs (always current) instead of status (stale in interval closure).
    if (!sequenceHandleRef.current && !trackerRef.current) return;
    // Null refs synchronously so a queued tick can't re-enter past the guard.
    const tracker = trackerRef.current;
    const iterations = iterationsRef.current;
    trackerRef.current = null;
    iterationsRef.current = [];

    setStatus("stopping");
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = null;
    sequenceHandleRef.current?.stop();
    sequenceHandleRef.current = null;
    detectorUnsubRef.current?.();
    detectorUnsubRef.current = null;
    await detectorRef.current?.stop().catch(() => {});

    if (tracker) {
      const completed = tracker.finalize();
      if (completed.length > 0) {
        const id =
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `s-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const record: SessionRecord = {
          id,
          startedAt: sessionStartMsRef.current,
          completedAt: Date.now(),
          exerciseId: exercise.id,
          voicePart,
          tempo: exercise.tempo,
          keyAttempts: completed,
          totalDurationMs: Date.now() - sessionStartMsRef.current,
        };
        // Hold in state — user must tap Log to persist.
        setPendingSession(record);
        setLoggedMessage(null);

        const sessionInput = fromKeyAttempts(completed, iterations);
        const ranked = diagnoseSession(sessionInput);
        if (ranked.length > 0) {
          const top = ranked[0];
          const mapping = DETECTOR_MAPPINGS_BY_ID[top.detectorId];
          const symptomTitle = mapping?.symptomCardId
            ? ADVICE_CARDS_BY_ID[mapping.symptomCardId]?.title
            : null;
          setCoachingCta({
            sessionId: id,
            previewText: symptomTitle
              ? `${symptomTitle} — ${top.evidenceText}`
              : top.evidenceText,
          });
        }

        // Advance per-exercise tonic: next key after the last iteration attempted.
        const lastIter = iterations[iterations.length - 1];
        if (lastIter) {
          const range = exercise.voicePartRanges[voicePart];
          if (range) {
            const nextMidi = lastIter.tonicMidi + range.step;
            let highMidi = lastIter.tonicMidi;
            try { highMidi = noteToMidi(range.highest); } catch { /* keep */ }
            const nextClamped = nextMidi > highMidi ? lastIter.tonicMidi : nextMidi;
            const mapKey = `${exercise.id}|${voicePart}`;
            setExerciseTonicMap((prev) => {
              const next = new Map(prev);
              next.set(mapKey, nextClamped);
              return next;
            });
          }
        }
      } else {
        setSavedMessage("No singing detected.");
      }
    }

    setStatus("idle");
    setProgress(0);
    setNoteProgress(0);
    setCurrentTarget(null);
    setLeadInCountdown(null);
  }

  async function handleLogSession(note: string) {
    if (!pendingSession) return;
    const record: SessionRecord = note.trim()
      ? { ...pendingSession, notes: note.trim() }
      : pendingSession;
    try {
      await sessionStore.upsert(record);
      setPendingSession(null);
      // Keep coachingCta alive — it becomes visible once pendingSession is cleared.
      setLoggedMessage("Logged");
    } catch (e) {
      setSavedMessage(`Log failed: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  function handleDiscardSession() {
    setPendingSession(null);
    setCoachingCta(null);
    setLoggedMessage(null);
  }

  const rmsGate = rmsGateFor(accompanimentPreset, headphonesConfirmed ?? false);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.canvas }]}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.h1, { color: colors.textPrimary, fontFamily: Fonts.displaySemibold }]}>
        Vocal Warm-up
      </Text>

      {/* Mode toggle */}
      <View style={[styles.modeRow, { backgroundColor: colors.borderSubtle }]}>
        {(["standard", "guided"] as Mode[]).map((m) => (
          <Pressable
            key={m}
            onPress={() => handleSetMode(m)}
            style={[
              styles.modeChip,
              mode === m && { backgroundColor: colors.bgSurface, borderColor: colors.borderStrong },
            ]}
            disabled={status !== "idle"}
          >
            <Text
              style={[
                styles.modeChipText,
                { color: mode === m ? colors.textPrimary : colors.textSecondary, fontFamily: Fonts.bodyMedium },
              ]}
            >
              {m === "standard" ? "Standard" : "Guided (slow drill)"}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Modal shown once per session — gates Start until answered */}
      <HeadphonesBanner onConfirm={setHeadphonesConfirmed} />

      {/*
        Responsive primary-picks + settings cluster.
        Wide (>=640px): two columns side by side.
        Narrow: stacked.
      */}
      <View style={isWide ? styles.widePicksRow : undefined}>
        {/* Primary picks */}
        <View style={isWide ? styles.widePicksLeft : undefined}>
          <Section title="Exercise">
            <View style={styles.row}>
              {availableExercises.map((e) => {
                const isImported = e.tags?.includes("imported") ?? false;
                const active = exerciseId === e.id;
                return (
                  <Pressable
                    key={e.id}
                    onPress={() => handleExerciseChange(e.id)}
                    style={[
                      styles.chip,
                      styles.chipInline,
                      {
                        backgroundColor: active ? colors.accentMuted : colors.bgSurface,
                        borderColor: active ? colors.accent : colors.borderSubtle,
                      },
                    ]}
                    disabled={status !== "idle"}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: active ? colors.accent : colors.textSecondary, fontFamily: Fonts.bodyMedium },
                      ]}
                    >
                      {e.name}
                    </Text>
                    {isImported && (
                      <View
                        style={[
                          styles.importedPill,
                          { backgroundColor: active ? colors.accent : colors.accentMuted },
                        ]}
                      >
                        <Text
                          style={[
                            styles.importedPillText,
                            { color: active ? colors.canvas : colors.accent, fontFamily: Fonts.bodySemibold },
                          ]}
                        >
                          Imported
                        </Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
              <Pressable
                onPress={() => setImportModalVisible(true)}
                style={[
                  styles.chip,
                  styles.chipAdd,
                  { backgroundColor: colors.bgSurface, borderColor: colors.accent },
                ]}
                disabled={status !== "idle"}
                accessibilityLabel="Import melody"
                // @ts-ignore — web title attribute
                title={Platform.OS === "web" ? "Import a melody" : undefined}
              >
                <Text style={[styles.chipAddText, { color: colors.accent, fontFamily: Fonts.bodySemibold }]}>
                  + Import
                </Text>
              </Pressable>
            </View>
            <Text style={[styles.subtle, { color: colors.textTertiary, fontFamily: Fonts.body }]}>
              {exercise.pedagogy}
            </Text>
          </Section>

          <Section title="Voice part">
            <View style={styles.row}>
              {VOICE_PARTS.map((vp) => {
                const active = voicePart === vp;
                return (
                  <Pressable
                    key={vp}
                    onPress={() => setVoicePart(vp)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: active ? colors.accentMuted : colors.bgSurface,
                        borderColor: active ? colors.accent : colors.borderSubtle,
                      },
                    ]}
                    disabled={status !== "idle"}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: active ? colors.accent : colors.textSecondary, fontFamily: Fonts.bodyMedium },
                      ]}
                    >
                      {vp}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {!supportsVoicePart && (
              <Text style={[styles.error, { color: colors.error, fontFamily: Fonts.body }]}>
                No {voicePart} range defined for this exercise.
              </Text>
            )}
          </Section>
        </View>

        {/* Session settings icon cluster */}
        <View style={isWide ? styles.widePicksRight : undefined}>
          <SettingsCluster
            accompanimentPreset={accompanimentPreset}
            onAccompanimentSelect={setAccompanimentPreset}
            accompanimentLocked={exercise.lockAccompaniment ?? false}
            guidance={guidance}
            onGuidanceSelect={setGuidance}
            demoEnabled={demoEnabled}
            onDemoToggle={handleSetDemoEnabled}
            disabled={status !== "idle"}
          />
        </View>
      </View>

      <ImportModal
        visible={importModalVisible}
        initialVoicePart={voicePart}
        onClose={() => setImportModalVisible(false)}
        onSaved={(newId) => { void handleImportSaved(newId); }}
      />

      {mode === "guided" ? (
        <GuidedSession exercise={exercise} voicePart={voicePart} />
      ) : (
        <StandardModeBody
          coachingCta={coachingCta}
          currentTarget={currentTarget}
          demoSkipRef={demoSkipRef}
          error={error}
          exercise={exercise}
          handleResetTonic={handleResetTonic}
          handleStart={handleStart}
          handleStop={handleStop}
          handleLogSession={handleLogSession}
          handleDiscardSession={handleDiscardSession}
          headphonesConfirmed={headphonesConfirmed}
          iterationsRef={iterationsRef}
          latestSample={latestSample}
          leadInCountdown={leadInCountdown}
          loggedMessage={loggedMessage}
          noteProgress={noteProgress}
          pendingSession={pendingSession}
          progress={progress}
          rmsGate={rmsGate}
          router={router}
          savedMessage={savedMessage}
          snapshot={snapshot}
          startTonicMidi={startTonicMidi}
          defaultTonicMidi={defaultTonicMidi}
          status={status}
          playerRef={playerRef}
          detectorRef={detectorRef}
          voicePart={voicePart}
        />
      )}
    </ScrollView>
  );
}

const PRESET_OPTIONS: { value: AccompanimentPreset | undefined; label: string; badge: string }[] = [
  { value: undefined,    label: "Exercise default", badge: "D" },
  { value: "beginner",   label: "Beginner",         badge: "B" },
  { value: "studio",     label: "Studio",           badge: "S" },
  { value: "classical",  label: "Classical",        badge: "C" },
  { value: "lip-trill",  label: "Lip-trill",        badge: "L" },
  { value: "drone",      label: "Drone",            badge: "Dr" },
];

type SettingKey = "accompaniment" | "guidance" | "demo";

interface SettingsClusterProps {
  accompanimentPreset: AccompanimentPreset | undefined;
  onAccompanimentSelect: (p: AccompanimentPreset | undefined) => void;
  accompanimentLocked: boolean;
  guidance: Guidance;
  onGuidanceSelect: (g: Guidance) => void;
  demoEnabled: boolean;
  onDemoToggle: (val: boolean) => void;
  disabled: boolean;
}

/** Icon row + inline expander for session settings (Accompaniment, Guidance, Demo). */
function SettingsCluster({
  accompanimentPreset,
  onAccompanimentSelect,
  accompanimentLocked,
  guidance,
  onGuidanceSelect,
  demoEnabled,
  onDemoToggle,
  disabled,
}: SettingsClusterProps) {
  const { colors } = useTheme();
  const [open, setOpen] = useState<SettingKey | null>(null);

  function toggle(key: SettingKey) {
    setOpen((prev) => (prev === key ? null : key));
  }

  const acBadge = PRESET_OPTIONS.find((o) => o.value === accompanimentPreset)?.badge ?? "D";
  const guidBadge = guidance === "full" ? "F" : "T";

  return (
    <View style={[styles.settingsCluster, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle }]}>
      <Text style={[styles.settingsLabel, { color: colors.textTertiary, fontFamily: Fonts.bodySemibold }]}>
        Session settings
      </Text>

      {/* Icon row — always visible */}
      <View style={styles.iconRow}>
        <SettingIconButton
          icon="pianokeys"
          tooltip="Accompaniment preset — changes the piano pattern style"
          badge={acBadge}
          active={open === "accompaniment"}
          disabled={disabled}
          onPress={() => toggle("accompaniment")}
        />
        <SettingIconButton
          icon="ear"
          tooltip="Guidance — Full plays the melody; Tonic only is silent during the pattern"
          badge={guidBadge}
          active={open === "guidance"}
          disabled={disabled}
          onPress={() => toggle("guidance")}
        />
        <SettingIconButton
          icon="play.circle"
          tooltip="Demo — plays the first key once before your session begins"
          badge={demoEnabled ? "On" : "Off"}
          active={open === "demo"}
          disabled={disabled}
          onPress={() => toggle("demo")}
        />
      </View>

      {/* Inline expanders */}
      {open === "accompaniment" && (
        <View style={[styles.expander, { backgroundColor: colors.canvas, borderColor: colors.borderSubtle }]}>
          <Text style={[styles.expanderTitle, { color: colors.textPrimary, fontFamily: Fonts.bodyMedium }]}>
            Accompaniment
          </Text>
          <View style={styles.row}>
            {PRESET_OPTIONS.map((opt) => {
              const active = accompanimentPreset === opt.value;
              const isDisabled = disabled || (accompanimentLocked && opt.value !== undefined);
              return (
                <Pressable
                  key={opt.label}
                  onPress={() => { onAccompanimentSelect(opt.value); setOpen(null); }}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? colors.accentMuted : colors.bgSurface,
                      borderColor: active ? colors.accent : colors.borderSubtle,
                      opacity: isDisabled ? 0.4 : 1,
                    },
                  ]}
                  disabled={isDisabled}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: active ? colors.accent : colors.textSecondary, fontFamily: Fonts.bodyMedium },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {accompanimentLocked && (
            <Text style={[styles.subtle, { color: colors.textTertiary, fontFamily: Fonts.body }]}>
              This exercise locks its accompaniment.
            </Text>
          )}
        </View>
      )}

      {open === "guidance" && (
        <View style={[styles.expander, { backgroundColor: colors.canvas, borderColor: colors.borderSubtle }]}>
          <Text style={[styles.expanderTitle, { color: colors.textPrimary, fontFamily: Fonts.bodyMedium }]}>
            Guidance
          </Text>
          <View style={styles.row}>
            {(["full", "tonic-only"] as Guidance[]).map((g) => {
              const active = guidance === g;
              return (
                <Pressable
                  key={g}
                  onPress={() => { onGuidanceSelect(g); setOpen(null); }}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: active ? colors.accentMuted : colors.bgSurface,
                      borderColor: active ? colors.accent : colors.borderSubtle,
                      opacity: disabled ? 0.4 : 1,
                    },
                  ]}
                  disabled={disabled}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: active ? colors.accent : colors.textSecondary, fontFamily: Fonts.bodyMedium },
                    ]}
                  >
                    {g === "full" ? "Full" : "Tonic only"}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {guidance === "tonic-only" && (
            <Text style={[styles.subtle, { color: colors.textTertiary, fontFamily: Fonts.body }]}>
              Piano silent during pattern — sing from memory.
            </Text>
          )}
        </View>
      )}

      {open === "demo" && (
        <View style={[styles.expander, { backgroundColor: colors.canvas, borderColor: colors.borderSubtle }]}>
          <View style={styles.expanderSwitchRow}>
            <Text style={[styles.expanderTitle, { color: colors.textPrimary, fontFamily: Fonts.bodyMedium }]}>
              Play demo before session
            </Text>
            <Switch
              value={demoEnabled}
              onValueChange={(v) => { onDemoToggle(v); }}
              disabled={disabled}
              trackColor={{ true: colors.accent }}
              thumbColor={colors.bgElevated}
            />
          </View>
          <Text style={[styles.subtle, { color: colors.textTertiary, fontFamily: Fonts.body }]}>
            Hear the first key once before you start singing.
          </Text>
        </View>
      )}
    </View>
  );
}

/** A single icon button in the settings row with a badge and tooltip. */
function SettingIconButton({
  icon,
  tooltip,
  badge,
  active,
  disabled,
  onPress,
}: {
  icon: "slider.horizontal.3" | "pianokeys" | "ear" | "play.circle" | "metronome";
  tooltip: string;
  badge: string;
  active: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const [showTooltip, setShowTooltip] = useState(false);

  const handleLongPress = () => {
    if (Platform.OS !== "web") setShowTooltip(true);
  };
  const handlePressOut = () => {
    if (showTooltip) setShowTooltip(false);
  };

  return (
    <View style={styles.iconBtnWrapper}>
      {/* Web: title attribute on a wrapper div gives native browser tooltip on hover */}
      <Pressable
        onPress={disabled ? undefined : onPress}
        onLongPress={handleLongPress}
        onPressOut={handlePressOut}
        style={[
          styles.iconBtn,
          {
            backgroundColor: active ? colors.accent : colors.bgSurface,
            borderColor: active ? colors.accent : colors.borderSubtle,
            opacity: disabled ? 0.4 : 1,
          },
        ]}
        // @ts-ignore — web-only prop
        title={Platform.OS === "web" ? tooltip : undefined}
        accessibilityLabel={tooltip}
        accessibilityRole="button"
      >
        <IconSymbol
          name={icon}
          size={20}
          color={active ? colors.canvas : disabled ? colors.textTertiary : colors.textSecondary}
        />
        <View style={[styles.iconBadge, { backgroundColor: active ? colors.accentHover : colors.borderSubtle }]}>
          <Text
            style={[
              styles.iconBadgeText,
              { color: active ? colors.bgElevated : colors.textSecondary, fontFamily: Fonts.bodySemibold },
            ]}
          >
            {badge}
          </Text>
        </View>
      </Pressable>
      {/* Native long-press tooltip */}
      {showTooltip && (
        <View style={[styles.tooltip, { backgroundColor: colors.bgEmphasis }]}>
          <Text style={[styles.tooltipText, { color: colors.textOnEmphasis, fontFamily: Fonts.body }]}>
            {tooltip}
          </Text>
        </View>
      )}
    </View>
  );
}

/** Small reset icon button with a tooltip (web: title hover; native: long-press). */
function ResetButton({ onPress }: { onPress: () => void }) {
  const { colors } = useTheme();
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltip = "Reset to starting key (C)";
  return (
    <View>
      <Pressable
        onPress={onPress}
        onLongPress={() => { if (Platform.OS !== "web") setShowTooltip(true); }}
        onPressOut={() => { if (showTooltip) setShowTooltip(false); }}
        style={[styles.resetBtn, { backgroundColor: colors.bgSurface, borderColor: colors.borderStrong }]}
        // @ts-ignore — web-only prop
        title={Platform.OS === "web" ? tooltip : undefined}
        accessibilityLabel={tooltip}
        accessibilityRole="button"
      >
        <IconSymbol name="arrow.counterclockwise" size={16} color={colors.textSecondary} />
        <Text style={[styles.resetBtnText, { color: colors.textSecondary, fontFamily: Fonts.bodyMedium }]}>
          Reset
        </Text>
      </Pressable>
      {showTooltip && (
        <View style={[styles.tooltip, { backgroundColor: colors.bgEmphasis }]}>
          <Text style={[styles.tooltipText, { color: colors.textOnEmphasis, fontFamily: Fonts.body }]}>
            {tooltip}
          </Text>
        </View>
      )}
    </View>
  );
}

interface StandardBodyProps {
  coachingCta: { sessionId: string; previewText: string } | null;
  currentTarget: NoteEvent | null;
  demoSkipRef: React.MutableRefObject<(() => void) | null>;
  error: string | null;
  exercise: ExerciseDescriptor;
  handleResetTonic: () => void;
  handleStart: () => Promise<void>;
  handleStop: () => Promise<void>;
  handleLogSession: (note: string) => Promise<void>;
  handleDiscardSession: () => void;
  headphonesConfirmed: boolean | null;
  iterationsRef: React.MutableRefObject<KeyIteration[]>;
  latestSample: PitchSample | null;
  leadInCountdown: number | null;
  loggedMessage: string | null;
  noteProgress: number;
  pendingSession: SessionRecord | null;
  progress: number;
  rmsGate: number;
  router: ReturnType<typeof useRouter>;
  savedMessage: string | null;
  snapshot: SessionTrackerSnapshot | null;
  startTonicMidi: number | null;
  defaultTonicMidi: number | null;
  status: "idle" | "loading" | "demo" | "playing" | "stopping";
  playerRef: React.MutableRefObject<AudioPlayer | null>;
  detectorRef: React.MutableRefObject<PitchDetector | null>;
  voicePart: VoicePart;
}

function StandardModeBody({
  coachingCta,
  currentTarget,
  demoSkipRef,
  error,
  exercise,
  handleResetTonic,
  handleStart,
  handleStop,
  handleLogSession,
  handleDiscardSession,
  headphonesConfirmed,
  iterationsRef,
  latestSample,
  leadInCountdown,
  loggedMessage,
  noteProgress,
  pendingSession,
  progress,
  rmsGate,
  router,
  savedMessage,
  snapshot,
  startTonicMidi,
  defaultTonicMidi,
  status,
  playerRef,
  detectorRef,
  voicePart,
}: StandardBodyProps) {
  const { colors } = useTheme();
  const [sessionNote, setSessionNote] = useState("");
  return (
    <>
      {status === "demo" && (
        <View style={[styles.demoBanner, { backgroundColor: colors.accentMuted, borderColor: colors.accent }]}>
          <Text style={[styles.demoBannerText, { color: colors.accent, fontFamily: Fonts.bodyMedium }]}>
            Listen first…
          </Text>
          <Pressable onPress={() => demoSkipRef.current?.()}>
            <Text style={[styles.demoSkipText, { color: colors.accent, fontFamily: Fonts.body }]}>
              Skip demo
            </Text>
          </Pressable>
        </View>
      )}

      <View style={[styles.hero, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle }]}>
        {leadInCountdown != null ? (
          <View style={styles.countdownOverlay}>
            <Text style={[styles.countdownNumber, { color: colors.accent, fontFamily: Fonts.display }]}>
              {leadInCountdown}
            </Text>
            <Text style={[styles.countdownLabel, { color: colors.textTertiary, fontFamily: Fonts.body }]}>
              sing on 1
            </Text>
          </View>
        ) : (
          <MelodyDisplay
            notes={currentKeyMelodyNotes(iterationsRef.current, snapshot, exercise, startTonicMidi)}
            currentIndex={status === "playing" && snapshot ? snapshot.currentNoteIndex : -1}
            noteProgress={noteProgress}
            tonicMidi={
              snapshot
                ? iterationsRef.current[snapshot.currentKeyIndex]?.tonicMidi ?? startTonicMidi ?? undefined
                : startTonicMidi ?? undefined
            }
          />
        )}
      </View>

      <View style={styles.statRow}>
        <Stat label="Tonic" value={snapshot?.currentTonic ?? "—"} />
        <Stat label="Target" value={currentTarget?.noteName ?? "—"} />
        <Stat
          label="You"
          value={
            latestSample?.midi != null && (latestSample.rmsDb ?? -100) >= rmsGate
              ? midiToNote(Math.round(latestSample.midi))
              : "—"
          }
        />
      </View>

      {snapshot && (
        <View style={styles.counterRow}>
          <Text style={[styles.counterText, { color: colors.textTertiary, fontFamily: Fonts.body }]}>
            Key {snapshot.currentKeyIndex + 1} of {snapshot.totalKeys}
            {"  ·  "}
            Note {snapshot.currentNoteIndex + 1} of {snapshot.currentNoteCount}
          </Text>
        </View>
      )}

      <View style={[styles.progressBar, { backgroundColor: colors.borderSubtle }]}>
        <View style={[styles.progressFill, { width: `${Math.min(100, progress * 100)}%`, backgroundColor: colors.accent }]} />
      </View>

      {status === "idle" && (
        <View style={styles.keyHeaderRow}>
          <Text style={[styles.keyHeaderLabel, { color: colors.textSecondary, fontFamily: Fonts.bodyMedium }]}>
            {startTonicMidi !== null
              ? defaultTonicMidi !== null && startTonicMidi !== defaultTonicMidi
                ? `Resuming at ${midiToNote(startTonicMidi)}`
                : `Starting at ${midiToNote(startTonicMidi)}`
              : "Current key"}
          </Text>
          <ResetButton onPress={handleResetTonic} />
        </View>
      )}

      {snapshot && snapshot.completedKeys.length > 0 && (
        <Section title={`Completed keys · session avg ${snapshot.meanAccuracyPct.toFixed(0)}%`}>
          <View style={styles.keysList}>
            {snapshot.completedKeys.map((k, i) => (
              <View
                key={`${k.tonic}-${i}`}
                style={[styles.keyRow, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle }]}
              >
                <NoteResultsStrip
                  tonic={k.tonic}
                  meta={summarizeKey(k.meanCentsDeviation, k.meanAccuracyPct)}
                  notes={k.notes}
                  syllables={
                    exercise.syllables.length === 1
                      ? Array(exercise.scaleDegrees.length).fill(exercise.syllables[0])
                      : exercise.syllables
                  }
                />
              </View>
            ))}
          </View>
        </Section>
      )}

      {error && <Text style={[styles.error, { color: colors.error, fontFamily: Fonts.body }]}>{error}</Text>}
      {savedMessage && <Text style={[styles.saved, { color: colors.success, fontFamily: Fonts.body }]}>{savedMessage}</Text>}

      {/* Log / Discard panel — shown when a session has ended but not yet persisted */}
      {pendingSession && status === "idle" && !loggedMessage && (
        <View style={[styles.logPanel, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle }]}>
          <Text style={[styles.logHint, { color: colors.textTertiary, fontFamily: Fonts.body }]}>
            This won't count toward your history unless you log it.
          </Text>
          <TextInput
            style={[
              styles.logNoteInput,
              {
                borderColor: colors.borderStrong,
                color: colors.textPrimary,
                backgroundColor: colors.canvas,
                fontFamily: Fonts.body,
              },
            ]}
            placeholder='Note (optional) — e.g. "Felt good on the high notes"'
            placeholderTextColor={colors.textTertiary}
            value={sessionNote}
            onChangeText={setSessionNote}
            returnKeyType="done"
            blurOnSubmit
          />
          <Pressable
            style={[styles.btn, { backgroundColor: colors.accent, minHeight: 44 }]}
            onPress={() => { handleLogSession(sessionNote); setSessionNote(""); }}
          >
            <Text style={[styles.btnText, { color: colors.canvas, fontFamily: Fonts.bodySemibold }]}>
              Log session
            </Text>
          </Pressable>
          <Pressable
            style={styles.discardLink}
            onPress={() => { handleDiscardSession(); setSessionNote(""); }}
          >
            <Text style={[styles.discardLinkText, { color: colors.textTertiary, fontFamily: Fonts.body }]}>
              Discard
            </Text>
          </Pressable>
        </View>
      )}

      {loggedMessage && (
        <Text style={[styles.loggedConfirm, { color: colors.success, fontFamily: Fonts.bodyMedium }]}>
          {loggedMessage}
        </Text>
      )}

      {/* Coaching CTA: only shown after the session is logged (not while pending) */}
      {coachingCta && !pendingSession && (
        <Pressable
          style={[styles.reviewCta, { backgroundColor: colors.bgSurface, borderColor: colors.accent }]}
          onPress={() =>
            router.push({ pathname: "/coaching", params: { sessionId: coachingCta.sessionId } })
          }
        >
          <Text style={[styles.reviewCtaText, { color: colors.accent, fontFamily: Fonts.bodySemibold }]}>
            Coach this →
          </Text>
          <Text style={[styles.reviewCtaSubtle, { color: colors.textSecondary, fontFamily: Fonts.body }]}>
            {coachingCta.previewText}
          </Text>
        </Pressable>
      )}

      <View style={styles.actions}>
        {status === "idle" ? (
          <Pressable
            style={[
              styles.btn,
              {
                backgroundColor: headphonesConfirmed === null ? colors.textTertiary : colors.accent,
                opacity: headphonesConfirmed === null ? 0.5 : 1,
                minHeight: 44,
              },
            ]}
            onPress={handleStart}
            disabled={headphonesConfirmed === null}
          >
            <Text style={[styles.btnText, { color: colors.canvas, fontFamily: Fonts.bodySemibold }]}>
              {headphonesConfirmed === null ? "Waiting for headphones check…" : "Start"}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.btn, { backgroundColor: colors.error, minHeight: 44 }]}
            onPress={handleStop}
          >
            <Text style={[styles.btnText, { color: colors.canvas, fontFamily: Fonts.bodySemibold }]}>
              {status === "loading" || status === "stopping" ? "Loading…" : "Stop"}
            </Text>
          </Pressable>
        )}
      </View>
    </>
  );
}

function currentKeyMelodyNotes(
  iterations: KeyIteration[],
  snapshot: SessionTrackerSnapshot | null,
  exercise: ExerciseDescriptor,
  startTonicMidi: number | null,
): { midi: number; syllable: string }[] {
  if (snapshot && iterations.length > 0) {
    const idx = Math.min(snapshot.currentKeyIndex, iterations.length - 1);
    const iter = iterations[idx];
    if (iter) {
      return iter.events
        .filter((e) => e.type === "melody")
        .map((e) => ({ midi: e.midi, syllable: e.syllable ?? "" }));
    }
  }
  // Idle/static fallback: derive from descriptor + the session's starting tonic.
  const tonic = startTonicMidi ?? 60;
  const syllables = exercise.syllables.length === 1
    ? Array(exercise.scaleDegrees.length).fill(exercise.syllables[0])
    : exercise.syllables;
  return exercise.scaleDegrees.map((deg, i) => ({
    midi: tonic + deg,
    syllable: syllables[i] ?? "",
  }));
}


const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: Spacing['3xl'], gap: Spacing.md },
  h1: {
    fontSize: Typography.xl.size,
    lineHeight: Typography.xl.lineHeight,
  },
  subtle: {
    fontSize: Typography.sm.size,
    lineHeight: Typography.sm.lineHeight,
    marginTop: Spacing.xs,
  },
  modeRow: {
    flexDirection: "row",
    borderRadius: Radii.md,
    padding: Spacing["2xs"],
    gap: Spacing["2xs"],
  },
  modeChip: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.sm,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  modeChipText: {
    fontSize: Typography.sm.size,
    lineHeight: Typography.sm.lineHeight,
  },
  row: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.xs },
  chip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.pill,
    borderWidth: 1,
    minHeight: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  chipText: {
    fontSize: Typography.sm.size,
    lineHeight: Typography.sm.lineHeight,
    textTransform: "capitalize",
  },
  chipInline: { flexDirection: "row", alignItems: "center" },
  chipAdd: {
    flexDirection: "row",
    alignItems: "center",
    borderStyle: "dashed",
  },
  chipAddText: {
    fontSize: Typography.sm.size,
    lineHeight: Typography.sm.lineHeight,
  },
  importedPill: {
    marginLeft: Spacing.xs,
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing["2xs"],
    paddingVertical: Spacing["3xs"],
  },
  importedPillText: {
    fontSize: Typography.xs.size,
    lineHeight: Typography.xs.lineHeight,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  hero: {
    borderRadius: Radii.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    minHeight: 180,
    justifyContent: "center",
  },
  statRow: { flexDirection: "row", gap: Spacing.xs, justifyContent: "space-between" },
  counterRow: { alignItems: "center" },
  counterText: {
    fontSize: Typography.sm.size,
    lineHeight: Typography.sm.lineHeight,
  },
  progressBar: { height: 6, borderRadius: Radii.sm, overflow: "hidden" },
  progressFill: { height: "100%" },
  keysList: { gap: Spacing.xs },
  keyRow: {
    flexDirection: "column",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.md,
    borderWidth: 1,
    gap: Spacing["3xs"],
  },
  reviewCta: {
    borderRadius: Radii.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderLeftWidth: 3,
    gap: Spacing["2xs"],
  },
  reviewCtaText: {
    fontSize: Typography.md.size,
    lineHeight: Typography.md.lineHeight,
  },
  reviewCtaSubtle: {
    fontSize: Typography.sm.size,
    lineHeight: Typography.sm.lineHeight,
  },
  actions: { marginTop: Spacing.sm },
  btn: { paddingVertical: Spacing.md, borderRadius: Radii.md, alignItems: "center" },
  btnText: {
    fontSize: Typography.md.size,
    lineHeight: Typography.md.lineHeight,
  },
  error: {
    fontSize: Typography.sm.size,
    lineHeight: Typography.sm.lineHeight,
    marginTop: Spacing["2xs"],
  },
  saved: {
    fontSize: Typography.sm.size,
    lineHeight: Typography.sm.lineHeight,
    marginTop: Spacing["2xs"],
  },
  // Responsive wide layout
  widePicksRow: {
    flexDirection: "row",
    gap: Spacing.md,
    alignItems: "flex-start",
  },
  widePicksLeft: { flex: 2, gap: Spacing.md, minWidth: 0 },
  widePicksRight: { flex: 1, minWidth: 280 },

  // Settings cluster
  settingsCluster: {
    borderRadius: Radii.md,
    borderWidth: 1,
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  settingsLabel: {
    fontSize: Typography.xs.size,
    lineHeight: Typography.xs.lineHeight,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  // Icon row
  iconRow: {
    flexDirection: "row",
    gap: Spacing.xs,
  },
  iconBtnWrapper: { position: "relative" },
  iconBtn: {
    width: 52,
    height: 52,
    borderRadius: Radii.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing["3xs"],
  },

  // Badge on icon button
  iconBadge: {
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing["2xs"],
    paddingVertical: Spacing["3xs"],
    minWidth: 18,
    alignItems: "center",
  },
  iconBadgeText: {
    fontSize: Typography.xs.size,
    lineHeight: Typography.xs.lineHeight,
  },

  // Inline expander panel
  expander: {
    borderRadius: Radii.md,
    borderWidth: 1,
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  expanderTitle: {
    fontSize: Typography.sm.size,
    lineHeight: Typography.sm.lineHeight,
  },
  expanderSwitchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  // Native long-press tooltip
  tooltip: {
    position: "absolute",
    bottom: 58,
    left: -20,
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    width: 180,
    zIndex: 99,
  },
  tooltipText: {
    fontSize: Typography.xs.size,
    lineHeight: Typography.xs.lineHeight,
  },

  countdownOverlay: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
  },
  countdownNumber: {
    fontSize: Typography['3xl'].size,
    lineHeight: Typography['3xl'].lineHeight,
  },
  countdownLabel: {
    fontSize: Typography.sm.size,
    lineHeight: Typography.sm.lineHeight,
    marginTop: Spacing["2xs"],
    letterSpacing: 0.5,
  },
  demoBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: Radii.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    borderWidth: 1,
  },
  demoBannerText: {
    fontSize: Typography.sm.size,
    lineHeight: Typography.sm.lineHeight,
  },
  demoSkipText: {
    fontSize: Typography.sm.size,
    lineHeight: Typography.sm.lineHeight,
    textDecorationLine: "underline",
  },

  // Key header row with RESET button
  keyHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing["2xs"],
  },
  keyHeaderLabel: {
    fontSize: Typography.xs.size,
    lineHeight: Typography.xs.lineHeight,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing["2xs"],
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.md,
    borderWidth: 1,
    minHeight: 36,
  },
  resetBtnText: {
    fontSize: Typography.xs.size,
    lineHeight: Typography.xs.lineHeight,
  },

  // Log / Discard panel
  logPanel: {
    borderRadius: Radii.md,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  logHint: {
    fontSize: Typography.sm.size,
    lineHeight: Typography.sm.lineHeight,
  },
  logNoteInput: {
    borderWidth: 1,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    fontSize: Typography.sm.size,
    lineHeight: Typography.sm.lineHeight,
  },
  discardLink: { alignItems: "center", paddingVertical: Spacing.xs, minHeight: 36 },
  discardLinkText: {
    fontSize: Typography.sm.size,
    lineHeight: Typography.sm.lineHeight,
    textDecorationLine: "underline",
  },
  loggedConfirm: {
    fontSize: Typography.sm.size,
    lineHeight: Typography.sm.lineHeight,
    textAlign: "center",
  },
});
