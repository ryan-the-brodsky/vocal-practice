// COMPONENT TEST: components/learn/__tests__/EmbeddedExercise.test.tsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, type Href } from 'expo-router';

import { Colors, Fonts, Radii, Spacing, Typography } from '@/constants/theme';
import { exerciseName } from '@/lib/exercises/names';
import { getExercise } from '@/lib/exercises/library';
import { flattenIterations, planExercise } from '@/lib/exercises/engine';
import type { AudioPlayer, SequenceHandle } from '@/lib/audio';
import type { VoicePart } from '@/lib/exercises/types';
import ExerciseStaff, { type StaffNote } from '@/components/learn/ExerciseStaff';

const c = Colors.light;
// Learn visitors haven't picked a voice part; play a sensible mid default.
const DEFAULT_VOICE: VoicePart = 'tenor';

type Phase = 'idle' | 'loading' | 'playing';

// In-article mini-player. Renders the exercise's staff + syllables (so a reader
// sees what they'll sing) as static, indexable SVG; Play lazy-loads the audio
// engine (Tone.js stays out of SSG) and plays the first key iteration. The
// "Open full version" link opens Practice (with the exercise preselected) in a
// NEW TAB so the reader keeps their place. See seo/learning-library-plan.md.
export default function EmbeddedExercise({ exerciseId }: { exerciseId: string }) {
  const name = exerciseName(exerciseId) || 'this exercise';
  const exercise = getExercise(exerciseId);

  const iters = useMemo(() => {
    if (!exercise) return [];
    try {
      return planExercise({ exercise, voicePart: DEFAULT_VOICE, clickTrackEnabled: false });
    } catch {
      return [];
    }
  }, [exercise]);

  const notes: StaffNote[] = useMemo(() => {
    const iter = iters[0];
    if (!iter) return [];
    return iter.events
      .filter((e) => e.type === 'melody')
      .map((e) => ({ midi: e.midi, syllable: e.syllable ?? '' }));
  }, [iters]);
  const tonicMidi = iters[0]?.tonicMidi;

  const [phase, setPhase] = useState<Phase>('idle');
  const playerRef = useRef<AudioPlayer | null>(null);
  const handleRef = useRef<SequenceHandle | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    handleRef.current?.stop();
    handleRef.current = null;
    setPhase('idle');
  }, []);

  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current);
    handleRef.current?.stop();
    playerRef.current?.dispose().catch(() => {});
  }, []);

  const play = useCallback(async () => {
    setPhase('loading');
    try {
      if (!playerRef.current) {
        const { createAudioPlayer } = await import('@/lib/audio'); // lazy — keeps Tone.js out of SSG
        const p = createAudioPlayer();
        await p.init();
        playerRef.current = p;
      }
      const flat = flattenIterations(iters.slice(0, 1), 0); // first key only — short preview
      if (!flat.events.length) { setPhase('idle'); return; }
      handleRef.current = playerRef.current.playSequence(flat.events);
      setPhase('playing');
      pollRef.current = setInterval(() => {
        if ((handleRef.current?.getProgress() ?? 0) >= 1) stop();
      }, 150);
    } catch {
      setPhase('idle');
    }
  }, [iters, stop]);

  const fullHref = `/?exerciseId=${encodeURIComponent(exerciseId)}` as Href;

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>TRY IT — FREE, IN YOUR BROWSER</Text>
      <Text style={styles.title}>{name}</Text>

      <ExerciseStaff notes={notes} tonicMidi={tonicMidi} />

      <View style={styles.row}>
        {phase === 'playing' ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Stop" onPress={stop}
            style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}>
            <Text style={styles.btnText}>■ Stop</Text>
          </Pressable>
        ) : (
          <Pressable accessibilityRole="button" accessibilityLabel={`Play ${name}`} onPress={play} disabled={phase === 'loading'}
            style={({ pressed }) => [styles.btn, pressed && styles.btnPressed, phase === 'loading' && styles.btnDim]}>
            <Text style={styles.btnText}>{phase === 'loading' ? 'Loading…' : '▶ Play'}</Text>
          </Pressable>
        )}
        <Link href={fullHref} target="_blank" style={styles.fullLink}>
          Open full version with scoring →
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: c.bgSurface,
    borderWidth: 1,
    borderColor: c.borderStrong,
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    gap: Spacing.xs,
    marginVertical: Spacing.md,
  },
  eyebrow: {
    fontFamily: Fonts.bodyMedium,
    fontSize: Typography.xs.size,
    lineHeight: Typography.xs.lineHeight,
    letterSpacing: 0.5,
    color: c.textTertiary,
  },
  title: {
    fontFamily: Fonts.displaySemibold,
    fontSize: Typography.lg.size,
    lineHeight: Typography.lg.lineHeight,
    color: c.textPrimary,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.md, marginTop: Spacing.xs },
  btn: {
    backgroundColor: c.accent,
    borderRadius: Radii.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    minHeight: 44,
    minWidth: 110,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnPressed: { backgroundColor: c.accentHover },
  btnDim: { opacity: 0.6 },
  btnText: { fontFamily: Fonts.bodySemibold, fontSize: Typography.base.size, color: c.bgCanvas },
  fullLink: { fontFamily: Fonts.bodyMedium, fontSize: Typography.sm.size, color: c.accent, textDecorationLine: 'underline' },
});
