import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { CAPABILITIES, isComingSoon } from "@/lib/exercises/capabilities";
import { getAllExercises, groupByCapability, getExercise } from "@/lib/exercises/library";
import type { ExerciseDescriptor } from "@/lib/exercises/types";
import { exerciseName } from "@/lib/exercises/names";
import { loadRoutine, saveRoutine } from "@/lib/progress/routine";
import type { RoutineConfig } from "@/lib/progress/routine";
import { listUserExercises } from "@/lib/exercises/userStore";
import type { StoredExtractedExercise } from "@/lib/exercises/userStore";
import { listSongs } from "@/lib/songs/store";
import type { StoredSong } from "@/lib/songs/types";
import { RoutineEditModal, buildRoutineItems } from "@/components/practice/RoutineEditModal";
import ImportModal from "@/components/import/ImportModal";
import { useTheme } from "@/hooks/use-theme";
import { Spacing, Radii, Typography, Fonts } from "@/constants/theme";

function Eyebrow({ children }: { children: string }) {
  const { colors } = useTheme();
  return (
    <Text style={{ fontSize: Typography.xs.size, lineHeight: Typography.xs.lineHeight, fontFamily: Fonts.bodyMedium, color: colors.textTertiary, textTransform: "uppercase", letterSpacing: 0.8 }}>
      {children}
    </Text>
  );
}

