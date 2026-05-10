import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";

import { buildContrastPlayback, type FocusNote, type PlaybackVariant } from "@/lib/coaching";
import { createAudioPlayer, type AudioPlayer, type SequenceHandle } from "@/lib/audio";
import type { NoteEvent } from "@/lib/exercises/types";
import SyllableDisplay from "@/components/SyllableDisplay";
import MelodyDisplay from "@/components/practice/MelodyDisplay";
import { useTheme } from "@/hooks/use-theme";
import { Fonts, Radii, Spacing, Typography } from "@/constants/theme";

export interface ContrastPlaybackProps {
  focus: FocusNote;
  iterationEvents: NoteEvent[];
  // Other qualifying observations we can rotate to as further examples.
  otherFocuses?: FocusNote[];
  // Optional override syllable strip (for cases where iterationEvents is empty).
  syllables?: string[];
}

const VARIANT_BUTTONS: { variant: PlaybackVariant; label: string }[] = [
  { variant: "target-note", label: "target note" },
  { variant: "your-note", label: "your note" },
  { variant: "phrase-target", label: "phrase, target" },
  { variant: "phrase-your-version", label: "phrase, your version" },
];

export default function ContrastPlayback({
  focus: initialFocus,
  iterationEvents,
  otherFocuses = [],
  syllables: syllablesOverride,
}: ContrastPlaybackProps) {
  const { colors } = useTheme();
  const [focusIdx, setFocusIdx] = useState(0);
  const [activeVariant, setActiveVariant] = useState<PlaybackVariant | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);
  const handleRef = useRef<SequenceHandle | null>(null);
  const stopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const focuses = useMemo(() => [initialFocus, ...otherFocuses], [initialFocus, otherFocuses]);
  const focus = focuses[focusIdx % focuses.length];
  const moreCount = focuses.length - 1;

  const syllables = useMemo(() => {
    if (syllablesOverride && syllablesOverride.length > 0) return syllablesOverride;
    return iterationEvents
      .filter((e) => e.type === "melody")
      .map((e) => e.syllable ?? "");
  }, [iterationEvents, syllablesOverride]);

  // When we have melody events, prefer the staff-aware MelodyDisplay; otherwise fall back to syllable-only.
  const melodyNotes = useMemo(() => {
    if (syllablesOverride && syllablesOverride.length > 0) return null;
    const melody = iterationEvents.filter((e) => e.type === "melody");
    if (melody.length === 0) return null;
    return melody.map((e) => ({ midi: e.midi, syllable: e.syllable ?? "" }));
  }, [iterationEvents, syllablesOverride]);

  const cancelInFlight = useCallback(() => {
    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }
    handleRef.current?.stop();
    handleRef.current = null;
    setActiveVariant(null);
  }, []);

  useEffect(() => {
    return () => {
      cancelInFlight();
      playerRef.current?.dispose().catch(() => {});
      playerRef.current = null;
    };
  }, [cancelInFlight]);

  async function ensurePlayer(): Promise<AudioPlayer> {
    if (!playerRef.current) playerRef.current = createAudioPlayer();
    if (!playerRef.current.isReady()) await playerRef.current.init();
    return playerRef.current;
  }

  async function handlePlay(variant: PlaybackVariant) {
    cancelInFlight();
    try {
      const events = buildContrastPlayback(focus, iterationEvents, variant);
      if (events.length === 0) return;
      const player = await ensurePlayer();
      const handle = player.playSequence(events);
      handleRef.current = handle;
      setActiveVariant(variant);
      const totalMs = events.reduce(
        (m, e) => Math.max(m, (e.startTime + e.duration) * 1000),
        0,
      );
      stopTimeoutRef.current = setTimeout(() => {
        handleRef.current?.stop();
        handleRef.current = null;
        stopTimeoutRef.current = null;
        setActiveVariant((cur) => (cur === variant ? null : cur));
      }, totalMs + 400);
    } catch {
      setActiveVariant(null);
    }
  }

  function handleMoreExamples() {
    cancelInFlight();
    setFocusIdx((i) => (i + 1) % focuses.length);
  }

  return (
    // Emphasis surface — brown spotlight panel per DESIGN.md
    <View
      style={{
        backgroundColor: colors.bgEmphasis,
        borderRadius: Radii.lg,
        borderWidth: 1,
        borderColor: colors.borderOnEmphasis,
        padding: Spacing.md,
        gap: Spacing.sm,
      }}
    >
      <Text
        style={{
          fontSize: Typography.xs.size,
          lineHeight: Typography.xs.lineHeight,
          fontFamily: Fonts.bodyMedium,
          color: colors.textOnEmphasisDim,
          textTransform: "uppercase",
          letterSpacing: 0.6,
        }}
      >
        Listen
      </Text>

      {/* Buttons in two rows of 2 */}
      <View style={{ flexDirection: "row", gap: Spacing.xs }}>
        {VARIANT_BUTTONS.slice(0, 2).map((b) => (
          <PlayButton
            key={b.variant}
            label={b.label}
            active={activeVariant === b.variant}
            onPress={() => handlePlay(b.variant)}
            colors={colors}
          />
        ))}
      </View>
      <View style={{ flexDirection: "row", gap: Spacing.xs }}>
        {VARIANT_BUTTONS.slice(2).map((b) => (
          <PlayButton
            key={b.variant}
            label={b.label}
            active={activeVariant === b.variant}
            onPress={() => handlePlay(b.variant)}
            colors={colors}
          />
        ))}
      </View>

      {/* Syllable strip with inset background */}
      <View
        style={{
          backgroundColor: colors.bgEmphasisInset,
          borderRadius: Radii.md,
          marginTop: Spacing["2xs"],
          overflow: "hidden",
        }}
      >
        {melodyNotes ? (
          <MelodyDisplay
            notes={melodyNotes}
            currentIndex={-1}
            noteProgress={0}
            focusNoteIndex={focus.positionInIteration}
            tonicMidi={melodyNotes.reduce((m, n) => Math.min(m, n.midi), Infinity)}
            size="compact"
          />
        ) : (
          <SyllableDisplay
            syllables={syllables}
            currentIndex={-1}
            noteProgress={0}
            focusNoteIndex={focus.positionInIteration}
            size="compact"
          />
        )}
      </View>

      {moreCount > 0 && (
        <Pressable
          onPress={handleMoreExamples}
          style={{ paddingVertical: Spacing.xs, alignItems: "center" }}
          accessibilityLabel={`Show more examples (${moreCount} more)`}
        >
          <Text
            style={{
              fontSize: Typography.sm.size,
              lineHeight: Typography.sm.lineHeight,
              fontFamily: Fonts.bodyMedium,
              color: colors.accentOnEmphasis,
            }}
          >
            + More examples ({moreCount})
          </Text>
        </Pressable>
      )}
    </View>
  );
}

type ThemeColors = ReturnType<typeof useTheme>["colors"];

function PlayButton({
  label,
  active,
  onPress,
  colors,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  colors: ThemeColors;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        // minHeight 44 touch target
        minHeight: 44,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.xs,
        borderRadius: Radii.md,
        borderWidth: 1,
        borderColor: active ? colors.accentOnEmphasis : colors.borderStrong,
        backgroundColor: active ? colors.accentOnEmphasis : colors.canvas,
        alignItems: "center",
        justifyContent: "center",
      }}
      accessibilityRole="button"
      accessibilityLabel={active ? `Playing ${label}` : `Play ${label}`}
    >
      <Text
        style={{
          fontSize: Typography.monoSm.size,
          lineHeight: Typography.monoSm.lineHeight,
          fontFamily: Fonts.mono,
          color: active ? colors.bgEmphasis : colors.textTertiary,
          textAlign: "center",
        }}
      >
        {active ? "Playing…" : label}
      </Text>
    </Pressable>
  );
}
