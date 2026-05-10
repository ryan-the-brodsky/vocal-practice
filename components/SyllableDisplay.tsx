import { Fonts, Spacing, Typography } from "@/constants/theme";
import { useEffect, useRef } from "react";
import { LayoutChangeEvent, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "@/hooks/use-theme";

export interface SyllableDisplayProps {
  syllables: string[];          // all syllables in the current phrase/key
  currentIndex: number;         // -1 when idle / no active syllable
  noteProgress: number;         // 0..1 progress within the active note
  focusNoteIndex?: number;      // highlights this index regardless of current — for coaching
  size?: "default" | "compact";
}

const TRANSITION_MS = 200;

type Relation = "past" | "active" | "future";

export default function SyllableDisplay({
  syllables,
  currentIndex,
  noteProgress,
  focusNoteIndex,
  size = "default",
}: SyllableDisplayProps) {
  const { colors } = useTheme();
  const isDefault = size === "default";
  const scrollRef = useRef<ScrollView | null>(null);
  const itemPositions = useRef<Map<number, { x: number; w: number }>>(new Map());
  const containerWidthRef = useRef(0);

  function onContainerLayout(e: LayoutChangeEvent) {
    containerWidthRef.current = e.nativeEvent.layout.width;
  }

  // Auto-scroll the active syllable into the centre of the strip.
  useEffect(() => {
    if (currentIndex < 0) return;
    const pos = itemPositions.current.get(currentIndex);
    const cw = containerWidthRef.current;
    if (!pos || !cw || !scrollRef.current) return;
    const target = Math.max(0, pos.x + pos.w / 2 - cw / 2);
    scrollRef.current.scrollTo({ x: target, animated: true });
  }, [currentIndex]);

  if (syllables.length === 0) {
    return (
      <View style={[styles.root, isDefault ? styles.rootDefault : styles.rootCompact]}>
        <Text style={[styles.idle, isDefault ? styles.idleDefault : styles.idleCompact, { color: colors.textTertiary, fontFamily: Fonts.display }]}>—</Text>
      </View>
    );
  }

  return (
    <View
      style={[styles.root, isDefault ? styles.rootDefault : styles.rootCompact]}
      onLayout={onContainerLayout}
      accessible
      accessibilityRole="text"
      accessibilityLabel={
        currentIndex >= 0
          ? `Currently singing: ${syllables[currentIndex]}`
          : `Phrase: ${syllables.join(" ")}`
      }
    >
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.row, isDefault ? styles.rowDefault : styles.rowCompact]}
      >
        {syllables.map((s, i) => {
          const relation: Relation =
            currentIndex < 0
              ? "future"
              : i < currentIndex
                ? "past"
                : i > currentIndex
                  ? "future"
                  : "active";
          return (
            <SyllableItem
              key={i}
              text={s}
              relation={relation}
              isFocus={focusNoteIndex === i}
              noteProgress={relation === "active" ? noteProgress : 0}
              isDefault={isDefault}
              colors={colors}
              onLayout={(layout) => itemPositions.current.set(i, layout)}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

interface ItemProps {
  text: string;
  relation: Relation;
  isFocus: boolean;
  noteProgress: number;
  isDefault: boolean;
  colors: ReturnType<typeof useTheme>["colors"];
  onLayout: (layout: { x: number; w: number }) => void;
}

function SyllableItem({ text, relation, isFocus, noteProgress, isDefault, colors, onLayout }: ItemProps) {
  const targetScale = scaleForRelation(relation, isDefault);
  const targetOpacity = opacityForRelation(relation);

  const scale = useSharedValue(targetScale);
  const opacity = useSharedValue(targetOpacity);

  useEffect(() => {
    scale.value = withTiming(targetScale, { duration: TRANSITION_MS });
    opacity.value = withTiming(targetOpacity, { duration: TRANSITION_MS });
  }, [targetScale, targetOpacity, scale, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const fillW = `${Math.min(100, Math.max(0, noteProgress * 100))}%` as const;

  // Color by state: active → accent, focus → success, rest → textPrimary
  const textColor =
    relation === "active"
      ? colors.accent
      : isFocus
        ? colors.success
        : colors.textPrimary;

  const fontSize = isDefault
    ? (relation === "active" ? Typography.xl.size : Typography.lg.size)
    : (relation === "active" ? Typography.lg.size : Typography.md.size);
  const lineHeight = isDefault
    ? (relation === "active" ? Typography.xl.lineHeight : Typography.lg.lineHeight)
    : (relation === "active" ? Typography.lg.lineHeight : Typography.md.lineHeight);

  return (
    <Animated.View
      style={[
        styles.item,
        isDefault ? styles.itemDefault : styles.itemCompact,
        isFocus && { borderBottomWidth: 3, borderBottomColor: colors.success, paddingBottom: Spacing["2xs"] },
        animStyle,
      ]}
      onLayout={(e) => {
        const { x, width } = e.nativeEvent.layout;
        onLayout({ x, w: width });
      }}
    >
      <Text
        allowFontScaling={false}
        style={[
          styles.text,
          { color: textColor, fontFamily: Fonts.display, fontSize, lineHeight },
          Platform.select({ web: { userSelect: "none" } }) as object,
        ]}
      >
        {text}
      </Text>
      {relation === "active" && (
        <View style={[styles.underlineTrack, { backgroundColor: colors.borderSubtle }]}>
          <View style={[styles.underlineFill, { width: fillW, backgroundColor: colors.accent }]} />
        </View>
      )}
    </Animated.View>
  );
}

function scaleForRelation(r: Relation, isDefault: boolean): number {
  if (r === "active") return isDefault ? 2.0 : 1.7;
  if (r === "past") return 0.85;
  return 1.0;
}

function opacityForRelation(r: Relation): number {
  if (r === "active") return 1.0;
  if (r === "past") return 0.32;
  return 0.7;
}

const styles = StyleSheet.create({
  root: { backgroundColor: "transparent", overflow: "visible" },
  rootDefault: { minHeight: 120, justifyContent: "center" },
  rootCompact: { minHeight: 56, justifyContent: "center" },
  row: { alignItems: "center", paddingHorizontal: Spacing.md },
  rowDefault: { gap: Spacing.lg },
  rowCompact: { gap: Spacing.sm },
  item: { alignItems: "center", justifyContent: "center" },
  itemDefault: { paddingVertical: Spacing.sm },
  itemCompact: { paddingVertical: Spacing.xs },
  text: {
    textAlign: "center",
  },
  underlineTrack: {
    marginTop: Spacing["2xs"],
    height: 3,
    width: "100%",
    borderRadius: Spacing["3xs"],
    overflow: "hidden",
  },
  underlineFill: { height: "100%", borderRadius: Spacing["3xs"] },
  idle: { textAlign: "center" },
  idleDefault: { fontSize: Typography.xl.size, lineHeight: Typography.xl.lineHeight },
  idleCompact: { fontSize: Typography.md.size, lineHeight: Typography.md.lineHeight },
});
