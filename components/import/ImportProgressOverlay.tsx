import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/hooks/use-theme";
import { Spacing, Radii, Typography, Fonts } from "@/constants/theme";

export default function ImportProgressOverlay({
  message,
}: {
  message?: string;
}) {
  const { colors } = useTheme();

  return (
    <View style={[styles.overlay, { backgroundColor: colors.bgEmphasis + "d9" }]}>
      <View style={[styles.card, { backgroundColor: colors.bgEmphasis, borderRadius: Radii.lg, borderWidth: 1, borderColor: colors.borderOnEmphasis, padding: Spacing.lg, gap: Spacing.sm }]}>
        <ActivityIndicator size="large" color={colors.accentOnEmphasis} />
        <Text style={{ fontSize: Typography.base.size, lineHeight: Typography.base.lineHeight, fontFamily: Fonts.bodyMedium, color: colors.textOnEmphasis, textAlign: "center" }}>
          {message ?? "Analyzing recording…"}
        </Text>
        <Text style={{ fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight, fontFamily: Fonts.body, color: colors.textOnEmphasisDim, textAlign: "center" }}>
          Detecting pitch, segmenting notes, and snapping to your key.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
  },
  card: {
    alignItems: "center",
    minWidth: 240,
  },
});
