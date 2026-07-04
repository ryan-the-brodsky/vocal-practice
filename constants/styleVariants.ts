// DEV-ONLY style-variant exploration harness (2026-07 palette revamp).
// Activated on web via ?vhstyle=<id> (persisted in sessionStorage; ?vhstyle=off clears).
// Mutates the exported token objects from constants/theme.ts in place at module init —
// before any consumer reads them — so every StyleSheet picks up the variant.
// No-ops entirely in production builds, on native, and in tests (no query param).

type TokenColors = Record<string, string>;

export type FontFaceSpec = {
  alias: string; // registered CSS family name, referenced by Fonts.* overrides
  family: string; // Google Fonts family name
  weight: number;
  italic?: boolean;
};

export type StyleVariant = {
  id: string;
  name: string;
  tagline: string;
  colors: Partial<TokenColors>;
  /** Overrides for Fonts.* keys — values are font-family names (aliases from fontFaces or already-loaded families). */
  fonts?: Record<string, string>;
  fontFaces?: FontFaceSpec[];
  radii?: Partial<Record<'sm' | 'md' | 'lg' | 'pill', number>>;
  /** CSS background-image applied to every canvas-colored element (texture/gradient wash). */
  canvasBackgroundImage?: string;
  /** CSS box-shadow applied to every surface-colored element (soft-card look). */
  surfaceShadow?: string;
  /** Freeform CSS injected as-is (selection color, heading letter-spacing, etc.). */
  extraCSS?: string;
};

// ---------------------------------------------------------------------------
// Variant definitions live in styleVariantDefs.ts (kept separate so the data
// file can be edited freely without touching the machinery).
// ---------------------------------------------------------------------------
import { STYLE_VARIANTS } from './styleVariantDefs';

function activeVariantId(): string | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get('vhstyle');
    if (fromQuery !== null) {
      if (fromQuery === '' || fromQuery === 'off' || fromQuery === 'default') {
        window.sessionStorage.removeItem('vhstyle');
        return null;
      }
      window.sessionStorage.setItem('vhstyle', fromQuery);
      return fromQuery;
    }
    return window.sessionStorage.getItem('vhstyle');
  } catch {
    return null;
  }
}

function hexToRgbCss(hex: string): string | null {
  const m = hex.trim().match(/^#([0-9a-f]{6})$/i);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
}

function injectStyle(id: string, css: string) {
  let el = document.getElementById(id) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement('style');
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = css;
}

// Fetch Google Fonts css2 for one family+weight and re-register it under our alias,
// so weight stays baked into the family name (the app never sets fontWeight).
async function injectAliasedFontFaces(specs: FontFaceSpec[]) {
  const chunks = await Promise.all(
    specs.map(async (s) => {
      const ital = s.italic ? 1 : 0;
      const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(s.family)}:ital,wght@${ital},${s.weight}&display=block`;
      try {
        const css = await (await fetch(url)).text();
        return css.replace(new RegExp(`font-family:\\s*'${s.family}'`, 'g'), `font-family: '${s.alias}'`);
      } catch (e) {
        console.warn(`[styleVariants] font fetch failed for ${s.family}`, e);
        return '';
      }
    }),
  );
  injectStyle('vhstyle-fonts', chunks.join('\n'));
}

// react-native-web sets backgrounds two ways: StyleSheet.create → atomic class,
// and render-time style objects → inline style attribute. Cover both: collect the
// atomic classes that set the color from CSSOM, plus a [style*=] attribute selector
// for the inline case — lets us add textures to the canvas and shadows to cards
// without touching components.
function selectorsForBackgroundColor(rgb: string): { selectors: string[]; matched: boolean } {
  const classSelectors: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue; // cross-origin (e.g. fonts) — skip
    }
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule && rule.style.backgroundColor === rgb && rule.selectorText.startsWith('.')) {
        classSelectors.push(rule.selectorText);
      }
    }
  }
  const attrSelector = `[style*="background-color: ${rgb}"]`;
  const matched = classSelectors.length > 0 || document.querySelector(attrSelector) !== null;
  return { selectors: [...classSelectors, attrSelector], matched };
}

function injectAtomicFlourishes(v: StyleVariant, colors: TokenColors) {
  const parts: string[] = [];
  let allMatched = true;
  if (v.canvasBackgroundImage) {
    const rgb = hexToRgbCss(colors.bgCanvas);
    if (rgb) {
      const { selectors, matched } = selectorsForBackgroundColor(rgb);
      allMatched &&= matched;
      parts.push(`${selectors.join(', ')} { background-image: ${v.canvasBackgroundImage}; }`);
      parts.push(`body { background-image: ${v.canvasBackgroundImage}; }`);
    }
  }
  if (v.surfaceShadow) {
    const rgb = hexToRgbCss(colors.bgSurface);
    if (rgb) {
      const { selectors, matched } = selectorsForBackgroundColor(rgb);
      allMatched &&= matched;
      parts.push(`${selectors.join(', ')} { box-shadow: ${v.surfaceShadow}; }`);
    }
  }
  if (parts.length) injectStyle('vhstyle-atomic', parts.join('\n'));
  return allMatched;
}

export function applyStyleVariantFromLocation(tokens: {
  Colors: { light: TokenColors };
  Fonts: Record<string, unknown>;
  Radii: Record<string, number>;
}) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const id = activeVariantId();
  if (!id) return;
  const v = STYLE_VARIANTS[id];
  if (!v) {
    console.warn(`[styleVariants] unknown variant "${id}" — available: ${Object.keys(STYLE_VARIANTS).join(', ')}`);
    return;
  }

  Object.assign(tokens.Colors.light, v.colors);
  if (v.fonts) Object.assign(tokens.Fonts, v.fonts);
  if (v.radii) Object.assign(tokens.Radii, v.radii);

  if (v.fontFaces?.length) void injectAliasedFontFaces(v.fontFaces);

  const base: string[] = [`body { background-color: ${tokens.Colors.light.bgCanvas}; }`];
  if (v.extraCSS) base.push(v.extraCSS);
  injectStyle('vhstyle-base', base.join('\n'));

  // Atomic classes only exist after first render — retry until they appear.
  if (v.canvasBackgroundImage || v.surfaceShadow) {
    let tries = 0;
    const timer = setInterval(() => {
      tries += 1;
      if (injectAtomicFlourishes(v, tokens.Colors.light) || tries > 40) clearInterval(timer);
    }, 250);
  }

  console.info(`[styleVariants] active: ${v.name} — ${v.tagline}`);
}
