// The only events we send. Deliberately tiny: the open question is what the
// LLM-referral traffic landing on "/" actually does, and three events answer it
// (pressed Start → hit a mic wall → finished a pattern).
export type AnalyticsEvent =
  | 'practice_started'
  | 'pattern_completed'
  | 'mic_error_shown';

export type AnalyticsProps = Record<string, string | number | boolean | null | undefined>;
