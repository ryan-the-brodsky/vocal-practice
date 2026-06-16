import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/use-theme";
import { Typography, Fonts, Spacing, Radii } from "@/constants/theme";

const WIDTH = 200;
const HEIGHT = 56;
const LINE_THICKNESS = 2;
const DOT = 4;
const RECENT_COUNT = 10;
// Don't let a near-flat series fill the whole chart with noise — floor the span.
const MIN_SPAN = 8;

export interface SparklinePoint {
  date: number; // ms epoch
  accuracy: number; // 0–100
}

interface Props {
  data: SparklinePoint[];
  avg: number; // 0–100, drawn as dashed horizontal
  // Optional override — pass colors.accent when used outside emphasis card.
  color?: string;
}

export default function Sparkline({ data, avg, color }: Props) {
  const { colors } = useTheme();
  // Default to accentOnEmphasis — sparkline lives in the emphasis weekly card.
  const lineColor = color ?? colors.accentOnEmphasis;
  const dashColor = colors.borderOnEmphasis;

  if (data.length < 2) {
    return (
      <View style={styles.noData}>
        <Text style={[styles.noDataText, { color: colors.textTertiary }]}>
          No trend yet
        </Text>
      </View>
    );
  }

  // Auto-scale the Y axis to the data range (with padding) so variation reads.
  const accs = data.map((d) => d.accuracy);
  let lo = Math.min(...accs);
  let hi = Math.max(...accs);
  if (hi - lo < MIN_SPAN) {
    const mid = (hi + lo) / 2;
    lo = mid - MIN_SPAN / 2;
    hi = mid + MIN_SPAN / 2;
  }
  const pad = (hi - lo) * 0.15;
  const yMin = Math.max(0, lo - pad);
  const yMax = Math.min(100, hi + pad);

  const toY = (accuracy: number): number => {
    const t = (accuracy - yMin) / (yMax - yMin);
    return HEIGHT - Math.max(0, Math.min(1, t)) * HEIGHT;
  };
  const toX = (index: number): number =>
    data.length <= 1 ? WIDTH / 2 : (index / (data.length - 1)) * WIDTH;

  const avgY = toY(avg);

  const segments: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 0; i < data.length - 1; i++) {
    segments.push({
      x1: toX(i),
      y1: toY(data[i].accuracy),
      x2: toX(i + 1),
      y2: toY(data[i + 1].accuracy),
    });
  }

  const dots = data.map((pt, i) => ({ x: toX(i), y: toY(pt.accuracy) }));

  // Last N sessions, oldest→newest (matches chart left→right).
  const recent = data.slice(-RECENT_COUNT);
  const accColor = (a: number) =>
    a >= 80 ? colors.success : a >= 60 ? colors.accent : colors.warning;

  return (
    <View style={styles.row}>
      <View style={[styles.axis, { height: HEIGHT }]}>
        <Text style={[styles.axisLabel, { color: colors.textTertiary }]}>
          {Math.round(yMax)}
        </Text>
        <Text style={[styles.axisLabel, { color: colors.textTertiary }]}>
          {Math.round(yMin)}
        </Text>
      </View>

      <View style={styles.chart}>
        {/* Dashed average line */}
        {Array.from({ length: 20 }, (_, i) => {
          const segWidth = WIDTH / 20;
          return (
            <View
              key={`dash-${i}`}
              style={[
                styles.avgDash,
                {
                  left: i * segWidth,
                  top: avgY - 0.5,
                  width: segWidth * 0.55,
                  backgroundColor: dashColor,
                },
              ]}
            />
          );
        })}

        {/* Line segments connecting data points */}
        {segments.map((seg, i) => {
          const dx = seg.x2 - seg.x1;
          const dy = seg.y2 - seg.y1;
          const length = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);
          const midX = (seg.x1 + seg.x2) / 2;
          const midY = (seg.y1 + seg.y2) / 2;
          return (
            <View
              key={`seg-${i}`}
              style={[
                styles.segment,
                {
                  width: length,
                  left: midX - length / 2,
                  top: midY - LINE_THICKNESS / 2,
                  transform: [{ rotate: `${angle}deg` }],
                  backgroundColor: lineColor,
                },
              ]}
            />
          );
        })}

        {/* Dot at each data point */}
        {dots.map((dot, i) => (
          <View
            key={`dot-${i}`}
            style={[
              styles.dot,
              { left: dot.x - DOT / 2, top: dot.y - DOT / 2, backgroundColor: lineColor },
            ]}
          />
        ))}
      </View>

      {/* Recent individual sessions */}
      <View style={styles.recent}>
        <Text style={[styles.recentLabel, { color: colors.textTertiary }]}>
          LAST {recent.length}
        </Text>
        <View style={styles.recentChips}>
          {recent.map((pt, i) => (
            <View
              key={`recent-${i}`}
              style={[styles.chip, { borderColor: colors.borderSubtle }]}
            >
              <Text style={[styles.chipText, { color: accColor(pt.accuracy) }]}>
                {Math.round(pt.accuracy)}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  axis: {
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  axisLabel: {
    ...Typography.xs,
    fontSize: Typography.xs.size,
    lineHeight: Typography.xs.lineHeight,
    fontFamily: Fonts.mono,
  },
  chart: {
    width: WIDTH,
    height: HEIGHT,
    position: "relative",
    overflow: "hidden",
  },
  segment: {
    position: "absolute",
    height: LINE_THICKNESS,
    borderRadius: LINE_THICKNESS / 2,
  },
  avgDash: {
    position: "absolute",
    height: 1,
  },
  dot: {
    position: "absolute",
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
  },
  recent: {
    flex: 1,
    gap: Spacing['2xs'],
  },
  recentLabel: {
    ...Typography.xs,
    fontSize: Typography.xs.size,
    lineHeight: Typography.xs.lineHeight,
    fontFamily: Fonts.mono,
    letterSpacing: 0.5,
  },
  recentChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing['2xs'],
  },
  chip: {
    minWidth: 30,
    borderWidth: 1,
    borderRadius: Radii.sm,
    paddingHorizontal: Spacing['2xs'],
    paddingVertical: Spacing['3xs'],
    alignItems: "center",
  },
  chipText: {
    ...Typography.monoBase,
    fontSize: Typography.monoBase.size,
    lineHeight: Typography.monoBase.lineHeight,
    fontFamily: Fonts.mono,
  },
  noData: {
    height: HEIGHT,
    justifyContent: "center",
  },
  noDataText: {
    ...Typography.xs,
    fontSize: Typography.xs.size,
    lineHeight: Typography.xs.lineHeight,
    fontFamily: Fonts.body,
  },
});
