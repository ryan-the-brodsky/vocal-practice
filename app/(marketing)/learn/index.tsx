import { useMemo, useState } from 'react';
import Head from 'expo-router/head';
import { Link } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Colors, Fonts, Radii, Spacing, Typography } from '@/constants/theme';
import { LEARN_ARTICLES } from '@/content/learn/articles.generated';
import { capabilityMeta, isCapability, type Capability } from '@/lib/exercises/capabilities';
import { SITE, socialMetaTags } from '@/lib/seo/socialMeta';
import SpotlightCarousel from '@/components/artists/SpotlightCarousel';

const c = Colors.light;
const URL = `${SITE}/learn/`;
const TITLE = 'Learn to Sing — Free Guides & Exercises | Vocal Habit';
const DESCRIPTION =
  'Free, science-backed singing guides — warm-ups, head & chest voice, mix, belt, vibrato and pitch. Each links to a free exercise you practice in-browser.';

// Content-only tags (not exercise capabilities) get labels/order here.
const CONTENT_TAGS: Record<string, { label: string; order: number }> = {
  foundations: { label: 'Foundations', order: 20 },
  'pitch-ear': { label: 'Pitch & Ear', order: 21 },
};
const catLabel = (id: string) =>
  (isCapability(id) ? capabilityMeta(id as Capability)?.label : CONTENT_TAGS[id]?.label) ?? id;
const catOrder = (id: string) =>
  (isCapability(id) ? capabilityMeta(id as Capability)?.order : CONTENT_TAGS[id]?.order) ?? 99;

const SORTED = [...LEARN_ARTICLES].sort(
  (a, b) => catOrder(a.category) - catOrder(b.category) || a.title.localeCompare(b.title),
);
const CATEGORIES = [...new Set(SORTED.map((a) => a.category))].sort((a, b) => catOrder(a) - catOrder(b));

export default function LearnIndexPage() {
  const [query, setQuery] = useState('');
  const [activeCat, setActiveCat] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SORTED.filter((a) => {
      if (activeCat && a.category !== activeCat) return false;
      if (!q) return true;
      return (
        a.title.toLowerCase().includes(q) ||
        a.targetKeyword.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [query, activeCat]);

  return (
    <>
      <Head>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <link rel="canonical" href={URL} />
        {socialMetaTags({ title: TITLE, description: DESCRIPTION, url: URL })}
      </Head>

      <ScrollView style={styles.page} contentContainerStyle={styles.content}>
        <View style={styles.col}>
          <Text style={styles.h1}>Learn to Sing</Text>
          <Text style={styles.deck}>
            Clear, science-backed guides — no hype, no single-method dogma. Every guide links to a free
            exercise you can practice in your browser with live pitch feedback.
          </Text>

          <Link href="/vocal-range-test" style={styles.toolCardLink}>
            <View style={styles.toolCard}>
              <Text style={styles.toolBadge}>Free tool</Text>
              <Text style={styles.toolTitle}>Vocal Range Test</Text>
              <Text style={styles.toolDesc}>
                Sing your lowest and highest notes to find your range and likely voice type — right in
                your browser.
              </Text>
            </View>
          </Link>

          <SpotlightCarousel />

          <TextInput
            style={styles.search}
            placeholder="Search guides…"
            placeholderTextColor={c.textTertiary}
            value={query}
            onChangeText={setQuery}
            accessibilityLabel="Search guides"
          />

          <View style={styles.chips}>
            <Chip label="All" active={activeCat === null} onPress={() => setActiveCat(null)} />
            {CATEGORIES.map((cat) => (
              <Chip key={cat} label={catLabel(cat)} active={activeCat === cat} onPress={() => setActiveCat(cat)} />
            ))}
          </View>

          <View style={styles.grid}>
            {filtered.map((a) => (
              <Link key={a.slug} href={{ pathname: '/learn/[slug]', params: { slug: a.slug } }} style={styles.cardLink}>
                <View style={styles.card}>
                  <Text style={styles.badge}>{catLabel(a.category)}</Text>
                  <Text style={styles.cardTitle}>{a.title}</Text>
                  <Text style={styles.cardDesc}>{a.metaDescription}</Text>
                </View>
              </Link>
            ))}
            {filtered.length === 0 && <Text style={styles.empty}>No guides match that search.</Text>}
          </View>
        </View>
      </ScrollView>
    </>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  page: { backgroundColor: c.bgCanvas },
  content: { paddingVertical: Spacing['2xl'], paddingHorizontal: Spacing.lg },
  col: { width: '100%', maxWidth: 760, alignSelf: 'center', gap: Spacing.md },
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
  search: {
    backgroundColor: c.bgCanvas,
    borderWidth: 1,
    borderColor: c.borderStrong,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontFamily: Fonts.body,
    fontSize: Typography.base.size,
    color: c.textPrimary,
    marginTop: Spacing.xs,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  chip: {
    backgroundColor: c.bgSurface,
    borderWidth: 1,
    borderColor: c.borderSubtle,
    borderRadius: Radii.pill,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing['2xs'],
    minHeight: 36,
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: c.accentMuted, borderColor: c.accent },
  chipText: { fontFamily: Fonts.bodyMedium, fontSize: Typography.sm.size, color: c.textSecondary },
  chipTextActive: { color: c.accent },
  grid: { gap: Spacing.md, marginTop: Spacing.sm },
  cardLink: { textDecorationLine: 'none' },
  card: {
    backgroundColor: c.bgSurface,
    borderWidth: 1,
    borderColor: c.borderSubtle,
    borderRadius: Radii.md,
    padding: Spacing.md,
    gap: Spacing['2xs'],
  },
  badge: {
    fontFamily: Fonts.bodyMedium,
    fontSize: Typography.xs.size,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: c.accent,
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
  empty: { fontFamily: Fonts.body, fontSize: Typography.base.size, color: c.textTertiary },
  toolCardLink: { textDecorationLine: 'none', marginTop: Spacing.xs },
  toolCard: {
    backgroundColor: c.bgEmphasis,
    borderWidth: 1,
    borderColor: c.borderOnEmphasis,
    borderRadius: Radii.md,
    padding: Spacing.md,
    gap: Spacing['2xs'],
  },
  toolBadge: {
    fontFamily: Fonts.bodyMedium,
    fontSize: Typography.xs.size,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: c.accentOnEmphasis,
  },
  toolTitle: {
    fontFamily: Fonts.displayMedium,
    fontSize: Typography.lg.size,
    lineHeight: Typography.lg.lineHeight,
    color: c.textOnEmphasis,
  },
  toolDesc: {
    fontFamily: Fonts.body,
    fontSize: Typography.sm.size,
    lineHeight: Typography.sm.lineHeight,
    color: c.textOnEmphasisDim,
  },
});
