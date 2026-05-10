// Shared post-session panel — Log/Discard prompt, coaching CTA, and routine
// auto-advance. Rendered identically by Standard and Guided modes.
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Fonts, Radii, Spacing, Typography } from "@/constants/theme";
import { exerciseName } from "@/lib/exercises/names";
import type { SessionRecord } from "@/lib/progress";
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
  nextRoutineItemId: string | null;
  routineAllDone: boolean;
  onAutoAdvance: (exerciseId: string) => void;
  /** True when the surrounding mode body is in its quiescent state — gates
   *  the routine auto-advance / done banner so they don't render mid-session. */
  isIdle: boolean;
}

export function PostSessionPanel({
  pendingSession,
  loggedMessage,
  onLog,
  onDiscard,
  coachingCta,
  onTapCoaching,
  nextRoutineItemId,
  routineAllDone,
  onAutoAdvance,
  isIdle,
}: Props) {
  const { colors } = useTheme();
  const [sessionNote, setSessionNote] = useState("");

  return (
    <>
      {pendingSession && isIdle && !loggedMessage && (
        <View
          style={[styles.logPanel, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle }]}
        >
          <Text style={[styles.logHint, { color: colors.textTertiary, fontFamily: Fonts.body }]}>
            This won't count toward your history unless you log it.
          </Text>
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
            placeholder='Note (optional) — e.g. "Felt good on the high notes"'
            placeholderTextColor={colors.textTertiary}
            value={sessionNote}
            onChangeText={setSessionNote}
            returnKeyType="done"
            blurOnSubmit
          />
          <Pressable
            style={[styles.btn, { backgroundColor: colors.accent }]}
            onPress={() => {
              onLog(sessionNote);
              setSessionNote("");
            }}
          >
            <Text style={[styles.btnText, { color: colors.canvas, fontFamily: Fonts.bodySemibold }]}>
              Log session
            </Text>
          </Pressable>
          <Pressable
            style={styles.discardLink}
            onPress={() => {
              onDiscard();
              setSessionNote("");
            }}
          >
            <Text style={[styles.discardLinkText, { color: colors.textTertiary, fontFamily: Fonts.body }]}>
              Discard
            </Text>
          </Pressable>
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

      {isIdle && !pendingSession && nextRoutineItemId && (
        <Pressable
          style={[styles.nextCta, { backgroundColor: colors.accent }]}
          onPress={() => onAutoAdvance(nextRoutineItemId)}
          accessibilityRole="button"
          accessibilityLabel={`Practice next: ${exerciseName(nextRoutineItemId)}`}
        >
          <Text style={[styles.nextCtaText, { color: colors.canvas, fontFamily: Fonts.bodySemibold }]}>
            Next: {exerciseName(nextRoutineItemId)} →
          </Text>
        </Pressable>
      )}

      {isIdle && !pendingSession && !nextRoutineItemId && routineAllDone && (
        <View
          style={[styles.routineDoneBanner, { backgroundColor: colors.bgSurface, borderColor: colors.success }]}
        >
          <Text style={[styles.routineDoneText, { color: colors.success, fontFamily: Fonts.bodySemibold }]}>
            Routine done for today.
          </Text>
        </View>
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
  btn: {
    paddingVertical: Spacing.md,
    borderRadius: Radii.md,
    alignItems: "center",
    minHeight: 44,
  },
  btnText: {
    fontSize: Typography.md.size,
    lineHeight: Typography.md.lineHeight,
  },
  discardLink: { alignItems: "center", paddingVertical: Spacing.xs, minHeight: 36 },
  discardLinkText: {
    fontSize: Typography.sm.size,
    lineHeight: Typography.sm.lineHeight,
    textDecorationLine: "underline",
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
  nextCta: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.md,
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
  },
  nextCtaText: {
    fontSize: Typography.md.size,
    lineHeight: Typography.md.lineHeight,
  },
  routineDoneBanner: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.md,
    borderWidth: 1,
    alignItems: "center",
  },
  routineDoneText: {
    fontSize: Typography.sm.size,
    lineHeight: Typography.sm.lineHeight,
  },
});
