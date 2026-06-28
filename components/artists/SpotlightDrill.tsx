import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Radii, Spacing, Typography } from '@/constants/theme';
import EmbeddedExercise from '@/components/learn/EmbeddedExercise';
import { loadRoutine, saveRoutine } from '@/lib/progress/routine';

const c = Colors.light;

type State = 'idle' | 'added' | 'already';

// A spotlight drill: the in-article mini-player (staff + Play, lazy audio) plus
// the "Add to routine" conversion hook. Add writes the exercise id into the
// app's routine (vocal-training:routine:v1, same-origin localStorage) so a cold
// lander arrives in the app with the drill already queued.
export default function SpotlightDrill({ exerciseId }: { exerciseId: string }) {
  const [state, setState] = useState<State>('idle');

  const add = useCallback(async () => {
    try {
      const cfg = await loadRoutine();
      if (cfg.exerciseIds.includes(exerciseId)) {
        setState('already');
        return;
      }
      await saveRoutine({ exerciseIds: [...cfg.exerciseIds, exerciseId] });
      setState('added');
    } catch {
      // localStorage unavailable — leave the embed usable, just no-op the add.
    }
  }, [exerciseId]);

  const label =
    state === 'added' ? '✓ Added to your routine'
    : state === 'already' ? '✓ Already in your routine'
    : '+ Add to routine';

  return (
    <View style={styles.wrap}>
      <EmbeddedExercise exerciseId={exerciseId} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add this drill to your practice routine"
        onPress={add}
        disabled={state !== 'idle'}
        style={({ pressed }) => [styles.btn, pressed && styles.btnPressed, state !== 'idle' && styles.btnDone]}
      >
        <Text style={[styles.btnText, state !== 'idle' && styles.btnTextDone]}>{label}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.xs },
  btn: {
    alignSelf: 'flex-start',
    backgroundColor: c.bgSurface,
    borderWidth: 1,
    borderColor: c.accent,
    borderRadius: Radii.pill,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    minHeight: 36,
    justifyContent: 'center',
    marginTop: -Spacing.xs,
    marginBottom: Spacing.sm,
  },
  btnPressed: { backgroundColor: c.accentMuted },
  btnDone: { borderColor: c.success },
  btnText: { fontFamily: Fonts.bodySemibold, fontSize: Typography.sm.size, color: c.accent },
  btnTextDone: { color: c.success },
});
