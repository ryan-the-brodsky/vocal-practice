// COMPONENT TEST: app/__tests__/explore.test.tsx asserts on the "Progress"
// title, the "This week" summary header, the empty-state copy ("No sessions
// yet"), exercise display names, and the "Recent sessions" / "Coach this"
// labels + the router.push payload `{ pathname: "/coaching", params: { sessionId } }`.
// Edits to those surfaces here MUST be mirrored in the test file or it will go red.
import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";

import { createAsyncStorageStore, thisWeekSummary, bestKeyPerExercise, progressForExercise, bestSessionAccuracy } from "@/lib/progress";
import { loadRoutine, saveRoutine, todayStatus } from "@/lib/progress/routine";
import type { RoutineConfig, RoutineStatus } from "@/lib/progress/routine";
import type { SessionRecord, ExerciseProgress } from "@/lib/progress";
import { exerciseName, EXERCISE_NAMES } from "@/lib/exercises/names";
import { getExercise } from "@/lib/exercises/library";
import { listUserExercises, deleteUserExercise } from "@/lib/exercises/userStore";
import type { StoredExtractedExercise } from "@/lib/exercises/userStore";
import NoteResultsStrip from "@/components/practice/NoteResultsStrip";
import Sparkline from "@/components/progress/Sparkline";
import type { SparklinePoint } from "@/components/progress/Sparkline";
import ImportModal from "@/components/import/ImportModal";
import { useTheme } from "@/hooks/use-theme";
import { Spacing, Radii, Typography, Fonts } from "@/constants/theme";

const sessionStore = createAsyncStorageStore();

