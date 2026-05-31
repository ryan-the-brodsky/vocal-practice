// Native fallback for the VexFlow-based score view. VexFlow requires the DOM
// (document.createElement) so it doesn't run on native. We swap to a small
// placeholder until a native engraver is in place; the .web.tsx sibling is the
// real implementation.

import { Fonts, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Text, View } from "react-native";

import type { ChunkSpec, TimeSignature } from "@/lib/songs/types";
import type { ScoreNote } from "./SongScoreView";

export interface VexFlowScoreProps {
  notes: ScoreNote[];
  chunks: ChunkSpec[];
  tonicMidi: number;
  timeSignature: TimeSignature;
  targetRowWidth?: number;
  onBoundaryDragMove?: (boundaryIdx: number, newStartNoteIdx: number) => void;
  originalIndexMap?: number[];
}

export default function VexFlowScore(_props: VexFlowScoreProps) {
  const { colors } = useTheme();
  return (
    <View style={{ padding: Spacing.lg }}>
      <Text style={{ color: colors.textTertiary, fontFamily: Fonts.body, fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight }}>
        Beamed notation is web-only for now. Open the editor on the web build to see it.
      </Text>
    </View>
  );
}

export { CHUNK_PALETTE } from "./SongScoreView";
