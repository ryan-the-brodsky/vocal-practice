import Head from 'expo-router/head';

import LearnHub from '@/components/learn/LearnHub';
import { SITE, socialMetaTags } from '@/lib/seo/socialMeta';

// Static SEO route for the Learn hub. The page CONTENT (intro, range-test card,
// artist-spotlight carousel, search, article grid) lives in the shared
// `components/learn/LearnHub.tsx` so this route and the in-app "Learn" tab
// (`app/(tabs)/library.tsx`, route /library) always render the same thing.
// Edit the hub, not a copy.

const URL = `${SITE}/learn/`;
const TITLE = 'Learn to Sing — Free Guides & Exercises | Vocal Habit';
const DESCRIPTION =
  'Free, science-backed singing guides — warm-ups, head & chest voice, mix, belt, vibrato and pitch. Each links to a free exercise you practice in-browser.';

export default function LearnIndexPage() {
  return (
    <>
      <Head>
        <title>{TITLE}</title>
        <meta name="description" content={DESCRIPTION} />
        <link rel="canonical" href={URL} />
        {socialMetaTags({ title: TITLE, description: DESCRIPTION, url: URL })}
      </Head>
      <LearnHub />
    </>
  );
}
