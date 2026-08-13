import type { AnalyticsEvent, AnalyticsProps } from './events';

export type { AnalyticsEvent, AnalyticsProps };

// Public project token — safe to ship in the client bundle (same class of
// secret as the Ahrefs key in app/+html.tsx). Absent locally and in previews,
// which makes analytics a no-op there rather than polluting production data.
const KEY = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';

// Events fired before the async import resolves wait here. Bounded so a
// misconfigured build can't grow the array without limit.
const MAX_QUEUE = 50;

type PostHogClient = { capture: (event: string, props?: AnalyticsProps) => unknown };

let client: PostHogClient | null = null;
let loading = false;
const queue: { event: AnalyticsEvent; props?: AnalyticsProps }[] = [];

function enabled(): boolean {
  return typeof window !== 'undefined' && !!KEY;
}

/**
 * Loads and initialises PostHog. Safe to call on every route including the
 * statically-exported marketing pages: the dynamic import keeps posthog-js out
 * of the SSG render path and out of the initial bundle, and the `window` guard
 * means a build-time render is a no-op.
 */
export function initAnalytics(): void {
  if (client || loading || !enabled()) return;
  loading = true;

  import('posthog-js')
    .then(({ default: posthog }) => {
      posthog.init(KEY!, {
        api_host: HOST,
        defaults: '2026-06-25',
        // No cookies, no localStorage, no sessionStorage — identity is a
        // server-side rotating hash. This is what keeps the site free of a
        // consent banner, matching the cookieless Ahrefs tag already in
        // app/+html.tsx. Must ALSO be enabled in the PostHog project settings
        // or every event is dropped server-side.
        cookieless_mode: 'always',
        // Replay needs consent-backed storage we deliberately don't ask for.
        disable_session_recording: true,
        // Client-side route changes are the norm here (Expo Router), so the
        // default load-only pageview would miss almost everything.
        capture_pageview: 'history_change',
      });
      client = posthog;
      for (const q of queue) posthog.capture(q.event, q.props);
      queue.length = 0;
    })
    .catch(() => {
      // Blocked by an ad blocker or offline — analytics must never break the app.
      loading = false;
      queue.length = 0;
    });
}

export function track(event: AnalyticsEvent, props?: AnalyticsProps): void {
  if (!enabled()) return;
  if (client) {
    try {
      client.capture(event, props);
    } catch {
      // Never let instrumentation take down a practice session.
    }
    return;
  }
  if (queue.length < MAX_QUEUE) queue.push({ event, props });
}

// Test seam — the module holds load-once state that would otherwise leak
// between cases.
export function __resetAnalytics(): void {
  client = null;
  loading = false;
  queue.length = 0;
}

export function __analyticsQueueSize(): number {
  return queue.length;
}
