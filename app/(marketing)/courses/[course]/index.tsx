import Head from 'expo-router/head';
import { Link, useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import CourseSyllabus from '@/components/courses/CourseSyllabus';
import { courseStyles as s } from '@/components/courses/courseStyles';
import { COURSES } from '@/content/courses/courses.generated';
import { SITE, socialMetaTags } from '@/lib/seo/socialMeta';

export async function generateStaticParams(): Promise<{ course: string }[]> {
  return COURSES.map((c) => ({ course: c.id }));
}

const LEVEL = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' } as const;

function firstParagraph(md: string): string {
  return md.split(/\n\s*\n/).map((p) => p.trim()).find((p) => p && !p.startsWith('#')) ?? '';
}

export default function CourseSyllabusPage() {
  const { course: courseId } = useLocalSearchParams<{ course: string }>();
  const course = COURSES.find((c) => c.id === courseId);

  if (!course) {
    return (
      <View style={[s.page, { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }]}>
        <Text style={s.h1}>Course not found</Text>
        <Link href="/courses/" style={s.link}>← All courses</Link>
      </View>
    );
  }

  const url = `${SITE}/courses/${course.id}/`;
  const lessonUrl = (id: string) => `${SITE}/courses/${course.id}/${id}`;
  const title = `${course.title}: Free Online Course for Beginners`;

  const courseJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    '@id': url,
    url,
    name: course.title,
    description: course.metaDescription,
    inLanguage: 'en',
    educationalLevel: LEVEL[course.level],
    isAccessibleForFree: true,
    provider: { '@type': 'Organization', name: 'Vocal Habit', url: SITE },
    offers: { '@type': 'Offer', price: 0, priceCurrency: 'USD', category: 'Free', availability: 'https://schema.org/InStock' },
    hasCourseInstance: {
      '@type': 'CourseInstance',
      courseMode: 'Online',
      courseWorkload: 'PT2H',
      courseSchedule: { '@type': 'Schedule', repeatFrequency: 'Daily', repeatCount: course.estimatedWeeks * 7 },
      url,
    },
    syllabusSections: course.lessons.map((l) => ({
      '@type': 'Syllabus',
      name: l.title,
      description: firstParagraph(l.body),
      url: lessonUrl(l.id),
    })),
    teaches: ['breathing for singing', 'vocal warm-ups', 'singing in tune', 'chest voice', 'head voice', 'mix voice'],
    dateModified: course.updated,
  };
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: course.lessons.map((l, i) => ({ '@type': 'ListItem', position: i + 1, name: l.title, url: lessonUrl(l.id) })),
  };
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Vocal Habit', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Courses', item: `${SITE}/courses/` },
      { '@type': 'ListItem', position: 3, name: course.title, item: url },
    ],
  };

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={course.metaDescription} />
        <link rel="canonical" href={url} />
        {socialMetaTags({ title, description: course.metaDescription, url })}
        <script type="application/ld+json">{JSON.stringify(courseJsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(itemList)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumb)}</script>
      </Head>
      <ScrollView style={s.page} contentContainerStyle={s.content}>
        <CourseSyllabus course={course} />
      </ScrollView>
    </>
  );
}
