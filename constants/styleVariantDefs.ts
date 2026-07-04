// DEV-ONLY variant palette/font/flourish data for the 2026-07 style revamp exploration.
// See styleVariants.ts for the machinery. Each variant restyles tokens only —
// composition/layout is out of scope by design. Fonts resolve from Google Fonts
// at runtime (dev), aliased per weight so the app's fontFamily-only styles keep
// their weight hierarchy.

import type { FontFaceSpec, StyleVariant } from './styleVariants';

// Build the Fonts overrides + fontFaces for a display/body (+ optional mono) pairing.
// displayItalic maps to the base display face — italics render via fontStyle (synthesized).
function pairing(
  display: { family: string; weights: [number, number, number] },
  body: { family: string; weights: [number, number, number] },
  mono?: { family: string; weights: [number, number] },
): { fonts: Record<string, string>; fontFaces: FontFaceSpec[] } {
  const fonts: Record<string, string> = {
    display: 'VH-Display',
    displayMedium: 'VH-Display-Medium',
    displaySemibold: 'VH-Display-Semibold',
    displayItalic: 'VH-Display',
    displayLight: 'VH-Display',
    displayLightItalic: 'VH-Display',
    body: 'VH-Body',
    bodyMedium: 'VH-Body-Medium',
    bodySemibold: 'VH-Body-Semibold',
  };
  const fontFaces: FontFaceSpec[] = [
    { alias: 'VH-Display', family: display.family, weight: display.weights[0] },
    { alias: 'VH-Display-Medium', family: display.family, weight: display.weights[1] },
    { alias: 'VH-Display-Semibold', family: display.family, weight: display.weights[2] },
    { alias: 'VH-Body', family: body.family, weight: body.weights[0] },
    { alias: 'VH-Body-Medium', family: body.family, weight: body.weights[1] },
    { alias: 'VH-Body-Semibold', family: body.family, weight: body.weights[2] },
  ];
  if (mono) {
    fonts.mono = 'VH-Mono';
    fonts.monoMedium = 'VH-Mono-Medium';
    fontFaces.push(
      { alias: 'VH-Mono', family: mono.family, weight: mono.weights[0] },
      { alias: 'VH-Mono-Medium', family: mono.family, weight: mono.weights[1] },
    );
  }
  return { fonts, fontFaces };
}

// Tonal siblings of 'conservatory' — same bone canvas / Fraunces / brass chrome,
// only the green family shifts. Pure tone comparison.
function conservatoryGreen(
  id: string,
  name: string,
  tagline: string,
  g: {
    accent: string; hover: string; muted: string;
    emphasis: string; inset: string; borderOnEmphasis: string;
    onEmphasisDim: string; success: string;
  },
): StyleVariant {
  return {
    id,
    name,
    tagline,
    colors: {
      canvas: '#faf8f4', bgCanvas: '#faf8f4', bgSurface: '#ffffff', bgElevated: '#ffffff',
      bgEmphasis: g.emphasis, bgEmphasisInset: g.inset,
      textPrimary: '#1e1b16', textSecondary: '#57534a', textTertiary: '#8b867c',
      textOnEmphasis: '#f2f1ea', textOnEmphasisDim: g.onEmphasisDim,
      borderSubtle: '#eae6dd', borderStrong: '#cfc8b8', borderOnEmphasis: g.borderOnEmphasis,
      accent: g.accent, accentHover: g.hover, accentOnEmphasis: '#d9a441',
      accentMuted: g.muted,
      success: g.success, warning: '#b07a26', error: '#a84632',
      text: '#1e1b16', background: '#faf8f4', tint: g.accent,
      icon: '#8b867c', tabIconDefault: '#8b867c', tabIconSelected: '#d9a441',
    },
    surfaceShadow: '0 1px 3px rgba(30, 27, 22, 0.06)',
    extraCSS: `::selection { background: ${g.muted.replace(/0\.\d+\)$/, '0.18)')}; }`,
  };
}

