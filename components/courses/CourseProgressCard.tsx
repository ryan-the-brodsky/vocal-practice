import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';

import { Colors, Fonts, Radii, Spacing, Typography } from '@/constants/theme';
import { COURSES } from '@/content/courses/courses.generated';
import { track } from '@/lib/analytics';
import { courseProgress } from '@/lib/courses';
import { loadCourses } from '@/lib/courses/store';

const c = Colors.light;

interface Cue { courseId: string; courseTitle: string; lessonId: string; lessonTitle: string; n: number; total: number }

// One-line "next lesson" cue for the Practice screen. Renders nothing until
// hydrated and nothing when no course is in progress, so it can't move Start.
export default function CourseProgressCard() {
  const [cue, setCue] = useState<Cue | null>(null);

  useEffect(() => {
    let live = true;
    loadCourses()
      .then((state) => {
        if (!live) return;
        for (const course of COURSES) {
          const rec = state[course.id];
          if (!rec) continue;
          const p = courseProgress(course, rec.completedLessonIds);
          if (p.done || !p.nextLesson) continue;
          setCue({
            courseId: course.id,
            courseTitle: course.title,
            lessonId: p.nextLesson.id,
            lessonTitle: p.nextLesson.title,
            n: course.lessons.indexOf(p.nextLesson) + 1,
            total: p.total,
          });
          return;
        }
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  if (!cue) return null;
  return (
    <Link
      href={{ pathname: '/courses/[course]/[lesson]', params: { course: cue.courseId, lesson: cue.lessonId } }}
      style={styles.link}
      onPress={() => track('course_next_pressed', { courseId: cue.courseId, lessonId: cue.lessonId, surface: 'practice' })}
    >
      <View style={styles.card}>
        <Text style={styles.eyebrow}>Course</Text>
        <Text style={styles.text} numberOfLines={2}>
          {`${cue.courseTitle} · Next: Lesson ${cue.n} of ${cue.total}, ${cue.lessonTitle} →`}
        </Text>
      </View>
    </Link>
  );
}

const styles = StyleSheet.create({
  link: { textDecorationLine: 'none' },
  card: {
    backgroundColor: c.bgSurface,
    borderWidth: 1,
    borderColor: c.borderSubtle,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    gap: Spacing['3xs'],
    minHeight: 36,
  },
  eyebrow: {
    fontFamily: Fonts.bodyMedium,
    fontSize: Typography.xs.size,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: c.textTertiary,
  },
  text: { fontFamily: Fonts.bodyMedium, fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight, color: c.accent },
});
