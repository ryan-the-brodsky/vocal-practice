import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';

export default function TabLayout() {
  // Light is the default per DESIGN.md; dark is a future opt-in toggle, not OS-following.
  const c = Colors.light;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: c.accent,
        tabBarInactiveTintColor: c.textTertiary,
        tabBarStyle: {
          backgroundColor: c.bgSurface,
          borderTopColor: c.borderSubtle,
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Practice',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="music.note" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Progress',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.bar.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="triallab"
        options={{
          title: 'Trill Lab',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="slider.horizontal.3" color={color} />,
        }}
      />
      <Tabs.Screen name="coaching" options={{ href: null }} />
    </Tabs>
  );
}
