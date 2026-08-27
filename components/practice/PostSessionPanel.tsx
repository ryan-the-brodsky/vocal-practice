// Shared post-session panel — Log/Discard prompt, logged-confirmation toast,
// and coaching CTA. Rendered identically by Standard and Guided modes.
// (Routine progress is surfaced via the TodayRoutineCard on Practice; the
// per-session "Next: X →" / "Routine done" banner was removed in favor of
// keeping Start visually primary at idle.)
import { useEffect, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Fonts, Radii, Spacing, Typography } from "@/constants/theme";
import { track } from "@/lib/analytics";
import { readPracticeContext } from "@/lib/analytics/practiceCounters";
import type { SessionRecord } from "@/lib/progress";
import { isPersonalBest } from "@/lib/progress/stats";
import { hasSeenGuidedNudge, markGuidedNudgeSeen } from "@/lib/settings/guidedNudge";
import { useTheme } from "@/hooks/use-theme";

// The Guided-mode nudge shows AT MOST ONCE per device — a one-time "did you know
// this exists?", never a repeated reminder of a poor score. Two ways to earn it:
// a rough session (avg this far off pitch), or — for an experienced practicer who
// never hit a rough patch — a plain reminder once they're clearly a regular.
const GUIDED_NUDGE_CENTS = 90; // ~a whole semitone off on average
const GUIDED_NUDGE_PRACTICES = 5; // experienced-practicer reminder threshold

type NudgeReason = "rough" | "returning";

interface CoachingCta {
  sessionId: string;
  previewText: string;
  previewSubline?: string;
}

interface Props {
  /** Set when a session has finished but hasn't been persisted yet. */
  pendingSession: SessionRecord | null;
  /** Confirmation copy shown briefly after Log. */
  loggedMessage: string | null;
  onLog: (note: string) => void;
  onDiscard: () => void;
  coachingCta: CoachingCta | null;
  onTapCoaching: (sessionId: string) => void;
  /** True when the surrounding mode body is in its quiescent state — gates the
   *  Log/Discard panel so it doesn't render mid-session. */
  isIdle: boolean;
  /** All previously logged sessions for this exercise — used for personal-best detection. */
  allSessions?: SessionRecord[];
  /** Silent-log mode (Standard): when set, the panel renders just these two
   *  implied-outcome buttons — primary "Next exercise →" (logs silently) and
   *  secondary "Try again" (discards) — instead of the explicit Log/Discard +
   *  note. The note field and "won't count unless logged" hint are dropped.
   *  Guided mode omits both props and keeps the legacy explicit Log/Discard. */
  primaryAction?: ReactNode;
  secondaryAction?: ReactNode;
  /** True when switching to Guided is possible here (Standard mode + a
   *  pitch-detected exercise). Gates the beginner "try slow mode" nudge. */
  canGuide?: boolean;
  /** Switches the surrounding screen into Guided mode and clears this panel. */
  onTryGuided?: () => void;
}

