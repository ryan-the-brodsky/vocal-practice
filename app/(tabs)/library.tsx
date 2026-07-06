import LearnHub from '@/components/learn/LearnHub';

// The in-app "Learn" tab (route /library). Its CONTENT is the shared
// `components/learn/LearnHub.tsx` — the SAME hub the static SEO route
// `app/(marketing)/learn/index.tsx` (/learn) renders — so the in-app tab and the
// marketing page can never diverge again (previously this was a separate, poorer
// list that was missing the artist-spotlight carousel). Edit the hub, not a copy.
// Route stays /library because /learn is owned by the marketing group; the tab is
// LABELED "Learn" in app/(tabs)/_layout.tsx.

export default function LibraryScreen() {
  return <LearnHub />;
}
