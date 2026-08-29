import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';

import { Colors, Spacing } from '@/constants/theme';
import MarkdownView from '@/components/learn/MarkdownView';
import { LEARN_ARTICLES } from '@/content/learn/articles.generated';
import { track } from '@/lib/analytics';
import { nextLesson, prevLesson, type Course, type CourseLesson } from '@/lib/courses';
import { touchLesson } from '@/lib/courses/store';
import LessonExerciseBlock from './LessonExerciseBlock';
import MarkCompleteButton from './MarkCompleteButton';
import { courseStyles as s } from './courseStyles';

const c = Colors.light;

// Lesson body: framing prose + per-exercise blocks + the canonical article
// link. Everything that ranks renders synchronously; progress is client-only.
export default function LessonPage({ course, lesson, index }: { course: Course; lesson: CourseLesson; index: number }) {
  const article = LEARN_ARTICLES.find((a) => a.slug === lesson.articleSlug);
  const prev = prevLesson(course, lesson.id);
  const next = nextLesson(course, lesson.id);
  const n = index + 1;
  const total = course.lessons.length;

  useEffect(() => {
    touchLesson(course.id, lesson.id).catch(() => {});
    track('course_lesson_viewed', { courseId: course.id, lessonId: lesson.id, index });
  }, [course.id, lesson.id, index]);

  return (
    <View style={s.col}>
      <View style={styles.crumbs}>
        <Link href="/courses/" style={s.link}>Courses</Link>
        <Text style={s.small}>›</Text>
        <Link href={{ pathname: '/courses/[course]', params: { course: course.id } }} style={s.link}>{course.title}</Link>
      </View>
      <Text style={s.eyebrow}>{`Lesson ${n} of ${total}`}</Text>
      <Text accessibilityRole="header" aria-level={1} style={s.h1}>{lesson.title}</Text>

      <MarkdownView content={lesson.body} />

      <Text accessibilityRole="header" aria-level={2} style={s.h2}>
        {lesson.exerciseIds.length > 1 ? 'The exercises' : 'The exercise'}
      </Text>
      {lesson.exerciseIds.map((id) => (
        <LessonExerciseBlock key={id} courseId={course.id} lessonId={lesson.id} exerciseId={id} />
      ))}

      {article ? (
        <View style={[s.card, styles.guide]}>
          <Text style={s.eyebrow}>Full guide</Text>
          <Link href={{ pathname: '/learn/[slug]', params: { slug: article.slug } }} style={styles.guideTitle}>
            {`${article.title} →`}
          </Link>
          <Text style={s.small}>{article.metaDescription}</Text>
        </View>
      ) : null}

      <View style={styles.completeRow}>
        <MarkCompleteButton courseId={course.id} lessonId={lesson.id} index={index} />
      </View>

      <View style={styles.nav}>
        {prev ? (
          <Link href={{ pathname: '/courses/[course]/[lesson]', params: { course: course.id, lesson: prev.id } }} style={s.link}>
            {`← ${prev.title}`}
          </Link>
        ) : <View />}
        {next ? (
          <Link
            href={{ pathname: '/courses/[course]/[lesson]', params: { course: course.id, lesson: next.id } }}
            style={s.link}
            onPress={() => track('course_next_pressed', { courseId: course.id, lessonId: lesson.id, surface: 'lesson' })}
          >
            {`Next: ${next.title} →`}
          </Link>
        ) : (
          <Link href={{ pathname: '/courses/[course]', params: { course: course.id } }} style={s.link}>Back to the syllabus →</Link>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  crumbs: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, flexWrap: 'wrap' },
  guide: { marginTop: Spacing.lg },
  guideTitle: { ...s.h2, color: c.accent },
  completeRow: { marginTop: Spacing.lg },
  nav: {
    marginTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: c.borderSubtle,
    paddingTop: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
});
