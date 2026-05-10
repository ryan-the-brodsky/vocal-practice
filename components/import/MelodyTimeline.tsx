import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { midiToNote } from "@/lib/exercises/music";
import type { ExtractedNote } from "@/lib/analyze";
import { useTheme } from "@/hooks/use-theme";
import { Spacing, Radii, Typography, Fonts } from "@/constants/theme";

const MIN_BOX_WIDTH = 36;
const MAX_BOX_WIDTH = 120;
// Pixels per second of audio; clamped to keep boxes legible.
const PX_PER_SEC = 90;

export default function MelodyTimeline({
  notes,
  onSelect,
  selectedIdx,
}: {
  notes: ExtractedNote[];
  onSelect?: (idx: number) => void;
  selectedIdx?: number;
}) {
  const { colors } = useTheme();

  if (notes.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={{ color: colors.textTertiary, fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight, fontFamily: Fonts.body, fontStyle: "italic" }}>
          No notes detected.
        </Text>
      </View>
    );
  }
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator
      contentContainerStyle={[styles.row, { gap: Spacing['2xs'], paddingVertical: Spacing['2xs'] }]}
      style={styles.scroll}
    >
      {notes.map((n, i) => {
        const durSec = Math.max(0, (n.endMs - n.startMs) / 1000);
        const width = Math.max(MIN_BOX_WIDTH, Math.min(MAX_BOX_WIDTH, durSec * PX_PER_SEC));
        const abs = Math.abs(n.centsOff);
        const selected = selectedIdx === i;
        const noteName = midiToNote(n.snappedMidi);
        const sign = n.centsOff > 0 ? "+" : n.centsOff < 0 ? "" : "";

        // Color-code the box via design tokens.
        let bgColor: string;
        let borderColor: string;
        let textColor: string;
        if (abs <= 25) {
          bgColor = colors.accentMuted;
          borderColor = colors.success;
          textColor = colors.success;
        } else if (abs <= 50) {
          bgColor = colors.accentMuted;
          borderColor = colors.warning;
          textColor = colors.warning;
        } else {
          bgColor = colors.bgSurface;
          borderColor = colors.error;
          textColor = colors.error;
        }

        return (
          <Pressable
            key={`${n.startMs}-${i}`}
            onPress={() => onSelect?.(i)}
            style={[
              styles.box,
              {
                width,
                backgroundColor: bgColor,
                borderColor: selected ? colors.accent : borderColor,
                borderWidth: selected ? 2.5 : 1.5,
                borderRadius: Radii.sm,
                paddingHorizontal: Spacing['2xs'],
                paddingVertical: Spacing.xs,
              },
            ]}
          >
            <Text style={{ color: textColor, fontSize: Typography.monoSm.size, lineHeight: Typography.monoSm.lineHeight, fontFamily: Fonts.monoMedium }} numberOfLines={1}>
              {noteName}
            </Text>
            <Text style={{ color: textColor, fontSize: Typography.monoSm.size, lineHeight: Typography.monoSm.lineHeight, fontFamily: Fonts.mono, marginTop: Spacing['3xs'] }} numberOfLines={1}>
              {sign}{Math.round(n.centsOff)}¢
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0 },
  row: { flexDirection: "row" },
  box: {
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    paddingVertical: Spacing.sm,
    alignItems: "center",
  },
});
