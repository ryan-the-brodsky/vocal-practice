import { Pressable, StyleSheet, Text, View } from "react-native";

import { Fonts, Radii, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import type { VoicePart } from "@/lib/exercises/types";

// High-to-low, matching the Practice voice picker's VOICE_PARTS order.
const PARTS: { part: VoicePart; hint: string }[] = [
  { part: "soprano", hint: "Highest range" },
  { part: "alto", hint: "Upper-middle range" },
  { part: "tenor", hint: "Lower-middle range" },
  { part: "baritone", hint: "Lowest range" },
];

interface Props {
  value: VoicePart;
  onChange: (part: VoicePart) => void;
}

export default function VoiceStep({ value, onChange }: Props) {
  const { colors } = useTheme();
  return (
    <View style={s.wrap}>
      <View style={s.intro}>
        <Text style={[s.eyebrow, { color: colors.textTertiary, fontFamily: Fonts.bodyMedium }]}>YOUR VOICE</Text>
        <Text style={[s.headline, { color: colors.textPrimary, fontFamily: Fonts.display }]}>What's your range?</Text>
        <Text style={[s.body, { color: colors.textSecondary, fontFamily: Fonts.body }]}>
          This sets the key each exercise starts in. Not sure? Pick the closest — you can change it
          anytime on the Practice screen.
        </Text>
      </View>

      <View style={s.list}>
        {PARTS.map(({ part, hint }) => {
          const active = value === part;
          return (
            <Pressable
              key={part}
              onPress={() => onChange(part)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${part}, ${hint}`}
              style={[
                s.row,
                {
                  backgroundColor: active ? colors.accentMuted : colors.bgSurface,
                  borderColor: active ? colors.accent : colors.borderSubtle,
                },
              ]}
            >
              <Text style={[s.partName, { color: active ? colors.accent : colors.textPrimary, fontFamily: Fonts.displayMedium }]}>
                {part}
              </Text>
              <Text style={[s.partHint, { color: active ? colors.accent : colors.textTertiary, fontFamily: Fonts.body }]}>
                {hint}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, justifyContent: "center", gap: Spacing.lg },
  intro: { gap: Spacing.xs },
  eyebrow: { fontSize: Typography.xs.size, lineHeight: Typography.xs.lineHeight, letterSpacing: 1, textTransform: "uppercase" },
  headline: { fontSize: Typography.xl.size, lineHeight: Typography.xl.lineHeight },
  body: { fontSize: Typography.base.size, lineHeight: Typography.base.lineHeight },
  list: { gap: Spacing.xs },
  row: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 44,
  },
  partName: { fontSize: Typography.lg.size, lineHeight: Typography.lg.lineHeight, textTransform: "capitalize" },
  partHint: { fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight },
});
