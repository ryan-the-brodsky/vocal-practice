import { Fonts, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import {
  keySignatureFor,
  spellMidiInKey,
  staffStepFor,
  type KeySignature,
  type Letter,
  TREBLE_SHARP_STEPS,
  TREBLE_FLAT_STEPS,
  BASS_SHARP_STEPS,
  BASS_FLAT_STEPS,
} from "@/lib/music/keySignature";
import { useEffect } from "react";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Ellipse, G, Line, Text as SvgText } from "react-native-svg";

export interface MelodyNote {
  midi: number;
  syllable: string;
}

export interface MelodyDisplayProps {
  notes: MelodyNote[];
  currentIndex: number;
  noteProgress: number;
  /** Tonic MIDI of the active key. When present, the staff renders the
   *  proper key signature next to the clef and suppresses redundant
   *  per-note accidentals. */
  tonicMidi?: number;
  focusNoteIndex?: number;
  size?: "default" | "compact";
}

const TRANSITION_MS = 200;
const STAFF_LINE_SPACING = 8; // pixels between adjacent staff lines
const STAFF_HEIGHT = STAFF_LINE_SPACING * 4; // 5 lines, 4 gaps
const STAFF_TOP_PAD = STAFF_LINE_SPACING * 4; // headroom for ledger lines + clef
const STAFF_BOTTOM_PAD = STAFF_LINE_SPACING * 4;
const STAFF_AREA_HEIGHT = STAFF_HEIGHT + STAFF_TOP_PAD + STAFF_BOTTOM_PAD;
const NOTEHEAD_RX = 5.2;
const NOTEHEAD_RY = 4;
const COMPACT_COL_WIDTH = 56;
const DEFAULT_COL_WIDTH = 72;

// SMuFL glyph font sizing — tuned so 1 stave-space ≈ STAFF_LINE_SPACING.
// At fontSize = STAFF_LINE_SPACING * 4, the glyph height is roughly 4 spaces
// (1 em). Clefs typically render slightly taller than the staff; accidentals
// slightly shorter. Tuned by eye for the cream-on-muted-line look.
const CLEF_FONT_SIZE = STAFF_LINE_SPACING * 4.6;
const KEY_ACCIDENTAL_FONT_SIZE = STAFF_LINE_SPACING * 3.2;
const NOTE_ACCIDENTAL_FONT_SIZE = STAFF_LINE_SPACING * 3.0;
const KEY_ACCIDENTAL_WIDTH = STAFF_LINE_SPACING * 1.1;
const CLEF_WIDTH = STAFF_LINE_SPACING * 3.2;
const PREFIX_GAP = STAFF_LINE_SPACING * 1.4;

// SMuFL Unicode codepoints (Bravura)
const GLYPH = {
  trebleClef: "",
  bassClef: "",
  sharp: "",
  flat: "",
  natural: "",
};

type Relation = "past" | "active" | "future";

interface ClefSpec {
  kind: "treble" | "bass";
  bottomLetter: Letter;
  bottomOctave: number;
}

const TREBLE: ClefSpec = { kind: "treble", bottomLetter: "E", bottomOctave: 4 };
const BASS: ClefSpec = { kind: "bass", bottomLetter: "G", bottomOctave: 2 };

function chooseClef(notes: MelodyNote[]): ClefSpec {
  if (notes.length === 0) return TREBLE;
  const mean = notes.reduce((s, n) => s + n.midi, 0) / notes.length;
  return mean >= 60 ? TREBLE : BASS;
}

function staffStepToY(step: number): number {
  // bottom line (step 0) sits at staff top + STAFF_HEIGHT; each step moves up half-spacing
  const bottomY = STAFF_TOP_PAD + STAFF_HEIGHT;
  return bottomY - step * (STAFF_LINE_SPACING / 2);
}

// SMuFL convention: glyph design origin is at the bottom staff line. SVG text
// with y at the bottom line correctly aligns Bravura's clef anchors — the
// treble clef's curl lands on G4 (step 2), the bass clef's dots straddle F3
// (step 6) — by virtue of the font's internal metrics, not our offsets.
function clefBaselineY(): number {
  return staffStepToY(0);
}

function keySignatureSteps(clef: ClefSpec, sig: KeySignature): number[] {
  const usingFlats = sig.accidentalCount < 0;
  const table = clef.kind === "treble"
    ? (usingFlats ? TREBLE_FLAT_STEPS : TREBLE_SHARP_STEPS)
    : (usingFlats ? BASS_FLAT_STEPS : BASS_SHARP_STEPS);
  return sig.accidentals.map((a) => table[a.letter]);
}

