import { useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { AnalysisMode, DecodeInput } from "@/lib/analyze";
import type { VoicePart } from "@/lib/exercises/types";
import { useTheme } from "@/hooks/use-theme";
import { Spacing, Radii, Typography, Fonts } from "@/constants/theme";

const VOICE_PARTS: VoicePart[] = ["tenor", "baritone", "bass", "alto", "soprano", "mezzo"];
const MODES: { value: AnalysisMode; label: string }[] = [
  { value: "major", label: "Major" },
  { value: "minor", label: "Minor" },
  { value: "chromatic", label: "Chromatic" },
];

// Limited tonic picker — common octaves for vocal range. User types if they need outside.
const TONIC_PRESETS = [
  "C3", "D3", "E3", "F3", "G3", "A3", "B3",
  "C4", "D4", "E4", "F4", "G4", "A4", "B4",
  "C5",
];

export interface ImportFormState {
  file: DecodeInput | null;
  filename: string;
  tonic: string;
  mode: AnalysisMode;
  voicePart: VoicePart;
  // empty string means auto-estimate
  tempoText: string;
}

export default function ImportForm({
  initialVoicePart,
  onAnalyze,
  disabled,
}: {
  initialVoicePart: VoicePart;
  onAnalyze: (state: {
    file: DecodeInput;
    filename: string;
    tonic: string;
    mode: AnalysisMode;
    voicePart: VoicePart;
    tempoBpm?: number;
  }) => void;
  disabled?: boolean;
}) {
  const { colors } = useTheme();
  const [file, setFile] = useState<DecodeInput | null>(null);
  const [filename, setFilename] = useState<string>("");
  const [tonic, setTonic] = useState<string>("C4");
  const [tonicCustom, setTonicCustom] = useState<string>("");
  const [mode, setMode] = useState<AnalysisMode>("major");
  const [voicePart, setVoicePart] = useState<VoicePart>(initialVoicePart);
  const [tempoText, setTempoText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const webInputRef = useRef<HTMLInputElement | null>(null);

  function handlePickWeb() {
    setError(null);
    webInputRef.current?.click();
  }

  function handleWebFileChange(e: { target: HTMLInputElement }) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setFilename(f.name);
  }

  async function handlePickNative() {
    setError(null);
    try {
      // Lazy-loaded so web bundles don't drag the native module.
      const dp = await import("expo-document-picker");
      const res = await dp.getDocumentAsync({
        type: "audio/*",
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (res.canceled) return;
      const asset = res.assets[0];
      if (!asset) return;
      // expo-document-picker gives us a file URI; the native decoder handles it.
      setFile(asset.uri);
      setFilename(asset.name ?? "recording");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function handleSubmit() {
    setError(null);
    if (!file) {
      setError("Pick an audio file first.");
      return;
    }
    const finalTonic = tonicCustom.trim() || tonic;
    let tempoBpm: number | undefined;
    const parsed = tempoText.trim();
    if (parsed) {
      const n = Number(parsed);
      if (!Number.isFinite(n) || n < 30 || n > 240) {
        setError("Tempo must be between 30 and 240 BPM, or blank for auto-estimate.");
        return;
      }
      tempoBpm = Math.round(n);
    }
    onAnalyze({ file, filename, tonic: finalTonic, mode, voicePart, tempoBpm });
  }

  return (
    <View style={[styles.container, { gap: Spacing.md }]}>
      {/* File picker */}
      <View style={[styles.field, { gap: Spacing['2xs'] }]}>
        <Text style={{ fontSize: Typography.xs.size, lineHeight: Typography.xs.lineHeight, fontFamily: Fonts.bodyMedium, color: colors.textTertiary, textTransform: "uppercase", letterSpacing: 0.6 }}>
          Audio file
        </Text>
        {Platform.OS === "web" && (
          // @ts-ignore — react-native-web passes through DOM elements at runtime.
          <input
            ref={webInputRef}
            type="file"
            accept="audio/*"
            style={{ display: "none" }}
            onChange={handleWebFileChange}
          />
        )}
        <Pressable
          style={[styles.fileBtn, { backgroundColor: colors.canvas, borderColor: colors.borderStrong, borderRadius: Radii.md, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md }, disabled && styles.btnDisabled]}
          onPress={Platform.OS === "web" ? handlePickWeb : handlePickNative}
          disabled={disabled}
        >
          <Text style={{ color: colors.textSecondary, fontSize: Typography.base.size, lineHeight: Typography.base.lineHeight, fontFamily: Fonts.body }}>
            {filename ? filename : "Choose audio file…"}
          </Text>
        </Pressable>
      </View>

      {/* Tonic */}
      <View style={[styles.field, { gap: Spacing['2xs'] }]}>
        <Text style={{ fontSize: Typography.xs.size, lineHeight: Typography.xs.lineHeight, fontFamily: Fonts.bodyMedium, color: colors.textTertiary, textTransform: "uppercase", letterSpacing: 0.6 }}>
          Tonic (key center)
        </Text>
        <View style={[styles.row, { gap: Spacing['2xs'] }]}>
          {TONIC_PRESETS.map((t) => {
            const active = !tonicCustom && tonic === t;
            return (
              <Pressable
                key={t}
                onPress={() => { setTonic(t); setTonicCustom(""); }}
                style={[
                  styles.chip,
                  {
                    paddingHorizontal: Spacing.sm,
                    paddingVertical: Spacing['2xs'],
                    borderRadius: Radii.pill,
                    backgroundColor: active ? colors.accentMuted : colors.bgSurface,
                    borderColor: active ? colors.accent : colors.borderSubtle,
                  },
                  disabled && styles.btnDisabled,
                ]}
                disabled={disabled}
              >
                <Text style={{ color: active ? colors.accent : colors.textSecondary, fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight, fontFamily: active ? Fonts.bodyMedium : Fonts.body }}>
                  {t}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <TextInput
          style={[styles.input, { borderColor: colors.borderStrong, borderRadius: Radii.md, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, fontSize: Typography.base.size, color: colors.textPrimary, backgroundColor: colors.canvas, fontFamily: Fonts.body }]}
          placeholder="Or type a custom tonic, e.g. F#3"
          placeholderTextColor={colors.textTertiary}
          value={tonicCustom}
          onChangeText={setTonicCustom}
          autoCapitalize="characters"
          editable={!disabled}
        />
      </View>

      {/* Mode */}
      <View style={[styles.field, { gap: Spacing['2xs'] }]}>
        <Text style={{ fontSize: Typography.xs.size, lineHeight: Typography.xs.lineHeight, fontFamily: Fonts.bodyMedium, color: colors.textTertiary, textTransform: "uppercase", letterSpacing: 0.6 }}>
          Mode
        </Text>
        <View style={[styles.row, { gap: Spacing['2xs'] }]}>
          {MODES.map((m) => (
            <Pressable
              key={m.value}
              onPress={() => setMode(m.value)}
              style={[
                styles.chip,
                {
                  paddingHorizontal: Spacing.sm,
                  paddingVertical: Spacing['2xs'],
                  borderRadius: Radii.pill,
                  backgroundColor: mode === m.value ? colors.accentMuted : colors.bgSurface,
                  borderColor: mode === m.value ? colors.accent : colors.borderSubtle,
                },
                disabled && styles.btnDisabled,
              ]}
              disabled={disabled}
            >
              <Text style={{ color: mode === m.value ? colors.accent : colors.textSecondary, fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight, fontFamily: mode === m.value ? Fonts.bodyMedium : Fonts.body }}>
                {m.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Voice part */}
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
                },
                disabled && styles.btnDisabled,
              ]}
              disabled={disabled}
            >
              <Text style={{ color: voicePart === vp ? colors.accent : colors.textSecondary, fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight, fontFamily: voicePart === vp ? Fonts.bodyMedium : Fonts.body }}>
                {vp}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Tempo */}
      <View style={[styles.field, { gap: Spacing['2xs'] }]}>
        <Text style={{ fontSize: Typography.xs.size, lineHeight: Typography.xs.lineHeight, fontFamily: Fonts.bodyMedium, color: colors.textTertiary, textTransform: "uppercase", letterSpacing: 0.6 }}>
          Tempo (BPM)
        </Text>
        <TextInput
          style={[styles.input, { borderColor: colors.borderStrong, borderRadius: Radii.md, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, fontSize: Typography.base.size, color: colors.textPrimary, backgroundColor: colors.canvas, fontFamily: Fonts.body }]}
          placeholder="Leave blank to auto-estimate"
          placeholderTextColor={colors.textTertiary}
          value={tempoText}
          onChangeText={setTempoText}
          keyboardType="numeric"
          editable={!disabled}
        />
      </View>

      {error && (
        <Text style={{ color: colors.error, fontSize: Typography.sm.size, lineHeight: Typography.sm.lineHeight, fontFamily: Fonts.body }}>
          {error}
        </Text>
      )}

      <Pressable
        style={[
          styles.submitBtn,
          { backgroundColor: colors.accent, paddingVertical: Spacing.sm, borderRadius: Radii.md, alignItems: "center" },
          (!file || disabled) && styles.btnDisabled,
        ]}
        onPress={handleSubmit}
        disabled={!file || disabled}
      >
        <Text style={{ color: colors.bgCanvas, fontSize: Typography.md.size, lineHeight: Typography.md.lineHeight, fontFamily: Fonts.bodySemibold }}>
          Analyze
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  field: {},
  row: { flexDirection: "row", flexWrap: "wrap" },
  chip: { borderWidth: 1 },
  input: { borderWidth: 1 },
  fileBtn: { borderWidth: 1, borderStyle: "dashed" },
  submitBtn: {},
  btnDisabled: { opacity: 0.4 },
});
