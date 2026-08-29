// COMPONENT TEST: components/courses/__tests__/LessonExerciseBlock.test.tsx
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import EmbeddedExercise from '@/components/learn/EmbeddedExercise';
import { track } from '@/lib/analytics';
import { getExercise } from '@/lib/exercises/library';
import { loadRoutine, toggleExerciseId } from '@/lib/progress/routine';
import { courseStyles as s } from './courseStyles';

const c = Colors.light;

// The descriptor's pedagogy text ends with app-behaviour copy for follow-along
// exercises; the pill below says the same thing, so drop the sentence here.
const FOLLOW_ALONG_RE = /\s*Plays as a follow-along:.*$/s;

// One exercise on a lesson page: the "about" paragraph (static, indexable),
// the mini-player island, and the routine toggle. Membership hydrates after
// mount so SSG always renders the "+ Add" state.
export default function LessonExerciseBlock({
  courseId,
  lessonId,
  exerciseId,
}: {
  courseId: string;
  lessonId: string;
  exerciseId: string;
}) {
  const exercise = getExercise(exerciseId);
  const [inRoutine, setInRoutine] = useState(false);

  useEffect(() => {
    let live = true;
    loadRoutine()
      .then((r) => live && setInRoutine(r.exerciseIds.includes(exerciseId)))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [exerciseId]);

  const toggle = useCallback(async () => {
    try {
      const { added } = await toggleExerciseId(exerciseId);
      setInRoutine(added);
      track('course_exercise_toggled', { courseId, lessonId, exerciseId, added });
    } catch {
      // storage unavailable — keep the embed usable
    }
  }, [courseId, lessonId, exerciseId]);

  if (!exercise) return null;
  const about = exercise.pedagogy.replace(FOLLOW_ALONG_RE, '').trim();
  const followAlong = exercise.pitchDetection === false;

  return (
    <View style={styles.wrap}>
      <Text accessibilityRole="header" aria-level={3} style={s.h2}>{exercise.name}</Text>
      {followAlong ? (
        <View style={[s.pill, styles.followPill]}>
          <Text style={s.pillText}>Follow-along, not scored</Text>
        </View>
      ) : null}
      <Text style={s.eyebrow}>About this exercise</Text>
      <Text style={s.body}>{about}</Text>
      <EmbeddedExercise exerciseId={exerciseId} slug={lessonId} surface="course" />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={inRoutine ? `Remove ${exercise.name} from your routine` : `Add ${exercise.name} to your routine`}
        onPress={toggle}
        style={({ pressed }) => [s.pill, inRoutine && s.pillActive, pressed && { backgroundColor: c.accentMuted }]}
      >
        <Text style={[s.pillText, inRoutine && s.pillTextActive]}>{inRoutine ? '✓ In routine' : '+ Add to routine'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.xs, marginTop: Spacing.md },
  followPill: { minHeight: 28 },
});
