import { Stack } from 'expo-router';
import { View } from 'react-native';

import { Colors } from '@/constants/theme';
import MarketingHeader from '@/components/marketing/MarketingHeader';

const c = Colors.light;

// Static SEO/marketing routes. No font/onboarding/splash gate (the root layout
// bypasses it for the (marketing) segment), so these pre-render to indexable
// HTML at build time; interactive widgets hydrate as islands on top.
// See seo/static-rendering-architecture.md. A slim brand header gives the whole
// content section a consistent way back into the app (it has no tab bar).
export default function MarketingLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: c.bgCanvas }}>
      <MarketingHeader />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bgCanvas } }} />
    </View>
  );
}
