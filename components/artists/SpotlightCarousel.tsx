import { Link } from 'expo-router';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Radii, Spacing, Typography } from '@/constants/theme';
import { ARTIST_PROFILES } from '@/content/artist-profiles/profiles.generated';

const c = Colors.light;

// Draft-gate matches the artists/[slug] route: drafts surface on preview builds only.
const INCLUDE_DRAFTS = process.env.EXPO_PUBLIC_INCLUDE_DRAFTS === '1';

const SPOTLIGHTS = ARTIST_PROFILES
  .filter((p) => INCLUDE_DRAFTS || p.status !== 'draft')
  .sort((a, b) => (b.published || '').localeCompare(a.published || ''));

// "Latest Artist Spotlights" — a newest-first row of hero cards on the Learn hub.
// Cards lead with the spotlight's hero photo (CC-licensed, credited on the article
// page) and fall back to the typographic treatment when a profile has no image.
// Renders nothing when there are no visible spotlights.
export default function SpotlightCarousel() {
  if (SPOTLIGHTS.length === 0) return null;
  return (
    <View style={styles.section}>
      <View style={styles.headRow}>
        <Text style={styles.eyebrow}>ARTIST SPOTLIGHTS</Text>
        <Text style={styles.sub}>How the pros sing it — and how to practice it</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {SPOTLIGHTS.map((p) => (
          <Link key={p.slug} href={{ pathname: '/artists/[slug]', params: { slug: p.slug } }} style={styles.cardLink}>
            <View style={styles.card}>
              {p.heroImage ? (
                <Image
                  source={{ uri: p.heroImage }}
                  style={styles.cardImage}
                  accessibilityLabel={p.heroAlt || p.artist}
                />
              ) : null}
              <View style={styles.cardBody}>
                <Text style={styles.cardEyebrow}>{p.artist}</Text>
                <Text style={styles.cardTitle}>{p.heroHeadline || p.title}</Text>
                <Text style={styles.cardDate}>{p.published}</Text>
              </View>
            </View>
          </Link>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.sm, marginTop: Spacing.xs },
  headRow: { gap: Spacing['3xs'] },
  eyebrow: { fontFamily: Fonts.bodyMedium, fontSize: Typography.xs.size, letterSpacing: 0.5, color: c.textTertiary },
  sub: { fontFamily: Fonts.body, fontSize: Typography.sm.size, color: c.textSecondary },
  row: { gap: Spacing.sm, paddingVertical: Spacing['2xs'], paddingRight: Spacing.lg },
  cardLink: { borderRadius: Radii.md },
  card: {
    width: 240,
    backgroundColor: c.bgEmphasis,
    borderWidth: 1,
    borderColor: c.borderOnEmphasis,
    borderRadius: Radii.md,
    overflow: 'hidden',
    minHeight: 132,
    justifyContent: 'flex-end',
  },
  cardImage: { width: '100%', aspectRatio: 16 / 9, backgroundColor: c.bgEmphasis },
  cardBody: { padding: Spacing.md, gap: Spacing['2xs'], flexGrow: 1, justifyContent: 'flex-end' },
  cardEyebrow: { fontFamily: Fonts.bodyMedium, fontSize: Typography.xs.size, letterSpacing: 0.5, color: c.accentOnEmphasis },
  cardTitle: {
    fontFamily: Fonts.displaySemibold,
    fontSize: Typography.lg.size,
    lineHeight: Typography.lg.lineHeight,
    color: c.textOnEmphasis,
  },
  cardDate: { fontFamily: Fonts.mono, fontSize: Typography.xs.size, color: c.textOnEmphasisDim },
});
