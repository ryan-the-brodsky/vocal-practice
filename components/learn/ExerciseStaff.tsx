import { ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Ellipse, G, Line, Text as SvgText } from 'react-native-svg';

import { Colors, Fonts, Spacing } from '@/constants/theme';
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
} from '@/lib/music/keySignature';

// Static SVG staff for Learn articles — same layout/glyphs as the Practice
// MelodyDisplay, but no reanimated / scroll-state / highlight (SSG-safe; renders
// all notes at rest with syllables underneath). Shows the reader what they'll sing.

const c = Colors.light;
const SP = 8; // staff line spacing
const STAFF_H = SP * 4;
const TOP_PAD = SP * 4;
const BOTTOM_PAD = SP * 3;
const SYLLABLE_H = 24;
const STAFF_AREA_H = STAFF_H + TOP_PAD + BOTTOM_PAD;
const TOTAL_H = STAFF_AREA_H + SYLLABLE_H;
const RX = 5.2;
const RY = 4;
const COL_W = 58;
const CLEF_FS = SP * 4.6;
const KEY_ACC_FS = SP * 3.2;
const NOTE_ACC_FS = SP * 3.0;
const KEY_ACC_W = SP * 1.1;
const CLEF_W = SP * 3.2;
const PREFIX_GAP = SP * 1.4;
const PAD = Spacing.md;

const GLYPH = {
  trebleClef: String.fromCodePoint(0xe050),
  bassClef: String.fromCodePoint(0xe062),
  sharp: String.fromCodePoint(0xe262),
  flat: String.fromCodePoint(0xe260),
  natural: String.fromCodePoint(0xe261),
};

interface ClefSpec { kind: 'treble' | 'bass'; bottomLetter: Letter; bottomOctave: number }
const TREBLE: ClefSpec = { kind: 'treble', bottomLetter: 'E', bottomOctave: 4 };
const BASS: ClefSpec = { kind: 'bass', bottomLetter: 'G', bottomOctave: 2 };

function staffStepToY(step: number): number {
  return TOP_PAD + STAFF_H - step * (SP / 2);
}
function keySignatureSteps(clef: ClefSpec, sig: KeySignature): number[] {
  const flats = sig.accidentalCount < 0;
  const table = clef.kind === 'treble'
    ? (flats ? TREBLE_FLAT_STEPS : TREBLE_SHARP_STEPS)
    : (flats ? BASS_FLAT_STEPS : BASS_SHARP_STEPS);
  return sig.accidentals.map((a) => table[a.letter]);
}
function prefixWidth(sig: KeySignature | null): number {
  return CLEF_W + (sig ? Math.abs(sig.accidentalCount) : 0) * KEY_ACC_W + PREFIX_GAP;
}
function ledgerLinesFor(step: number): number[] {
  const ys: number[] = [];
  if (step >= 10) for (let s = 10; s <= step; s += 2) ys.push(staffStepToY(s));
  if (step <= -2) for (let s = -2; s >= step; s -= 2) ys.push(staffStepToY(s));
  return ys;
}

export interface StaffNote { midi: number; syllable: string }

export default function ExerciseStaff({ notes, tonicMidi }: { notes: StaffNote[]; tonicMidi?: number }) {
  if (notes.length === 0) return null;

  const mean = notes.reduce((s, n) => s + n.midi, 0) / notes.length;
  const clef = mean >= 60 ? TREBLE : BASS;
  const sig = tonicMidi != null ? keySignatureFor(tonicMidi) : keySignatureFor(60);
  const pre = prefixWidth(sig);
  const totalWidth = pre + COL_W * notes.length + PAD * 2;
  const staffStartX = PAD;
  const notesStartX = PAD + pre;
  const clefX = staffStartX + CLEF_W * 0.15;
  const sigStartX = staffStartX + CLEF_W;

  return (
    <View style={styles.root}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Svg width={totalWidth} height={TOTAL_H}>
          {[0, 1, 2, 3, 4].map((i) => {
            const y = TOP_PAD + i * SP;
            return <Line key={`s${i}`} x1={staffStartX} x2={totalWidth - PAD} y1={y} y2={y} stroke={c.borderStrong} strokeWidth={1} />;
          })}

          <SvgText x={clefX} y={staffStepToY(0)} fontFamily="BravuraText" fontSize={CLEF_FS} fill={c.textPrimary}>
            {clef.kind === 'treble' ? GLYPH.trebleClef : GLYPH.bassClef}
          </SvgText>

          {sig.accidentals.length > 0 && keySignatureSteps(clef, sig).map((step, i) => (
            <SvgText key={`k${i}`} x={sigStartX + i * KEY_ACC_W + KEY_ACC_W * 0.5} y={staffStepToY(step)}
              fontFamily="BravuraText" fontSize={KEY_ACC_FS} fill={c.textPrimary} textAnchor="middle">
              {sig.accidentals[i].type === 'sharp' ? GLYPH.sharp : GLYPH.flat}
            </SvgText>
          ))}

          {notes.map((n, i) => {
            const cx = notesStartX + COL_W * i + COL_W / 2;
            const spelling = spellMidiInKey(n.midi, sig);
            const step = staffStepFor(spelling.letter, spelling.octave, clef.bottomLetter, clef.bottomOctave);
            const cy = staffStepToY(step);
            const acc = spelling.accidentalGlyph
              ? (spelling.accidentalGlyph === 'sharp' ? GLYPH.sharp : spelling.accidentalGlyph === 'flat' ? GLYPH.flat : GLYPH.natural)
              : null;
            return (
              <G key={`n${i}`}>
                {ledgerLinesFor(step).map((ly, k) => (
                  <Line key={`l${k}`} x1={cx - RX - 3} x2={cx + RX + 3} y1={ly} y2={ly} stroke={c.borderStrong} strokeWidth={1} />
                ))}
                {acc && (
                  <SvgText x={cx - RX - 4} y={cy} fontFamily="BravuraText" fontSize={NOTE_ACC_FS} fill={c.textPrimary} textAnchor="end">
                    {acc}
                  </SvgText>
                )}
                <Ellipse cx={cx} cy={cy} rx={RX} ry={RY} fill={c.textPrimary} />
                <SvgText x={cx} y={STAFF_AREA_H + 14} fontFamily={Fonts.body} fontSize={13} fill={c.textSecondary} textAnchor="middle">
                  {n.syllable}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { marginVertical: Spacing.sm },
  scroll: { minWidth: '100%' },
});
