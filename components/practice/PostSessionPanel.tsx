// Shared post-session panel — Log/Discard prompt, logged-confirmation toast,
// and coaching CTA. Rendered identically by Standard and Guided modes.
// (Routine progress is surfaced via the TodayRoutineCard on Practice; the
// per-session "Next: X →" / "Routine done" banner was removed in favor of
// keeping Start visually primary at idle.)
import { useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Fonts, Radii, Spacing, Typography } from "@/constants/theme";
import type { SessionRecord } from "@/lib/progress";
import { isPersonalBest } from "@/lib/progress/stats";
import { useTheme } from "@/hooks/use-theme";

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
}: Props) {
  const { colors } = useTheme();
  const [sessionNote, setSessionNote] = useState("");

  // Personal-best detection — only when we have comparison data and the session is pending.
  const personalBest =
    pendingSession && allSessions
      ? isPersonalBest(allSessions, pendingSession)
      : null;

  // Octave-below hint — true if any note in any key attempt was matched an octave low.
  const hasOctaveBelow =
    pendingSession?.keyAttempts.some((ka) =>
      ka.notes.some((n) => (n as { octaveBelow?: boolean }).octaveBelow === true)
    ) ?? false;

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
                  ? `★ First time through — ${Math.round(
                      (pendingSession!.keyAttempts.reduce((a, k) => a + k.meanAccuracyPct, 0) /
                        Math.max(1, pendingSession!.keyAttempts.length))
                    )}%`
                  : `★ Personal best on this exercise — ${Math.round(
                      pendingSession!.keyAttempts.reduce((a, k) => a + k.meanAccuracyPct, 0) /
                        Math.max(1, pendingSession!.keyAttempts.length)
                    )}% (was ${Math.round(personalBest.previousBest)}%)`}
              </Text>
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

          {/* Octave-below hint — calm, non-alarming; surfaces the register mismatch.
              Scoring is octave-honest, so this is informational only. */}
          {hasOctaveBelow && (
            <View style={[styles.octaveBanner, { backgroundColor: colors.bgSurface, borderColor: colors.warning }]}>
              <Text style={[styles.octaveBannerText, { color: colors.textSecondary, fontFamily: Fonts.body }]}>
                You sang this an octave below the notation — your score is still accurate. That&apos;s
                completely fine; many singers are most comfortable an octave down.
              </Text>
            </View>
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
  octaveBanner: {
    borderRadius: Radii.md,
    borderLeftWidth: 3,
    borderWidth: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    gap: Spacing["2xs"],
  },
  octaveBannerText: {
    fontSize: Typography.sm.size,
    lineHeight: Typography.sm.lineHeight,
  },
  octaveBannerSwitch: {
    fontSize: Typography.sm.size,
    lineHeight: Typography.sm.lineHeight,
  },
});
