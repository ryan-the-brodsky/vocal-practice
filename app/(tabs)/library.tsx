import { Redirect } from 'expo-router';

// The Learn hub is the single static route /learn (marketing group, for SEO);
// its content is `components/learn/LearnHub.tsx`. The in-app "Learn" tab
// navigates straight there (see the tabPress listener in app/(tabs)/_layout.tsx).
// This stub only catches direct /library hits — legacy links, bookmarks — and
// forwards them, so there's no orphaned /library URL.
export default function LibraryRedirect() {
  return <Redirect href="/learn" />;
}