// Tonal refinements of the ORIGINAL baseline — Ryan likes its feel; these keep the
// cream/Fraunces/amber soul, lightly brighten the neutrals, add soft card shadows,
// and vary ONLY the chrome treatment (the dark brown that reads dated).
function originalTone(
  id: string,
  name: string,
  tagline: string,
  o: {
    emphasis: string; inset: string; borderOnEmphasis: string;
    textOnEmphasis: string; textOnEmphasisDim: string;
    accent: string; hover: string; accentOnEmphasis: string; muted: string;
  },
): StyleVariant {
  return {
    id,
    name,
    tagline,
    colors: {
      canvas: '#f6f1e5', bgCanvas: '#f6f1e5', bgSurface: '#fdfaf2', bgElevated: '#ffffff',
      bgEmphasis: o.emphasis, bgEmphasisInset: o.inset,
      textPrimary: '#241a10', textSecondary: '#5d5040', textTertiary: '#93867a',
      textOnEmphasis: o.textOnEmphasis, textOnEmphasisDim: o.textOnEmphasisDim,
      borderSubtle: '#ece3cf', borderStrong: '#d2c3a6', borderOnEmphasis: o.borderOnEmphasis,
      accent: o.accent, accentHover: o.hover, accentOnEmphasis: o.accentOnEmphasis,
      accentMuted: o.muted,
      success: '#5a8a5a', warning: '#b07020', error: '#a04030',
      text: '#241a10', background: '#f6f1e5', tint: o.accent,
      icon: '#93867a', tabIconDefault: '#93867a', tabIconSelected: o.accentOnEmphasis,
    },
    surfaceShadow: '0 1px 3px rgba(36, 27, 15, 0.06)',
    extraCSS: `::selection { background: ${o.muted.replace(/0\.\d+\)$/, '0.20)')}; }`,
  };
}

// Parchment chrome (Ryan's pick) but with a BRIGHT orange secondary carrying the
// color: warmer eyebrow labels + stronger chip/tab tints + a vivid orange accent.
// Everything else identical to original-parchment so it's a pure "how orange" comparison.
function parchmentOrange(
  id: string,
  name: string,
  tagline: string,
  p: { accent: string; hover: string; onBand: string; tertiary: string; muted: string },
): StyleVariant {
  return {
    id,
    name,
    tagline,
    colors: {
      canvas: '#f6f1e5', bgCanvas: '#f6f1e5', bgSurface: '#fdfaf2', bgElevated: '#ffffff',
      bgEmphasis: '#efe6d1', bgEmphasisInset: '#e6dabf',
      textPrimary: '#241a10', textSecondary: '#5d5040', textTertiary: p.tertiary,
      textOnEmphasis: '#2f2415', textOnEmphasisDim: '#7d6f5a',
      borderSubtle: '#ece3cf', borderStrong: '#d2c3a6', borderOnEmphasis: '#d8c9a8',
      accent: p.accent, accentHover: p.hover, accentOnEmphasis: p.onBand,
      accentMuted: p.muted,
      success: '#5a8a5a', warning: '#b07020', error: '#a04030',
      text: '#241a10', background: '#f6f1e5', tint: p.accent,
      icon: p.tertiary, tabIconDefault: '#93867a', tabIconSelected: p.onBand,
    },
    surfaceShadow: '0 1px 3px rgba(36, 27, 15, 0.06)',
    extraCSS: `::selection { background: ${p.muted.replace(/0\.\d+\)$/, '0.22)')}; }`,
  };
}

