import { Link, type Href } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Radii, Spacing, Typography } from '@/constants/theme';

// Static, crawlable homepage intro. Rendered at SSG (and during the first-paint
// font/onboarding hold) so "/" — the root, where links + brand searches land —
// ships real HTML: an <h1>, an intro paragraph, and an internal-link hub to the
// content pages. The interactive Practice app replaces it once the app hydrates.
// Self-contained + system-font-safe (custom fonts enhance, never gate). See
// seo/indexability-analysis-2026-07-06.md.

const c = Colors.light;

interface ExploreLink {
  href: Href;
  title: string;
  desc: string;
}

const EXPLORE: ExploreLink[] = [
  {
    href: '/vocal-range-test',
    title: 'Vocal Range Test',
    desc: 'Sing a few notes to find your range and likely voice type — free, in your browser.',
  },
  {
    href: '/learn/',
    title: 'Learn to Sing',
    desc: 'Free, science-backed guides — warm-ups, breathing, mix, belt, vibrato and pitch.',
  },
  {
    href: '/artists/freddie-mercury',
    title: 'Singer Spotlights',
    desc: 'How great voices actually work, with drills you can practice — Freddie Mercury, Chappell Roan.',
  },
];

// Curated so the homepage's raw HTML links straight to the strongest guides.
const POPULAR: { href: Href; label: string }[] = [
  { href: '/learn/how-to-warm-up-your-voice', label: 'How to warm up your voice' },
  { href: '/learn/sovt-exercises', label: 'SOVT exercises' },
  { href: '/learn/how-to-sing-in-tune', label: 'How to sing in tune' },
  { href: '/learn/how-to-increase-vocal-range', label: 'How to increase your vocal range' },
  { href: '/learn/vocal-warm-ups-for-beginners', label: 'Vocal warm-ups for beginners' },
];

export default function HomeHeroSEO() {
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <View style={styles.col}>
        <Text style={styles.eyebrow}>Free · No signup · Audio stays on your device</Text>

        <Text accessibilityRole="header" aria-level={1} style={styles.h1}>
          Free vocal warm-ups with real-time pitch feedback
        </Text>

        <Text style={styles.deck}>
          Vocal Habit is a free, browser-based warm-up tool. Pick a voice part, sing along to piano
          accompaniment, and get cents-accurate accuracy scoring on every note — so you can hear
          yourself improve. No signup, no subscription, and your audio never leaves your device.
        </Text>

        <Text accessibilityRole="header" aria-level={2} style={styles.h2}>
          Explore Vocal Habit
        </Text>
        <View style={styles.grid}>
          {EXPLORE.map((l) => (
            <Link key={l.title} href={l.href} style={styles.cardLink}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{l.title}</Text>
                <Text style={styles.cardDesc}>{l.desc}</Text>
              </View>
            </Link>
          ))}
        </View>

        <Text accessibilityRole="header" aria-level={2} style={styles.h2}>
          Popular guides
        </Text>
        <View style={styles.links}>
          {POPULAR.map((l) => (
            <Link key={l.label} href={l.href} style={styles.textLink}>
              {l.label}
            </Link>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: c.bgCanvas },
  content: { paddingVertical: Spacing['2xl'], paddingHorizontal: Spacing.lg },
  col: { width: '100%', maxWidth: 720, alignSelf: 'center', gap: Spacing.md },
  eyebrow: {
    fontFamily: Fonts.bodyMedium,
    fontSize: Typography.xs.size,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: c.textTertiary,
  },
  h1: {
    fontFamily: Fonts.displaySemibold,
    fontSize: Typography['2xl'].size,
    lineHeight: Typography['2xl'].lineHeight,
    color: c.textPrimary,
  },
  deck: {
    fontFamily: Fonts.body,
    fontSize: Typography.md.size,
    lineHeight: Typography.md.lineHeight,
    color: c.textSecondary,
  },
  h2: {
    fontFamily: Fonts.displayMedium,
    fontSize: Typography.xl.size,
    lineHeight: Typography.xl.lineHeight,
    color: c.textPrimary,
    marginTop: Spacing.lg,
  },
  grid: { gap: Spacing.md },
  cardLink: { textDecorationLine: 'none' },
  card: {
    backgroundColor: c.bgSurface,
    borderWidth: 1,
    borderColor: c.borderSubtle,
    borderRadius: Radii.md,
    padding: Spacing.md,
    gap: Spacing['2xs'],
  },
  cardTitle: {
    fontFamily: Fonts.displayMedium,
    fontSize: Typography.lg.size,
    lineHeight: Typography.lg.lineHeight,
    color: c.textPrimary,
  },
  cardDesc: {
    fontFamily: Fonts.body,
    fontSize: Typography.sm.size,
    lineHeight: Typography.sm.lineHeight,
    color: c.textSecondary,
  },
  links: { gap: Spacing.xs },
  textLink: {
    fontFamily: Fonts.bodyMedium,
    fontSize: Typography.base.size,
    lineHeight: Typography.md.lineHeight,
    color: c.accent,
  },
});