// All exercise IDs available for the routine editor
const ALL_EXERCISE_IDS = Object.keys(EXERCISE_NAMES);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtDate(epochMs: number): string {
  return new Date(epochMs).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function fmtAccuracy(pct: number): string {
  return `${Math.round(pct)}%`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function RoutineEditModal({
  visible,
  routine,
  onSave,
  onClose,
}: {
  visible: boolean;
  routine: RoutineConfig;
  onSave: (config: RoutineConfig) => void;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const [selectedIds, setSelectedIds] = useState<string[]>(routine.exerciseIds);

  // Sync local state when modal opens with a fresh routine
  useEffect(() => {
    if (visible) {
      setSelectedIds(routine.exerciseIds);
    }
  }, [visible, routine]);

  function toggleExercise(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleDone() {
    onSave({ exerciseIds: selectedIds });
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[mStyles.container, { backgroundColor: colors.bgCanvas }]}>
        <View style={[mStyles.header, { backgroundColor: colors.bgSurface, borderBottomColor: colors.borderSubtle }]}>
          <Text style={[mStyles.title, { color: colors.textPrimary, fontFamily: Fonts.displaySemibold, fontSize: Typography.md.size, lineHeight: Typography.md.lineHeight }]}>
            Edit Routine
          </Text>
          <TouchableOpacity onPress={handleDone} style={[mStyles.doneBtn, { backgroundColor: colors.accent }]}>
            <Text style={[mStyles.doneBtnText, { color: colors.bgCanvas, fontFamily: Fonts.bodyMedium, fontSize: Typography.base.size, lineHeight: Typography.base.lineHeight }]}>
              Done
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={mStyles.body} contentContainerStyle={[mStyles.bodyContent, { gap: Spacing['2xs'] }]}>
          <Text style={[mStyles.sectionLabel, { color: colors.textTertiary, fontFamily: Fonts.bodyMedium, fontSize: Typography.xs.size, lineHeight: Typography.xs.lineHeight }]}>
            EXERCISES
          </Text>
          {ALL_EXERCISE_IDS.map((id) => {
            const checked = selectedIds.includes(id);
            return (
              <Pressable key={id} onPress={() => toggleExercise(id)} style={[mStyles.exerciseRow, { borderBottomColor: colors.borderSubtle }]}>
                <View style={[mStyles.checkbox, { borderColor: colors.borderStrong }, checked && { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary }]}>
                  {checked && <Text style={[mStyles.checkmark, { color: colors.bgCanvas, fontFamily: Fonts.bodySemibold, fontSize: Typography.sm.size }]}>✓</Text>}
                </View>
                <Text style={[mStyles.exerciseLabel, { color: checked ? colors.textPrimary : colors.textSecondary, fontFamily: checked ? Fonts.bodySemibold : Fonts.body, fontSize: Typography.base.size, lineHeight: Typography.base.lineHeight }]}>
                  {exerciseName(id)}
                </Text>
              </Pressable>
            );
          })}

        </ScrollView>
      </View>
    </Modal>
  );
}

function TodayRoutineCard({
  routine,
  status,
  onPressEdit,
}: {
  routine: RoutineConfig;
  status: RoutineStatus;
  onPressEdit: () => void;
}) {
  const { colors } = useTheme();
  const isEmpty = routine.exerciseIds.length === 0;

  return (
    <View style={[styles.routineCard, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle, borderRadius: Radii.lg }]}>
      {/* Header row */}
      <View style={[styles.routineHeader, { borderBottomColor: colors.borderSubtle, paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Spacing.xs }]}>
        <View style={[styles.routineHeaderLeft, { gap: Spacing.xs }]}>
          <Text style={{ fontSize: Typography.xs.size, lineHeight: Typography.xs.lineHeight, color: colors.textTertiary, fontFamily: Fonts.bodyMedium, textTransform: "uppercase", letterSpacing: 0.8 }}>
            TODAY'S ROUTINE
          </Text>
          {!isEmpty && (
            <Text style={{ fontSize: Typography.monoBase.size, lineHeight: Typography.monoBase.lineHeight, color: colors.textSecondary, fontFamily: Fonts.mono }}>
              {status.done} of {status.total} done
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={onPressEdit} style={styles.editBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={{ fontSize: Typography.base.size, color: colors.textSecondary }}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Body */}
      {isEmpty ? (
        <Text style={{ paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: Typography.base.size, lineHeight: Typography.base.lineHeight, color: colors.textTertiary, fontFamily: Fonts.body, fontStyle: "italic" }}>
          No exercises in your routine. Tap Edit to add some.
        </Text>
      ) : (
        <View style={[styles.routineItems, { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, gap: Spacing.xs }]}>
          {status.items.map((item) => (
            <View key={item.id} style={[styles.routineItem, { gap: Spacing.xs }]}>
              <Text style={{ fontSize: Typography.base.size, color: item.done ? colors.success : colors.textTertiary, width: Spacing.lg, textAlign: "center", fontFamily: Fonts.mono }}>
                {item.done ? "✓" : "○"}
              </Text>
              <Text style={{ fontSize: Typography.base.size, lineHeight: Typography.base.lineHeight, color: item.done ? colors.textTertiary : colors.textPrimary, fontFamily: item.done ? Fonts.body : Fonts.bodySemibold, flex: 1 }}>
                {exerciseName(item.id)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function WeeklySummaryCard({
  sessionCount,
  meanAccuracy,
  exerciseCount,
}: {
  sessionCount: number;
  meanAccuracy: number;
  exerciseCount: number;
}) {
  const { colors } = useTheme();

  return (
    <View style={[styles.weekCard, { backgroundColor: colors.bgEmphasis, borderColor: colors.borderOnEmphasis, borderRadius: Radii.lg, paddingVertical: Spacing.lg, paddingHorizontal: Spacing.lg }]}>
      <Text style={{ color: colors.textOnEmphasisDim, fontSize: Typography.xs.size, lineHeight: Typography.xs.lineHeight, fontFamily: Fonts.bodyMedium, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: Spacing.md }}>
        This week
      </Text>
      <View style={styles.weekStats}>
        <View style={styles.weekStat}>
          <Text style={{ color: colors.accentOnEmphasis, fontSize: Typography['3xl'].size, lineHeight: Typography['3xl'].lineHeight, fontFamily: Fonts.display }}>
            {sessionCount}
          </Text>
          <Text style={{ color: colors.textOnEmphasisDim, fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight, fontFamily: Fonts.body, marginTop: Spacing['2xs'] }}>
            sessions
          </Text>
        </View>
        <View style={[styles.weekStatDivider, { backgroundColor: colors.borderOnEmphasis }]} />
        <View style={styles.weekStat}>
          <Text style={{ color: colors.accentOnEmphasis, fontSize: Typography['3xl'].size, lineHeight: Typography['3xl'].lineHeight, fontFamily: Fonts.display }}>
            {fmtAccuracy(meanAccuracy)}
          </Text>
          <Text style={{ color: colors.textOnEmphasisDim, fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight, fontFamily: Fonts.body, marginTop: Spacing['2xs'] }}>
            accuracy
          </Text>
        </View>
        <View style={[styles.weekStatDivider, { backgroundColor: colors.borderOnEmphasis }]} />
        <View style={styles.weekStat}>
          <Text style={{ color: colors.accentOnEmphasis, fontSize: Typography['3xl'].size, lineHeight: Typography['3xl'].lineHeight, fontFamily: Fonts.display }}>
            {exerciseCount}
          </Text>
          <Text style={{ color: colors.textOnEmphasisDim, fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight, fontFamily: Fonts.body, marginTop: Spacing['2xs'] }}>
            exercises
          </Text>
        </View>
      </View>
    </View>
  );
}

function ExerciseRow({
  exerciseId,
  displayName,
  lastPracticedMs,
  bestKey,
  bestEver,
  progress,
  imported,
  onDelete,
}: {
  exerciseId: string;
  displayName: string;
  lastPracticedMs: number | null;
  bestKey: string | null;
  bestEver: number | null;
  progress: ExerciseProgress;
  imported?: StoredExtractedExercise;
  onDelete?: (id: string) => void;
}) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const router = useRouter();

  // Convert trend data to SparklinePoint array (date string → epoch ms).
  const sparkData: SparklinePoint[] = progress.trend.map((row) => ({
    date: new Date(row.date).getTime(),
    accuracy: row.meanAccuracyPct,
  }));

  const allTimeAvg =
    progress.trend.length === 0
      ? 0
      : progress.trend.reduce((acc, r) => acc + r.meanAccuracyPct, 0) /
        progress.trend.length;

  const lastLabel =
    lastPracticedMs !== null
      ? `Last: ${fmtDate(lastPracticedMs)}`
      : imported
        ? `Imported ${fmtDate(imported.source.importedAt)}`
        : "Not yet practiced";

  return (
    <View style={[styles.exerciseCard, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle, borderRadius: Radii.md }]}>
      <Pressable onPress={() => setExpanded((v) => !v)} style={[styles.exerciseHeader, { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm, gap: Spacing.xs }]}>
        <View style={[styles.exerciseHeaderLeft, { gap: Spacing['2xs'] }]}>
          <View style={[styles.exerciseNameRow, { gap: Spacing.xs }]}>
            <Text style={{ fontSize: Typography.lg.size, lineHeight: Typography.lg.lineHeight, fontFamily: Fonts.display, color: colors.textPrimary }}>
              {displayName}
            </Text>
            {imported && (
              <View style={[styles.importedPill, { backgroundColor: colors.accentMuted, borderRadius: Radii.sm }]}>
                <Text style={{ fontSize: Typography.xs.size, lineHeight: Typography.xs.lineHeight, fontFamily: Fonts.bodyMedium, color: colors.accent, textTransform: "uppercase", letterSpacing: 0.5, paddingHorizontal: Spacing['2xs'], paddingVertical: Spacing['3xs'] }}>
                  Imported
                </Text>
              </View>
            )}
          </View>
          <Text style={{ fontSize: Typography.monoBase.size, lineHeight: Typography.monoBase.lineHeight, fontFamily: Fonts.mono, color: colors.textSecondary }}>
            {lastLabel}
            {bestKey ? `  ·  Best key: ${bestKey}` : ""}
          </Text>
          {bestEver !== null && (
            <Text style={{ fontSize: Typography.monoBase.size, lineHeight: Typography.monoBase.lineHeight, fontFamily: Fonts.mono, color: colors.success }}>
              Best ever {fmtAccuracy(bestEver)}
            </Text>
          )}
        </View>
        <Text style={{ color: colors.textTertiary, fontSize: Typography.monoBase.size, fontFamily: Fonts.mono }}>
          {expanded ? "▲" : "▼"}
        </Text>
      </Pressable>

      {expanded && !imported && (
        <View style={[styles.exerciseTrend, { borderTopColor: colors.borderSubtle, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs }]}>
          <Sparkline data={sparkData} avg={allTimeAvg} color={colors.accent} />
        </View>
      )}

      {expanded && imported && (
        <View style={[styles.importedDetail, { borderTopColor: colors.borderSubtle, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm, gap: Spacing.sm }]}>
          {progress.trend.length > 0 && (
            <View style={[styles.importedSection, { gap: Spacing['2xs'] }]}>
              <Sparkline data={sparkData} avg={allTimeAvg} color={colors.accent} />
            </View>
          )}

          <Pressable
            style={[styles.coachMelodyBtn, { backgroundColor: colors.accent, borderRadius: Radii.md, paddingVertical: Spacing.sm, alignItems: "center" }]}
            onPress={() =>
              router.push({ pathname: "/coaching", params: { exerciseId } })
            }
          >
            <Text style={{ color: colors.bgCanvas, fontSize: Typography.base.size, lineHeight: Typography.base.lineHeight, fontFamily: Fonts.bodySemibold }}>
              Coach this melody
            </Text>
          </Pressable>

          <View style={[styles.importedActionsRow, { gap: Spacing.xs, justifyContent: "flex-end" }]}>
            <Pressable
              style={[styles.importedActionBtn, { backgroundColor: colors.bgSurface, borderRadius: Radii.sm, borderWidth: 1, borderColor: colors.borderStrong, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs }]}
              onPress={() => {
                /* TODO Slice 7: wire to edit modal */
              }}
            >
              <Text style={{ fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight, fontFamily: Fonts.bodyMedium, color: colors.textPrimary }}>Edit</Text>
            </Pressable>
            <Pressable
              style={[styles.importedActionBtn, { backgroundColor: colors.bgSurface, borderRadius: Radii.sm, borderWidth: 1, borderColor: colors.error, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs }]}
              onPress={() => onDelete?.(exerciseId)}
            >
              <Text style={{ fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight, fontFamily: Fonts.bodyMedium, color: colors.error }}>Delete</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

function RecentSessionRow({ session }: { session: SessionRecord }) {
  const { colors } = useTheme();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  const meanAcc =
    session.keyAttempts.length === 0
      ? 0
      : session.keyAttempts.reduce((s, k) => s + k.meanAccuracyPct, 0) /
        session.keyAttempts.length;

  // Derive syllables from the exercise descriptor for NoteResultsStrip.
  const exercise = getExercise(session.exerciseId);
  const syllables = exercise
    ? exercise.syllables.length === 1
      ? Array(exercise.scaleDegrees.length).fill(exercise.syllables[0])
      : exercise.syllables
    : [];

  return (
    <View style={[styles.sessionCard, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle, borderRadius: Radii.md }]}>
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        style={[styles.sessionRow, { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm, gap: Spacing.xs }]}
      >
        <View style={[styles.sessionLeft, { gap: Spacing['2xs'] }]}>
          <Text style={{ fontSize: Typography.base.size, lineHeight: Typography.base.lineHeight, fontFamily: Fonts.display, color: colors.textPrimary }}>
            {exerciseName(session.exerciseId)}
          </Text>
          <Text style={{ fontSize: Typography.monoBase.size, lineHeight: Typography.monoBase.lineHeight, fontFamily: Fonts.mono, color: colors.textSecondary }}>
            {fmtDate(session.startedAt)}
            {"  ·  "}
            {session.keyAttempts.length} key{session.keyAttempts.length === 1 ? "" : "s"}
            {"  ·  "}
            {session.voicePart}
          </Text>
        </View>
        <Text style={{ fontSize: Typography.monoBase.size, lineHeight: Typography.monoBase.lineHeight, fontFamily: Fonts.monoMedium, color: colors.textPrimary }}>
          {fmtAccuracy(meanAcc)}
        </Text>
        <Text style={{ color: colors.textTertiary, fontSize: Typography.monoBase.size, fontFamily: Fonts.mono }}>
          {expanded ? "▲" : "▼"}
        </Text>
      </Pressable>

      {expanded && (
        <View style={[styles.sessionDetail, { borderTopColor: colors.borderSubtle, paddingHorizontal: Spacing.sm, paddingBottom: Spacing.sm, gap: Spacing.xs }]}>
          {session.keyAttempts.map((k, i) => (
            <View key={`${k.tonic}-${i}`} style={[styles.keyRow, { gap: Spacing['2xs'], paddingTop: Spacing.xs }]}>
              <NoteResultsStrip
                tonic={k.tonic}
                meta={fmtAccuracy(k.meanAccuracyPct)}
                notes={k.notes}
                syllables={syllables}
              />
            </View>
          ))}
          <Pressable
            style={[styles.coachBtn, { alignSelf: "flex-end", marginTop: Spacing['2xs'], backgroundColor: colors.bgEmphasis, borderRadius: Radii.sm, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs }]}
            onPress={() =>
              router.push({ pathname: "/coaching", params: { sessionId: session.id } })
            }
          >
            <Text style={{ color: colors.textOnEmphasis, fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight, fontFamily: Fonts.bodyMedium }}>
              Coach this
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ProgressScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionRecord[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [routine, setRoutine] = useState<RoutineConfig | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [userExercises, setUserExercises] = useState<StoredExtractedExercise[]>([]);

  useEffect(() => {
    Promise.all([
      sessionStore.list().catch(() => [] as SessionRecord[]),
      loadRoutine(),
      listUserExercises().catch(() => [] as StoredExtractedExercise[]),
    ]).then(([list, routineConfig, imported]) => {
      setSessions(list);
      setRoutine(routineConfig);
      setUserExercises(imported);
      setLoading(false);
    }).catch(() => {
      setSessions([]);
      setRoutine(null);
      setUserExercises([]);
      setLoading(false);
    });
  }, []);

  async function handleSaveRoutine(config: RoutineConfig) {
    await saveRoutine(config).catch(() => {});
    setRoutine(config);
  }

  function openImportModal() {
    setImportModalVisible(true);
  }

  async function handleImportSaved() {
    // Refresh the user-exercise list so the new import shows up immediately.
    try {
      const list = await listUserExercises();
      setUserExercises(list);
    } catch {
      /* ignore */
    }
  }

  async function handleDeleteUserExercise(id: string) {
    await deleteUserExercise(id).catch(() => {});
    setUserExercises((prev) => prev.filter((it) => it.descriptor.id !== id));
  }

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.canvas }]}>
        <Text style={{ color: colors.textSecondary, fontSize: Typography.base.size, lineHeight: Typography.base.lineHeight, fontFamily: Fonts.body }}>
          Loading…
        </Text>
      </View>
    );
  }

  const allSessions = sessions ?? [];

  // Compute routine status
  const activeRoutine: RoutineConfig = routine ?? { exerciseIds: [] };
  const routineStatus = todayStatus(activeRoutine, allSessions);

  // Show empty state only when no sessions AND no routine items AND no imports — anything else, render the screen
  const hasSessions = allSessions.length > 0;
  const hasRoutine = activeRoutine.exerciseIds.length > 0;
  const hasImports = userExercises.length > 0;

  if (!hasSessions && !hasRoutine && !hasImports) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.canvas }]}>
        <Text style={{ fontSize: Typography.xl.size, lineHeight: Typography.xl.lineHeight, fontFamily: Fonts.display, color: colors.textPrimary, marginBottom: Spacing.xs }}>
          No sessions yet
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: Typography.base.size, lineHeight: Typography.base.lineHeight, fontFamily: Fonts.body, textAlign: "center" }}>
          Head to Practice and sing something first.
        </Text>
      </View>
    );
  }

  // Weekly summary
  const weeklySummary = thisWeekSummary(allSessions);

  // Per-exercise: collect unique exercise IDs in order of most recently practiced
  const lastPracticed: Record<string, number> = {};
  for (const s of allSessions) {
    const existing = lastPracticed[s.exerciseId] ?? 0;
    if (s.startedAt > existing) lastPracticed[s.exerciseId] = s.startedAt;
  }
  const exerciseIds = Object.keys(lastPracticed).sort(
    (a, b) => (lastPracticed[b] ?? 0) - (lastPracticed[a] ?? 0)
  );

  const bestKeys = bestKeyPerExercise(allSessions);

  // Recent sessions sorted desc
  const recentSessions = [...allSessions].sort((a, b) => b.startedAt - a.startedAt).slice(0, 20);

  return (
    <>
      <ScrollView style={[styles.container, { backgroundColor: colors.canvas }]} contentContainerStyle={[styles.content, { padding: Spacing.lg, paddingBottom: Spacing['3xl'], gap: Spacing.md }]}>
        <Text style={{ fontSize: Typography['2xl'].size, lineHeight: Typography['2xl'].lineHeight, fontFamily: Fonts.display, color: colors.textPrimary }}>
          Progress
        </Text>

        {/* Today's Routine — always rendered above WeeklySummaryCard */}
        <TodayRoutineCard
          routine={activeRoutine}
          status={routineStatus}
          onPressEdit={() => setEditModalVisible(true)}
        />

        <WeeklySummaryCard
          sessionCount={weeklySummary.count}
          meanAccuracy={weeklySummary.meanAccuracyPct}
          exerciseCount={weeklySummary.exercisesPracticed.length}
        />

        {(exerciseIds.length > 0 || userExercises.length > 0) && (
          <>
            <Text style={{ fontSize: Typography.xs.size, lineHeight: Typography.xs.lineHeight, fontFamily: Fonts.bodyMedium, color: colors.textTertiary, textTransform: "uppercase", letterSpacing: 0.8, marginTop: Spacing.xs }}>
              Exercises
            </Text>

            {/* B3 secondary import entry — Practice tab carries the primary "+" affordance (Slice 3). */}
            <Pressable
              style={[styles.addImportRow, { backgroundColor: colors.bgSurface, borderRadius: Radii.md, borderColor: colors.borderStrong, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm, gap: Spacing.xs, minHeight: 44 }]}
              onPress={openImportModal}
              accessibilityLabel="Add imported melody"
            >
              <Text style={{ fontSize: Typography.sm.size, color: colors.textTertiary, fontFamily: Fonts.bodyMedium }}>+</Text>
              <Text style={{ fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight, color: colors.textTertiary, fontFamily: Fonts.body }}>
                Add imported melody
              </Text>
            </Pressable>

            {exerciseIds.map((id) => (
              <ExerciseRow
                key={id}
                exerciseId={id}
                displayName={exerciseName(id)}
                lastPracticedMs={lastPracticed[id] ?? 0}
                bestKey={bestKeys[id] ?? null}
                bestEver={bestSessionAccuracy(allSessions, id)}
                progress={progressForExercise(allSessions, id)}
              />
            ))}

            {userExercises
              .filter((it) => !exerciseIds.includes(it.descriptor.id))
              .map((it) => (
                <ExerciseRow
                  key={it.descriptor.id}
                  exerciseId={it.descriptor.id}
                  displayName={it.descriptor.name}
                  lastPracticedMs={lastPracticed[it.descriptor.id] ?? null}
                  bestKey={bestKeys[it.descriptor.id] ?? null}
                  bestEver={bestSessionAccuracy(allSessions, it.descriptor.id)}
                  progress={progressForExercise(allSessions, it.descriptor.id)}
                  imported={it}
                  onDelete={handleDeleteUserExercise}
                />
              ))}

            <Pressable
              style={[styles.savedTipsRow, { backgroundColor: colors.bgSurface, borderRadius: Radii.md, borderColor: colors.borderStrong, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm, gap: Spacing.xs, minHeight: 44 }]}
              onPress={() => router.push("/coaching-saved")}
              accessibilityLabel="Open saved coaching tips"
            >
              <Text style={{ fontSize: Typography.sm.size, color: colors.textTertiary, fontFamily: Fonts.body }}>☆</Text>
              <Text style={{ fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight, color: colors.textTertiary, fontFamily: Fonts.body }}>
                Saved coaching tips
              </Text>
            </Pressable>
          </>
        )}

        {recentSessions.length > 0 && (
          <>
            <Text style={{ fontSize: Typography.xs.size, lineHeight: Typography.xs.lineHeight, fontFamily: Fonts.bodyMedium, color: colors.textTertiary, textTransform: "uppercase", letterSpacing: 0.8, marginTop: Spacing.xs }}>
              Recent sessions
            </Text>
            {recentSessions.map((s) => (
              <RecentSessionRow key={s.id} session={s} />
            ))}
          </>
        )}
      </ScrollView>

      {/* Edit Routine Modal */}
      {routine !== null && (
        <RoutineEditModal
          visible={editModalVisible}
          routine={activeRoutine}
          onSave={handleSaveRoutine}
          onClose={() => setEditModalVisible(false)}
        />
      )}

      {/* Melody import modal — shared with Practice's "+" affordance */}
      <ImportModal
        visible={importModalVisible}
        onClose={() => setImportModalVisible(false)}
        onSaved={() => { void handleImportSaved(); }}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// Structural styles — layout-only (no colors, no font sizes, no spacing literals)
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {},

  // Empty / loading states
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: Spacing.xl },

  // Today's Routine card
  routineCard: { borderWidth: 1, overflow: "hidden" },
  routineHeader: { flexDirection: "row", alignItems: "center", borderBottomWidth: 1 },
  routineHeaderLeft: { flex: 1, flexDirection: "row", alignItems: "center" },
  editBtn: { padding: Spacing['2xs'] },
  routineItems: {},
  routineItem: { flexDirection: "row", alignItems: "center" },

  // Weekly card
  weekCard: { borderWidth: 1 },
  weekStats: { flexDirection: "row", alignItems: "center" },
  weekStat: { flex: 1, alignItems: "center" },
  weekStatDivider: { width: 1, height: 40 },

  // Exercise rows
  exerciseCard: { borderWidth: 1, overflow: "hidden" },
  exerciseHeader: { flexDirection: "row", alignItems: "center" },
  exerciseHeaderLeft: { flex: 1 },
  exerciseNameRow: { flexDirection: "row", alignItems: "center" },
  importedPill: { borderWidth: 1, borderColor: "transparent" },

  // "+ Add imported melody" row
  addImportRow: { borderWidth: 1, borderStyle: "dashed", flexDirection: "row", alignItems: "center" },

  // "Saved coaching tips" row
  savedTipsRow: { borderWidth: 1, borderStyle: "dashed", flexDirection: "row", alignItems: "center" },

  // Imported expanded card
  importedDetail: { borderTopWidth: 1 },
  importedSection: {},
  coachMelodyBtn: {},
  importedActionsRow: { flexDirection: "row" },
  importedActionBtn: {},

  // Sparkline inside expanded exercise
  exerciseTrend: { borderTopWidth: 1 },

  // Recent session rows
  sessionCard: { borderWidth: 1, overflow: "hidden" },
  sessionRow: { flexDirection: "row", alignItems: "center" },
  sessionLeft: { flex: 1 },
  sessionDetail: { borderTopWidth: 1 },
  keyRow: {},
  coachBtn: {},
});

// ---------------------------------------------------------------------------
// Modal Styles — structural only, colors inlined via useTheme in component
// ---------------------------------------------------------------------------

const mStyles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
  },
  title: {},
  doneBtn: { borderRadius: Radii.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  doneBtnText: {},
  body: { flex: 1 },
  bodyContent: { padding: Spacing.lg },
  sectionLabel: { textTransform: "uppercase", letterSpacing: 0.8, marginBottom: Spacing.xs },
  exerciseRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm, paddingVertical: Spacing.xs, borderBottomWidth: 1 },
  checkbox: { width: 22, height: 22, borderRadius: Radii.sm, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  checkmark: {},
  exerciseLabel: { flex: 1 },
});
