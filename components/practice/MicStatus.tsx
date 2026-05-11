// COMPONENT TEST: components/practice/__tests__/MicStatus.test.tsx asserts
// on the four state strings (full mode: "Tap to check microphone",
// "Checking microphone…", "Mic blocked — check OS settings", "Mic ready"),
// the compact-mode short labels ("Check mic", "Checking…", "Mic blocked",
// "Mic ✓"), the live RMS readout formatting, and the Pressable
// accessibilityLabels. Edits here MUST be mirrored in the test file.
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Fonts, Radii, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export type MicStatusState = "unknown" | "checking" | "denied" | "ready";

interface Props {
  state: MicStatusState;
  /** When provided alongside `state="ready"`, replaces the "Mic ready" label
   *  with the live RMS readout. */
  liveRmsDb?: number;
  onCheck: () => void;
  /** When true, render as a small inline pill suitable for a header row. */
  compact?: boolean;
}

export function MicStatus({ state, liveRmsDb, onCheck, compact }: Props) {
  const { colors } = useTheme();

  const dotColor =
    state === "ready"
      ? colors.success
      : state === "denied"
        ? colors.error
        : state === "checking"
          ? colors.accent
          : colors.textTertiary;

  const label = compact
    ? state === "checking"
      ? "Checking…"
      : state === "denied"
        ? "Mic blocked"
        : state === "ready"
          ? typeof liveRmsDb === "number"
            ? `${Math.round(liveRmsDb)} dB`
            : "Mic ✓"
          : "Check mic"
    : state === "checking"
      ? "Checking microphone…"
      : state === "denied"
        ? "Mic blocked — check OS settings"
        : state === "ready"
          ? typeof liveRmsDb === "number"
            ? `${Math.round(liveRmsDb)} dB`
            : "Mic ready"
          : "Tap to check microphone";

  const isPressable = state === "unknown" || state === "denied";
  const labelColor = state === "denied" ? colors.error : colors.textSecondary;
  const borderColor = state === "denied" ? colors.error : colors.borderSubtle;
  const rowStyle = compact ? styles.rowCompact : styles.row;
  const labelStyle = compact ? styles.labelCompact : styles.label;

  if (isPressable) {
    return (
      <Pressable
        onPress={onCheck}
        style={[rowStyle, { borderColor, backgroundColor: colors.bgSurface }]}
        accessibilityRole="button"
        accessibilityLabel={
          state === "denied"
            ? "Microphone blocked, tap to retry"
            : "Tap to check microphone"
        }
      >
        <View style={[styles.dot, { backgroundColor: dotColor }]} />
        <Text style={[labelStyle, { color: labelColor, fontFamily: Fonts.body }]}>
          {label}
        </Text>
      </Pressable>
    );
  }

  return (
    <View
      style={[rowStyle, { borderColor: colors.borderSubtle, backgroundColor: colors.bgSurface }]}
      accessibilityLabel={`Microphone ${state}`}
    >
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <Text style={[labelStyle, { color: colors.textSecondary, fontFamily: Fonts.body }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.sm,
    borderWidth: 1,
    minHeight: 36,
  },
  rowCompact: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing["2xs"],
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing["3xs"],
    borderRadius: Radii.sm,
    borderWidth: 1,
    minHeight: 24,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: {
    fontSize: Typography.sm.size,
    lineHeight: Typography.sm.lineHeight,
  },
  labelCompact: {
    fontSize: Typography.xs.size,
    lineHeight: Typography.xs.lineHeight,
  },
});
