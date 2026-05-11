// COMPONENT TEST: components/practice/__tests__/TodayRoutineCard.test.tsx
// asserts on the "TODAY'S ROUTINE" eyebrow (every mode), the "{n} of {m} done"
// / "Routine done" status, the empty-state copy, the "Edit routine" button
// (present in BOTH the compact-collapsed row AND the compact-expanded header),
// the "Show all" expand affordance + chevron, the per-item Pressable behavior
// (onItemPress with the right id), and the collapse/expand interaction.
// Edits to those surfaces here MUST be mirrored in the test file.
import { useState } from "react";
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
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

  const eyebrow = (
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
      TODAY&apos;S ROUTINE
    </Text>
  );

  const statusText = isEmpty ? null : allDone ? "Routine done" : `${status.done} of ${status.total} done`;

  // ── Compact + collapsed: a disclosure row with the routine name front-and-centre.
  if (compact && !expanded) {
    const headline = isEmpty
      ? "No exercises yet"
      : allDone
        ? "All done — nice work"
        : `Next: ${exerciseName(nextItem!.id)}`;

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
            isEmpty
              ? "Expand routine"
              : `Today's routine — ${statusText}, ${headline}. Tap to see all exercises.`
          }
          style={styles.compactSummary}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap" }}>
              {eyebrow}
              {statusText && (
                <Text
                  style={{
                    fontSize: Typography.xs.size,
                    lineHeight: Typography.xs.lineHeight,
                    color: allDone ? colors.success : colors.textTertiary,
                    fontFamily: Fonts.mono,
                    marginLeft: Spacing.xs,
                  }}
                >
                  · {statusText}
                </Text>
              )}
            </View>
            <Text
              numberOfLines={1}
              style={{
                fontSize: Typography.sm.size,
                lineHeight: Typography.sm.lineHeight,
                color: allDone ? colors.success : colors.textPrimary,
                fontFamily: Fonts.bodyMedium,
              }}
            >
              {headline}
            </Text>
          </View>

          {!isEmpty && (
            <Text
              style={{
                fontSize: Typography.sm.size,
                lineHeight: Typography.sm.lineHeight,
                color: allDone ? colors.success : colors.textTertiary,
                fontFamily: Fonts.mono,
                letterSpacing: 1,
                marginHorizontal: Spacing.sm,
              }}
            >
              {status.items.map((i) => (i.done ? "●" : "○")).join("")}
            </Text>
          )}

          <View style={[styles.expandPill, { borderColor: colors.borderStrong }]}>
            <Text
              style={{
                fontSize: Typography.xs.size,
                color: colors.textSecondary,
                fontFamily: Fonts.bodyMedium,
              }}
            >
              Show all
            </Text>
            <IconSymbol name="chevron.down" size={16} color={colors.textSecondary} style={{ marginLeft: 2 }} />
          </View>
        </Pressable>

        <TouchableOpacity
          onPress={onPressEdit}
          style={[styles.editBtn, { paddingHorizontal: Spacing.sm }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Edit routine"
        >
          <Text style={{ fontSize: Typography.sm.size, color: colors.textSecondary, fontFamily: Fonts.bodyMedium }}>
            Edit
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Full / expanded view (default for Progress; revealed when a compact row is tapped).
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
        <Pressable
          onPress={compact ? () => setExpanded(false) : undefined}
          accessibilityRole={compact ? "button" : undefined}
          accessibilityLabel={compact ? "Collapse routine" : undefined}
          style={[styles.headerLeft, { gap: Spacing.xs }]}
        >
          {eyebrow}
          {statusText && (
            <Text
              style={{
                fontSize: Typography.monoBase.size,
                lineHeight: Typography.monoBase.lineHeight,
                color: allDone ? colors.success : colors.textSecondary,
                fontFamily: Fonts.mono,
              }}
            >
              {statusText}
            </Text>
          )}
        </Pressable>

        <View style={{ flexDirection: "row", alignItems: "center", gap: Spacing.md }}>
          <TouchableOpacity
            onPress={onPressEdit}
            style={styles.editBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Edit routine"
          >
            <Text style={{ fontSize: Typography.base.size, color: colors.textSecondary, fontFamily: Fonts.bodyMedium }}>
              Edit
            </Text>
          </TouchableOpacity>
          {compact && (
            <Pressable
              onPress={() => setExpanded(false)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Collapse routine"
            >
              <IconSymbol name="chevron.up" size={20} color={colors.textTertiary} />
            </Pressable>
          )}
        </View>
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
                {onItemPress && (
                  <IconSymbol name="chevron.right" size={16} color={colors.textTertiary} />
                )}
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

      {compact && (
        <TouchableOpacity
          onPress={onPressEdit}
          style={[
            styles.editFooter,
            { borderTopColor: colors.borderSubtle, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.xs },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Edit routine"
        >
          <IconSymbol name="pencil" size={15} color={colors.accent} />
          <Text style={{ fontSize: Typography.sm.size, color: colors.accent, fontFamily: Fonts.bodyMedium }}>
            Edit routine — add or swap exercises
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, overflow: "hidden" },
  header: { flexDirection: "row", alignItems: "center", borderBottomWidth: 1 },
  headerLeft: { flex: 1, flexDirection: "row", alignItems: "center" },
  editBtn: { padding: Spacing["2xs"] },
  editFooter: { flexDirection: "row", alignItems: "center", borderTopWidth: 1 },
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
    minHeight: 52,
  },
  compactSummary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    minHeight: 40,
  },
  expandPill: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing["3xs"],
  },
});
