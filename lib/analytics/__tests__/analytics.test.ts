import { __analyticsQueueSize, __resetAnalytics, initAnalytics, track } from '../index';
import type { AnalyticsEvent } from '../events';

// EXPO_PUBLIC_POSTHOG_KEY is read at module load and is unset in tests, so this
// suite exercises the unconfigured path — which is also the local-dev and
// deploy-preview path, and the one that must never throw.
describe('analytics (no key configured)', () => {
  beforeEach(() => {
    __resetAnalytics();
  });

  it('initAnalytics is a no-op and does not throw', () => {
    expect(() => initAnalytics()).not.toThrow();
    expect(__analyticsQueueSize()).toBe(0);
  });

  it('track does not throw and drops events instead of queueing them', () => {
    expect(() => track('practice_started', { exerciseId: 'five-note-scale' })).not.toThrow();
    expect(() => track('mic_error_shown', { reason: 'denied', surface: 'practice' })).not.toThrow();
    expect(() => track('pattern_completed', { keys: 3, completedAllKeys: false })).not.toThrow();
    expect(__analyticsQueueSize()).toBe(0);
  });

  it('tolerates being called with no props', () => {
    expect(() => track('practice_started')).not.toThrow();
  });

  it('accepts null props (range test can complete without a usable range)', () => {
    expect(() => track('range_test_completed', { voiceType: null, semitoneSpan: null })).not.toThrow();
  });

  // Guards against an event being added to the union but never wired up, and
  // against a call site drifting to a name the union doesn't carry.
  it('every declared event name is a valid track() argument', () => {
    const all: AnalyticsEvent[] = [
      'practice_started',
      'pattern_completed',
      'mic_error_shown',
      'session_logged',
      'onboarding_finished',
      'range_test_started',
      'range_test_completed',
    ];
    for (const e of all) expect(() => track(e)).not.toThrow();
    expect(all).toHaveLength(new Set(all).size);
  });
});
