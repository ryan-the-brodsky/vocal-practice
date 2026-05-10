import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import type { AdviceCard } from "@/lib/coaching";
import { useTheme } from "@/hooks/use-theme";
import { Fonts, Radii, Spacing, Typography } from "@/constants/theme";

export interface CauseCardProps {
  card: AdviceCard;
  defaultExpanded?: boolean;
}

export default function CauseCard({ card, defaultExpanded = false }: CauseCardProps) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <View
      style={{
        backgroundColor: colors.bgSurface,
        borderRadius: Radii.md,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        overflow: "hidden",
      }}
    >
      <Pressable
        onPress={() => setExpanded((v) => !v)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: Spacing.sm,
          paddingVertical: Spacing.sm,
          gap: Spacing.xs,
          // minHeight 44 touch target
          minHeight: 44,
        }}
        accessibilityRole="button"
        accessibilityLabel={expanded ? `Collapse ${card.title}` : `Expand ${card.title}`}
      >
        <Text
          style={{
            fontSize: Typography.monoSm.size,
            lineHeight: Typography.monoSm.lineHeight,
            fontFamily: Fonts.mono,
            color: colors.textTertiary,
          }}
        >
          {expanded ? "▼" : "▶"}
        </Text>
        <Text
          style={{
            fontSize: Typography.lg.size,
            lineHeight: Typography.lg.lineHeight,
            fontFamily: Fonts.display,
            color: colors.textPrimary,
            flex: 1,
          }}
        >
          {card.title}
        </Text>
      </Pressable>

      {expanded && (
        <View
          style={{
            paddingHorizontal: Spacing.sm,
            paddingBottom: Spacing.sm,
            paddingTop: Spacing.xs,
            gap: Spacing.sm,
            borderTopWidth: 1,
            borderTopColor: colors.borderSubtle,
          }}
        >
          {card.soundsLike && (
            <View style={{ gap: Spacing["3xs"] }}>
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
                What this sounds like
              </Text>
              <Text
                style={{
                  fontSize: Typography.base.size,
                  lineHeight: Typography.base.lineHeight,
                  fontFamily: Fonts.body,
                  color: colors.textPrimary,
                }}
              >
                {card.soundsLike}
              </Text>
            </View>
          )}

          {card.whyPitchSuffers && (
            <View style={{ gap: Spacing["3xs"] }}>
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
                Why pitch suffers
              </Text>
              <Text
                style={{
                  fontSize: Typography.base.size,
                  lineHeight: Typography.base.lineHeight,
                  fontFamily: Fonts.body,
                  color: colors.textPrimary,
                }}
              >
                {card.whyPitchSuffers}
              </Text>
            </View>
          )}

          <View style={{ gap: Spacing["3xs"] }}>
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
              Try this
            </Text>
            <Text
              style={{
                fontSize: Typography.base.size,
                lineHeight: Typography.base.lineHeight,
                fontFamily: Fonts.bodySemibold,
                color: colors.textPrimary,
              }}
            >
              {card.fixTip}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
