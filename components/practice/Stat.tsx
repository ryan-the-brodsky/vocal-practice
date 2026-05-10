import { Fonts, Radii, Spacing, Typography } from "@/constants/theme";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/hooks/use-theme";
import { toneColor } from "./tone-utils";
import type { Tone } from "./types";

export default function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: Tone;
}) {
  const { colors, scheme } = useTheme();
  const valueColor = tone ? toneColor(tone, scheme) : colors.textPrimary;
  return (
    <View style={[styles.stat, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle }]}>
      <Text style={[styles.statLabel, { color: colors.textTertiary }]}>{label}</Text>
      <Text style={[styles.statValue, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stat: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.sm,
    borderRadius: Radii.md,
    borderWidth: 1,
  },
  statLabel: {
    fontSize: Typography.xs.size,
    lineHeight: Typography.xs.lineHeight,
    fontFamily: Fonts.body,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  statValue: {
    fontSize: Typography.lg.size,
    lineHeight: Typography.lg.lineHeight,
    fontFamily: Fonts.display,
    marginTop: Spacing["2xs"],
  },
});
