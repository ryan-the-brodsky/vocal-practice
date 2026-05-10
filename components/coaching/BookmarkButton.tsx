import { Pressable, Text } from "react-native";

import { useTheme } from "@/hooks/use-theme";
import { Fonts, Radii, Spacing, Typography } from "@/constants/theme";

export interface BookmarkButtonProps {
  saved: boolean;
  onSave: () => void;
  onUnsave?: () => void;
  label?: string;
}

export default function BookmarkButton({ saved, onSave, onUnsave, label }: BookmarkButtonProps) {
  const { colors } = useTheme();

  const handlePress = () => {
    if (saved) onUnsave?.();
    else onSave();
  };
  const fallbackLabel = saved ? "Saved" : "Bookmark";

  return (
    <Pressable
      onPress={handlePress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: Spacing.xs,
        // minHeight 44 for touch target
        minHeight: 44,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: Radii.md,
        borderWidth: 1,
        borderColor: saved ? colors.accent : colors.borderStrong,
        backgroundColor: saved ? colors.accentMuted : colors.bgSurface,
      }}
      accessibilityRole="button"
      accessibilityLabel={saved ? "Remove bookmark" : "Bookmark this tip"}
    >
      <Text
        style={{
          fontSize: Typography.base.size,
          lineHeight: Typography.base.lineHeight,
          fontFamily: Fonts.body,
          color: saved ? colors.accent : colors.textTertiary,
        }}
      >
        {saved ? "★" : "☆"}
      </Text>
      <Text
        style={{
          fontSize: Typography.base.size,
          lineHeight: Typography.base.lineHeight,
          fontFamily: Fonts.bodyMedium,
          color: saved ? colors.accent : colors.textPrimary,
        }}
      >
        {label ?? fallbackLabel}
      </Text>
    </Pressable>
  );
}
