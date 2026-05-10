import { Fonts, Radii, Spacing, Typography } from "@/constants/theme";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/hooks/use-theme";
import { toneColor } from "./tone-utils";
import type { Tone } from "./types";

export default function TuningMeter({
  cents,
  pegged,
  tone,
}: {
  cents: number | null;
  pegged: boolean;
  tone: Tone;
}) {
  const { colors, scheme } = useTheme();
  const max = 100;
  const hasReading = cents !== null;
  const clamped = hasReading ? Math.max(-max, Math.min(max, cents!)) : 0;
  const leftPct = ((clamped + max) / (2 * max)) * 100;
  const dotColor = toneColor(tone, scheme);

  return (
    <View style={styles.meterWrap}>
      <View style={[styles.meterTrack, { backgroundColor: colors.bgSurface }]}>
        <View style={[styles.meterOkZone, { backgroundColor: colors.success + "22" }]} />
        <View style={[styles.meterCenterTick, { backgroundColor: colors.success }]} />
        {hasReading && (
          <View
            style={[
              styles.meterDot,
              {
                left: `${leftPct}%`,
                backgroundColor: dotColor,
                borderColor: pegged ? colors.error : "transparent",
              },
            ]}
          />
        )}
      </View>
      <View style={styles.meterScale}>
        <Text style={[styles.meterScaleLabel, { color: colors.textTertiary }]}>flat</Text>
        <Text style={[styles.meterScaleLabel, { color: colors.textTertiary }]}>in tune</Text>
        <Text style={[styles.meterScaleLabel, { color: colors.textTertiary }]}>sharp</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  meterWrap: { gap: Spacing["2xs"] },
  meterTrack: {
    height: 14,
    borderRadius: Radii.sm,
    position: "relative",
    overflow: "visible",
  },
  meterOkZone: {
    position: "absolute",
    left: "35%",
    width: "30%",
    top: 0,
    bottom: 0,
    borderRadius: Radii.sm,
  },
  meterCenterTick: {
    position: "absolute",
    left: "50%",
    width: 2,
    marginLeft: -1,
    top: -2,
    bottom: -2,
  },
  meterDot: {
    position: "absolute",
    top: -3,
    width: 20,
    height: 20,
    borderRadius: Radii.pill,
    marginLeft: -10,
    borderWidth: 2,
  },
  meterScale: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: Spacing["3xs"],
  },
  meterScaleLabel: {
    fontSize: Typography.xs.size,
    lineHeight: Typography.xs.lineHeight,
    fontFamily: Fonts.body,
  },
});