function prefixWidthFor(sig: KeySignature | null): number {
  const accCount = sig ? Math.abs(sig.accidentalCount) : 0;
  return CLEF_WIDTH + accCount * KEY_ACCIDENTAL_WIDTH + PREFIX_GAP;
}

export default function MelodyDisplay({
  notes,
  currentIndex,
  noteProgress,
  tonicMidi,
  focusNoteIndex,
  size = "default",
}: MelodyDisplayProps) {
  const { colors } = useTheme();
  const isDefault = size === "default";
  const colWidth = isDefault ? DEFAULT_COL_WIDTH : COMPACT_COL_WIDTH;

  if (notes.length === 0) {
    return (
      <View style={[styles.root, isDefault ? styles.rootDefault : styles.rootCompact]}>
        <Text style={[styles.idle, { color: colors.textTertiary, fontFamily: Fonts.display }]}>—</Text>
      </View>
    );
  }

  const clef = chooseClef(notes);
  const sig = tonicMidi != null ? keySignatureFor(tonicMidi) : null;
  const prefixWidth = prefixWidthFor(sig);
  const totalWidth = prefixWidth + colWidth * notes.length + Spacing.md * 2;
  const staffStartX = Spacing.md;
  const notesStartX = Spacing.md + prefixWidth;
  const clefX = staffStartX + CLEF_WIDTH * 0.15;
  const sigStartX = staffStartX + CLEF_WIDTH;

  return (
    <View style={[styles.root, isDefault ? styles.rootDefault : styles.rootCompact]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.staffArea, { width: totalWidth, height: STAFF_AREA_HEIGHT }]}>
          <Svg
            width={totalWidth}
            height={STAFF_AREA_HEIGHT}
            style={StyleSheet.absoluteFill}
          >
            {/* 5 staff lines */}
            {[0, 1, 2, 3, 4].map((i) => {
              const y = STAFF_TOP_PAD + i * STAFF_LINE_SPACING;
              return (
                <Line
                  key={`s${i}`}
                  x1={staffStartX}
                  x2={totalWidth - Spacing.md}
                  y1={y}
                  y2={y}
                  stroke={colors.borderStrong}
                  strokeWidth={1}
                />
              );
            })}

            {/* Clef */}
            <SvgText
              x={clefX}
              y={clefBaselineY()}
              fontFamily="BravuraText"
              fontSize={CLEF_FONT_SIZE}
              fill={colors.textPrimary}
            >
              {clef.kind === "treble" ? GLYPH.trebleClef : GLYPH.bassClef}
            </SvgText>

            {/* Key signature accidentals — SMuFL accidentals center on the
                line/space they modify when y = staffStepToY(targetStep). */}
            {sig && sig.accidentals.length > 0 && keySignatureSteps(clef, sig).map((step, i) => {
              const x = sigStartX + i * KEY_ACCIDENTAL_WIDTH + KEY_ACCIDENTAL_WIDTH * 0.5;
              const y = staffStepToY(step);
              const glyph = sig.accidentals[i].type === "sharp" ? GLYPH.sharp : GLYPH.flat;
              return (
                <SvgText
                  key={`k${i}`}
                  x={x}
                  y={y}
                  fontFamily="BravuraText"
                  fontSize={KEY_ACCIDENTAL_FONT_SIZE}
                  fill={colors.textPrimary}
                  textAnchor="middle"
                >
                  {glyph}
                </SvgText>
              );
            })}

            {/* Notes */}
            {notes.map((n, i) => {
              const cx = notesStartX + colWidth * i + colWidth / 2;
              const spelling = sig
                ? spellMidiInKey(n.midi, sig)
                : spellMidiInKeyFallback(n.midi);
              const step = staffStepFor(spelling.letter, spelling.octave, clef.bottomLetter, clef.bottomOctave);
              const cy = staffStepToY(step);
              const relation: Relation =
                currentIndex < 0 ? "future"
                : i < currentIndex ? "past"
                : i > currentIndex ? "future"
                : "active";
              const isFocus = focusNoteIndex === i;
              const fill =
                isFocus ? colors.success
                : relation === "active" ? colors.accent
                : colors.textPrimary;
              const opacity = relation === "past" ? 0.32 : 1;
              const ledgers = ledgerLinesFor(step);
              const accGlyph = spelling.accidentalGlyph
                ? (spelling.accidentalGlyph === "sharp" ? GLYPH.sharp
                  : spelling.accidentalGlyph === "flat" ? GLYPH.flat
                  : GLYPH.natural)
                : null;
              return (
                <G key={`n${i}`}>
                  {ledgers.map((ly, k) => (
                    <Line
                      key={`l${k}`}
                      x1={cx - NOTEHEAD_RX - 3}
                      x2={cx + NOTEHEAD_RX + 3}
                      y1={ly}
                      y2={ly}
                      stroke={colors.borderStrong}
                      strokeWidth={1}
                      opacity={opacity}
                    />
                  ))}
                  {accGlyph && (
                    <SvgText
                      x={cx - NOTEHEAD_RX - 4}
                      y={cy}
                      fontFamily="BravuraText"
                      fontSize={NOTE_ACCIDENTAL_FONT_SIZE}
                      fill={fill}
                      opacity={opacity}
                      textAnchor="end"
                    >
                      {accGlyph}
                    </SvgText>
                  )}
                  <Ellipse
                    cx={cx}
                    cy={cy}
                    rx={NOTEHEAD_RX}
                    ry={NOTEHEAD_RY}
                    fill={fill}
                    opacity={opacity}
                  />
                </G>
              );
            })}
          </Svg>
        </View>

        <View
          style={[
            styles.syllableRow,
            { width: totalWidth, paddingLeft: notesStartX, paddingRight: Spacing.md },
          ]}
        >
          {notes.map((n, i) => {
            const relation: Relation =
              currentIndex < 0 ? "future"
              : i < currentIndex ? "past"
              : i > currentIndex ? "future"
              : "active";
            return (
              <SyllableColumn
                key={i}
                text={n.syllable}
                relation={relation}
                isFocus={focusNoteIndex === i}
                noteProgress={relation === "active" ? noteProgress : 0}
                isDefault={isDefault}
                colWidth={colWidth}
                colors={colors}
              />
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

// Fallback when caller didn't pass a tonic (e.g. idle states): treat as C
// major and render any chromatic note with a sharp glyph. Uses the same
// spelling logic for consistency.
function spellMidiInKeyFallback(midi: number) {
  return spellMidiInKey(midi, keySignatureFor(60));
}

function ledgerLinesFor(step: number): number[] {
  const ys: number[] = [];
  if (step >= 10) {
    for (let s = 10; s <= step; s += 2) ys.push(staffStepToY(s));
  }
  if (step <= -2) {
    for (let s = -2; s >= step; s -= 2) ys.push(staffStepToY(s));
  }
  return ys;
}

interface SyllableColumnProps {
  text: string;
  relation: Relation;
  isFocus: boolean;
  noteProgress: number;
  isDefault: boolean;
  colWidth: number;
  colors: ReturnType<typeof useTheme>["colors"];
}

function SyllableColumn({
  text,
  relation,
  isFocus,
  noteProgress,
  isDefault,
  colWidth,
  colors,
}: SyllableColumnProps) {
  const targetScale = relation === "active" ? (isDefault ? 1.6 : 1.4) : relation === "past" ? 0.85 : 1.0;
  const targetOpacity = relation === "active" ? 1.0 : relation === "past" ? 0.32 : 0.75;
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
  const textColor =
    relation === "active" ? colors.accent
    : isFocus ? colors.success
    : colors.textPrimary;
  const fontSize = isDefault
    ? (relation === "active" ? Typography.xl.size : Typography.lg.size)
    : (relation === "active" ? Typography.lg.size : Typography.md.size);
  const lineHeight = isDefault
    ? (relation === "active" ? Typography.xl.lineHeight : Typography.lg.lineHeight)
    : (relation === "active" ? Typography.lg.lineHeight : Typography.md.lineHeight);

  return (
    <View style={[styles.syllableCol, { width: colWidth }]}>
      <Animated.View
        style={[
          styles.syllableInner,
          isFocus && { borderBottomWidth: 3, borderBottomColor: colors.success, paddingBottom: Spacing["2xs"] },
          animStyle,
        ]}
      >
        <Text
          allowFontScaling={false}
          style={[
            styles.syllableText,
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: "transparent", overflow: "visible" },
  rootDefault: { minHeight: 184, justifyContent: "center" },
  rootCompact: { minHeight: 132, justifyContent: "center" },
  scrollContent: { flexDirection: "column", alignItems: "flex-start" },
  staffArea: { position: "relative" },
  syllableRow: { flexDirection: "row", alignItems: "flex-start", marginTop: Spacing.xs },
  syllableCol: { alignItems: "center", justifyContent: "flex-start" },
  syllableInner: { alignItems: "center", justifyContent: "center", paddingVertical: Spacing.xs },
  syllableText: { textAlign: "center" },
  underlineTrack: {
    marginTop: Spacing["2xs"],
    height: 3,
    width: "100%",
    borderRadius: Spacing["3xs"],
    overflow: "hidden",
  },
  underlineFill: { height: "100%", borderRadius: Spacing["3xs"] },
  idle: {
    textAlign: "center",
    fontSize: Typography.xl.size,
    lineHeight: Typography.xl.lineHeight,
  },
});
