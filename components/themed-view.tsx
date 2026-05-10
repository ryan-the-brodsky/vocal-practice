import { View, type ViewProps } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({ style, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  const t = useTheme();
  const backgroundColor = t.scheme === 'light'
    ? (lightColor ?? t.colors.canvas)
    : (darkColor ?? t.colors.canvas);

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
