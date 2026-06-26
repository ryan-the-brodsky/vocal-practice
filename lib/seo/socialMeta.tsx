// Shared Open Graph + Twitter-card <meta> builder for static SEO pages.
// Returns an array of <meta> elements meant to live directly inside an
// expo-router/head <Head> (react-helmet-async flattens arrays + flushes them
// to the static HTML, the same path the canonical/og tags already use).

export const SITE = 'https://vocalhabit.com';
const SITE_NAME = 'Vocal Habit';
// Fallback share image. TODO: replace with a real 1200×630 OG image in public/.
const DEFAULT_IMAGE = `${SITE}/favicon.png`;

export interface SocialMetaOpts {
  title: string;
  description: string;
  /** Absolute canonical URL of the page. */
  url: string;
  type?: 'website' | 'article';
  image?: string;
}

export function socialMetaTags({
  title,
  description,
  url,
  type = 'website',
  image = DEFAULT_IMAGE,
}: SocialMetaOpts) {
  return [
    <meta key="og:title" property="og:title" content={title} />,
    <meta key="og:description" property="og:description" content={description} />,
    <meta key="og:type" property="og:type" content={type} />,
    <meta key="og:url" property="og:url" content={url} />,
    <meta key="og:site_name" property="og:site_name" content={SITE_NAME} />,
    <meta key="og:image" property="og:image" content={image} />,
    <meta key="tw:card" name="twitter:card" content="summary_large_image" />,
    <meta key="tw:title" name="twitter:title" content={title} />,
    <meta key="tw:description" name="twitter:description" content={description} />,
    <meta key="tw:image" name="twitter:image" content={image} />,
  ];
}
