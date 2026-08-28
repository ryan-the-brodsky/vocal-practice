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
      'practice_stopped',
      'session_discarded',
      'follow_along_finished',
      'routine_advanced',
      'exercise_selected',
      'voice_part_selected',
      'mode_changed',
      'octave_shift_set',
      'tempo_changed',
      'setting_changed',
      'headphones_answered',
      'guided_nudge_shown',
      'guided_nudge_accepted',
      'guided_next_tonic',
      'demo_skipped',
      'onboarding_step_viewed',
      'onboarding_finished',
      'routine_edited',
      'routine_edit_opened',
      'routine_card_expanded',
      'routine_item_pressed',
      'plan_exercise_toggled',
      'plan_practice_pressed',
      'plan_cta_pressed',
      'pathway_expanded',
      'pathway_exercise_pressed',
      'pathway_selected',
      'progress_exercise_expanded',
      'progress_session_expanded',
      'user_content_deleted',
      'backup_exported',
      'backup_restored',
      'backup_nudge_dismissed',
      'coaching_started',
      'coaching_playback',
      'coaching_retry_started',
      'coaching_next_mistake',
      'coaching_bookmark',
      'coaching_saved_opened',
      'import_opened',
      'import_tab_selected',
      'import_kind_selected',
      'import_recording_started',
      'import_analysis_finished',
      'song_saved',
      'song_editor_action',
      'range_test_started',
      'range_test_completed',
      'range_test_cta_pressed',
      'range_test_restarted',
      'embed_exercise_played',
      'embed_exercise_open_full',
      'learn_search',
      'learn_category_selected',
      'learn_tool_card_pressed',
      'spotlight_share_pressed',
      'feedback_opened',
    ];
    for (const e of all) expect(() => track(e)).not.toThrow();
    expect(all).toHaveLength(new Set(all).size);
  });
});
