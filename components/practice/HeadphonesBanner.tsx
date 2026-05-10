import AsyncStorage from "@react-native-async-storage/async-storage";
import { Fonts, Radii, Spacing, Typography } from "@/constants/theme";
import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/hooks/use-theme";

// Module-level: null until answered this JS session (resets on cold app start).
// Backed by AsyncStorage so Expo hot-reload doesn't re-prompt on every file save.
const SESSION_KEY = "vocal-training:settings:headphones-confirmed-session";
let sessionAnswer: boolean | null = null;

export interface HeadphonesModalProps {
  /** Called when the modal is dismissed. confirmed=true means wearing headphones. */
  onConfirm: (confirmed: boolean) => void;
}

/**
 * Modal shown once per cold app session before the first exercise start.
 * Resets on each JS bundle load; AsyncStorage skips re-prompt during hot-reload only.
 */
export default function HeadphonesModal({ onConfirm }: HeadphonesModalProps) {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (sessionAnswer !== null) {
      onConfirm(sessionAnswer);
      return;
    }
    // Hot-reload case: check if we answered earlier in this same session.
    AsyncStorage.getItem(SESSION_KEY)
      .then((v) => {
        if (v === "yes" || v === "no") {
          // Same dev session (hot-reload) — restore without re-prompting.
          sessionAnswer = v === "yes";
          onConfirm(sessionAnswer);
        } else {
          setVisible(true);
        }
      })
      .catch(() => setVisible(true));
    // Clear the key on unmount/next cold start so a fresh app load always prompts.
    return () => {
      AsyncStorage.removeItem(SESSION_KEY).catch(() => {});
    };
  }, []);

  function handleChoice(confirmed: boolean) {
    sessionAnswer = confirmed;
    AsyncStorage.setItem(SESSION_KEY, confirmed ? "yes" : "no").catch(() => {});
    setVisible(false);
    onConfirm(confirmed);
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.bgEmphasis, borderColor: colors.borderOnEmphasis }]}>
          <Text style={[styles.title, { color: colors.textOnEmphasis, fontFamily: Fonts.displaySemibold }]}>
            Are you wearing headphones?
          </Text>
          <Text style={[styles.body, { color: colors.textOnEmphasisDim, fontFamily: Fonts.body }]}>
            Without headphones the mic picks up the piano from your speakers. The app
            may score the piano instead of your voice, making results look better than
            they are.
          </Text>
          <Pressable
            style={[styles.btn, { backgroundColor: colors.accent }]}
            onPress={() => handleChoice(true)}
            accessibilityLabel="Yes, I'm wearing headphones"
          >
            <Text style={[styles.btnPrimaryText, { color: colors.canvas, fontFamily: Fonts.bodySemibold }]}>
              Yes, I'm wearing headphones
            </Text>
          </Pressable>
          <Pressable
            style={[styles.btn, styles.btnSecondary, { borderColor: colors.borderOnEmphasis }]}
            onPress={() => handleChoice(false)}
            accessibilityLabel="Continue without headphones"
          >
            <Text style={[styles.btnSecondaryText, { color: colors.textOnEmphasisDim, fontFamily: Fonts.bodyMedium }]}>
              Continue without (less accurate)
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
  },
  card: {
    borderRadius: Radii.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    width: "100%",
    maxWidth: 400,
    gap: Spacing.sm,
    shadowColor: "rgba(0,0,0,0.7)",
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  title: {
    fontSize: Typography.md.size,
    lineHeight: Typography.md.lineHeight,
  },
  body: {
    fontSize: Typography.sm.size,
    lineHeight: Typography.sm.lineHeight,
  },
  btn: {
    borderRadius: Radii.md,
    paddingVertical: Spacing.md,
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
  },
  btnPrimaryText: {
    fontSize: Typography.base.size,
    lineHeight: Typography.base.lineHeight,
  },
  btnSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
  },
  btnSecondaryText: {
    fontSize: Typography.sm.size,
    lineHeight: Typography.sm.lineHeight,
  },
});
