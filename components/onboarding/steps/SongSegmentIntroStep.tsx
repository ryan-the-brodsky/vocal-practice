import { StyleSheet, Text, View } from "react-native";

import { Fonts, Radii, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

// A stylized depiction of one song carved into drillable segments — the first
// is "active" to suggest practicing a single segment on its own.
const SEGMENTS = [
  { label: "Verse", dots: 4, active: true },
  { label: "Pre-chorus", dots: 3, active: false },
  { label: "Chorus", dots: 5, active: false },
];

export default function SongSegmentIntroStep() {
  const { colors } = useTheme();
  return (
    <View style={s.wrap}>
      <View style={s.intro}>
        <Text style={[s.eyebrow, { color: colors.textTertiary, fontFamily: Fonts.bodyMedium }]}>FOR WHOLE SONGS</Text>
        <Text style={[s.headline, { color: colors.textPrimary, fontFamily: Fonts.display }]}>Break a song into segments.</Text>
      </View>

      <View style={[s.stage, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle }]}>
        <View style={s.segmentRow}>
          {SEGMENTS.map((seg, i) => (
            <View key={seg.label} style={s.segmentSlot}>
              <View
                style={[
                  s.segment,
                  {
                    backgroundColor: seg.active ? colors.accentMuted : colors.bgCanvas,
                    borderColor: seg.active ? colors.accent : colors.borderSubtle,
                  },
                ]}
              >
                <View style={s.dots}>
                  {Array.from({ length: seg.dots }).map((_, d) => (
                    <View
                      key={d}
                      style={[s.dot, { backgroundColor: seg.active ? colors.accent : colors.textTertiary }]}
                    />
                  ))}
                </View>
              </View>
              <Text
                style={[
                  s.segmentLabel,
                  { color: seg.active ? colors.accent : colors.textTertiary, fontFamily: Fonts.bodyMedium },
                ]}
                numberOfLines={1}
              >
                {seg.label}
              </Text>
              {i < SEGMENTS.length - 1 && <View style={[s.scissor, { backgroundColor: colors.borderStrong }]} />}
            </View>
          ))}
        </View>
      </View>

      <Text style={[s.body, { color: colors.textSecondary, fontFamily: Fonts.body }]}>
        Import a full song, then carve it into short segments — a phrase, a verse, the bridge. Drill
        each one until it's solid, then put the whole thing together.
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, justifyContent: "center", gap: Spacing.lg },
  intro: { gap: Spacing.xs },
  eyebrow: { fontSize: Typography.xs.size, lineHeight: Typography.xs.lineHeight, letterSpacing: 1, textTransform: "uppercase" },
  headline: { fontSize: Typography.xl.size, lineHeight: Typography.xl.lineHeight },
  body: { fontSize: Typography.base.size, lineHeight: Typography.base.lineHeight },
  stage: { borderWidth: 1, borderRadius: Radii.lg, padding: Spacing.md },
  segmentRow: { flexDirection: "row", alignItems: "flex-start" },
  segmentSlot: { flex: 1, alignItems: "center", position: "relative" },
  segment: {
    width: "100%",
    height: 56,
    borderWidth: 1,
    borderRadius: Radii.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xs,
  },
  dots: { flexDirection: "row", alignItems: "center", gap: Spacing["2xs"], flexWrap: "wrap", justifyContent: "center" },
  dot: { width: 7, height: 7, borderRadius: Radii.pill },
  segmentLabel: { fontSize: Typography.xs.size, lineHeight: Typography.xs.lineHeight, marginTop: Spacing.xs },
  // Subtle gap marker between segments (the "cut").
  scissor: { position: "absolute", right: -1, top: 0, width: 2, height: 56, borderRadius: Radii.pill },
});
