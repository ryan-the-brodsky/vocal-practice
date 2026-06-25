import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Colors, Fonts, Radii, Spacing, Typography } from '@/constants/theme';
import { exerciseName } from '@/lib/exercises/names';

const c = Colors.light;

// In-article callout that links into Practice with the exercise preselected
// (article -> exercise). Static + crawlable; the live in-page widget is a
// future upgrade. See seo/learning-library-plan.md.
export default function EmbeddedExercise({ exerciseId }: { exerciseId: string }) {
  const router = useRouter();
  const name = exerciseName(exerciseId) || 'this exercise';
  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>TRY IT — FREE, IN YOUR BROWSER</Text>
      <Text style={styles.title}>{name}</Text>
      <Text style={styles.body}>
        Practice this exercise with live pitch detection and scoring, then come back to keep reading.
        No signup — your audio never leaves your device.
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Practice ${name}`}
        onPress={() => router.push({ pathname: '/', params: { exerciseId } })}
        style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
      >
        <Text style={styles.btnText}>Practice this exercise →</Text>
      </Pressable>
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
  btn: {
    backgroundColor: c.accentOnEmphasis,
    borderRadius: Radii.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xs,
    minHeight: 44,
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  btnPressed: { opacity: 0.85 },
  btnText: {
    fontFamily: Fonts.bodySemibold,
    fontSize: Typography.base.size,
    color: c.bgEmphasis,
  },
});
