import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import type { SavedCoaching } from "@/lib/coaching";
import CauseCard from "./CauseCard";
import { useTheme } from "@/hooks/use-theme";
import { Fonts, Radii, Spacing, Typography } from "@/constants/theme";

export interface SavedTipRowProps {
  record: SavedCoaching;
  onDelete: (id: string) => void;
}

function fmtDate(epochMs: number): string {
  return new Date(epochMs).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function SavedTipRow({ record, onDelete }: SavedTipRowProps) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const headline =
    record.symptomCard?.title ?? record.diagnosis.evidenceText ?? "Coaching tip";
  const subtitle = record.exerciseName ?? (record.exerciseId ? "Imported melody" : "General tip");

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
        accessibilityLabel={expanded ? `Collapse ${headline}` : `Expand ${headline}`}
      >
        <View style={{ flex: 1, gap: Spacing["3xs"] }}>
          <Text
            style={{
              fontSize: Typography.sm.size,
              lineHeight: Typography.sm.lineHeight,
              fontFamily: Fonts.body,
              color: colors.textTertiary,
            }}
          >
            {fmtDate(record.savedAt)}  ·  {subtitle}
          </Text>
          <Text
            style={{
              fontSize: Typography.lg.size,
              lineHeight: Typography.lg.lineHeight,
              fontFamily: Fonts.display,
              color: colors.textPrimary,
            }}
          >
            {headline}
          </Text>
        </View>
        <Text
          style={{
            fontSize: Typography.monoSm.size,
            lineHeight: Typography.monoSm.lineHeight,
            fontFamily: Fonts.mono,
            color: colors.textTertiary,
          }}
        >
          {expanded ? "▲" : "▼"}
        </Text>
      </Pressable>

      {expanded && (
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: colors.borderSubtle,
            padding: Spacing.sm,
            gap: Spacing.sm,
          }}
        >
          <Text
            style={{
              fontSize: Typography.base.size,
              lineHeight: Typography.base.lineHeight,
              fontFamily: Fonts.body,
              color: colors.textSecondary,
            }}
          >
            {record.diagnosis.evidenceText}
          </Text>

          {record.symptomCard?.soundsLike && (
            <View style={{ gap: Spacing["2xs"] }}>
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
                {record.symptomCard.soundsLike}
              </Text>
            </View>
          )}

          {record.causeCards.length > 0 && (
            <View style={{ gap: Spacing["2xs"] }}>
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
                Likely causes
              </Text>
              <View style={{ gap: Spacing.xs }}>
                {record.causeCards.map((c) => (
                  <CauseCard key={c.id} card={c} defaultExpanded />
                ))}
              </View>
            </View>
          )}

          <Pressable
            onPress={() => onDelete(record.id)}
            style={{
              alignSelf: "flex-end",
              minHeight: 44,
              backgroundColor: colors.accentMuted,
              borderRadius: Radii.sm,
              paddingHorizontal: Spacing.sm,
              paddingVertical: Spacing.xs,
              justifyContent: "center",
            }}
            accessibilityLabel="Delete saved tip"
          >
            <Text
              style={{
                fontSize: Typography.sm.size,
                lineHeight: Typography.sm.lineHeight,
                fontFamily: Fonts.bodyMedium,
                color: colors.error,
              }}
            >
              Delete
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
