import { createElement } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { Colors, Fonts, Radii, Spacing, Typography } from '@/constants/theme';

const c = Colors.light;

// Embedded vocal-coach analysis. On web (the only built target) renders a real
// lazy YouTube iframe via React DOM; native gets a tap-to-open fallback. The
// coach is credited + linked. Privacy-enhanced (youtube-nocookie) + loading=lazy
// so marketing routes stay light.
export default function CoachVideo({ id, by, title }: { id: string; by?: string; title?: string }) {
  const watch = `https://www.youtube.com/watch?v=${id}`;
  return (
    <View style={styles.wrap}>
      <View style={styles.frame}>
        {Platform.OS === 'web'
          ? createElement('iframe', {
              src: `https://www.youtube-nocookie.com/embed/${id}`,
              title: title || 'Vocal coach analysis',
              loading: 'lazy',
              allowFullScreen: true,
              allow: 'accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
              style: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 },
            })
          : (
            <Pressable accessibilityRole="button" accessibilityLabel={`Watch ${title ?? 'video'} on YouTube`}
              onPress={() => Linking.openURL(watch)} style={styles.fallback}>
              <Text style={styles.fallbackText}>▶ Watch on YouTube</Text>
            </Pressable>
          )}
      </View>
      {(by || title) && (
        <Text style={styles.caption} accessibilityRole="link" onPress={() => Linking.openURL(watch)}>
          {title ? `“${title}” ` : ''}{by ? `— ${by}` : ''}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginVertical: Spacing.md, gap: Spacing.xs },
  frame: {
    position: 'relative',
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: Radii.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: c.borderStrong,
    backgroundColor: c.bgEmphasisInset,
  },
  fallback: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  fallbackText: { fontFamily: Fonts.bodySemibold, fontSize: Typography.base.size, color: c.accentOnEmphasis },
  caption: {
    fontFamily: Fonts.bodyMedium,
    fontSize: Typography.sm.size,
    lineHeight: Typography.sm.lineHeight,
    color: c.textSecondary,
  },
});