export const STYLE_VARIANTS: Record<string, StyleVariant> = {
  'parchment-amber': parchmentOrange(
    'parchment-amber',
    'Parchment — Amber Pop',
    'Parchment chrome + a brighter, cleaner amber-orange accent; closest to current, just louder',
    {
      accent: '#e07d1c', hover: '#c26814', onBand: '#b5610f',
      tertiary: '#9c7c55', muted: 'rgba(224, 125, 28, 0.14)',
    },
  ),
  'parchment-tangerine': parchmentOrange(
    'parchment-tangerine',
    'Parchment — Tangerine',
    'Parchment chrome + a punchy true-orange accent; the clearest orange pop',
    {
      accent: '#ee6f13', hover: '#cf5e0e', onBand: '#bf5a0e',
      tertiary: '#a07845', muted: 'rgba(238, 111, 19, 0.15)',
    },
  ),
  'parchment-persimmon': parchmentOrange(
    'parchment-persimmon',
    'Parchment — Persimmon',
    'Parchment chrome + a warm red-orange accent; most saturated, most energetic',
    {
      accent: '#e2551f', hover: '#c34619', onBand: '#bd4a1c',
      tertiary: '#a5754a', muted: 'rgba(226, 85, 31, 0.15)',
    },
  ),

  'original-ember': originalTone(
    'original-ember',
    'Original — Ember',
    'Chrome flips brown → deep burnt ORANGE; unmistakably orange, still dark enough to anchor',
    {
      emphasis: '#7d3a0d', inset: '#632d09', borderOnEmphasis: '#9c5220',
      textOnEmphasis: '#fdf3e3', textOnEmphasisDim: '#e3b48c',
      accent: '#a3630f', hover: '#86500c', accentOnEmphasis: '#ffb64e',
      muted: 'rgba(163, 99, 15, 0.10)',
    },
  ),
  'original-copper': originalTone(
    'original-copper',
    'Original — Copper',
    'Midtone copper-orange chrome — lighter and livelier than ember',
    {
      emphasis: '#a05a1e', inset: '#86490f', borderOnEmphasis: '#bd7935',
      textOnEmphasis: '#fff4e4', textOnEmphasisDim: '#ecc9a0',
      accent: '#b45a1f', hover: '#96491a', accentOnEmphasis: '#ffc27a',
      muted: 'rgba(180, 90, 31, 0.10)',
    },
  ),
  'original-toffee': originalTone(
    'original-toffee',
    'Original — Toffee',
    'Keeps the brown family but lifts it — warmer, lighter, less wood-panel',
    {
      emphasis: '#4b3a27', inset: '#3b2d1d', borderOnEmphasis: '#6b563c',
      textOnEmphasis: '#f7f0e2', textOnEmphasisDim: '#cbb99e',
      accent: '#a86a24', hover: '#8d5818', accentOnEmphasis: '#e8a344',
      muted: 'rgba(168, 106, 36, 0.10)',
    },
  ),
  'original-parchment': originalTone(
    'original-parchment',
    'Original — Parchment',
    'No dark bar at all — light parchment chrome, amber active states; the brightest read',
    {
      emphasis: '#efe6d1', inset: '#e6dabf', borderOnEmphasis: '#d8c9a8',
      textOnEmphasis: '#2f2415', textOnEmphasisDim: '#7d6f5a',
      accent: '#a86a24', hover: '#8d5818', accentOnEmphasis: '#a3630f',
      muted: 'rgba(168, 106, 36, 0.10)',
    },
  ),

  'conservatory-spruce': conservatoryGreen(
    'conservatory-spruce',
    'Conservatory — Spruce',
    'Deeper, cooler, blue-leaning green',
    {
      accent: '#1e5a48', hover: '#174637', muted: 'rgba(30, 90, 72, 0.10)',
      emphasis: '#12251f', inset: '#0c1a15', borderOnEmphasis: '#29423a',
      onEmphasisDim: '#9cb1a7', success: '#3f8266',
    },
  ),
  'conservatory-moss': conservatoryGreen(
    'conservatory-moss',
    'Conservatory — Moss',
    'Muted gray-green, soft and quiet',
    {
      accent: '#4a6b50', hover: '#3a5640', muted: 'rgba(74, 107, 80, 0.11)',
      emphasis: '#232e25', inset: '#19221b', borderOnEmphasis: '#3d4c3f',
      onEmphasisDim: '#aab5a8', success: '#5f8261',
    },
  ),
  'conservatory-emerald': conservatoryGreen(
    'conservatory-emerald',
    'Conservatory — Emerald',
    'Brighter, more saturated jewel green',
    {
      accent: '#14805a', hover: '#0e6647', muted: 'rgba(20, 128, 90, 0.10)',
      emphasis: '#0f2c22', inset: '#0a1f18', borderOnEmphasis: '#24473a',
      onEmphasisDim: '#98b3a6', success: '#2e9066',
    },
  ),
  'conservatory-racing': conservatoryGreen(
    'conservatory-racing',
    'Conservatory — Racing',
    'Deepest heritage green, near-British-racing',
    {
      accent: '#2c5237', hover: '#21402a', muted: 'rgba(44, 82, 55, 0.10)',
      emphasis: '#16281c', inset: '#101d14', borderOnEmphasis: '#2e4433',
      onEmphasisDim: '#a3b2a2', success: '#4a7a52',
    },
  ),

  // ── 1 ─────────────────────────────────────────────────────────────────────
  'clean-studio': {
    id: 'clean-studio',
    name: 'Clean Studio',
    tagline: 'Linear/Notion-calm neutral light — one restrained cobalt accent, soft layered shadows',
    colors: {
      canvas: '#f7f7f8', bgCanvas: '#f7f7f8', bgSurface: '#ffffff', bgElevated: '#ffffff',
      bgEmphasis: '#17171a', bgEmphasisInset: '#101013',
      textPrimary: '#1a1a1e', textSecondary: '#55555e', textTertiary: '#90909a',
      textOnEmphasis: '#f5f5f6', textOnEmphasisDim: '#a0a0ab',
      borderSubtle: '#ececef', borderStrong: '#d5d5da', borderOnEmphasis: '#33333a',
      accent: '#3056d3', accentHover: '#2445b0', accentOnEmphasis: '#7a97ff',
      accentMuted: 'rgba(48, 86, 211, 0.09)',
      success: '#178a50', warning: '#b45309', error: '#d33030',
      text: '#1a1a1e', background: '#f7f7f8', tint: '#3056d3',
      icon: '#90909a', tabIconDefault: '#90909a', tabIconSelected: '#3056d3',
    },
    ...pairing(
      { family: 'Geist', weights: [500, 600, 700] },
      { family: 'Geist', weights: [400, 500, 600] },
      { family: 'Geist Mono', weights: [400, 500] },
    ),
    radii: { sm: 8, md: 12, lg: 16 },
    surfaceShadow: '0 1px 2px rgba(20, 20, 25, 0.04), 0 4px 12px rgba(20, 20, 25, 0.05)',
    extraCSS: `::selection { background: rgba(48, 86, 211, 0.18); }`,
  },

  // ── 2 ─────────────────────────────────────────────────────────────────────
  'stage-light': {
    id: 'stage-light',
    name: 'Stage Light',
    tagline: 'WARM dark practice-room — espresso-black canvas (uncrowded: every competitor dark mode is cool), amber spotlight accent',
    colors: {
      canvas: '#171310', bgCanvas: '#171310', bgSurface: '#211b15', bgElevated: '#2a221a',
      bgEmphasis: '#2a2118', bgEmphasisInset: '#1f1811',
      textPrimary: '#f5efe6', textSecondary: '#c9bca9', textTertiary: '#8d8071',
      textOnEmphasis: '#f5efe6', textOnEmphasisDim: '#a89a86',
      borderSubtle: '#2c251d', borderStrong: '#453a2e', borderOnEmphasis: '#41362a',
      accent: '#ffb648', accentHover: '#ffc76e', accentOnEmphasis: '#ffb648',
      accentMuted: 'rgba(255, 182, 72, 0.15)',
      success: '#6fbf8f', warning: '#e8b25b', error: '#e57a63',
      text: '#f5efe6', background: '#171310', tint: '#ffb648',
      icon: '#8d8071', tabIconDefault: '#8d8071', tabIconSelected: '#ffb648',
    },
    ...pairing(
      { family: 'Space Grotesk', weights: [500, 600, 700] },
      { family: 'Figtree', weights: [400, 500, 600] },
    ),
    radii: { sm: 6, md: 12, lg: 16 },
    canvasBackgroundImage: 'radial-gradient(1200px 500px at 50% -100px, rgba(255, 182, 72, 0.07), rgba(255, 182, 72, 0) 70%)',
    surfaceShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.03), 0 8px 24px rgba(0, 0, 0, 0.35)',
    extraCSS: `::selection { background: rgba(255, 182, 72, 0.3); }`,
  },

  // ── 3 ─────────────────────────────────────────────────────────────────────
  'playful-pop': {
    id: 'playful-pop',
    name: 'Playful Pop',
    tagline: 'Duolingo-energy — white canvas, chunky rounded type, tangerine accent, ledge-shadow cards',
    colors: {
      canvas: '#fbfaf7', bgCanvas: '#fbfaf7', bgSurface: '#ffffff', bgElevated: '#ffffff',
      bgEmphasis: '#12455f', bgEmphasisInset: '#0d374c',
      textPrimary: '#3c3c3c', textSecondary: '#6f6f6f', textTertiary: '#afafaf',
      textOnEmphasis: '#f2fbff', textOnEmphasisDim: '#9cc3d5',
      borderSubtle: '#e5e5e5', borderStrong: '#d0d0d0', borderOnEmphasis: '#1f5d7d',
      accent: '#ea6a12', accentHover: '#cc5a0d', accentOnEmphasis: '#ffb35c',
      accentMuted: 'rgba(234, 106, 18, 0.12)',
      success: '#46a302', warning: '#d19700', error: '#e03e3e',
      text: '#3c3c3c', background: '#fbfaf7', tint: '#ea6a12',
      icon: '#afafaf', tabIconDefault: '#afafaf', tabIconSelected: '#ea6a12',
    },
    ...pairing(
      { family: 'Baloo 2', weights: [600, 700, 800] },
      { family: 'Nunito', weights: [500, 600, 700] },
    ),
    radii: { sm: 10, md: 16, lg: 20 },
    surfaceShadow: '0 2px 0 #e5e5e5',
    extraCSS: `::selection { background: rgba(234, 106, 18, 0.2); }`,
  },

  // ── 4 ─────────────────────────────────────────────────────────────────────
  'morning-mist': {
    id: 'morning-mist',
    name: 'Morning Mist',
    tagline: 'Headspace/Calm wellness — misty blue-gray wash, soft coral accent, big soft shadows',
    colors: {
      canvas: '#eef3f6', bgCanvas: '#eef3f6', bgSurface: '#ffffff', bgElevated: '#ffffff',
      bgEmphasis: '#27384a', bgEmphasisInset: '#1e2c3b',
      textPrimary: '#22303e', textSecondary: '#5b6b7a', textTertiary: '#93a2b0',
      textOnEmphasis: '#f2f7fa', textOnEmphasisDim: '#a8bac9',
      borderSubtle: '#dfe7ec', borderStrong: '#c2cfd8', borderOnEmphasis: '#3d5165',
      accent: '#d64f31', accentHover: '#b83f24', accentOnEmphasis: '#ff9c82',
      accentMuted: 'rgba(214, 79, 49, 0.10)',
      success: '#4e8d6e', warning: '#c98a2d', error: '#cf4f3f',
      text: '#22303e', background: '#eef3f6', tint: '#d64f31',
      icon: '#93a2b0', tabIconDefault: '#93a2b0', tabIconSelected: '#d64f31',
    },
    ...pairing(
      { family: 'Bricolage Grotesque', weights: [500, 600, 700] },
      { family: 'DM Sans', weights: [400, 500, 600] },
    ),
    radii: { sm: 8, md: 14, lg: 18 },
    canvasBackgroundImage: 'linear-gradient(180deg, #e6eef4 0%, #f2f6f8 320px, #eef3f6 100%)',
    surfaceShadow: '0 6px 20px rgba(39, 56, 74, 0.07)',
    extraCSS: `::selection { background: rgba(214, 79, 49, 0.18); }`,
  },

  // ── 5 ─────────────────────────────────────────────────────────────────────
  'ink-verse': {
    id: 'ink-verse',
    name: 'Ink & Verse',
    tagline: 'Music-journal editorial — white, black ink, red accent, Instrument Serif display, hairlines, no shadows',
    colors: {
      canvas: '#fdfcf9', bgCanvas: '#fdfcf9', bgSurface: '#faf9f4', bgElevated: '#ffffff',
      bgEmphasis: '#111111', bgEmphasisInset: '#000000',
      textPrimary: '#141414', textSecondary: '#4c4c48', textTertiary: '#8b8b85',
      textOnEmphasis: '#f7f7f4', textOnEmphasisDim: '#a3a39c',
      borderSubtle: '#e4e4e0', borderStrong: '#b9b9b4', borderOnEmphasis: '#333330',
      accent: '#c92a2a', accentHover: '#a51f1f', accentOnEmphasis: '#ff6b6b',
      accentMuted: 'rgba(201, 42, 42, 0.08)',
      success: '#2f7d4f', warning: '#a86a00', error: '#c92a2a',
      text: '#141414', background: '#fdfcf9', tint: '#c92a2a',
      icon: '#8b8b85', tabIconDefault: '#8b8b85', tabIconSelected: '#c92a2a',
    },
    ...pairing(
      { family: 'Instrument Serif', weights: [400, 400, 400] },
      { family: 'Public Sans', weights: [400, 500, 600] },
      { family: 'IBM Plex Mono', weights: [400, 500] },
    ),
    radii: { sm: 3, md: 6, lg: 10 },
    extraCSS: `::selection { background: rgba(201, 42, 42, 0.15); }\n[role="heading"] { letter-spacing: -0.01em; }`,
  },

  // ── 6 ─────────────────────────────────────────────────────────────────────
  'conservatory': {
    id: 'conservatory',
    name: 'Modern Conservatory',
    tagline: 'The bridge — keeps Fraunces + warmth, swaps 70s brown/amber for pine green + brass',
    colors: {
      canvas: '#faf8f4', bgCanvas: '#faf8f4', bgSurface: '#ffffff', bgElevated: '#ffffff',
      bgEmphasis: '#1b2f26', bgEmphasisInset: '#142219',
      textPrimary: '#1e1b16', textSecondary: '#57534a', textTertiary: '#8b867c',
      textOnEmphasis: '#f2f1ea', textOnEmphasisDim: '#a7b5a9',
      borderSubtle: '#eae6dd', borderStrong: '#cfc8b8', borderOnEmphasis: '#33473c',
      accent: '#2e6b4f', accentHover: '#24543e', accentOnEmphasis: '#d9a441',
      accentMuted: 'rgba(46, 107, 79, 0.10)',
      success: '#4c8a62', warning: '#b07a26', error: '#a84632',
      text: '#1e1b16', background: '#faf8f4', tint: '#2e6b4f',
      icon: '#8b867c', tabIconDefault: '#8b867c', tabIconSelected: '#d9a441',
    },
    // Keeps the existing Fraunces / General Sans / JetBrains stack — palette-only variant.
    surfaceShadow: '0 1px 3px rgba(30, 27, 22, 0.06)',
    extraCSS: `::selection { background: rgba(46, 107, 79, 0.15); }`,
  },

  // ── 7 ─────────────────────────────────────────────────────────────────────
  'aurora': {
    id: 'aurora',
    name: 'Aurora',
    tagline: 'Spotify-adjacent dark — neutral charcoal, spring-green accent, twin color glows up top',
    colors: {
      canvas: '#101014', bgCanvas: '#101014', bgSurface: '#17171c', bgElevated: '#1f1f26',
      bgEmphasis: '#1d1d25', bgEmphasisInset: '#15151b',
      textPrimary: '#f4f4f6', textSecondary: '#b6b6c2', textTertiary: '#7e7e8c',
      textOnEmphasis: '#f4f4f6', textOnEmphasisDim: '#9c9cab',
      borderSubtle: '#24242c', borderStrong: '#3a3a46', borderOnEmphasis: '#32323e',
      accent: '#2fd980', accentHover: '#4ce596', accentOnEmphasis: '#2fd980',
      accentMuted: 'rgba(47, 217, 128, 0.14)',
      success: '#43c977', warning: '#e8b23e', error: '#f26d6d',
      text: '#f4f4f6', background: '#101014', tint: '#2fd980',
      icon: '#7e7e8c', tabIconDefault: '#7e7e8c', tabIconSelected: '#2fd980',
    },
    ...pairing(
      { family: 'Outfit', weights: [500, 600, 700] },
      { family: 'Onest', weights: [400, 500, 600] },
    ),
    radii: { sm: 6, md: 12, lg: 18 },
    canvasBackgroundImage:
      'radial-gradient(900px 420px at 15% -80px, rgba(47, 217, 128, 0.08), rgba(47, 217, 128, 0) 60%), radial-gradient(900px 420px at 85% -80px, rgba(66, 153, 255, 0.07), rgba(66, 153, 255, 0) 60%)',
    surfaceShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
    extraCSS: `::selection { background: rgba(47, 217, 128, 0.25); }`,
  },

  // ── 8 ─────────────────────────────────────────────────────────────────────
  'riso-press': {
    id: 'riso-press',
    name: 'Riso Press',
    tagline: 'Zine/neo-brutal-lite — uncoated paper, black outlines, riso blue accent, hard offset shadows',
    colors: {
      canvas: '#f6f3ec', bgCanvas: '#f6f3ec', bgSurface: '#fffdf7', bgElevated: '#fffdf7',
      bgEmphasis: '#17161c', bgEmphasisInset: '#0f0e13',
      textPrimary: '#1b1a20', textSecondary: '#4a4852', textTertiary: '#85828e',
      textOnEmphasis: '#f6f3ec', textOnEmphasisDim: '#a6a3b0',
      borderSubtle: '#c9c3b4', borderStrong: '#1b1a20', borderOnEmphasis: '#38363f',
      accent: '#274bdb', accentHover: '#1c38b3', accentOnEmphasis: '#7d92ff',
      accentMuted: 'rgba(39, 75, 219, 0.10)',
      success: '#1f8a4c', warning: '#e8590c', error: '#d6336c',
      text: '#1b1a20', background: '#f6f3ec', tint: '#274bdb',
      icon: '#85828e', tabIconDefault: '#85828e', tabIconSelected: '#7d92ff',
    },
    ...pairing(
      { family: 'Archivo', weights: [600, 700, 800] },
      { family: 'Archivo', weights: [400, 500, 600] },
      { family: 'Space Mono', weights: [400, 700] },
    ),
    radii: { sm: 2, md: 4, lg: 8 },
    surfaceShadow: '3px 3px 0 rgba(27, 26, 32, 0.9)',
    extraCSS: `::selection { background: rgba(39, 75, 219, 0.18); }`,
  },

  // ── 9 ─────────────────────────────────────────────────────────────────────
  'blush': {
    id: 'blush',
    name: 'Blush',
    tagline: 'Soft-pop warm — blush paper, raspberry accent, DM Serif display, feminine-leaning polish',
    colors: {
      canvas: '#faf3ef', bgCanvas: '#faf3ef', bgSurface: '#fffbf9', bgElevated: '#ffffff',
      bgEmphasis: '#43242b', bgEmphasisInset: '#331a20',
      textPrimary: '#33232a', textSecondary: '#6e5560', textTertiary: '#a18a93',
      textOnEmphasis: '#fbeef0', textOnEmphasisDim: '#cfa4ad',
      borderSubtle: '#f0e2dc', borderStrong: '#d9beb4', borderOnEmphasis: '#5d3841',
      accent: '#c22f58', accentHover: '#a02347', accentOnEmphasis: '#f28cab',
      accentMuted: 'rgba(194, 47, 88, 0.09)',
      success: '#4e8d6e', warning: '#bb7b2c', error: '#c0392b',
      text: '#33232a', background: '#faf3ef', tint: '#c22f58',
      icon: '#a18a93', tabIconDefault: '#a18a93', tabIconSelected: '#f28cab',
    },
    ...pairing(
      { family: 'DM Serif Display', weights: [400, 400, 400] },
      { family: 'Karla', weights: [400, 500, 700] },
    ),
    radii: { sm: 8, md: 12, lg: 18 },
    canvasBackgroundImage: 'linear-gradient(180deg, #fbeee8 0%, #faf3ef 280px)',
    surfaceShadow: '0 4px 16px rgba(67, 36, 43, 0.07)',
    extraCSS: `::selection { background: rgba(194, 47, 88, 0.15); }`,
  },

  // ── 11 (bonus — research-backed evolution of the current identity) ────────
  'warm-studio': {
    id: 'warm-studio',
    name: 'Warm Studio',
    tagline: 'Keeps the cream/Fraunces soul — cleaner neutral ramp, paper grain, accent flips brass→coral (tests: is it the brown-ness or the warmth that reads dated?)',
    colors: {
      canvas: '#f7f1e6', bgCanvas: '#f7f1e6', bgSurface: '#fdf9f1', bgElevated: '#ffffff',
      bgEmphasis: '#241c15', bgEmphasisInset: '#1a140e',
      textPrimary: '#241c15', textSecondary: '#5f5344', textTertiary: '#94897a',
      textOnEmphasis: '#f7f1e6', textOnEmphasisDim: '#bfae97',
      borderSubtle: '#ece4d3', borderStrong: '#d0c3aa', borderOnEmphasis: '#453a2e',
      accent: '#cf4a32', accentHover: '#b03a25', accentOnEmphasis: '#ff8f73',
      accentMuted: 'rgba(207, 74, 50, 0.09)',
      success: '#4c7a5c', warning: '#b07a26', error: '#c0392b',
      text: '#241c15', background: '#f7f1e6', tint: '#cf4a32',
      icon: '#94897a', tabIconDefault: '#94897a', tabIconSelected: '#ff8f73',
    },
    // Keeps the existing Fraunces / General Sans / JetBrains stack.
    radii: { sm: 6, md: 10, lg: 14 },
    canvasBackgroundImage:
      `url("data:image/svg+xml,%3Csvg width='180' height='180' viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.045'/%3E%3C/svg%3E")`,
    surfaceShadow: '0 1px 2px rgba(36, 28, 21, 0.05), 0 6px 16px rgba(36, 28, 21, 0.05)',
    extraCSS: `::selection { background: rgba(207, 74, 50, 0.16); }`,
  },

  // ── 10 ────────────────────────────────────────────────────────────────────
  'coach-pro': {
    id: 'coach-pro',
    name: 'Coach Pro',
    tagline: 'Strava-athletic — cool slate neutrals, hot training-orange accent, data-forward crispness',
    colors: {
      canvas: '#f4f6f7', bgCanvas: '#f4f6f7', bgSurface: '#ffffff', bgElevated: '#ffffff',
      bgEmphasis: '#0e1a24', bgEmphasisInset: '#091219',
      textPrimary: '#16232e', textSecondary: '#4c6172', textTertiary: '#8399a9',
      textOnEmphasis: '#eef4f8', textOnEmphasisDim: '#8fa3b3',
      borderSubtle: '#e2e8ec', borderStrong: '#c3cfd8', borderOnEmphasis: '#24384a',
      accent: '#d64510', accentHover: '#b53a0d', accentOnEmphasis: '#ff8a5c',
      accentMuted: 'rgba(214, 69, 16, 0.10)',
      success: '#1e8e5a', warning: '#c07f16', error: '#d63c30',
      text: '#16232e', background: '#f4f6f7', tint: '#d64510',
      icon: '#8399a9', tabIconDefault: '#8399a9', tabIconSelected: '#ff8a5c',
    },
    ...pairing(
      { family: 'Hanken Grotesk', weights: [600, 700, 800] },
      { family: 'Hanken Grotesk', weights: [400, 500, 600] },
    ),
    radii: { sm: 6, md: 10, lg: 14 },
    surfaceShadow: '0 1px 2px rgba(14, 26, 36, 0.06), 0 3px 8px rgba(14, 26, 36, 0.05)',
    extraCSS: `::selection { background: rgba(214, 69, 16, 0.15); }\n[role="heading"] { letter-spacing: -0.015em; }`,
  },
};
