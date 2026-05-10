import { Fonts, Radii, Spacing, Typography } from "@/constants/theme";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/hooks/use-theme";
import { toneColor } from "./tone-utils";
import TuningMeter from "./TuningMeter";
import type { Coaching } from "./types";

export default function CoachingBanner({ coaching }: { coaching: Coaching }) {
  const { colors, scheme } = useTheme();
  const color = toneColor(coaching.tone, scheme);
  return (
    <View style={[styles.banner, { backgroundColor: colors.bgSurface, borderColor: color }]}>
      <Text style={[styles.text, { color }]}>{coaching.text}</Text>
      <TuningMeter cents={coaching.cents} pegged={coaching.pegged} tone={coaching.tone} />
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: Radii.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderWidth: 2,
    gap: Spacing.sm,
  },
  text: {
    fontSize: Typography.lg.size,
    lineHeight: Typography.lg.lineHeight,
    fontFamily: Fonts.bodySemibold,
    textAlign: "center",
  },
});
