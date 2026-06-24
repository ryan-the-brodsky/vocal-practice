import type { ReactNode } from "react";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

import { Fonts, Motion, Radii, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const CONTENT_MAX_WIDTH = 560;

interface Props {
  step: number;
  stepCount: number;
  onSkip: () => void;
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  footnote?: string;
  children: ReactNode;
}

// Shared chrome for every onboarding step: progress dots + always-visible
// "Skip to singing" + a Back/Next footer. The step body is the only thing
// that changes between steps.
export default function OnboardingScaffold({
  step,
  stepCount,
  onSkip,
  onBack,
  onNext,
  nextLabel = "Next",
  footnote,
  children,
}: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();

  // Entrance per DESIGN.md: opacity 0→1 + translateY 8→0 over 200ms on each step.
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);
  useEffect(() => {
    if (reduced) {
      opacity.value = 1;
      translateY.value = 0;
      return;
    }
    opacity.value = 0;
    translateY.value = 8;
    opacity.value = withTiming(1, { duration: Motion.duration.short, easing: Easing.bezier(0.2, 0, 0, 1) });
    translateY.value = withTiming(0, { duration: Motion.duration.short, easing: Easing.bezier(0.2, 0, 0, 1) });
  }, [step, reduced, opacity, translateY]);
  const bodyAnim = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View style={[s.root, { backgroundColor: colors.canvas, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={s.header}>
        <View
          style={s.dots}
          accessibilityRole="progressbar"
          accessibilityLabel={`Step ${step + 1} of ${stepCount}`}
        >
          {Array.from({ length: stepCount }).map((_, i) => (
            <View
              key={i}
              style={[
                s.dot,
                i === step
                  ? { backgroundColor: colors.accent, width: Spacing.lg }
                  : { backgroundColor: i < step ? colors.accentMuted : colors.borderStrong },
              ]}
            />
          ))}
        </View>
        <Pressable
          onPress={onSkip}
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding and go straight to singing"
          hitSlop={8}
          style={({ pressed }) => [
            s.skip,
            { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={[s.skipText, { color: colors.textSecondary, fontFamily: Fonts.bodyMedium }]}>
            Skip to singing
          </Text>
        </Pressable>
      </View>

      <View style={s.body}>
        <Animated.View style={[s.bodyInner, bodyAnim]}>{children}</Animated.View>
      </View>

      {footnote ? (
        <Text style={[s.footnote, { color: colors.textTertiary, fontFamily: Fonts.body }]}>{footnote}</Text>
      ) : null}

      <View style={s.footer}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Go back to the previous step"
            hitSlop={8}
            style={({ pressed }) => [s.backBtn, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Text style={[s.backText, { color: colors.textSecondary, fontFamily: Fonts.bodyMedium }]}>Back</Text>
          </Pressable>
        ) : (
          <View />
        )}
        <Pressable
          onPress={onNext}
          accessibilityRole="button"
          accessibilityLabel={nextLabel}
          style={({ pressed }) => [s.nextBtn, { backgroundColor: colors.accent, opacity: pressed ? 0.85 : 1 }]}
        >
          <Text style={[s.nextText, { color: colors.canvas, fontFamily: Fonts.bodySemibold }]}>{nextLabel}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
    gap: Spacing.sm,
    // Keep the chrome aligned with the centered body column on wide screens
    // (no-op on phones, where the screen is narrower than the cap).
    width: "100%",
    maxWidth: CONTENT_MAX_WIDTH + Spacing.lg * 2,
    alignSelf: "center",
  },
  dots: { flexDirection: "row", alignItems: "center", gap: Spacing["2xs"] },
  dot: { width: Spacing.xs, height: Spacing.xs, borderRadius: Radii.pill },
  skip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.pill,
    borderWidth: 1,
    minHeight: 36,
    justifyContent: "center",
  },
  skipText: { fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight },
  body: { flex: 1, paddingHorizontal: Spacing.lg },
  bodyInner: { flex: 1, width: "100%", maxWidth: CONTENT_MAX_WIDTH, alignSelf: "center" },
  footnote: {
    width: "100%",
    maxWidth: CONTENT_MAX_WIDTH + Spacing.lg * 2,
    alignSelf: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xs,
    fontSize: Typography.sm.size,
    lineHeight: Typography.sm.lineHeight,
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    width: "100%",
    maxWidth: CONTENT_MAX_WIDTH + Spacing.lg * 2,
    alignSelf: "center",
  },
  backBtn: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.sm, minHeight: 44, justifyContent: "center" },
  backText: { fontSize: Typography.base.size, lineHeight: Typography.base.lineHeight },
  nextBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: Radii.md,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  nextText: { fontSize: Typography.base.size, lineHeight: Typography.base.lineHeight },
});
