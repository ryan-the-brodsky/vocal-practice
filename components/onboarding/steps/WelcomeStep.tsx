import { StyleSheet, Text, View } from "react-native";

import { Fonts, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export default function WelcomeStep() {
  const { colors } = useTheme();
  return (
    <View style={s.wrap}>
      <Text style={[s.eyebrow, { color: colors.textTertiary, fontFamily: Fonts.bodyMedium }]}>
        VOCAL TRAINING
      </Text>
      <Text style={[s.headline, { color: colors.textPrimary, fontFamily: Fonts.display }]}>
        A daily warmup, tuned to your voice.
      </Text>
      <Text style={[s.body, { color: colors.textSecondary, fontFamily: Fonts.body }]}>
        Two quick choices and you're singing. We'll set your voice range and pick your routine, then
        show you a couple of things you can do once you're warmed up. In a hurry? Skip to singing
        anytime — the button up top is always there.
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, justifyContent: "center", gap: Spacing.md },
  eyebrow: { fontSize: Typography.xs.size, lineHeight: Typography.xs.lineHeight, letterSpacing: 1, textTransform: "uppercase" },
  headline: { fontSize: Typography["2xl"].size, lineHeight: Typography["2xl"].lineHeight },
  body: { fontSize: Typography.md.size, lineHeight: Typography.md.lineHeight },
});
