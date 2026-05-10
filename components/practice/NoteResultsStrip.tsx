import { Fonts, Radii, Spacing, Typography } from "@/constants/theme";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/hooks/use-theme";
import type { NoteScore } from "@/lib/scoring/types";

interface NoteResultsStripProps {
  notes: NoteScore[];
  syllables: string[];
  /** Optional left-side label, vertically centered against the median line. */
  tonic?: string;
  /** Optional smaller text under the tonic (e.g. "5/5 +2¢ avg"). */
  meta?: string;
}

// Visualization scale: how many pixels each cent of deviation shifts a chip
// vertically away from the median line. ±50¢ → ±25 px.
const PX_PER_CENT = 0.5;
// Cap the visual shift so a wildly off chip doesn't escape the strip area.
const MAX_SHIFT_PX = 30;
const STRIP_HEIGHT = 96; // chip (~36) + 2 × MAX_SHIFT_PX + a touch of padding

function signed(n: number): string {
  const r = Math.round(n);
  if (r > 0) return `+${r}`;
  if (r < 0) return `−${Math.abs(r)}`;
  return "0";
}

// Map cents → vertical pixel offset from strip center. Positive cents (sharp) shifts up.
function shiftFor(cents: number): number {
  const raw = -cents * PX_PER_CENT;
  return Math.max(-MAX_SHIFT_PX, Math.min(MAX_SHIFT_PX, raw));
}

export default function NoteResultsStrip({ notes, syllables, tonic, meta }: NoteResultsStripProps) {
  const { colors } = useTheme();
  if (notes.length === 0) return null;

  return (
    <View style={styles.row}>
      {tonic && (
        <View style={styles.leftLabel}>
          <Text style={[styles.tonicText, { color: colors.textPrimary, fontFamily: Fonts.display }]}>
            {tonic}
          </Text>
          {meta && <Text style={[styles.metaText, { color: colors.textSecondary, fontFamily: Fonts.body }]}>{meta}</Text>}
        </View>
      )}
      <View style={styles.stripArea}>
        <View style={[styles.medianLine, { backgroundColor: colors.borderStrong }]} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.scroll}
          contentContainerStyle={styles.chips}
        >
          {notes.map((note, i) => {
            const hasData = note.framesAboveClarity > 0;
            const cents = hasData ? note.meanCentsDeviation : 0;
            const abs = hasData ? Math.abs(cents) : null;
            // success/warning/error color coding
            const bg =
              abs == null       ? colors.bgSurface
              : abs <= 50       ? colors.success + "22"
              : abs <= 100      ? colors.warning + "22"
              :                   colors.error + "22";
            const textColor =
              abs == null       ? colors.textTertiary
              : abs <= 50       ? colors.success
              : abs <= 100      ? colors.warning
              :                   colors.error;
            const syllable = syllables[i] ?? "";
            const dy = hasData ? shiftFor(cents) : 0;
            return (
              <View
                key={i}
                style={[styles.chip, { backgroundColor: bg, transform: [{ translateY: dy }] }]}
              >
                <Text style={[styles.syllable, { color: colors.textPrimary, fontFamily: Fonts.bodySemibold }]}>
                  {syllable}
                </Text>
                <Text style={[styles.cents, { color: textColor, fontFamily: Fonts.mono }]}>
                  {hasData ? `${signed(note.meanCentsDeviation)}¢` : "—"}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "stretch",
    minHeight: STRIP_HEIGHT,
  },
  leftLabel: {
    width: 56,
    justifyContent: "center",
    alignItems: "flex-start",
    paddingRight: Spacing.xs,
  },
  tonicText: {
    fontSize: Typography.md.size,
    lineHeight: Typography.md.lineHeight,
  },
  metaText: {
    fontSize: Typography.xs.size,
    lineHeight: Typography.xs.lineHeight,
    marginTop: Spacing["3xs"],
  },
  stripArea: {
    flex: 1,
    height: STRIP_HEIGHT,
    justifyContent: "center",
    position: "relative",
  },
  medianLine: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "50%",
    height: 2,
    transform: [{ translateY: -1 }],
  },
  scroll: { flexGrow: 0 },
  chips: {
    flexDirection: "row",
    flexWrap: "nowrap",
    gap: Spacing.xs,
    alignItems: "center",
    minHeight: STRIP_HEIGHT,
  },
  chip: {
    alignItems: "center",
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radii.md,
    minWidth: 44,
  },
  syllable: {
    fontSize: Typography.sm.size,
    lineHeight: Typography.sm.lineHeight,
  },
  cents: {
    fontSize: Typography.xs.size,
    lineHeight: Typography.xs.lineHeight,
    marginTop: Spacing["3xs"],
  },
});
