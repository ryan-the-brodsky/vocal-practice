// COMPONENT TEST: components/courses/__tests__/MarkCompleteButton.test.tsx
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';
import { track } from '@/lib/analytics';
import { courseProgress, getCourse } from '@/lib/courses';
import { loadCourseProgress, markLessonComplete, unmarkLessonComplete } from '@/lib/courses/store';
import { courseStyles as s } from './courseStyles';

const c = Colors.light;

export default function MarkCompleteButton({ courseId, lessonId, index }: { courseId: string; lessonId: string; index: number }) {
  const [done, setDone] = useState(false);

  useEffect(() => {
    let live = true;
    loadCourseProgress(courseId)
      .then((p) => live && setDone(!!p?.completedLessonIds.includes(lessonId)))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [courseId, lessonId]);

  const mark = useCallback(async () => {
    try {
      const p = await markLessonComplete(courseId, lessonId);
      setDone(true);
      const course = getCourse(courseId);
      const summary = course ? courseProgress(course, p.completedLessonIds) : undefined;
      track('course_lesson_completed', {
        courseId,
        lessonId,
        index,
        completedCount: summary?.completed ?? p.completedLessonIds.length,
        total: summary?.total ?? null,
      });
    } catch {
      // storage unavailable
    }
  }, [courseId, lessonId, index]);

  const undo = useCallback(async () => {
    try {
      await unmarkLessonComplete(courseId, lessonId);
      setDone(false);
    } catch {
      // storage unavailable
    }
  }, [courseId, lessonId]);

  if (done) {
    return (
      <View style={styles.row}>
        <Text style={styles.doneText}>✓ Lesson completed</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Undo marking this lesson complete" onPress={undo} style={s.pill}>
          <Text style={s.pillText}>Undo</Text>
        </Pressable>
      </View>
    );
  }
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Mark this lesson complete" onPress={mark} style={({ pressed }) => [s.primaryBtn, pressed && { backgroundColor: c.accentHover }]}>
      <Text style={s.primaryBtnText}>Mark lesson complete</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  doneText: { ...s.pillText, color: c.success },
});
