import { StyleSheet, Text, View } from "react-native";

import { Fonts, Radii, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

// A stylized "your voice → notes on the staff" transform: a waveform resolving
// into noteheads. Token-built (no screenshot, no SVG) so it can't go stale, and
// it shows the actual magic — audio becoming notation — instead of listing steps.
const WAVE_BARS = [12, 24, 34, 18, 30, 14, 26]; // relative bar heights
const NOTE_DROP = [8, -8, 2, -5]; // translateY per notehead → a little melody contour

export default function ImportIntroStep() {
  const { colors } = useTheme();
  return (
    <View style={s.wrap}>
      <View style={s.intro}>
        <Text style={[s.eyebrow, { color: colors.textTertiary, fontFamily: Fonts.bodyMedium }]}>BRING YOUR OWN</Text>
        <Text style={[s.headline, { color: colors.textPrimary, fontFamily: Fonts.display }]}>Import any melody.</Text>
      </View>

      <View style={[s.stage, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle }]}>
        <View style={s.wave}>
          {WAVE_BARS.map((h, i) => (
            <View
              key={i}
              style={[s.bar, { height: h, backgroundColor: i === 2 || i === 4 ? colors.accent : colors.borderStrong }]}
            />
          ))}
        </View>
        <Text style={[s.arrow, { color: colors.textTertiary, fontFamily: Fonts.body }]}>→</Text>
        <View style={s.staff}>
          <View style={[s.staffLine, { backgroundColor: colors.borderSubtle }]} />
          <View style={s.notes}>
            {NOTE_DROP.map((dy, i) => (
              <View key={i} style={[s.note, { backgroundColor: colors.accent, transform: [{ translateY: dy }] }]} />
            ))}
          </View>
        </View>
      </View>

      <Text style={[s.body, { color: colors.textSecondary, fontFamily: Fonts.body }]}>
        Got a line from a song, or a phrase your coach gave you? Sing or upload it — we turn it into notes on the
        staff, and it joins your library as a scored exercise in your own range.
      </Text>

      <Text style={[s.foot, { color: colors.textTertiary, fontFamily: Fonts.body }]}>
        Find it anytime via the + on Practice or Progress.
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
  stage: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.lg,
    borderWidth: 1,
    borderRadius: Radii.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  wave: { flexDirection: "row", alignItems: "flex-end", gap: Spacing["3xs"], height: 36 },
  bar: { width: 4, borderRadius: Radii.pill },
  arrow: { fontSize: Typography.lg.size, lineHeight: Typography.lg.lineHeight },
  staff: { width: 116, height: 40, justifyContent: "center" },
  staffLine: { position: "absolute", left: 0, right: 0, height: 1.5, borderRadius: Radii.pill },
  notes: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.xs },
  note: { width: 12, height: 10, borderRadius: Radii.pill },
  foot: { fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight, fontStyle: "italic" },
});
