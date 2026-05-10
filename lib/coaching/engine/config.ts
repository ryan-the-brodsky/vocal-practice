// Tunable thresholds for the coaching engine. Single source of truth — see plan §13.

export const MIN_OBSERVATIONS_GLOBAL = 6;
export const MIN_OBSERVATIONS_TIER_GROUP = 3;
export const THRESHOLD_GLOBAL_CENTS = 20;
export const THRESHOLD_GROUP_CENTS = 25;
export const THRESHOLD_POSITION_ABS_CENTS = 30;
export const KEY_FATIGUE_MIN_KEYS = 4;
export const KEY_FATIGUE_MIN_R2 = 0.5;
export const KEY_FATIGUE_MIN_SLOPE = 5; // cents per key
export const COVERAGE_MIN = 0.6;
export const REGISTER_MISMATCH_GAP_CENTS = 40;

export const MAX_CANDIDATE_CAUSES_DEFAULT = 2;
export const MAX_OTHER_FINDINGS = 2;

// Counts as having "enough signal" for a coverage check on globals.
export const COVERAGE_MIN_ABS_CENTS = 10;
