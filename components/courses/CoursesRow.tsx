import { StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';

import { Colors, Fonts, Radii, Spacing, Typography } from '@/constants/theme';
import { COURSES } from '@/content/courses/courses.generated';
import { track } from '@/lib/analytics';

const c = Colors.light;

// "Free courses" band on the Learn hub. One emphasis card per course; the
// syllabus page carries the full description.
export default function CoursesRow() {
  if (COURSES.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text style={styles.eyebrow}>FREE COURSES</Text>
      {COURSES.map((course) => (
        <Link
          key={course.id}
          href={{ pathname: '/courses/[course]', params: { course: course.id } }}
          style={styles.cardLink}
          onPress={() => track('learn_tool_card_pressed', { tool: 'course', courseId: course.id })}
        >
          <View style={styles.card}>
            <Text style={styles.cardEyebrow}>{`${course.level} · ${course.lessons.length} lessons · about ${course.estimatedWeeks} weeks`}</Text>
            <Text style={styles.cardTitle}>{course.title}</Text>
            <Text style={styles.cardDesc}>{course.metaDescription}</Text>
          </View>
        </Link>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.xs, marginTop: Spacing.xs },
  eyebrow: {
    fontFamily: Fonts.bodyMedium,
    fontSize: Typography.xs.size,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: c.textTertiary,
  },
  cardLink: { textDecorationLine: 'none' },
  card: {
    backgroundColor: c.bgEmphasis,
    borderWidth: 1,
    borderColor: c.borderOnEmphasis,
    borderRadius: Radii.md,
    padding: Spacing.md,
    gap: Spacing['2xs'],
  },
  cardEyebrow: {
    fontFamily: Fonts.bodyMedium,
    fontSize: Typography.xs.size,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: c.accentOnEmphasis,
  },
  cardTitle: {
    fontFamily: Fonts.displayMedium,
    fontSize: Typography.lg.size,
    lineHeight: Typography.lg.lineHeight,
    color: c.textOnEmphasis,
  },
  cardDesc: {
    fontFamily: Fonts.body,
    fontSize: Typography.sm.size,
    lineHeight: Typography.sm.lineHeight,
    color: c.textOnEmphasisDim,
  },
});
