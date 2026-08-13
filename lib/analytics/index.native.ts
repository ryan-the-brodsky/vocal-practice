import type { AnalyticsEvent, AnalyticsProps } from './events';

export type { AnalyticsEvent, AnalyticsProps };

// Native ships no analytics — posthog-js is a browser SDK, and the iOS build
// isn't a distribution surface yet. Stubs keep call sites platform-free.
export function initAnalytics(): void {}

export function track(_event: AnalyticsEvent, _props?: AnalyticsProps): void {}

export function __resetAnalytics(): void {}

export function __analyticsQueueSize(): number {
  return 0;
}
