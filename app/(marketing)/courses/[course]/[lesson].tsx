import Head from 'expo-router/head';
import { Link, useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import LessonPage from '@/components/courses/LessonPage';
import { courseStyles as s } from '@/components/courses/courseStyles';
import { COURSES } from '@/content/courses/courses.generated';
import { SITE, socialMetaTags } from '@/lib/seo/socialMeta';

export async function generateStaticParams(): Promise<{ course: string; lesson: string }[]> {
  return COURSES.flatMap((c) => c.lessons.map((l) => ({ course: c.id, lesson: l.id })));
}

function firstParagraph(md: string): string {
  return md.split(/\n\s*\n/).map((p) => p.trim()).find((p) => p && !p.startsWith('#')) ?? '';
}

export default function CourseLessonPage() {
  const { course: courseId, lesson: lessonId } = useLocalSearchParams<{ course: string; lesson: string }>();
  const course = COURSES.find((c) => c.id === courseId);
  const index = course ? course.lessons.findIndex((l) => l.id === lessonId) : -1;
  const lesson = course && index >= 0 ? course.lessons[index] : undefined;

  if (!course || !lesson) {
    return (
      <View style={[s.page, { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }]}>
        <Text style={s.h1}>Lesson not found</Text>
        <Link href="/courses/" style={s.link}>← All courses</Link>
      </View>
    );
  }

  const courseUrl = `${SITE}/courses/${course.id}/`;
  const url = `${SITE}/courses/${course.id}/${lesson.id}`;
  const n = index + 1;
  const title = `${lesson.title} | ${course.title}, lesson ${n} | Vocal Habit`;
  const description = firstParagraph(lesson.body).slice(0, 155);

  const lessonJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    '@id': url,
    url,
    name: lesson.title,
    description,
    learningResourceType: 'Lesson',
    educationalLevel: 'Beginner',
    isAccessibleForFree: true,
    inLanguage: 'en',
    position: n,
    isPartOf: { '@type': 'Course', '@id': courseUrl, name: course.title },
    dateModified: lesson.updated,
    author: { '@type': 'Organization', name: 'Vocal Habit', url: SITE },
  };
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Vocal Habit', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Courses', item: `${SITE}/courses/` },
      { '@type': 'ListItem', position: 3, name: course.title, item: courseUrl },
      { '@type': 'ListItem', position: 4, name: lesson.title, item: url },
    ],
  };

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={url} />
        {socialMetaTags({ title: lesson.title, description, url, type: 'article' })}
        <script type="application/ld+json">{JSON.stringify(lessonJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumb)}</script>
      </Head>
      <ScrollView style={s.page} contentContainerStyle={s.content}>
        <LessonPage course={course} lesson={lesson} index={index} />
      </ScrollView>
    </>
  );
}
