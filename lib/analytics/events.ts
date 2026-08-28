// The events we send. Each one answers a question we actually have. The
// originating question was what the LLM-referral traffic landing on "/" does
// once it arrives; on 2026-08-27 coverage was widened to every interactive
// surface so we can see whether each feature is used and working as intended.
// Volume is not a concern at this stage; prune once behaviour is understood.
export type AnalyticsEvent =
  // ── Practice loop ─────────────────────────────────────────────────────────
  | 'practice_started'
  | 'pattern_completed'
  | 'mic_error_shown'
  | 'session_logged'
  // Stop pressed before the plan finished. `keysScored` vs `plannedKeys`
  // separates "gave up" from "tried one key". pattern_completed can't see
  // a stop with zero scored keys.
  | 'practice_stopped'
  // Discard in the post-session panel (session_logged is the other branch).
  | 'session_discarded'
  // Follow-along exercises (no pitch detection): "Mark done" vs "Skip".
  | 'follow_along_finished'
  // "→ next" after a session: did the routine carry them to the next item?
  | 'routine_advanced'
  // Picker + settings changes on the Practice screen. `source` on
  // exercise_selected says whether the user chose or the routine auto-tracked.
  | 'exercise_selected'
  | 'voice_part_selected'
  | 'mode_changed'
  | 'octave_shift_set'
  | 'tempo_changed'
  | 'setting_changed'
  | 'headphones_answered'
  // Beginner rescue nudge into Guided mode.
  | 'guided_nudge_shown'
  | 'guided_nudge_accepted'
  // Inside a Guided run: advancing to the next tonic is the main progression action.
  | 'guided_next_tonic'
  // "Skip demo" during the demo phase.
  | 'demo_skipped'
  // ── First run ─────────────────────────────────────────────────────────────
  | 'onboarding_step_viewed'
  | 'onboarding_finished'
  // ── Routine / Plan / Pathways ─────────────────────────────────────────────
  | 'routine_edited'
  | 'routine_edit_opened'
  | 'routine_card_expanded'
  | 'routine_item_pressed'
  | 'plan_exercise_toggled'
  | 'plan_practice_pressed'
  | 'plan_cta_pressed'
  | 'pathway_expanded'
  | 'pathway_exercise_pressed'
  | 'pathway_selected'
  // ── Progress tab ──────────────────────────────────────────────────────────
  | 'progress_exercise_expanded'
  | 'progress_session_expanded'
  | 'user_content_deleted'
  | 'backup_exported'
  | 'backup_restored'
  | 'backup_nudge_dismissed'
  // ── Coaching ──────────────────────────────────────────────────────────────
  | 'coaching_started'
  | 'coaching_playback'
  | 'coaching_retry_started'
  | 'coaching_next_mistake'
  | 'coaching_bookmark'
  | 'coaching_saved_opened'
  // ── Import / songs ────────────────────────────────────────────────────────
  | 'import_opened'
  | 'import_tab_selected'
  | 'import_kind_selected'
  | 'import_recording_started'
  | 'import_analysis_finished'
  | 'song_saved'
  | 'song_editor_action'
  // ── Learn / marketing surfaces ────────────────────────────────────────────
  | 'range_test_started'
  | 'range_test_completed'
  | 'range_test_cta_pressed'
  | 'range_test_restarted'
  | 'embed_exercise_played'
  | 'embed_exercise_open_full'
  | 'learn_search'
  | 'learn_category_selected'
  | 'learn_tool_card_pressed'
  | 'spotlight_share_pressed'
  // ── Misc ──────────────────────────────────────────────────────────────────
  | 'feedback_opened';

export type AnalyticsProps = Record<string, string | number | boolean | null | undefined>;

// Property conventions (keep them boring and consistent):
// - exerciseId, voicePart, mode ('standard' | 'guided'), surface, slug, pathwayId
// - setting_changed: { setting: 'accompaniment' | 'guidance' | 'demo' |
//   'guided_threshold' | 'guided_repeat_mode' | 'raw_capture' | 'tonic_reset' |
//   'notation_engine', value }
// - exercise_selected: { exerciseId, source: 'picker' | 'routine' | 'deeplink' | 'auto' | 'import' }
// - tempo_changed: { scale, bpm, exerciseId, via: 'drag' | 'step' | 'reset' }
// - octave_shift_set: { octaveShift: 0 | -12 }
// - headphones_answered: { confirmed: boolean }
// - practice_stopped: { exerciseId, mode, keysScored, plannedKeys, elapsedMs }
// - follow_along_finished: { exerciseId, marked: 'done' | 'skip' }
// - routine_advanced: { fromExerciseId, toExerciseId }
// - onboarding_step_viewed: { stepKey, index }
// - routine_card_expanded / routine_item_pressed: { surface: 'practice' | 'progress', exerciseId? }
// - plan_exercise_toggled: { exerciseId, added: boolean, capability }
// - plan_cta_pressed: { cta: 'edit_routine' | 'import' | 'range_test' | 'learn' }
// - pathway_*: { pathwayId, exerciseId?, exerciseCount? }
// - progress_*_expanded: { exerciseId, kind?: 'builtin' | 'imported' | 'song' }
// - user_content_deleted: { kind: 'exercise' | 'song' }
// - backup_restored: { ok: boolean, count? }
// - coaching_playback: { which: 'correct' | 'yours', variant }
// - coaching_next_mistake: { via: 'more_examples' | 'other_findings' }
// - coaching_bookmark: { kind: 'diagnosis' | 'tip', saved: boolean }
// - import_tab_selected: { tab: 'upload' | 'record' }; import_kind_selected: { kind: 'exercise' | 'song' }
// - import_analysis_finished: { ok: boolean, source: 'upload' | 'record', noteCount? }
// - song_editor_action: { action: 'open' | 'preview' | 'rename' | 'nudge' | 'drag' | 'lyrics' | 'save' | 'engine_toggle', songId?, via? }
// - range_test_cta_pressed: { cta: 'practice' | 'learn', voiceType? }; range_test_restarted: { from: 'walk' | 'result' | 'no_note' }
// - learn_search: { queryLength, resultCount }; learn_category_selected: { category }
// - spotlight_share_pressed: { slug, network }
