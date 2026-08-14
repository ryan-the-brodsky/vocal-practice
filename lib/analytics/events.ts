// The events we send. Deliberately small: each one has to answer a question we
// actually have. The originating question was what the LLM-referral traffic
// landing on "/" does once it arrives.
export type AnalyticsEvent =
  // Practice loop.
  | 'practice_started'
  | 'pattern_completed'
  | 'mic_error_shown'
  | 'session_logged'
  // First run. Nearly every arrival is a first-time visitor, so onboarding is
  // the widest part of the funnel, not a side path.
  | 'onboarding_finished'
  // The /vocal-range-test tool page — the best-performing marketing surface, and
  // the one an LLM is most likely to recommend on its own.
  | 'range_test_started'
  | 'range_test_completed'
  // Feature discovery. Paced onboarding would stop *teaching* import and song
  // segments, so we need to know whether anyone finds them unaided first.
  // See PACED_ONBOARDING_PLAN.md §3.
  | 'import_opened'
  | 'song_saved'
  | 'routine_edited'
  | 'coaching_started'
  | 'feedback_opened';

export type AnalyticsProps = Record<string, string | number | boolean | null | undefined>;
