# Design Migration Plan

**Status:** Pre-development. Approved for execution as parallel agent slices.

**Companion:** `DESIGN.md` is the spec. This plan is the execution map for applying DESIGN.md to the existing app.

---

## 0. Status

DESIGN.md was shipped on 2026-05-09. The actual app code does not reflect it yet:

- `constants/theme.ts` has bare scaffold tokens (`#0a7ea4` tint, `#11181C` text, system Fonts.sans)
- `components/themed-text.tsx` hardcodes `fontSize: 16/20/32`, `fontWeight: '600'/'bold'`, `color: '#0a7ea4'`
- Every screen + component scatters its own hex literals (`#4338ca`, `#fafafa`, `#fff`, `#eee`, `#111`, `#333`, `#666`, `#888`, `#c0392b`, dozens more)
- Every component sets `fontSize`/`fontWeight` inline — no scale
- No light/dark mode plumbing beyond the Expo scaffold's `useColorScheme()`
- No font loading — Fraunces / General Sans / JetBrains Mono are not even in `package.json`

**Goal:** the entire app reads from DESIGN.md tokens. Every hex literal, every bare number, every font reference points at semantic tokens. Light mode is the default; dark mode follows system preference with a manual override.

When this is done, you should be able to change a single value in `constants/theme.ts` and have it propagate everywhere. AI-slop check passes (no indigo, no scattered radii, no centered-everything default).

---

## 1. Vocabulary

| Term | Meaning |
|---|---|
| **Token** | A semantic value from `constants/theme.ts` (e.g. `Colors.light.accent`, `Spacing.md`, `Typography.display.size`) |
| **Theme** | The full set of light or dark tokens, accessed via `useTheme()` |
| **Emphasis surface** | A panel rendered on `bg-emphasis` (deep brown). Used surgically — diagnosis card, contrast playback, weekly stat. NEVER the page canvas. |
| **System font fallback** | When a custom font hasn't loaded yet (cold start). Should still be readable — Fraunces falls back to Georgia, General Sans to system-ui, JetBrains Mono to ui-monospace. |
| **Migration pattern** | A standardized find-and-replace recipe (e.g. "any `fontSize: 14` becomes `Typography.body.size`"). |

---

## 2. The cut

What's being replaced or extended:

| Location | Action |
|---|---|
| `constants/theme.ts` | Fully rewritten — extend `Colors.light` / `Colors.dark` with all DESIGN.md tokens; add `Spacing`, `Radii`, `Typography`, `Motion`, `Fonts` (now real fonts, not Platform.select fallbacks) |
| `hooks/use-theme-color.ts` | Extended to support the new color keys (no breaking change to existing API) |
| `components/themed-text.tsx` | Rewritten to use `Typography` scale + `Fonts` + token color, retain back-compat with `type` prop |
| `components/themed-view.tsx` | Adapted to new token system |
| `app/_layout.tsx` | Loads Fraunces + General Sans + JetBrains Mono via `expo-font`. Splash until ready. Wraps app in any required theme provider. |
| `app/(tabs)/_layout.tsx` | Tab bar styling uses `Colors[theme].accent` and `Fonts.body` |
| `app/(tabs)/coaching.tsx` | All hex literals → tokens. Add Fraunces for diagnosis headlines. Apply emphasis surface to contrast playback panel. |
| `app/coaching-saved.tsx` | Same migration |
| `components/coaching/*.tsx` (9 files) | All hex literals → tokens. Apply Fraunces / General Sans / JetBrains Mono per role. |
| `app/(tabs)/index.tsx` | Practice screen — Fraunces for tonic display, JetBrains Mono for cents readouts, full token migration. |
| `components/SyllableDisplay.tsx` | Fraunces for syllables. Active syllable in `accent` token. |
| `components/practice/*.tsx` (11 files) | Full migration. CoachingBanner, GuidedSession, NoteChip, NoteResultsStrip, TuningMeter, etc. |
| `app/(tabs)/explore.tsx` | Progress screen — Fraunces for stat numbers (87%), JetBrains Mono for data. Apply emphasis surface to weekly card. |
| `components/progress/Sparkline.tsx` | Use `accent-on-emphasis` token (sparkline lives inside the brown weekly card). |
| `components/import/*.tsx` (7 files) | Full migration. Remove `#fff`, `#fafafa`, `#111`, `#666`, `#aaa`, etc. |
| `app/(tabs)/triallab.tsx` | Token migration (or skipped if not in user-facing scope — agent decides). |
| `components/ui/*.tsx`, `components/parallax-scroll-view.tsx`, `components/external-link.tsx`, `components/haptic-tab.tsx`, `components/hello-wave.tsx` | Token migration where applicable. |

