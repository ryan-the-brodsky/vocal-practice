// COMPONENT TEST: components/practice/__tests__/MicErrorState.test.tsx asserts
// on denied-state copy and the Retry button callback.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { Fonts, Radii, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { micErrorCopy, type MicErrorReason } from '@/lib/pitch/micError';

interface Props {
  reason: MicErrorReason;
  onRetry: () => void;
}

export function MicErrorState({ reason, onRetry }: Props) {
  const { colors } = useTheme();
  const copy = micErrorCopy(reason);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.bgSurface,
          borderColor: colors.error,
          borderLeftColor: colors.error,
        },
      ]}
      accessibilityRole="alert"
    >
      <View style={styles.header}>
        <MaterialIcons name="mic-off" size={20} color={colors.error} />
        <Text style={[styles.title, { color: colors.textPrimary, fontFamily: Fonts.bodyMedium }]}>
          {copy.title}
        </Text>
      </View>

      <Text style={[styles.body, { color: colors.textSecondary, fontFamily: Fonts.body }]}>
        {copy.body}
      </Text>

      {copy.steps && (
        <View style={styles.steps}>
          {copy.steps.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <Text style={[styles.stepNum, { color: colors.textTertiary, fontFamily: Fonts.mono }]}>
                {i + 1}.
              </Text>
              <Text style={[styles.stepText, { color: colors.textSecondary, fontFamily: Fonts.body }]}>
                {step}
              </Text>
            </View>
          ))}
        </View>
      )}

      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        accessibilityLabel="Retry microphone access"
        style={({ pressed }) => [
          styles.retryBtn,
          { backgroundColor: pressed ? colors.accentHover : colors.accent },
        ]}
      >
        <Text style={[styles.retryLabel, { color: colors.bgCanvas, fontFamily: Fonts.bodyMedium }]}>
          Retry
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radii.md,
    borderWidth: 1,
    borderLeftWidth: 3,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  title: {
    fontSize: Typography.base.size,
    lineHeight: Typography.base.lineHeight,
  },
  body: {
    fontSize: Typography.sm.size,
    lineHeight: Typography.sm.lineHeight,
  },
  steps: {
    gap: Spacing['2xs'],
  },
  stepRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  stepNum: {
    fontSize: Typography.sm.size,
    lineHeight: Typography.sm.lineHeight,
    minWidth: Spacing.md,
  },
  stepText: {
    fontSize: Typography.sm.size,
    lineHeight: Typography.sm.lineHeight,
    flex: 1,
  },
  retryBtn: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.md,
    minHeight: 36,
    justifyContent: 'center',
  },
  retryLabel: {
    fontSize: Typography.base.size,
    lineHeight: Typography.base.lineHeight,
  },
});
