// Shared Open Graph + Twitter-card <meta> builder for static SEO pages.
// Returns an array of <meta> elements meant to live directly inside an
// expo-router/head <Head> (react-helmet-async flattens arrays + flushes them
// to the static HTML, the same path the canonical/og tags already use).

export const SITE = 'https://vocalhabit.com';
const SITE_NAME = 'Vocal Habit';
// Branded share image (1200×630 at 2× = 2400×1260), generated to public/og-image.png.
const DEFAULT_IMAGE = `${SITE}/og-image.png`;
const IMAGE_W = 2400;
const IMAGE_H = 1260;

export interface SocialMetaOpts {
  title: string;
  description: string;
  /** Absolute canonical URL of the page. */
  url: string;
  type?: 'website' | 'article';
  image?: string;
  /** Pixel dimensions + alt of a custom `image` (defaults describe the branded card). */
  imageWidth?: number;
  imageHeight?: number;
  imageAlt?: string;
}

export function socialMetaTags({
  title,
  description,
  url,
  type = 'website',
  image = DEFAULT_IMAGE,
  imageWidth = IMAGE_W,
  imageHeight = IMAGE_H,
  imageAlt = SITE_NAME,
}: SocialMetaOpts) {
  return [
    <meta key="og:title" property="og:title" content={title} />,
    <meta key="og:description" property="og:description" content={description} />,
    <meta key="og:type" property="og:type" content={type} />,
    <meta key="og:url" property="og:url" content={url} />,
    <meta key="og:site_name" property="og:site_name" content={SITE_NAME} />,
    <meta key="og:image" property="og:image" content={image} />,
    <meta key="og:image:width" property="og:image:width" content={String(imageWidth)} />,
    <meta key="og:image:height" property="og:image:height" content={String(imageHeight)} />,
    <meta key="og:image:alt" property="og:image:alt" content={imageAlt} />,
    <meta key="tw:card" name="twitter:card" content="summary_large_image" />,
    <meta key="tw:title" name="twitter:title" content={title} />,
    <meta key="tw:description" name="twitter:description" content={description} />,
    <meta key="tw:image" name="twitter:image" content={image} />,
  ];
}
