import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import type { RoutineConfig } from "@/lib/progress/routine";
import { routineBuiltinItems } from "@/lib/exercises/library";
import type { StoredExtractedExercise } from "@/lib/exercises/userStore";
import { chunkToDescriptor } from "@/lib/songs/toDescriptor";
import type { StoredSong } from "@/lib/songs/types";
import { useTheme } from "@/hooks/use-theme";
import { Spacing, Radii, Typography, Fonts } from "@/constants/theme";

export interface RoutineItem {
  id: string;
  label: string;
  section: "builtin" | "user" | "song";
  songName?: string;
}

// Selectable rows for the routine editor — built-ins + user imports + song
// chunks. One source of truth so Progress and Plan can't build divergent lists.
export function buildRoutineItems(
  userExercises: StoredExtractedExercise[],
  songs: StoredSong[],
): RoutineItem[] {
  return [
    ...routineBuiltinItems().map((it) => ({ ...it, section: "builtin" as const })),
    ...userExercises.map((it) => ({ id: it.descriptor.id, label: it.descriptor.name, section: "user" as const })),
    ...songs.flatMap((s) =>
      s.chunks.map((c) => {
        const desc = chunkToDescriptor(s, c);
        return { id: desc.id, label: c.name, section: "song" as const, songName: s.name };
      }),
    ),
  ];
}

export function RoutineEditModal({
  visible,
  routine,
  items,
  onSave,
  onClose,
}: {
  visible: boolean;
  routine: RoutineConfig;
  items: RoutineItem[];
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

  // Group by section for sticky labels
  const builtins = items.filter((it) => it.section === "builtin");
  const userImports = items.filter((it) => it.section === "user");
  const songItems = items.filter((it) => it.section === "song");
  // Sub-group songs by parent
  const songsByParent = new Map<string, RoutineItem[]>();
  for (const it of songItems) {
    const key = it.songName ?? "Song";
    if (!songsByParent.has(key)) songsByParent.set(key, []);
    songsByParent.get(key)!.push(it);
  }

  function renderRow(it: RoutineItem) {
    const checked = selectedIds.includes(it.id);
    return (
      <Pressable key={it.id} onPress={() => toggleExercise(it.id)} style={[mStyles.exerciseRow, { borderBottomColor: colors.borderSubtle }]}>
        <View style={[mStyles.checkbox, { borderColor: colors.borderStrong }, checked && { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary }]}>
          {checked && <Text style={[mStyles.checkmark, { color: colors.bgCanvas, fontFamily: Fonts.bodySemibold, fontSize: Typography.sm.size }]}>✓</Text>}
        </View>
        <Text style={[mStyles.exerciseLabel, { color: checked ? colors.textPrimary : colors.textSecondary, fontFamily: checked ? Fonts.bodySemibold : Fonts.body, fontSize: Typography.base.size, lineHeight: Typography.base.lineHeight }]}>
          {it.label}
        </Text>
      </Pressable>
    );
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
          {builtins.map(renderRow)}

          {userImports.length > 0 && (
            <>
              <Text style={[mStyles.sectionLabel, { color: colors.textTertiary, fontFamily: Fonts.bodyMedium, fontSize: Typography.xs.size, lineHeight: Typography.xs.lineHeight, marginTop: Spacing.sm }]}>
                IMPORTED
              </Text>
              {userImports.map(renderRow)}
            </>
          )}

          {songsByParent.size > 0 && (
            <>
              <Text style={[mStyles.sectionLabel, { color: colors.textTertiary, fontFamily: Fonts.bodyMedium, fontSize: Typography.xs.size, lineHeight: Typography.xs.lineHeight, marginTop: Spacing.sm }]}>
                SONGS
              </Text>
              {Array.from(songsByParent.entries()).map(([songName, chunks]) => (
                <View key={songName} style={{ gap: Spacing["2xs"] }}>
                  <Text style={{ color: colors.textSecondary, fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight, fontFamily: Fonts.bodySemibold, marginTop: Spacing["2xs"] }}>
                    {songName}
                  </Text>
                  {chunks.map(renderRow)}
                </View>
              ))}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

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
