import Head from 'expo-router/head';
import { Link, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Spacing, Typography } from '@/constants/theme';
import { ARTIST_PROFILES } from '@/content/artist-profiles/profiles.generated';
import SpotlightBody from '@/components/artists/SpotlightBody';
import { SITE, socialMetaTags } from '@/lib/seo/socialMeta';

const c = Colors.light;

// Draft-gate: drafts are pre-rendered only when EXPO_PUBLIC_INCLUDE_DRAFTS=1
// (set per Netlify deploy context — preview yes, production no). See plan §3e.
const INCLUDE_DRAFTS = process.env.EXPO_PUBLIC_INCLUDE_DRAFTS === '1';
const visible = (p: { status: string }) => INCLUDE_DRAFTS || p.status !== 'draft';

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  return ARTIST_PROFILES.filter(visible).map((p) => ({ slug: p.slug }));
}

export default function ArtistSpotlightPage() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const profile = ARTIST_PROFILES.find((p) => p.slug === slug);

  if (!profile || !visible(profile)) {
    return (
      <View style={styles.missing}>
        <Text style={styles.h1}>Spotlight not found</Text>
        <Link href="/learn/" style={styles.backLink}>← All guides</Link>
      </View>
    );
  }

  const url = `${SITE}/artists/${profile.slug}`;
  const pageTitle = profile.seoTitle?.trim() || `${profile.title} | Vocal Habit`;
  const shareText = profile.heroHeadline?.trim() || profile.title;

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: profile.title,
    description: profile.metaDescription,
    about: profile.artist,
    datePublished: profile.published || undefined,
    dateModified: profile.updated || profile.published || undefined,
    mainEntityOfPage: url,
    publisher: { '@type': 'Organization', name: 'Vocal Habit', url: SITE },
  };

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={profile.metaDescription} />
        <link rel="canonical" href={url} />
        {socialMetaTags({ title: profile.title, description: profile.metaDescription, url, type: 'article' })}
        <script type="application/ld+json">{JSON.stringify(articleJsonLd)}</script>
      </Head>

      <ScrollView style={styles.page} contentContainerStyle={styles.content}>
        <View style={styles.col}>
          <View style={styles.topRow}>
            <Link href="/learn/" style={styles.backLink}>← All guides</Link>
            <Text style={styles.eyebrow}>ARTIST SPOTLIGHT</Text>
          </View>

          <SpotlightBody body={profile.body} url={url} shareText={shareText} />

          <Link href="/vocal-range-test" style={styles.toolLink}>
            Find your vocal range — free test →
          </Link>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: c.bgCanvas },
  content: { paddingVertical: Spacing['2xl'], paddingHorizontal: Spacing.lg },
  col: { width: '100%', maxWidth: 720, alignSelf: 'center', gap: Spacing.md },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, backgroundColor: c.bgCanvas },
  h1: {
    fontFamily: Fonts.displaySemibold,
    fontSize: Typography['2xl'].size,
    lineHeight: Typography['2xl'].lineHeight,
    color: c.textPrimary,
  },
  eyebrow: {
    fontFamily: Fonts.bodyMedium,
    fontSize: Typography.xs.size,
    letterSpacing: 0.5,
    color: c.textTertiary,
  },
  backLink: { fontFamily: Fonts.bodyMedium, fontSize: Typography.sm.size, color: c.accent },
  toolLink: {
    fontFamily: Fonts.bodySemibold,
    fontSize: Typography.md.size,
    color: c.accent,
    marginTop: Spacing.lg,
  },
});
