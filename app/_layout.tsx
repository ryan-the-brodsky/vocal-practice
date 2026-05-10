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
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import 'react-native-reanimated';

import { Colors } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  // Light is the default per DESIGN.md. Dark mode is opt-in via a future toggle, not OS-following.
  const c = Colors.light;

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

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

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

  return (
    <ThemeProvider value={navTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen name="coaching-saved" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
