import Head from 'expo-router/head';
import { Link, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Radii, Spacing, Typography } from '@/constants/theme';
import { LEARN_ARTICLES } from '@/content/learn/articles.generated';
import MarkdownView from '@/components/learn/MarkdownView';
import EmbeddedExercise from '@/components/learn/EmbeddedExercise';

const c = Colors.light;
const SITE = 'https://vocalhabit.com';

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return LEARN_ARTICLES.map((a) => ({ slug: a.slug }));
}

export default function LearnArticlePage() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const article = LEARN_ARTICLES.find((a) => a.slug === slug);

  if (!article) {
    return (
      <View style={styles.missing}>
        <Text style={styles.h1}>Article not found</Text>
        <Link href="/learn" style={styles.backLink}>← All guides</Link>
      </View>
    );
  }

  // Inject the practice callout right after the intro (before the first H2).
  const splitAt = article.body.search(/\n## /);
  const intro = splitAt > 0 ? article.body.slice(0, splitAt) : article.body;
  const rest = splitAt > 0 ? article.body.slice(splitAt) : '';

  const url = `${SITE}/learn/${article.slug}`;
  const related = LEARN_ARTICLES.filter(
    (a) => a.slug !== article.slug && a.category === article.category,
  ).slice(0, 3);

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.metaDescription,
    dateModified: article.updated,
    mainEntityOfPage: url,
    publisher: { '@type': 'Organization', name: 'Vocal Habit', url: SITE },
  };

  return (
    <>
      <Head>
        <title>{`${article.title} | Vocal Habit`}</title>
        <meta name="description" content={article.metaDescription} />
        <link rel="canonical" href={url} />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.metaDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={url} />
        <script type="application/ld+json">{JSON.stringify(articleJsonLd)}</script>
      </Head>

      <ScrollView style={styles.page} contentContainerStyle={styles.content}>
        <View style={styles.col}>
          <Link href="/learn" style={styles.backLink}>← All guides</Link>

          <MarkdownView content={intro} />
          <EmbeddedExercise exerciseId={article.embeddedExerciseId} />
          {rest ? <MarkdownView content={rest} /> : null}

          {related.length > 0 && (
            <View style={styles.related}>
              <Text style={styles.relatedTitle}>Related guides</Text>
              {related.map((r) => (
                <Link key={r.slug} href={{ pathname: '/learn/[slug]', params: { slug: r.slug } }} style={styles.relatedLink}>
                  {r.title}
                </Link>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: c.bgCanvas },
  content: { paddingVertical: Spacing['2xl'], paddingHorizontal: Spacing.lg },
  col: { width: '100%', maxWidth: 720, alignSelf: 'center', gap: Spacing.md },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, backgroundColor: c.bgCanvas },
  h1: {
    fontFamily: Fonts.displaySemibold,
    fontSize: Typography['2xl'].size,
    lineHeight: Typography['2xl'].lineHeight,
    color: c.textPrimary,
  },
  backLink: {
    fontFamily: Fonts.bodyMedium,
    fontSize: Typography.sm.size,
    color: c.accent,
  },
  related: {
    marginTop: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: c.borderSubtle,
    paddingTop: Spacing.lg,
    gap: Spacing.sm,
  },
  relatedTitle: {
    fontFamily: Fonts.displayMedium,
    fontSize: Typography.lg.size,
    lineHeight: Typography.lg.lineHeight,
    color: c.textPrimary,
  },
  relatedLink: {
    fontFamily: Fonts.bodyMedium,
    fontSize: Typography.base.size,
    lineHeight: Typography.md.lineHeight,
    color: c.accent,
  },
});
