import { StyleSheet, Text, View } from "react-native";
import type { MelodyGlaring } from "@/lib/analyze";
import { useTheme } from "@/hooks/use-theme";
import { Spacing, Radii, Typography, Fonts } from "@/constants/theme";

export default function GlaringHeadline({
  glaring,
  noteCount,
}: {
  glaring: MelodyGlaring | null;
  noteCount: number;
}) {
  const { colors } = useTheme();

  if (noteCount === 0) {
    return (
      <View style={[styles.banner, { borderColor: colors.borderStrong, backgroundColor: colors.bgSurface }]}>
        <Text style={{ color: colors.textSecondary, fontSize: Typography.base.size, lineHeight: Typography.base.lineHeight, fontFamily: Fonts.body, textAlign: "center" }}>
          No singing detected — verify the recording is a clean vocal stem.
        </Text>
      </View>
    );
  }
  if (!glaring) {
    return (
      <View style={[styles.banner, { borderColor: colors.success, backgroundColor: colors.bgSurface }]}>
        <Text style={{ color: colors.success, fontSize: Typography.base.size, lineHeight: Typography.base.lineHeight, fontFamily: Fonts.bodySemibold, textAlign: "center" }}>
          Nicely in tune across the melody.
        </Text>
      </View>
    );
  }
  const isConsistent = glaring.kind === "consistent";
  return (
    <View style={[styles.banner, { borderColor: isConsistent ? colors.warning : colors.accent, backgroundColor: colors.bgSurface }]}>
      <Text style={{ color: isConsistent ? colors.warning : colors.accent, fontSize: Typography.xl.size, lineHeight: Typography.xl.lineHeight, fontFamily: Fonts.display, textAlign: "center" }}>
        {glaring.summary}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: Radii.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 2,
  },
});
