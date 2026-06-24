import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Fonts, Radii, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import MelodyDisplay, { type MelodyNote } from "@/components/practice/MelodyDisplay";
import { useDemoDriver, type DemoMode } from "@/components/onboarding/DemoPlayer";

// A short, recognizable do-re-mi-re-do shape — the demo never plays audio.
const DEMO_NOTES: MelodyNote[] = [
  { midi: 60, syllable: "mee" },
  { midi: 62, syllable: "may" },
  { midi: 64, syllable: "mah" },
  { midi: 62, syllable: "may" },
  { midi: 60, syllable: "mee" },
];

const COPY: Record<DemoMode, { label: string; caption: string }> = {
  standard: {
    label: "Standard",
    caption:
      "Sing the whole phrase in one go. When you finish, you'll see how each note landed — great for flow and musicality.",
  },
  guided: {
    label: "Guided",
    caption:
      "Take it one note at a time. Hold each until it's in tune, then it advances — great for nailing the tricky leaps.",
  },
};

export default function ModeIntroStep() {
  const { colors } = useTheme();
  const [mode, setMode] = useState<DemoMode>("standard");
  const frame = useDemoDriver(mode, DEMO_NOTES.length, true);

  return (
    <View style={s.wrap}>
      <View style={s.intro}>
        <Text style={[s.eyebrow, { color: colors.textTertiary, fontFamily: Fonts.bodyMedium }]}>TWO WAYS TO PRACTICE</Text>
        <Text style={[s.headline, { color: colors.textPrimary, fontFamily: Fonts.display }]}>Standard vs Guided.</Text>
      </View>

      <View style={[s.toggle, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle }]}>
        {(Object.keys(COPY) as DemoMode[]).map((m) => {
          const active = mode === m;
          return (
            <Pressable
              key={m}
              onPress={() => setMode(m)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${COPY[m].label} mode`}
              style={[s.toggleBtn, active && { backgroundColor: colors.accent }]}
            >
              <Text
                style={[
                  s.toggleText,
                  { color: active ? colors.canvas : colors.textSecondary, fontFamily: Fonts.bodyMedium },
                ]}
              >
                {COPY[m].label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={[s.stage, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle }]}>
        <MelodyDisplay
          notes={DEMO_NOTES}
          currentIndex={frame.currentIndex}
          noteProgress={frame.noteProgress}
          focusNoteIndex={frame.focusNoteIndex}
          tonicMidi={60}
          size="compact"
        />
      </View>

      <Text style={[s.caption, { color: colors.textSecondary, fontFamily: Fonts.body }]}>{COPY[mode].caption}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, justifyContent: "center", gap: Spacing.md },
  intro: { gap: Spacing.xs },
  eyebrow: { fontSize: Typography.xs.size, lineHeight: Typography.xs.lineHeight, letterSpacing: 1, textTransform: "uppercase" },
  headline: { fontSize: Typography.xl.size, lineHeight: Typography.xl.lineHeight },
  toggle: { flexDirection: "row", alignSelf: "flex-start", padding: Spacing["3xs"], borderRadius: Radii.pill, borderWidth: 1, gap: Spacing["3xs"] },
  toggleBtn: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xs, borderRadius: Radii.pill, minHeight: 36, justifyContent: "center" },
  toggleText: { fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight },
  stage: { borderWidth: 1, borderRadius: Radii.lg, paddingVertical: Spacing.md, paddingHorizontal: Spacing.xs, overflow: "hidden", justifyContent: "center" },
  caption: { fontSize: Typography.base.size, lineHeight: Typography.base.lineHeight, minHeight: Typography.base.lineHeight * 2 },
});