**What's NOT being touched:**
- Logic / business code (`lib/*` — stays untouched except DESIGN.md system itself)
- Tests (`__tests__/*` — should still pass; UI tests don't exist anyway)
- DESIGN.md (this is the spec, only updated when decisions change)

---

## 3. Architecture

### 3.1 Token module layout

`constants/theme.ts` exports:

```ts
export const Colors = {
  light: { /* full DESIGN.md light palette as named tokens */ },
  dark:  { /* full DESIGN.md dark palette */ },
};

export const Fonts = {
  display: 'Fraunces_400Regular',         // post-load expo-font name
  displayItalic: 'Fraunces_300Italic',
  body: 'GeneralSans-Regular',
  bodyMedium: 'GeneralSans-Medium',
  bodySemibold: 'GeneralSans-Semibold',
  mono: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
  // System fallbacks while loading
  fallback: { display: 'Georgia', body: 'system-ui', mono: 'ui-monospace' },
};

export const Typography = {
  // Each entry is { size, lineHeight, weight, family }
  xs:      { size: 11, lineHeight: 1.4,  family: 'body' },
  sm:      { size: 13, lineHeight: 1.5,  family: 'body' },
  base:    { size: 15, lineHeight: 1.6,  family: 'body' },
  md:      { size: 17, lineHeight: 1.55, family: 'body' },
  lg:      { size: 22, lineHeight: 1.4,  family: 'body' },
  xl:      { size: 28, lineHeight: 1.2,  family: 'display' },
  '2xl':   { size: 40, lineHeight: 1.1,  family: 'display' },
  '3xl':   { size: 56, lineHeight: 1.05, family: 'display' },
  display: { size: 72, lineHeight: 1.0,  family: 'display' },
  // Mono variants for data
  monoSm:   { size: 11, lineHeight: 1.4,  family: 'mono' },
  monoBase: { size: 13, lineHeight: 1.5,  family: 'mono' },
  monoMd:   { size: 16, lineHeight: 1.4,  family: 'mono' },
  monoLg:   { size: 22, lineHeight: 1.2,  family: 'mono' },
};

export const Spacing = {
  '3xs': 2, '2xs': 4, xs: 8, sm: 12, md: 16, lg: 24, xl: 32, '2xl': 48, '3xl': 64, '4xl': 96,
};

export const Radii = {
  sm: 6, md: 10, lg: 14, pill: 999,
};

export const Motion = {
  ease: { enter: 'cubic-bezier(0.2, 0, 0, 1)', exit: 'cubic-bezier(0.4, 0, 1, 1)' },
  duration: { micro: 100, short: 200, medium: 300, long: 500 },
};
```

### 3.2 Theme access

Two access patterns, both supported:

**Hook (preferred for new code):**
```ts
import { useTheme } from '@/hooks/use-theme';
const t = useTheme();   // returns { colors, fonts, typography, spacing, radii, motion, scheme }
<View style={{ backgroundColor: t.colors.canvas, padding: t.spacing.lg }} />
```

**Existing `useThemeColor` (for back-compat):**
```ts
const bg = useThemeColor({}, 'bgCanvas');  // typed via Colors keys
```

**Direct import (in StyleSheet.create where hooks aren't available):**
```ts
// For static styles. Theme-aware styles use the hook.
import { Spacing, Radii } from '@/constants/theme';
const styles = StyleSheet.create({ box: { padding: Spacing.lg, borderRadius: Radii.md } });
```

Color values must use `useTheme()` because they swap between light and dark. Spacing, radii, motion are scheme-invariant — safe to import directly.

### 3.3 Font loading

`app/_layout.tsx` uses `useFonts()` from `expo-font`:

```ts
const [loaded] = useFonts({
  ...Fraunces_300Italic,
  ...Fraunces_400Regular,
  ...Fraunces_500Medium,
  ...Fraunces_600SemiBold,
  ...JetBrainsMono_400Regular,
  ...JetBrainsMono_500Medium,
  // General Sans — see §3.4
  'GeneralSans-Regular': require('@/assets/fonts/GeneralSans-Regular.otf'),
  'GeneralSans-Medium':  require('@/assets/fonts/GeneralSans-Medium.otf'),
  'GeneralSans-Semibold': require('@/assets/fonts/GeneralSans-Semibold.otf'),
});

if (!loaded) return null;  // splash via expo-splash-screen
```

### 3.4 General Sans loading strategy

**Recommended:** download from Fontshare (https://www.fontshare.com/fonts/general-sans), place 3 weights (Regular, Medium, Semibold) into `assets/fonts/`, register via `require()`. Cross-platform (web + native).

**Fallback if download is annoying:** swap to Plus Jakarta Sans via `@expo-google-fonts/plus-jakarta-sans`. Geometric sans, similar register. Document the swap in the DESIGN.md decisions log.

The D1 agent picks. Either is acceptable; both produce a non-default-system result. Goal is that body type is no longer the OS default.

---

## 4. User-facing changes

| Change | What the user sees |
|---|---|
| Color palette | Indigo → burnt amber (`#a86a24`) accent. Off-white `#fafafa` → cream `#f3ede0` canvas. Warm tones throughout. |
| Typography | Generic system fonts → Fraunces serif for note names + headlines, General Sans for body, JetBrains Mono for cents readouts. Distinct from "Expo default app" register. |
| Emphasis panels | Diagnosis card on Coaching, contrast playback panel, weekly stat card on Progress all wear deep-brown panel treatment. Spotlights the section. |
| Light/dark | Light cream is the default. Dark mode toggleable via system pref. Manual override is post-MVP polish — not in this slice. |
| Loading state | Splash screen during font load (~200-500 ms first launch on web). After load, fonts are cached. |

---

## 5. Slice plan

5 slices total. **D1 is foundational and must land first.** D2-D5 are parallel after D1.

### D1 — Foundation (sequential, first)

**Owns:**
- `constants/theme.ts` (full rewrite to DESIGN.md tokens)
- `hooks/use-theme-color.ts` (extend keys)
- NEW: `hooks/use-theme.ts` (returns full token bundle)
- NEW: `assets/fonts/*.otf` (downloaded General Sans files, or skip if using Plus Jakarta Sans alternative)
- `components/themed-text.tsx` (rewrite around new system, retain back-compat `type` prop)
- `components/themed-view.tsx` (adapted)
- `app/_layout.tsx` (font loading, splash gating)
- `app/(tabs)/_layout.tsx` (tab bar uses tokens)
- `package.json` (adds `@expo-google-fonts/fraunces`, `@expo-google-fonts/jetbrains-mono`, optionally `@expo-google-fonts/plus-jakarta-sans`)
- NEW: `__tests__/theme.test.ts` (tokens snapshot, useTheme returns expected shape)

**Done looks like:**
- `useTheme()` returns full bundle in light/dark
- App boots, loads fonts, shows splash → renders with new fonts
- Tab bar uses amber tint, body uses General Sans
- Existing `<ThemedText type="title">` still renders (back-compat preserved)
- All existing tests pass (no UI regressions in business logic)
- `npx tsc --noEmit` clean

### D2 — Coaching surfaces (parallel after D1)

**Owns:**
- `app/(tabs)/coaching.tsx`
- `app/coaching-saved.tsx`
- `components/coaching/BookmarkButton.tsx`
- `components/coaching/CauseCard.tsx`
- `components/coaching/CauseCardList.tsx`
- `components/coaching/ContrastPlayback.tsx`
- `components/coaching/DiagnosisHeadline.tsx`
- `components/coaching/EmptyStateTip.tsx`
- `components/coaching/EvidenceLine.tsx`
- `components/coaching/SavedTipRow.tsx`
- `components/coaching/SavedTipsList.tsx`

**Specific patterns to apply:**
- DiagnosisHeadline → `Typography.xl` Fraunces (italic emphasis on key phrases optional)
- EvidenceLine → `Typography.sm` body, with mono inline for `−34¢`-style numbers
- ContrastPlayback panel → emphasis surface (`Colors[theme].bgEmphasis`)
- Cause cards → cream surface, Fraunces for title, body for soundsLike/whyPitchSuffers
- "Saved" link in header → accent token
- All hex literals replaced

### D3 — Practice surface (parallel after D1)

**Owns:**
- `app/(tabs)/index.tsx`
- `components/SyllableDisplay.tsx`
- `components/practice/*` (11 files)

**Specific patterns:**
- Tonic name display (`G3` etc) → `Typography['3xl']` Fraunces
- Active syllable → `Typography.lg` Fraunces, `Colors[theme].accent`
- Cents readouts (TuningMeter) → `Typography.monoLg` JetBrains Mono with tabular numerals
- Exercise picker chips → `Colors[theme].bgSurface` default, `Colors[theme].accentMuted` background + accent border when active
- "Start" button → primary button pattern (accent background, canvas-color text)
- HeadphonesBanner → emphasis surface variant if it's modal-blocking, surface otherwise

### D4 — Progress + import (parallel after D1)

**Owns:**
- `app/(tabs)/explore.tsx`
- `components/progress/Sparkline.tsx`
- `components/import/*` (7 files)

**Specific patterns:**
- Weekly stat number (87%) → emphasis surface with `Typography['3xl']` Fraunces, `accentOnEmphasis` color
- Sparkline bars → `accentOnEmphasis` (lives inside emphasis card)
- Per-exercise list rows → `Typography.lg` Fraunces for exercise name, JetBrains Mono for stats
- Import "+ Add imported melody" row → dashed-border style, secondary surface
- ImportModal phases → cream canvas; analyze overlay uses emphasis surface
- MelodyTimeline note labels → JetBrains Mono for note names + cents
- PerDegreeTable → Fraunces for diatonic labels, mono for numbers
- SaveSheet → standard form pattern (input bg = canvas, surface = bgSurface)

### D5 — Triallab + UI primitives (parallel after D1)

**Owns:**
- `app/(tabs)/triallab.tsx`
- `components/ui/collapsible.tsx`
- `components/ui/icon-symbol.tsx`, `icon-symbol.ios.tsx`
- `components/parallax-scroll-view.tsx`
- `components/external-link.tsx`
- `components/haptic-tab.tsx`
- `components/hello-wave.tsx`

**Notes:** These are leftover/scaffold/utility components. Some may already pass tokens through (e.g. icon-symbol takes a color prop). Agent reads each, applies tokens where appropriate. Skip purely-static scaffold files like hello-wave if they don't render in the live app.

---

## 6. Wave plan

```
Wave 1 (sequential):
  D1 — Foundation
        ├─ tokens, hooks, themed primitives, font loading
        └─ ~30 min

Wave 2 (parallel after D1):
  ┌── D2 — Coaching surfaces        ───┐
  ├── D3 — Practice surface         ───┤  ~25 min each
  ├── D4 — Progress + import        ───┤  in parallel
  └── D5 — Triallab + UI primitives ───┘
```

D2/D3/D4/D5 file scopes are fully disjoint — they can write concurrently in main tree without conflict. They all consume the same D1 token API.

**No worktrees** — same constraint as the prior melody-import and coaching builds. The repo has substantial uncommitted work; worktrees would lose it.

---

## 7. Migration patterns (concrete recipes)

These are the find-and-replace patterns each D2-D5 agent applies:

### 7.1 Hex literal → token

```ts
// BEFORE
backgroundColor: '#fafafa'
color: '#111'
borderColor: '#eee'
color: '#4338ca'
backgroundColor: '#1f9d55'

// AFTER (in component using useTheme())
const t = useTheme();
backgroundColor: t.colors.canvas
color: t.colors.textPrimary
borderColor: t.colors.borderSubtle
color: t.colors.accent
backgroundColor: t.colors.success
```

For static StyleSheet.create that can't use hooks, hoist colors into the component body and pass as inline style, or use a `themedStyles(theme)` factory pattern.

### 7.2 fontSize/fontWeight → Typography scale

```ts
// BEFORE
{ fontSize: 24, fontWeight: '700' }
{ fontSize: 13, color: '#666' }

// AFTER
{ ...Typography.xl, fontFamily: Fonts.display }
{ ...Typography.sm, color: t.colors.textSecondary }
```

The Typography entries already pair size + line-height + family hint. Spread them.

### 7.3 Spacing → scale

```ts
// BEFORE
{ padding: 20, gap: 18, marginTop: 6 }

// AFTER
{ padding: Spacing.lg, gap: Spacing.lg, marginTop: Spacing['2xs'] }
```

Round to nearest token. `20` → `Spacing.lg (24)` is a slight bump, `18` → `Spacing.lg (24)` same, `6` → `Spacing.xs (8)` slight bump. Acceptable — the design intent dominates.

### 7.4 Border radius → scale

```ts
// BEFORE
{ borderRadius: 10 }   { borderRadius: 12 }   { borderRadius: 999 }

// AFTER
{ borderRadius: Radii.md }   { borderRadius: Radii.lg }   { borderRadius: Radii.pill }
```

### 7.5 Emphasis surface application

A panel is an emphasis surface if and only if DESIGN.md §"When to use the brown emphasis panel" lists it. For the current app:
- ContrastPlayback panel: yes
- DiagnosisHeadline section wrapper: yes (it's the spotlight of the screen)
- Weekly card on Progress: yes
- Code/data terminal block (none in current app, but if it appears): yes

Pattern:
```ts
// emphasis surface
{
  backgroundColor: t.colors.bgEmphasis,
  borderColor: t.colors.borderOnEmphasis,
  // Inside: text uses textOnEmphasis, accents use accentOnEmphasis
}
```

### 7.6 Anti-slop verification

Each agent runs a self-check before declaring done:
- No hex literals remaining in their owned files (`grep -nE '#[0-9a-fA-F]{3,6}' <files>` should return empty or only `Fonts.fallback` strings)
- No `fontSize:` numeric literals (should be `...Typography.X` spreads)
- No `padding:` / `margin:` / `gap:` numeric literals (should be `Spacing.X`)
- No `#4338ca` (the prior indigo) anywhere
- No "centered everything" — each major surface has clear hierarchy
- No 3-column icon grids
- No purple/violet anywhere

---

## 8. Risks

| Risk | Mitigation |
|---|---|
| Font load on web is slow first time | Splash via `expo-splash-screen`. Once cached (Service Worker / browser cache), subsequent loads are fast. Acceptable trade. |
| General Sans `.otf` files not downloadable cleanly | Fall back to Plus Jakarta Sans via `@expo-google-fonts/plus-jakarta-sans`. Document substitution. |
| Existing components break under new tokens (color props change shape) | Back-compat: `useThemeColor` keeps existing keys (`text`, `background`, `tint`, `icon`, `tabIconDefault`, `tabIconSelected`) AND adds new ones. Existing callers don't break. |
| `themed-text.tsx` `type` prop variants ('title', 'subtitle' etc.) need to map to new typography | Map: title → 2xl Fraunces, subtitle → lg Fraunces, defaultSemiBold → base body Semibold, default → base body, link → base body color: accent. |
| TS errors cascade across slices when tokens land | D1 lands first. D2/D3/D4/D5 see the new types when they start. Agents told to handle "Color key X doesn't exist" by reading constants/theme.ts. |
| StyleSheet.create can't access hooks (theme color access) | Use inline style with `useTheme()` for color, OR factory pattern `themedStyles(theme)` returning a StyleSheet. Both acceptable. Document in §7. |
| Visual regression on shipped screens (user has live use) | Manual smoke test after the wave: open Practice, Coaching, Progress, Import — each surface should render with new fonts + colors. Light + dark toggle via system pref test. |

---

## 9. Done criteria

- DESIGN.md unchanged (this is execution, not redesign)
- `constants/theme.ts` exports the full token bundle
- `hooks/use-theme.ts` exists and returns the bundle, typed
- App boots on web with all three fonts loaded
- Indigo `#4338ca` does NOT appear anywhere in `app/`, `components/` (verify with grep)
- No bare `fontSize:` / `padding:` / `borderRadius:` numeric literals in `app/` or `components/` (except in D1's primitives where they define the scale)
- All four screens (Practice, Coaching, Progress, Import modal) render with the cream-default + amber-accent + Fraunces-display visual register
- Light + dark mode swap correctly via system preference (toggle iOS Appearance / browser dev-tools color-scheme emulation)
- `npx tsc --noEmit` clean
- All existing tests pass (135 currently)
- Manual smoke check on web: open `npx expo start --web --port 8081`, navigate every screen, verify visual register matches the HTML preview at `/tmp/design-consultation-preview-vocal-training.html`

---

## 10. After this lands

- Re-run `/plan-design-review` on `COACHING_REDESIGN_PLAN.md` — the §21 deferred decisions can now be calibrated against named tokens, completing what we deferred.
- Run `/design-review` on the live app to catch any visual regressions or AI-slop patterns that snuck through.
- Add a "Theme" preference (System / Light / Dark) — ~30 min slice.
- Slice 5+ of melody-import (subset practice, note editor) is now buildable against the design system from the start, no retrofit needed.
- Update DESIGN.md decisions log with "2026-05-09: Migrated existing app code to design tokens" entry.

---

## 11. Living references

- `DESIGN.md` is the spec. This plan executes it. If a token value or rule changes, DESIGN.md updates first; this plan + code follow.
- `ROADMAP.md` should get a "Design Migration" tracker section once D1 lands. Each D-slice flips to `shipped` as it lands.
