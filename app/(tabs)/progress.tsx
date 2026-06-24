// COMPONENT TEST: app/__tests__/progress.test.tsx asserts on the "Progress"
// title, the "This week" summary header, the empty-state copy ("No sessions
// yet"), exercise display names, and the "Recent sessions" / "Coach this"
// labels + the router.push payload `{ pathname: "/coaching", params: { sessionId } }`.
// Edits to those surfaces here MUST be mirrored in the test file or it will go red.
import { useEffect, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { createAsyncStorageStore, thisWeekSummary, bestKeyPerExercise, progressForExercise, bestSessionAccuracy } from "@/lib/progress";
import { downloadBackup, importAll, lastExportInfo } from "@/lib/backup/exportImport";
import { loadRoutine, saveRoutine, todayStatus } from "@/lib/progress/routine";
import type { RoutineConfig } from "@/lib/progress/routine";
import type { SessionRecord, ExerciseProgress } from "@/lib/progress";
import { exerciseName, EXERCISE_NAMES } from "@/lib/exercises/names";
import { getExercise } from "@/lib/exercises/library";
import { listUserExercises, deleteUserExercise } from "@/lib/exercises/userStore";
import type { StoredExtractedExercise } from "@/lib/exercises/userStore";
import { listSongs, deleteSong } from "@/lib/songs/store";
import { chunkToDescriptor } from "@/lib/songs/toDescriptor";
import { parseChunkId } from "@/lib/songs/types";
import { pruneRoutineExerciseIds } from "@/lib/progress/routine";
import type { StoredSong } from "@/lib/songs/types";
import type { ExerciseDescriptor } from "@/lib/exercises/types";
import NoteResultsStrip from "@/components/practice/NoteResultsStrip";
import Sparkline from "@/components/progress/Sparkline";
import type { SparklinePoint } from "@/components/progress/Sparkline";
import { TodayRoutineCard } from "@/components/practice/TodayRoutineCard";
import PathwaysCard from "@/components/practice/PathwaysCard";
import { RoutineEditModal, buildRoutineItems } from "@/components/practice/RoutineEditModal";
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

function RecentSessionRow({
  session,
  displayName,
  descriptor,
}: {
  session: SessionRecord;
  displayName?: string;
  // Override the built-in lookup for chunk-id sessions (so the syllable strip
  // resolves correctly without exerciseLibrary knowing about chunks).
  descriptor?: ExerciseDescriptor;
}) {
  const { colors } = useTheme();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  const meanAcc =
    session.keyAttempts.length === 0
      ? 0
      : session.keyAttempts.reduce((s, k) => s + k.meanAccuracyPct, 0) /
        session.keyAttempts.length;

  // Derive syllables from the exercise descriptor for NoteResultsStrip.
  const exercise = descriptor ?? getExercise(session.exerciseId);
  const syllables = exercise
    ? exercise.syllables.length === 1
      ? Array(exercise.scaleDegrees.length).fill(exercise.syllables[0])
      : exercise.syllables
    : [];

  const label = displayName ?? exerciseName(session.exerciseId);

  return (
    <View style={[styles.sessionCard, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle, borderRadius: Radii.md }]}>
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        style={[styles.sessionRow, { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm, gap: Spacing.xs }]}
      >
        <View style={[styles.sessionLeft, { gap: Spacing['2xs'] }]}>
          <Text style={{ fontSize: Typography.base.size, lineHeight: Typography.base.lineHeight, fontFamily: Fonts.display, color: colors.textPrimary }}>
            {label}
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
// Songs library row — collapsible parent + per-chunk lines.
// ---------------------------------------------------------------------------

function SongLibraryRow({
  song,
  sessions,
  bestKeys,
  lastPracticed,
  onDelete,
}: {
  song: StoredSong;
  sessions: SessionRecord[];
  bestKeys: Record<string, string | null>;
  lastPracticed: Record<string, number>;
  onDelete: (songId: string) => void;
}) {
  const { colors } = useTheme();
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={[styles.exerciseCard, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle, borderRadius: Radii.md }]}>
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        style={[styles.exerciseHeader, { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm, gap: Spacing.xs }]}
      >
        <View style={[styles.exerciseHeaderLeft, { gap: Spacing['2xs'] }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.xs }}>
            <Text style={{ fontSize: Typography.base.size, lineHeight: Typography.base.lineHeight, fontFamily: Fonts.display, color: colors.textPrimary }}>
              ♪ {song.name}
            </Text>
            <View style={[styles.importedPill, { backgroundColor: colors.accentMuted, borderRadius: Radii.sm }]}>
              <Text style={{ color: colors.accent, fontSize: Typography.xs.size, lineHeight: Typography.xs.lineHeight, fontFamily: Fonts.bodySemibold }}>Song</Text>
            </View>
          </View>
          <Text style={{ fontSize: Typography.monoBase.size, lineHeight: Typography.monoBase.lineHeight, fontFamily: Fonts.mono, color: colors.textSecondary }}>
            {song.chunks.length} segment{song.chunks.length === 1 ? "" : "s"}
            {"  ·  "}
            {song.tonic} {song.mode}
            {"  ·  "}
            {song.timeSignature.num}/{song.timeSignature.den}
          </Text>
        </View>
        <Text style={{ color: colors.textTertiary, fontSize: Typography.monoBase.size, fontFamily: Fonts.mono }}>
          {expanded ? "▲" : "▼"}
        </Text>
      </Pressable>

      {expanded && (
        <View style={[styles.importedDetail, { borderTopColor: colors.borderSubtle, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm, gap: Spacing.sm }]}>
          {song.chunks.map((c) => {
            const desc = chunkToDescriptor(song, c);
            const chunkSessions = sessions.filter((s) => s.exerciseId === desc.id);
            const best = bestSessionAccuracy(chunkSessions, desc.id);
            const lastMs = lastPracticed[desc.id];
            return (
              <View key={c.id} style={[styles.importedSection, { backgroundColor: colors.bgCanvas, borderRadius: Radii.sm, padding: Spacing.xs, gap: Spacing["3xs"] }]}>
                <Text style={{ fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight, fontFamily: Fonts.bodySemibold, color: colors.textPrimary }}>
                  {c.name}
                </Text>
                <Text style={{ fontSize: Typography.monoBase.size, lineHeight: Typography.monoBase.lineHeight, fontFamily: Fonts.mono, color: colors.textTertiary }}>
                  notes {c.startNoteIdx + 1}–{c.endNoteIdx + 1}
                  {best != null ? `  ·  best ${fmtAccuracy(best)}` : ""}
                  {lastMs ? `  ·  last ${fmtDate(lastMs)}` : ""}
                </Text>
              </View>
            );
          })}

          <View style={[styles.importedActionsRow, { gap: Spacing.xs, justifyContent: "flex-end" }]}>
            <Pressable
              style={[styles.importedActionBtn, { backgroundColor: colors.bgSurface, borderRadius: Radii.sm, borderWidth: 1, borderColor: colors.borderStrong, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs }]}
              onPress={() => router.push({ pathname: "/song-editor", params: { songId: song.id } })}
              accessibilityLabel={`Edit segments for ${song.name}`}
            >
              <Text style={{ fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight, fontFamily: Fonts.bodyMedium, color: colors.textPrimary }}>Edit segments</Text>
            </Pressable>
            <Pressable
              style={[styles.importedActionBtn, { backgroundColor: colors.bgSurface, borderRadius: Radii.sm, borderWidth: 1, borderColor: colors.error, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs }]}
              onPress={() => onDelete(song.id)}
              accessibilityLabel={`Delete song ${song.name}`}
            >
              <Text style={{ fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight, fontFamily: Fonts.bodyMedium, color: colors.error }}>Delete</Text>
            </Pressable>
          </View>
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
  const [pathConfirmation, setPathConfirmation] = useState<string | null>(null);
  const [userExercises, setUserExercises] = useState<StoredExtractedExercise[]>([]);
  const [songs, setSongs] = useState<StoredSong[]>([]);

  // Backup/restore state
  const [lastExportDays, setLastExportDays] = useState<number | null | undefined>(undefined); // undefined = not loaded yet
  const [restoreStatus, setRestoreStatus] = useState<{ kind: "ok"; count: number } | { kind: "error"; message: string } | null>(null);
  const [nudgeDismissed, setNudgeDismissed] = useState(false);
  // Hidden file input ref for web restore
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    Promise.all([
      sessionStore.list().catch(() => [] as SessionRecord[]),
      loadRoutine(),
      listUserExercises().catch(() => [] as StoredExtractedExercise[]),
      listSongs().catch(() => [] as StoredSong[]),
      lastExportInfo(Date.now()).catch(() => ({ at: null, ageDays: null })),
    ]).then(([list, routineConfig, imported, songList, exportInfo]) => {
      setSessions(list);
      setRoutine(routineConfig);
      setUserExercises(imported);
      setSongs(songList);
      setLastExportDays(exportInfo.ageDays);
      setLoading(false);
    }).catch(() => {
      setSessions([]);
      setRoutine(null);
      setUserExercises([]);
      setSongs([]);
      setLastExportDays(null);
      setLoading(false);
    });
  }, []);

  // Practice's routine "Edit" deep-links here with ?editRoutine=1 — open the editor, then drop the param.
  const { editRoutine } = useLocalSearchParams<{ editRoutine?: string }>();
  useEffect(() => {
    if (editRoutine === "1") {
      setEditModalVisible(true);
      router.setParams({ editRoutine: undefined });
    }
  }, [editRoutine, router]);

  async function handleSaveRoutine(config: RoutineConfig) {
    await saveRoutine(config).catch(() => {});
    setRoutine(config);
  }

  function handlePracticeExercise(exerciseId: string) {
    router.push({ pathname: "/", params: { exerciseId } });
  }

  // Make a path the daily routine — the existing streak/completion system tracks it.
  async function handleUsePath(exerciseIds: string[]) {
    await saveRoutine({ exerciseIds }).catch(() => {});
    setRoutine({ exerciseIds });
    setPathConfirmation("Path set as today's routine.");
  }

  function openImportModal() {
    setImportModalVisible(true);
  }

  async function handleImportSaved() {
    // Refresh the user-exercise list AND song list so a new import (either kind)
    // shows up immediately.
    try {
      const [users, songList] = await Promise.all([
        listUserExercises(),
        listSongs(),
      ]);
      setUserExercises(users);
      setSongs(songList);
    } catch {
      /* ignore */
    }
  }

  async function handleDeleteUserExercise(id: string) {
    await deleteUserExercise(id).catch(() => {});
    setUserExercises((prev) => prev.filter((it) => it.descriptor.id !== id));
  }

  async function handleDeleteSong(songId: string) {
    await deleteSong(songId).catch(() => {});
    // Strip any of this song's chunk IDs from the saved routine.
    await pruneRoutineExerciseIds((id) => {
      const parsed = parseChunkId(id);
      return parsed?.songId === songId;
    }).catch(() => {});
    setSongs((prev) => prev.filter((s) => s.id !== songId));
    // Reload routine state so the badge counts stay accurate.
    try {
      const fresh = await loadRoutine();
      setRoutine(fresh);
    } catch {
      /* ignore */
    }
  }

  async function handleBackup() {
    try {
      await downloadBackup();
      // Refresh age display after a successful export
      const info = await lastExportInfo(Date.now()).catch(() => ({ at: null, ageDays: null }));
      setLastExportDays(info.ageDays);
      setNudgeDismissed(true);
    } catch {
      /* download errors are visible to the user via the browser */
    }
  }

  function handleRestoreClick() {
    if (Platform.OS !== "web") return;
    // Create a hidden file input on first use, attach to document body
    if (!fileInputRef.current) {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "application/json";
      input.style.display = "none";
      input.addEventListener("change", async () => {
        const file = input.files?.[0];
        if (!file) return;
        const text = await file.text();
        const result = await importAll(text);
        if (result.ok) {
          setRestoreStatus({ kind: "ok", count: result.restoredKeys.length });
        } else {
          setRestoreStatus({ kind: "error", message: result.error });
        }
        // Reset so the same file can be re-picked if needed
        input.value = "";
      });
      document.body.appendChild(input);
      fileInputRef.current = input;
    }
    fileInputRef.current.click();
  }

  // Items for RoutineEditModal — built-ins + user-imported + song chunks.
  const routineItems = buildRoutineItems(userExercises, songs);

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

  // Chunk-id → { displayName, descriptor } map so RecentSessionRow can render
  // a real label + syllables for song-chunk sessions (which aren't in the
  // built-in exerciseLibrary lookup).
  const chunkInfoById = new Map<string, { displayName: string; descriptor: ExerciseDescriptor }>();
  for (const s of songs) {
    for (const c of s.chunks) {
      const desc = chunkToDescriptor(s, c);
      chunkInfoById.set(desc.id, {
        displayName: `${s.name} — ${c.name}`,
        descriptor: desc,
      });
    }
  }
  // Exclude session IDs that correspond to user-imported or song-chunk exercises
  // from the built-in ExerciseRow loop — they get their own renderers below.
  const userExerciseIds = new Set(userExercises.map((it) => it.descriptor.id));
  const chunkExerciseIds = new Set(chunkInfoById.keys());
  const builtinExerciseIds = exerciseIds.filter(
    (id) => !userExerciseIds.has(id) && !chunkExerciseIds.has(id),
  );

  // Show the nudge when: sessions exist, export info loaded, and backup is stale (>30d) or never done
  const showNudge =
    !nudgeDismissed &&
    hasSessions &&
    lastExportDays !== undefined &&
    (lastExportDays === null || lastExportDays > 30);

  function fmtLastExport(): string {
    if (lastExportDays === undefined) return "";
    if (lastExportDays === null) return "never";
    const days = Math.floor(lastExportDays);
    if (days === 0) return "today";
    if (days === 1) return "1 day ago";
    return `${days} days ago`;
  }

  return (
    <>
      <ScrollView style={[styles.container, { backgroundColor: colors.canvas }]} contentContainerStyle={[styles.content, { padding: Spacing.lg, paddingBottom: Spacing['3xl'], gap: Spacing.md }]}>
        <Text style={{ fontSize: Typography['2xl'].size, lineHeight: Typography['2xl'].lineHeight, fontFamily: Fonts.display, color: colors.textPrimary }}>
          Progress
        </Text>

        {/* Backup nudge banner — shown when history exists and backup is stale */}
        {showNudge && (
          <View style={[styles.nudgeBanner, { backgroundColor: colors.bgSurface, borderLeftColor: colors.accent, borderRadius: Radii.md }]}>
            <Text style={{ flex: 1, fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight, fontFamily: Fonts.body, color: colors.textPrimary }}>
              Your history only lives in this browser — back it up so you don't lose it.
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.xs, marginTop: Spacing.xs }}>
              <Pressable
                onPress={() => { void handleBackup(); }}
                style={[styles.nudgeAction, { backgroundColor: colors.accent, borderRadius: Radii.sm }]}
                accessibilityLabel="Back up your data now"
              >
                <Text style={{ color: colors.bgCanvas, fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight, fontFamily: Fonts.bodyMedium }}>
                  Back up now
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setNudgeDismissed(true)}
                style={[styles.nudgeDismiss]}
                accessibilityLabel="Dismiss backup reminder"
              >
                <Text style={{ color: colors.textTertiary, fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight, fontFamily: Fonts.body }}>
                  Dismiss
                </Text>
              </Pressable>
            </View>
          </View>
        )}

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

        {/* Warm empty state — shown only when no sessions have been logged */}
        {!hasSessions && (
          <View style={[styles.emptyCard, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle, borderRadius: Radii.md }]}>
            <Text style={{ fontSize: Typography.xs.size, lineHeight: Typography.xs.lineHeight, fontFamily: Fonts.bodyMedium, color: colors.textTertiary, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: Spacing.xs }}>
              Nothing logged yet
            </Text>
            <Text style={{ fontSize: Typography.lg.size, lineHeight: Typography.lg.lineHeight, fontFamily: Fonts.display, color: colors.textPrimary, marginBottom: Spacing.xs }}>
              Sing your first exercise to start tracking.
            </Text>
            <Text style={{ fontSize: Typography.base.size, lineHeight: Typography.base.lineHeight, fontFamily: Fonts.body, color: colors.textSecondary }}>
              After each practice you'll see your accuracy trend, best key, and weekly streak here.
            </Text>
          </View>
        )}

        {pathConfirmation !== null && (
          <Text style={{ fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight, fontFamily: Fonts.bodyMedium, color: colors.success }}>
            {pathConfirmation}
          </Text>
        )}

        {/* Growth Paths — curated, never-gated exercise sets (below the core stats) */}
        <PathwaysCard
          sessions={allSessions}
          onPracticeExercise={handlePracticeExercise}
          onUsePath={handleUsePath}
        />

        {(exerciseIds.length > 0 || userExercises.length > 0 || songs.length > 0) && (
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
                Add imported melody or song
              </Text>
            </Pressable>

            {builtinExerciseIds.map((id) => (
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

            {userExercises.map((it) => (
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

            {songs.length > 0 && (
              <Text style={{ fontSize: Typography.xs.size, lineHeight: Typography.xs.lineHeight, fontFamily: Fonts.bodyMedium, color: colors.textTertiary, textTransform: "uppercase", letterSpacing: 0.8, marginTop: Spacing.xs }}>
                Songs
              </Text>
            )}
            {songs.map((song) => (
              <SongLibraryRow
                key={song.id}
                song={song}
                sessions={allSessions}
                bestKeys={bestKeys}
                lastPracticed={lastPracticed}
                onDelete={handleDeleteSong}
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
            {recentSessions.map((s) => {
              const chunkInfo = chunkInfoById.get(s.exerciseId);
              return (
                <RecentSessionRow
                  key={s.id}
                  session={s}
                  displayName={chunkInfo?.displayName}
                  descriptor={chunkInfo?.descriptor}
                />
              );
            })}
          </>
        )}

        {/* Backup / restore footer */}
        {Platform.OS === "web" && (
          <View style={[styles.backupSection, { borderTopColor: colors.borderSubtle, marginTop: Spacing.lg, paddingTop: Spacing.lg, gap: Spacing.sm }]}>
            <Text style={{ fontSize: Typography.xs.size, lineHeight: Typography.xs.lineHeight, fontFamily: Fonts.bodyMedium, color: colors.textTertiary, textTransform: "uppercase", letterSpacing: 0.8 }}>
              Your data
            </Text>
            <Text style={{ fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight, fontFamily: Fonts.body, color: colors.textSecondary }}>
              Stays on this device.
            </Text>

            <View style={[styles.backupButtons, { gap: Spacing.xs }]}>
              <Pressable
                onPress={() => { void handleBackup(); }}
                style={[styles.backupBtn, { backgroundColor: colors.bgSurface, borderColor: colors.borderStrong, borderRadius: Radii.md }]}
                accessibilityLabel="Back up your data to a file"
              >
                <Text style={{ fontSize: Typography.base.size, lineHeight: Typography.base.lineHeight, fontFamily: Fonts.bodyMedium, color: colors.textPrimary }}>
                  Back up to file
                </Text>
              </Pressable>
              <Pressable
                onPress={handleRestoreClick}
                style={[styles.backupBtn, { backgroundColor: colors.bgSurface, borderColor: colors.borderStrong, borderRadius: Radii.md }]}
                accessibilityLabel="Restore data from a backup file"
              >
                <Text style={{ fontSize: Typography.base.size, lineHeight: Typography.base.lineHeight, fontFamily: Fonts.bodyMedium, color: colors.textPrimary }}>
                  Restore
                </Text>
              </Pressable>
            </View>

            {restoreStatus !== null && (
              <Text style={{ fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight, fontFamily: Fonts.body, color: restoreStatus.kind === "ok" ? colors.success : colors.error }}>
                {restoreStatus.kind === "ok"
                  ? `Restored ${restoreStatus.count} item${restoreStatus.count === 1 ? "" : "s"} — reload to see them`
                  : restoreStatus.message}
              </Text>
            )}

            {lastExportDays !== undefined && (
              <Text style={{ fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight, fontFamily: Fonts.body, color: colors.textTertiary }}>
                Last backup: {fmtLastExport()}
              </Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* Edit Routine Modal */}
      {routine !== null && (
        <RoutineEditModal
          visible={editModalVisible}
          routine={activeRoutine}
          items={routineItems}
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

  // Warm empty state card
  emptyCard: { borderWidth: 1, padding: Spacing.lg, gap: Spacing.xs },

  // Backup nudge banner
  nudgeBanner: { borderLeftWidth: 3, padding: Spacing.sm },
  nudgeAction: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, minHeight: 36 },
  nudgeDismiss: { paddingHorizontal: Spacing.xs, paddingVertical: Spacing.xs, minHeight: 36 },

  // Backup footer
  backupSection: { borderTopWidth: 1 },
  backupButtons: { flexDirection: "row" },
  backupBtn: { borderWidth: 1, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, minHeight: 44 },
});
