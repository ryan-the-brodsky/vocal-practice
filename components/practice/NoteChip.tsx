import { Fonts, Radii, Spacing, Typography } from "@/constants/theme";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/hooks/use-theme";
import { formatDelta, noteChipTone, toneBackground, toneColor } from "./tone-utils";

export default function NoteChip({
  isCurrent,
  isFocus,
  noteName,
  framesAboveClarity,
  meanCentsDeviation,
}: {
  isCurrent: boolean;
  isFocus?: boolean;
  noteName: string;
  framesAboveClarity: number;
  meanCentsDeviation: number;
}) {
  const { colors, scheme } = useTheme();
  const scored = framesAboveClarity > 0;
  const tone = noteChipTone(scored, meanCentsDeviation);
  const bg = toneBackground(tone, scheme);
  // isCurrent gets accent border; isFocus gets success border; unscored chips are transparent.
  const border = isCurrent ? colors.accent : isFocus ? colors.success : "transparent";
  return (
    <View style={[styles.chip, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[styles.name, { color: colors.textPrimary }]}>{noteName}</Text>
      <Text style={[styles.meta, { color: toneColor(tone, scheme) }]}>
        {scored ? formatDelta(meanCentsDeviation) : "—"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.md,
    minWidth: 70,
    alignItems: "center",
    borderWidth: 2,
  },
  name: {
    fontFamily: Fonts.bodySemibold,
    fontSize: Typography.sm.size,
    lineHeight: Typography.sm.lineHeight,
  },
  meta: {
    fontFamily: Fonts.mono,
    fontSize: Typography.xs.size,
    lineHeight: Typography.xs.lineHeight,
    marginTop: Spacing["3xs"],
  },
});
