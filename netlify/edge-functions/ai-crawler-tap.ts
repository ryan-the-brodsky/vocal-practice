// Passive tap for AI-assistant crawlers. On a static host there are no server
// logs to read, so we watch requests at the edge: when an AI vendor's crawler or
// user-fetch bot loads a page, fire a server-side PostHog `ai_crawler_hit` event.
// This is the only signal we have for Anthropic activity — no analytics dashboard
// reports Claude citations (it rides Brave, not Bing/Copilot).
//
// Safety: this NEVER alters the response. It matches on User-Agent, fires the
// event fire-and-forget via waitUntil, swallows every error, and always falls
// through to the static asset. Scoped to page routes (assets excluded) so it
// runs once per crawl, not once per sub-resource.

import type { Context } from '@netlify/edge-functions';

type Bot = { vendor: string; bot: string; kind: 'index' | 'user' | 'training' };

// Ordered specific → general (first match wins). Tokens from each vendor's
// published crawler docs. Bravebot is intentionally absent: it doesn't advertise
// a distinct user-agent (it mimics a generic browser), so it can't be matched here.
const BOTS: [RegExp, Bot][] = [
  [/Claude-SearchBot/i, { vendor: 'anthropic', bot: 'Claude-SearchBot', kind: 'index' }],
  [/Claude-User/i, { vendor: 'anthropic', bot: 'Claude-User', kind: 'user' }],
  [/ClaudeBot/i, { vendor: 'anthropic', bot: 'ClaudeBot', kind: 'training' }],
  [/anthropic-ai/i, { vendor: 'anthropic', bot: 'anthropic-ai', kind: 'training' }],
  [/OAI-SearchBot/i, { vendor: 'openai', bot: 'OAI-SearchBot', kind: 'index' }],
  [/ChatGPT-User/i, { vendor: 'openai', bot: 'ChatGPT-User', kind: 'user' }],
  [/GPTBot/i, { vendor: 'openai', bot: 'GPTBot', kind: 'training' }],
  [/PerplexityBot/i, { vendor: 'perplexity', bot: 'PerplexityBot', kind: 'index' }],
  [/Perplexity-User/i, { vendor: 'perplexity', bot: 'Perplexity-User', kind: 'user' }],
];

const KEY = Netlify.env.get('EXPO_PUBLIC_POSTHOG_KEY');
const HOST = Netlify.env.get('EXPO_PUBLIC_POSTHOG_HOST') ?? 'https://us.i.posthog.com';

export default async function (request: Request, context: Context) {
  try {
    // No key on previews/local → tracking is a no-op, matching the client SDK.
    if (!KEY) return;

    const ua = request.headers.get('user-agent') ?? '';
    let match: Bot | undefined;
    for (const [re, bot] of BOTS) {
      if (re.test(ua)) {
        match = bot;
        break;
      }
    }
    if (!match) return; // human (or unrecognised bot) — leave untouched

    const url = new URL(request.url);
    const body = JSON.stringify({
      api_key: KEY,
      event: 'ai_crawler_hit',
      // Bucket by vendor so bots never mingle with human distinct_ids.
      distinct_id: `ai-crawler:${match.vendor}`,
      properties: {
        vendor: match.vendor,
        bot: match.bot,
        kind: match.kind, // index | user | training
        path: url.pathname,
        host: url.hostname,
        ua,
        // Keep bots out of person profiles — events only.
        $process_person_profile: false,
      },
    });

    context.waitUntil(
      fetch(`${HOST}/capture/`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
      }).catch(() => {}),
    );
  } catch {
    // A tap must never break the site — swallow everything and fall through.
  }
  // No return value → request continues to the static asset.
}

// Page routes only. Excluding assets keeps this to ~one hit per crawl and off the
// hot path for every JS/CSS/image/font/sample request.
export const config = {
  path: '/*',
  excludedPath: [
    '/_expo/*',
    '/salamander/*',
    '/assets/*',
    '/*.js',
    '/*.css',
    '/*.map',
    '/*.png',
    '/*.jpg',
    '/*.jpeg',
    '/*.gif',
    '/*.svg',
    '/*.webp',
    '/*.ico',
    '/*.woff',
    '/*.woff2',
    '/*.otf',
    '/*.ttf',
    '/*.txt',
    '/*.xml',
    '/*.json',
  ],
};
