import { Colors, Fonts, Motion, Radii, Spacing, Typography } from '@/constants/theme';

export type ColorScheme = 'light' | 'dark';

export type ThemeColors = typeof Colors.light | typeof Colors.dark;

export type Theme = {
  scheme: ColorScheme;
  colors: ThemeColors;
  fonts: typeof Fonts;
  typography: typeof Typography;
  spacing: typeof Spacing;
  radii: typeof Radii;
  motion: typeof Motion;
};

// Light is THE default per DESIGN.md ("cream paper is the canvas, brown reserved for emphasis cards").
// Dark mode is opt-in via a future preference toggle — never auto-follow OS, since OS-dark would
// route the canvas to warm-dark which the user explicitly rejected as "70s wood-paneling."
export function useTheme(): Theme {
  const scheme: ColorScheme = 'light';
  return {
    scheme,
    colors: Colors[scheme],
    fonts: Fonts,
    typography: Typography,
    spacing: Spacing,
    radii: Radii,
    motion: Motion,
  };
}
