import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Fonts, Radii, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { routineBuiltinItems } from "@/lib/exercises/library";

const ITEMS = routineBuiltinItems();

interface Props {
  selectedIds: string[];
  onToggle: (id: string) => void;
}

export default function RoutineStep({ selectedIds, onToggle }: Props) {
  const { colors } = useTheme();
  const count = selectedIds.length;

  return (
    <View style={s.wrap}>
      <View style={s.intro}>
        <Text style={[s.eyebrow, { color: colors.textTertiary, fontFamily: Fonts.bodyMedium }]}>YOUR ROUTINE</Text>
        <Text style={[s.headline, { color: colors.textPrimary, fontFamily: Fonts.display }]}>Pick your warmups.</Text>
        <Text style={[s.body, { color: colors.textSecondary, fontFamily: Fonts.body }]}>
          These show up as today's routine on the Practice screen. We've picked a balanced starter set —
          keep it or tweak it. {count === 0 ? "Pick at least one" : count === 1 ? "1 selected" : `${count} selected`}.
        </Text>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {ITEMS.map((it) => {
          const checked = selectedIds.includes(it.id);
          return (
            <Pressable
              key={it.id}
              onPress={() => onToggle(it.id)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked }}
              accessibilityLabel={it.label}
              style={[
                s.row,
                {
                  backgroundColor: checked ? colors.accentMuted : colors.bgSurface,
                  borderColor: checked ? colors.accent : colors.borderSubtle,
                },
              ]}
            >
              <View
                style={[
                  s.checkbox,
                  { borderColor: checked ? colors.accent : colors.borderStrong },
                  checked && { backgroundColor: colors.accent },
                ]}
              >
                {checked && (
                  <Text style={[s.checkmark, { color: colors.canvas, fontFamily: Fonts.bodySemibold }]}>✓</Text>
                )}
              </View>
              <Text
                style={[
                  s.label,
                  { color: checked ? colors.textPrimary : colors.textSecondary, fontFamily: checked ? Fonts.bodySemibold : Fonts.body },
                ]}
              >
                {it.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, paddingVertical: Spacing.lg, gap: Spacing.md },
  intro: { gap: Spacing.xs },
  eyebrow: { fontSize: Typography.xs.size, lineHeight: Typography.xs.lineHeight, letterSpacing: 1, textTransform: "uppercase" },
  headline: { fontSize: Typography.xl.size, lineHeight: Typography.xl.lineHeight },
  body: { fontSize: Typography.base.size, lineHeight: Typography.base.lineHeight },
  scroll: { flexGrow: 0, flexShrink: 1 },
  scrollContent: { gap: Spacing.xs, paddingBottom: Spacing.xs },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    borderWidth: 1,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 44,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: Radii.sm,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmark: { fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight },
  label: { flex: 1, fontSize: Typography.base.size, lineHeight: Typography.base.lineHeight },
});
