// Per-interior-boundary nudge controls. Each row represents the boundary
// between chunk[i] (left) and chunk[i+1] (right). ◀ moves the boundary one
// note left (the left chunk shrinks, the right chunk grows); ▶ does the
// reverse. Disabled when the neighbor would shrink below 1 note.

import { Fonts, Radii, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ChunkSpec } from "@/lib/songs/types";
import { CHUNK_PALETTE } from "./SongScoreView";

export interface ChunkDividerControlsProps {
  chunks: ChunkSpec[];
  onChange: (next: ChunkSpec[]) => void;
}

function moveBoundary(chunks: ChunkSpec[], boundaryIdx: number, delta: -1 | 1): ChunkSpec[] {
  const left = chunks[boundaryIdx];
  const right = chunks[boundaryIdx + 1];
  if (!left || !right) return chunks;
  if (delta === -1) {
    // Boundary moves left: left.endNoteIdx -=1, right.startNoteIdx -=1.
    // Disallow when left would have 0 notes.
    if (left.endNoteIdx <= left.startNoteIdx) return chunks;
    return chunks.map((c, i) =>
      i === boundaryIdx ? { ...c, endNoteIdx: c.endNoteIdx - 1 }
      : i === boundaryIdx + 1 ? { ...c, startNoteIdx: c.startNoteIdx - 1 }
      : c,
    );
  } else {
    if (right.endNoteIdx <= right.startNoteIdx) return chunks;
    return chunks.map((c, i) =>
      i === boundaryIdx ? { ...c, endNoteIdx: c.endNoteIdx + 1 }
      : i === boundaryIdx + 1 ? { ...c, startNoteIdx: c.startNoteIdx + 1 }
      : c,
    );
  }
}

export default function ChunkDividerControls({ chunks, onChange }: ChunkDividerControlsProps) {
  const { colors } = useTheme();
  if (chunks.length < 2) {
    return (
      <Text style={{ color: colors.textTertiary, fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight, fontFamily: Fonts.body }}>
        Only one chunk — nothing to nudge.
      </Text>
    );
  }
  return (
    <View style={styles.list}>
      {chunks.slice(0, -1).map((left, i) => {
        const right = chunks[i + 1]!;
        const leftSize = left.endNoteIdx - left.startNoteIdx + 1;
        const rightSize = right.endNoteIdx - right.startNoteIdx + 1;
        const canLeft = leftSize > 1;
        const canRight = rightSize > 1;
        const color = CHUNK_PALETTE[(i + 1) % CHUNK_PALETTE.length]!;
        return (
          <View
            key={left.id}
            style={[styles.row, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle, borderRadius: Radii.md, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, gap: Spacing.sm }]}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.textTertiary, fontSize: Typography.xs.size, lineHeight: Typography.xs.lineHeight, fontFamily: Fonts.bodyMedium, textTransform: "uppercase", letterSpacing: 0.6 }}>
                Boundary after note {left.endNoteIdx + 1}
              </Text>
              <Text style={{ color: color, fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight, fontFamily: Fonts.bodySemibold }}>
                {left.name} ({leftSize}) → {right.name} ({rightSize})
              </Text>
            </View>
            <View style={styles.btns}>
              <Pressable
                onPress={() => canLeft && onChange(moveBoundary(chunks, i, -1))}
                disabled={!canLeft}
                style={[styles.btn, { backgroundColor: colors.bgSurface, borderColor: colors.borderStrong, borderRadius: Radii.sm, opacity: canLeft ? 1 : 0.35 }]}
                accessibilityLabel={`Move boundary between ${left.name} and ${right.name} left`}
              >
                <Text style={{ color: colors.textPrimary, fontSize: Typography.md.size, lineHeight: Typography.md.lineHeight, fontFamily: Fonts.bodySemibold }}>◀</Text>
              </Pressable>
              <Pressable
                onPress={() => canRight && onChange(moveBoundary(chunks, i, 1))}
                disabled={!canRight}
                style={[styles.btn, { backgroundColor: colors.bgSurface, borderColor: colors.borderStrong, borderRadius: Radii.sm, opacity: canRight ? 1 : 0.35 }]}
                accessibilityLabel={`Move boundary between ${left.name} and ${right.name} right`}
              >
                <Text style={{ color: colors.textPrimary, fontSize: Typography.md.size, lineHeight: Typography.md.lineHeight, fontFamily: Fonts.bodySemibold }}>▶</Text>
              </Pressable>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.xs },
  row: { flexDirection: "row", alignItems: "center", borderWidth: 1 },
  btns: { flexDirection: "row", gap: Spacing["2xs"] },
  btn: {
    width: 40, height: 40,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1,
  },
});
