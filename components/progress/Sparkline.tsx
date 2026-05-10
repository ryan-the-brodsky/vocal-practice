import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/use-theme";
import { Typography, Fonts, Spacing } from "@/constants/theme";

const WIDTH = 200;
const HEIGHT = 40;
const LINE_THICKNESS = 1.5;

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

// Map an accuracy value to a Y pixel (top = 0, bottom = HEIGHT).
function toY(accuracy: number): number {
  return HEIGHT - (Math.max(0, Math.min(100, accuracy)) / 100) * HEIGHT;
}

// Map a data-point index to an X pixel.
function toX(index: number, total: number): number {
  if (total <= 1) return WIDTH / 2;
  return (index / (total - 1)) * WIDTH;
}

export default function Sparkline({ data, avg, color }: Props) {
  const { colors } = useTheme();
  // Default to accentOnEmphasis — sparkline lives in the emphasis weekly card.
  const lineColor = color ?? colors.accentOnEmphasis;
  const dashColor = colors.borderOnEmphasis;

  if (data.length < 2) {
    return (
      <View style={styles.noData}>
        <Text style={[styles.noDataText, { color: colors.textOnEmphasisDim }]}>
          No trend yet
        </Text>
      </View>
    );
  }

  const avgY = toY(avg);

  // Build line segments between consecutive points.
  const segments: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 0; i < data.length - 1; i++) {
    segments.push({
      x1: toX(i, data.length),
      y1: toY(data[i].accuracy),
      x2: toX(i + 1, data.length),
      y2: toY(data[i + 1].accuracy),
    });
  }

  // Dots at each data point.
  const dots = data.map((pt, i) => ({
    x: toX(i, data.length),
    y: toY(pt.accuracy),
  }));

  return (
    <View style={styles.container}>
      {/* Dashed average line — series of small rectangles */}
      {Array.from({ length: 20 }, (_, i) => {
        const segWidth = WIDTH / 20;
        const x = i * segWidth;
        const dashWidth = segWidth * 0.55;
        return (
          <View
            key={`dash-${i}`}
            style={[
              styles.avgDash,
              { left: x, top: avgY - 0.5, width: dashWidth, backgroundColor: dashColor },
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
            { left: dot.x - 2, top: dot.y - 2, backgroundColor: lineColor },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: WIDTH,
    height: HEIGHT,
    position: "relative",
    overflow: "hidden",
  },
  segment: {
    position: "absolute",
    height: LINE_THICKNESS,
  },
  avgDash: {
    position: "absolute",
    height: 1,
  },
  dot: {
    position: "absolute",
    width: Spacing['2xs'],
    height: Spacing['2xs'],
    borderRadius: Spacing['2xs'],
  },
  noData: {
    width: WIDTH,
    height: HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  noDataText: {
    ...Typography.xs,
    fontSize: Typography.xs.size,
    lineHeight: Typography.xs.lineHeight,
    fontFamily: Fonts.body,
  },
});
