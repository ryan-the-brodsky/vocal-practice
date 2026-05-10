import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import SavedTipsList from "@/components/coaching/SavedTipsList";
import { useTheme } from "@/hooks/use-theme";
import { Fonts, Radii, Spacing, Typography } from "@/constants/theme";

export default function CoachingSavedScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <View
        style={{
          paddingTop: Spacing["2xl"],
          paddingHorizontal: Spacing.lg,
          paddingBottom: Spacing.sm,
          gap: Spacing.xs,
          backgroundColor: colors.bgSurface,
          borderBottomWidth: 1,
          borderBottomColor: colors.borderSubtle,
        }}
      >
        {/* Back button — minHeight 44 touch target */}
        <Pressable
          onPress={() => router.back()}
          style={{ alignSelf: "flex-start", minHeight: 44, justifyContent: "center", paddingRight: Spacing.sm }}
          accessibilityLabel="Back"
          accessibilityRole="button"
        >
          <Text
            style={{
              fontSize: Typography.sm.size,
              lineHeight: Typography.sm.lineHeight,
              fontFamily: Fonts.bodyMedium,
              color: colors.accent,
            }}
          >
            ← Back
          </Text>
        </Pressable>
        <Text
          style={{
            fontSize: Typography.lg.size,
            lineHeight: Typography.lg.lineHeight,
            fontFamily: Fonts.display,
            color: colors.textPrimary,
          }}
        >
          Saved coaching tips
        </Text>
      </View>
      <SavedTipsList />
    </View>
  );
}
