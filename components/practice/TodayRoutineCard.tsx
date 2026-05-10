// COMPONENT TEST: components/practice/__tests__/TodayRoutineCard.test.tsx
// asserts on the "TODAY'S ROUTINE" header, the "{n} of {m} done" status,
// the "Routine done" celebration copy when all items complete, the empty
// state copy, the Edit accessibility label, and the per-item Pressable
// behavior (firing onItemPress with the right id) when the prop is provided.
// Edits to those surfaces here MUST be mirrored in the test file.
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Fonts, Radii, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { exerciseName } from "@/lib/exercises/names";
import type { RoutineConfig, RoutineStatus } from "@/lib/progress";

interface Props {
  routine: RoutineConfig;
  status: RoutineStatus;
  onPressEdit: () => void;
  /** When provided, each routine row becomes a Pressable that fires this with the exerciseId. */
  onItemPress?: (exerciseId: string) => void;
}

export function TodayRoutineCard({ routine, status, onPressEdit, onItemPress }: Props) {
  const { colors } = useTheme();
  const isEmpty = routine.exerciseIds.length === 0;
  const allDone = !isEmpty && status.done === status.total;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle, borderRadius: Radii.lg },
      ]}
    >
      <View
        style={[
          styles.header,
          {
            borderBottomColor: colors.borderSubtle,
            paddingHorizontal: Spacing.md,
            paddingTop: Spacing.sm,
            paddingBottom: Spacing.xs,
          },
        ]}
      >
        <View style={[styles.headerLeft, { gap: Spacing.xs }]}>
          <Text
            style={{
              fontSize: Typography.xs.size,
              lineHeight: Typography.xs.lineHeight,
              color: colors.textTertiary,
              fontFamily: Fonts.bodyMedium,
              textTransform: "uppercase",
              letterSpacing: 0.8,
            }}
          >
            TODAY'S ROUTINE
          </Text>
          {!isEmpty && (
            <Text
              style={{
                fontSize: Typography.monoBase.size,
                lineHeight: Typography.monoBase.lineHeight,
                color: allDone ? colors.success : colors.textSecondary,
                fontFamily: Fonts.mono,
              }}
            >
              {allDone ? "Routine done" : `${status.done} of ${status.total} done`}
            </Text>
          )}
        </View>
        <TouchableOpacity
          onPress={onPressEdit}
          style={styles.editBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Edit routine"
        >
          <Text style={{ fontSize: Typography.base.size, color: colors.textSecondary }}>Edit</Text>
        </TouchableOpacity>
      </View>

      {isEmpty ? (
        <Text
          style={{
            paddingHorizontal: Spacing.md,
            paddingVertical: Spacing.sm,
            fontSize: Typography.base.size,
            lineHeight: Typography.base.lineHeight,
            color: colors.textTertiary,
            fontFamily: Fonts.body,
            fontStyle: "italic",
          }}
        >
          No exercises in your routine. Tap Edit to add some.
        </Text>
      ) : (
        <View
          style={[styles.items, { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, gap: Spacing.xs }]}
        >
          {status.items.map((item) => {
            const content = (
              <>
                <Text
                  style={{
                    fontSize: Typography.base.size,
                    color: item.done ? colors.success : colors.textTertiary,
                    width: Spacing.lg,
                    textAlign: "center",
                    fontFamily: Fonts.mono,
                  }}
                >
                  {item.done ? "✓" : "○"}
                </Text>
                <Text
                  style={{
                    fontSize: Typography.base.size,
                    lineHeight: Typography.base.lineHeight,
                    color: item.done ? colors.textTertiary : colors.textPrimary,
                    fontFamily: item.done ? Fonts.body : Fonts.bodySemibold,
                    flex: 1,
                  }}
                >
                  {exerciseName(item.id)}
                </Text>
              </>
            );
            if (onItemPress) {
              return (
                <Pressable
                  key={item.id}
                  onPress={() => onItemPress(item.id)}
                  style={[styles.item, { gap: Spacing.xs, minHeight: 36 }]}
                  accessibilityRole="button"
                  accessibilityLabel={`Practice ${exerciseName(item.id)}`}
                >
                  {content}
                </Pressable>
              );
            }
            return (
              <View key={item.id} style={[styles.item, { gap: Spacing.xs }]}>
                {content}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, overflow: "hidden" },
  header: { flexDirection: "row", alignItems: "center", borderBottomWidth: 1 },
  headerLeft: { flex: 1, flexDirection: "row", alignItems: "center" },
  editBtn: { padding: Spacing["2xs"] },
  items: {},
  item: { flexDirection: "row", alignItems: "center" },
});
