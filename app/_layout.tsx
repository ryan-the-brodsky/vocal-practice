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
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import FeedbackButton from '@/components/FeedbackButton';
import ErrorBoundary from '@/components/ErrorBoundary';
import { hasSeenOnboarding } from '@/lib/settings/onboarding';
import { requestPersistentStorage } from '@/lib/storage/persist';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  // Light is the default per DESIGN.md. Dark mode is opt-in via a future toggle, not OS-following.
  const c = Colors.light;

  const router = useRouter();
  const segments = useSegments();
  const rootNavState = useRootNavigationState();

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
  useEffect(() => {
    requestPersistentStorage().catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;
    hasSeenOnboarding().then((seen) => {
      if (!active) return;
      setNeedsOnboarding(!seen);
      setOnboardingChecked(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const navReady = !!rootNavState?.key;
  const onOnboarding = segments[0] === 'onboarding';

  useEffect(() => {
    if (onOnboarding && !initialRedirectHandled) setInitialRedirectHandled(true);
  }, [onOnboarding, initialRedirectHandled]);

  useEffect(() => {
    if (!loaded || !onboardingChecked || !navReady) return;
    if (needsOnboarding && !initialRedirectHandled && !onOnboarding) {
      router.replace('/onboarding');
    }
    SplashScreen.hideAsync();
  }, [loaded, onboardingChecked, navReady, needsOnboarding, initialRedirectHandled, onOnboarding, router]);

  if (!loaded || !onboardingChecked) return null;

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
  const showCover = needsOnboarding && !onOnboarding && !initialRedirectHandled;

  return (
    <ThemeProvider value={navTheme}>
      <ErrorBoundary>
        <View style={{ flex: 1 }}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            <Stack.Screen name="coaching-saved" options={{ headerShown: false }} />
            <Stack.Screen name="song-editor" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
          </Stack>
          {!onOnboarding && <FeedbackButton />}
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
