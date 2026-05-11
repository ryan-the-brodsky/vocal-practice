// COMPONENT TEST: components/practice/__tests__/TodayRoutineCard.test.tsx
// asserts on the "TODAY'S ROUTINE" header (full mode) / "Today:" prefix
// (compact mode), the "{n} of {m} done" status, the "Routine done"
// celebration copy when all items complete, the empty state copy, the Edit
// accessibility label, the per-item Pressable behavior (onItemPress with the
// right id), and the compact-mode dot bar + tap-to-expand interaction.
// Edits to those surfaces here MUST be mirrored in the test file.
import { useState } from "react";
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
  /** When true, collapse to a single-line summary that taps-to-expand. Used on the Practice tab. */
  compact?: boolean;
}

export function TodayRoutineCard({ routine, status, onPressEdit, onItemPress, compact }: Props) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const isEmpty = routine.exerciseIds.length === 0;
  const allDone = !isEmpty && status.done === status.total;
  const nextItem = isEmpty ? null : status.items.find((i) => !i.done) ?? status.items[status.items.length - 1];

  // Compact + collapsed: single-row summary with a dot bar.
  if (compact && !expanded) {
    const summaryText = isEmpty
      ? "No routine — tap Edit to add"
      : allDone
        ? "Routine done"
        : nextItem
          ? `Today: ${exerciseName(nextItem.id)}`
          : "Today's routine";

    return (
      <View
        style={[
          styles.compactRow,
          { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle, borderRadius: Radii.md },
        ]}
      >
        <Pressable
          onPress={() => setExpanded(true)}
          accessibilityRole="button"
          accessibilityLabel={
            isEmpty ? "Expand routine" : `${summaryText}. Tap to see full routine.`
          }
          style={styles.compactSummary}
        >
          <Text
            numberOfLines={1}
            style={{
              fontSize: Typography.sm.size,
              lineHeight: Typography.sm.lineHeight,
              color: allDone ? colors.success : colors.textPrimary,
              fontFamily: Fonts.bodyMedium,
              flex: 1,
            }}
          >
            {summaryText}
          </Text>
          {!isEmpty && (
            <Text
              style={{
                fontSize: Typography.sm.size,
                lineHeight: Typography.sm.lineHeight,
                color: allDone ? colors.success : colors.textTertiary,
                fontFamily: Fonts.mono,
                letterSpacing: 1,
                marginLeft: Spacing.xs,
              }}
            >
              {status.items.map((i) => (i.done ? "●" : "○")).join("")}
            </Text>
          )}
          <Text
            style={{
              fontSize: Typography.sm.size,
              lineHeight: Typography.sm.lineHeight,
              color: colors.textTertiary,
              fontFamily: Fonts.mono,
              marginLeft: Spacing.xs,
            }}
          >
            ⌄
          </Text>
        </Pressable>
        <TouchableOpacity
          onPress={onPressEdit}
          style={[styles.editBtn, { paddingHorizontal: Spacing.sm }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Edit routine"
        >
          <Text style={{ fontSize: Typography.sm.size, color: colors.textSecondary }}>Edit</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Full / expanded view (default for Progress; revealed when compact tapped).
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle, borderRadius: Radii.lg },
      ]}
    >
      <Pressable
        onPress={compact ? () => setExpanded(false) : undefined}
        accessibilityRole={compact ? "button" : undefined}
        accessibilityLabel={compact ? "Collapse routine" : undefined}
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
        {compact ? (
          <Text style={[styles.editBtn, { fontSize: Typography.base.size, color: colors.textSecondary }]}>⌃</Text>
        ) : (
          <TouchableOpacity
            onPress={onPressEdit}
            style={styles.editBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Edit routine"
          >
            <Text style={{ fontSize: Typography.base.size, color: colors.textSecondary }}>Edit</Text>
          </TouchableOpacity>
        )}
      </Pressable>

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
                  onPress={() => {
                    onItemPress(item.id);
                    if (compact) setExpanded(false);
                  }}
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

  // Compact-mode single-row summary
  compactRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingVertical: Spacing.xs,
    paddingLeft: Spacing.sm,
    paddingRight: Spacing["2xs"],
    minHeight: 40,
  },
  compactSummary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minHeight: 36,
  },
});
