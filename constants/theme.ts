// Single source of truth for all design tokens — see DESIGN.md.

// Back-compat aliases preserved so existing themed primitives keep working.
export const Colors = {
  light: {
    // Canvas & surfaces
    canvas: '#f3ede0',
    bgCanvas: '#f3ede0',
    bgSurface: '#fbf7ec',
    bgElevated: '#ffffff',
    bgEmphasis: '#2c2118',
    bgEmphasisInset: '#1f1610',

    // Text
    textPrimary: '#1d130a',
    textSecondary: '#5a4d3d',
    textTertiary: '#8a7d70',
    textOnEmphasis: '#f5efe4',
    textOnEmphasisDim: '#c4b3a0',

    // Borders
    borderSubtle: '#e8dfca',
    borderStrong: '#c8b89a',
    borderOnEmphasis: '#4a3d33',

    // Accent
    accent: '#a86a24',
    accentHover: '#8d5818',
    accentOnEmphasis: '#e09238',
    accentMuted: 'rgba(168, 106, 36, 0.10)',

    // Semantic
    success: '#5a8a5a',
    warning: '#b07020',
    error: '#a04030',

    // Back-compat keys — map to nearest semantic token
    text: '#1d130a',
    background: '#f3ede0',
    tint: '#a86a24',
    icon: '#8a7d70',
    tabIconDefault: '#8a7d70',
    tabIconSelected: '#a86a24',
  },
  dark: {
    // Canvas & surfaces
    canvas: '#1a1612',
    bgCanvas: '#1a1612',
    bgSurface: '#221d17',
    bgElevated: '#2c261e',
    bgEmphasis: '#3a2c1f',
    bgEmphasisInset: '#2c2118',

    // Text
    textPrimary: '#f5efe4',
    textSecondary: '#c4b3a0',
    textTertiary: '#8a7965',
    textOnEmphasis: '#f5efe4',
    textOnEmphasisDim: '#c4b3a0',

    // Borders
    borderSubtle: '#2c261e',
    borderStrong: '#4a3d33',
    borderOnEmphasis: '#5a4536',

    // Accent
    accent: '#e09238',
    accentHover: '#f0a44a',
    accentOnEmphasis: '#f0a44a',
    accentMuted: 'rgba(224, 146, 56, 0.18)',

    // Semantic
    success: '#7ba87b',
    warning: '#d49a48',
    error: '#c2624d',

    // Back-compat keys — map to nearest semantic token
    text: '#f5efe4',
    background: '#1a1612',
    tint: '#e09238',
    icon: '#8a7965',
    tabIconDefault: '#8a7965',
    tabIconSelected: '#e09238',
  },
} as const;

// Post-load expo-font family names. Fallbacks shown while loading.
export const Fonts = {
  display: 'Fraunces_400Regular',
  displayMedium: 'Fraunces_500Medium',
  displaySemibold: 'Fraunces_600SemiBold',
  displayItalic: 'Fraunces_400Regular_Italic',
  displayLight: 'Fraunces_300Light',
  displayLightItalic: 'Fraunces_300Light_Italic',
  body: 'GeneralSans-Regular',
  bodyMedium: 'GeneralSans-Medium',
  bodySemibold: 'GeneralSans-Semibold',
  mono: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
  fallback: {
    display: 'Georgia',
    body: 'system-ui',
    mono: 'ui-monospace',
  },
} as const;

// Type scale. Each entry is { size, lineHeight, family } — spread into Text styles.
// lineHeight values are multipliers; callers multiply by size for RN: size * lineHeight.
export const Typography = {
  xs:      { size: 11, lineHeight: 15, family: 'body' as const },
  sm:      { size: 13, lineHeight: 20, family: 'body' as const },
  base:    { size: 15, lineHeight: 24, family: 'body' as const },
  md:      { size: 17, lineHeight: 26, family: 'body' as const },
  lg:      { size: 22, lineHeight: 31, family: 'body' as const },
  xl:      { size: 28, lineHeight: 34, family: 'display' as const },
  '2xl':   { size: 40, lineHeight: 44, family: 'display' as const },
  '3xl':   { size: 56, lineHeight: 59, family: 'display' as const },
  display: { size: 72, lineHeight: 72, family: 'display' as const },
  monoSm:   { size: 11, lineHeight: 15, family: 'mono' as const },
  monoBase: { size: 13, lineHeight: 20, family: 'mono' as const },
  monoMd:   { size: 16, lineHeight: 22, family: 'mono' as const },
  monoLg:   { size: 22, lineHeight: 26, family: 'mono' as const },
} as const;

// Spacing scale — base unit 4 px.
export const Spacing = {
  '3xs': 2,
  '2xs': 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 96,
} as const;

export const Radii = {
  sm: 6,
  md: 10,
  lg: 14,
  pill: 999,
} as const;

export const Motion = {
  ease: {
    enter: 'cubic-bezier(0.2, 0, 0, 1)',
    exit: 'cubic-bezier(0.4, 0, 1, 1)',
    state: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  duration: {
    micro: 100,
    short: 200,
    medium: 300,
    long: 500,
  },
} as const;