export function PostSessionPanel({
  pendingSession,
  loggedMessage,
  onLog,
  onDiscard,
  coachingCta,
  onTapCoaching,
  isIdle,
  allSessions,
  primaryAction,
  secondaryAction,
  canGuide,
  onTryGuided,
}: Props) {
  const { colors } = useTheme();
  const [sessionNote, setSessionNote] = useState("");

  // Personal-best detection — only when we have comparison data and the session is pending.
  const personalBest =
    pendingSession && allSessions
      ? isPersonalBest(allSessions, pendingSession)
      : null;

  // Average distance off pitch, in cents — a tuning measurement, deliberately
  // NOT a percent (a "57%" reads like an academic F when it's really a fine
  // beginner result). Lower is better; ±50¢ is the width of a half-semitone.
  const avgCentsOff = pendingSession
    ? (() => {
        const notes = pendingSession.keyAttempts
          .flatMap((k) => k.notes)
          .filter((n) => (n.framesAboveClarity ?? 0) > 0);
        if (notes.length === 0) return null;
        return Math.round(
          notes.reduce((a, n) => a + Math.abs(n.meanCentsDeviation), 0) / notes.length,
        );
      })()
    : null;

  // Decide once per finished session whether to surface the one-time Guided
  // nudge. Marking it seen the moment it shows guarantees it appears at most
  // ONCE per device, ever — a discovery, not a recurring "you scored poorly".
  const [guidedNudge, setGuidedNudge] = useState<{ reason: NudgeReason } | null>(null);
  const pendingId = pendingSession?.id;
  useEffect(() => {
    if (!canGuide || !onTryGuided || !pendingId || hasSeenGuidedNudge()) {
      setGuidedNudge(null);
      return;
    }
    let reason: NudgeReason | null = null;
    if (avgCentsOff != null && avgCentsOff >= GUIDED_NUDGE_CENTS) reason = "rough";
    else if (readPracticeContext().practiceNumber >= GUIDED_NUDGE_PRACTICES) reason = "returning";
    if (!reason) {
      setGuidedNudge(null);
      return;
    }
    setGuidedNudge({ reason });
    markGuidedNudgeSeen();
    track("guided_nudge_shown", { reason, avgCentsOff });
  }, [pendingId]); // eslint-disable-line react-hooks/exhaustive-deps

  const showGuidedNudge = !!guidedNudge && isIdle && !loggedMessage;

  return (
    <>
      {pendingSession && isIdle && !loggedMessage && (
        <View
          style={[styles.logPanel, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle }]}
        >
          {/* Personal-best badge — shown whenever we have session comparison data. */}
          {personalBest?.isBest && (
            <View style={[styles.bestBadge, { backgroundColor: colors.accentMuted, borderColor: colors.accent }]}>
              <Text style={[styles.bestBadgeText, { color: colors.accent, fontFamily: Fonts.bodySemibold }]}>
                {personalBest.previousBest === null
                  ? `★ First time through${avgCentsOff != null ? ` · avg ±${avgCentsOff}¢ off pitch` : ""}`
                  : `★ New personal best on this exercise${avgCentsOff != null ? ` · avg ±${avgCentsOff}¢ off pitch` : ""}`}
              </Text>
            </View>
          )}

          {showGuidedNudge && guidedNudge && (
            <View style={[styles.nudge, { backgroundColor: colors.accentMuted, borderColor: colors.accent }]}>
              <Text style={[styles.nudgeText, { color: colors.textPrimary, fontFamily: Fonts.body }]}>
                {guidedNudge.reason === "rough" ? (
                  <>
                    That one raced ahead of you, and that&apos;s completely normal at first.{" "}
                    <Text style={{ fontFamily: Fonts.bodySemibold }}>Guided mode</Text> slows things
                    down and waits for you to land each note before it moves on.
                  </>
                ) : (
                  <>
                    Quick tip while you&apos;re here:{" "}
                    <Text style={{ fontFamily: Fonts.bodySemibold }}>Guided mode</Text> is a slower,
                    hold-and-match drill that waits for you to land each note. Handy for nailing a
                    tricky passage.
                  </>
                )}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Switch to Guided slow mode and try again"
                onPress={() => {
                  track("guided_nudge_accepted", { reason: guidedNudge.reason, avgCentsOff });
                  onTryGuided?.();
                }}
                style={({ pressed }) => [
                  styles.nudgeBtn,
                  { backgroundColor: colors.accent },
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text style={[styles.nudgeBtnText, { color: colors.bgCanvas, fontFamily: Fonts.bodySemibold }]}>
                  Try Guided (slow) →
                </Text>
              </Pressable>
            </View>
          )}

          {primaryAction ? (
            /* Silent-log mode (Standard): two implied-outcome buttons. Logging
               happens inside the primary action; "Try again" discards. */
            <View style={styles.actionRow}>
              {secondaryAction}
              {primaryAction}
            </View>
          ) : (
            /* Legacy explicit mode (Guided): Log / Discard + optional note. */
            <>
              <View style={styles.actionRow}>
                <Pressable
                  style={[styles.rowBtn, { backgroundColor: colors.accent, borderColor: colors.accent }]}
                  onPress={() => {
                    onLog(sessionNote);
                    setSessionNote("");
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Log this session to your history"
                >
                  <Text numberOfLines={1} style={[styles.rowBtnText, { color: colors.canvas, fontFamily: Fonts.bodySemibold }]}>
                    Log session
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.rowBtn, { backgroundColor: "transparent", borderColor: colors.borderStrong }]}
                  onPress={() => {
                    track("session_discarded", { exerciseId: pendingSession.exerciseId });
                    onDiscard();
                    setSessionNote("");
                  }}
                  accessibilityRole="button"
                  accessibilityLabel="Discard this session"
                >
                  <Text numberOfLines={1} style={[styles.rowBtnText, { color: colors.textSecondary, fontFamily: Fonts.bodyMedium }]}>
                    Discard
                  </Text>
                </Pressable>
              </View>

              <TextInput
                style={[
                  styles.logNoteInput,
                  {
                    borderColor: colors.borderStrong,
                    color: colors.textPrimary,
                    backgroundColor: colors.canvas,
                    fontFamily: Fonts.body,
                  },
                ]}
                placeholder='Add a note (optional) — e.g. "Felt good on the high notes"'
                placeholderTextColor={colors.textTertiary}
                value={sessionNote}
                onChangeText={setSessionNote}
                returnKeyType="done"
                blurOnSubmit
              />

              <Text style={[styles.logHint, { color: colors.textTertiary, fontFamily: Fonts.body }]}>
                This won't count toward your history unless you log it.
              </Text>
            </>
          )}
        </View>
      )}

      {loggedMessage && (
        <Text style={[styles.loggedConfirm, { color: colors.success, fontFamily: Fonts.bodyMedium }]}>
          {loggedMessage}
        </Text>
      )}

      {coachingCta && !pendingSession && (
        <Pressable
          style={[styles.reviewCta, { backgroundColor: colors.bgSurface, borderColor: colors.accent }]}
          onPress={() => onTapCoaching(coachingCta.sessionId)}
          accessibilityRole="button"
          accessibilityLabel={`Coach this session: ${coachingCta.previewText}`}
        >
          <Text style={[styles.reviewCtaText, { color: colors.accent, fontFamily: Fonts.bodySemibold }]}>
            {coachingCta.previewText} →
          </Text>
          {coachingCta.previewSubline && (
            <Text style={[styles.reviewCtaSubtle, { color: colors.textSecondary, fontFamily: Fonts.body }]}>
              {coachingCta.previewSubline}
            </Text>
          )}
        </Pressable>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  logPanel: {
    borderRadius: Radii.md,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  logHint: {
    fontSize: Typography.sm.size,
    lineHeight: Typography.sm.lineHeight,
  },
  logNoteInput: {
    borderWidth: 1,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    fontSize: Typography.sm.size,
    lineHeight: Typography.sm.lineHeight,
  },
  // Post-session actions laid out as one scannable row of options.
  actionRow: {
    flexDirection: "row",
    gap: Spacing.xs,
    flexWrap: "wrap",
  },
  rowBtn: {
    flex: 1,
    minWidth: 104,
    minHeight: 48,
    borderRadius: Radii.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.sm,
  },
  rowBtnText: {
    fontSize: Typography.md.size,
    lineHeight: Typography.md.lineHeight,
  },
  loggedConfirm: {
    fontSize: Typography.sm.size,
    lineHeight: Typography.sm.lineHeight,
    textAlign: "center",
  },
  reviewCta: {
    borderRadius: Radii.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderLeftWidth: 3,
    gap: Spacing["2xs"],
  },
  reviewCtaText: {
    fontSize: Typography.md.size,
    lineHeight: Typography.md.lineHeight,
  },
  reviewCtaSubtle: {
    fontSize: Typography.sm.size,
    lineHeight: Typography.sm.lineHeight,
  },
  bestBadge: {
    borderRadius: Radii.md,
    borderWidth: 1,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  bestBadgeText: {
    fontSize: Typography.sm.size,
    lineHeight: Typography.sm.lineHeight,
  },
  nudge: {
    borderRadius: Radii.md,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  nudgeText: {
    fontSize: Typography.sm.size,
    lineHeight: Typography.sm.lineHeight,
  },
  nudgeBtn: {
    alignSelf: "flex-start",
    borderRadius: Radii.md,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    minHeight: 40,
    justifyContent: "center",
  },
  nudgeBtnText: {
    fontSize: Typography.sm.size,
    lineHeight: Typography.sm.lineHeight,
  },
});
