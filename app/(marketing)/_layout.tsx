import { Stack } from 'expo-router';

// Static SEO/marketing routes. No font/onboarding/splash gate (the root layout
// bypasses it for the (marketing) segment), so these pre-render to indexable
// HTML at build time; interactive widgets hydrate as islands on top.
// See seo/static-rendering-architecture.md.
export default function MarketingLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
