import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import {
  Fraunces_300Light,
  Fraunces_300Light_Italic,
  Fraunces_400Regular,
  Fraunces_400Regular_Italic,
  Fraunces_500Medium,
  Fraunces_600SemiBold,
} from '@expo-google-fonts/fraunces';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from '@expo-google-fonts/jetbrains-mono';
import { useFonts } from 'expo-font';
import { Stack, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import Head from 'expo-router/head';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import FeedbackButton from '@/components/FeedbackButton';
import ErrorBoundary from '@/components/ErrorBoundary';
import HomeHeroSEO from '@/components/home/HomeHeroSEO';
import { hasSeenOnboarding } from '@/lib/settings/onboarding';
import { SITE, socialMetaTags } from '@/lib/seo/socialMeta';
import { requestPersistentStorage } from '@/lib/storage/persist';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

// Top-level route groups that must pre-render real HTML at build time (SEO).
// These bypass the font/onboarding/splash gate so static export emits content
// instead of an empty shell. See seo/static-rendering-architecture.md.
const STATIC_SEGMENTS = new Set(['(marketing)']);

// Per-route <head> for the (client-rendered) app shell. App routes export an
// EMPTY body at SSG (gated below), so this Head is rendered UNCONDITIONALLY —
// before the gate's `return null` — to give every app URL a real title, meta
// description, self-referencing canonical, and OG/Twitter tags. The self
// canonical (no query string) collapses /?exerciseId=… deep-links onto "/".
const APP_HOME_DESCRIPTION =
  'Free browser vocal warm-ups with real-time pitch scoring and piano accompaniment. No signup — pick a voice part, sing along, and see how accurate you are.';
const APP_ROUTE_HEAD: Record<string, { title: string; description: string }> = {
  index: { title: 'Vocal Habit — Free Vocal Warm-Ups & Pitch Training', description: APP_HOME_DESCRIPTION },
  plan: {
    title: 'Plan Your Practice — Vocal Habit',
    description:
      'Build a daily vocal-practice routine — browse warm-ups and exercises by capability and set your plan. Free, in your browser, no signup.',
  },
  progress: {
    title: 'Your Progress — Vocal Habit',
    description:
      'Track your vocal practice — weekly summaries, per-exercise trends, and accuracy over time. Free and private, stored on your device.',
  },
  library: {
    title: 'Exercise Library — Vocal Habit',
    description:
      'Browse vocal exercises and warm-ups by capability — chest, mix, head voice, agility, belt and more. Free in your browser, no signup.',
  },
  coaching: {
    title: 'Coaching — Vocal Habit',
    description:
      'Targeted feedback on your singing — Vocal Habit finds your most common pitch mistakes and helps you fix them. Free, in your browser.',
  },
};
const APP_ROUTE_HEAD_FALLBACK = { title: 'Vocal Habit', description: APP_HOME_DESCRIPTION };

function AppRouteHead({ segments }: { segments: string[] }) {
  const inTabs = segments[0] === '(tabs)';
  const routeKey = inTabs ? segments[1] ?? 'index' : segments[0] ?? 'index';
  const meta = APP_ROUTE_HEAD[routeKey] ?? APP_ROUTE_HEAD_FALLBACK;
  const path = inTabs
    ? segments[1]
      ? `/${segments[1]}`
      : '/'
    : segments[0]
      ? `/${segments[0]}`
      : '/';
  const canonical = `${SITE}${path}`;
  return (
    <Head>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <link rel="canonical" href={canonical} />
      {socialMetaTags({ title: meta.title, description: meta.description, url: canonical })}
    </Head>
  );
}

export default function RootLayout() {
  // Light is the default per DESIGN.md. Dark mode is opt-in via a future toggle, not OS-following.
  const c = Colors.light;

  const router = useRouter();
  const segments = useSegments();
  const rootNavState = useRootNavigationState();

  // Static SEO routes render synchronously (no fonts/storage/onboarding gate) so
  // they export as indexable HTML. The interactive app keeps its client gate.
  const isStaticRoute = STATIC_SEGMENTS.has(segments[0] as string);

  // The homepage "/" (index route). While the app shell is gated (SSG + first
  // paint) we render a static, crawlable intro there so the root ships real
  // HTML — an <h1> + internal-link hub — instead of an empty shell.
  const onIndex = !segments[0] || (segments[0] === '(tabs)' && !segments[1]);

  const [loaded] = useFonts({
    Fraunces_300Light,
    Fraunces_300Light_Italic,
    Fraunces_400Regular,
    Fraunces_400Regular_Italic,
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    'GeneralSans-Regular': require('@/assets/fonts/GeneralSans-Regular.otf'),
    'GeneralSans-Medium': require('@/assets/fonts/GeneralSans-Medium.otf'),
    'GeneralSans-Semibold': require('@/assets/fonts/GeneralSans-Semibold.otf'),
    // Bravura's OTF passes iOS font registration but fails Chrome's font
    // sanitizer (CFF tables it doesn't accept). WOFF2 build of the same font
    // loads cleanly in Chromium. iOS doesn't support WOFF2 — split per platform.
    BravuraText: Platform.OS === 'web'
      ? require('@/assets/fonts/BravuraText.woff2')
      : require('@/assets/fonts/BravuraText.otf'),
  });

  // First-run gate: read the onboarding flag in parallel with fonts. Hold the
  // splash until BOTH resolve so a returning user goes splash → app with no
  // flash, and a first-run user never sees Practice paint before onboarding.
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  // Latches once the first-run user has been delivered into onboarding, so the
  // gate never bounces them back after they finish/skip (which navigates to "/").
  const [initialRedirectHandled, setInitialRedirectHandled] = useState(false);

  // Ask the browser to exempt our local storage from eviction (Safari ITP /
  // storage pressure). Best-effort, one-time; the user's history is local-only.
  // Skipped on static SEO routes — public pages shouldn't touch app storage.
  useEffect(() => {
    if (isStaticRoute) return;
    requestPersistentStorage().catch(() => {});
  }, [isStaticRoute]);

  useEffect(() => {
    if (isStaticRoute) return;
    let active = true;
    hasSeenOnboarding().then((seen) => {
      if (!active) return;
      setNeedsOnboarding(!seen);
      setOnboardingChecked(true);
    });
    return () => {
      active = false;
    };
  }, [isStaticRoute]);

  const navReady = !!rootNavState?.key;
  const onOnboarding = segments[0] === 'onboarding';

  useEffect(() => {
    if (onOnboarding && !initialRedirectHandled) setInitialRedirectHandled(true);
  }, [onOnboarding, initialRedirectHandled]);

  useEffect(() => {
    if (isStaticRoute) {
      SplashScreen.hideAsync();
      return;
    }
    if (!loaded || !onboardingChecked || !navReady) return;
    if (needsOnboarding && !initialRedirectHandled && !onOnboarding) {
      router.replace('/onboarding');
    }
    SplashScreen.hideAsync();
  }, [isStaticRoute, loaded, onboardingChecked, navReady, needsOnboarding, initialRedirectHandled, onOnboarding, router]);

  // App-shell <head> for non-marketing routes. Rendered even while the body is
  // gated so the title/canonical/OG flush to static HTML (the body stays empty).
  const appHead = isStaticRoute ? null : <AppRouteHead segments={segments} />;

  // App routes hold until fonts + onboarding resolve (prevents flash). Static
  // SEO routes never hold — that's what makes them export with real content.
  // The head still flushes during the hold (SSG + first paint). On the index
  // route the hold renders a static SEO intro (crawlable at SSG; the app
  // replaces it on hydration) instead of an empty shell.
  if (!isStaticRoute && (!loaded || !onboardingChecked)) {
    return (
      <>
        {appHead}
        {onIndex && (
          <View style={{ flex: 1, backgroundColor: c.canvas }}>
            <HomeHeroSEO />
          </View>
        )}
      </>
    );
  }

  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: c.accent,
      background: c.canvas,
      card: c.bgSurface,
      text: c.textPrimary,
      border: c.borderSubtle,
      notification: c.error,
    },
  };

  // While onboarding is needed but the route hasn't taken over yet, cover the
  // tabs with a canvas layer so Practice never flashes (web has no native splash).
  // Drops permanently once the user reaches onboarding, so finishing (→ "/") is clean.
  const showCover = !isStaticRoute && needsOnboarding && !onOnboarding && !initialRedirectHandled;

  return (
    <ThemeProvider value={navTheme}>
      {appHead}
      <ErrorBoundary>
        <View style={{ flex: 1 }}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(marketing)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            <Stack.Screen name="coaching-saved" options={{ headerShown: false }} />
            <Stack.Screen name="song-editor" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
          </Stack>
          {!onOnboarding && !isStaticRoute && <FeedbackButton />}
          {showCover && (
            <View
              pointerEvents="none"
              style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: c.canvas }}
            />
          )}
        </View>
      </ErrorBoundary>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
