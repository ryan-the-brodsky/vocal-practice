// Floating "Send feedback" pill — bottom-right on every screen, links to the Google Form.
import { Linking, Platform, Pressable, StyleSheet, Text, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { useTheme } from '@/hooks/use-theme';
import { Radii, Spacing, Typography } from '@/constants/theme';

const FEEDBACK_URL = 'https://forms.gle/ZKmozH8Koyq84i9J8';
const TAB_BAR_HEIGHT = 60; // mirrors app/(tabs)/_layout.tsx content height

export default function FeedbackButton() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  // The tab bar sits at the bottom below 768 px (see (tabs)/_layout.tsx) — lift the
  // pill above it there; on wider layouts the bar is at the top, so the bottom is clear.
  const bottom =
    width < 768
      ? TAB_BAR_HEIGHT + insets.bottom + Spacing.md
      : insets.bottom + Spacing.lg;

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel="Send feedback"
      onPress={() => Linking.openURL(FEEDBACK_URL)}
      style={({ pressed }) => [
        styles.pill,
        {
          right: Spacing.lg,
          bottom,
          backgroundColor: pressed ? colors.accentHover : colors.accent,
        },
      ]}
    >
      <MaterialIcons name="chat-bubble-outline" size={16} color={colors.canvas} />
      <Text style={[styles.label, { color: colors.canvas }]}>Feedback</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.pill,
    // Lifts the pill off the canvas so it reads as a floating control.
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(29, 19, 10, 0.18)' } as object,
      default: {
        shadowColor: '#1d130a',
        shadowOpacity: 0.18,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 4,
      },
    }),
  },
  label: {
    fontSize: Typography.sm.size,
    lineHeight: Typography.sm.lineHeight,
    fontFamily: 'GeneralSans-Medium',
  },
});
