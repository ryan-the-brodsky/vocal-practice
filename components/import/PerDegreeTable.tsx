import { StyleSheet, Text, View } from "react-native";
import type { AnalysisMode, ScaleDegreeStats } from "@/lib/analyze";
import { useTheme } from "@/hooks/use-theme";
import { Spacing, Radii, Typography, Fonts } from "@/constants/theme";

function fmtSigned(n: number): string {
  const r = Math.round(n);
  return r >= 0 ? `+${r}¢` : `${r}¢`;
}

export default function PerDegreeTable({
  stats,
  // mode is informational; diatonicLabel already encodes mode-aware labels.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  mode,
}: {
  stats: ScaleDegreeStats[];
  mode: AnalysisMode;
}) {
  const { colors } = useTheme();

  if (stats.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={{ color: colors.textTertiary, fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight, fontFamily: Fonts.body, fontStyle: "italic" }}>
          No scale-degree data.
        </Text>
      </View>
    );
  }
  return (
    <View style={[styles.table, { borderRadius: Radii.md, borderColor: colors.borderSubtle, backgroundColor: colors.bgSurface }]}>
      <View style={[styles.row, styles.header, { backgroundColor: colors.canvas, borderBottomColor: colors.borderSubtle, paddingHorizontal: Spacing.xs, paddingVertical: Spacing.xs }]}>
        <Text style={[styles.cell, styles.degCell, { fontSize: Typography.xs.size, lineHeight: Typography.xs.lineHeight, fontFamily: Fonts.bodyMedium, color: colors.textTertiary, textTransform: "uppercase", letterSpacing: 0.5 }]}>
          Degree
        </Text>
        <Text style={[styles.cell, styles.numCell, { fontSize: Typography.xs.size, lineHeight: Typography.xs.lineHeight, fontFamily: Fonts.bodyMedium, color: colors.textTertiary, textTransform: "uppercase", letterSpacing: 0.5 }]}>
          Mean
        </Text>
        <Text style={[styles.cell, styles.numCell, { fontSize: Typography.xs.size, lineHeight: Typography.xs.lineHeight, fontFamily: Fonts.bodyMedium, color: colors.textTertiary, textTransform: "uppercase", letterSpacing: 0.5 }]}>
          Hit %
        </Text>
        <Text style={[styles.cell, styles.numCell, { fontSize: Typography.xs.size, lineHeight: Typography.xs.lineHeight, fontFamily: Fonts.bodyMedium, color: colors.textTertiary, textTransform: "uppercase", letterSpacing: 0.5 }]}>
          Count
        </Text>
      </View>
      {stats.map((s) => {
        const abs = Math.abs(s.meanCentsOff);
        const centsColor = abs <= 25 ? colors.success : abs <= 50 ? colors.warning : colors.error;
        return (
          <View key={s.scaleDegree} style={[styles.row, { borderBottomColor: colors.borderSubtle, paddingHorizontal: Spacing.xs, paddingVertical: Spacing.xs }]}>
            <Text style={[styles.cell, styles.degCell, { fontSize: Typography.lg.size, lineHeight: Typography.lg.lineHeight, fontFamily: Fonts.display, color: colors.textPrimary }]}>
              {s.diatonicLabel}
            </Text>
            <Text style={[styles.cell, styles.numCell, { fontSize: Typography.monoBase.size, lineHeight: Typography.monoBase.lineHeight, fontFamily: Fonts.mono, color: centsColor }]}>
              {fmtSigned(s.meanCentsOff)}
            </Text>
            <Text style={[styles.cell, styles.numCell, { fontSize: Typography.monoBase.size, lineHeight: Typography.monoBase.lineHeight, fontFamily: Fonts.mono, color: colors.textSecondary }]}>
              {Math.round(s.hitRatePct)}%
            </Text>
            <Text style={[styles.cell, styles.numCell, { fontSize: Typography.monoBase.size, lineHeight: Typography.monoBase.lineHeight, fontFamily: Fonts.mono, color: colors.textSecondary }]}>
              {s.occurrences}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
  },
  header: {},
  cell: {},
  degCell: { flex: 1.4, textAlign: "left" },
  numCell: { flex: 1, textAlign: "right", fontVariant: ["tabular-nums"] },
  empty: { paddingVertical: Spacing.sm, alignItems: "center" },
});
