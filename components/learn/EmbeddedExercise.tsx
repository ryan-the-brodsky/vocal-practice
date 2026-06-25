// COMPONENT TEST: components/learn/__tests__/EmbeddedExercise.test.tsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Colors, Fonts, Radii, Spacing, Typography } from '@/constants/theme';
import { exerciseName } from '@/lib/exercises/names';
import { getExercise } from '@/lib/exercises/library';
import { flattenIterations, planExercise } from '@/lib/exercises/engine';
import type { AudioPlayer, SequenceHandle } from '@/lib/audio';
import type { VoicePart } from '@/lib/exercises/types';

const c = Colors.light;
// Learn visitors haven't picked a voice part; play a sensible mid default.
const DEFAULT_VOICE: VoicePart = 'tenor';

type Phase = 'idle' | 'loading' | 'playing';

// In-article mini-player. Static placeholder renders at build (indexable); on
// Play it lazy-loads the audio engine (keeps Tone.js out of the page bundle +
// SSG) and plays the exercise's first key iteration. "Open full version" deep-
// links into Practice for the scored experience (+ the reverse exercise→article
// link is future). See seo/learning-library-plan.md.
export default function EmbeddedExercise({ exerciseId }: { exerciseId: string }) {
  const router = useRouter();
  const name = exerciseName(exerciseId) || 'this exercise';

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

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      handleRef.current?.stop();
      playerRef.current?.dispose().catch(() => {});
    };
  }, []);

  const play = useCallback(async () => {
    setPhase('loading');
    try {
      if (!playerRef.current) {
        // Lazy — Tone.js + samples load only on the user's Play gesture.
        const { createAudioPlayer } = await import('@/lib/audio');
        const p = createAudioPlayer();
        await p.init();
        playerRef.current = p;
      }
      const exercise = getExercise(exerciseId);
      if (!exercise) { setPhase('idle'); return; }
      const iters = planExercise({ exercise, voicePart: DEFAULT_VOICE, clickTrackEnabled: false });
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
  }, [exerciseId, stop]);

  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>TRY IT — FREE, IN YOUR BROWSER</Text>
      <Text style={styles.title}>{name}</Text>
      <Text style={styles.body}>
        Hear the exercise and sing along right here — your audio never leaves your device.
      </Text>
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
        <Pressable accessibilityRole="button" accessibilityLabel={`Open full version of ${name} with scoring`}
          onPress={() => router.push({ pathname: '/', params: { exerciseId } })}
          style={styles.ghost}>
          <Text style={styles.ghostText}>Open full version with scoring →</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: c.bgEmphasis,
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
    color: c.textOnEmphasisDim,
  },
  title: {
    fontFamily: Fonts.displaySemibold,
    fontSize: Typography.lg.size,
    lineHeight: Typography.lg.lineHeight,
    color: c.textOnEmphasis,
  },
  body: {
    fontFamily: Fonts.body,
    fontSize: Typography.base.size,
    lineHeight: Typography.base.lineHeight,
    color: c.textOnEmphasisDim,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xs },
  btn: {
    backgroundColor: c.accentOnEmphasis,
    borderRadius: Radii.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    minHeight: 44,
    minWidth: 110,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnPressed: { opacity: 0.85 },
  btnDim: { opacity: 0.6 },
  btnText: { fontFamily: Fonts.bodySemibold, fontSize: Typography.base.size, color: c.bgEmphasis },
  ghost: { minHeight: 44, justifyContent: 'center' },
  ghostText: { fontFamily: Fonts.bodyMedium, fontSize: Typography.sm.size, color: c.textOnEmphasisDim, textDecorationLine: 'underline' },
});
