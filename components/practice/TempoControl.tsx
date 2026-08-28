// COMPONENT TEST: app/__tests__/practice.test.tsx (deferred — see the skip block)
import { useCallback, useMemo, useRef, useState } from "react";
import { PanResponder, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { Fonts, Radii, Spacing, Typography } from "@/constants/theme";
import { track } from "@/lib/analytics";
import { useTheme } from "@/hooks/use-theme";
import {
  DEFAULT_TEMPO_SCALE,
  appliedTempoLabel,
  effectiveBpm,
  fractionForTempoScale,
  nextDistinctTempoScale,
  snapTempoScale,
  tempoScaleFromFraction,
} from "@/lib/settings/tempo";

interface Props {
  /** The exercise's notated tempo — the multiplier is applied to this. */
  baseTempo: number;
  scale: number;
  onChange: (scale: number) => void;
  disabled?: boolean;
  /** Rides along on tempo_changed so a speed change is attributable to a drill. */
  exerciseId?: string;
}

const THUMB = 22;

/** Always-visible speed control for the practice loop: drag the track or tap
 *  −/+ to move a notch. Deliberately not inside the settings drawer — slowing a
 *  drill down is a per-session decision, not a preference you set once. */
export function TempoControl({ baseTempo, scale, onChange, disabled = false, exerciseId }: Props) {
  const { colors } = useTheme();
  const [trackWidth, setTrackWidth] = useState(0);
  const trackRef = useRef<View>(null);
  // Page-space geometry, refreshed on layout + at drag start so a scrolled page
  // still maps pointer position to the right notch.
  const geom = useRef({ x: 0, width: 1 });

  const snapped = snapTempoScale(scale);
  const bpm = effectiveBpm(baseTempo, snapped);
  const isDefault = snapped === DEFAULT_TEMPO_SCALE;
  // Each press lands on a notch that actually changes the bpm; a direction greys
  // out only when nothing further in it would. On a 144 bpm drill the top few
  // notches all clamp to the same bpm, so stepping one at a time would move the
  // thumb and change nothing.
  const slower = nextDistinctTempoScale(baseTempo, snapped, -1);
  const faster = nextDistinctTempoScale(baseTempo, snapped, 1);

  const emitTempo = useCallback(
    (next: number, via: "drag" | "step" | "reset") => {
      track("tempo_changed", {
        scale: next,
        bpm: effectiveBpm(baseTempo, next),
        exerciseId: exerciseId ?? null,
        via,
      });
    },
    [baseTempo, exerciseId],
  );

  const measure = useCallback(() => {
    try {
      trackRef.current?.measureInWindow?.((x, _y, width) => {
        geom.current = { x, width: width || 1 };
      });
    } catch {
      /* measurement unavailable (tests / SSR) — steppers still work */
    }
  }, []);

  // Latest handler without rebuilding the responder on every render.
  const applyRef = useRef<(pageX: number) => void>(() => {});
  // A drag crosses many notches; the event fires once, on release, with the
  // notch the singer settled on.
  const dragScaleRef = useRef<number | null>(null);
  applyRef.current = (pageX: number) => {
    if (disabled) return;
    const { x, width } = geom.current;
    // Map against the thumb's travel, not the raw track, so the ends line up
    // with the thumb's centre rather than the track edge.
    const travel = Math.max(1, width - THUMB);
    const next = tempoScaleFromFraction((pageX - x - THUMB / 2) / travel);
    if (next !== snapped) {
      dragScaleRef.current = next;
      onChange(next);
    }
  };

  const endDragRef = useRef<() => void>(() => {});
  endDragRef.current = () => {
    const settled = dragScaleRef.current;
    dragScaleRef.current = null;
    if (settled !== null) emitTempo(settled, "drag");
  };

  const responder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          measure();
          applyRef.current(evt.nativeEvent.pageX);
        },
        onPanResponderMove: (_evt, gesture) => applyRef.current(gesture.moveX),
        onPanResponderRelease: () => endDragRef.current(),
        onPanResponderTerminate: () => endDragRef.current(),
      }),
    [measure],
  );

  const fraction = fractionForTempoScale(snapped);
  const thumbLeft = Math.max(0, trackWidth - THUMB) * fraction;
  // Fill runs from the "normal" centre out to the thumb, so the eye reads
  // distance-from-normal rather than an absolute level.
  const centre = (trackWidth - THUMB) / 2 + THUMB / 2;
  const thumbCentre = thumbLeft + THUMB / 2;
  const fillLeft = Math.min(centre, thumbCentre);
  const fillWidth = Math.abs(thumbCentre - centre);

  const stepper = (direction: 1 | -1, target: number | null) => (
    <Pressable
      onPress={() => { if (target !== null) { onChange(target); emitTempo(target, "step"); } }}
      disabled={disabled || target === null}
      style={[
        styles.stepper,
        {
          backgroundColor: colors.bgSurface,
          borderColor: colors.borderStrong,
          opacity: disabled || target === null ? 0.35 : 1,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={direction === 1 ? "Faster" : "Slower"}
      // @ts-ignore — web-only prop
      title={Platform.OS === "web" ? (direction === 1 ? "Faster" : "Slower") : undefined}
    >
      <Text style={[styles.stepperGlyph, { color: colors.textSecondary, fontFamily: Fonts.monoMedium }]}>
        {direction === 1 ? "+" : "−"}
      </Text>
    </Pressable>
  );

  return (
    <View style={[styles.card, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.eyebrow, { color: colors.textTertiary, fontFamily: Fonts.bodySemibold }]}>
          Tempo
        </Text>
        {!isDefault && (
          <Pressable
            onPress={() => { onChange(DEFAULT_TEMPO_SCALE); emitTempo(DEFAULT_TEMPO_SCALE, "reset"); }}
            disabled={disabled}
            style={styles.resetLink}
            accessibilityRole="button"
            accessibilityLabel="Reset tempo to normal"
          >
            <Text style={[styles.resetText, { color: colors.accent, fontFamily: Fonts.bodyMedium }]}>
              Normal speed
            </Text>
          </Pressable>
        )}
      </View>

      <View style={styles.sliderRow}>
        {stepper(-1, slower)}
        <View
          ref={trackRef}
          onLayout={(e) => {
            setTrackWidth(e.nativeEvent.layout.width);
            measure();
          }}
          style={[styles.trackHit, { opacity: disabled ? 0.4 : 1 }]}
          accessibilityRole="adjustable"
          accessibilityLabel="Tempo"
          accessibilityValue={{ text: `${bpm} beats per minute, ${appliedTempoLabel(baseTempo, snapped)}` }}
          onAccessibilityAction={(e) => {
            if (e.nativeEvent.actionName === "increment" && faster !== null) { onChange(faster); emitTempo(faster, "step"); }
            if (e.nativeEvent.actionName === "decrement" && slower !== null) { onChange(slower); emitTempo(slower, "step"); }
          }}
          accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
          {...(disabled ? {} : responder.panHandlers)}
        >
          <View style={[styles.track, { backgroundColor: colors.borderSubtle }]} />
          <View style={[styles.centreTick, { backgroundColor: colors.borderStrong, left: centre - 1 }]} />
          {fillWidth > 0 && (
            <View style={[styles.fill, { backgroundColor: colors.accent, left: fillLeft, width: fillWidth }]} />
          )}
          <View style={[styles.thumb, { backgroundColor: colors.accent, left: thumbLeft }]} />
        </View>
        {stepper(1, faster)}
      </View>

      <Text style={[styles.readout, { color: colors.textPrimary, fontFamily: Fonts.monoMedium }]}>
        {bpm} bpm
        <Text style={[styles.readoutLabel, { color: colors.textSecondary, fontFamily: Fonts.body }]}>
          {"  ·  "}
          {appliedTempoLabel(baseTempo, snapped)}
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radii.md,
    padding: Spacing.sm,
    gap: Spacing.xs,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  eyebrow: {
    fontSize: Typography.xs.size,
    lineHeight: Typography.xs.lineHeight,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  resetLink: {
    paddingVertical: Spacing['2xs'],
    paddingHorizontal: Spacing.xs,
  },
  resetText: {
    fontSize: Typography.xs.size,
    lineHeight: Typography.xs.lineHeight,
  },
  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  stepper: {
    width: 44,
    height: 44,
    borderWidth: 1,
    borderRadius: Radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperGlyph: {
    fontSize: Typography.monoLg.size,
    lineHeight: Typography.monoLg.lineHeight,
  },
  trackHit: {
    flex: 1,
    height: 44,
    justifyContent: "center",
  },
  track: {
    height: Spacing.xs,
    borderRadius: Radii.pill,
  },
  centreTick: {
    position: "absolute",
    width: 2,
    height: Spacing.md,
    borderRadius: Radii.pill,
  },
  fill: {
    position: "absolute",
    height: Spacing.xs,
    borderRadius: Radii.pill,
  },
  thumb: {
    position: "absolute",
    width: THUMB,
    height: THUMB,
    borderRadius: Radii.pill,
  },
  readout: {
    fontSize: Typography.monoMd.size,
    lineHeight: Typography.monoMd.lineHeight,
  },
  readoutLabel: {
    fontSize: Typography.sm.size,
    lineHeight: Typography.sm.lineHeight,
  },
});
