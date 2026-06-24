// COMPONENT TEST: components/practice/__tests__/MicErrorState.test.tsx (shared suite)
import { StyleSheet, View } from 'react-native';

import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface Props {
  /** 0..1 normalised input level. */
  level: number;
  /** When false the meter renders all segments grey (not listening). */
  listening: boolean;
}

const SEGMENT_COUNT = 6;

export function MicLevelMeter({ level, listening }: Props) {
  const { colors } = useTheme();

  return (
    <View
      style={styles.row}
      accessibilityLabel="Microphone input level"
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: SEGMENT_COUNT, now: Math.round(level * SEGMENT_COUNT) }}
    >
      {Array.from({ length: SEGMENT_COUNT }, (_, i) => {
        const threshold = (i + 1) / SEGMENT_COUNT;
        const filled = listening && level >= threshold;
        return (
          <View
            key={i}
            style={[
              styles.segment,
              { backgroundColor: filled ? colors.success : colors.borderStrong },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing['3xs'],
  },
  segment: {
    width: Spacing.xs,
    height: Spacing.md,
    borderRadius: Radii.sm,
  },
});
