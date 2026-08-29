// COMPONENT TEST: components/courses/__tests__/CourseSyllabus.test.tsx
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';

import { Colors, Fonts, Spacing, Typography } from '@/constants/theme';
import MarkdownView from '@/components/learn/MarkdownView';
import { track } from '@/lib/analytics';
import { courseProgress, type Course } from '@/lib/courses';
import { loadCourseProgress } from '@/lib/courses/store';
import { exerciseName } from '@/lib/exercises/names';
import { courseStyles as s } from './courseStyles';

const c = Colors.light;

const LEVEL_LABEL = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' } as const;

export default function CourseSyllabus({ course }: { course: Course }) {
  const [completed, setCompleted] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let live = true;
    loadCourseProgress(course.id)
      .then((p) => {
        if (!live) return;
        setCompleted(p?.completedLessonIds ?? []);
        setHydrated(true);
      })
      .catch(() => live && setHydrated(true));
    track('course_viewed', { courseId: course.id, surface: 'syllabus' });
    return () => {
      live = false;
    };
  }, [course.id]);

  const progress = courseProgress(course, completed);
  const total = course.lessons.length;
  const first = course.lessons[0];
  const cta = !hydrated || progress.completed === 0
    ? { lesson: first, label: 'Start lesson 1' }
    : progress.nextLesson
      ? { lesson: progress.nextLesson, label: `Continue: Lesson ${course.lessons.indexOf(progress.nextLesson) + 1}` }
      : { lesson: first, label: 'Start again from lesson 1' };

  return (
    <View style={s.col}>
      <Link href="/courses/" style={s.link}>← All courses</Link>
      <Text style={s.eyebrow}>{`${LEVEL_LABEL[course.level]} · ${total} lessons · about ${course.estimatedWeeks} weeks · Free, no signup`}</Text>
      <Text accessibilityRole="header" aria-level={1} style={s.h1}>
        {`${course.title}: a free online singing course for beginners`}
      </Text>
      <Text style={s.deck}>{course.description}</Text>

      <View style={styles.ctaRow}>
        {cta.lesson ? (
          <Link
            href={{ pathname: '/courses/[course]/[lesson]', params: { course: course.id, lesson: cta.lesson.id } }}
            style={s.primaryBtn}
            onPress={() => track('course_next_pressed', { courseId: course.id, lessonId: cta.lesson.id, surface: 'syllabus' })}
          >
            <Text style={s.primaryBtnText}>{cta.label}</Text>
          </Link>
        ) : null}
        {hydrated && progress.completed > 0 ? (
          <View
            style={s.dotsRow}
            accessibilityRole="progressbar"
            accessibilityLabel={`${progress.completed} of ${total} lessons complete`}
          >
            {course.lessons.map((l) => {
              const isDone = completed.includes(l.id);
              const isCurrent = progress.nextLesson?.id === l.id;
              return <View key={l.id} style={[s.dot, isDone && s.dotDone, isCurrent && s.dotCurrent]} />;
            })}
          </View>
        ) : null}
      </View>

      <MarkdownView content={course.body} />

      <Text accessibilityRole="header" aria-level={2} style={s.h2}>Syllabus</Text>
      <View style={styles.list}>
        {course.lessons.map((l, i) => {
          const isDone = completed.includes(l.id);
          return (
            <Link key={l.id} href={{ pathname: '/courses/[course]/[lesson]', params: { course: course.id, lesson: l.id } }} style={styles.rowLink}>
              <View style={[s.card, styles.row]}>
                <Text style={[styles.num, isDone && styles.numDone]}>{isDone ? '✓' : String(i + 1)}</Text>
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle}>{l.title}</Text>
                  <Text style={s.small}>{l.exerciseIds.map((id) => exerciseName(id)).join(' · ')}</Text>
                </View>
              </View>
            </Link>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ctaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flexWrap: 'wrap' },
  list: { gap: Spacing.xs },
  rowLink: { textDecorationLine: 'none' },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  num: {
    fontFamily: Fonts.monoMedium,
    fontSize: Typography.monoMd.size,
    lineHeight: Typography.lg.lineHeight,
    color: c.textTertiary,
    minWidth: Spacing.lg,
  },
  numDone: { color: c.success },
  rowBody: { flex: 1, gap: Spacing['3xs'] },
  rowTitle: {
    fontFamily: Fonts.displayMedium,
    fontSize: Typography.md.size,
    lineHeight: Typography.md.lineHeight,
    color: c.textPrimary,
  },
});
