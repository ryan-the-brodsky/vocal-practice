import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import { Tabs } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts } from '@/constants/theme';

// Trill Lab is an internal algorithm-tuning playground — hidden in production
// builds. Defaults to dev-only; force on/off with EXPO_PUBLIC_TRILL_LAB=1|0
// (e.g. to test it on a deployed PWA build, or to dogfood locally without it).
const trillLabEnv = process.env.EXPO_PUBLIC_TRILL_LAB;
const SHOW_TRILL_LAB = trillLabEnv != null ? trillLabEnv === '1' : __DEV__;

const c = Colors.light;

// Dark "brass bookmark" bar (DESIGN.md): active tab lights up amber on a faint
// amber wash; inactive sits dim-cream on the brown. The pill hugs its content.
function TabBarButton(props: BottomTabBarButtonProps) {
  const focused = props.accessibilityState?.selected ?? false;
  return (
    <PlatformPressable
      {...props}
      style={[props.style, styles.button]}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}>
      <View style={[styles.pill, focused && styles.pillActive]}>{props.children}</View>
    </PlatformPressable>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  // People look for primary nav at the top on desktop/tablet; only mobile expects
  // a bottom bar. ≥768 px (iPad-portrait and up) → top, narrower → bottom.
  const { width } = useWindowDimensions();
  const position: 'top' | 'bottom' = width >= 768 ? 'top' : 'bottom';

  return (
    <Tabs
      screenOptions={{
        tabBarPosition: position,
        tabBarActiveTintColor: c.accentOnEmphasis,
        tabBarInactiveTintColor: c.textOnEmphasisDim,
        tabBarStyle: {
          backgroundColor: c.bgEmphasis,
          // react-navigation draws the hairline on the correct edge (bottom edge
          // when the bar is at the top, top edge when at the bottom) — we only
          // recolour it. It also adds the safe-area inset as padding, so the
          // explicit height is content-height + that inset.
          borderColor: c.borderOnEmphasis,
          height: 60 + (position === 'top' ? insets.top : insets.bottom),
        },
        tabBarItemStyle: { paddingVertical: 0 },
        tabBarLabelStyle: { fontFamily: Fonts.bodyMedium, fontSize: 12 },
        tabBarButton: TabBarButton,
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Practice',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="music.note" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="chart.bar.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="triallab"
        options={
          SHOW_TRILL_LAB
            ? {
                title: 'Trill Lab',
                tabBarIcon: ({ color }) => <IconSymbol size={26} name="slider.horizontal.3" color={color} />,
              }
            : { href: null }
        }
      />
      <Tabs.Screen name="coaching" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 5,
    borderRadius: 999,
  },
  pillActive: {
    backgroundColor: 'rgba(224, 146, 56, 0.16)',
  },
});
