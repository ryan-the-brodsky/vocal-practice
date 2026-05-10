import { Text, type TextProps } from 'react-native';

import { Fonts, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const t = useTheme();

  // Caller can override the color directly via lightColor/darkColor props.
  const color = t.scheme === 'light'
    ? (lightColor ?? t.colors.textPrimary)
    : (darkColor ?? t.colors.textPrimary);

  const base = {
    color,
    fontSize: Typography.base.size,
    lineHeight: Typography.base.lineHeight,
    fontFamily: Fonts.body,
  };

  const variants = {
    default: base,
    defaultSemiBold: {
      ...base,
      fontFamily: Fonts.bodySemibold,
    },
    title: {
      color,
      fontSize: Typography['2xl'].size,
      lineHeight: Typography['2xl'].lineHeight,
      fontFamily: Fonts.display,
    },
    subtitle: {
      color,
      fontSize: Typography.lg.size,
      lineHeight: Typography.lg.lineHeight,
      fontFamily: Fonts.display,
    },
    link: {
      ...base,
      color: t.colors.accent,
    },
  } as const;

  return <Text style={[variants[type], style]} {...rest} />;
}
