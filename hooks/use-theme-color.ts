/**
 * Access a single color token from the current theme.
 * Supports all keys from Colors.light / Colors.dark — new and legacy.
 */

import { Colors } from '@/constants/theme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  // Light is the default per DESIGN.md; dark is a future opt-in toggle, not OS-following.
  const theme = 'light' as const;
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  }
  return Colors[theme][colorName];
}
