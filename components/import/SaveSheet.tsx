import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { AccompanimentPreset, VoicePart } from "@/lib/exercises/types";
import { useTheme } from "@/hooks/use-theme";
import { Spacing, Radii, Typography, Fonts } from "@/constants/theme";

const VOICE_PARTS: VoicePart[] = ["tenor", "baritone", "bass", "alto", "soprano", "mezzo"];
const PRESETS: { value: AccompanimentPreset; label: string }[] = [
  { value: "classical", label: "Classical" },
  { value: "studio", label: "Studio" },
  { value: "beginner", label: "Beginner" },
  { value: "lip-trill", label: "Lip-trill" },
  { value: "drone", label: "Drone" },
];

export interface SaveSheetState {
  name: string;
  voicePart: VoicePart;
  accompaniment: AccompanimentPreset;
}

export default function SaveSheet({
  defaultName,
  defaultVoicePart,
  defaultAccompaniment,
  saving,
  onConfirm,
  onCancel,
}: {
  defaultName: string;
  defaultVoicePart: VoicePart;
  defaultAccompaniment: AccompanimentPreset;
  saving?: boolean;
  onConfirm: (state: SaveSheetState) => void;
  onCancel: () => void;
}) {
  const { colors } = useTheme();
  const [name, setName] = useState(defaultName);
  const [voicePart, setVoicePart] = useState<VoicePart>(defaultVoicePart);
  const [accompaniment, setAccompaniment] = useState<AccompanimentPreset>(defaultAccompaniment);

  // Refresh when defaults change (e.g. user goes back, picks another file).
  useEffect(() => {
    setName(defaultName);
    setVoicePart(defaultVoicePart);
    setAccompaniment(defaultAccompaniment);
  }, [defaultName, defaultVoicePart, defaultAccompaniment]);

  function handleConfirm() {
    const trimmed = name.trim() || defaultName;
    onConfirm({ name: trimmed, voicePart, accompaniment });
  }

  return (
    <View style={[styles.sheet, { backgroundColor: colors.bgSurface, borderRadius: Radii.lg, padding: Spacing.md, borderWidth: 1, borderColor: colors.borderSubtle, gap: Spacing.sm }]}>
      <Text style={{ fontSize: Typography.md.size, lineHeight: Typography.md.lineHeight, fontFamily: Fonts.display, color: colors.textPrimary }}>
        Save as exercise
      </Text>

      <View style={[styles.field, { gap: Spacing['2xs'] }]}>
        <Text style={{ fontSize: Typography.xs.size, lineHeight: Typography.xs.lineHeight, fontFamily: Fonts.bodyMedium, color: colors.textTertiary, textTransform: "uppercase", letterSpacing: 0.6 }}>
          Name
        </Text>
        <TextInput
          style={[styles.input, { borderColor: colors.borderStrong, borderRadius: Radii.md, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, fontSize: Typography.base.size, lineHeight: Typography.base.lineHeight, color: colors.textPrimary, backgroundColor: colors.canvas, fontFamily: Fonts.body }]}
          value={name}
          onChangeText={setName}
          placeholder={defaultName}
          placeholderTextColor={colors.textTertiary}
          editable={!saving}
        />
      </View>

      <View style={[styles.field, { gap: Spacing['2xs'] }]}>
        <Text style={{ fontSize: Typography.xs.size, lineHeight: Typography.xs.lineHeight, fontFamily: Fonts.bodyMedium, color: colors.textTertiary, textTransform: "uppercase", letterSpacing: 0.6 }}>
          Voice part
        </Text>
        <View style={[styles.row, { gap: Spacing['2xs'] }]}>
          {VOICE_PARTS.map((vp) => (
            <Pressable
              key={vp}
              onPress={() => setVoicePart(vp)}
              style={[
                styles.chip,
                {
                  paddingHorizontal: Spacing.sm,
                  paddingVertical: Spacing['2xs'],
                  borderRadius: Radii.pill,
                  backgroundColor: voicePart === vp ? colors.accentMuted : colors.bgSurface,
                  borderColor: voicePart === vp ? colors.accent : colors.borderSubtle,
                  minHeight: 44,
                  justifyContent: "center",
                },
                saving && styles.chipDisabled,
              ]}
              disabled={saving}
            >
              <Text style={{ color: voicePart === vp ? colors.accent : colors.textSecondary, fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight, fontFamily: voicePart === vp ? Fonts.bodyMedium : Fonts.body, textTransform: "capitalize" }}>
                {vp}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={[styles.field, { gap: Spacing['2xs'] }]}>
        <Text style={{ fontSize: Typography.xs.size, lineHeight: Typography.xs.lineHeight, fontFamily: Fonts.bodyMedium, color: colors.textTertiary, textTransform: "uppercase", letterSpacing: 0.6 }}>
          Accompaniment
        </Text>
        <View style={[styles.row, { gap: Spacing['2xs'] }]}>
          {PRESETS.map((p) => (
            <Pressable
              key={p.value}
              onPress={() => setAccompaniment(p.value)}
              style={[
                styles.chip,
                {
                  paddingHorizontal: Spacing.sm,
                  paddingVertical: Spacing['2xs'],
                  borderRadius: Radii.pill,
                  backgroundColor: accompaniment === p.value ? colors.accentMuted : colors.bgSurface,
                  borderColor: accompaniment === p.value ? colors.accent : colors.borderSubtle,
                  minHeight: 44,
                  justifyContent: "center",
                },
                saving && styles.chipDisabled,
              ]}
              disabled={saving}
            >
              <Text style={{ color: accompaniment === p.value ? colors.accent : colors.textSecondary, fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight, fontFamily: accompaniment === p.value ? Fonts.bodyMedium : Fonts.body }}>
                {p.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={[styles.actions, { gap: Spacing.xs, marginTop: Spacing['2xs'] }]}>
        <Pressable
          style={[styles.btn, { backgroundColor: colors.bgSurface, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: Radii.md, paddingVertical: Spacing.sm, minHeight: 44 }]}
          onPress={onCancel}
          disabled={saving}
          accessibilityLabel="Go back"
        >
          <Text style={{ color: colors.textPrimary, fontSize: Typography.base.size, lineHeight: Typography.base.lineHeight, fontFamily: Fonts.bodyMedium }}>
            Back
          </Text>
        </Pressable>
        <Pressable
          style={[styles.btn, { backgroundColor: colors.accent, borderRadius: Radii.md, paddingVertical: Spacing.sm, minHeight: 44 }, saving && styles.btnDisabled]}
          onPress={handleConfirm}
          disabled={saving}
          accessibilityLabel={saving ? "Saving" : "Save exercise"}
        >
          <Text style={{ color: colors.bgCanvas, fontSize: Typography.base.size, lineHeight: Typography.base.lineHeight, fontFamily: Fonts.bodySemibold }}>
            {saving ? "Saving…" : "Save"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {},
  field: {},
  input: { borderWidth: 1 },
  row: { flexDirection: "row", flexWrap: "wrap" },
  chip: { borderWidth: 1 },
  chipDisabled: { opacity: 0.5 },
  actions: { flexDirection: "row" },
  btn: { flex: 1, alignItems: "center" },
  btnDisabled: { opacity: 0.5 },
});
