import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Radii, Spacing, Typography } from '@/constants/theme';

const c = Colors.light;

// Static prefilled share row. Real share-intent links (open client-side) +
// copy-link. The OG/Twitter <head> tags make the shared preview show the hero.
export default function ShareRow({ url, text }: { url: string; text: string }) {
  const [copied, setCopied] = useState(false);
  const enc = encodeURIComponent;
  const targets: { label: string; href: string }[] = [
    { label: 'X', href: `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}` },
    { label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}` },
    { label: 'Reddit', href: `https://www.reddit.com/submit?url=${enc(url)}&title=${enc(text)}` },
  ];

  const copy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => setCopied(true)).catch(() => {});
    }
  };

  return (
    <View style={styles.row}>
      <Text style={styles.label}>Share</Text>
      {targets.map((t) => (
        <Pressable key={t.label} accessibilityRole="button" accessibilityLabel={`Share on ${t.label}`}
          onPress={() => Linking.openURL(t.href)}
          style={({ pressed }) => [styles.pill, pressed && styles.pillPressed]}>
          <Text style={styles.pillText}>{t.label}</Text>
        </Pressable>
      ))}
      <Pressable accessibilityRole="button" accessibilityLabel="Copy link" onPress={copy}
        style={({ pressed }) => [styles.pill, pressed && styles.pillPressed]}>
        <Text style={styles.pillText}>{copied ? '✓ Copied' : 'Copy link'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.xs, marginVertical: Spacing.md },
  label: {
    fontFamily: Fonts.bodyMedium,
    fontSize: Typography.xs.size,
    letterSpacing: 0.5,
    color: c.textTertiary,
    marginRight: Spacing.xs,
  },
  pill: {
    backgroundColor: c.bgSurface,
    borderWidth: 1,
    borderColor: c.borderSubtle,
    borderRadius: Radii.pill,
    paddingVertical: Spacing['2xs'],
    paddingHorizontal: Spacing.sm,
    minHeight: 36,
    justifyContent: 'center',
  },
  pillPressed: { backgroundColor: c.accentMuted, borderColor: c.accent },
  pillText: { fontFamily: Fonts.bodyMedium, fontSize: Typography.sm.size, color: c.textSecondary },
});
