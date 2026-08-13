import { __analyticsQueueSize, __resetAnalytics, initAnalytics, track } from '../index';

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
    expect(() => track('mic_error_shown', { reason: 'denied' })).not.toThrow();
    expect(() => track('pattern_completed', { keys: 3, scored: true })).not.toThrow();
    expect(__analyticsQueueSize()).toBe(0);
  });

  it('tolerates being called with no props', () => {
    expect(() => track('practice_started')).not.toThrow();
  });
});
