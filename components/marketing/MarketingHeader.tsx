import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Spacing, Typography } from '@/constants/theme';

// Slim brand header for the static content section (/learn, /learn/[slug],
// /vocal-range-test, /artists/[slug]). These routes sit outside the app's
// (tabs) group so they have no tab bar; this gives the section consistent chrome
// and — importantly — a link back into the app (the wordmark and the CTA both go
// to "/"). SSG-safe: Colors.light + Link + system-font fallback for Fraunces.

const c = Colors.light;

export default function MarketingHeader() {
  return (
    <View style={styles.bar}>
      <View style={styles.inner}>
        <Link href="/" style={styles.brandLink} accessibilityLabel="Vocal Habit home">
          <Text style={styles.brand}>Vocal Habit</Text>
        </Link>
        <Link href="/" style={styles.ctaLink}>
          <Text style={styles.cta}>Practice →</Text>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: c.bgCanvas,
    borderBottomWidth: 1,
    borderBottomColor: c.borderSubtle,
  },
  inner: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  brandLink: { textDecorationLine: 'none' },
  brand: {
    fontFamily: Fonts.displaySemibold,
    fontSize: Typography.lg.size,
    lineHeight: Typography.lg.lineHeight,
    color: c.textPrimary,
  },
  ctaLink: { textDecorationLine: 'none' },
  cta: {
    fontFamily: Fonts.bodySemibold,
    fontSize: Typography.base.size,
    color: c.accent,
  },
});
