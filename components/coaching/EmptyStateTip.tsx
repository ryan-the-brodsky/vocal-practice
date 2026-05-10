import { Text, View } from "react-native";

import type { AdviceCard } from "@/lib/coaching";
import BookmarkButton from "./BookmarkButton";
import { useTheme } from "@/hooks/use-theme";
import { Fonts, Radii, Spacing, Typography } from "@/constants/theme";

export interface EmptyStateTipProps {
  tip: AdviceCard;
  saved?: boolean;
  onSave?: () => void;
  onUnsave?: () => void;
  // When set, replaces the default congrats line — used when the engine can't run
  // (e.g. session has too few clarity-passed notes).
  message?: string;
}

export default function EmptyStateTip({
  tip,
  saved = false,
  onSave,
  onUnsave,
  message,
}: EmptyStateTipProps) {
  const { colors } = useTheme();

  return (
    <View style={{ gap: Spacing.md }}>
      <Text
        style={{
          fontSize: Typography.xl.size,
          lineHeight: Typography.xl.lineHeight,
          fontFamily: Fonts.display,
          color: colors.textPrimary,
        }}
      >
        {message ?? "Solid session — no consistent issues found"}
      </Text>

      <Text
        style={{
          fontSize: Typography.xs.size,
          lineHeight: Typography.xs.lineHeight,
          fontFamily: Fonts.bodyMedium,
          color: colors.textTertiary,
          textTransform: "uppercase",
          letterSpacing: 0.6,
        }}
      >
        Today's tip
      </Text>

      <View
        style={{
          backgroundColor: colors.bgSurface,
          borderRadius: Radii.lg,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
          padding: Spacing.md,
          gap: Spacing.xs,
        }}
      >
        <Text
          style={{
            fontSize: Typography.md.size,
            lineHeight: Typography.md.lineHeight,
            fontFamily: Fonts.display,
            color: colors.textPrimary,
          }}
        >
          {tip.title}
        </Text>
        <Text
          style={{
            fontSize: Typography.md.size,
            lineHeight: Typography.md.lineHeight,
            fontFamily: Fonts.body,
            color: colors.textPrimary,
          }}
        >
          {tip.fixTip}
        </Text>
      </View>

      {onSave && (
        <BookmarkButton
          saved={saved}
          onSave={onSave}
          onUnsave={onUnsave}
          label={saved ? "Saved" : "Save tip"}
        />
      )}
    </View>
  );
}