function ExerciseRow({
  exercise,
  inRoutine,
  onToggleRoutine,
  onPractice,
}: {
  exercise: ExerciseDescriptor;
  inRoutine: boolean;
  onToggleRoutine: () => void;
  onPractice: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.exRow, { gap: Spacing.xs }]}>
      <Text style={[styles.exName, { color: colors.textPrimary, fontFamily: Fonts.bodyMedium }]} numberOfLines={2}>
        {exercise.name}
      </Text>
      <View style={[styles.exActions, { gap: Spacing.xs }]}>
        <Pressable
          onPress={onToggleRoutine}
          accessibilityRole="button"
          accessibilityLabel={inRoutine ? `Remove ${exercise.name} from your routine` : `Add ${exercise.name} to your routine`}
          style={[
            styles.actionBtn,
            inRoutine
              ? { backgroundColor: colors.accentMuted, borderColor: colors.accent }
              : { backgroundColor: colors.bgSurface, borderColor: colors.borderStrong },
          ]}
        >
          <Text style={[styles.actionText, { color: inRoutine ? colors.accent : colors.textPrimary, fontFamily: Fonts.bodyMedium }]}>
            {inRoutine ? "✓ In routine" : "+ Add"}
          </Text>
        </Pressable>
        <Pressable
          onPress={onPractice}
          accessibilityRole="button"
          accessibilityLabel={`Practice ${exercise.name} now`}
          style={[styles.actionBtn, { backgroundColor: colors.bgSurface, borderColor: colors.borderStrong }]}
        >
          <Text style={[styles.actionText, { color: colors.accent, fontFamily: Fonts.bodyMedium }]}>Practice ▶</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function PlanScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [exercises, setExercises] = useState<ExerciseDescriptor[]>([]);
  const [routine, setRoutine] = useState<RoutineConfig | null>(null);
  const [userExercises, setUserExercises] = useState<StoredExtractedExercise[]>([]);
  const [songs, setSongs] = useState<StoredSong[]>([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);

  const refresh = useCallback(async () => {
    const [all, routineConfig, users, songList] = await Promise.all([
      getAllExercises().catch(() => [] as ExerciseDescriptor[]),
      loadRoutine().catch(() => ({ exerciseIds: [] }) as RoutineConfig),
      listUserExercises().catch(() => [] as StoredExtractedExercise[]),
      listSongs().catch(() => [] as StoredSong[]),
    ]);
    setExercises(all);
    setRoutine(routineConfig);
    setUserExercises(users);
    setSongs(songList);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  function handlePracticeExercise(id: string) {
    router.push({ pathname: "/", params: { exerciseId: id } });
  }

  async function handleSaveRoutine(config: RoutineConfig) {
    await saveRoutine(config).catch(() => {});
    setRoutine(config);
  }

  function handleToggleRoutine(id: string) {
    const ids = (routine ?? { exerciseIds: [] }).exerciseIds;
    const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
    void handleSaveRoutine({ exerciseIds: next });
  }

  // Map each capability to its exercises; the null group collects imports + song chunks.
  const grouped = groupByCapability(exercises);
  const byCapability = new Map(grouped.map((g) => [g.capability, g]));
  const uncategorized = byCapability.get(null);

  const activeRoutine: RoutineConfig = routine ?? { exerciseIds: [] };
  const routineSet = new Set(activeRoutine.exerciseIds);
  const routineItems = buildRoutineItems(userExercises, songs);

  return (
    <>
      <ScrollView style={[styles.container, { backgroundColor: colors.canvas }]} contentContainerStyle={[styles.content, { padding: Spacing.lg, paddingBottom: Spacing['3xl'], gap: Spacing.lg }]}>
        <Text style={{ fontSize: Typography['2xl'].size, lineHeight: Typography['2xl'].lineHeight, fontFamily: Fonts.display, color: colors.textPrimary }}>
          Plan
        </Text>

        {/* a. Browse exercises by capability */}
        <View style={{ gap: Spacing.md }}>
          <Eyebrow>Browse exercises</Eyebrow>
          {CAPABILITIES.map((cap) => {
            const group = byCapability.get(cap.id);
            const comingSoon = isComingSoon(cap.id);
            return (
              <View key={cap.id} style={[styles.capCard, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle, borderRadius: Radii.md, padding: Spacing.md, gap: Spacing.xs }]}>
                <Text style={{ fontSize: Typography.lg.size, lineHeight: Typography.lg.lineHeight, fontFamily: Fonts.display, color: colors.textPrimary }}>
                  {cap.label}
                </Text>
                <Text style={{ fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight, fontFamily: Fonts.body, color: colors.textSecondary }}>
                  {cap.blurb}
                </Text>
                {group && group.exercises.length > 0 ? (
                  <View style={[styles.exList, { marginTop: Spacing['2xs'] }]}>
                    {group.exercises.map((ex) => (
                      <ExerciseRow
                        key={ex.id}
                        exercise={ex}
                        inRoutine={routineSet.has(ex.id)}
                        onToggleRoutine={() => handleToggleRoutine(ex.id)}
                        onPractice={() => handlePracticeExercise(ex.id)}
                      />
                    ))}
                  </View>
                ) : (
                  <Text style={{ fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight, fontFamily: Fonts.body, color: colors.textTertiary, marginTop: Spacing['2xs'] }}>
                    {comingSoon ? "Exercises coming soon" : "No exercises yet"}
                  </Text>
                )}
              </View>
            );
          })}

          {/* Uncategorized — user imports + song chunks. */}
          {uncategorized && uncategorized.exercises.length > 0 && (
            <View style={[styles.capCard, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle, borderRadius: Radii.md, padding: Spacing.md, gap: Spacing.xs }]}>
              <Text style={{ fontSize: Typography.lg.size, lineHeight: Typography.lg.lineHeight, fontFamily: Fonts.display, color: colors.textPrimary }}>
                {uncategorized.label}
              </Text>
              <Text style={{ fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight, fontFamily: Fonts.body, color: colors.textSecondary }}>
                {uncategorized.blurb}
              </Text>
              <View style={[styles.exList, { marginTop: Spacing['2xs'] }]}>
                {uncategorized.exercises.map((ex) => (
                  <ExerciseRow
                    key={ex.id}
                    exercise={ex}
                    inRoutine={routineSet.has(ex.id)}
                    onToggleRoutine={() => handleToggleRoutine(ex.id)}
                    onPractice={() => handlePracticeExercise(ex.id)}
                  />
                ))}
              </View>
            </View>
          )}
        </View>

        {/* b. Today's routine */}
        <View style={{ gap: Spacing.xs }}>
          <Eyebrow>Today's routine</Eyebrow>
          <View style={[styles.capCard, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle, borderRadius: Radii.md, padding: Spacing.md, gap: Spacing.xs }]}>
            {activeRoutine.exerciseIds.length === 0 ? (
              <Text style={{ fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight, fontFamily: Fonts.body, color: colors.textSecondary }}>
                No exercises in your routine yet. Add a few to build your daily warmup.
              </Text>
            ) : (
              <View style={{ gap: Spacing['2xs'] }}>
                {activeRoutine.exerciseIds.map((id) => {
                  const name = getExercise(id)?.name ?? exerciseName(id);
                  return (
                    <Text key={id} style={{ fontSize: Typography.base.size, lineHeight: Typography.base.lineHeight, fontFamily: Fonts.body, color: colors.textPrimary }}>
                      {name}
                    </Text>
                  );
                })}
              </View>
            )}
            <Pressable
              onPress={() => setEditModalVisible(true)}
              style={[styles.editBtn, { backgroundColor: colors.accent, borderRadius: Radii.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, marginTop: Spacing['2xs'] }]}
              accessibilityLabel="Edit routine"
            >
              <Text style={{ fontSize: Typography.base.size, lineHeight: Typography.base.lineHeight, fontFamily: Fonts.bodyMedium, color: colors.bgCanvas }}>
                Edit routine
              </Text>
            </Pressable>
          </View>
        </View>

        {/* c. Bring your own */}
        <View style={{ gap: Spacing.xs }}>
          <Eyebrow>Bring your own</Eyebrow>
          <View style={[styles.capCard, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle, borderRadius: Radii.md, padding: Spacing.md, gap: Spacing.xs }]}>
            <Text style={{ fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight, fontFamily: Fonts.body, color: colors.textSecondary }}>
              Upload or record a melody and practice it like a built-in exercise.
            </Text>
            <Pressable
              onPress={() => setImportModalVisible(true)}
              style={[styles.editBtn, { backgroundColor: colors.bgSurface, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: Radii.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, marginTop: Spacing['2xs'] }]}
              accessibilityLabel="Import a melody or song"
            >
              <Text style={{ fontSize: Typography.base.size, lineHeight: Typography.base.lineHeight, fontFamily: Fonts.bodyMedium, color: colors.textPrimary }}>
                Import a melody or song
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {routine !== null && (
        <RoutineEditModal
          visible={editModalVisible}
          routine={activeRoutine}
          items={routineItems}
          onSave={handleSaveRoutine}
          onClose={() => setEditModalVisible(false)}
        />
      )}

      <ImportModal
        visible={importModalVisible}
        onClose={() => setImportModalVisible(false)}
        onSaved={() => { void refresh(); }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {},
  capCard: { borderWidth: 1 },
  exList: { gap: Spacing.sm },
  exRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" },
  exName: { flexShrink: 1, minWidth: 120, fontSize: Typography.base.size, lineHeight: Typography.base.lineHeight },
  exActions: { flexDirection: "row", alignItems: "center" },
  actionBtn: { borderWidth: 1, borderRadius: Radii.pill, paddingHorizontal: Spacing.sm, paddingVertical: Spacing["2xs"], minHeight: 36, alignItems: "center", justifyContent: "center" },
  actionText: { fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight },
  editBtn: { alignSelf: "flex-start", minHeight: 44, alignItems: "center", justifyContent: "center" },
});
