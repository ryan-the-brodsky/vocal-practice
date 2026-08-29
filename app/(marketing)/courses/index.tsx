import Head from 'expo-router/head';
import { ScrollView, Text, View } from 'react-native';

import CoursesRow from '@/components/courses/CoursesRow';
import { courseStyles as s } from '@/components/courses/courseStyles';
import { COURSES } from '@/content/courses/courses.generated';
import { SITE, socialMetaTags } from '@/lib/seo/socialMeta';

const URL = `${SITE}/courses/`;
const TITLE = 'Free Online Singing Courses for Beginners | Vocal Habit';
const DESCRIPTION =
  'Free, self-paced singing courses you take in your browser: short lessons, each with a scored exercise, that build into a daily practice routine. No signup.';

export default function CoursesIndexPage() {
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: COURSES.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE}/courses/${c.id}/`,
      name: c.title,
    })),
  };
  return (
    <>
      <Head>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <link rel="canonical" href={URL} />
        {socialMetaTags({ title: TITLE, description: DESCRIPTION, url: URL })}
        <script type="application/ld+json">{JSON.stringify(itemList)}</script>
      </Head>
      <ScrollView style={s.page} contentContainerStyle={s.content}>
        <View style={s.col}>
          <Text accessibilityRole="header" aria-level={1} style={s.h1}>Free singing courses</Text>
          <Text style={s.deck}>
            Each course is a sequence of short lessons. Every lesson pairs a guide with an exercise you sing along to in your browser, scored by your microphone, and lets you add that exercise to your daily routine. Free, no account.
          </Text>
          <CoursesRow />
        </View>
      </ScrollView>
    </>
  );
}
